<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next'

defineProps<{ message?: string }>()
defineEmits<{ (e: 'retry'): void }>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 gap-3 text-red-500">
    <AlertTriangle :size="40" :stroke-width="1.5" />
    <p class="text-sm text-center max-w-xs text-slate-600 leading-relaxed">{{ message }}</p>
    <button class="btn-secondary" @click="$emit('retry')">Coba Lagi</button>
  </div>
</template>
