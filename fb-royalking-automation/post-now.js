import config from './config.js';
import { postToFacebook, verifyFacebook } from './facebook-poster.js';
import { parseNextContent, markAsPosted, showQueueStatus } from './content-manager.js';

console.log('\n');
console.log('  ╔══════════════════════════════════════════════╗');
console.log('  ║   ROYALKING FACEBOOK - POST NOW             ║');
console.log('  ╚══════════════════════════════════════════════╝');
console.log('');

console.log('  🔑 Verifying RoyalKing Facebook credentials...\n');
const verification = await verifyFacebook();

if (!verification.verified) {
  console.log('\n  ❌ RoyalKing Facebook credentials are invalid!');
  console.log(`  Reason: ${verification.reason}`);
  console.log('\n  Check your .env file:');
  console.log('  - FACEBOOK_ROYALKING_PAGE_ID');
  console.log('  - FACEBOOK_ROYALKING_PAGE_ACCESS_TOKEN');
  process.exit(1);
}

console.log(`\n  ✅ Connected to Page: "${verification.pageName}"\n`);

showQueueStatus();

const content = parseNextContent();
if (!content) {
  console.log(`  ❌ No content in queue! Add HTML/TXT/MD files to: ${config.contentQueueDir}`);
  console.log('  Or run: npm run fb:royalking:add-content\n');
  process.exit(1);
}

console.log(`  📤 Posting: "${content.title}"...\n`);

const result = await postToFacebook(content);

if (result.success) {
  markAsPosted(content.queueFile.path, [result]);

  console.log('\n  ══════════════════════════════════════════');
  console.log('  ✅ ROYALKING FACEBOOK POST SUCCESSFUL!');
  console.log(`  📄 Post ID: ${result.postId}`);
  console.log(`  🔗 URL: ${result.postUrl}`);
  console.log('  ══════════════════════════════════════════\n');
} else {
  console.log('\n  ══════════════════════════════════════════');
  console.log('  ❌ ROYALKING FACEBOOK POST FAILED');
  console.log(`  Error: ${result.error}`);
  console.log('  ══════════════════════════════════════════\n');
  process.exit(1);
}

process.exit(0);
