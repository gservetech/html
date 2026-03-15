import cron from 'node-cron';
import config from './config.js';
import logger from '../utils/logger.js';
import { postToTwitter, verifyTwitter } from './twitter-poster.js';
import { parseNextContent, markAsPosted, showQueueStatus } from './content-manager.js';

console.log('\n');
console.log('  ╔══════════════════════════════════════════════╗');
console.log('  ║   🐦 TWITTER - DAILY SCHEDULER               ║');
console.log('  ╚══════════════════════════════════════════════╝');
console.log('');

async function postTwitter() {
  logger.info('TW-Scheduler', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.info('TW-Scheduler', '🚀 Starting Twitter post cycle...');
  logger.info('TW-Scheduler', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const content = parseNextContent();
  if (!content) {
    logger.error('TW-Scheduler', `No content to post! Add files to ${config.contentQueueDir}`);
    return null;
  }

  logger.info('TW-Scheduler', `Posting: "${content.title}"`);
  const result = await postToTwitter(content);

  if (result.success) {
    markAsPosted(content.queueFile.path, [result]);
    logger.success('TW-Scheduler', `✅ Posted! Tweet ID: ${result.postId}`);
    logger.success('TW-Scheduler', `🔗 ${result.postUrl}`);
  } else {
    logger.error('TW-Scheduler', `❌ Failed: ${result.error}`);
  }

  logger.info('TW-Scheduler', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  return result;
}

async function main() {
  console.log('  🔑 Verifying Twitter credentials...\n');
  const verification = await verifyTwitter();

  if (!verification.verified) {
    console.log('\n  ❌ Twitter credentials are invalid!');
    console.log(`  Reason: ${verification.reason}`);
    process.exit(1);
  }

  console.log(`\n  ✅ Connected to Twitter/X as @${verification.username}\n`);

  showQueueStatus();

  const [hours, minutes] = config.postTime.split(':');
  const cronExpression = `${minutes} ${hours} * * *`;

  logger.info('TW-Scheduler', `⏰ Twitter posting scheduled at ${config.postTime} (${config.timezone})`);
  logger.info('TW-Scheduler', `📅 Cron: ${cronExpression}`);
  logger.info('TW-Scheduler', 'Waiting for next scheduled run...\n');
  logger.info('TW-Scheduler', 'Press Ctrl+C to stop.\n');

  cron.schedule(cronExpression, async () => {
    logger.info('TW-Scheduler', '⏰ Scheduled time reached!');
    await postTwitter();
  }, {
    timezone: config.timezone,
    scheduled: true,
  });
}

main();
