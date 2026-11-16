<script setup lang="ts">
import { computed, ref } from 'vue'
import { X, Calendar, Check } from 'lucide-vue-next'
import { format, isSameDay, isBefore } from 'date-fns'
import { id } from 'date-fns/locale'
import MiniCalendar from './MiniCalendar.vue'
import { PERIOD_OPTIONS } from '@/utils/periodFilter'

const props = defineProps<{ current?: string | null }>()

const emit = defineEmits<{
  (e: 'select', value: string | null): void
  (e: 'close'): void
}>()

const startDate = ref<Date | null>(null)
const endDate = ref<Date | null>(null)
const hoveredDate = ref<Date | null>(null)
const phase = ref<'start' | 'end'>('start')

/**
 * Klik tanggal yang sama saat phase='end' menghasilkan single-day range
 * (start === end), BUKAN reset. Rentang 1 hari tetap valid.
 */
function handleDayClick(day: Date) {
  if (phase.value === 'start') {
    startDate.value = day
    endDate.value = null
    phase.value = 'end'
    return
  }

  const s = startDate.value
  if (!s) {
    startDate.value = day
    return
  }

  if (isSameDay(day, s)) {
    endDate.value = day
    phase.value = 'start'
  } else if (isBefore(day, s)) {
    endDate.value = s
    startDate.value = day
    phase.value = 'start'
  } else {
    endDate.value = day
    phase.value = 'start'
  }
}

function handleApply() {
  if (startDate.value && endDate.value) {
    const fmt = (d: Date) => format(d, 'yyyy-MM-dd')
    emit('select', `Custom: ${fmt(startDate.value)} - ${fmt(endDate.value)}`)
  }
}

function displayDate(d: Date | null) {
  return d ? format(d, 'dd MMM yyyy', { locale: id }) : '—'
}

const canApply = computed(() => !!(startDate.value && endDate.value))
const isSingleDaySelected = computed(
  () =>
    !!(
      startDate.value &&
      endDate.value &&
      isSameDay(startDate.value, endDate.value)
    )
)
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 modal-overlay"
      @click.self="emit('close')"
    >
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-[28rem] flex flex-col overflow-hidden modal-content">
        <!-- Header -->
        <div class="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100">
          <div class="flex items-center gap-2">
            <Calendar :size="16" class="text-sapphire" />
            <h3 class="font-display font-bold text-navy text-base">Pilih Periode</h3>
          </div>
          <button class="btn-ghost p-1.5 rounded-lg text-slate-400 hover:text-slate-600" @click="emit('close')">
            <X :size="18" />
          </button>
        </div>

        <!-- Body -->
        <div class="flex overflow-hidden">
          <!-- Kiri: Preset -->
          <div class="w-32 border-r border-slate-100 py-3 overflow-y-auto shrink-0" style="max-height: 420px">
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 pb-2">Preset</p>
            <button
              v-for="opt in PERIOD_OPTIONS"
              :key="opt.value ?? 'all'"
              class="w-full text-left px-3 py-2.5 text-xs transition-colors flex items-center gap-1.5"
              :class="current === opt.value ? 'bg-sapphire/10 text-sapphire font-semibold' : 'text-slate-600 hover:bg-slate-50'"
              @click="emit('select', opt.value)"
            >
              <span
                v-if="current === opt.value"
                class="inline-block w-1.5 h-1.5 rounded-full bg-sapphire shrink-0"
              />
              {{ opt.label }}
            </button>
          </div>

          <!-- Kanan: Calendar -->
          <div class="flex-1 p-4 flex flex-col gap-3 min-w-0">
            <!-- Date range display -->
            <div class="flex gap-2">
              <div
                class="flex-1 rounded-xl border px-3 py-2 transition-all duration-150"
                :class="phase === 'start' ? 'border-sapphire bg-sapphire/5 shadow-sm' : 'border-slate-200'"
              >
                <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Dari</p>
                <p class="text-xs font-semibold leading-tight" :class="startDate ? 'text-navy' : 'text-slate-300'">
                  {{ displayDate(startDate) }}
                </p>
              </div>
              <div
                class="flex-1 rounded-xl border px-3 py-2 transition-all duration-150"
                :class="phase === 'end' ? 'border-sapphire bg-sapphire/5 shadow-sm' : 'border-slate-200'"
              >
                <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Sampai</p>
                <p class="text-xs font-semibold leading-tight" :class="endDate ? 'text-navy' : 'text-slate-300'">
                  {{ displayDate(endDate) }}
                </p>
              </div>
            </div>

            <!-- Instruction hint -->
            <p class="text-[11px] text-slate-400 text-center -mt-1">
              {{
                phase === 'start'
                  ? 'Pilih tanggal mulai'
                  : isSingleDaySelected
                    ? '✓ Satu hari dipilih — klik Terapkan atau pilih tanggal akhir lain'
                    : 'Pilih tanggal selesai (boleh sama dengan mulai)'
              }}
            </p>

            <MiniCalendar
              :start-date="startDate"
              :end-date="endDate"
              :phase="phase"
              :hovered-date="hoveredDate"
              @day-click="handleDayClick"
              @day-hover="hoveredDate = $event"
              @day-leave="hoveredDate = null"
            />

            <!-- Reset + Apply -->
            <div class="flex gap-2 mt-1">
              <button
                v-if="startDate || endDate"
                class="btn-ghost px-3 py-2 text-xs"
                @click="startDate = null; endDate = null; phase = 'start'"
              >
                Reset
              </button>
              <button
                class="btn-primary flex-1 justify-center text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                :disabled="!canApply"
                @click="handleApply"
              >
                <Check :size="13" />
                {{ isSingleDaySelected ? 'Terapkan (1 Hari)' : 'Terapkan' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
