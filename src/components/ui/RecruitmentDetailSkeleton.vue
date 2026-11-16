<template>
  <div class="max-w-3xl mx-auto space-y-5">
    <div class="skeleton h-14 w-full rounded-2xl" />

    <div class="card space-y-4">
      <div class="space-y-1.5">
        <div class="skeleton h-7 w-56" />
        <div class="skeleton h-4 w-32" />
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div v-for="i in 5" :key="i" class="flex items-start gap-2">
          <div class="skeleton h-4 w-4 rounded mt-0.5 shrink-0" />
          <div class="space-y-1">
            <div class="skeleton h-3 w-20" />
            <div class="skeleton h-4 w-32" />
          </div>
        </div>
      </div>
    </div>

    <div class="card space-y-3">
      <div class="skeleton h-5 w-44" />
      <div v-for="i in 3" :key="i" class="flex justify-between">
        <div class="skeleton h-4 w-36" />
        <div class="skeleton h-4 w-28" />
      </div>
      <div class="pt-2 border-t border-slate-100 flex gap-2">
        <div class="skeleton h-6 w-32 rounded-full" />
      </div>
    </div>

    <div class="card space-y-3">
      <div class="skeleton h-5 w-36" />
      <div class="skeleton h-5 w-48" />
    </div>

    <div class="card space-y-3">
      <div class="skeleton h-5 w-24" />
      <div v-for="i in 3" :key="i" class="flex gap-3">
        <div class="skeleton h-4 w-5 shrink-0" />
        <div class="skeleton h-4 flex-1" />
      </div>
    </div>

    <div class="card space-y-4">
      <div class="skeleton h-5 w-32" />
      <div class="flex justify-between py-1">
        <div class="skeleton h-4 w-28" />
        <div class="skeleton h-4 w-24" />
      </div>
      <div class="skeleton h-px w-full" />
      <div class="flex justify-between py-1">
        <div class="skeleton h-4 w-24" />
        <div class="skeleton h-4 w-24" />
      </div>
    </div>
  </div>
</template>
