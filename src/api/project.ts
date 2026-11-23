import { request } from './request'
import type { PageResult, Project } from '@/types'
import { mapProject, type RealProject } from './real'

export async function getProjects(): Promise<PageResult<Project>> {
  const projects = await request<RealProject[]>('GET', '/projects')
  const items = projects.map((project) => mapProject(project))
  return { items, total: items.length, page: 1, pageSize: items.length || 1 }
}
