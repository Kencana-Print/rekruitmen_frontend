<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft, BellRing, CheckCircle2, ChevronDown, ChevronUp,
  Clock, Edit3, Info, Loader2, Lock, LockOpen, User,
} from 'lucide-vue-next'
import { monitoringApi, recruitmentApi } from '@/api/services'
import ErrorBox from '@/components/ui/ErrorBox.vue'
import SlaDetailSkeleton from '@/components/ui/SlaDetailSkeleton.vue'
import Spinner from '@/components/ui/Spinner.vue'
import toast from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { formatDate, getDaysColor, getSlaStatusMeta } from '@/utils/helpers'
import { sanitizeApiError } from '@/utils/security'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const nomor = route.params.nomor as string

const isLoading = ref(true)
const isError = ref(false)
const data = ref<any>(null)

const hiredData = ref<any[]>([])

const showNoShow = ref(false)
const showEditable = ref(false)
const showComplete = ref(false)
const selectedRkt = ref<any>(null)
const historyOpen = ref(false)

// NoShow dialog state
const noShowDays = ref('')
const noShowKet = ref('')
const cancelLoading = ref(false)

// Editable dialog state
const editableKet = ref('')
const editableLoading = ref(false)

// Complete dialog state
const completeLoading = ref(false)

async function fetchData() {
  isLoading.value = true
  isError.value = false
  try {
    const r = await monitoringApi.slaDetail(nomor)
    data.value = r.data.data
  } catch {
    isError.value = true
  } finally {
    isLoading.value = false
  }
}

async function fetchHired() {
  try {
    const r = await recruitmentApi.hiredCandidates(nomor)
    hiredData.value = r.data.data ?? []
  } catch { /* silent */ }
}

onMounted(() => {
  fetchData()
  fetchHired()
})

const sla = computed(() => data.value?.sla_info)
const timeline = computed(() => data.value?.timeline)
const history = computed(() => data.value?.edit_history ?? [])
const approval = computed(() => data.value?.approval_info)

const isAtasan = computed(() =>
  !auth.isHrd && sla.value?.tpk_peminta && auth.user?.kode !== sla.value?.tpk_peminta
)

const daysRem = computed(() => Number(sla.value?.days_remaining ?? 0))
const isCompleted = computed(() => sla.value?.sla_status === 'COMPLETED')
const isEditable = computed(() => sla.value?.sla_is_editable === 1)
const daysColor = computed(() => getDaysColor(daysRem.value))
const meta = computed(() => getSlaStatusMeta(
  isCompleted.value ? 'COMPLETED'
  : isEditable.value ? 'NEED_USER_UPDATE'
  : daysRem.value < 0 ? 'OVERDUE'
  : daysRem.value <= 3 ? 'CRITICAL'
  : daysRem.value <= 7 ? 'WARNING'
  : 'ON_PROGRESS'
))

function buildTimeline(tl: any, slaInfo: any) {
  if (!tl) return []
  const items: { label: string; date: string; color: string }[] = []
  if (tl.request_created_at)
    items.push({ label: 'Permintaan Dibuat', date: tl.request_created_at, color: '#2E7D32' })
  if (tl.approved_at)
    items.push({ label: 'Disetujui Atasan', date: tl.approved_at, color: '#2E7D32' })
  if (tl.original_target_date && tl.original_target_date !== tl.final_target_date)
    items.push({ label: 'Tanggal Butuh Awal (User)', date: tl.original_target_date, color: '#0F52BA' })
  if (tl.system_floor_date && tl.system_floor_date !== tl.final_target_date && slaInfo?.sla_source === 'SYSTEM')
    items.push({ label: 'Estimasi Minimum Sistem', date: tl.system_floor_date, color: '#475569' })

  const finalLabel = slaInfo?.sla_source === 'USER'
    ? 'Target Disepakati (Sesuai Permintaan)'
    : slaInfo?.sla_source === 'SYSTEM'
      ? 'Target Disepakati (Sesuai Sistem)'
      : 'Target Final'
  items.push({ label: finalLabel, date: tl.final_target_date, color: '#0F52BA' })

  if (tl.max_target_date && tl.max_target_date !== tl.final_target_date)
    items.push({ label: 'Batas Maksimal', date: tl.max_target_date, color: '#F57C00' })
  return items
}

const timelineItems = computed(() => buildTimeline(timeline.value, sla.value))

// Mutations
async function cancelCandidate() {
  const daysNum = parseInt(noShowDays.value)
  cancelLoading.value = true
  try {
    await recruitmentApi.cancelCandidate(nomor, {
      rktNomor: selectedRkt.value.rkt_nomor,
      bufferDays: daysNum,
      keterangan: noShowKet.value,
    })
    toast.success(`Kandidat dibatalkan. Buffer +${daysNum} hari dicatat.`)
    showNoShow.value = false
    await fetchData()
    await fetchHired()
  } catch (e) {
    toast.error(sanitizeApiError(e, 'Gagal membatalkan kandidat.'))
  } finally {
    cancelLoading.value = false
  }
}

async function setEditableAction(isEdit: number, keterangan: string) {
  editableLoading.value = true
  try {
    await recruitmentApi.setEditable(nomor, { isEditable: isEdit, keterangan })
    toast.success(isEdit === 1 ? 'Izin edit dibuka.' : 'Izin edit ditutup.')
    showEditable.value = false
    await fetchData()
  } catch (e) {
    toast.error(sanitizeApiError(e, 'Gagal mengubah izin edit.'))
  } finally {
    editableLoading.value = false
  }
}

async function completeAction() {
  completeLoading.value = true
  try {
    await recruitmentApi.complete({ tpk_nomor: nomor })
    toast.success('Permintaan berhasil ditutup.')
    showComplete.value = false
    await fetchData()
  } catch (e) {
    toast.error(sanitizeApiError(e, 'Gagal menutup permintaan.'))
  } finally {
    completeLoading.value = false
  }
}

function openNoShow(c: any) {
  selectedRkt.value = c
  noShowDays.value = ''
  noShowKet.value = ''
  showNoShow.value = true
}

function openEditable() {
  editableKet.value = ''
  showEditable.value = true
}

const noShowValid = computed(() => {
  const daysNum = parseInt(noShowDays.value)
  return !isNaN(daysNum) && daysNum >= 1 && daysNum <= 30 && noShowKet.value.trim().length >= 5
})
</script>

<template>
  <SlaDetailSkeleton v-if="isLoading" />
  <ErrorBox v-else-if="isError || !data" message="Gagal memuat detail SLA." @retry="fetchData" />

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
            <h1 class="page-title">Detail SLA</h1>
            <p class="font-mono text-xs text-slate-500 font-semibold mt-0.5">{{ nomor }}</p>
          </div>
        </div>
      </div>

      <!-- Header Card -->
      <div class="card bg-gradient-to-br from-sapphire to-blue-700 text-white shadow-md">
        <p class="font-display font-bold text-xl">{{ sla?.jab_nama }}</p>
        <p class="text-blue-200 text-sm mt-0.5">{{ sla?.tpk_bagian }} · {{ nomor }}</p>
        <div class="flex items-center gap-4 mt-4">
          <span class="text-xs font-semibold px-3 py-1 bg-white/20 rounded-full text-white">{{ sla?.tpk_jumlah }} Posisi</span>
          <span class="text-xs font-semibold px-3 py-1 bg-white/20 rounded-full text-white">Min {{ sla?.sla_min_days }}–{{ sla?.sla_max_days }} hari</span>
        </div>
      </div>
    </div>

    <!-- KONTEN BAWAH -->
    <div class="space-y-5">

      <!-- Status Box -->
      <div class="card">
        <div class="rounded-xl p-6 text-center mb-4" :style="{ background: meta.bg }">
          <p class="text-5xl font-display font-black leading-none" :style="{ color: meta.text }">
            {{ isCompleted ? 'SELESAI' : daysRem < 0 ? 'TERLAMBAT' : daysRem === 0 ? 'HARI INI' : `${daysRem}` }}
          </p>
          <p v-if="!isCompleted && daysRem >= 0 && daysRem !== 0" class="text-sm mt-1" :style="{ color: meta.text }">hari tersisa</p>
          <p v-if="daysRem < 0 && !isCompleted" class="text-sm mt-1" :style="{ color: meta.text }">{{ -daysRem }} hari melewati batas</p>
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between py-1 border-b border-slate-50">
            <span class="text-xs text-slate-400">Status SLA</span>
            <span class="text-xs font-semibold" style="color: #000926">{{ sla?.sla_status || '–' }}</span>
          </div>
          <div class="flex items-center justify-between py-1 border-b border-slate-50">
            <span class="text-xs text-slate-400">Sumber</span>
            <span class="text-xs font-semibold" style="color: #000926">{{ sla?.sla_source || '–' }}</span>
          </div>
          <div class="flex items-center justify-between py-1 border-b border-slate-50">
            <span class="text-xs text-slate-400">Editable</span>
            <span class="text-xs font-semibold" :style="{ color: isEditable ? '#c2410c' : '#166534' }">
              {{ isEditable ? 'Ya – Perlu Update User' : 'Tidak' }}
            </span>
          </div>
          <div v-if="(sla?.sla_no_show_buffer_days ?? 0) > 0" class="flex items-center justify-between py-1 border-b border-slate-50">
            <span class="text-xs text-slate-400">Buffer No-Show</span>
            <span class="text-xs font-semibold" style="color: #f57c00">+{{ sla.sla_no_show_buffer_days }} hari</span>
          </div>
        </div>

        <div v-if="approval?.approver_name" class="mt-4 pt-4 border-t border-slate-100 space-y-2">
          <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Approval</p>
          <div class="flex items-center justify-between py-1 border-b border-slate-50">
            <span class="text-xs text-slate-400">Disetujui Oleh</span>
            <span class="text-xs font-semibold" style="color: #000926">{{ approval.approver_name }}</span>
          </div>
          <div class="flex items-center justify-between py-1 border-b border-slate-50">
            <span class="text-xs text-slate-400">Waktu Approval</span>
            <span class="text-xs font-semibold" :style="{ color: getDaysColor(-(approval.approval_delay_days ?? 0)) }">{{ approval.approval_delay_days }} hari</span>
          </div>
          <div
            v-if="approval.approval_flag === 'APPROVAL_DELAYED'"
            class="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-2.5 mt-2"
          >
            <Clock :size="13" class="text-amber-600" />
            <p class="text-xs text-amber-700 font-medium">Approval tertunda &gt;5 hari</p>
          </div>
        </div>
      </div>

      <!-- Timeline -->
      <div class="card">
        <p class="font-display font-bold text-navy text-sm mb-4">Timeline Rekrutmen</p>
        <div class="space-y-0">
          <div v-for="(t, i) in timelineItems" :key="i" class="flex gap-4">
            <div class="flex flex-col items-center">
              <div class="w-3 h-3 rounded-full border-2 mt-1 bg-white" :style="{ borderColor: t.color }" />
              <div v-if="i !== timelineItems.length - 1" class="w-px flex-1 bg-slate-200 my-1" />
            </div>
            <div :class="i !== timelineItems.length - 1 ? 'pb-5' : ''">
              <p class="text-sm font-semibold text-navy">{{ t.label }}</p>
              <p class="text-xs text-slate-400">{{ formatDate(t.date) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Card supervisory untuk Atasan -->
      <div
        v-if="isAtasan && !isCompleted && isEditable"
        class="card border-l-4 border-l-amber-400"
        style="background: #FFFBEB"
      >
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style="background: rgba(255,143,0,0.15)">
            <BellRing :size="20" class="text-amber-600" />
          </div>
          <div class="flex-1">
            <p class="font-semibold text-sm text-amber-800">
              Tindakan Diperlukan dari Bawahan
            </p>
            <p class="text-xs text-amber-700 mt-1 leading-relaxed">
              HRD telah membuka izin edit tanggal untuk permintaan ini.
              Ingatkan <strong>{{ sla?.nama_peminta }}</strong> untuk segera membuka
              aplikasi dan memperbarui tanggal target rekrutmen.
            </p>
            <div class="mt-2 bg-amber-100 rounded-lg px-3 py-2">
              <p class="text-xs text-amber-800 font-medium">
                💡 Hubungi {{ sla?.nama_peminta }} melalui pesan atau telepon agar update segera dilakukan sebelum batas waktu berakhir.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- HRD-only: Hired candidates -->
      <div v-if="auth.isHrd && hiredData.length > 0" class="card">
        <p class="font-display font-bold text-navy text-sm mb-3">Kandidat Diterima</p>
        <div class="space-y-2">
          <div v-for="c in hiredData" :key="c.rkt_nomor" class="flex items-center justify-between bg-slate-50 rounded-xl p-3">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <User :size="14" class="text-green-600" />
              </div>
              <div>
                <p class="text-sm font-semibold text-navy">{{ c.nama }}</p>
                <p class="text-xs text-slate-400 font-mono">{{ c.rkt_nomor }}</p>
              </div>
            </div>
            <button
              class="text-xs font-semibold px-3 py-1.5 rounded-xl border border-amber-300 text-amber-700 hover:bg-amber-50 transition-colors disabled:opacity-40"
              :disabled="c.is_grouped"
              @click="openNoShow(c)"
            >
              Batalkan
            </button>
          </div>
        </div>
      </div>

      <!-- HRD-only actions -->
      <div v-if="auth.isHrd && !isCompleted && sla?.sla_status === 'CALCULATED'" class="space-y-3">
        <div class="card border-l-4" :class="isEditable ? 'border-l-orange-400' : 'border-l-slate-300'">
          <div class="flex items-start gap-3 mb-3">
            <LockOpen v-if="isEditable" :size="18" class="text-orange-500 shrink-0" />
            <Lock v-else :size="18" class="text-slate-400 shrink-0" />
            <div>
              <p class="font-semibold text-sm" :class="isEditable ? 'text-orange-600' : 'text-navy'">
                {{ isEditable ? 'Izin Edit: Terbuka' : 'Izin Edit Tanggal' }}
              </p>
              <p class="text-xs text-slate-400 mt-0.5">
                {{ isEditable ? 'Peminta sedang dapat mengubah tanggal target' : 'Buka izin agar peminta dapat mengubah tanggal' }}
              </p>
            </div>
          </div>
          <button
            class="w-full text-sm font-semibold py-2 rounded-xl transition-colors"
            :class="isEditable ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-slate-700 text-white hover:bg-slate-800'"
            @click="openEditable"
          >
            {{ isEditable ? 'Tutup Izin Edit' : 'Buka Izin Edit untuk Peminta' }}
          </button>
        </div>

        <div class="card border-l-4 border-l-green-500">
          <div class="flex items-start gap-3 mb-3">
            <CheckCircle2 :size="18" class="text-green-600 shrink-0" />
            <div>
              <p class="font-semibold text-sm text-green-700">Tutup Permintaan Manual</p>
              <p class="text-xs text-slate-400 mt-0.5">Akhiri SLA jika rekrutmen sudah selesai</p>
            </div>
          </div>
          <button
            class="w-full text-sm font-semibold py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors"
            @click="showComplete = true"
          >
            Tutup Manual
          </button>
        </div>
      </div>

      <!-- Edit History -->
      <div v-if="history.length > 0" class="card">
        <button class="w-full flex items-center justify-between font-display font-bold text-navy text-sm" @click="historyOpen = !historyOpen">
          Riwayat Perubahan ({{ history.length }})
          <ChevronUp v-if="historyOpen" :size="16" />
          <ChevronDown v-else :size="16" />
        </button>
        <div v-if="historyOpen" class="mt-4 space-y-3">
          <div v-for="h in history" :key="h.log_id" class="flex gap-3">
            <div class="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <Edit3 :size="13" class="text-sapphire" />
            </div>
            <div class="flex-1">
              <p class="text-xs font-semibold text-navy">{{ h.user_nama || h.user_kode }}</p>
              <p class="text-xs text-slate-400">{{ formatDate(h.created_at) }}</p>
              <div class="mt-1 bg-slate-50 rounded-lg px-3 py-2">
                <p class="text-xs text-slate-600">
                  {{ h.field_name === 'no_show_buffer'
                    ? `No-show buffer: ${h.new_value}`
                    : `${h.field_name}: ${h.old_value || '–'} → ${h.new_value || '–'}` }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="sla?.sla_notes" class="card flex gap-3">
        <Info :size="16" class="text-sapphire shrink-0 mt-0.5" />
        <div>
          <p class="font-semibold text-sm text-navy mb-1">Catatan</p>
          <p class="text-xs text-slate-500 whitespace-pre-line leading-relaxed">{{ sla.sla_notes }}</p>
        </div>
      </div>
    </div>

    <!-- Dialogs -->

    <!-- NoShow Dialog -->
    <Teleport to="body">
      <div
        v-if="showNoShow && selectedRkt"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 modal-overlay"
        @click.self="showNoShow = false"
      >
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 modal-content">
          <h3 class="font-display font-bold text-navy text-lg mb-4">Batalkan Kandidat?</h3>
          <p class="text-sm font-semibold text-navy mb-1">{{ selectedRkt.nama }}</p>
          <p class="text-xs text-slate-400 mb-4">Buffer hari ini dikurangi dari gross duration saat menghitung KPI bersih HRD.</p>
          <div class="space-y-3">
            <div>
              <label class="label">Tambah berapa hari buffer? (1–30)</label>
              <input
                v-model="noShowDays"
                class="input"
                type="number"
                :min="1"
                :max="30"
                placeholder="Contoh: 3"
              />
            </div>
            <div>
              <label class="label">Keterangan</label>
              <textarea
                v-model="noShowKet"
                class="input resize-none"
                :rows="3"
                placeholder="Contoh: Kandidat tidak hadir 24 Feb"
              />
            </div>
          </div>
          <div class="flex gap-3 mt-4">
            <button class="btn-ghost flex-1 justify-center" @click="showNoShow = false">Batal</button>
            <button
              class="flex-1 py-2 rounded-xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              :disabled="!noShowValid || cancelLoading"
              @click="cancelCandidate"
            >
              <Loader2 v-if="cancelLoading" :size="15" class="animate-spin" />
              {{ cancelLoading ? 'Memproses...' : 'Batalkan & Catat' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Editable Dialog -->
    <Teleport to="body">
      <div
        v-if="showEditable"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 modal-overlay"
        @click.self="showEditable = false"
      >
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 modal-content">
          <!-- Close mode -->
          <template v-if="isEditable">
            <h3 class="font-display font-bold text-navy text-lg mb-4">Tutup Izin Edit?</h3>
            <p class="text-sm text-slate-600 mb-4">Izin edit akan ditutup. Peminta tidak dapat lagi mengubah tanggal target.</p>
            <div class="flex gap-3">
              <button class="btn-ghost flex-1 justify-center" @click="showEditable = false">Batal</button>
              <button
                class="flex-1 py-2 rounded-xl bg-orange-500 text-white font-semibold text-sm hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
                :disabled="editableLoading"
                @click="setEditableAction(0, 'Izin edit ditutup')"
              >
                <Loader2 v-if="editableLoading" :size="15" class="animate-spin" />
                Tutup Izin
              </button>
            </div>
          </template>
          <!-- Open mode -->
          <template v-else>
            <h3 class="font-display font-bold text-navy text-lg mb-4">Buka Izin Edit Tanggal</h3>
            <p class="text-xs text-slate-500 bg-slate-50 rounded-xl p-3 mb-3">Peminta akan dapat mengubah tanggal kebutuhan. SLA akan dihitung ulang setelah disimpan.</p>
            <label class="label">Alasan / Instruksi untuk Peminta</label>
            <textarea
              v-model="editableKet"
              class="input resize-none"
              :rows="3"
              placeholder="Contoh: Kandidat tidak hadir, mohon perbarui tanggal target"
            />
            <div class="flex gap-3 mt-4">
              <button class="btn-ghost flex-1 justify-center" @click="showEditable = false">Batal</button>
              <button
                class="flex-1 py-2 rounded-xl bg-slate-700 text-white font-semibold text-sm hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2"
                :disabled="editableKet.trim().length < 5 || editableLoading"
                @click="setEditableAction(1, editableKet)"
              >
                <Loader2 v-if="editableLoading" :size="15" class="animate-spin" />
                Buka Izin
              </button>
            </div>
          </template>
        </div>
      </div>
    </Teleport>

    <!-- Complete Dialog -->
    <Teleport to="body">
      <div
        v-if="showComplete"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 modal-overlay"
        @click.self="showComplete = false"
      >
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 modal-content">
          <h3 class="font-display font-bold text-navy text-lg mb-4">Tutup Permintaan?</h3>
          <p class="text-sm text-slate-600 mb-4">Tindakan ini akan menghentikan perhitungan SLA dan menandai rekrutmen Selesai (COMPLETED).</p>
          <div class="flex gap-3">
            <button class="btn-ghost flex-1 justify-center" @click="showComplete = false">Batal</button>
            <button
              class="flex-1 py-2 rounded-xl text-white font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-colors bg-green-600 hover:bg-green-700"
              :disabled="completeLoading"
              @click="completeAction"
            >
              <Loader2 v-if="completeLoading" :size="15" class="animate-spin" />
              {{ completeLoading ? 'Memproses...' : 'Ya, Tutup' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>
