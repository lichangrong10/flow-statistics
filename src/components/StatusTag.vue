<template>
  <span class="status-tag" :style="style">
    <span class="dot" />
    {{ meta.label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CampaignStatus } from '@/types'
import { STATUS_META } from '@/constants'

const props = defineProps<{
  status: CampaignStatus
  size?: 'small' | 'default'
}>()

const meta = computed(() => STATUS_META[props.status] ?? { label: props.status, color: '#5B6673', bg: '#F2F4F7', border: '#E3E7ED' })

const style = computed(() => ({
  color: meta.value.color,
  background: meta.value.bg,
  borderColor: meta.value.border,
  height: props.size === 'small' ? '20px' : '22px',
  fontSize: props.size === 'small' ? '11px' : '12px',
}))
</script>

<style scoped>
.status-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0 8px;
  border: 1px solid transparent;
  border-radius: 999px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
}
.dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
  flex: none;
}
</style>
