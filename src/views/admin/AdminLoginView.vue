<template>
  <div class="admin-login">
    <section class="statement">
      <div class="wordmark">
        <span class="wordmark-name">投流统计平台</span>
        <span class="wordmark-sub">AD DELIVERY STATISTICS</span>
      </div>

      <div class="statement-body">
        <p class="eyebrow">统一管理入口 · 2026 年太仓分公司</p>
        <h1>统一管理账号、主数据<br />与字典日志</h1>
        <p class="desc">
          平台仅保留管理员入口，用于维护管理员账号、厂商、渠道字典、
          字典配置与操作日志；所有修改实时写入后端并留痕。
        </p>
        <ol class="points">
          <li><span>01</span>管理员账号与权限</li>
          <li><span>02</span>厂商与渠道主数据</li>
          <li><span>03</span>字典配置与操作日志</li>
        </ol>
      </div>

      <div class="statement-foot">
        <span>© 2026 投流统计平台</span>
      </div>
    </section>

    <section class="panel">
      <div class="panel-inner">
        <header class="panel-head">
          <h2>管理员登录</h2>
          <p>请使用管理员账号登录平台</p>
        </header>

        <el-form class="login-form" @submit.prevent="onSubmit">
          <el-form-item>
            <el-input
              v-model="form.username"
              size="large"
              placeholder="管理员账号"
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
              placeholder="密码"
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
            <span class="error-dot" />
            {{ errorText }}
          </div>

          <el-button
            type="primary"
            size="large"
            class="submit-btn"
            :loading="loading"
            @click="onSubmit"
          >
            {{ loading ? '正在验证…' : '进入系统' }}
          </el-button>
        </el-form>

        <footer class="panel-foot">
          <span>© 2026 投流统计平台</span>
        </footer>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Hide, Lock, User, View } from '@element-plus/icons-vue'
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
const form = reactive({ username: '', password: '' })

async function onSubmit() {
  if (loading.value) return
  errorText.value = ''
  if (!form.username.trim() || !form.password) {
    errorText.value = '请输入管理员账号与密码'
    return
  }
  loading.value = true
  try {
    const result = await user.login(form.username.trim(), form.password)
    if (result.user.role !== 'admin') {
      await user.logout()
      errorText.value = '该账号没有管理员权限，无法登录'
      return
    }
    await Promise.allSettled([dict.load(), app.loadProjects()])
    ElMessage.success(`欢迎回来，${user.displayName}`)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
    await router.replace(redirect || '/admin')
  } catch (error) {
    errorText.value = (error as Error).message || '登录失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.admin-login {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 480px;
  background: var(--color-bg);
}
.statement {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 48px;
  background: #111110;
  color: #f5f4f1;
}
.wordmark {
  display: flex;
  align-items: baseline;
  gap: 12px;
}
.wordmark-name {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
}
.wordmark-sub {
  font-family: var(--font-mono);
  font-size: var(--font-size-micro);
  color: #8f8a80;
  letter-spacing: 0.08em;
}
.statement-body {
  max-width: 620px;
}
.eyebrow {
  font-family: var(--font-mono);
  font-size: var(--font-size-micro);
  color: #8f8a80;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.statement h1 {
  margin-top: 16px;
  font-size: var(--font-size-metric-lg);
  line-height: 1.2;
  letter-spacing: -0.02em;
  font-weight: 600;
}
.desc {
  margin-top: 20px;
  max-width: 520px;
  font-size: var(--font-size-body);
  line-height: 1.9;
  color: #a8a298;
}
.points {
  margin-top: 36px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.points li {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-top: 10px;
  border-top: 1px solid #2b2a27;
  font-size: var(--font-size-aux);
  color: #c9c4b9;
}
.points span {
  width: 24px;
  flex: none;
  font-family: var(--font-mono);
  font-size: var(--font-size-micro);
  color: #8f8a80;
}
.statement-foot {
  display: flex;
  gap: 16px;
  font-family: var(--font-mono);
  font-size: var(--font-size-micro);
  color: #6e6a62;
  letter-spacing: 0.04em;
}

.panel {
  background: var(--color-surface);
  border-left: var(--hairline);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 32px;
}
.panel-inner {
  width: 100%;
  max-width: 360px;
}
.panel-head h2 {
  font-size: var(--font-size-page-title);
  font-weight: 600;
  letter-spacing: var(--tracking-tight);
}
.panel-head p {
  margin-top: 6px;
  font-size: var(--font-size-aux);
  color: var(--color-text-tertiary);
}
.login-form {
  margin-top: 24px;
}
.login-form :deep(.el-input__wrapper) {
  padding: 4px 12px;
  border-radius: var(--radius-xs);
  box-shadow: 0 0 0 1px var(--color-border) inset;
  background: var(--color-surface);
}
.login-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--ink-950) inset;
}
.login-form :deep(.el-input__inner) {
  height: 38px;
}
.pwd-toggle {
  cursor: pointer;
  color: var(--color-text-tertiary);
}
.error-text {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: -2px 0 14px;
  font-size: var(--font-size-aux);
  color: var(--color-text);
}
.error-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--signal-danger);
  flex: none;
}
.submit-btn {
  width: 100%;
  height: 40px;
  border-radius: var(--radius-xs);
  letter-spacing: 0.04em;
}
.panel-foot {
  margin-top: 40px;
  font-size: var(--font-size-micro);
  color: var(--color-text-tertiary);
}

@media (max-width: 900px) {
  .admin-login {
    grid-template-columns: minmax(0, 1fr);
  }
  .statement {
    display: none;
  }
  .panel {
    border-left: 0;
  }
}
</style>
