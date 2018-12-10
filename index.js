
const fs = require('fs');
const puppeteer = require('puppeteer');
const { sha256 } = require('js-sha256');

const goldenDir = 'golden';

async function takeScreenshot(browser, url, format) {
  const hash = sha256.create();
  const fileName = `${format.name}/${hash.update(url)}`;
  if (!fs.existsSync(`${goldenDir}/${format.name}`)) fs.mkdirSync(`${goldenDir}/${format.name}`);

  const page = await browser.newPage();
  await page.setViewport({ width: format.width, height: format.height });
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 0 });
  await page.screenshot({ path: `${goldenDir}/${fileName}.png`, fullPage: true });
}

(async () => {
  if (!fs.existsSync(goldenDir)) fs.mkdirSync(goldenDir);

  const config = JSON.parse(fs.readFileSync('./screenshot-config.json', 'utf8'));
  if (!config.urls) return;

  await Promise.all(config.urls.map(async (url) => {
    const browser = await puppeteer.launch();

    await takeScreenshot(browser, url, { name: 'Desktop-large', width: 1920, height: 1080 });
    await takeScreenshot(browser, url, { name: 'Desktop-small', width: 1200, height: 900 });
    await takeScreenshot(browser, url, { name: 'iPad', width: 768, height: 1024 });
    await takeScreenshot(browser, url, { name: 'iPad-landscape', width: 1024, height: 768 });
    await takeScreenshot(browser, url, { name: 'iPhone5', width: 320, height: 568 });
    await takeScreenshot(browser, url, { name: 'iPhone5-landscape', width: 568, height: 320 });

    browser.close();
  }));
})();
