import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
  // ── Base Paths ──
  rootDir: __dirname,
  contentQueueDir: path.join(__dirname, 'content-queue'),
  postedDir: path.join(__dirname, 'posted'),
  logsDir: path.join(__dirname, 'logs'),

  // ── Twitter Config ──
  twitter: {
    apiKey: process.env.TWITTER_API_KEY,
    apiSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    enabled: !!(process.env.TWITTER_API_KEY && process.env.TWITTER_API_KEY !== 'your_api_key_here'),
    maxCharacters: 280,
  },

  // ── Facebook Config ──
  facebook: {
    pageId: process.env.FACEBOOK_PAGE_ID,
    pageAccessToken: process.env.FACEBOOK_PAGE_ACCESS_TOKEN,
    enabled: !!(process.env.FACEBOOK_PAGE_ID && process.env.FACEBOOK_PAGE_ID !== 'your_page_id_here'),
    apiVersion: 'v21.0',
    maxCharacters: 63206,
  },

  // ── Instagram Config ──
  instagram: {
    businessAccountId: process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID,
    accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
    enabled: !!(process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID && process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID !== 'your_instagram_business_account_id'),
    apiVersion: 'v21.0',
    maxCharacters: 2200,
    maxHashtags: 30,
  },

  // ── Image Hosting ──
  imgbb: {
    apiKey: process.env.IMGBB_API_KEY,
    enabled: !!(process.env.IMGBB_API_KEY && process.env.IMGBB_API_KEY !== 'your_imgbb_api_key_here'),
  },

  // ── Scheduler ──
  postTime: process.env.POST_TIME || '09:00',
  timezone: process.env.TIMEZONE || 'Asia/Kolkata',

  // ── Content Settings ──
  content: {
    defaultHashtags: ['#automation', '#socialmedia'],
    supportedFormats: ['.html', '.htm', '.txt', '.md'],
  },
};

export default config;
