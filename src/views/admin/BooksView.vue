<script setup lang="ts">
/**
 * @component BooksView
 * @description Admin book management with CRUD operations.
 */
import { computed, onMounted, ref } from 'vue'
import { useLibraryStore, type Book } from '@/stores/library'
import { exportToExcel, exportToPdf, type ExportColumn } from '@/utils/export'

defineOptions({
  name: 'BooksView',
})

const store = useLibraryStore()

onMounted(() => {
  store.fetchBooks()
})

const searchQuery = ref<string>('')
const showModal = ref<boolean>(false)
const editingBook = ref<Book | null>(null)

const formData = ref({
  title: '',
  author: '',
  category: '',
  quantity: 1,
})

const filteredBooks = computed<Book[]>(() => {
  const query = searchQuery.value.toLowerCase()
  if (!query) return store.books
  return store.books.filter(
    book =>
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query) ||
      book.category.toLowerCase().includes(query),
  )
})

const bookExportColumns: ExportColumn<Book>[] = [
  { header: 'ID', value: book => book.id },
  { header: 'Tên sách', value: book => book.title },
  { header: 'Tác giả', value: book => book.author },
  { header: 'Thể loại', value: book => book.category },
  { header: 'Số lượng', value: book => book.quantity },
  { header: 'Còn lại', value: book => book.available },
]

function openAddModal(): void {
  editingBook.value = null
  formData.value = { title: '', author: '', category: '', quantity: 1 }
  showModal.value = true
}

function openEditModal(book: Book): void {
  editingBook.value = book
  formData.value = {
    title: book.title,
    author: book.author,
    category: book.category,
    quantity: book.quantity,
  }
  showModal.value = true
}

async function handleSubmit(): Promise<void> {
  if (editingBook.value) {
    await store.updateBook(editingBook.value.id, {
      ...formData.value,
      available: formData.value.quantity - (editingBook.value.quantity - editingBook.value.available),
    })
  } else {
    await store.addBook({
      ...formData.value,
      available: formData.value.quantity,
    })
  }
  showModal.value = false
}

async function handleDelete(book: Book): Promise<void> {
  if (confirm(`Bạn có chắc muốn xóa "${book.title}"?`)) {
    await store.deleteBook(book.id)
  }
}

function handleExportExcel(): void {
  if (!filteredBooks.value.length) {
    store.showToast('Không có dữ liệu để xuất', 'error')
    return
  }
  exportToExcel(filteredBooks.value, bookExportColumns, 'Books', 'danh-sach-sach')
  store.showToast('Đã xuất Excel danh sách sách')
}

function handleExportPdf(): void {
  if (!filteredBooks.value.length) {
    store.showToast('Không có dữ liệu để xuất', 'error')
    return
  }
  exportToPdf(filteredBooks.value, bookExportColumns, 'Danh sách sách', 'danh-sach-sach')
  store.showToast('Đã xuất PDF danh sách sách')
}
</script>

<template>
  <div class="books-view">
    <div class="search-box">
      <input
        v-model="searchQuery"
        type="text"
        class="search-input"
        placeholder="🔍 Tìm kiếm sách theo tên, tác giả, thể loại..."
      />
      <div class="action-buttons">
        <button class="btn btn-secondary" @click="handleExportExcel">
          <i class="bi bi-file-earmark-excel"></i>
          Excel
        </button>
        <button class="btn btn-secondary" @click="handleExportPdf">
          <i class="bi bi-file-earmark-pdf"></i>
          PDF
        </button>
        <button class="btn btn-primary" @click="openAddModal">➕ Thêm sách</button>
      </div>
    </div>

    <div class="card">
      <div class="table-container">
        <table v-if="filteredBooks.length" class="table table-hover align-middle">
          <thead>
            <tr>
              <th>Tên sách</th>
              <th>Tác giả</th>
              <th>Thể loại</th>
              <th>Số lượng</th>
              <th>Còn lại</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="book in filteredBooks" :key="book.id">
              <td>
                <strong>{{ book.title }}</strong>
              </td>
              <td>{{ book.author }}</td>
              <td>
                <span class="badge badge-primary">{{ book.category }}</span>
              </td>
              <td>{{ book.quantity }}</td>
              <td>
                <span class="badge" :class="book.available > 0 ? 'badge-success' : 'badge-danger'">
                  {{ book.available }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button class="btn-icon" title="Sửa" @click="openEditModal(book)">✏️</button>
                  <button class="btn-icon" title="Xóa" @click="handleDelete(book)">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">
          <div class="icon">📚</div>
          <p>Không tìm thấy sách nào</p>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ editingBook ? 'Sửa sách' : 'Thêm sách mới' }}</h3>
          <button class="modal-close" @click="showModal = false">&times;</button>
        </div>
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>Tên sách</label>
            <input v-model="formData.title" type="text" placeholder="Nhập tên sách" required />
          </div>
          <div class="form-group">
            <label>Tác giả</label>
            <input v-model="formData.author" type="text" placeholder="Nhập tên tác giả" required />
          </div>
          <div class="form-group">
            <label>Thể loại</label>
            <select v-model="formData.category" required>
              <option value="">Chọn thể loại</option>
              <option value="Tiểu thuyết">Tiểu thuyết</option>
              <option value="Kỹ năng sống">Kỹ năng sống</option>
              <option value="Kinh doanh">Kinh doanh</option>
              <option value="Lịch sử">Lịch sử</option>
              <option value="Khoa học">Khoa học</option>
              <option value="Văn học">Văn học</option>
            </select>
          </div>
          <div class="form-group">
            <label>Số lượng</label>
            <input v-model.number="formData.quantity" type="number" min="1" required />
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%">
            {{ editingBook ? 'Cập nhật' : 'Thêm sách' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
