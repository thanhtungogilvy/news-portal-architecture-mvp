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
  disallowedTagsMode: 'discard',
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
  const content = sanitizeHtml(rawBody, SANITIZE_OPTIONS)

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

// ---------------------------------------------------------------------------
// Extract article links from a listing/category page
// ---------------------------------------------------------------------------

// Selectors that reliably point to article titles on Vietnamese news sites
const ARTICLE_LINK_SELECTORS = [
  // VnExpress
  'h3.title-news a[href]',
  'h4.title-news a[href]',
  '.title-news a[href]',
  // Generic news
  'article h2 a[href]',
  'article h3 a[href]',
  '.article-item h2 a[href]',
  '.article-item h3 a[href]',
  '.news-item h2 a[href]',
  '.news-item h3 a[href]',
  '.item-news h3 a[href]',
  // Wide fallback — h2/h3/h4 links anywhere
  'h2 a[href]',
  'h3 a[href]',
  'h4 a[href]',
]

// URL patterns that indicate an article (not a category/tag/page)
// Matches slugs that contain at least one digit group (common for article IDs)
const ARTICLE_URL_RE = /\/[a-z0-9-]*\d{5,}[a-z0-9-]*\.(html?|aspx)$/i

function isLikelyArticleUrl(href: string, listingOrigin: string): boolean {
  try {
    const u = new URL(href)
    // Same origin or a common CDN/subdomain pattern
    if (u.origin !== listingOrigin) return false
    // Exclude root, category/tag pages (path with no extension and no numeric id)
    if (u.pathname === '/' || u.pathname === '') return false
    // Has article-like URL pattern
    return ARTICLE_URL_RE.test(u.pathname)
  }
  catch {
    return false
  }
}

export interface ExtractLinksResult {
  urls: string[]
  discovered: number
}

export async function extractArticleLinks(
  listingUrl: string,
  maxItems: number,
): Promise<ExtractLinksResult> {
  const response = await fetch(listingUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; NewsImportBot/1.0)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.5',
    },
    signal: AbortSignal.timeout(15_000),
  })

  if (!response.ok) throw new Error(`HTTP ${response.status} fetching listing page`)

  const html = await response.text()
  const dom = new JSDOM(html, { url: listingUrl })
  const doc = dom.window.document
  const origin = new URL(listingUrl).origin

  const seen = new Set<string>()

  // Try targeted selectors first (higher precision)
  for (const selector of ARTICLE_LINK_SELECTORS) {
    const anchors = doc.querySelectorAll(selector)
    for (const a of anchors) {
      const href = (a as HTMLAnchorElement).href
      if (href && isLikelyArticleUrl(href, origin)) {
        const u = new URL(href)
        u.search = ''
        u.hash = ''
        seen.add(u.href)
      }
    }
    if (seen.size >= maxItems * 3) break // enough candidates
  }

  // If still not enough, sweep all links matching article URL pattern
  if (seen.size < maxItems) {
    const allAnchors = doc.querySelectorAll('a[href]')
    for (const a of allAnchors) {
      const href = (a as HTMLAnchorElement).href
      if (href && isLikelyArticleUrl(href, origin)) {
        const u = new URL(href)
        u.search = ''
        u.hash = ''
        seen.add(u.href)
      }
    }
  }

  const all = Array.from(seen)
  return {
    urls: all.slice(0, maxItems),
    discovered: all.length,
  }
}

// ---------------------------------------------------------------------------
// Generate a URL-safe slug from a (possibly Vietnamese) title
// ---------------------------------------------------------------------------
export function generateSlug(title: string): string {
  const base = title
    .replace(/[ĐĐ]/g, 'D')
    .replace(/[đ]/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip combining diacritics
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100)

  return base || 'article'
}
