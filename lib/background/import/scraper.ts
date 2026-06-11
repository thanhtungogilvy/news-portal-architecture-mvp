import { JSDOM } from 'jsdom'
import sanitizeHtml from 'sanitize-html'

export interface ScrapedArticle {
  title: string
  summary: string | null
  content: string
  thumbnailUrl: string | null
  authorName: string | null
}

// ---------------------------------------------------------------------------
// HTML tag allowlist — matches server/utils/sanitize.ts
// ---------------------------------------------------------------------------
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'strong', 'em', 'u', 's', 'a', 'ul', 'ol', 'li',
    'blockquote', 'code', 'pre', 'h2', 'h3', 'h4', 'img', 'hr',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title'],
  },
  allowedSchemes: ['http', 'https'],
  exclusiveFilter: (frame) => frame.tag === 'img' && !frame.attribs.src,
  disallowedTagsMode: 'discard',
}

const LAZY_IMG_ATTRS = ['data-src', 'data-original', 'data-lazy-src', 'data-url'] as const

function resolveImageUrl(rawUrl: string, pageUrl: string): string | null {
  const trimmed = rawUrl.trim()
  if (!trimmed) return null

  const lower = trimmed.toLowerCase()
  if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('vbscript:')) {
    return null
  }

  try {
    if (trimmed.startsWith('//')) return `https:${trimmed}`
    const resolved = new URL(trimmed, pageUrl).href
    const protocol = new URL(resolved).protocol
    if (protocol !== 'http:' && protocol !== 'https:') return null
    return resolved
  }
  catch {
    return null
  }
}

function normalizeContentImages(rawHtml: string, pageUrl: string): string {
  const dom = new JSDOM(`<div id="__root">${rawHtml}</div>`, { url: pageUrl })
  const doc = dom.window.document
  const root = doc.getElementById('__root')
  if (!root) return rawHtml

  for (const img of root.querySelectorAll('img')) {
    let srcCandidate = img.getAttribute('src')

    if (!srcCandidate) {
      for (const attr of LAZY_IMG_ATTRS) {
        const candidate = img.getAttribute(attr)
        if (candidate) {
          srcCandidate = candidate
          break
        }
      }
    }

    if (!srcCandidate) {
      const srcset = img.getAttribute('srcset')
      if (srcset) {
        const first = srcset
          .split(',')
          .map((part) => part.trim().split(/\s+/)[0])
          .find(Boolean)
        if (first) srcCandidate = first
      }
    }

    const normalizedSrc = srcCandidate ? resolveImageUrl(srcCandidate, pageUrl) : null

    if (!normalizedSrc) {
      img.remove()
      continue
    }

    img.setAttribute('src', normalizedSrc)
    img.removeAttribute('srcset')
    for (const attr of LAZY_IMG_ATTRS) {
      img.removeAttribute(attr)
    }
  }

  return root.innerHTML
}

// ---------------------------------------------------------------------------
// Ordered selectors for article body extraction (most specific → generic)
// ---------------------------------------------------------------------------
const ARTICLE_BODY_SELECTORS = [
  '[itemprop="articleBody"]',
  '.fck_detail',           // VnExpress
  '.article-body',
  '.article-content',
  '.post-content',
  '.entry-content',
  '.content-detail',
  'article',
  'main',
]

// ---------------------------------------------------------------------------
// Extract Open Graph / meta content
// ---------------------------------------------------------------------------
function metaContent(doc: Document, ...selectors: string[]): string | null {
  for (const sel of selectors) {
    const el = doc.querySelector(sel)
    const value = el?.getAttribute('content') ?? el?.textContent
    if (value?.trim()) return value.trim()
  }
  return null
}

// ---------------------------------------------------------------------------
// Extract article body HTML from the DOM
// ---------------------------------------------------------------------------
function extractBody(doc: Document): string {
  for (const selector of ARTICLE_BODY_SELECTORS) {
    const el = doc.querySelector(selector)
    if (el) {
      // Remove noise elements inside the body
      for (const noise of el.querySelectorAll('script, style, .advertisement, .ads, [class*="social"], [class*="related"]')) {
        noise.remove()
      }
      const html = el.innerHTML.trim()
      if (html.length > 200) return html
    }
  }

  // Last-resort: all paragraphs
  const paragraphs = Array.from(doc.querySelectorAll('p'))
    .map((p) => p.outerHTML)
    .join('\n')
  return paragraphs || '<p></p>'
}

// ---------------------------------------------------------------------------
// Main scrape function
// ---------------------------------------------------------------------------
export async function scrapeArticle(url: string): Promise<ScrapedArticle> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; NewsImportBot/1.0)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.5',
    },
    signal: AbortSignal.timeout(15_000),
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${url}`)
  }

  const html = await response.text()
  const dom = new JSDOM(html, { url })
  const doc = dom.window.document

  // --- Title ---
  const title = metaContent(
    doc,
    'meta[property="og:title"]',
    'meta[name="twitter:title"]',
  ) ?? doc.querySelector('h1')?.textContent?.trim() ?? doc.title?.trim() ?? 'Untitled'

  // --- Summary ---
  const summary = metaContent(
    doc,
    'meta[property="og:description"]',
    'meta[name="description"]',
    'meta[name="twitter:description"]',
  )

  // --- Thumbnail ---
  const thumbnailUrl = metaContent(
    doc,
    'meta[property="og:image"]',
    'meta[name="twitter:image"]',
  )

  // --- Author ---
  const authorName = metaContent(
    doc,
    'meta[name="author"]',
    'meta[property="article:author"]',
  ) ?? doc.querySelector('[itemprop="author"] [itemprop="name"]')?.textContent?.trim() ?? null

  // --- Content ---
  const rawBody = extractBody(doc)
  const normalizedBody = normalizeContentImages(rawBody, url)
  const content = sanitizeHtml(normalizedBody, SANITIZE_OPTIONS)

  if (!title) throw new Error('Could not extract article title')
  if (!content || content.length < 50) throw new Error('Could not extract article content')

  return {
    title: title.slice(0, 500),
    summary: summary ? summary.slice(0, 1000) : null,
    content,
    thumbnailUrl: thumbnailUrl ?? null,
    authorName: authorName ? authorName.slice(0, 200) : null,
  }
}

export { generateSlug } from '../../../app/utils/format/slug'
