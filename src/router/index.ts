import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

/**
 * Route mengikuti aplikasi lama (React Router):
 *   /login, /, /recruitment, /recruitment/new, /recruitment/edit/:nomor,
 *   /recruitment/:nomor, /approval, /monitoring, /monitoring/:nomor,
 *   /kpi-hrd, /kpi-approver, /master/bagian, /master/bypass-users,
 *   /master/approval-map
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/LoginPage.vue'),
    meta: { layout: 'blank' },
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('@/pages/DashboardPage.vue'),
      },
      {
        path: 'recruitment',
        name: 'recruitment-list',
        component: () => import('@/pages/recruitment/RecruitmentListPage.vue'),
      },
      {
        path: 'recruitment/new',
        name: 'recruitment-new',
        component: () => import('@/pages/recruitment/RecruitmentFormPage.vue'),
      },
      {
        path: 'recruitment/edit/:nomor',
        name: 'recruitment-edit',
        component: () => import('@/pages/recruitment/RecruitmentFormPage.vue'),
      },
      {
        path: 'recruitment/:nomor',
        name: 'recruitment-detail',
        component: () => import('@/pages/recruitment/RecruitmentDetailPage.vue'),
      },
      {
        path: 'approval',
        name: 'approval',
        component: () => import('@/pages/approval/ApprovalListPage.vue'),
      },
      {
        path: 'monitoring',
        name: 'sla-monitoring',
        component: () => import('@/pages/monitoring/SlaStatusListPage.vue'),
      },
      {
        path: 'monitoring/:nomor',
        name: 'sla-detail',
        component: () => import('@/pages/monitoring/SlaDetailPage.vue'),
      },
      {
        path: 'kpi-hrd',
        name: 'kpi-hrd',
        component: () => import('@/pages/monitoring/KpiHrdPage.vue'),
        meta: { hrdOnly: true },
      },
      {
        path: 'kpi-approver',
        name: 'kpi-approver',
        component: () => import('@/pages/monitoring/KpiApproverPage.vue'),
      },
      {
        path: 'master/bagian',
        name: 'master-bagian',
        component: () => import('@/pages/master/BagianMasterPage.vue'),
        meta: { hrdOnly: true },
      },
      {
        path: 'master/bypass-users',
        name: 'master-bypass-users',
        component: () => import('@/pages/master/BypassUserPage.vue'),
        meta: { hrdOnly: true },
      },
      {
        path: 'master/approval-map',
        name: 'master-approval-map',
        component: () => import('@/pages/master/ApprovalMappingPage.vue'),
        meta: { hrdOnly: true },
      },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition ?? { top: 0 }
  },
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  if (to.path === '/login' && auth.isAuthenticated) {
    return { path: '/' }
  }
  if (to.meta.hrdOnly && !auth.isHrd) {
    return { path: '/' }
  }
  return true
})

export default router
