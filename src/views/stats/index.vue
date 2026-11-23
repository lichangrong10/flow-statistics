<template>
  <div class="page">
    <PageHeader
      title="数据回收"
      subtitle="手工录入、Excel 导入与媒体同步三条链路共用同一套校验规则，重复数据以覆盖方式入库"
    >
      <template #extra>
        <el-button :icon="Refresh" @click="loadCampaigns">刷新计划</el-button>
      </template>
    </PageHeader>

    <div class="card tabs-card">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="手工录入" name="manual">
          <div class="manual-layout">
            <div class="manual-form">
              <div class="form-grid">
                <div class="form-item span-2">
                  <label>投放计划 <i>*</i></label>
                  <el-select
                    v-model="form.campaignId"
                    filterable
                    placeholder="搜索计划名称或投放单号"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="item in campaigns"
                      :key="item.id"
                      :label="`${item.name}${item.code ? `（${item.code}）` : ''}`"
                      :value="item.id"
                    />
                  </el-select>
                  <p v-if="selectedCampaign" class="hint">
                    排期 {{ selectedCampaign.startDate }} ~ {{ selectedCampaign.endDate }}
                    <span class="dot-sep">·</span>
                    {{ selectedCampaign.channelName }}
                    <template v-if="selectedCampaign.ownerName">
                      <span class="dot-sep">·</span>
                      {{ selectedCampaign.ownerName }}
                    </template>
                  </p>
                </div>

                <div class="form-item">
                  <label>数据日期 <i>*</i></label>
                  <el-date-picker
                    v-model="form.statDate"
                    type="date"
                    value-format="YYYY-MM-DD"
                    :disabled-date="disableDate"
                    placeholder="需在排期范围内"
                    style="width: 100%"
                  />
                </div>
                <div class="form-item">
                  <label>消耗金额（元） <i>*</i></label>
                  <el-input v-model="costText" placeholder="0.00" style="width: 100%">
                    <template #prefix>¥</template>
                  </el-input>
                  <p v-if="budgetWarning" class="warn">{{ budgetWarning }}</p>
                </div>

                <div class="form-item">
                  <label>曝光量 <i>*</i></label>
                  <el-input-number v-model="form.impressions" :min="0" :controls="false" style="width: 100%" />
                </div>
                <div class="form-item">
                  <label>曝光人数 <i>*</i></label>
                  <el-input-number v-model="form.reach" :min="0" :controls="false" style="width: 100%" />
                </div>
                <div class="form-item">
                  <label>点击人数 <i>*</i></label>
                  <el-input-number v-model="form.clicks" :min="0" :controls="false" style="width: 100%" />
                </div>
                <div class="form-item">
                  <label>点击率（自动计算）</label>
                  <div class="readonly-value">{{ formatPercent(clickRate, 2) }}</div>
                </div>
              </div>

              <div class="dims-toggle">
                <el-switch v-model="useDims" />
                <span>同时录入人群分布（地域 / 性别 / 年龄，合计需等于曝光量）</span>
              </div>

              <div v-if="useDims" class="dims-tables">
                <div class="dim-block">
                  <div class="dim-title">地域分布（曝光量）</div>
                  <div class="dim-grid">
                    <div v-for="(region, index) in REGION_ROWS" :key="region" class="dim-row">
                      <span class="dim-name">{{ region }}</span>
                      <el-input-number v-model="dims.region[index]" :min="0" :controls="false" size="small" style="width: 100%" />
                    </div>
                  </div>
                  <div class="dim-sum" :class="{ bad: regionSum !== Number(form.impressions) }">
                    合计 {{ formatNumber(regionSum) }}
                    <span v-if="regionSum !== Number(form.impressions)">
                      差额 {{ formatNumber(Number(form.impressions) - regionSum) }}
                    </span>
                  </div>
                </div>

                <div class="dim-block">
                  <div class="dim-title">性别分布（曝光量）</div>
                  <div class="dim-grid single">
                    <div v-for="(gender, index) in GENDER_ROWS" :key="gender" class="dim-row">
                      <span class="dim-name">{{ gender }}</span>
                      <el-input-number v-model="dims.gender[index]" :min="0" :controls="false" size="small" style="width: 100%" />
                    </div>
                  </div>
                  <div class="dim-sum" :class="{ bad: genderSum !== Number(form.impressions) }">
                    合计 {{ formatNumber(genderSum) }}
                    <span v-if="genderSum !== Number(form.impressions)">
                      差额 {{ formatNumber(Number(form.impressions) - genderSum) }}
                    </span>
                  </div>
                </div>

                <div class="dim-block">
                  <div class="dim-title">年龄分布（曝光量）</div>
                  <div class="dim-grid single">
                    <div v-for="(age, index) in AGE_ROWS" :key="age" class="dim-row">
                      <span class="dim-name">{{ age }}</span>
                      <el-input-number v-model="dims.age[index]" :min="0" :controls="false" size="small" style="width: 100%" />
                    </div>
                  </div>
                  <div class="dim-sum" :class="{ bad: ageSum !== Number(form.impressions) }">
                    合计 {{ formatNumber(ageSum) }}
                    <span v-if="ageSum !== Number(form.impressions)">
                      差额 {{ formatNumber(Number(form.impressions) - ageSum) }}
                    </span>
                  </div>
                </div>
              </div>



              <div v-if="manualError" class="form-error">{{ manualError }}</div>

              <div class="manual-actions">
                <el-button @click="resetManual">重置</el-button>
                <el-button type="primary" :loading="saving" @click="submitManual">保存录入</el-button>
              </div>
            </div>

            <aside class="manual-aside">
              <div class="aside-card">
                <div class="aside-title">录入规则</div>
                <ul class="aside-list">
                  <li>数据日期须在计划排期内，且不可选择未来日期。</li>
                  <li>曝光人数不得大于曝光量，点击人数不得大于曝光人数。</li>
                  <li>单日消耗超过日预算 110% 时需二次确认。</li>
                  <li>人群维度合计必须等于总曝光量，否则禁止提交。</li>
                  <li>同一计划同一日期重复录入将覆盖原记录。</li>
                </ul>
              </div>
              <div class="aside-card tip">
                <div class="aside-title">需要批量生成数据？</div>
                <p>进入计划详情页可一键生成模拟数据，覆盖写入且可复现。</p>
                <el-button text type="primary" @click="router.push('/campaign')">前往投放计划 →</el-button>
              </div>
            </aside>
          </div>
        </el-tab-pane>

        <el-tab-pane label="Excel 导入" name="import">
          <div class="import-layout">
            <div class="import-main">
              <div class="import-steps">
                <div class="import-step" :class="{ active: importStep >= 1 }">
                  <span class="is-index">1</span>
                  <div>
                    <div class="is-title">下载模板</div>
                    <div class="is-desc">六个必填列：计划编号、日期、曝光量、曝光人数、点击人数、消耗</div>
                  </div>
                  <el-button size="small" @click="downloadImportTemplate">下载模板</el-button>
                </div>
                <div class="import-step" :class="{ active: importStep >= 2 }">
                  <span class="is-index">2</span>
                  <div>
                    <div class="is-title">上传文件</div>
                    <div class="is-desc">仅支持 xlsx 与 csv，大小不超过 10MB；前端先做格式与范围预校验</div>
                  </div>
                  <el-upload
                    :auto-upload="false"
                    :show-file-list="false"
                    accept=".xlsx,.csv"
                    :on-change="onFileChange"
                  >
                    <el-button size="small" type="primary" plain>选择文件</el-button>
                  </el-upload>
                </div>
                <div class="import-step" :class="{ active: importStep >= 3 }">
                  <span class="is-index">3</span>
                  <div>
                    <div class="is-title">预校验与确认</div>
                    <div class="is-desc">
                      共 {{ importRows.length }} 行，可导入 {{ importableCount }} 行，异常
                      {{ importIssues.length }} 行
                    </div>
                  </div>
                  <el-button
                    size="small"
                    type="primary"
                    :disabled="!importRows.length || importIssues.length > 0"
                    :loading="importing"
                    @click="confirmImport"
                  >
                    确认导入
                  </el-button>
                </div>
              </div>

              <div v-if="importFileName" class="import-file">
                <el-icon><Document /></el-icon>
                <span class="file-name">{{ importFileName }}</span>
                <span class="tertiary">{{ importRows.length }} 行有效数据</span>
                <el-button link type="primary" @click="resetImport">重新选择</el-button>
              </div>

              <div v-if="importIssues.length" class="issue-block">
                <div class="issue-head">
                  <span>预校验发现 {{ importIssues.length }} 处问题（展示前 {{ Math.min(50, importIssues.length) }} 条）</span>
                </div>
                <DataTable
                  :columns="issueColumns"
                  :data="importIssues.slice(0, 50) as unknown as Record<string, unknown>[]"
                  :show-pager="false"
                >
                  <template #row="{ row }"><span class="num">{{ row.row }}</span></template>
                  <template #field="{ row }">{{ fieldLabel(String(row.field)) }}</template>
                </DataTable>
              </div>

              <div v-else-if="importRows.length" class="preview-block">
                <div class="preview-head">
                  数据预览（前 {{ Math.min(8, importRows.length) }} 行）
                </div>
                <DataTable
                  :columns="previewColumns"
                  :data="importRows.slice(0, 8) as unknown as Record<string, unknown>[]"
                  :show-pager="false"
                >
                  <template #code="{ row }"><span class="mono">{{ row.code }}</span></template>
                  <template #statDate="{ row }"><span class="num">{{ row.statDate }}</span></template>
                  <template #impressions="{ row }"><span class="num right">{{ formatNumber(row.impressions as number) }}</span></template>
                  <template #reach="{ row }"><span class="num right">{{ formatNumber(row.reach as number) }}</span></template>
                  <template #clicks="{ row }"><span class="num right">{{ formatNumber(row.clicks as number) }}</span></template>
                  <template #cost="{ row }"><span class="num right">{{ formatAmount(row.cost as number) }}</span></template>
                </DataTable>
              </div>

              <div v-if="importResult" class="result-block">
                <el-icon class="result-icon"><CircleCheckFilled /></el-icon>
                <div>
                  <div class="result-title">导入完成</div>
                  <div class="result-desc">
                    共 {{ importResult.total }} 行，成功 {{ importResult.imported ?? importResult.importable }} 行，失败
                    {{ importResult.invalid }} 行
                  </div>
                </div>
              </div>
            </div>

            <aside class="manual-aside">
              <div class="aside-card">
                <div class="aside-title">导入校验顺序</div>
                <ul class="aside-list">
                  <li>前端：文件格式、必填列、数字格式、日期范围、计划归属。</li>
                  <li>后端：重复数据、越权数据、数值勾稽等业务校验。</li>
                  <li>存在错误行时整体不写入，修正后重新上传。</li>
                  <li>错误行可下载为 Excel，在本地修正。</li>
                </ul>
              </div>
              <div class="aside-card tip">
                <div class="aside-title">模板字段</div>
                <p class="template-line"><span>计划编号</span>DC20261123-1024</p>
                <p class="template-line"><span>日期</span>2026-11-20</p>
                <p class="template-line"><span>曝光量</span>120,000</p>
                <p class="template-line"><span>曝光人数</span>1,500</p>
                <p class="template-line"><span>点击人数</span>230</p>
                <p class="template-line"><span>消耗</span>¥1,440.00</p>
              </div>
            </aside>
          </div>
        </el-tab-pane>

        <el-tab-pane label="同步记录" name="sync">
          <div class="sync-head">
            <span class="tertiary">媒体数据存在小时级延迟，同步仅对投放中或已结束的计划开放</span>
            <el-button :icon="Refresh" size="small" @click="loadSyncTasks">刷新记录</el-button>
          </div>
          <DataTable
            :columns="syncColumns"
            :data="syncTasks as unknown as Record<string, unknown>[]"
            :loading="loadingSync"
            :show-pager="false"
            empty-title="暂无同步记录"
          >
            <template #campaign="{ row }">
              {{ campaignNameOf(Number(row.campaignId)) }}
            </template>
            <template #trigger="{ row }">
              <span class="pill trigger-pill">{{ row.triggerType === 'manual' ? '手动触发' : '定时任务' }}</span>
            </template>
            <template #started="{ row }"><span class="num">{{ formatDateTime(row.startedAt as string) }}</span></template>
            <template #duration="{ row }">{{ formatDuration(Number(row.durationMs)) }}</template>
            <template #status="{ row }">
              <span class="pill" :class="row.status === 'success' ? 'ok' : 'fail'">
                {{ row.status === 'success' ? '成功' : row.status === 'failed' ? '失败' : '执行中' }}
              </span>
            </template>
            <template #message="{ row }">{{ row.message || '—' }}</template>
          </DataTable>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  CircleCheckFilled,
  Document,
  Refresh,
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import PageHeader from '@/components/PageHeader.vue'
import DataTable from '@/components/DataTable.vue'
import { getCampaigns } from '@/api/campaign'
import {
  downloadImportTemplate,
  getSyncTasks,
  importStats,
  saveCampaignStats,
  type ImportResult,
} from '@/api/stats'
import type { CampaignListItem, SyncTask, TableColumn } from '@/types'
import { parseStatsFile, type ParsedStatRow, type RowIssue } from '@/utils/import-parser'
import { addDays, today } from '@/utils/date'
import { formatAmount, formatDateTime, formatDuration, formatNumber, formatPercent } from '@/utils/format'

const route = useRoute()
const router = useRouter()

const activeTab = ref<'manual' | 'import' | 'sync'>('manual')

const campaigns = ref<CampaignListItem[]>([])
const loadingCampaigns = ref(false)

const form = reactive({
  campaignId: null as number | null,
  statDate: today(),
  impressions: 0,
  reach: 0,
  clicks: 0,
  cost: 0,
})

const saving = ref(false)
const manualError = ref('')

const REGION_ROWS = ['江苏省', '上海市', '浙江省', '广东省', '安徽省', '山东省', '北京市', '其他']
const GENDER_ROWS = ['男', '女', '未知']
const AGE_ROWS = ['18-24', '25-29', '30-39', '40-49', '50 岁以上']

const useDims = ref(false)
const dims = reactive({
  region: REGION_ROWS.map(() => 0),
  gender: GENDER_ROWS.map(() => 0),
  age: AGE_ROWS.map(() => 0),
})
const regionSum = computed(() => dims.region.reduce((sum, value) => sum + (value || 0), 0))
const genderSum = computed(() => dims.gender.reduce((sum, value) => sum + (value || 0), 0))
const ageSum = computed(() => dims.age.reduce((sum, value) => sum + (value || 0), 0))

const costText = computed({
  get: () => (form.cost ? form.cost.toFixed(2) : ''),
  set: (value: string) => {
    const parsed = Number(String(value).replace(/[^\d.]/g, ''))
    form.cost = Number.isFinite(parsed) ? parsed : 0
  },
})

const selectedCampaign = computed(
  () => campaigns.value.find((item) => item.id === form.campaignId) ?? null,
)

const clickRate = computed(() =>
  form.reach > 0 ? form.clicks / form.reach : null,
)

const dailyBudget = computed(() => Number(selectedCampaign.value?.dailyBudget ?? 0))
const overBudget = computed(
  () => dailyBudget.value > 0 && form.cost > dailyBudget.value * 1.1,
)
const budgetWarning = computed(() => {
  if (!overBudget.value) return ''
  const percent = (form.cost / dailyBudget.value) * 100
  return `单日消耗已达日预算的 ${percent.toFixed(0)}%，超过 110% 需二次确认`
})

const importFileName = ref('')
const importFile = ref<File | null>(null)
const importRows = ref<ParsedStatRow[]>([])
const importIssues = ref<RowIssue[]>([])
const importResult = ref<ImportResult | null>(null)
const importing = ref(false)

const importStep = computed(() => {
  if (importResult.value) return 3
  if (importRows.value.length || importIssues.value.length) return 2
  return 1
})

const importableCount = computed(() => importRows.value.length)

const syncTasks = ref<SyncTask[]>([])
const loadingSync = ref(false)

const issueColumns: TableColumn[] = [
  { prop: 'row', label: '行号', width: 70, slot: 'row' },
  { prop: 'field', label: '字段', width: 110, slot: 'field' },
  { prop: 'message', label: '问题说明', minWidth: 240 },
]

const previewColumns: TableColumn[] = [
  { prop: 'code', label: '计划编号', width: 160, slot: 'code' },
  { prop: 'statDate', label: '日期', width: 120, slot: 'statDate' },
  { prop: 'impressions', label: '曝光量', minWidth: 110, align: 'right', slot: 'impressions' },
  { prop: 'reach', label: '曝光人数', width: 110, align: 'right', slot: 'reach' },
  { prop: 'clicks', label: '点击人数', width: 100, align: 'right', slot: 'clicks' },
  { prop: 'cost', label: '消耗', width: 110, align: 'right', slot: 'cost' },
]

const syncColumns: TableColumn[] = [
  { prop: 'campaignName', label: '投放计划', minWidth: 200, slot: 'campaign' },
  { prop: 'triggerType', label: '触发方式', width: 110, slot: 'trigger' },
  { prop: 'startedAt', label: '开始时间', width: 150, slot: 'started' },
  { prop: 'durationMs', label: '耗时', width: 100, slot: 'duration' },
  { prop: 'status', label: '结果', width: 90, slot: 'status' },
  { prop: 'message', label: '说明', minWidth: 260, slot: 'message' },
]

async function loadCampaigns() {
  loadingCampaigns.value = true
  try {
    const result = await getCampaigns({ page: 1, pageSize: 100 })
    campaigns.value = result.items
    const queryId = Number(route.query.campaignId)
    if (queryId) {
      form.campaignId = queryId
    } else if (!form.campaignId) {
      const active = result.items.find(
        (item) =>
          item.status === 'running' &&
          item.startDate <= today() &&
          item.endDate >= today(),
      )
      const inRange = result.items.find(
        (item) => item.startDate <= today() && item.endDate >= today(),
      )
      form.campaignId = active?.id ?? inRange?.id ?? result.items[0]?.id ?? null
    }
    clampStatDate()
  } catch {
    campaigns.value = []
  } finally {
    loadingCampaigns.value = false
  }
}

function clampStatDate() {
  const campaign = selectedCampaign.value
  if (!campaign) return
  const current = form.statDate || today()
  const max = campaign.endDate < today() ? campaign.endDate : today()
  const min = campaign.startDate
  if (current < min) form.statDate = min
  else if (current > max) form.statDate = max
}

watch(
  () => form.campaignId,
  () => clampStatDate(),
)

function disableDate(date: Date) {
  if (date.getTime() > new Date(today()).getTime()) return true
  if (!selectedCampaign.value) return false
  const start = dayjs(selectedCampaign.value.startDate).valueOf()
  const end = dayjs(selectedCampaign.value.endDate).valueOf()
  return date.getTime() < start || date.getTime() > end
}

function resetManual() {
  form.statDate = today()
  form.impressions = 0
  form.reach = 0
  form.clicks = 0
  form.cost = 0
  useDims.value = false
  dims.region = REGION_ROWS.map(() => 0)
  dims.gender = GENDER_ROWS.map(() => 0)
  dims.age = AGE_ROWS.map(() => 0)
  manualError.value = ''
}

async function submitManual() {
  manualError.value = ''
  if (!form.campaignId) {
    manualError.value = '请选择投放计划'
    return
  }
  if (!form.statDate) {
    manualError.value = '请选择数据日期'
    return
  }
  if (form.reach > form.impressions) {
    manualError.value = '曝光人数不应大于曝光量，请核对媒体后台数据'
    return
  }
  if (form.clicks > form.reach) {
    manualError.value = '点击人数不应大于曝光人数，请核对数据来源'
    return
  }
  if (useDims.value) {
    if (regionSum.value !== form.impressions) {
      manualError.value = `地域分布合计与曝光量相差 ${formatNumber(form.impressions - regionSum.value)}，请检查后提交`
      return
    }
    if (genderSum.value !== form.impressions) {
      manualError.value = `性别分布合计与曝光量相差 ${formatNumber(form.impressions - genderSum.value)}，请检查后提交`
      return
    }
    if (ageSum.value !== form.impressions) {
      manualError.value = `年龄分布合计与曝光量相差 ${formatNumber(form.impressions - ageSum.value)}，请检查后提交`
      return
    }
  }
  if (overBudget.value) {
    try {
      await ElMessageBox.confirm(
        `单日消耗 ¥${form.cost.toFixed(2)} 已超过日预算 ¥${dailyBudget.value.toFixed(2)} 的 110%，确认继续保存？`,
        '消耗异常确认',
        { confirmButtonText: '继续保存', cancelButtonText: '返回修改', type: 'warning' },
      )
    } catch {
      return
    }
  }
  saving.value = true
  try {
    await saveCampaignStats(form.campaignId, {
      statDate: form.statDate,
      impressions: form.impressions,
      reach: form.reach,
      clicks: form.clicks,
      cost: form.cost,
      dims: useDims.value
        ? {
            region: REGION_ROWS.map((name, index) => ({
              key: name,
              name,
              impressions: dims.region[index] || 0,
            })),
            gender: GENDER_ROWS.map((name, index) => ({
              key: name,
              name,
              impressions: dims.gender[index] || 0,
            })),
            age: AGE_ROWS.map((name, index) => ({
              key: name,
              name,
              impressions: dims.age[index] || 0,
            })),
          }
        : undefined,
    })
    ElMessage.success('数据已保存，重复录入将覆盖原记录')
    await loadCampaigns()
  } catch (error) {
    manualError.value = (error as Error).message || '保存失败'
  } finally {
    saving.value = false
  }
}

async function onFileChange(uploadFile: { raw?: File }) {
  const file = uploadFile.raw
  if (!file) return
  importFile.value = file
  importResult.value = null
  importIssues.value = []
  importRows.value = []
  importFileName.value = file.name
  try {
    const parsed = await parseStatsFile(file)
    const codes = new Map(campaigns.value.map((item) => [item.code, item]))
    const issues = [...parsed.issues]
    const rows: ParsedStatRow[] = []
    for (const row of parsed.rows) {
      const campaign = codes.get(row.code)
      if (!campaign) {
        issues.push({ row: row.row, field: 'code', message: '投放单号不存在或不属于当前用户' })
        continue
      }
      if (row.statDate < campaign.startDate || row.statDate > campaign.endDate) {
        issues.push({ row: row.row, field: 'statDate', message: '数据日期需在计划排期范围内' })
        continue
      }
      if (row.statDate > today()) {
        issues.push({ row: row.row, field: 'statDate', message: '不可导入未来日期的数据' })
        continue
      }
      rows.push(row)
    }
    importRows.value = rows
    importIssues.value = issues
    if (issues.length) {
      ElMessage.warning(`预校验发现 ${issues.length} 处问题，请修正后重新上传`)
    } else {
      ElMessage.success(`预校验通过，共 ${rows.length} 行可导入`)
    }
  } catch (error) {
    importFileName.value = ''
    ElMessage.error((error as Error).message || '文件解析失败')
  }
}

async function confirmImport() {
  if (!importRows.value.length) return
  importing.value = true
  try {
    if (!importFile.value) {
      ElMessage.warning('请先选择要导入的文件')
      return
    }
    const result = await importStats(importFile.value)
    importResult.value = result
    ElMessage.success(`导入完成，成功 ${result.imported ?? result.importable} 行`)
    await loadSyncTasks()
  } catch (error) {
    const bizError = error as {
      data?: { errors?: RowIssue[]; details?: { row?: number; code?: string; message?: string }[] }
      message?: string
    }
    const details = bizError.data?.details ?? []
    const errors: RowIssue[] =
      bizError.data?.errors ??
      details.map((item) => ({
        row: Number(item.row ?? 0),
        field: 'file',
        message: `${item.code ? item.code + '：' : ''}${item.message ?? ''}`,
      }))
    if (errors.length) {
      importIssues.value = errors
      importResult.value = null
      ElMessage.warning('后端校验未通过，请修正后重新上传')
    } else {
      ElMessage.error(bizError.message || '导入失败')
    }
  } finally {
    importing.value = false
  }
}

function resetImport() {
  importFileName.value = ''
  importFile.value = null
  importRows.value = []
  importIssues.value = []
  importResult.value = null
}

function fieldLabel(field: string): string {
  const map: Record<string, string> = {
    code: '计划编号',
    statDate: '日期',
    impressions: '曝光量',
    reach: '曝光人数',
    clicks: '点击人数',
    cost: '消耗',
  }
  return map[field] ?? field
}

function campaignNameOf(campaignId: number): string {
  return campaigns.value.find((item) => item.id === campaignId)?.name ?? `计划 #${campaignId}`
}

async function loadSyncTasks() {
  loadingSync.value = true
  try {
    const result = await getSyncTasks({ page: 1, pageSize: 50 })
    syncTasks.value = result.items
  } catch {
    syncTasks.value = []
  } finally {
    loadingSync.value = false
  }
}

onMounted(async () => {
  await loadCampaigns()
  loadSyncTasks()
})
</script>

<style scoped>
.tabs-card {
  padding: 8px 20px 20px;
}
.manual-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 24px;
  align-items: start;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 18px;
}
.span-2 {
  grid-column: span 2;
}
.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-item label {
  font-size: 13px;
  color: var(--color-text-secondary);
}
.form-item label i {
  color: var(--color-danger);
  font-style: normal;
}
.hint {
  margin: 0;
  font-size: 12px;
  color: var(--color-text-tertiary);
}
.warn {
  margin: 0;
  font-size: 12px;
  color: var(--color-warning);
}
.dot-sep {
  color: #cbd4df;
  margin: 0 4px;
}
.readonly-value {
  height: 32px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  border-radius: 6px;
  background: #f5f8fc;
  color: var(--color-text);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}
.dims-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 20px 0 4px;
  padding: 12px 14px;
  border-radius: 8px;
  background: #f7f9fc;
  font-size: 12.5px;
  color: var(--color-text-secondary);
}
.dims-tables {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-top: 14px;
}
.dim-block {
  border: 1px solid var(--color-border-light);
  border-radius: 10px;
  padding: 12px 14px;
  background: #fcfdff;
}
.dim-title {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 10px;
}
.dim-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.dim-grid.single {
  grid-template-columns: minmax(0, 1fr);
}
.dim-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.dim-name {
  font-size: 12px;
  color: var(--color-text-secondary);
  width: 52px;
  flex: none;
  white-space: nowrap;
}
.dim-sum {
  margin-top: 10px;
  font-size: 12px;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: 8px;
  font-variant-numeric: tabular-nums;
}
.dim-sum.bad {
  color: var(--color-danger);
}
.form-error {
  margin-top: 14px;
  padding: 8px 12px;
  border-radius: 6px;
  background: #fdf6f5;
  border: 1px solid #f3d7d4;
  color: var(--color-danger);
  font-size: 12.5px;
}
.manual-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border-light);
}
.manual-aside {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.aside-card {
  border: 1px solid var(--color-border-light);
  border-radius: 10px;
  padding: 14px 16px;
  background: #fcfdff;
}
.aside-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 10px;
}
.aside-list {
  display: flex;
  flex-direction: column;
  gap: 7px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--color-text-secondary);
  list-style: none;
  padding: 0;
  margin: 0;
}
.aside-list li {
  padding-left: 14px;
  position: relative;
}
.aside-list li::before {
  content: '';
  position: absolute;
  left: 3px;
  top: 8px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #b9c8d8;
}
.aside-card.tip {
  background: #f5f8fc;
}
.aside-card.tip p {
  font-size: 12px;
  line-height: 1.7;
  color: var(--color-text-secondary);
  margin-bottom: 6px;
}
.template-line {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--color-text-secondary);
  padding: 3px 0;
}
.template-line span {
  color: var(--color-text-tertiary);
}
.import-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 24px;
  align-items: start;
}
.import-steps {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.import-step {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid var(--color-border-light);
  border-radius: 10px;
  background: #fcfdff;
}
.import-step.active {
  border-color: #cfdded;
  background: #f7fafd;
}
.is-index {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #eef2f7;
  color: #8a94a6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex: none;
}
.import-step.active .is-index {
  background: var(--color-primary);
  color: #fff;
}
.import-step > div {
  flex: 1;
  min-width: 0;
}
.is-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
}
.is-desc {
  margin-top: 2px;
  font-size: 11.5px;
  color: var(--color-text-tertiary);
  line-height: 1.6;
}
.import-file {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 16px;
  padding: 10px 14px;
  border-radius: 8px;
  background: #f5f8fc;
  font-size: 12.5px;
}
.file-name {
  font-weight: 500;
  color: var(--color-text);
}
.issue-block,
.preview-block {
  margin-top: 16px;
  border: 1px solid var(--color-border-light);
  border-radius: 10px;
  overflow: hidden;
}
.issue-head,
.preview-head {
  padding: 10px 14px;
  font-size: 12.5px;
  background: #fdf6f5;
  color: var(--color-danger);
  border-bottom: 1px solid #f3d7d4;
}
.preview-head {
  background: #f7f9fc;
  color: var(--color-text-secondary);
  border-bottom-color: var(--color-border-light);
}
.issue-block :deep(.el-table),
.preview-block :deep(.el-table) {
  font-size: 12.5px;
}
.result-block {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding: 14px 16px;
  border-radius: 10px;
  background: #eef8f3;
  border: 1px solid #cfe9dc;
}
.result-icon {
  font-size: 28px;
  color: #1f8a5b;
}
.result-title {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--color-text);
}
.result-desc {
  margin-top: 2px;
  font-size: 12px;
  color: var(--color-text-secondary);
}
.sync-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  font-size: 12px;
}
.trigger-pill {
  background: #f2f5f9;
  color: var(--color-text-secondary);
  font-weight: 400;
}
.ok {
  background: #e9f6f0;
  color: #1f8a5b;
}
.fail {
  background: #fbeceb;
  color: #b4372f;
}
.right {
  text-align: right;
  display: inline-block;
  width: 100%;
}
@media (max-width: 1280px) {
  .manual-layout,
  .import-layout {
    grid-template-columns: minmax(0, 1fr);
  }
  .dims-tables {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
