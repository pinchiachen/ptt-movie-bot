import axios from 'axios';
import cheerio from 'cheerio';
import { Client } from '@line/bot-sdk';

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const client = new Client(config);

const DEFAULT_PAGE_LIMIT = 10;

async function crawlArticleTitles({ movieName, maxPage }) {
  const titles = [];

  for (let page = 1; page <= maxPage; page++) {
    try {
      const res = await axios.get(
        `https://www.ptt.cc/bbs/movie/search?page=${page}&q=${movieName}`,
      );
      const $ = cheerio.load(res.data);
      $('.r-ent').each((index, element) => {
        titles.push($(element).find('.title').text().trim());
      });
    } catch (err) {
      if (err.response.status === 404) {
        break;
      } else {
        throw Error(
          `crawlArticleTitles error: movieName=${movieName}, page=${page}`,
        );
      }
    }
  }

  return titles;
}

function getTargetTags(titles = []) {
  return titles
    .filter((title) => isTitleValid(title))
    .map((title) => trimTitle(title));
}

function isTitleValid(title = '') {
  return (
    title.includes('雷') &&
    title.includes('[') &&
    title.includes(']') &&
    !title.includes('Re:')
  );
}

function trimTitle(title = '') {
  return title.replace(' ', '').split(']')[0].split('[')[1];
}

function isTagGood(tag = '') {
  return tag.includes('好');
}

function isTagBad(tag = '') {
  return tag.includes('爛') || tag.includes('負');
}

function isTagOrdinary(tag = '') {
  return (
    tag.includes('普') &&
    !tag.includes('好') &&
    !tag.includes('爛') &&
    !tag.includes('負')
  );
}

function calculateTags(tags = []) {
  let goodCount = 0;
  let ordinaryCount = 0;
  let badCount = 0;

  tags.forEach((tag) => {
    if (isTagGood(tag)) {
      goodCount++;
    } else if (isTagBad(tag)) {
      badCount++;
    } else if (isTagOrdinary(tag)) {
      ordinaryCount++;
    }
  });

  return {
    goodCount,
    ordinaryCount,
    badCount,
    totalCount: goodCount + ordinaryCount + badCount,
  };
}

function createResponseMsg({ goodCount, ordinaryCount, badCount, totalCount }) {
  if (totalCount === 0) return '查無資料';

  const goodPercent = (goodCount / totalCount) * 100;
  const ordinaryPercent = (ordinaryCount / totalCount) * 100;
  const badPercent = (badCount / totalCount) * 100;

  const message =
    `評價總共有 ${totalCount} 篇\n好雷有 ${goodCount} 篇 / 好雷率為 ${goodPercent.toFixed(
      2,
    )} %\n` +
    `普雷有 ${ordinaryCount} 篇 / 普雷率為 ${ordinaryPercent.toFixed(2)} %\n` +
    `負雷有 ${badCount} 篇 / 負雷率為 ${badPercent.toFixed(2)} %`;

  return message;
}

async function handleMessage(event) {
  const titles = await crawlArticleTitles({
    movieName: event.message.text,
    maxPage: DEFAULT_PAGE_LIMIT,
  });
  const titleTags = getTargetTags(titles);
  const { goodCount, ordinaryCount, badCount, totalCount } =
    calculateTags(titleTags);

  await client.replyMessage(event.replyToken, {
    type: 'text',
    text: createResponseMsg({ goodCount, ordinaryCount, badCount, totalCount }),
  });
}

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    const body = req.body;
    const events = body.events;

    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        await handleMessage(event);
      }
    }

    res.status(200).send({ message: 'ok' });
  } else {
    res.status(405).send({ message: 'Method not allowed' });
  }
};
