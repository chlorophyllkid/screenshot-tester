
const fs = require('fs')
const puppeteer = require('puppeteer');
const { sha256 } = require('js-sha256');


const testDir = 'compare';
const goldenDir = 'golden';

const server = 'http://127.0.0.1:3000';

const routes = [
  '/pk/base/container'
];

const formats = [
  { name: 'wide', width: 800, height: 600 },
  { name: 'narrow', width: 375, height: 667 }
];


(async () => {
  let browser, page;

  await Promise.all(routes.map(async (route) => {
    browser = await puppeteer.launch();
    page = await browser.newPage();

    await Promise.all(formats.map(async (format) => {
      await page.setViewport({ width: format.width, height: format.height });

      const hash = sha256.create();
      let fileName = format.name + '/' + hash.update(route);

      if (!fs.existsSync(goldenDir)) fs.mkdirSync(goldenDir);
      if (!fs.existsSync(`${goldenDir}/${format.name}`)) fs.mkdirSync(`${goldenDir}/${format.name}`);

      await page.goto(`${server}${route}`);
      await page.screenshot({ path: `${goldenDir}/${fileName}.png` });
    }));

    browser.close();
  }));

})();
