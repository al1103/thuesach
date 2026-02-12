<script setup lang="ts">
/**
 * @component RentalsView
 * @description Admin rental management - view borrowed books and process returns.
 */
import { computed, ref } from 'vue'
import { MAX_BORROW_MONTHS, useLibraryStore, type ReminderLevel } from '@/stores/library'
import { exportToExcel, exportToPdf, type ExportColumn } from '@/utils/export'

defineOptions({
  name: 'RentalsView',
})

const store = useLibraryStore()

const filterStatus = ref<'all' | 'borrowed' | 'returned'>('all')
const showAddModal = ref<boolean>(false)

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
  { header: 'Nhắc hạn', value: rental => rental.reminderText },
  { header: 'Trễ (ngày)', value: rental => rental.lateDays },
  { header: 'Tiền phạt', value: rental => formatCurrency(rental.lateFee) },
]

const today = new Date().toISOString().split('T')[0] ?? ''
const maxDueDate = computed<string>(() => {
  const [year, month, day] = today.split('-').map(value => Number(value))
  const maxDate = new Date(Date.UTC(year || 0, (month || 1) - 1, day || 1))
  maxDate.setUTCMonth(maxDate.getUTCMonth() + MAX_BORROW_MONTHS)
  const maxYear = maxDate.getUTCFullYear()
  const maxMonth = `${maxDate.getUTCMonth() + 1}`.padStart(2, '0')
  const maxDay = `${maxDate.getUTCDate()}`.padStart(2, '0')
  return `${maxYear}-${maxMonth}-${maxDay}`
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

function handleReturn(rentalId: number): void {
  const lateFee = store.returnBook(rentalId)
  if (lateFee > 0) {
    store.showToast(`Đã xác nhận trả sách. Tiền phạt: ${formatCurrency(lateFee)}`, 'warning')
    return
  }
  store.showToast('Đã xác nhận trả sách')
}

function handleAddRental(): void {
  if (!formData.value.bookId || !formData.value.memberId) {
    store.showToast('Vui lòng điền đầy đủ thông tin', 'error')
    return
  }
  const newRental = store.addRental(formData.value.bookId, formData.value.memberId, formData.value.dueDate)
  if (!newRental) {
    store.showToast(
      `Không thể tạo phiếu mượn (thành viên có thể đang blacklist hoặc hạn trả vượt ${MAX_BORROW_MONTHS} tháng)`,
      'error',
    )
    return
  }
  store.showToast('Đã tạo phiếu mượn')
  showAddModal.value = false
  formData.value = { bookId: 0, memberId: 0, dueDate: '' }
}

function handleExportExcel(): void {
  if (!filteredRentals.value.length) {
    store.showToast('Không có dữ liệu để xuất', 'error')
    return
  }
  exportToExcel(filteredRentals.value, rentalExportColumns, 'Rentals', 'danh-sach-muon-tra')
  store.showToast('Đã xuất Excel mượn/trả')
}

function handleExportPdf(): void {
  if (!filteredRentals.value.length) {
    store.showToast('Không có dữ liệu để xuất', 'error')
    return
  }
  exportToPdf(filteredRentals.value, rentalExportColumns, 'Danh sách mượn trả', 'danh-sach-muon-tra')
  store.showToast('Đã xuất PDF mượn/trả')
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
    <div class="search-box">
      <div class="filter-tabs">
        <button class="btn" :class="filterStatus === 'all' ? 'btn-primary' : 'btn-secondary'" @click="filterStatus = 'all'">
          Tất cả
        </button>
        <button class="btn" :class="filterStatus === 'borrowed' ? 'btn-primary' : 'btn-secondary'" @click="filterStatus = 'borrowed'">
          Đang mượn
        </button>
        <button class="btn" :class="filterStatus === 'returned' ? 'btn-primary' : 'btn-secondary'" @click="filterStatus = 'returned'">
          Đã trả
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
        <button class="btn btn-primary" @click="showAddModal = true">➕ Tạo phiếu mượn</button>
      </div>
    </div>

    <div class="card">
      <div class="table-container">
        <table v-if="filteredRentals.length" class="table table-hover align-middle">
          <thead>
            <tr>
              <th>Thành viên</th>
              <th>Sách</th>
              <th>Ngày mượn</th>
              <th>Hạn trả</th>
              <th>Trạng thái</th>
              <th>Nhắc hạn</th>
              <th>Tiền phạt</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rental in filteredRentals" :key="rental.id">
              <td>
                <div class="member-cell">
                  <div class="member-avatar">{{ rental.memberInitial }}</div>
                  <span>{{ rental.memberName }}</span>
                </div>
              </td>
              <td><strong>{{ rental.bookTitle }}</strong></td>
              <td>{{ rental.borrowDate }}</td>
              <td>{{ rental.dueDate }}</td>
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
                <span class="badge" :class="rental.lateFee > 0 ? 'badge-danger' : 'badge-success'">
                  {{ rental.lateFee > 0 ? formatCurrency(rental.lateFee) : '0 đ' }}
                </span>
              </td>
              <td>
                <button v-if="rental.status === 'borrowed'" class="btn btn-sm btn-success" @click="handleReturn(rental.id)">
                  ✓ Xác nhận trả
                </button>
                <span v-else class="text-muted">{{ rental.returnDate }}</span>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">
          <div class="icon">📋</div>
          <p>Không có phiếu mượn nào</p>
        </div>
      </div>
    </div>

    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>Tạo phiếu mượn mới</h3>
          <button class="modal-close" @click="showAddModal = false">&times;</button>
        </div>
        <form @submit.prevent="handleAddRental">
          <div class="form-group">
            <label>Chọn sách</label>
            <select v-model="formData.bookId" required>
              <option :value="0" disabled>Chọn sách</option>
              <option v-for="book in availableBooks" :key="book.id" :value="book.id">
                {{ book.title }} (còn {{ book.available }})
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Chọn thành viên</label>
            <select v-model="formData.memberId" required>
              <option :value="0" disabled>Chọn thành viên</option>
              <option v-for="member in store.members" :key="member.id" :value="member.id">
                {{ member.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Hạn trả (tùy chọn)</label>
            <input v-model="formData.dueDate" type="date" :min="today" :max="maxDueDate" />
            <small class="text-muted">
              Để trống sẽ mặc định {{ MAX_BORROW_MONTHS }} tháng kể từ ngày mượn.
            </small>
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%">Tạo phiếu mượn</button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.filter-tabs {
  display: flex;
  gap: var(--space-sm);
}

.text-muted {
  color: var(--text-muted);
  font-size: 0.8125rem;
}
</style>
