<script setup lang="ts">
/**
 * @component ExtensionRequestsView
 * @description Admin view for approving/rejecting rental extension requests with SaaS aesthetics.
 */
import { computed, ref, onMounted } from 'vue'
import { useLibraryStore } from '@/stores/library'

defineOptions({
  name: 'ExtensionRequestsView',
})

const store = useLibraryStore()

onMounted(async () => {
  await Promise.all([
    store.fetchExtensionRequests(),
    store.fetchRentals(),
    store.fetchBooks(),
    store.fetchMembers(),
  ])
})

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
    const rental = store.rentals.find(item => item.id === request.rentalId)
    const book = rental ? store.getBook(rental.bookId) : null

    return {
      ...request,
      userName: request.userName || 'N/A',
      userInitial: (request.userName || 'N/A').charAt(0),
      bookTitle: request.bookTitle || book?.title || 'N/A',
      currentDueDate: request.currentDueDate || rental?.dueDate || 'N/A',
    }
  })

  if (filterStatus.value !== 'all') {
    requests = requests.filter(request => request.status === filterStatus.value)
  }

  return requests.sort((a, b) => b.id - a.id)
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
    default: return 'Chờ duyệt'
  }
}

async function handleApprove(requestId: number): Promise<void> {
  await store.approveExtensionRequest(requestId)
}

async function handleReject(requestId: number): Promise<void> {
  await store.rejectExtensionRequest(requestId)
}
</script>

<template>
  <div class="extension-requests-view">
    <!-- Filter Actions -->
    <div class="flex justify-between items-center mb-6">
      <div class="filter-tabs mb-0">
        <button class="btn" :class="{ 'active': filterStatus === 'pending' }" @click="filterStatus = 'pending'">Chờ duyệt</button>
        <button class="btn" :class="{ 'active': filterStatus === 'approved' }" @click="filterStatus = 'approved'">Đã duyệt</button>
        <button class="btn" :class="{ 'active': filterStatus === 'rejected' }" @click="filterStatus = 'rejected'">Từ chối</button>
        <button class="btn" :class="{ 'active': filterStatus === 'all' }" @click="filterStatus = 'all'">Tất cả</button>
      </div>
    </div>

    <!-- Requests Table -->
    <div class="card">
      <div class="table-container">
        <table v-if="filteredExtensionRequests.length">
          <thead>
            <tr>
              <th>Người yêu cầu</th>
              <th>Thông tin sách</th>
              <th>Ngày yêu cầu</th>
              <th>Hạn trả hiện tại</th>
              <th>Hạn đề xuất</th>
              <th>Trạng thái</th>
              <th class="text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="request in filteredExtensionRequests" :key="request.id">
              <td>
                <div class="flex items-center gap-2">
                  <div class="avatar" style="width: 32px; height: 32px;">{{ request.userInitial }}</div>
                  <span class="font-bold">{{ request.userName }}</span>
                </div>
              </td>
              <td>
                <div class="flex flex-column">
                  <span class="text-main">{{ request.bookTitle }}</span>
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
              <td class="text-right">
                <div v-if="request.status === 'pending'" class="flex gap-2 justify-end">
                  <button class="btn btn-primary btn-sm" @click="handleApprove(request.id)">Duyệt</button>
                  <button class="btn btn-outline btn-sm text-danger" @click="handleReject(request.id)">Từ chối</button>
                </div>
                <span v-else class="text-subtle">Xong: {{ request.reviewedDate || '—' }}</span>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div v-else class="empty-state">
          <i class="bi bi-calendar-x empty-icon"></i>
          <h3 class="empty-title">Không có yêu cầu gia hạn</h3>
          <p class="empty-text">Hiện không có yêu cầu gia hạn sách nào cần xử lý.</p>
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
