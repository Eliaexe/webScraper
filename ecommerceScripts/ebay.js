const fs = require('fs');
const puppeteer = require('puppeteer');
const {cluster} = require('../cluster.js')

async function getEbayData() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: false,
    userDataDir: "./tmp"
  });

  const page = await browser.newPage();
  const productName = 'laptop+msi+katana+GF6611UC';
  let pageCounter = 1;
  const productList = [];

  async function getProductData() {
    const productContainer = await page.$$('.s-item');
    let iHaveAddedProducts = false;

    for (const product of productContainer) {
      const title = await product.$eval('.s-item__title', (element) => element.innerText);
      const price = await product.$eval('.s-item__price', (element) => element.innerText);
      const img = await product.$eval('.image-treatment img', (element) => element.src);
      const link = await product.$eval('.s-item__link', (element) => element.href);

      const newItem = {
        title: title,
        price: price,
        img: img,
        link: link
      };

      // Check if an item with similar properties already exists in the productList
      const itemAlreadyExists = productList.some((existingItem) => {
        return (
          existingItem.title === newItem.title &&
          existingItem.price === newItem.price &&
          existingItem.img === newItem.img &&
          existingItem.link === newItem.link
        );
      });

      if (!itemAlreadyExists) {
        productList.push(newItem);
        if (!iHaveAddedProducts) {
          iHaveAddedProducts = true;
        }
      }
    }

    return iHaveAddedProducts ? null : productList;
  }

  async function clickPaginationNextButton() {
    const nextButton = await page.$$('.pagination__next');

    if (nextButton.length > 0) {
      await nextButton[0].click();
      await page.waitForTimeout(3000);
      pageCounter++; 
      return true;
    } else {
      return false;
    }
  }

  async function getEbayProducts() {
    let hasMorePages = true;

    while (hasMorePages) {
      const result = await getProductData();

      if (result === null) {
        hasMorePages = await clickPaginationNextButton();
      } else {
        break;
      }
    }

    await browser.close();
  }

  await page.goto(`https://www.ebay.it/sch/i.html?_from=R40&_nkw=${productName}&_sacat=0&_pgn=${pageCounter}`, {
    waitUntil: "load"
  });

  const x = await getEbayProducts();
  const fileName = `./data/${productName}.txt`
  fs.writeFileSync(fileName, JSON.stringify(productList),function (err){if (err) throw err});
//   cluster(fileName)
}

module.exports = {getEbayData}