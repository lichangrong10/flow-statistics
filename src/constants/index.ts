import type {
  CampaignGoal,
  CampaignStatus,
  ChannelCode,
  MockCurve,
  ReportType,
} from '@/types'

/** 状态机七态：文案 + 色彩（取设计令牌衍生色） */
export const STATUS_META: Record<
  CampaignStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  draft: { label: '草稿', color: '#5B6673', bg: '#F2F4F7', border: '#E3E7ED' },
  pending: { label: '待审核', color: '#C77C0E', bg: '#FCF3E2', border: '#F3E1BE' },
  scheduled: { label: '已排期', color: '#2E6DA4', bg: '#EAF2FA', border: '#CFE0F1' },
  running: { label: '投放中', color: '#1F8A5B', bg: '#E9F6F0', border: '#C9E8DA' },
  paused: { label: '已暂停', color: '#B4711F', bg: '#FDF1E1', border: '#F3DFC2' },
  finished: { label: '已结束', color: '#6B7C93', bg: '#EFF2F6', border: '#DCE3EB' },
  closed: { label: '已结案', color: '#4A5260', bg: '#ECEFF3', border: '#D8DEE6' },
}

export const STATUS_OPTIONS = (Object.keys(STATUS_META) as CampaignStatus[]).map((key) => ({
  value: key,
  label: STATUS_META[key].label,
}))

/** 渠道：名称、品牌色、单字标识（图标占位） */
export const CHANNEL_META: Record<
  ChannelCode,
  { label: string; short: string; color: string; soft: string }
> = {
  douyin: { label: '抖音', short: '抖', color: '#161823', soft: '#EDEDEF' },
  wechat: { label: '微信', short: '微', color: '#07C160', soft: '#E7F6EE' },
  xiaohongshu: { label: '小红书', short: '红', color: '#E8324A', soft: '#FDECEF' },
  kuaishou: { label: '快手', short: '快', color: '#FF4906', soft: '#FDECE6' },
  baidu: { label: '百度', short: '百', color: '#2932E1', soft: '#EBEEFC' },
}

export const CHANNEL_OPTIONS = (Object.keys(CHANNEL_META) as ChannelCode[]).map((key) => ({
  value: key,
  label: CHANNEL_META[key].label,
}))

export const GOAL_OPTIONS: { value: CampaignGoal; label: string; desc: string }[] = [
  { value: 'impression', label: '曝光', desc: '以曝光量为核心考核指标' },
  { value: 'click', label: '点击', desc: '以点击人数与点击率为核心指标' },
  { value: 'lead', label: '线索', desc: '以表单留资线索为核心指标' },
]

export const BID_OPTIONS = [
  { value: 'cpm', label: '按曝光计费' },
  { value: 'cpc', label: '按点击计费' },
]

export const CURVE_OPTIONS: { value: MockCurve; label: string }[] = [
  { value: 'uniform', label: '均匀投放' },
  { value: 'front_load', label: '前低后高' },
  { value: 'back_load', label: '前高后低' },
  { value: 'weekend', label: '周末加权' },
]

export const AGE_OPTIONS = ['18-24', '25-29', '30-39', '40-49', '50 岁以上']

export const AGE_CODE_MAP: Record<string, string> = {
  '18-24': '18-24 岁',
  '25-29': '25-29 岁',
  '30-39': '30-39 岁',
  '40-49': '40-49 岁',
  '50 岁以上': '50 岁以上',
}

export const INTEREST_OPTIONS = [
  '美妆护肤',
  '母婴亲子',
  '数码家电',
  '汽车出行',
  '房产家居',
  '教育培训',
  '金融理财',
  '旅游出行',
  '美食餐饮',
  '运动健身',
  '游戏动漫',
  '服饰穿搭',
]

export const REPORT_TYPE_OPTIONS: { value: ReportType; label: string; desc: string }[] = [
  { value: 'daily', label: '投放日报', desc: '当日各计划曝光、点击、消耗与完成率' },
  { value: 'weekly', label: '投放周报', desc: '周维度汇总与环比' },
  { value: 'final', label: '结案报告', desc: '计划信息、总体指标、分日数据、人群分布与结论' },
  { value: 'detail', label: '数据明细', desc: '按计划与日期展开的全部原始记录' },
]

/** 省市级联（按文档「支持省、市两级」） */
export const REGION_TREE: { value: string; label: string; children?: { value: string; label: string }[] }[] = [
  {
    value: '江苏省',
    label: '江苏省',
    children: [
      { value: '苏州市', label: '苏州市' },
      { value: '南京市', label: '南京市' },
      { value: '无锡市', label: '无锡市' },
      { value: '常州市', label: '常州市' },
      { value: '南通市', label: '南通市' },
      { value: '扬州市', label: '扬州市' },
      { value: '泰州市', label: '泰州市' },
      { value: '盐城市', label: '盐城市' },
      { value: '徐州市', label: '徐州市' },
      { value: '镇江市', label: '镇江市' },
    ],
  },
  { value: '上海市', label: '上海市', children: [{ value: '浦东新区', label: '浦东新区' }, { value: '黄浦区', label: '黄浦区' }, { value: '徐汇区', label: '徐汇区' }] },
  {
    value: '浙江省',
    label: '浙江省',
    children: [
      { value: '杭州市', label: '杭州市' },
      { value: '宁波市', label: '宁波市' },
      { value: '温州市', label: '温州市' },
      { value: '嘉兴市', label: '嘉兴市' },
      { value: '绍兴市', label: '绍兴市' },
    ],
  },
  {
    value: '广东省',
    label: '广东省',
    children: [
      { value: '广州市', label: '广州市' },
      { value: '深圳市', label: '深圳市' },
      { value: '佛山市', label: '佛山市' },
      { value: '东莞市', label: '东莞市' },
    ],
  },
  { value: '北京市', label: '北京市', children: [{ value: '朝阳区', label: '朝阳区' }, { value: '海淀区', label: '海淀区' }] },
  {
    value: '山东省',
    label: '山东省',
    children: [
      { value: '济南市', label: '济南市' },
      { value: '青岛市', label: '青岛市' },
      { value: '烟台市', label: '烟台市' },
    ],
  },
  {
    value: '安徽省',
    label: '安徽省',
    children: [
      { value: '合肥市', label: '合肥市' },
      { value: '芜湖市', label: '芜湖市' },
    ],
  },
  {
    value: '河南省',
    label: '河南省',
    children: [
      { value: '郑州市', label: '郑州市' },
      { value: '洛阳市', label: '洛阳市' },
    ],
  },
  {
    value: '四川省',
    label: '四川省',
    children: [
      { value: '成都市', label: '成都市' },
      { value: '绵阳市', label: '绵阳市' },
    ],
  },
  {
    value: '湖北省',
    label: '湖北省',
    children: [
      { value: '武汉市', label: '武汉市' },
      { value: '宜昌市', label: '宜昌市' },
    ],
  },
  {
    value: '福建省',
    label: '福建省',
    children: [
      { value: '福州市', label: '福州市' },
      { value: '厦门市', label: '厦门市' },
    ],
  },
]

/** 权限码（与后端一致，admin 为 *） */
export const PERMISSIONS = {
  campaignRead: 'campaign:read',
  campaignCreate: 'campaign:create',
  campaignUpdate: 'campaign:update',
  campaignDelete: 'campaign:delete',
  campaignSubmit: 'campaign:submit',
  campaignApprove: 'campaign:approve',
  campaignPublish: 'campaign:publish',
  campaignPause: 'campaign:pause',
  campaignFinish: 'campaign:finish',
  campaignClose: 'campaign:close',
  statsWrite: 'stats:write',
  statsImport: 'stats:import',
  statsSync: 'stats:sync',
  statsAdjust: 'stats:adjust',
  dashboardRead: 'dashboard:read',
  reportExport: 'report:export',
  vendorRead: 'vendor:read',
  mockManage: 'mock:manage',
} as const

export const APP_VERSION = import.meta.env.VITE_APP_VERSION || 'V1.3'
