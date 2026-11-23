<template>
  <div
    class="kpi-card"
    :class="{ clickable, 'is-loading': loading }"
    @click="clickable && !loading && emit('click')"
  >
    <div class="kpi-top">
      <span class="kpi-label">{{ label }}</span>
      <el-tooltip v-if="hint" :content="hint" placement="top">
        <el-icon class="hint-icon"><QuestionFilled /></el-icon>
      </el-tooltip>
    </div>

    <div v-if="loading" class="kpi-skeleton">
      <div class="skeleton" style="width: 62%; height: 28px" />
      <div class="skeleton" style="width: 40%; height: 12px; margin-top: 10px" />
    </div>

    <template v-else>
      <div class="kpi-value-row">
        <span class="kpi-value">{{ displayValue }}</span>
        <span v-if="unit" class="kpi-unit">{{ unit }}</span>
        <span v-if="suffix" class="kpi-suffix">{{ suffix }}</span>
      </div>
      <div v-if="hasCompare" class="kpi-foot">
        <span
          v-if="compare !== null && compare !== undefined"
          class="compare"
          :class="compareClass"
        >
          <span class="compare-dot" />
          {{ compareText }}
        </span>
        <span v-else-if="comparePlaceholder" class="compare empty">{{ comparePlaceholder }}</span>
        <span v-if="compareLabel" class="compare-label">{{ compareLabel }}</span>
      </div>
    </template>

    <div v-if="clickable && !loading" class="drill">
      查看
      <el-icon><ArrowRight /></el-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ArrowRight, QuestionFilled } from '@element-plus/icons-vue'
import { abbrNumber, formatSignedPercent } from '@/utils/format'

const props = withDefaults(
  defineProps<{
    label: string
    value: string | number | null | undefined
    unit?: string
    suffix?: string
    compare?: number | null
    compareLabel?: string
    comparePlaceholder?: string
    upIsGood?: boolean
    hint?: string
    loading?: boolean
    clickable?: boolean
  }>(),
  {
    unit: '',
    suffix: '',
    compare: null,
    compareLabel: '',
    comparePlaceholder: '',
    upIsGood: true,
    hint: '',
    loading: false,
    clickable: false,
  },
)

const emit = defineEmits<{ click: [] }>()

const displayValue = computed(() => {
  if (props.value === null || props.value === undefined || props.value === '') return '—'
  const raw = String(props.value)
  if (raw === '—' || /[%¥]/.test(raw) || /[^\d.,\-]/.test(raw)) return raw
  if (raw.startsWith('¥')) {
    return Number(raw.slice(1)).toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }
  return abbrNumber(raw)
})

const compareText = computed(() => {
  if (props.compare === null || props.compare === undefined) return ''
  return formatSignedPercent(props.compare, 1)
})

const hasCompare = computed(
  () =>
    (props.compare !== null && props.compare !== undefined) ||
    Boolean(props.comparePlaceholder) ||
    Boolean(props.compareLabel),
)

const compareClass = computed(() => {
  if (props.compare === null || props.compare === undefined) return ''
  if (Math.abs(props.compare) < 0.0005) return 'flat'
  const positive = props.compare > 0
  const good = positive === props.upIsGood
  return good ? 'good' : 'bad'
})
</script>

<style scoped>
.kpi-card {
  position: relative;
  background: var(--color-surface);
  border: var(--hairline);
  border-radius: var(--radius-md);
  padding: 16px 18px 14px;
  min-height: 112px;
  display: flex;
  flex-direction: column;
  transition: border-color 0.12s ease, background-color 0.12s ease;
  overflow: hidden;
}
.kpi-card.clickable {
  cursor: pointer;
}
.kpi-card.clickable:hover {
  border-color: var(--ink-300);
  background: var(--ink-25);
}
.kpi-top {
  display: flex;
  align-items: center;
  gap: 6px;
}
.kpi-label {
  font-size: var(--font-size-micro);
  color: var(--color-text-secondary);
  line-height: 16px;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}
.hint-icon {
  color: var(--ink-400);
  font-size: 12px;
  cursor: help;
}
.kpi-value-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-top: 10px;
  min-height: 36px;
}
.kpi-value {
  font-size: var(--font-size-metric);
  font-weight: 600;
  line-height: 36px;
  color: var(--color-text);
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  font-family: var(--font-sans);
}
.kpi-unit {
  font-size: var(--font-size-aux);
  color: var(--color-text-tertiary);
  font-weight: 400;
}
.kpi-suffix {
  font-size: var(--font-size-micro);
  color: var(--color-text-tertiary);
  margin-left: 2px;
}
.kpi-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  min-height: 16px;
}
.compare {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-size-micro);
  font-weight: 500;
  color: var(--color-text-secondary);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.01em;
}
.compare-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--ink-400);
  flex: none;
}
.compare.good .compare-dot {
  background: var(--signal-ok);
}
.compare.bad .compare-dot {
  background: var(--signal-danger);
}
.compare.empty {
  color: var(--color-text-tertiary);
}
.compare-label {
  font-size: var(--font-size-micro);
  color: var(--color-text-tertiary);
}
.drill {
  position: absolute;
  right: 14px;
  bottom: 12px;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: var(--font-size-micro);
  color: var(--color-text-tertiary);
  opacity: 0;
  transition: opacity 0.12s ease;
}
.kpi-card.clickable:hover .drill {
  opacity: 1;
}
.kpi-skeleton {
  margin-top: 10px;
}
.is-loading {
  cursor: default;
}
</style>
