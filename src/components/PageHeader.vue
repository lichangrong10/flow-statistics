<template>
  <div class="page-header">
    <div class="left">
      <h1 v-if="title" class="title">{{ title }}</h1>
      <p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
      <slot name="meta" />
    </div>
    <div class="right">
      <slot name="extra" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
  subtitle?: string
}>()
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}
.title {
  font-size: var(--font-size-page-title);
  font-weight: 600;
  line-height: 28px;
  color: var(--color-text);
  letter-spacing: 0.2px;
}
.subtitle {
  margin-top: 4px;
  font-size: 13px;
  color: var(--color-text-secondary);
}
.right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
}
</style>
