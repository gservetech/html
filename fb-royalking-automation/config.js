import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');
const envPrefix = 'FACEBOOK_ROYALKING';

dotenv.config({ path: path.join(workspaceRoot, '.env') });

const config = {
  rootDir: __dirname,
  workspaceRoot,
  pageLabel: 'RoyalKing',
  envPrefix,
  contentQueueDir: path.join(__dirname, 'content-queue'),
  postedDir: path.join(__dirname, 'posted'),
  logsDir: path.join(__dirname, 'logs'),

  facebook: {
    pageId: process.env[`${envPrefix}_PAGE_ID`],
    pageAccessToken: process.env[`${envPrefix}_PAGE_ACCESS_TOKEN`],
    enabled: !!(
      process.env[`${envPrefix}_PAGE_ID`]
      && process.env[`${envPrefix}_PAGE_ID`] !== 'your_royalking_page_id_here'
    ),
    apiVersion: 'v21.0',
    maxCharacters: 63206,
  },

  imgbb: {
    apiKey: process.env.IMGBB_API_KEY,
    enabled: !!(process.env.IMGBB_API_KEY && process.env.IMGBB_API_KEY !== 'your_imgbb_api_key_here'),
  },

  postTime: process.env[`${envPrefix}_POST_TIME`] || process.env.POST_TIME || '09:00',
  timezone: process.env[`${envPrefix}_TIMEZONE`] || process.env.TIMEZONE || 'Asia/Kolkata',

  content: {
    defaultHashtags: ['#automation', '#socialmedia'],
    supportedFormats: ['.html', '.htm', '.txt', '.md'],
  },
};

export default config;
