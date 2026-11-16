<template>
  <div class="card space-y-3">
    <div class="flex items-start justify-between">
      <div class="space-y-1.5">
        <div class="skeleton h-5 w-48" />
        <div class="skeleton h-3.5 w-32" />
      </div>
      <div class="skeleton h-7 w-28 rounded-full" />
    </div>
    <div class="grid grid-cols-2 gap-x-4 gap-y-2.5">
      <div v-for="i in 4" :key="i" class="flex items-center gap-1.5">
        <div class="skeleton h-3.5 w-3.5 rounded shrink-0" />
        <div class="skeleton h-3.5 w-28" />
      </div>
    </div>
    <div class="flex items-center gap-2 pt-3 border-t border-slate-100">
      <div class="skeleton h-8 w-20 rounded-xl" />
      <div class="flex-1" />
      <div class="skeleton h-8 w-20 rounded-xl" />
      <div class="skeleton h-8 w-24 rounded-xl" />
    </div>
  </div>
</template>
