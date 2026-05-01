<script setup lang="ts">
/**
 * @component UserLayout
 * @description Main layout for member portal with professional SaaS aesthetics.
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
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ 'translate-x-0': isSidebarOpen }">
      <div class="sidebar-header">
        <div class="logo-icon">
          <i class="bi bi-book-half"></i>
        </div>
        <span class="logo-text">Thư Viện Số</span>
      </div>

      <nav class="nav-menu">
        <RouterLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-link"
          exact-active-class="router-link-active"
        >
          <i :class="item.icon"></i>
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <button class="nav-link w-full btn-ghost" @click="handleLogout">
          <i class="bi bi-box-arrow-right"></i>
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="main-wrapper">
      <header class="header">
        <div class="header-left">
          <button class="btn btn-ghost d-lg-none" @click="toggleSidebar">
            <i class="bi bi-list"></i>
          </button>
          <h1 class="page-title">{{ $route.meta.title || 'Thư viện' }}</h1>
        </div>

        <div class="header-right">
          <div></div>

          <div class="user-profile">
            <div class="avatar">
              {{ store.currentUser?.name?.charAt(0) || 'U' }}
            </div>
            <span class="user-name d-none d-sm-block">{{ store.currentUser?.name || 'Thành viên' }}</span>
            <i class="bi bi-chevron-down text-subtle ms-1" style="font-size: 0.75rem"></i>
          </div>
        </div>
      </header>

      <main class="content-body">
        <RouterView />
      </main>
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
/* Responsive Sidebar Mobile */
@media (max-width: 991.98px) {
  .sidebar {
    transform: translateX(-100%);
  }
  .sidebar.translate-x-0 {
    transform: translateX(0);
  }
  .main-wrapper {
    margin-left: 0;
  }
}

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
