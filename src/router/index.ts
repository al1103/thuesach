import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import AdminLayout from '../views/admin/AdminLayout.vue'
import UserLayout from '../views/user/UserLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { title: 'Đăng nhập' },
    },
    {
      path: '/admin',
      component: AdminLayout,
      meta: { requiresAuth: true, role: 'admin' },
      children: [
        {
          path: '',
          name: 'admin-dashboard',
          component: () => import('../views/admin/DashboardView.vue'),
          meta: { title: 'Tổng quan' },
        },
        {
          path: 'books',
          name: 'admin-books',
          component: () => import('../views/admin/BooksView.vue'),
          meta: { title: 'Quản lý sách' },
        },
        {
          path: 'members',
          name: 'admin-members',
          component: () => import('../views/admin/MembersView.vue'),
          meta: { title: 'Quản lý thành viên' },
        },
        {
          path: 'rentals',
          name: 'admin-rentals',
          component: () => import('../views/admin/RentalsView.vue'),
          meta: { title: 'Quản lý mượn trả' },
        },
        {
          path: 'requests',
          name: 'admin-requests',
          component: () => import('../views/admin/RequestsView.vue'),
          meta: { title: 'Yêu cầu mượn sách' },
        },
        {
          path: 'extensions',
          name: 'admin-extensions',
          component: () => import('../views/admin/ExtensionRequestsView.vue'),
          meta: { title: 'Yêu cầu gia hạn' },
        },
      ],
    },
    {
      path: '/user',
      component: UserLayout,
      meta: { requiresAuth: true, role: 'user' },
      children: [
        {
          path: '',
          name: 'user-catalog',
          component: () => import('../views/user/CatalogView.vue'),
          meta: { title: 'Danh mục sách' },
        },
        {
          path: 'my-rentals',
          name: 'user-rentals',
          component: () => import('../views/user/MyRentalsView.vue'),
          meta: { title: 'Sách đang mượn' },
        },
        {
          path: 'my-requests',
          name: 'user-requests',
          component: () => import('../views/user/MyRequestsView.vue'),
          meta: { title: 'Yêu cầu của tôi' },
        },
        {
          path: 'ai-assistant',
          name: 'user-ai-assistant',
          component: () => import('../views/user/AIAssistantView.vue'),
          meta: { title: 'AI Tư vấn' },
        },
      ],
    },
  ],
})

// Navigation guard - TẠM TẮT KIỂM TRA ĐĂNG NHẬP
router.beforeEach((to, from, next) => {
  // const currentUser = sessionStorage.getItem("currentUser");
  // const user = currentUser ? JSON.parse(currentUser) : null;

  // if (to.meta.requiresAuth && !user) {
  //   next("/login");
  // } else if (to.meta.role && user?.role !== to.meta.role) {
  //   next(user?.role === "admin" ? "/admin" : "/user");
  // } else if (to.path === "/login" && user) {
  //   next(user.role === "admin" ? "/admin" : "/user");
  // } else {
  //   next();
  // }

  next()
})

export default router
