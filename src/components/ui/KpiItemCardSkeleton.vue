<template>
  <div class="card space-y-3">
    <div class="flex items-start justify-between">
      <div class="space-y-1.5">
        <div class="skeleton h-5 w-44" />
        <div class="skeleton h-3.5 w-32" />
      </div>
      <div class="skeleton h-6 w-20 rounded-full" />
    </div>
    <div class="bg-slate-50 rounded-xl p-3 flex items-center justify-evenly gap-4">
      <div v-for="i in 3" :key="i" class="space-y-1 text-center">
        <div class="skeleton h-3 w-16 mx-auto" />
        <div class="skeleton h-6 w-10 mx-auto" />
      </div>
    </div>
    <div class="skeleton h-8 w-36 rounded-xl" />
  </div>
</template>
