<script setup lang="ts">
/**
 * @component MyRequestsView
 * @description User view to track borrow and extension requests with SaaS aesthetics.
 */
import { computed, onMounted } from 'vue'
import { useLibraryStore } from '@/stores/library'

defineOptions({
  name: 'MyRequestsView',
})

const store = useLibraryStore()

onMounted(async () => {
  await Promise.all([
    store.fetchMyRequests(),
    store.fetchMyExtensionRequests(),
    store.fetchBooks(),
    store.fetchRentals(),
  ])
})

interface BorrowRequestDisplayItem {
  id: number
  requestDate: string
  status: 'pending' | 'approved' | 'rejected'
  note: string
  bookTitle: string
  bookAuthor: string
}

interface ExtensionRequestDisplayItem {
  id: number
  requestDate: string
  requestedDueDate: string
  status: 'pending' | 'approved' | 'rejected'
  note: string
  bookTitle: string
  currentDueDate: string
}

const myBorrowRequests = computed<BorrowRequestDisplayItem[]>(() => {
  const userId = store.currentUser?.id
  if (!userId) return []

  return store.requests
    .filter(request => request.userId === userId)
    .map(request => {
      const book = store.getBook(request.bookId)
      return {
        ...request,
        bookTitle: book?.title || 'N/A',
        bookAuthor: book?.author || 'N/A',
      }
    })
    .sort((a, b) => b.id - a.id)
})

const myExtensionRequests = computed<ExtensionRequestDisplayItem[]>(() => {
  const userId = store.currentUser?.id
  if (!userId) return []

  return store.extensionRequests
    .filter(request => request.userId === userId)
    .map(request => {
      const rental = store.rentals.find(item => item.id === request.rentalId)
      const book = rental ? store.getBook(rental.bookId) : null
      return {
        ...request,
        bookTitle: book?.title || 'N/A',
        currentDueDate: rental?.dueDate || 'N/A',
      }
    })
    .sort((a, b) => b.id - a.id)
})

const pendingCount = computed<number>(() => {
  const pendingBorrow = myBorrowRequests.value.filter(request => request.status === 'pending').length
  const pendingExtension = myExtensionRequests.value.filter(request => request.status === 'pending').length
  return pendingBorrow + pendingExtension
})

function getStatusClass(status: string): string {
  switch (status) {
    case 'approved': return 'badge-success'
    case 'rejected': return 'badge-danger'
    default: return 'badge-warning'
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'approved': return 'Đã duyệt'
    case 'rejected': return 'Từ chối'
    default: return 'Đang chờ'
  }
}
</script>

<template>
  <div class="my-requests-view">
    <!-- Summary Stat -->
    <div class="stat-card mb-8" style="max-width: 320px">
      <div class="stat-icon bg-primary-soft text-primary">
        <i class="bi bi-send"></i>
      </div>
      <div class="stat-info">
        <span class="stat-value">{{ pendingCount }}</span>
        <span class="stat-label">Yêu cầu đang chờ duyệt</span>
      </div>
    </div>

    <!-- Borrow Requests -->
    <div class="card mb-8">
      <div class="card-header">
        <h3 class="card-title">Yêu cầu mượn sách</h3>
      </div>
      <div class="table-container">
        <table v-if="myBorrowRequests.length">
          <thead>
            <tr>
              <th>Thông tin sách</th>
              <th>Ngày gửi yêu cầu</th>
              <th>Ghi chú</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="request in myBorrowRequests" :key="request.id">
              <td>
                <div class="flex flex-column">
                  <span class="font-bold text-main">{{ request.bookTitle }}</span>
                  <span class="text-subtle" style="font-size: 0.75rem">{{ request.bookAuthor }}</span>
                </div>
              </td>
              <td class="text-subtle">{{ request.requestDate }}</td>
              <td class="text-subtle" style="max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                {{ request.note || '—' }}
              </td>
              <td>
                <span class="badge" :class="getStatusClass(request.status)">
                  {{ getStatusText(request.status) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div v-else class="empty-state">
          <i class="bi bi-chat-left-dots empty-icon"></i>
          <h3 class="empty-title">Không có yêu cầu mượn</h3>
          <p class="empty-text">Bạn chưa gửi yêu cầu mượn sách nào gần đây.</p>
        </div>
      </div>
    </div>

    <!-- Extension Requests -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Yêu cầu gia hạn</h3>
      </div>
      <div class="table-container">
        <table v-if="myExtensionRequests.length">
          <thead>
            <tr>
              <th>Thông tin sách</th>
              <th>Ngày yêu cầu</th>
              <th>Hạn hiện tại</th>
              <th>Hạn đề xuất mới</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="request in myExtensionRequests" :key="request.id">
              <td>
                <div class="flex flex-column">
                  <span class="font-bold text-main">{{ request.bookTitle }}</span>
                  <span class="text-subtle" style="font-size: 0.75rem">{{ request.note || 'Không có ghi chú' }}</span>
                </div>
              </td>
              <td class="text-subtle">{{ request.requestDate }}</td>
              <td class="text-subtle">{{ request.currentDueDate }}</td>
              <td>
                <span class="badge badge-info">{{ request.requestedDueDate }}</span>
              </td>
              <td>
                <span class="badge" :class="getStatusClass(request.status)">
                  {{ getStatusText(request.status) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div v-else class="empty-state">
          <i class="bi bi-calendar-event empty-icon"></i>
          <h3 class="empty-title">Không có yêu cầu gia hạn</h3>
          <p class="empty-text">Bạn chưa gửi yêu cầu gia hạn sách nào.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stat-card {
  background: white;
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-main);
  line-height: 1.2;
}

.stat-label {
  font-size: 0.8125rem;
  color: var(--text-muted);
  font-weight: 500;
}

.font-bold { font-weight: 700; }
.flex-column { flex-direction: column; }
</style>
