<script setup lang="ts">
withDefaults(defineProps<{ size?: number | string; class?: string }>(), { size: 24, class: '' })
</script>

<template>
  <span class="inline-flex items-center justify-center icon-anim icon-scale" :class="$props.class">
    <svg :width="Number(size)" :height="Number(size)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M2 12h2.49a2 2 0 0 0 1.92-1.46l2.35-8.36a.25.25 0 0 1 .48 0l5.52 19.64a.25.25 0 0 0 .48 0l2.35-8.36A2 2 0 0 1 19.52 12H22" />
    </svg>
  </span>
</template>
