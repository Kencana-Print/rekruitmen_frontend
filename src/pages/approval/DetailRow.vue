<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string
    value?: string | number | null
    mono?: boolean
  }>(),
  { label: '', value: '', mono: false }
)
</script>

<template>
  <div class="flex items-center gap-1.5">
    <span class="text-slate-400"><slot name="icon" /></span>
    <span class="text-xs text-slate-400">{{ label }}:</span>
    <span class="text-xs font-medium text-slate-700" :class="mono ? 'font-mono' : ''">
      {{ value || '–' }}
    </span>
  </div>
</template>
