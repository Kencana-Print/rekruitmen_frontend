<script setup lang="ts">
import Modal from './Modal.vue'
import Spinner from './Spinner.vue'

withDefaults(
  defineProps<{
    open: boolean
    title?: string
    message?: string
    confirmText?: string
    danger?: boolean
    loading?: boolean
  }>(),
  { title: '', message: '', confirmText: 'Ya', danger: false, loading: false }
)

const emit = defineEmits<{ (e: 'close'): void; (e: 'confirm'): void }>()
</script>

<template>
  <Modal :open="open" :title="title" @close="!loading && emit('close')">
    <p class="text-sm text-slate-600 leading-relaxed">{{ message }}</p>
    <template #footer>
      <button class="btn-ghost" :disabled="loading" @click="emit('close')">Batal</button>
      <button
        :class="danger ? 'btn-danger' : 'btn-primary'"
        :disabled="loading"
        @click="emit('confirm')"
      >
        <Spinner v-if="loading" :size="16" />
        {{ loading ? 'Memproses...' : confirmText }}
      </button>
    </template>
  </Modal>
</template>
