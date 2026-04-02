import { startGroupLoginSession } from './browser-poster.js';

console.log('\n');
console.log('  ╔══════════════════════════════════════════════╗');
console.log('  ║   👤 FACEBOOK GROUP LOGIN                    ║');
console.log('  ╚══════════════════════════════════════════════╝');
console.log('');

await startGroupLoginSession();
process.exit(0);
