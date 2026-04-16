import axios from 'axios';
import config from './config.js';
import logger from '../utils/logger.js';
import { formatForPlatform } from '../utils/html-parser.js';
import { getPublicImageUrl } from '../utils/image-host.js';

const FB_API_BASE = `https://graph.facebook.com/${config.facebook.apiVersion}`;
const LOG_SCOPE = 'Facebook-RoyalKing';

async function postText(pageId, accessToken, message) {
  const url = `${FB_API_BASE}/${pageId}/feed`;
  const response = await axios.post(url, {
    message,
    access_token: accessToken,
  });
  return response.data;
}

async function postPhoto(pageId, accessToken, message, imageUrl) {
  const url = `${FB_API_BASE}/${pageId}/photos`;
  const response = await axios.post(url, {
    message,
    url: imageUrl,
    access_token: accessToken,
  });
  return response.data;
}

async function postLink(pageId, accessToken, message, link) {
  const url = `${FB_API_BASE}/${pageId}/feed`;
  const response = await axios.post(url, {
    message,
    link,
    access_token: accessToken,
  });
  return response.data;
}

export async function postToFacebook(parsedContent) {
  logger.info(LOG_SCOPE, 'Preparing Facebook post...');

  try {
    if (!config.facebook.enabled) {
      throw new Error('Facebook API not configured. Check your .env file.');
    }

    const { pageId, pageAccessToken } = config.facebook;
    const message = formatForPlatform(parsedContent, 'facebook');

    logger.info(LOG_SCOPE, `Post content (${message.length} chars)`);
    logger.debug(LOG_SCOPE, message);

    let result;

    if (parsedContent.images.length > 0) {
      const imageUrl = await getPublicImageUrl(parsedContent.images[0].src);
      if (imageUrl) {
        logger.info(LOG_SCOPE, 'Posting with image...');
        result = await postPhoto(pageId, pageAccessToken, message, imageUrl);
      } else {
        logger.warn(LOG_SCOPE, 'Image URL not accessible, posting text only');
        result = await postText(pageId, pageAccessToken, message);
      }
    } else if (parsedContent.links.length > 0) {
      logger.info(LOG_SCOPE, 'Posting with link...');
      result = await postLink(pageId, pageAccessToken, message, parsedContent.links[0].href);
    } else {
      logger.info(LOG_SCOPE, 'Posting text...');
      result = await postText(pageId, pageAccessToken, message);
    }

    const postId = result.id || result.post_id;
    logger.success(LOG_SCOPE, `Post published! ID: ${postId}`);

    return {
      success: true,
      platform: 'facebook-royalking',
      postId,
      postUrl: `https://facebook.com/${postId}`,
      content: message,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    logger.error(LOG_SCOPE, `Failed to post: ${errorMsg}`);

    if (error.response?.data?.error?.code === 190) {
      logger.error(LOG_SCOPE, 'Access token expired! Generate a new one at:');
      logger.error(LOG_SCOPE, 'https://developers.facebook.com/tools/explorer/');
    }

    return {
      success: false,
      platform: 'facebook-royalking',
      error: errorMsg,
      timestamp: new Date().toISOString(),
    };
  }
}

export async function verifyFacebook() {
  try {
    if (!config.facebook.enabled) {
      return { verified: false, reason: 'Not configured' };
    }

    const { pageId, pageAccessToken } = config.facebook;
    const url = `${FB_API_BASE}/${pageId}?fields=name&access_token=${pageAccessToken}`;
    const response = await axios.get(url);

    logger.success(LOG_SCOPE, `Connected to Page: "${response.data.name}"`);

    return {
      verified: true,
      pageName: response.data.name,
    };
  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    logger.error(LOG_SCOPE, `Verification failed: ${errorMsg}`);
    return { verified: false, reason: errorMsg };
  }
}

export default { postToFacebook, verifyFacebook };
