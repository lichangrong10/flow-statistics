<template>
  <div class="page">
    <PageHeader title="数据看板" subtitle="计划、日期、人群维度三级粒度，一屏看清投了多少、完成多少、投给谁">
      <template #extra>
        <el-button :icon="Refresh" @click="loadAll">刷新</el-button>
      </template>
    </PageHeader>

    <FilterBar :loading="loadingSummary" @search="onSearch" @reset="onReset">
      <div class="field">
        <span class="field-label">统计周期</span>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          value-format="YYYY-MM-DD"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 260px"
          :clearable="false"
        />
      </div>
      <div class="field">
        <span class="field-label">投放计划</span>
        <el-select
          v-model="campaignId"
          clearable
          placeholder="全部计划"
          filterable
          style="width: 240px"
        >
          <el-option
            v-for="item in campaignOptions"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </div>
      <div class="field">
        <span class="field-label">对比口径</span>
        <el-tag type="info" effect="plain" class="tip-tag">
          曝光人数为区间内累计触达（不去重）
        </el-tag>
      </div>
    </FilterBar>

    <div class="kpi-grid">
      <KpiCard
        v-for="card in kpiCards"
        :key="card.label"
        v-bind="card"
        :loading="loadingSummary"
      />
    </div>

    <div class="chart-grid">
      <div class="card span-8">
        <div class="card-head">
          <div>
            <div class="card-title">曝光趋势</div>
            <div class="card-sub">实际与计划曝光逐日对比</div>
          </div>
          <DimensionTabs
            v-model="trendMetric"
            :items="[
              { key: 'impressions', label: '曝光量' },
              { key: 'clicks', label: '点击人数' },
            ]"
          />
        </div>
        <div class="card-body">
          <BaseChart :option="trendOption" :height="300" :loading="loadingTrend" :empty="!trend.length" />
        </div>
      </div>

      <div class="card span-4">
        <div class="card-head">
          <div>
            <div class="card-title">渠道占比</div>
            <div class="card-sub">按曝光量拆分</div>
          </div>
        </div>
        <div class="card-body">
          <BaseChart :option="channelOption" :height="300" :loading="loadingChannel" :empty="!channels.length" />
        </div>
      </div>

      <div class="card span-5">
        <div class="card-head">
          <div>
            <div class="card-title">地域分布</div>
            <div class="card-sub">计划全周期累计，Top 10 省份 / 地市</div>
          </div>
        </div>
        <div class="card-body">
          <BaseChart :option="regionOption" :height="300" :loading="loadingRegion" :empty="!regions.length" />
        </div>
      </div>

      <div class="card span-3">
        <div class="card-head">
          <div>
            <div class="card-title">性别分布</div>
            <div class="card-sub">计划全周期累计 · 男 / 女 / 未知</div>
          </div>
        </div>
        <div class="card-body">
          <BaseChart :option="genderOption" :height="300" :loading="loadingGender" :empty="!genders.length" />
        </div>
      </div>

      <div class="card span-4">
        <div class="card-head">
          <div>
            <div class="card-title">年龄分布</div>
            <div class="card-sub">计划全周期累计 · 按曝光量降序</div>
          </div>
        </div>
        <div class="card-body">
          <BaseChart :option="ageOption" :height="300" :loading="loadingAge" :empty="!ages.length" />
        </div>
      </div>

      <div class="card span-12">
        <div class="card-head">
          <div>
            <div class="card-title">计划完成率</div>
            <div class="card-sub">按完成率排序，超过 100% 以强调色标识</div>
          </div>
          <span class="legend-note">
            <span class="lg-dot done" /> 已达成
            <span class="lg-dot ongoing" /> 进行中
          </span>
        </div>
        <div class="card-body">
          <BaseChart :option="completionOption" :height="280" :loading="loadingCompletion" :empty="!completionItems.length" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import PageHeader from '@/components/PageHeader.vue'
import FilterBar from '@/components/FilterBar.vue'
import KpiCard from '@/components/KpiCard.vue'
import BaseChart from '@/components/BaseChart.vue'
import DimensionTabs from '@/components/DimensionTabs.vue'
import { useAppStore } from '@/stores/app'
import { getDashboardDimensions, getDashboardSummary, getDashboardTrend } from '@/api/dashboard'
import { getCampaigns } from '@/api/campaign'
import type {
  CampaignListItem,
  DashboardSummary,
  DimensionValue,
  DimType,
  TrendPoint,
} from '@/types'
import { lastNDays } from '@/utils/date'
import { abbrNumber, formatNumber, formatPercent } from '@/utils/format'
import { barOption, donutOption, hbarOption, lineOption, PALETTE } from '@/utils/chart'
import type { EChartsOption } from 'echarts'

const app = useAppStore()

const dateRange = ref<[string, string]>([
  lastNDays(14).from,
  lastNDays(14).to,
])
const campaignId = ref<number | null>(null)
const trendMetric = ref('impressions')

const summary = ref<DashboardSummary | null>(null)
const trend = ref<TrendPoint[]>([])
const channels = ref<DimensionValue[]>([])
const regions = ref<DimensionValue[]>([])
const genders = ref<DimensionValue[]>([])
const ages = ref<DimensionValue[]>([])
const completionItems = ref<CampaignListItem[]>([])
const campaignOptions = ref<CampaignListItem[]>([])

const loadingSummary = ref(true)
const loadingTrend = ref(true)
const loadingChannel = ref(true)
const loadingRegion = ref(true)
const loadingGender = ref(true)
const loadingAge = ref(true)
const loadingCompletion = ref(true)

const kpiCards = computed(() => {
  const data = summary.value
  const compare = data?.compare
  const ratio = (current?: string | null, previous?: string | null) => {
    const cur = Number(current)
    const prev = Number(previous)
    if (!Number.isFinite(cur) || !Number.isFinite(prev) || prev === 0) return null
    return (cur - prev) / Math.abs(prev)
  }
  return [
    {
      label: '计划曝光量',
      value: data?.targetImpressions ?? '—',
      unit: '次',
      compare: ratio(data?.targetImpressions, compare?.targetImpressions),
      comparePlaceholder: '—',
      compareLabel: '',
      hint: '所选项目与周期内计划目标曝光之和',
    },
    {
      label: '实际曝光量',
      value: data?.impressions ?? '—',
      unit: '次',
      compare: ratio(data?.impressions, compare?.impressions),
      comparePlaceholder: '—',
    },
    {
      label: '曝光完成率',
      value: formatPercent(data?.completionRate ?? null, 2),
      compare: ratio(data?.completionRate, compare?.completionRate),
      comparePlaceholder: '—',
      hint: '周期内实际曝光 ÷ 计划总曝光（后端口径）',
    },
    {
      label: '曝光人数',
      value: data?.reach ?? '—',
      unit: '人',
      compare: ratio(data?.reach, compare?.reach),
      comparePlaceholder: '—',
      hint: '区间内累计触达，跨日求和不去重',
    },
    {
      label: '点击率',
      value: formatPercent(data?.clickRate ?? null, 2),
      compare: ratio(data?.clickRate, compare?.clickRate),
      comparePlaceholder: '—',
    },
    {
      label: '在投计划',
      value: String(data?.runningCampaigns ?? '—'),
      unit: '个',
      compare: null,
      comparePlaceholder: '当前在投',
      compareLabel: '',
    },
  ].map((item) => ({ compareLabel: '环比上期', ...item }))
})

const trendOption = computed(() => {
  const dates = trend.value.map((item) => item.date.slice(5))
  if (trendMetric.value === 'clicks') {
    return lineOption(
      dates,
      [
        {
          name: '点击人数',
          data: trend.value.map((item) => Number(item.clicks)),
          color: '#2E9C9A',
          area: true,
        },
      ],
      '人',
    )
  }
  const actual = trend.value.map((item) => Number(item.actual))
  const target = trend.value.map((item) => Number(item.target))
  const hasTarget = target.some((value) => value > 0)
  return lineOption(
    dates,
    hasTarget
      ? [
          { name: '实际曝光', data: actual, color: '#17416B', area: true },
          { name: '计划曝光', data: target, color: '#9DB6CD', dashed: true },
        ]
      : [{ name: '实际曝光', data: actual, color: '#17416B', area: true }],
    '次',
  )
})

const channelOption = computed(() => {
  const items = channels.value.map((item) => ({
    name: item.dimName,
    value: Number(item.value),
  }))
  const total = items.reduce((sum, item) => sum + item.value, 0)
  return donutOption(items, {
    unit: '次',
    centerValue: abbrNumber(total),
    centerLabel: '总曝光',
  })
})

const regionOption = computed(() =>
  hbarOption(
    regions.value.map((item) => ({ name: item.dimName, value: Number(item.value) })),
    '次',
    '#17416B',
  ),
)

const genderOption = computed(() => {
  const colorMap: Record<string, string> = {
    男: '#2E6DA4',
    女: '#C9A227',
    未知: '#8A94A6',
  }
  const items = genders.value.map((item) => ({
    name: item.dimName,
    value: Number(item.value),
    color: colorMap[item.dimName] ?? '#6B7C93',
  }))
  const total = items.reduce((sum, item) => sum + item.value, 0)
  return donutOption(items, {
    unit: '次',
    centerValue: abbrNumber(total),
    centerLabel: '全周期曝光',
  })
})

const ageOption = computed(() => {
  const items = [...ages.value].sort((a, b) => Number(b.value) - Number(a.value))
  return barOption(
    items.map((item) => item.dimName.replace('岁', '')),
    [
      {
        name: '曝光量',
        data: items.map((item) => Number(item.value)),
        color: '#2E9C9A',
      },
    ],
    '次',
  )
})

const completionOption = computed<EChartsOption>(() => {
  const items = [...completionItems.value]
    .filter((item) => Number(item.completionRate) > 0)
    .sort((a, b) => Number(a.completionRate) - Number(b.completionRate))
  const names = items.map((item) =>
    item.name.length > 14 ? `${item.name.slice(0, 14)}…` : item.name,
  )
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: unknown) => {
        const list = params as { dataIndex: number; value: number }[]
        const index = list[0]?.dataIndex ?? 0
        const item = items[index]
        if (!item) return ''
        return `${item.name}<br/>完成率 ${formatPercent(item.completionRate, 2)}<br/>实际曝光 ${formatNumber(item.impressions)}<br/>计划曝光 ${formatNumber(item.targetImpressions)}`
      },
    },
    grid: { left: 8, right: 40, top: 12, bottom: 8, containLabel: true },
    xAxis: { type: 'value', axisLabel: { formatter: '{value}%' }, splitLine: { lineStyle: { color: '#EFF3F8', type: [4, 4] } } },
    yAxis: {
      type: 'category',
      data: names,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#5B6673', fontSize: 12 },
    },
    series: [
      {
        type: 'bar',
        data: items.map((item) => ({
          value: Number((Number(item.completionRate) * 100).toFixed(2)),
          itemStyle: {
            color: Number(item.completionRate) >= 1 ? '#1F8A5B' : '#2E6DA4',
            borderRadius: [0, 5, 5, 0],
          },
        })),
        barWidth: 10,
        label: {
          show: true,
          position: 'right',
          formatter: (params: { value?: unknown }) => `${params.value}%`,
          color: '#5B6673',
          fontSize: 11,
        },
      },
    ],
  }
})

function rangeParams() {
  return {
    projectId: app.currentProjectId ?? undefined,
    from: dateRange.value[0],
    to: dateRange.value[1],
    campaignId: campaignId.value ?? undefined,
  }
}

async function loadSummary() {
  loadingSummary.value = true
  try {
    summary.value = await getDashboardSummary({ ...rangeParams() })
  } catch {
    summary.value = null
  } finally {
    loadingSummary.value = false
  }
}

async function loadTrend() {
  loadingTrend.value = true
  try {
    const data = await getDashboardTrend({
      ...rangeParams(),
      metric: trendMetric.value as 'impressions',
    })
    trend.value = data.items
  } catch {
    trend.value = []
  } finally {
    loadingTrend.value = false
  }
}

async function loadDimension(dimType: DimType, target: typeof channels, flag: typeof loadingChannel) {
  flag.value = true
  try {
    const data = await getDashboardDimensions({ ...rangeParams(), dimType })
    target.value = data.items
  } catch {
    target.value = []
  } finally {
    flag.value = false
  }
}

async function loadCompletion() {
  loadingCompletion.value = true
  try {
    const data = await getCampaigns({
      projectId: app.currentProjectId ?? undefined,
      page: 1,
      pageSize: 50,
    })
    campaignOptions.value = data.items
    completionItems.value = data.items.filter((item) => Number(item.targetImpressions) > 0)
  } catch {
    completionItems.value = []
  } finally {
    loadingCompletion.value = false
  }
}

function loadAll() {
  loadSummary()
  loadTrend()
  loadDimension('channel', channels, loadingChannel)
  loadDimension('region', regions, loadingRegion)
  loadDimension('gender', genders, loadingGender)
  loadDimension('age', ages, loadingAge)
  loadCompletion()
}

function onSearch() {
  loadAll()
}

function onReset() {
  const range = lastNDays(14)
  dateRange.value = [range.from, range.to]
  campaignId.value = null
  trendMetric.value = 'impressions'
  loadAll()
}

watch(trendMetric, loadTrend)
watch(
  () => app.currentProjectId,
  () => loadAll(),
)

onMounted(loadAll)
</script>

<style scoped>
.tip-tag {
  height: 30px;
  border-style: dashed;
  font-weight: 400;
}
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 14px;
  margin: 16px 0;
}
.chart-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 16px;
}
.span-3 {
  grid-column: span 3;
}
.span-4 {
  grid-column: span 4;
}
.span-5 {
  grid-column: span 5;
}
.span-8 {
  grid-column: span 8;
}
.span-12 {
  grid-column: span 12;
}
.legend-note {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-tertiary);
}
.lg-dot {
  width: 7px;
  height: 7px;
  border-radius: 2px;
  display: inline-block;
}
.lg-dot.done {
  background: #1f8a5b;
}
.lg-dot.ongoing {
  background: #2e6da4;
  margin-left: 8px;
}

@media (max-width: 1500px) {
  .kpi-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .chart-grid {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
  .span-8 {
    grid-column: span 4;
  }
  .span-4 {
    grid-column: span 2;
  }
  .span-5 {
    grid-column: span 3;
  }
  .span-3 {
    grid-column: span 3;
  }
}
@media (max-width: 1100px) {
  .chart-grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .span-3,
  .span-4,
  .span-5,
  .span-8,
  .span-12 {
    grid-column: span 1;
  }
}
</style>
