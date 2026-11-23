import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'
import DefaultLayout from '@/layouts/DefaultLayout.vue'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    public?: boolean
    adminOnly?: boolean
    activeMenu?: string
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', public: true },
  },
  {
    path: '/',
    component: DefaultLayout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '工作台' },
      },
      {
        path: 'campaign',
        name: 'campaign',
        component: () => import('@/views/campaign/index.vue'),
        meta: { title: '投放计划' },
      },
      {
        path: 'campaign/create',
        name: 'campaign-create',
        component: () => import('@/views/campaign/create.vue'),
        meta: { title: '发布投流', activeMenu: 'campaign' },
      },
      {
        path: 'campaign/:id',
        name: 'campaign-detail',
        component: () => import('@/views/campaign/detail.vue'),
        meta: { title: '投放详情', activeMenu: 'campaign' },
      },
      {
        path: 'board',
        name: 'board',
        component: () => import('@/views/board/index.vue'),
        meta: { title: '数据看板' },
      },
      {
        path: 'stats',
        name: 'stats',
        component: () => import('@/views/stats/index.vue'),
        meta: { title: '数据回收' },
      },
      {
        path: 'report',
        name: 'report',
        component: () => import('@/views/report/index.vue'),
        meta: { title: '报表中心' },
      },
      {
        path: 'admin',
        name: 'admin',
        component: () => import('@/views/admin/AdminView.vue'),
        meta: { title: '系统管理', adminOnly: true },
      },
    ],
  },
  {
    path: '/403',
    name: 'forbidden',
    component: () => import('@/views/error/403.vue'),
    meta: { title: '无权限' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '页面不存在', public: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(async (to) => {
  const appTitle = '投流统计平台'
  document.title = to.meta.title ? `${to.meta.title} · ${appTitle}` : appTitle
  const user = useUserStore()

  if (to.meta.public) {
    if (to.name === 'login' && user.isLoggedIn) return { path: '/dashboard' }
    return true
  }

  if (!user.isLoggedIn) {
    return { path: '/login', query: to.fullPath === '/' ? {} : { redirect: to.fullPath } }
  }

  if (!user.profile) {
    try {
      await user.fetchProfile()
    } catch {
      return { path: '/login', query: { redirect: to.fullPath } }
    }
  }

  if (to.meta.adminOnly && !user.isAdmin) return { path: '/403' }
  return true
})

export default router
