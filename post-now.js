import { postToAllPlatforms } from './scheduler.js';

/**
 * Post immediately - one-time run
 * Usage: npm run post-now
 */
console.log('\n🚀 Posting to all platforms NOW...\n');
const results = await postToAllPlatforms();
process.exit(results ? 0 : 1);
