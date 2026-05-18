import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import NewsCard from '~/components/news/NewsCard.vue'
import type { NewsDto } from '~/types/news'

const news: NewsDto = {
  id: '11111111-1111-4111-8111-111111111111',
  title: 'Nuxt card metadata now shows views',
  slug: 'nuxt-card-metadata-now-shows-views',
  summary: 'A concise summary for testing the news card metadata row.',
  content: '<p>Rendered content is not used in the card.</p>',
  thumbnailUrl: null,
  categoryId: '22222222-2222-4222-8222-222222222222',
  category: {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Product',
    slug: 'product',
    createdAt: '2026-05-18T10:00:00.000Z',
    updatedAt: '2026-05-18T10:00:00.000Z',
  },
  authorId: null,
  status: 'published',
  viewCount: 1200,
  publishedAt: '2026-05-18T12:00:00+07:00',
  createdAt: '2026-05-18T10:00:00.000Z',
  updatedAt: '2026-05-18T10:00:00.000Z',
}

describe('NewsCard', () => {
  it('renders category, publish date, and compact view count metadata', async () => {
    const wrapper = await mountSuspended(NewsCard, {
      props: { news },
      route: '/',
    })

    expect(wrapper.text()).toContain('Product')
    expect(wrapper.text()).toContain('18/05/2026')
    expect(wrapper.text()).toContain('1.2K')
    expect(wrapper.text()).toContain(news.title)
    expect(wrapper.find('a').attributes('href')).toBe(`/news/${news.slug}`)
  })
})
