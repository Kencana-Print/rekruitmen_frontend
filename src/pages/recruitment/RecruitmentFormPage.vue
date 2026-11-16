<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Info,
  Loader2,
  Lock,
  Minus,
  Plus,
  Save,
} from 'lucide-vue-next'
import { masterApi, recruitmentApi } from '@/api/services'
import FormPageSkeleton from '@/components/ui/FormPageSkeleton.vue'
import toast from '@/composables/useToast'
import type { JabatanRule } from '@/types'
import { formatDate, toApiDate } from '@/utils/helpers'
import { sanitizeApiError } from '@/utils/security'
import { getMinAllowedDate, validateTglButuh } from '@/utils/workday'
import {
  addDays,
  addMonths,
  addYears,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  setMonth,
  setYear,
  startOfMonth,
  startOfWeek,
  subMonths,
  subYears,
} from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

interface JabatanItem {
  jab_kode: string
  jab_nama: string
  [key: string]: any
}

interface BagianOption {
  val: string
}

const route = useRoute()
const router = useRouter()
const nomor = computed(() => route.params.nomor as string | undefined)
const isEdit = computed(() => Boolean(nomor.value))

const jabatanList = ref<JabatanItem[]>([])
const bagianList = ref<{ kar_bagian: string }[]>([])
const jabatanRules = ref<JabatanRule[]>([])
const holidaysData = ref<string[]>([])

const detailLoading = ref(false)
const detail = ref<any>(null)

const jabatan = ref<JabatanItem | null>(null)
const bagian = ref('')
const tglButuh = ref('')
const jumlah = ref(1)
const alasan = ref('')
const ketList = ref<string[]>(Array(10).fill(''))
const specList = ref<string[]>(Array(10).fill(''))
const visKet = ref(3)
const visSpec = ref(3)
const isLocked = ref(false)
const isReSchedule = ref(false)
const slaInfo = ref<{ isEditable: boolean; notes: string | null; finalTargetDate: string | null } | null>(null)

const showJabatan = ref(false)
const showBagian = ref(false)
const showAlasan = ref(false)
const showDatePicker = ref(false)
const saving = ref(false)

const ALASAN_OPTS = ['Penambahan Karyawan', 'Penggantian Karyawan Keluar', 'Resign', 'Ekspansi', 'Lainnya']

onMounted(async () => {
  const [jabRes, bagRes, rulesRes, holRes] = await Promise.all([
    masterApi.jabatan().then(r => r.data.data ?? []).catch(() => []),
    masterApi.bagian().then(r => r.data.data ?? []).catch(() => []),
    masterApi.jabatanRules().then(r => r.data.data ?? []).catch(() => []),
    masterApi.holidays().then(r => r.data.data ?? []).catch(() => []),
  ])
  jabatanList.value = jabRes
  bagianList.value = bagRes
  jabatanRules.value = rulesRes
  holidaysData.value = holRes

  if (isEdit.value && nomor.value) {
    detailLoading.value = true
    try {
      const res = await recruitmentApi.detail(nomor.value)
      detail.value = res.data.data
    } catch {
      toast.error('Gagal memuat data permintaan.')
    } finally {
      detailLoading.value = false
    }
  }
})

watch(detail, (d) => {
  if (!d) return
  const found = jabatanList.value.find(j => j.jab_kode === d.jab_kode || j.jab_kode === d.tpk_jab_kode)
  jabatan.value = found ?? { jab_kode: d.tpk_jab_kode || d.jab_kode, jab_nama: d.jab_nama }
  bagian.value = d.tpk_bagian || ''
  tglButuh.value = d.tpk_tgl_butuh || ''
  jumlah.value = Number(d.tpk_jumlah) || 1
  alasan.value = d.tpk_alasan || ''

  const kets = Array(10).fill('')
  for (let i = 0; i < 10; i++) kets[i] = d[`tpk_keterangan${i === 0 ? '' : (i + 1)}`] || ''
  ketList.value = kets

  const specs = Array(10).fill('')
  for (let i = 0; i < 10; i++) specs[i] = d[`tpk_spesifikasi${i === 0 ? '' : (i + 1)}`] || ''
  specList.value = specs

  const filledKet = kets.filter(Boolean).length
  const filledSpec = specs.filter(Boolean).length
  visKet.value = Math.max(3, filledKet)
  visSpec.value = Math.max(3, filledSpec)

  const isDraft = d.tpk_approveatasan === 0 && d.tpk_approveHRD === 0
  const editable = d.sla_is_editable === 1
  isLocked.value = !isDraft && !editable
  isReSchedule.value = editable
  slaInfo.value = editable ? {
    isEditable: true,
    notes: d.sla_notes,
    finalTargetDate: d.sla_final_target_date,
  } : null
})

const vlResult = computed(() => {
  if (!jabatan.value || !tglButuh.value) return null
  return validateTglButuh(tglButuh.value, jabatan.value.jab_kode, jabatanRules.value, jumlah.value, isReSchedule.value, holidaysData.value)
})

const minDate = computed(() => {
  if (isReSchedule.value) {
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    return t
  }
  return jabatan.value
    ? (getMinAllowedDate(jabatan.value.jab_kode, jabatanRules.value, jumlah.value, holidaysData.value) ?? null)
    : null
})

function handleJumlahChange(delta: number) {
  jumlah.value = Math.max(1, jumlah.value + delta)
}

async function handleSave() {
  if (!jabatan.value) { toast.error('Pilih jabatan terlebih dahulu.'); return }
  if (!bagian.value) { toast.error('Pilih bagian terlebih dahulu.'); return }
  if (!tglButuh.value) { toast.error('Tentukan tanggal butuh.'); return }
  if (jumlah.value < 1 || isNaN(jumlah.value)) { toast.error('Jumlah tidak valid.'); return }
  if (!alasan.value && !isEdit.value) { toast.error('Pilih alasan permintaan.'); return }
  if (vlResult.value && !vlResult.value.valid) { toast.error(vlResult.value.message!); return }

  const [k1, k2, k3, k4, k5, k6, k7, k8, k9, k10] = ketList.value
  const [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10] = specList.value

  saving.value = true
  try {
    await recruitmentApi.save({
      tpk_nomor: nomor.value || undefined,
      jab_kode: jabatan.value.jab_kode,
      bagian: bagian.value,
      tgl_butuh: tglButuh.value,
      jumlah: jumlah.value,
      alasan: alasan.value || null,
      alasan_lain: null,
      tpk_keterangan: k1 || null, tpk_keterangan2: k2 || null, tpk_keterangan3: k3 || null,
      tpk_keterangan4: k4 || null, tpk_keterangan5: k5 || null, tpk_keterangan6: k6 || null,
      tpk_keterangan7: k7 || null, tpk_keterangan8: k8 || null, tpk_keterangan9: k9 || null,
      tpk_keterangan10: k10 || null,
      tpk_spesifikasi: s1 || null, tpk_spesifikasi2: s2 || null, tpk_spesifikasi3: s3 || null,
      tpk_spesifikasi4: s4 || null, tpk_spesifikasi5: s5 || null, tpk_spesifikasi6: s6 || null,
      tpk_spesifikasi7: s7 || null, tpk_spesifikasi8: s8 || null, tpk_spesifikasi9: s9 || null,
      tpk_spesifikasi10: s10 || null,
    })
    toast.success(isEdit.value ? 'Permintaan berhasil diperbarui!' : 'Permintaan berhasil dibuat!')
    router.push('/recruitment')
  } catch (e) {
    toast.error(sanitizeApiError(e, 'Gagal menyimpan.'))
  } finally {
    saving.value = false
  }
}

function updateKet(i: number, val: string) {
  const n = [...ketList.value]
  n[i] = val
  ketList.value = n
}

function updateSpec(i: number, val: string) {
  const n = [...specList.value]
  n[i] = val
  specList.value = n
}

// ── DatePickerModal logic ────────────────────────────────────────────────────
const dpViewDate = ref(new Date())
const dpViewMode = ref<'days' | 'months' | 'years'>('days')

function openDatePicker() {
  if (isLocked.value) return
  const initialDate = tglButuh.value ? new Date(tglButuh.value) : new Date()
  dpViewDate.value = initialDate
  dpViewMode.value = 'days'
  showDatePicker.value = true
}

const dpToday = computed(() => {
  const t = new Date()
  t.setHours(0, 0, 0, 0)
  return t
})

const dpDays = computed(() => {
  const start = startOfWeek(startOfMonth(dpViewDate.value), { weekStartsOn: 0 })
  const end = endOfWeek(endOfMonth(dpViewDate.value), { weekStartsOn: 0 })
  const days: Date[] = []
  let d = start
  while (!isAfter(d, end)) { days.push(d); d = addDays(d, 1) }
  return days
})

const dpMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

const dpYears = computed(() =>
  Array.from({ length: 12 }, (_, i) => dpViewDate.value.getFullYear() - 5 + i)
)

function dpHandlePrev() {
  if (dpViewMode.value === 'days') dpViewDate.value = subMonths(dpViewDate.value, 1)
  else if (dpViewMode.value === 'years') dpViewDate.value = subYears(dpViewDate.value, 12)
  else dpViewDate.value = subYears(dpViewDate.value, 1)
}

function dpHandleNext() {
  if (dpViewMode.value === 'days') dpViewDate.value = addMonths(dpViewDate.value, 1)
  else if (dpViewMode.value === 'years') dpViewDate.value = addYears(dpViewDate.value, 12)
  else dpViewDate.value = addYears(dpViewDate.value, 1)
}

function dpToggleViewMode() {
  if (dpViewMode.value === 'days') dpViewMode.value = 'months'
  else if (dpViewMode.value === 'months') dpViewMode.value = 'years'
  else dpViewMode.value = 'days'
}

function dpHeaderLabel(): string {
  if (dpViewMode.value === 'days') return format(dpViewDate.value, 'MMMM yyyy', { locale: idLocale })
  if (dpViewMode.value === 'months') return format(dpViewDate.value, 'yyyy')
  return `${dpYears.value[0]} - ${dpYears.value[dpYears.value.length - 1]}`
}

function dpDayClass(day: Date): string {
  const inMonth = isSameMonth(day, dpViewDate.value)
  const isSelected = tglButuh.value && isSameDay(day, new Date(tglButuh.value))
  const isDayToday = isSameDay(day, dpToday.value)
  const isDisabled = minDate.value && isBefore(day, minDate.value) && !isSameDay(day, minDate.value)

  if (isSelected) return 'bg-sapphire text-white font-bold shadow-md hover:bg-sapphire'
  if (!inMonth) return 'text-slate-300'
  if (isDisabled) return 'text-slate-200 cursor-not-allowed bg-slate-50/50'
  let cls = 'text-slate-600 hover:bg-slate-50'
  if (isDayToday) cls += ' font-bold text-sapphire border border-sapphire/30'
  return cls
}

function dpIsDayDisabled(day: Date): boolean {
  const inMonth = isSameMonth(day, dpViewDate.value)
  if (!inMonth) return true
  return Boolean(minDate.value && isBefore(day, minDate.value) && !isSameDay(day, minDate.value))
}

function dpHandleDayClick(day: Date) {
  if (dpIsDayDisabled(day)) return
  tglButuh.value = format(day, 'yyyy-MM-dd')
  showDatePicker.value = false
}

function dpSelectMonth(i: number) {
  dpViewDate.value = setMonth(dpViewDate.value, i)
  dpViewMode.value = 'days'
}

function dpSelectYear(y: number) {
  dpViewDate.value = setYear(dpViewDate.value, y)
  dpViewMode.value = 'months'
}

// ── DropdownModal logic ──────────────────────────────────────────────────────
const ddQuery = ref('')

const ddJabatanFiltered = computed(() => {
  if (!ddQuery.value) return jabatanList.value
  const q = ddQuery.value.toLowerCase()
  return jabatanList.value.filter(j => j.jab_nama.toLowerCase().includes(q))
})

const ddBagianItems = computed<BagianOption[]>(() =>
  bagianList.value.map(b => ({ val: b.kar_bagian }))
)

const ddBagianFiltered = computed(() => {
  if (!ddQuery.value) return ddBagianItems.value
  const q = ddQuery.value.toLowerCase()
  return ddBagianItems.value.filter(b => b.val.toLowerCase().includes(q))
})

const ddAlasanItems = computed(() => ALASAN_OPTS.map(a => ({ val: a })))

function openDropdown(which: 'jabatan' | 'bagian' | 'alasan') {
  ddQuery.value = ''
  if (which === 'jabatan') showJabatan.value = true
  else if (which === 'bagian') showBagian.value = true
  else showAlasan.value = true
}

function selectJabatan(j: JabatanItem) {
  jabatan.value = j
  tglButuh.value = ''
  showJabatan.value = false
}

function selectBagian(b: BagianOption) {
  bagian.value = b.val
  showBagian.value = false
}

function selectAlasan(a: { val: string }) {
  alasan.value = a.val
  showAlasan.value = false
}
</script>

<template>
  <FormPageSkeleton v-if="isEdit && detailLoading" />

  <div v-else class="space-y-5 max-w-3xl mx-auto">
    <div class="page-header">
      <div class="flex items-center gap-3">
        <button
          class="p-2 -ml-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-navy transition-all duration-150 shrink-0"
          title="Kembali"
          @click="router.go(-1)"
        >
          <ArrowLeft :size="20" />
        </button>

        <div>
          <h1 class="page-title">
            {{ isEdit ? 'Edit Permintaan' : 'Buat Permintaan' }}
          </h1>
          <p v-if="isEdit" class="text-xs text-slate-400 font-mono mt-0.5">
            {{ nomor }}
          </p>
        </div>
      </div>
      <button :disabled="saving || isLocked" class="btn-primary" @click="handleSave">
        <Loader2 v-if="saving" :size="16" class="animate-spin" />
        <Save v-else :size="16" />
        {{ saving ? 'Menyimpan...' : 'Simpan' }}
      </button>
    </div>

    <div v-if="isLocked" class="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
      <Lock :size="18" class="text-red-500 shrink-0 mt-0.5" />
      <div>
        <p class="font-semibold text-red-700 text-sm">Form Terkunci</p>
        <p class="text-xs text-red-500 mt-0.5">Permintaan telah disetujui atasan. Data utama tidak dapat diubah.</p>
      </div>
    </div>

    <div v-if="slaInfo?.isEditable" class="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-2xl p-4">
      <Info :size="18" class="text-sapphire shrink-0 mt-0.5" />
      <div>
        <p class="font-semibold text-sapphire text-sm">Re-schedule Diizinkan</p>
        <p class="text-xs text-slate-600 mt-0.5">{{ slaInfo.notes || 'Anda dapat mengubah tanggal target.' }}</p>
        <p v-if="slaInfo.finalTargetDate" class="text-xs text-slate-400 mt-1">
          Target saat ini: {{ formatDate(slaInfo.finalTargetDate) }}
        </p>
      </div>
    </div>

    <!-- Informasi Jabatan -->
    <div class="card space-y-4">
      <h3 class="font-display font-bold text-navy text-sm uppercase tracking-wide border-b border-slate-100 pb-2">Informasi Jabatan</h3>
      <div class="space-y-3">
        <!-- Jabatan -->
        <div>
          <label class="label">Jabatan</label>
          <button
            class="w-full flex items-center justify-between px-4 py-2.5 border rounded-xl text-sm transition-all border-slate-200"
            :class="isReSchedule || isLocked ? 'bg-slate-50 cursor-not-allowed opacity-60' : 'hover:border-sapphire cursor-pointer'"
            @click="!(isReSchedule || isLocked) && openDropdown('jabatan')"
          >
            <span :class="jabatan?.jab_nama ? 'text-navy' : 'text-slate-400'">{{ jabatan?.jab_nama || 'Pilih Jabatan' }}</span>
            <Lock v-if="isReSchedule || isLocked" :size="14" class="text-slate-300" />
            <ChevronDown v-else :size="16" class="text-slate-400" />
          </button>
        </div>
        <!-- Bagian -->
        <div>
          <label class="label">Bagian / Departemen</label>
          <button
            class="w-full flex items-center justify-between px-4 py-2.5 border rounded-xl text-sm transition-all border-slate-200"
            :class="isReSchedule || isLocked ? 'bg-slate-50 cursor-not-allowed opacity-60' : 'hover:border-sapphire cursor-pointer'"
            @click="!(isReSchedule || isLocked) && openDropdown('bagian')"
          >
            <span :class="bagian ? 'text-navy' : 'text-slate-400'">{{ bagian || 'Pilih Bagian' }}</span>
            <Lock v-if="isReSchedule || isLocked" :size="14" class="text-slate-300" />
            <ChevronDown v-else :size="16" class="text-slate-400" />
          </button>
        </div>
      </div>
    </div>

    <!-- Kebutuhan -->
    <div class="card space-y-4">
      <h3 class="font-display font-bold text-navy text-sm uppercase tracking-wide border-b border-slate-100 pb-2">Kebutuhan</h3>
      <div class="space-y-3">
        <div>
          <label class="label">Jumlah Karyawan</label>
          <div class="flex items-center gap-3">
            <button
              class="btn-ghost p-2 rounded-xl border border-slate-200"
              :disabled="isReSchedule || isLocked || jumlah <= 1"
              @click="handleJumlahChange(-1)"
            >
              <Minus :size="16" />
            </button>
            <span class="text-2xl font-display font-bold text-navy w-12 text-center">{{ jumlah }}</span>
            <button
              class="btn-ghost p-2 rounded-xl border border-slate-200"
              :disabled="isReSchedule || isLocked"
              @click="handleJumlahChange(1)"
            >
              <Plus :size="16" />
            </button>
            <span class="text-sm text-slate-400">orang</span>
          </div>
          <div
            v-if="jumlah > 1 && !isReSchedule && !isLocked"
            class="mt-2 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3"
          >
            <Info :size="14" class="text-amber-600 shrink-0 mt-0.5" />
            <p class="text-xs text-amber-700">
              Permintaan massal {{ jumlah }} orang — lead time akan ditambah buffer ekstra untuk koordinasi.
            </p>
          </div>
        </div>

        <div>
          <label class="label">Tanggal Dibutuhkan</label>
          <button
            class="w-full flex items-center justify-between px-4 py-2.5 border rounded-xl text-sm transition-all border-slate-200"
            :class="isLocked ? 'bg-slate-50 cursor-not-allowed opacity-60' : 'hover:border-sapphire cursor-pointer'"
            @click="openDatePicker"
          >
            <div class="flex items-center gap-2">
              <Calendar :size="16" class="text-slate-400" />
              <span :class="tglButuh ? 'text-navy' : 'text-slate-400'">
                {{ tglButuh ? formatDate(tglButuh) : 'Pilih Tanggal' }}
              </span>
            </div>
            <Lock v-if="isLocked" :size="14" class="text-slate-300" />
            <ChevronDown v-else :size="16" class="text-slate-400" />
          </button>

          <div
            v-if="jabatan && tglButuh && vlResult"
            class="mt-1.5 flex items-start gap-1.5 text-xs"
            :class="vlResult.valid ? 'text-green-600' : 'text-red-500'"
          >
            <template v-if="vlResult.valid">
              <CheckCircle2 :size="13" class="mt-0.5 shrink-0" />
              {{ isReSchedule ? 'Tanggal re-schedule valid.' : 'Sesuai target lead time HRD.' }}
            </template>
            <template v-else>
              <AlertTriangle :size="13" class="mt-0.5 shrink-0" />
              {{ vlResult.message }}
            </template>
          </div>

          <p v-if="jabatan && !tglButuh && minDate" class="mt-1 text-xs text-slate-400">
            Minimal: {{ isReSchedule ? 'hari ini' : formatDate(toApiDate(minDate.getTime())) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Alasan Permintaan -->
    <div class="card space-y-4">
      <h3 class="font-display font-bold text-navy text-sm uppercase tracking-wide border-b border-slate-100 pb-2">Alasan Permintaan</h3>
      <div>
        <label class="label">Alasan</label>
        <button
          class="w-full flex items-center justify-between px-4 py-2.5 border rounded-xl text-sm transition-all border-slate-200"
          :class="isReSchedule || isLocked ? 'bg-slate-50 cursor-not-allowed opacity-60' : 'hover:border-sapphire cursor-pointer'"
          @click="!(isReSchedule || isLocked) && openDropdown('alasan')"
        >
          <span :class="alasan ? 'text-navy' : 'text-slate-400'">{{ alasan || 'Pilih Alasan' }}</span>
          <Lock v-if="isReSchedule || isLocked" :size="14" class="text-slate-300" />
          <ChevronDown v-else :size="16" class="text-slate-400" />
        </button>
      </div>
    </div>

    <!-- Jobdesk -->
    <div class="card space-y-4">
      <h3 class="font-display font-bold text-navy text-sm uppercase tracking-wide border-b border-slate-100 pb-2">Jobdesk (Opsional)</h3>
      <div class="space-y-2">
        <input
          v-for="(v, i) in ketList.slice(0, visKet)"
          :key="i"
          class="input"
          :placeholder="`Jobdesk ${i + 1}`"
          :value="v"
          :disabled="isReSchedule || isLocked"
          @input="updateKet(i, ($event.target as HTMLInputElement).value)"
        />
        <button
          v-if="visKet < 10 && !isLocked && !isReSchedule"
          class="btn-ghost text-xs"
          @click="visKet++"
        >
          <Plus :size="14" /> Tambah Baris
        </button>
      </div>
    </div>

    <!-- Spesifikasi -->
    <div class="card space-y-4">
      <h3 class="font-display font-bold text-navy text-sm uppercase tracking-wide border-b border-slate-100 pb-2">Spesifikasi yang Dibutuhkan (Opsional)</h3>
      <div class="space-y-2">
        <input
          v-for="(v, i) in specList.slice(0, visSpec)"
          :key="i"
          class="input"
          :placeholder="`Spesifikasi ${i + 1}`"
          :value="v"
          :disabled="isReSchedule || isLocked"
          @input="updateSpec(i, ($event.target as HTMLInputElement).value)"
        />
        <button
          v-if="visSpec < 10 && !isLocked && !isReSchedule"
          class="btn-ghost text-xs"
          @click="visSpec++"
        >
          <Plus :size="14" /> Tambah Baris
        </button>
      </div>
    </div>

    <div class="pt-2 pb-6">
      <button
        :disabled="saving || isLocked"
        class="btn-primary w-full justify-center h-11 text-base"
        @click="handleSave"
      >
        <Loader2 v-if="saving" :size="18" class="animate-spin" />
        <Save v-else :size="18" />
        {{ saving ? 'Menyimpan...' : 'Simpan Permintaan' }}
      </button>
    </div>

    <!-- Jabatan Dropdown Modal -->
    <Teleport to="body">
      <div
        v-if="showJabatan"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        @click.self="showJabatan = false"
      >
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
          <div class="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100">
            <h3 class="font-display font-bold text-navy">Pilih Jabatan</h3>
            <button class="btn-ghost p-1 text-slate-400" @click="showJabatan = false">&#10005;</button>
          </div>
          <div class="px-5 pt-3">
            <input
              class="input"
              placeholder="Cari..."
              :value="ddQuery"
              autofocus
              @input="ddQuery = ($event.target as HTMLInputElement).value"
            />
          </div>
          <div class="overflow-y-auto flex-1 px-3 py-2">
            <button
              v-for="item in ddJabatanFiltered"
              :key="item.jab_kode"
              class="w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors"
              :class="item.jab_kode === jabatan?.jab_kode
                ? 'bg-sapphire/10 text-sapphire font-semibold'
                : 'hover:bg-slate-50 text-slate-700'"
              @click="selectJabatan(item)"
            >
              {{ item.jab_nama }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Bagian Dropdown Modal -->
    <Teleport to="body">
      <div
        v-if="showBagian"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        @click.self="showBagian = false"
      >
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
          <div class="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100">
            <h3 class="font-display font-bold text-navy">Pilih Bagian</h3>
            <button class="btn-ghost p-1 text-slate-400" @click="showBagian = false">&#10005;</button>
          </div>
          <div class="px-5 pt-3">
            <input
              class="input"
              placeholder="Cari..."
              :value="ddQuery"
              autofocus
              @input="ddQuery = ($event.target as HTMLInputElement).value"
            />
          </div>
          <div class="overflow-y-auto flex-1 px-3 py-2">
            <button
              v-for="item in ddBagianFiltered"
              :key="item.val"
              class="w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors"
              :class="item.val === bagian
                ? 'bg-sapphire/10 text-sapphire font-semibold'
                : 'hover:bg-slate-50 text-slate-700'"
              @click="selectBagian(item)"
            >
              {{ item.val }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Alasan Dropdown Modal -->
    <Teleport to="body">
      <div
        v-if="showAlasan"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        @click.self="showAlasan = false"
      >
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
          <div class="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100">
            <h3 class="font-display font-bold text-navy">Pilih Alasan</h3>
            <button class="btn-ghost p-1 text-slate-400" @click="showAlasan = false">&#10005;</button>
          </div>
          <div class="overflow-y-auto flex-1 px-3 py-2">
            <button
              v-for="item in ddAlasanItems"
              :key="item.val"
              class="w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors"
              :class="item.val === alasan
                ? 'bg-sapphire/10 text-sapphire font-semibold'
                : 'hover:bg-slate-50 text-slate-700'"
              @click="selectAlasan(item)"
            >
              {{ item.val }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- DatePicker Modal -->
    <Teleport to="body">
      <div
        v-if="showDatePicker"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        @click.self="showDatePicker = false"
      >
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-[22rem] p-5">

          <div class="flex items-center justify-between mb-4">
            <button
              class="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
              @click="dpHandlePrev"
            >
              <ChevronLeft :size="16" />
            </button>

            <button
              class="text-[15px] font-bold text-navy capitalize hover:bg-slate-100 px-3 py-1 rounded-lg transition-colors"
              @click="dpToggleViewMode"
            >
              {{ dpHeaderLabel() }}
            </button>

            <button
              class="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
              @click="dpHandleNext"
            >
              <ChevronRight :size="16" />
            </button>
          </div>

          <div class="min-h-[220px]">
            <!-- Days view -->
            <template v-if="dpViewMode === 'days'">
              <div class="grid grid-cols-7 mb-2">
                <div
                  v-for="d in ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']"
                  :key="d"
                  class="text-center text-[10px] font-bold text-slate-400"
                >
                  {{ d }}
                </div>
              </div>
              <div class="grid grid-cols-7 gap-y-1">
                <button
                  v-for="(day, i) in dpDays"
                  :key="i"
                  :disabled="dpIsDayDisabled(day)"
                  class="h-9 w-9 mx-auto rounded-full text-xs flex items-center justify-center transition-all"
                  :class="dpDayClass(day)"
                  @click="dpHandleDayClick(day)"
                >
                  {{ day.getDate() }}
                </button>
              </div>
            </template>

            <!-- Months view -->
            <div v-if="dpViewMode === 'months'" class="grid grid-cols-3 gap-2">
              <button
                v-for="(m, i) in dpMonths"
                :key="m"
                class="py-3 text-sm font-semibold rounded-xl transition-colors"
                :class="dpViewDate.getMonth() === i ? 'bg-sapphire text-white' : 'text-slate-600 hover:bg-slate-100'"
                @click="dpSelectMonth(i)"
              >
                {{ m }}
              </button>
            </div>

            <!-- Years view -->
            <div v-if="dpViewMode === 'years'" class="grid grid-cols-3 gap-2">
              <button
                v-for="y in dpYears"
                :key="y"
                class="py-3 text-sm font-semibold rounded-xl transition-colors"
                :class="dpViewDate.getFullYear() === y ? 'bg-sapphire text-white' : 'text-slate-600 hover:bg-slate-100'"
                @click="dpSelectYear(y)"
              >
                {{ y }}
              </button>
            </div>
          </div>

          <div class="mt-4 pt-4 border-t border-slate-100 flex justify-end">
            <button class="btn-ghost text-sm px-4" @click="showDatePicker = false">Batal</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
