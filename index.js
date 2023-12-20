const fs = require('fs');
const puppeteer = require('puppeteer');
const {getAmazonData} = require('./ecommerceScripts/amazon.js')
const {getEbayData} = require('./ecommerceScripts/ebay.js')

async function run() {
  await getEbayData()
  await getAmazonData()
}

run();
