const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, retries = 3, delayMs = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${url}: ${error.message}. Retrying...`);
      if (i < retries - 1) {
        await delay(delayMs);
      } else {
        throw error;
      }
    }
  }
}

async function fetchSGF(startPage, endPage) {
  const baseUrl = "https://kifudepot.net/index.php?page=";
  const sgfData = [];

  for (let page = startPage; page <= endPage; page++) {
    const url = `${baseUrl}${page}`;
    console.log(`Fetching main page: ${url}`);

    try {
      const html = await fetchWithRetry(url);
      const $ = cheerio.load(html);

      const links = [];
      $("a[href^='kifucontents.php?id=']").each((_, el) => {
        links.push($(el).attr("href"));
      });

      console.log(`Found ${links.length} links on page ${page}`);

      for (const link of links) {
        const detailUrl = `https://kifudepot.net/${link}`;
        console.log(`Fetching detail page: ${detailUrl}`);

        const detailHtml = await fetchWithRetry(detailUrl);
        const $$ = cheerio.load(detailHtml);

        const sgf = $$("textarea#sgf").text().trim();
        if (sgf) {
          var newsgf = { page, detailUrl, sgf };
          sgfData.push(newsgf);
          const fileName = `./data/sgf_data_.json`;
          fs.writeFileSync(fileName, JSON.stringify(sgfData, null, 2), "utf-8");
        } else {
          console.log(`No SGF data found for: ${detailUrl}`);
        }
      }
    } catch (error) {
      console.error(`Error fetching page ${page}: ${error.message}`);
    }

    // サーバーへの負荷軽減のために待機
    await delay(2000);
  }

  // データを分割保存
  
}

// 実行
(async () => {
  const startPage = 1; // 開始ページ
  const endPage = 2606; // 終了ページ（適宜調整）

  await fetchSGF(startPage, endPage);
})();