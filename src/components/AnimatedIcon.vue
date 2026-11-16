<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    variant?: 'scale' | 'slideRight' | 'spin' | 'wiggle' | 'pulse'
    class?: string
  }>(),
  { variant: 'scale', class: '' }
)

const innerClass = computed(
  () =>
    ({
      scale: 'icon-scale',
      slideRight: 'icon-slide-right',
      spin: 'icon-spin',
      wiggle: 'icon-wiggle',
      pulse: '',
    })[props.variant]
)

const pulseStyle = computed(() =>
  props.variant === 'pulse'
    ? { animation: 'badgePop 1.5s ease-in-out infinite' }
    : undefined
)
</script>

<template>
  <span class="group/icon inline-flex items-center justify-center" :class="$props.class">
    <span class="icon-anim inline-flex items-center justify-center" :class="innerClass" :style="pulseStyle">
      <slot />
    </span>
  </span>
</template>
