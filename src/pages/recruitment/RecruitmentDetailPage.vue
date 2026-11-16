<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Edit2,
  FileText,
  Flag,
  History,
  Info,
  User,
  Users,
  XCircle,
} from 'lucide-vue-next'
import { recruitmentApi } from '@/api/services'
import RecruitmentDetailSkeleton from '@/components/ui/RecruitmentDetailSkeleton.vue'
import { useAuthStore } from '@/stores/auth'
import { formatDate, getSlaSourceMeta } from '@/utils/helpers'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const nomor = computed(() => route.params.nomor as string)

const data = ref<any>(null)
const logData = ref<any[]>([])
const isLoading = ref(true)
const isError = ref(false)

const showSlaTooltip = ref(false)
const logOpen = ref(false)

watch(showSlaTooltip, (val) => {
  document.body.style.overflow = val ? 'hidden' : 'unset'
})

onUnmounted(() => {
  document.body.style.overflow = 'unset'
})

async function loadData() {
  isLoading.value = true
  isError.value = false
  try {
    const [detailRes, logRes] = await Promise.all([
      recruitmentApi.detail(nomor.value),
      recruitmentApi.log(nomor.value).catch(() => ({ data: { data: [] } })),
    ])
    data.value = detailRes.data.data
    logData.value = logRes.data.data ?? []
  } catch {
    isError.value = true
  } finally {
    isLoading.value = false
  }
}

onMounted(loadData)

const isDraft = computed(() => data.value && Number(data.value.tpk_approveatasan) === 0 && Number(data.value.tpk_approveHRD) === 0)
const isOwner = computed(() => data.value?.tpk_peminta?.trim() === auth.user?.kode)
const isLegacy = computed(() => Number(data.value?.is_legacy) === 1 || data.value?.sla_status === 'LEGACY')
const isSlaMissing = computed(() => Number(data.value?.sla_missing) === 1 || data.value?.sla_status === 'SLA_MISSING')
const canEdit = computed(() =>
  !auth.isHrd && isOwner.value && !isLegacy.value && !isSlaMissing.value &&
  (isDraft.value || Number(data.value?.sla_is_editable) === 1)
)

const jobdesks = computed(() => {
  if (!data.value) return []
  return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    .map(i => data.value[`tpk_keterangan${i === 1 ? '' : i}`])
    .filter(Boolean)
})

const specs = computed(() => {
  if (!data.value) return []
  return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    .map(i => data.value[`tpk_spesifikasi${i === 1 ? '' : i}`])
    .filter(Boolean)
})

const approvalStatus = computed(() => {
  if (!data.value) return { label: '', color: '', bg: '' }
  if (data.value.tpk_approveatasan === 2 || data.value.tpk_approveHRD === 2)
    return { label: 'Ditolak', color: 'text-red-600', bg: 'bg-red-50 border-red-200' }
  if (data.value.tpk_approveatasan === 0)
    return { label: 'Menunggu Approval Atasan', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' }
  if (data.value.tpk_approveHRD === 0)
    return { label: 'Menunggu Approval HRD', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' }
  return { label: 'Disetujui Lengkap', color: 'text-green-700', bg: 'bg-green-50 border-green-200' }
})

function getApprovalItemMeta(status: number) {
  const map: Record<number, { label: string; color: string }> = {
    0: { label: 'Menunggu', color: 'text-amber-500' },
    1: { label: 'Disetujui', color: 'text-green-600' },
    9: { label: 'Disetujui', color: 'text-green-600' },
    2: { label: 'Ditolak', color: 'text-red-500' },
  }
  return map[status] ?? { label: 'Unknown', color: 'text-slate-400' }
}

function fieldLabel(name: string): string {
  const map: Record<string, string> = {
    tpk_tgl_butuh: 'Tanggal Butuh',
    tpk_jumlah: 'Jumlah',
    tpk_bagian: 'Bagian',
    tpk_alasan: 'Alasan',
    tpk_keterangan: 'Jobdesk 1',
    tpk_keterangan2: 'Jobdesk 2',
    tpk_keterangan3: 'Jobdesk 3',
    tpk_keterangan4: 'Jobdesk 4',
    tpk_keterangan5: 'Jobdesk 5',
    tpk_keterangan6: 'Jobdesk 6',
    tpk_keterangan7: 'Jobdesk 7',
    tpk_keterangan8: 'Jobdesk 8',
    tpk_keterangan9: 'Jobdesk 9',
    tpk_keterangan10: 'Jobdesk 10',
    tpk_spesifikasi: 'Spesifikasi 1',
    tpk_spesifikasi2: 'Spesifikasi 2',
    tpk_spesifikasi3: 'Spesifikasi 3',
  }
  return map[name] ?? name?.replace(/_/g, ' ') ?? '–'
}
</script>

<template>
  <RecruitmentDetailSkeleton v-if="isLoading" />

  <div v-else-if="isError || !data" class="text-center py-16 text-slate-400">
    <p>Gagal memuat data.</p>
    <button class="btn-secondary mt-3" @click="loadData">Coba Lagi</button>
  </div>

  <div v-else class="max-w-3xl mx-auto relative">

    <!-- AREA STICKY HEADER -->
    <div class="sticky top-0 z-30 bg-[#F8FAFC]/90 backdrop-blur-md pb-4 pt-2 mb-5 space-y-4">

      <!-- Header -->
      <div class="page-header">
        <div class="flex items-center gap-3">
          <button
            class="p-2 -ml-2 rounded-xl text-slate-400 hover:bg-slate-200 hover:text-navy transition-all duration-150 shrink-0"
            title="Kembali"
            @click="router.go(-1)"
          >
            <ArrowLeft :size="20" />
          </button>
          <div>
            <h1 class="page-title">Detail Permintaan</h1>
            <p class="font-mono text-xs text-slate-500 font-semibold mt-0.5">{{ nomor }}</p>
          </div>
        </div>
        <button
          v-if="canEdit"
          class="btn-primary"
          @click="router.push(`/recruitment/edit/${encodeURIComponent(nomor)}`)"
        >
          <Edit2 :size="16" /> Edit
        </button>
      </div>

      <!-- Status Banner -->
      <div :class="`flex items-center gap-3 border rounded-2xl p-4 shadow-sm ${approvalStatus.bg}`">
        <div :class="`w-2.5 h-2.5 rounded-full ${approvalStatus.color.replace('text', 'bg')}`" />
        <span :class="`font-semibold text-sm ${approvalStatus.color}`">{{ approvalStatus.label }}</span>
      </div>
    </div>
    <!-- AKHIR AREA STICKY HEADER -->

    <!-- KONTEN BAWAH -->
    <div class="space-y-5">

      <!-- Catatan / Alasan Penolakan -->
      <div
        v-if="data.sla_notes"
        class="card"
        :class="data.tpk_approveHRD === 2 || data.tpk_approveatasan === 2 ? 'border-red-200 bg-red-50' : ''"
      >
        <h3
          class="font-display font-bold text-sm mb-3 flex items-center gap-2"
          :class="data.tpk_approveHRD === 2 || data.tpk_approveatasan === 2 ? 'text-red-800' : 'text-navy'"
        >
          <Info :size="15" /> Catatan Proses &amp; Penolakan
        </h3>
        <div
          class="text-sm whitespace-pre-wrap leading-relaxed"
          :class="data.tpk_approveHRD === 2 || data.tpk_approveatasan === 2 ? 'text-red-700 font-medium' : 'text-slate-600'"
        >
          {{ data.sla_notes }}
        </div>
      </div>

      <!-- Main Info -->
      <div class="card">
        <div class="mb-4">
          <h2 class="font-display font-bold text-xl text-navy">{{ data.jab_nama }}</h2>
          <p class="text-sm text-slate-400 mt-0.5">{{ data.tpk_bagian }}</p>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="flex items-start gap-2">
            <span class="text-slate-400 mt-0.5"><User :size="15" /></span>
            <div>
              <p class="text-xs text-slate-400 font-medium">Peminta</p>
              <p class="text-sm font-semibold text-navy">{{ data.peminta_nama || data.tpk_peminta || '–' }}</p>
            </div>
          </div>
          <div class="flex items-start gap-2">
            <span class="text-slate-400 mt-0.5"><Users :size="15" /></span>
            <div>
              <p class="text-xs text-slate-400 font-medium">Jumlah</p>
              <p class="text-sm font-semibold text-navy">{{ data.tpk_jumlah }} orang</p>
            </div>
          </div>
          <div class="flex items-start gap-2">
            <span class="text-slate-400 mt-0.5"><Calendar :size="15" /></span>
            <div>
              <p class="text-xs text-slate-400 font-medium">Tgl Permintaan</p>
              <p class="text-sm font-semibold text-navy">{{ formatDate(data.tpk_tanggal) }}</p>
            </div>
          </div>
          <div class="flex items-start gap-2">
            <span class="text-slate-400 mt-0.5"><Calendar :size="15" /></span>
            <div>
              <p class="text-xs text-slate-400 font-medium">Tgl Butuh</p>
              <p class="text-sm font-semibold text-navy">{{ formatDate(data.tpk_tgl_butuh) }}</p>
            </div>
          </div>
          <div class="flex items-start gap-2">
            <span class="text-slate-400 mt-0.5"><Building2 :size="15" /></span>
            <div>
              <p class="text-xs text-slate-400 font-medium">Jabatan Kode</p>
              <p class="text-sm font-semibold text-navy">{{ data.jab_kode || data.tpk_jab_kode || '–' }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- SLA Info -->
      <div
        v-if="data.sla_final_target_date && data.sla_status !== 'PENDING'"
        class="card border-l-4"
        :class="
          data.sla_source === 'SYSTEM' ? 'border-l-amber-400' :
          data.sla_source === 'USER'   ? 'border-l-green-500' : 'border-l-blue-400'
        "
      >
        <div class="flex items-center gap-2 mb-3">
          <Flag :size="16" class="text-sapphire" />
          <h3 class="font-display font-bold text-navy text-sm">Informasi SLA Target</h3>
        </div>
        <div class="space-y-2">
          <div v-if="data.sla_original_requested_date" class="flex items-center justify-between text-sm">
            <span class="text-slate-500">Tanggal Butuh User</span>
            <span class="text-slate-700">{{ formatDate(data.sla_original_requested_date) }}</span>
          </div>
          <div v-if="data.sla_system_floor_date && data.sla_source === 'SYSTEM'" class="flex items-center justify-between text-sm">
            <span class="text-slate-500">Estimasi Minimum Sistem</span>
            <span class="text-slate-700">{{ formatDate(data.sla_system_floor_date) }}</span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-slate-500">Target Final HRD</span>
            <span class="font-bold text-sapphire">{{ formatDate(data.sla_final_target_date) }}</span>
          </div>
          <div v-if="data.sla_min_days" class="flex items-center justify-between text-sm">
            <span class="text-slate-500">Lead Time Minimum</span>
            <span class="text-slate-700">{{ data.sla_min_days }} hari kerja</span>
          </div>
          <div class="pt-2 border-t border-slate-100 flex items-center gap-2 flex-wrap">
            <span
              class="text-xs font-semibold px-2 py-1 rounded-full"
              :style="{ background: getSlaSourceMeta(data.sla_source).bg, color: getSlaSourceMeta(data.sla_source).text }"
            >
              {{ getSlaSourceMeta(data.sla_source).label }}
            </span>
            <span
              v-if="data.sla_is_editable === 1"
              class="text-xs font-semibold px-2 py-1 rounded-full bg-orange-100 text-orange-700"
            >
              Perlu Update Tanggal
            </span>
            <button
              v-if="data.sla_source === 'SYSTEM'"
              class="flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors"
              @click="showSlaTooltip = true"
            >
              <Info :size="14" />
              Info
            </button>
          </div>
        </div>
      </div>

      <!-- Alasan -->
      <div v-if="data.tpk_alasan" class="card">
        <h3 class="font-display font-bold text-navy text-sm mb-3 flex items-center gap-2">
          <FileText :size="15" /> Alasan Permintaan
        </h3>
        <p class="text-sm text-slate-700 font-semibold">{{ data.tpk_alasan }}</p>
        <p v-if="data.tpk_alasanlain" class="text-sm text-slate-600 mt-1">{{ data.tpk_alasanlain }}</p>
      </div>

      <!-- Jobdesk -->
      <div v-if="jobdesks.length > 0" class="card">
        <h3 class="font-display font-bold text-navy text-sm mb-3">Jobdesk</h3>
        <ol class="space-y-2">
          <li v-for="(k, i) in jobdesks" :key="i" class="flex gap-3 text-sm">
            <span class="text-sapphire font-bold w-5 shrink-0">{{ i + 1 }}.</span>
            <span class="text-slate-700">{{ k }}</span>
          </li>
        </ol>
      </div>

      <!-- Spesifikasi -->
      <div v-if="specs.length > 0" class="card">
        <h3 class="font-display font-bold text-navy text-sm mb-3">Spesifikasi yang Dibutuhkan</h3>
        <ul class="space-y-2">
          <li v-for="(s, i) in specs" :key="i" class="flex gap-2 text-sm">
            <CheckCircle2 :size="15" class="text-green-500 shrink-0 mt-0.5" />
            <span class="text-slate-700">{{ s }}</span>
          </li>
        </ul>
      </div>

      <!-- Approval Status -->
      <div class="card">
        <h3 class="font-display font-bold text-navy text-sm mb-4">Status Approval</h3>
        <div class="space-y-4">
          <!-- Approval Atasan -->
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold text-slate-700">Approval Atasan</span>
            <div class="flex items-center gap-1.5">
              <span :class="getApprovalItemMeta(data.tpk_approveatasan).color">
                <Clock v-if="data.tpk_approveatasan === 0" :size="16" />
                <CheckCircle2 v-else-if="[1, 9].includes(data.tpk_approveatasan)" :size="16" />
                <XCircle v-else-if="data.tpk_approveatasan === 2" :size="16" />
              </span>
              <span :class="`text-sm font-semibold ${getApprovalItemMeta(data.tpk_approveatasan).color}`">
                {{ getApprovalItemMeta(data.tpk_approveatasan).label }}
              </span>
              <span
                v-if="(data.tpk_approveatasan === 1 || data.tpk_approveatasan === 9) && data.tpk_tgl_approveatasan"
                class="text-xs text-slate-400 ml-1"
              >
                {{ formatDate(data.tpk_tgl_approveatasan) }}
              </span>
            </div>
          </div>

          <div class="border-t border-slate-100" />

          <!-- Approval HRD -->
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold text-slate-700">Approval HRD</span>
            <div class="flex items-center gap-1.5">
              <span :class="getApprovalItemMeta(data.tpk_approveHRD).color">
                <Clock v-if="data.tpk_approveHRD === 0" :size="16" />
                <CheckCircle2 v-else-if="data.tpk_approveHRD === 1" :size="16" />
                <XCircle v-else-if="data.tpk_approveHRD === 2" :size="16" />
              </span>
              <span :class="`text-sm font-semibold ${getApprovalItemMeta(data.tpk_approveHRD).color}`">
                {{ getApprovalItemMeta(data.tpk_approveHRD).label }}
              </span>
              <span
                v-if="(data.tpk_approveHRD === 1 || data.tpk_approveHRD === 9) && data.tpk_tgl_approveHRD"
                class="text-xs text-slate-400 ml-1"
              >
                {{ formatDate(data.tpk_tgl_approveHRD) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Log History -->
      <div v-if="logData.length > 0" class="card">
        <button
          class="w-full flex items-center justify-between"
          @click="logOpen = !logOpen"
        >
          <div class="flex items-center gap-2">
            <History :size="15" class="text-sapphire" />
            <span class="font-display font-bold text-navy text-sm">
              Log Perubahan ({{ logData.length }})
            </span>
          </div>
          <ChevronUp v-if="logOpen" :size="16" class="text-slate-400" />
          <ChevronDown v-else :size="16" class="text-slate-400" />
        </button>

        <div v-if="logOpen" class="mt-4 space-y-3">
          <div v-for="entry in logData" :key="entry.log_id" class="flex gap-3">
            <div class="w-8 h-8 rounded-full bg-sapphire/10 flex items-center justify-center shrink-0">
              <History :size="13" class="text-sapphire" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-xs font-semibold text-navy">{{ entry.user_nama || entry.user_kode || '–' }}</span>
                <span class="text-xs text-slate-400">{{ formatDate(entry.created_at) }}</span>
              </div>
              <div class="mt-1.5 bg-slate-50 rounded-xl px-3 py-2">
                <p class="text-xs font-semibold text-slate-500 mb-1">
                  {{ fieldLabel(entry.field_name) }}
                </p>
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-xs text-slate-400 line-through">
                    {{ entry.old_value || '(kosong)' }}
                  </span>
                  <ArrowRight :size="12" class="text-slate-300 shrink-0" />
                  <span class="text-xs font-semibold text-navy">
                    {{ entry.new_value || '(kosong)' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
    <!-- AKHIR KONTEN BAWAH -->

    <!-- SLA Tooltip Dialog -->
    <Teleport to="body">
      <div
        v-if="showSlaTooltip"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 modal-overlay"
        @click.self="showSlaTooltip = false"
      >
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 modal-content">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <Info :size="20" class="text-amber-600" />
            </div>
            <h3 class="font-display font-bold text-navy text-lg">Informasi Penyesuaian</h3>
          </div>
          <p class="text-sm text-slate-600 leading-relaxed">
            Sistem telah menyesuaikan tanggal kebutuhan secara otomatis berdasarkan persetujuan
            terakhir. Hal ini untuk memastikan waktu proses rekrutmen mencukupi sesuai standar
            <em>lead time</em> yang berlaku.
          </p>
          <button
            class="btn-primary w-full justify-center"
            @click="showSlaTooltip = false"
          >
            Mengerti
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>
