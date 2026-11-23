import { request, requestBlob } from './request'
import type { DailyStat, DimStat, DimType, PageResult, SyncTask } from '@/types'
import {
  mapDailyStats,
  mapDimItems,
  mapSyncTask,
  type RealDims,
  type RealStats,
  type RealSyncTask,
} from './real'
import { parseFileName, saveBlob } from '@/utils/download'

export interface SaveStatPayload {
  statDate: string
  impressions: number
  reach: number
  clicks: number
  cost: number
}

export interface AdjustStatPayload {
  impressions: number
  reach: number
  clicks: number
  cost: number
  reason: string
}

export interface ImportRow {
  code: string
  statDate: string
  impressions: number
  reach: number
  clicks: number
  cost: number
}

export interface ImportErrorItem {
  row: number
  field?: string
  code?: string
  message: string
}

export interface ImportResult {
  total: number
  importable: number
  invalid: number
  errors: ImportErrorItem[]
  imported?: number
}

export async function getCampaignStats(
  id: number | string,
  range: { from?: string; to?: string } = {},
): Promise<PageResult<DailyStat>> {
  const stats = await request<RealStats>('GET', `/campaigns/${id}/stats`, {
    params: { from: range.from, to: range.to },
  })
  const items = mapDailyStats(stats)
  return { items, total: items.length, page: 1, pageSize: items.length || 1 }
}

export async function saveCampaignStats(
  id: number | string,
  payload: SaveStatPayload,
): Promise<{ statDate: string; dimsValid: boolean }> {
  const result = await request<{ statDate?: string }>('POST', `/campaigns/${id}/stats`, {
    data: {
      statDate: payload.statDate,
      impressions: Math.round(payload.impressions),
      reach: Math.round(payload.reach),
      clicks: Math.round(payload.clicks),
      cost: payload.cost,
    },
  })
  return { statDate: result?.statDate ?? payload.statDate, dimsValid: true }
}

export function adjustCampaignStat(
  id: number | string,
  statDate: string,
  payload: AdjustStatPayload,
): Promise<{
  statDate: string
  completionRate: string | null
  clickRate: string | null
  updatedAt: string
}> {
  return request('PATCH', `/campaigns/${id}/stats/${statDate}`, { data: payload })
}

export async function getCampaignDimensions(
  id: number | string,
  dimType: DimType,
  range: { from?: string; to?: string } = {},
): Promise<PageResult<DimStat>> {
  const dims = await request<RealDims>('GET', `/campaigns/${id}/dimensions`, {
    params: { type: dimType, from: range.from, to: range.to },
  })
  const items = mapDimItems(dims.items ?? [])
  return { items, total: items.length, page: 1, pageSize: items.length || 1 }
}

export async function syncCampaign(
  id: number | string,
): Promise<{ syncTaskId: string | number; expectedSeconds: number }> {
  const result = await request<{ id?: string; syncTaskId?: string }>(
    'POST',
    `/campaigns/${id}/sync`,
  )
  return {
    syncTaskId: result?.syncTaskId ?? result?.id ?? `sync-${id}-${Date.now()}`,
    expectedSeconds: 2,
  }
}

export async function getSyncTasks(query: {
  page?: number
  pageSize?: number
}): Promise<PageResult<SyncTask>> {
  const result = await request<{
    items: RealSyncTask[]
    total: number
    page: number
    pageSize: number
  }>('GET', '/sync-tasks', { params: query })
  return { ...result, items: result.items.map((item) => mapSyncTask(item)) }
}

export async function importStats(file: File): Promise<ImportResult> {
  const form = new FormData()
  form.append('file', file)
  const result = await request<Record<string, unknown>>('POST', '/stats/import', {
    data: form,
  })
  const total = Number(result?.total ?? result?.rows ?? 0) || 0
  const imported = Number(result?.imported ?? result?.success ?? total) || total
  const invalid = Number(result?.invalid ?? result?.failed ?? 0) || 0
  const rawErrors = (result?.errors ?? result?.details ?? []) as Record<string, unknown>[]
  return {
    total,
    importable: imported,
    invalid,
    imported,
    errors: rawErrors.map((item) => ({
      row: Number(item.row ?? 0),
      field: String(item.field ?? ''),
      code: String(item.code ?? ''),
      message: String(item.message ?? ''),
    })),
  }
}

/** 下载导入模板（后端返回文件流） */
export async function downloadImportTemplate(): Promise<void> {
  const { blob, fileName } = await requestBlob('GET', '/stats/import/template')
  saveBlob(blob, parseFileName(fileName, '投流数据导入模板.xlsx'))
}
