// cf. https://github.com/thmsgbrt/thmsgbrt/blob/master/index.js

require("dotenv").config();
const Mustache = require("mustache");
const fetch = require("node-fetch");
const fs = require("fs");
const puppeteerService = require("./auto-readme-generate/puppeteer.service");
const logo = require("./auto-readme-generate/logoInfo");

const MUSTACHE_MAIN_DIR = "./main.mustache";

let DATA = {
  refresh_date: new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    timeZoneName: "short",
    timeZone: "Asia/Tokyo",
  }),
  ...logo,
};

async function setInstagramPosts() {
  const instagramImages = await puppeteerService.getLatestInstagramPostsFromAccount(
    "visitjapanjp",
    3
  );
  DATA.img1 = instagramImages[0];
  DATA.img2 = instagramImages[1];
  DATA.img3 = instagramImages[2];
}

async function generateReadMe() {
  await fs.readFile(MUSTACHE_MAIN_DIR, (err, data) => {
    if (err) throw err;
    const output = Mustache.render(data.toString(), DATA);
    fs.writeFileSync("README.md", output);
  });
}

async function action() {
  /**
   * Get pictures
   */
  await setInstagramPosts();

  /**
   * Generate README
   */
  await generateReadMe();

  /**
   * Fermeture de la boutique 👋
   */
  await puppeteerService.close();
}

action();
