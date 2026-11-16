<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  Calendar,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Edit2,
  GitMerge,
  ShieldCheck,
  TrendingUp,
} from 'lucide-vue-next'
import { dashboardApi, recruitmentApi } from '@/api/services'
import AnimatedIcon from '@/components/AnimatedIcon.vue'
import PeriodPickerModal from '@/components/PeriodPickerModal.vue'
import ErrorBox from '@/components/ui/ErrorBox.vue'
import StatCard from '@/components/ui/StatCard.vue'
import { useAsyncData } from '@/composables/useAsyncData'
import { useAuthStore } from '@/stores/auth'
import type { DashboardStats, MonitoringSummary } from '@/types'
import { periodToApiParam, periodToLabel } from '@/utils/periodFilter'
import logger from '@/utils/logger'

const router = useRouter()
const auth = useAuthStore()

const period = ref<string | null>(null)
const showPicker = ref(false)

const apiParam = computed(() => periodToApiParam(period.value))
const label = computed(() => periodToLabel(period.value))
const pickerCurrent = computed(() => period.value)

const {
  data: stats,
  isLoading: statsLoading,
  isError: statsError,
  reload: statsReload,
} = useAsyncData(
  () => dashboardApi.stats(apiParam.value).then((r) => r.data.data as DashboardStats),
  null as DashboardStats | null,
)

const {
  data: summary,
  isLoading: summaryLoading,
  reload: _summaryReload,
} = useAsyncData(
  () => dashboardApi.summary().then((r) => r.data.data as MonitoringSummary),
  null as MonitoringSummary | null,
)

watch(period, () => {
  recruitmentApi.syncManual().catch((err: unknown) => logger.warn('Sync failed:', err))
  statsReload()
})

onMounted(() => {
  recruitmentApi.syncManual().catch((err: unknown) => logger.warn('Sync failed:', err))
})

function navigateWithPeriod(path: string) {
  if (!period.value) {
    router.push(path)
  } else {
    router.push(`${path}?period=${encodeURIComponent(period.value)}`)
  }
}

function navigateToMonitoring(statusFilter: string | null = null, periodFilter: string | null = null) {
  const params = new URLSearchParams()
  if (statusFilter) params.set('status', statusFilter)
  if (periodFilter) params.set('period', periodFilter)
  const query = params.toString()
  router.push(query ? `/monitoring?${query}` : '/monitoring')
}

function handlePickerSelect(val: string | null) {
  period.value = val
  showPicker.value = false
}

interface QuickMenuItem {
  to: string
  label: string
  sub: string
  icon: typeof ClipboardList
}

const quickMenuItems = computed<QuickMenuItem[]>(() => [
  { to: '/recruitment', label: 'Permintaan Rekruitmen', sub: 'Buat & kelola permintaan', icon: ClipboardList },
  { to: '/approval', label: 'Approval', sub: 'Setujui permintaan bawahan', icon: CheckSquare },
  { to: '/monitoring', label: 'SLA Monitoring', sub: 'Pantau progress rekruitmen', icon: Activity },
  auth.isHrd
    ? { to: '/kpi-hrd', label: 'KPI HRD', sub: 'Laporan performa rekruitmen', icon: BarChart3 }
    : { to: '/kpi-approver', label: 'KPI Approval', sub: 'Rekap kecepatan approval', icon: TrendingUp },
])

const masterMenuItems: QuickMenuItem[] = [
  { to: '/master/bagian', label: 'Kelola Bagian / Departemen', sub: 'Tambah, ubah, aktifkan bagian', icon: Building2 },
  { to: '/master/approval-map', label: 'Mapping Approval', sub: 'Atur alur persetujuan', icon: GitMerge },
  { to: '/master/bypass-users', label: 'Kelola Bypass Users', sub: 'Daftarkan pengguna bypass approval', icon: ShieldCheck },
]
</script>

<template>
  <div class="space-y-6">

    <!-- ── HEADER ── -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <p class="text-slate-500 text-sm font-medium">Selamat datang,</p>
        <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">{{ auth.user?.nama ?? '–' }}</h1>
        <p class="text-xs text-sapphire font-bold mt-1.5 uppercase tracking-wider">{{ auth.user?.bagian ?? '' }}</p>
      </div>

      <div class="flex flex-wrap items-center gap-2">

        <!-- ALERT 1: Perlu Update -->
        <div v-if="summaryLoading" class="skeleton h-9 w-36 rounded-xl" />
        <button
          v-else-if="summary?.needUserUpdate && summary.needUserUpdate > 0"
          class="flex items-center gap-1.5 bg-orange-50 text-orange-700 border border-orange-200 px-3 py-2 rounded-xl text-xs font-bold hover:bg-orange-100 hover:shadow-sm hover:-translate-y-0.5 transition-all"
          @click="navigateToMonitoring('NEED_USER_UPDATE')"
        >
          <AnimatedIcon variant="wiggle"><Edit2 :size="14" /></AnimatedIcon>
          <span>{{ summary!.needUserUpdate }} Perlu Update</span>
        </button>

        <!-- ALERT 2: Overdue -->
        <button
          v-if="!summaryLoading && summary?.overdueRequests && summary.overdueRequests > 0"
          class="flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-200 px-3 py-2 rounded-xl text-xs font-bold hover:bg-red-100 hover:shadow-sm hover:-translate-y-0.5 transition-all"
          @click="navigateToMonitoring('OVERDUE')"
        >
          <AnimatedIcon variant="wiggle"><AlertTriangle :size="14" /></AnimatedIcon>
          <span>{{ summary!.overdueRequests }} Terlambat</span>
        </button>

        <!-- FILTER KALENDER -->
        <button
          class="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm hover:border-sapphire hover:shadow-sm hover:-translate-y-0.5 transition-all ml-auto md:ml-2"
          @click="showPicker = true"
        >
          <Calendar :size="15" class="text-sapphire" />
          <span class="text-slate-700 font-semibold text-xs max-w-[120px] truncate">{{ label }}</span>
          <ChevronDown :size="14" class="text-slate-400" />
        </button>
      </div>
    </div>

    <!-- ── Stats Grid ── -->
    <div v-if="statsLoading" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div v-for="i in 4" :key="i" class="card relative overflow-hidden">
        <div class="flex items-start gap-3">
          <div class="skeleton w-10 h-10 rounded-xl shrink-0" />
          <div class="flex-1 space-y-2 pt-0.5">
            <div class="skeleton h-3 w-24 rounded" />
            <div class="skeleton h-8 w-16 rounded" />
          </div>
        </div>
      </div>
    </div>

    <ErrorBox v-else-if="statsError" message="Gagal memuat statistik." @retry="statsReload" />

    <template v-else>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Permintaan"
          :value="stats?.totalPermintaan ?? 0"
          :icon="ClipboardList"
          color="#0F52BA"
          @click="navigateWithPeriod('/recruitment')"
        />
        <StatCard
          label="Pending (Bisa Diproses)"
          :value="stats?.pendingApproval ?? 0"
          :icon="CheckSquare"
          color="#F57C00"
          :alert="(stats?.pendingApproval ?? 0) > 0"
          @click="navigateWithPeriod('/approval')"
        />
        <StatCard
          label="SLA Aktif"
          :value="summaryLoading ? '–' : (summary?.activeRequests ?? 0)"
          :icon="Activity"
          color="#0F52BA"
          @click="navigateToMonitoring('ACTIVE')"
        />
        <StatCard
          label="Selesai Bulan Ini"
          :value="summaryLoading ? '–' : (summary?.completedThisMonth ?? 0)"
          :icon="CheckCircle2"
          color="#2E7D32"
          @click="navigateToMonitoring('COMPLETED', 'This month')"
        />
      </div>

      <div
        v-if="(stats?.legacyCount ?? 0) > 0 || (stats?.pendingLegacy ?? 0) > 0"
        class="bg-slate-50 border border-slate-100 rounded-xl p-3 mt-3 space-y-1.5"
      >
        <p v-if="(stats?.legacyCount ?? 0) > 0" class="text-xs text-slate-500 flex items-center gap-2">
          <span class="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
          Total permintaan termasuk <span class="font-bold text-slate-700">{{ stats!.legacyCount }}</span> data riwayat dari sistem lama (read-only).
        </p>
        <p v-if="(stats?.pendingLegacy ?? 0) > 0" class="text-xs text-amber-600 flex items-center gap-2">
          <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          Terdapat <span class="font-bold">{{ stats!.pendingLegacy }}</span> antrean pending dari sistem lama yang tidak dapat diproses.
        </p>
      </div>
    </template>

    <!-- ── Quick Menu ── -->
    <div>
      <p class="text-lg font-bold text-slate-800 mb-3">Menu Utama</p>
      <div class="space-y-3">
        <!-- Skeleton state -->
        <template v-if="statsLoading">
          <div v-for="i in 4" :key="i" class="w-full flex items-center gap-5 bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
            <div class="skeleton w-12 h-12 rounded-xl shrink-0" />
            <div class="flex-1 space-y-2">
              <div class="skeleton h-4 w-40 rounded" />
              <div class="skeleton h-3 w-56 rounded" />
            </div>
            <div class="skeleton w-5 h-5 rounded shrink-0" />
          </div>
        </template>

        <!-- Actual menu items -->
        <template v-else>
          <button
            v-for="item in quickMenuItems"
            :key="item.to"
            class="w-full text-left flex items-center gap-5 bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:border-blue-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
            @click="router.push(item.to)"
          >
            <div class="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-blue-50 group-hover:text-sapphire transition-colors">
              <AnimatedIcon variant="scale">
                <component :is="item.icon" :size="22" class="text-slate-400 group-hover:text-sapphire transition-colors" />
              </AnimatedIcon>
            </div>
            <div class="flex-1">
              <p class="font-bold text-slate-800 text-[15px]">{{ item.label }}</p>
              <p class="text-[13px] text-slate-500 mt-0.5">{{ item.sub }}</p>
            </div>
            <ChevronRight :size="20" class="text-slate-300 group-hover:text-sapphire group-hover:translate-x-1 transition-all" />
          </button>
        </template>
      </div>
    </div>

    <!-- Master Data Management — HRD only -->
    <div v-if="auth.isHrd">
      <p class="text-lg font-bold text-slate-800 mb-3">Manajemen Master Data</p>
      <div class="space-y-3">
        <button
          v-for="item in masterMenuItems"
          :key="item.to"
          class="w-full text-left flex items-center gap-5 bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:border-blue-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
          @click="router.push(item.to)"
        >
          <div class="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors">
            <component :is="item.icon" :size="22" class="text-slate-400 group-hover:text-sapphire transition-colors" />
          </div>
          <div class="flex-1">
            <p class="font-bold text-slate-800 text-[15px]">{{ item.label }}</p>
            <p class="text-[13px] text-slate-500 mt-0.5">{{ item.sub }}</p>
          </div>
          <ChevronRight :size="20" class="text-slate-300 group-hover:text-sapphire group-hover:translate-x-1 transition-all" />
        </button>
      </div>
    </div>

    <!-- ── Period Picker Modal ── -->
    <PeriodPickerModal
      v-if="showPicker"
      :current="pickerCurrent"
      @select="handlePickerSelect"
      @close="showPicker = false"
    />
  </div>
</template>
