<template>
  <div class="space-y-5 max-w-3xl mx-auto">
    <div class="card space-y-4">
      <div class="skeleton h-4 w-36 mb-2" />
      <div class="space-y-1.5">
        <div class="skeleton h-3.5 w-20" />
        <div class="skeleton h-11 w-full rounded-xl" />
      </div>
      <div class="space-y-1.5">
        <div class="skeleton h-3.5 w-32" />
        <div class="skeleton h-11 w-full rounded-xl" />
      </div>
    </div>

    <div class="card space-y-4">
      <div class="skeleton h-4 w-24 mb-2" />
      <div class="space-y-2">
        <div class="skeleton h-3.5 w-36" />
        <div class="flex items-center gap-3">
          <div class="skeleton w-10 h-10 rounded-xl" />
          <div class="skeleton h-8 w-12 rounded" />
          <div class="skeleton w-10 h-10 rounded-xl" />
          <div class="skeleton h-4 w-12" />
        </div>
      </div>
      <div class="space-y-1.5">
        <div class="skeleton h-3.5 w-32" />
        <div class="skeleton h-11 w-full rounded-xl" />
      </div>
    </div>

    <div class="card space-y-4">
      <div class="skeleton h-4 w-36 mb-2" />
      <div class="space-y-1.5">
        <div class="skeleton h-3.5 w-16" />
        <div class="skeleton h-11 w-full rounded-xl" />
      </div>
    </div>

    <div class="card space-y-3">
      <div class="skeleton h-4 w-40 mb-2" />
      <div v-for="i in 3" :key="i" class="skeleton h-11 w-full rounded-xl" />
    </div>

    <div class="card space-y-3">
      <div class="skeleton h-4 w-56 mb-2" />
      <div v-for="i in 3" :key="i" class="skeleton h-11 w-full rounded-xl" />
    </div>

    <div class="skeleton h-11 w-full rounded-xl" />
  </div>
</template>
