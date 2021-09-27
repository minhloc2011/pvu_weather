const chromium = require('chrome-aws-lambda')
const cheerio = require('cheerio')

exports.handler = async (event, context) => {
  let browser = null;
  let statusCode;
  let json;
  try {
    const executablePath = await chromium.executablePath
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      executablePath: executablePath,
      headless: chromium.headless,
    })

    // Do stuff with headless chrome
    const page = await browser.newPage()
    const targetUrl = 'https://pvuextratools.com'
    // await page.setViewport({ width: 1200, height: 800 });
    // Goto page and then do stuff
    await page.goto(targetUrl, {
      waitUntil: ["load", "domcontentloaded", "networkidle0"]
    })

    // await autoScroll(page);
    json = await extractHtml(page);

    statusCode = 200;
  } catch (err) {
    statusCode = 500;
    console.error('err', err);
  } finally {
    // close browser
    if (browser !== null) {
      await browser.close()
    }
  }

  return {
    statusCode: statusCode,
    body: JSON.stringify(json, null, 4)
  }
}

const autoScroll = async (page) => {
  await page.evaluate(async () => {
      await new Promise((resolve, reject) => {
          debugger;
          var totalHeight = 0;
          var distance = 100;
          var timer = setInterval(() => {
              var scrollHeight = document.body.scrollHeight;
              window.scrollBy(0, distance);
              totalHeight += distance;
               
              if(totalHeight >= scrollHeight){
                  clearInterval(timer);
                  resolve();
              }
          }, 100);
      });
  });
}

const extractHtml = async (page) => {
  // Mark the piece of HTML that we want to prase from. This should be the parent of the HTML snippet 
  // that we want to process
  let mainHtml = await page.evaluate(el => el.innerHTML, await page.$('div.table-responsive'));
  // Now load the above extracted HTML to Cheerio
  const $ = cheerio.load(mainHtml);
  // Create a new list in which we will save the extracted feature text
  let json = [];

  $("table > tbody > tr").each((index, element) => {
    const useGreenHouse = $(element).find('td:nth-of-type(5)').find('img').attr('src');
    json.push({
      'plantType': $(element).find('td:nth-of-type(1)').find('span.plant-type-text').text().trim(),
      'useGreenHouse': useGreenHouse == 'assets/images/useGreenhouse.png' ? true : false
    })
  });
 
  return json;
}
