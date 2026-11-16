<script setup lang="ts">
import { ref } from 'vue'
import {
  XCircle,
  Building2,
  Users,
  Calendar,
  Flag,
  CheckSquare,
} from 'lucide-vue-next'
import Spinner from '@/components/ui/Spinner.vue'
import DetailRow from './DetailRow.vue'
import { getApprovalJabatanLabel } from './approvalUtils'
import { formatDate } from '@/utils/helpers'
import type { ApprovalRow } from '@/types'

defineProps<{
  item: ApprovalRow
  loading: boolean
}>()

const emit = defineEmits<{
  confirm: [alasan: string]
  close: []
}>()

const alasan = ref('')
const canSubmit = ref(false)

function onInput(e: Event) {
  alasan.value = (e.target as HTMLTextAreaElement).value
  canSubmit.value = alasan.value.trim().length >= 5
}

function onOverlayClick(e: MouseEvent) {
  if (e.target === e.currentTarget) emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 modal-overlay"
      @click="onOverlayClick"
    >
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 modal-content">
        <div class="flex items-start gap-3 mb-4">
          <XCircle :size="24" class="text-red-500 shrink-0" />
          <div>
            <h3 class="font-display font-bold text-navy text-lg">Tolak Permintaan?</h3>
            <p class="text-sm text-slate-500 mt-1">
              Permintaan akan ditolak dan status berubah menjadi
              <strong>Ditolak HRD</strong>.
            </p>
          </div>
        </div>

        <div class="bg-slate-50 rounded-xl p-4 space-y-2 mb-4">
          <DetailRow label="Nomor" :value="item.tpk_nomor" mono>
            <template #icon><Flag :size="14" /></template>
          </DetailRow>
          <DetailRow label="Jabatan" :value="getApprovalJabatanLabel(item)">
            <template #icon><CheckSquare :size="14" /></template>
          </DetailRow>
          <DetailRow label="Bagian" :value="item.tpk_bagian">
            <template #icon><Building2 :size="14" /></template>
          </DetailRow>
          <DetailRow label="Jumlah" :value="`${item.tpk_jumlah} orang`">
            <template #icon><Users :size="14" /></template>
          </DetailRow>
          <DetailRow label="Tgl Butuh" :value="formatDate(item.tpk_tgl_butuh)">
            <template #icon><Calendar :size="14" /></template>
          </DetailRow>
        </div>

        <div class="mb-4">
          <label class="label">Alasan Penolakan <span class="text-red-500">*</span></label>
          <textarea
            class="input resize-none"
            :rows="3"
            :value="alasan"
            placeholder="Tuliskan alasan penolakan (min. 5 karakter)..."
            :disabled="loading"
            @input="onInput"
          />
          <p
            v-if="alasan.length > 0 && alasan.trim().length < 5"
            class="text-xs text-red-500 mt-1"
          >
            Alasan minimal 5 karakter
          </p>
        </div>

        <div class="flex gap-3">
          <button class="btn-ghost flex-1 justify-center" :disabled="loading" @click="emit('close')">
            Batal
          </button>
          <button
            class="btn-danger flex-1 justify-center"
            :disabled="!canSubmit || loading"
            @click="emit('confirm', alasan.trim())"
          >
            <Spinner v-if="loading" :size="16" />
            <XCircle v-else :size="16" />
            {{ loading ? 'Memproses...' : 'Tolak Permintaan' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
