<template>
  <span class="vendor-tags">
    <el-tooltip
      v-for="vendor in visible"
      :key="vendor.id"
      :content="vendor.name"
      placement="top"
    >
      <span class="vendor-tag" :style="{ maxWidth: `${tagWidth}px` }">{{ vendor.name }}</span>
    </el-tooltip>
    <el-tooltip v-if="rest.length" placement="top">
      <template #content>
        <div v-for="vendor in rest" :key="vendor.id" class="tip-line">{{ vendor.name }}</div>
      </template>
      <span class="vendor-tag more">+{{ rest.length }}</span>
    </el-tooltip>
    <span v-if="!list.length" class="tertiary">—</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { VendorBrief } from '@/types'

const props = withDefaults(
  defineProps<{
    vendors?: VendorBrief[] | null
    max?: number
    tagMaxWidth?: number
  }>(),
  { max: 2, vendors: () => [], tagMaxWidth: 96 },
)

const list = computed(() => props.vendors ?? [])
const visible = computed(() => list.value.slice(0, props.max))
const rest = computed(() => list.value.slice(props.max))
// 有折叠标记时给 +N 留出空间
const tagWidth = computed(() => (rest.value.length ? Math.min(props.tagMaxWidth, 56) : props.tagMaxWidth))
</script>

<style scoped>
.vendor-tags {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}
.vendor-tag {
  display: inline-block;
  max-width: 96px;
  padding: 0 6px;
  height: 20px;
  line-height: 20px;
  border-radius: 4px;
  background: var(--color-primary-soft);
  border: 1px solid #e1eaf3;
  color: #3b5e80;
  font-size: 11.5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.vendor-tag.more {
  background: #f2f4f7;
  border-color: #e6ebf2;
  color: var(--color-text-secondary);
  padding: 0 5px;
}
.tip-line {
  line-height: 20px;
  font-size: 12px;
}
</style>
