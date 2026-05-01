<script setup lang="ts">
/**
 * @component DashboardView
 * @description Admin dashboard with summary statistics and quick action tables.
 */
import { computed, onMounted, ref } from 'vue'
import { useLibraryStore, type Stats } from '@/stores/library'

defineOptions({
  name: 'DashboardView',
})

const store = useLibraryStore()
const today = new Date().toISOString().split('T')[0] ?? ''
const dashboardStats = ref<Stats | null>(null)

interface StatCard {
  icon: string
  value: number
  label: string
  desc: string
  type: string
}

onMounted(async () => {
  await Promise.all([
    store.fetchRentals(),
    store.fetchRequests(),
    store.fetchExtensionRequests(),
    store.fetchMembers(),
    store.fetchBooks(),
  ])
  dashboardStats.value = await store.fetchStats()
})

const statsCards = computed<StatCard[]>(() => {
  const s = dashboardStats.value
  if (!s) return []
  return [
    { icon: 'bi-journal-text', value: s.totalBooks, label: 'Tổng số sách', desc: 'Sách hiện có trong kho', type: 'info' },
    { icon: 'bi-people', value: s.totalMembers, label: 'Thành viên', desc: 'Tổng số bạn đọc đã đăng ký', type: 'success' },
    { icon: 'bi-book', value: s.currentlyBorrowed, label: 'Đang mượn', desc: 'Số sách đang lưu hành', type: 'warning' },
    { icon: 'bi-exclamation-triangle', value: s.overdue, label: 'Quá hạn', desc: 'Cần gửi thông báo nhắc trả', type: 'danger' },
  ]
})

const recentRentals = computed(() => {
  return store.rentals
    .filter(rental => rental.status === 'borrowed')
    .slice(0, 5)
    .map(rental => ({
      ...rental,
      memberInitial: rental.memberName?.charAt(0) || '?',
    }))
})

const pendingRequests = computed(() => {
  return store.requests
    .filter(request => request.status === 'pending')
    .slice(0, 5)
    .map(request => ({
      ...request,
      userInitial: request.userName?.charAt(0) || '?',
    }))
})

async function handleApprove(requestId: number): Promise<void> {
  await store.approveRequest(requestId)
}

async function handleReject(requestId: number): Promise<void> {
  await store.rejectRequest(requestId)
}
</script>

<template>
  <div class="dashboard">
    <!-- Stats Row -->
    <div class="stats-grid">
      <div v-for="stat in statsCards" :key="stat.label" class="stat-card">
        <div class="stat-header">
          <span class="stat-title">{{ stat.label }}</span>
          <div class="stat-icon-bg" :class="`badge-${stat.type}`">
            <i :class="`bi ${stat.icon}`"></i>
          </div>
        </div>
        <div class="stat-value">{{ stat.value }}</div>
        <div class="stat-desc">{{ stat.desc }}</div>
      </div>
    </div>

    <!-- Main Dashboard Content -->
    <div class="dashboard-grid">
      <!-- Recent Rentals -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Sách đang được mượn</h3>
          <RouterLink to="/admin/rentals" class="btn btn-ghost btn-sm">Xem tất cả</RouterLink>
        </div>
        <div class="card-body p-0">
          <div class="table-container">
            <table v-if="recentRentals.length">
              <thead>
                <tr>
                  <th>Thành viên</th>
                  <th>Tên sách</th>
                  <th>Hạn trả</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="rental in recentRentals" :key="rental.id">
                  <td>
                    <div class="flex items-center gap-2">
                      <div class="avatar" style="width: 28px; height: 28px; font-size: 0.75rem;">{{ rental.memberInitial }}</div>
                      <span class="font-medium">{{ rental.memberName }}</span>
                    </div>
                  </td>
                  <td class="text-subtle">{{ rental.bookTitle }}</td>
                  <td>
                    <span class="badge" :class="rental.dueDate < today ? 'badge-danger' : 'badge-success'">
                      {{ rental.dueDate }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="empty-state">
              <i class="bi bi-inbox empty-icon"></i>
              <p class="empty-text">Chưa có dữ liệu mượn sách gần đây.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Pending Requests -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Yêu cầu mượn chờ duyệt</h3>
          <RouterLink to="/admin/requests" class="btn btn-ghost btn-sm">Xem tất cả</RouterLink>
        </div>
        <div class="card-body p-0">
          <div class="table-container">
            <table v-if="pendingRequests.length">
              <thead>
                <tr>
                  <th>Người mượn</th>
                  <th>Tên sách</th>
                  <th class="text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="request in pendingRequests" :key="request.id">
                  <td>
                    <div class="flex items-center gap-2">
                      <div class="avatar" style="width: 28px; height: 28px; font-size: 0.75rem;">{{ request.userInitial }}</div>
                      <span>{{ request.userName }}</span>
                    </div>
                  </td>
                  <td class="text-subtle">{{ request.bookTitle }}</td>
                  <td class="text-right">
                    <div class="flex gap-2 justify-end">
                      <button class="btn btn-primary btn-sm" @click="handleApprove(request.id)">Duyệt</button>
                      <button class="btn btn-outline btn-sm" @click="handleReject(request.id)">Từ chối</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="empty-state">
              <i class="bi bi-check2-circle empty-icon text-success"></i>
              <p class="empty-text">Đã xử lý xong tất cả yêu cầu.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-8);
}

@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

.text-right {
  text-align: right;
}

.p-0 {
  padding: 0 !important;
}

.font-medium {
  font-weight: 500;
}
</style>
