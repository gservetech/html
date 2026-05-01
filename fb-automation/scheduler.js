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

  const label = content.isRepost ? '♻️ Reposting' : '📤 Posting';
  logger.info('FB-Scheduler', `${label}: "${content.title}"`);
  const result = await postToFacebook(content);

  if (result.success) {
    if (!content.isRepost) {
      markAsPosted(content.queueFile.path, [result]);
    } else {
      logger.info('FB-Scheduler', '♻️ Repost — file stays in posted/ for future reuse');
    }
    logger.success('FB-Scheduler', `✅ Posted! ID: ${result.postId}`);
    logger.success('FB-Scheduler', `🔗 ${result.postUrl}`);
  } else {
    logger.error('FB-Scheduler', `❌ Failed: ${result.error}`);
  }

  logger.info('FB-Scheduler', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  return result;
}

async function verifyWithRetry(maxRetries = 5, delayMs = 60000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`  🔑 Verifying Facebook credentials (attempt ${attempt}/${maxRetries})...\n`);
    const verification = await verifyFacebook();

    if (verification.verified) return verification;

    logger.error('FB-Scheduler', `Verification failed: ${verification.reason}`);

    if (attempt < maxRetries) {
      const waitMin = (delayMs * attempt) / 60000;
      logger.info('FB-Scheduler', `Retrying in ${waitMin} minute(s)...`);
      await new Promise(r => setTimeout(r, delayMs * attempt));
    }
  }
  return null;
}

async function main() {
  const verification = await verifyWithRetry();

  if (!verification) {
    logger.error('FB-Scheduler', 'All verification attempts failed. Waiting 1 hour before restart...');
    await new Promise(r => setTimeout(r, 3600000));
    return main();
  }

  console.log(`\n  ✅ Connected to Page: "${verification.pageName}"\n`);

  showQueueStatus();

  const [hours, minutes] = config.postTime.split(':');
  const cronExpression = `${minutes} ${hours} * * *`;

  logger.info('FB-Scheduler', `⏰ Facebook posting scheduled at ${config.postTime} (${config.timezone})`);
  logger.info('FB-Scheduler', `📅 Cron: ${cronExpression}`);
  logger.info('FB-Scheduler', 'Waiting for next scheduled run...\n');

  cron.schedule(cronExpression, async () => {
    logger.info('FB-Scheduler', '⏰ Scheduled time reached!');
    await postFacebook();
  }, {
    timezone: config.timezone,
    scheduled: true,
  });
}

main();
