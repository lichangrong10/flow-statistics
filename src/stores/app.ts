import { defineStore } from 'pinia'
import { getProjects } from '@/api/project'
import type { Project } from '@/types'

const COLLAPSE_KEY = 'adflow.sidebar.collapsed'

export const useAppStore = defineStore('app', {
  state: () => ({
    sidebarCollapsed: localStorage.getItem(COLLAPSE_KEY) === '1',
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
