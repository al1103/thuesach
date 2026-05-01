<script setup lang="ts">
/**
 * @component RequestsView
 * @description Admin view for managing book borrow requests with SaaS aesthetics.
 */
import { computed, ref, onMounted } from 'vue'
import { useLibraryStore } from '@/stores/library'
import { exportToExcel, type ExportColumn } from '@/utils/export'

defineOptions({
  name: 'RequestsView',
})

const store = useLibraryStore()

onMounted(async () => {
  await Promise.all([
    store.fetchRequests(),
    store.fetchBooks(),
    store.fetchMembers(),
  ])
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
]

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
    default: return 'Chờ duyệt'
  }
}

async function handleApprove(requestId: number): Promise<void> {
  await store.approveRequest(requestId)
}

async function handleReject(requestId: number): Promise<void> {
  await store.rejectRequest(requestId)
}

function handleExportExcel(): void {
  if (!filteredRequests.value.length) {
    store.showToast('Không có dữ liệu để xuất', 'error')
    return
  }
  exportToExcel(filteredRequests.value, requestExportColumns, 'Requests', 'danh-sach-yeu-cau')
  store.showToast('Đã xuất Excel')
}
</script>

<template>
  <div class="requests-view">
    <!-- Filter Actions -->
    <div class="flex justify-between items-center mb-6">
      <div class="filter-tabs mb-0">
        <button class="btn" :class="{ 'active': filterStatus === 'pending' }" @click="filterStatus = 'pending'">Chờ duyệt</button>
        <button class="btn" :class="{ 'active': filterStatus === 'approved' }" @click="filterStatus = 'approved'">Đã duyệt</button>
        <button class="btn" :class="{ 'active': filterStatus === 'rejected' }" @click="filterStatus = 'rejected'">Từ chối</button>
        <button class="btn" :class="{ 'active': filterStatus === 'all' }" @click="filterStatus = 'all'">Tất cả</button>
      </div>

      <div class="action-buttons">
        <button class="btn btn-outline" @click="handleExportExcel">
          <i class="bi bi-download"></i> Xuất Excel
        </button>
      </div>
    </div>

    <!-- Requests Table -->
    <div class="card">
      <div class="table-container">
        <table v-if="filteredRequests.length">
          <thead>
            <tr>
              <th>Người yêu cầu</th>
              <th>Sách yêu cầu</th>
              <th>Ngày yêu cầu</th>
              <th>Ghi chú</th>
              <th>Trạng thái</th>
              <th class="text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="request in filteredRequests" :key="request.id">
              <td>
                <div class="flex items-center gap-2">
                  <div class="avatar" style="width: 32px; height: 32px;">{{ request.userInitial }}</div>
                  <span class="font-bold">{{ request.userName }}</span>
                </div>
              </td>
              <td>
                <div class="flex flex-column">
                  <span class="text-main">{{ request.bookTitle }}</span>
                  <span class="text-subtle" style="font-size: 0.75rem">Sẵn có: {{ request.bookAvailable }} cuốn</span>
                </div>
              </td>
              <td class="text-subtle">{{ request.requestDate }}</td>
              <td class="text-subtle" style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                {{ request.note || '—' }}
              </td>
              <td>
                <span class="badge" :class="getStatusClass(request.status)">
                  {{ getStatusText(request.status) }}
                </span>
              </td>
              <td class="text-right">
                <div v-if="request.status === 'pending'" class="flex gap-2 justify-end">
                  <button class="btn btn-primary btn-sm" :disabled="request.bookAvailable === 0" @click="handleApprove(request.id)">
                    Duyệt
                  </button>
                  <button class="btn btn-outline btn-sm text-danger" @click="handleReject(request.id)">
                    Từ chối
                  </button>
                </div>
                <span v-else class="text-subtle">—</span>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div v-else class="empty-state">
          <i class="bi bi-inbox empty-icon"></i>
          <h3 class="empty-title">Không có yêu cầu</h3>
          <p class="empty-text">Hiện tại không có yêu cầu mượn sách nào trong danh mục này.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.text-right { text-align: right; }
.text-danger { color: var(--danger) !important; }
.font-bold { font-weight: 700; }
.flex-column { flex-direction: column; }
.mb-0 { margin-bottom: 0 !important; }
</style>
