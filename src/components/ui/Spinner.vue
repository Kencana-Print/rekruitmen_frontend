<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
withDefaults(defineProps<{ size?: number | string; class?: string }>(), {
  size: 20,
  class: '',
})
</script>

<template>
  <Loader2 :size="Number(size)" class="animate-spin text-sapphire" :class="$props.class" />
</template>
