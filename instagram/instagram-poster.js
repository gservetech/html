import axios from 'axios';
import config from './config.js';
import logger from '../utils/logger.js';
import { formatForPlatform } from '../utils/html-parser.js';
import { getPublicImageUrl } from '../utils/image-host.js';

const IG_API_BASE = `https://graph.facebook.com/${config.instagram.apiVersion}`;

async function createMediaContainer(accountId, accessToken, imageUrl, caption) {
  const url = `${IG_API_BASE}/${accountId}/media`;
  const response = await axios.post(url, {
    image_url: imageUrl,
    caption,
    access_token: accessToken,
  });
  return response.data.id;
}

async function createCarouselItemContainer(accountId, accessToken, imageUrl) {
  const url = `${IG_API_BASE}/${accountId}/media`;
  const response = await axios.post(url, {
    image_url: imageUrl,
    is_carousel_item: true,
    access_token: accessToken,
  });
  return response.data.id;
}

async function createCarouselContainer(accountId, accessToken, caption, childrenIds) {
  const url = `${IG_API_BASE}/${accountId}/media`;
  const response = await axios.post(url, {
    caption,
    media_type: 'CAROUSEL',
    children: childrenIds.join(','),
    access_token: accessToken,
  });
  return response.data.id;
}

async function publishMedia(accountId, accessToken, creationId) {
  const url = `${IG_API_BASE}/${accountId}/media_publish`;
  const response = await axios.post(url, {
    creation_id: creationId,
    access_token: accessToken,
  });
  return response.data;
}

async function waitForMediaReady(containerId, accessToken, maxWait = 30) {
  for (let attempt = 0; attempt < maxWait; attempt += 1) {
    const url = `${IG_API_BASE}/${containerId}?fields=status_code&access_token=${accessToken}`;
    const response = await axios.get(url);
    const status = response.data.status_code;

    if (status === 'FINISHED') {
      return true;
    }

    if (status === 'ERROR') {
      throw new Error('Media container processing failed');
    }

    logger.debug('Instagram', `Media processing... (${status}) waiting...`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  throw new Error('Media processing timed out');
}

export async function postToInstagram(parsedContent) {
  logger.info('Instagram', 'Preparing Instagram post...');

  try {
    if (!config.instagram.enabled) {
      throw new Error('Instagram API not configured. Check your .env file.');
    }

    const { businessAccountId, accessToken } = config.instagram;
    const caption = formatForPlatform(parsedContent, 'instagram');

    logger.info('Instagram', `Caption (${caption.length}/2200 chars)`);
    logger.debug('Instagram', caption);

    if (parsedContent.images.length === 0) {
      logger.warn('Instagram', 'No image found in content. Instagram requires an image.');
      return {
        success: false,
        platform: 'instagram',
        error: 'No image found. Instagram requires at least one image.',
        timestamp: new Date().toISOString(),
      };
    }

    const imageUrl = await getPublicImageUrl(parsedContent.images[0].src);
    if (!imageUrl) {
      logger.error('Instagram', 'Could not get public image URL. Configure imgBB API key.');
      return {
        success: false,
        platform: 'instagram',
        error: 'Image hosting failed. Set IMGBB_API_KEY in .env',
        timestamp: new Date().toISOString(),
      };
    }

    logger.info('Instagram', 'Creating media container...');
    let containerId;

    if (parsedContent.images.length > 1 && parsedContent.images.length <= 10) {
      logger.info('Instagram', `Creating carousel with ${parsedContent.images.length} images...`);

      const childIds = [];
      for (const image of parsedContent.images.slice(0, 10)) {
        const publicUrl = await getPublicImageUrl(image.src);
        if (publicUrl) {
          const childId = await createCarouselItemContainer(businessAccountId, accessToken, publicUrl);
          childIds.push(childId);
        }
      }

      if (childIds.length >= 2) {
        containerId = await createCarouselContainer(businessAccountId, accessToken, caption, childIds);
      } else {
        containerId = await createMediaContainer(businessAccountId, accessToken, imageUrl, caption);
      }
    } else {
      containerId = await createMediaContainer(businessAccountId, accessToken, imageUrl, caption);
    }

    logger.info('Instagram', 'Waiting for media processing...');
    await waitForMediaReady(containerId, accessToken);

    logger.info('Instagram', 'Publishing...');
    const result = await publishMedia(businessAccountId, accessToken, containerId);

    logger.success('Instagram', `Post published! Media ID: ${result.id}`);

    return {
      success: true,
      platform: 'instagram',
      postId: result.id,
      content: caption,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    logger.error('Instagram', `Failed to post: ${errorMsg}`);

    if (error.response?.data?.error?.code === 190) {
      logger.error('Instagram', 'Access token expired! Regenerate at:');
      logger.error('Instagram', 'https://developers.facebook.com/tools/explorer/');
    }

    if (errorMsg.includes('MEDIA_TYPE_NOT_SUPPORTED')) {
      logger.error('Instagram', 'Image format not supported. Use JPEG or PNG.');
    }

    return {
      success: false,
      platform: 'instagram',
      error: errorMsg,
      timestamp: new Date().toISOString(),
    };
  }
}

export async function verifyInstagram() {
  try {
    if (!config.instagram.enabled) {
      return { verified: false, reason: 'Not configured' };
    }

    const { businessAccountId, accessToken } = config.instagram;
    const url = `${IG_API_BASE}/${businessAccountId}?fields=username,name,followers_count,media_count&access_token=${accessToken}`;
    const response = await axios.get(url);

    logger.success('Instagram', `Connected: @${response.data.username} (${response.data.name})`);
    logger.success('Instagram', `Followers: ${response.data.followers_count} | Posts: ${response.data.media_count}`);

    return {
      verified: true,
      username: response.data.username,
      name: response.data.name,
      followers: response.data.followers_count,
    };
  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    logger.error('Instagram', `Verification failed: ${errorMsg}`);
    return { verified: false, reason: errorMsg };
  }
}

export default { postToInstagram, verifyInstagram };
