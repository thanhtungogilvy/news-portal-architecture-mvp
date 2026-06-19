import { useDebounceFn } from '@vueuse/core'
import type { ApiSuccess } from '~/types/api'
import type { SearchResult } from '~/types/search'

export interface UseSemanticSearchOptions {
  debounceMs?: number
}

export function useSemanticSearch(options: UseSemanticSearchOptions = {}) {
  const { debounceMs = 600 } = options
  const router = useRouter()
  const route = useRoute()

  const query = ref<string>(route.query.q?.toString() || '')

  // SSR-compatible initial fetch — static key + watch:false prevents auto-refetch on keystroke
  const initialQ = route.query.q?.toString() || ''
  const { data: initialData } = useAsyncData(
    `search-init-${initialQ}`,
    async () => {
      if (!initialQ.trim()) return null
      return await $fetch<ApiSuccess<SearchResult[]>>('/api/search', {
        query: { q: initialQ, ...(route.query.category && { category: route.query.category }) },
      })
    },
    { watch: [] },
  )

  // Client-side search state (takes over after initial)
  const clientResults = ref<SearchResult[] | null>(null)
  const pending = ref(false)
  const error = ref<Error | null>(null)

  // Combine: client results override initial SSR results
  const results = computed<SearchResult[]>(() =>
    clientResults.value ?? initialData.value?.data ?? [],
  )

  async function doSearch(q: string) {
    if (!q.trim()) return
    pending.value = true
    error.value = null
    try {
      const data = await $fetch<ApiSuccess<SearchResult[]>>('/api/search', {
        query: { q, ...(route.query.category && { category: route.query.category }) },
      })
      clientResults.value = data.data ?? []
    }
    catch (err) {
      error.value = err as Error
      clientResults.value = []
    }
    finally {
      pending.value = false
    }
  }

  const debouncedSearch = useDebounceFn(async () => {
    const q = query.value.trim()
    if (!q) {
      clientResults.value = null
      return
    }
    await doSearch(q)
  }, debounceMs)

  // Update URL only on explicit submit (Enter / search button)
  async function commitSearch() {
    const q = query.value.trim()
    if (!q) return
    await router.push({
      path: '/search',
      query: {
        q,
        ...(route.query.category && { category: route.query.category }),
        ...(route.query.debug && { debug: route.query.debug }),
      },
    })
    await doSearch(q)
  }

  watch(query, () => {
    debouncedSearch()
  })

  const refresh = () => doSearch(query.value)

  return { query, results, pending, error, refresh, commitSearch }
}
