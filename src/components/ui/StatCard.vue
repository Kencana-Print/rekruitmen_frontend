<script setup lang="ts">
import type { Component } from 'vue'

withDefaults(
  defineProps<{
    label?: string
    value?: string | number
    icon?: Component
    color?: string
    alert?: boolean
    subtitle?: string
  }>(),
  { label: '', value: '', color: '#0F52BA', alert: false, subtitle: '' }
)

defineEmits<{ (e: 'click'): void }>()
</script>

<template>
  <button
    class="card text-left w-full hover:shadow-card-hover hover:scale-[1.02] transition-all duration-200 relative overflow-hidden"
    @click="$emit('click')"
  >
    <span
      v-if="alert"
      class="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse"
    />
    <div class="flex items-start gap-3">
      <div
        class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        :style="{ background: color + '18' }"
      >
        <component :is="icon" v-if="icon" :size="20" :style="{ color }" />
      </div>
      <div>
        <p class="text-xs text-slate-500 font-medium leading-tight">{{ label }}</p>
        <p class="text-2xl font-display font-bold mt-0.5" :style="{ color }">{{ value }}</p>
        <p v-if="subtitle" class="text-xs text-red-500 font-medium mt-0.5 leading-tight">
          {{ subtitle }}
        </p>
      </div>
    </div>
  </button>
</template>
