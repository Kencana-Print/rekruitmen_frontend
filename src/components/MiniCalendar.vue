<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, addDays, subYears, addYears, setMonth, setYear, isSameDay, isSameMonth, isBefore, isAfter, isWithinInterval } from 'date-fns'
import { id } from 'date-fns/locale'

const props = defineProps<{
  startDate: Date | null
  endDate: Date | null
  phase: 'start' | 'end'
  hoveredDate: Date | null
}>()

const emit = defineEmits<{
  (e: 'dayClick', day: Date): void
  (e: 'dayHover', day: Date): void
  (e: 'dayLeave'): void
}>()

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

const viewDate = ref<Date>(props.startDate ?? new Date())
const viewMode = ref<'days' | 'months' | 'years'>('days')

const days = computed(() => {
  const monthStart = startOfMonth(viewDate.value)
  const monthEnd = endOfMonth(viewDate.value)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const out: Date[] = []
  let d = gridStart
  while (!isAfter(d, gridEnd)) {
    out.push(d)
    d = addDays(d, 1)
  }
  return out
})

const today = (() => {
  const t = new Date()
  t.setHours(0, 0, 0, 0)
  return t
})()

const currentYear = computed(() => viewDate.value.getFullYear())
const years = computed(() =>
  Array.from({ length: 12 }, (_, i) => currentYear.value - 5 + i)
)

const headerLabel = computed(() => {
  if (viewMode.value === 'days') return format(viewDate.value, 'MMMM yyyy', { locale: id })
  if (viewMode.value === 'months') return format(viewDate.value, 'yyyy')
  return `${years.value[0]} - ${years.value[years.value.length - 1]}`
})

function handlePrev() {
  if (viewMode.value === 'days') viewDate.value = subMonths(viewDate.value, 1)
  else if (viewMode.value === 'years') viewDate.value = subYears(viewDate.value, 12)
  else viewDate.value = subYears(viewDate.value, 1)
}

function handleNext() {
  if (viewMode.value === 'days') viewDate.value = addMonths(viewDate.value, 1)
  else if (viewMode.value === 'years') viewDate.value = addYears(viewDate.value, 12)
  else viewDate.value = addYears(viewDate.value, 1)
}

function toggleMode() {
  if (viewMode.value === 'days') viewMode.value = 'months'
  else if (viewMode.value === 'months') viewMode.value = 'years'
  else viewMode.value = 'days'
}

function isSame(a: Date | null | undefined, b: Date | null | undefined) {
  return !!(a && b && isSameDay(a, b))
}

function dayState(day: Date) {
  const inCurrentMonth = isSameMonth(day, viewDate.value)
  const isStart = isSame(props.startDate, day)
  const isEnd = isSame(props.endDate, day)
  const isToday = isSameDay(day, today)
  const effectiveEnd = props.endDate ?? (props.phase === 'end' ? props.hoveredDate : null)

  let rangeS: Date | null = null
  let rangeE: Date | null = null
  if (props.startDate && effectiveEnd && !isSameDay(props.startDate, effectiveEnd)) {
    if (isBefore(props.startDate, effectiveEnd)) {
      rangeS = props.startDate
      rangeE = effectiveEnd
    } else {
      rangeS = effectiveEnd
      rangeE = props.startDate
    }
  }

  const isInRange = !!(
    rangeS &&
    rangeE &&
    inCurrentMonth &&
    !isSameDay(day, rangeS) &&
    !isSameDay(day, rangeE) &&
    isWithinInterval(day, { start: rangeS, end: rangeE })
  )
  const hasRange = !!(rangeS && rangeE)
  const isActualStart = !!(rangeS && isSameDay(day, rangeS))
  const isActualEnd = !!(rangeE && isSameDay(day, rangeE))
  const isWeekStart = day.getDay() === 0
  const isWeekEnd = day.getDay() === 6
  const showRightHalf = hasRange && isActualStart && !isWeekEnd
  const showLeftHalf = hasRange && isActualEnd && !isWeekStart

  const isSingleDayRange = !!(props.startDate && props.endDate && isSameDay(props.startDate, props.endDate))
  const isSingleDaySelected = isSingleDayRange && isSameDay(day, props.startDate)

  const textColor = !inCurrentMonth
    ? 'text-slate-300'
    : isStart || isEnd || isSingleDaySelected
      ? 'text-white font-bold'
      : isInRange
        ? 'text-sapphire font-medium'
        : isToday
          ? 'text-sapphire font-bold'
          : 'text-slate-600'

  return {
    inCurrentMonth,
    isStart,
    isEnd,
    isToday,
    isInRange,
    isWeekStart,
    isWeekEnd,
    showRightHalf,
    showLeftHalf,
    isSingleDaySelected,
    textColor,
  }
}
</script>

<template>
  <div class="select-none min-h-[260px]">
    <div class="flex items-center justify-between mb-3">
      <button
        class="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-navy transition-colors"
        @click="handlePrev"
      >
        <ChevronLeft :size="14" />
      </button>
      <button
        class="text-sm font-bold text-navy capitalize hover:bg-slate-100 px-3 py-1 rounded-lg transition-colors cursor-pointer"
        @click="toggleMode"
      >
        {{ headerLabel }}
      </button>
      <button
        class="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-navy transition-colors"
        @click="handleNext"
      >
        <ChevronRight :size="14" />
      </button>
    </div>

    <template v-if="viewMode === 'days'">
      <div class="grid grid-cols-7 mb-1">
        <div v-for="d in DAY_NAMES" :key="d" class="text-center text-[10px] font-bold text-slate-400 py-1">
          {{ d }}
        </div>
      </div>
      <div class="grid grid-cols-7">
        <button
          v-for="(day, i) in days"
          :key="i"
          class="relative flex items-center justify-center h-8"
          :style="{ cursor: dayState(day).inCurrentMonth ? 'pointer' : 'default' }"
          :disabled="!dayState(day).inCurrentMonth"
          @click="dayState(day).inCurrentMonth && emit('dayClick', day)"
          @mouseenter="dayState(day).inCurrentMonth && emit('dayHover', day)"
          @mouseleave="emit('dayLeave')"
        >
          <span
            v-if="dayState(day).showRightHalf"
            class="absolute inset-y-0.5 left-1/2 right-0 bg-blue-100"
          />
          <span
            v-if="dayState(day).showLeftHalf"
            class="absolute inset-y-0.5 left-0 right-1/2 bg-blue-100"
          />
          <span
            v-if="dayState(day).isInRange"
            class="absolute inset-y-0.5 left-0 right-0 bg-blue-100"
            :class="[dayState(day).isWeekStart ? 'rounded-l-full' : '', dayState(day).isWeekEnd ? 'rounded-r-full' : '']"
          />
          <span
            v-if="dayState(day).isStart || dayState(day).isEnd || dayState(day).isSingleDaySelected"
            class="absolute w-7 h-7 rounded-full bg-sapphire z-10"
          />
          <span
            v-if="dayState(day).isToday && !dayState(day).isStart && !dayState(day).isEnd && !dayState(day).isSingleDaySelected && dayState(day).inCurrentMonth"
            class="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-sapphire z-20"
          />
          <span class="relative z-20 text-xs leading-none" :class="dayState(day).textColor">
            {{ day.getDate() }}
          </span>
        </button>
      </div>
    </template>

    <div v-if="viewMode === 'months'" class="grid grid-cols-3 gap-2 mt-2">
      <button
        v-for="(m, i) in MONTHS"
        :key="m"
        class="py-3 text-xs font-semibold rounded-xl transition-colors"
        :class="viewDate.getMonth() === i ? 'bg-sapphire text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'"
        @click="viewDate = setMonth(viewDate, i); viewMode = 'days'"
      >
        {{ m }}
      </button>
    </div>

    <div v-if="viewMode === 'years'" class="grid grid-cols-3 gap-2 mt-2">
      <button
        v-for="y in years"
        :key="y"
        class="py-3 text-xs font-semibold rounded-xl transition-colors"
        :class="viewDate.getFullYear() === y ? 'bg-sapphire text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'"
        @click="viewDate = setYear(viewDate, y); viewMode = 'months'"
      >
        {{ y }}
      </button>
    </div>
  </div>
</template>
