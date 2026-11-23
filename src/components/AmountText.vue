<template>
  <span class="amount-text" :class="{ negative: isNegative, muted: muted }">{{ text }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { abbrNumber, formatAmount } from '@/utils/format'

const props = withDefaults(
  defineProps<{
    value: string | number | null | undefined
    currency?: boolean
    precision?: number
    abbr?: boolean
    muted?: boolean
  }>(),
  { currency: false, precision: 2, abbr: false, muted: false },
)

const isNegative = computed(() => Number(props.value) < 0)

const text = computed(() => {
  if (props.value === null || props.value === undefined || props.value === '') return '—'
  if (props.abbr && !props.currency) return abbrNumber(props.value)
  if (props.currency) return formatAmount(props.value, { currency: true, precision: props.precision })
  return Number(props.value).toLocaleString('zh-CN', {
    minimumFractionDigits: props.precision,
    maximumFractionDigits: props.precision,
  })
})
</script>

<style scoped>
.amount-text {
  font-variant-numeric: tabular-nums;
}
.negative {
  color: var(--color-danger);
}
.muted {
  color: var(--color-text-secondary);
}
</style>
