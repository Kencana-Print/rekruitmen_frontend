<script setup lang="ts">
import {
  Eye,
  CheckCircle2,
  XCircle,
  Building2,
  Users,
  Calendar,
  Flag,
  CheckSquare,
  Clock,
} from 'lucide-vue-next'
import AnimatedIcon from '@/components/AnimatedIcon.vue'
import DetailRow from './DetailRow.vue'
import { getApprovalJabatanLabel } from './approvalUtils'
import { formatDate } from '@/utils/helpers'
import { computed } from 'vue'
import type { ApprovalRow } from '@/types'

const props = defineProps<{
  item: ApprovalRow
  isHrd: boolean
  pending: boolean
  currentUserKode?: string
}>()

const emit = defineEmits<{
  approve: []
  reject: []
  detail: []
}>()

const approvedByAtasan = computed(
  () => props.item.tpk_approveatasan === 1 || props.item.tpk_approveatasan === 9,
)
const isSelfRequest = computed(
  () =>
    props.currentUserKode &&
    String(props.item.tpk_peminta || '').trim() === String(props.currentUserKode || '').trim(),
)
const approvedByHrd = computed(() => props.item.tpk_approveHRD === 1)
const jabatanLabel = computed(() => getApprovalJabatanLabel(props.item))

function getStatusPill(): { label: string; color: string } {
  const atasan = props.item.tpk_approveatasan
  const hrd = props.item.tpk_approveHRD
  const isLegacy = Number(props.item.is_legacy) === 1

  let label = 'Pending'
  let color = 'bg-amber-100 text-amber-700'

  if (atasan === 2) {
    label = 'Ditolak Atasan'
    color = 'bg-red-100 text-red-700'
  } else if (hrd === 2) {
    label = 'Ditolak HRD'
    color = 'bg-red-100 text-red-700'
  } else if (props.isHrd && hrd === 1) {
    label = 'Disetujui HRD'
    color = 'bg-green-100 text-green-700'
  } else if (props.isHrd && hrd === 0) {
    label = 'Perlu Disetujui'
    color = 'bg-amber-100 text-amber-700'
  } else if (!props.isHrd && (atasan === 1 || atasan === 9)) {
    label = 'Sudah Disetujui'
    color = 'bg-green-100 text-green-700'
  }

  if (isLegacy) {
    return {
      label: `${label} (Sistem Lama)`,
      color: `${color} border border-current opacity-80`,
    }
  }
  return { label, color }
}

const statusPill = computed(() => getStatusPill())
</script>

<template>
  <div class="card group hover:shadow-card-hover hover:border-[#A6C5D7] transition-all duration-300">
    <div class="flex items-start justify-between mb-3">
      <div>
        <p
          class="font-display font-bold text-navy group-hover:text-sapphire transition-colors duration-300"
        >
          {{ jabatanLabel }}
        </p>
        <p class="font-mono text-xs text-slate-400 mt-0.5">{{ item.tpk_nomor }}</p>
      </div>
      <span
        class="text-xs font-semibold px-2.5 py-1 rounded-full"
        :class="statusPill.color"
      >
        {{ statusPill.label }}
      </span>
    </div>

    <div class="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
      <DetailRow label="Bagian" :value="item.tpk_bagian">
        <template #icon><Building2 :size="13" /></template>
      </DetailRow>
      <DetailRow label="Jumlah" :value="`${item.tpk_jumlah} orang`">
        <template #icon><Users :size="13" /></template>
      </DetailRow>
      <DetailRow label="Tgl Butuh" :value="formatDate(item.tpk_tgl_butuh)">
        <template #icon><Calendar :size="13" /></template>
      </DetailRow>
      <DetailRow v-if="item.peminta" label="Peminta" :value="item.peminta">
        <template #icon><CheckSquare :size="13" /></template>
      </DetailRow>
      <DetailRow
        v-if="item.sla_final_target_date"
        label="Target SLA"
        :value="formatDate(item.sla_final_target_date)"
      >
        <template #icon><Flag :size="13" /></template>
      </DetailRow>
    </div>

    <div
      v-if="Number(item.is_legacy) === 1"
      class="mb-3 px-3 py-2 rounded-lg flex items-center gap-2 bg-slate-50 border border-slate-100"
    >
      <span class="text-xs font-semibold text-slate-500">
        📁 Data sistem lama · read-only
      </span>
    </div>

    <!-- Chip tanggal approval -->
    <div v-if="approvedByAtasan || approvedByHrd" class="flex flex-wrap gap-2 mb-3">
      <div
        v-if="approvedByAtasan && item.tgl_approve_atasan"
        class="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-2.5 py-1"
      >
        <Clock :size="11" class="text-green-600 shrink-0" />
        <span class="text-xs font-semibold text-green-700">Atasan ✓</span>
        <span class="text-xs text-green-500">({{ formatDate(item.tgl_approve_atasan) }})</span>
      </div>
      <div
        v-if="approvedByHrd && item.tgl_approve_hrd"
        class="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-2.5 py-1"
      >
        <Clock :size="11" class="text-green-600 shrink-0" />
        <span class="text-xs font-semibold text-green-700">HRD ✓</span>
        <span class="text-xs text-green-500">({{ formatDate(item.tgl_approve_hrd) }})</span>
      </div>
    </div>

    <div class="flex items-center gap-2 pt-3 border-t border-slate-100">
      <button
        class="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5"
        @click="emit('detail')"
      >
        <AnimatedIcon variant="scale"><Eye :size="13" /></AnimatedIcon>
        Detail
      </button>
      <div class="flex-1" />

      <!-- Tombol Tolak -->
      <button
        v-if="pending && !isSelfRequest"
        class="btn-ghost text-xs px-3 py-1.5 text-red-500 hover:bg-red-50 flex items-center gap-1.5"
        @click="emit('reject')"
      >
        <AnimatedIcon variant="wiggle"><XCircle :size="13" /></AnimatedIcon>
        Tolak
      </button>

      <!-- Tombol Setujui -->
      <button
        v-if="pending && !isSelfRequest"
        class="text-xs px-3 py-1.5 rounded-xl font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center gap-1.5"
        @click="emit('approve')"
      >
        <AnimatedIcon variant="scale"><CheckCircle2 :size="13" /></AnimatedIcon>
        Setujui
      </button>

      <!-- Label jika HRD mencoba approve permintaannya sendiri -->
      <span v-if="pending && isSelfRequest" class="text-xs text-slate-400 italic px-2">
        Tidak dapat memproses milik sendiri
      </span>
    </div>
  </div>
</template>
