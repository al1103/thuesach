<script setup lang="ts">
/**
 * @component MyRequestsView
 * @description User view to track borrow and extension requests.
 */
import { computed, onMounted } from 'vue'
import { useLibraryStore } from '@/stores/library'

defineOptions({
  name: 'MyRequestsView',
})

const store = useLibraryStore()

onMounted(() => {
  store.fetchMyRequests()
  store.fetchMyExtensionRequests()
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
    case 'approved':
      return 'badge-success'
    case 'rejected':
      return 'badge-danger'
    default:
      return 'badge-warning'
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'approved':
      return 'Đã duyệt'
    case 'rejected':
      return 'Bị từ chối'
    default:
      return 'Đang chờ'
  }
}
</script>

<template>
  <div class="my-requests-view">
    <div class="summary-card">
      <div class="summary-icon">📨</div>
      <div class="summary-content">
        <div class="summary-value">{{ pendingCount }}</div>
        <div class="summary-label">Yêu cầu đang chờ duyệt</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>Yêu cầu mượn sách</h3>
      </div>
      <div class="table-container">
        <table v-if="myBorrowRequests.length" class="table table-hover align-middle">
          <thead>
            <tr>
              <th>Sách</th>
              <th>Ngày yêu cầu</th>
              <th>Ghi chú</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="request in myBorrowRequests" :key="request.id">
              <td>
                <div>
                  <strong>{{ request.bookTitle }}</strong>
                  <div class="text-muted">{{ request.bookAuthor }}</div>
                </div>
              </td>
              <td>{{ request.requestDate }}</td>
              <td>{{ request.note || '—' }}</td>
              <td>
                <span class="badge" :class="getStatusClass(request.status)">
                  {{ getStatusText(request.status) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">
          <div class="icon">📭</div>
          <p>Bạn chưa gửi yêu cầu mượn nào</p>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>Yêu cầu gia hạn</h3>
      </div>
      <div class="table-container">
        <table v-if="myExtensionRequests.length" class="table table-hover align-middle">
          <thead>
            <tr>
              <th>Sách</th>
              <th>Ngày yêu cầu</th>
              <th>Hạn hiện tại</th>
              <th>Hạn đề xuất</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="request in myExtensionRequests" :key="request.id">
              <td>
                <strong>{{ request.bookTitle }}</strong>
                <div class="text-muted">{{ request.note || 'Không có ghi chú' }}</div>
              </td>
              <td>{{ request.requestDate }}</td>
              <td>{{ request.currentDueDate }}</td>
              <td>{{ request.requestedDueDate }}</td>
              <td>
                <span class="badge" :class="getStatusClass(request.status)">
                  {{ getStatusText(request.status) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">
          <div class="icon">🔁</div>
          <p>Bạn chưa gửi yêu cầu gia hạn nào</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.my-requests-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.text-muted {
  color: var(--text-muted);
  font-size: 0.75rem;
}
</style>
