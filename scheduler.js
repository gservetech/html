import cron from 'node-cron';
import config from './config.js';
import logger from './utils/logger.js';
import { parseNextContent, markAsPosted, showQueueStatus } from './content-manager.js';
import { postToTwitter, verifyTwitter } from './twitter/twitter-poster.js';
import { postToFacebook, verifyFacebook } from './fb-automation/facebook-poster.js';
import { postToInstagram, verifyInstagram } from './instagram/instagram-poster.js';

/**
 * ╔══════════════════════════════════════════════════════╗
 * ║   SOCIAL MEDIA AUTOMATION SCHEDULER                 ║
 * ║   Posts to Facebook, Instagram & Twitter daily       ║
 * ║   100% FREE APIs                                    ║
 * ╚══════════════════════════════════════════════════════╝
 * 
 * Usage:
 *   npm start           → Start the daily scheduler
 *   npm run post-now    → Post immediately (one-time)
 *   npm run setup       → Verify all credentials
 *   npm run add-content → Interactive content adder
 */

// ── Banner ──
function showBanner() {
  console.log('\n');
  console.log('  ╔══════════════════════════════════════════════════════════╗');
  console.log('  ║                                                        ║');
  console.log('  ║   🚀  SOCIAL MEDIA AUTOMATION                          ║');
  console.log('  ║   ─────────────────────────────                        ║');
  console.log('  ║   📘 Facebook  │  📸 Instagram  │  🐦 Twitter/X       ║');
  console.log('  ║                                                        ║');
  console.log('  ╚══════════════════════════════════════════════════════════╝');
  console.log('');
}

// ── Post to all platforms ──
async function postToAllPlatforms() {
  logger.info('Scheduler', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.info('Scheduler', '🚀 Starting daily post cycle...');
  logger.info('Scheduler', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // 1. Get next content from queue
  const content = parseNextContent();
  if (!content) {
    logger.error('Scheduler', 'No content to post! Add files to content-queue/');
    return;
  }

  logger.info('Scheduler', `Posting: "${content.title}"`);

  const results = [];

  // 2. Post to each enabled platform
  if (config.twitter.enabled) {
    logger.info('Scheduler', '── Posting to Twitter/X ──');
    const twitterResult = await postToTwitter(content);
    results.push(twitterResult);
  } else {
    logger.warn('Twitter', 'Skipped (not configured)');
    results.push({ platform: 'twitter', success: false, error: 'Not configured' });
  }

  if (config.facebook.enabled) {
    logger.info('Scheduler', '── Posting to Facebook ──');
    const fbResult = await postToFacebook(content);
    results.push(fbResult);
  } else {
    logger.warn('Facebook', 'Skipped (not configured)');
    results.push({ platform: 'facebook', success: false, error: 'Not configured' });
  }

  if (config.instagram.enabled) {
    logger.info('Scheduler', '── Posting to Instagram ──');
    const igResult = await postToInstagram(content);
    results.push(igResult);
  } else {
    logger.warn('Instagram', 'Skipped (not configured)');
    results.push({ platform: 'instagram', success: false, error: 'Not configured' });
  }

  // 3. Move the content file to posted
  markAsPosted(content.queueFile.path, results);

  // 4. Summary
  console.log('\n');
  logger.info('Scheduler', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.info('Scheduler', '📊 POSTING SUMMARY');
  logger.info('Scheduler', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  for (const r of results) {
    if (r.success) {
      logger.success(r.platform, `✅ Posted successfully (ID: ${r.postId})`);
    } else {
      logger.error(r.platform, `❌ Failed: ${r.error}`);
    }
  }

  const successCount = results.filter(r => r.success).length;
  logger.info('Scheduler', `Total: ${successCount}/${results.length} platforms succeeded`);
  logger.info('Scheduler', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  return results;
}

// ── Verify all credentials ──
async function verifyAllCredentials() {
  console.log('\n  🔑 Verifying platform credentials...\n');

  const verifications = {};

  // Twitter
  console.log('  ── Twitter/X ──');
  verifications.twitter = await verifyTwitter();
  console.log('');

  // Facebook
  console.log('  ── Facebook ──');
  verifications.facebook = await verifyFacebook();
  console.log('');

  // Instagram
  console.log('  ── Instagram ──');
  verifications.instagram = await verifyInstagram();
  console.log('');

  // Summary
  console.log('  ╔══════════════════════════════════════╗');
  console.log('  ║      CREDENTIAL STATUS SUMMARY       ║');
  console.log('  ╠══════════════════════════════════════╣');
  console.log(`  ║  🐦 Twitter:   ${verifications.twitter.verified ? '✅ Connected' : '❌ Not Ready'}        ║`);
  console.log(`  ║  📘 Facebook:  ${verifications.facebook.verified ? '✅ Connected' : '❌ Not Ready'}        ║`);
  console.log(`  ║  📸 Instagram: ${verifications.instagram.verified ? '✅ Connected' : '❌ Not Ready'}        ║`);
  console.log('  ╚══════════════════════════════════════╝\n');

  return verifications;
}

// ── Start the scheduler ──
async function startScheduler() {
  showBanner();

  // Verify credentials first
  await verifyAllCredentials();

  // Show queue status
  showQueueStatus();

  // Parse the cron schedule from POST_TIME
  const [hours, minutes] = config.postTime.split(':');
  const cronExpression = `${minutes} ${hours} * * *`; // Run daily at the specified time

  logger.info('Scheduler', `⏰ Daily posting scheduled at ${config.postTime} (${config.timezone})`);
  logger.info('Scheduler', `📅 Cron expression: ${cronExpression}`);
  logger.info('Scheduler', 'Waiting for next scheduled run...\n');
  logger.info('Scheduler', 'Press Ctrl+C to stop the scheduler.\n');

  // Schedule the daily post
  cron.schedule(cronExpression, async () => {
    logger.info('Scheduler', '⏰ Scheduled time reached! Starting post cycle...');
    await postToAllPlatforms();
  }, {
    timezone: config.timezone,
    scheduled: true,
  });
}

// ── Main ──
const command = process.argv[2];

switch (command) {
  case '--post-now':
  case 'post-now':
    showBanner();
    await postToAllPlatforms();
    process.exit(0);
    break;

  case '--verify':
  case 'verify':
    showBanner();
    await verifyAllCredentials();
    process.exit(0);
    break;

  case '--status':
  case 'status':
    showBanner();
    showQueueStatus();
    process.exit(0);
    break;

  default:
    startScheduler();
    break;
}

export { postToAllPlatforms, verifyAllCredentials };
