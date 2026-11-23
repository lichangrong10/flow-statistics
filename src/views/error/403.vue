<template>
  <div class="error-page">
    <div class="error-code">403</div>
    <h1>无访问权限</h1>
    <p>当前账号没有访问该页面的权限，请联系管理员开通后重试。</p>
    <div class="actions">
      <el-button type="primary" @click="router.replace('/dashboard')">返回工作台</el-button>
      <el-button @click="router.back()">返回上一页</el-button>
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
