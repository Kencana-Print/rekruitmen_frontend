<script setup lang="ts">
import Spinner from './Spinner.vue'
withDefaults(defineProps<{ message?: string }>(), { message: 'Memproses...' })
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/85 backdrop-blur-sm">
      <Spinner :size="44" class="text-sapphire" />
      <span class="mt-4 text-base font-semibold text-sapphire">{{ message }}</span>
    </div>
  </Teleport>
</template>
