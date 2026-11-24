import type { EChartsOption } from 'echarts'
import { useAppStore } from '@/stores/app'

/** 运行时读取设计令牌，支持明暗主题切换 */
export function cssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

export interface ChartColors {
  ink: string
  axis: string
  grid: string
  muted: string
  surface: string
  border: string
  palette: string[]
}

export function chartColors(): ChartColors {
  try {
    // 读取当前主题，使图表配置随明暗切换重算
    void useAppStore().theme
  } catch {
    // Pinia 尚未初始化时忽略
  }
  const palette = [
    cssVar('--chart-1', '#111110'),
    cssVar('--chart-2', '#2f5d8a'),
    cssVar('--chart-3', '#2f7d4f'),
    cssVar('--chart-4', '#b7791f'),
    cssVar('--chart-5', '#c0392b'),
    cssVar('--chart-6', '#a8a298'),
  ]
  return {
    ink: cssVar('--chart-ink', '#111110'),
    axis: cssVar('--chart-axis', '#67635b'),
    grid: cssVar('--chart-grid', '#e9e6df'),
    muted: cssVar('--chart-muted', '#a8a298'),
    surface: cssVar('--color-surface', '#ffffff'),
    border: cssVar('--color-border-light', '#e9e6df'),
    palette,
  }
}

/** 兼容旧代码的静态兜底色（优先使用 chartColors） */
export const PALETTE = ['#111110', '#2f5d8a', '#2f7d4f', '#b7791f', '#c0392b', '#a8a298']

const tooltipBase = () => {
  const colors = chartColors()
  return {
    trigger: 'axis' as const,
    axisPointer: {
      type: 'line' as const,
      lineStyle: { color: colors.muted, type: [4, 4] as [number, number], width: 1 },
    },
  }
}

export interface LineSeriesInput {
  name: string
  data: (number | null)[]
  color?: string
  area?: boolean
  dashed?: boolean
}

export function lineOption(xData: string[], series: LineSeriesInput[], unit = ''): EChartsOption {
  const colors = chartColors()
  return {
    textStyle: { fontFamily: cssVar('--font-sans', 'sans-serif'), color: colors.axis },
    tooltip: {
      ...tooltipBase(),
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      textStyle: { color: colors.ink, fontSize: 12 },
      extraCssText: 'border-radius:2px;box-shadow:none;',
      valueFormatter: (value: unknown) => `${group(value as number)}${unit ? ` ${unit}` : ''}`,
    },
    legend: {
      show: series.length > 1,
      bottom: 0,
      icon: 'rect',
      itemWidth: 8,
      itemHeight: 8,
      itemGap: 16,
      textStyle: { color: colors.axis, fontSize: 11 },
    },
    grid: {
      left: 4,
      right: 28,
      top: 26,
      bottom: series.length > 1 ? 36 : 12,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: xData,
      boundaryGap: false,
      axisLabel: { hideOverlap: true, color: colors.axis, fontSize: 11 },
      axisLine: { lineStyle: { color: colors.grid } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      name: unit,
      nameTextStyle: { color: colors.muted, fontSize: 11, padding: [0, 0, 0, 4] },
      splitNumber: 4,
      axisLabel: { color: colors.axis, fontSize: 11 },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: colors.grid, type: 'solid', width: 1 } },
    },
    series: series.map((item, index) => {
      const color = item.color || colors.palette[index] || colors.ink
      return {
        name: item.name,
        type: 'line' as const,
        data: item.data,
        smooth: false,
        symbol: 'none',
        symbolSize: 6,
        showSymbol: false,
        lineStyle: {
          width: index === 0 ? 2 : 1.4,
          color,
          type: item.dashed ? ([4, 4] as [number, number]) : 'solid',
        },
        itemStyle: { color },
        emphasis: { focus: 'series' as const },
        areaStyle: item.area ? { opacity: 0.08, color } : undefined,
      }
    }),
  }
}

export function barOption(
  xData: string[],
  series: { name: string; data: number[]; color?: string }[],
  unit = '',
): EChartsOption {
  const colors = chartColors()
  return {
    textStyle: { fontFamily: cssVar('--font-sans', 'sans-serif'), color: colors.axis },
    tooltip: {
      ...tooltipBase(),
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      textStyle: { color: colors.ink, fontSize: 12 },
      extraCssText: 'border-radius:2px;box-shadow:none;',
      valueFormatter: (value: unknown) => `${group(value as number)}${unit ? ` ${unit}` : ''}`,
    },
    legend: {
      show: series.length > 1,
      bottom: 0,
      icon: 'rect',
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { color: colors.axis, fontSize: 11 },
    },
    grid: {
      left: 4,
      right: 28,
      top: 26,
      bottom: series.length > 1 ? 36 : 12,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: xData,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: colors.grid } },
      axisLabel: { color: colors.axis, fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      name: unit,
      nameTextStyle: { color: colors.muted, fontSize: 11 },
      axisLabel: { color: colors.axis, fontSize: 11 },
      splitLine: { lineStyle: { color: colors.grid } },
    },
    series: series.map((item, index) => ({
      name: item.name,
      type: 'bar' as const,
      data: item.data,
      barWidth: series.length > 1 ? 14 : 22,
      itemStyle: {
        color: item.color || colors.palette[index] || colors.ink,
        borderRadius: 0,
      },
      emphasis: { focus: 'series' as const },
    })),
  }
}

export function hbarOption(
  items: { name: string; value: number }[],
  unit = '',
  color?: string,
): EChartsOption {
  const colors = chartColors()
  const sorted = [...items].sort((a, b) => a.value - b.value)
  return {
    textStyle: { fontFamily: cssVar('--font-sans', 'sans-serif'), color: colors.axis },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' } as never,
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      textStyle: { color: colors.ink, fontSize: 12 },
      extraCssText: 'border-radius:2px;box-shadow:none;',
      valueFormatter: (value: unknown) => `${group(value as number)}${unit ? ` ${unit}` : ''}`,
    },
    grid: { left: 4, right: 72, top: 10, bottom: 8, containLabel: true },
    xAxis: {
      type: 'value',
      splitNumber: 3,
      axisLabel: { show: false },
      splitLine: { show: false },
      axisLine: { show: false },
    },
    yAxis: {
      type: 'category',
      data: sorted.map((item) => item.name),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: colors.axis, fontSize: 11 },
    },
    series: [
      {
        type: 'bar' as const,
        data: sorted.map((item) => item.value),
        barWidth: 10,
        itemStyle: { color: color || colors.ink, borderRadius: 0 },
        label: {
          show: true,
          position: 'right' as const,
          color: colors.axis,
          fontSize: 11,
          formatter: (params: { value?: unknown }) => group(Number(params.value) || 0),
        },
      },
    ],
  }
}

export function donutOption(
  items: { name: string; value: number; color?: string }[],
  options: { unit?: string; centerLabel?: string; centerValue?: string } = {},
): EChartsOption {
  const colors = chartColors()
  const total = items.reduce((sum, item) => sum + item.value, 0)
  return {
    textStyle: { fontFamily: cssVar('--font-sans', 'sans-serif'), color: colors.axis },
    tooltip: {
      trigger: 'item',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      textStyle: { color: colors.ink, fontSize: 12 },
      extraCssText: 'border-radius:2px;box-shadow:none;',
      valueFormatter: (value: unknown) =>
        `${group(value as number)}${options.unit ? ` ${options.unit}` : ''}`,
    },
    legend: {
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      top: 'auto',
      icon: 'rect',
      itemWidth: 7,
      itemHeight: 7,
      itemGap: 12,
      textStyle: { color: colors.axis, fontSize: 11 },
      formatter: (name: string) => {
        const item = items.find((it) => it.name === name)
        if (!item) return name
        const ratio = total ? ((item.value / total) * 100).toFixed(1) : '0.0'
        return `${name}  ${ratio}%`
      },
    },
    series: [
      {
        type: 'pie',
        radius: ['34%', '54%'],
        center: ['50%', '40%'],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: colors.surface, borderWidth: 1 },
        label: { show: false },
        labelLine: { show: false },
        data: items.map((item, index) => ({
          name: item.name,
          value: item.value,
          itemStyle: { color: item.color || colors.palette[index] || colors.ink },
        })),
      },
    ],
    graphic: (options.centerValue
      ? [
          {
            type: 'text',
            left: 'center',
            top: '28%',
            style: {
              text: options.centerValue,
              textAlign: 'center',
              fill: colors.ink,
              font: '600 15px ' + cssVar('--font-sans', 'sans-serif'),
            },
          },
          {
            type: 'text',
            left: 'center',
            top: '39%',
            style: {
              text: options.centerLabel || '',
              textAlign: 'center',
              fill: colors.muted,
              fontSize: 11,
            },
          },
        ]
      : undefined) as never,
  }
}

function group(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}
