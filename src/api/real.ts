import dayjs from 'dayjs'
import type {
  AuditLog,
  CampaignDetail,
  CampaignGoal,
  CampaignListItem,
  CampaignStatus,
  ChannelCode,
  DailyStat,
  DashboardSummary,
  DimensionValue,
  DimStat,
  DimType,
  MockProfile,
  Project,
  ReportTask,
  SyncTask,
  Targeting,
  TrendPoint,
  UserProfile,
  Vendor,
} from '@/types'
import { CHANNEL_META } from '@/constants'
import { dayIndex } from '@/utils/date'

/* ------------------------------------------------------------------ */
/* 真实后端 DTO（字段以 192.168.9.224:3000 实测为准）                    */
/* ------------------------------------------------------------------ */

export interface RealUser {
  id: string
  username: string
  displayName: string
  role: 'admin' | 'user'
  status?: number
  lastLoginAt?: string | null
}

export interface RealVendor {
  id: string
  code: string
  name: string
  platform: string
  contactName?: string | null
  contactPhone?: string | null
  status: 0 | 1
  remark?: string | null
  campaignCount?: number
}

export interface RealCampaign {
  id: string
  projectId: string
  projectName?: string
  code: string | null
  name: string
  channel: ChannelCode
  objective: CampaignGoal
  status: CampaignStatus
  budget: string
  targetImpressions: string
  startDate: string
  endDate: string
  targeting?: Partial<Targeting>
  remark?: string | null
  createdBy?: string
  publishedAt?: string | null
  createdAt?: string
  updatedAt?: string
  vendors?: RealVendor[]
  actualImpressions?: string | null
  actualReach?: string | null
  actualClicks?: string | null
  actualCost?: string | null
  completionRate?: number | null
}

export interface RealDailyRow {
  statDate: string
  impressions: string
  reach: string
  clicks: string
  cost: string
  source?: string
  updatedAt?: string | null
}

export interface RealStats {
  campaignId: string
  from: string
  to: string
  totals?: {
    impressions?: string
    reach?: string
    clicks?: string
    cost?: string
    completionRate?: number | null
    clickRate?: number | null
  }
  rows: RealDailyRow[]
}

export interface RealDimItem {
  dimType: DimType
  dimValue: string
  impressions: string
  reach?: string
  clicks?: string
}

export interface RealDims {
  campaignId?: string
  items: RealDimItem[]
  grouped?: Record<string, RealDimItem[]>
}

export interface RealSummary {
  targetImpressions: string
  impressions: string
  reach: string
  clicks: string
  cost: string
  runningCampaigns: number
  dataUpdatedAt: string | null
  completionRate: number | null
  clickRate: number | null
  cpm: number | null
}

export interface RealTrendPoint {
  statDate: string
  impressions: string
  reach: string
  clicks: string
  cost: string
}

export interface RealChannel {
  channel: string
  impressions: string
}

export interface RealReport {
  id: string
  type: 'campaign' | 'daily'
  campaignId: string | null
  status: 'pending' | 'running' | 'success' | 'failed'
  fileName: string
  createdAt: string
  finishedAt: string | null
}

export interface RealSyncTask {
  id: string
  campaignId: string
  triggerType: 'manual' | 'schedule'
  adapter?: string
  status: 'running' | 'success' | 'failed'
  rowsAffected?: number
  message: string | null
  startedAt: string
  finishedAt?: string | null
}

export interface RealLog {
  id: string
  objectType: string
  objectId: string
  action: string
  before?: Record<string, unknown> | null
  after?: Record<string, unknown> | null
  operatorId?: string
  operatorName?: string
  ip?: string
  createdAt: string
}

export interface RealProfile {
  campaignId: string
  totalImpressions: string | number
  curveType: 'uniform' | 'front_load' | 'back_load' | 'weekend'
  ctr: number | string
  cpm: number | string
  frequency: number | string
  dimRatio?: Record<string, Record<string, number>>
  seed: number
  saved?: boolean
}

export interface RealProject {
  id: string
  name: string
  client?: string
  startDate?: string
  endDate?: string
  budget: string
  createdAt?: string
}

/* ------------------------------------------------------------------ */
/* 映射工具                                                             */
/* ------------------------------------------------------------------ */

/** 后端会把空值序列化成字符串 "null"，统一清洗 */
export function str(value: unknown, fallback = '0'): string {
  if (value === null || value === undefined) return fallback
  const text = String(value).trim()
  if (!text || text === 'null' || text === 'undefined') return fallback
  return text
}

function num(value: unknown, fallback = 0): number {
  const parsed = Number(str(value, String(fallback)))
  return Number.isFinite(parsed) ? parsed : fallback
}

function toFixed4(value: number | null | undefined): string | null {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return null
  return Number(value).toFixed(4)
}

function defaultTargeting(targeting?: Partial<Targeting>): Targeting {
  return {
    regions: targeting?.regions ?? [],
    gender: targeting?.gender ?? 'all',
    ageRanges: targeting?.ageRanges ?? [],
    interests: targeting?.interests ?? [],
  }
}

const USER_PERMISSIONS = [
  'project:read',
  'campaign:read',
  'campaign:create',
  'campaign:update',
  'campaign:submit',
  'stats:write',
  'stats:import',
  'report:export',
  'dashboard:read',
  'vendor:read',
]

export function mapUser(user: RealUser): UserProfile {
  return {
    id: Number(user.id),
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    permissions: user.role === 'admin' ? ['*'] : [...USER_PERMISSIONS],
    status: (user.status ?? 1) as 0 | 1,
    lastLoginAt: user.lastLoginAt ?? null,
  }
}

export function mapVendor(vendor: RealVendor): Vendor {
  return {
    id: Number(vendor.id),
    code: vendor.code,
    name: vendor.name,
    platform: vendor.platform,
    platformName:
      CHANNEL_META[vendor.platform as ChannelCode]?.label ?? vendor.platform,
    contactName: vendor.contactName ?? null,
    contactPhoneMasked: vendor.contactPhone ?? null,
    status: vendor.status,
    remark: vendor.remark ?? null,
    campaignCount: vendor.campaignCount ?? 0,
  }
}

export function mapProject(project: RealProject, usedBudget = 0): Project {
  return {
    id: Number(project.id),
    name: project.name,
    client: project.client ?? '',
    startDate: project.startDate ?? '',
    endDate: project.endDate ?? '',
    totalBudget: str(project.budget, '0.00'),
    usedBudget: usedBudget.toFixed(2),
    status: 'active',
  }
}

export function mapCampaignListItem(campaign: RealCampaign): CampaignListItem {
  const target = num(campaign.targetImpressions)
  const impressions = num(campaign.actualImpressions)
  const completion =
    impressions <= 0
      ? null
      : campaign.completionRate !== null && campaign.completionRate !== undefined
        ? Number(campaign.completionRate)
        : target > 0
          ? impressions / target
          : null
  return {
    id: Number(campaign.id),
    code: campaign.code,
    name: campaign.name,
    projectId: Number(campaign.projectId),
    projectName: campaign.projectName ?? '',
    channel: campaign.channel,
    channelName: CHANNEL_META[campaign.channel]?.label ?? campaign.channel,
    vendors: (campaign.vendors ?? []).map((vendor) => ({
      id: Number(vendor.id),
      name: vendor.name,
      code: vendor.code,
    })),
    status: campaign.status,
    startDate: campaign.startDate,
    endDate: campaign.endDate,
    dayIndex: campaign.status === 'running' ? dayIndex(campaign.startDate) : null,
    targetImpressions: String(target),
    impressions: String(impressions),
    completionRate: toFixed4(completion),
    isMock: impressions > 0,
    ownerName: '',
    createdAt: campaign.createdAt ?? '',
    updatedAt: campaign.updatedAt ?? campaign.createdAt ?? '',
  }
}

export function mapCampaignDetail(campaign: RealCampaign): CampaignDetail {
  const base = mapCampaignListItem(campaign)
  const totalBudget = num(campaign.budget)
  const days = Math.max(
    1,
    dayjs(campaign.endDate).diff(dayjs(campaign.startDate), 'day') + 1,
  )
  return {
    ...base,
    budget: str(campaign.budget, '0.00'),
    dailyBudget: (totalBudget / days).toFixed(2),
    goal: campaign.objective,
    bidType: 'cpm',
    contractNo: null,
    remark: campaign.remark ?? null,
    targeting: defaultTargeting(campaign.targeting),
    creator: { id: Number(campaign.createdBy ?? 0), name: '—' },
    submittedAt: null,
    publishedAt: campaign.publishedAt ?? null,
    finishedAt: null,
    closedAt: null,
    reportNo: null,
    dataUpdatedAt: null,
    mockProfile: null,
    materials: [],
  }
}

export function mapDailyStats(stats: RealStats): DailyStat[] {
  return (stats.rows ?? []).map((row) => ({
    statDate: row.statDate,
    impressions: str(row.impressions),
    reach: str(row.reach),
    clicks: str(row.clicks),
    cost: str(row.cost, '0.00'),
    source: (row.source as DailyStat['source']) ?? 'api',
    isMock: (row.source ?? 'api') === 'mock',
    updatedBy: null,
    updatedAt: row.updatedAt ?? null,
  }))
}

export function mapDimItems(items: RealDimItem[]): DimStat[] {
  const total = items.reduce((sum, item) => sum + num(item.impressions), 0)
  return items
    .map((item) => ({
      dimType: item.dimType,
      dimKey: item.dimValue,
      dimName: item.dimValue,
      impressions: str(item.impressions),
      clicks: str(item.clicks),
      reach: str(item.reach),
      ratio: total ? (num(item.impressions) / total).toFixed(4) : '0',
    }))
    .sort((a, b) => num(b.impressions) - num(a.impressions))
}

export function mapSummary(summary: RealSummary): DashboardSummary {
  return {
    targetImpressions: str(summary.targetImpressions),
    impressions: str(summary.impressions),
    completionRate:
      summary.completionRate === null || summary.completionRate === undefined
        ? null
        : String(summary.completionRate),
    reach: str(summary.reach),
    clickRate:
      summary.clickRate === null || summary.clickRate === undefined
        ? ''
        : String(summary.clickRate),
    runningCampaigns: summary.runningCampaigns ?? 0,
    dataUpdatedAt: summary.dataUpdatedAt ?? '',
    compare: undefined,
  }
}

export function mapTrend(points: RealTrendPoint[]): TrendPoint[] {
  return (points ?? []).map((point) => ({
    date: point.statDate,
    actual: str(point.impressions),
    target: '0',
    clicks: str(point.clicks),
  }))
}

export function mapChannels(channels: RealChannel[]): DimensionValue[] {
  const list = (channels ?? []).map((item) => ({
    dimKey: item.channel,
    dimName: CHANNEL_META[item.channel as ChannelCode]?.label ?? item.channel,
    value: str(item.impressions),
    ratio: '0',
  }))
  const total = list.reduce((sum, item) => sum + num(item.value), 0)
  return list.map((item) => ({
    ...item,
    ratio: total ? (num(item.value) / total).toFixed(4) : '0',
  }))
}

export function mapReportTask(report: RealReport): ReportTask {
  const label = report.type === 'campaign' ? '结案报告' : '数据明细'
  const stamp = dayjs(report.createdAt).format('YYYYMMDD-HHmm')
  return {
    id: report.id,
    type: report.type === 'campaign' ? 'final' : 'detail',
    format: 'xlsx',
    status: report.status,
    fileName: `${label}_${stamp}.xlsx`,
    fileSize: 0,
    createdAt: report.createdAt,
    finishedAt: report.finishedAt,
    message: null,
    campaignIds: report.campaignId ? [Number(report.campaignId)] : [],
  }
}

export function mapSyncTask(
  task: RealSyncTask,
  campaignNames: Record<string, string> = {},
): SyncTask {
  const started = task.startedAt
  const finished = task.finishedAt ?? task.startedAt
  return {
    id: task.id,
    campaignId: Number(task.campaignId),
    campaignName: campaignNames[task.campaignId] ?? `计划 #${task.campaignId}`,
    triggerType: task.triggerType,
    startedAt: started,
    durationMs: Math.max(0, dayjs(finished).diff(dayjs(started), 'millisecond')),
    status: task.status,
    message: task.message ?? (task.rowsAffected ? `影响 ${task.rowsAffected} 行` : null),
  }
}

export function mapLog(log: RealLog): AuditLog {
  return {
    id: log.id,
    objectType: log.objectType,
    objectId: Number(log.objectId),
    action: log.action,
    operatorName: log.operatorName ?? '—',
    before: log.before ?? null,
    after: log.after ?? null,
    ip: log.ip ?? '—',
    createdAt: log.createdAt,
  }
}

export function mapProfile(profile: RealProfile): MockProfile {
  const ratios = profile.dimRatio ?? {}
  const toArray = (group?: Record<string, number>) =>
    group
      ? Object.entries(group).map(([key, ratio]) => ({
          key,
          name: key,
          ratio: String(ratio),
        }))
      : undefined
  return {
    campaignId: Number(profile.campaignId),
    totalImpressions: str(profile.totalImpressions),
    curveType: profile.curveType,
    ctr: Number(profile.ctr).toFixed(4),
    cpm: Number(profile.cpm).toFixed(2),
    frequency: Number(profile.frequency).toFixed(2),
    dimRatio: {
      region: toArray(ratios.region),
      gender: toArray(ratios.gender),
      age: toArray(ratios.age),
    },
    seed: profile.seed,
    updatedBy: null,
    updatedAt: null,
  }
}

export { num }
