import config from './config.js';
import { postToTwitter, verifyTwitter } from './twitter-poster.js';
import { parseNextContent, markAsPosted, showQueueStatus } from './content-manager.js';

console.log('\n');
console.log('  ╔══════════════════════════════════════════════╗');
console.log('  ║   🐦 TWITTER - POST NOW                      ║');
console.log('  ╚══════════════════════════════════════════════╝');
console.log('');

console.log('  🔑 Verifying Twitter credentials...\n');
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

console.log(`\n  ✅ Connected to Twitter/X as @${verification.username}\n`);

showQueueStatus();

const content = parseNextContent();
if (!content) {
  console.log(`  ❌ No content in queue! Add HTML/TXT/MD files to: ${config.contentQueueDir}`);
  console.log('  Or run: npm run tw:add-content\n');
  process.exit(1);
}

console.log(`  📤 Posting: "${content.title}"...\n`);

const result = await postToTwitter(content);

if (result.success) {
  markAsPosted(content.queueFile.path, [result]);

  console.log('\n  ══════════════════════════════════════════');
  console.log('  ✅ TWITTER POST SUCCESSFUL!');
  console.log(`  📄 Tweet ID: ${result.postId}`);
  console.log(`  🔗 URL: ${result.postUrl}`);
  console.log('  ══════════════════════════════════════════\n');
} else {
  console.log('\n  ══════════════════════════════════════════');
  console.log('  ❌ TWITTER POST FAILED');
  console.log(`  Error: ${result.error}`);
  console.log('  ══════════════════════════════════════════\n');
  process.exit(1);
}

process.exit(0);
