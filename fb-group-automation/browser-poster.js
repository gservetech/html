import axios from 'axios';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import config from './config.js';
import logger from '../utils/logger.js';
import { formatForPlatform } from '../utils/html-parser.js';

const POST_ID_PREFIX = 'fb-group-browser';

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function loadPlaywright() {
  try {
    return await import('playwright');
  } catch {
    throw new Error('This feature requires Playwright. Run "npm install" and then "npx playwright install chromium".');
  }
}

async function openBrowser(headless = config.facebookGroup.headless) {
  const { chromium } = await loadPlaywright();
  await fs.ensureDir(config.facebookGroup.browserProfileDir);

  const context = await chromium.launchPersistentContext(config.facebookGroup.browserProfileDir, {
    headless,
    viewport: { width: 1440, height: 960 },
  });

  const page = context.pages()[0] || await context.newPage();
  return { context, page };
}

async function findLocator(candidates, { state = 'visible', timeout = 3000 } = {}) {
  for (const locator of candidates) {
    try {
      const candidate = locator.first();
      await candidate.waitFor({ state, timeout });
      return candidate;
    } catch {
      // Try the next candidate.
    }
  }

  return null;
}

async function ensureLoggedIn(page) {
  const passwordInput = page.locator('input[type="password"]').first();
  const loginButton = page.getByRole('button', { name: /log in/i }).first();

  if (await passwordInput.isVisible().catch(() => false) || await loginButton.isVisible().catch(() => false)) {
    throw new Error('Facebook login is required. Run "npm run fbg:login" first and save the browser session.');
  }
}

async function openComposer(page) {
  let editor = await findLocator([
    page.locator('[role="dialog"] [contenteditable="true"]'),
    page.locator('[role="dialog"] div[role="textbox"]'),
    page.locator('div[contenteditable="true"][role="textbox"]'),
    page.locator('div[contenteditable="true"][data-lexical-editor="true"]'),
    page.locator('textarea'),
  ], { timeout: 2000 });

  if (editor) {
    return editor;
  }

  const opener = await findLocator([
    page.getByRole('button', { name: /write something|create public post|what's on your mind/i }),
    page.locator('[role="button"]').filter({ hasText: /write something|create public post|what's on your mind/i }),
    page.locator('div[role="button"]').filter({ hasText: /write something|create public post|what's on your mind/i }),
  ], { timeout: 7000 });

  if (!opener) {
    throw new Error('Could not find the group post composer. Open the group manually in the saved browser profile and confirm you can post there.');
  }

  await opener.click();

  editor = await findLocator([
    page.locator('[role="dialog"] [contenteditable="true"]'),
    page.locator('[role="dialog"] div[role="textbox"]'),
    page.locator('div[contenteditable="true"][role="textbox"]'),
    page.locator('div[contenteditable="true"][data-lexical-editor="true"]'),
    page.locator('textarea'),
  ], { timeout: 10000 });

  if (!editor) {
    throw new Error('The Facebook composer opened, but the message editor could not be found.');
  }

  return editor;
}

async function ensurePostingIdentity(page) {
  const actorName = config.facebookGroup.postAsName?.trim();
  if (!actorName) {
    logger.warn('FB-Group', 'FACEBOOK_GROUP_POST_AS_NAME is not set. The script cannot verify that Facebook will post as your Page.');
    return;
  }

  const actorPattern = new RegExp(escapeRegex(actorName), 'i');
  const alreadySelected = await findLocator([
    page.locator('[role="dialog"]').getByText(actorPattern),
  ], { timeout: 1500 });

  if (alreadySelected) {
    logger.info('FB-Group', `Posting identity already matches "${actorName}".`);
    return;
  }

  const switcher = await findLocator([
    page.getByRole('button', { name: /post as|posting as|profile|switch/i }),
    page.locator('[role="dialog"] [role="button"]').filter({ hasText: /post as|posting as|profile|switch/i }),
  ], { timeout: 5000 });

  if (!switcher) {
    throw new Error(`Could not find a posting-identity switcher for "${actorName}". Open "npm run fbg:login", switch to your Page manually, and save that session again.`);
  }

  await switcher.click();

  const actorOption = await findLocator([
    page.getByRole('button', { name: actorPattern }),
    page.getByRole('option', { name: actorPattern }),
    page.locator('[role="menuitem"]').filter({ hasText: actorPattern }),
    page.locator('[role="dialog"] [role="button"]').filter({ hasText: actorPattern }),
  ], { timeout: 8000 });

  if (!actorOption) {
    throw new Error(`Could not switch posting identity to "${actorName}". Set it manually once in "npm run fbg:login".`);
  }

  await actorOption.click();

  const confirmedActor = await findLocator([
    page.locator('[role="dialog"]').getByText(actorPattern),
  ], { timeout: 4000 });

  if (!confirmedActor) {
    throw new Error(`Facebook did not confirm the posting identity as "${actorName}". Stop and re-save the session with "npm run fbg:login".`);
  }

  logger.info('FB-Group', `Confirmed posting identity as "${actorName}".`);
}

async function writeMessage(page, editor, message) {
  await editor.click();
  await page.keyboard.press('Control+A').catch(() => {});
  await page.keyboard.press('Backspace').catch(() => {});

  if (await editor.evaluate((element) => element.tagName.toLowerCase() === 'textarea').catch(() => false)) {
    await editor.fill(message);
    return;
  }

  await page.keyboard.insertText(message);
}

async function downloadRemoteImage(imageUrl) {
  const extension = path.extname(new URL(imageUrl).pathname) || '.jpg';
  const tempPath = path.join(os.tmpdir(), `fb-group-${Date.now()}${extension}`);
  const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  await fs.writeFile(tempPath, response.data);
  return tempPath;
}

async function resolveImagePath(parsedContent) {
  const source = parsedContent.images?.[0]?.src;
  if (!source) {
    return { uploadPath: null, cleanupPath: null };
  }

  if (/^https?:\/\//i.test(source)) {
    const tempPath = await downloadRemoteImage(source);
    return { uploadPath: tempPath, cleanupPath: tempPath };
  }

  const localPath = path.resolve(source);
  if (!await fs.pathExists(localPath)) {
    return { uploadPath: null, cleanupPath: null };
  }

  return { uploadPath: localPath, cleanupPath: null };
}

async function attachImage(page, parsedContent) {
  const { uploadPath, cleanupPath } = await resolveImagePath(parsedContent);
  if (!uploadPath) {
    return;
  }

  try {
    const photoButton = await findLocator([
      page.getByRole('button', { name: /photo\/video|add photos|add photos\/videos/i }),
      page.locator('[role="button"]').filter({ hasText: /photo\/video|add photos|add photos\/videos/i }),
    ], { timeout: 4000 });

    if (photoButton) {
      await photoButton.click().catch(() => {});
    }

    const fileInput = await findLocator([
      page.locator('[role="dialog"] input[type="file"]'),
      page.locator('input[type="file"]'),
    ], { state: 'attached', timeout: 15000 });

    if (!fileInput) {
      throw new Error('The image upload control was not found.');
    }

    await fileInput.setInputFiles(uploadPath);
    await page.waitForTimeout(5000);
  } finally {
    if (cleanupPath) {
      await fs.remove(cleanupPath).catch(() => {});
    }
  }
}

async function submitPost(page) {
  const postButton = await findLocator([
    page.getByRole('button', { name: /^post$/i }),
    page.getByRole('button', { name: /publish/i }),
    page.locator('[role="dialog"] [role="button"]').filter({ hasText: /^post$/i }),
    page.locator('[role="dialog"] [role="button"]').filter({ hasText: /publish/i }),
  ], { timeout: 15000 });

  if (!postButton) {
    throw new Error('The Facebook "Post" button was not found.');
  }

  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (await postButton.isEnabled().catch(() => false)) {
      break;
    }

    await page.waitForTimeout(1000);
  }

  if (!await postButton.isEnabled().catch(() => false)) {
    throw new Error('The post button never became enabled. The group may require extra prompts or moderation settings.');
  }

  await postButton.click();
  await page.waitForTimeout(6000);
}

export async function verifyGroupAutomation() {
  if (!config.facebookGroup.enabled) {
    return { verified: false, reason: 'Set FACEBOOK_GROUP_URL in .env.' };
  }

  try {
    await loadPlaywright();

    const actorSummary = config.facebookGroup.postAsName
      ? `Posting actor locked to "${config.facebookGroup.postAsName}".`
      : 'Posting actor is not locked. Set FACEBOOK_GROUP_POST_AS_NAME to enforce your Page identity.';

    return {
      verified: true,
      targetName: config.facebookGroup.url,
      summary: `Group automation configured for ${config.facebookGroup.url}. ${actorSummary}`,
    };
  } catch (error) {
    return {
      verified: false,
      reason: error.message,
    };
  }
}

export async function startGroupLoginSession() {
  if (!config.facebookGroup.enabled) {
    throw new Error('Set FACEBOOK_GROUP_URL before starting the Facebook group login flow.');
  }

  const { context, page } = await openBrowser(false);
  const rl = readline.createInterface({ input, output });

  try {
    await page.goto('https://www.facebook.com/', {
      waitUntil: 'domcontentloaded',
      timeout: config.facebookGroup.timeoutMs,
    });

    console.log('');
    console.log('Step 1: Log in to Facebook in the opened browser.');
    console.log('When login is complete, return here and press Enter.');
    console.log('');

    await rl.question('Press Enter after Facebook login is complete...');

    await page.goto(config.facebookGroup.url, {
      waitUntil: 'domcontentloaded',
      timeout: config.facebookGroup.timeoutMs,
    });

    console.log('');
    console.log(`Step 2: The script opened your target group: ${config.facebookGroup.url}`);
    console.log('Confirm that you can create a post in this group.');
    if (config.facebookGroup.postAsName) {
      console.log(`If needed, switch the posting identity to "${config.facebookGroup.postAsName}" before saving the session.`);
    } else {
      console.log('If you need to post as a Page, switch to that Page identity before saving the session.');
    }
    console.log('Leave the browser on the group page when everything looks correct.');
    console.log('');

    await rl.question('Press Enter to save the session and close the browser...');
    logger.success('FB-Group', `Saved browser session to ${config.facebookGroup.browserProfileDir}`);
  } finally {
    rl.close();
    await context.close();
  }
}

export async function postToFacebookGroup(parsedContent) {
  logger.info('FB-Group', 'Preparing Facebook group post...');

  const { context, page } = await openBrowser(config.facebookGroup.headless);

  try {
    const message = formatForPlatform(parsedContent, 'facebook');

    logger.info('FB-Group', `Post content (${message.length} chars)`);
    logger.debug('FB-Group', message);

    await page.goto(config.facebookGroup.url, {
      waitUntil: 'domcontentloaded',
      timeout: config.facebookGroup.timeoutMs,
    });

    await ensureLoggedIn(page);
    const editor = await openComposer(page);
    await ensurePostingIdentity(page);
    await writeMessage(page, editor, message);
    await attachImage(page, parsedContent);
    await submitPost(page);

    const postId = `${POST_ID_PREFIX}-${Date.now()}`;
    logger.success('FB-Group', `Group post submitted: ${postId}`);

    return {
      success: true,
      platform: 'facebook-group',
      postId,
      postUrl: config.facebookGroup.url,
      content: message,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const errorMsg = error.message || 'Unknown Facebook group posting error';
    logger.error('FB-Group', `Failed: ${errorMsg}`);

    return {
      success: false,
      platform: 'facebook-group',
      error: errorMsg,
      timestamp: new Date().toISOString(),
    };
  } finally {
    await context.close().catch(() => {});
  }
}

export default {
  verifyGroupAutomation,
  startGroupLoginSession,
  postToFacebookGroup,
};
