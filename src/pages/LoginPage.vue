<script setup lang="ts">
/**
 * ============================================================================
 * LOGIN PAGE - SISTEM MANAJEMEN REKRUITMEN (PKAR)
 * ============================================================================
 * Port dari LoginPage.jsx v3.1.0 (React) ke Vue 3 + TypeScript.
 * Desain, animasi, dan teks dipertahankan identik.
 * ============================================================================
 */

import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { User } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import {
  saveUsernameToHistory,
  loadUsernameHistory,
  sanitizeApiError,
} from '@/utils/security'

// ─────────────────────────────────────────────
// KONFIGURASI SISTEM
// ─────────────────────────────────────────────
const SYSTEM_CONFIG = {
  limits: { maxHistoryItems: 10 },
  colors: {
    sapphire: '#0F52BA',
    sapphireHover: '#0D459D',
    sapphireLight: 'rgba(15, 82, 186, 0.15)',
    error: '#E11D48',
    darkBg: '#ffffff',
    grayBg: '#ffffff',
    textMain: '#18181b',
    textMuted: '#4B5563',
    borderLight: '#D1D5DB',
    white: '#ffffff',
  },
  animation: {
    particleCount: 1200,
    mouseRadius: 450,
    mouseForce: 1.8,
  },
}

// ─────────────────────────────────────────────
// PARTICLE ENGINE (muncul di area abu-abu saja)
// ─────────────────────────────────────────────
type MousePos = { x: number; y: number }

class Particle {
  canvas: HTMLCanvasElement
  colors: string[]
  bx: number
  by: number
  x: number
  y: number
  color: string
  size: number
  targetSize: number
  angle: number
  speed: number
  offset: number
  friction: number

  constructor(canvas: HTMLCanvasElement, colors: string[]) {
    this.canvas = canvas
    this.colors = colors
    this.bx = Math.random() * canvas.width
    this.by = Math.random() * canvas.height
    this.x = this.bx
    this.y = this.by
    this.color = colors[Math.floor(Math.random() * colors.length)]
    this.size = 0
    this.targetSize = 0
    this.angle = 0
    this.speed = Math.random() * 0.04 + 0.015
    this.offset = Math.random() * Math.PI * 2
    this.friction = Math.random() * 0.05 + 0.08
  }

  update(mouse: MousePos) {
    const dx = mouse.x - this.bx
    const dy = mouse.y - this.by
    const dist = Math.sqrt(dx * dx + dy * dy)
    let tx = this.bx
    let ty = this.by

    if (dist < SYSTEM_CONFIG.animation.mouseRadius) {
      const ratio =
        (SYSTEM_CONFIG.animation.mouseRadius - dist) / SYSTEM_CONFIG.animation.mouseRadius
      const force = Math.pow(ratio, SYSTEM_CONFIG.animation.mouseForce)
      const pulse = Math.sin(Date.now() * this.speed + this.offset) * 0.5 + 0.5
      this.targetSize = force * 5 * pulse + force * 2.5
      const ang = Math.atan2(dy, dx)
      tx -= Math.cos(ang) * force * 20
      ty -= Math.sin(ang) * force * 20
      this.angle = ang
    } else {
      this.targetSize = 0
    }

    this.size += (this.targetSize - this.size) * 0.12
    this.x += (tx - this.x) * this.friction
    this.y += (ty - this.y) * this.friction
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.size < 0.1) return
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(this.angle)
    ctx.beginPath()
    ctx.ellipse(0, 0, this.size * 2.2, this.size / 2, 0, 0, Math.PI * 2)
    ctx.fillStyle = this.color
    ctx.globalAlpha = Math.min(1, this.size / 3.5)
    ctx.fill()
    ctx.restore()
  }
}

// ─────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────
const auth = useAuthStore()
const router = useRouter()

const formData = reactive<{
  username: string
  password: string
  expiredDays: number | null
}>({ username: '', password: '', expiredDays: null })

const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const isShaking = ref(false)

const savedUsernames = ref<string[]>([])
const isSuggestBoxOpen = ref(false)

const usernameWrapRef = ref<HTMLElement | null>(null)
const passwordInputRef = ref<HTMLInputElement | null>(null)
const suggestDropdownRef = ref<HTMLElement | null>(null)
const mainContainerRef = ref<HTMLElement | null>(null)
const particleCanvasRef = ref<HTMLCanvasElement | null>(null)

const logoValid = ref(true)
const isFocusedUsername = ref(false)
const isFocusedPassword = ref(false)

const eyeContainerRef = ref<HTMLElement | null>(null)
const eyeballRef = ref<SVGGElement | null>(null)

// ─────────────────────────────────────────────
// PARTICLE HOOK
// ─────────────────────────────────────────────
let rafId = 0
let particleCleanup: (() => void) | null = null

function startParticles() {
  const canvas = particleCanvasRef.value
  const panel = mainContainerRef.value
  if (!canvas || !panel) return

  const ctx = canvas.getContext('2d', { alpha: true })
  if (!ctx) return

  const handleResize = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }
  handleResize()
  window.addEventListener('resize', handleResize)

  const particleColors = [
    '#F9A826',
    '#E94A47',
    '#9B51E0',
    SYSTEM_CONFIG.colors.sapphire,
    '#34A853',
  ]
  const particles = Array.from(
    { length: SYSTEM_CONFIG.animation.particleCount },
    () => new Particle(canvas, particleColors)
  )

  const cur: MousePos = { x: -2000, y: -2000 }
  const tgt: MousePos = { x: -2000, y: -2000 }

  const onMouseMove = (e: MouseEvent) => {
    tgt.x = e.clientX
    tgt.y = e.clientY
  }
  const onMouseLeave = () => {
    tgt.x = -2000
    tgt.y = -2000
  }

  window.addEventListener('mousemove', onMouseMove)
  panel.addEventListener('mouseleave', onMouseLeave)

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    cur.x += (tgt.x - cur.x) * 0.12
    cur.y += (tgt.y - cur.y) * 0.12
    particles.forEach((p) => {
      p.update(cur)
      p.draw(ctx)
    })
    rafId = requestAnimationFrame(animate)
  }
  animate()

  particleCleanup = () => {
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('mousemove', onMouseMove)
    panel.removeEventListener('mouseleave', onMouseLeave)
    cancelAnimationFrame(rafId)
  }
}

// ─────────────────────────────────────────────
// ANIMATED EYE — pupil mengikuti kursor
// ─────────────────────────────────────────────
function movePupil(e: MouseEvent) {
  const container = eyeContainerRef.value
  const eyeball = eyeballRef.value
  if (!container || !eyeball) return

  if (!showPassword.value) {
    eyeball.style.transform = 'translate(0px, 0px)'
    return
  }

  const rect = container.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const angle = Math.atan2(e.clientY - cy, e.clientX - cx)
  const maxR = errorMessage.value ? 3.0 : 2.0
  const dist = Math.min(
    Math.sqrt((e.clientX - cx) ** 2 + (e.clientY - cy) ** 2) * 0.045,
    maxR
  )
  eyeball.style.transform =
    `translate(${(Math.cos(angle) * dist).toFixed(2)}px,` +
    `${(Math.sin(angle) * dist).toFixed(2)}px)`
}

const P_NORMAL = 'M2,12 C6,5.5 18,5.5 22,12 C18,18.5 6,18.5 2,12 Z'
const P_ERROR = 'M2,12 C5,4   19,4   22,12 C19,20   5,20   2,12 Z'
const P_CLOSED = 'M2,12 C6,18  18,18  22,12 C18,18   6,18   2,12 Z'

const hasError = computed(() => !!errorMessage.value)
const eyePath = computed(() =>
  !showPassword.value ? P_CLOSED : hasError.value ? P_ERROR : P_NORMAL
)
const pupilR = computed(() => (hasError.value ? 3.5 : 3.0))
const catchR = computed(() => (hasError.value ? 0.9 : 0.6))
const D_T = 'd 0.40s cubic-bezier(0.34, 1.56, 0.64, 1)'
const R_T = 'r 0.32s cubic-bezier(0.34, 1.56, 0.64, 1)'

// ─────────────────────────────────────────────
// FLOATING LABEL — warna & posisi
// ─────────────────────────────────────────────
function fieldColor(focused: boolean): string {
  return hasError.value
    ? SYSTEM_CONFIG.colors.error
    : focused
      ? SYSTEM_CONFIG.colors.sapphire
      : SYSTEM_CONFIG.colors.textMuted
}

function labelStyle(focused: boolean, value: string) {
  const float = focused || value.length > 0
  return {
    top: float ? '0px' : '26px',
    fontSize: float ? '11px' : '15px',
    fontWeight: float ? '500' : '400',
    color: fieldColor(focused),
    letterSpacing: float ? '0.05em' : '0',
  }
}

function inputStyle(focused: boolean, value: string, isPassword = false) {
  const float = focused || value.length > 0
  return {
    borderBottom: `${float || hasError.value ? 2 : 1}px solid ${fieldColor(focused)}`,
    paddingRight: isPassword ? '34px' : '0px',
    letterSpacing: isPassword && !showPassword.value ? '0.12em' : 'normal',
  }
}

// ─────────────────────────────────────────────
// LOGIKA FORM
// ─────────────────────────────────────────────
const filteredUsernames = computed(() =>
  formData.username
    ? savedUsernames.value.filter((u) =>
        u.toLowerCase().includes(formData.username.toLowerCase())
      )
    : savedUsernames.value
)

let shakeTimer: ReturnType<typeof setTimeout> | null = null
function triggerShake() {
  isShaking.value = true
  shakeTimer = setTimeout(() => (isShaking.value = false), 520)
}

function onUsernameKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    isSuggestBoxOpen.value = false
    passwordInputRef.value?.focus()
  }
}

function onPasswordKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    handleSubmit()
  }
}

function pickUsername(u: string) {
  formData.username = u
  isSuggestBoxOpen.value = false
  setTimeout(() => passwordInputRef.value?.focus(), 50)
}

async function handleSubmit() {
  isSuggestBoxOpen.value = false
  if (!formData.username || !formData.password) {
    errorMessage.value = 'Username dan password wajib diisi.'
    triggerShake()
    return
  }
  errorMessage.value = ''
  isLoading.value = true
  try {
    await auth.login(formData.username, formData.password, formData.expiredDays ?? undefined)
    saveUsernameToHistory(formData.username)
    router.push('/')
  } catch (err) {
    errorMessage.value = sanitizeApiError(err, 'Login gagal. Periksa kembali data Anda.')
    triggerShake()
  } finally {
    isLoading.value = false
  }
}

function toggleExpiredDays(days: number) {
  formData.expiredDays = formData.expiredDays === days ? null : days
}

function onUsernameBlur() {
  isFocusedUsername.value = false
  setTimeout(() => { isSuggestBoxOpen.value = false }, 200)
}

// klik di luar → tutup dropdown saran
function onDocumentMouseDown(e: MouseEvent) {
  const target = e.target as Node
  const inUser = usernameWrapRef.value?.contains(target) ?? false
  const inDrop = suggestDropdownRef.value?.contains(target) ?? false
  if (!inUser && !inDrop) isSuggestBoxOpen.value = false
}

// ─────────────────────────────────────────────
// LIFECYCLE
// ─────────────────────────────────────────────
onMounted(() => {
  savedUsernames.value = loadUsernameHistory()
  startParticles()
  window.addEventListener('mousemove', movePupil)
  document.addEventListener('mousedown', onDocumentMouseDown)
  document.body.classList.add('login-body')
})

onBeforeUnmount(() => {
  particleCleanup?.()
  window.removeEventListener('mousemove', movePupil)
  document.removeEventListener('mousedown', onDocumentMouseDown)
  document.body.classList.remove('login-body')
  if (shakeTimer) clearTimeout(shakeTimer)
})
</script>

<template>
  <!-- ── FULL SCREEN LOADER ── -->
  <div v-if="isLoading" class="full-screen-loader">
    <span
      class="loading-spinner-ring"
      :style="{
        width: '44px',
        height: '44px',
        borderWidth: '4px',
        borderTopColor: SYSTEM_CONFIG.colors.sapphire,
        borderColor: 'rgba(15, 82, 186, 0.2)',
      }"
    />
    <span class="loader-text">Menyiapkan sesi...</span>
  </div>

  <div ref="mainContainerRef" class="login-page-container">
    <canvas ref="particleCanvasRef" class="particle-canvas" />

    <!-- ── PANEL KIRI ── -->
    <div class="left-panel">
      <div
        style="
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          text-align: left;
          padding: 6rem 5rem;
        "
      >
        <h1
          style="
            font-size: clamp(64px, 6.5vw, 96px);
            font-weight: 800;
            line-height: 1.02;
            letter-spacing: -0.04em;
            color: #18181b;
            margin: 0;
          "
        >
          Rekruitmen<br />
          Permintaan<br />
          Karyawan
        </h1>

        <div style="height: 2.5rem" />

        <p
          style="
            color: #374151;
            font-weight: 500;
            font-size: clamp(20px, 1.8vw, 26px);
            line-height: 1.6;
            max-width: 580px;
            margin: 0;
          "
        >
          Pantau proses rekruitmen, SLA, approval, dan KPI dalam satu platform terpadu.
        </p>
      </div>
    </div>

    <!-- ── PANEL KANAN ── -->
    <div class="right-panel">
      <div class="form-glass-card">
        <!-- Logo -->
        <div style="display: flex; justify-content: center; margin-top: 0.5rem; margin-bottom: 0.5rem">
          <img
            v-if="logoValid"
            src="/logo_app.png"
            alt="Logo PKAR"
            :style="{
              width: '135px',
              height: 'auto',
              maxHeight: '135px',
              objectFit: 'contain',
            }"
            @error="logoValid = false"
          />
          <div
            v-else
            :style="{
              width: '135px',
              height: '135px',
              borderRadius: '135px * 0.22',
              background: SYSTEM_CONFIG.colors.sapphireLight,
              border: `1.5px solid ${SYSTEM_CONFIG.colors.sapphire}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }"
          >
            <span
              :style="{
                fontSize: '135px * 0.45',
                fontWeight: 800,
                color: SYSTEM_CONFIG.colors.sapphire,
              }"
              >P</span
            >
          </div>
        </div>

        <div style="text-align: center; margin-bottom: 2.25rem">
          <h2
            style="
              font-size: 24px;
              font-weight: 700;
              margin: 0 0 6px;
              color: #0f52ba;
              letter-spacing: -0.02em;
            "
          >
            Welcome back !
          </h2>
          <p style="font-size: 13px; color: #4b5563; font-weight: 500; margin: 0">
            Please enter your details
          </p>
        </div>

        <form autocomplete="off" novalidate @submit.prevent="handleSubmit">
          <!-- Username + autocomplete -->
          <div ref="usernameWrapRef" style="margin-bottom: 0.75rem; position: relative">
            <div style="position: relative; padding-top: 18px">
              <label for="usernameInput" class="floating-label" :style="labelStyle(isFocusedUsername, formData.username)">
                Username
              </label>
              <div style="position: relative">
                <input
                  id="usernameInput"
                  class="floating-input"
                  type="text"
                  autocomplete="off"
                  :value="formData.username"
                  :style="inputStyle(isFocusedUsername, formData.username)"
                  @input="
                    formData.username = ($event.target as HTMLInputElement).value;
                    isSuggestBoxOpen = true
                  "
                  @focus="
                    isFocusedUsername = true;
                    if (savedUsernames.length > 0) isSuggestBoxOpen = true
                  "
                  @blur="onUsernameBlur"
                  @keydown="onUsernameKeyDown"
                />
              </div>
            </div>

            <div
              v-if="isSuggestBoxOpen && filteredUsernames.length > 0"
              ref="suggestDropdownRef"
              class="autocomplete-dropdown"
            >
              <div v-for="(u, i) in filteredUsernames" :key="`${u}-${i}`">
                <button type="button" class="suggestion-item-btn" @mousedown.prevent="pickUsername(u)">
                  <User :size="14" style="color: #4b5563; flex-shrink: 0" />
                  {{ u }}
                </button>
                <div v-if="i < filteredUsernames.length - 1" class="dropdown-divider-line" />
              </div>
            </div>
          </div>

          <!-- Password -->
          <div :class="isShaking ? 'error-shake-effect' : ''" style="margin-bottom: 1.25rem">
            <div style="position: relative; padding-top: 18px">
              <label for="passwordInput" class="floating-label" :style="labelStyle(isFocusedPassword, formData.password)">
                Password
              </label>
              <div style="position: relative">
                <input
                  id="passwordInput"
                  ref="passwordInputRef"
                  class="floating-input"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="current-password"
                  :value="formData.password"
                  :style="inputStyle(isFocusedPassword, formData.password, true)"
                  @input="formData.password = ($event.target as HTMLInputElement).value"
                  @focus="isFocusedPassword = true"
                  @blur="isFocusedPassword = false"
                  @keydown="onPasswordKeyDown"
                />

                <!-- Animated eye toggle -->
                <button
                  ref="eyeContainerRef"
                  type="button"
                  class="eye-button"
                  :aria-label="showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'"
                  @click="showPassword = !showPassword"
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    style="overflow: visible"
                  >
                    <path
                      :d="eyePath"
                      fill="white"
                      stroke="none"
                      :style="{ transition: D_T }"
                    />
                    <g
                      ref="eyeballRef"
                      :style="{
                        opacity: showPassword ? 1 : 0,
                        transition: 'opacity 0.22s ease, transform 0.055s linear',
                        pointerEvents: 'none',
                      }"
                    >
                      <circle cx="12" cy="12" :r="pupilR" fill="#18181b" :style="{ transition: R_T }" />
                      <circle cx="13.1" cy="10.7" :r="catchR" fill="white" :style="{ transition: R_T }" />
                      <circle
                        cx="11.0"
                        cy="13.2"
                        :r="catchR * 0.42"
                        fill="white"
                        opacity="0.55"
                        :style="{ transition: R_T }"
                      />
                    </g>
                    <path
                      :d="eyePath"
                      stroke="#18181b"
                      :stroke-width="hasError ? '1.7' : '1.5'"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      fill="none"
                      :style="{ transition: `${D_T}, stroke-width 0.2s` }"
                    />
                    <g
                      :style="{
                        opacity: !showPassword ? 1 : 0,
                        transform: !showPassword ? 'translateY(0px)' : 'translateY(-3px)',
                        transition:
                          'opacity 0.30s ease, transform 0.40s cubic-bezier(0.34,1.56,0.64,1)',
                        pointerEvents: 'none',
                      }"
                    >
                      <path
                        d="M7.5,15.6 Q6.7,18.6 6.0,20.8"
                        stroke="#18181b"
                        stroke-width="1.2"
                        stroke-linecap="round"
                        fill="none"
                      />
                      <path
                        d="M12.0,16.5 Q12.0,19.5 12.1,22.0"
                        stroke="#18181b"
                        stroke-width="1.2"
                        stroke-linecap="round"
                        fill="none"
                      />
                      <path
                        d="M16.5,15.6 Q17.3,18.6 18.0,20.8"
                        stroke="#18181b"
                        stroke-width="1.2"
                        stroke-linecap="round"
                        fill="none"
                      />
                    </g>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Error message -->
          <div
            v-if="errorMessage"
            :class="isShaking ? 'error-shake-effect' : ''"
            style="
              font-size: 13px;
              color: #e11d48;
              font-weight: 600;
              margin-top: 0.5rem;
              margin-bottom: 1rem;
              display: flex;
              align-items: center;
              gap: 6px;
            "
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {{ errorMessage }}
          </div>

          <!-- Checkboxes -->
          <div class="checkbox-layout-row">
            <label class="checkbox-label" @click="toggleExpiredDays(3)">
              <div
                class="checkbox-box"
                :style="{
                  border: `${formData.expiredDays === 3 ? 2 : 1}px solid ${
                    formData.expiredDays === 3 ? '#0F52BA' : '#D1D5DB'
                  }`,
                  background: formData.expiredDays === 3 ? '#0F52BA' : 'transparent',
                }"
              >
                <svg
                  v-if="formData.expiredDays === 3"
                  width="9"
                  height="9"
                  viewBox="0 0 12 12"
                  fill="none"
                >
                  <path
                    d="M2 6 5 9 10 3"
                    stroke="#fff"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </div>
              <span class="checkbox-text">Ingat 3 hari</span>
            </label>

            <label class="checkbox-label" @click="toggleExpiredDays(30)">
              <div
                class="checkbox-box"
                :style="{
                  border: `${formData.expiredDays === 30 ? 2 : 1}px solid ${
                    formData.expiredDays === 30 ? '#0F52BA' : '#D1D5DB'
                  }`,
                  background: formData.expiredDays === 30 ? '#0F52BA' : 'transparent',
                }"
              >
                <svg
                  v-if="formData.expiredDays === 30"
                  width="9"
                  height="9"
                  viewBox="0 0 12 12"
                  fill="none"
                >
                  <path
                    d="M2 6 5 9 10 3"
                    stroke="#fff"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </div>
              <span class="checkbox-text">Ingat 30 hari</span>
            </label>
          </div>

          <!-- Submit -->
          <div style="width: 100%">
            <button type="submit" class="submit-action-btn" :disabled="isLoading">
              <template v-if="isLoading">
                <span class="loading-spinner-ring" />
                Memproses...
              </template>
              <template v-else>Log In</template>
            </button>
          </div>
        </form>

        <!-- Footer -->
        <div
          style="
            text-align: center;
            margin-top: 1.25rem;
            border-top: 1px solid rgba(209, 213, 219, 0.6);
            padding-top: 1rem;
          "
        >
          <p style="font-size: 13px; color: #4b5563; margin: 0">
            Belum punya akun?
            <span class="contact-it">Hubungi departemen IT</span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
@keyframes shakeAnimation {
  0%,
  100% {
    transform: translateX(0);
  }
  12% {
    transform: translateX(-9px);
  }
  25% {
    transform: translateX(9px);
  }
  37% {
    transform: translateX(-6px);
  }
  50% {
    transform: translateX(6px);
  }
  62% {
    transform: translateX(-3px);
  }
  75% {
    transform: translateX(3px);
  }
}
@keyframes fadeSlideDown {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes slideInFromRight {
  from {
    opacity: 0;
    transform: translateX(40px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
@keyframes spinLoader {
  to {
    transform: rotate(360deg);
  }
}

body.login-body {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.login-page-container {
  display: flex;
  min-height: 100vh;
  width: 100vw;
  position: relative;
  background-color: #ffffff;
  overflow: hidden;
}

.login-page-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 100%;
  background-image: linear-gradient(
      to right,
      rgba(255, 255, 255, 0.15) 0%,
      rgba(255, 255, 255, 0.4) 100%
    ),
    url('/office-bg1.jpeg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 1;
}

.particle-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}

.left-panel {
  display: none;
  width: 35%;
  height: 100vh;
  position: relative;
  z-index: 10;
  flex-shrink: 0;
  background: transparent;
}
@media (min-width: 900px) {
  .left-panel {
    display: flex;
    flex-direction: column;
  }
}

.right-panel {
  width: 100%;
  height: 100vh;
  background: transparent;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 2.5rem 3rem 2.5rem 2rem;
  z-index: 10;
}
@media (min-width: 900px) {
  .right-panel {
    width: 65%;
  }
}

.form-glass-card {
  width: 100%;
  max-width: 420px;
  padding: 2.2rem 3rem;
  position: relative;
  z-index: 30;
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1.5px solid rgba(255, 255, 255, 0.85);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
  border-radius: 26px;
  animation: slideInFromRight 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.floating-label {
  position: absolute;
  left: 0;
  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
  user-select: none;
}

.floating-input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: 15px;
  padding-bottom: 8px;
  color: #18181b;
  font-family: inherit;
  transition: border-color 0.18s;
  box-sizing: border-box;
}

.eye-button {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  outline: none;
}

.checkbox-layout-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.75rem;
  margin-bottom: 1.25rem;
  width: 100%;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 7px;
  cursor: pointer;
  user-select: none;
}

.checkbox-box {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease-in-out;
  pointer-events: none;
}

.checkbox-text {
  font-size: 12px;
  color: #374151;
  font-weight: 500;
}

.contact-it {
  font-weight: 600;
  color: #0f52ba;
  cursor: pointer;
  transition: color 0.2s;
}
.contact-it:hover {
  color: #0d459d;
}

.error-shake-effect {
  animation: shakeAnimation 0.52s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

.autocomplete-dropdown {
  animation: fadeSlideDown 0.16s ease-out;
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 200;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  max-height: 200px;
  overflow-y: auto;
}
.suggestion-item-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  font-size: 13px;
  color: #18181b;
  font-weight: 500;
  transition: background 0.1s ease;
}
.suggestion-item-btn:hover,
.suggestion-item-btn:focus {
  background: #f9fafb;
  outline: none;
}
.dropdown-divider-line {
  height: 1px;
  background: #f3f4f6;
  margin: 0 16px;
}

.submit-action-btn {
  width: 100%;
  height: 52px;
  background: #0f52ba;
  color: #ffffff;
  border: none;
  border-radius: 9999px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 4px 14px rgba(15, 82, 186, 0.15);
}
.submit-action-btn:hover:not(:disabled) {
  background: #0d459d;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(15, 82, 186, 0.3);
}
.submit-action-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: none;
}
.submit-action-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.loading-spinner-ring {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spinLoader 0.7s linear infinite;
  display: inline-block;
}

.full-screen-loader {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.loader-text {
  margin-top: 16px;
  font-size: 16px;
  font-weight: 600;
  color: #0f52ba;
}
</style>
