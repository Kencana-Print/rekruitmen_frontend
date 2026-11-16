<script setup lang="ts">
import { computed } from 'vue'
import { Info, AlertTriangle, CheckCircle2, XCircle } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    type?: 'info' | 'warning' | 'success' | 'error'
    message?: string
    actionLabel?: string
  }>(),
  { type: 'info', message: '', actionLabel: '' }
)

defineEmits<{ (e: 'action'): void }>()

const styles: Record<string, { bg: string; border: string; text: string; Icon: any }> = {
  info: { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', Icon: Info },
  warning: { bg: '#fffbeb', border: '#fde68a', text: '#92400e', Icon: AlertTriangle },
  success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534', Icon: CheckCircle2 },
  error: { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', Icon: XCircle },
}

const theme = computed(() => styles[props.type] ?? styles.info)
</script>

<template>
  <div
    class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm border"
    :style="{ background: theme.bg, borderColor: theme.border, color: theme.text }"
  >
    <component :is="theme.Icon" :size="18" class="shrink-0" />
    <span class="flex-1 font-medium">{{ message }}</span>
    <button v-if="actionLabel" class="text-xs underline font-semibold" @click="$emit('action')">
      {{ actionLabel }}
    </button>
  </div>
</template>
