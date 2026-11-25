<template>
  <div class="page board-page">
    <PageHeader
      title="数据看板"
      subtitle="全部项目 · 按地域、性别、年龄查看投放数据"
    >
      <template #extra>
        <el-date-picker
          v-model="dateRange"
          class="board-date"
          type="daterange"
          value-format="YYYY-MM-DD"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :clearable="false"
          :disabled-date="disableFuture"
          @change="load"
        />
        <el-button :icon="Refresh" :loading="loading" @click="load">刷新</el-button>
      </template>
    </PageHeader>

    <div class="board-panel">
      <div class="board-toolbar">
        <div class="dimension-tabs" role="tablist" aria-label="数据维度">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            class="dimension-tab"
            :class="{ active: dimType === tab.key }"
            @click="changeDim(tab.key)"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="board-tools">
          <el-popover placement="bottom-end" :width="150" trigger="click">
            <template #reference>
              <el-button link class="tool-btn" :icon="Operation">自定义列</el-button>
            </template>
            <div class="column-options">
              <div class="column-options-title">显示指标</div>
              <el-checkbox v-model="visible.reach">曝光人数</el-checkbox>
              <el-checkbox v-model="visible.clicks">点击人数</el-checkbox>
              <el-checkbox v-model="visible.rate">点击率</el-checkbox>
            </div>
          </el-popover>
          <el-button link class="tool-btn" :icon="Download" @click="download">下载</el-button>
        </div>
      </div>

      <div class="board-context">
        <span>统计周期：{{ dateRange[0] }} 至 {{ dateRange[1] }}</span>
        <span class="context-sep">·</span>
        <span>全部项目</span>
        <span class="context-spacer" />
        <span>共 {{ rows.length }} 条记录</span>
      </div>

      <div class="board-table-scroll">
        <div class="board-scroll-hint">左右滑动查看完整表格</div>
        <el-table
          v-loading="loading"
          class="board-table"
          :data="rows"
          :show-summary="rows.length > 0"
          :summary-method="summaryMethod"
          row-key="key"
          :border="false"
        >
          <el-table-column :label="dimensionLabel" min-width="180">
            <template #default="{ row }">
              <span class="dimension-cell">{{ row.dimension }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="impressions" label="曝光次数" min-width="150" align="right">
            <template #default="{ row }">{{ formatNumber(row.impressions) }}</template>
          </el-table-column>
          <el-table-column v-if="visible.reach" prop="reach" label="曝光人数" min-width="140" align="right">
            <template #default="{ row }">{{ formatNumber(row.reach) }}</template>
          </el-table-column>
          <el-table-column v-if="visible.clicks" prop="clicks" label="点击人数" min-width="140" align="right">
            <template #default="{ row }">{{ formatNumber(row.clicks) }}</template>
          </el-table-column>
          <el-table-column v-if="visible.rate" prop="rate" label="点击率" min-width="120" align="right">
            <template #default="{ row }">{{ row.rate === null ? '—' : formatPercent(row.rate, 2) }}</template>
          </el-table-column>
          <template #empty>
            <EmptyState description="暂无数据" hint="请调整统计周期后重试" />
          </template>
        </el-table>
      </div>

      <div class="board-footer">
        <span class="updated-at">
          <el-icon><InfoFilled /></el-icon>
          数据最后更新时间：{{ updatedAt }}
        </span>
        <span>共 {{ rows.length }} 条记录，每页显示 100 条</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import dayjs from 'dayjs'
import { Download, InfoFilled, Operation, Refresh } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import EmptyState from '@/components/EmptyState.vue'
import { getDashboardDimensions, getDashboardSummary } from '@/api/dashboard'
import type { DashboardSummary, DimensionValue, DimType } from '@/types'
import { lastNDays } from '@/utils/date'
import { formatNumber, formatPercent } from '@/utils/format'
import { ElMessage } from 'element-plus'

interface DimensionTab {
  key: DimType
  label: string
}

interface BoardRow {
  key: string
  dimension: string
  impressions: number
  reach: number | null
  clicks: number | null
  rate: number | null
}

const tabs: DimensionTab[] = [
  { key: 'region', label: '省级地域分布' },
  { key: 'gender', label: '性别分布' },
  { key: 'age', label: '年龄分布' },
]

const dateRange = ref<[string, string]>([lastNDays(14).from, lastNDays(14).to])
const dimType = ref<DimType>('region')
const dimensionItems = ref<DimensionValue[]>([])
const summary = ref<DashboardSummary | null>(null)
const loading = ref(true)
const visible = ref({ reach: true, clicks: true, rate: true })

const dimensionLabel = computed(() => {
  if (dimType.value === 'region') return '地区'
  if (dimType.value === 'gender') return '性别'
  return '年龄'
})

const rows = computed<BoardRow[]>(() =>
  dimensionItems.value.map((item) => {
    const impressions = Number(item.value)
    const reach = item.reach === undefined ? null : Number(item.reach)
    const clicks = item.clicks === undefined ? null : Number(item.clicks)
    const rate = reach && clicks !== null ? clicks / reach : null
    const name = item.dimName
    return {
      key: `${dimType.value}-${item.dimKey}`,
      dimension: dimType.value === 'age' ? (name.endsWith('岁') ? name : `${name}岁`) : name,
      impressions: Number.isFinite(impressions) ? impressions : 0,
      reach: reach !== null && Number.isFinite(reach) ? reach : null,
      clicks: clicks !== null && Number.isFinite(clicks) ? clicks : null,
      rate: rate !== null && Number.isFinite(rate) ? rate : null,
    }
  }),
)

const updatedAt = computed(() =>
  summary.value?.dataUpdatedAt ? dayjs(summary.value.dataUpdatedAt).format('YYYY-MM-DD HH:mm') : '—',
)

function disableFuture(date: Date) {
  return date.getTime() > new Date(dayjs().format('YYYY-MM-DD')).getTime()
}

async function load() {
  loading.value = true
  try {
    const [dimensionData, summaryData] = await Promise.all([
      getDashboardDimensions({
        dimType: dimType.value,
        from: dateRange.value[0],
        to: dateRange.value[1],
      }),
      getDashboardSummary({
        from: dateRange.value[0],
        to: dateRange.value[1],
        compare: 'previous',
      }),
    ])
    dimensionItems.value = dimensionData.items
    summary.value = summaryData
  } catch (error) {
    dimensionItems.value = []
    summary.value = null
    ElMessage.error((error as Error).message || '数据看板加载失败')
  } finally {
    loading.value = false
  }
}

function changeDim(type: DimType) {
  if (dimType.value === type) return
  dimType.value = type
  void load()
}

function summaryMethod({ columns }: { columns: { property?: string }[] }): string[] {
  return columns.map((column, index) => {
    if (index === 0) return '总计'
    if (column.property === 'impressions') return formatNumber(summary.value?.impressions)
    if (column.property === 'reach') return formatNumber(summary.value?.reach)
    if (column.property === 'clicks') return formatNumber(summary.value?.clicks)
    if (column.property === 'rate') {
      return summary.value ? formatPercent(summary.value.clickRate, 2) : '—'
    }
    return ''
  })
}

async function download() {
  const header = [dimensionLabel.value, '曝光次数']
  if (visible.value.reach) header.push('曝光人数')
  if (visible.value.clicks) header.push('点击人数')
  if (visible.value.rate) header.push('点击率')
  const data = rows.value.map((row) => {
    const line = [row.dimension, row.impressions]
    if (visible.value.reach) line.push(row.reach ?? '')
    if (visible.value.clicks) line.push(row.clicks ?? '')
    if (visible.value.rate) line.push(row.rate === null ? '' : formatPercent(row.rate, 2))
    return line
  })
  const XLSX = await import('xlsx')
  const sheet = XLSX.utils.aoa_to_sheet([header, ...data])
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, sheet, '数据看板')
  XLSX.writeFile(book, `数据看板-${dateRange.value[0]}-${dateRange.value[1]}.xlsx`)
}

onMounted(() => {
  void load()
})
</script>

<style scoped>
.board-page {
  --board-blue: #0057ff;
  --board-border: #e5e7eb;
  --board-head: #f7f8fa;
}

.board-date {
  width: 270px;
}

.board-panel {
  overflow: hidden;
  background: var(--color-surface);
  border: 1px solid var(--board-border);
  border-radius: var(--radius-md);
}

.board-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 52px;
  padding: 0 16px;
  border-bottom: 1px solid var(--board-border);
}

.dimension-tabs {
  display: flex;
  align-items: stretch;
  height: 52px;
  overflow-x: auto;
  scrollbar-width: none;
}
.dimension-tabs::-webkit-scrollbar {
  display: none;
}

.dimension-tab {
  position: relative;
  flex: none;
  padding: 0 16px;
  border: 0;
  background: transparent;
  color: var(--color-text-secondary);
  font-family: inherit;
  font-size: 13.5px;
  cursor: pointer;
  white-space: nowrap;
}
.dimension-tab:hover {
  color: var(--color-text);
}
.dimension-tab.active {
  color: var(--board-blue);
  font-weight: 600;
}
.dimension-tab.active::after {
  position: absolute;
  right: 16px;
  bottom: -1px;
  left: 16px;
  height: 2px;
  background: var(--board-blue);
  content: '';
}

.board-tools {
  display: flex;
  align-items: center;
  gap: 18px;
  flex: none;
}
.tool-btn {
  color: var(--color-text-secondary);
  font-size: 12.5px;
}
.tool-btn:hover {
  color: var(--board-blue);
}
.column-options {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.column-options-title {
  margin-bottom: 4px;
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.board-context {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  color: var(--color-text-tertiary);
  font-size: 12px;
  background: #fbfcfd;
  border-bottom: 1px solid var(--board-border);
}
.context-sep {
  color: #c9ced6;
}
.context-spacer {
  flex: 1;
}

.board-table-scroll {
  overflow-x: auto;
}
.board-scroll-hint {
  display: none;
}
.board-table {
  min-width: 760px;
  --el-table-border-color: var(--board-border);
  --el-table-header-bg-color: var(--board-head);
  --el-table-row-hover-bg-color: #f5f8ff;
}
.board-table :deep(.el-table__header th.el-table__cell) {
  height: 44px;
  background: var(--board-head);
  color: var(--color-text-secondary);
  font-weight: 600;
  font-size: 12.5px;
}
.board-table :deep(.el-table__body td.el-table__cell) {
  height: 52px;
  font-size: 12.5px;
}
.board-table :deep(.el-table__body tr:hover > td.el-table__cell) {
  background: #f5f8ff;
}
.board-table :deep(.el-table__footer-wrapper td.el-table__cell) {
  height: 48px;
  background: #fbfcfd;
  font-weight: 600;
  font-size: 12.5px;
}
.dimension-cell {
  color: var(--color-text);
  font-weight: 500;
}

.board-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 13px 16px;
  color: var(--color-text-tertiary);
  font-size: 12px;
  border-top: 1px solid var(--board-border);
}
.updated-at {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

@media (max-width: 720px) {
  .board-date {
    width: 100%;
  }
  .board-toolbar {
    align-items: flex-start;
    flex-direction: column;
    padding: 0;
  }
  .dimension-tabs {
    width: 100%;
    padding: 0 8px;
    border-bottom: 1px solid var(--board-border);
  }
  .dimension-tab {
    padding: 0 12px;
  }
  .dimension-tab.active::after {
    right: 12px;
    left: 12px;
  }
  .board-tools {
    width: 100%;
    justify-content: flex-end;
    padding: 6px 12px;
    border-bottom: 1px solid var(--board-border);
  }
  .board-context {
    flex-wrap: wrap;
    padding: 10px 12px;
    line-height: 1.6;
  }
  .context-spacer {
    display: none;
  }
  .board-footer {
    align-items: flex-start;
    flex-direction: column;
    padding: 10px 12px;
  }
  .board-scroll-hint {
    display: block;
    padding: 8px 12px 0;
    color: var(--color-text-tertiary);
    font-size: 11px;
  }
}
</style>
