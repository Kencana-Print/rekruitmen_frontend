<script setup lang="ts">
import { Search, X } from 'lucide-vue-next'

withDefaults(
  defineProps<{ modelValue?: string; placeholder?: string; class?: string }>(),
  { modelValue: '', placeholder: 'Cari...', class: '' }
)

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()
</script>

<template>
  <div class="relative" :class="$props.class">
    <Search
      :size="16"
      class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
    />
    <input
      class="input pl-9 pr-9"
      :placeholder="placeholder"
      :value="modelValue"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <button
      v-if="modelValue"
      class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
      @click="emit('update:modelValue', '')"
    >
      <X :size="14" />
    </button>
  </div>
</template>
