<template>
  <div class="page">
    <PageHeader :title="pageTitle" :subtitle="pageSubtitle">
      <template #extra>
        <el-button @click="router.back()">取消</el-button>
        <el-button :loading="saving" @click="saveDraft">保存草稿</el-button>
      </template>
    </PageHeader>

    <div class="wizard-layout">
      <div class="card wizard-main">
        <div class="steps">
          <div
            v-for="(step, index) in steps"
            :key="step.title"
            class="step"
            :class="{
              active: current === index + 1,
              done: current > index + 1,
              error: stepError(index + 1),
              reachable: index + 1 < current,
            }"
            @click="goStep(index + 1)"
          >
            <span class="step-index">
              <el-icon v-if="current > index + 1"><Check /></el-icon>
              <template v-else>{{ index + 1 }}</template>
            </span>
            <div class="step-text">
              <span class="step-title">{{ step.title }}</span>
              <span class="step-desc">{{ step.desc }}</span>
            </div>
            <span v-if="index < steps.length - 1" class="step-line" />
          </div>
        </div>

        <div class="step-body">
          <!-- 第一步 基础信息 -->
          <section v-show="current === 1" class="step-pane">
            <div class="form-grid">
              <div class="form-item span-2" :class="{ invalid: errors.name }">
                <label>计划名称 <i>*</i></label>
                <el-input
                  v-model="form.name"
                  maxlength="40"
                  show-word-limit
                  placeholder="例如：双十二全域曝光主计划，2 至 40 个字"
                />
                <p v-if="errors.name" class="err">{{ errors.name }}</p>
              </div>

              <div class="form-item" :class="{ invalid: errors.projectId }">
                <label>所属项目 <i>*</i></label>
                <el-select v-model="form.projectId" placeholder="请选择项目" style="width: 100%">
                  <el-option
                    v-for="project in app.projects"
                    :key="project.id"
                    :label="project.name"
                    :value="project.id"
                  />
                </el-select>
                <p v-if="errors.projectId" class="err">{{ errors.projectId }}</p>
              </div>

              <div class="form-item">
                <label>关联合同</label>
                <el-input v-model="form.contractNo" maxlength="32" placeholder="选填，用于财务对账" />
              </div>

              <div class="form-item span-2" :class="{ invalid: errors.channels }">
                <label>投放渠道 <i>*</i></label>
                <div class="channel-grid">
                  <button
                    v-for="channel in channels"
                    :key="channel.code"
                    type="button"
                    class="channel-card"
                    :class="{ selected: form.channels.includes(channel.code) }"
                    @click="toggleChannel(channel.code)"
                  >
                    <ChannelIcon :channel="channel.code as ChannelCode" :size="20" />
                    <span class="channel-label">{{ channel.label }}</span>
                    <el-icon v-if="form.channels.includes(channel.code)" class="channel-check">
                      <Check />
                    </el-icon>
                  </button>
                </div>
                <p v-if="errors.channels" class="err">{{ errors.channels }}</p>
                <p v-else class="hint">支持多选，每个渠道将各生成一条独立计划与排期。</p>
              </div>

              <div class="form-item span-2" :class="{ invalid: errors.vendors }">
                <label>投放厂商 <i>*</i></label>
                <el-select
                  v-model="form.vendorIds"
                  multiple
                  filterable
                  :multiple-limit="5"
                  placeholder="搜索并选择厂商，最多五个"
                  style="width: 100%"
                >
                  <el-option
                    v-for="vendor in vendors"
                    :key="vendor.id"
                    :label="`${vendor.name}（${vendor.platformName ?? vendor.platform}）`"
                    :value="vendor.id"
                  />
                </el-select>
                <p v-if="errors.vendors" class="err">{{ errors.vendors }}</p>
                <p v-else class="hint">厂商为主数据，停用厂商不出现在候选中，已选 {{ form.vendorIds.length }} / 5。</p>
              </div>

              <div class="form-item span-2" :class="{ invalid: errors.goal }">
                <label>投放目标 <i>*</i></label>
                <div class="goal-grid">
                  <button
                    v-for="goal in GOAL_OPTIONS"
                    :key="goal.value"
                    type="button"
                    class="goal-card"
                    :class="{ selected: form.goal === goal.value }"
                    @click="form.goal = goal.value"
                  >
                    <span class="goal-radio" />
                    <span class="goal-text">
                      <span class="goal-label">{{ goal.label }}</span>
                      <span class="goal-desc">{{ goal.desc }}</span>
                    </span>
                  </button>
                </div>
                <p v-if="errors.goal" class="err">{{ errors.goal }}</p>
              </div>
            </div>
          </section>

          <!-- 第二步 人群定向 -->
          <section v-show="current === 2" class="step-pane">
            <div class="form-grid">
              <div class="form-item span-2" :class="{ invalid: errors.regions }">
                <label>投放地域 <i>*</i></label>
                <el-cascader
                  v-model="form.regionPaths"
                  :options="REGION_TREE"
                  :props="{ multiple: true, emitPath: true }"
                  collapse-tags
                  collapse-tags-tooltip
                  filterable
                  clearable
                  placeholder="支持省、市两级，至少选择一项"
                  style="width: 100%"
                />
                <p v-if="errors.regions" class="err">{{ errors.regions }}</p>
                <p v-else class="hint">选择省级即覆盖全省；同时选中省与市时以市为准。</p>
              </div>

              <div class="form-item span-2" :class="{ invalid: errors.gender }">
                <label>性别 <i>*</i></label>
                <el-radio-group v-model="form.gender">
                  <el-radio-button value="all">不限</el-radio-button>
                  <el-radio-button value="male">男</el-radio-button>
                  <el-radio-button value="female">女</el-radio-button>
                </el-radio-group>
                <p v-if="errors.gender" class="err">{{ errors.gender }}</p>
              </div>

              <div class="form-item span-2" :class="{ invalid: errors.ages }">
                <label>年龄段 <i>*</i></label>
                <div class="chip-group">
                  <button
                    v-for="age in AGE_OPTIONS"
                    :key="age"
                    type="button"
                    class="chip"
                    :class="{ selected: form.ageRanges.includes(age) }"
                    @click="toggleAge(age)"
                  >
                    {{ age === '50 岁以上' ? age : `${age} 岁` }}
                  </button>
                </div>
                <p v-if="errors.ages" class="err">{{ errors.ages }}</p>
              </div>

              <div class="form-item span-2">
                <label>兴趣标签</label>
                <el-select
                  v-model="form.interests"
                  multiple
                  filterable
                  :multiple-limit="5"
                  placeholder="选填，最多五个"
                  style="width: 100%"
                >
                  <el-option v-for="item in INTEREST_OPTIONS" :key="item" :label="item" :value="item" />
                </el-select>
                <p class="hint">兴趣标签来自平台标签字典，用于人群包圈选，不影响曝光口径。</p>
              </div>
            </div>
          </section>

          <!-- 第三步 排期与预算 -->
          <section v-show="current === 3" class="step-pane">
            <div class="form-grid">
              <div class="form-item" :class="{ invalid: errors.startDate || errors.endDate }">
                <label>开始日期 <i>*</i></label>
                <el-date-picker
                  v-model="form.startDate"
                  type="date"
                  value-format="YYYY-MM-DD"
                  :disabled-date="disableStart"
                  placeholder="不早于当日"
                  style="width: 100%"
                />
              </div>
              <div class="form-item" :class="{ invalid: errors.endDate }">
                <label>结束日期 <i>*</i></label>
                <el-date-picker
                  v-model="form.endDate"
                  type="date"
                  value-format="YYYY-MM-DD"
                  :disabled-date="disableEnd"
                  placeholder="不早于开始日期"
                  style="width: 100%"
                />
              </div>
              <p v-if="errors.startDate || errors.endDate" class="err span-2">
                {{ errors.startDate || errors.endDate }}
              </p>

              <div class="form-item" :class="{ invalid: errors.dailyBudget }">
                <label>日预算（元） <i>*</i></label>
                <el-input v-model="form.dailyBudget" placeholder="大于零，两位小数">
                  <template #prefix>¥</template>
                </el-input>
                <p v-if="errors.dailyBudget" class="err">{{ errors.dailyBudget }}</p>
              </div>
              <div class="form-item" :class="{ invalid: errors.totalBudget }">
                <label>总预算（元） <i>*</i></label>
                <el-input v-model="form.totalBudget" placeholder="不小于日预算">
                  <template #prefix>¥</template>
                </el-input>
                <p v-if="errors.totalBudget" class="err">{{ errors.totalBudget }}</p>
                <p v-else class="hint">项目剩余可用 {{ formatAmount(remainingBudget) }}</p>
              </div>

              <div class="form-item" :class="{ invalid: errors.targetImpressions }">
                <label>目标曝光量（次） <i>*</i></label>
                <el-input-number
                  v-model="form.targetImpressions"
                  :min="1000"
                  :step="10000"
                  :controls="false"
                  style="width: 100%"
                />
                <p v-if="errors.targetImpressions" class="err">{{ errors.targetImpressions }}</p>
                <p v-else class="hint">按千人曝光成本 12 元估算，参考消耗约 {{ formatAmount(referenceCost) }}</p>
              </div>
              <div class="form-item">
                <label>出价方式 <i>*</i></label>
                <el-radio-group v-model="form.bidType">
                  <el-radio-button v-for="item in BID_OPTIONS" :key="item.value" :value="item.value">
                    {{ item.label }}
                  </el-radio-button>
                </el-radio-group>
              </div>
            </div>
          </section>

          <!-- 第四步 确认发布 -->
          <section v-show="current === 4" class="step-pane">
            <div class="review">
              <div class="review-block">
                <div class="review-title">基础信息</div>
                <el-descriptions :column="2" border size="small">
                  <el-descriptions-item label="计划名称">{{ form.name || '—' }}</el-descriptions-item>
                  <el-descriptions-item label="所属项目">{{ projectName }}</el-descriptions-item>
                  <el-descriptions-item label="投放渠道">
                    {{ selectedChannelNames.join('、') || '—' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="投放厂商">
                    {{ selectedVendorNames.join('、') || '—' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="投放目标">{{ goalLabel }}</el-descriptions-item>
                  <el-descriptions-item label="关联合同">{{ form.contractNo || '—' }}</el-descriptions-item>
                </el-descriptions>
              </div>

              <div class="review-block">
                <div class="review-title">人群定向</div>
                <el-descriptions :column="2" border size="small">
                  <el-descriptions-item label="投放地域">
                    {{ regionText }}
                  </el-descriptions-item>
                  <el-descriptions-item label="性别">{{ genderLabel }}</el-descriptions-item>
                  <el-descriptions-item label="年龄段">{{ form.ageRanges.join('、') || '—' }}</el-descriptions-item>
                  <el-descriptions-item label="兴趣标签">{{ form.interests.join('、') || '不限' }}</el-descriptions-item>
                </el-descriptions>
              </div>

              <div class="review-block">
                <div class="review-title">排期与预算</div>
                <el-descriptions :column="2" border size="small">
                  <el-descriptions-item label="投放排期">
                    {{ form.startDate }} ~ {{ form.endDate }}（{{ planDays }} 天）
                  </el-descriptions-item>
                  <el-descriptions-item label="日预算">{{ formatAmount(form.dailyBudget) }}</el-descriptions-item>
                  <el-descriptions-item label="总预算">{{ formatAmount(form.totalBudget) }}</el-descriptions-item>
                  <el-descriptions-item label="目标曝光量">{{ formatNumber(form.targetImpressions) }}</el-descriptions-item>
                  <el-descriptions-item label="出价方式">{{ bidLabel }}</el-descriptions-item>
                  <el-descriptions-item label="参考消耗">{{ formatAmount(referenceCost) }}</el-descriptions-item>
                </el-descriptions>
              </div>

              <div class="review-block">
                <div class="review-title">素材与发布</div>
                <div class="material-empty">
                  <el-icon><Picture /></el-icon>
                  素材库尚未接入，计划发布后可在详情页查看素材状态
                </div>
                <div class="form-item span-2">
                  <label>备注</label>
                  <el-input
                    v-model="form.remark"
                    type="textarea"
                    :rows="3"
                    maxlength="200"
                    show-word-limit
                    placeholder="选填，最多 200 字，例如投放背景、素材说明等"
                  />
                </div>
              </div>

              <div class="confirm-row" :class="{ invalid: errors.confirm }">
                <el-checkbox v-model="confirmed">
                  我已核对以上信息，确认提交。发布后计划的定向、预算与排期将写入快照，不再随修改变化。
                </el-checkbox>
                <p v-if="errors.confirm" class="err">{{ errors.confirm }}</p>
              </div>
            </div>
          </section>
        </div>

        <div class="wizard-foot">
          <el-button v-if="current > 1" @click="current -= 1">
            <el-icon><ArrowLeft /></el-icon>
            上一步
          </el-button>
          <div class="foot-right">
            <span class="foot-hint">第 {{ current }} / 4 步</span>
            <el-button v-if="current < 4" type="primary" @click="nextStep">
              下一步
              <el-icon><ArrowRight /></el-icon>
            </el-button>
            <el-button v-else type="primary" :loading="submitting" @click="submit">
              {{ isFutureStart ? '确认排期' : '确认发布' }}
            </el-button>
          </div>
        </div>
      </div>

      <aside class="summary card">
        <div class="summary-head">计划摘要</div>
        <div class="summary-name">{{ form.name || '未命名计划' }}</div>
        <div class="summary-channels">
          <span
            v-for="channel in selectedChannels"
            :key="channel.code"
            class="summary-channel"
            :style="{ background: channel.soft, color: channel.color }"
          >
            {{ channel.label }}
          </span>
          <span v-if="!selectedChannels.length" class="tertiary">尚未选择渠道</span>
        </div>

        <div class="summary-list">
          <div class="summary-row">
            <span>投放目标</span><strong>{{ goalLabel }}</strong>
          </div>
          <div class="summary-row">
            <span>投放厂商</span><strong>{{ form.vendorIds.length }} 家</strong>
          </div>
          <div class="summary-row">
            <span>投放排期</span><strong>{{ planDays > 0 ? `${planDays} 天` : '—' }}</strong>
          </div>
          <div class="summary-row">
            <span>日预算</span><strong>{{ formatAmount(form.dailyBudget) }}</strong>
          </div>
          <div class="summary-row">
            <span>总预算</span><strong>{{ formatAmount(form.totalBudget) }}</strong>
          </div>
          <div class="summary-row">
            <span>目标曝光</span><strong>{{ formatNumber(form.targetImpressions) }}</strong>
          </div>
        </div>

        <div class="budget-block">
          <div class="budget-head">
            <span>项目预算占用</span>
            <span class="num">{{ formatAmount(projectUsedAfter) }} / {{ formatAmount(projectTotal) }}</span>
          </div>
          <div class="budget-bar">
            <span class="budget-fill" :style="{ width: `${budgetPercent}%` }" />
          </div>
          <div class="budget-foot">
            剩余可用 <strong>{{ formatAmount(remainingAfter) }}</strong>
          </div>
        </div>

        <div class="summary-tip">
          <el-icon><InfoFilled /></el-icon>
          <span>
            {{ isFutureStart ? '开始日期未到：提交后进入已排期，到开始日期自动发布。' : '提交后立即生成投放单号并开始投放。' }}
          </span>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  InfoFilled,
  Picture,
} from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import ChannelIcon from '@/components/ChannelIcon.vue'
import { useAppStore } from '@/stores/app'
import { useDictStore } from '@/stores/dict'
import { createCampaign, getCampaign, updateCampaign } from '@/api/campaign'
import { getVendors } from '@/api/vendor'
import type { CampaignDraftPayload, ChannelCode, Vendor } from '@/types'
import {
  AGE_OPTIONS,
  BID_OPTIONS,
  CHANNEL_META,
  GOAL_OPTIONS,
  INTEREST_OPTIONS,
  REGION_TREE,
} from '@/constants'
import { addDays, daysBetween, eachDate, today } from '@/utils/date'
import { formatAmount, formatNumber } from '@/utils/format'

const router = useRouter()
const route = useRoute()
const app = useAppStore()
const dict = useDictStore()

const steps = [
  { title: '基础信息', desc: '计划、渠道、厂商与目标' },
  { title: '人群定向', desc: '地域、性别、年龄与兴趣' },
  { title: '排期与预算', desc: '日期、预算与出价方式' },
  { title: '确认发布', desc: '复核、素材与提交' },
]

const mode = computed(() => (route.query.mode === 'edit' ? 'edit' : route.query.copy ? 'copy' : 'create'))
const editId = computed(() => Number(route.query.id) || 0)
const copyId = computed(() => Number(route.query.copy) || 0)

const current = ref(1)
const saving = ref(false)
const submitting = ref(false)
const confirmed = ref(false)
const errors = reactive<Record<string, string>>({})
const vendors = ref<Vendor[]>([])

const form = reactive({
  name: '',
  projectId: app.currentProjectId ?? 1,
  channels: ['douyin'] as ChannelCode[],
  vendorIds: [] as number[],
  goal: 'impression' as 'impression' | 'click' | 'lead',
  contractNo: '',
  regionPaths: [] as string[][],
  gender: 'all' as 'all' | 'male' | 'female',
  ageRanges: [] as string[],
  interests: [] as string[],
  startDate: addDays(today(), 1),
  endDate: addDays(today(), 14),
  dailyBudget: '3000.00',
  totalBudget: '42000.00',
  targetImpressions: 1_200_000,
  bidType: 'cpm' as 'cpm' | 'cpc',
  publishMode: 'publish' as 'submit' | 'publish' | 'draft',
  remark: '',
})

const isFutureStart = computed(() => form.startDate > today())

const pageTitle = computed(() =>
  mode.value === 'edit' ? '编辑投放计划' : mode.value === 'copy' ? '复制为新计划' : '发布投流',
)
const pageSubtitle = computed(() =>
  mode.value === 'edit'
    ? '修改草稿信息，保存后仍为草稿状态'
    : '四步完成计划创建：基础信息 → 人群定向 → 排期预算 → 确认发布',
)

const channels = computed(() => {
  const source = dict.enabledChannels.length ? dict.enabledChannels : dict.channels
  const list = source.length
    ? source
    : (Object.keys(CHANNEL_META) as ChannelCode[]).map((code) => ({
        code,
        name: CHANNEL_META[code].label,
      }))
  return list.map((item) => ({
    code: item.code as ChannelCode,
    label: CHANNEL_META[item.code as ChannelCode]?.label ?? item.name,
    short: CHANNEL_META[item.code as ChannelCode]?.short ?? item.name.slice(0, 1),
    color: CHANNEL_META[item.code as ChannelCode]?.color ?? '#5B6673',
    soft: CHANNEL_META[item.code as ChannelCode]?.soft ?? '#F2F4F7',
  }))
})

const selectedChannels = computed(() => channels.value.filter((item) => form.channels.includes(item.code)))
const selectedChannelNames = computed(() => selectedChannels.value.map((item) => item.label))
const selectedVendorNames = computed(() =>
  form.vendorIds
    .map((id) => vendors.value.find((vendor) => vendor.id === id)?.name)
    .filter((name): name is string => Boolean(name)),
)

const project = computed(() => app.projects.find((item) => item.id === form.projectId) ?? null)
const projectName = computed(() => project.value?.name ?? '—')
const projectTotal = computed(() => Number(project.value?.totalBudget ?? 0))
const projectUsed = computed(() => Number(project.value?.usedBudget ?? 0))
const remainingBudget = computed(() => Math.max(0, projectTotal.value - projectUsed.value))
const projectUsedAfter = computed(() => projectUsed.value + Number(form.totalBudget || 0))
const remainingAfter = computed(() =>
  Math.max(0, projectTotal.value - projectUsedAfter.value),
)
const budgetPercent = computed(() =>
  projectTotal.value ? Math.min(100, (projectUsedAfter.value / projectTotal.value) * 100) : 0,
)

const planDays = computed(() => {
  if (!form.startDate || !form.endDate) return 0
  const span = eachDate(form.startDate, form.endDate).length
  return span > 0 ? span : 0
})
const referenceCost = computed(() => (Number(form.targetImpressions) / 1000) * 12)

const goalLabel = computed(
  () => GOAL_OPTIONS.find((item) => item.value === form.goal)?.label ?? '—',
)
const bidLabel = computed(
  () => BID_OPTIONS.find((item) => item.value === form.bidType)?.label ?? '—',
)
const genderLabel = computed(
  () => ({ all: '不限', male: '男', female: '女' })[form.gender],
)
const regionText = computed(() =>
  form.regionPaths.length
    ? form.regionPaths.map((path) => path.join(' / ')).join('、')
    : '—',
)

function toggleChannel(code: ChannelCode) {
  if (form.channels.includes(code)) {
    if (form.channels.length === 1) return
    form.channels = form.channels.filter((item) => item !== code)
  } else {
    form.channels = [...form.channels, code]
  }
  delete errors.channels
}

function toggleAge(age: string) {
  if (form.ageRanges.includes(age)) {
    form.ageRanges = form.ageRanges.filter((item) => item !== age)
  } else {
    form.ageRanges = [...form.ageRanges, age]
  }
  delete errors.ages
}

function disableStart(date: Date) {
  return date.getTime() < new Date(today()).getTime()
}

function disableEnd(date: Date) {
  if (!form.startDate) return date.getTime() < new Date(today()).getTime()
  return date.getTime() < new Date(form.startDate).getTime()
}

const stepError = (step: number) => {
  const keys = [
    ['name', 'projectId', 'channels', 'vendors', 'goal', 'contractNo'],
    ['regions', 'gender', 'ages', 'interests'],
    ['startDate', 'endDate', 'dailyBudget', 'totalBudget', 'targetImpressions', 'bidType'],
    ['confirm'],
  ][step - 1]
  return keys?.some((key) => errors[key])
}

function clearStepErrors(step: number) {
  const keyMap: Record<number, string[]> = {
    1: ['name', 'projectId', 'channels', 'vendors', 'goal', 'contractNo'],
    2: ['regions', 'gender', 'ages', 'interests'],
    3: ['startDate', 'endDate', 'dailyBudget', 'totalBudget', 'targetImpressions', 'bidType'],
    4: ['confirm'],
  }
  keyMap[step]?.forEach((key) => delete errors[key])
}

function validateStep(step: number): boolean {
  clearStepErrors(step)
  if (step === 1) {
    const name = form.name.trim()
    if (name.length < 2 || name.length > 40) errors.name = '计划名称需为 2 至 40 个字'
    if (!form.projectId) errors.projectId = '请选择所属项目'
    if (!form.channels.length) errors.channels = '请至少选择一个投放渠道'
    if (!form.vendorIds.length) errors.vendors = '请至少选择一个投放厂商'
    if (form.vendorIds.length > 5) errors.vendors = '厂商数量不能超过五个'
    if (!form.goal) errors.goal = '请选择投放目标'
    if (form.contractNo && form.contractNo.length > 32) errors.contractNo = '关联合同最多 32 字'
  }
  if (step === 2) {
    if (!form.regionPaths.length) errors.regions = '请至少选择一个投放地域'
    if (!form.gender) errors.gender = '请选择性别'
    if (!form.ageRanges.length) errors.ages = '请至少选择一个年龄段'
    if (form.interests.length > 5) errors.interests = '兴趣标签最多选择五个'
  }
  if (step === 3) {
    if (!form.startDate) errors.startDate = '请选择开始日期'
    else if (form.startDate < today()) errors.startDate = '开始日期不能早于当日'
    if (!form.endDate) errors.endDate = '请选择结束日期'
    else if (form.startDate && form.endDate < form.startDate) {
      errors.endDate = '结束日期不能早于开始日期'
    } else if (planDays.value > 365) {
      errors.endDate = '投放跨度不能超过 365 天'
    }
    const daily = Number(form.dailyBudget)
    const total = Number(form.totalBudget)
    if (!Number.isFinite(daily) || daily <= 0) errors.dailyBudget = '日预算必须大于零'
    else if (!/^\d+(\.\d{1,2})?$/.test(form.dailyBudget)) {
      errors.dailyBudget = '日预算最多保留两位小数'
    }
    if (!Number.isFinite(total) || total <= 0) errors.totalBudget = '总预算必须大于零'
    else if (total < daily) errors.totalBudget = '总预算不能小于日预算'
    else if (total > remainingBudget.value) {
      errors.totalBudget = `超出项目剩余预算，剩余可用金额为 ${formatAmount(remainingBudget.value)}`
    }
    if (!Number(form.targetImpressions) || Number(form.targetImpressions) <= 0) {
      errors.targetImpressions = '目标曝光量必须大于零'
    }
  }
  if (step === 4) {
    if (!confirmed.value) errors.confirm = '请先勾选确认后提交'
  }
  return !stepError(step)
}

function focusFirstError() {
  requestAnimationFrame(() => {
    const el = document.querySelector('.wizard-main .form-item.invalid, .wizard-main .confirm-row.invalid')
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
}

function nextStep() {
  if (!validateStep(current.value)) {
    focusFirstError()
    ElMessage.warning('请先修正当前步骤的校验问题')
    return
  }
  if (current.value < 4) current.value += 1
}

function goStep(step: number) {
  if (step < current.value) current.value = step
}

function buildPayload(publishMode: 'draft' | 'submit' | 'publish'): CampaignDraftPayload {
  return {
    name: form.name.trim(),
    projectId: form.projectId,
    channels: form.channels,
    vendorIds: form.vendorIds,
    goal: form.goal,
    contractNo: form.contractNo.trim() || undefined,
    targeting: {
      regions: form.regionPaths.map((path) =>
        path.length > 1 ? { province: path[0], city: path[1] } : { province: path[0] },
      ),
      gender: form.gender,
      ageRanges: [...form.ageRanges],
      interests: [...form.interests],
    },
    startDate: form.startDate,
    endDate: form.endDate,
    dailyBudget: Number(form.dailyBudget).toFixed(2),
    totalBudget: Number(form.totalBudget).toFixed(2),
    targetImpressions: String(form.targetImpressions),
    bidType: form.bidType,
    publishMode,
    remark: form.remark.trim() || undefined,
  }
}

async function persist(mode: 'draft' | 'submit' | 'publish') {
  if (editId.value) {
    await updateCampaign(editId.value, buildPayload(mode))
    return { ids: [editId.value], codes: [] as (string | null)[] }
  }
  return createCampaign(buildPayload(mode))
}

async function saveDraft() {
  if (saving.value) return
  if (!form.name.trim() || form.name.trim().length < 2) {
    current.value = 1
    errors.name = '计划名称需为 2 至 40 个字'
    ElMessage.warning('请先填写计划名称')
    return
  }
  saving.value = true
  try {
    const result = await persist('draft')
    ElMessage.success('草稿已保存，可在投放计划列表中继续编辑')
    const highlight = result?.ids?.[0]
    router.push(highlight ? `/campaign?highlight=${highlight}` : '/campaign')
  } catch (error) {
    ElMessage.error((error as Error).message || '保存草稿失败')
  } finally {
    saving.value = false
  }
}

async function submit() {
  if (submitting.value) return
  for (let step = 1; step <= 4; step += 1) {
    if (!validateStep(step)) {
      current.value = step
      focusFirstError()
      ElMessage.warning(`第 ${step} 步还有校验问题，请检查`)
      return
    }
  }
  submitting.value = true
  try {
    const result = await persist('publish')
    ElMessage.success(isFutureStart.value ? '计划已排期，将在开始日期自动发布' : '发布成功，已生成投放单号并开始投放')
    const highlight = result?.ids?.[0]
    router.push(highlight ? `/campaign?highlight=${highlight}` : '/campaign')
  } catch (error) {
    ElMessage.error((error as Error).message || '提交失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

function fillFromDetail(detail: Awaited<ReturnType<typeof getCampaign>>, asCopy: boolean) {
  form.name = asCopy ? `${detail.name}-副本` : detail.name
  form.projectId = detail.projectId
  form.channels = [detail.channel]
  form.vendorIds = detail.vendors.map((item) => item.id)
  form.goal = detail.goal
  form.bidType = detail.bidType
  form.contractNo = detail.contractNo ?? ''
  form.regionPaths = detail.targeting.regions.map((item) =>
    item.city ? [item.province, item.city] : [item.province],
  )
  form.gender = detail.targeting.gender
  form.ageRanges = [...detail.targeting.ageRanges]
  form.interests = [...detail.targeting.interests]
  form.startDate = detail.startDate
  form.endDate = detail.endDate
  form.dailyBudget = Number(detail.dailyBudget).toFixed(2)
  form.totalBudget = Number(detail.budget).toFixed(2)
  form.targetImpressions = Number(detail.targetImpressions)
  form.remark = detail.remark ?? ''
  form.publishMode = 'publish'
}

onMounted(async () => {
  app.loadProjects()
  dict.load()
  try {
    const result = await getVendors({ enabledOnly: true, pageSize: 100 })
    vendors.value = result.items
  } catch {
    vendors.value = []
  }
  const targetId = editId.value || copyId.value
  if (targetId) {
    try {
      const detail = await getCampaign(targetId)
      fillFromDetail(detail, mode.value === 'copy')
    } catch (error) {
      ElMessage.error((error as Error).message || '计划信息加载失败')
      router.replace('/campaign')
    }
  }
  if (app.currentProjectId && !targetId) form.projectId = app.currentProjectId
  if (!form.vendorIds.length && vendors.value.length) {
    form.vendorIds = [vendors.value[0].id]
  }
  if (!form.ageRanges.length) form.ageRanges = ['25-29', '30-39', '40-49']
  if (!form.regionPaths.length) {
    form.regionPaths = [
      ['江苏省', '苏州市'],
      ['上海市'],
    ]
  }
})
</script>

<style scoped>
.wizard-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 16px;
  align-items: start;
}
.wizard-main {
  overflow: hidden;
}
.steps {
  display: flex;
  align-items: stretch;
  gap: 0;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border-light);
  background: var(--color-surface);
}
.step {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
  padding-right: 16px;
}
.step.reachable {
  cursor: pointer;
}
.step-index {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12.5px;
  font-weight: 600;
  flex: none;
  background: var(--ink-50);
  color: #8a94a6;
  border: 1px solid #e3e9f0;
  transition: all 0.18s ease;
}
.step-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.step-title {
  font-size: 13.5px;
  font-weight: 500;
  color: var(--color-text-secondary);
  white-space: nowrap;
}
.step-desc {
  font-size: 11.5px;
  color: #a3adba;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.step-line {
  position: absolute;
  right: 0;
  top: 13px;
  width: 16px;
  height: 1px;
  background: var(--ink-100);
}
.step.active .step-index {
  background: var(--ink-950);
  border-color: var(--ink-950);
  color: var(--color-text-inverse);
  
}
.step.active .step-title {
  color: var(--color-text);
  font-weight: 600;
}
.step.done .step-index {
  background: var(--ink-50);
  border-color: var(--color-border);
  color: var(--color-text);
}
.step.done .step-title {
  color: var(--color-text);
}
.step.error .step-index {
  background: var(--ink-50);
  border-color: var(--color-border);
  color: var(--color-text);
}
.step.error.active .step-index {
  background: var(--ink-950);
  border-color: var(--signal-danger);
  color: var(--color-text-inverse);
  
}

.step-body {
  padding: 24px 24px 8px;
  min-height: 372px;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px 20px;
}
.span-2 {
  grid-column: span 2;
}
.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.form-item label {
  font-size: 13px;
  color: var(--color-text-secondary);
}
.form-item label i {
  color: var(--color-text);
  font-style: normal;
  margin-left: 2px;
}
.form-item.invalid :deep(.el-input__wrapper),
.form-item.invalid :deep(.el-select__wrapper),
.form-item.invalid :deep(.el-textarea__inner) {
  
}
.err {
  margin: 0;
  font-size: 12px;
  color: var(--color-text);
  line-height: 1.5;
}
.hint {
  margin: 0;
  font-size: 12px;
  color: var(--color-text-tertiary);
  line-height: 1.5;
}

.channel-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(126px, 1fr));
  gap: 10px;
}
.channel-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 52px;
  padding: 0 12px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  cursor: pointer;
  font-family: inherit;
  transition: all 0.16s ease;
}
.channel-card:hover {
  border-color: var(--color-border);
  background: #fff;
}
.channel-card.selected {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
  
}
.channel-label {
  font-size: 13px;
  color: var(--color-text);
  flex: 1;
  text-align: left;
}
.channel-check {
  color: var(--color-primary);
  font-size: 14px;
}

.goal-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.goal-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  transition: all 0.16s ease;
}
.goal-card:hover {
  border-color: var(--color-border);
  background: #fff;
}
.goal-card.selected {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
  
}
.goal-radio {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid #c2ccd8;
  flex: none;
  margin-top: 3px;
  position: relative;
}
.goal-card.selected .goal-radio {
  border-color: var(--color-primary);
}
.goal-card.selected .goal-radio::after {
  content: '';
  position: absolute;
  inset: 3px;
  border-radius: 50%;
  background: var(--color-primary);
}
.goal-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.goal-label {
  font-size: 13.5px;
  font-weight: 500;
  color: var(--color-text);
}
.goal-desc {
  font-size: 11.5px;
  color: var(--color-text-tertiary);
  line-height: 1.5;
}

.chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.chip {
  padding: 6px 14px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-xs);
  background: var(--color-surface);
  font-size: 13px;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s ease;
}
.chip:hover {
  border-color: var(--color-border);
}
.chip.selected {
  border-color: var(--ink-950);
  background: var(--ink-950);
  color: var(--color-text-inverse);
  
}

.review {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.review-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.review-title {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--color-text);
  padding-left: 8px;
  border-left: 3px solid var(--color-primary);
  line-height: 1.2;
}
.material-empty {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  font-size: 12.5px;
  color: var(--color-text-tertiary);
}
.publish-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 4px;
}
.publish-label {
  font-size: 13px;
  color: var(--color-text-secondary);
}
.publish-label i {
  color: var(--color-text);
  font-style: normal;
}
.confirm-row {
  padding: 14px 16px;
  border-radius: var(--radius-md);
  background: var(--ink-50);
  border: 1px solid var(--color-border-light);
}
.confirm-row.invalid {
  border-color: var(--color-border);
  background: var(--ink-50);
}

.wizard-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--color-border-light);
  background: var(--color-surface);
}
.foot-right {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-left: auto;
}
.foot-hint {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.summary {
  position: sticky;
  top: 16px;
  padding: 20px;
}
.summary-head {
  font-size: 13px;
  color: var(--color-text-tertiary);
  letter-spacing: 0.5px;
}
.summary-name {
  margin-top: 6px;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.45;
}
.summary-channels {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}
.summary-channel {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11.5px;
  font-weight: 500;
}
.summary-list {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px dashed var(--color-border-light);
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.summary-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  font-size: 12.5px;
  color: var(--color-text-secondary);
}
.summary-row strong {
  color: var(--color-text);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}
.budget-block {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--color-border-light);
}
.budget-head {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--color-text-secondary);
}
.budget-head .num {
  color: var(--color-text);
}
.budget-bar {
  margin-top: 8px;
  height: 6px;
  border-radius: var(--radius-xs);
  background: var(--ink-50);
  overflow: hidden;
}
.budget-fill {
  display: block;
  height: 100%;
  border-radius: var(--radius-xs);
  background: var(--ink-950);
  transition: width 0.3s ease;
}
.budget-foot {
  margin-top: 8px;
  font-size: 12px;
  color: var(--color-text-secondary);
}
.budget-foot strong {
  color: var(--color-text);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.summary-tip {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  background: var(--ink-25);
  font-size: 11.5px;
  line-height: 1.7;
  color: var(--color-text-secondary);
}
.summary-tip .el-icon {
  color: var(--color-text);
  margin-top: 2px;
}

@media (max-width: 1280px) {
  .wizard-layout {
    grid-template-columns: minmax(0, 1fr);
  }
  .summary {
    position: static;
  }
  .channel-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
