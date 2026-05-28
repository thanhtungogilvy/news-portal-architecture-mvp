import sanitizeHtml from 'sanitize-html'

/**
 * Server-side HTML sanitizer for news article content.
 * Runs in Node.js (Nitro) before content is sent to the client,
 * preventing XSS in both SSR-rendered HTML and client-side rendering.
 * Configuration mirrors the client-side DOMPurify setup in app/utils/sanitize/html.ts.
 */
const CONTENT_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'strong', 'em', 'u', 's', 'a', 'ul', 'ol', 'li',
    'blockquote', 'code', 'pre', 'h2', 'h3', 'h4', 'img', 'hr',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  exclusiveFilter: (frame) => frame.tag === 'img' && !frame.attribs.src,
  disallowedTagsMode: 'discard',
}

export function sanitizeNewsContent(html: string): string {
  return sanitizeHtml(html, CONTENT_SANITIZE_OPTIONS)
}
