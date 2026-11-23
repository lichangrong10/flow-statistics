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
      <div class="skeleton" style="width: 62%; height: 30px" />
      <div class="skeleton" style="width: 40%; height: 14px; margin-top: 10px" />
    </div>

    <template v-else>
      <div class="kpi-value-row">
        <span class="kpi-value">{{ displayValue }}</span>
        <span v-if="unit" class="kpi-unit">{{ unit }}</span>
        <span v-if="suffix" class="kpi-suffix">{{ suffix }}</span>
      </div>
      <div v-if="hasCompare" class="kpi-foot">
        <span v-if="compare !== null && compare !== undefined" class="compare" :class="compareClass">
          <span class="arrow">{{ compare > 0 ? '▲' : compare < 0 ? '▼' : '—' }}</span>
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
  // 已格式化的文本（百分比、占位符、带币种）原样展示
  if (raw === '—' || /[%¥]/.test(raw) || /[^\d.,\-]/.test(raw)) return raw
  // 金额类以 ¥ 开头时不做万位缩写
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
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: 16px 18px 14px;
  min-height: 116px;
  display: flex;
  flex-direction: column;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  overflow: hidden;
}
.kpi-card::after {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 3px;
  background: linear-gradient(180deg, #2e6da4, #17416b);
  opacity: 0;
  transition: opacity 0.18s ease;
}
.kpi-card.clickable {
  cursor: pointer;
}
.kpi-card.clickable:hover {
  transform: translateY(-2px);
  border-color: #c9d8e8;
  box-shadow: 0 12px 28px -16px rgba(23, 65, 107, 0.32);
}
.kpi-card.clickable:hover::after {
  opacity: 1;
}
.kpi-top {
  display: flex;
  align-items: center;
  gap: 6px;
}
.kpi-label {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 20px;
}
.hint-icon {
  color: #b3bdc9;
  font-size: 13px;
  cursor: help;
}
.kpi-value-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-top: 8px;
  min-height: 38px;
}
.kpi-value {
  font-size: var(--font-size-metric);
  font-weight: 600;
  line-height: 36px;
  color: var(--color-text);
  letter-spacing: -0.4px;
  font-variant-numeric: tabular-nums;
}
.kpi-unit {
  font-size: 13px;
  color: var(--color-text-tertiary);
  font-weight: 400;
}
.kpi-suffix {
  font-size: 12px;
  color: var(--color-text-tertiary);
  margin-left: 2px;
}
.kpi-foot {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  min-height: 18px;
}
.compare {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  font-weight: 500;
  padding: 0 5px;
  height: 18px;
  border-radius: 4px;
  font-variant-numeric: tabular-nums;
}
.compare.good {
  color: #1f8a5b;
  background: #e9f6f0;
}
.compare.bad {
  color: #b4372f;
  background: #fbeceb;
}
.compare.flat {
  color: var(--color-text-secondary);
  background: #f2f4f7;
}
.compare.empty {
  color: var(--color-text-tertiary);
  background: transparent;
  padding: 0;
}
.arrow {
  font-size: 8px;
  line-height: 1;
}
.compare-label {
  font-size: 12px;
  color: var(--color-text-tertiary);
}
.drill {
  position: absolute;
  right: 14px;
  top: 14px;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  color: var(--color-accent);
  opacity: 0;
  transform: translateX(-4px);
  transition: all 0.18s ease;
}
.kpi-card.clickable:hover .drill {
  opacity: 1;
  transform: translateX(0);
}
.kpi-skeleton {
  margin-top: 10px;
}
.is-loading {
  cursor: default;
}
</style>
