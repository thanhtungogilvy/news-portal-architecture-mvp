import { describe, expect, it } from 'vitest'
import { sanitizeHtml } from '../../app/utils/sanitize/html'

describe('sanitizeHtml', () => {
  it('passes safe semantic HTML through unchanged', () => {
    const input = '<p><strong>Hello</strong> <em>world</em></p>'
    const result = sanitizeHtml(input)
    expect(result).toContain('<strong>Hello</strong>')
    expect(result).toContain('<em>world</em>')
  })

  it('strips <script> tags and their content', () => {
    const input = '<p>Safe</p><script>alert("xss")</script>'
    const result = sanitizeHtml(input)
    expect(result).not.toContain('<script>')
    expect(result).not.toContain('alert')
    expect(result).toContain('<p>Safe</p>')
  })

  it('strips inline event handlers (onclick, onerror, onload)', () => {
    const input = '<img src="https://example.com/img.jpg" onerror="alert(1)" alt="test">'
    const result = sanitizeHtml(input)
    expect(result).not.toContain('onerror')
    expect(result).toContain('src="https://example.com/img.jpg"')
  })

  it('strips data: URI from img src', () => {
    const input = '<img src="data:image/png;base64,abc123" alt="test">'
    const result = sanitizeHtml(input)
    expect(result).not.toContain('data:image')
  })

  it('removes img tags that have no usable src', () => {
    const input = '<p>before</p><img alt="only-alt"><img src="" alt="empty"><p>after</p>'
    const result = sanitizeHtml(input)
    expect(result).not.toContain('<img')
    expect(result).toContain('<p>before</p>')
    expect(result).toContain('<p>after</p>')
  })

  it('strips javascript: href', () => {
    const input = '<a href="javascript:alert(1)">Click</a>'
    const result = sanitizeHtml(input)
    expect(result).not.toContain('javascript:')
  })

  it('preserves plain text content', () => {
    const input = 'Just plain text with no HTML'
    const result = sanitizeHtml(input)
    expect(result).toContain('Just plain text with no HTML')
  })

  it('preserves safe anchor tags with https href', () => {
    const input = '<a href="https://example.com" rel="noopener">Link</a>'
    const result = sanitizeHtml(input)
    // DOMPurify v3 may strip rel in non-browser DOM environments; verify href is preserved
    expect(result).toContain('href="https://example.com"')
    expect(result).toContain('>Link</a>')
  })
})
