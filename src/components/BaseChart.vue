<template>
  <div class="base-chart" :style="{ height: `${height}px` }">
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
import { useChartTheme } from '@/utils/chart'
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

const chartEl = ref<HTMLDivElement>()
const chart = shallowRef<echarts.ECharts>()
const theme = useChartTheme()
let observer: ResizeObserver | null = null

function render() {
  if (!chart.value) return
  chart.value.setOption(props.option, true)
}

onMounted(() => {
  if (!chartEl.value) return
  chart.value = echarts.init(chartEl.value, theme, { renderer: 'canvas' })
  render()
  observer = new ResizeObserver(() => chart.value?.resize())
  observer.observe(chartEl.value)
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
    chart.value?.resize()
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
  border-radius: 8px;
}
</style>
