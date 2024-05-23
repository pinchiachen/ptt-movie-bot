import axios from "axios";
import cheerio from "cheerio";
import { Client } from "@line/bot-sdk";

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const client = new Client(config);

const BASE_URL = "https://www.ptt.cc/bbs/movie/search";
const DEFAULT_PAGE_LIMIT = 10;
const DEFAULT_RESPONSE = "查無資料";

function getTargetUrl(page, name) {
  return page && name ? `${BASE_URL}?page=${page}&q=${name}` : BASE_URL;
}

async function crawlArticleTitles(movieName, maxPage) {
  const titles = [];

  for (let page = 1; page <= maxPage; page++) {
    const res = await axios.get(getTargetUrl(page, movieName));
    const $ = cheerio.load(res.data);
    $(".r-ent").each((index, element) => {
      titles.push($(element).find(".title").text().trim());
    });
  }

  console.log('titles: ', titles);

  return titles;
}

function getTargetTags(titles = []) {
  return titles
    .filter((title) => isTitleValid(title))
    .map((title) => trimTitle(title));
}

function isTitleValid(title = "") {
  return (
    title.includes("雷") &&
    title.includes("[") &&
    title.includes("]") &&
    !title.includes("Re")
  );
}

function trimTitle(title = "") {
  return title.split("]", 1)[0].split("[", 1)[1].replace(" ", "");
}

function isTagGood(tag = "") {
  return tag.includes("好");
}

function isTagBad(tag = "") {
  return tag.includes("爛") || tag.includes("負");
}

function isTagOrdinary(tag = "") {
  return (
    tag.includes("普") &&
    !tag.includes("好") &&
    !tag.includes("爛") &&
    !tag.includes("負")
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

  const totalCount = goodCount + ordinaryCount + badCount;

  return { goodCount, ordinaryCount, badCount, totalCount };
}

function getResponseMsg(goodCount, ordinaryCount, badCount, totalCount) {
  if (totalCount === 0) return DEFAULT_RESPONSE;

  const goodPercent = (goodCount / totalCount) * 100;
  const ordinaryPercent = (ordinaryCount / totalCount) * 100;
  const badPercent = (badCount / totalCount) * 100;

  return getMsgContent(
    totalCount,
    goodCount,
    goodPercent,
    ordinaryCount,
    ordinaryPercent,
    badCount,
    badPercent
  );
}

function getMsgContent(
  totalCount,
  goodCount,
  goodPercent,
  ordinaryCount,
  ordinaryPercent,
  badCount,
  badPercent
) {
  return (
    `評價總共有 ${totalCount} 篇\n好雷有 ${goodCount} 篇 / 好雷率為 ${goodPercent.toFixed(
      2
    )} %\n` +
    `普雷有 ${ordinaryCount} 篇 / 普雷率為 ${ordinaryPercent.toFixed(2)} %\n` +
    `負雷有 ${badCount} 篇 / 負雷率為 ${badPercent.toFixed(2)} %`
  );
}

module.exports = async (req, res) => {
  if (req.method === "POST") {
    const body = req.body;
    const events = body.events;

    for (const event of events) {
      if (event.type === "message" && event.message.type === "text") {
        await handleMessage(event);
      }
    }

    res.status(200).send({ message: "ok" });
  } else {
    res.status(405).send({ message: "Method not allowed" });
  }
};

async function handleMessage(event) {
  const movieName = event.message.text;
  const titles = await crawlArticleTitles(movieName, DEFAULT_PAGE_LIMIT);
  const titleTags = getTargetTags(titles);
  const { goodCount, ordinaryCount, badCount, totalCount } =
    calculateTags(titleTags);

  await client.replyMessage(event.replyToken, {
    type: "text",
    text: getResponseMsg(goodCount, ordinaryCount, badCount, totalCount),
  });
}
