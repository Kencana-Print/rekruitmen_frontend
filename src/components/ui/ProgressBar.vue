<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    value?: number
    color?: string
    animated?: boolean
    class?: string
  }>(),
  { value: 0, color: '#0F52BA', animated: true, class: '' }
)

const pct = computed(() => Math.min(Math.max(props.value ?? 0, 0), 100))
</script>

<template>
  <div class="h-2 bg-slate-100 rounded-full overflow-hidden" :class="$props.class">
    <div
      class="h-full rounded-full"
      :class="animated ? 'progress-animated' : ''"
      :style="{ width: pct + '%', background: color, transition: 'width 0.5s ease-out' }"
    />
  </div>
</template>
