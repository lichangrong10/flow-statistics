import { request } from './request'
import type { DashboardSummary, DimensionValue, DimType, PageResult, TrendPoint } from '@/types'
import {
  mapChannels,
  mapDimItems,
  mapSummary,
  mapTrend,
  type RealChannel,
  type RealDims,
  type RealSummary,
  type RealTrendPoint,
} from './real'

export interface RangeQuery {
  projectId?: number
  campaignId?: number
  from: string
  to: string
}

export async function getDashboardSummary(
  query: RangeQuery & { compare?: 'previous' },
): Promise<DashboardSummary> {
  const summary = await request<RealSummary>('GET', '/dashboard/summary', {
    params: {
      projectId: query.projectId ? String(query.projectId) : undefined,
      campaignId: query.campaignId ? String(query.campaignId) : undefined,
      from: query.from,
      to: query.to,
      compare: query.compare,
    },
  })
  return mapSummary(summary)
}

export async function getDashboardTrend(
  query: RangeQuery & { metric?: 'impressions' | 'clicks' },
): Promise<PageResult<TrendPoint>> {
  const points = await request<RealTrendPoint[]>('GET', '/dashboard/trend', {
    params: {
      projectId: query.projectId ? String(query.projectId) : undefined,
      campaignId: query.campaignId ? String(query.campaignId) : undefined,
      from: query.from,
      to: query.to,
    },
  })
  const items = mapTrend(points)
  return { items, total: items.length, page: 1, pageSize: items.length || 1 }
}

export async function getDashboardDimensions(
  query: RangeQuery & { dimType: DimType },
): Promise<PageResult<DimensionValue>> {
  if (query.dimType === 'channel') {
    const channels = await request<RealChannel[]>('GET', '/dashboard/channels', {
      params: {
        projectId: query.projectId ? String(query.projectId) : undefined,
        from: query.from,
        to: query.to,
      },
    })
    const items = mapChannels(channels)
    return { items, total: items.length, page: 1, pageSize: items.length || 1 }
  }
  const dims = await request<RealDims>('GET', '/dashboard/dimensions', {
    params: {
      type: query.dimType,
      projectId: query.projectId ? String(query.projectId) : undefined,
      from: query.from,
      to: query.to,
    },
  })
  const scoped = (dims.items ?? []).filter((item) => item.dimType === query.dimType)
  const mapped = mapDimItems(scoped)
  const items: DimensionValue[] = mapped.map((item) => ({
    dimKey: item.dimKey,
    dimName: item.dimName,
    value: item.impressions,
    ratio: item.ratio,
  }))
  return { items, total: items.length, page: 1, pageSize: items.length || 1 }
}
