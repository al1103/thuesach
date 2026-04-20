<script setup lang="ts">
/**
 * @component MyRentalsView
 * @description User view to track rentals, reminders, and extension requests.
 */
import { computed, ref, onMounted } from 'vue'
import { MAX_BORROW_MONTHS, useLibraryStore, type ReminderLevel } from '@/stores/library'
import PaymentQRModal from '@/components/features/PaymentQRModal.vue'

defineOptions({
  name: 'MyRentalsView',
})

const store = useLibraryStore()

onMounted(() => {
  store.fetchRentals()
  store.fetchExtensionRequests()
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
  return addMonths(selectedRental.value.borrowDate, MAX_BORROW_MONTHS)
})

const minExtensionDueDate = computed<string>(() => {
  if (!selectedRental.value) return ''
  return addDays(selectedRental.value.dueDate, 1)
})

const isExtensionPossible = (rental: UserRentalItem): boolean => {
  if (rental.status !== 'borrowed') return false
  const max = addMonths(rental.borrowDate, MAX_BORROW_MONTHS)
  const min = addDays(rental.dueDate, 1)
  return min <= max
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
  if (rental.reminderLevel === 'due_soon') return 'Sắp đến hạn'
  return 'Đang mượn'
}

function getReminderClass(level: ReminderLevel): string {
  if (level === 'overdue') return 'badge-danger'
  if (level === 'due_soon') return 'badge-warning'
  return 'badge-info'
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
  extensionDueDate.value = addDays(rental.dueDate, 1)
  extensionNote.value = ''
  showExtensionModal.value = true
}

function submitExtensionRequest(): void {
  if (!selectedRentalIdForExtension.value || !extensionDueDate.value) {
    store.showToast('Vui lòng chọn hạn gia hạn', 'error')
    return
  }

  const request = store.addExtensionRequest(selectedRentalIdForExtension.value, extensionDueDate.value, extensionNote.value)
  if (!request) {
    store.showToast('Không thể gửi yêu cầu gia hạn', 'error')
    return
  }

  showExtensionModal.value = false
  selectedRentalIdForExtension.value = null
  extensionDueDate.value = ''
  extensionNote.value = ''
  store.showToast('Đã gửi yêu cầu gia hạn')
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount)
}

function addDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(value => Number(value))
  const result = new Date(Date.UTC(year || 0, (month || 1) - 1, day || 1))
  result.setUTCDate(result.getUTCDate() + days)
  return formatDate(result)
}

function addMonths(date: string, months: number): string {
  const [year, month, day] = date.split('-').map(value => Number(value))
  const result = new Date(Date.UTC(year || 0, (month || 1) - 1, day || 1))
  result.setUTCMonth(result.getUTCMonth() + months)
  return formatDate(result)
}

function formatDate(date: Date): string {
  const year = date.getUTCFullYear()
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0')
  const day = `${date.getUTCDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}
</script>

<template>
  <div class="my-rentals-view">
    <div class="summary-grid">
      <div class="summary-card">
        <div class="summary-icon">📖</div>
        <div class="summary-content">
          <div class="summary-value">{{ borrowedCount }}</div>
          <div class="summary-label">Sách đang mượn</div>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon">⏰</div>
        <div class="summary-content">
          <div class="summary-value">{{ dueSoonCount }} / {{ overdueCount }}</div>
          <div class="summary-label">Sắp hạn / Quá hạn</div>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon">💸</div>
        <div class="summary-content">
          <div class="summary-value">{{ formatCurrency(totalLateFee) }}</div>
          <div class="summary-label">Tổng tiền phạt tạm tính</div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>Lịch sử mượn sách</h3>
      </div>
      <div class="table-container">
        <table v-if="myRentals.length" class="table table-hover align-middle">
          <thead>
            <tr>
              <th>Sách</th>
              <th>Ngày mượn</th>
              <th>Hạn trả</th>
              <th>Nhắc hạn</th>
              <th>Trạng thái</th>
              <th>Tiền phạt</th>
              <th>Gia hạn</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rental in myRentals" :key="rental.id">
              <td>
                <div>
                  <strong>{{ rental.bookTitle }}</strong>
                  <div class="text-muted">{{ rental.bookAuthor }}</div>
                </div>
              </td>
              <td>{{ rental.borrowDate }}</td>
              <td>
                <div>{{ rental.dueDate }}</div>
                <div class="text-muted">Trả: {{ rental.returnDate || '—' }}</div>
              </td>
              <td>
                <span class="badge" :class="getReminderClass(rental.reminderLevel)">
                  {{ rental.reminderText }}
                </span>
              </td>
              <td>
                <span class="badge" :class="getStatusClass(rental)">
                  {{ getStatusText(rental) }}
                </span>
              </td>
              <td>
                <span class="badge" :class="rental.lateFee > 0 ? 'badge-danger' : 'badge-success'">
                  {{ rental.lateFee > 0 ? formatCurrency(rental.lateFee) : '0 đ' }}
                </span>
              </td>
              <td>
                <div class="action-group">
                  <button
                    v-if="rental.status === 'borrowed' && !hasPendingExtensionRequest(rental.id)"
                    class="btn btn-sm btn-secondary"
                    :disabled="!isExtensionPossible(rental)"
                    @click="openExtensionModal(rental.id)"
                  >
                    Gia hạn
                  </button>
                  <span v-else-if="hasPendingExtensionRequest(rental.id)" class="badge badge-warning">Đang chờ duyệt</span>
                  <button v-if="rental.lateFee > 0" class="btn btn-sm btn-info" @click="handleShowQR(rental.id)">
                    QR
                  </button>
                  <span v-if="rental.status === 'returned' && rental.lateFee === 0" class="text-muted">—</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">
          <div class="icon">📚</div>
          <p>Bạn chưa mượn sách nào</p>
        </div>
      </div>
    </div>

    <div v-if="showExtensionModal" class="modal-overlay" @click.self="showExtensionModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>Gửi yêu cầu gia hạn</h3>
          <button class="modal-close" @click="showExtensionModal = false">&times;</button>
        </div>
        <div v-if="selectedRental" class="extension-meta">
          <p><strong>Sách:</strong> {{ selectedRental.bookTitle }}</p>
          <p><strong>Hạn hiện tại:</strong> {{ selectedRental.dueDate }}</p>
        </div>
        <form @submit.prevent="submitExtensionRequest">
          <div class="form-group">
            <label>Hạn gia hạn mong muốn</label>
            <input v-model="extensionDueDate" type="date" :min="minExtensionDueDate" :max="maxExtensionDueDate" required />
            <small class="text-muted">Tối đa {{ MAX_BORROW_MONTHS }} tháng kể từ ngày mượn.</small>
          </div>
          <div class="form-group">
            <label>Ghi chú</label>
            <textarea v-model="extensionNote" rows="3" placeholder="Lý do cần gia hạn (tùy chọn)"></textarea>
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%">Gửi yêu cầu</button>
        </form>
      </div>
    </div>

    <PaymentQRModal v-if="showQRModal && selectedRentalId" :rental-id="selectedRentalId" @close="showQRModal = false" />
  </div>
</template>

<style scoped>
.my-rentals-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-md);
}

.text-muted {
  color: var(--text-muted);
  font-size: 0.75rem;
}

.extension-meta {
  margin-bottom: var(--space-md);
  padding: var(--space-md);
  border-radius: var(--radius-md);
  background: var(--bg-surface-soft);
  border: 1px solid var(--border);
}

.extension-meta p + p {
  margin-top: 4px;
}

.action-group {
  display: flex;
  gap: 4px;
}

@media (max-width: 1024px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
