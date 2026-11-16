<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from '@/components/Sidebar.vue'
import { useSessionTimeout } from '@/composables/useSessionTimeout'

// Default collapsed di layar < 1024px (tablet)
const isCollapsed = ref(typeof window !== 'undefined' ? window.innerWidth < 1024 : false)

function handleResize() {
  isCollapsed.value = window.innerWidth < 1024
}

// Deteksi inaktivitas: warning di 25 menit, auto-logout di 30 menit.
useSessionTimeout({ warningMinutes: 25, logoutMinutes: 30 })

// ── Scroll Restoration ────────────────────────────────────────────────────
// Setiap entry history punya fullPath unik; posisi scroll disimpan per path.
const mainRef = ref<HTMLElement | null>(null)
const route = useRoute()
let scrollTimer: ReturnType<typeof setTimeout> | null = null

function handleScroll() {
  const el = mainRef.value
  if (!el) return
  sessionStorage.setItem(`scroll:${route.fullPath}`, String(el.scrollTop))
}

watch(
  () => route.fullPath,
  (path) => {
    const el = mainRef.value
    if (!el) return

    const storageKey = `scroll:${path}`
    const saved = sessionStorage.getItem(storageKey)

    if (saved !== null) {
      scrollTimer = setTimeout(() => {
        if (mainRef.value) mainRef.value.scrollTop = parseInt(saved, 10)
      }, 100)
    } else {
      el.scrollTop = 0
    }
  }
)

onMounted(() => {
  window.addEventListener('resize', handleResize)
  mainRef.value?.addEventListener('scroll', handleScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  mainRef.value?.removeEventListener('scroll', handleScroll)
  if (scrollTimer) clearTimeout(scrollTimer)
})
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-slate-50">
    <Sidebar :is-collapsed="isCollapsed" @toggle="isCollapsed = !isCollapsed" />
    <main ref="mainRef" class="flex-1 h-full overflow-y-auto min-w-0">
      <div class="p-6 max-w-7xl mx-auto page-enter">
        <router-view />
      </div>
    </main>
  </div>
</template>
