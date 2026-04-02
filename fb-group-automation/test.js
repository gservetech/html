import path from 'path';
import { fileURLToPath } from 'url';
import { verifyGroupAutomation, postToFacebookGroup } from './browser-poster.js';
import { parseFile } from '../utils/html-parser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('\n');
console.log('  ╔══════════════════════════════════════════════╗');
console.log('  ║   👥 FACEBOOK GROUP TEST                     ║');
console.log('  ╚══════════════════════════════════════════════╝');
console.log('');

console.log('  🔑 Step 1: Verifying Facebook group automation...\n');
const verification = await verifyGroupAutomation();

if (!verification.verified) {
  console.log('\n  ❌ Facebook group automation is not ready!');
  console.log(`  Reason: ${verification.reason}`);
  console.log('\n  Check your .env file:');
  console.log('  - FACEBOOK_GROUP_URL');
  console.log('  - FACEBOOK_GROUP_POST_AS_NAME');
  console.log('  - Run: npm run fbg:login');
  process.exit(1);
}

console.log(`\n  ✅ ${verification.summary}\n`);

const args = process.argv.slice(2);
if (args.includes('--post')) {
  console.log('  📤 Step 2: Posting test content to the Facebook group...\n');

  const testFile = path.join(__dirname, 'content-queue', 'example-post.html');
  const parsed = parseFile(testFile);
  const result = await postToFacebookGroup(parsed);

  if (result.success) {
    console.log('\n  ══════════════════════════════════════════');
    console.log('  ✅ TEST GROUP POST SUCCESSFUL!');
    console.log(`  📄 Post ID: ${result.postId}`);
    console.log(`  🔗 URL: ${result.postUrl}`);
    console.log('  ══════════════════════════════════════════\n');
  } else {
    console.log('\n  ══════════════════════════════════════════');
    console.log('  ❌ TEST GROUP POST FAILED');
    console.log(`  Error: ${result.error}`);
    console.log('  ══════════════════════════════════════════\n');
  }
} else {
  console.log('  ── Group automation check passed! ──');
  console.log('  To also send a TEST POST to the configured Facebook group, run:');
  console.log('');
  console.log('    npm run fbg:test-post');
  console.log('');
}

process.exit(0);
