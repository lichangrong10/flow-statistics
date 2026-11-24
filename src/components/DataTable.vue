<template>
  <div class="data-table">
    <div v-if="$slots.toolbar" class="table-toolbar">
      <slot name="toolbar" />
    </div>
    <div class="mobile-scroll-hint">左右滑动查看完整表格</div>
    <div class="table-scroll">
      <el-table
      :data="data"
      :row-key="rowKey"
      v-loading="loading"
      :element-loading-text="loadingText"
      :row-class-name="rowClassName"
      :cell-class-name="cellClassName"
      @selection-change="onSelectionChange"
      @sort-change="onSortChange"
      @row-click="onRowClick"
    >
      <el-table-column v-if="selectable" type="selection" width="44" align="center" />
      <el-table-column
        v-for="col in columns"
        :key="col.prop || col.label"
        :prop="col.prop"
        :label="col.label"
        :width="col.width"
        :min-width="col.minWidth"
        :align="col.align ?? 'left'"
        :fixed="col.fixed"
        :sortable="col.sortable ? 'custom' : false"
        :show-overflow-tooltip="col.slot ? false : col.ellipsis !== false"
      >
        <template #default="{ row }">
          <slot v-if="col.slot" :name="col.slot" :row="row" :value="row[col.prop]" />
          <span v-else>{{ formatCell(row[col.prop]) }}</span>
        </template>
      </el-table-column>
      <template #empty>
        <slot name="empty">
          <EmptyState
            :type="emptyType"
            :title="emptyTitle"
            :description="emptyDesc"
            :action-text="emptyAction"
            @action="emit('empty-action')"
          />
        </slot>
      </template>
      </el-table>
    </div>

    <div v-if="showPager" class="table-pager">
      <el-pagination
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        :current-page="page"
        :page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        @current-change="onPageChange"
        @size-change="onSizeChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import EmptyState from './EmptyState.vue'
import type { TableColumn } from '@/types'

const props = withDefaults(
  defineProps<{
    columns: TableColumn[]
    data: Record<string, unknown>[]
    loading?: boolean
    loadingText?: string
    total?: number
    page?: number
    pageSize?: number
    rowKey?: string
    selectable?: boolean
    showPager?: boolean
    emptyType?: 'no-data' | 'no-result' | 'error'
    emptyTitle?: string
    emptyDesc?: string
    emptyAction?: string
    rowClassName?: (data: { row: Record<string, unknown>; rowIndex: number }) => string
    cellClassName?: (data: { column: { property?: string } }) => string
  }>(),
  {
    loading: false,
    loadingText: '加载中…',
    total: 0,
    page: 1,
    pageSize: 20,
    rowKey: 'id',
    selectable: false,
    showPager: false,
    emptyType: 'no-data',
    emptyTitle: '',
    emptyDesc: '',
    emptyAction: '',
    rowClassName: undefined,
    cellClassName: undefined,
  },
)

const emit = defineEmits<{
  'page-change': [page: number]
  'size-change': [size: number]
  'selection-change': [rows: unknown[]]
  'sort-change': [payload: { prop: string; order: 'ascending' | 'descending' | null }]
  'row-click': [row: Record<string, unknown>]
  'empty-action': []
}>()

function formatCell(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}

function onSelectionChange(rows: unknown[]) {
  emit('selection-change', rows)
}

function onSortChange(payload: { prop: string; order: 'ascending' | 'descending' | null }) {
  emit('sort-change', payload)
}

function onRowClick(row: Record<string, unknown>) {
  emit('row-click', row)
}

function onPageChange(value: number) {
  emit('page-change', value)
}

function onSizeChange(value: number) {
  emit('size-change', value)
}
</script>

<style scoped>
.table-scroll {
  min-width: 0;
  overflow-x: auto;
}
@media (max-width: 1279px) {
  .table-scroll :deep(.el-table) {
    min-width: 980px;
  }
}
.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.table-pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
.mobile-scroll-hint {
  display: none;
}
@media (max-width: 720px) {
  .mobile-scroll-hint {
    display: block;
    margin-bottom: 6px;
    font-size: 11px;
    color: var(--color-text-tertiary);
  }
  .table-pager {
    justify-content: center;
  }
  .table-pager :deep(.el-pagination) {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
    row-gap: 8px;
  }
  .table-pager :deep(.el-pagination__sizes),
  .table-pager :deep(.el-pagination__jump) {
    display: none;
  }
}
@media (max-width: 560px) {
  .table-pager :deep(.el-pagination__total) {
    display: none;
  }
  .table-pager :deep(.el-pagination .btn-prev),
  .table-pager :deep(.el-pagination .btn-next) {
    margin: 0;
  }
}
</style>
