<template>
  <div class="layout">
    <aside class="sidebar" :class="{ 'is-collapsed': collapsed }">
      <div class="brand">
        <div class="brand-mark">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
            <path d="M4 19V9.5M9.33 19V5M14.67 19v-6.5M20 19V8" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
          </svg>
        </div>
        <div v-show="!collapsed" class="brand-text">
          <div class="brand-title">投流统计平台</div>
          <div class="brand-sub">全域融数 · 智能投放</div>
        </div>
      </div>

      <nav class="nav">
        <router-link
          v-for="item in menus"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: activeMenu === item.key }"
          :title="collapsed ? item.label : undefined"
        >
          <el-icon class="nav-icon"><component :is="item.icon" /></el-icon>
          <span v-show="!collapsed" class="nav-label">{{ item.label }}</span>
          <span v-if="!collapsed && item.badge" class="nav-badge">{{ item.badge }}</span>
        </router-link>
      </nav>
    </aside>

    <div class="main">
      <header class="topbar">
        <div class="topbar-left">
          <el-button text class="collapse-btn" @click="app.toggleSidebar()">
            <el-icon :size="18"><Expand v-if="collapsed" /><Fold v-else /></el-icon>
          </el-button>
          <div class="breadcrumb">
            <span class="crumb-current">{{ pageTitle }}</span>
          </div>
        </div>

        <div class="topbar-right">
          <span v-if="updatedText" class="data-time">
            <span class="data-dot" />数据更新于 {{ updatedText }}
          </span>

          <el-tooltip
            :content="app.theme === 'dark' ? '切换到明色' : '切换到暗色'"
            placement="bottom"
          >
            <el-button
              text
              circle
              class="icon-btn theme-btn"
              :aria-label="app.theme === 'dark' ? '切换到明色主题' : '切换到暗色主题'"
              @click="app.toggleTheme()"
            >
              <el-icon :size="17">
                <Sunny v-if="app.theme === 'dark'" />
                <Moon v-else />
              </el-icon>
            </el-button>
          </el-tooltip>

          <div class="top-divider" />

          <el-dropdown trigger="click" @command="onUserCommand">
            <div class="user-chip" :title="`管理员：${user.profile?.username ?? ''}`">
              <span class="user-name">{{ user.displayName || '未登录' }}</span>
              <el-icon class="caret" :size="12"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item disabled>账号：{{ user.profile?.username ?? '—' }}</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <main class="content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowDown,
  DataAnalysis,
  DataBoard,
  Expand,
  Files,
  Fold,
  List,
  Moon,
  PieChart,
  Setting,
  Sunny,
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { useAppStore } from '@/stores/app'
import { useDictStore } from '@/stores/dict'
import { useUserStore } from '@/stores/user'
import { getCampaigns } from '@/api/campaign'
import { getDashboardSummary } from '@/api/dashboard'
import { lastNDays } from '@/utils/date'
import { APP_VERSION } from '@/constants'

const route = useRoute()
const router = useRouter()
const app = useAppStore()
const user = useUserStore()
const dict = useDictStore()

const collapsed = computed(() => app.sidebarCollapsed)
const version = APP_VERSION
const updatedText = ref('')
const pendingCount = ref(0)

const pageTitle = computed(() => (route.meta.title as string) ?? '工作台')
const activeMenu = computed(() => (route.meta.activeMenu as string) ?? (route.name as string))

const menus = computed(() => {
  const list = [
    { key: 'dashboard', path: '/dashboard', label: '工作台', icon: DataBoard, badge: 0 },
    {
      key: 'campaign',
      path: '/campaign',
      label: '投放计划',
      icon: List,
      badge: pendingCount.value,
    },
    { key: 'stats', path: '/stats', label: '数据回收', icon: DataAnalysis, badge: 0 },
    { key: 'board', path: '/board', label: '数据看板', icon: PieChart, badge: 0 },
    { key: 'report', path: '/report', label: '报表中心', icon: Files, badge: 0 },
  ]
  if (user.isAdmin) {
    list.push({ key: 'admin', path: '/admin', label: '系统管理', icon: Setting, badge: 0 })
  }
  return list
})

async function loadMeta() {
  await Promise.allSettled([app.loadProjects(), dict.load()])
  const range = lastNDays(30)
  try {
    const summary = await getDashboardSummary({ ...range })
    updatedText.value = summary.dataUpdatedAt
      ? dayjs(summary.dataUpdatedAt).format('MM-DD HH:mm')
      : ''
  } catch {
    updatedText.value = ''
  }
  try {
    const pending = await getCampaigns({ status: 'pending', page: 1, pageSize: 1 })
    pendingCount.value = pending.total
  } catch {
    pendingCount.value = 0
  }
}

async function onUserCommand(command: string) {
  if (command === 'logout') {
    await user.logout()
    ElMessage.success('已退出登录')
    router.replace('/login')
  }
}

onMounted(loadMeta)
</script>

<style scoped>
.layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: var(--color-bg);
}

/* ---------------- 侧边导航 ---------------- */
.sidebar {
  width: var(--shell-sidebar);
  flex: none;
  display: flex;
  flex-direction: column;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--sidebar-border);
  transition: width 0.16s ease;
  position: relative;
  z-index: 20;
}
.sidebar.is-collapsed {
  width: var(--shell-sidebar-collapsed);
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  height: var(--shell-topbar);
  padding: 0 16px;
  flex: none;
  border-bottom: 1px solid var(--sidebar-border);
}
.brand-mark {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--sidebar-text-strong);
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.32);
  flex: none;
}
.brand-text {
  min-width: 0;
}
.brand-title {
  color: var(--sidebar-text-strong);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
  line-height: 18px;
  white-space: nowrap;
}
.brand-sub {
  color: var(--sidebar-text);
  font-size: var(--font-size-micro);
  line-height: 16px;
  white-space: nowrap;
  letter-spacing: 0.06em;
}
.nav {
  flex: 1;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
}
.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  height: 40px;
  padding: 0 12px;
  border-radius: var(--radius-xs);
  color: var(--sidebar-text);
  font-size: 14px;
  transition: background 0.12s ease, color 0.12s ease;
  white-space: nowrap;
}
.nav-item:hover {
  background: var(--sidebar-hover);
  color: var(--sidebar-text-strong);
}
.nav-item.active {
  background: var(--sidebar-active);
  color: var(--sidebar-text-strong);
  font-weight: 500;
}
.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 2px;
  border-radius: 0;
  background: var(--sidebar-text-strong);
}
.nav-icon {
  font-size: 16px;
  flex: none;
}
.nav-label {
  flex: 1;
}
.nav-badge {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: var(--radius-xs);
  background: var(--sidebar-text-strong);
  color: #111110;
  font-size: var(--font-size-micro);
  line-height: 18px;
  text-align: center;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

/* ---------------- 主区域 ---------------- */
.main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.topbar {
  height: var(--shell-topbar);
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 16px 0 8px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border-light);
  z-index: 10;
}
.topbar-left {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}
.collapse-btn {
  color: var(--color-text-secondary);
  width: 32px;
  height: 32px;
}
.breadcrumb {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: var(--font-size-aux);
  white-space: nowrap;
}
.crumb-root {
  color: var(--color-text-tertiary);
}
.crumb-sep {
  color: var(--ink-300);
}
.crumb-current {
  color: var(--color-text);
  font-size: var(--font-size-body);
  font-weight: 600;
  letter-spacing: var(--tracking-tight);
}
.topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.data-time {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--color-text-tertiary);
  font-family: var(--font-mono);
  font-size: var(--font-size-micro);
  white-space: nowrap;
}
.data-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--signal-ok);
}
.icon-btn {
  color: var(--color-text-secondary);
}
.icon-btn:hover {
  background: var(--ink-50);
}
.top-divider {
  width: 1px;
  height: 20px;
  background: var(--color-border-light);
}
.user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px;
  border-radius: var(--radius-xs);
  transition: background 0.12s ease;
}
.user-chip:hover {
  background: var(--ink-50);
}
.user-name {
  font-size: var(--font-size-aux);
  color: var(--color-text);
  font-weight: 500;
  white-space: nowrap;
}
.caret {
  color: var(--color-text-tertiary);
}
.content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  background: var(--color-bg);
}

@media (max-width: 1366px) {
    .data-time {
    display: none;
  }
}

@media (max-width: 900px) {
  .sidebar {
    width: var(--shell-sidebar-collapsed) !important;
  }
  .brand {
    justify-content: center;
    padding: 0;
  }
  .brand-text,
  .nav-label,
  .nav-badge,
  .user-name,
  .caret,
  .top-divider,
  .data-time {
    display: none !important;
  }
  .nav-item {
    justify-content: center;
    padding: 0;
  }
  .topbar {
    padding: 0 8px;
  }
  .crumb-root,
  .crumb-sep {
    display: none;
  }
}
</style>
