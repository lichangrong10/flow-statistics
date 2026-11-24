<template>
  <div class="page">
    <PageHeader title="投放计划" :subtitle="subtitle">
      <template #extra>
        <el-button :icon="Refresh" @click="load">刷新</el-button>
        <el-button type="primary" :icon="Plus" @click="goCreate">新建投放计划</el-button>
      </template>
    </PageHeader>

    <FilterBar :loading="loading" @search="onSearch" @reset="onReset">
      <div class="field">
        <span class="field-label">计划名称</span>
        <el-input
          v-model="filters.keyword"
          placeholder="模糊匹配，回车查询"
          clearable
          style="width: 190px"
          @keyup.enter="onSearch"
        />
      </div>
      <div class="field">
        <span class="field-label">投放单号</span>
        <el-input
          v-model="filters.code"
          placeholder="精确匹配 / 扫码枪录入"
          clearable
          style="width: 210px"
          @keyup.enter="onSearch"
        />
      </div>
      <div class="field">
        <span class="field-label">渠道</span>
        <el-select
          v-model="filters.channel"
          multiple
          collapse-tags
          clearable
          placeholder="全部渠道"
          style="width: 170px"
        >
          <el-option
            v-for="item in channelOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </div>
      <div class="field">
        <span class="field-label">投放周期</span>
        <el-date-picker
          v-model="filters.dateRange"
          type="daterange"
          value-format="YYYY-MM-DD"
          range-separator="至"
          start-placeholder="开始"
          end-placeholder="结束"
          style="width: 250px"
        />
      </div>
    </FilterBar>

    <div class="card list-card">
      <div class="list-head">
        <div class="list-meta">
          共 <span class="num strong">{{ total }}</span> 条计划
          <span v-if="selection.length" class="selected-tip">
            已选 {{ selection.length }} 条
          </span>
        </div>
        <div class="list-actions">
          <el-button
            text
            :disabled="!selection.length"
            :loading="exporting"
            @click="batchExport"
          >
            批量导出
          </el-button>
          <el-button
            v-if="user.isAdmin"
            text
            :disabled="!canArchive"
            @click="batchArchive"
          >
            批量归档
          </el-button>
          <span class="divider" />
          <el-radio-group v-model="pageSize" size="small" @change="onPageSizeChange">
            <el-radio-button :value="20">20</el-radio-button>
            <el-radio-button :value="50">50</el-radio-button>
            <el-radio-button :value="100">100</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <div class="status-tabs" role="tablist" aria-label="按状态筛选">
        <button
          type="button"
          class="status-tab"
          :class="{ active: !filters.status }"
          @click="selectStatus('')"
        >
          全部
        </button>
        <button
          v-for="item in STATUS_OPTIONS"
          :key="item.value"
          type="button"
          class="status-tab"
          :class="{ active: filters.status === item.value }"
          @click="selectStatus(item.value)"
        >
          <span class="status-dot" :style="{ background: STATUS_META[item.value].color }" />
          {{ item.label }}
        </button>
      </div>

      <div class="table-scroll">
        <DataTable
          :columns="columns"
          :data="rows as unknown as Record<string, unknown>[]"
          :loading="loading"
          :total="total"
          :page="page"
          :page-size="pageSize"
          :selectable="true"
          :show-pager="true"
          :row-key="'id'"
          :row-class-name="listRowClass"
          :empty-type="hasFilter ? 'no-result' : 'no-data'"
          empty-title=""
          :empty-desc="hasFilter ? '试试调整筛选条件，或清空后重新查询' : '还没有投放计划，先创建第一条计划吧'"
          :empty-action="hasFilter ? '' : '新建投放计划'"
          @selection-change="onSelectionChange"
          @page-change="onPageChange"
          @size-change="onPageSizeChange"
          @row-click="(row) => goDetail(row as unknown as CampaignListItem)"
          @empty-action="goCreate"
        >

        <template #name="{ row }">
              <div class="name-cell">
                <div class="name-text" :title="String(row.name)">{{ row.name }}</div>
                <div class="name-sub">
                  <el-tooltip v-if="row.code" content="点击复制投放单号" placement="top">
                    <span class="code-cell mono" @click.stop="copyCode(row as unknown as CampaignListItem)">
                      {{ row.code }}
                    </span>
                  </el-tooltip>
                  <span v-else class="tertiary">未生成单号</span>
                </div>
              </div>
            </template>

        <template #channel="{ row }">
          <ChannelTag :channel="(row as unknown as CampaignListItem).channel" />
        </template>

        <template #vendors="{ row }">
              <el-tooltip
                v-if="(row as unknown as CampaignListItem).vendors.length"
                placement="top"
              >
                <template #content>
                  <div v-for="vendor in (row as unknown as CampaignListItem).vendors" :key="vendor.id">
                    {{ vendor.name }}
                  </div>
                </template>
                <span class="vendor-count">{{ (row as unknown as CampaignListItem).vendors.length }} 家</span>
              </el-tooltip>
              <span v-else class="tertiary">—</span>
            </template>

        <template #status="{ row }">
          <StatusTag :status="(row as unknown as CampaignListItem).status" />
        </template>

        <template #schedule="{ row }">
              <div class="schedule-cell">
                <span class="num">{{ row.startDate }} → {{ String(row.endDate).slice(5) }}</span>
                <span v-if="row.status === 'running' && row.dayIndex" class="day-badge">
                  第{{ row.dayIndex }}天
                </span>
              </div>
            </template>
            <template #exposure="{ row }">
              <div class="exposure-cell">
                <span class="num exposure-actual">{{ formatNumber(row.impressions as string) }}</span>
                <span class="exposure-sep">/</span>
                <span class="num exposure-target">{{ formatNumber(row.targetImpressions as string) }}</span>
              </div>
            </template>

        <template #completion="{ row }">
          <span
            v-if="row.completionRate"
            class="num completion"
            :class="{ over: Number(row.completionRate) >= 1 }"
          >
            {{ formatPercent(row.completionRate as string, 2) }}
          </span>
          <span v-else class="tertiary">—</span>
        </template>

        <template #actions="{ row }">
          <div class="row-actions" @click.stop>
            <el-button
              v-for="action in actionsFor(row as unknown as CampaignListItem)"
              :key="action.key"
              link
              :type="action.danger ? 'danger' : 'primary'"
              @click="onAction(action.key, row as unknown as CampaignListItem)"
            >
              {{ action.label }}
            </el-button>
          </div>
        </template>
      </DataTable>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import FilterBar from '@/components/FilterBar.vue'
import DataTable from '@/components/DataTable.vue'
import StatusTag from '@/components/StatusTag.vue'
import ChannelTag from '@/components/ChannelTag.vue'
import VendorTags from '@/components/VendorTags.vue'
import { useDictStore } from '@/stores/dict'
import { useUserStore } from '@/stores/user'
import {
  approveCampaign,
  closeCampaign,
  deleteCampaign,
  finishCampaign,
  getCampaigns,
  pauseCampaign,
  publishCampaign,
  rejectCampaign,
  resumeCampaign,
  submitCampaign,
  withdrawCampaign,
} from '@/api/campaign'
import { createReportTask } from '@/api/report'
import type { CampaignListItem, CampaignStatus, ChannelCode, TableColumn } from '@/types'
import { STATUS_META, STATUS_OPTIONS } from '@/constants'
import { lastNDays } from '@/utils/date'
import { formatNumber, formatPercent } from '@/utils/format'

interface RowAction {
  key: string
  label: string
  danger?: boolean
}

const router = useRouter()
const route = useRoute()
const user = useUserStore()
const dict = useDictStore()

const filters = reactive({
  keyword: '',
  code: '',
  channel: [] as ChannelCode[],
  status: '' as CampaignStatus | '',
  dateRange: [] as string[],
})

const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const rows = ref<CampaignListItem[]>([])
const loading = ref(false)
const exporting = ref(false)
const selection = ref<CampaignListItem[]>([])
const highlightId = ref(Number(route.query.highlight) || 0)

const channelOptions = computed(() => {
  const source = dict.enabledChannels.length ? dict.enabledChannels : dict.channels
  if (source.length) return source.map((item) => ({ value: item.code, label: item.name }))
  return [
    { value: 'douyin', label: '抖音' },
    { value: 'wechat', label: '微信' },
    { value: 'xiaohongshu', label: '小红书' },
    { value: 'kuaishou', label: '快手' },
    { value: 'baidu', label: '百度' },
  ]
})

const hasFilter = computed(
  () =>
    Boolean(filters.keyword || filters.code || filters.status) ||
    filters.channel.length > 0 ||
    filters.dateRange.length === 2,
)

const subtitle = computed(
  () => `全部项目 · ${user.isAdmin ? '管理员视图，可见全部计划' : '仅可见本人创建的计划'}`,
)

const canArchive = computed(
  () => selection.value.length > 0 && selection.value.every((item) => item.status === 'finished'),
)

const columns: TableColumn[] = [
  { prop: 'name', label: '计划', width: 220, align: 'center', slot: 'name' },
  { prop: 'status', label: '状态', minWidth: 90, align: 'center', slot: 'status' },
  { prop: 'channel', label: '渠道', minWidth: 84, align: 'center', slot: 'channel' },
  { prop: 'vendors', label: '厂商', minWidth: 54, align: 'center', slot: 'vendors' },
  { prop: 'startDate', label: '排期', minWidth: 170, align: 'center', slot: 'schedule' },
  { prop: 'impressions', label: '曝光量（实际 / 计划）', minWidth: 150, align: 'center', slot: 'exposure' },
  { prop: 'completionRate', label: '完成率', minWidth: 84, align: 'center', slot: 'completion' },
  { prop: 'actions', label: '操作', width: 166, fixed: 'right', align: 'center', slot: 'actions' },
]

function str(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function listRowClass({ row }: { row: Record<string, unknown> }): string {
  return Number(row.id) === highlightId.value ? 'row-highlight' : ''
}

function hydrateFromQuery() {
  filters.keyword = str(route.query.keyword)
  filters.code = str(route.query.code)
  filters.channel = str(route.query.channel)
    ? (str(route.query.channel).split(',') as ChannelCode[])
    : []
  filters.status = (str(route.query.status) as CampaignStatus) || ''
  const from = str(route.query.from)
  const to = str(route.query.to)
  filters.dateRange = from && to ? [from, to] : []
  page.value = Number(route.query.page) || 1
  pageSize.value = Number(route.query.pageSize) || 20
}

function syncQuery() {
  const query: Record<string, string> = {}
  if (highlightId.value) query.highlight = String(highlightId.value)
  if (filters.keyword) query.keyword = filters.keyword
  if (filters.code) query.code = filters.code
  if (filters.channel.length) query.channel = filters.channel.join(',')
  if (filters.status) query.status = filters.status
  if (filters.dateRange.length === 2) {
    query.from = filters.dateRange[0]
    query.to = filters.dateRange[1]
  }
  if (page.value > 1) query.page = String(page.value)
  if (pageSize.value !== 20) query.pageSize = String(pageSize.value)
  router.replace({ query })
}

async function load() {
  loading.value = true
  try {
    const result = await getCampaigns({
      page: page.value,
      pageSize: pageSize.value,
      keyword: filters.keyword.trim(),
      code: filters.code.trim(),
      channel: filters.channel,
      status: filters.status,
      dateFrom: filters.dateRange[0],
      dateTo: filters.dateRange[1],
    })
    rows.value = result.items
    total.value = result.total
  } catch (error) {
    rows.value = []
    total.value = 0
    ElMessage.error((error as Error).message || '计划列表加载失败')
  } finally {
    loading.value = false
  }
}

function selectStatus(status: CampaignStatus | '') {
  if (filters.status === status) return
  filters.status = status
  page.value = 1
  void load()
}

function onSearch() {
  page.value = 1
  syncQuery()
  load()
}

function onReset() {
  filters.keyword = ''
  filters.code = ''
  filters.channel = []
  filters.status = ''
  filters.dateRange = []
  page.value = 1
  syncQuery()
  load()
}

function onPageChange(value: number) {
  page.value = value
  syncQuery()
  load()
}

function onPageSizeChange(value: number) {
  pageSize.value = value
  page.value = 1
  syncQuery()
  load()
}

function onSelectionChange(list: unknown[]) {
  selection.value = list as CampaignListItem[]
}

function goCreate() {
  router.push('/campaign/create')
}

function goDetail(row: CampaignListItem) {
  router.push(`/campaign/${row.id}`)
}

async function copyCode(row: CampaignListItem) {
  if (!row.code) return
  try {
    await navigator.clipboard.writeText(row.code)
    ElMessage.success(`已复制投放单号 ${row.code}`)
  } catch {
    ElMessage.warning('复制失败，请手动选择单号复制')
  }
}

function actionsFor(row: CampaignListItem): RowAction[] {
  const admin = user.isAdmin
  const can = (perm: string) => user.hasPerm(perm)
  switch (row.status) {
    case 'draft':
      return [
        ...(can('campaign:update') ? [{ key: 'edit', label: '编辑' }] : []),
        ...(can('campaign:submit') ? [{ key: 'submit', label: '提交审核' }] : []),
        ...(admin ? [{ key: 'delete', label: '删除', danger: true }] : []),
      ]
    case 'pending':
      return [
        { key: 'view', label: '查看' },
        ...(!admin ? [{ key: 'withdraw', label: '撤回' }] : []),
        ...(admin
          ? [
              { key: 'approve', label: '通过' },
              { key: 'reject', label: '驳回', danger: true },
            ]
          : []),
      ]
    case 'scheduled':
      return [
        { key: 'view', label: '查看' },
        ...(admin ? [{ key: 'publish', label: '发布' }] : []),
        { key: 'copy', label: '复制' },
      ]
    case 'running':
      return [
        { key: 'view', label: '查看' },
        ...(admin ? [{ key: 'pause', label: '暂停' }] : []),
        ...(can('stats:write') ? [{ key: 'stats', label: '录入' }] : []),
      ]
    case 'paused':
      return [
        { key: 'view', label: '查看' },
        ...(admin
          ? [
              { key: 'resume', label: '恢复' },
              { key: 'finish', label: '结束', danger: true },
            ]
          : []),
      ]
    case 'finished':
      return [
        { key: 'view', label: '查看' },
        ...(admin ? [{ key: 'close', label: '结案' }] : []),
      ]
    case 'closed':
      return [
        { key: 'view', label: '查看' },
        { key: 'report', label: '导出' },
      ]
    default:
      return [{ key: 'view', label: '查看' }]
  }
}

async function refreshAfter(message: string) {
  ElMessage.success(message)
  await load()
}

async function onAction(key: string, row: CampaignListItem) {
  try {
    switch (key) {
      case 'view':
        goDetail(row)
        return
      case 'edit':
        router.push(`/campaign/create?mode=edit&id=${row.id}`)
        return
      case 'copy':
        router.push(`/campaign/create?copy=${row.id}`)
        return
      case 'stats':
        router.push(`/stats?campaignId=${row.id}`)
        return
      case 'report':
        router.push(`/report?campaignId=${row.id}`)
        return
      case 'submit': {
        await ElMessageBox.confirm(
          '提交后将进入待审核状态，审核通过前不可编辑。确认提交？',
          '提交审核',
          { confirmButtonText: '提交', cancelButtonText: '取消' },
        )
        await submitCampaign(row.id)
        await refreshAfter('已提交审核，预计一个工作日内完成')
        return
      }
      case 'withdraw': {
        await ElMessageBox.confirm('撤回后计划回到草稿状态，可继续编辑。确认撤回？', '撤回申请', {
          confirmButtonText: '撤回',
          cancelButtonText: '取消',
          type: 'warning',
        })
        await withdrawCampaign(row.id)
        await refreshAfter('已撤回申请')
        return
      }
      case 'approve': {
        await approveCampaign(row.id)
        await refreshAfter('审核通过，计划已进入已排期')
        return
      }
      case 'reject': {
        const result = await ElMessageBox.prompt('请填写驳回原因，将同步给计划创建人', '驳回计划', {
          confirmButtonText: '确认驳回',
          cancelButtonText: '取消',
          inputPlaceholder: '例如：预算与项目阶段不匹配，请调整后重新提交',
          inputValidator: (value: string) => (value?.trim() ? true : '驳回原因不能为空'),
        })
        await rejectCampaign(row.id, result.value)
        await refreshAfter('已驳回，计划回到草稿状态')
        return
      }
      case 'publish': {
        await ElMessageBox.confirm(
          `确认立即发布「${row.name}」？发布后生成投放单号并开始按排期投放。`,
          '发布计划',
          { confirmButtonText: '立即发布', cancelButtonText: '取消' },
        )
        const result = await publishCampaign(row.id)
        await refreshAfter(`发布成功，投放单号 ${result.code}`)
        return
      }
      case 'pause': {
        await ElMessageBox.confirm('暂停后当日投放停止，媒体侧已消耗部分不可撤回。确认暂停？', '暂停投放', {
          confirmButtonText: '暂停',
          cancelButtonText: '取消',
          type: 'warning',
        })
        await pauseCampaign(row.id)
        await refreshAfter('已暂停投放')
        return
      }
      case 'resume': {
        await resumeCampaign(row.id)
        await refreshAfter('已恢复投放')
        return
      }
      case 'finish': {
        await ElMessageBox.confirm('结束后将禁止继续录入数据，并进入结案流程。确认结束投放？', '结束投放', {
          confirmButtonText: '结束投放',
          cancelButtonText: '取消',
          type: 'warning',
        })
        await finishCampaign(row.id)
        await refreshAfter('已结束投放，可生成结案报告')
        return
      }
      case 'close': {
        await ElMessageBox.confirm('结案后计划转为只读，并生成结案报告编号。确认结案？', '结案归档', {
          confirmButtonText: '结案',
          cancelButtonText: '取消',
          type: 'warning',
        })
        const result = await closeCampaign(row.id)
        await refreshAfter(`结案完成，报告编号 ${result.reportNo}`)
        return
      }
      case 'delete': {
        await ElMessageBox.confirm('删除后不可恢复，仅草稿状态可删除。确认删除？', '删除计划', {
          confirmButtonText: '删除',
          cancelButtonText: '取消',
          type: 'warning',
        })
        await deleteCampaign(row.id)
        await refreshAfter('已删除草稿计划')
        return
      }
      default:
        return
    }
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    ElMessage.error((error as Error).message || '操作失败，请稍后重试')
  }
}

async function batchExport() {
  if (!selection.value.length) return
  exporting.value = true
  try {
    const range = lastNDays(90)
    await createReportTask({
      type: 'detail',
      format: 'xlsx',
      from: range.from,
      to: range.to,
      campaignIds: selection.value.map((item) => item.id),
    })
    ElMessage.success(`已创建导出任务（${selection.value.length} 条计划），可在报表中心下载`)
    router.push('/report')
  } catch (error) {
    ElMessage.error((error as Error).message || '导出任务创建失败')
  } finally {
    exporting.value = false
  }
}

async function batchArchive() {
  if (!canArchive.value) {
    ElMessage.warning('批量归档仅支持已结束状态的计划')
    return
  }
  try {
    await ElMessageBox.confirm(
      `将对 ${selection.value.length} 条计划执行结案，结案后转为只读。确认继续？`,
      '批量归档',
      { confirmButtonText: '批量归档', cancelButtonText: '取消', type: 'warning' },
    )
  } catch {
    return
  }
  let success = 0
  for (const item of selection.value) {
    try {
      await closeCampaign(item.id)
      success += 1
    } catch {
      // 单条失败不影响其他记录
    }
  }
  ElMessage.success(`批量归档完成，成功 ${success} 条，失败 ${selection.value.length - success} 条`)
  selection.value = []
  await load()
}


onMounted(() => {
  hydrateFromQuery()
  load()
})
</script>

<style scoped>
.list-card {
  padding: 16px 20px 20px;
}
.list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.list-meta {
  font-size: 13px;
  color: var(--color-text-secondary);
}
.selected-tip {
  margin-left: 10px;
  padding: 1px 8px;
  border-radius: var(--radius-xs);
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-size: 12px;
}
.list-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.divider {
  width: 1px;
  height: 18px;
  background: var(--color-border-light);
  margin: 0 6px;
}
.code-cell {
  display: inline-block;
  font-size: 11.5px;
  color: var(--color-text);
  white-space: nowrap;
  cursor: pointer;
  letter-spacing: 0;
  line-height: 20px;
}
.code-cell:hover {
  color: var(--color-text);
}
.copy-icon {
  font-size: 13px;
  color: #a9b6c5;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s ease;
}
.code-cell:hover .copy-icon {
  opacity: 1;
}
.copy-icon:hover {
  color: var(--color-text);
}
.name-cell {
  min-width: 0;
  text-align: center;
}
.name-text {
  font-size: 13.5px;
  font-weight: 500;
  color: var(--color-text);
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.name-sub {
  margin-top: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 11.5px;
  color: var(--color-text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.vendor-count {
  font-size: 12px;
  color: var(--color-text-secondary);
  cursor: help;
  line-height: 18px;
}
.exposure-cell {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 6px;
  white-space: nowrap;
}
.exposure-actual {
  font-size: 13px;
  color: var(--color-text);
  font-weight: 500;
}
.exposure-sep,
.exposure-target {
  font-size: 11.5px;
  color: var(--color-text-tertiary);
}
.dot-sep {
  color: #cbd4df;
}
.schedule-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 12px;
  color: var(--color-text);
  line-height: 18px;
  white-space: nowrap;
}
.schedule-sub {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--color-text-secondary);
  white-space: nowrap;
}
.day-badge {
  white-space: nowrap;
  flex: none;
  padding: 0 4px;
  height: 16px;
  line-height: 16px;
  border-radius: 4px;
  background: var(--ink-50);
  color: var(--color-text);
  font-size: 11px;
}
.completion {
  display: inline-block;
  width: 100%;
  text-align: center;
  white-space: nowrap;
}
:deep(.row-highlight td.el-table__cell) {
  background: var(--ink-50) !important;
}
:deep(.row-highlight td.el-table__cell:first-child) {
  
}
.completion.over {
  color: var(--color-text);
  font-weight: 600;
}
.right {
  text-align: right;
  display: inline-block;
  width: 100%;
  font-size: 12.5px;
  white-space: nowrap;
}
.row-actions {
  display: flex;
  flex-wrap: nowrap;
  gap: 12px;
  align-items: center;
  justify-content: center;
  padding-left: 0;
}
.row-actions :deep(.el-button.is-link) {
  margin-left: 0;
  padding: 0 2px;
  font-size: 13px;
  white-space: nowrap;
}
:deep(.el-table-fixed-column--right) {
  border-left: 1px solid var(--color-border-light);
}
:deep(th.el-table-fixed-column--right) {
  background: var(--ink-50) !important;
}
.status-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 12px;
  overflow-x: auto;
  scrollbar-width: none;
}
.status-tabs::-webkit-scrollbar {
  display: none;
}
.status-tab {
  appearance: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 12px;
  border: 1px solid transparent;
  border-radius: var(--radius-xs);
  background: transparent;
  color: var(--color-text-secondary);
  font-family: inherit;
  font-size: var(--font-size-aux);
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.12s ease, color 0.12s ease;
}
.status-tab:hover {
  background: var(--ink-25);
  color: var(--color-text);
}
.status-tab.active {
  background: var(--ink-950);
  border-color: var(--ink-950);
  color: var(--color-text-inverse);
}
.status-tab .status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex: none;
}
.table-scroll {
  min-width: 0;
}
@media (max-width: 900px) {
  .table-scroll {
    overflow-x: auto;
  }
  .table-scroll :deep(.el-table),
  .table-scroll :deep(.table-pager) {
    min-width: 1100px;
  }
}
</style>
