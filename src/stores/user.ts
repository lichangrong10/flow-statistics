import { defineStore } from 'pinia'
import { getProfile, login as loginApi, logout as logoutApi } from '@/api/auth'
import type { UserProfile } from '@/types'
import { clearToken, getToken, setToken } from '@/utils/auth'

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
    roleLabel: (state) => (state.profile?.role === 'admin' ? '管理员' : '普通用户'),
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
        return result
      } finally {
        this.loading = false
      }
    },
    async fetchProfile() {
      if (!this.token) return null
      try {
        this.profile = await getProfile()
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
    reset() {
      clearToken()
      this.token = null
      this.profile = null
    },
  },
})
