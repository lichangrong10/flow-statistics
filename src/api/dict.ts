import type { DictBundle } from '@/types'
import { AGE_OPTIONS, CHANNEL_META, INTEREST_OPTIONS } from '@/constants'

/** 后端未提供字典接口，使用与业务一致的内置字典 */
export function getDicts(): Promise<DictBundle> {
  const bundle: DictBundle = {
    version: 'v1',
    channels: (Object.keys(CHANNEL_META) as (keyof typeof CHANNEL_META)[]).map((code) => ({
      code,
      name: CHANNEL_META[code].label,
      color: CHANNEL_META[code].color,
      enabled: code !== 'baidu',
      bidType: 'cpm',
    })),
    ages: AGE_OPTIONS.map((item) => ({ code: item, name: item })),
    interests: INTEREST_OPTIONS.map((item) => ({ code: item, name: item })),
    platforms: [
      { code: 'douyin', name: '抖音' },
      { code: 'wechat', name: '微信' },
      { code: 'xiaohongshu', name: '小红书' },
      { code: 'kuaishou', name: '快手' },
      { code: 'baidu', name: '百度' },
      { code: 'other', name: '其他' },
    ],
    metrics: [
      { code: 'impressions', name: '曝光量', formula: '分日曝光量求和', decimals: 0, visible: true },
      { code: 'reach', name: '曝光人数', formula: '分日曝光人数求和（不去重）', decimals: 0, visible: true },
      { code: 'clicks', name: '点击人数', formula: '分日点击人数求和', decimals: 0, visible: true },
      { code: 'ctr', name: '点击率', formula: '点击人数 / 曝光人数', decimals: 2, visible: true },
      { code: 'cost', name: '消耗', formula: '分日消耗金额求和', decimals: 2, visible: true },
      { code: 'completion', name: '曝光完成率', formula: '实际曝光量 / 计划曝光量', decimals: 2, visible: true },
    ],
  }
  return Promise.resolve(bundle)
}
