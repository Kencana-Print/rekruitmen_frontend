<script setup lang="ts">
import {
  CheckCircle2,
  AlertTriangle,
  Flag,
  Building2,
  Users,
  Calendar,
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
  errorMessage?: string | null
}>()

const emit = defineEmits<{
  confirm: []
  close: []
}>()

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
          <AlertTriangle :size="24" class="text-amber-500 shrink-0" />
          <div>
            <h3 class="font-display font-bold text-navy text-lg">Setujui & Buka Rekrutmen?</h3>
            <p class="text-sm text-slate-500 mt-1">
              Setelah disetujui, rekrutmen akan dibuka dan
              <strong>penghitungan SLA dimulai</strong>.
            </p>
          </div>
        </div>

        <div class="bg-slate-50 rounded-xl p-4 space-y-2 mb-5">
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

        <div
          v-if="errorMessage"
          class="mb-4 flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl p-3"
        >
          <AlertTriangle :size="15" class="text-red-500 shrink-0 mt-0.5" />
          <p class="text-xs text-red-700 font-medium">{{ errorMessage }}</p>
        </div>

        <div class="flex gap-3">
          <button class="btn-ghost flex-1 justify-center" :disabled="loading" @click="emit('close')">
            Batal
          </button>
          <button
            class="btn-primary flex-1 justify-center bg-green-600 hover:bg-green-700"
            :disabled="loading"
            @click="emit('confirm')"
          >
            <Spinner v-if="loading" :size="16" />
            <CheckCircle2 v-else :size="16" />
            {{ loading ? 'Memproses...' : 'Ya, Setujui & Mulai SLA' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
