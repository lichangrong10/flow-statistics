import { request } from './request'
import type { PageResult, Project } from '@/types'
import { mapProject, type RealProject } from './real'

export interface ProjectPayload {
  name: string
  client: string
  startDate: string
  endDate: string
  budget: string
}

export async function getProjects(): Promise<PageResult<Project>> {
  const projects = await request<RealProject[]>('GET', '/projects')
  const items = projects.map((project) => mapProject(project))
  return { items, total: items.length, page: 1, pageSize: items.length || 1 }
}

export async function getProject(id: number | string): Promise<Project> {
  const project = await request<RealProject>('GET', `/projects/${id}`)
  return mapProject(project)
}

export async function createProject(payload: ProjectPayload): Promise<Project> {
  const project = await request<RealProject>('POST', '/projects', { data: payload })
  return mapProject(project)
}

export async function updateProject(id: number | string, payload: ProjectPayload): Promise<Project> {
  const project = await request<RealProject>('PUT', `/projects/${id}`, { data: payload })
  return mapProject(project)
}
