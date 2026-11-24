<template>
  <span class="status-tag" :class="{ small: size === 'small' }">
    <span class="status-dot" :style="{ background: meta.color }" />
    {{ meta.label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CampaignStatus } from '@/types'
import { STATUS_META } from '@/constants'

const props = defineProps<{
  status?: CampaignStatus
  size?: 'small' | 'default'
}>()

const meta = computed(() => {
  if (!props.status) return { label: '—', color: '#a8a298' }
  return STATUS_META[props.status] ?? { label: props.status, color: '#858076' }
})
</script>

<style scoped>
.status-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 22px;
  padding: 0 8px;
  border: var(--hairline);
  border-radius: var(--radius-xs);
  color: var(--color-text-secondary);
  font-size: var(--font-size-micro);
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  background: transparent;
  letter-spacing: 0.01em;
}
.status-tag.small {
  height: 20px;
  padding: 0 6px;
  font-size: 11px;
}
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex: none;
}
.status-tag.small .status-dot {
  width: 6px;
  height: 6px;
}
</style>
