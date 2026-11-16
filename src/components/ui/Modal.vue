<script setup lang="ts">
import { computed } from 'vue'
import { XCircle } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    open: boolean
    title?: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
  }>(),
  { title: '', size: 'md' }
)

const emit = defineEmits<{ (e: 'close'): void }>()

const maxW = computed(
  () =>
    ({
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
    })[props.size]
)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 modal-overlay"
      @click.self="emit('close')"
    >
      <div
        class="bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-y-auto modal-content"
        :class="maxW"
      >
        <div class="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100">
          <h3 class="font-display font-bold text-navy text-lg">{{ title }}</h3>
          <button class="btn-icon text-slate-400 hover:text-slate-700" @click="emit('close')">
            <XCircle :size="20" />
          </button>
        </div>
        <div class="p-5">
          <slot />
        </div>
        <div
          v-if="$slots.footer"
          class="px-5 pb-5 flex justify-end gap-3 border-t border-slate-50 pt-4"
        >
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>
