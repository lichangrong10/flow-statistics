<template>
  <div class="empty-state" :class="[`type-${type}`]">
    <div class="illustration">
      <svg viewBox="0 0 160 96" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="18" y="16" width="124" height="64" rx="8" fill="#F3F7FB" stroke="#DCE6F0" />
        <path d="M18 32H142" stroke="#DCE6F0" stroke-width="1.5" />
        <circle cx="28" cy="24" r="2" fill="#C3D2E1" />
        <circle cx="35" cy="24" r="2" fill="#C3D2E1" />
        <circle cx="42" cy="24" r="2" fill="#C3D2E1" />
        <path
          v-if="type !== 'error' && type !== 'no-perm'"
          d="M34 70L50 56L64 62L82 44L100 52L126 36"
          stroke="#9DB6CD"
          stroke-width="2.4"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          v-else-if="type === 'error'"
          d="M80 38V52M80 60V62"
          stroke="#C08A83"
          stroke-width="3.2"
          stroke-linecap="round"
        />
        <circle v-if="type === 'error'" cx="80" cy="64" r="1.8" fill="#C08A83" />
        <path
          v-else
          d="M72 44V61C72 64 74 65 77 65H83C86 65 88 64 88 61V44M72 44H88M75 44V41H85V44"
          stroke="#C3B08C"
          stroke-width="2"
          stroke-linecap="round"
        />
      </svg>
    </div>
    <div class="empty-title">{{ displayTitle }}</div>
    <div v-if="description" class="empty-desc">{{ description }}</div>
    <el-button v-if="actionText" class="empty-action" type="primary" plain @click="emit('action')">
      {{ actionText }}
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    type?: 'no-data' | 'no-result' | 'error' | 'no-perm'
    title?: string
    description?: string
    actionText?: string
  }>(),
  { type: 'no-data', title: '', description: '', actionText: '' },
)

const emit = defineEmits<{ action: [] }>()

const displayTitle = computed(() => {
  if (props.title) return props.title
  const map = {
    'no-data': '暂无数据',
    'no-result': '未找到符合条件的计划',
    error: '数据加载失败',
    'no-perm': '无访问权限',
  }
  return map[props.type]
})
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}
.illustration {
  width: 160px;
  opacity: 0.9;
}
.empty-title {
  margin-top: 12px;
  font-size: 14px;
  color: var(--color-text-secondary);
  font-weight: 500;
}
.empty-desc {
  margin-top: 4px;
  font-size: 12.5px;
  color: var(--color-text-tertiary);
  max-width: 360px;
  line-height: 1.7;
}
.empty-action {
  margin-top: 16px;
}
</style>
