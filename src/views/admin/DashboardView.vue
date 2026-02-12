<script setup lang="ts">
/**
 * @component DashboardView
 * @description Admin dashboard with borrow requests, extension requests and statistics.
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
  type: 'primary' | 'success' | 'warning' | 'danger' | 'info'
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
    { icon: '📚', value: s.totalBooks, label: 'Tổng số sách', type: 'primary' },
    { icon: '👥', value: s.totalMembers, label: 'Thành viên', type: 'success' },
    { icon: '📖', value: s.currentlyBorrowed, label: 'Đang mượn', type: 'warning' },
    { icon: '⚠️', value: s.overdue, label: 'Quá hạn', type: 'danger' },
    { icon: '🔁', value: s.pendingExtensions, label: 'Gia hạn chờ duyệt', type: 'info' },
    { icon: '🚫', value: s.blacklistedMembers, label: 'Thành viên blacklist', type: 'danger' },
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

const pendingExtensionRequests = computed(() => {
  return store.extensionRequests
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

async function handleApproveExtension(requestId: number): Promise<void> {
  await store.approveExtensionRequest(requestId)
}

async function handleRejectExtension(requestId: number): Promise<void> {
  await store.rejectExtensionRequest(requestId)
}
</script>

<template>
  <div class="dashboard">
    <div class="stats-grid">
      <div v-for="stat in statsCards" :key="stat.label" class="stat-card">
        <div class="stat-icon" :class="stat.type">{{ stat.icon }}</div>
        <div class="stat-content">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>
    </div>

    <div class="dashboard-grid">
      <div class="card">
        <div class="card-header">
          <h3>📖 Sách đang mượn</h3>
          <RouterLink to="/admin/rentals" class="view-all">Xem tất cả →</RouterLink>
        </div>
        <div class="table-container">
          <table v-if="recentRentals.length" class="table table-hover align-middle">
            <thead>
              <tr>
                <th>Thành viên</th>
                <th>Sách</th>
                <th>Ngày mượn</th>
                <th>Hạn trả</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="rental in recentRentals" :key="rental.id">
                <td>
                  <div class="member-cell">
                    <div class="member-avatar">{{ rental.memberInitial }}</div>
                    <span>{{ rental.memberName }}</span>
                  </div>
                </td>
                <td>{{ rental.bookTitle }}</td>
                <td>{{ rental.borrowDate }}</td>
                <td>
                  <span class="badge" :class="rental.dueDate < today ? 'badge-danger' : 'badge-success'">
                    {{ rental.dueDate }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty-state">
            <div class="icon">📭</div>
            <p>Chưa có sách nào đang mượn</p>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3>📨 Yêu cầu mượn chờ duyệt</h3>
          <RouterLink to="/admin/requests" class="view-all">Xem tất cả →</RouterLink>
        </div>
        <div class="table-container">
          <table v-if="pendingRequests.length" class="table table-hover align-middle">
            <thead>
              <tr>
                <th>Người yêu cầu</th>
                <th>Sách</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="request in pendingRequests" :key="request.id">
                <td>
                  <div class="member-cell">
                    <div class="member-avatar">{{ request.userInitial }}</div>
                    <span>{{ request.userName }}</span>
                  </div>
                </td>
                <td>{{ request.bookTitle }}</td>
                <td>
                  <div class="action-buttons">
                    <button class="btn btn-sm btn-success" @click="handleApprove(request.id)">✓ Duyệt</button>
                    <button class="btn btn-sm btn-danger" @click="handleReject(request.id)">✕ Từ chối</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty-state">
            <div class="icon">✨</div>
            <p>Không có yêu cầu mượn</p>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3>🔁 Yêu cầu gia hạn chờ duyệt</h3>
          <RouterLink to="/admin/extensions" class="view-all">Xem tất cả →</RouterLink>
        </div>
        <div class="table-container">
          <table v-if="pendingExtensionRequests.length" class="table table-hover align-middle">
            <thead>
              <tr>
                <th>Người yêu cầu</th>
                <th>Sách</th>
                <th>Hạn đề xuất</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="request in pendingExtensionRequests" :key="request.id">
                <td>
                  <div class="member-cell">
                    <div class="member-avatar">{{ request.userInitial }}</div>
                    <span>{{ request.userName }}</span>
                  </div>
                </td>
                <td>{{ request.bookTitle }}</td>
                <td>{{ request.requestedDueDate }}</td>
                <td>
                  <div class="action-buttons">
                    <button class="btn btn-sm btn-success" @click="handleApproveExtension(request.id)">✓ Duyệt</button>
                    <button class="btn btn-sm btn-danger" @click="handleRejectExtension(request.id)">✕ Từ chối</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty-state">
            <div class="icon">✨</div>
            <p>Không có yêu cầu gia hạn</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - var(--header-height) - var(--space-xl) * 2);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-lg);
  flex: 1;
}

.dashboard-grid .card {
  display: flex;
  flex-direction: column;
}

.dashboard-grid .table-container {
  flex: 1;
  overflow-y: auto;
}

@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>
