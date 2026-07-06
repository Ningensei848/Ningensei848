const puppeteer = require("puppeteer");

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

class PuppeteerService {
  browser;
  page;

  async init() {
    this.browser = await puppeteer.launch({
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-infobars",
        "--window-position=0,0",
        "--ignore-certificate-errors",
        "--ignore-certificate-errors-spki-list",
        "--incognito",
        // '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"', //
      ],
      // headless: false,
    });
  }

  /**
   *
   * @param {string} url
   */
  async goToPage(url) {
    if (!this.browser) {
      await this.init();
    }
    this.page = await this.browser.newPage();

    await this.page.setExtraHTTPHeaders({
      "Accept-Language": "en-US",
    });

    await this.page.goto(url, {
      waitUntil: `networkidle0`,
    });
  }

  async close() {
    if (this.page) {
      await this.page.close();
      this.page = undefined;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = undefined;
    }
  }

  /**
   *
   * @param {string} acc Account to crawl
   * @param {number} n Qty of image to fetch
   */
  async getLatestInstagramPostsFromAccount(acc, n) {
    const page = `https://www.picuki.com/profile/${acc}`;
    await this.goToPage(page);
    try {
      await this.page.evaluate(`document.body.scrollHeight`);
      await this.page.evaluate(
        `window.scrollTo(0, document.body.scrollHeight)`,
      );
      await wait(1000);

      const nodes = await this.page.evaluate(() => {
        const images = document.querySelectorAll(`.post-image`);
        return [].map.call(images, (img) => img.src);
      });

      return nodes.slice(0, n);
    } catch (error) {
      throw new Error(
        `Failed to fetch Instagram posts for ${acc}: ${error.message}`,
      );
    }
  }
}

const puppeteerService = new PuppeteerService();

module.exports = puppeteerService;
