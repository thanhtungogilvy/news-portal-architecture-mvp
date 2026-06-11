/**
 * crawler.ts — Extract article links from a listing/category page.
 *
 * Uses node-html-parser (pure JS, CJS + ESM compatible) instead of jsdom so
 * this module is safe to import inside the Nitro server bundle on Vercel.
 * jsdom v29 has a transitive ESM-only dep (html-encoding-sniffer →
 * @exodus/bytes) that crashes when loaded via require() in Nitro's CJS output.
 *
 * scraper.ts keeps jsdom for full article scraping — that code only runs in
 * the standalone worker (Node.js ESM, no Rollup bundling).
 */

import { parse } from 'node-html-parser'
import type { HTMLElement as NHPElement } from 'node-html-parser'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// URL patterns that indicate an article (not a category/tag/page)
const ARTICLE_URL_RE = /\/[a-z0-9-]*\d{5,}[a-z0-9-]*\.(html?|aspx)$/i

function isLikelyArticleUrl(rawHref: string, listingOrigin: string): boolean {
  try {
    const u = new URL(rawHref)
    if (u.origin !== listingOrigin) return false
    if (u.pathname === '/' || u.pathname === '') return false
    return ARTICLE_URL_RE.test(u.pathname)
  }
  catch {
    return false
  }
}

/** Resolve a possibly-relative href against the page URL. */
function resolveHref(href: string, pageUrl: string): string | null {
  if (!href || href.startsWith('javascript:') || href.startsWith('#')) return null
  try {
    return new URL(href, pageUrl).href
  }
  catch {
    return null
  }
}

// Selectors that reliably point to article titles on Vietnamese news sites.
// node-html-parser supports basic CSS selectors (tag, class, attribute, combinators).
const ARTICLE_LINK_SELECTORS = [
  // VnExpress
  'h3.title-news a',
  'h4.title-news a',
  '.title-news a',
  // Generic news
  'article h2 a',
  'article h3 a',
  '.article-item h2 a',
  '.article-item h3 a',
  '.news-item h2 a',
  '.news-item h3 a',
  '.item-news h3 a',
  // Wide fallback
  'h2 a',
  'h3 a',
  'h4 a',
]

const NEXT_PAGE_SELECTORS = [
  'a[rel="next"]',
  'a.next_page',
  '.btn-page a.next',
  '.pagination a.next',
  'li.next a',
]

function collectLinks(root: NHPElement, origin: string, pageUrl: string, seen: Set<string>): void {
  // Pass 1 — targeted selectors (higher precision)
  for (const selector of ARTICLE_LINK_SELECTORS) {
    try {
      for (const el of root.querySelectorAll(selector)) {
        const href = resolveHref(el.getAttribute('href') ?? '', pageUrl)
        if (href && isLikelyArticleUrl(href, origin)) {
          const u = new URL(href)
          u.search = ''
          u.hash = ''
          seen.add(u.href)
        }
      }
    }
    catch { /* invalid selector on this page — skip */ }
  }

  // Pass 2 — sweep all <a href> matching article URL pattern
  for (const el of root.querySelectorAll('a')) {
    const href = resolveHref(el.getAttribute('href') ?? '', pageUrl)
    if (href && isLikelyArticleUrl(href, origin)) {
      const u = new URL(href)
      u.search = ''
      u.hash = ''
      seen.add(u.href)
    }
  }
}

function findNextPageUrl(root: NHPElement, currentUrl: string, origin: string): string | null {
  // 1. Semantic next-page selectors
  for (const selector of NEXT_PAGE_SELECTORS) {
    try {
      const el = root.querySelector(selector)
      if (el) {
        const href = resolveHref(el.getAttribute('href') ?? '', currentUrl)
        if (href) {
          try {
            const u = new URL(href)
            if (u.origin === origin && u.href !== currentUrl) return u.href
          }
          catch { /* skip */ }
        }
      }
    }
    catch { /* invalid selector */ }
  }

  // 2. Numeric pagination — find active page, then link to page+1
  const pageLinks = root.querySelectorAll('.btn-page a, .pagination a')
  let currentPageNum = NaN

  const activeEl = root.querySelector(
    '.btn-page strong, .btn-page .active, .pagination .active',
  )
  if (activeEl) {
    currentPageNum = Number.parseInt(activeEl.text.trim(), 10)
  }

  if (!Number.isNaN(currentPageNum)) {
    const nextNum = currentPageNum + 1
    const nextLink = pageLinks.find((a) => a.text.trim() === String(nextNum))
    if (nextLink) {
      const href = resolveHref(nextLink.getAttribute('href') ?? '', currentUrl)
      if (href) {
        try {
          const u = new URL(href)
          if (u.origin === origin) return u.href
        }
        catch { /* skip */ }
      }
    }
  }

  // 3. VnExpress URL pattern: base-p2, base-p3
  try {
    const baseUrl = currentUrl.replace(/-p(\d+)$/, '')
    const match = currentUrl.match(/-p(\d+)$/)
    const currentP = match ? Number.parseInt(match[1] ?? '1', 10) : 1
    const nextP = currentP + 1
    const nextUrl = `${baseUrl}-p${nextP}`
    const nextUrlObj = new URL(nextUrl)
    const hasNextLink = pageLinks.some((a) => {
      const href = resolveHref(a.getAttribute('href') ?? '', currentUrl)
      if (!href) return false
      try {
        const u = new URL(href)
        return u.href === nextUrl || u.pathname === nextUrlObj.pathname
      }
      catch { return false }
    })
    if (hasNextLink) return nextUrl
  }
  catch { /* skip */ }

  return null
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

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
    const root = parse(html, { blockTextElements: { script: false, style: false } })

    collectLinks(root, origin, currentUrl, seen)
    pagesFetched++

    if (seen.size >= maxItems) break

    currentUrl = findNextPageUrl(root, currentUrl, origin)
  }

  const all = Array.from(seen)
  return {
    urls: all.slice(0, maxItems),
    discovered: all.length,
  }
}
