import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';

const IMGBB_URL = 'https://api.imgbb.com/1/upload';

function isRemoteUrl(value) {
  return /^https?:\/\//i.test(value || '');
}

async function uploadToImgbb(localPath) {
  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) {
    return null;
  }

  const image = fs.readFileSync(localPath, { encoding: 'base64' });
  const payload = new URLSearchParams({
    key: apiKey,
    image,
    name: path.basename(localPath),
  });

  const response = await axios.post(IMGBB_URL, payload.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  return response.data?.data?.url || null;
}

export async function getPublicImageUrl(source) {
  if (!source) {
    return null;
  }

  if (isRemoteUrl(source)) {
    return source;
  }

  const localPath = path.resolve(source);
  if (!fs.existsSync(localPath)) {
    return null;
  }

  return uploadToImgbb(localPath);
}
