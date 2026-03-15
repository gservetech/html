import fs from 'fs-extra';
import path from 'path';
import { load } from 'cheerio';

const HASHTAG_REGEX = /(^|\s)(#[\p{L}\p{N}_-]+)/gu;
const LINK_REGEX = /https?:\/\/[^\s)]+/g;
const IMAGE_MD_REGEX = /!\[[^\]]*]\(([^)]+)\)/g;

function normalizeWhitespace(value) {
  return (value || '').replace(/\s+/g, ' ').trim();
}

function dedupe(items) {
  return [...new Set(items.filter(Boolean))];
}

function extractHashtags(text) {
  return dedupe([...text.matchAll(HASHTAG_REGEX)].map((match) => match[2].trim()));
}

function resolveAsset(filePath, assetPath) {
  if (!assetPath) {
    return assetPath;
  }

  if (/^https?:\/\//i.test(assetPath)) {
    return assetPath;
  }

  if (path.isAbsolute(assetPath)) {
    return assetPath;
  }

  return path.resolve(path.dirname(filePath), assetPath);
}

function parseHtml(filePath, source) {
  const $ = load(source);
  const title = normalizeWhitespace($('article h1').first().text())
    || normalizeWhitespace($('h1').first().text())
    || normalizeWhitespace($('title').first().text())
    || path.basename(filePath, path.extname(filePath));
  const description = normalizeWhitespace($('meta[name="description"]').attr('content'));
  const paragraphs = $('article p, body p')
    .map((_, element) => normalizeWhitespace($(element).text()))
    .get()
    .filter(Boolean);
  const links = $('a[href]')
    .map((_, element) => ({
      href: $(element).attr('href'),
      text: normalizeWhitespace($(element).text()),
    }))
    .get()
    .filter((link) => !!link.href);
  const images = $('img[src]')
    .map((_, element) => ({
      src: resolveAsset(filePath, $(element).attr('src')),
      alt: normalizeWhitespace($(element).attr('alt')),
      originalSrc: $(element).attr('src'),
    }))
    .get()
    .filter((image) => !!image.src);

  const hashtagText = paragraphs.join('\n');
  const hashtags = extractHashtags(hashtagText);
  const bodyParagraphs = paragraphs.filter((paragraph) => {
    if (paragraph === title) {
      return false;
    }

    const compact = paragraph.replace(/\s+/g, ' ').trim();
    const withoutTags = compact.replace(HASHTAG_REGEX, ' ').replace(/\s+/g, ' ').trim();
    return withoutTags.length > 0;
  });
  const body = bodyParagraphs.join('\n\n') || description;

  return {
    title,
    description,
    body,
    paragraphs: bodyParagraphs,
    links,
    images,
    hashtags,
    rawText: normalizeWhitespace($('body').text()) || normalizeWhitespace(source),
  };
}

function parseText(filePath, source) {
  const lines = source.split(/\r?\n/).map((line) => line.trim());
  const contentLines = lines.filter(Boolean);
  const firstLine = contentLines[0] || path.basename(filePath, path.extname(filePath));
  const title = normalizeWhitespace(firstLine.replace(/^#+\s*/, ''));
  const bodyLines = contentLines.slice(1);
  const body = normalizeWhitespace(bodyLines.join('\n')) || title;
  const links = dedupe([...(source.match(LINK_REGEX) || [])]).map((href) => ({ href, text: href }));
  const images = [...source.matchAll(IMAGE_MD_REGEX)].map((match) => ({
    src: resolveAsset(filePath, match[1]),
    alt: '',
    originalSrc: match[1],
  }));
  const hashtags = extractHashtags(source);

  return {
    title,
    description: body.slice(0, 160),
    body,
    paragraphs: bodyLines,
    links,
    images,
    hashtags,
    rawText: normalizeWhitespace(source),
  };
}

export function parseFile(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const ext = path.extname(filePath).toLowerCase();
  const parsed = ['.html', '.htm'].includes(ext)
    ? parseHtml(filePath, source)
    : parseText(filePath, source);

  return {
    ...parsed,
    filePath,
  };
}

function shorten(text, maxCharacters) {
  if (!maxCharacters || text.length <= maxCharacters) {
    return text;
  }

  const shortened = text.slice(0, Math.max(0, maxCharacters - 1));
  const lastSpace = shortened.lastIndexOf(' ');
  const safe = lastSpace > 40 ? shortened.slice(0, lastSpace) : shortened;
  return `${safe.trim()}…`;
}

export function formatForPlatform(parsedContent, platform, maxCharacters = Number.POSITIVE_INFINITY) {
  const title = normalizeWhitespace(parsedContent.title);
  const body = normalizeWhitespace(parsedContent.body);
  const hashtags = dedupe(parsedContent.hashtags || []);
  const links = (parsedContent.links || []).map((link) => link.href).filter(Boolean);

  const parts = [];

  if (title) {
    parts.push(title);
  }

  if (body && body !== title) {
    parts.push(body);
  }

  if (platform !== 'facebook' && links.length > 0) {
    parts.push(links[0]);
  }

  if (hashtags.length > 0) {
    const hashtagLimit = platform === 'instagram' ? 30 : hashtags.length;
    parts.push(hashtags.slice(0, hashtagLimit).join(' '));
  }

  return shorten(parts.filter(Boolean).join('\n\n'), maxCharacters);
}
