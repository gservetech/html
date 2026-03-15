import cron from 'node-cron';
import config from './config.js';
import logger from '../utils/logger.js';
import { postToInstagram, verifyInstagram } from './instagram-poster.js';
import { parseNextContent, markAsPosted, showQueueStatus } from './content-manager.js';

console.log('\n');
console.log('  ╔══════════════════════════════════════════════╗');
console.log('  ║   📸 INSTAGRAM - DAILY SCHEDULER             ║');
console.log('  ╚══════════════════════════════════════════════╝');
console.log('');

async function postInstagram() {
  logger.info('IG-Scheduler', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.info('IG-Scheduler', '🚀 Starting Instagram post cycle...');
  logger.info('IG-Scheduler', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const content = parseNextContent();
  if (!content) {
    logger.error('IG-Scheduler', `No content to post! Add files to ${config.contentQueueDir}`);
    return null;
  }

  logger.info('IG-Scheduler', `Posting: "${content.title}"`);
  const result = await postToInstagram(content);

  if (result.success) {
    markAsPosted(content.queueFile.path, [result]);
    logger.success('IG-Scheduler', `✅ Posted! Media ID: ${result.postId}`);
  } else {
    logger.error('IG-Scheduler', `❌ Failed: ${result.error}`);
  }

  logger.info('IG-Scheduler', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  return result;
}

async function main() {
  console.log('  🔑 Verifying Instagram credentials...\n');
  const verification = await verifyInstagram();

  if (!verification.verified) {
    console.log('\n  ❌ Instagram credentials are invalid!');
    console.log(`  Reason: ${verification.reason}`);
    process.exit(1);
  }

  console.log(`\n  ✅ Connected to Instagram: @${verification.username}\n`);

  showQueueStatus();

  const [hours, minutes] = config.postTime.split(':');
  const cronExpression = `${minutes} ${hours} * * *`;

  logger.info('IG-Scheduler', `⏰ Instagram posting scheduled at ${config.postTime} (${config.timezone})`);
  logger.info('IG-Scheduler', `📅 Cron: ${cronExpression}`);
  logger.info('IG-Scheduler', 'Waiting for next scheduled run...\n');
  logger.info('IG-Scheduler', 'Press Ctrl+C to stop.\n');

  cron.schedule(cronExpression, async () => {
    logger.info('IG-Scheduler', '⏰ Scheduled time reached!');
    await postInstagram();
  }, {
    timezone: config.timezone,
    scheduled: true,
  });
}

main();
