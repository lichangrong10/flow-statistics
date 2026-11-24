import { defineStore } from 'pinia'
import {
  getProfile,
  login as loginApi,
  logout as logoutApi,
  refreshToken as refreshTokenApi,
} from '@/api/auth'
import type { UserProfile } from '@/types'
import { clearToken, getToken, setToken, tokenExpiresAt } from '@/utils/auth'

let refreshTimer: number | null = null

function clearRefreshTimer(): void {
  if (refreshTimer !== null) {
    window.clearTimeout(refreshTimer)
    refreshTimer = null
  }
}

export const useUserStore = defineStore('user', {
  state: () => ({
    token: getToken() as string | null,
    profile: null as UserProfile | null,
    loading: false,
  }),
  getters: {
    isLoggedIn: (state) => Boolean(state.token),
    isAdmin: (state) => state.profile?.role === 'admin',
    displayName: (state) => state.profile?.displayName ?? '',
  },
  actions: {
    hasPerm(code: string): boolean {
      if (!this.profile) return false
      if (this.profile.role === 'admin') return true
      return this.profile.permissions.includes(code)
    },
    async login(username: string, password: string) {
      this.loading = true
      try {
        const result = await loginApi({ username, password })
        setToken(result.token)
        this.token = result.token
        this.profile = result.user
        this.scheduleRefresh(result.expiresIn)
        return result
      } finally {
        this.loading = false
      }
    },
    async fetchProfile() {
      if (!this.token) return null
      try {
        this.profile = await getProfile()
        this.scheduleRefresh()
        return this.profile
      } catch (error) {
        this.reset()
        throw error
      }
    },
    async logout() {
      try {
        await logoutApi()
      } catch {
        // 退出失败不影响本地清理
      }
      this.reset()
    },
    /** 到期前 5 分钟静默续期（后端 /auth/refresh） */
    scheduleRefresh(expiresIn?: number) {
      clearRefreshTimer()
      const token = this.token
      if (!token) return
      const expiresAt = tokenExpiresAt(token)
      const fallbackDelay = expiresIn ? Math.max(30_000, (expiresIn - 300) * 1000) : 0
      if (!expiresAt && !fallbackDelay) return
      const delay = expiresAt
        ? Math.max(30_000, expiresAt - Date.now() - 5 * 60_000)
        : fallbackDelay
      refreshTimer = window.setTimeout(async () => {
        try {
          const result = await refreshTokenApi()
          setToken(result.token)
          this.token = result.token
          this.scheduleRefresh(result.expiresIn)
        } catch {
          // 续期失败交给 401 统一处理
        }
      }, delay)
    },
    reset() {
      clearRefreshTimer()
      clearToken()
      this.token = null
      this.profile = null
    },
  },
})
