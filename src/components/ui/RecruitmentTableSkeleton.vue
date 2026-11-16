<script setup lang="ts">
withDefaults(defineProps<{ rows?: number }>(), { rows: 8 })
</script>

<template>
  <div class="table-wrapper">
    <table class="w-full">
      <thead>
        <tr class="bg-slate-50 border-b border-slate-100">
          <th class="px-4 py-3 w-8"><div class="skeleton h-4 w-4 rounded" /></th>
          <th class="px-4 py-3"><div class="skeleton h-3.5 w-16" /></th>
          <th class="px-4 py-3"><div class="skeleton h-3.5 w-24" /></th>
          <th class="px-4 py-3"><div class="skeleton h-3.5 w-20" /></th>
          <th class="px-4 py-3"><div class="skeleton h-3.5 w-24" /></th>
          <th class="px-4 py-3"><div class="skeleton h-3.5 w-20" /></th>
          <th class="px-4 py-3"><div class="skeleton h-3.5 w-16" /></th>
          <th class="px-4 py-3"><div class="skeleton h-3.5 w-24" /></th>
          <th class="px-4 py-3 text-right"><div class="skeleton h-3.5 w-12 ml-auto" /></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="i in rows" :key="i" class="border-b border-slate-50">
          <td class="px-4 py-3"><div class="skeleton h-4 w-4 rounded" /></td>
          <td class="px-4 py-3"><div class="skeleton h-4 w-28" /></td>
          <td class="px-4 py-3"><div class="skeleton h-4 w-36" /></td>
          <td class="px-4 py-3"><div class="skeleton h-4 w-24" /></td>
          <td class="px-4 py-3"><div class="skeleton h-4 w-24" /></td>
          <td class="px-4 py-3"><div class="skeleton h-4 w-24" /></td>
          <td class="px-4 py-3"><div class="skeleton h-6 w-24 rounded-full" /></td>
          <td class="px-4 py-3"><div class="skeleton h-4 w-24" /></td>
          <td class="px-4 py-3">
            <div class="flex justify-end gap-2">
              <div class="skeleton h-8 w-8 rounded-xl" />
              <div class="skeleton h-8 w-8 rounded-xl" />
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
