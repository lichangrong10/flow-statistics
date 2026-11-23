import { request } from './request'
import type { ChannelCode, DictBundle } from '@/types'
import { AGE_OPTIONS, CHANNEL_META, INTEREST_OPTIONS } from '@/constants'

interface RealDict {
  version?: string
  channels?: { code: string; name: string; enabled?: boolean; bidType?: 'cpm' | 'cpc' }[]
  ages?: { code: string; name: string }[]
  interests?: { code: string; name: string }[]
  metrics?: { code: string; name: string; formula?: string; decimals?: number; visible?: boolean }[]
}

const PLATFORMS = [
  { code: 'douyin', name: '抖音' },
  { code: 'wechat', name: '微信' },
  { code: 'xiaohongshu', name: '小红书' },
  { code: 'kuaishou', name: '快手' },
  { code: 'baidu', name: '百度' },
  { code: 'other', name: '其他' },
]

const DEFAULT_METRICS: DictBundle['metrics'] = [
  { code: 'impressions', name: '曝光量', formula: '分日曝光量求和', decimals: 0, visible: true },
  { code: 'reach', name: '曝光人数', formula: '分日曝光人数求和（不去重）', decimals: 0, visible: true },
  { code: 'clicks', name: '点击人数', formula: '分日点击人数求和', decimals: 0, visible: true },
  { code: 'ctr', name: '点击率', formula: '点击人数 / 曝光人数', decimals: 2, visible: true },
  { code: 'cost', name: '消耗', formula: '分日消耗金额求和', decimals: 2, visible: true },
  { code: 'completion', name: '曝光完成率', formula: '实际曝光量 / 计划曝光量', decimals: 2, visible: true },
]

function fallbackBundle(): DictBundle {
  return {
    version: 'local',
    channels: (Object.keys(CHANNEL_META) as ChannelCode[]).map((code) => ({
      code,
      name: CHANNEL_META[code].label,
      color: CHANNEL_META[code].color,
      enabled: code !== 'baidu',
      bidType: 'cpm' as const,
    })),
    ages: AGE_OPTIONS.map((item) => ({ code: item, name: item })),
    interests: INTEREST_OPTIONS.map((item) => ({ code: item, name: item })),
    platforms: PLATFORMS,
    metrics: DEFAULT_METRICS,
  }
}

/** 字典接口（后端 /dicts），失败时退回内置字典，保证页面可用 */
export async function getDicts(): Promise<DictBundle> {
  try {
    const raw = await request<RealDict>('GET', '/dicts')
    const channels = (raw.channels ?? []).map((item) => {
      const code = item.code as ChannelCode
      return {
        code,
        name: item.name,
        color: CHANNEL_META[code]?.color ?? 'var(--color-primary)',
        enabled: item.enabled ?? true,
        bidType: item.bidType ?? 'cpm',
      }
    })
    const bundle: DictBundle = {
      version: raw.version ?? 'v1',
      channels: channels.length ? channels : fallbackBundle().channels,
      ages: raw.ages?.length ? raw.ages : fallbackBundle().ages,
      interests: raw.interests?.length ? raw.interests : fallbackBundle().interests,
      platforms: PLATFORMS,
      metrics: raw.metrics?.length
        ? raw.metrics.map((item) => ({
            code: item.code,
            name: item.name,
            formula: item.formula ?? '',
            decimals: item.decimals ?? 0,
            visible: item.visible ?? true,
          }))
        : DEFAULT_METRICS,
    }
    return bundle
  } catch {
    return fallbackBundle()
  }
}
