import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = __dirname;
const profileDir = path.join(workspaceRoot, '.facebook-group-browser-profile');

const groupUrl = process.env.FACEBOOK_GROUP_URL || 'https://www.facebook.com/groups/4028600834042787';

async function run() {
  console.log('Launching browser...');
  const context = await chromium.launchPersistentContext(profileDir, {
    headless: true,
    viewport: { width: 1440, height: 960 },
  });

  const page = context.pages()[0] || await context.newPage();
  
  console.log('Navigating to', groupUrl);
  await page.goto(groupUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // wait a bit for elements to load
  await page.waitForTimeout(5000);

  console.log('Opening composer...');
  const openers = [
    page.getByRole('button', { name: /write something|create public post|what's on your mind/i }),
    page.locator('[role="button"]').filter({ hasText: /write something|create public post|what's on your mind/i }),
    page.locator('div[role="button"]').filter({ hasText: /write something|create public post|what's on your mind/i }),
  ];

  let opened = false;
  for (const opener of openers) {
    try {
      const loc = opener.first();
      await loc.waitFor({ state: 'visible', timeout: 3000 });
      await loc.click();
      opened = true;
      break;
    } catch (e) {}
  }

  if (opened) {
    console.log('Composer opened. Waiting 5s for dialog to render...');
    await page.waitForTimeout(5000);
  } else {
    console.log('Could not open composer. Taking screenshot anyway.');
  }

  console.log('Taking screenshot and dumping HTML.');
  await page.screenshot({ path: path.join(__dirname, 'diag-screenshot.png') });
  
  const html = await page.content();
  fs.writeFileSync(path.join(__dirname, 'diag-dom.html'), html);

  console.log('Done!');
  await context.close();
}

run().catch(console.error);
