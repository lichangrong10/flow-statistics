<template>
  <div class="page">
    <PageHeader
      title="报表中心"
      subtitle="导出采用异步任务，创建后在列表中轮询状态，完成后提供下载"
    >
      <template #extra>
        <el-button :icon="Refresh" @click="loadTasks">刷新任务</el-button>
      </template>
    </PageHeader>

    <div class="report-layout">
      <div class="card form-card">
        <div class="card-head">
          <div>
            <div class="card-title">创建导出任务</div>
            <div class="card-sub">数据范围：{{ projectName }}</div>
          </div>
        </div>
        <div class="card-body">
          <div class="type-grid">
            <button
              v-for="item in typeOptions"
              :key="item.value"
              type="button"
              class="type-card"
              :class="{ selected: form.type === item.value }"
              @click="form.type = item.value"
            >
              <span class="type-radio" />
              <span class="type-text">
                <span class="type-label">{{ item.label }}</span>
                <span class="type-desc">{{ item.desc }}</span>
              </span>
            </button>
          </div>

          <div class="field">
            <label>文件格式</label>
            <el-radio-group v-model="form.format">
              <el-radio-button value="xlsx">xlsx</el-radio-button>
              <el-radio-button value="pdf" :disabled="true">pdf</el-radio-button>
            </el-radio-group>
            <span class="field-hint">xlsx 便于二次分析；后端 PDF 生成环境缺少字体，暂不可用</span>
          </div>

          <div class="field">
            <label>投放计划</label>
            <el-select
              v-model="form.campaignIds"
              multiple
              filterable
              clearable
              collapse-tags
              collapse-tags-tooltip
              :placeholder="form.type === 'final' ? '结案报告需选择一条计划' : '留空表示导出全部计划'"
              style="width: 100%"
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
            <label>统计周期</label>
            <el-date-picker
              v-model="form.range"
              type="daterange"
              value-format="YYYY-MM-DD"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              :clearable="false"
              style="width: 100%"
            />
          </div>

          <el-button
            type="primary"
            class="create-btn"
            :loading="creating"
            @click="createTask"
          >
            <el-icon><Download /></el-icon>
            创建导出任务
          </el-button>
          <p class="form-tip">
            后端即时生成，完成后在右侧列表点击「下载」获取文件。结案报告需选择且仅选择一条投放计划；
            日报 / 周报 / 数据明细可多选计划，留空为全部计划。
          </p>
        </div>
      </div>

      <div class="card task-card">
        <div class="card-head">
          <div>
            <div class="card-title">导出任务</div>
            <div class="card-sub">
              共 {{ total }} 条记录
              <span v-if="hasRunning" class="polling-tip">
                <span class="polling-dot" />正在生成中，自动刷新
              </span>
            </div>
          </div>
          <el-button text type="primary" @click="loadTasks">立即刷新</el-button>
        </div>
        <div class="card-body">
          <DataTable
            :columns="columns"
            :data="tasks as unknown as Record<string, unknown>[]"
            :loading="loadingTasks"
            :show-pager="true"
            :total="total"
            :page="page"
            :page-size="pageSize"
            empty-title="暂无导出任务"
            empty-desc="在左侧选择报表类型与周期后创建任务"
            @page-change="onPageChange"
          >
            <template #type="{ row }">
              <div class="type-cell">
                <span class="type-name">{{ typeLabel(String(row.type)) }}</span>
                <span class="type-format">{{ String(row.format).toUpperCase() }}</span>
              </div>
            </template>
            <template #status="{ row }">
              <span class="pill" :class="statusClass(String(row.status))">
                {{ statusLabel(String(row.status)) }}
              </span>
            </template>
            <template #createdAt="{ row }">
              <span class="num">{{ formatDateTime(row.createdAt as string) }}</span>
            </template>
            <template #fileName="{ row }">
              <div class="file-cell">
                <el-icon class="file-icon"><Document /></el-icon>
                <div class="file-meta">
                  <span class="file-name">{{ row.fileName || '生成中…' }}</span>
                  <span v-if="Number(row.fileSize) > 0" class="file-size">
                    {{ formatFileSize(Number(row.fileSize)) }}
                  </span>
                </div>
              </div>
            </template>
            <template #actions="{ row }">
              <el-button
                v-if="row.status === 'success'"
                link
                type="primary"
                :loading="downloadingId === row.id"
                @click="onDownload(row as unknown as ReportTask)"
              >
                下载
              </el-button>
              <span v-else-if="row.status === 'failed'" class="fail-text">生成失败</span>
              <span v-else class="tertiary">排队中…</span>
            </template>
          </DataTable>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Document, Download, Refresh } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import PageHeader from '@/components/PageHeader.vue'
import DataTable from '@/components/DataTable.vue'
import { getCampaigns } from '@/api/campaign'
import { createReportTask, downloadReport, getReportTasks } from '@/api/report'
import type { CampaignListItem, ReportTask, ReportType, TableColumn } from '@/types'
import { REPORT_TYPE_OPTIONS } from '@/constants'
import { lastNDays } from '@/utils/date'
import { formatDateTime, formatFileSize } from '@/utils/format'

const route = useRoute()

const campaignOptions = ref<CampaignListItem[]>([])
const tasks = ref<ReportTask[]>([])
const loadingTasks = ref(false)
const creating = ref(false)
const downloadingId = ref<string | number | null>(null)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

let timer: number | null = null

const typeOptions = REPORT_TYPE_OPTIONS

const form = reactive({
  type: 'detail' as ReportType,
  format: 'xlsx' as 'xlsx' | 'pdf',
  campaignIds: [] as number[],
  range: [lastNDays(7).from, lastNDays(7).to] as [string, string],
})

const projectName = computed(() => '全部项目')
const hasRunning = computed(() =>
  tasks.value.some((item) => item.status === 'pending' || item.status === 'running'),
)

const columns: TableColumn[] = [
  { prop: 'type', label: '报表类型', width: 140, slot: 'type' },
  { prop: 'status', label: '状态', width: 90, slot: 'status' },
  { prop: 'createdAt', label: '创建时间', width: 140, slot: 'createdAt' },
  { prop: 'fileName', label: '文件', minWidth: 240, slot: 'fileName' },
  { prop: 'actions', label: '操作', width: 90, fixed: 'right', slot: 'actions' },
]

function typeLabel(type: string): string {
  return REPORT_TYPE_OPTIONS.find((item) => item.value === type)?.label ?? type
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: '排队中',
    running: '生成中',
    success: '已完成',
    failed: '生成失败',
  }
  return map[status] ?? status
}

function statusClass(status: string): string {
  const map: Record<string, string> = {
    pending: 'pending',
    running: 'running',
    success: 'success',
    failed: 'failed',
  }
  return map[status] ?? ''
}

async function loadTasks() {
  loadingTasks.value = true
  try {
    const result = await getReportTasks({ page: page.value, pageSize: pageSize.value })
    tasks.value = result.items
    total.value = result.total
    if (hasRunning.value) schedulePolling()
  } catch {
    tasks.value = []
  } finally {
    loadingTasks.value = false
  }
}

function schedulePolling() {
  if (timer) return
  timer = window.setInterval(async () => {
    if (!hasRunning.value) {
      stopPolling()
      return
    }
    try {
      const result = await getReportTasks({ page: page.value, pageSize: pageSize.value })
      tasks.value = result.items
      total.value = result.total
    } catch {
      stopPolling()
    }
  }, 2200)
}

function stopPolling() {
  if (timer) {
    window.clearInterval(timer)
    timer = null
  }
}

async function loadCampaigns() {
  try {
    const result = await getCampaigns({ page: 1, pageSize: 100 })
    campaignOptions.value = result.items
    const queryId = Number(route.query.campaignId)
    if (queryId) form.campaignIds = [queryId]
  } catch {
    campaignOptions.value = []
  }
}

async function createTask() {
  if (!form.range?.[0] || !form.range?.[1]) {
    ElMessage.warning('请选择统计周期')
    return
  }
  if (form.type !== 'final' && form.campaignIds.length > 1) {
    form.campaignIds = form.campaignIds.slice(0, 1)
  }
  if (form.type === 'final' && form.campaignIds.length !== 1) {
    ElMessage.warning('结案报告需要且仅需要选择一条投放计划')
    return
  }
  creating.value = true
  try {
    await createReportTask({
      type: form.type,
      format: form.format,
      campaignIds: form.campaignIds.length ? form.campaignIds : undefined,
      from: form.range[0],
      to: form.range[1],
    })
    ElMessage.success('导出任务已创建，完成后可在列表下载')
    page.value = 1
    await loadTasks()
    schedulePolling()
  } catch (error) {
    ElMessage.error((error as Error).message || '创建任务失败')
  } finally {
    creating.value = false
  }
}

async function onDownload(task: ReportTask) {
  downloadingId.value = task.id
  try {
    await downloadReport(task)
    ElMessage.success('文件已开始下载')
  } catch (error) {
    ElMessage.error((error as Error).message || '下载失败')
  } finally {
    downloadingId.value = null
  }
}

function onPageChange(value: number) {
  page.value = value
  loadTasks()
}

onMounted(() => {
  loadCampaigns()
  loadTasks()
})

onBeforeUnmount(stopPolling)
</script>

<style scoped>
.report-layout {
  display: grid;
  grid-template-columns: 380px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}
.form-card {
  position: sticky;
  top: 16px;
}
.type-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}
.type-card {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  transition: all 0.15s ease;
}
.type-card:hover {
  border-color: var(--color-border);
  background: #fff;
}
.type-card.selected {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
  
}
.type-radio {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid #c2ccd8;
  flex: none;
  margin-top: 4px;
  position: relative;
}
.type-card.selected .type-radio {
  border-color: var(--color-primary);
}
.type-card.selected .type-radio::after {
  content: '';
  position: absolute;
  inset: 3px;
  border-radius: 50%;
  background: var(--color-primary);
}
.type-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.type-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
}
.type-desc {
  font-size: 11px;
  color: var(--color-text-tertiary);
  line-height: 1.5;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}
.field label {
  font-size: 13px;
  color: var(--color-text-secondary);
}
.field-hint {
  font-size: 11.5px;
  color: var(--color-text-tertiary);
}
.create-btn {
  width: 100%;
  height: 40px;
  margin-top: 4px;
}
.form-tip {
  margin: 10px 0 0;
  font-size: 11.5px;
  color: var(--color-text-tertiary);
  line-height: 1.7;
}
.polling-tip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-left: 8px;
  color: var(--color-text);
  font-size: 11.5px;
}
.polling-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--color-accent);
  animation: pulse 1.4s infinite;
}
@keyframes pulse {
  0%,
  100% {
    opacity: 0.35;
  }
  50% {
    opacity: 1;
  }
}
.type-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
.type-name {
  font-size: 13px;
  color: var(--color-text);
}
.type-format {
  padding: 0 5px;
  height: 18px;
  line-height: 18px;
  border-radius: var(--radius-xs);
  background: var(--ink-50);
  color: var(--color-text-tertiary);
  font-size: 10.5px;
  font-weight: 500;
}
.pill {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 8px;
  border-radius: var(--radius-xs);
  font-size: 11.5px;
  font-weight: 500;
}
.pill.pending {
  background: var(--ink-50);
  color: var(--color-text);
}
.pill.running {
  background: var(--ink-50);
  color: var(--color-text);
}
.pill.success {
  background: var(--ink-50);
  color: var(--color-text);
}
.pill.failed {
  background: var(--ink-50);
  color: var(--color-text);
}
.file-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}
.file-icon {
  font-size: 18px;
  color: #8fa8c0;
}
.file-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.file-name {
  display: block;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--font-size-aux);
  color: var(--color-text);
}
.file-size {
  font-size: 11px;
  color: var(--color-text-tertiary);
}
.fail-text {
  font-size: 12px;
  color: var(--color-text);
}

@media (max-width: 1200px) {
  .report-layout {
    grid-template-columns: minmax(0, 1fr);
  }
  .form-card {
    position: static;
  }
}
</style>
