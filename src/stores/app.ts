import { defineStore } from 'pinia'
import { getProjects } from '@/api/project'
import type { Project } from '@/types'

const COLLAPSE_KEY = 'adflow.sidebar.collapsed'
const THEME_KEY = 'adflow.theme'

type Theme = 'light' | 'dark'

function resolveTheme(): Theme {
  const saved = localStorage.getItem(THEME_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const useAppStore = defineStore('app', {
  state: () => ({
    sidebarCollapsed: localStorage.getItem(COLLAPSE_KEY) === '1',
    theme: resolveTheme() as Theme,
    projects: [] as Project[],
    currentProjectId: null as number | null,
    projectLoading: false,
  }),
  getters: {
    currentProject(state): Project | null {
      return state.projects.find((item) => item.id === state.currentProjectId) ?? null
    },
  },
  actions: {
    initTheme() {
      this.applyTheme()
      const media = window.matchMedia('(prefers-color-scheme: dark)')
      media.addEventListener('change', (event) => {
        if (localStorage.getItem(THEME_KEY)) return
        this.theme = event.matches ? 'dark' : 'light'
        this.applyTheme()
      })
    },
    applyTheme() {
      document.documentElement.dataset.theme = this.theme
    },
    toggleTheme() {
      this.theme = this.theme === 'dark' ? 'light' : 'dark'
      localStorage.setItem(THEME_KEY, this.theme)
      this.applyTheme()
    },
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
      localStorage.setItem(COLLAPSE_KEY, this.sidebarCollapsed ? '1' : '0')
    },
    async loadProjects() {
      if (this.projects.length) return
      this.projectLoading = true
      try {
        const result = await getProjects()
        this.projects = result.items
        if (this.currentProjectId === null && result.items.length) {
          this.currentProjectId = result.items[0].id
        }
      } finally {
        this.projectLoading = false
      }
    },
    setProject(id: number) {
      this.currentProjectId = id
    },
  },
})
