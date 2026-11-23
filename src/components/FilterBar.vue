<template>
  <div class="filter-bar card">
    <div class="fields">
      <slot />
    </div>
    <div class="actions">
      <slot name="extra" />
      <el-button type="primary" :loading="loading" @click="emit('search')">
        <el-icon><Search /></el-icon>
        查询
      </el-button>
      <el-button @click="emit('reset')">重置</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Search } from '@element-plus/icons-vue'

withDefaults(defineProps<{ loading?: boolean }>(), { loading: false })

const emit = defineEmits<{ search: []; reset: [] }>()
</script>

<style scoped>
.filter-bar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  flex-wrap: wrap;
}
.fields {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 16px;
  flex: 1;
  min-width: 0;
}
.fields :deep(.field) {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.fields :deep(.field-label) {
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 18px;
}
.actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
}
</style>
