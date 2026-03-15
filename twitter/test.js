import path from 'path';
import { fileURLToPath } from 'url';
import { verifyTwitter, postToTwitter } from './twitter-poster.js';
import { parseFile } from '../utils/html-parser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('\n');
console.log('  ╔══════════════════════════════════════════════╗');
console.log('  ║   🐦 TWITTER-ONLY TEST                       ║');
console.log('  ╚══════════════════════════════════════════════╝');
console.log('');

console.log('  🔑 Step 1: Verifying Twitter credentials...\n');
const verification = await verifyTwitter();

if (!verification.verified) {
  console.log('\n  ❌ Twitter credentials are invalid!');
  console.log(`  Reason: ${verification.reason}`);
  console.log('\n  Check your .env file:');
  console.log('  - TWITTER_API_KEY');
  console.log('  - TWITTER_API_SECRET');
  console.log('  - TWITTER_ACCESS_TOKEN');
  console.log('  - TWITTER_ACCESS_TOKEN_SECRET');
  process.exit(1);
}

console.log(`\n  ✅ Credentials verified! Connected to @${verification.username}.\n`);

const args = process.argv.slice(2);
if (args.includes('--post')) {
  console.log('  📤 Step 2: Posting test content to Twitter/X...\n');

  const testFile = path.join(__dirname, 'content-queue', 'example-post.html');
  const parsed = parseFile(testFile);

  const result = await postToTwitter(parsed);

  if (result.success) {
    console.log('\n  ══════════════════════════════════════════');
    console.log('  ✅ TEST POST SUCCESSFUL!');
    console.log(`  📄 Tweet ID: ${result.postId}`);
    console.log(`  🔗 URL: ${result.postUrl}`);
    console.log('  ══════════════════════════════════════════\n');
  } else {
    console.log('\n  ══════════════════════════════════════════');
    console.log('  ❌ TEST POST FAILED');
    console.log(`  Error: ${result.error}`);
    console.log('  ══════════════════════════════════════════\n');
  }
} else {
  console.log('  ── Credential check passed! ──');
  console.log('  To also send a TEST POST to your Twitter/X account, run:');
  console.log('');
  console.log('    npm run tw:test-post');
  console.log('');
}

process.exit(0);
