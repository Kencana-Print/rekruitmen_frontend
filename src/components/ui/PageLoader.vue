<script setup lang="ts">
import Spinner from './Spinner.vue'
withDefaults(defineProps<{ message?: string }>(), { message: 'Memuat...' })
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-[70vh] w-full gap-3 text-slate-400">
    <Spinner :size="32" />
    <span class="text-sm font-medium">{{ message }}</span>
  </div>
</template>
