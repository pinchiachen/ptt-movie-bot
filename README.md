# LineBot PTT Movies V2

> *本專案 V1 原本是使用 Python 搭配 Heroku，後來因為 Heroku 的免費方案取消了，所以改用 Node.js 搭配 Vercel 重新實作。*
> *V1 連結：https://github.com/pinchiachen/pttmovies*

## Description
本程式用途為輸入電影名稱關鍵字後，利用該關鍵字在 PTT_Movie 網頁板進行搜尋，抓取最新 10 頁資料，分別統計好雷、普雷及負雷數目進行分析，得知該電影在  PTT_Movie 板之評價。

## Built With
- Node.js
- Vercel

## How to use
- LINE 好友搜尋 ID：@vsr0046b，名稱為「鄉民怎麼看」，加入好友即可使用。
<br>或是透過以下 QR Code：<br>
<a href="https://imgur.com/4PXFkbz"><img src="https://i.imgur.com/4PXFkbz.png" title="source: imgur.com" /></a>

## Demo
<a href="https://imgur.com/DCWwXgR"><img src="https://i.imgur.com/DCWwXgR.png" title="source: imgur.com" /></a>

## Note
- 普好雷算入好雷，普負雷算入負雷。

## Vercel 使用心得
- 內建自動部署，只要 merge 到 main 就會自動部署，超級方便
- 在 merge 進 main 之前，可以根據 branch 來 preview，測試完沒問題就可以部署了，超級方便
- 有免費方案，Heroku Bye 😍

## Contact me
- chenargar@gmail.com