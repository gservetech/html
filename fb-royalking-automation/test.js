import path from 'path';
import { fileURLToPath } from 'url';
import { verifyFacebook, postToFacebook } from './facebook-poster.js';
import { parseFile } from '../utils/html-parser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('\n');
console.log('  ╔══════════════════════════════════════════════╗');
console.log('  ║   ROYALKING FACEBOOK TEST                   ║');
console.log('  ╚══════════════════════════════════════════════╝');
console.log('');

console.log('  🔑 Step 1: Verifying RoyalKing Facebook credentials...\n');
const verification = await verifyFacebook();

if (!verification.verified) {
  console.log('\n  ❌ RoyalKing Facebook credentials are invalid!');
  console.log(`  Reason: ${verification.reason}`);
  console.log('\n  Check your .env file:');
  console.log('  - FACEBOOK_ROYALKING_PAGE_ID');
  console.log('  - FACEBOOK_ROYALKING_PAGE_ACCESS_TOKEN');
  process.exit(1);
}

console.log('\n  ✅ Credentials verified! Connected to your RoyalKing Facebook Page.\n');

const args = process.argv.slice(2);
if (args.includes('--post')) {
  console.log('  📤 Step 2: Posting test content to Facebook...\n');

  const testFile = path.join(__dirname, 'content-queue', 'example-post.html');
  const parsed = parseFile(testFile);

  const result = await postToFacebook(parsed);

  if (result.success) {
    console.log('\n  ══════════════════════════════════════════');
    console.log('  ✅ TEST POST SUCCESSFUL!');
    console.log(`  📄 Post ID: ${result.postId}`);
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
  console.log('  To also send a TEST POST to your RoyalKing Facebook Page, run:');
  console.log('');
  console.log('    npm run fb:royalking:test-post');
  console.log('');
}

process.exit(0);
