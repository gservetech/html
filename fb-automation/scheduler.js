import cron from 'node-cron';
import config from './config.js';
import logger from '../utils/logger.js';
import { postToFacebook, verifyFacebook } from './facebook-poster.js';
import { parseNextContent, markAsPosted, showQueueStatus } from './content-manager.js';

console.log('\n');
console.log('  ╔══════════════════════════════════════════════╗');
console.log('  ║   📘 FACEBOOK - DAILY SCHEDULER              ║');
console.log('  ╚══════════════════════════════════════════════╝');
console.log('');

async function postFacebook() {
  logger.info('FB-Scheduler', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.info('FB-Scheduler', '🚀 Starting Facebook post cycle...');
  logger.info('FB-Scheduler', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const content = parseNextContent();
  if (!content) {
    logger.error('FB-Scheduler', `No content to post! Add files to ${config.contentQueueDir}`);
    return null;
  }

  logger.info('FB-Scheduler', `Posting: "${content.title}"`);
  const result = await postToFacebook(content);

  if (result.success) {
    markAsPosted(content.queueFile.path, [result]);
    logger.success('FB-Scheduler', `✅ Posted! ID: ${result.postId}`);
    logger.success('FB-Scheduler', `🔗 ${result.postUrl}`);
  } else {
    logger.error('FB-Scheduler', `❌ Failed: ${result.error}`);
  }

  logger.info('FB-Scheduler', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  return result;
}

async function main() {
  console.log('  🔑 Verifying Facebook credentials...\n');
  const verification = await verifyFacebook();

  if (!verification.verified) {
    console.log('\n  ❌ Facebook credentials are invalid!');
    console.log(`  Reason: ${verification.reason}`);
    process.exit(1);
  }

  console.log(`\n  ✅ Connected to Page: "${verification.pageName}"\n`);

  showQueueStatus();

  const [hours, minutes] = config.postTime.split(':');
  const cronExpression = `${minutes} ${hours} * * *`;

  logger.info('FB-Scheduler', `⏰ Facebook posting scheduled at ${config.postTime} (${config.timezone})`);
  logger.info('FB-Scheduler', `📅 Cron: ${cronExpression}`);
  logger.info('FB-Scheduler', 'Waiting for next scheduled run...\n');
  logger.info('FB-Scheduler', 'Press Ctrl+C to stop.\n');

  cron.schedule(cronExpression, async () => {
    logger.info('FB-Scheduler', '⏰ Scheduled time reached!');
    await postFacebook();
  }, {
    timezone: config.timezone,
    scheduled: true,
  });
}

main();
