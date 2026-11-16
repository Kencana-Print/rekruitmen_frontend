<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  AlertTriangle,
  Building2,
  PauseCircle,
  PlayCircle,
  Search,
  ShieldCheck,
  StickyNote,
  Trash2,
  UserPlus,
} from 'lucide-vue-next'
import { masterApi } from '@/api/services'
import AnimatedIcon from '@/components/AnimatedIcon.vue'
import PaginationControls from '@/components/PaginationControls.vue'
import BypassUserCardSkeleton from '@/components/ui/BypassUserCardSkeleton.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorBox from '@/components/ui/ErrorBox.vue'
import Spinner from '@/components/ui/Spinner.vue'
import { useAsyncData } from '@/composables/useAsyncData'
import { usePagination } from '@/composables/usePagination'
import toast from '@/composables/useToast'
import { sanitizeApiError } from '@/utils/security'

const ITEMS_PER_PAGE = 10

function getFilterClasses(color: string, isActive: boolean): string {
  if (isActive) {
    const map: Record<string, string> = {
      sapphire: 'bg-white shadow text-sapphire',
      green: 'bg-white shadow text-green-600',
      slate: 'bg-white shadow text-slate-700',
    }
    return map[color] || 'bg-white shadow text-sapphire'
  }
  return 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
}

function getBadgeClasses(color: string): string {
  const map: Record<string, string> = {
    sapphire: 'bg-sapphire/10 text-sapphire',
    green: 'bg-green-100 text-green-700',
    slate: 'bg-slate-200 text-slate-700',
  }
  return map[color] || 'bg-sapphire/10 text-sapphire'
}

const filterActive = ref<number | null>(null)
const showAddModal = ref(false)
const deleteTarget = ref<any>(null)

const togglingNik = ref<string | null>(null)
const deleting = ref(false)
const adding = ref(false)

const { data: raw, isLoading, isError, reload } = useAsyncData(
  () => masterApi.getBypassUsers().then((r) => (r.data as any).data ?? []),
  [] as any[]
)

const filteredList = computed(() => {
  let list = [...raw.value]
  if (filterActive.value !== null) list = list.filter((u: any) => u.bu_active === filterActive.value)
  return list.sort(
    (a: any, b: any) =>
      b.bu_active - a.bu_active ||
      (a.kar_nama ?? a.bu_nik).localeCompare(b.kar_nama ?? b.bu_nik)
  )
})

const { currentPage, setCurrentPage, totalPages, paginatedData, totalItems } = usePagination(
  filteredList,
  ITEMS_PER_PAGE,
  computed(() => filterActive.value)
)

const aktifCount = computed(() => raw.value.filter((u: any) => u.bu_active === 1).length)
const nonAktifCount = computed(() => raw.value.filter((u: any) => u.bu_active === 0).length)

const FILTERS = computed(() => [
  { label: 'Semua', value: null as number | null, color: 'sapphire', count: raw.value.length },
  { label: 'Aktif', value: 1 as number | null, color: 'green', count: aktifCount.value },
  { label: 'Nonaktif', value: 0 as number | null, color: 'slate', count: nonAktifCount.value },
])

function selectFilter(value: number | null): void {
  filterActive.value = value
  setCurrentPage(1)
}

async function toggleBypassUser(item: any): Promise<void> {
  togglingNik.value = item.bu_nik
  try {
    await masterApi.updateBypassUser(item.bu_nik, {
      bu_active: item.bu_active === 1 ? 0 : 1,
    })
    await reload()
  } catch (e) {
    toast.error(sanitizeApiError(e, 'Gagal mengubah status'))
  } finally {
    togglingNik.value = null
  }
}

async function handleDelete(): Promise<void> {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await masterApi.deleteBypassUser(deleteTarget.value.bu_nik)
    toast.success('Bypass user berhasil dihapus')
    deleteTarget.value = null
    await reload()
  } catch (e) {
    toast.error(sanitizeApiError(e, 'Gagal menghapus'))
  } finally {
    deleting.value = false
  }
}

async function addBypassUser(nik: string, keterangan: string | null): Promise<void> {
  adding.value = true
  try {
    await masterApi.addBypassUser({
      bu_nik: nik,
      bu_keterangan: keterangan || undefined,
    })
    toast.success('Bypass user berhasil didaftarkan')
    showAddModal.value = false
    await reload()
  } catch (e) {
    toast.error(sanitizeApiError(e, 'Gagal mendaftarkan'))
  } finally {
    adding.value = false
  }
}

// ── Add modal state ──
const modalNik = ref('')
const modalKet = ref('')
const nikError = ref('')
const lookupState = ref<{ ok: boolean; data?: any; message?: string } | null>(null)
const isLooking = ref(false)

function openAddModal(): void {
  modalNik.value = ''
  modalKet.value = ''
  nikError.value = ''
  lookupState.value = null
  showAddModal.value = true
}

function closeAddModal(): void {
  if (!adding.value) showAddModal.value = false
}

async function handleLookup(): Promise<void> {
  const trimmed = modalNik.value.trim()
  if (!trimmed) {
    nikError.value = 'NIK tidak boleh kosong'
    return
  }
  nikError.value = ''
  isLooking.value = true
  lookupState.value = null
  try {
    const res = await masterApi.getKaryawanByNik(trimmed)
    const body = res.data as any
    if (body?.success && body?.data) {
      lookupState.value = { ok: true, data: body.data }
    } else {
      lookupState.value = { ok: false, message: body?.message ?? 'NIK tidak ditemukan' }
    }
  } catch (e) {
    lookupState.value = { ok: false, message: sanitizeApiError(e, 'NIK tidak ditemukan') }
  } finally {
    isLooking.value = false
  }
}

function handleNikInput(event: Event): void {
  modalNik.value = (event.target as HTMLInputElement).value
  nikError.value = ''
  lookupState.value = null
}

function handleModalSubmit(): void {
  if (lookupState.value?.ok) {
    addBypassUser(modalNik.value.trim(), modalKet.value.trim() || null)
  }
}

const canSubmit = computed(() => lookupState.value?.ok && !adding.value)
</script>

<template>
  <ErrorBox v-if="isError" message="Gagal memuat bypass users." @retry="reload" />

  <div v-else class="space-y-5 relative">
    <!-- STICKY HEADER -->
    <div
      class="sticky top-0 z-30 bg-white/80 backdrop-blur-md pb-4 pt-2 border-b border-slate-100 mb-5"
    >
      <div class="page-header mb-4">
        <div>
          <h1 class="page-title">Kelola Bypass Users</h1>
          <p class="text-sm text-slate-500 mt-0.5">
            Pengguna yang dapat mengajukan rekruitmen tanpa persetujuan atasan
          </p>
        </div>
      </div>

      <div
        class="flex flex-col xl:flex-row gap-3 items-stretch xl:items-center justify-between w-full"
      >
        <!-- Filter Chips -->
        <div class="flex gap-1 bg-slate-100 p-1 rounded-xl flex-wrap shrink-0">
          <template v-if="isLoading">
            <div v-for="i in 3" :key="i" class="skeleton h-8 w-20 rounded-lg" />
          </template>
          <template v-else>
            <button
              v-for="opt in FILTERS"
              :key="String(opt.value)"
              class="relative px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 flex items-center gap-1.5"
              :class="getFilterClasses(opt.color, filterActive === opt.value)"
              @click="selectFilter(opt.value)"
            >
              {{ opt.label }}
              <span
                class="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold transition-colors"
                :class="getBadgeClasses(opt.color)"
              >
                {{ opt.count }}
              </span>
            </button>
          </template>
        </div>

        <!-- Info Banner -->
        <div class="flex-1 flex items-center gap-2.5 min-h-[44px]">
          <AnimatedIcon variant="wiggle">
            <ShieldCheck :size="16" class="text-sapphire shrink-0" />
          </AnimatedIcon>
          <p class="text-[11px] font-medium text-slate-600 leading-snug">
            Bypass user dapat mengajukan permintaan rekruitmen langsung ke HRD tanpa perlu
            persetujuan atasan terlebih dahulu.
          </p>
        </div>

        <!-- Action Button -->
        <button
          class="btn-primary flex items-center justify-center gap-2 shrink-0 min-h-[44px] px-5"
          @click="openAddModal"
        >
          <AnimatedIcon variant="scale"><UserPlus :size="16" /></AnimatedIcon>
          Tambah Bypass User
        </button>
      </div>
    </div>

    <!-- ── CONTENT ── -->
    <div v-if="isLoading" class="space-y-4">
      <BypassUserCardSkeleton v-for="i in 5" :key="i" />
    </div>

    <EmptyState
      v-else-if="filteredList.length === 0"
      :message="
        filterActive !== null
          ? 'Tidak ada bypass user dengan filter ini.'
          : 'Belum ada bypass user terdaftar.'
      "
      :icon="ShieldCheck"
      :action-label="filterActive === null ? 'Tambah Bypass User' : ''"
      @action="openAddModal"
    />

    <div v-else class="space-y-3">
      <div class="space-y-4">
        <!-- BypassUserCard inline -->
        <div
          v-for="item in paginatedData"
          :key="item.bu_nik"
          class="card group transition-all duration-300 hover:shadow-card-hover hover:border-[#A6C5D7]"
          :class="item.bu_active !== 1 ? 'opacity-60 grayscale-[50%]' : ''"
        >
          <div class="flex items-start gap-4">
            <div
              class="w-12 h-12 rounded-full flex items-center justify-center shrink-0 font-black text-lg transition-colors"
              :class="
                item.bu_active === 1
                  ? 'bg-sapphire/10 text-sapphire group-hover:bg-sapphire/20'
                  : 'bg-slate-100 text-slate-400'
              "
            >
              {{ (item.kar_nama ?? item.bu_nik).charAt(0).toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <p
                  class="font-bold text-navy truncate group-hover:text-sapphire transition-colors"
                >
                  {{ item.kar_nama ?? item.bu_nik }}
                </p>
                <span
                  class="text-[10px] uppercase tracking-wide font-bold px-2.5 py-0.5 rounded-full transition-colors"
                  :class="
                    item.bu_active === 1
                      ? 'bg-green-100 text-green-700'
                      : 'bg-slate-100 text-slate-500'
                  "
                >
                  {{ item.bu_active === 1 ? 'Aktif' : 'Nonaktif' }}
                </span>
              </div>
              <p class="text-xs text-slate-400 mt-0.5">NIK: {{ item.bu_nik }}</p>
              <p v-if="item.jab_nama" class="text-xs text-sapphire mt-0.5 font-medium">
                {{ item.jab_nama }}
              </p>
            </div>
          </div>

          <div
            v-if="item.kar_bagian || item.bu_keterangan"
            class="mt-3 pt-3 border-t border-slate-100 space-y-2"
          >
            <div
              v-if="item.kar_bagian"
              class="flex items-center gap-2 text-xs text-slate-500"
            >
              <Building2 :size="13" class="text-slate-400 shrink-0" />
              {{ item.kar_bagian }}
            </div>
            <div
              v-if="item.bu_keterangan"
              class="flex items-start gap-2 text-xs text-slate-500"
            >
              <StickyNote :size="13" class="text-slate-400 shrink-0 mt-0.5" />
              <span class="leading-snug">{{ item.bu_keterangan }}</span>
            </div>
          </div>

          <div class="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
            <button
              class="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold border transition-colors disabled:opacity-40"
              :class="
                item.bu_active === 1
                  ? 'border-amber-300 text-amber-700 hover:bg-amber-50'
                  : 'border-green-300 text-green-700 hover:bg-green-50'
              "
              :disabled="togglingNik === item.bu_nik"
              @click="toggleBypassUser(item)"
            >
              <AnimatedIcon variant="scale">
                <Spinner v-if="togglingNik === item.bu_nik" :size="14" />
                <PauseCircle v-else-if="item.bu_active === 1" :size="14" />
                <PlayCircle v-else :size="14" />
              </AnimatedIcon>
              {{ item.bu_active === 1 ? 'Nonaktifkan' : 'Aktifkan' }}
            </button>
            <button
              class="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
              @click="deleteTarget = item"
            >
              <AnimatedIcon variant="wiggle"><Trash2 :size="14" /></AnimatedIcon>
              Hapus
            </button>
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

    <!-- Add Modal -->
    <Teleport to="body">
      <div
        v-if="showAddModal"
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4 modal-overlay backdrop-blur-sm"
        @click.self="closeAddModal"
      >
        <div
          class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 modal-content animate-in fade-in zoom-in-95 duration-200"
        >
          <div class="flex items-center gap-3 mb-5">
            <div class="w-10 h-10 rounded-xl bg-sapphire/10 flex items-center justify-center">
              <UserPlus :size="20" class="text-sapphire" />
            </div>
            <div>
              <h3 class="font-display font-bold text-navy text-lg">Tambah Bypass User</h3>
              <p class="text-xs text-slate-400">
                Cek NIK terlebih dahulu sebelum mendaftarkan
              </p>
            </div>
          </div>

          <div class="mb-4">
            <label class="label">NIK Karyawan <span class="text-red-500">*</span></label>
            <div class="flex gap-2">
              <div class="flex-1">
                <input
                  class="input focus:border-sapphire focus:ring-sapphire/30"
                  :class="
                    nikError || lookupState?.ok === false ? 'border-red-400' : ''
                  "
                  placeholder="Masukkan NIK"
                  :value="modalNik"
                  :disabled="adding || isLooking"
                  @input="handleNikInput"
                  @keydown.enter="handleLookup"
                />
                <p v-if="nikError" class="text-xs text-red-500 mt-1 font-medium">
                  {{ nikError }}
                </p>
                <p
                  v-if="lookupState?.ok === false"
                  class="text-xs text-red-500 mt-1 font-medium"
                >
                  {{ lookupState.message }}
                </p>
              </div>
              <button
                class="btn-secondary px-4 shrink-0 disabled:opacity-40"
                :disabled="!modalNik.trim() || adding || isLooking"
                @click="handleLookup"
              >
                <Spinner v-if="isLooking" :size="15" />
                <Search v-else :size="15" />
                Cek
              </button>
            </div>
          </div>

          <!-- Lookup result -->
          <div
            v-if="lookupState?.ok"
            class="bg-green-50 border border-green-200 rounded-xl p-4 mb-4"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center font-black text-green-700"
              >
                {{ lookupState.data.kar_nama.charAt(0).toUpperCase() }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-bold text-navy truncate">{{ lookupState.data.kar_nama }}</p>
                <p class="text-xs text-slate-400">NIK: {{ lookupState.data.kar_Nik }}</p>
                <p
                  v-if="lookupState.data.jab_nama"
                  class="text-xs text-green-700 mt-0.5 font-medium"
                >
                  {{ lookupState.data.jab_nama
                  }}{{ lookupState.data.kar_bagian ? ` · ${lookupState.data.kar_bagian}` : '' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Keterangan -->
          <div v-if="lookupState?.ok" class="mb-4">
            <label class="label">Keterangan (Opsional)</label>
            <textarea
              v-model="modalKet"
              class="input resize-none focus:border-sapphire focus:ring-sapphire/30"
              rows="3"
              placeholder="Contoh: Direktur Operasional — bypass by kebijakan BOD"
              :disabled="adding"
            />
            <p class="text-xs text-slate-400 mt-1">{{ modalKet.length }} karakter</p>
          </div>

          <!-- Warning banner -->
          <div
            class="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5"
          >
            <AnimatedIcon variant="wiggle">
              <AlertTriangle :size="14" class="text-amber-600 shrink-0 mt-0.5" />
            </AnimatedIcon>
            <p class="text-xs text-amber-700 leading-relaxed font-medium">
              Bypass user dapat mengajukan permintaan rekruitmen tanpa perlu persetujuan atasan.
            </p>
          </div>

          <div class="flex gap-3">
            <button
              class="btn-ghost flex-1 justify-center"
              :disabled="adding"
              @click="closeAddModal"
            >
              Batal
            </button>
            <button
              class="btn-primary flex-1 justify-center disabled:opacity-40"
              :disabled="!canSubmit"
              @click="handleModalSubmit"
            >
              <Spinner v-if="adding" :size="16" />
              <UserPlus v-else :size="16" />
              {{ adding ? 'Mendaftarkan...' : 'Daftarkan' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirm Dialog -->
    <ConfirmDialog
      :open="!!deleteTarget"
      title="Hapus Permanen?"
      :message="`Hapus bypass user ${deleteTarget?.kar_nama ?? deleteTarget?.bu_nik} (NIK: ${deleteTarget?.bu_nik}) secara permanen? Tindakan ini tidak dapat dibatalkan.`"
      confirm-text="Hapus Permanen"
      danger
      :loading="deleting"
      @close="deleteTarget = null"
      @confirm="handleDelete"
    />
  </div>
</template>
