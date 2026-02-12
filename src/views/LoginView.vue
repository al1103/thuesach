<script setup lang="ts">
/**
 * @component LoginView
 * @description Login page with role selection and registration modal.
 */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useLibraryStore } from '../stores/library'

defineOptions({
  name: 'LoginView',
})

const router = useRouter()
const store = useLibraryStore()

const selectedRole = ref<'admin' | 'user'>('admin')
const username = ref<string>('')
const password = ref<string>('')
const showRegister = ref<boolean>(false)

const regName = ref<string>('')
const regEmail = ref<string>('')
const regPhone = ref<string>('')
const regUsername = ref<string>('')
const regPassword = ref<string>('')

async function handleLogin(): Promise<void> {
  const user = await store.login(username.value, password.value)
  if (user) {
    if (selectedRole.value === 'admin' && user.role !== 'admin') {
      store.showToast('Bạn không có quyền Admin!', 'error')
      return
    }
    if (selectedRole.value === 'user' && user.role !== 'user') {
      store.showToast('Vui lòng đăng nhập với tài khoản User!', 'error')
      return
    }
    router.push(user.role === 'admin' ? '/admin' : '/user')
  }
}

async function handleRegister(): Promise<void> {
  const result = await store.register({
    name: regName.value,
    email: regEmail.value,
    phone: regPhone.value,
    username: regUsername.value,
    password: regPassword.value,
  })

  if (result) {
    showRegister.value = false
    regName.value = ''
    regEmail.value = ''
    regPhone.value = ''
    regUsername.value = ''
    regPassword.value = ''
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-shell">
      <section class="login-hero">
        <div>
          <h2>Quản lý thư viện hiện đại, gọn và trực quan</h2>
          <p>Theo dõi sách, thành viên, mượn trả và yêu cầu chỉ trong một bảng điều khiển.</p>
        </div>

        <div class="hero-stats">
          <div class="hero-stat">
            <strong>Realtime</strong>
            <span>Dữ liệu đồng bộ tại chỗ</span>
          </div>
          <div class="hero-stat">
            <strong>Admin</strong>
            <span>Kiểm soát toàn hệ thống</span>
          </div>
          <div class="hero-stat">
            <strong>User</strong>
            <span>Yêu cầu mượn nhanh chóng</span>
          </div>
        </div>
      </section>

      <section class="login-box">
        <h1><i class="bi bi-book-half me-2"></i>Thuê Sách</h1>
        <p class="subtitle">Đăng nhập để tiếp tục sử dụng hệ thống</p>

        <div class="role-selector">
          <button class="role-btn" :class="{ active: selectedRole === 'admin' }" @click="selectedRole = 'admin'">
            <span class="icon"><i class="bi bi-shield-lock"></i></span>
            <span>Admin</span>
            <span>Quản trị viên</span>
          </button>
          <button class="role-btn" :class="{ active: selectedRole === 'user' }" @click="selectedRole = 'user'">
            <span class="icon"><i class="bi bi-person-circle"></i></span>
            <span>User</span>
            <span>Người mượn sách</span>
          </button>
        </div>

        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label>Tên đăng nhập</label>
            <input v-model="username" type="text" placeholder="Nhập tên đăng nhập" required />
          </div>
          <div class="form-group">
            <label>Mật khẩu</label>
            <input v-model="password" type="password" placeholder="Nhập mật khẩu" required />
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%">Đăng nhập</button>
        </form>

        <button
          v-if="selectedRole === 'user'"
          class="btn btn-secondary"
          style="width: 100%; margin-top: 10px"
          @click="showRegister = true"
        >
          Chưa có tài khoản? Đăng ký
        </button>

        <div class="demo-credentials">
          <p>Thông tin tài khoản demo</p>
          <p><strong>Admin:</strong> admin / admin123</p>
          <p><strong>User:</strong> user / user123</p>
        </div>
      </section>
    </div>

    <div v-if="showRegister" class="modal-overlay" @click.self="showRegister = false">
      <div class="modal">
        <div class="modal-header">
          <h3>Đăng ký tài khoản</h3>
          <button class="modal-close" @click="showRegister = false">&times;</button>
        </div>
        <form @submit.prevent="handleRegister">
          <div class="form-group">
            <label>Họ và tên</label>
            <input v-model="regName" type="text" placeholder="Nhập họ và tên" required />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input v-model="regEmail" type="email" placeholder="Nhập email" />
          </div>
          <div class="form-group">
            <label>Số điện thoại</label>
            <input v-model="regPhone" type="tel" placeholder="Nhập số điện thoại" />
          </div>
          <div class="form-group">
            <label>Tên đăng nhập</label>
            <input v-model="regUsername" type="text" placeholder="Nhập tên đăng nhập" required />
          </div>
          <div class="form-group">
            <label>Mật khẩu</label>
            <input v-model="regPassword" type="password" placeholder="Nhập mật khẩu" required />
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%">Đăng ký</button>
        </form>
      </div>
    </div>

    <div class="toast-container">
      <div v-for="toast in store.toasts" :key="toast.id" class="toast" :class="toast.type">
        <span v-if="toast.type === 'success'">✓</span>
        <span v-else-if="toast.type === 'error'">✕</span>
        <span>{{ toast.message }}</span>
      </div>
    </div>
  </div>
</template>
