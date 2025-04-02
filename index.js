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

const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium-min");

// add chromium-v122.0.0-pack.tar to s3 bucket with public access
// private object will need aws-sdk to download and use which can increase the limit of lambda function
const S3_CHROMIUM_URL = process.env.S3_CHROMIUM_URL;
const email = process.env.EMAIL;
const password = process.env.PASSWORD;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function launchBrowser() {
  return puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(S3_CHROMIUM_URL),
    headless: chromium.headless,
  });
}

async function login(page) {
  console.log("🌍 Navigating to ZenHR login...");
  await page.goto("https://app.zenhr.com/en/users/sign_in", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#user_login");

  console.log("🔑 Logging in...");
  await page.type("#user_login", email);
  await page.type('input[name="user[password]"]', password);
  
  //adding delays to make sure its not bot! :)
  await delay(2000);
  await page.click('button[type="submit"]');
}

async function performAction(actionIndex) {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  await login(page);

  console.log("🔄 Navigating to action page...");
  await page.waitForSelector('button[name="action_type"]', { timeout: 30000 });
  const buttons = await page.$$('button[name="action_type"]');
  await delay(10000);
  await buttons[actionIndex].click();

  console.log("⚡ Confirming action...");
  await delay(3000);
  await page.waitForSelector('button[name="commit"]', { timeout: 30000 });
  const buttonProceed = await page.$$('button[name="commit"]');
  await buttonProceed[0].click();

  await delay(3000);
  console.log(`✅ ${actionIndex === 0 ? "Check-In" : "Check-Out"} completed!`);
  await browser.close();
  return actionIndex === 0 ? "Check-In completed!" : "Check-Out completed!";
}

exports.handler = async (event) => {
  try {
    if (event.type === "check-in") {
      return await performAction(0);
    } else if (event.type === "check-out") {
      return await performAction(1);
    } else {
      throw new Error("Invalid event type");
    }
  } catch (error) {
    console.error(error);
    return { error: error.message };
  }
};
