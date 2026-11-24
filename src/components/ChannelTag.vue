<template>
  <span class="channel-tag">
    <ChannelIcon v-if="channel" :channel="channel" :size="18" />
    <span class="channel-name">{{ meta.label }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ChannelCode } from '@/types'
import { CHANNEL_META } from '@/constants'
import ChannelIcon from '@/components/ChannelIcon.vue'

const props = defineProps<{ channel?: ChannelCode }>()
const meta = computed(() => {
  if (!props.channel) return { label: '—', short: '—' }
  return (
    CHANNEL_META[props.channel] ?? {
      label: props.channel,
      short: String(props.channel).slice(0, 1),
    }
  )
})
</script>

<style scoped>
.channel-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}
.channel-name {
  font-size: var(--font-size-aux);
  color: var(--color-text);
}
</style>
