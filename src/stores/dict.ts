import { defineStore } from 'pinia'
import { getDicts } from '@/api/dict'
import type { DictBundle } from '@/types'

const CACHE_KEY = 'adflow.dict.v1'

function readCache(): DictBundle | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? (JSON.parse(raw) as DictBundle) : null
  } catch {
    return null
  }
}

export const useDictStore = defineStore('dict', {
  state: () => ({
    version: '',
    channels: [] as DictBundle['channels'],
    ages: [] as DictBundle['ages'],
    interests: [] as DictBundle['interests'],
    platforms: [] as DictBundle['platforms'],
    metrics: [] as DictBundle['metrics'],
    loaded: false,
    loading: false,
  }),
  getters: {
    enabledChannels: (state) => state.channels.filter((item) => item.enabled),
    channelMap: (state) =>
      Object.fromEntries(state.channels.map((item) => [item.code, item])),
  },
  actions: {
    async load(force = false) {
      if (this.loaded && !force) return
      if (this.loading) return
      const cached = readCache()
      if (cached && !this.loaded) {
        this.apply(cached)
      }
      this.loading = true
      try {
        const data = await getDicts()
        this.apply(data)
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(data))
        } catch {
          // 忽略配额异常
        }
      } finally {
        this.loading = false
      }
    },
    apply(data: DictBundle) {
      this.version = data.version
      this.channels = data.channels
      this.ages = data.ages
      this.interests = data.interests
      this.platforms = data.platforms
      this.metrics = data.metrics
      this.loaded = true
    },
  },
})
