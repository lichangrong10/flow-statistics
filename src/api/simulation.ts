import { request } from './request'
import type { AuditLog, MockProfile, PageResult } from '@/types'
import { mapLog, mapProfile, type RealLog, type RealProfile } from './real'

/* ------------------------------------------------------------------ */
/* 模拟参数与生成（后端内置模拟投流能力）                                 */
/* ------------------------------------------------------------------ */

function toRealDimRatio(
  profile: Partial<MockProfile>,
): Record<string, Record<string, number>> | undefined {
  const ratio = profile.dimRatio
  if (!ratio) return undefined
  const result: Record<string, Record<string, number>> = {}
  const convert = (list?: { key: string; name?: string; ratio: string }[]) => {
    if (!list?.length) return undefined
    return Object.fromEntries(list.map((item) => [item.name ?? item.key, Number(item.ratio)]))
  }
  const region = convert(ratio.region)
  const gender = convert(ratio.gender)
  const age = convert(ratio.age)
  if (region) result.region = region
  if (gender) result.gender = gender
  if (age) result.age = age
  return Object.keys(result).length ? result : undefined
}

export async function getMockProfile(campaignId: number | string): Promise<MockProfile> {
  const profile = await request<RealProfile>('GET', `/campaigns/${campaignId}/mock-profile`)
  return mapProfile(profile)
}

export async function saveMockProfile(
  campaignId: number | string,
  profile: Partial<MockProfile>,
): Promise<MockProfile> {
  const body = {
    totalImpressions: Number(profile.totalImpressions ?? 0),
    curveType: profile.curveType,
    ctr: Number(profile.ctr ?? 0.01),
    cpm: Number(profile.cpm ?? 12),
    frequency: Number(profile.frequency ?? 65),
    seed: Number(profile.seed ?? campaignId),
    dimRatio: toRealDimRatio(profile),
  }
  const result = await request<RealProfile | { saved?: boolean }>(
    'PUT',
    `/campaigns/${campaignId}/mock-profile`,
    { data: body },
  )
  if (result && 'campaignId' in result) {
    return mapProfile(result as RealProfile)
  }
  return {
    campaignId: Number(campaignId),
    totalImpressions: String(body.totalImpressions),
    curveType: body.curveType ?? 'uniform',
    ctr: body.ctr.toFixed(4),
    cpm: body.cpm.toFixed(2),
    frequency: body.frequency.toFixed(2),
    dimRatio: profile.dimRatio ?? {},
    seed: body.seed,
    updatedBy: null,
    updatedAt: null,
  }
}

export async function generateMockData(
  campaignId: number | string,
  payload: { params?: Partial<MockProfile>; from?: string; to?: string } = {},
): Promise<{ days: number; written: number }> {
  if (payload.params) {
    await saveMockProfile(campaignId, payload.params)
  }
  const result = await request<{ days?: number; written?: number }>(
    'POST',
    `/campaigns/${campaignId}/mock/generate`,
    { data: { from: payload.from || undefined, to: payload.to || undefined } },
  )
  const days = Number(result?.days ?? 0)
  return { days, written: Number(result?.written ?? days) }
}

/* ------------------------------------------------------------------ */
/* 审计日志                                                             */
/* ------------------------------------------------------------------ */

export async function getAuditLogs(query: {
  page?: number
  pageSize?: number
  objectType?: string
  objectId?: number | string
  action?: string
}): Promise<PageResult<AuditLog>> {
  const result = await request<{
    items: RealLog[]
    total: number
    page: number
    pageSize: number
  }>('GET', '/logs', {
    params: {
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
      objectType: query.objectType || undefined,
      objectId: query.objectId !== undefined ? String(query.objectId) : undefined,
      action: query.action || undefined,
    },
  })
  return { ...result, items: result.items.map(mapLog) }
}
