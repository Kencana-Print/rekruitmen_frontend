<script setup lang="ts">
withDefaults(defineProps<{ bars?: number }>(), { bars: 3 })
</script>

<template>
  <div class="card space-y-4">
    <div class="skeleton h-5 w-52" />
    <div v-for="i in bars" :key="i" class="space-y-1.5">
      <div class="flex justify-between">
        <div class="skeleton h-4 w-40" />
        <div class="skeleton h-4 w-16" />
      </div>
      <div class="skeleton h-2 w-full rounded-full" />
    </div>
  </div>
</template>
