import config from './config.js';
import { postToInstagram, verifyInstagram } from './instagram-poster.js';
import { parseNextContent, markAsPosted, showQueueStatus } from './content-manager.js';

console.log('\n');
console.log('  ╔══════════════════════════════════════════════╗');
console.log('  ║   📸 INSTAGRAM - POST NOW                    ║');
console.log('  ╚══════════════════════════════════════════════╝');
console.log('');

console.log('  🔑 Verifying Instagram credentials...\n');
const verification = await verifyInstagram();

if (!verification.verified) {
  console.log('\n  ❌ Instagram credentials are invalid!');
  console.log(`  Reason: ${verification.reason}`);
  console.log('\n  Check your .env file:');
  console.log('  - INSTAGRAM_BUSINESS_ACCOUNT_ID');
  console.log('  - INSTAGRAM_ACCESS_TOKEN');
  process.exit(1);
}

console.log(`\n  ✅ Connected to Instagram: @${verification.username}\n`);

showQueueStatus();

const content = parseNextContent();
if (!content) {
  console.log(`  ❌ No content in queue! Add HTML/TXT/MD files to: ${config.contentQueueDir}`);
  console.log('  Or run: npm run ig:add-content\n');
  process.exit(1);
}

console.log(`  📤 Posting: "${content.title}"...\n`);

const result = await postToInstagram(content);

if (result.success) {
  markAsPosted(content.queueFile.path, [result]);

  console.log('\n  ══════════════════════════════════════════');
  console.log('  ✅ INSTAGRAM POST SUCCESSFUL!');
  console.log(`  📄 Media ID: ${result.postId}`);
  console.log('  ══════════════════════════════════════════\n');
} else {
  console.log('\n  ══════════════════════════════════════════');
  console.log('  ❌ INSTAGRAM POST FAILED');
  console.log(`  Error: ${result.error}`);
  console.log('  ══════════════════════════════════════════\n');
  process.exit(1);
}

process.exit(0);
