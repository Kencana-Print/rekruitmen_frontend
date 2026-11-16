<script setup lang="ts">
withDefaults(defineProps<{ size?: number | string; class?: string }>(), { size: 24, class: '' })
</script>

<template>
  <span class="inline-flex items-center justify-center icon-anim icon-scale" :class="$props.class">
    <svg :width="Number(size)" :height="Number(size)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 10.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12.5" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  </span>
</template>
