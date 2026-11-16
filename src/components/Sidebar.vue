<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { LogOut, ChevronLeft } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { dashboardApi } from '@/api/services'
import DashboardIcon from '@/components/icons/DashboardIcon.vue'
import ClipboardListIcon from '@/components/icons/ClipboardListIcon.vue'
import CheckSquareIcon from '@/components/icons/CheckSquareIcon.vue'
import ActivityIcon from '@/components/icons/ActivityIcon.vue'
import BarChart3Icon from '@/components/icons/BarChart3Icon.vue'
import TrendingUpIcon from '@/components/icons/TrendingUpIcon.vue'
import Building2Icon from '@/components/icons/Building2Icon.vue'
import ShieldCheckIcon from '@/components/icons/ShieldCheckIcon.vue'
import GitMergeIcon from '@/components/icons/GitMergeIcon.vue'

const props = defineProps<{ isCollapsed: boolean }>()
const emit = defineEmits<{ (e: 'toggle'): void }>()

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const initial = computed(() => auth.user?.nama?.charAt(0)?.toUpperCase() ?? '?')
const userBagianLabel = computed(() => {
  const bagian = auth.user?.bagian
  return typeof bagian === 'string' && bagian.trim()
    ? bagian.trim()
    : auth.isHrd
      ? 'HR Department'
      : 'General'
})

const navItems = computed(() => [
  { to: '/', label: 'Dashboard', Icon: DashboardIcon, badgeKey: null as string | null },
  { to: '/recruitment', label: 'Rekruitmen', Icon: ClipboardListIcon, badgeKey: null },
  { to: '/approval', label: 'Approval', Icon: CheckSquareIcon, badgeKey: 'approval' },
  { to: '/monitoring', label: 'SLA Monitoring', Icon: ActivityIcon, badgeKey: 'overdue' },
  auth.isHrd
    ? { to: '/kpi-hrd', label: 'KPI HRD', Icon: BarChart3Icon, badgeKey: null }
    : { to: '/kpi-approver', label: 'KPI Approval', Icon: TrendingUpIcon, badgeKey: null },
])

const masterItems = [
  { to: '/master/bagian', label: 'Kelola Bagian', Icon: Building2Icon },
  { to: '/master/approval-map', label: 'Mapping Approval', Icon: GitMergeIcon },
  { to: '/master/bypass-users', label: 'Kelola Bypass Users', Icon: ShieldCheckIcon },
]

const stats = ref<any>(null)
const summary = ref<any>(null)
let timer: ReturnType<typeof setInterval> | null = null

const badges = computed(() => ({
  approval: stats.value?.pendingApproval ?? 0,
  overdue: (summary.value?.overdueRequests ?? 0) + (summary.value?.needUserUpdate ?? 0),
}))

async function loadBadges() {
  try {
    const [statsRes, summaryRes] = await Promise.all([
      dashboardApi.stats(),
      dashboardApi.summary(),
    ])
    stats.value = statsRes.data?.data ?? null
    summary.value = summaryRes.data?.data ?? null
  } catch {
    /* silent — badge bukan data kritis */
  }
}

onMounted(() => {
  loadBadges()
  timer = setInterval(loadBadges, 120_000)
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})

function isActive(to: string) {
  if (to === '/') return route.path === '/'
  return route.path === to || route.path.startsWith(to + '/')
}

function badgeCount(key: string | null) {
  if (!key) return 0
  return badges.value[key as 'approval' | 'overdue'] ?? 0
}

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <aside
    class="h-screen bg-white border-r border-slate-100 flex flex-col shrink-0 overflow-hidden relative transition-[width] duration-300 ease-door"
    :class="isCollapsed ? 'w-[72px]' : 'w-64'"
  >
    <!-- Logo + Toggle -->
    <div class="py-5 px-4 border-b border-slate-100 shrink-0 flex items-center">
      <button
        class="flex items-center gap-3 flex-1 min-w-0 outline-none hover:scale-105 active:scale-95 transition-transform duration-150"
        :title="isCollapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'"
        @click="emit('toggle')"
      >
        <img
          src="/logo_app.png"
          alt="Logo PKAR"
          class="object-contain drop-shadow-sm shrink-0 transition-all duration-300"
          :class="isCollapsed ? 'w-9 h-9' : 'w-10 h-10'"
        />
        <div
          class="text-left overflow-hidden whitespace-nowrap min-w-0 transition-all"
          :class="isCollapsed ? 'max-w-0 opacity-0 duration-150 ease-in' : 'max-w-[160px] opacity-100 duration-250 delay-100 ease-out'"
        >
          <p class="font-display font-extrabold text-slate-800 text-base leading-tight tracking-tight">PKAR</p>
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Rekruitmen</p>
        </div>
      </button>

      <div
        class="overflow-hidden shrink-0 transition-all"
        :class="isCollapsed ? 'max-w-0 opacity-0 duration-150 ease-in' : 'max-w-[36px] opacity-100 duration-250 delay-100 ease-out'"
      >
        <button
          class="flex items-center justify-center w-7 h-7 ml-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors duration-150"
          title="Ciutkan sidebar"
          @click="emit('toggle')"
        >
          <ChevronLeft :size="16" />
        </button>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        :title="isCollapsed ? item.label : undefined"
        class="group flex items-center rounded-xl text-sm font-medium text-slate-600 mb-1 hover:bg-ice-blue hover:text-sapphire select-none relative cursor-pointer transition-all duration-300 ease-door"
        :class="[
          isCollapsed ? 'px-[18px] py-2.5 gap-0' : 'px-4 py-2.5 gap-3',
          isActive(item.to) ? 'bg-sapphire text-white hover:bg-sapphire hover:text-white shadow-md' : '',
        ]"
      >
        <div class="relative shrink-0 flex items-center justify-center z-10 group/icon">
          <component :is="item.Icon" :size="20" class="transition-colors duration-150" />
          <span
            v-if="badgeCount(item.badgeKey) > 0"
            class="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full ring-1 ring-white px-0.5 leading-none z-10"
          >
            {{ badgeCount(item.badgeKey) > 99 ? '99+' : badgeCount(item.badgeKey) }}
          </span>
        </div>

        <span
          class="whitespace-nowrap overflow-hidden leading-none transition-all"
          :class="isCollapsed ? 'max-w-0 opacity-0 duration-150 ease-in' : 'max-w-[160px] opacity-100 duration-250 delay-100 ease-out'"
        >
          {{ item.label }}
        </span>
      </RouterLink>

      <template v-if="auth.isHrd">
        <div
          class="overflow-hidden transition-all"
          :class="isCollapsed ? 'max-h-0 opacity-0 duration-150 ease-in' : 'max-h-12 opacity-100 duration-250 delay-100 ease-out'"
        >
          <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-4 pt-4 pb-1">
            Master Data
          </p>
        </div>

        <div
          class="overflow-hidden transition-all"
          :class="isCollapsed ? 'max-h-8 opacity-100 duration-250 delay-100 ease-out' : 'max-h-0 opacity-0 duration-150 ease-in'"
        >
          <div class="border-t border-slate-200 my-2 mx-auto w-8" />
        </div>

        <RouterLink
          v-for="item in masterItems"
          :key="item.to"
          :to="item.to"
          :title="isCollapsed ? item.label : undefined"
          class="group flex items-center rounded-xl text-sm font-medium text-slate-600 mb-1 hover:bg-ice-blue hover:text-sapphire select-none relative cursor-pointer transition-all duration-300 ease-door"
          :class="[
            isCollapsed ? 'px-[18px] py-2.5 gap-0' : 'px-4 py-2.5 gap-3',
            isActive(item.to) ? 'bg-sapphire text-white hover:bg-sapphire hover:text-white shadow-md' : '',
          ]"
        >
          <div class="relative shrink-0 flex items-center justify-center z-10 group/icon">
            <component :is="item.Icon" :size="20" class="transition-colors duration-150" />
          </div>
          <span
            class="whitespace-nowrap overflow-hidden leading-none transition-all"
            :class="isCollapsed ? 'max-w-0 opacity-0 duration-150 ease-in' : 'max-w-[160px] opacity-100 duration-250 delay-100 ease-out'"
          >
            {{ item.label }}
          </span>
        </RouterLink>
      </template>
    </nav>

    <!-- User profile -->
    <div class="px-2 py-4 border-t border-slate-100 shrink-0">
      <div
        class="flex items-center py-2 mb-1 rounded-xl px-3 min-w-0 transition-all duration-300 ease-door"
        :class="isCollapsed ? 'gap-0' : 'gap-3'"
      >
        <div
          class="w-8 h-8 rounded-full bg-ice-blue flex items-center justify-center shrink-0"
          :title="isCollapsed ? auth.user?.nama : undefined"
        >
          <span class="text-sapphire font-bold text-sm">{{ initial }}</span>
        </div>

        <div
          class="overflow-hidden whitespace-nowrap min-w-0 transition-all"
          :class="isCollapsed ? 'max-w-0 opacity-0 duration-150 ease-in' : 'max-w-[160px] opacity-100 duration-250 delay-100 ease-out'"
        >
          <p class="text-sm font-semibold text-navy truncate">{{ auth.user?.nama }}</p>
          <p class="text-xs text-slate-400 truncate">{{ userBagianLabel }}</p>
        </div>
      </div>

      <button
        class="flex items-center w-full rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 cursor-pointer transition-all duration-300 ease-door"
        :class="isCollapsed ? 'px-[19px] py-2.5 gap-0' : 'px-4 py-2.5 gap-3'"
        :title="isCollapsed ? 'Keluar' : undefined"
        @click="handleLogout"
      >
        <LogOut :size="17" class="shrink-0" />
        <span
          class="whitespace-nowrap overflow-hidden transition-all"
          :class="isCollapsed ? 'max-w-0 opacity-0 duration-150 ease-in' : 'max-w-[120px] opacity-100 duration-250 delay-100 ease-out'"
        >
          Keluar
        </span>
      </button>
    </div>
  </aside>
</template>
