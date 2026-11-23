<template>
  <div class="login-page">
    <section class="brand-panel">
      <div class="grid-lines" />
      <div class="glow glow-1" />
      <div class="glow glow-2" />
      <div class="brand-content">
        <div class="brand-top">
          <div class="logo-mark">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
              <path
                d="M4 19V9.5M9.33 19V5M14.67 19v-6.5M20 19V8"
                stroke="currentColor"
                stroke-width="2.4"
                stroke-linecap="round"
              />
            </svg>
          </div>
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
                <div class="feature-title">交付即可用</div>
                <div class="feature-desc">稳定布局，1440 与 1920 下可直接截图验收</div>
              </div>
            </li>
          </ul>
        </div>

        <div class="brand-foot">
          <span>文档编号 TC-ADP-FE-TS-001</span>
          <span class="sep" />
          <span>版本 {{ version }}</span>
          <span class="sep" />
          <span>内部资料</span>
        </div>
      </div>
    </section>

    <section class="form-panel">
      <div class="form-wrap">
        <div class="form-head">
          <div class="welcome">欢迎登录</div>
          <div class="welcome-sub">{{ roleSubtitle }}</div>
        </div>

        <div class="role-switch">
          <button
            v-for="item in roleTabs"
            :key="item.value"
            type="button"
            class="role-item"
            :class="{ active: role === item.value }"
            @click="switchRole(item.value)"
          >
            {{ item.label }}
          </button>
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

        <div class="demo-block">
          <div class="demo-title">演示账号</div>
          <div class="demo-items">
            <button
              v-for="account in demoAccounts"
              :key="account.username"
              type="button"
              class="demo-item"
              @click="fillDemo(account.username, account.password)"
            >
              <span class="demo-role">{{ account.label }}</span>
              <span class="demo-name">{{ account.username }} / {{ account.password }}</span>
            </button>
          </div>
          <div class="demo-hint">
            当前连接内网后端，数据由后端按模拟参数生成，不涉及真实媒体下单。
          </div>
        </div>

        <div class="form-foot">
          <span>建议使用 Chrome 100 及以上版本</span>
          <span class="sep" />
          <span>内网访问</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Hide, Lock, User, View, WarningFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useDictStore } from '@/stores/dict'
import { useAppStore } from '@/stores/app'
import { APP_VERSION } from '@/constants'

const router = useRouter()
const route = useRoute()
const user = useUserStore()
const dict = useDictStore()
const app = useAppStore()

const version = APP_VERSION
const loading = ref(false)
const showPassword = ref(false)
const errorText = ref('')

type LoginRole = 'admin' | 'user'

const role = ref<LoginRole>('admin')

const roleTabs: { value: LoginRole; label: string }[] = [
  { value: 'admin', label: '管理员登录' },
  { value: 'user', label: '普通用户登录' },
]

const roleSubtitle = computed(() =>
  role.value === 'admin'
    ? '管理员可进入系统管理，维护用户、厂商、模拟参数、字典与操作日志'
    : '请使用平台分配的账号进入数据工作台',
)

const form = reactive({
  username: 'root',
  password: 'root',
})

const demoAccounts = computed(() =>
  role.value === 'admin'
    ? [{ username: 'root', password: 'root', label: '管理员' }]
    : [{ username: 'operator', password: '123456', label: '普通用户' }],
)

function switchRole(value: LoginRole) {
  role.value = value
  errorText.value = ''
  if (value === 'admin') {
    form.username = 'root'
    form.password = 'root'
  } else {
    form.username = 'operator'
    form.password = '123456'
  }
}

function fillDemo(username: string, password: string) {
  form.username = username
  form.password = password
  errorText.value = ''
}

async function onSubmit() {
  if (loading.value) return
  errorText.value = ''
  if (!form.username.trim() || !form.password) {
    errorText.value = '请输入账号与密码'
    return
  }
  loading.value = true
  try {
    const result = await user.login(form.username.trim(), form.password)
    if (role.value === 'admin' && result.user.role !== 'admin') {
      await user.logout()
      errorText.value = '该账号不是管理员，请切换到「普通用户登录」'
      return
    }
    await Promise.allSettled([dict.load(), app.loadProjects()])
    ElMessage.success(`欢迎回来，${user.displayName}`)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
    const fallback = role.value === 'admin' ? '/admin' : '/dashboard'
    await router.replace(redirect || fallback)
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
  background: #fff;
}

/* ---------------- 左侧品牌区 ---------------- */
.brand-panel {
  position: relative;
  flex: 1.15;
  min-width: 0;
  overflow: hidden;
  background: linear-gradient(150deg, #12304f 0%, #17416b 52%, #0d2740 100%);
  color: #fff;
  display: flex;
}
.grid-lines {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: radial-gradient(circle at 30% 30%, #000 0%, transparent 72%);
}
.glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
}
.glow-1 {
  width: 460px;
  height: 460px;
  right: -120px;
  top: -120px;
  background: rgba(46, 109, 164, 0.42);
}
.glow-2 {
  width: 380px;
  height: 380px;
  left: -100px;
  bottom: -140px;
  background: rgba(46, 156, 154, 0.18);
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
.logo-mark {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.12);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.18);
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
  font-size: 42px;
  line-height: 1.28;
  letter-spacing: 1px;
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
  font-size: 12px;
  color: rgba(255, 255, 255, 0.38);
  border-top: 1px solid rgba(255, 255, 255, 0.24);
  padding-top: 5px;
  width: 30px;
  flex: none;
  letter-spacing: 1px;
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
  flex: 1;
  min-width: 480px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: #fff;
}
.form-wrap {
  width: 100%;
  max-width: 360px;
}
.form-head {
  margin-bottom: 28px;
}
.welcome {
  font-size: 26px;
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: 0.6px;
}
.welcome-sub {
  margin-top: 8px;
  font-size: 13px;
  color: var(--color-text-secondary);
}
.login-form :deep(.el-input__wrapper) {
  padding: 4px 14px;
  border-radius: 8px;
  box-shadow: 0 0 0 1px #dbe3ec inset;
  background: #fbfcfe;
}
.login-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--color-primary) inset;
  background: #fff;
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
  font-size: 12.5px;
  color: var(--color-danger);
}
.role-switch {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  padding: 4px;
  margin-bottom: 22px;
  background: #f2f5f9;
  border-radius: 10px;
}
.role-item {
  height: 36px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s ease;
}
.role-item.active {
  background: #fff;
  color: var(--color-primary);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(23, 65, 107, 0.14);
}
.role-item:hover:not(.active) {
  color: var(--color-primary);
}
.submit-btn {
  width: 100%;
  height: 44px;
  font-size: 15px;
  letter-spacing: 2px;
  border-radius: 8px;
  margin-top: 4px;
}
.demo-block {
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px dashed var(--color-border-light);
}
.demo-title {
  font-size: 12px;
  color: var(--color-text-tertiary);
  margin-bottom: 10px;
}
.demo-items {
  display: flex;
  gap: 10px;
}
.demo-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: flex-start;
  padding: 9px 12px;
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  background: #fbfcfe;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s ease;
}
.demo-item:hover {
  border-color: #b9cde2;
  background: var(--color-primary-soft);
}
.demo-role {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--color-primary);
}
.demo-name {
  font-size: 11px;
  color: var(--color-text-tertiary);
}
.demo-hint {
  margin-top: 12px;
  font-size: 11.5px;
  line-height: 1.7;
  color: var(--color-text-tertiary);
}
.form-foot {
  margin-top: 32px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
  color: #b3bdc9;
}

@media (max-width: 1100px) {
  .brand-panel {
    display: none;
  }
  .form-panel {
    min-width: 0;
  }
}
</style>
