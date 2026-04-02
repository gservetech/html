import config from './config.js';
import { postToFacebookGroup, verifyGroupAutomation } from './browser-poster.js';
import { parseNextContent, markAsPosted, showQueueStatus } from './content-manager.js';

console.log('\n');
console.log('  ╔══════════════════════════════════════════════╗');
console.log('  ║   👥 FACEBOOK GROUP - POST NOW               ║');
console.log('  ╚══════════════════════════════════════════════╝');
console.log('');

console.log('  🔑 Verifying Facebook group automation...\n');
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

showQueueStatus();

const content = parseNextContent();
if (!content) {
  console.log(`  ❌ No content in queue. Add HTML/TXT/MD files to: ${config.contentQueueDir}`);
  console.log('  Or run: npm run fbg:add-content\n');
  process.exit(1);
}

console.log(`  📤 Posting: "${content.title}"...\n`);

if (config.facebookGroup.postAsName) {
  console.log(`  👤 Required posting identity: ${config.facebookGroup.postAsName}\n`);
}

const result = await postToFacebookGroup(content);

if (result.success) {
  markAsPosted(content.queueFile.path, [result]);

  console.log('\n  ══════════════════════════════════════════');
  console.log('  ✅ FACEBOOK GROUP POST SUCCESSFUL!');
  console.log(`  📄 Post ID: ${result.postId}`);
  console.log(`  🔗 URL: ${result.postUrl}`);
  console.log('  ══════════════════════════════════════════\n');
} else {
  console.log('\n  ══════════════════════════════════════════');
  console.log('  ❌ FACEBOOK GROUP POST FAILED');
  console.log(`  Error: ${result.error}`);
  console.log('  ══════════════════════════════════════════\n');
  process.exit(1);
}

process.exit(0);
