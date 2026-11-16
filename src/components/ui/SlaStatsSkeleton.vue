<template>
  <div class="grid grid-cols-3 gap-3">
    <div v-for="i in 3" :key="i" class="card py-3 px-2 text-center space-y-1.5">
      <div class="skeleton h-7 w-12 mx-auto rounded" />
      <div class="skeleton h-3 w-16 mx-auto rounded" />
    </div>
  </div>
</template>
