
const fs = require('fs');
const puppeteer = require('puppeteer');
const expect = require('chai').expect;

const testDir = 'temp';
const goldenDir = 'golden';

describe('👀 screenshots are correct', () => {
  let browser, page;

  before(async () => {
    if (!fs.existsSync(testDir)) fs.mkdirSync(testDir);
    if (!fs.existsSync(`${testDir}/wide`)) fs.mkdirSync(`${testDir}/wide`);
    if (!fs.existsSync(`${testDir}/narrow`)) fs.mkdirSync(`${testDir}/narrow`);

    if (!fs.existsSync(goldenDir)) fs.mkdirSync(goldenDir);
    if (!fs.existsSync(`${goldenDir}/wide`)) fs.mkdirSync(`${goldenDir}/wide`);
    if (!fs.existsSync(`${goldenDir}/narrow`)) fs.mkdirSync(`${goldenDir}/narrow`);
  });

  after(() => {});

  beforeEach(async () => {
    browser = await puppeteer.launch();
    page = await browser.newPage();
  });

  afterEach(() => browser.close());


  /* TESTS */

  describe('wide screen', () => {
    beforeEach(async () =>  page.setViewport({width: 800, height: 600}));

    it('/pk/base/container', async () => takeAndCompareScreenshot(page, '/pk/base/container/', 'wide'));
    // ...
  });


  describe('narrow screen', () => {
    beforeEach(async () => page.setViewport({width: 375, height: 667}));

    it('/pk/base/container', async () => takeAndCompareScreenshot(page, '/pk/base/container/', 'narrow'));
    // ...
  });
});




// - page is a reference to the Puppeteer page.
// - route is the path you're loading, which I'm using to name the file.
// - filePrefix is either "wide" or "narrow", since I'm automatically testing both.
async function takeAndCompareScreenshot(page, route, filePrefix) {
  // If you didn't specify a file, use the name of the route.
  let fileName = filePrefix + '/' + (route ? route : 'index');

  // Start the browser, go to that page, and take a screenshot.
  await page.goto(`http://127.0.0.1:3000${route}`);
  await page.screenshot({path: `${testDir}/${fileName}.png`});

  // Test to see if it's right.
  return compareScreenshots(fileName);
}




function compareScreenshots(fileName) {
  return new Promise((resolve, reject) => {

    const img1 = fs.createReadStream(`${testDir}/${fileName}.png`).pipe(new PNG()).on('parsed', doneReading);
    const img2 = fs.createReadStream(`${goldenDir}/${fileName}.png`).pipe(new PNG()).on('parsed', doneReading);

    let filesRead = 0;
    function doneReading() {
      // Wait until both files are read.
      if (++filesRead < 2) return;

      // The files should be the same size.
      expect(img1.width, 'image widths are the same').equal(img2.width);
      expect(img1.height, 'image heights are the same').equal(img2.height);

      // Do the visual diff.
      const diff = new PNG({width: img1.width, height: img2.height});
      const numDiffPixels = pixelmatch(
          img1.data, img2.data, diff.data, img1.width, img1.height,
          {threshold: 0.1});

      // The files should look the same.
      expect(numDiffPixels, 'number of different pixels').equal(0);
      resolve();
    }
  });
}
