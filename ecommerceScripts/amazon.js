const fs = require('fs');
const puppeteer = require('puppeteer');
const {cluster} = require('../cluster.js')

async function getAmazonData() {
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
    const productContainer = await page.$$('.s-card-container');
    let iHaveAddedProducts = false;
    for (const product of productContainer) {
        await page.waitForSelector('.s-link-style');
        const title = await product.$eval('.s-link-style', (element) => element.innerText);
        const link = await product.$eval('.s-link-style', (element) => element.href);

      const newItem = {
        title: title,
        link: link
      };

      // Check if an item with similar properties already exists in the productList
      const itemAlreadyExists = productList.some((existingItem) => {
        return (
          existingItem.title === newItem.title &&
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

  async function getProducts() {
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

  await page.goto(`https://www.amazon.fr/s?k=${productName}&page=${pageCounter}&__mk_fr_FR=%C3%85M%C3%85%C5%BD%C3%95%C3%91&crid=261ZBRI3LYSRN&qid=1703110422&sprefix=lettre+chinp%2Caps%2C107&ref=sr_pg_${pageCounter}
  `, {
    waitUntil: "load"
  });

  const x = await getProducts();
  const fileName = `./data/${productName}amazon.txt`
  fs.writeFileSync(fileName, JSON.stringify(productList),function (err){if (err) throw err});
//   cluster(fileName)
}

module.exports = {getAmazonData}