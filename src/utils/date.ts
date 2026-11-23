import dayjs from 'dayjs'

export const DATE_FMT = 'YYYY-MM-DD'

export function today(): string {
  return dayjs().format(DATE_FMT)
}

export function addDays(date: string, days: number): string {
  return dayjs(date).add(days, 'day').format(DATE_FMT)
}

export function addMonths(date: string, months: number): string {
  return dayjs(date).add(months, 'month').format(DATE_FMT)
}

/** b - a 的天数差 */
export function daysBetween(a: string, b: string): number {
  return dayjs(b).diff(dayjs(a), 'day')
}

/** 含首尾的日期区间 */
export function eachDate(start: string, end: string): string[] {
  const result: string[] = []
  let cursor = dayjs(start)
  const last = dayjs(end)
  let guard = 0
  while ((cursor.isBefore(last) || cursor.isSame(last, 'day')) && guard < 400) {
    result.push(cursor.format(DATE_FMT))
    cursor = cursor.add(1, 'day')
    guard += 1
  }
  return result
}

export function isWeekend(date: string): boolean {
  const day = dayjs(date).day()
  return day === 0 || day === 6
}

export function clampRange(from: string, to: string): [string, string] {
  return dayjs(from).isAfter(dayjs(to)) ? [to, from] : [from, to]
}

export function dayIndex(start: string, current = today()): number {
  return dayjs(current).diff(dayjs(start), 'day') + 1
}

export function nowIso(): string {
  return dayjs().format('YYYY-MM-DDTHH:mm:ssZ')
}

export function nowText(): string {
  return dayjs().format('YYYY-MM-DD HH:mm')
}

export function isFuture(date: string): boolean {
  return dayjs(date).isAfter(dayjs(today()), 'day')
}

export function lastNDays(n: number, end = today()): { from: string; to: string } {
  return { from: dayjs(end).subtract(n - 1, 'day').format(DATE_FMT), to: end }
}

export function previousRange(from: string, to: string): { from: string; to: string } {
  const span = daysBetween(from, to) + 1
  return {
    from: dayjs(from).subtract(span, 'day').format(DATE_FMT),
    to: dayjs(from).subtract(1, 'day').format(DATE_FMT),
  }
}
