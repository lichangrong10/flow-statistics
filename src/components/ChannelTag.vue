<template>
  <span class="channel-tag">
    <span class="channel-icon">{{ meta.short }}</span>
    <span class="channel-name">{{ meta.label }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ChannelCode } from '@/types'
import { CHANNEL_META } from '@/constants'

const props = defineProps<{ channel: ChannelCode }>()
const meta = computed(
  () =>
    CHANNEL_META[props.channel] ?? {
      label: props.channel,
      short: String(props.channel).slice(0, 1),
    },
)
</script>

<style scoped>
.channel-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}
.channel-icon {
  width: 20px;
  height: 20px;
  border-radius: var(--radius-xs);
  border: var(--hairline);
  background: transparent;
  color: var(--color-text-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-micro);
  font-weight: 600;
  flex: none;
}
.channel-name {
  font-size: var(--font-size-aux);
  color: var(--color-text);
}
</style>
