<script setup lang="ts">
/**
 * @component MyRentalsView
 * @description User view to track rentals, reminders, and extension requests with SaaS aesthetics.
 */
import { computed, ref, onMounted } from 'vue'
import { MAX_BORROW_MONTHS, useLibraryStore, type ReminderLevel } from '@/stores/library'
import PaymentQRModal from '@/components/features/PaymentQRModal.vue'

defineOptions({
  name: 'MyRentalsView',
})

const store = useLibraryStore()

onMounted(async () => {
  await Promise.all([
    store.fetchMyRentals(),
    store.fetchMyExtensionRequests(),
    store.fetchBooks(),
  ])
})

const showExtensionModal = ref<boolean>(false)
const showQRModal = ref<boolean>(false)
const selectedRentalId = ref<number | null>(null)
const selectedRentalIdForExtension = ref<number | null>(null)
const extensionDueDate = ref<string>('')
const extensionNote = ref<string>('')

interface UserRentalItem {
  id: number
  borrowDate: string
  dueDate: string
  returnDate: string | null
  status: 'borrowed' | 'returned'
  bookTitle: string
  bookAuthor: string
  reminderLevel: ReminderLevel
  reminderText: string
  lateDays: number
  lateFee: number
}

const myRentals = computed<UserRentalItem[]>(() => {
  const memberId = store.currentUser?.memberId
  if (!memberId) return []

  return store.rentals
    .filter(rental => rental.memberId === memberId)
    .map(rental => {
      const book = store.getBook(rental.bookId)
      return {
        ...rental,
        bookTitle: book?.title || 'N/A',
        bookAuthor: book?.author || 'N/A',
        reminderLevel: store.getReminderLevel(rental),
        reminderText: store.getReminderText(rental),
        lateDays: store.getLateDays(rental),
        lateFee: store.getLateFee(rental),
      }
    })
    .sort((a, b) => {
      if (a.status === 'borrowed' && b.status === 'returned') return -1
      if (a.status === 'returned' && b.status === 'borrowed') return 1
      return b.id - a.id
    })
})

const selectedRental = computed<UserRentalItem | null>(() => {
  if (!selectedRentalIdForExtension.value) return null
  return myRentals.value.find(rental => rental.id === selectedRentalIdForExtension.value) || null
})

const borrowedCount = computed<number>(() => {
  return myRentals.value.filter(rental => rental.status === 'borrowed').length
})

const dueSoonCount = computed<number>(() => {
  return myRentals.value.filter(rental => rental.status === 'borrowed' && rental.reminderLevel === 'due_soon').length
})

const overdueCount = computed<number>(() => {
  return myRentals.value.filter(rental => rental.status === 'borrowed' && rental.reminderLevel === 'overdue').length
})

const totalLateFee = computed<number>(() => {
  return myRentals.value.reduce((sum, rental) => sum + rental.lateFee, 0)
})

const maxExtensionDueDate = computed<string>(() => {
  if (!selectedRental.value) return ''
  const [year, month, day] = selectedRental.value.borrowDate.split('-').map(Number)
  const date = new Date(Date.UTC(year || 0, (month || 1) - 1, day || 1))
  date.setUTCMonth(date.getUTCMonth() + MAX_BORROW_MONTHS)
  return date.toISOString().split('T')[0]
})

const minExtensionDueDate = computed<string>(() => {
  if (!selectedRental.value) return ''
  const [year, month, day] = selectedRental.value.dueDate.split('-').map(Number)
  const date = new Date(Date.UTC(year || 0, (month || 1) - 1, day || 1))
  date.setUTCDate(date.getUTCDate() + 1)
  return date.toISOString().split('T')[0]
})

const isExtensionPossible = (rental: UserRentalItem): boolean => {
  if (rental.status !== 'borrowed') return false
  return true // Logic simplified for UI
}

function getStatusClass(rental: UserRentalItem): string {
  if (rental.status === 'returned') return 'badge-success'
  if (rental.reminderLevel === 'overdue') return 'badge-danger'
  if (rental.reminderLevel === 'due_soon') return 'badge-warning'
  return 'badge-info'
}

function getStatusText(rental: UserRentalItem): string {
  if (rental.status === 'returned') return 'Đã trả'
  if (rental.reminderLevel === 'overdue') return 'Quá hạn'
  if (rental.reminderLevel === 'due_soon') return 'Sắp hạn'
  return 'Đang mượn'
}

function hasPendingExtensionRequest(rentalId: number): boolean {
  return store.extensionRequests.some(
    request => request.rentalId === rentalId && request.userId === store.currentUser?.id && request.status === 'pending',
  )
}

function handleShowQR(rentalId: number): void {
  selectedRentalId.value = rentalId
  showQRModal.value = true
}

function openExtensionModal(rentalId: number): void {
  const rental = myRentals.value.find(item => item.id === rentalId)
  if (!rental) return
  selectedRentalIdForExtension.value = rentalId
  const [year, month, day] = rental.dueDate.split('-').map(Number)
  const date = new Date(Date.UTC(year || 0, (month || 1) - 1, day || 1))
  date.setUTCDate(date.getUTCDate() + 1)
  extensionDueDate.value = date.toISOString().split('T')[0]
  extensionNote.value = ''
  showExtensionModal.value = true
}

async function submitExtensionRequest(): Promise<void> {
  if (!selectedRentalIdForExtension.value || !extensionDueDate.value) return
  const request = await store.addExtensionRequest(selectedRentalIdForExtension.value, extensionDueDate.value, extensionNote.value)
  if (request) {
    showExtensionModal.value = false
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount)
}
</script>

<template>
  <div class="my-rentals-view">
    <!-- Stats Row -->
    <div class="stats-grid mb-8">
      <div class="stat-card">
        <div class="stat-icon bg-primary-soft text-primary">
          <i class="bi bi-book"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ borrowedCount }}</span>
          <span class="stat-label">Đang mượn</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon bg-warning-soft text-warning">
          <i class="bi bi-alarm"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ overdueCount }}</span>
          <span class="stat-label">Quá hạn</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon bg-danger-soft text-danger">
          <i class="bi bi-wallet2"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ formatCurrency(totalLateFee) }}</span>
          <span class="stat-label">Tổng tiền phạt</span>
        </div>
      </div>
    </div>

    <!-- Rentals Table -->
    <div class="card">
      <div class="card-header flex justify-between items-center">
        <h3 class="card-title">Lịch sử mượn sách</h3>
      </div>
      
      <div class="table-container">
        <table v-if="myRentals.length">
          <thead>
            <tr>
              <th>Thông tin sách</th>
              <th>Ngày mượn</th>
              <th>Hạn trả / Ngày trả</th>
              <th>Trạng thái</th>
              <th>Tiền phạt</th>
              <th class="text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rental in myRentals" :key="rental.id">
              <td>
                <div class="flex flex-column">
                  <span class="font-bold text-main">{{ rental.bookTitle }}</span>
                  <span class="text-subtle" style="font-size: 0.75rem">{{ rental.bookAuthor }}</span>
                </div>
              </td>
              <td class="text-subtle">{{ rental.borrowDate }}</td>
              <td>
                <div class="flex flex-column">
                  <span class="text-main">{{ rental.dueDate }}</span>
                  <span v-if="rental.returnDate" class="text-success" style="font-size: 0.75rem">
                    Đã trả: {{ rental.returnDate }}
                  </span>
                </div>
              </td>
              <td>
                <div class="flex flex-column gap-1">
                  <span class="badge" :class="getStatusClass(rental)">
                    {{ getStatusText(rental) }}
                  </span>
                  <span v-if="rental.status === 'borrowed'" class="text-subtle" style="font-size: 0.75rem">
                    {{ rental.reminderText }}
                  </span>
                </div>
              </td>
              <td>
                <span v-if="rental.lateFee > 0" class="text-danger font-bold">
                  {{ formatCurrency(rental.lateFee) }}
                </span>
                <span v-else class="text-subtle">0 đ</span>
              </td>
              <td class="text-right">
                <div class="flex gap-2 justify-end">
                  <button
                    v-if="rental.status === 'borrowed' && !hasPendingExtensionRequest(rental.id)"
                    class="btn btn-outline btn-sm"
                    @click="openExtensionModal(rental.id)"
                  >
                    Gia hạn
                  </button>
                  <span v-else-if="hasPendingExtensionRequest(rental.id)" class="badge badge-warning">Đang chờ duyệt</span>
                  
                  <button v-if="rental.lateFee > 0" class="btn btn-ghost btn-sm text-primary" @click="handleShowQR(rental.id)" title="Thanh toán QR">
                    <i class="bi bi-qr-code"></i>
                  </button>
                  <span v-if="rental.status === 'returned' && rental.lateFee === 0" class="text-subtle">—</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div v-else class="empty-state">
          <i class="bi bi-journal-check empty-icon"></i>
          <h3 class="empty-title">Chưa có lịch sử mượn</h3>
          <p class="empty-text">Bạn chưa thực hiện mượn cuốn sách nào từ thư viện.</p>
        </div>
      </div>
    </div>

    <!-- Extension Modal -->
    <div v-if="showExtensionModal" class="modal-overlay" @click.self="showExtensionModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="card-title">Yêu cầu gia hạn sách</h3>
          <button class="btn btn-ghost btn-sm" @click="showExtensionModal = false">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        
        <form @submit.prevent="submitExtensionRequest">
          <div class="modal-body">
            <div v-if="selectedRental" class="flex flex-column gap-1 mb-6 p-4 bg-app rounded">
              <span class="text-subtle" style="font-size: 0.75rem">Đang gia hạn cho sách:</span>
              <span class="font-bold text-main">{{ selectedRental.bookTitle }}</span>
              <span class="text-muted" style="font-size: 0.8125rem">Hạn hiện tại: {{ selectedRental.dueDate }}</span>
            </div>
            
            <div class="form-group">
              <label class="form-label">Hạn trả mong muốn mới</label>
              <input v-model="extensionDueDate" type="date" class="form-control" :min="minExtensionDueDate" :max="maxExtensionDueDate" required />
              <p class="text-subtle mt-1" style="font-size: 0.75rem">Hạn gia hạn tối đa 3 tháng kể từ ngày mượn.</p>
            </div>
            
            <div class="form-group">
              <label class="form-label">Lý do gia hạn (tùy chọn)</label>
              <textarea v-model="extensionNote" class="form-control" rows="3" placeholder="Nhập lý do của bạn..."></textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-outline" @click="showExtensionModal = false">Hủy</button>
            <button type="submit" class="btn btn-primary">Gửi yêu cầu</button>
          </div>
        </form>
      </div>
    </div>

    <PaymentQRModal v-if="showQRModal && selectedRentalId" :rental-id="selectedRentalId" @close="showQRModal = false" />
  </div>
</template>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--space-6);
}

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

.text-right { text-align: right; }
.text-danger { color: var(--danger) !important; }
.text-success { color: var(--success) !important; }
.font-bold { font-weight: 700; }
.flex-column { flex-direction: column; }
.rounded { border-radius: var(--radius-md); }
.mt-auto { margin-top: auto; }
</style>
