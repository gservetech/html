import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(workspaceRoot, '.env') });

const config = {
  rootDir: __dirname,
  workspaceRoot,
  contentQueueDir: path.join(__dirname, 'content-queue'),
  postedDir: path.join(__dirname, 'posted'),
  logsDir: path.join(__dirname, 'logs'),

  instagram: {
    businessAccountId: process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID,
    accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
    enabled: !!(
      process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID &&
      process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID !== 'your_instagram_business_account_id'
    ),
    apiVersion: 'v21.0',
    maxCharacters: 2200,
    maxHashtags: 30,
  },

  imgbb: {
    apiKey: process.env.IMGBB_API_KEY,
    enabled: !!(process.env.IMGBB_API_KEY && process.env.IMGBB_API_KEY !== 'your_imgbb_api_key_here'),
  },

  postTime: process.env.POST_TIME || '09:00',
  timezone: process.env.TIMEZONE || 'Asia/Kolkata',

  content: {
    defaultHashtags: ['#automation', '#socialmedia'],
    supportedFormats: ['.html', '.htm', '.txt', '.md'],
  },
};

export default config;
