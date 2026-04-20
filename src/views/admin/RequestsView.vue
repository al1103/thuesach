<script setup lang="ts">
/**
 * @component RequestsView
 * @description Admin view for managing book borrow requests.
 */
import { computed, ref, onMounted } from 'vue'
import { useLibraryStore } from '@/stores/library'
import { exportToExcel, exportToPdf, type ExportColumn } from '@/utils/export'

defineOptions({
  name: 'RequestsView',
})

const store = useLibraryStore()

onMounted(() => {
  store.fetchRequests()
})

const filterStatus = ref<'all' | 'pending' | 'approved' | 'rejected'>('pending')

interface RequestDisplayItem {
  id: number
  bookId: number
  userId: number
  requestDate: string
  status: 'pending' | 'approved' | 'rejected'
  note: string
  bookTitle: string
  bookAvailable: number
  userName: string
  userInitial: string
}

const filteredRequests = computed<RequestDisplayItem[]>(() => {
  let requests = store.requests.map(request => {
    const book = store.getBook(request.bookId)
    return {
      ...request,
      bookTitle: request.bookTitle || book?.title || 'N/A',
      bookAvailable: book?.available || 0,
      userName: request.userName || 'N/A',
      userInitial: (request.userName || 'N/A').charAt(0),
    }
  })

  if (filterStatus.value !== 'all') {
    requests = requests.filter(request => request.status === filterStatus.value)
  }

  return requests.sort((a, b) => b.id - a.id)
})

const requestExportColumns: ExportColumn<RequestDisplayItem>[] = [
  { header: 'ID', value: request => request.id },
  { header: 'Người yêu cầu', value: request => request.userName },
  { header: 'Sách', value: request => request.bookTitle },
  { header: 'Ngày yêu cầu', value: request => request.requestDate },
  { header: 'Ghi chú', value: request => request.note || '-' },
  { header: 'Trạng thái', value: request => getStatusText(request.status) },
]

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
  store.approveRequest(requestId)
  store.showToast('Đã duyệt yêu cầu và tạo phiếu mượn')
}

function handleReject(requestId: number): void {
  store.rejectRequest(requestId)
  store.showToast('Đã từ chối yêu cầu', 'error')
}

function handleExportExcel(): void {
  if (!filteredRequests.value.length) {
    store.showToast('Không có dữ liệu để xuất', 'error')
    return
  }
  exportToExcel(filteredRequests.value, requestExportColumns, 'Requests', 'danh-sach-yeu-cau')
  store.showToast('Đã xuất Excel yêu cầu mượn')
}

function handleExportPdf(): void {
  if (!filteredRequests.value.length) {
    store.showToast('Không có dữ liệu để xuất', 'error')
    return
  }
  exportToPdf(filteredRequests.value, requestExportColumns, 'Danh sách yêu cầu mượn', 'danh-sach-yeu-cau')
  store.showToast('Đã xuất PDF yêu cầu mượn')
}
</script>

<template>
  <div class="requests-view">
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

      <div class="action-buttons">
        <button class="btn btn-secondary" @click="handleExportExcel">
          <i class="bi bi-file-earmark-excel"></i>
          Excel
        </button>
        <button class="btn btn-secondary" @click="handleExportPdf">
          <i class="bi bi-file-earmark-pdf"></i>
          PDF
        </button>
      </div>
    </div>

    <div class="card">
      <div class="table-container">
        <table v-if="filteredRequests.length" class="table table-hover align-middle">
          <thead>
            <tr>
              <th>Người yêu cầu</th>
              <th>Sách</th>
              <th>Ngày yêu cầu</th>
              <th>Ghi chú</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="request in filteredRequests" :key="request.id">
              <td>
                <div class="member-cell">
                  <div class="member-avatar">{{ request.userInitial }}</div>
                  <span>{{ request.userName }}</span>
                </div>
              </td>
              <td>
                <strong>{{ request.bookTitle }}</strong>
                <div class="book-availability-text">Còn lại: {{ request.bookAvailable }}</div>
              </td>
              <td>{{ request.requestDate }}</td>
              <td>{{ request.note || '—' }}</td>
              <td>
                <span class="badge" :class="getStatusClass(request.status)">
                  {{ getStatusText(request.status) }}
                </span>
              </td>
              <td>
                <div v-if="request.status === 'pending'" class="action-buttons">
                  <button class="btn btn-sm btn-success" :disabled="request.bookAvailable === 0" @click="handleApprove(request.id)">
                    ✓ Duyệt
                  </button>
                  <button class="btn btn-sm btn-danger" @click="handleReject(request.id)">✕ Từ chối</button>
                </div>
                <span v-else class="text-muted">—</span>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">
          <div class="icon">📨</div>
          <p>Không có yêu cầu nào</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.filter-tabs {
  display: flex;
  gap: var(--space-sm);
}

.book-availability-text {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 2px;
}

.text-muted {
  color: var(--text-muted);
}
</style>
