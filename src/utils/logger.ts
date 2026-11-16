import api from '@/api/axios'

const isDev = import.meta.env.DEV

const logger = {
  log: (...args: unknown[]) => {
    if (isDev) console.log(...args)
  },
  info: (...args: unknown[]) => {
    if (isDev) console.info(...args)
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn(...args)
  },
  error: (...args: unknown[]) => {
    if (isDev) console.error(...args)
  },

  captureException: (error: any, context: Record<string, any> = {}) => {
    if (isDev) {
      console.error('[Exception]', error, context)
      return
    }

    try {
      const payload = {
        source: 'vue-web',
        message: error?.message || String(error),
        // Production: kirim hanya baris pertama stack (tanpa path internal)
        stack: error?.stack ? error.stack.split('\n').slice(0, 2).join(' | ') : null,
        context: {
          action: context?.action ?? null,
        },
        url: window.location.pathname,
      }

      api.post('/logs', payload).catch(() => undefined)
    } catch {
      /* silent */
    }
  },
}

export default logger
