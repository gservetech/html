import cron from 'node-cron';
import config from './config.js';
import logger from '../utils/logger.js';
import { parseNextContent, markAsPosted, showQueueStatus } from './content-manager.js';
import { postToFacebookGroup, verifyGroupAutomation } from './browser-poster.js';

console.log('\n');
console.log('  ╔══════════════════════════════════════════════╗');
console.log('  ║   👥 FACEBOOK GROUP - DAILY SCHEDULER        ║');
console.log('  ╚══════════════════════════════════════════════╝');
console.log('');

async function postGroup() {
  logger.info('FB-Group-Scheduler', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.info('FB-Group-Scheduler', '🚀 Starting Facebook group post cycle...');
  logger.info('FB-Group-Scheduler', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const content = parseNextContent();
  if (!content) {
    logger.error('FB-Group-Scheduler', `No content to post. Add files to ${config.contentQueueDir}`);
    return null;
  }

  logger.info('FB-Group-Scheduler', `Posting: "${content.title}"`);
  const result = await postToFacebookGroup(content);

  if (result.success) {
    markAsPosted(content.queueFile.path, [result]);
    logger.success('FB-Group-Scheduler', `✅ Posted! ID: ${result.postId}`);
    logger.success('FB-Group-Scheduler', `🔗 ${result.postUrl}`);
  } else {
    logger.error('FB-Group-Scheduler', `❌ Failed: ${result.error}`);
  }

  logger.info('FB-Group-Scheduler', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  return result;
}

async function main() {
  console.log('  🔑 Verifying Facebook group automation...\n');
  const verification = await verifyGroupAutomation();

  if (!verification.verified) {
    console.log('\n  ❌ Facebook group automation is not ready!');
    console.log(`  Reason: ${verification.reason}`);
    process.exit(1);
  }

  console.log(`\n  ✅ ${verification.summary}\n`);

  showQueueStatus();

  const [hours, minutes] = config.postTime.split(':');
  const cronExpression = `${minutes} ${hours} * * *`;

  logger.info('FB-Group-Scheduler', `⏰ Facebook group posting scheduled at ${config.postTime} (${config.timezone})`);
  logger.info('FB-Group-Scheduler', `📅 Cron: ${cronExpression}`);
  logger.info('FB-Group-Scheduler', 'Waiting for next scheduled run...\n');
  logger.info('FB-Group-Scheduler', 'Press Ctrl+C to stop.\n');

  cron.schedule(cronExpression, async () => {
    logger.info('FB-Group-Scheduler', '⏰ Scheduled time reached!');
    await postGroup();
  }, {
    timezone: config.timezone,
    scheduled: true,
  });
}

main();
