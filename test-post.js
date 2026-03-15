import { parseNextContent, showQueueStatus } from './content-manager.js';
import config from './config.js';
import { formatForPlatform } from './utils/html-parser.js';

console.log('\n');
console.log('  ╔══════════════════════════════════════════════╗');
console.log('  ║   🧪 CONTENT PREVIEW                         ║');
console.log('  ║   Preview the next shared post for each app  ║');
console.log('  ╚══════════════════════════════════════════════╝');
console.log('');

showQueueStatus();

const content = parseNextContent();
if (!content) {
  console.log('  ❌ No content in the shared queue.');
  console.log(`  Add HTML/TXT/MD files to: ${config.contentQueueDir}\n`);
  process.exit(1);
}

console.log(`  📄 Next file: ${content.queueFile.name}`);
console.log(`  🏷️  Title: ${content.title}\n`);

const previews = [
  {
    label: 'Twitter/X',
    enabled: config.twitter.enabled,
    content: formatForPlatform(content, 'twitter', config.twitter.maxCharacters),
  },
  {
    label: 'Facebook',
    enabled: config.facebook.enabled,
    content: formatForPlatform(content, 'facebook', config.facebook.maxCharacters),
  },
  {
    label: 'Instagram',
    enabled: config.instagram.enabled,
    content: formatForPlatform(content, 'instagram', config.instagram.maxCharacters),
  },
];

for (const preview of previews) {
  console.log(`  ── ${preview.label} ${preview.enabled ? '' : '(not configured)'}──`);
  console.log(preview.content || '[empty]');
  console.log('');
}

process.exit(0);
