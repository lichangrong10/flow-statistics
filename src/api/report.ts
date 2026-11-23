import { request, requestBlob } from './request'
import type { PageResult, ReportTask, ReportType } from '@/types'
import { parseFileName, saveBlob } from '@/utils/download'
import { mapReportTask, type RealReport } from './real'

export interface CreateReportPayload {
  type: ReportType
  format: 'xlsx' | 'pdf'
  projectId?: number
  campaignIds?: number[]
  from: string
  to: string
}

const REPORT_TYPE_MAP: Record<string, string> = {
  final: 'campaign',
  daily: 'daily',
  weekly: 'weekly',
  detail: 'detail',
}

export async function createReportTask(
  payload: CreateReportPayload,
): Promise<{ taskId: string | number; status: string }> {
  const type = REPORT_TYPE_MAP[payload.type] ?? 'detail'
  const campaignIds = payload.campaignIds ?? []
  if (type === 'campaign' && campaignIds.length !== 1) {
    throw new Error('结案报告需要先选择一条投放计划')
  }
  const result = await request<{ id: string; status: string }>('POST', '/reports', {
    data: {
      type,
      format: payload.format,
      campaignId: type === 'campaign' ? String(campaignIds[0]) : undefined,
      campaignIds: type === 'campaign' ? undefined : campaignIds.map(String),
      from: payload.from,
      to: payload.to,
    },
  })
  return { taskId: result.id, status: result.status }
}

export async function getReportTasks(query: {
  page?: number
  pageSize?: number
}): Promise<PageResult<ReportTask>> {
  const result = await request<{
    items: RealReport[]
    total: number
    page: number
    pageSize: number
  }>('GET', '/reports', { params: query })
  return { ...result, items: result.items.map(mapReportTask) }
}

/** 下载报表：后端返回文件流 */
export async function downloadReport(task: ReportTask): Promise<void> {
  const { blob, fileName } = await requestBlob('GET', `/reports/${task.id}/download`)
  const fallback = parseFileName(fileName, `report-${task.id}.xlsx`)
  saveBlob(blob, task.fileName || fallback)
}
