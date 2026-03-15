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

  twitter: {
    apiKey: process.env.TWITTER_API_KEY,
    apiSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    enabled: !!(process.env.TWITTER_API_KEY && process.env.TWITTER_API_KEY !== 'your_api_key_here'),
    maxCharacters: 280,
  },

  postTime: process.env.POST_TIME || '09:00',
  timezone: process.env.TIMEZONE || 'Asia/Kolkata',

  content: {
    defaultHashtags: ['#automation', '#socialmedia'],
    supportedFormats: ['.html', '.htm', '.txt', '.md'],
  },
};

export default config;
