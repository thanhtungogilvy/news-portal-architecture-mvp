import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { defineComponent, nextTick, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ApiSuccess } from '~/types/api'
import type { NewsDto } from '~/types/news'
import { useNewsDetail } from '~/composables/news/useNewsDetail'

const { useFetchMock } = vi.hoisted(() => ({
  useFetchMock: vi.fn(),
}))

mockNuxtImport('useFetch', () => useFetchMock)

function createArticleResponse(viewCount: number): ApiSuccess<NewsDto> {
  return {
    data: {
      id: '11111111-1111-4111-8111-111111111111',
      title: 'Detail page view count',
      slug: 'detail-page-view-count',
      summary: 'Summary',
      content: '<p>Body</p>',
      thumbnailUrl: null,
      categoryId: null,
      category: null,
      authorId: null,
      status: 'published',
      viewCount,
      publishedAt: '2026-05-18T12:00:00+07:00',
      createdAt: '2026-05-18T10:00:00.000Z',
      updatedAt: '2026-05-18T10:00:00.000Z',
    },
  }
}

const Harness = defineComponent({
  setup() {
    const { article, recordView } = useNewsDetail(ref('detail-page-view-count'))
    return { article, recordView }
  },
  template: '<div>{{ article?.viewCount ?? "missing" }}</div>',
})

describe('useNewsDetail', () => {
  beforeEach(() => {
    useFetchMock.mockReset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('increments the local article view count after a successful view record', async () => {
    const data = ref<ApiSuccess<NewsDto> | null>(createArticleResponse(12))
    useFetchMock.mockReturnValue({
      data,
      status: ref('success'),
      error: ref(null),
    })

    const fetchSpy = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('$fetch', fetchSpy)

    const wrapper = await mountSuspended(Harness, { route: '/news/detail-page-view-count' })
    const vm = wrapper.vm as { recordView: (id: string) => Promise<void> }

    await vm.recordView('11111111-1111-4111-8111-111111111111')
    await nextTick()

    expect(fetchSpy).toHaveBeenCalledWith('/api/news/11111111-1111-4111-8111-111111111111/view', { method: 'POST' })
    expect(wrapper.text()).toContain('13')
  })

  it('keeps article state stable if the view request fails', async () => {
    const data = ref<ApiSuccess<NewsDto> | null>(createArticleResponse(7))
    useFetchMock.mockReturnValue({
      data,
      status: ref('success'),
      error: ref(null),
    })

    const fetchSpy = vi.fn().mockRejectedValue(new Error('network failure'))
    vi.stubGlobal('$fetch', fetchSpy)

    const wrapper = await mountSuspended(Harness, { route: '/news/detail-page-view-count' })
    const vm = wrapper.vm as { recordView: (id: string) => Promise<void> }

    await expect(vm.recordView('11111111-1111-4111-8111-111111111111')).resolves.toBeUndefined()
    await nextTick()

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('7')
  })
})
