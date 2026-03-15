import { verifyAllCredentials } from './scheduler.js';

/**
 * Setup and verify all credentials
 * Usage: npm run setup
 */
console.log('\n🔧 Verifying Social Media Automation Setup...\n');
await verifyAllCredentials();
process.exit(0);
