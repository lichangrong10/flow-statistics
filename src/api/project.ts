import { request } from './request'
import type { PageResult, Project } from '@/types'
import { mapProject, type RealCampaign, type RealProject } from './real'

export async function getProjects(): Promise<PageResult<Project>> {
  const [projects, campaigns] = await Promise.all([
    request<RealProject[]>('GET', '/projects'),
    request<{ items: RealCampaign[] }>('GET', '/campaigns', {
      params: { page: 1, pageSize: 200 },
    }),
  ])
  const items = projects.map((project) => {
    const used = campaigns.items
      .filter((campaign) => String(campaign.projectId) === String(project.id))
      .reduce((sum, campaign) => sum + Number(campaign.budget || 0), 0)
    return mapProject(project, used)
  })
  return { items, total: items.length, page: 1, pageSize: items.length || 1 }
}
