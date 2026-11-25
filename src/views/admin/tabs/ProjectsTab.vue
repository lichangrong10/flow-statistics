<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { Plus, RefreshLeft, Search } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { createProject, getProject, getProjects, updateProject } from '@/api/project'
import type { ProjectPayload } from '@/api/project'
import { useAppStore } from '@/stores/app'
import type { Project } from '@/types'
import EmptyState from '@/admin/components/EmptyState.vue'
import { errorMessage } from '@/admin/error'
import { formatDateRange, formatDateTime, formatMoney, toNumber } from '@/admin/format'

const app = useAppStore()

const loading = ref(false)
const rows = ref<Project[]>([])
const keyword = ref('')

const filteredRows = computed(() => {
  const text = keyword.value.trim().toLowerCase()
  if (!text) return rows.value
  return rows.value.filter(
    (row) =>
      row.name.toLowerCase().includes(text) ||
      row.client.toLowerCase().includes(text),
  )
})

async function load(): Promise<void> {
  loading.value = true
  try {
    const data = await getProjects()
    rows.value = data.items
  } catch (error) {
    ElMessage.error(errorMessage(error, '项目列表加载失败'))
  } finally {
    loading.value = false
  }
}

function resetQuery(): void {
  keyword.value = ''
}

interface ProjectFormModel {
  name: string
  client: string
  startDate: string
  endDate: string
  budget: number
}

const formRef = ref<FormInstance>()
const dialog = reactive({ visible: false, submitting: false, loading: false, editingId: 0 })
const form = reactive<ProjectFormModel>({
  name: '',
  client: '',
  startDate: dayjs().format('YYYY-MM-DD'),
  endDate: dayjs().add(30, 'day').format('YYYY-MM-DD'),
  budget: 0,
})

const isEdit = computed(() => dialog.editingId > 0)

const rules: FormRules = {
  name: [
    { required: true, message: '请输入项目名称', trigger: 'blur' },
    { min: 2, max: 40, message: '项目名称长度需为 2-40 个字符', trigger: 'blur' },
  ],
  client: [
    { required: true, message: '请输入客户/甲方', trigger: 'blur' },
    { max: 60, message: '客户名称不能超过 60 个字符', trigger: 'blur' },
  ],
  startDate: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  endDate: [
    { required: true, message: '请选择结束日期', trigger: 'change' },
    {
      validator: (_rule, value, callback) => {
        if (value && form.startDate && String(value) < form.startDate) {
          callback(new Error('结束日期不能早于开始日期'))
          return
        }
        callback()
      },
      trigger: 'change',
    },
  ],
  budget: [
    {
      validator: (_rule, value, callback) => {
        if (!Number(value) || Number(value) <= 0) {
          callback(new Error('总预算需大于 0'))
          return
        }
        callback()
      },
      trigger: 'change',
    },
  ],
}

function resetForm(): void {
  form.name = ''
  form.client = ''
  form.startDate = dayjs().format('YYYY-MM-DD')
  form.endDate = dayjs().add(30, 'day').format('YYYY-MM-DD')
  form.budget = 0
}

function openCreate(): void {
  dialog.editingId = 0
  resetForm()
  dialog.visible = true
  void nextTick(() => formRef.value?.clearValidate())
}

async function openEdit(row: Project): Promise<void> {
  dialog.editingId = row.id
  dialog.visible = true
  dialog.loading = true
  try {
    // 使用详情接口获取最新项目数据，避免列表字段不完整
    const detail = await getProject(row.id)
    form.name = detail.name
    form.client = detail.client
    form.startDate = detail.startDate
    form.endDate = detail.endDate
    form.budget = toNumber(detail.totalBudget)
    void nextTick(() => formRef.value?.clearValidate())
  } catch (error) {
    dialog.visible = false
    ElMessage.error(errorMessage(error, '项目详情加载失败'))
  } finally {
    dialog.loading = false
  }
}

async function handleSubmit(): Promise<void> {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  const payload: ProjectPayload = {
    name: form.name.trim(),
    client: form.client.trim(),
    startDate: form.startDate,
    endDate: form.endDate,
    budget: Number(form.budget).toFixed(2),
  }
  dialog.submitting = true
  try {
    if (isEdit.value) {
      await updateProject(dialog.editingId, payload)
      ElMessage.success('项目信息已更新')
    } else {
      await createProject(payload)
      ElMessage.success('项目已创建')
    }
    dialog.visible = false
    await load()
    await app.refreshProjects().catch(() => undefined)
  } catch (error) {
    ElMessage.error(errorMessage(error, '项目保存失败'))
  } finally {
    dialog.submitting = false
  }
}

onMounted(() => {
  void load()
})
</script>

<template>
  <div class="tab-panel">
    <div class="toolbar">
      <div class="toolbar__filters">
        <el-input
          v-model="keyword"
          class="filter-input"
          placeholder="搜索项目名称 / 客户"
          clearable
          :prefix-icon="Search"
        />
        <el-button :icon="RefreshLeft" @click="resetQuery">重置</el-button>
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreate">新增项目</el-button>
    </div>

    <div class="list-total">共 {{ filteredRows.length }} 个项目</div>

    <el-table v-loading="loading" :data="filteredRows" row-key="id" border stripe>
      <el-table-column prop="name" label="项目名称" min-width="190" show-overflow-tooltip />
      <el-table-column prop="client" label="客户/甲方" min-width="140" show-overflow-tooltip />
      <el-table-column label="项目周期" width="200">
        <template #default="{ row }">{{ formatDateRange(row.startDate, row.endDate) }}</template>
      </el-table-column>
      <el-table-column label="总预算" width="120" align="right">
        <template #default="{ row }">{{ formatMoney(row.totalBudget) }}</template>
      </el-table-column>
      <el-table-column label="已用预算" width="120" align="right">
        <template #default="{ row }">{{ formatMoney(row.usedBudget) }}</template>
      </el-table-column>
      <el-table-column label="剩余预算" width="120" align="right">
        <template #default="{ row }">{{ formatMoney(row.remainingBudget) }}</template>
      </el-table-column>
      <el-table-column label="创建时间" width="150">
        <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="72" align="center">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
        </template>
      </el-table-column>
      <template #empty>
        <EmptyState description="暂无项目" hint="新增项目后，可在创建投放计划时选择" />
      </template>
    </el-table>

    <el-dialog
      v-model="dialog.visible"
      :title="isEdit ? '编辑项目' : '新增项目'"
      width="min(560px, calc(100vw - 32px))"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        v-loading="dialog.loading"
        :model="form"
        :rules="rules"
        label-width="92px"
        label-position="left"
      >
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="form.name" placeholder="2-40 个字符，如 2026 冬季品牌拉新" maxlength="40" />
        </el-form-item>
        <el-form-item label="客户/甲方" prop="client">
          <el-input v-model="form.client" placeholder="如 太仓分公司" maxlength="60" />
        </el-form-item>
        <el-form-item label="开始日期" prop="startDate">
          <el-date-picker
            v-model="form.startDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择开始日期"
            class="full-width"
          />
        </el-form-item>
        <el-form-item label="结束日期" prop="endDate">
          <el-date-picker
            v-model="form.endDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择结束日期"
            class="full-width"
          />
        </el-form-item>
        <el-form-item label="总预算" prop="budget">
          <el-input-number
            v-model="form.budget"
            :min="0"
            :precision="2"
            :step="1000"
            controls-position="right"
            class="full-width"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="dialog.submitting" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.tab-panel {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.toolbar__filters {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-input {
  width: 260px;
}

.list-total {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.full-width {
  width: 100%;
}

@media (max-width: 720px) {
  .toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .toolbar__filters {
    width: 100%;
  }

  .filter-input {
    flex: 1;
    width: auto;
    min-width: 0;
  }

  .toolbar > :deep(.el-button) {
    width: 100%;
    margin-left: 0;
  }
}
</style>
