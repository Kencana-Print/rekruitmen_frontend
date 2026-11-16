<script setup lang="ts">
import { Info } from 'lucide-vue-next'
import type { Component } from 'vue'

withDefaults(
  defineProps<{
    message?: string
    icon?: Component
    actionLabel?: string
  }>(),
  { message: 'Tidak ada data', icon: () => Info, actionLabel: '' }
)

defineEmits<{ (e: 'action'): void }>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
    <component :is="icon" :size="48" :stroke-width="1.3" />
    <p class="text-sm text-center max-w-xs leading-relaxed">{{ message }}</p>
    <slot name="action">
      <button v-if="actionLabel" class="btn-primary mt-2" @click="$emit('action')">
        {{ actionLabel }}
      </button>
    </slot>
  </div>
</template>
