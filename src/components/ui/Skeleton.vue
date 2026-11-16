<script setup lang="ts">
defineOptions({ inheritAttrs: false })
defineProps<{ style?: Record<string, string> }>()
</script>

<template>
  <div class="skeleton" v-bind="$attrs" :style="style" />
</template>
