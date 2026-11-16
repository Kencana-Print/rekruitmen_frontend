<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import {
  Building2,
  Check,
  Edit2,
  Plus,
  Save,
  ToggleLeft,
  ToggleRight,
  X,
} from 'lucide-vue-next'
import { masterApi } from '@/api/services'
import AnimatedIcon from '@/components/AnimatedIcon.vue'
import PaginationControls from '@/components/PaginationControls.vue'
import BagianCardSkeleton from '@/components/ui/BagianCardSkeleton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorBox from '@/components/ui/ErrorBox.vue'
import Spinner from '@/components/ui/Spinner.vue'
import { useAsyncData } from '@/composables/useAsyncData'
import { usePagination } from '@/composables/usePagination'
import toast from '@/composables/useToast'
import type { BagianItem } from '@/types'
import { formatDate } from '@/utils/helpers'
import { sanitizeApiError } from '@/utils/security'

const ITEMS_PER_PAGE = 15

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
const editTarget = ref<BagianItem | null>(null)
const editVal = ref('')
const editInputEl = ref<HTMLInputElement | null>(null)

const creating = ref(false)
const savingEdit = ref(false)
const toggling = ref(false)

const formValue = ref('')
const formError = ref('')

const { data: raw, isLoading, isError, reload } = useAsyncData(
  () => masterApi.getBagianList().then((r) => (r.data.data ?? []) as BagianItem[]),
  [] as BagianItem[]
)

const filteredList = computed<BagianItem[]>(() => {
  let list = [...raw.value]
  if (filterActive.value !== null) list = list.filter((b) => b.bag_active === filterActive.value)
  return list.sort(
    (a, b) => b.bag_active - a.bag_active || a.bag_nama.localeCompare(b.bag_nama)
  )
})

const { currentPage, setCurrentPage, totalPages, paginatedData, totalItems } = usePagination(
  filteredList,
  ITEMS_PER_PAGE,
  computed(() => filterActive.value)
)

const aktifCount = computed(() => raw.value.filter((b) => b.bag_active === 1).length)
const nonAktifCount = computed(() => raw.value.filter((b) => b.bag_active === 0).length)

const FILTERS = computed(() => [
  { label: 'Semua', value: null as number | null, color: 'sapphire', count: raw.value.length },
  { label: 'Aktif', value: 1 as number | null, color: 'green', count: aktifCount.value },
  { label: 'Nonaktif', value: 0 as number | null, color: 'slate', count: nonAktifCount.value },
])

function selectFilter(value: number | null): void {
  filterActive.value = value
  setCurrentPage(1)
}

function openAddModal(): void {
  formValue.value = ''
  formError.value = ''
  showAddModal.value = true
}

function closeAddModal(): void {
  if (!creating.value) showAddModal.value = false
}

async function createBagian(): Promise<void> {
  const trimmed = formValue.value.trim()
  if (!trimmed) {
    formError.value = 'Nama bagian tidak boleh kosong'
    return
  }
  if (trimmed.length > 100) {
    formError.value = 'Maksimal 100 karakter'
    return
  }
  formError.value = ''
  creating.value = true
  try {
    await masterApi.createBagian({ bag_nama: trimmed })
    toast.success('Bagian berhasil ditambahkan')
    showAddModal.value = false
    await reload()
  } catch (e) {
    toast.error(sanitizeApiError(e, 'Gagal menambahkan bagian'))
  } finally {
    creating.value = false
  }
}

function handleEdit(item: BagianItem): void {
  editVal.value = item.bag_nama
  editTarget.value = item
}

async function saveNama(): Promise<void> {
  const target = editTarget.value
  if (!target) return
  if (editVal.value.trim().length < 1) {
    toast.error('Nama tidak boleh kosong')
    return
  }
  savingEdit.value = true
  try {
    await masterApi.updateBagian(target.bag_id, { bag_nama: editVal.value.trim() })
    toast.success('Nama bagian diperbarui')
    editTarget.value = null
    await reload()
  } catch (e) {
    toast.error(sanitizeApiError(e, 'Gagal mengubah nama'))
  } finally {
    savingEdit.value = false
  }
}

async function toggleActive(item: BagianItem): Promise<void> {
  toggling.value = true
  try {
    await masterApi.updateBagian(item.bag_id, { bag_active: item.bag_active === 1 ? 0 : 1 })
    await reload()
  } catch (e) {
    toast.error(sanitizeApiError(e, 'Gagal mengubah status'))
  } finally {
    toggling.value = false
  }
}

watch(editTarget, async (target) => {
  if (target) {
    await nextTick()
    editInputEl.value?.focus()
  }
})
</script>

<template>
  <ErrorBox v-if="isError" message="Gagal memuat data bagian." @retry="reload" />

  <div v-else class="space-y-5 relative">
    <!-- STICKY HEADER -->
    <div
      class="sticky top-0 z-30 bg-white/80 backdrop-blur-md pb-4 pt-2 border-b border-slate-100 mb-5"
    >
      <div class="page-header mb-4">
        <div>
          <h1 class="page-title">Kelola Bagian / Departemen</h1>
          <p class="text-sm text-slate-500 mt-0.5">
            Manajemen master data bagian untuk dropdown form rekruitmen
          </p>
        </div>
      </div>

      <div
        class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between w-full"
      >
        <!-- Filter Chips -->
        <div class="flex gap-1 bg-slate-100 p-1 rounded-xl flex-wrap">
          <template v-if="isLoading">
            <div v-for="i in [1, 2, 3]" :key="i" class="skeleton h-8 w-20 rounded-lg" />
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

        <!-- Action Button -->
        <button class="btn-primary flex items-center gap-2 shrink-0" @click="openAddModal">
          <AnimatedIcon variant="scale"><Plus :size="16" /></AnimatedIcon>
          Tambah Bagian
        </button>
      </div>
    </div>

    <!-- ── CONTENT ── -->
    <div v-if="isLoading" class="space-y-3">
      <BagianCardSkeleton v-for="i in 6" :key="i" />
    </div>
    <EmptyState
      v-else-if="filteredList.length === 0"
      :message="
        filterActive !== null
          ? 'Tidak ada bagian dengan filter ini.'
          : 'Belum ada bagian. Tap + untuk menambah.'
      "
      :icon="Building2"
      :action-label="filterActive === null ? 'Tambah Bagian' : ''"
      @action="openAddModal"
    />
    <div v-else class="space-y-3">
      <div class="space-y-3">
        <div
          v-for="item in paginatedData"
          :key="item.bag_id"
          class="card group flex items-center gap-4 transition-all duration-300 hover:shadow-card-hover hover:border-[#A6C5D7]"
          :class="item.bag_active !== 1 ? 'opacity-60 grayscale-[50%]' : ''"
        >
          <div
            class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors"
            :class="
              item.bag_active === 1
                ? 'bg-sapphire/10 group-hover:bg-sapphire/20'
                : 'bg-slate-100'
            "
          >
            <Building2
              :size="20"
              :class="item.bag_active === 1 ? 'text-sapphire' : 'text-slate-400'"
            />
          </div>

          <div class="flex-1 min-w-0">
            <input
              v-if="editTarget?.bag_id === item.bag_id"
              ref="editInputEl"
              v-model="editVal"
              class="input text-sm py-1.5 px-3 h-9 border-sapphire focus:ring-sapphire/30"
              maxlength="100"
              autofocus
              @keydown.enter="saveNama"
            />
            <p
              v-else
              class="font-semibold text-navy truncate group-hover:text-sapphire transition-colors"
            >
              {{ item.bag_nama }}
            </p>
            <div class="flex items-center gap-2 mt-0.5">
              <span v-if="item.bag_created_by" class="text-xs text-slate-400">
                Oleh: {{ item.bag_created_by }}
              </span>
              <span v-if="item.bag_created_at" class="text-xs text-slate-300">
                · {{ formatDate(item.bag_created_at) }}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <template v-if="editTarget?.bag_id === item.bag_id">
              <button
                class="w-8 h-8 flex items-center justify-center rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors disabled:opacity-50"
                :disabled="savingEdit"
                @click="saveNama"
              >
                <Spinner v-if="savingEdit" :size="14" />
                <Check v-else :size="14" />
              </button>
              <button
                class="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                @click="editTarget = null"
              >
                <X :size="14" />
              </button>
            </template>
            <button
              v-else
              class="w-8 h-8 flex items-center justify-center rounded-lg text-sapphire hover:bg-sapphire/10 transition-colors"
              title="Edit nama"
              @click="handleEdit(item)"
            >
              <AnimatedIcon variant="scale"><Edit2 :size="14" /></AnimatedIcon>
            </button>
            <button
              class="w-8 h-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-40"
              :class="
                item.bag_active === 1
                  ? 'text-green-600 hover:bg-green-50'
                  : 'text-slate-400 hover:bg-slate-100'
              "
              :disabled="toggling"
              :title="item.bag_active === 1 ? 'Nonaktifkan' : 'Aktifkan'"
              @click="toggleActive(item)"
            >
              <AnimatedIcon variant="scale">
                <ToggleRight v-if="item.bag_active === 1" :size="20" />
                <ToggleLeft v-else :size="20" />
              </AnimatedIcon>
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
              <Building2 :size="20" class="text-sapphire" />
            </div>
            <h3 class="font-display font-bold text-navy text-lg">Tambah Bagian Baru</h3>
          </div>

          <div class="mb-4">
            <label class="label">
              Nama Bagian / Departemen <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formValue"
              class="input focus:border-sapphire focus:ring-sapphire/30"
              :class="formError ? 'border-red-400' : ''"
              placeholder="Contoh: Remote Software Developer, Sales Online"
              :disabled="creating"
              maxlength="100"
              autofocus
              @input="formError = ''"
              @keydown.enter="createBagian"
            />
            <p v-if="formError" class="text-xs text-red-500 mt-1 font-medium">{{ formError }}</p>
            <p class="text-xs text-slate-400 mt-1">{{ formValue.trim().length }}/100 karakter</p>
          </div>

          <div class="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3 mb-5">
            <AnimatedIcon variant="wiggle">
              <Building2 :size="14" class="text-sapphire shrink-0 mt-0.5" />
            </AnimatedIcon>
            <p class="text-xs text-sapphire leading-relaxed">
              Bagian yang ditambahkan akan langsung muncul di pilihan dropdown form permintaan
              rekruitmen.
            </p>
          </div>

          <div class="flex gap-3">
            <button class="btn-ghost flex-1 justify-center" :disabled="creating" @click="closeAddModal">
              Batal
            </button>
            <button
              class="btn-primary flex-1 justify-center"
              :disabled="creating"
              @click="createBagian"
            >
              <Spinner v-if="creating" :size="16" />
              <Save v-else :size="16" />
              {{ creating ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
