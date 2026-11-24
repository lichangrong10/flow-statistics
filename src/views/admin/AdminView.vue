<script setup lang="ts">
import { ref } from 'vue'
import { Collection, MagicStick, Shop, Tickets, User } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import UsersTab from './tabs/UsersTab.vue'
import VendorsTab from './tabs/VendorsTab.vue'
import MockTab from './tabs/MockTab.vue'
import DictTab from './tabs/DictTab.vue'
import LogsTab from './tabs/LogsTab.vue'

const activeTab = ref('users')
const refreshToken = ref(0)

const tabs = [
  { name: 'users', label: '管理员账号', icon: User },
  { name: 'vendors', label: '厂商管理', icon: Shop },
  { name: 'mock', label: '模拟参数', icon: MagicStick },
  { name: 'dicts', label: '字典配置', icon: Collection },
  { name: 'logs', label: '操作日志', icon: Tickets },
]
</script>

<template>
  <div class="page admin-page">
    <PageHeader
      title="系统管理"
      subtitle="管理员账号、厂商、模拟参数、字典与操作日志"
    />

    <div class="admin-panel">
      <el-tabs v-model="activeTab" class="admin-tabs">
        <el-tab-pane v-for="tab in tabs" :key="tab.name" :name="tab.name" lazy>
          <template #label>
            <span class="tab-label">
              <el-icon><component :is="tab.icon" /></el-icon>
              {{ tab.label }}
            </span>
          </template>

          <UsersTab v-if="tab.name === 'users'" :refresh-token="refreshToken" />
          <VendorsTab v-else-if="tab.name === 'vendors'" :refresh-token="refreshToken" />
          <MockTab v-else-if="tab.name === 'mock'" :refresh-token="refreshToken" />
          <DictTab v-else-if="tab.name === 'dicts'" :refresh-token="refreshToken" />
          <LogsTab v-else :refresh-token="refreshToken" />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<style scoped>
.admin-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.admin-panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  padding: 4px 16px 16px;
}
.admin-tabs :deep(.el-tabs__header) {
  margin-bottom: 16px;
}
.admin-tabs :deep(.el-tabs__item) {
  height: 46px;
  font-size: 14px;
}
.tab-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
</style>
