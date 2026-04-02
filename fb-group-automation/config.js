import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(workspaceRoot, '.env') });

function resolveBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

const config = {
  rootDir: __dirname,
  workspaceRoot,
  contentQueueDir: path.join(__dirname, 'content-queue'),
  postedDir: path.join(__dirname, 'posted'),
  logsDir: path.join(__dirname, 'logs'),

  facebookGroup: {
    url: process.env.FACEBOOK_GROUP_URL,
    postAsName: process.env.FACEBOOK_GROUP_POST_AS_NAME,
    browserProfileDir: process.env.FACEBOOK_GROUP_BROWSER_PROFILE_DIR
      ? path.resolve(workspaceRoot, process.env.FACEBOOK_GROUP_BROWSER_PROFILE_DIR)
      : path.join(workspaceRoot, '.facebook-group-browser-profile'),
    headless: resolveBoolean(process.env.FACEBOOK_GROUP_HEADLESS, false),
    timeoutMs: Number(process.env.FACEBOOK_GROUP_TIMEOUT_MS || 120000),
    enabled: !!(
      process.env.FACEBOOK_GROUP_URL
      && process.env.FACEBOOK_GROUP_URL !== 'https://www.facebook.com/groups/your-group-id/'
    ),
  },

  postTime: process.env.FACEBOOK_GROUP_POST_TIME || process.env.POST_TIME || '09:00',
  timezone: process.env.FACEBOOK_GROUP_TIMEZONE || process.env.TIMEZONE || 'Asia/Kolkata',

  content: {
    supportedFormats: ['.html', '.htm', '.txt', '.md'],
  },
};

export default config;
