/** 统一响应信封（后端约定 code=0 成功） */
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
  traceId: string
}

/** 列表分页结构 */
export interface PageResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export type Role = 'admin' | 'user'

export type CampaignStatus =
  | 'draft'
  | 'pending'
  | 'scheduled'
  | 'running'
  | 'paused'
  | 'finished'
  | 'closed'

export type ChannelCode = 'douyin' | 'wechat' | 'xiaohongshu' | 'kuaishou' | 'baidu'
export type CampaignGoal = 'impression' | 'click' | 'lead'
export type BidType = 'cpm' | 'cpc'
export type DataSource = 'manual' | 'excel' | 'api' | 'mock'
export type DimType = 'region' | 'gender' | 'age' | 'channel'
export type MockCurve = 'uniform' | 'front_load' | 'back_load' | 'weekend'
export type ReportType = 'daily' | 'weekly' | 'final' | 'detail'
export type ReportStatus = 'pending' | 'running' | 'success' | 'failed'

export interface UserProfile {
  id: number
  username: string
  displayName: string
  role: Role
  permissions: string[]
  status: 0 | 1
  lastLoginAt: string | null
}

export interface Project {
  id: number
  name: string
  client: string
  startDate: string
  endDate: string
  totalBudget: string
  usedBudget: string
  status: 'active' | 'closed'
}

export interface Vendor {
  id: number
  code: string
  name: string
  platform: string
  platformName?: string
  contactName: string | null
  contactPhoneMasked: string | null
  status: 0 | 1
  remark: string | null
  campaignCount: number
}

export interface VendorBrief {
  id: number
  name: string
  code?: string
}

export interface Targeting {
  regions: { province: string; city?: string }[]
  gender: 'all' | 'male' | 'female'
  ageRanges: string[]
  interests: string[]
}

export interface CampaignListItem {
  id: number
  code: string | null
  name: string
  projectId: number
  projectName: string
  channel: ChannelCode
  channelName: string
  vendors: VendorBrief[]
  status: CampaignStatus
  startDate: string
  endDate: string
  dayIndex: number | null
  targetImpressions: string
  impressions: string
  completionRate: string | null
  isMock: boolean
  ownerName: string
  createdAt: string
  updatedAt: string
}

export interface CampaignDetail extends CampaignListItem {
  budget: string
  dailyBudget: string
  goal: CampaignGoal
  bidType: BidType
  contractNo: string | null
  remark: string | null
  targeting: Targeting
  creator: { id: number; name: string }
  submittedAt: string | null
  publishedAt: string | null
  finishedAt: string | null
  closedAt: string | null
  reportNo: string | null
  dataUpdatedAt: string | null
  mockProfile: MockProfile | null
  materials: { id: number; name: string; type: string; status: string }[]
}

export interface CampaignListQuery {
  page?: number
  pageSize?: number
  keyword?: string
  code?: string
  channel?: string[]
  status?: CampaignStatus | ''
  projectId?: number
  dateFrom?: string
  dateTo?: string
  onlyMine?: boolean
}

export interface CampaignDraftPayload {
  name: string
  projectId: number
  channels: ChannelCode[]
  vendorIds: number[]
  goal: CampaignGoal
  contractNo?: string
  targeting: Targeting
  startDate: string
  endDate: string
  dailyBudget: string
  totalBudget: string
  targetImpressions: string
  bidType: BidType
  materialIds?: number[]
  publishMode: 'draft' | 'submit' | 'publish'
  remark?: string
}

export interface DailyStat {
  statDate: string
  impressions: string
  reach: string
  clicks: string
  cost: string
  source: DataSource
  isMock: boolean
  updatedBy: string | null
  updatedAt: string | null
}

export interface DimStat {
  dimType: DimType
  dimKey: string
  dimName: string
  impressions: string
  clicks?: string
  reach?: string
  ratio: string
}

export interface MockProfile {
  campaignId: number
  totalImpressions: string
  curveType: MockCurve
  ctr: string
  cpm: string
  frequency: string
  dimRatio: {
    region?: { key: string; name: string; ratio: string }[]
    gender?: { key: string; ratio: string }[]
    age?: { key: string; ratio: string }[]
  }
  seed: number
  updatedBy: string | null
  updatedAt: string | null
}

export interface SyncTask {
  id: string | number
  campaignId: number
  campaignName: string
  triggerType: 'manual' | 'schedule'
  startedAt: string
  durationMs: number
  status: 'running' | 'success' | 'failed'
  message: string | null
}

export interface ReportTask {
  id: string | number
  type: ReportType
  format: 'xlsx' | 'pdf'
  status: ReportStatus
  fileName: string
  fileSize: number
  createdAt: string
  finishedAt: string | null
  message: string | null
  campaignIds: number[]
}

export interface AuditLog {
  id: string | number
  objectType: string
  objectId: number
  action: string
  operatorName: string
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  ip: string
  createdAt: string
}

export interface DashboardSummary {
  targetImpressions: string
  impressions: string
  completionRate: string | null
  reach: string
  clickRate: string
  runningCampaigns: number
  dataUpdatedAt: string
  compare?: {
    targetImpressions: string
    impressions: string
    completionRate: string | null
    reach: string
    clickRate: string
    runningCampaigns: number
  }
}

export interface TrendPoint {
  date: string
  actual: string
  target: string
  clicks: string
}

export interface DimensionValue {
  dimKey: string
  dimName: string
  value: string
  ratio: string
}

export interface DictBundle {
  version: string
  channels: { code: ChannelCode; name: string; color: string; enabled: boolean; bidType: BidType }[]
  ages: { code: string; name: string }[]
  interests: { code: string; name: string }[]
  platforms: { code: string; name: string }[]
  metrics: { code: string; name: string; formula: string; decimals: number; visible: boolean }[]
}

/** 表格列配置（DataTable 使用） */
export interface TableColumn {
  prop: string
  label: string
  width?: number | string
  minWidth?: number | string
  align?: 'left' | 'center' | 'right'
  fixed?: boolean | 'left' | 'right'
  sortable?: boolean
  ellipsis?: boolean
  slot?: string
}
