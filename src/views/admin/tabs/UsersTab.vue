<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import { RefreshLeft, Search } from '@element-plus/icons-vue';
import type { User } from '@/admin/types';
import { listUsers, resetUserPassword, updateUser } from '@/admin/system';
import { useUserStore } from '@/stores/user';
import { STATUS_OPTIONS } from '@/admin/domain';
import { formatDateTime } from '@/admin/format';
import { errorMessage } from '@/admin/error';
import { isAccount } from '@/admin/validate';
import EmptyState from '@/admin/components/EmptyState.vue';

const props = withDefaults(defineProps<{ refreshToken?: number }>(), { refreshToken: 0 });

const userStore = useUserStore();

const loading = ref(false);
const rows = ref<User[]>([]);
const total = ref(0);

const query = reactive({
  keyword: '',
  status: '' as 0 | 1 | '',
  page: 1,
  pageSize: 10
});

const selfId = computed(() => userStore.profile?.id ?? 0);

async function load(): Promise<void> {
  loading.value = true;
  try {
    const data = await listUsers({
      keyword: query.keyword.trim() || undefined,
      role: 'admin',
      status: query.status,
      page: query.page,
      pageSize: query.pageSize
    });
    // 只展示管理员账号，历史普通账号不再进入管理列表
    rows.value = data.list.filter((item) => item.role === 'admin');
    total.value = data.total;
  } catch (error) {
    ElMessage.error(errorMessage(error, '管理员账号列表加载失败'));
  } finally {
    loading.value = false;
  }
}

function handleSearch(): void {
  query.page = 1;
  void load();
}

function handleResetQuery(): void {
  query.keyword = '';
  query.status = '';
  query.page = 1;
  void load();
}

function handleSizeChange(): void {
  query.page = 1;
  void load();
}

/* ============================ 新增 / 编辑 ============================ */

interface UserFormModel {
  account: string;
  name: string;
}

const formRef = ref<FormInstance>();
const dialog = reactive({ visible: false, submitting: false, editingId: 0 });
const form = reactive<UserFormModel>({ account: '', name: '' });

const isEdit = computed(() => dialog.editingId > 0);
const isSelfEdit = computed(() => isEdit.value && dialog.editingId === selfId.value);

const rules = computed<FormRules>(() => ({
  account: [
    { required: true, message: '请输入登录账号', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (isEdit.value) {
          callback();
          return;
        }
        if (!isAccount(String(value ?? ''))) {
          callback(new Error('账号需以字母开头，长度 4-20 位，可包含数字与下划线'));
          return;
        }
        callback();
      },
      trigger: 'blur'
    }
  ],
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '姓名长度需为 2-20 个字符', trigger: 'blur' }
  ],
}));

function openEdit(row: User): void {
  dialog.editingId = row.id;
  form.account = row.account;
  form.name = row.name;
  dialog.visible = true;
  void nextTick(() => formRef.value?.clearValidate());
}

async function handleSubmit(): Promise<void> {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;
  dialog.submitting = true;
  try {
    const updated = await updateUser(dialog.editingId, {
      name: form.name.trim()
    });
    if (updated.id === selfId.value) void userStore.fetchProfile();
    ElMessage.success('管理员账号已更新');
    dialog.visible = false;
    await load();
  } catch (error) {
    ElMessage.error(errorMessage(error, '保存失败'));
  } finally {
    dialog.submitting = false;
  }
}

/* ============================ 启停 / 重置密码 ============================ */

async function handleStatusChange(row: User, value: string | number | boolean): Promise<void> {
  const status: 0 | 1 = Number(value) === 1 ? 1 : 0;
  try {
    await updateUser(row.id, { status });
    ElMessage.success(status === 1 ? `已启用账号 ${row.account}` : `已停用账号 ${row.account}`);
    await load();
  } catch (error) {
    ElMessage.error(errorMessage(error, '状态更新失败'));
  }
}

async function handleResetPassword(row: User): Promise<void> {
  try {
    await ElMessageBox.confirm(
      `将重置账号 ${row.account}（${row.name}）的登录密码，重置后需将新密码告知本人，是否继续？`,
      '重置密码',
      { confirmButtonText: '重置密码', cancelButtonText: '取消', type: 'warning' }
    );
  } catch {
    return;
  }
  try {
    const data = await resetUserPassword(row.id);
    await ElMessageBox.alert(`账号 ${row.account} 的新密码为：${data.password}`, '密码已重置', {
      confirmButtonText: '知道了',
      type: 'success'
    });
  } catch (error) {
    ElMessage.error(errorMessage(error, '重置密码失败'));
  }
}

watch(
  () => props.refreshToken,
  () => {
    query.page = 1;
    void load();
  }
);

onMounted(() => {
  void load();
});
</script>

<template>
  <div class="tab-panel">
    <div class="toolbar">
      <div class="toolbar__filters">
        <el-input
          v-model="query.keyword"
          class="filter-input"
          placeholder="搜索管理员账号 / 姓名"
          clearable
          :prefix-icon="Search"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
        <el-select v-model="query.status" class="filter-select" placeholder="全部状态" clearable>
          <el-option v-for="item in STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
        <el-button :icon="RefreshLeft" @click="handleResetQuery">重置</el-button>
      </div>
    </div>

    <el-table v-loading="loading" :data="rows" row-key="id" border stripe>
      <el-table-column label="账号" min-width="150">
        <template #default="{ row }">
          <span class="mono">{{ row.account }}</span>
          <el-tag v-if="row.id === selfId" class="self-tag" size="small" effect="plain">当前账号</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="姓名" min-width="110" />
      <el-table-column label="状态" width="110">
        <template #default="{ row }">
          <el-switch
            :model-value="row.status"
            :active-value="1"
            :inactive-value="0"
            :disabled="row.id === selfId"
            inline-prompt
            active-text="启用"
            inactive-text="停用"
            @change="(value: string | number | boolean) => handleStatusChange(row, value)"
          />
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="160">
        <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="最后登录" width="160">
        <template #default="{ row }">
          <span :class="{ 'text-muted': !row.lastLoginAt }">
            {{ row.lastLoginAt ? formatDateTime(row.lastLoginAt) : '从未登录' }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link type="primary" @click="handleResetPassword(row)">重置密码</el-button>
        </template>
      </el-table-column>
      <template #empty>
        <EmptyState description="暂无管理员账号" hint="账号由后端统一发放，仅支持维护显示名称与密码" />
      </template>
    </el-table>

    <div class="pager">
      <el-pagination
        v-model:current-page="query.page"
        v-model:page-size="query.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @current-change="load"
        @size-change="handleSizeChange"
      />
    </div>

    <el-dialog
      v-model="dialog.visible"
      title="编辑管理员账号"
      width="480px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="88px" label-position="left">
        <el-form-item label="登录账号" prop="account">
          <el-input v-model="form.account" :disabled="isEdit" placeholder="字母开头，4-20 位" maxlength="20" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="2-20 个字符" maxlength="20" />
        </el-form-item>
        <el-alert
          v-if="isSelfEdit"
          type="info"
          :closable="false"
          show-icon
          title="不能修改或停用当前登录账号，请使用其他管理员账号操作。"
        />
        <el-alert
          v-else-if="isEdit"
          class="form-alert"
          type="info"
          :closable="false"
          show-icon
          title="管理端不做物理删除，停用后保留历史数据与操作记录。"
        />
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

.filter-input {
  width: 220px;
}

.filter-select {
  width: 140px;
}

.self-tag {
  margin-left: 6px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
}

.form-alert {
  margin-top: 4px;
}
</style>
