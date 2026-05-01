import fs from 'fs-extra';
import path from 'path';
import config from './config.js';
import logger from '../utils/logger.js';
import { parseFile } from '../utils/html-parser.js';

fs.ensureDirSync(config.contentQueueDir);
fs.ensureDirSync(config.postedDir);

const HISTORY_FILE = path.join(config.rootDir, 'post-history.json');

export function getQueuedFiles() {
  return fs.readdirSync(config.contentQueueDir)
    .filter(fileName => {
      const ext = path.extname(fileName).toLowerCase();
      return config.content.supportedFormats.includes(ext);
    })
    .map(fileName => {
      const filePath = path.join(config.contentQueueDir, fileName);
      const stats = fs.statSync(filePath);
      return {
        name: fileName,
        path: filePath,
        created: stats.birthtime,
        size: stats.size,
      };
    })
    .sort((a, b) => a.created - b.created);
}

export function getLastPostedFile() {
  if (!fs.existsSync(config.postedDir)) return null;

  const postedFiles = fs.readdirSync(config.postedDir)
    .filter(f => {
      const ext = path.extname(f).toLowerCase();
      return config.content.supportedFormats.includes(ext);
    })
    .map(f => ({
      name: f,
      path: path.join(config.postedDir, f),
      modified: fs.statSync(path.join(config.postedDir, f)).mtime,
    }))
    .sort((a, b) => b.modified - a.modified);

  return postedFiles.length > 0 ? postedFiles[0] : null;
}

export function getNextContent() {
  const files = getQueuedFiles();

  if (files.length === 0) {
    logger.warn('Content', 'No new content in queue. Checking posted folder for repost...');
    const lastPosted = getLastPostedFile();
    if (lastPosted) {
      logger.info('Content', `Reposting previous post: ${lastPosted.name}`);
      return { ...lastPosted, isRepost: true };
    }
    logger.warn('Content', `No content anywhere! Add files to: ${config.contentQueueDir}`);
    return null;
  }

  logger.info('Content', `${files.length} Facebook file(s) in queue. Next: ${files[0].name}`);
  return files[0];
}

export function parseNextContent() {
  const file = getNextContent();
  if (!file) {
    return null;
  }

  try {
    const parsed = parseFile(file.path);
    parsed.queueFile = file;
    parsed.isRepost = file.isRepost || false;
    return parsed;
  } catch (error) {
    logger.error('Content', `Failed to parse ${file.name}: ${error.message}`);
    return null;
  }
}

export function markAsPosted(filePath, results) {
  const fileName = path.basename(filePath);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const newName = `${timestamp}_${fileName}`;
  const newPath = path.join(config.postedDir, newName);

  fs.moveSync(filePath, newPath, { overwrite: true });
  logger.info('Content', `Moved to Facebook posted: ${newName}`);

  const resultPath = `${newPath}.results.json`;
  fs.writeJsonSync(resultPath, {
    originalFile: fileName,
    postedAt: new Date().toISOString(),
    results,
  }, { spaces: 2 });

  updateHistory(fileName, results);
}

function updateHistory(fileName, results) {
  const history = fs.existsSync(HISTORY_FILE) ? fs.readJsonSync(HISTORY_FILE) : [];

  history.push({
    file: fileName,
    postedAt: new Date().toISOString(),
    results: results.map(result => ({
      platform: result.platform,
      success: result.success,
      postId: result.postId || null,
      error: result.error || null,
    })),
  });

  fs.writeJsonSync(HISTORY_FILE, history, { spaces: 2 });
}

export function getHistory() {
  if (!fs.existsSync(HISTORY_FILE)) {
    return [];
  }

  return fs.readJsonSync(HISTORY_FILE);
}

export function showQueueStatus() {
  const files = getQueuedFiles();
  const history = getHistory();

  console.log(`\n${'═'.repeat(60)}`);
  console.log('  📋  FACEBOOK CONTENT QUEUE STATUS');
  console.log('═'.repeat(60));
  console.log(`  📂  Queue directory: ${config.contentQueueDir}`);
  console.log(`  📄  Files waiting:   ${files.length}`);
  console.log(`  ✅  Total posted:    ${history.length}`);
  console.log('─'.repeat(60));

  if (files.length > 0) {
    console.log('  Queued files (oldest first):');
    files.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);
    });
  } else {
    console.log('  ⚠️  No files in queue! Add HTML/TXT/MD files to:');
    console.log(`     ${config.contentQueueDir}`);
  }

  console.log(`${'═'.repeat(60)}\n`);
}

export default {
  getQueuedFiles,
  getNextContent,
  getLastPostedFile,
  parseNextContent,
  markAsPosted,
  getHistory,
  showQueueStatus,
};
