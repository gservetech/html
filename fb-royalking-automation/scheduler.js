import cron from 'node-cron';
import config from './config.js';
import logger from '../utils/logger.js';
import { postToFacebook, verifyFacebook } from './facebook-poster.js';
import { parseNextContent, markAsPosted, showQueueStatus } from './content-manager.js';

const LOG_SCOPE = 'FB-RoyalKing-Scheduler';

console.log('\n');
console.log('  ╔══════════════════════════════════════════════╗');
console.log('  ║   ROYALKING FB - DAILY SCHEDULER            ║');
console.log('  ╚══════════════════════════════════════════════╝');
console.log('');

async function postFacebook() {
  logger.info(LOG_SCOPE, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.info(LOG_SCOPE, '🚀 Starting Facebook post cycle...');
  logger.info(LOG_SCOPE, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const content = parseNextContent();
  if (!content) {
    logger.error(LOG_SCOPE, `No content to post! Add files to ${config.contentQueueDir}`);
    return null;
  }

  logger.info(LOG_SCOPE, `Posting: "${content.title}"`);
  const result = await postToFacebook(content);

  if (result.success) {
    markAsPosted(content.queueFile.path, [result]);
    logger.success(LOG_SCOPE, `✅ Posted! ID: ${result.postId}`);
    logger.success(LOG_SCOPE, `🔗 ${result.postUrl}`);
  } else {
    logger.error(LOG_SCOPE, `❌ Failed: ${result.error}`);
  }

  logger.info(LOG_SCOPE, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  return result;
}

async function main() {
  console.log('  🔑 Verifying RoyalKing Facebook credentials...\n');
  const verification = await verifyFacebook();

  if (!verification.verified) {
    console.log('\n  ❌ RoyalKing Facebook credentials are invalid!');
    console.log(`  Reason: ${verification.reason}`);
    process.exit(1);
  }

  console.log(`\n  ✅ Connected to Page: "${verification.pageName}"\n`);

  showQueueStatus();

  const [hours, minutes] = config.postTime.split(':');
  const cronExpression = `${minutes} ${hours} * * *`;

  logger.info(LOG_SCOPE, `⏰ Facebook posting scheduled at ${config.postTime} (${config.timezone})`);
  logger.info(LOG_SCOPE, `📅 Cron: ${cronExpression}`);
  logger.info(LOG_SCOPE, 'Waiting for next scheduled run...\n');
  logger.info(LOG_SCOPE, 'Press Ctrl+C to stop.\n');

  cron.schedule(cronExpression, async () => {
    logger.info(LOG_SCOPE, '⏰ Scheduled time reached!');
    await postFacebook();
  }, {
    timezone: config.timezone,
    scheduled: true,
  });
}

main();
