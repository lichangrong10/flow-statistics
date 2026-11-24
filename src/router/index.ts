import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'
import DefaultLayout from '@/layouts/DefaultLayout.vue'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    public?: boolean
    activeMenu?: string
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    redirect: '/admin/login',
  },
  {
    path: '/admin/login',
    name: 'admin-login',
    component: () => import('@/views/admin/AdminLoginView.vue'),
    meta: { title: '管理员登录', public: true },
  },
  {
    path: '/',
    component: DefaultLayout,
    redirect: '/admin',
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
        meta: { title: '系统管理' },
      },
    ],
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
    if (to.name === 'admin-login' && user.isLoggedIn && user.isAdmin) {
      return { path: '/admin' }
    }
    return true
  }

  if (!user.isLoggedIn) {
    return {
      path: '/admin/login',
      query: to.fullPath === '/' ? {} : { redirect: to.fullPath },
    }
  }

  if (!user.profile) {
    try {
      await user.fetchProfile()
    } catch {
      return { path: '/admin/login', query: { redirect: to.fullPath } }
    }
  }

  // 平台只允许管理员账号登录，历史普通用户会话直接清理
  if (user.profile?.role !== 'admin') {
    user.reset()
    return { path: '/admin/login', query: { redirect: to.fullPath } }
  }

  return true
})

export default router
