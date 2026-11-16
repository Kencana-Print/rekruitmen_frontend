<script setup lang="ts">
withDefaults(defineProps<{ rows?: number }>(), { rows: 4 })
</script>

<template>
  <div class="card animate-pulse space-y-3">
    <div class="skeleton h-5 w-48" />
    <div v-for="i in rows" :key="i" class="flex gap-3 items-center">
      <div class="skeleton h-4 w-4 rounded-full" />
      <div class="skeleton h-4 flex-1" />
      <div class="skeleton h-4 w-20" />
    </div>
  </div>
</template>
