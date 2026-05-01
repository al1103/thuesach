<script setup lang="ts">
/**
 * @component LoginView
 * @description Login and Registration page with professional SaaS aesthetics.
 */
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useLibraryStore } from '../stores/library'

defineOptions({
  name: 'LoginView',
})

const router = useRouter()
const store = useLibraryStore()

const username = ref<string>('')
const password = ref<string>('')
const isLoginMode = ref<boolean>(true)
const error = ref<string>('')

const regName = ref<string>('')
const regEmail = ref<string>('')
const regPhone = ref<string>('')
const regUsername = ref<string>('')
const regPassword = ref<string>('')

watch([username, password, regUsername, regPassword, isLoginMode], () => {
  error.value = ''
})

async function handleLogin(): Promise<void> {
  error.value = ''
  const user = await store.login(username.value, password.value)
  if (user) {
    router.push(user.role === 'admin' ? '/admin' : '/user')
  } else {
    error.value = 'Tên đăng nhập hoặc mật khẩu không chính xác'
  }
}

async function handleRegister(): Promise<void> {
  error.value = ''
  const result = await store.register({
    name: regName.value,
    email: regEmail.value,
    phone: regPhone.value,
    username: regUsername.value,
    password: regPassword.value,
  })

  if (result) {
    isLoginMode.value = true
    store.showToast('Đăng ký thành công! Vui lòng đăng nhập.', 'success')
  } else {
    error.value = 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.'
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <div class="login-logo">
          <i class="bi bi-book-half"></i>
        </div>
        <h1 class="login-title">{{ isLoginMode ? 'Chào mừng trở lại' : 'Đăng ký thành viên' }}</h1>
        <p class="login-subtitle">
          {{ isLoginMode ? 'Đăng nhập vào hệ thống quản lý thư viện số' : 'Tham gia cộng đồng yêu sách ngay hôm nay' }}
        </p>
      </div>

      <div v-if="error" class="alert alert-danger">
        <i class="bi bi-exclamation-circle"></i>
        <span>{{ error }}</span>
      </div>

      <!-- Login Form -->
      <form v-if="isLoginMode" @submit.prevent="handleLogin">
        <div class="form-group">
          <label class="form-label">Tên đăng nhập</label>
          <input v-model="username" type="text" class="form-control" placeholder="Nhập username của bạn" required />
        </div>
        <div class="form-group">
          <label class="form-label">Mật khẩu</label>
          <input v-model="password" type="password" class="form-control" placeholder="••••••••" required />
        </div>
        <button type="submit" class="btn btn-primary w-full py-3" :disabled="store.loading">
          <span v-if="store.loading" class="spinner-border spinner-border-sm me-2"></span>
          Đăng nhập ngay
        </button>
      </form>

      <!-- Register Form -->
      <form v-else @submit.prevent="handleRegister">
        <div class="form-group">
          <label class="form-label">Họ và tên</label>
          <input v-model="regName" type="text" class="form-control" placeholder="Họ và tên đầy đủ" required />
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Email</label>
            <input v-model="regEmail" type="email" class="form-control" placeholder="email@example.com" />
          </div>
          <div class="form-group">
            <label class="form-label">Điện thoại</label>
            <input v-model="regPhone" type="tel" class="form-control" placeholder="0xxx xxx xxx" />
          </div>
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Username</label>
            <input v-model="regUsername" type="text" class="form-control" required />
          </div>
          <div class="form-group">
            <label class="form-label">Mật khẩu</label>
            <input v-model="regPassword" type="password" class="form-control" required />
          </div>
        </div>
        <button type="submit" class="btn btn-primary w-full py-3" :disabled="store.loading">
          Tạo tài khoản
        </button>
      </form>

      <div class="login-footer">
        <p v-if="isLoginMode">
          Chưa có tài khoản? 
          <button class="btn-link" @click="isLoginMode = false">Đăng ký thành viên</button>
        </p>
        <p v-else>
          Đã có tài khoản? 
          <button class="btn-link" @click="isLoginMode = true">Quay lại đăng nhập</button>
        </p>
      </div>
    </div>

    <!-- Toasts -->
    <div class="toast-container">
      <div v-for="toast in store.toasts" :key="toast.id" class="toast" :class="toast.type">
        <span class="toast-icon">
          <i v-if="toast.type === 'success'" class="bi bi-check-circle-fill"></i>
          <i v-else-if="toast.type === 'error'" class="bi bi-exclamation-circle-fill"></i>
        </span>
        <span class="toast-message">{{ toast.message }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
.me-2 { margin-right: 0.5rem; }

.toast-container {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toast {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: white;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  border-left: 4px solid var(--primary);
  min-width: 280px;
  animation: slide-in 0.3s ease-out;
}

.toast.success { border-left-color: var(--success); }
.toast.error { border-left-color: var(--danger); }

@keyframes slide-in {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
</style>
