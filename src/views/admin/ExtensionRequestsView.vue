<script setup lang="ts">
/**
 * @component ExtensionRequestsView
 * @description Admin view for approving/rejecting rental extension requests.
 */
import { computed, ref } from 'vue'
import { useLibraryStore } from '@/stores/library'

defineOptions({
  name: 'ExtensionRequestsView',
})

const store = useLibraryStore()
const filterStatus = ref<'all' | 'pending' | 'approved' | 'rejected'>('pending')

interface ExtensionRequestDisplayItem {
  id: number
  rentalId: number
  userId: number
  requestDate: string
  requestedDueDate: string
  status: 'pending' | 'approved' | 'rejected'
  note: string
  reviewedDate: string | null
  userName: string
  userInitial: string
  bookTitle: string
  currentDueDate: string
}

const filteredExtensionRequests = computed<ExtensionRequestDisplayItem[]>(() => {
  let requests = store.extensionRequests.map(request => {
    const user = store.users.find(item => item.id === request.userId)
    const rental = store.rentals.find(item => item.id === request.rentalId)
    const book = rental ? store.getBook(rental.bookId) : null

    return {
      ...request,
      userName: user?.name || 'N/A',
      userInitial: user?.name?.charAt(0) || '?',
      bookTitle: book?.title || 'N/A',
      currentDueDate: rental?.dueDate || 'N/A',
    }
  })

  if (filterStatus.value !== 'all') {
    requests = requests.filter(request => request.status === filterStatus.value)
  }

  return requests.sort((a, b) => b.id - a.id)
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
      return 'Từ chối'
    default:
      return 'Chờ duyệt'
  }
}

function handleApprove(requestId: number): void {
  const success = store.approveExtensionRequest(requestId)
  if (!success) {
    store.showToast('Không thể duyệt yêu cầu gia hạn', 'error')
    return
  }
  store.showToast('Đã duyệt yêu cầu gia hạn')
}

function handleReject(requestId: number): void {
  const success = store.rejectExtensionRequest(requestId)
  if (!success) {
    store.showToast('Không thể từ chối yêu cầu gia hạn', 'error')
    return
  }
  store.showToast('Đã từ chối yêu cầu gia hạn', 'warning')
}
</script>

<template>
  <div class="extension-requests-view">
    <div class="search-box">
      <div class="filter-tabs">
        <button class="btn" :class="filterStatus === 'pending' ? 'btn-primary' : 'btn-secondary'" @click="filterStatus = 'pending'">
          Chờ duyệt
        </button>
        <button class="btn" :class="filterStatus === 'approved' ? 'btn-primary' : 'btn-secondary'" @click="filterStatus = 'approved'">
          Đã duyệt
        </button>
        <button class="btn" :class="filterStatus === 'rejected' ? 'btn-primary' : 'btn-secondary'" @click="filterStatus = 'rejected'">
          Từ chối
        </button>
        <button class="btn" :class="filterStatus === 'all' ? 'btn-primary' : 'btn-secondary'" @click="filterStatus = 'all'">
          Tất cả
        </button>
      </div>
    </div>

    <div class="card">
      <div class="table-container">
        <table v-if="filteredExtensionRequests.length" class="table table-hover align-middle">
          <thead>
            <tr>
              <th>Người yêu cầu</th>
              <th>Sách</th>
              <th>Ngày yêu cầu</th>
              <th>Hạn hiện tại</th>
              <th>Hạn đề xuất</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="request in filteredExtensionRequests" :key="request.id">
              <td>
                <div class="member-cell">
                  <div class="member-avatar">{{ request.userInitial }}</div>
                  <span>{{ request.userName }}</span>
                </div>
              </td>
              <td>
                <strong>{{ request.bookTitle }}</strong>
                <div class="text-muted">{{ request.note || 'Không có ghi chú' }}</div>
              </td>
              <td>{{ request.requestDate }}</td>
              <td>{{ request.currentDueDate }}</td>
              <td>
                <span class="badge badge-info">{{ request.requestedDueDate }}</span>
              </td>
              <td>
                <span class="badge" :class="getStatusClass(request.status)">
                  {{ getStatusText(request.status) }}
                </span>
              </td>
              <td>
                <div v-if="request.status === 'pending'" class="action-buttons">
                  <button class="btn btn-sm btn-success" @click="handleApprove(request.id)">✓ Duyệt</button>
                  <button class="btn btn-sm btn-danger" @click="handleReject(request.id)">✕ Từ chối</button>
                </div>
                <span v-else class="text-muted">{{ request.reviewedDate || '—' }}</span>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-else class="empty-state">
          <div class="icon">🔁</div>
          <p>Không có yêu cầu gia hạn nào</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.text-muted {
  color: var(--text-muted);
  font-size: 0.75rem;
}
</style>
