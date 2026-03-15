import { TwitterApi } from 'twitter-api-v2';
import config from './config.js';
import logger from '../utils/logger.js';
import { formatForPlatform } from '../utils/html-parser.js';

let client = null;

function getClient() {
  if (!client) {
    if (!config.twitter.enabled) {
      throw new Error('Twitter API not configured. Check your .env file.');
    }

    client = new TwitterApi({
      appKey: config.twitter.apiKey,
      appSecret: config.twitter.apiSecret,
      accessToken: config.twitter.accessToken,
      accessSecret: config.twitter.accessTokenSecret,
    });
  }

  return client;
}

export async function postToTwitter(parsedContent) {
  logger.info('Twitter', 'Preparing tweet...');

  try {
    const twitterClient = getClient();
    const rwClient = twitterClient.readWrite;
    const tweetText = formatForPlatform(parsedContent, 'twitter', 280);

    logger.info('Twitter', `Tweet content (${tweetText.length}/280 chars):`);
    logger.debug('Twitter', tweetText);

    const result = await rwClient.v2.tweet(tweetText);

    logger.success('Twitter', `Tweet posted! ID: ${result.data.id}`);
    logger.success('Twitter', `View at: https://twitter.com/i/web/status/${result.data.id}`);

    return {
      success: true,
      platform: 'twitter',
      postId: result.data.id,
      postUrl: `https://twitter.com/i/web/status/${result.data.id}`,
      content: tweetText,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Twitter', `Failed to post tweet: ${error.message}`);

    if (error.code === 403) {
      logger.error('Twitter', 'Access denied. Ensure your app has Read+Write permissions.');
    }

    if (error.code === 429) {
      logger.error('Twitter', 'Rate limit exceeded. Free tier allows 1,500 tweets/month.');
    }

    return {
      success: false,
      platform: 'twitter',
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

export async function verifyTwitter() {
  try {
    if (!config.twitter.enabled) {
      return { verified: false, reason: 'Not configured' };
    }

    const twitterClient = getClient();
    const me = await twitterClient.v2.me();

    logger.success('Twitter', `Authenticated as: @${me.data.username} (${me.data.name})`);
    return {
      verified: true,
      username: me.data.username,
      name: me.data.name,
    };
  } catch (error) {
    logger.error('Twitter', `Verification failed: ${error.message}`);
    return { verified: false, reason: error.message };
  }
}

export default { postToTwitter, verifyTwitter };
