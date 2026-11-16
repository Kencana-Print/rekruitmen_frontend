# Panduan Porting Frontend (React JSX → Vue 3 + TypeScript)

Dokumen ini WAJIB dibaca sebelum menulis halaman. Tujuannya agar hasil porting
**identik secara visual** dengan aplikasi React lama, tetapi memakai arsitektur
Vue 3 + TypeScript.

## Stack & konvensi umum

- Vue 3 `<script setup lang="ts">`, TypeScript strict.
- Alias `@` → `src` (sudah dikonfigurasi di `vite.config.ts` + `tsconfig.json`).
- Style Tailwind & token warna SAMA PERSIS dengan aplikasi lama.
- Semua teks UI berbahasa Indonesia, jangan diubah.

### Padanan React → Vue

| React | Vue |
|---|---|
| `useState(x)` | `const x = ref(x)` (akses `.value` di script, otomatis di template) |
| `useMemo(fn, deps)` | `computed(fn)` |
| `useEffect(fn, [])` | `onMounted(fn)` |
| `useEffect(fn, [a])` | `watch(a, fn)` |
| `useRef(null)` | `ref(null)` + `ref="namaRef"` di template |
| `useNavigate()` | `useRouter()` → `router.push(...)` |
| `useParams()` | `useRoute().params` |
| `useLocation()` | `useRoute()` |
| `<Link to>` / `<NavLink>` | `<RouterLink :to="...">` |
| `createPortal(x, document.body)` | `<Teleport to="body">` |
| `className={clsx(...)}` | `:class="[...]"` (array/objek) |
| `onClick={fn}` | `@click="fn"` |
| `onChange={e => setX(e.target.value)}` | `@input="x = ($event.target as HTMLInputElement).value"` |
| `{cond && <X/>}` | `v-if="cond"` |
| `!cond ? a : b` | `v-if` / `v-else` |
| `list.map(x => ...)` | `v-for="x in list" :key="..."` |
| `<Icon size={16}/>` | `<Icon :size="16" />` (dari `lucide-vue-next`) |
| `disabled={v}` | `:disabled="v"` |
| `value={v}` pada input | `:value="v"` |

**Jangan** memakai `document.querySelector` atau state global React. Gunakan ref Vue.

## Data fetching

React Query **tidak dipakai**. Gunakan pola berikut:

```ts
import { useAsyncData } from '@/composables/useAsyncData'

const { data, isLoading, isError, reload } = useAsyncData(
  () => recruitmentApi.list().then(r => r.data.data ?? []),
  [] as RecruitmentRow[]
)
```

- `data` adalah `Ref<T>` → di template langsung `data`.
- Setelah mutasi berhasil: panggil `await reload()`.
- Mutasi ditulis sebagai fungsi async biasa:

```ts
const saving = ref(false)
async function save() {
  saving.value = true
  try {
    await recruitmentApi.save(body)
    toast.success('Berhasil disimpan')
    await reload()
  } catch (e) {
    toast.error(sanitizeApiError(e, 'Gagal menyimpan.'))
  } finally {
    saving.value = false
  }
}
```

- Untuk query yang butuh parameter (mis. `route.params.nomor`), panggil API
  langsung di `onMounted` dengan `loading`/`error` ref sendiri bila `useAsyncData`
  kurang cocok.

## Toast

```ts
import toast from '@/composables/useToast'
toast.success('...')
toast.error('...')
```

## Komponen UI yang tersedia

Semua di `@/components/ui/...` (tidak ada index barrel, import per file).

| Komponen | Path | Props | Emits / Slot |
|---|---|---|---|
| Spinner | `ui/Spinner.vue` | `size?: number` | – |
| PageLoader | `ui/PageLoader.vue` | `message?: string` | – |
| FullScreenLoader | `ui/FullScreenLoader.vue` | `message?: string` | – |
| Skeleton | `ui/Skeleton.vue` | class via `class` | – |
| Badge | `ui/Badge.vue` | `label`, `bg?`, `text?`, `class?` | – |
| EmptyState | `ui/EmptyState.vue` | `message?`, `icon?` (komponen), `actionLabel?` | `@action`, slot `action` |
| ErrorBox | `ui/ErrorBox.vue` | `message?` | `@retry` |
| Modal | `ui/Modal.vue` | `open`, `title?`, `size?: 'sm'\|'md'\|'lg'\|'xl'` | `@close`, slot default + `#footer` |
| ConfirmDialog | `ui/ConfirmDialog.vue` | `open`, `title?`, `message?`, `confirmText?`, `danger?`, `loading?` | `@close`, `@confirm` |
| ProgressBar | `ui/ProgressBar.vue` | `value`, `color?`, `animated?`, `class?` | – |
| StatCard | `ui/StatCard.vue` | `label`, `value`, `icon?`, `color?`, `alert?`, `subtitle?` | `@click` |
| Tabs | `ui/Tabs.vue` | `tabs: {value,label,count?}[]`, `modelValue` | `@update:modelValue` |
| AlertBanner | `ui/AlertBanner.vue` | `type?`, `message?`, `actionLabel?` | `@action` |
| SearchInput | `ui/SearchInput.vue` | `modelValue`, `placeholder?`, `class?` | `@update:modelValue` |
| Divider | `ui/Divider.vue` | `class?` | – |
| InputField | `ui/InputField.vue` | `label?`, `modelValue`, `type?`, `placeholder?`, `required?`, `error?`, `hint?`, `disabled?`, `maxlength?`, `autofocus?`, `class?` | `@update:modelValue` |
| SelectField | `ui/SelectField.vue` | `label?`, `modelValue`, `options: {value,label}[]`, `placeholder?`, `required?`, `disabled?` | `@update:modelValue` |
| TextAreaField | `ui/TextAreaField.vue` | `label?`, `modelValue`, `rows?`, `required?`, `error?`, `placeholder?`, `disabled?` | `@update:modelValue` |
| RecruitmentTableSkeleton | `ui/RecruitmentTableSkeleton.vue` | `rows?: number` | – |
| ApprovalCardSkeleton | `ui/ApprovalCardSkeleton.vue` | – | – |
| SlaCardSkeleton | `ui/SlaCardSkeleton.vue` | – | – |
| SlaStatsSkeleton | `ui/SlaStatsSkeleton.vue` | – | – |
| BagianCardSkeleton | `ui/BagianCardSkeleton.vue` | – | – |
| BypassUserCardSkeleton | `ui/BypassUserCardSkeleton.vue` | – | – |
| KpiDistributionSkeleton | `ui/KpiDistributionSkeleton.vue` | `bars?: number` | – |
| KpiItemCardSkeleton | `ui/KpiItemCardSkeleton.vue` | – | – |
| SlaDetailSkeleton | `ui/SlaDetailSkeleton.vue` | – | – |
| RecruitmentDetailSkeleton | `ui/RecruitmentDetailSkeleton.vue` | – | – |
| FormPageSkeleton | `ui/FormPageSkeleton.vue` | – | – |
| CardSkeleton | `ui/CardSkeleton.vue` | `rows?: number` | – |

Komponen global lain:
- `@/components/PeriodPickerModal.vue` — props `current: string|null`,
  emits `select(value: string|null)` dan `close`.
- `@/components/PaginationControls.vue` — props `currentPage`, `totalPages`,
  `totalItems`, `itemsPerPage?`; emit `pageChange(page)`.
- `@/components/AnimatedIcon.vue` — props `variant?: 'scale'|'slideRight'|'spin'|'wiggle'|'pulse'`, slot isi ikon.
- `@/components/icons/*.vue` — DashboardIcon, ClipboardListIcon, CheckSquareIcon,
  ActivityIcon, BarChart3Icon, TrendingUpIcon, Building2Icon, ShieldCheckIcon,
  GitMergeIcon. Props: `size?`, `class?`.

## Composable & util

```ts
import { usePagination } from '@/composables/usePagination'
const listRef = computed(() => filtered.value as RecruitmentRow[])
const { currentPage, setCurrentPage, totalPages, paginatedData, totalItems } =
  usePagination(listRef, 15, computed(() => `${search.value}|${period.value}`))
```

```ts
import { matchesPeriodFilter, periodToLabel, periodToApiParam } from '@/utils/periodFilter'
import { formatDate, formatDateTime, toApiDate, getApprovalStatus, getSlaStatusMeta,
         getSlaSourceMeta, getPerformanceMeta, getDaysColor } from '@/utils/helpers'
import { validateTglButuh, getMinAllowedDate, addWorkdays } from '@/utils/workday'
import { sanitizeApiError } from '@/utils/security'
import { useAuthStore } from '@/stores/auth'
```

Auth store (`@/stores/auth`): `auth.user`, `auth.isHrd` (computed), `auth.logout()`.

API (`@/api/services`): `authApi`, `dashboardApi`, `masterApi`, `recruitmentApi`,
`approvalApi`, `monitoringApi` — bentuk respons: `response.data.data`.

## Aturan kualitas

1. **Jangan mengubah** struktur markup, kelas Tailwind, ikon, warna, urutan
   section, atau teks dibanding file JSX sumber.
2. Setiap halaman harus lengkap (tanpa placeholder “sisanya sama”).
3. Jangan membuat file baru di luar yang diminta. Jangan mengubah file bersama
   (`api/`, `utils/`, `components/ui/`, router, store).
4. Jangan menjalankan `npm install`.
5. Pastikan semua import yang dipakai benar-benar ada. Import ikon dari
   `lucide-vue-next` dengan nama PascalCase yang sama seperti `lucide-react`.
6. Tabel: gunakan kembali kelas `.table-wrapper`, `table`, dsb. dari `style.css`.
