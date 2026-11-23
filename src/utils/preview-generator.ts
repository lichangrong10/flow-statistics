import type { MockCurve } from '@/types'
import { eachDate, isWeekend } from '@/utils/date'

/** 固定种子伪随机数（与后端实现一致，保证结果可复现） */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return function () {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 按投放曲线生成每日权重（已归一化） */
export function buildWeights(dates: string[], curve: MockCurve, rand: () => number): number[] {
  const n = dates.length
  const raw = dates.map((date, index) => {
    switch (curve) {
      case 'front_load':
        return 1 + index / Math.max(1, n - 1)
      case 'back_load':
        return 1 + (n - 1 - index) / Math.max(1, n - 1)
      case 'weekend':
        return isWeekend(date) ? 1.3 : 1
      default:
        return 1 + (rand() - 0.5) * 0.06
    }
  })
  const total = raw.reduce((sum, item) => sum + item, 0) || 1
  return raw.map((item) => item / total)
}

export interface GeneratorInput {
  start: string
  end: string
  totalImpressions: number
  curve: MockCurve
  ctr: number
  cpm: number
  frequency: number
  seed: number
  /** 用于对齐验收材料的强制合计（可选） */
  reachTotal?: number
  clicksTotal?: number
}

export interface GeneratedDay {
  statDate: string
  impressions: number
  reach: number
  clicks: number
  cost: number
}

/**
 * 按排期逐日生成：目标总曝光按权重分摊并叠加 ≤15% 波动；
 * 再按频次折曝光人数、按点击率折点击人数、按千人成本折消耗。
 */
export function generateSeries(input: GeneratorInput): GeneratedDay[] {
  const dates = eachDate(input.start, input.end)
  if (!dates.length) return []
  const rand = mulberry32(input.seed)
  const weights = buildWeights(dates, input.curve, rand)

  const impressions = dates.map((_, index) =>
    Math.max(1, Math.round(input.totalImpressions * weights[index] * (1 + (rand() * 2 - 1) * 0.15))),
  )
  fixSum(impressions, input.totalImpressions)

  const reach = impressions.map((value) => Math.max(1, Math.round(value / input.frequency)))
  if (input.reachTotal) fixSum(reach, input.reachTotal)

  const clicks = reach.map((value) => Math.max(0, Math.round(value * input.ctr)))
  if (input.clicksTotal) fixSum(clicks, input.clicksTotal, 0)

  return dates.map((statDate, index) => ({
    statDate,
    impressions: impressions[index],
    reach: reach[index],
    clicks: clicks[index],
    cost: Math.round((impressions[index] / 1000) * input.cpm * 100) / 100,
  }))
}

/** 把数组之和强制调整为 target（差额补在最后一天，并保证非负） */
export function fixSum(values: number[], target: number, min = 1): void {
  if (!values.length) return
  let delta = target - values.reduce((sum, item) => sum + item, 0)
  let guard = 0
  let index = values.length - 1
  while (delta !== 0 && guard < values.length * 4) {
    const candidate = values[index] + delta
    if (candidate >= min) {
      values[index] = candidate
      delta = 0
      break
    }
    delta -= min - values[index]
    values[index] = min
    index = (index - 1 + values.length) % values.length
    guard += 1
  }
}

export interface DimRatio {
  key: string
  name: string
  ratio: number
}

/** 最大余数法拆分，保证各项合计严格等于 total */
export function splitByRatio(
  total: number,
  ratios: DimRatio[],
): { key: string; name: string; value: number }[] {
  const sum = ratios.reduce((acc, item) => acc + item.ratio, 0) || 1
  const normalized = ratios.map((item) => ({ ...item, ratio: item.ratio / sum }))
  const raw = normalized.map((item) => total * item.ratio)
  const floored = raw.map((value) => Math.floor(value))
  let remainder = total - floored.reduce((acc, value) => acc + value, 0)
  const order = raw
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction)
  for (let i = 0; i < order.length && remainder > 0; i += 1) {
    floored[order[i].index] += 1
    remainder -= 1
  }
  return normalized.map((item, index) => ({
    key: item.key,
    name: item.name,
    value: floored[index],
  }))
}

export const DEFAULT_REGION_WEIGHTS: DimRatio[] = [
  { key: 'jiangsu', name: '江苏省', ratio: 0.32 },
  { key: 'shanghai', name: '上海市', ratio: 0.11 },
  { key: 'zhejiang', name: '浙江省', ratio: 0.1 },
  { key: 'guangdong', name: '广东省', ratio: 0.09 },
  { key: 'anhui', name: '安徽省', ratio: 0.07 },
  { key: 'shandong', name: '山东省', ratio: 0.06 },
  { key: 'beijing', name: '北京市', ratio: 0.05 },
  { key: 'sichuan', name: '四川省', ratio: 0.045 },
  { key: 'hubei', name: '湖北省', ratio: 0.035 },
  { key: 'henan', name: '河南省', ratio: 0.03 },
  { key: 'fujian', name: '福建省', ratio: 0.025 },
  { key: 'other', name: '其他', ratio: 0.065 },
]

export const DEFAULT_GENDER_WEIGHTS: DimRatio[] = [
  { key: 'male', name: '男', ratio: 0.46 },
  { key: 'female', name: '女', ratio: 0.48 },
  { key: 'unknown', name: '未知', ratio: 0.06 },
]

export const DEFAULT_AGE_WEIGHTS: DimRatio[] = [
  { key: '18-24', name: '18-24 岁', ratio: 0.18 },
  { key: '25-29', name: '25-29 岁', ratio: 0.24 },
  { key: '30-39', name: '30-39 岁', ratio: 0.28 },
  { key: '40-49', name: '40-49 岁', ratio: 0.18 },
  { key: '50+', name: '50 岁以上', ratio: 0.12 },
]
