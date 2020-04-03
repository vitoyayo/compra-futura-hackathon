const puppeteer = require('puppeteer');
const queue = require('../utils/queue');
const axios = require('axios');

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
  closeBrowser: async function () {
    return browser ? await browser.close() : Promise.reject(new Error('Browser is not active'));
  },
  launchBrowser: async function() {
    browser = browser || (await launchBrowser());
  },
  getShopList: async function() {
    const page = await browser.newPage();
    // Asumo que si se llamó a la función sin argumentos, es la primera llamada.
    await page.goto(shopListUrl, { timeout: 45000, waitUntil: 'load' });
    await page.waitForSelector(shopListSelector);

    return await page.evaluate((selector) => {
      const shops = document.querySelectorAll(selector);
      console.log(shops)
      return Array.from(shops).map((elem) => {
        const shopUrlSplited = elem.href.split('/');
        return {
          shopName: elem.querySelector('h4 b').innerText,
          shopId: shopUrlSplited[shopUrlSplited.length - 1],
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
      });
    }, shopListSelector);
  },
  shopList: async function () {
    let array = getShopList();
    console.log('********************* intro shoplist********************************')
    console.log(array)
    /*axios.post(/shops/,{
      name: ,
      id: ,
      created_at: ,
      updated_at:
    }).then(function(response){
      console.log(response)
    }).catch(function(error){
      console.log(error)
    })*/

  }

/*
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
  },*/
};
