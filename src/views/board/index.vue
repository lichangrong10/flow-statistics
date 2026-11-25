<template>
  <div class="page board-page">
    <div class="board-topbar">
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
      <div class="board-top-actions">
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
        <el-tooltip content="刷新" placement="top">
          <el-button class="refresh-btn" :icon="Refresh" :loading="loading" @click="load" />
        </el-tooltip>
      </div>
    </div>

    <div class="board-panel">
      <div class="board-summary">
        <div class="summary-title">投放总数据</div>
        <p class="summary-line">
          本次广告投放共计完成：原计划投放
          <strong>{{ formatNumber(summary?.targetImpressions) }}</strong>
          人次曝光量，实际完成
          <strong>{{ formatNumber(summary?.impressions) }}</strong>
          人次曝光量。
        </p>
        <div class="summary-meta">
          <span>曝光完成率 <b>{{ summary ? formatPercent(summary.completionRate, 2) : '—' }}</b></span>
          <span>曝光人数 <b>{{ formatNumber(summary?.reach) }}</b></span>
          <span>点击率 <b>{{ summary ? formatPercent(summary.clickRate, 2) : '—' }}</b></span>
        </div>
      </div>

      <div class="board-toolbar">
        <div class="board-actions">
          <el-button type="primary" :icon="Download" @click="download">导出数据</el-button>
          <el-input
            v-model="keyword"
            class="board-search"
            :prefix-icon="Search"
            :placeholder="searchPlaceholder"
            clearable
          />
          <button type="button" class="filter-chip">
            <el-icon><Filter /></el-icon>
            全部项目
          </button>
        </div>

        <div class="board-tools">
          <el-popover placement="bottom-end" :width="150" trigger="click">
            <template #reference>
              <el-button link class="tool-icon" :icon="Operation" aria-label="自定义列" />
            </template>
            <div class="column-options">
              <div class="column-options-title">显示指标</div>
              <el-checkbox v-model="visible.reach">曝光人数</el-checkbox>
              <el-checkbox v-model="visible.clicks">点击人数</el-checkbox>
              <el-checkbox v-model="visible.rate">点击率</el-checkbox>
            </div>
          </el-popover>
          <el-tooltip content="下载" placement="top">
            <el-button link class="tool-icon" :icon="Download" aria-label="下载" @click="download" />
          </el-tooltip>
        </div>
      </div>

      <div class="board-table-scroll">
        <div class="board-scroll-hint">左右滑动查看完整表格</div>
        <el-table
          v-loading="loading"
          class="board-table"
          :data="filteredRows"
          :show-summary="filteredRows.length > 0"
          :summary-method="summaryMethod"
          row-key="key"
          :border="false"
          @selection-change="onSelectionChange"
        >
          <el-table-column type="selection" width="44" />
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
        <span>共 {{ filteredRows.length }} 条记录，每页显示 100 条</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import dayjs from 'dayjs'
import { Download, Filter, InfoFilled, Operation, Refresh, Search } from '@element-plus/icons-vue'
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

const keyword = ref('')
const selectedRows = ref<BoardRow[]>([])

const dimensionLabel = computed(() => {
  if (dimType.value === 'region') return '地区'
  if (dimType.value === 'gender') return '性别'
  return '年龄'
})

const searchPlaceholder = computed(() => `搜索${dimensionLabel.value}`)

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

const filteredRows = computed(() => {
  const text = keyword.value.trim()
  if (!text) return rows.value
  return rows.value.filter((row) => row.dimension.includes(text))
})

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
  keyword.value = ''
  selectedRows.value = []
  void load()
}

function onSelectionChange(rows: BoardRow[]) {
  selectedRows.value = rows
}

function summaryMethod({ columns }: { columns: { property?: string }[] }): string[] {
  return columns.map((column, index) => {
    if (!column.property) return index === 1 ? '总计' : ''
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
  const source = selectedRows.value.length ? selectedRows.value : filteredRows.value
  const data = source.map((row) => {
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
  --board-accent: var(--ink-950);
  --board-border: #e5e7eb;
  --board-head: #f7f8fa;
}

.board-date {
  width: 270px;
}

.board-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--board-border);
}
.board-top-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
}
.refresh-btn {
  width: 32px;
  height: 32px;
}

.board-panel {
  overflow: hidden;
  background: var(--color-surface);
  border: 1px solid var(--board-border);
  border-radius: var(--radius-md);
}

.board-summary {
  padding: 18px 16px 16px;
  border-bottom: 1px solid var(--board-border);
}
.summary-title {
  color: var(--color-text);
  font-size: 14px;
  font-weight: 600;
}
.summary-line {
  margin: 8px 0 0;
  color: var(--color-text-secondary);
  font-size: 12.5px;
  line-height: 1.8;
}
.summary-line strong {
  margin: 0 2px;
  color: var(--color-text);
  font-size: 14px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.summary-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 24px;
  margin-top: 10px;
  color: var(--color-text-tertiary);
  font-size: 11.5px;
}
.summary-meta b {
  margin-left: 3px;
  color: var(--color-text-secondary);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.board-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--board-border);
}
.board-actions {
  display: flex;
  align-items: center;
  flex: 1;
  flex-wrap: wrap;
  gap: 10px;
  min-width: 0;
}
.board-search {
  width: 240px;
}
.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--board-border);
  border-radius: var(--radius-xs);
  background: #fbfcfd;
  color: var(--color-text-secondary);
  font-family: inherit;
  font-size: 12px;
  cursor: default;
}

.dimension-tabs {
  display: flex;
  align-items: stretch;
  height: 46px;
  overflow-x: auto;
  scrollbar-width: none;
}
.dimension-tabs::-webkit-scrollbar {
  display: none;
}

.dimension-tab {
  position: relative;
  flex: none;
  height: 46px;
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
  color: var(--color-text);
  font-weight: 600;
}
.dimension-tab.active::after {
  position: absolute;
  right: 16px;
  bottom: -1px;
  left: 16px;
  height: 2px;
  background: var(--board-accent);
  content: '';
}

.board-tools {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: none;
}
.tool-icon {
  color: var(--color-text-secondary);
  font-size: 16px;
}
.tool-icon:hover {
  color: var(--color-text);
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
  --el-table-row-hover-bg-color: var(--ink-25);
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
  background: var(--ink-25);
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
  .board-topbar {
    align-items: stretch;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 10px;
  }
  .board-top-actions {
    width: 100%;
    min-width: 0;
  }
  .board-date {
    flex: 1;
    width: auto !important;
    min-width: 0;
    max-width: 100%;
  }
  .refresh-btn {
    flex: none;
  }
  .dimension-tabs {
    width: 100%;
    padding: 0;
  }
  .dimension-tab {
    padding: 0 12px;
  }
  .dimension-tab.active::after {
    right: 12px;
    left: 12px;
  }
  .board-summary {
    padding: 14px 12px 12px;
  }
  .summary-meta {
    gap: 4px 14px;
  }
  .board-toolbar {
    align-items: stretch;
    flex-direction: column;
    gap: 8px;
    padding: 10px 12px;
  }
  .board-actions {
    width: 100%;
    flex-wrap: wrap;
  }
  .board-actions > .el-button {
    order: 1;
  }
  .filter-chip {
    order: 2;
  }
  .board-search {
    flex: 1 0 100%;
    order: 3;
    width: 100%;
    min-width: 0;
  }
  .board-tools {
    width: 100%;
    justify-content: flex-end;
    padding: 0;
    border-bottom: none;
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
