<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = defineProps<{
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage?: number
}>()

const emit = defineEmits<{ (e: 'pageChange', page: number): void }>()

const startItem = computed(() =>
  props.itemsPerPage ? (props.currentPage - 1) * props.itemsPerPage + 1 : null
)
const endItem = computed(() =>
  props.itemsPerPage ? Math.min(props.currentPage * props.itemsPerPage, props.totalItems) : null
)

/** Bangun array nomor halaman dengan ellipsis. Contoh: [1, '...', 4, 5, 6, '...', 20] */
function buildPageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | string)[] = []
  const delta = 1
  const left = Math.max(2, current - delta)
  const right = Math.min(total - 1, current + delta)

  pages.push(1)
  if (left > 2) pages.push('...')
  for (let i = left; i <= right; i++) pages.push(i)
  if (right < total - 1) pages.push('...')
  pages.push(total)
  return pages
}

const pages = computed(() => buildPageNumbers(props.currentPage, props.totalPages))
</script>

<template>
  <p v-if="totalPages <= 1 && totalItems === 0" class="hidden" />
  <p v-else-if="totalPages <= 1" class="text-xs text-slate-400 text-center py-2">
    Menampilkan {{ totalItems }} data
  </p>
  <div
    v-else
    class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 mt-2"
  >
    <p class="text-xs text-slate-400 order-2 sm:order-1">
      <template v-if="startItem && endItem">
        {{ startItem }}–{{ endItem }} dari
        <span class="font-semibold text-slate-600">{{ totalItems }}</span> data
      </template>
      <template v-else>
        Halaman <span class="font-semibold text-slate-600">{{ currentPage }}</span> dari
        {{ totalPages }} ({{ totalItems }} total)
      </template>
    </p>

    <div class="flex items-center gap-1 order-1 sm:order-2">
      <button
        class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
        :class="currentPage === 1
          ? 'border-slate-100 text-slate-300 cursor-not-allowed bg-slate-50'
          : 'border-slate-200 text-slate-600 hover:border-sapphire hover:text-sapphire bg-white'"
        :disabled="currentPage === 1"
        @click="emit('pageChange', currentPage - 1)"
      >
        <ChevronLeft :size="13" />
        Sebelumnya
      </button>

      <div class="flex items-center gap-1">
        <template v-for="(p, i) in pages" :key="`${p}-${i}`">
          <span v-if="p === '...'" class="px-2 text-xs text-slate-400">…</span>
          <button
            v-else
            class="w-8 h-8 rounded-lg text-xs font-semibold transition-all"
            :class="p === currentPage ? 'bg-sapphire text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'"
            @click="emit('pageChange', Number(p))"
          >
            {{ p }}
          </button>
        </template>
      </div>

      <button
        class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
        :class="currentPage === totalPages
          ? 'border-slate-100 text-slate-300 cursor-not-allowed bg-slate-50'
          : 'border-slate-200 text-slate-600 hover:border-sapphire hover:text-sapphire bg-white'"
        :disabled="currentPage === totalPages"
        @click="emit('pageChange', currentPage + 1)"
      >
        Selanjutnya
        <ChevronRight :size="13" />
      </button>
    </div>
  </div>
</template>
