import { request } from './request'
import type { PageResult, Vendor } from '@/types'
import { mapVendor, type RealVendor } from './real'

export async function getVendors(query: {
  page?: number
  pageSize?: number
  keyword?: string
  enabledOnly?: boolean
  status?: 0 | 1
}): Promise<PageResult<Vendor>> {
  if (query.enabledOnly) {
    const list = await request<RealVendor[]>('GET', '/vendors/active')
    const items = list.map(mapVendor)
    return { items, total: items.length, page: 1, pageSize: items.length || 1 }
  }
  const result = await request<{
    items: RealVendor[]
    total: number
    page: number
    pageSize: number
  }>('GET', '/vendors', {
    params: {
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 100,
      keyword: query.keyword || undefined,
      status: query.status,
    },
  })
  return { ...result, items: result.items.map(mapVendor) }
}
