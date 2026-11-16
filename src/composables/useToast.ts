import { reactive } from 'vue'

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'loading'

export interface ToastItem {
  id: number
  type: ToastType
  message: string
  icon?: string
  duration: number
  style?: Record<string, string>
}

export interface ToastOptions {
  id?: number
  duration?: number
  icon?: string
  style?: Record<string, string>
  type?: ToastType
}

const state = reactive<{ items: ToastItem[] }>({ items: [] })
let seq = 1
const timers = new Map<number, ReturnType<typeof setTimeout>>()

function remove(id: number) {
  const idx = state.items.findIndex((t) => t.id === id)
  if (idx !== -1) state.items.splice(idx, 1)
  const timer = timers.get(id)
  if (timer) {
    clearTimeout(timer)
    timers.delete(id)
  }
}

function push(type: ToastType, message: string, opts: ToastOptions = {}): number {
  const id = opts.id ?? seq++
  const duration = opts.duration ?? (type === 'loading' ? 0 : 4000)

  const existing = state.items.findIndex((t) => t.id === id)
  const item: ToastItem = {
    id,
    type: opts.type ?? type,
    message,
    icon: opts.icon,
    duration,
    style: opts.style,
  }

  if (existing !== -1) state.items.splice(existing, 1)
  state.items.push(item)

  const oldTimer = timers.get(id)
  if (oldTimer) clearTimeout(oldTimer)
  if (duration > 0) {
    timers.set(
      id,
      setTimeout(() => remove(id), duration)
    )
  }

  return id
}

interface ToastFn {
  (message: string, opts?: ToastOptions): number
  success: (message: string, opts?: ToastOptions) => number
  error: (message: string, opts?: ToastOptions) => number
  info: (message: string, opts?: ToastOptions) => number
  warning: (message: string, opts?: ToastOptions) => number
  loading: (message: string, opts?: ToastOptions) => number
  dismiss: (id?: number) => void
}

const toast = ((message: string, opts?: ToastOptions) =>
  push('info', message, opts)) as ToastFn

toast.success = (message, opts) => push('success', message, opts)
toast.error = (message, opts) => push('error', message, opts)
toast.info = (message, opts) => push('info', message, opts)
toast.warning = (message, opts) => push('warning', message, opts)
toast.loading = (message, opts) => push('loading', message, opts)
toast.dismiss = (id?: number) => {
  if (id === undefined) {
    state.items.slice().forEach((t) => remove(t.id))
    return
  }
  remove(id)
}

/** Dipakai komponen ToastHost untuk merender daftar toast. */
export function useToastState() {
  return state
}

export default toast
