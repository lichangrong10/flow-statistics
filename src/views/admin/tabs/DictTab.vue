<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import type { ChannelDict } from '@/admin/types';
import { listChannels, updateChannel } from '@/admin/system';
import { BID_MODE_OPTIONS } from '@/admin/domain';
import { formatDateTime } from '@/admin/format';
import { errorMessage } from '@/admin/error';
import ChannelIcon from '@/components/ChannelIcon.vue';
import type { ChannelCode } from '@/types';

const props = withDefaults(defineProps<{ refreshToken?: number }>(), { refreshToken: 0 });

const loading = ref(false);
const savingKey = ref('');
const channels = ref<ChannelDict[]>([]);

async function loadAll(): Promise<void> {
  loading.value = true;
  try {
    channels.value = await listChannels();
  } catch (error) {
    ElMessage.error(errorMessage(error, '字典配置加载失败'));
  } finally {
    loading.value = false;
  }
}

/* ============================ 渠道字典 ============================ */

async function patchChannel(
  row: ChannelDict,
  patch: Partial<ChannelDict>,
  successText: string
): Promise<void> {
  savingKey.value = `channel:${row.code}`;
  try {
    const updated = await updateChannel(row.code, patch);
    channels.value = channels.value.map((item) => (item.code === updated.code ? updated : item));
    ElMessage.success(successText);
  } catch (error) {
    ElMessage.error(errorMessage(error, '渠道配置保存失败'));
    await loadAll();
  } finally {
    savingKey.value = '';
  }
}

function saveChannelName(row: ChannelDict): void {
  const name = row.name.trim();
  if (!name) {
    ElMessage.warning('渠道名称不能为空');
    void loadAll();
    return;
  }
  void patchChannel(row, { name }, '渠道名称已保存');
}

function handleChannelEnabled(row: ChannelDict): void {
  void patchChannel(row, { enabled: row.enabled }, row.enabled ? '渠道已开通' : '渠道已停用');
}

function handleChannelBidMode(row: ChannelDict): void {
  void patchChannel(row, { bidMode: row.bidMode }, '默认出价方式已更新');
}


watch(
  () => props.refreshToken,
  () => {
    void loadAll();
  }
);

onMounted(() => {
  void loadAll();
});
</script>

<template>
  <div v-loading="loading" class="dict-tab">

    <!-- 渠道字典 -->
    <section class="section">
      <div class="section__head">
        <h3 class="card-title">渠道字典</h3>
        <span class="section__hint">停用后业务端不可再选择该渠道；修改名称、出价方式会即时生效</span>
      </div>
      <el-table :data="channels" border size="small">
        <el-table-column label="图标" width="70" align="center">
          <template #default="{ row }">
            <ChannelIcon :channel="row.code as ChannelCode" :size="20" />
          </template>
        </el-table-column>
        <el-table-column label="渠道编码" width="130">
          <template #default="{ row }">
            <span class="mono">{{ row.code }}</span>
          </template>
        </el-table-column>
        <el-table-column label="渠道名称" min-width="160">
          <template #default="{ row }">
            <el-input
              v-model="row.name"
              size="small"
              maxlength="12"
              :disabled="savingKey === `channel:${row.code}`"
              @change="saveChannelName(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="是否开通" width="110" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.enabled"
              :loading="savingKey === `channel:${row.code}`"
              @change="handleChannelEnabled(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="默认出价方式" width="180">
          <template #default="{ row }">
            <el-select
              v-model="row.bidMode"
              size="small"
              :disabled="savingKey === `channel:${row.code}`"
              @change="handleChannelBidMode(row)"
            >
              <el-option
                v-for="item in BID_MODE_OPTIONS"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.updatedAt) }}</template>
        </el-table-column>
      </el-table>
    </section>

  </div>
</template>

<style scoped>
.dict-tab {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  padding: 16px 20px 20px;
}

.section__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.section__hint {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
}


</style>
