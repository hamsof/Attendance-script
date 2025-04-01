const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium-min");

// test code locally
// const browser = await puppeteer.launch({
//     executablePath:
//       "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
//     headless: false,
//     defaultViewport: {
//       width: 1280,
//       height: 720,
//     },
//     args: ["--no-sandbox", "--disable-setuid-sandbox"],
//   });

// add chromium-v122.0.0-pack.tar to s3 bucket with public access
// private object will need aws-sdk to download and use which can increase the limit of lambda function
const S3_CHROMIUM_URL = process.env.S3_CHROMIUM_URL;
const email = process.env.EMAIL;
const password = process.env.PASSWORD;

async function checkIn() {
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(S3_CHROMIUM_URL),
    headless: chromium.headless,
  });
  const page = await browser.newPage();

  console.log("🌍 Navigating to ZenHR login...");
  await page.goto("https://app.zenhr.com/en/users/sign_in", {
    waitUntil: "domcontentloaded",
  });

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  console.log("login page");
  await page.waitForSelector("#user_login");
  await page.type("#user_login", email);
  await page.type('input[name="user[password]"]', password);

  //adding delays to make sure its not bot! :)
  await delay(2000);
  await page.click('button[type="submit"]');

  console.log("check in page");
  await page.waitForSelector('button[name="action_type"]', { timeout: 30000 });
  const buttons = await page.$$('button[name="action_type"]');
  await delay(10000);
  await buttons[0].click();

  console.log("proceed pop up");
  await delay(3000);
  await page.waitForSelector('button[name="commit"]', { timeout: 30000 });
  const buttonProceed = await page.$$('button[name="commit"]');
  await buttonProceed[0].click();

  await delay(3000);

  console.log("✅ Check-Out completed!");
  await browser.close();

  return "Check-in completed!";
}

async function checkOut() {
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(
      "https://zen-hr.s3.us-east-1.amazonaws.com/chromium-v122.0.0-pack.tar"
    ),
    headless: chromium.headless,
  });
  const page = await browser.newPage();

  console.log("🌍 Navigating to ZenHR login...");
  await page.goto("https://app.zenhr.com/en/users/sign_in", {
    waitUntil: "domcontentloaded",
  });

  await page.waitForSelector("#user_login");

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


  await page.type("#user_login", email);
  await page.type('input[name="user[password]"]', password);

  delay(2000);
  await page.click('button[type="submit"]');

  await page.waitForSelector('button[name="action_type"]', { timeout: 30000 });
  const buttons = await page.$$('button[name="action_type"]');


  await delay(10000);
  await buttons[1].click();

  await delay(3000);
  await page.waitForSelector('button[name="commit"]', { timeout: 30000 });
  const buttonProceed = await page.$$('button[name="commit"]');
  await buttonProceed[0].click();

  await delay(3000);

  console.log("✅ Check-Out completed!");
  await browser.close();

  return "Check-Out completed!";
}

exports.handler = async (event) => {
  try {
    if (event.type === "check-in") {
      return await checkIn();
    } else if (event.type === "check-out") {
      return await checkOut();
    } else {
      throw new Error("Invalid event type");
    }
  } catch (error) {
    console.error(error);
    return { error: error.message };
  }
};
