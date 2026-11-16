<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string | number
    bg?: string
    text?: string
    class?: string
  }>(),
  { bg: '#f1f5f9', text: '#475569', class: '' }
)
</script>

<template>
  <span
    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
    :class="$props.class"
    :style="{ background: bg, color: text }"
  >
    {{ label }}
  </span>
</template>
