import DOMPurify from 'dompurify'

const SAFE_URI_RE = /^(?:https?|mailto):/i

export function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined') {
    // SSR: content served via /api/news/:slug is already sanitized server-side by
    // sanitizeNewsContent() (server/utils/sanitize.ts) before it reaches this point.
    // Return as-is; the browser will re-sanitize after hydration (defense in depth).
    return html
  }

  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'a', 'ul', 'ol', 'li',
      'blockquote', 'code', 'pre', 'h2', 'h3', 'h4', 'img', 'hr',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel'],
    // Only allow safe URI schemes — blocks data:, javascript:, vbscript: etc.
    ALLOWED_URI_REGEXP: SAFE_URI_RE,
    FORCE_BODY: true,
  })

  // Belt-and-suspenders: explicitly strip any src/href that bypassed DOMPurify
  // (ALLOWED_URI_REGEXP behaviour can vary across DOM environments)
  const parser = new DOMParser()
  const doc = parser.parseFromString(clean, 'text/html')
  doc.querySelectorAll('[src], [href]').forEach((el) => {
    for (const attr of ['src', 'href'] as const) {
      const val = el.getAttribute(attr)
      if (val !== null && val !== '' && !SAFE_URI_RE.test(val)) {
        el.removeAttribute(attr)
      }
    }
  })
  return doc.body.innerHTML
}

