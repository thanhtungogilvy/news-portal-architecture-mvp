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

// ---------------------------------------------------------------------------
// Detect the next pagination page URL from a listing page document
// ---------------------------------------------------------------------------
const NEXT_PAGE_SELECTORS = [
  'a[rel="next"]',       // standard
  'a.next_page',         // VnExpress
  '.btn-page a.next',
  '.pagination a.next',
  'li.next a[href]',
]

function findNextPageUrl(doc: Document, currentUrl: string, origin: string): string | null {
  // 1. Semantic next-page link
  for (const sel of NEXT_PAGE_SELECTORS) {
    const el = doc.querySelector(sel) as HTMLAnchorElement | null
    if (el?.href) {
      try {
        const u = new URL(el.href)
        if (u.origin === origin && u.href !== currentUrl) return u.href
      }
      catch { /* skip */ }
    }
  }

  // 2. VnExpress / common pattern: find the currently active page number and link to n+1
  const pageLinks = Array.from(
    doc.querySelectorAll('.btn-page a[href], .pagination a[href], [class*="page"] a[href]'),
  ) as HTMLAnchorElement[]

  // Find active/current page number
  const activePage = doc.querySelector(
    '.btn-page strong, .btn-page .active, .pagination .active, [class*="page"] .active',
  )
  const currentPageNum = activePage ? Number.parseInt(activePage.textContent?.trim() ?? '', 10) : NaN

  if (!Number.isNaN(currentPageNum)) {
    const nextNum = currentPageNum + 1
    const nextLink = pageLinks.find((a) => a.textContent?.trim() === String(nextNum))
    if (nextLink?.href) {
      try {
        const u = new URL(nextLink.href)
        if (u.origin === origin) return u.href
      }
      catch { /* skip */ }
    }
  }

  // 3. VnExpress URL pattern: base-p2, base-p3
  try {
    const baseUrl = currentUrl.replace(/-p(\d+)$/, '')
    const match = currentUrl.match(/-p(\d+)$/)
    const currentP = match ? Number.parseInt(match[1] ?? '1', 10) : 1
    const nextP = currentP + 1
    const nextUrl = `${baseUrl}-p${nextP}`
    // Verify this page actually exists by checking if any pagination link points to it
    const nextUrlObj = new URL(nextUrl)
    const hasNextLink = pageLinks.some((a) => {
      try { return a.href && (new URL(a.href).href === nextUrl || new URL(a.href).pathname === nextUrlObj.pathname) }
      catch { return false }
    })
    if (hasNextLink) return nextUrl
  }
  catch { /* skip */ }

  return null
}

function collectLinksFromDoc(doc: Document, origin: string, seen: Set<string>): void {
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
  }

  // Sweep all links matching article URL pattern
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

export interface ExtractLinksResult {
  urls: string[]
  discovered: number
}

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; NewsImportBot/1.0)',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.5',
}

export async function extractArticleLinks(
  listingUrl: string,
  maxItems: number,
): Promise<ExtractLinksResult> {
  const origin = new URL(listingUrl).origin
  const seen = new Set<string>()
  let currentUrl: string | null = listingUrl
  let pagesFetched = 0
  const MAX_PAGES = 10

  while (currentUrl && seen.size < maxItems && pagesFetched < MAX_PAGES) {
    const response = await fetch(currentUrl, {
      headers: FETCH_HEADERS,
      signal: AbortSignal.timeout(10_000),
    })

    if (!response.ok) {
      if (pagesFetched === 0) throw new Error(`HTTP ${response.status} fetching listing page`)
      break // stop pagination on error
    }

    const html = await response.text()
    const dom = new JSDOM(html, { url: currentUrl })
    const doc = dom.window.document

    collectLinksFromDoc(doc, origin, seen)
    pagesFetched++

    if (seen.size >= maxItems) break

    currentUrl = findNextPageUrl(doc, currentUrl, origin)
  }

  const all = Array.from(seen)
  return {
    urls: all.slice(0, maxItems),
    discovered: all.length,
  }
}

export { generateSlug } from '../../../app/utils/format/slug'
