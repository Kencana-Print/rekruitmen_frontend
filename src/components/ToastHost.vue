<script setup lang="ts">
import { CheckCircle2, XCircle, Info, AlertTriangle, Loader2 } from 'lucide-vue-next'
import { useToastState, type ToastType } from '@/composables/useToast'

const state = useToastState()

const icons: Record<ToastType, any> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
  loading: Loader2,
}

const iconColor: Record<ToastType, string> = {
  success: '#22c55e',
  error: '#ef4444',
  info: '#0F52BA',
  warning: '#f59e0b',
  loading: '#0F52BA',
}
</script>

<template>
  <div class="fixed bottom-4 right-4 z-[9998] flex flex-col gap-2 items-end pointer-events-none">
    <div
      v-for="t in state.items"
      :key="t.id"
      class="toast-item pointer-events-auto flex items-start gap-2.5 rounded-xl bg-white px-4 py-3 shadow-lg border border-slate-100 max-w-sm"
      :style="t.style"
    >
      <span v-if="t.icon" class="text-base leading-none mt-0.5">{{ t.icon }}</span>
      <component
        :is="icons[t.type]"
        v-else
        :size="18"
        class="shrink-0 mt-0.5"
        :class="t.type === 'loading' ? 'animate-spin' : ''"
        :style="{ color: iconColor[t.type] }"
      />
      <p class="text-sm font-medium leading-snug" style="color: inherit">{{ t.message }}</p>
    </div>
  </div>
</template>
