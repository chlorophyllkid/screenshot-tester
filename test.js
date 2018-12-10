/* global describe, it, before, after, beforeEach, afterEach */

const fs = require('fs');
const puppeteer = require('puppeteer');
const pixelmatch = require('pixelmatch');
const { PNG } = require('pngjs');
const { expect } = require('chai');
const { sha256 } = require('js-sha256');

const testDir = 'temp';
const goldenDir = 'golden';

describe('👀 screenshots are correct', () => {
  let browser;
  let page;

  const config = JSON.parse(fs.readFileSync('./screenshot-config.json', 'utf8'));
  if (!config.urls) return;

  before(async () => {
    if (!fs.existsSync(testDir)) fs.mkdirSync(testDir);
    if (!fs.existsSync(`${testDir}/Desktop-large`)) fs.mkdirSync(`${testDir}/Desktop-large`);
    if (!fs.existsSync(`${testDir}/Desktop-small`)) fs.mkdirSync(`${testDir}/Desktop-small`);
    if (!fs.existsSync(`${testDir}/iPad`)) fs.mkdirSync(`${testDir}/iPad`);
    if (!fs.existsSync(`${testDir}/iPad-landscape`)) fs.mkdirSync(`${testDir}/iPad-landscape`);
    if (!fs.existsSync(`${testDir}/iPhone5`)) fs.mkdirSync(`${testDir}/iPhone5`);
    if (!fs.existsSync(`${testDir}/iPhone5-landscape`)) fs.mkdirSync(`${testDir}/iPhone5-landscape`);
  });

  after(() => {});

  beforeEach(async () => {
    browser = await puppeteer.launch();
    page = await browser.newPage();
  });

  afterEach(() => browser.close());


  /* TESTS */

  describe('Desktop-large', async () => {
    beforeEach(async () => {
      await page.setViewport({ width: 1920, height: 1080 });
    });

    await Promise.all(config.urls.map(async (url) => {
      await it(url, async () => {
        await takeAndCompareScreenshot(page, url, 'Desktop-large');
      });
    }));
  });

  describe('Desktop-small', async () => {
    beforeEach(async () => {
      await page.setViewport({ width: 1200, height: 900 });
    });

    await Promise.all(config.urls.map(async (url) => {
      await it(url, async () => {
        await takeAndCompareScreenshot(page, url, 'Desktop-small');
      });
    }));
  });

  describe('iPad', async () => {
    beforeEach(async () => {
      await page.setViewport({ width: 768, height: 1024 });
    });

    await Promise.all(config.urls.map(async (url) => {
      await it(url, async () => {
        await takeAndCompareScreenshot(page, url, 'iPad');
      });
    }));
  });

  describe('iPad-landscape', async () => {
    beforeEach(async () => {
      await page.setViewport({ width: 1024, height: 768 });
    });

    await Promise.all(config.urls.map(async (url) => {
      await it(url, async () => {
        await takeAndCompareScreenshot(page, url, 'iPad-landscape');
      });
    }));
  });

  describe('iPhone5', async () => {
    beforeEach(async () => {
      await page.setViewport({ width: 320, height: 568 });
    });

    await Promise.all(config.urls.map(async (url) => {
      await it(url, async () => {
        await takeAndCompareScreenshot(page, url, 'iPhone5');
      });
    }));
  });

  describe('iPhone5-landscape', async () => {
    beforeEach(async () => {
      await page.setViewport({ width: 568, height: 320 });
    });

    await Promise.all(config.urls.map(async (url) => {
      await it(url, async () => {
        await takeAndCompareScreenshot(page, url, 'iPhone5-landscape');
      });
    }));
  });
});


async function takeAndCompareScreenshot(page, url, formatName) {
  const hash = sha256.create();
  const fileName = `${formatName}/${hash.update(url)}`;
  if (!fs.existsSync(`${testDir}/${formatName}`)) fs.mkdirSync(`${testDir}/${formatName}`);

  await page.goto(url, { waitUntil: 'networkidle0', timeout: 0 });
  await page.screenshot({ path: `${testDir}/${fileName}.png`, fullPage: true });

  return compareScreenshots(fileName);
}


function compareScreenshots(fileName) {
  return new Promise((resolve) => {
    const img1 = fs.createReadStream(`${testDir}/${fileName}.png`).pipe(new PNG()).on('parsed', doneReading);
    const img2 = fs.createReadStream(`${goldenDir}/${fileName}.png`).pipe(new PNG()).on('parsed', doneReading);

    let filesRead = 0;

    function doneReading() {
      filesRead += 1;
      if (filesRead < 2) return;

      expect(img1.width, 'image widths are the same').equal(img2.width);
      expect(img1.height, 'image heights are the same').equal(img2.height);

      const diff = new PNG({ width: img1.width, height: img1.height });
      const numDiffPixels = pixelmatch(
        img1.data, img2.data, diff.data, img1.width, img1.height,
        { threshold: 1 },
      );

      expect(numDiffPixels, 'number of different pixels').equal(0);

      resolve();
    }
  });
}
