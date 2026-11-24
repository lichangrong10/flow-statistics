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
  line-height: 34px;
  color: var(--color-text);
  letter-spacing: var(--tracking-tight);
  white-space: nowrap;
}
.subtitle {
  margin-top: 4px;
  font-size: var(--font-size-aux);
  color: var(--color-text-tertiary);
  letter-spacing: 0.01em;
}
.right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
}

@media (max-width: 720px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .right {
    width: 100%;
    flex-wrap: wrap;
  }
}

@media (max-width: 720px) {
  .subtitle {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}
</style>
