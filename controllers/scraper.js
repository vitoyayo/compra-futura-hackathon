const puppeteer = require('puppeteer');
const queue = require('./queue');

const launchHeadless = Boolean(Number(process.env.HEADLESS));
let browser;

const launchBrowser = async () => {
  return puppeteer.launch({
    args: ['--no-sandbox'],
    headless: launchHeadless,
  });
};

const shopListUrl = 'https://comprafutura.com/comercios';
const shopListSelector = '.biz-card a';

module.exports = {
  async closeBrowser() {
    return browser ? await browser.close() : Promise.reject(new Error('Browser is not active'));
  },
  async launchBrowser() {
    browser = browser || (await launchBrowser());
  },
  async getShopList() {
    const page = await browser.newPage();
    // Asumo que si se llamó a la función sin argumentos, es la primera llamada.
    await page.goto(shopListUrl, { timeout: 45000, waitUntil: 'domcontentloaded' });

    return await page.evaluate((selector) => {
      const shops = document.querySelectorAll(selector);
      return Array.from(shops).map((elem) => ({
        shopName: elem.querySelector('h4 b').innerText,
        shopId: elem.href.split('/')[1],
      }));
    }, shopListSelector);
  },
  async getShopInfo(shopList, productSelectors) {
    const shopsInfo = [];

    shopList.forEach((cat) => {
      shopsInfo.push(
        queue.addTask(async () => {
          const page = await browser.newPage();
          await page.goto(cat.href, { waitUntil: 'domcontentloaded' });
          const categorieProducts = await page.evaluate((selectors) => {
            const categorieId = Array.from(document.querySelectorAll(selectors.categorieId)).map((elem) => elem.value),
              code = Array.from(document.querySelectorAll(selectors.productId)).map((elem) => elem.value),
              name = Array.from(document.querySelectorAll(selectors.name)).map((elem) => elem.innerText.trim()),
              price = Array.from(document.querySelectorAll(selectors.price)).map((elem) =>
                elem.innerText.match(/\d+,?\d+/) ? Number(elem.innerText.match(/\d+,?\d+/)[0].replace(',', '')) : 0
              ),
              image = Array.from(document.querySelectorAll(selectors.imgSrc)).map((elem) => elem.src);
            return code.map((item, index) => {
              return {
                code: item,
                categorieId: categorieId[index],
                name: name[index],
                price: price[index],
                image: image[index],
              };
            });
          }, productSelectors);
          await page.close();
          return categorieProducts;
        })
      );
    });
    const products = await Promise.all(shopsInfo);
    if (products.length === 0) {
      throw new Error('No products found');
    }
    return products;
  },
};
