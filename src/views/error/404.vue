<template>
  <div class="error-page">
    <div class="error-code">404</div>
    <h1>页面不存在</h1>
    <p>你访问的地址不存在或已被移除，请检查链接后重试。</p>
    <div class="actions">
      <el-button type="primary" @click="router.replace('/dashboard')">返回工作台</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<style scoped>
.error-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  text-align: center;
  padding: 24px;
}
.error-code {
  font-size: 96px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 4px;
  color: #dbe4ee;
}
h1 {
  margin-top: 12px;
  font-size: 20px;
  color: var(--color-text);
}
p {
  margin-top: 8px;
  font-size: 13px;
  color: var(--color-text-secondary);
}
.actions {
  margin-top: 24px;
}
</style>
