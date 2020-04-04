require('dotenv').config();
const fs = require('fs');
const puppeteer = require('puppeteer');
const queue = require('../utils/queue');
const axios = require('axios');
const { PerformanceObserver, performance } = require('perf_hooks');
const launchHeadless = true;
let browser;

queue.setMaxConcurrentTasks(35);

const launchBrowser = async () => {
  browser =
    browser ||
    (await puppeteer.launch({
      args: ['--no-sandbox'],
      headless: launchHeadless,
    }));
  return browser;
};

const closeBrowser = async () => {
  return browser ? await browser.close() : Promise.reject(new Error('Browser is not active'));
};

const obs = new PerformanceObserver((list, observer) => {
  console.log(`Scraped in ${list.getEntries()[0].duration / 1000 / 60} minutes`);
  performance.clearMarks();
  observer.disconnect();
});
obs.observe({ entryTypes: ['measure'], buffered: true });

const shopListUrl = process.env.URL_SHOPS;
const shopBaseUrl = 'https://comprafutura.com/comercio/';
// const mainShopSelector = '.card-container';
const shopInfoSelectors = {
  shopList: '.biz-card a',
  shopName: 'h4 b',
  logo: '.profile-logo',
  instagramProfile: '.bio-instagram-link',
  shopDescription: '#root > div > section:nth-child(1) > div > div > div > p',
  location: '.profile-location',
  voucherList: '.voucher-card',
  voucherName: 'h4.text-center',
  price: 'h3.type--fade',
  voucherDesciption: 'p.lead',
};

module.exports = {
  getShopList: async function () {
    const page = await browser.newPage();
    await page.goto(shopListUrl, { timeout: 45000, waitUntil: 'load' });
    await page.waitForSelector(shopInfoSelectors.shopList);

    return await page.evaluate((selector) => {
      const shops = document.querySelectorAll(selector);
      console.log(shops);
      return Array.from(shops).map((elem) => {
        const shopUrlSplited = elem.href.split('/');
        return {
          shopName: elem.querySelector('h4 b').innerText,
          shopId: shopUrlSplited[shopUrlSplited.length - 1],
          createdAt: new Date().toDateString(),
          updatedAt: new Date().toDateString(),
        };
      });
    }, shopInfoSelectors.shopList);
  },

  shopList: async function () {
    await launchBrowser();
    performance.mark('ScrapingStart');
    const list_shops = await this.getShopList();
    const shopsInfo = await this.getShopInfo(list_shops);
    performance.mark('ScrapingEnd');
    performance.measure('ScrapingTime', 'ScrapingStart', 'ScrapingEnd');

    await closeBrowser();
    fs.writeFileSync('shop-list.json', JSON.stringify(list_shops));
    fs.writeFileSync('shops-info.json', JSON.stringify(shopsInfo));
    list_shops.forEach((element) =>
      axios
        .post(`http://${process.env.HOST}:${process.env.PORT}/shops`, {
          name: element.name,
          id: element.id,
          created_at: element.createdAt,
          updated_at: element.updatedAt,
        })
        .then((response) => {
          console.log(response);
        })
        .catch((error) => {
          console.log(error);
          console.log(error);
        })
    );
  },
  async getShopInfo(shopList) {
    const shopsInfo = [];
    shopList.forEach((shop) => {
      shopsInfo.push(
        queue.addTask(async () => {
          const page = await browser.newPage();
          await page.goto(`${shopBaseUrl}${shop.shopId}`, {
            waitUntil: 'domcontentloaded',
          });
          // Indirect way of detecting content rendering, not very nice.
          await page.waitForFunction('window.document.body.clientHeight > 600');
          let shopInfo;
          try {
            shopInfo = await page.evaluate(
              (selectors, shop) => {
                const logoUrlElem = document.querySelector(selectors.logo),
                  instagramProfileElem = document.querySelector(selectors.instagramProfile),
                  shopDescriptionElem = document.querySelector(selectors.shopDescription),
                  locationElem = document.querySelector(selectors.location);
                const voucherList = Array.from(document.querySelectorAll(selectors.voucherList)).map((voucherElem) => {
                  return {
                    name: voucherElem.querySelector(selectors.voucherName).innerText,
                    price: Number(voucherElem.querySelector(selectors.price).innerText.replace('$', '')),
                    voucherDesciption: voucherElem.querySelector(selectors.voucherDesciption).innerText,
                  };
                });
                return {
                  shopId: shop.shopId,
                  shopName: shop.shopName,
                  logoUrl: logoUrlElem ? logoUrlElem.src : null,
                  instagramProfile: instagramProfileElem ? instagramProfileElem.href : null,
                  shopDescription: shopDescriptionElem ? shopDescriptionElem.innerText : null,
                  location: locationElem ? locationElem.innerText : null,
                  voucherList,
                };
              },
              shopInfoSelectors,
              shop
            );
          } catch (e) {
            shopInfo = {
              shopName: shop.shopName,
              shopId: shop.shopId,
              error: e.message,
            };
          }
          console.log('scraped:', shopInfo.shopName);
          await page.close();
          return shopInfo;
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
