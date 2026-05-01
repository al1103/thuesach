<script setup lang="ts">
/**
 * @component RentalsView
 * @description Admin rental management with professional SaaS aesthetics.
 */
import { computed, onMounted, ref } from 'vue'
import { MAX_BORROW_MONTHS, useLibraryStore, type ReminderLevel } from '@/stores/library'
import { exportToExcel, exportToPdf, type ExportColumn } from '@/utils/export'
import PaymentQRModal from '@/components/features/PaymentQRModal.vue'

defineOptions({
  name: 'RentalsView',
})

const store = useLibraryStore()

onMounted(async () => {
  await Promise.all([
    store.fetchRentals(),
    store.fetchBooks(),
    store.fetchMembers(),
  ])
})

const filterStatus = ref<'all' | 'borrowed' | 'returned'>('all')
const showAddModal = ref<boolean>(false)
const showQRModal = ref<boolean>(false)
const selectedRentalId = ref<number | null>(null)

const formData = ref({
  bookId: 0,
  memberId: 0,
  dueDate: '',
})

interface RentalDisplayItem {
  id: number
  bookId: number
  memberId: number
  borrowDate: string
  dueDate: string
  returnDate: string | null
  status: 'borrowed' | 'returned'
  bookTitle: string
  memberName: string
  memberInitial: string
  lateDays: number
  lateFee: number
  reminderLevel: ReminderLevel
  reminderText: string
}

const filteredRentals = computed<RentalDisplayItem[]>(() => {
  let rentals = store.rentals.map(rental => {
    const book = store.getBook(rental.bookId)
    const member = store.getMember(rental.memberId)
    return {
      ...rental,
      bookTitle: book?.title || 'N/A',
      memberName: member?.name || 'N/A',
      memberInitial: member?.name?.charAt(0) || '?',
      lateDays: store.getLateDays(rental),
      lateFee: store.getLateFee(rental),
      reminderLevel: store.getReminderLevel(rental),
      reminderText: store.getReminderText(rental),
    }
  })

  if (filterStatus.value !== 'all') {
    rentals = rentals.filter(rental => rental.status === filterStatus.value)
  }

  return rentals.sort((a, b) => b.id - a.id)
})

const availableBooks = computed(() => {
  return store.books.filter(book => book.available > 0)
})

const rentalExportColumns: ExportColumn<RentalDisplayItem>[] = [
  { header: 'ID', value: rental => rental.id },
  { header: 'Thành viên', value: rental => rental.memberName },
  { header: 'Sách', value: rental => rental.bookTitle },
  { header: 'Ngày mượn', value: rental => rental.borrowDate },
  { header: 'Hạn trả', value: rental => rental.dueDate },
  { header: 'Ngày trả', value: rental => rental.returnDate || '-' },
  { header: 'Trạng thái', value: rental => getStatusText(rental) },
]

const today = new Date().toISOString().split('T')[0] ?? ''
const maxDueDate = computed<string>(() => {
  const [year, month, day] = today.split('-').map(value => Number(value))
  const maxDate = new Date(Date.UTC(year || 0, (month || 1) - 1, day || 1))
  maxDate.setUTCMonth(maxDate.getUTCMonth() + MAX_BORROW_MONTHS)
  return maxDate.toISOString().split('T')[0]
})

function getStatusClass(rental: { status: string; dueDate: string }): string {
  if (rental.status === 'returned') return 'badge-success'
  if (rental.dueDate < today) return 'badge-danger'
  return 'badge-warning'
}

function getStatusText(rental: { status: string; dueDate: string }): string {
  if (rental.status === 'returned') return 'Đã trả'
  if (rental.dueDate < today) return 'Quá hạn'
  return 'Đang mượn'
}

function handleShowQR(rentalId: number): void {
  selectedRentalId.value = rentalId
  showQRModal.value = true
}

async function handleReturn(rentalId: number): Promise<void> {
  const lateFee = await store.returnBook(rentalId)
  if (lateFee > 0) {
    store.showToast(`Đã xác nhận trả sách. Tiền phạt: ${formatCurrency(lateFee)}`, 'warning')
    return
  }
  store.showToast('Đã xác nhận trả sách')
}

async function handleAddRental(): Promise<void> {
  if (!formData.value.bookId || !formData.value.memberId) {
    store.showToast('Vui lòng điền đầy đủ thông tin', 'error')
    return
  }
  const newRental = await store.addRental(formData.value.bookId, formData.value.memberId, formData.value.dueDate)
  if (newRental) {
    showAddModal.value = false
    formData.value = { bookId: 0, memberId: 0, dueDate: '' }
  }
}

function handleExportExcel(): void {
  if (!filteredRentals.value.length) {
    store.showToast('Không có dữ liệu để xuất', 'error')
    return
  }
  exportToExcel(filteredRentals.value, rentalExportColumns, 'Rentals', 'danh-sach-muon-tra')
  store.showToast('Đã xuất Excel')
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount)
}

function getReminderClass(level: ReminderLevel): string {
  if (level === 'overdue') return 'badge-danger'
  if (level === 'due_soon') return 'badge-warning'
  return 'badge-info'
}
</script>

<template>
  <div class="rentals-view">
    <!-- Header Actions -->
    <div class="flex justify-between items-start mb-6">
      <div class="filter-tabs mb-0">
        <button 
          class="btn" 
          :class="{ 'active': filterStatus === 'all' }" 
          @click="filterStatus = 'all'"
        >Tất cả</button>
        <button 
          class="btn" 
          :class="{ 'active': filterStatus === 'borrowed' }" 
          @click="filterStatus = 'borrowed'"
        >Đang mượn</button>
        <button 
          class="btn" 
          :class="{ 'active': filterStatus === 'returned' }" 
          @click="filterStatus = 'returned'"
        >Đã trả</button>
      </div>

      <div class="action-buttons">
        <button class="btn btn-outline" @click="handleExportExcel">
          <i class="bi bi-download"></i> Xuất Excel
        </button>
        <button class="btn btn-primary" @click="showAddModal = true">
          <i class="bi bi-plus-lg"></i> Tạo phiếu mượn
        </button>
      </div>
    </div>

    <!-- Rentals Table -->
    <div class="card">
      <div class="table-container">
        <table v-if="filteredRentals.length">
          <thead>
            <tr>
              <th>Thành viên</th>
              <th>Sách</th>
              <th>Ngày mượn / Hạn trả</th>
              <th>Trạng thái</th>
              <th>Nhắc hạn</th>
              <th>Tiền phạt</th>
              <th class="text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rental in filteredRentals" :key="rental.id">
              <td>
                <div class="flex items-center gap-2">
                  <div class="avatar" style="width: 32px; height: 32px; font-size: 0.8125rem">{{ rental.memberInitial }}</div>
                  <span class="font-bold">{{ rental.memberName }}</span>
                </div>
              </td>
              <td class="text-subtle">{{ rental.bookTitle }}</td>
              <td>
                <div class="flex flex-column">
                  <span class="text-main">{{ rental.borrowDate }}</span>
                  <span class="text-subtle" style="font-size: 0.75rem">Đến: {{ rental.dueDate }}</span>
                </div>
              </td>
              <td>
                <span class="badge" :class="getStatusClass(rental)">
                  {{ getStatusText(rental) }}
                </span>
              </td>
              <td>
                <span class="badge" :class="getReminderClass(rental.reminderLevel)">
                  {{ rental.reminderText }}
                </span>
              </td>
              <td>
                <span v-if="rental.lateFee > 0" class="text-danger font-bold">
                  {{ formatCurrency(rental.lateFee) }}
                </span>
                <span v-else class="text-subtle">0 đ</span>
              </td>
              <td class="text-right">
                <div class="flex gap-2 justify-end">
                  <button v-if="rental.status === 'borrowed'" class="btn btn-primary btn-sm" @click="handleReturn(rental.id)">
                    Trả sách
                  </button>
                  <button v-if="rental.lateFee > 0" class="btn btn-outline btn-sm" @click="handleShowQR(rental.id)" title="Thanh toán QR">
                    <i class="bi bi-qr-code"></i>
                  </button>
                  <span v-if="rental.status === 'returned'" class="text-subtle" style="font-size: 0.8125rem">
                    Đã trả: {{ rental.returnDate }}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div v-else class="empty-state">
          <i class="bi bi-clipboard-x empty-icon"></i>
          <h3 class="empty-title">Không có dữ liệu</h3>
          <p class="empty-text">Chưa có phiếu mượn nào được ghi nhận trong hệ thống.</p>
        </div>
      </div>
    </div>

    <!-- Create Rental Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="card-title">Tạo phiếu mượn mới</h3>
          <button class="btn btn-ghost btn-sm" @click="showAddModal = false">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        
        <form @submit.prevent="handleAddRental">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Chọn sách</label>
              <select v-model="formData.bookId" class="form-control" required>
                <option :value="0" disabled>-- Chọn sách đang có sẵn --</option>
                <option v-for="book in availableBooks" :key="book.id" :value="book.id">
                  {{ book.title }} (Còn {{ book.available }} cuốn)
                </option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">Chọn thành viên</label>
              <select v-model="formData.memberId" class="form-control" required>
                <option :value="0" disabled>-- Chọn thành viên mượn --</option>
                <option v-for="member in store.members" :key="member.id" :value="member.id">
                  {{ member.name }}
                </option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">Hạn trả sách</label>
              <input v-model="formData.dueDate" type="date" class="form-control" :min="today" :max="maxDueDate" />
              <p class="text-subtle mt-1" style="font-size: 0.75rem">
                Mặc định là {{ MAX_BORROW_MONTHS }} tháng kể từ hôm nay nếu để trống.
              </p>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-outline" @click="showAddModal = false">Hủy</button>
            <button type="submit" class="btn btn-primary">Xác nhận mượn</button>
          </div>
        </form>
      </div>
    </div>

    <PaymentQRModal v-if="showQRModal && selectedRentalId" :rental-id="selectedRentalId" @close="showQRModal = false" />
  </div>
</template>

<style scoped>
.text-right { text-align: right; }
.text-danger { color: var(--danger) !important; }
.font-bold { font-weight: 700; }
.flex-column { flex-direction: column; }
.mb-0 { margin-bottom: 0 !important; }
.mt-1 { margin-top: var(--space-1); }
</style>
