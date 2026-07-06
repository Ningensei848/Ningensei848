// cf. https://github.com/thmsgbrt/thmsgbrt/blob/master/index.js

const fs = require("fs");
const Mustache = require("mustache");
const instagramApiService = require("./auto-readme-generate/instagram-api.service");
const logo = require("./auto-readme-generate/logoInfo");

const TEMPLATE_PATH = "./main.mustache";
const README_PATH = "README.md";
const INSTAGRAM_ACCOUNT = "visitjapanjp";
const INSTAGRAM_POST_COUNT = 3;
const FALLBACK_INSTAGRAM_IMAGES = [
  {
    alt: "Mount Fuji fallback image from Wikimedia Commons",
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/Mount_Fuji_from_Hotel_Mt_Fuji_1995-4-10.jpg",
    source:
      "https://commons.wikimedia.org/wiki/File:Mount_Fuji_from_Hotel_Mt_Fuji_1995-4-10.jpg",
  },
  {
    alt: "Kinkaku-ji fallback image from Wikimedia Commons",
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/Kinkakuji_2004-09-21.jpg",
    source: "https://commons.wikimedia.org/wiki/File:Kinkakuji_2004-09-21.jpg",
  },
  {
    alt: "Fushimi Inari Taisha fallback image from Wikimedia Commons",
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/Fushimi_Inari_Taisha_02.jpg",
    source:
      "https://commons.wikimedia.org/wiki/File:Fushimi_Inari_Taisha_02.jpg",
  },
];

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

function applyInstagramImages(images) {
  images.slice(0, INSTAGRAM_POST_COUNT).forEach((image, index) => {
    const imageNumber = index + 1;
    const imageData = typeof image === "string" ? { url: image } : image;

    DATA[`img${imageNumber}`] = imageData.url;
    DATA[`img${imageNumber}_alt`] =
      imageData.alt || `Japan inspiration image ${imageNumber}`;
    DATA[`img${imageNumber}_source`] = imageData.source || imageData.url;
  });
}

function validateInstagramImages(images) {
  if (!Array.isArray(images) || images.length < INSTAGRAM_POST_COUNT) {
    throw new Error(
      `Expected ${INSTAGRAM_POST_COUNT} Instagram images from ${INSTAGRAM_ACCOUNT}, but received ${
        Array.isArray(images) ? images.length : 0
      }.`,
    );
  }
}

async function setInstagramPosts() {
  try {
    const instagramImages =
      await instagramApiService.getLatestInstagramPostsFromAccount(
        INSTAGRAM_ACCOUNT,
        INSTAGRAM_POST_COUNT,
      );

    validateInstagramImages(instagramImages);
    applyInstagramImages(instagramImages);
  } catch (error) {
    console.warn(
      `Unable to fetch Instagram images for ${INSTAGRAM_ACCOUNT}; using fallback images instead.`,
    );
    console.warn(error.message);
    applyInstagramImages(FALLBACK_INSTAGRAM_IMAGES);
  }
}

function templateUsesInstagramPosts(template) {
  return ["img1", "img2", "img3"].some((key) => template.includes(`{{${key}}`));
}

async function generateReadMe(template) {
  const output = Mustache.render(template, DATA);
  await fs.promises.writeFile(README_PATH, output);
}

async function action() {
  const template = await fs.promises.readFile(TEMPLATE_PATH, "utf8");

  if (templateUsesInstagramPosts(template)) {
    /**
     * Get pictures
     */
    await setInstagramPosts();
  } else {
    console.warn(
      "Skipping Instagram fetch because the template does not use Instagram image placeholders.",
    );
  }

  /**
   * Generate README
   */
  await generateReadMe(template);
}

action().catch((error) => {
  console.error(error);
  process.exit(1);
});
