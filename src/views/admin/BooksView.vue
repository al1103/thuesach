<script setup lang="ts">
/**
 * @component BooksView
 * @description Admin book management with professional SaaS aesthetics.
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
  coverUrl: '',
})

const coverFile = ref<File | null>(null)
const coverPreview = ref<string>('')

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
  formData.value = { title: '', author: '', category: '', quantity: 1, coverUrl: '' }
  coverFile.value = null
  coverPreview.value = ''
  showModal.value = true
}

function openEditModal(book: Book): void {
  editingBook.value = book
  formData.value = {
    title: book.title,
    author: book.author,
    category: book.category,
    quantity: book.quantity,
    coverUrl: book.coverUrl || '',
  }
  coverFile.value = null
  coverPreview.value = book.coverUrl || ''
  showModal.value = true
}

function handleFileChange(event: Event): void {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    coverFile.value = target.files[0]
    coverPreview.value = URL.createObjectURL(target.files[0])
  }
}

async function handleSubmit(): Promise<void> {
  store.loading = true
  try {
    if (coverFile.value) {
      const uploadedUrl = await store.uploadBookCover(coverFile.value)
      if (uploadedUrl) {
        formData.value.coverUrl = uploadedUrl
      }
    }

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
  } finally {
    store.loading = false
  }
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
  store.showToast('Đã xuất Excel')
}
</script>

<template>
  <div class="books-view">
    <!-- Header Actions -->
    <div class="flex justify-between items-center mb-6">
      <div class="search-bar">
        <i class="bi bi-search"></i>
        <input v-model="searchQuery" type="text" placeholder="Tìm kiếm theo tên, tác giả..." style="width: 320px;" />
      </div>
      
      <div class="flex gap-2">
        <button class="btn btn-outline" @click="handleExportExcel">
          <i class="bi bi-download"></i> Xuất Excel
        </button>
        <button class="btn btn-primary" @click="openAddModal">
          <i class="bi bi-plus-lg"></i> Thêm sách mới
        </button>
      </div>
    </div>

    <!-- Books Table -->
    <div class="card">
      <div class="table-container">
        <table v-if="filteredBooks.length">
          <thead>
            <tr>
              <th style="width: 80px">Bìa</th>
              <th>Thông tin sách</th>
              <th>Thể loại</th>
              <th>Kho</th>
              <th>Trạng thái</th>
              <th class="text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="book in filteredBooks" :key="book.id">
              <td>
                <img v-if="book.coverUrl" :src="book.coverUrl" class="book-thumb" :alt="book.title" />
                <div v-else class="no-thumb">
                  <i class="bi bi-book text-subtle"></i>
                </div>
              </td>
              <td>
                <div class="flex flex-column">
                  <span class="font-bold text-main">{{ book.title }}</span>
                  <span class="text-subtle" style="font-size: 0.8125rem">{{ book.author }}</span>
                </div>
              </td>
              <td>
                <span class="badge badge-info">{{ book.category }}</span>
              </td>
              <td>
                <div class="text-main font-medium">{{ book.available }} / {{ book.quantity }}</div>
                <div class="w-full bg-app mt-1" style="height: 4px; border-radius: 2px; width: 60px; overflow: hidden">
                  <div class="bg-primary" :style="{ width: (book.available / book.quantity * 100) + '%' }" style="height: 100%"></div>
                </div>
              </td>
              <td>
                <span v-if="book.available > 0" class="badge badge-success">Sẵn có</span>
                <span v-else class="badge badge-danger">Hết sách</span>
              </td>
              <td class="text-right">
                <div class="flex gap-1 justify-end">
                  <button class="btn btn-ghost btn-sm" @click="openEditModal(book)" title="Chỉnh sửa">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-ghost btn-sm text-danger" @click="handleDelete(book)" title="Xóa">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div v-else class="empty-state">
          <i class="bi bi-journal-x empty-icon"></i>
          <h3 class="empty-title">Không tìm thấy sách</h3>
          <p class="empty-text">Hãy thử thay đổi từ khóa tìm kiếm hoặc thêm sách mới vào hệ thống.</p>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-content" style="max-width: 600px">
        <div class="modal-header">
          <h3 class="card-title">{{ editingBook ? 'Cập nhật thông tin sách' : 'Thêm sách mới' }}</h3>
          <button class="btn btn-ghost btn-sm" @click="showModal = false">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        
        <form @submit.prevent="handleSubmit">
          <div class="modal-body">
            <div class="flex gap-6">
              <!-- Cover Upload Section -->
              <div style="width: 160px; flex-shrink: 0;">
                <label class="form-label">Ảnh bìa</label>
                <div class="upload-area" @click="$refs.fileInput.click()">
                  <img v-if="coverPreview" :src="coverPreview" class="w-full" style="aspect-ratio: 2/3; object-fit: cover; border-radius: var(--radius-md);" />
                  <div v-else class="upload-placeholder">
                    <i class="bi bi-cloud-arrow-up"></i>
                    <span>Tải ảnh</span>
                  </div>
                  <input type="file" ref="fileInput" hidden accept="image/*" @change="handleFileChange" />
                </div>
              </div>

              <!-- Main Info Section -->
              <div class="flex-1">
                <div class="form-group">
                  <label class="form-label">Tên sách</label>
                  <input v-model="formData.title" class="form-control" placeholder="Ví dụ: Đắc Nhân Tâm" required />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Tác giả</label>
                  <input v-model="formData.author" class="form-control" placeholder="Ví dụ: Dale Carnegie" required />
                </div>

                <div class="flex gap-4">
                  <div class="form-group" style="flex: 2">
                    <label class="form-label">Thể loại</label>
                    <select v-model="formData.category" class="form-control" required>
                      <option value="">Chọn thể loại</option>
                      <option v-for="cat in ['Tiểu thuyết', 'Kỹ năng sống', 'Kinh doanh', 'Lịch sử', 'Khoa học', 'Văn học']" :key="cat" :value="cat">
                        {{ cat }}
                      </option>
                    </select>
                  </div>
                  <div class="form-group" style="flex: 1">
                    <label class="form-label">Số lượng</label>
                    <input v-model.number="formData.quantity" type="number" min="1" class="form-control" required />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-outline" @click="showModal = false">Hủy</button>
            <button type="submit" class="btn btn-primary" :disabled="store.loading">
              <span v-if="store.loading" class="spinner-border spinner-border-sm me-2"></span>
              {{ editingBook ? 'Lưu thay đổi' : 'Thêm sách' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.text-right { text-align: right; }
.text-danger { color: var(--danger) !important; }
.font-bold { font-weight: 700; }
.flex-column { flex-direction: column; }
.ms-1 { margin-left: var(--space-1); }
.mt-1 { margin-top: var(--space-1); }

.upload-area {
  border: 2px dashed var(--border-main);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
  overflow: hidden;
}

.upload-area:hover {
  border-color: var(--primary);
  background-color: var(--primary-light);
}

.upload-placeholder {
  aspect-ratio: 2/3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-subtle);
  gap: var(--space-2);
}

.upload-placeholder i {
  font-size: 2rem;
}
</style>
