import fs from 'fs-extra';
import path from 'path';
import config from './config.js';
import logger from './utils/logger.js';
import { parseFile } from './utils/html-parser.js';

/**
 * Content Manager
 * Manages the queue of content files to be posted.
 * 
 * Workflow:
 * 1. Drop HTML/TXT/MD files into the "content-queue" folder
 * 2. The scheduler picks the oldest file
 * 3. After posting, file moves to "posted" folder
 * 4. A JSON record is saved with post results
 */

// Ensure directories exist
fs.ensureDirSync(config.contentQueueDir);
fs.ensureDirSync(config.postedDir);

const HISTORY_FILE = path.join(config.rootDir, 'post-history.json');

/**
 * Get all queued content files, sorted by creation date (oldest first)
 */
export function getQueuedFiles() {
  const files = fs.readdirSync(config.contentQueueDir)
    .filter(f => {
      const ext = path.extname(f).toLowerCase();
      return config.content.supportedFormats.includes(ext);
    })
    .map(f => {
      const filePath = path.join(config.contentQueueDir, f);
      const stats = fs.statSync(filePath);
      return {
        name: f,
        path: filePath,
        created: stats.birthtime,
        size: stats.size,
      };
    })
    .sort((a, b) => a.created - b.created); // Oldest first

  return files;
}

/**
 * Get the next content file to post
 */
export function getNextContent() {
  const files = getQueuedFiles();

  if (files.length === 0) {
    logger.warn('Content', 'No content files in queue! Add files to: content-queue/');
    return null;
  }

  logger.info('Content', `${files.length} file(s) in queue. Next: ${files[0].name}`);
  return files[0];
}

/**
 * Parse the next content file and return post-ready data
 */
export function parseNextContent() {
  const file = getNextContent();
  if (!file) return null;

  try {
    const parsed = parseFile(file.path);
    parsed.queueFile = file;
    return parsed;
  } catch (error) {
    logger.error('Content', `Failed to parse ${file.name}: ${error.message}`);
    return null;
  }
}

/**
 * Move a posted file from queue to posted directory
 */
export function markAsPosted(filePath, results) {
  const fileName = path.basename(filePath);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const newName = `${timestamp}_${fileName}`;
  const newPath = path.join(config.postedDir, newName);

  // Move the file
  fs.moveSync(filePath, newPath, { overwrite: true });
  logger.info('Content', `Moved to posted: ${newName}`);

  // Save posting results alongside the file
  const resultPath = newPath + '.results.json';
  fs.writeJsonSync(resultPath, {
    originalFile: fileName,
    postedAt: new Date().toISOString(),
    results,
  }, { spaces: 2 });

  // Update history
  updateHistory(fileName, results);
}

/**
 * Update the post history JSON file
 */
function updateHistory(fileName, results) {
  let history = [];
  if (fs.existsSync(HISTORY_FILE)) {
    history = fs.readJsonSync(HISTORY_FILE);
  }

  history.push({
    file: fileName,
    postedAt: new Date().toISOString(),
    results: results.map(r => ({
      platform: r.platform,
      success: r.success,
      postId: r.postId || null,
      error: r.error || null,
    })),
  });

  fs.writeJsonSync(HISTORY_FILE, history, { spaces: 2 });
}

/**
 * Get posting history
 */
export function getHistory() {
  if (!fs.existsSync(HISTORY_FILE)) return [];
  return fs.readJsonSync(HISTORY_FILE);
}

/**
 * Show queue status
 */
export function showQueueStatus() {
  const files = getQueuedFiles();
  const history = getHistory();

  console.log('\n' + '═'.repeat(60));
  console.log('  📋  CONTENT QUEUE STATUS');
  console.log('═'.repeat(60));
  console.log(`  📂  Queue directory: ${config.contentQueueDir}`);
  console.log(`  📄  Files waiting:   ${files.length}`);
  console.log(`  ✅  Total posted:    ${history.length}`);
  console.log('─'.repeat(60));

  if (files.length > 0) {
    console.log('  Queued files (oldest first):');
    files.forEach((f, i) => {
      console.log(`  ${i + 1}. ${f.name} (${(f.size / 1024).toFixed(1)}KB)`);
    });
  } else {
    console.log('  ⚠️  No files in queue! Add HTML/TXT/MD files to:');
    console.log(`     ${config.contentQueueDir}`);
  }

  console.log('═'.repeat(60) + '\n');
}

export default {
  getQueuedFiles,
  getNextContent,
  parseNextContent,
  markAsPosted,
  getHistory,
  showQueueStatus,
};
