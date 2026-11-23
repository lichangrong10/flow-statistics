<template>
  <div class="login-page">
    <section class="brand-panel">
      <div class="brand-content">
        <div class="brand-top">
          <div>
            <div class="logo-title">投流统计平台</div>
            <div class="logo-sub">AD DELIVERY STATISTICS PLATFORM</div>
          </div>
        </div>

        <div class="brand-copy">
          <h1>让每一次投放<br />都有据可依</h1>
          <p>
            2026 年太仓分公司全域融数智能投放服务 · 统一排期、过程跟踪、结果核验，
            把投放动作与投放结果沉淀为可查询、可核验、可导出的数据资产。
          </p>
          <ul class="feature-list">
            <li>
              <span class="feature-index">01</span>
              <div>
                <div class="feature-title">多渠道统一管理</div>
                <div class="feature-desc">抖音、微信、小红书、快手、百度一屏统管</div>
              </div>
            </li>
            <li>
              <span class="feature-index">02</span>
              <div>
                <div class="feature-title">指标口径固定</div>
                <div class="feature-desc">计划、日期、人群维度三级粒度，双方共用一套口径</div>
              </div>
            </li>
            <li>
              <span class="feature-index">03</span>
              <div>
                <div class="feature-title">数据可追溯</div>
                <div class="feature-desc">分日与人群数据可查询、可核验、可导出</div>
              </div>
            </li>
          </ul>
        </div>

        <div class="brand-foot">
          <span>© 2026 投流统计平台</span>
        </div>
      </div>
    </section>

    <section class="form-panel">
      <div class="form-wrap">
        <div class="form-head">
          <div class="welcome">欢迎登录</div>
          <div class="welcome-sub">请使用平台分配的用户账号进入数据工作台</div>
        </div>


        <el-form class="login-form" @submit.prevent="onSubmit">
          <el-form-item>
            <el-input
              v-model="form.username"
              size="large"
              placeholder="请输入账号"
              :prefix-icon="User"
              autocomplete="username"
              @keyup.enter="onSubmit"
            />
          </el-form-item>
          <el-form-item>
            <el-input
              v-model="form.password"
              size="large"
              :type="showPassword ? 'text' : 'password'"
              placeholder="请输入密码"
              :prefix-icon="Lock"
              autocomplete="current-password"
              @keyup.enter="onSubmit"
            >
              <template #suffix>
                <el-icon class="pwd-toggle" @click="showPassword = !showPassword">
                  <View v-if="showPassword" />
                  <Hide v-else />
                </el-icon>
              </template>
            </el-input>
          </el-form-item>

          <div v-if="errorText" class="error-text">
            <el-icon><WarningFilled /></el-icon>
            {{ errorText }}
          </div>

          <el-button
            type="primary"
            size="large"
            class="submit-btn"
            :loading="loading"
            @click="onSubmit"
          >
            {{ loading ? '正在登录…' : '登 录' }}
          </el-button>
        </el-form>

        <router-link class="admin-entry" to="/admin/login">管理员登录</router-link>

        <div class="form-foot">
          <span>© 2026 投流统计平台</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Hide, Lock, User, View, WarningFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useDictStore } from '@/stores/dict'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const route = useRoute()
const user = useUserStore()
const dict = useDictStore()
const app = useAppStore()

const loading = ref(false)
const showPassword = ref(false)
const errorText = ref('')

const form = reactive({
  username: '',
  password: '',
})

async function onSubmit() {
  if (loading.value) return
  errorText.value = ''
  if (!form.username.trim() || !form.password) {
    errorText.value = '请输入账号与密码'
    return
  }
  loading.value = true
  try {
    await user.login(form.username.trim(), form.password)
    await Promise.allSettled([dict.load(), app.loadProjects()])
    ElMessage.success(`欢迎回来，${user.displayName}`)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
    await router.replace(redirect || '/dashboard')
  } catch (error) {
    errorText.value = (error as Error).message || '登录失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  display: flex;
  min-height: 100vh;
  background: var(--color-bg);
}

/* ---------------- 左侧品牌区 ---------------- */
.brand-panel {
  position: relative;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  background: #111110;
  color: #f5f4f1;
  display: flex;
}
.brand-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 100%;
  padding: 48px 64px 40px;
}
.brand-top {
  display: flex;
  align-items: center;
  gap: 12px;
}
.logo-title {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.5px;
}
.logo-sub {
  margin-top: 2px;
  font-size: 10px;
  letter-spacing: 1.6px;
  color: rgba(255, 255, 255, 0.42);
}
.brand-copy h1 {
  font-size: var(--font-size-display);
  line-height: 1.12;
  letter-spacing: -0.02em;
  font-weight: 600;
  margin-bottom: 20px;
}
.brand-copy > p {
  max-width: 520px;
  font-size: 14px;
  line-height: 1.9;
  color: rgba(255, 255, 255, 0.66);
}
.feature-list {
  margin-top: 40px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}
.feature-list li {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}
.feature-index {
  font-family: var(--font-mono);
  font-size: var(--font-size-micro);
  color: var(--ink-500);
  border-top: 1px solid rgba(255, 255, 255, 0.24);
  padding-top: 5px;
  width: 30px;
  flex: none;
  letter-spacing: 0.06em;
}
.feature-title {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.92);
}
.feature-desc {
  margin-top: 3px;
  font-size: 12.5px;
  color: rgba(255, 255, 255, 0.5);
}
.brand-foot {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 11.5px;
  color: rgba(255, 255, 255, 0.36);
  letter-spacing: 0.4px;
}
.sep {
  width: 1px;
  height: 10px;
  background: rgba(255, 255, 255, 0.2);
}

/* ---------------- 右侧表单区 ---------------- */
.form-panel {
  flex: none;
  width: 480px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 32px;
  background: var(--color-surface);
  border-left: var(--hairline);
}
.form-wrap {
  width: 100%;
  max-width: 360px;
}
.form-head {
  margin-bottom: 28px;
}
.welcome {
  font-size: var(--font-size-page-title);
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: var(--tracking-tight);
}
.welcome-sub {
  margin-top: 8px;
  font-size: 13px;
  color: var(--color-text-secondary);
}
.login-form :deep(.el-input__wrapper) {
  padding: 4px 12px;
  border-radius: var(--radius-xs);
  
  background: var(--color-surface);
}
.login-form :deep(.el-input__wrapper.is-focus) {
  
  background: var(--color-surface);
}
.login-form :deep(.el-input__inner) {
  height: 40px;
}
.pwd-toggle {
  cursor: pointer;
  color: var(--color-text-tertiary);
}
.error-text {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: -4px 0 14px;
  font-size: var(--font-size-aux);
  color: var(--color-text);
}
.error-text .el-icon {
  color: var(--signal-danger);
}
.role-switch {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  margin-bottom: 20px;
  border: var(--hairline);
  border-radius: var(--radius-xs);
  overflow: hidden;
}
.role-item {
  height: 36px;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: var(--font-size-aux);
  font-family: inherit;
  cursor: pointer;
  transition: background-color 0.12s ease, color 0.12s ease;
}
.role-item + .role-item {
  border-left: var(--hairline);
}
.role-item.active {
  background: var(--ink-950);
  color: var(--color-text-inverse);
  font-weight: 600;
}
.role-item:hover:not(.active) {
  background: var(--ink-50);
  color: var(--color-text);
}
.submit-btn {
  width: 100%;
  height: 40px;
  font-size: var(--font-size-body);
  letter-spacing: 0.08em;
  border-radius: var(--radius-xs);
  margin-top: 4px;
}
.admin-entry {
  display: inline-block;
  margin-top: 16px;
  font-size: var(--font-size-micro);
  color: var(--color-text-tertiary);
}
.admin-entry:hover {
  color: var(--color-text);
}
.form-foot {
  margin-top: 32px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
  color: #b3bdc9;
}

@media (max-width: 900px) {
  .brand-panel {
    display: none;
  }
  .form-panel {
    width: 100%;
    padding: 40px 24px;
    border-left: 0;
  }
}
</style>
