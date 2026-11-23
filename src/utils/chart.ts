import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

/** 序列色：深蓝、青、金、灰蓝、赭石、中性灰（方案 §8.5） */
export const PALETTE = ['#17416B', '#2E9C9A', '#C9A227', '#6B7C93', '#A0704A', '#8A94A6']

export const COLOR = {
  primary: '#17416B',
  accent: '#2E6DA4',
  success: '#1F8A5B',
  warning: '#C77C0E',
  danger: '#B4372F',
  text: '#1F2329',
  textSecondary: '#5B6673',
  border: '#E4EAF1',
  split: '#EFF3F8',
  bg: '#F5F7FA',
}

const THEME = 'adflow'

let registered = false

export function ensureChartTheme(): void {
  if (registered) return
  registered = true
  echarts.registerTheme(THEME, {
    color: PALETTE,
    backgroundColor: 'transparent',
    textStyle: {
      fontFamily:
        '"PingFang SC", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      color: COLOR.textSecondary,
    },
    title: { textStyle: { color: COLOR.text, fontWeight: 600, fontSize: 14 } },
    legend: {
      textStyle: { color: COLOR.textSecondary, fontSize: 12 },
      itemWidth: 8,
      itemHeight: 8,
      itemGap: 16,
      bottom: 0,
    },
    grid: { left: 8, right: 12, top: 30, bottom: 28, containLabel: true },
    tooltip: {
      backgroundColor: '#FFFFFF',
      borderColor: COLOR.border,
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: COLOR.text, fontSize: 12 },
      extraCssText:
        'box-shadow: 0 8px 24px rgba(23, 65, 107, 0.12); border-radius: 8px;',
    },
    categoryAxis: {
      axisLine: { lineStyle: { color: COLOR.border } },
      axisTick: { show: false },
      axisLabel: { color: COLOR.textSecondary, fontSize: 12, margin: 12 },
      splitLine: { show: false },
    },
    valueAxis: {
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: COLOR.textSecondary, fontSize: 12 },
      splitLine: { lineStyle: { color: COLOR.split, type: [4, 4] } },
    },
  } as never)
}

export function useChartTheme(): string {
  ensureChartTheme()
  return THEME
}

const tooltipStyle = {
  trigger: 'axis' as const,
  axisPointer: {
    type: 'line' as const,
    lineStyle: { color: '#B9C6D2', type: [4, 4] as [number, number] },
  },
}

export interface LineSeriesInput {
  name: string
  data: number[]
  color?: string
  area?: boolean
  dashed?: boolean
}

export function lineOption(xData: string[], series: LineSeriesInput[], unit = ''): EChartsOption {
  return {
    tooltip: {
      ...tooltipStyle,
      valueFormatter: (value: unknown) =>
        `${group(value as number)}${unit ? ` ${unit}` : ''}`,
    },
    legend: { show: series.length > 1, bottom: 0, icon: 'roundRect' },
    grid: { left: 4, right: 28, top: 26, bottom: series.length > 1 ? 36 : 12, containLabel: true },
    xAxis: {
      type: 'category',
      data: xData,
      boundaryGap: false,
      axisLabel: { hideOverlap: true },
    },
    yAxis: {
      type: 'value',
      name: unit,
      nameTextStyle: { color: '#8A94A6', fontSize: 11, padding: [0, 0, 0, 4] },
      splitNumber: 4,
    },
    series: series.map((item, index) => ({
      name: item.name,
      type: 'line' as const,
      data: item.data,
      smooth: false,
      symbol: 'none',
      symbolSize: 6,
      showSymbol: false,
      lineStyle: {
        width: index === 0 ? 2.4 : 1.6,
        color: item.color || PALETTE[index],
        type: item.dashed ? ([5, 5] as [number, number]) : 'solid',
      },
      itemStyle: { color: item.color || PALETTE[index] },
      emphasis: { focus: 'series' as const },
      areaStyle: item.area
        ? {
            opacity: 1,
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(23, 65, 107, 0.14)' },
              { offset: 1, color: 'rgba(23, 65, 107, 0.01)' },
            ]),
          }
        : undefined,
    })),
  }
}

export function barOption(
  xData: string[],
  series: { name: string; data: number[]; color?: string }[],
  unit = '',
): EChartsOption {
  return {
    tooltip: {
      ...tooltipStyle,
      valueFormatter: (value: unknown) => `${group(value as number)}${unit ? ` ${unit}` : ''}`,
    },
    legend: { show: series.length > 1, bottom: 0, icon: 'roundRect' },
    grid: { left: 4, right: 28, top: 26, bottom: series.length > 1 ? 36 : 12, containLabel: true },
    xAxis: { type: 'category', data: xData, axisTick: { show: false } },
    yAxis: { type: 'value', name: unit, nameTextStyle: { color: '#8A94A6', fontSize: 11 } },
    series: series.map((item, index) => ({
      name: item.name,
      type: 'bar' as const,
      data: item.data,
      barWidth: series.length > 1 ? 14 : 22,
      itemStyle: {
        color: item.color || PALETTE[index],
        borderRadius: [4, 4, 0, 0],
      },
      emphasis: { focus: 'series' as const },
    })),
  }
}

export function hbarOption(
  items: { name: string; value: number }[],
  unit = '',
  color = PALETTE[0],
): EChartsOption {
  const sorted = [...items].sort((a, b) => a.value - b.value)
  return {
    tooltip: {
      ...tooltipStyle,
      axisPointer: { type: 'shadow' } as never,
      valueFormatter: (value: unknown) => `${group(value as number)}${unit ? ` ${unit}` : ''}`,
    },
    grid: { left: 4, right: 72, top: 10, bottom: 8, containLabel: true },
    xAxis: { type: 'value', splitNumber: 3, axisLabel: { show: false }, splitLine: { show: false } },
    yAxis: {
      type: 'category',
      data: sorted.map((item) => item.name),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: COLOR.textSecondary, fontSize: 12 },
    },
    series: [
      {
        type: 'bar' as const,
        data: sorted.map((item) => item.value),
        barWidth: 12,
        itemStyle: { color, borderRadius: [0, 6, 6, 0] },
        label: {
          show: true,
          position: 'right' as const,
          color: COLOR.textSecondary,
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
  const total = items.reduce((sum, item) => sum + item.value, 0)
  return {
    tooltip: {
      trigger: 'item',
      valueFormatter: (value: unknown) =>
        `${group(value as number)}${options.unit ? ` ${options.unit}` : ''}`,
    },
    legend: {
      orient: 'vertical',
      right: 0,
      top: 'center',
      bottom: 'auto',
      icon: 'circle',
      itemWidth: 7,
      itemHeight: 7,
      itemGap: 10,
      textStyle: { color: COLOR.textSecondary, fontSize: 11.5 },
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
        radius: ['52%', '72%'],
        center: ['31%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        labelLine: { show: false },
        data: items.map((item, index) => ({
          name: item.name,
          value: item.value,
          itemStyle: { color: item.color || PALETTE[index] },
        })),
      },
    ],
    graphic: (options.centerValue
      ? [
          {
            type: 'text',
            left: '31%',
            top: '43%',
            style: {
              text: options.centerValue,
              textAlign: 'center',
              fill: COLOR.text,
              fontSize: 18,
              fontWeight: 600,
            },
          },
          {
            type: 'text',
            left: '31%',
            top: '55%',
            style: {
              text: options.centerLabel || '',
              textAlign: 'center',
              fill: '#8A94A6',
              fontSize: 12,
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
