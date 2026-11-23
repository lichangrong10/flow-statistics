export interface ParsedStatRow {
  row: number
  code: string
  statDate: string
  impressions: number
  reach: number
  clicks: number
  cost: number
}

export interface RowIssue {
  row: number
  field: string
  message: string
}

const HEADER_ALIAS: Record<string, string[]> = {
  code: ['计划编号', '投放单号', '计划标识', '计划编码'],
  statDate: ['日期', '数据日期'],
  impressions: ['曝光量'],
  reach: ['曝光人数'],
  clicks: ['点击人数'],
  cost: ['消耗', '消耗金额'],
}

const MAX_SIZE = 10 * 1024 * 1024

/** 解析 xlsx / csv：前端只做格式与范围预校验，业务校验交后端 */
export async function parseStatsFile(
  file: File,
): Promise<{ rows: ParsedStatRow[]; issues: RowIssue[] }> {
  const lower = file.name.toLowerCase()
  if (!lower.endsWith('.xlsx') && !lower.endsWith('.csv')) {
    throw new Error('仅支持 xlsx 与 csv 格式，请重新选择')
  }
  if (file.size > MAX_SIZE) {
    throw new Error('文件大小不能超过 10MB，请拆分后重新上传')
  }

  const XLSX = await import('xlsx')
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) throw new Error('文件内容为空，请使用模板填写后上传')
  const sheet = workbook.Sheets[sheetName]
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: true,
    defval: '',
    blankrows: false,
  })
  if (!matrix.length) throw new Error('文件内容为空，请使用模板填写后上传')

  const header = (matrix[0] as unknown[]).map((cell) => String(cell ?? '').trim())
  const indexOf: Record<string, number> = {}
  for (const [field, aliases] of Object.entries(HEADER_ALIAS)) {
    const index = header.findIndex((cell) => aliases.includes(cell))
    if (index >= 0) indexOf[field] = index
  }
  const missing = ['code', 'statDate', 'impressions', 'reach', 'clicks', 'cost'].filter(
    (field) => indexOf[field] === undefined,
  )
  if (missing.length) {
    throw new Error('缺少必填列：计划编号、日期、曝光量、曝光人数、点击人数、消耗，请使用模板')
  }

  const rows: ParsedStatRow[] = []
  const issues: RowIssue[] = []

  for (let i = 1; i < matrix.length; i += 1) {
    const line = matrix[i] as unknown[]
    if (!line || line.every((cell) => String(cell ?? '').trim() === '')) continue
    const rowNo = i + 1
    const code = String(line[indexOf.code] ?? '').trim()
    const statDate = normalizeDate(line[indexOf.statDate])
    if (!code) {
      issues.push({ row: rowNo, field: 'code', message: '计划编号不能为空' })
      continue
    }
    if (!statDate) {
      issues.push({ row: rowNo, field: 'statDate', message: '日期格式应为 YYYY-MM-DD' })
      continue
    }
    const impressions = toNumber(line[indexOf.impressions])
    const reach = toNumber(line[indexOf.reach])
    const clicks = toNumber(line[indexOf.clicks])
    const cost = toNumber(line[indexOf.cost])
    if (impressions === null || impressions < 0) {
      issues.push({ row: rowNo, field: 'impressions', message: '曝光量需为非负整数' })
      continue
    }
    if (reach === null || reach < 0) {
      issues.push({ row: rowNo, field: 'reach', message: '曝光人数需为非负整数' })
      continue
    }
    if (clicks === null || clicks < 0) {
      issues.push({ row: rowNo, field: 'clicks', message: '点击人数需为非负整数' })
      continue
    }
    if (cost === null || cost < 0) {
      issues.push({ row: rowNo, field: 'cost', message: '消耗需为非负金额' })
      continue
    }
    if (reach > impressions) {
      issues.push({ row: rowNo, field: 'reach', message: '曝光人数不应大于曝光量' })
      continue
    }
    if (clicks > reach) {
      issues.push({ row: rowNo, field: 'clicks', message: '点击人数不应大于曝光人数' })
      continue
    }
    rows.push({ row: rowNo, code, statDate, impressions, reach, clicks, cost })
  }

  if (!rows.length && !issues.length) {
    throw new Error('未解析到有效数据行，请检查文件内容')
  }
  return { rows, issues }
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(String(value).replace(/,/g, '').trim())
  if (!Number.isFinite(parsed)) return null
  return parsed
}

function normalizeDate(value: unknown): string {
  if (value === null || value === undefined || value === '') return ''
  if (value instanceof Date) {
    const year = value.getFullYear()
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  if (typeof value === 'number') {
    // Excel 序列号日期
    const date = new Date(Math.round((value - 25569) * 86400 * 1000))
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  const text = String(value).trim().replace(/[/.]/g, '-')
  const matched = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text)
  if (!matched) return ''
  return `${matched[1]}-${matched[2].padStart(2, '0')}-${matched[3].padStart(2, '0')}`
}
