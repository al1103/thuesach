<script setup lang="ts">
/**
 * @component UserLayout
 * @description Main layout for user-facing screens with responsive sidebar navigation.
 */
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLibraryStore } from '@/stores/library'

defineOptions({
  name: 'UserLayout',
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
  { path: '/user', name: 'user-catalog', icon: 'bi bi-collection', label: 'Danh mục sách' },
  { path: '/user/my-rentals', name: 'user-rentals', icon: 'bi bi-journal-check', label: 'Sách đang mượn' },
  { path: '/user/my-requests', name: 'user-requests', icon: 'bi bi-send', label: 'Yêu cầu của tôi' },
  { path: '/user/ai-assistant', name: 'user-ai-assistant', icon: 'bi bi-robot', label: 'AI tư vấn mượn' },
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
            <h1>{{ $route.meta.title || 'Thư viện của bạn' }}</h1>
            <p class="page-subtitle">Tra cứu và gửi yêu cầu mượn sách nhanh hơn</p>
          </div>
        </div>
        <div class="user-info">
          <div class="user-avatar">
            {{ store.currentUser?.name?.charAt(0) || 'U' }}
          </div>
          <span class="user-name">{{ store.currentUser?.name || 'User' }}</span>
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
