<template>
  <div class="max-w-3xl mx-auto space-y-5">
    <div
      class="rounded-2xl p-5 space-y-3"
      style="background: linear-gradient(135deg, #c7d8f0 0%, #b0c8e8 100%)"
    >
      <div class="skeleton h-7 w-56 rounded" style="background: rgba(255, 255, 255, 0.5)" />
      <div class="skeleton h-4 w-44 rounded" style="background: rgba(255, 255, 255, 0.4)" />
      <div class="flex gap-2">
        <div class="skeleton h-7 w-24 rounded-full" style="background: rgba(255, 255, 255, 0.4)" />
        <div class="skeleton h-7 w-32 rounded-full" style="background: rgba(255, 255, 255, 0.4)" />
      </div>
    </div>

    <div class="card space-y-4">
      <div class="skeleton h-28 w-full rounded-xl" />
      <div v-for="i in 4" :key="i" class="flex justify-between py-1 border-b border-slate-50">
        <div class="skeleton h-3.5 w-24" />
        <div class="skeleton h-3.5 w-20" />
      </div>
    </div>

    <div class="card space-y-4">
      <div class="skeleton h-5 w-40" />
      <div v-for="i in 4" :key="i" class="flex gap-4 pb-4">
        <div class="flex flex-col items-center">
          <div class="skeleton w-3 h-3 rounded-full mt-1 shrink-0" />
          <div v-if="i < 4" class="skeleton w-px flex-1 mt-1" style="min-height: 24px" />
        </div>
        <div class="space-y-1.5">
          <div class="skeleton h-4 w-44" />
          <div class="skeleton h-3.5 w-24" />
        </div>
      </div>
    </div>

    <div v-for="i in 2" :key="i" class="card space-y-3">
      <div class="skeleton h-5 w-36" />
      <div class="skeleton h-4 w-full" />
      <div class="skeleton h-10 w-full rounded-xl" />
    </div>
  </div>
</template>
