import { computed, ref, watch, type Ref } from 'vue'

/**
 * usePagination — client-side pagination.
 *
 * @param data        ref berisi seluruh data
 * @param itemsPerPage jumlah baris per halaman
 * @param resetKey    ref yang berubah saat filter berubah → reset ke halaman 1
 */
export function usePagination<T>(
  data: Ref<T[]>,
  itemsPerPage = 15,
  resetKey: Ref<unknown> | null = null,
  initialPage = 1
) {
  const currentPage = ref(initialPage)

  // Reset ke halaman 1 HANYA jika resetKey (filter) benar-benar berubah
  if (resetKey) {
    let prev = resetKey.value
    watch(resetKey, (val) => {
      if (prev !== val) {
        currentPage.value = 1
        prev = val
      }
    })
  }

  const totalPages = computed(() => Math.max(1, Math.ceil(data.value.length / itemsPerPage)))

  const paginatedData = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage
    return data.value.slice(start, start + itemsPerPage)
  })

  const totalItems = computed(() => data.value.length)

  // Guard: jika halaman melebihi total (data berkurang saat loading), kembali ke halaman terakhir
  watch(
    [totalPages, () => data.value.length],
    () => {
      if (data.value.length > 0 && currentPage.value > totalPages.value) {
        currentPage.value = totalPages.value
      }
    }
  )

  function setCurrentPage(page: number) {
    currentPage.value = Math.min(Math.max(1, page), totalPages.value)
  }

  return {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedData,
    totalItems,
  }
}
