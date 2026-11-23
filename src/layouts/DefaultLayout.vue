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

      <div class="sidebar-foot">
        <div
          v-show="!collapsed"
          class="env-chip"
          title="数据来自内网后端（192.168.9.224:3000），由后端模拟投流服务生成"
        >
          <span class="env-dot" />
          已连接内网后端
        </div>
        <div v-show="!collapsed" class="version">前端版本 {{ version }}</div>
      </div>
    </aside>

    <div class="main">
      <header class="topbar">
        <div class="topbar-left">
          <el-button text class="collapse-btn" @click="app.toggleSidebar()">
            <el-icon :size="18"><Expand v-if="collapsed" /><Fold v-else /></el-icon>
          </el-button>
          <div class="breadcrumb">
            <span class="crumb-root">投流统计平台</span>
            <span class="crumb-sep">/</span>
            <span class="crumb-current">{{ pageTitle }}</span>
          </div>
        </div>

        <div class="topbar-right">
          <div class="project-select">
            <el-icon class="project-icon"><FolderOpened /></el-icon>
            <el-select
              v-model="currentProjectId"
              size="default"
              class="project-el"
              placeholder="选择项目"
              @change="onProjectChange"
            >
              <el-option
                v-for="project in app.projects"
                :key="project.id"
                :label="project.name"
                :value="project.id"
              />
            </el-select>
          </div>

          <span v-if="updatedText" class="data-time">
            <span class="data-dot" />数据更新于 {{ updatedText }}
          </span>

          <div class="top-divider" />

          <el-dropdown trigger="click" @command="onUserCommand">
            <div class="user-chip">
              <div class="avatar">{{ initial }}</div>
              <div class="user-meta">
                <span class="user-name">{{ user.displayName || '未登录' }}</span>
                <span class="user-role">{{ user.roleLabel }}</span>
              </div>
              <el-icon class="caret" :size="12"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item disabled>账号：{{ user.profile?.username ?? '—' }}</el-dropdown-item>
                <el-dropdown-item disabled>角色：{{ user.roleLabel }}</el-dropdown-item>
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
  FolderOpened,
  List,
  PieChart,
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

const currentProjectId = computed({
  get: () => app.currentProjectId ?? undefined,
  set: (value: number) => app.setProject(value),
})

const pageTitle = computed(() => (route.meta.title as string) ?? '工作台')
const activeMenu = computed(() => (route.meta.activeMenu as string) ?? (route.name as string))
const initial = computed(() => (user.displayName || 'U').slice(0, 1))

const menus = computed(() => [
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
])

async function loadMeta() {
  await Promise.allSettled([app.loadProjects(), dict.load()])
  const projectId = app.currentProjectId ?? undefined
  const range = lastNDays(30)
  try {
    const summary = await getDashboardSummary({ projectId, ...range })
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

function onProjectChange(value: number) {
  app.setProject(value)
  loadMeta()
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
  width: 232px;
  flex: none;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #133252 0%, #0d2740 100%);
  box-shadow: var(--shadow-sidebar);
  transition: width 0.2s ease;
  position: relative;
  z-index: 20;
}
.sidebar.is-collapsed {
  width: 72px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 60px;
  padding: 0 18px;
  flex: none;
}
.brand-mark {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: linear-gradient(135deg, #2e6da4, #17416b);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.16), 0 4px 10px rgba(0, 0, 0, 0.2);
  flex: none;
}
.brand-text {
  min-width: 0;
}
.brand-title {
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.4px;
  line-height: 20px;
  white-space: nowrap;
}
.brand-sub {
  color: rgba(255, 255, 255, 0.45);
  font-size: 11px;
  line-height: 16px;
  white-space: nowrap;
}
.nav {
  flex: 1;
  padding: 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
}
.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  height: 42px;
  padding: 0 12px;
  border-radius: 8px;
  color: var(--sidebar-text);
  font-size: 14px;
  transition: background 0.16s ease, color 0.16s ease;
  white-space: nowrap;
}
.nav-item:hover {
  background: var(--sidebar-hover);
  color: #fff;
}
.nav-item.active {
  background: var(--sidebar-active);
  color: #fff;
  font-weight: 500;
}
.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 11px;
  bottom: 11px;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: #7fb3e0;
}
.nav-icon {
  font-size: 17px;
  flex: none;
}
.nav-label {
  flex: 1;
}
.nav-badge {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: #c77c0e;
  color: #fff;
  font-size: 11px;
  line-height: 18px;
  text-align: center;
  font-weight: 500;
}
.sidebar-foot {
  padding: 14px 18px 18px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  flex: none;
}
.env-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 22px;
  padding: 0 9px;
  border-radius: 999px;
  background: rgba(63, 168, 122, 0.16);
  color: #8fd6b4;
  font-size: 11px;
  white-space: nowrap;
}
.env-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #4cc38a;
}
.version {
  margin-top: 8px;
  color: rgba(255, 255, 255, 0.32);
  font-size: 11px;
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
  height: 60px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 20px 0 8px;
  background: #fff;
  border-bottom: 1px solid var(--color-border-light);
  z-index: 10;
}
.topbar-left {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.collapse-btn {
  color: var(--color-text-secondary);
  width: 34px;
  height: 34px;
}
.breadcrumb {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 13px;
  white-space: nowrap;
}
.crumb-root {
  color: var(--color-text-tertiary);
}
.crumb-sep {
  color: #c4cdd8;
}
.crumb-current {
  color: var(--color-text);
  font-size: 15px;
  font-weight: 600;
}
.topbar-right {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}
.project-select {
  display: flex;
  align-items: center;
  gap: 6px;
}
.project-icon {
  color: var(--color-text-tertiary);
  font-size: 15px;
}
.project-el {
  width: 250px;
}
.project-el :deep(.el-select__wrapper) {
  box-shadow: none;
  background: transparent;
  padding-left: 2px;
}
.project-el :deep(.el-select__wrapper:hover) {
  box-shadow: none;
  background: var(--color-primary-soft);
}
.project-el :deep(.el-select__selected-item) {
  font-size: 13px;
  color: var(--color-text);
}
.data-time {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--color-text-tertiary);
  font-size: 12px;
  white-space: nowrap;
}
.data-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #3fa87a;
}
.icon-btn {
  color: var(--color-text-secondary);
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
  padding: 4px 6px 4px 4px;
  border-radius: 8px;
  transition: background 0.15s ease;
}
.user-chip:hover {
  background: var(--color-primary-soft);
}
.avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2e6da4, #17416b);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}
.user-meta {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}
.user-name {
  font-size: 13px;
  color: var(--color-text);
  font-weight: 500;
}
.user-role {
  font-size: 11px;
  color: var(--color-text-tertiary);
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
  .project-el {
    width: 200px;
  }
  .data-time {
    display: none;
  }
}
</style>
