const fs = require('fs');
const { Cluster } = require('puppeteer-cluster');

async function cluster(fileName) {
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 100,
    puppeteerOptions: {
      headless: "new",
      defaultViewport: false,
      userDataDir: "./tmp"
    }
  });

  cluster.on('taskerror', (err, data) => {
    console.error(data, err);
  })

  await cluster.task(async ({ page, data: url }) => {
    await page.goto(url, {
      waitUntil: "load"
    });

    const image = await page.$eval('.ux-image-carousel-item img', (element) => element.src);
    console.log(image);
  });

  const fileData = await fs.promises.readFile(fileName, 'utf8');
  const theData = JSON.parse(fileData);

  for (const singleProduct of theData) {
    cluster.queue(singleProduct.link);
  }

  await cluster.idle();
  await cluster.close();
}

module.exports = {
  cluster
};
