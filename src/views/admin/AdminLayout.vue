<script setup lang="ts">
/**
 * @component AdminLayout
 * @description Main layout for admin dashboard with responsive sidebar navigation.
 */
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLibraryStore } from '@/stores/library'

defineOptions({
  name: 'AdminLayout',
})

const router = useRouter()
const route = useRoute()
const store = useLibraryStore()
const isSidebarOpen = ref<boolean>(false)

interface NavItem {
  path: string
  name: string
  icon: string
  label: string
}

const navItems: NavItem[] = [
  { path: '/admin', name: 'admin-dashboard', icon: 'bi bi-speedometer2', label: 'Dashboard' },
  { path: '/admin/books', name: 'admin-books', icon: 'bi bi-journal-bookmark', label: 'Quản lý sách' },
  { path: '/admin/members', name: 'admin-members', icon: 'bi bi-people', label: 'Thành viên' },
  { path: '/admin/rentals', name: 'admin-rentals', icon: 'bi bi-clipboard-check', label: 'Mượn/Trả' },
  { path: '/admin/requests', name: 'admin-requests', icon: 'bi bi-inbox', label: 'Yêu cầu' },
  { path: '/admin/extensions', name: 'admin-extensions', icon: 'bi bi-arrow-repeat', label: 'Gia hạn' },
]

watch(
  () => route.fullPath,
  (): void => {
    isSidebarOpen.value = false
  },
)

function toggleSidebar(): void {
  isSidebarOpen.value = !isSidebarOpen.value
}

function handleLogout(): void {
  store.logout()
  router.push('/login')
}
</script>

<template>
  <div class="app-container">
    <div class="sidebar-backdrop" :class="{ show: isSidebarOpen }" @click="isSidebarOpen = false"></div>

    <aside class="sidebar" :class="{ open: isSidebarOpen }">
      <div class="sidebar-header">
        <div class="logo"><i class="bi bi-book-half"></i></div>
        <h2>Thư Viện Số</h2>
      </div>

      <nav class="nav-menu">
        <RouterLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-link"
          :class="{ 'router-link-active': $route.name === item.name }"
        >
          <span class="icon"><i :class="item.icon"></i></span>
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="logout-section">
        <button class="nav-link" @click="handleLogout">
          <span class="icon"><i class="bi bi-box-arrow-right"></i></span>
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>

    <main class="main-content">
      <header class="page-header">
        <div class="header-actions">
          <button class="mobile-menu-btn" @click="toggleSidebar"><i class="bi bi-list"></i></button>
          <div class="page-title-wrap">
            <h1>{{ $route.meta.title || 'Dashboard' }}</h1>
            <p class="page-subtitle">Quản trị hệ thống thư viện</p>
          </div>
        </div>
        <div class="user-info">
          <div class="user-avatar">
            {{ store.currentUser?.name?.charAt(0) || 'A' }}
          </div>
          <span class="user-name">{{ store.currentUser?.name || 'Admin' }}</span>
        </div>
      </header>

      <RouterView />
    </main>

    <div class="toast-container">
      <div v-for="toast in store.toasts" :key="toast.id" class="toast" :class="toast.type">
        <span v-if="toast.type === 'success'">✓</span>
        <span v-else-if="toast.type === 'error'">✕</span>
        <span>{{ toast.message }}</span>
      </div>
    </div>
  </div>
</template>
