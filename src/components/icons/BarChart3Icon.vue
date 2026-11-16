<script setup lang="ts">
withDefaults(defineProps<{ size?: number | string; class?: string }>(), { size: 24, class: '' })
</script>

<template>
  <span class="inline-flex items-center justify-center icon-anim icon-scale" :class="$props.class">
    <svg :width="Number(size)" :height="Number(size)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  </span>
</template>
