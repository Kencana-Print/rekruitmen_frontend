<script setup lang="ts">
withDefaults(defineProps<{ size?: number | string; class?: string }>(), { size: 24, class: '' })
</script>

<template>
  <span class="inline-flex items-center justify-center icon-anim icon-scale" :class="$props.class">
    <svg :width="Number(size)" :height="Number(size)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  </span>
</template>
