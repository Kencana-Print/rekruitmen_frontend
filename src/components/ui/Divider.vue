<script setup lang="ts">
withDefaults(defineProps<{ class?: string }>(), { class: '' })
</script>

<template>
  <div class="border-t border-slate-100" :class="$props.class" />
</template>
