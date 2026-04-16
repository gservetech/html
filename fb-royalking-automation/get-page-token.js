import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, '..');
const rootEnvPath = path.join(workspaceRoot, '.env');

dotenv.config({ path: rootEnvPath });

const API_VERSION = 'v21.0';
const BASE = `https://graph.facebook.com/${API_VERSION}`;
const PAGE_ID_KEY = 'FACEBOOK_ROYALKING_PAGE_ID';
const PAGE_TOKEN_KEY = 'FACEBOOK_ROYALKING_PAGE_ACCESS_TOKEN';

function upsertEnvVar(content, key, value) {
  const pattern = new RegExp(`^${key}=.*$`, 'm');
  const line = `${key}=${value}`;

  if (pattern.test(content)) {
    return content.replace(pattern, line);
  }

  const suffix = content.endsWith('\n') || content.length === 0 ? '' : '\n';
  return `${content}${suffix}${line}\n`;
}

console.log('\n');
console.log('  ╔══════════════════════════════════════════════════╗');
console.log('  ║   ROYALKING TOKEN HELPER                        ║');
console.log('  ║   Get the correct RoyalKing Page token          ║');
console.log('  ╚══════════════════════════════════════════════════╝');
console.log('');

const userToken = process.env[PAGE_TOKEN_KEY];

if (!userToken || userToken === 'your_royalking_long_lived_page_access_token_here') {
  console.log('  ❌ No token found in .env!');
  console.log(`  Set ${PAGE_TOKEN_KEY} to your User Access Token first.`);
  console.log('  Get one from: https://developers.facebook.com/tools/explorer/');
  console.log('  (Grant pages_manage_posts & pages_read_engagement permissions)\n');
  process.exit(1);
}

try {
  console.log('  🔍 Checking your token...\n');

  const meResp = await axios.get(`${BASE}/me?fields=id,name&access_token=${userToken}`);
  console.log(`  👤 Logged in as: ${meResp.data.name} (ID: ${meResp.data.id})\n`);

  console.log('  📋 Fetching your Pages & Professional Profiles...\n');
  const accountsResp = await axios.get(
    `${BASE}/me/accounts?fields=id,name,access_token,category&access_token=${userToken}`
  );

  const pages = accountsResp.data.data;

  if (!pages || pages.length === 0) {
    console.log('  ⚠️  No Pages found!');
    console.log('  Make sure your token has these permissions:');
    console.log('    - pages_manage_posts');
    console.log('    - pages_read_engagement');
    console.log('');
    console.log('  If you enabled Professional Mode:');
    console.log('  1. Go to Graph Explorer: https://developers.facebook.com/tools/explorer/');
    console.log('  2. Select your App');
    console.log('  3. Click "Generate Access Token"');
    console.log('  4. Check: pages_manage_posts, pages_read_engagement');
    console.log('  5. Click "Generate" and approve');
    console.log('  6. Copy the new token and update .env\n');
    process.exit(1);
  }

  console.log('  Found the following pages/profiles:\n');
  console.log('  ┌─────┬────────────────────────┬──────────────────────┐');
  console.log('  │  #  │ Name                   │ Page ID              │');
  console.log('  ├─────┼────────────────────────┼──────────────────────┤');
  pages.forEach((page, index) => {
    const name = page.name.substring(0, 22).padEnd(22);
    const id = String(page.id).padEnd(20);
    console.log(`  │  ${index + 1}  │ ${name} │ ${id} │`);
  });
  console.log('  └─────┴────────────────────────┴──────────────────────┘\n');

  const currentPageId = process.env[PAGE_ID_KEY];
  let matchedPage = pages.find(page => page.id === currentPageId);

  if (!matchedPage) {
    matchedPage = pages[0];
    console.log(`  ℹ️  Your configured PAGE_ID (${currentPageId}) didn't match any page.`);
    console.log(`  📌 Using: "${matchedPage.name}" (ID: ${matchedPage.id})\n`);
  } else {
    console.log(`  ✅ Matched page: "${matchedPage.name}" (ID: ${matchedPage.id})\n`);
  }

  let envContent = fs.existsSync(rootEnvPath) ? fs.readFileSync(rootEnvPath, 'utf-8') : '';
  envContent = upsertEnvVar(envContent, PAGE_ID_KEY, matchedPage.id);
  envContent = upsertEnvVar(envContent, PAGE_TOKEN_KEY, matchedPage.access_token);
  fs.outputFileSync(rootEnvPath, envContent);

  console.log('  ✅ Updated RoyalKing Facebook credentials in:');
  console.log(`     ${rootEnvPath}`);
  console.log(`     ${PAGE_ID_KEY}=${matchedPage.id}`);
  console.log(`     ${PAGE_TOKEN_KEY}=${matchedPage.access_token.substring(0, 30)}...`);
  console.log('');
  console.log('  🚀 Now run: npm run fb:royalking:test-post');
  console.log('');
} catch (error) {
  const errorMsg = error.response?.data?.error?.message || error.message;
  console.log(`  ❌ Error: ${errorMsg}\n`);

  if (error.response?.data?.error?.code === 190) {
    console.log('  Your token has expired! Get a new one at:');
    console.log('  https://developers.facebook.com/tools/explorer/\n');
  }

  process.exit(1);
}
