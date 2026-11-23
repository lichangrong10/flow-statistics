<template>
  <div class="page">
    <PageHeader title="工作台" :subtitle="headerSubtitle">
      <template #extra>
        <el-select v-model="period" style="width: 116px" @change="loadAll">
          <el-option label="近 14 天" :value="14" />
          <el-option label="近 30 天" :value="30" />
          <el-option label="近 90 天" :value="90" />
        </el-select>
        <el-button :icon="Refresh" @click="loadAll">刷新</el-button>
      </template>
    </PageHeader>

    <div class="kpi-grid">
      <KpiCard
        v-for="card in kpiCards"
        :key="card.label"
        v-bind="card"
        :loading="loadingSummary"
      />
    </div>

    <div class="chart-row">
      <div class="card">
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
          <BaseChart
            :option="trendOption"
            :height="286"
            :loading="loadingTrend"
            :empty="!trend.length"
          />
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div>
            <div class="card-title">渠道占比</div>
            <div class="card-sub">按实际曝光量拆分</div>
          </div>
          <span class="legend-note">共 {{ channelItems.length }} 个渠道</span>
        </div>
        <div class="card-body">
          <BaseChart
            :option="channelOption"
            :height="286"
            :loading="loadingChannel"
            :empty="!channelItems.length"
          />
        </div>
      </div>
    </div>

    <div class="bottom-row">
      <div class="card">
        <div class="card-head">
          <div>
            <div class="card-title">待审核计划</div>
            <div class="card-sub">审核通过后进入已排期，可发布上线</div>
          </div>
          <el-button text type="primary" @click="go('/campaign?status=pending')">
            查看全部
          </el-button>
        </div>
        <div class="card-body">
          <div v-if="loadingPending" class="skeleton-rows">
            <div v-for="index in 3" :key="index" class="skeleton" style="height: 44px" />
          </div>
          <EmptyState v-else-if="!pending.length" type="no-data" title="暂无待审核计划" />
          <div v-else class="pending-list">
            <div
              v-for="item in pending"
              :key="item.id"
              class="pending-item"
              @click="go(`/campaign/${item.id}`)"
            >
              <div class="pi-main">
                <div class="pi-name">{{ item.name }}</div>
                <div class="pi-meta">
                  <ChannelTag :channel="item.channel" />
                  <template v-if="item.ownerName">
                    <span class="dot-sep">·</span>
                    {{ item.ownerName }}
                  </template>
                  <span class="dot-sep">·</span>
                  目标 {{ abbrNumber(item.targetImpressions) }}
                </div>
              </div>
              <div class="pi-right">
                <StatusTag :status="item.status" size="small" />
                <span class="pi-time">{{ shortTime(item.updatedAt) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div>
            <div class="card-title">最近更新数据</div>
            <div class="card-sub">按计划数据更新时间排序</div>
          </div>
          <el-button text type="primary" @click="go('/stats')">去回收</el-button>
        </div>
        <div class="card-body">
          <div v-if="loadingRecent" class="skeleton-rows">
            <div v-for="index in 3" :key="index" class="skeleton" style="height: 44px" />
          </div>
          <EmptyState v-else-if="!recent.length" type="no-data" title="暂无更新记录" />
          <div v-else class="update-list">
            <div
              v-for="item in recent"
              :key="item.id"
              class="update-item"
              @click="go(`/campaign/${item.id}`)"
            >
              <span class="ui-dot" />
              <div class="ui-main">
                <div class="ui-name">{{ item.name }}</div>
                <div class="ui-meta">
                  {{ item.channelName }} · 实际曝光 {{ formatNumber(item.impressions) }}
                </div>
              </div>
              <span class="ui-time">{{ relativeTime(item.updatedAt) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Refresh } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import PageHeader from '@/components/PageHeader.vue'
import KpiCard from '@/components/KpiCard.vue'
import BaseChart from '@/components/BaseChart.vue'
import DimensionTabs from '@/components/DimensionTabs.vue'
import StatusTag from '@/components/StatusTag.vue'
import ChannelTag from '@/components/ChannelTag.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useAppStore } from '@/stores/app'
import { getDashboardDimensions, getDashboardSummary, getDashboardTrend } from '@/api/dashboard'
import { getCampaigns } from '@/api/campaign'
import type { CampaignListItem, DashboardSummary, DimensionValue, TrendPoint } from '@/types'
import { lastNDays } from '@/utils/date'
import { abbrNumber, formatNumber, formatPercent } from '@/utils/format'
import { chartColors, donutOption, lineOption } from '@/utils/chart'

const router = useRouter()
const app = useAppStore()

const period = ref(14)
const trendMetric = ref('impressions')

const summary = ref<DashboardSummary | null>(null)
const trend = ref<TrendPoint[]>([])
const channelItems = ref<DimensionValue[]>([])
const pending = ref<CampaignListItem[]>([])
const recent = ref<CampaignListItem[]>([])

const loadingSummary = ref(true)
const loadingTrend = ref(true)
const loadingChannel = ref(true)
const loadingPending = ref(true)
const loadingRecent = ref(true)

const projectName = computed(() => app.currentProject?.name ?? '全部项目')
const headerSubtitle = computed(() => {
  const updated = summary.value?.dataUpdatedAt
    ? `数据更新于 ${dayjs(summary.value.dataUpdatedAt).format('YYYY-MM-DD HH:mm')}`
    : '暂无数据更新记录'
  return `${projectName.value} · 近 ${period.value} 天 · ${updated}`
})

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
      compare: null,
      comparePlaceholder: '—',
      compareLabel: '',
      hint: '所选项目与周期内计划目标曝光之和',
      clickable: true,
      onClick: () => go('/campaign'),
    },
    {
      label: '实际曝光量',
      value: data?.impressions ?? '—',
      unit: '次',
      compare: ratio(data?.impressions, compare?.impressions),
      comparePlaceholder: '—',
      hint: '分日数据曝光量求和',
      clickable: true,
      onClick: () => go('/board'),
    },
    {
      label: '曝光完成率',
      value: formatPercent(data?.completionRate ?? null, 2),
      compare: ratio(data?.completionRate, compare?.completionRate),
      comparePlaceholder: '—',
      hint: '周期内实际曝光 ÷ 计划总曝光（后端口径），目标为零时显示 —',
      clickable: true,
      onClick: () => go('/campaign'),
    },
    {
      label: '曝光人数',
      value: data?.reach ?? '—',
      unit: '人',
      compare: ratio(data?.reach, compare?.reach),
      comparePlaceholder: '—',
      hint: '区间内分日曝光人数求和，跨日不去重，标注为累计触达',
      clickable: true,
      onClick: () => go('/board'),
    },
    {
      label: '点击率',
      value: formatPercent(data?.clickRate ?? null, 2),
      compare: ratio(data?.clickRate, compare?.clickRate),
      comparePlaceholder: '—',
      hint: '点击人数 ÷ 曝光人数，与媒体后台口径一致',
      clickable: true,
      onClick: () => go('/board'),
    },
    {
      label: '在投计划',
      value: String(data?.runningCampaigns ?? '—'),
      unit: '个',
      compare: null,
      comparePlaceholder: '当前在投',
      compareLabel: '',
      clickable: true,
      onClick: () => go('/campaign?status=running'),
    },
  ].map((item) => ({ compareLabel: '环比上期', ...item }))
})

const trendOption = computed(() => {
  const colors = chartColors()
  const dates = trend.value.map((item) => item.date.slice(5))
  if (trendMetric.value === 'clicks') {
    return lineOption(
      dates,
      [
        {
          name: '点击人数',
          data: trend.value.map((item) => Number(item.clicks)),
          color: colors.palette[1],
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
          { name: '实际曝光', data: actual, color: colors.ink, area: true },
          { name: '计划曝光', data: target, color: colors.muted, dashed: true },
        ]
      : [{ name: '实际曝光', data: actual, color: colors.ink, area: true }],
    '次',
  )
})

const channelOption = computed(() => {
  void chartColors()
  const items = channelItems.value.map((item) => ({
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

function go(path: string) {
  router.push(path)
}

function shortTime(value: string): string {
  return dayjs(value).format('MM-DD HH:mm')
}

function relativeTime(value: string): string {
  const diff = dayjs().diff(dayjs(value), 'minute')
  if (diff < 1) return '刚刚'
  if (diff < 60) return `${diff} 分钟前`
  if (diff < 60 * 24) return `${Math.floor(diff / 60)} 小时前`
  return dayjs(value).format('MM-DD')
}

async function loadSummaryAndTrend() {
  const range = lastNDays(period.value)
  loadingSummary.value = true
  loadingTrend.value = true
  loadingChannel.value = true
  const projectId = app.currentProjectId ?? undefined
  try {
    const [summaryData, trendData, channelData] = await Promise.all([
      getDashboardSummary({ projectId, ...range, compare: 'previous' }),
      getDashboardTrend({ projectId, ...range, metric: trendMetric.value as 'impressions' }),
      getDashboardDimensions({ projectId, ...range, dimType: 'channel' }),
    ])
    summary.value = summaryData
    trend.value = trendData.items
    channelItems.value = channelData.items
  } catch {
    summary.value = null
    trend.value = []
    channelItems.value = []
  } finally {
    loadingSummary.value = false
    loadingTrend.value = false
    loadingChannel.value = false
  }
}

async function loadLists() {
  loadingPending.value = true
  loadingRecent.value = true
  try {
    const [pendingData, recentData] = await Promise.all([
      getCampaigns({ status: 'pending', page: 1, pageSize: 4 }),
      getCampaigns({ page: 1, pageSize: 5 }),
    ])
    pending.value = pendingData.items
    recent.value = recentData.items.filter((item) => Number(item.impressions) > 0)
    if (!recent.value.length) recent.value = recentData.items.slice(0, 4)
  } catch {
    pending.value = []
    recent.value = []
  } finally {
    loadingPending.value = false
    loadingRecent.value = false
  }
}

function loadAll() {
  loadSummaryAndTrend()
  loadLists()
}

watch(trendMetric, () => loadSummaryAndTrend())
watch(
  () => app.currentProjectId,
  () => loadAll(),
)

onMounted(loadAll)
</script>

<style scoped>
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 16px;
}
.chart-row {
  display: grid;
  grid-template-columns: minmax(0, 2.1fr) minmax(0, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}
.bottom-row {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  gap: 16px;
}
.legend-note {
  font-size: 12px;
  color: var(--color-text-tertiary);
}
.skeleton-rows {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.pending-list,
.update-list {
  display: flex;
  flex-direction: column;
}
.pending-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 10px;
  margin: 0 -10px;
  border-bottom: 1px solid #f0f3f8;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.15s ease;
}
.pending-item:last-child {
  border-bottom: none;
}
.pending-item:hover {
  background: var(--color-primary-soft);
}
.pi-main {
  min-width: 0;
}
.pi-name {
  font-size: 13.5px;
  font-weight: 500;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pi-meta {
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-tertiary);
}
.dot-sep {
  color: #c8d1db;
}
.pi-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: none;
}
.pi-time {
  font-size: 12px;
  color: var(--color-text-tertiary);
  font-variant-numeric: tabular-nums;
}
.update-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 10px;
  margin: 0 -10px;
  border-bottom: 1px solid #f0f3f8;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.15s ease;
}
.update-item:last-child {
  border-bottom: none;
}
.update-item:hover {
  background: var(--color-primary-soft);
}
.ui-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--signal-ok);
  flex: none;
  
}
.ui-main {
  flex: 1;
  min-width: 0;
}
.ui-name {
  font-size: 13px;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ui-meta {
  margin-top: 3px;
  font-size: 11.5px;
  color: var(--color-text-tertiary);
}
.ui-time {
  font-size: 11.5px;
  color: var(--color-text-tertiary);
  flex: none;
}

@media (max-width: 1500px) {
  .kpi-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (max-width: 1100px) {
  .chart-row,
  .bottom-row {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
