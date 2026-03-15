import path from 'path';
import { fileURLToPath } from 'url';
import { verifyInstagram, postToInstagram } from './instagram-poster.js';
import { parseFile } from '../utils/html-parser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('\n');
console.log('  ╔══════════════════════════════════════════════╗');
console.log('  ║   📸 INSTAGRAM-ONLY TEST                     ║');
console.log('  ╚══════════════════════════════════════════════╝');
console.log('');

console.log('  🔑 Step 1: Verifying Instagram credentials...\n');
const verification = await verifyInstagram();

if (!verification.verified) {
  console.log('\n  ❌ Instagram credentials are invalid!');
  console.log(`  Reason: ${verification.reason}`);
  console.log('\n  Check your .env file:');
  console.log('  - INSTAGRAM_BUSINESS_ACCOUNT_ID');
  console.log('  - INSTAGRAM_ACCESS_TOKEN');
  process.exit(1);
}

console.log(`\n  ✅ Credentials verified! Connected to @${verification.username}.\n`);

const args = process.argv.slice(2);
if (args.includes('--post')) {
  console.log('  📤 Step 2: Posting test content to Instagram...\n');

  const testFile = path.join(__dirname, 'content-queue', 'example-post.html');
  const parsed = parseFile(testFile);

  const result = await postToInstagram(parsed);

  if (result.success) {
    console.log('\n  ══════════════════════════════════════════');
    console.log('  ✅ TEST POST SUCCESSFUL!');
    console.log(`  📄 Media ID: ${result.postId}`);
    console.log('  ══════════════════════════════════════════\n');
  } else {
    console.log('\n  ══════════════════════════════════════════');
    console.log('  ❌ TEST POST FAILED');
    console.log(`  Error: ${result.error}`);
    console.log('  ══════════════════════════════════════════\n');
  }
} else {
  console.log('  ── Credential check passed! ──');
  console.log('  To also send a TEST POST to your Instagram account, run:');
  console.log('');
  console.log('    npm run ig:test-post');
  console.log('');
}

process.exit(0);
