<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  BarChart3, Calendar, ChevronDown, Info, Shield, Users, X,
} from 'lucide-vue-next'
import { monitoringApi } from '@/api/services'
import AnimatedIcon from '@/components/AnimatedIcon.vue'
import PaginationControls from '@/components/PaginationControls.vue'
import PeriodPickerModal from '@/components/PeriodPickerModal.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorBox from '@/components/ui/ErrorBox.vue'
import KpiDistributionSkeleton from '@/components/ui/KpiDistributionSkeleton.vue'
import KpiItemCardSkeleton from '@/components/ui/KpiItemCardSkeleton.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'
import { useAsyncData } from '@/composables/useAsyncData'
import { usePagination } from '@/composables/usePagination'
import { getPerformanceMeta } from '@/utils/helpers'
import { periodToApiParam, periodToLabel } from '@/utils/periodFilter'

const ITEMS_PER_PAGE = 10

const period = ref('All Time')
const showPicker = ref(false)

const apiParam = computed(() => periodToApiParam(period.value))

const { data: rawData, isLoading, isError, reload } = useAsyncData(
  () => monitoringApi.kpiHrd(apiParam.value).then(r => r.data),
  {} as any
)

const items = computed<any[]>(() => rawData.value?.data ?? [])
const summary = computed(() => rawData.value?.summary ?? {})
const dist = computed(() => summary.value.performance_distribution ?? {})
const total = computed(() => summary.value.total_completed ?? 0)

const { currentPage, setCurrentPage, totalPages, paginatedData, totalItems } =
  usePagination(items, ITEMS_PER_PAGE, apiParam)

function handlePickerSelect(val: string | null) {
  period.value = val === null ? 'All Time' : val
  showPicker.value = false
  reload()
}

function clearPeriod(e: Event) {
  e.stopPropagation()
  period.value = 'All Time'
  reload()
}

const distBars = [
  { key: 'excellent', label: 'Excellent', color: '#00C853' },
  { key: 'good', label: 'Good', color: '#2E7D32' },
  { key: 'acceptable', label: 'Acceptable', color: '#F57C00' },
  { key: 'delay', label: 'Delay', color: '#D32F2F' },
]
</script>

<template>
  <!-- Full-page skeleton -->
  <div v-if="isLoading" class="space-y-5">
    <div class="sticky top-0 z-30 bg-white/80 backdrop-blur-md pb-4 pt-2 border-b border-slate-100 mb-5">
      <div class="page-header mb-4">
        <div class="space-y-2">
          <div class="skeleton h-8 w-52 rounded" />
          <div class="skeleton h-4 w-44 rounded" />
        </div>
      </div>
      <div class="flex flex-col xl:flex-row gap-3 items-stretch w-full pl-5">
        <div class="flex items-center gap-6 shrink-0">
          <div class="space-y-1.5 text-center py-1">
            <div class="skeleton h-8 w-12 mx-auto rounded" />
            <div class="skeleton h-3 w-12 mx-auto rounded" />
          </div>
          <div class="w-px h-8 bg-slate-200" />
          <div class="space-y-1.5 text-center py-1">
            <div class="skeleton h-8 w-16 mx-auto rounded" />
            <div class="skeleton h-3 w-20 mx-auto rounded" />
          </div>
        </div>
        <div class="flex-1 flex items-center gap-3">
          <div class="skeleton w-5 h-5 rounded shrink-0" />
          <div class="space-y-1.5 flex-1">
            <div class="skeleton h-3 w-32 rounded" />
            <div class="skeleton h-3 w-full max-w-xs rounded" />
          </div>
        </div>
        <div class="flex items-center shrink-0 justify-end">
          <div class="skeleton h-9 w-36 rounded-xl" />
        </div>
      </div>
    </div>
    <KpiDistributionSkeleton :bars="4" />
    <div class="space-y-3 mt-4">
      <div class="skeleton h-4 w-40 rounded" />
      <div class="space-y-4">
        <KpiItemCardSkeleton v-for="i in 4" :key="i" />
      </div>
    </div>
  </div>

  <ErrorBox v-else-if="isError" message="Gagal memuat KPI HRD." @retry="reload" />

  <div v-else class="space-y-5 relative">

    <!-- STICKY HEADER -->
    <div class="sticky top-0 z-30 bg-white/80 backdrop-blur-md pb-4 pt-2 border-b border-slate-100 mb-5">

      <div class="page-header mb-4">
        <div>
          <h1 class="page-title">KPI Rekrutmen HRD</h1>
          <p class="text-sm text-slate-500 mt-0.5">Executive Summary — {{ periodToLabel(period) }}</p>
        </div>
      </div>

      <div class="flex flex-col xl:flex-row gap-3 items-stretch w-full pl-5">

        <div class="flex items-center gap-6 shrink-0 xl:min-w-[200px]">
          <!-- CompactStat: TOTAL -->
          <div class="text-center py-1">
            <p class="text-2xl font-display font-black leading-none mb-1.5 text-sapphire">{{ total }}</p>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TOTAL</p>
          </div>
          <div class="w-px h-8 bg-slate-200" />
          <!-- CompactStat: SUCCESS RATE -->
          <div class="text-center py-1">
            <p
              class="text-2xl font-display font-black leading-none mb-1.5"
              :class="(summary.success_rate ?? 0) >= 80 ? 'text-green-600' : 'text-amber-500'"
            >{{ summary.success_rate ?? 0 }}%</p>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SUCCESS RATE</p>
          </div>
        </div>

        <div class="flex-1 flex items-center gap-3">
          <AnimatedIcon variant="wiggle">
            <Shield :size="20" class="text-sapphire shrink-0" />
          </AnimatedIcon>
          <div>
            <p class="text-xs font-bold text-sapphire mb-0.5">Catatan Performa</p>
            <p class="text-[11px] text-slate-600 leading-snug">
              Tingkat sukses rekrutmen mencapai <strong class="text-navy">{{ summary.success_rate ?? 0 }}%</strong> dengan rata-rata waktu penyelesaian <strong class="text-navy">{{ Math.round(summary.avg_net_duration ?? 0) }} hari kerja</strong>.
            </p>
          </div>
        </div>

        <div class="flex items-center shrink-0 justify-end">
          <button
            class="flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-semibold border transition-all duration-300 whitespace-nowrap"
            :class="period !== 'All Time'
              ? 'bg-sapphire/10 text-sapphire border-sapphire/30'
              : 'bg-white text-slate-600 border-slate-200 hover:border-[#A6C5D7] hover:shadow-sm'"
            @click="showPicker = true"
          >
            <AnimatedIcon variant="scale">
              <Calendar :size="13" :class="period !== 'All Time' ? 'text-sapphire' : 'text-slate-400'" />
            </AnimatedIcon>
            <span class="max-w-[120px] truncate text-left">{{ periodToLabel(period) }}</span>
            <X
              v-if="period !== 'All Time'"
              :size="12"
              class="hover:text-red-500 transition-colors ml-0.5"
              @click="clearPeriod"
            />
            <ChevronDown v-else :size="13" class="text-slate-400 ml-0.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Distribution -->
    <div class="card border border-slate-100 shadow-sm mt-2">
      <p class="font-display font-bold text-navy text-sm mb-4">Distribusi Kualitas Penempatan</p>
      <div class="space-y-4">
        <div v-for="bar in distBars" :key="bar.key">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-xs font-semibold text-slate-600">{{ bar.label }}</span>
            <span class="text-xs font-bold" :style="{ color: bar.color }">
              {{ dist[bar.key] ?? 0 }} ({{ total > 0 ? Math.round(((dist[bar.key] ?? 0) / total) * 100) : 0 }}%)
            </span>
          </div>
          <ProgressBar
            :value="total > 0 ? Math.round(((dist[bar.key] ?? 0) / total) * 100) : 0"
            :color="bar.color"
          />
        </div>
      </div>
    </div>

    <!-- Items -->
    <EmptyState v-if="items.length === 0" message="Tidak ada data pada periode ini." :icon="BarChart3" />

    <div v-else class="space-y-3 mt-4">
      <p class="font-display font-bold text-navy text-sm">
        Riwayat Penempatan ({{ totalItems }})
      </p>
      <div class="space-y-4">
        <div
          v-for="item in paginatedData"
          :key="item.sla_tpk_nomor"
          class="card group hover:shadow-card-hover hover:border-[#A6C5D7] transition-all duration-300"
        >
          <div class="flex items-start justify-between mb-3">
            <div>
              <p class="font-display font-bold text-navy group-hover:text-sapphire transition-colors">{{ item.position }}</p>
              <p class="text-xs text-slate-400 mt-0.5">{{ item.department }} · {{ item.sla_tpk_nomor }}</p>
            </div>
            <span
              class="text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full transition-colors"
              :style="{ background: getPerformanceMeta(item.performance_label).bg, color: getPerformanceMeta(item.performance_label).text }"
            >
              {{ getPerformanceMeta(item.performance_label).label }}
            </span>
          </div>

          <div class="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-evenly mb-3">
            <template v-if="item.gross_duration_days - item.net_duration_days > 0">
              <!-- Metric: AKTUAL -->
              <div class="text-center">
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AKTUAL</p>
                <p class="text-lg font-display font-black mt-0.5 text-amber-500">{{ item.gross_duration_days }}h</p>
              </div>
              <div class="w-px h-6 bg-slate-200" />
              <!-- Metric: WAKTU KPI -->
              <div class="text-center">
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">WAKTU KPI</p>
                <p class="text-lg font-display font-black mt-0.5 text-green-600">{{ item.net_duration_days }}h</p>
              </div>
              <div class="w-px h-6 bg-slate-200" />
              <!-- Metric: MIN SLA -->
              <div class="text-center">
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">MIN SLA</p>
                <p class="text-lg font-display font-black mt-0.5 text-slate-500">{{ item.standard_lead_time }}h</p>
              </div>
            </template>
            <template v-else>
              <!-- Metric: DISELESAIKAN -->
              <div class="text-center">
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">DISELESAIKAN</p>
                <p
                  class="text-lg font-display font-black mt-0.5"
                  :class="item.net_duration_days <= item.standard_lead_time ? 'text-green-600' : 'text-red-500'"
                >{{ item.net_duration_days }}h</p>
              </div>
              <div class="w-px h-6 bg-slate-200" />
              <!-- Metric: MIN SLA -->
              <div class="text-center">
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">MIN SLA</p>
                <p class="text-lg font-display font-black mt-0.5 text-slate-500">{{ item.standard_lead_time }}h</p>
              </div>
            </template>
          </div>

          <div
            v-if="item.gross_duration_days - item.net_duration_days > 0"
            class="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-2.5 mb-3"
          >
            <AnimatedIcon variant="wiggle">
              <Info :size="13" class="text-amber-600 shrink-0 mt-0.5" />
            </AnimatedIcon>
            <p class="text-[11px] text-amber-700 leading-relaxed font-medium">
              Toleransi kandidat batal: -{{ item.gross_duration_days - item.net_duration_days }} hari — tidak dinilai sebagai keterlambatan HRD.
            </p>
          </div>

          <div class="flex items-center gap-2 bg-green-50/50 border border-green-100 rounded-xl px-3 py-2 w-fit">
            <AnimatedIcon variant="scale">
              <Users :size="14" class="text-green-600" />
            </AnimatedIcon>
            <span class="text-[11px] font-bold text-green-700 uppercase tracking-wide">Hired: {{ item.hired_count }}/{{ item.target_count }}</span>
          </div>
        </div>
      </div>

      <PaginationControls
        :current-page="currentPage"
        :total-pages="totalPages"
        :total-items="totalItems"
        :items-per-page="ITEMS_PER_PAGE"
        @page-change="setCurrentPage"
      />
    </div>

    <PeriodPickerModal
      v-if="showPicker"
      :current="period === 'All Time' ? null : period"
      @select="handlePickerSelect"
      @close="showPicker = false"
    />
  </div>
</template>
