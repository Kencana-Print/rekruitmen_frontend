<script setup lang="ts">
export interface TabItem {
  value: string
  label: string
  count?: number
}

defineProps<{ tabs: TabItem[]; modelValue: string }>()
defineEmits<{ (e: 'update:modelValue', value: string): void }>()
</script>

<template>
  <div class="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
    <button
      v-for="t in tabs"
      :key="t.value"
      class="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150"
      :class="modelValue === t.value ? 'bg-white shadow text-sapphire' : 'text-slate-500 hover:text-slate-700'"
      @click="$emit('update:modelValue', t.value)"
    >
      {{ t.label }}
      <span
        v-if="t.count !== undefined"
        class="ml-1.5 px-1.5 py-0.5 rounded-full text-xs"
        :class="modelValue === t.value ? 'bg-sapphire/10 text-sapphire' : 'bg-slate-200 text-slate-500'"
      >
        {{ t.count }}
      </span>
    </button>
  </div>
</template>
