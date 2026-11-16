<script setup lang="ts">
withDefaults(defineProps<{ size?: number | string; class?: string }>(), { size: 24, class: '' })
</script>

<template>
  <span class="inline-flex items-center justify-center icon-anim icon-scale" :class="$props.class">
    <svg :width="Number(size)" :height="Number(size)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
      <path d="M10 22v-4a2 2 0 0 1 4 0v4" />
      <path d="M10 6h4" />
      <path d="M10 10h4" />
      <path d="M14 14h4" />
      <path d="M6 16H2" />
    </svg>
  </span>
</template>
