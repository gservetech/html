import fs from 'fs-extra';
import path from 'path';
import readline from 'readline';
import config from './config.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function main() {
  console.log('\n');
  console.log('  ╔══════════════════════════════════════════════════╗');
  console.log('  ║   ROYALKING FACEBOOK - ADD CONTENT              ║');
  console.log('  ║   Create a new post for the RoyalKing Page      ║');
  console.log('  ╚══════════════════════════════════════════════════╝');
  console.log('');

  const title = await ask('  📌 Post Title: ');
  const body = await ask('  📝 Post Body (one line): ');
  const link = await ask('  🔗 Link URL (optional, press Enter to skip): ');
  const hashtags = await ask('  #️⃣  Hashtags (comma separated, e.g. tech,ai,coding): ');
  const imageUrl = await ask('  🖼️  Image URL (optional, press Enter to skip): ');

  let html = `<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <meta name="description" content="${body.substring(0, 160)}">
</head>
<body>
  <article>
    <h1>${title}</h1>
    <p>${body}</p>
`;

  if (imageUrl.trim()) {
    html += `    <img src="${imageUrl.trim()}" alt="${title}">\n`;
  }

  if (link.trim()) {
    html += `    <a href="${link.trim()}">Read More</a>\n`;
  }

  if (hashtags.trim()) {
    const tags = hashtags.split(',').map(tag => `#${tag.trim()}`).join(' ');
    html += `    <p>${tags}</p>\n`;
  }

  html += `  </article>
</body>
</html>`;

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);

  const date = new Date().toISOString().split('T')[0];
  const fileName = `${date}-${slug}.html`;
  const filePath = path.join(config.contentQueueDir, fileName);

  fs.ensureDirSync(config.contentQueueDir);
  fs.writeFileSync(filePath, html);

  console.log('\n  ✅ Content added to the RoyalKing Facebook queue!');
  console.log(`  📂 File: ${fileName}`);
  console.log(`  📍 Path: ${filePath}`);
  console.log('\n  Run "npm run fb:royalking:post" from the repo root.\n');

  rl.close();
  process.exit(0);
}

main();
