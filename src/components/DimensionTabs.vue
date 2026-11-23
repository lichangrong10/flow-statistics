<template>
  <div class="segmented">
    <button
      v-for="item in items"
      :key="item.key"
      type="button"
      class="seg-item"
      :class="{ active: modelValue === item.key }"
      @click="emit('update:modelValue', item.key)"
    >
      {{ item.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
  items: { key: string; label: string }[]
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<style scoped>
.segmented {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  background: #f2f5f9;
  border-radius: 8px;
}
.seg-item {
  appearance: none;
  border: none;
  background: transparent;
  padding: 5px 12px;
  height: 28px;
  border-radius: 6px;
  font-size: 12.5px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
  white-space: nowrap;
}
.seg-item:hover {
  color: var(--color-text);
}
.seg-item.active {
  background: #fff;
  color: var(--color-primary);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(23, 65, 107, 0.1);
}
</style>
