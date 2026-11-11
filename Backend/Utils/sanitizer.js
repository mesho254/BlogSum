const sanitizeHtml = require('sanitize-html');

/**
 * Editorial Content Sanitizer for Story Bodies (Rich Text)
 * Strips dangerous executable tags, event handlers, and malicious protocols
 * while preserving legitimate typography, styling, images, and code blocks.
 */
const sanitizeStoryContent = (dirty) => {
  if (!dirty || typeof dirty !== 'string') return '';

  return sanitizeHtml(dirty, {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'a', 'b', 'i', 'strong', 'em', 'strike', 's', 'u',
      'code', 'pre', 'hr', 'br', 'div', 'span',
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
      'blockquote', 'ol', 'ul', 'li',
      'img', 'figure', 'figcaption',
    ],
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel', 'title'],
      img: ['src', 'alt', 'title', 'width', 'height', 'loading', 'class'],
      code: ['class'],
      pre: ['class'],
      span: ['class', 'style'],
      p: ['class', 'style'],
      div: ['class', 'style'],
      th: ['colspan', 'rowspan', 'style'],
      td: ['colspan', 'rowspan', 'style'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: {
      img: ['http', 'https', 'data'],
    },
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href || '';
        // If external link, add safe noopener noreferrer
        if (href.startsWith('http://') || href.startsWith('https://')) {
          return {
            tagName: 'a',
            attribs: {
              ...attribs,
              target: '_blank',
              rel: 'noopener noreferrer',
            },
          };
        }
        return { tagName: 'a', attribs };
      },
    },
  });
};

/**
 * Lightweight Sanitizer for Comments and Discussion Threads
 * Restricts to essential typography, prohibiting images, iframes, and tables.
 */
const sanitizeCommentContent = (dirty) => {
  if (!dirty || typeof dirty !== 'string') return '';

  return sanitizeHtml(dirty, {
    allowedTags: ['p', 'b', 'i', 'strong', 'em', 'code', 'pre', 'br', 'a', 'blockquote'],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
    },
    allowedSchemes: ['http', 'https'],
    transformTags: {
      a: (tagName, attribs) => ({
        tagName: 'a',
        attribs: {
          ...attribs,
          target: '_blank',
          rel: 'noopener noreferrer nofollow',
        },
      }),
    },
  });
};

/**
 * Plain Text Sanitizer for Headings, Subtitles, Tags, and Author Bio
 * Strips all HTML tags entirely.
 */
const sanitizePlainText = (dirty) => {
  if (!dirty || typeof dirty !== 'string') return '';
  return sanitizeHtml(dirty, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
};

module.exports = {
  sanitizeStoryContent,
  sanitizeCommentContent,
  sanitizePlainText,
};

