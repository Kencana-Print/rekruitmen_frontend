import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/**
 * useAsyncData — pengganti ringan useQuery untuk memuat data saat mount.
 *
 * Contoh:
 *   const { data, isLoading, isError, reload } = useAsyncData(
 *     () => recruitmentApi.list().then(r => r.data.data ?? []),
 *     [] as RecruitmentRow[]
 *   )
 */
export function useAsyncData<T>(loader: () => Promise<T>, initial: T) {
  const data = ref(initial) as Ref<T>
  const isLoading = ref(true)
  const isError = ref(false)

  async function load(): Promise<void> {
    isLoading.value = true
    isError.value = false
    try {
      data.value = await loader()
    } catch {
      isError.value = true
    } finally {
      isLoading.value = false
    }
  }

  onMounted(load)

  return { data, isLoading, isError, reload: load, refetch: load }
}

/**
 * useInterval — pemanggilan berkala (pengganti refetchInterval).
 */
export function useInterval(callback: () => void, ms: number) {
  let timer: ReturnType<typeof setInterval> | null = null

  const start = () => {
    stop()
    timer = setInterval(callback, ms)
  }
  const stop = () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  onMounted(start)
  onBeforeUnmount(stop)

  return { start, stop }
}
