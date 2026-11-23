import dayjs from 'dayjs'

const GROUP_RE = /\B(?=(\d{3})+(?!\d))/g

/** 千分位分组（字符串安全，避免大整数精度丢失） */
export function groupDigits(value: string | number): string {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  const negative = raw.startsWith('-')
  const body = negative ? raw.slice(1) : raw
  const [intPart, decPart] = body.split('.')
  const int = intPart.replace(GROUP_RE, ',')
  const sign = negative ? '-' : ''
  return decPart !== undefined ? `${sign}${int}.${decPart}` : `${sign}${int}`
}

/** 表格内数值：千分位、不缩写 */
export function formatNumber(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  return groupDigits(value)
}

/** 指标卡：超过一万缩写为万 / 亿，保留一位小数 */
export function abbrNumber(value: string | number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || value === '') return '—'
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  const abs = Math.abs(n)
  if (abs >= 1e8) return `${trimZero((n / 1e8).toFixed(digits))} 亿`
  if (abs >= 1e4) return `${trimZero((n / 1e4).toFixed(digits))} 万`
  return groupDigits(String(Math.round(n * 100) / 100))
}

function trimZero(text: string): string {
  return text.replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1')
}

/** 金额：¥ + 千分位 + 两位小数 */
export function formatAmount(
  value: string | number | null | undefined,
  options: { currency?: boolean; precision?: number } = {},
): string {
  if (value === null || value === undefined || value === '') return '—'
  const { currency = true, precision = 2 } = options
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  const fixed = n.toFixed(precision)
  return `${currency ? '¥' : ''}${groupDigits(fixed)}`
}

/** 比率（0–1）→ 百分比字符串，默认两位小数 */
export function formatPercent(
  value: string | number | null | undefined,
  digits = 2,
): string {
  if (value === null || value === undefined || value === '') return '—'
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return `${(n * 100).toFixed(digits)}%`
}

/** 收入/消耗类比率别名 */
export const formatRate = formatPercent

export function formatDate(value: string | number | Date | null | undefined): string {
  if (!value) return '—'
  return dayjs(value).format('YYYY-MM-DD')
}

export function formatDateTime(value: string | number | Date | null | undefined): string {
  if (!value) return '—'
  return dayjs(value).format('YYYY-MM-DD HH:mm')
}

export function formatShortDate(value: string | number | Date | null | undefined): string {
  if (!value) return '—'
  return dayjs(value).format('MM-DD')
}

export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '—'
  if (ms < 1000) return `${ms} 毫秒`
  const seconds = ms / 1000
  if (seconds < 60) return `${seconds.toFixed(1)} 秒`
  const minutes = Math.floor(seconds / 60)
  const rest = Math.round(seconds % 60)
  return `${minutes} 分 ${String(rest).padStart(2, '0')} 秒`
}

export function formatFileSize(size: number): string {
  if (!size) return '—'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

export function maskPhone(value: string | null | undefined): string {
  if (!value) return '—'
  const digits = value.replace(/\D/g, '')
  if (digits.length < 7) return value
  return `${digits.slice(0, 3)}****${digits.slice(-4)}`
}

/** 环比：返回 { ratio, direction }，无历史数据返回 null */
export function compareRatio(
  current: string | number | null | undefined,
  previous: string | number | null | undefined,
): { ratio: number; direction: 'up' | 'down' | 'flat' } | null {
  const cur = Number(current)
  const prev = Number(previous)
  if (!Number.isFinite(cur) || !Number.isFinite(prev) || prev === 0) return null
  const ratio = (cur - prev) / Math.abs(prev)
  return {
    ratio,
    direction: ratio > 0.0005 ? 'up' : ratio < -0.0005 ? 'down' : 'flat',
  }
}

export function toNumberString(value: string | number): string {
  const n = Number(value)
  if (!Number.isFinite(n)) return '0'
  return String(n)
}

export function formatSignedPercent(
  ratio: number | null,
  digits = 2,
): string {
  if (ratio === null || !Number.isFinite(ratio)) return '—'
  const sign = ratio > 0 ? '+' : ''
  return `${sign}${(ratio * 100).toFixed(digits)}%`
}
