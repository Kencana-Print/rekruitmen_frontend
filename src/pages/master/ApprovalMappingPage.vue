<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import {
  Building2,
  Check,
  Edit2,
  GitMerge,
  Layers,
  Plus,
  ToggleLeft,
  ToggleRight,
  Trash2,
  User,
  X,
} from 'lucide-vue-next'
import { masterApi } from '@/api/services'
import AnimatedIcon from '@/components/AnimatedIcon.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorBox from '@/components/ui/ErrorBox.vue'
import Spinner from '@/components/ui/Spinner.vue'
import { useAsyncData } from '@/composables/useAsyncData'
import toast from '@/composables/useToast'
import type { BagianItem } from '@/types'
import { sanitizeApiError } from '@/utils/security'

const clean = (value: any): string => (value ?? '').toString().trim()
const nullable = (value: any): string | null => {
  const v = clean(value).toUpperCase()
  return v ? v : null
}

function scopeLabel(item: any): string {
  const dep = clean(item.am_dep_kode)
  const pab = clean(item.am_pab_kode)
  if (dep && pab) return `${dep} · ${pab}`
  if (pab) return `Plant ${pab}`
  if (dep) return `Dept ${dep}`
  return 'Global'
}

function priorityLabel(value: any): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return 100
  return n
}

function validateNik(nik: string): string | null {
  const trimmed = clean(nik)
  if (!trimmed) return 'NIK tidak boleh kosong'
  if (trimmed.length > 20) return 'NIK maksimal 20 karakter'
  if (!/^[a-zA-Z0-9]+$/.test(trimmed)) return 'NIK hanya boleh berisi huruf dan angka'
  return null
}

function validatePriority(priority: string | number): string | null {
  const n = Number(priority)
  if (!Number.isInteger(n) || n < 1 || n > 999) return 'Priority harus angka 1–999'
  return null
}

const showAddModal = ref(false)
const editingId = ref<number | null>(null)
const editForm = reactive({ nik: '', dep: '', pab: '', priority: '100' })

const toggling = ref(false)
const savingEdit = ref(false)
const deleting = ref(false)
const deleteTarget = ref<any>(null)

const { data: raw, isLoading, isError, reload } = useAsyncData(
  () => masterApi.getApprovalMapping().then((r) => (r.data as any).data ?? []),
  [] as any[]
)

const { data: bagianList } = useAsyncData(
  () => masterApi.getBagianList().then((r) => (r.data as any).data ?? []),
  [] as BagianItem[]
)

const activeMappings = computed(() => raw.value.filter((r: any) => Number(r.am_active) === 1))
const globalCount = computed(
  () =>
    activeMappings.value.filter(
      (r: any) => !clean(r.am_dep_kode) && !clean(r.am_pab_kode)
    ).length
)

const activeBagianList = computed(() =>
  bagianList.value.filter((b: BagianItem) => Number(b.bag_active) === 1)
)

async function handleToggle(item: any): Promise<void> {
  const isActive = Number(item.am_active) === 1
  toggling.value = true
  try {
    await masterApi.updateApprovalMapping(item.am_id, { am_active: isActive ? 0 : 1 })
    await reload()
  } catch (e) {
    toast.error(sanitizeApiError(e, 'Gagal mengubah status'))
  } finally {
    toggling.value = false
  }
}

function handleStartEdit(item: any): void {
  editingId.value = item.am_id
  editForm.nik = clean(item.am_approver_nik)
  editForm.dep = clean(item.am_dep_kode)
  editForm.pab = clean(item.am_pab_kode)
  editForm.priority = String(priorityLabel(item.am_priority))
}

function handleCancelEdit(): void {
  editingId.value = null
  editForm.nik = ''
  editForm.dep = ''
  editForm.pab = ''
  editForm.priority = '100'
}

async function handleSaveEdit(id: number): Promise<void> {
  const nikErr = validateNik(editForm.nik)
  if (nikErr) { toast.error(nikErr); return }
  const prioErr = validatePriority(editForm.priority)
  if (prioErr) { toast.error(prioErr); return }

  savingEdit.value = true
  try {
    await masterApi.updateApprovalMapping(id, {
      am_approver_nik: clean(editForm.nik),
      am_dep_kode: nullable(editForm.dep),
      am_pab_kode: nullable(editForm.pab),
      am_priority: Number(editForm.priority),
    })
    toast.success('Mapping approval berhasil diupdate')
    handleCancelEdit()
    await reload()
  } catch (e) {
    toast.error(sanitizeApiError(e, 'Gagal mengupdate mapping'))
  } finally {
    savingEdit.value = false
  }
}

function confirmDelete(item: any): void {
  deleteTarget.value = item
}

async function handleDelete(): Promise<void> {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await masterApi.deleteApprovalMapping(deleteTarget.value.am_id)
    toast.success('Mapping berhasil dihapus')
    deleteTarget.value = null
    await reload()
  } catch (e) {
    toast.error(sanitizeApiError(e, 'Gagal menghapus mapping'))
  } finally {
    deleting.value = false
  }
}

// ── Modal form state ──
const modalBagian = ref('')
const modalNik = ref('')
const modalDep = ref('')
const modalPab = ref('')
const modalPriority = ref('100')
const creating = ref(false)

function openAddModal(): void {
  modalBagian.value = ''
  modalNik.value = ''
  modalDep.value = ''
  modalPab.value = ''
  modalPriority.value = '100'
  showAddModal.value = true
}

function closeAddModal(): void {
  if (!creating.value) showAddModal.value = false
}

async function handleCreate(): Promise<void> {
  if (!modalBagian.value) { toast.error('Pilih bagian terlebih dahulu'); return }
  const nikErr = validateNik(modalNik.value)
  if (nikErr) { toast.error(nikErr); return }
  const prioErr = validatePriority(modalPriority.value)
  if (prioErr) { toast.error(prioErr); return }

  creating.value = true
  try {
    await masterApi.addApprovalMapping({
      am_bagian: modalBagian.value,
      am_approver_nik: clean(modalNik.value),
      am_dep_kode: nullable(modalDep.value),
      am_pab_kode: nullable(modalPab.value),
      am_priority: Number(modalPriority.value),
    })
    toast.success('Mapping berhasil disimpan')
    showAddModal.value = false
    await reload()
  } catch (e) {
    toast.error(sanitizeApiError(e, 'Gagal menyimpan mapping'))
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <ErrorBox v-if="isError" message="Gagal memuat data mapping approval." @retry="reload" />

  <div v-else class="space-y-5 relative">
    <!-- STICKY HEADER -->
    <div
      class="sticky top-0 z-30 bg-white/80 backdrop-blur-md pb-4 pt-2 border-b border-slate-100 mb-5"
    >
      <div class="page-header flex justify-between items-start gap-4">
        <div>
          <h1 class="page-title">Mapping Approval Departemen</h1>
          <p class="text-sm text-slate-500 mt-0.5">
            Atur scope approval berdasarkan bagian, departemen, plant/pabrik, dan priority.
          </p>
          <p class="text-xs text-slate-400 mt-1">
            Resolver: bagian+dep+pab &rarr; bagian+pab &rarr; bagian+dep &rarr; global &rarr;
            fallback atasan karyawan.
          </p>
        </div>
        <button class="btn-primary flex items-center gap-2" @click="openAddModal">
          <AnimatedIcon variant="scale"><Plus :size="16" /></AnimatedIcon>
          Tambah Mapping
        </button>
      </div>
    </div>

    <!-- Global warning -->
    <div
      v-if="globalCount > 0"
      class="rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3 text-sm text-amber-700"
    >
      <b>{{ globalCount }}</b> mapping aktif masih bersifat global. Ini aman untuk bagian yang
      memang berlaku umum, tetapi untuk area lintas plant sebaiknya isi Dept/Plant.
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="skeleton h-32 w-full rounded-2xl" />
    </div>

    <!-- Empty -->
    <EmptyState
      v-else-if="raw.length === 0"
      message="Belum ada mapping atasan khusus. Semua persetujuan akan mengikuti relasi atasan default."
      :icon="GitMerge"
    />

    <!-- Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="item in raw"
        :key="item.am_id"
        class="card group flex flex-col gap-3 transition-all duration-300 hover:shadow-md"
        :class="Number(item.am_active) === 1 ? 'border-sapphire/20' : 'opacity-60 grayscale-[50%]'"
      >
        <!-- Top row -->
        <div class="flex justify-between items-start gap-3">
          <div class="min-w-0">
            <div class="flex items-center gap-2 text-navy font-bold">
              <Building2 :size="16" class="text-sapphire shrink-0" />
              <span class="truncate">{{ item.am_bagian }}</span>
            </div>
            <div class="flex flex-wrap gap-1.5 mt-2">
              <span
                class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
              >
                <Layers :size="11" /> {{ scopeLabel(item) }}
              </span>
              <span
                class="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600"
              >
                Priority {{ priorityLabel(item.am_priority) }}
              </span>
            </div>
          </div>
          <div class="flex gap-1 shrink-0">
            <button
              class="btn-icon p-1.5"
              :class="Number(item.am_active) === 1 ? 'text-green-600' : 'text-slate-400'"
              :disabled="toggling"
              :title="Number(item.am_active) === 1 ? 'Nonaktifkan' : 'Aktifkan'"
              @click="handleToggle(item)"
            >
              <ToggleRight v-if="Number(item.am_active) === 1" :size="20" />
              <ToggleLeft v-else :size="20" />
            </button>

            <button
              v-if="editingId !== item.am_id"
              class="btn-icon p-1.5 text-slate-400 hover:text-sapphire hover:bg-ice-blue"
              title="Edit mapping"
              @click="handleStartEdit(item)"
            >
              <Edit2 :size="15" />
            </button>

            <button
              class="btn-icon p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50"
              :disabled="deleting"
              title="Hapus mapping"
              @click="confirmDelete(item)"
            >
              <Trash2 :size="15" />
            </button>
          </div>
        </div>

        <!-- Editing form -->
        <div
          v-if="editingId === item.am_id"
          class="bg-blue-50 rounded-xl p-3 border border-blue-100 space-y-3"
        >
          <div>
            <label class="text-xs font-semibold text-sapphire">NIK Approver</label>
            <input
              v-model="editForm.nik"
              class="input font-mono text-sm"
              placeholder="Masukkan NIK"
              maxlength="20"
              autofocus
            />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-xs font-semibold text-sapphire">Dept kode</label>
              <input
                :value="editForm.dep"
                class="input text-sm uppercase"
                placeholder="Opsional, contoh PRD2"
                maxlength="20"
                @input="editForm.dep = ($event.target as HTMLInputElement).value.toUpperCase()"
              />
            </div>
            <div>
              <label class="text-xs font-semibold text-sapphire">Plant/Pab kode</label>
              <input
                :value="editForm.pab"
                class="input text-sm uppercase"
                placeholder="Opsional, contoh P04"
                maxlength="20"
                @input="editForm.pab = ($event.target as HTMLInputElement).value.toUpperCase()"
              />
            </div>
          </div>
          <div>
            <label class="text-xs font-semibold text-sapphire">Priority</label>
            <input
              v-model="editForm.priority"
              class="input text-sm"
              type="number"
              min="1"
              max="999"
            />
            <p class="text-[11px] text-slate-400 mt-1">
              Angka kecil lebih diprioritaskan. Gunakan 10 untuk scope khusus dan 100 untuk
              default.
            </p>
          </div>
          <div class="flex gap-2 pt-1">
            <button
              class="btn-primary flex-1 justify-center flex items-center gap-1.5 text-xs py-1.5"
              :disabled="savingEdit"
              @click="handleSaveEdit(item.am_id)"
            >
              <Spinner v-if="savingEdit" :size="13" />
              <template v-else><Check :size="13" /> Simpan</template>
            </button>
            <button
              class="btn-ghost flex-1 justify-center flex items-center gap-1.5 text-xs py-1.5"
              :disabled="savingEdit"
              @click="handleCancelEdit"
            >
              <X :size="13" /> Batal
            </button>
          </div>
        </div>

        <!-- Approver info (read-only) -->
        <div
          v-else
          class="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center gap-3"
        >
          <div
            class="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0"
          >
            <User :size="18" class="text-slate-400" />
          </div>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-slate-700 truncate">
              <template v-if="item.approver_name">{{ item.approver_name }}</template>
              <span v-else class="text-red-400 italic">NIK tidak ditemukan</span>
            </p>
            <p class="text-xs text-slate-500 font-mono">{{ item.am_approver_nik }}</p>
            <p
              v-if="clean(item.approver_dep_kode) || clean(item.approver_pab_kode)"
              class="text-[10px] text-slate-400 mt-0.5"
            >
              Area approver: {{ clean(item.approver_dep_kode) || '-' }} ·
              {{ clean(item.approver_pab_kode) || '-' }}
            </p>
            <p
              v-if="item.approver_jabatan"
              class="text-[10px] text-sapphire uppercase tracking-wider mt-0.5"
            >
              {{ item.approver_jabatan }}
            </p>
          </div>
        </div>

        <!-- Status badge -->
        <div class="flex justify-end">
          <span
            class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            :class="
              Number(item.am_active) === 1
                ? 'bg-green-100 text-green-700'
                : 'bg-slate-100 text-slate-400'
            "
          >
            {{ Number(item.am_active) === 1 ? 'Aktif' : 'Nonaktif' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Add Modal -->
    <Teleport to="body">
      <div
        v-if="showAddModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      >
        <div
          class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
        >
          <h3 class="font-display font-bold text-navy text-lg mb-1 flex items-center gap-2">
            <GitMerge :size="20" class="text-sapphire" /> Tambah Mapping Approval
          </h3>
          <p class="text-xs text-slate-400 mb-5">
            Isi Dept/Plant untuk scope spesifik. Kosongkan keduanya hanya jika mapping memang
            global.
          </p>

          <div class="space-y-4 mb-6">
            <div>
              <label class="label">Bagian</label>
              <p
                v-if="activeBagianList.length === 0"
                class="text-sm text-slate-400 italic py-2"
              >
                Belum ada bagian aktif.
              </p>
              <select v-else v-model="modalBagian" class="input">
                <option value="">-- Pilih Bagian --</option>
                <option v-for="b in activeBagianList" :key="b.bag_id" :value="b.bag_nama">
                  {{ b.bag_nama }}
                </option>
              </select>
            </div>
            <div>
              <label class="label">NIK Approver</label>
              <input
                v-model="modalNik"
                class="input font-mono"
                placeholder="Contoh: 0411251525"
                maxlength="20"
              />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">Dept kode</label>
                <input
                  :value="modalDep"
                  class="input uppercase"
                  placeholder="Opsional, contoh PRD2"
                  maxlength="20"
                  @input="modalDep = ($event.target as HTMLInputElement).value.toUpperCase()"
                />
              </div>
              <div>
                <label class="label">Plant/Pab kode</label>
                <input
                  :value="modalPab"
                  class="input uppercase"
                  placeholder="Opsional, contoh P04"
                  maxlength="20"
                  @input="modalPab = ($event.target as HTMLInputElement).value.toUpperCase()"
                />
              </div>
            </div>
            <div>
              <label class="label">Priority</label>
              <input
                v-model="modalPriority"
                class="input"
                type="number"
                min="1"
                max="999"
              />
              <p class="text-xs text-slate-400 mt-1">
                Gunakan 10 untuk mapping scope khusus, 100 untuk default. Resolver tetap
                mengutamakan kecocokan scope terlebih dahulu.
              </p>
            </div>
          </div>

          <div class="flex gap-3">
            <button
              class="btn-ghost flex-1 justify-center"
              :disabled="creating"
              @click="closeAddModal"
            >
              Batal
            </button>
            <button
              class="btn-primary flex-1 justify-center"
              :disabled="creating || activeBagianList.length === 0"
              @click="handleCreate"
            >
              <Spinner v-if="creating" :size="16" />
              <template v-else>Simpan Mapping</template>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirm Dialog -->
    <ConfirmDialog
      :open="!!deleteTarget"
      title="Hapus Mapping?"
      :message="`Hapus mapping bagian &quot;${deleteTarget?.am_bagian}&quot; dengan scope ${deleteTarget ? scopeLabel(deleteTarget) : ''}?`"
      confirm-text="Hapus"
      danger
      :loading="deleting"
      @close="deleteTarget = null"
      @confirm="handleDelete"
    />
  </div>
</template>
