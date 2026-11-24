<template>
  <div class="page">
    <div class="back-row">
      <el-button text :icon="ArrowLeft" @click="router.push('/campaign')">返回投放计划</el-button>
    </div>

    <div v-if="loading && !detail" class="card detail-skeleton">
      <div class="skeleton" style="height: 30px; width: 40%" />
      <div class="skeleton" style="height: 18px; width: 65%; margin-top: 12px" />
    </div>

    <template v-else-if="detail">
      <div class="card detail-head">
        <div class="head-main">
          <div class="title-row">
            <h1 class="detail-title">{{ detail.name }}</h1>
            <StatusTag :status="detail.status" />
            <span v-if="detail.code" class="code-chip mono">{{ detail.code }}</span>
          </div>
          <div class="meta-row">
            <ChannelTag :channel="detail.channel" />
            <span class="meta-divider" />
            <span class="meta-item">
              <span class="meta-label">厂商</span>
              <VendorTags :vendors="detail.vendors" :max="3" />
            </span>
            <span class="meta-divider" />
            <span class="meta-item">
              <span class="meta-label">排期</span>
              <span class="num">{{ detail.startDate }} ~ {{ detail.endDate }}</span>
              <span v-if="detail.status === 'running' && detail.dayIndex" class="day-chip">
                第 {{ detail.dayIndex }} 天
              </span>
            </span>
            <span class="meta-divider" />
            <span class="meta-item">
              <span class="meta-label">预算</span>
              <span class="num">{{ formatAmount(detail.budget) }}</span>
            </span>
            <span class="meta-divider" />
            <span class="meta-item">
              <span class="meta-label">创建人</span>
              {{ detail.creator.name }}
            </span>
            <span class="meta-divider" />
            <span class="meta-item">
              <span class="meta-label">数据更新</span>
              {{ dataUpdatedAt ? formatDateTime(dataUpdatedAt) : '暂无数据' }}
            </span>
          </div>
        </div>
        <div class="head-actions">
          <el-button
            v-for="action in headerActions"
            :key="action.key"
            :type="action.primary ? 'primary' : 'default'"
            :plain="action.primary"
            :danger="action.danger"
            :loading="action.key === 'sync' && syncing"
            @click="onAction(action.key)"
          >
            {{ action.label }}
          </el-button>
        </div>
      </div>

      <div class="kpi-row">
        <KpiCard label="计划曝光量" :value="detail.targetImpressions" unit="次" :loading="loading" />
        <KpiCard label="实际曝光量" :value="actualImpressions" unit="次" :loading="loading" />
        <KpiCard
          label="曝光完成率"
          :value="formatPercent(completionRate, 2)"
          :loading="loading"
        />
        <KpiCard label="点击人数" :value="actualClicks" unit="人" :loading="loading" />
        <KpiCard label="消耗金额" :value="formatAmount(actualCost)" :loading="loading" />
      </div>

      <div class="card tabs-card">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="概览" name="overview">
            <div class="overview-grid">
              <div class="overview-progress">
                <div class="section-title">完成进度</div>
                <div class="progress-head">
                  <span class="progress-value">{{ formatPercent(completionRate, 2) }}</span>
                  <span v-if="Number(completionRate) >= 1" class="done-chip">已达成</span>
                  <span v-else class="tertiary">目标 {{ formatNumber(detail.targetImpressions) }} 次</span>
                </div>
                <div class="progress-bar">
                  <span
                    class="progress-fill"
                    :style="{ width: `${Math.min(100, Number(completionRate ?? 0) * 100)}%` }"
                  />
                </div>
                <div class="progress-meta">
                  <span>实际 {{ formatNumber(actualImpressions) }}</span>
                  <span>预计日均 {{ formatNumber(dailyTarget) }} 次</span>
                </div>
                <div class="overview-facts">
                  <div class="fact">
                    <span class="fact-label">日预算</span>
                    <span class="fact-value">{{ formatAmount(detail.dailyBudget) }}</span>
                  </div>
                  <div class="fact">
                    <span class="fact-label">出价方式</span>
                    <span class="fact-value">{{ detail.bidType === 'cpm' ? '按曝光计费' : '按点击计费' }}</span>
                  </div>
                  <div class="fact">
                    <span class="fact-label">投放目标</span>
                    <span class="fact-value">{{ goalLabel }}</span>
                  </div>
                  <div class="fact">
                    <span class="fact-label">关联合同</span>
                    <span class="fact-value">{{ detail.contractNo || '—' }}</span>
                  </div>
                </div>
              </div>

              <div class="overview-calendar">
                <div class="section-title">投放日历</div>
                <div class="calendar-head">
                  <span class="calendar-month">{{ calendarMonthLabel }}</span>
                  <span class="calendar-legend">
                    <i class="legend-block level-0" />无数据
                    <i class="legend-block level-1" />低
                    <i class="legend-block level-2" />中
                    <i class="legend-block level-3" />高
                  </span>
                </div>
                <div class="calendar-grid">
                  <span v-for="weekday in weekdays" :key="weekday" class="calendar-weekday">{{ weekday }}</span>
                  <span
                    v-for="cell in calendarCells"
                    :key="cell.date"
                    class="calendar-cell"
                    :class="[`level-${cell.level}`]"
                    :title="cell.day ? `${cell.date} 曝光 ${formatNumber(cell.impressions)}` : ''"
                  >
                    {{ cell.day || '' }}
                  </span>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane name="daily">
            <template #label>分日数据 <span class="tab-count">{{ statsRows.length }}</span></template>
            <div class="tab-toolbar">
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                value-format="YYYY-MM-DD"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                size="default"
                style="width: 260px"
                @change="loadStats"
              />
              <div class="toolbar-right">
                <span class="tertiary">缺失日期按 0 补齐，合计口径与实际一致</span>
                <el-button :icon="Refresh" @click="loadStats">刷新</el-button>
              </div>
            </div>
            <DataTable
              :columns="statColumns"
              :data="statsRows as unknown as Record<string, unknown>[]"
              :loading="loadingStats"
              :show-pager="false"
              empty-title="暂无分日数据"
              empty-desc="可在数据回收页手动录入或同步数据"
            >
              <template #date="{ row }">
                <span class="num">{{ row.statDate }}</span>
              </template>
              <template #impressions="{ row }">
                <span class="num right">{{ formatNumber(row.impressions as string) }}</span>
              </template>
              <template #reach="{ row }">
                <span class="num right">{{ formatNumber(row.reach as string) }}</span>
              </template>
              <template #clicks="{ row }">
                <span class="num right">{{ formatNumber(row.clicks as string) }}</span>
              </template>
              <template #ctr="{ row }">
                <span class="num right">
                  {{ Number(row.reach) ? formatPercent(Number(row.clicks) / Number(row.reach), 2) : '—' }}
                </span>
              </template>
              <template #cost="{ row }">
                <span class="num right">{{ formatAmount(row.cost as string) }}</span>
              </template>
              <template #source="{ row }">
                <span class="pill source-pill">{{ sourceLabel(String(row.source)) }}</span>
              </template>
              <template #updated="{ row }">
                <span class="tertiary">{{ row.updatedAt ? formatDateTime(row.updatedAt as string) : '—' }}</span>
              </template>
              <template #actions="{ row }">
                <el-button v-if="user.isAdmin" link type="primary" @click="openStatEdit(row)">
                  调节
                </el-button>
                <span v-else class="tertiary">—</span>
              </template>
            </DataTable>
          </el-tab-pane>

          <el-tab-pane label="人群分布" name="dimensions">
            <div class="dimension-toolbar">
              <DimensionTabs
                v-model="dimTab"
                :items="[
                  { key: 'region', label: '地域' },
                  { key: 'gender', label: '性别' },
                  { key: 'age', label: '年龄' },
                ]"
              />
              <span class="tertiary">
                维度合计与分日曝光总量一致；地域按省级汇总
              </span>
            </div>
            <div class="dimension-layout">
              <div class="dimension-chart">
                <BaseChart
                  :option="dimensionOption"
                  :height="320"
                  :loading="loadingDims"
                  :empty="!dims[dimTab as DimType].length"
                />
              </div>
              <DataTable
                class="dimension-table"
                :columns="dimensionColumns"
                :data="dims[dimTab as DimType] as unknown as Record<string, unknown>[]"
                :loading="loadingDims"
                :show-pager="false"
                empty-title="暂无维度数据"
              >
                <template #name="{ row }">{{ row.dimName }}</template>
                <template #value="{ row }">
                  <span class="num right">{{ formatNumber(row.impressions as string) }}</span>
                </template>
                <template #ratio="{ row }">
                  <span class="num right">{{ formatPercent(row.ratio as string, 2) }}</span>
                </template>
              </DataTable>
            </div>
          </el-tab-pane>

          <el-tab-pane label="素材" name="materials">
            <EmptyState
              type="no-data"
              title="素材库尚未接入"
              description="本期仅保留只读展示入口，发布后的素材转码与审核在媒体侧完成。"
            />
          </el-tab-pane>

          <el-tab-pane label="操作日志" name="logs">
            <div v-loading="loadingLogs" class="log-list">
              <EmptyState v-if="!logs.length && !loadingLogs" type="no-data" title="暂无操作日志" />
              <div v-for="log in logs" :key="log.id" class="log-item">
                <span class="log-dot" />
                <div class="log-main">
                  <div class="log-title">
                    <strong>{{ actionLabel(log.action) }}</strong>
                    <span class="log-operator">{{ log.operatorName }}</span>
                    <span class="log-time">{{ formatDateTime(log.createdAt) }}</span>
                  </div>
                  <div v-if="log.after" class="log-detail">
                    变更后：{{ stringify(log.after) }}
                  </div>
                  <div v-if="log.before" class="log-detail before">
                    变更前：{{ stringify(log.before) }}
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </template>

    <!-- 单日调节 -->
    <el-dialog v-model="statEditVisible" title="调节单日数据" width="520px">
      <div class="dialog-tip">调节记录将写入操作日志，请如实填写原因（不少于 10 个字）。</div>
      <el-form label-width="96px" label-position="left">
        <el-form-item label="数据日期">
          <span class="num">{{ statEdit.statDate }}</span>
        </el-form-item>
        <el-form-item label="曝光量">
          <el-input-number v-model="statEdit.impressions" :min="0" :controls="false" style="width: 100%" />
        </el-form-item>
        <el-form-item label="曝光人数">
          <el-input-number v-model="statEdit.reach" :min="0" :controls="false" style="width: 100%" />
        </el-form-item>
        <el-form-item label="点击人数">
          <el-input-number v-model="statEdit.clicks" :min="0" :controls="false" style="width: 100%" />
        </el-form-item>
        <el-form-item label="消耗金额">
          <el-input-number v-model="statEdit.cost" :min="0" :precision="2" :controls="false" style="width: 100%" />
        </el-form-item>
        <el-form-item label="调节原因">
          <el-input v-model="statEdit.reason" type="textarea" :rows="3" maxlength="200" show-word-limit placeholder="例如：媒体后台数据延迟，按对账结果修正" />
        </el-form-item>
      </el-form>
      <div v-if="statEditError" class="dialog-error">{{ statEditError }}</div>
      <template #footer>
        <el-button @click="statEditVisible = false">取消</el-button>
        <el-button type="primary" :loading="statEditSaving" @click="submitStatEdit">保存调节</el-button>
      </template>
    </el-dialog>

    <!-- 模拟数据生成 -->
    <el-dialog v-model="mockVisible" title="生成模拟数据" width="720px">
      <div class="dialog-tip">
        按排期逐日生成，覆盖写入不累加；固定种子保证结果可复现。生成后可在分日数据中逐日调节。
      </div>
      <div class="mock-layout">
        <el-form label-width="108px" label-position="left" class="mock-form">
          <el-form-item label="目标总曝光">
            <el-input-number v-model="mockForm.totalImpressions" :min="1000" :step="10000" :controls="false" style="width: 100%" />
          </el-form-item>
          <el-form-item label="投放曲线">
            <el-select v-model="mockForm.curveType" style="width: 100%">
              <el-option v-for="item in CURVE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="点击率（%）">
            <el-input-number v-model="mockForm.ctrPercent" :min="0" :max="20" :step="0.1" :precision="2" :controls="false" style="width: 100%" />
          </el-form-item>
          <el-form-item label="千人成本">
            <el-input-number v-model="mockForm.cpm" :min="1" :step="1" :precision="2" :controls="false" style="width: 100%" />
          </el-form-item>
          <el-form-item label="曝光频次">
            <el-input-number v-model="mockForm.frequency" :min="1" :step="1" :precision="2" :controls="false" style="width: 100%" />
          </el-form-item>
          <el-form-item label="随机种子">
            <el-input-number v-model="mockForm.seed" :min="1" :controls="false" style="width: 100%" />
          </el-form-item>
        </el-form>
        <div class="mock-preview">
          <BaseChart :option="mockPreviewOption" :height="230" />
          <div class="mock-totals">
            <div><span>预计曝光</span><strong>{{ formatNumber(mockTotals.impressions) }}</strong></div>
            <div><span>预计人数</span><strong>{{ formatNumber(mockTotals.reach) }}</strong></div>
            <div><span>预计点击</span><strong>{{ formatNumber(mockTotals.clicks) }}</strong></div>
            <div><span>预计消耗</span><strong>{{ formatAmount(mockTotals.cost) }}</strong></div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="mockVisible = false">取消</el-button>
        <el-button type="primary" :loading="mockGenerating" @click="generateMock">生成并覆盖</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, InfoFilled, Refresh } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import PageHeader from '@/components/PageHeader.vue'
import KpiCard from '@/components/KpiCard.vue'
import StatusTag from '@/components/StatusTag.vue'
import ChannelTag from '@/components/ChannelTag.vue'
import VendorTags from '@/components/VendorTags.vue'
import DataTable from '@/components/DataTable.vue'
import BaseChart from '@/components/BaseChart.vue'
import DimensionTabs from '@/components/DimensionTabs.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useUserStore } from '@/stores/user'
import {
  closeCampaign,
  finishCampaign,
  getCampaign,
  pauseCampaign,
  publishCampaign,
  resumeCampaign,
} from '@/api/campaign'
import {
  adjustCampaignStat,
  getCampaignDimensions,
  getCampaignStats,
  syncCampaign,
} from '@/api/stats'
import { clearMockData, generateMockData, getAuditLogs, getMockProfile } from '@/api/simulation'
import type {
  AuditLog,
  CampaignDetail,
  DailyStat,
  DimStat,
  DimType,
  MockCurve,
  MockProfile,
  TableColumn,
} from '@/types'
import { CURVE_OPTIONS } from '@/constants'
import { addDays, eachDate, today } from '@/utils/date'
import {
  formatAmount,
  formatDateTime,
  formatNumber,
  formatPercent,
} from '@/utils/format'
import { barOption, chartColors, donutOption, hbarOption, lineOption } from '@/utils/chart'
import { generateSeries } from '@/utils/preview-generator'

const route = useRoute()
const router = useRouter()
const user = useUserStore()

const id = Number(route.params.id)
const detail = ref<CampaignDetail | null>(null)
const loading = ref(true)
const activeTab = ref('overview')

const stats = ref<DailyStat[]>([])
const loadingStats = ref(false)
const dateRange = ref<[string, string]>([today(), today()])

const dims = reactive<Record<DimType, DimStat[]>>({
  region: [],
  gender: [],
  age: [],
  channel: [],
})
const dimTab = ref('region')
const loadingDims = ref(false)

const logs = ref<AuditLog[]>([])
const loadingLogs = ref(false)
const syncing = ref(false)

const statEditVisible = ref(false)
const statEditSaving = ref(false)
const statEditError = ref('')
const statEdit = reactive({
  statDate: '',
  impressions: 0,
  reach: 0,
  clicks: 0,
  cost: 0,
  reason: '',
})

const mockVisible = ref(false)
const mockGenerating = ref(false)
const mockForm = reactive({
  totalImpressions: 0,
  curveType: 'uniform' as MockCurve,
  ctrPercent: 1,
  cpm: 12,
  frequency: 65,
  seed: 1,
})
const profile = ref<MockProfile | null>(null)

const statColumns: TableColumn[] = [
  { prop: 'statDate', label: '日期', width: 128, slot: 'date' },
  { prop: 'impressions', label: '曝光量', minWidth: 130, align: 'right', slot: 'impressions' },
  { prop: 'reach', label: '曝光人数', width: 120, align: 'right', slot: 'reach' },
  { prop: 'clicks', label: '点击人数', width: 110, align: 'right', slot: 'clicks' },
  { prop: 'ctr', label: '点击率', width: 96, align: 'right', slot: 'ctr' },
  { prop: 'cost', label: '消耗', width: 120, align: 'right', slot: 'cost' },
  { prop: 'source', label: '来源', width: 90, slot: 'source' },
  { prop: 'updatedAt', label: '更新时间', width: 158, slot: 'updated' },
  { prop: 'actions', label: '操作', width: 84, fixed: 'right', slot: 'actions' },
]

const dimensionColumns: TableColumn[] = [
  { prop: 'dimName', label: '维度项', minWidth: 110, slot: 'name' },
  { prop: 'impressions', label: '曝光量', width: 140, align: 'right', slot: 'value' },
  { prop: 'ratio', label: '占比', width: 96, align: 'right', slot: 'ratio' },
]

const actualImpressions = computed(() =>
  String(stats.value.reduce((sum, item) => sum + Number(item.impressions), 0)),
)
const actualClicks = computed(() =>
  String(stats.value.reduce((sum, item) => sum + Number(item.clicks), 0)),
)
const actualCost = computed(() =>
  stats.value.reduce((sum, item) => sum + Number(item.cost), 0).toFixed(2),
)
const completionRate = computed(() => {
  const target = Number(detail.value?.targetImpressions ?? 0)
  if (!target) return null
  return Number(actualImpressions.value) / target
})
const dataUpdatedAt = computed(() => {
  const times = stats.value
    .map((item) => item.updatedAt)
    .filter((item): item is string => Boolean(item))
    .sort()
  return times.length ? times[times.length - 1] : detail.value?.dataUpdatedAt ?? null
})
const goalLabel = computed(
  () =>
    ({ impression: '曝光', click: '点击', lead: '线索' })[
      detail.value?.goal ?? 'impression'
    ],
)
const dailyTarget = computed(() => {
  if (!detail.value) return 0
  const days = eachDate(detail.value.startDate, detail.value.endDate).length || 1
  return Math.round(Number(detail.value.targetImpressions) / days)
})

const statsRows = computed(() => {
  if (!detail.value) return []
  const [from, to] = dateRange.value
  const map = new Map(stats.value.map((item) => [item.statDate, item]))
  return eachDate(from, to).map((date) => {
    const hit = map.get(date)
    return (
      hit ?? {
        statDate: date,
        impressions: '0',
        reach: '0',
        clicks: '0',
        cost: '0.00',
        source: 'mock',
        isMock: true,
        updatedBy: null,
        updatedAt: null,
      }
    )
  })
})

const calendarMonthLabel = computed(() => {
  if (!detail.value) return ''
  const start = dayjs(detail.value.startDate)
  const end = dayjs(detail.value.endDate)
  if (start.format('YYYY-MM') === end.format('YYYY-MM')) {
    return start.format('YYYY 年 M 月')
  }
  return `${start.format('YYYY 年 M 月 D 日')} – ${end.format('M 月 D 日')}`
})
const weekdays = ['一', '二', '三', '四', '五', '六', '日']
const calendarCells = computed(() => {
  if (!detail.value) return []
  const map = new Map(stats.value.map((item) => [item.statDate, Number(item.impressions)]))
  const max = Math.max(1, ...map.values())
  const start = dayjs(detail.value.startDate)
  const end = dayjs(detail.value.endDate)
  const offset = (start.day() + 6) % 7
  const cells: { date: string; day: number; level: number; impressions: number }[] = []
  for (let index = 0; index < offset; index += 1) {
    cells.push({ date: `blank-${index}`, day: 0, level: -1, impressions: 0 })
  }
  let cursor = start
  while (cursor.isBefore(end) || cursor.isSame(end, 'day')) {
    const date = cursor.format('YYYY-MM-DD')
    const impressions = map.get(date) ?? 0
    const ratio = impressions / max
    const level = impressions === 0 ? 0 : ratio > 0.66 ? 3 : ratio > 0.33 ? 2 : 1
    cells.push({ date, day: cursor.date(), level, impressions })
    cursor = cursor.add(1, 'day')
  }
  return cells
})

const dimensionOption = computed(() => {
  const list = dims[dimTab.value as DimType] ?? []
  if (dimTab.value === 'region') {
    return hbarOption(
      list.map((item) => ({ name: item.dimName, value: Number(item.impressions) })),
      '次',
      '#17416B',
    )
  }
  if (dimTab.value === 'gender') {
    const colors = chartColors()
  const colorMap: Record<string, string> = { 男: colors.palette[1], 女: colors.palette[3], 未知: colors.muted }
    const items = list.map((item) => ({
      name: item.dimName,
      value: Number(item.impressions),
      color: colorMap[item.dimName] ?? colors.muted,
    }))
    return donutOption(items, { unit: '次' })
  }
  return barOption(
    list.map((item) => item.dimName),
    [{ name: '曝光量', data: list.map((item) => Number(item.impressions)), color: chartColors().palette[2] }],
    '次',
  )
})

const headerActions = computed(() => {
  if (!detail.value) return []
  const admin = user.isAdmin
  const status = detail.value.status
  const list: { key: string; label: string; primary?: boolean; danger?: boolean }[] = []
  if (status === 'draft') list.push({ key: 'edit', label: '编辑' })
  if (status === 'scheduled' && admin) list.push({ key: 'publish', label: '立即发布', primary: true })
  if (status === 'running' && admin) list.push({ key: 'pause', label: '暂停投放' })
  if (status === 'paused' && admin) {
    list.push({ key: 'resume', label: '恢复投放', primary: true })
    list.push({ key: 'finish', label: '结束投放', danger: true })
  }
  if (status === 'finished' && admin) list.push({ key: 'close', label: '生成结案报告', primary: true })
  if (status === 'closed') list.push({ key: 'report', label: '导出报告', primary: true })
  if (['running', 'finished'].includes(status)) {
    list.push({ key: 'sync', label: syncing.value ? '同步中…' : '同步数据' })
  }
  return list
})

function sourceLabel(source: string): string {
  const map: Record<string, string> = {
    manual: '手工录入',
    excel: 'Excel 导入',
    api: '媒体同步',
    mock: '系统生成',
  }
  return map[source] ?? source
}

function actionLabel(action: string): string {
  const map: Record<string, string> = {
    create: '创建计划',
    update: '修改计划',
    submit: '提交审核',
    approve: '审核通过',
    reject: '审核驳回',
    withdraw: '撤回申请',
    publish: '发布计划',
    pause: '暂停投放',
    resume: '恢复投放',
    finish: '结束投放',
    close: '结案归档',
    'stats.write': '录入分日数据',
    'stats.adjust': '调节单日数据',
    'stats.import': '导入数据',
    'stats.sync': '触发数据同步',
    'mock.generate': '生成数据',
    mock_generate: '生成数据',
    save_mock_profile: '更新投放参数',
    stats_import: '导入分日数据',
    stats_adjust: '调节单日数据',
    import: '导入数据',
    adjust: '调节单日数据',
    'mock.clear': '清理历史数据',
    'vendors.update': '调整投放厂商',
  }
  return map[action] ?? action
}

function stringify(value: Record<string, unknown> | null): string {
  if (!value) return '—'
  return Object.entries(value)
    .map(([key, item]) => `${key}: ${String(item)}`)
    .join('，')
}

async function loadDetail() {
  loading.value = true
  try {
    const data = await getCampaign(id)
    detail.value = data
    // 真实后端按计划排期生成整段数据，默认展示完整排期，保证与列表口径一致
    dateRange.value = [data.startDate, data.endDate]
    await Promise.all([loadStats(), loadDimensions(), loadLogs(), loadProfile()])
  } catch (error) {
    ElMessage.error((error as Error).message || '计划详情加载失败')
    router.replace('/campaign')
  } finally {
    loading.value = false
  }
}

async function loadStats() {
  if (!dateRange.value?.[0]) return
  loadingStats.value = true
  try {
    const result = await getCampaignStats(id, {
      from: dateRange.value[0],
      to: dateRange.value[1],
    })
    stats.value = result.items
  } catch {
    stats.value = []
  } finally {
    loadingStats.value = false
  }
}

async function loadDimensions() {
  loadingDims.value = true
  try {
    const [region, gender, age] = await Promise.all([
      getCampaignDimensions(id, 'region'),
      getCampaignDimensions(id, 'gender'),
      getCampaignDimensions(id, 'age'),
    ])
    dims.region = region.items
    dims.gender = gender.items
    dims.age = age.items
  } catch {
    dims.region = []
    dims.gender = []
    dims.age = []
  } finally {
    loadingDims.value = false
  }
}

async function loadLogs() {
  loadingLogs.value = true
  try {
    const result = await getAuditLogs({
      page: 1,
      pageSize: 100,
      objectType: 'campaign',
      objectId: id,
    })
    logs.value = result.items.filter((item) => String(item.objectId) === String(id))
  } catch {
    logs.value = []
  } finally {
    loadingLogs.value = false
  }
}

async function onAction(key: string) {
  try {
    if (key === 'edit') {
      router.push(`/campaign/create?mode=edit&id=${id}`)
      return
    }
    if (key === 'report') {
      router.push(`/report?campaignId=${id}`)
      return
    }
    if (key === 'mock') {
      await openMockDialog()
      return
    }
    if (key === 'sync') {
      if (syncing.value) return
      await ElMessageBox.confirm('将按媒体适配器拉取该计划数据，预计耗时约 2 秒。确认同步？', '同步数据', {
        confirmButtonText: '开始同步',
        cancelButtonText: '取消',
      })
      syncing.value = true
      try {
        const [result] = await Promise.all([
          syncCampaign(id),
          new Promise((resolve) => window.setTimeout(resolve, 2000)),
        ])
        if (result.days > 0) {
          const added = result.added > 0 ? `，其中新增 ${result.added} 天` : ''
          ElMessage.success(`同步完成：本次更新 ${result.days} 天数据${added}`)
        } else if (result.message) {
          ElMessage.warning(result.message)
        } else {
          ElMessage.success('同步完成，暂无新增数据')
        }
        await loadDetail()
      } finally {
        syncing.value = false
      }
      return
    }
    if (key === 'clear') {
      await ElMessageBox.confirm(
        '将删除该计划的全部分日与人群数据（不可恢复），确认继续？',
        '清空模拟数据',
        { confirmButtonText: '清空', cancelButtonText: '取消', type: 'warning' },
      )
      const result = await clearMockData(id)
      ElMessage.success(`已清空 ${result.deletedDays} 天数据`)
      await loadDetail()
      return
    }
    if (key === 'publish') {
      await ElMessageBox.confirm('发布后生成投放单号并按排期开始投放，确认继续？', '发布计划', {
        confirmButtonText: '立即发布',
        cancelButtonText: '取消',
      })
      const result = await publishCampaign(id)
      ElMessage.success(`发布成功，投放单号 ${result.code}`)
      await loadDetail()
      return
    }
    if (key === 'pause') {
      await ElMessageBox.confirm('暂停后当日投放停止，确认继续？', '暂停投放', {
        confirmButtonText: '暂停',
        cancelButtonText: '取消',
        type: 'warning',
      })
      await pauseCampaign(id)
      ElMessage.success('已暂停投放')
      await loadDetail()
      return
    }
    if (key === 'resume') {
      await resumeCampaign(id)
      ElMessage.success('已恢复投放')
      await loadDetail()
      return
    }
    if (key === 'finish') {
      await ElMessageBox.confirm('结束后禁止继续录入数据，确认结束投放？', '结束投放', {
        confirmButtonText: '结束投放',
        cancelButtonText: '取消',
        type: 'warning',
      })
      await finishCampaign(id)
      ElMessage.success('已结束投放')
      await loadDetail()
      return
    }
    if (key === 'close') {
      await ElMessageBox.confirm('结案后计划转为只读并生成结案报告编号，确认继续？', '结案归档', {
        confirmButtonText: '结案',
        cancelButtonText: '取消',
        type: 'warning',
      })
      const result = await closeCampaign(id)
      ElMessage.success(`结案完成，报告编号 ${result.reportNo}`)
      await loadDetail()
    }
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    ElMessage.error((error as Error).message || '操作失败')
  }
}

function openStatEdit(row: Record<string, unknown>) {
  statEditError.value = ''
  statEdit.statDate = String(row.statDate)
  statEdit.impressions = Number(row.impressions)
  statEdit.reach = Number(row.reach)
  statEdit.clicks = Number(row.clicks)
  statEdit.cost = Number(row.cost)
  statEdit.reason = ''
  statEditVisible.value = true
}

async function submitStatEdit() {
  statEditError.value = ''
  if (statEdit.reason.trim().length < 10) {
    statEditError.value = '调节原因不少于 10 个字'
    return
  }
  if (statEdit.reach > statEdit.impressions) {
    statEditError.value = '曝光人数不应大于曝光量'
    return
  }
  if (statEdit.clicks > statEdit.reach) {
    statEditError.value = '点击人数不应大于曝光人数'
    return
  }
  statEditSaving.value = true
  try {
    await adjustCampaignStat(id, statEdit.statDate, {
      impressions: statEdit.impressions,
      reach: statEdit.reach,
      clicks: statEdit.clicks,
      cost: statEdit.cost,
      reason: statEdit.reason,
    })
    ElMessage.success('数据已调节并写入审计日志')
    statEditVisible.value = false
    await loadDetail()
  } catch (error) {
    statEditError.value = (error as Error).message || '调节失败'
  } finally {
    statEditSaving.value = false
  }
}

async function loadProfile() {
  try {
    profile.value = await getMockProfile(id)
    if (profile.value) {
      mockForm.totalImpressions = Number(profile.value.totalImpressions)
      mockForm.curveType = profile.value.curveType
      mockForm.ctrPercent = Number(profile.value.ctr) * 100
      mockForm.cpm = Number(profile.value.cpm)
      mockForm.frequency = Number(profile.value.frequency)
      mockForm.seed = profile.value.seed
    }
  } catch {
    profile.value = null
  }
}

async function openMockDialog() {
  await loadProfile()
  if (!detail.value) return
  if (detail.value.startDate > today()) {
    ElMessage.warning('计划尚未开始，无法生成模拟数据')
    return
  }
  mockVisible.value = true
}

const mockPreviewSeries = computed(() => {
  if (!detail.value) return []
  const end = detail.value.endDate < today() ? detail.value.endDate : today()
  return generateSeries({
    start: detail.value.startDate,
    end,
    totalImpressions: mockForm.totalImpressions || 1,
    curve: mockForm.curveType,
    ctr: mockForm.ctrPercent / 100,
    cpm: mockForm.cpm,
    frequency: mockForm.frequency,
    seed: mockForm.seed,
  })
})

const mockPreviewOption = computed(() =>
  lineOption(
    mockPreviewSeries.value.map((item) => item.statDate.slice(5)),
    [
      {
        name: '预计曝光',
        data: mockPreviewSeries.value.map((item) => item.impressions),
        color: chartColors().ink,
        area: true,
      },
    ],
    '次',
  ),
)

const mockTotals = computed(() => {
  const series = mockPreviewSeries.value
  return {
    impressions: series.reduce((sum, item) => sum + item.impressions, 0),
    reach: series.reduce((sum, item) => sum + item.reach, 0),
    clicks: series.reduce((sum, item) => sum + item.clicks, 0),
    cost: series.reduce((sum, item) => sum + item.cost, 0).toFixed(2),
  }
})

async function generateMock() {
  mockGenerating.value = true
  try {
    const result = await generateMockData(id, {
      from: detail.value?.startDate,
      to: detail.value?.endDate,
      params: {
        totalImpressions: String(mockForm.totalImpressions),
        curveType: mockForm.curveType,
        ctr: (mockForm.ctrPercent / 100).toFixed(4),
        cpm: mockForm.cpm.toFixed(2),
        frequency: mockForm.frequency.toFixed(2),
        seed: mockForm.seed,
      },
    })
    ElMessage.success(`已生成 ${result.days} 天模拟数据，覆盖写入完成`)
    mockVisible.value = false
    await loadDetail()
  } catch (error) {
    ElMessage.error((error as Error).message || '生成失败')
  } finally {
    mockGenerating.value = false
  }
}

onMounted(loadDetail)
</script>

<style scoped>
.back-row {
  margin-bottom: 8px;
}
.detail-skeleton {
  padding: 24px;
  min-height: 140px;
}
.detail-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding: 20px 24px;
}
.head-main {
  min-width: 0;
  flex: 1;
}
.title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.detail-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: 0.2px;
}
.code-chip {
  font-size: 12.5px;
  color: var(--color-text-secondary);
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--ink-50);
  border: 1px solid #e6ebf2;
}
.meta-row {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  margin-top: 12px;
  font-size: 12.5px;
  color: var(--color-text-secondary);
}
.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.meta-label {
  color: var(--color-text-tertiary);
}
.meta-divider {
  width: 1px;
  height: 12px;
  background: var(--color-border-light);
}
.day-chip {
  padding: 0 6px;
  height: 18px;
  line-height: 18px;
  border-radius: 4px;
  background: var(--ink-50);
  color: var(--color-text);
  font-size: 11px;
}
.mock-banner {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  padding: 7px 12px;
  border-radius: var(--radius-sm);
  background: var(--ink-50);
  border: 1px solid #f3e4c4;
  color: var(--color-text);
  font-size: 12px;
  width: fit-content;
}
.head-actions {
  display: flex;
  align-items: center;
  gap: 12px 10px;
  flex: none;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.kpi-row {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
  margin: 16px 0;
}
.tabs-card {
  padding: 8px 20px 20px;
}
.tab-count {
  display: inline-block;
  margin-left: 4px;
  padding: 0 5px;
  border-radius: var(--radius-md);
  background: var(--ink-50);
  color: var(--color-text-secondary);
  font-size: 11px;
  font-weight: 400;
}
.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 14px;
}
.overview-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  gap: 24px;
}
.overview-progress {
  padding: 4px 4px 0;
}
.progress-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.progress-value {
  font-size: 30px;
  font-weight: 600;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
}
.done-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 8px;
  height: 20px;
  border: var(--hairline);
  border-radius: var(--radius-xs);
  color: var(--color-text-secondary);
  font-size: var(--font-size-micro);
}
.done-chip::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--signal-ok);
}
.progress-bar {
  margin-top: 12px;
  height: 10px;
  border-radius: var(--radius-sm);
  background: var(--ink-50);
  overflow: hidden;
}
.progress-fill {
  display: block;
  height: 100%;
  border-radius: var(--radius-sm);
  background: var(--ink-950);
  transition: width 0.4s ease;
}
.progress-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: var(--color-text-tertiary);
}
.overview-facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 16px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px dashed var(--color-border-light);
}
.fact {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.fact-label {
  font-size: 12px;
  color: var(--color-text-tertiary);
}
.fact-value {
  font-size: 13.5px;
  color: var(--color-text);
  font-weight: 500;
}
.overview-calendar {
  padding: 4px 4px 0;
}
.calendar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.calendar-month {
  font-size: 12.5px;
  color: var(--color-text-secondary);
}
.calendar-legend {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--color-text-tertiary);
}
.legend-block {
  width: 10px;
  height: 10px;
  border-radius: var(--radius-xs);
  display: inline-block;
  margin-left: 4px;
}
.legend-block.level-0 {
  background: var(--ink-50);
}
.legend-block.level-1 {
  background: var(--ink-100);
}
.legend-block.level-2 {
  background: var(--ink-300);
}
.legend-block.level-3 {
  background: var(--ink-800);
}
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}
.calendar-weekday {
  text-align: center;
  font-size: 11px;
  color: var(--color-text-tertiary);
  padding-bottom: 2px;
}
.calendar-cell {
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-xs);
  font-size: var(--font-size-micro);
  color: var(--color-text-secondary);
  font-variant-numeric: tabular-nums;
  background: var(--ink-25);
  border: 1px solid transparent;
}
.calendar-cell.level--1 {
  background: transparent;
}
.calendar-cell.level-0 {
  background: var(--ink-50);
  color: var(--color-text-tertiary);
}
.calendar-cell.level-1 {
  background: var(--ink-100);
  color: var(--color-text-secondary);
}
.calendar-cell.level-2 {
  background: var(--ink-300);
  color: var(--color-text);
}
.calendar-cell.level-3 {
  background: var(--ink-800);
  color: var(--color-text-inverse);
}
.tab-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
}
.source-pill {
  background: var(--ink-50);
  color: var(--color-text-secondary);
  font-weight: 400;
}
.dimension-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  font-size: 12px;
}
.dimension-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}
.dimension-chart {
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  padding: 10px 6px;
  background: var(--color-surface);
}
.dimension-table :deep(.el-table) {
  font-size: 12.5px;
}
.log-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-height: 120px;
}
.log-item {
  display: flex;
  gap: 12px;
  padding: 14px 4px;
  border-bottom: 1px solid #f0f3f8;
}
.log-item:last-child {
  border-bottom: none;
}
.log-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-accent);
  margin-top: 7px;
  flex: none;
  
}
.log-main {
  flex: 1;
  min-width: 0;
}
.log-title {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 13px;
}
.log-operator {
  color: var(--color-text-secondary);
}
.log-time {
  color: var(--color-text-tertiary);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.log-detail {
  margin-top: 4px;
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.7;
  word-break: break-all;
}
.log-detail.before {
  color: var(--color-text-tertiary);
}
.dialog-tip {
  margin-bottom: 14px;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  background: var(--ink-25);
  font-size: 12px;
  line-height: 1.7;
  color: var(--color-text-secondary);
}
.dialog-error {
  margin-top: 4px;
  font-size: 12px;
  color: var(--color-text);
}
.mock-layout {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 18px;
}
.mock-form :deep(.el-form-item) {
  margin-bottom: 12px;
}
.mock-preview {
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  padding: 8px 8px 4px;
  background: var(--color-surface);
}
.mock-totals {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
  padding: 8px 10px 10px;
  border-top: 1px dashed var(--color-border-light);
}
.mock-totals div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.mock-totals span {
  font-size: 11px;
  color: var(--color-text-tertiary);
}
.mock-totals strong {
  font-size: 13px;
  color: var(--color-text);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.right {
  text-align: right;
  display: inline-block;
  width: 100%;
}

@media (max-width: 1280px) {
  .kpi-row {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .overview-grid,
  .dimension-layout,
  .mock-layout {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
