// cf. https://github.com/thmsgbrt/thmsgbrt/blob/master/index.js

const fs = require("fs");
const Mustache = require("mustache");
const puppeteerService = require("./auto-readme-generate/puppeteer.service");
const logo = require("./auto-readme-generate/logoInfo");

const TEMPLATE_PATH = "./main.mustache";
const README_PATH = "README.md";
const INSTAGRAM_ACCOUNT = "visitjapanjp";
const INSTAGRAM_POST_COUNT = 3;

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
  const instagramImages =
    await puppeteerService.getLatestInstagramPostsFromAccount(
      INSTAGRAM_ACCOUNT,
      INSTAGRAM_POST_COUNT,
    );

  if (
    !Array.isArray(instagramImages) ||
    instagramImages.length < INSTAGRAM_POST_COUNT
  ) {
    throw new Error(
      `Expected ${INSTAGRAM_POST_COUNT} Instagram images from ${INSTAGRAM_ACCOUNT}, but received ${
        Array.isArray(instagramImages) ? instagramImages.length : 0
      }.`,
    );
  }

  DATA.img1 = instagramImages[0];
  DATA.img2 = instagramImages[1];
  DATA.img3 = instagramImages[2];
}

async function generateReadMe() {
  const template = await fs.promises.readFile(TEMPLATE_PATH, "utf8");
  const output = Mustache.render(template, DATA);
  await fs.promises.writeFile(README_PATH, output);
}

async function action() {
  try {
    /**
     * Get pictures
     */
    await setInstagramPosts();

    /**
     * Generate README
     */
    await generateReadMe();
  } finally {
    /**
     * Fermeture de la boutique 👋
     */
    await puppeteerService.close();
  }
}

action().catch((error) => {
  console.error(error);
  process.exit(1);
});
