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
  gap: 0;
  padding: 0;
  background: transparent;
  border: var(--hairline);
  border-radius: var(--radius-xs);
  overflow: hidden;
}
.seg-item {
  appearance: none;
  border: none;
  border-radius: 0;
  background: transparent;
  padding: 5px 12px;
  height: 28px;
  font-size: var(--font-size-aux);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background-color 0.12s ease, color 0.12s ease;
  font-family: inherit;
  white-space: nowrap;
}
.seg-item + .seg-item {
  border-left: var(--hairline);
}
.seg-item:hover {
  color: var(--color-text);
}
.seg-item.active {
  background: var(--ink-950);
  color: var(--color-text-inverse);
  font-weight: 600;
}
</style>
