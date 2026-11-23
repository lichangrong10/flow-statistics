import { request } from './request'
import type {
  CampaignDetail,
  CampaignDraftPayload,
  CampaignListItem,
  CampaignListQuery,
  PageResult,
} from '@/types'
import { CHANNEL_META } from '@/constants'
import { mapCampaignDetail, mapCampaignListItem, type RealCampaign } from './real'

interface RealPage<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

function toCreateBody(
  payload: CampaignDraftPayload,
  channel: CampaignDraftPayload['channels'][number],
  name: string,
) {
  return {
    projectId: String(payload.projectId),
    name,
    channel,
    objective: payload.goal,
    budget: Number(payload.totalBudget),
    targetImpressions: Number(payload.targetImpressions),
    startDate: payload.startDate,
    endDate: payload.endDate,
    targeting: payload.targeting,
    remark: payload.remark || undefined,
    vendorIds: payload.vendorIds.map((id) => String(id)),
  }
}

export async function getCampaigns(
  query: CampaignListQuery,
): Promise<PageResult<CampaignListItem>> {
  const result = await request<RealPage<RealCampaign>>('GET', '/campaigns', {
    params: {
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
      keyword: query.keyword || undefined,
      code: query.code || undefined,
      status: query.status || undefined,
      projectId: query.projectId ? String(query.projectId) : undefined,
      channel: query.channel?.length ? query.channel.join(',') : undefined,
      from: query.dateFrom || undefined,
      to: query.dateTo || undefined,
    },
  })
  return {
    items: result.items.map(mapCampaignListItem),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
  }
}

export async function getCampaign(id: number | string): Promise<CampaignDetail> {
  const campaign = await request<RealCampaign>('GET', `/campaigns/${id}`)
  return mapCampaignDetail(campaign)
}

export async function createCampaign(
  payload: CampaignDraftPayload,
): Promise<{ ids: number[]; codes: (string | null)[] }> {
  const ids: number[] = []
  const codes: (string | null)[] = []
  const channels = payload.channels?.length ? payload.channels : []
  for (const channel of channels) {
    const name =
      channels.length > 1
        ? `${payload.name}（${CHANNEL_META[channel]?.label ?? channel}）`.slice(0, 40)
        : payload.name
    const created = await request<{ id: string; code?: string | null }>('POST', '/campaigns', {
      data: toCreateBody(payload, channel, name),
    })
    ids.push(Number(created.id))
    codes.push(created.code ?? null)
    if (payload.publishMode === 'draft') continue
    await request('POST', `/campaigns/${created.id}/submit`)
    if (payload.publishMode === 'publish') {
      await request('POST', `/campaigns/${created.id}/approve`, {
        data: { comment: '创建后直接发布' },
      })
      const published = await request<{ code?: string | null }>(
        'POST',
        `/campaigns/${created.id}/publish`,
        { data: { publishMode: 'schedule', comment: '创建后直接发布' } },
      )
      codes[ids.length - 1] = published?.code ?? codes[ids.length - 1]
    }
  }
  return { ids, codes }
}

export async function updateCampaign(
  id: number | string,
  payload: Partial<CampaignDraftPayload>,
): Promise<CampaignDetail> {
  const channel = payload.channels?.[0]
  const body = {
    name: payload.name,
    channel,
    objective: payload.goal,
    budget: payload.totalBudget !== undefined ? Number(payload.totalBudget) : undefined,
    targetImpressions:
      payload.targetImpressions !== undefined ? Number(payload.targetImpressions) : undefined,
    startDate: payload.startDate,
    endDate: payload.endDate,
    targeting: payload.targeting,
    remark: payload.remark,
    vendorIds: payload.vendorIds?.map((item) => String(item)),
  }
  const updated = await request<RealCampaign>('PUT', `/campaigns/${id}`, {
    data: Object.fromEntries(Object.entries(body).filter(([, value]) => value !== undefined)),
  })
  return mapCampaignDetail(updated)
}

export function deleteCampaign(id: number | string): Promise<{ id: number }> {
  return request<{ id: number }>('DELETE', `/campaigns/${id}`)
}

export function submitCampaign(id: number | string): Promise<{ id: number; status: string }> {
  return request('POST', `/campaigns/${id}/submit`)
}

export function approveCampaign(
  id: number | string,
  comment?: string,
): Promise<{ id: number; status: string }> {
  return request('POST', `/campaigns/${id}/approve`, { data: { comment } })
}

export function rejectCampaign(
  id: number | string,
  reason: string,
): Promise<{ id: number; status: string }> {
  return request('POST', `/campaigns/${id}/reject`, { data: { comment: reason } })
}

export function withdrawCampaign(
  id: number | string,
  comment?: string,
): Promise<{ id: number; status: string }> {
  return request('POST', `/campaigns/${id}/withdraw`, { data: { comment } })
}

export function publishCampaign(
  id: number | string,
  payload: { publishMode?: 'schedule' | 'now'; comment?: string } = {},
): Promise<{ id: number; code: string; status: string; publishedAt: string }> {
  return request('POST', `/campaigns/${id}/publish`, {
    data: {
      publishMode: payload.publishMode === 'now' ? 'immediate' : 'schedule',
      comment: payload.comment,
    },
  })
}

export function pauseCampaign(
  id: number | string,
  reason?: string,
): Promise<{ id: number; status: string }> {
  return request('POST', `/campaigns/${id}/pause`, { data: { comment: reason } })
}

export function resumeCampaign(id: number | string): Promise<{ id: number; status: string }> {
  return request('POST', `/campaigns/${id}/resume`)
}

export function finishCampaign(id: number | string): Promise<{ id: number; status: string }> {
  return request('POST', `/campaigns/${id}/finish`)
}

export function closeCampaign(
  id: number | string,
): Promise<{ id: number; status: string; reportNo: string; closedAt: string }> {
  return request('POST', `/campaigns/${id}/close`)
}

export async function setCampaignVendors(
  id: number | string,
  vendorIds: number[],
): Promise<CampaignDetail> {
  await request('PUT', `/campaigns/${id}/vendors`, {
    data: { vendorIds: vendorIds.map((item) => String(item)) },
  })
  return getCampaign(id)
}
