<template>
  <div ref="rootEl" class="base-chart" :style="{ height: `${height}px` }">
    <div v-show="!loading && !empty" ref="chartEl" class="chart-canvas" />
    <div v-if="loading" class="chart-loading">
      <div class="skeleton" style="width: 100%; height: 70%" />
    </div>
    <div v-else-if="empty" class="chart-empty">
      <EmptyState type="no-data" :title="emptyText" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import EmptyState from './EmptyState.vue'

const props = withDefaults(
  defineProps<{
    option: EChartsOption
    height?: number
    loading?: boolean
    empty?: boolean
    emptyText?: string
  }>(),
  { height: 300, loading: false, empty: false, emptyText: '暂无数据' },
)

const rootEl = ref<HTMLDivElement>()
const chartEl = ref<HTMLDivElement>()
const chart = shallowRef<echarts.ECharts>()
let observer: ResizeObserver | null = null

function render() {
  if (!chart.value) return
  chart.value.setOption(props.option, true)
}

function initIfReady(): void {
  const el = chartEl.value
  if (!el) return
  if (!chart.value) {
    // 加载态 / 隐藏 tab 下容器宽高为 0，等可见后再初始化，避免 ECharts 警告
    if (!el.clientWidth || !el.clientHeight) return
    chart.value = echarts.init(el, undefined, { renderer: 'canvas' })
    render()
    return
  }
  if (el.clientWidth && el.clientHeight) chart.value.resize()
}

onMounted(() => {
  observer = new ResizeObserver(() => initIfReady())
  if (rootEl.value) observer.observe(rootEl.value)
  void nextTick(initIfReady)
})

watch(
  () => props.option,
  () => render(),
  { deep: true },
)

watch(
  () => [props.loading, props.empty],
  async () => {
    await nextTick()
    initIfReady()
  },
)

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
  chart.value?.dispose()
  chart.value = undefined
})
</script>

<style scoped>
.base-chart {
  position: relative;
  width: 100%;
}
.chart-canvas {
  width: 100%;
  height: 100%;
}
.chart-loading,
.chart-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
}
.chart-loading .skeleton {
  border-radius: var(--radius-md);
}
</style>
