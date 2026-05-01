<script setup lang="ts">
/**
 * @component CatalogView
 * @description User catalog view with professional SaaS aesthetics.
 */
import { computed, ref, onMounted } from 'vue'
import { useLibraryStore } from '@/stores/library'

defineOptions({
  name: 'CatalogView',
})

const store = useLibraryStore()

onMounted(async () => {
  await Promise.all([
    store.fetchBooks(),
    store.fetchRequests(),
  ])
})

const searchQuery = ref<string>('')
const showRequestModal = ref<boolean>(false)
const selectedBookId = ref<number | null>(null)
const requestNote = ref<string>('')

const filteredBooks = computed(() => {
  const query = searchQuery.value.toLowerCase()
  if (!query) return store.books
  return store.books.filter(
    book =>
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query) ||
      book.category.toLowerCase().includes(query),
  )
})

const selectedBook = computed(() => {
  if (!selectedBookId.value) return null
  return store.getBook(selectedBookId.value)
})

const currentMember = computed(() => {
  return store.currentUser?.member || null
})

const isBlocked = computed(() => {
  if (!currentMember.value) return false
  return store.isMemberBlacklisted(currentMember.value.id)
})

function hasExistingRequest(bookId: number): boolean {
  return store.requests.some(
    request => request.bookId === bookId && request.userId === store.currentUser?.id && request.status === 'pending',
  )
}

function openRequestModal(bookId: number): void {
  if (isBlocked.value) {
    store.showToast('Tài khoản đang bị khóa mượn sách', 'error')
    return
  }
  selectedBookId.value = bookId
  requestNote.value = ''
  showRequestModal.value = true
}

async function handleRequest(): Promise<void> {
  if (!selectedBookId.value) return
  const result = await store.addRequest(selectedBookId.value, requestNote.value)
  if (result) {
    showRequestModal.value = false
  }
}
</script>

<template>
  <div class="catalog-view">
    <!-- Blocked Alert -->
    <div v-if="isBlocked && currentMember" class="alert alert-danger mb-6">
      <i class="bi bi-slash-circle-fill"></i>
      <div>
        <strong>Tài khoản đang bị khóa mượn sách</strong>
        <p class="mb-0" style="font-size: 0.8125rem">
          Khóa đến {{ currentMember.blacklistUntil || 'không thời hạn' }}. Lý do: {{ currentMember.blacklistReason || 'Vi phạm nội quy' }}
        </p>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="flex justify-between items-center mb-8">
      <div class="search-bar">
        <i class="bi bi-search"></i>
        <input v-model="searchQuery" type="text" placeholder="Tìm kiếm sách, tác giả, thể loại..." style="width: 400px;" />
      </div>
    </div>

    <!-- Book Grid -->
    <div v-if="filteredBooks.length" class="book-grid-container">
      <div v-for="book in filteredBooks" :key="book.id" class="catalog-card">
        <div class="catalog-card-cover">
          <img v-if="book.coverUrl" :src="book.coverUrl" :alt="book.title" />
          <div v-else class="no-cover">
            <i class="bi bi-book"></i>
          </div>
          <div class="catalog-card-badge" :class="book.available > 0 ? 'available' : 'unavailable'">
            {{ book.available > 0 ? 'Sẵn có' : 'Hết sách' }}
          </div>
        </div>
        
        <div class="catalog-card-body">
          <div class="category-tag">{{ book.category }}</div>
          <h4 class="book-title">{{ book.title }}</h4>
          <p class="book-author">{{ book.author }}</p>
          
          <div class="flex justify-between items-center mt-auto pt-4">
            <span class="stock-info">Còn {{ book.available }} cuốn</span>
            
            <button
              v-if="book.available > 0 && !hasExistingRequest(book.id)"
              class="btn btn-primary btn-sm"
              :disabled="isBlocked"
              @click="openRequestModal(book.id)"
            >
              <i class="bi bi-plus-lg"></i> Mượn sách
            </button>
            <button
              v-else-if="hasExistingRequest(book.id)"
              class="btn btn-outline btn-sm"
              disabled
            >
              <i class="bi bi-clock"></i> Chờ duyệt
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <i class="bi bi-journal-x empty-icon"></i>
      <h3 class="empty-title">Không tìm thấy sách</h3>
      <p class="empty-text">Hãy thử tìm kiếm với từ khóa khác.</p>
    </div>

    <!-- Request Modal -->
    <div v-if="showRequestModal" class="modal-overlay" @click.self="showRequestModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="card-title">Gửi yêu cầu mượn sách</h3>
          <button class="btn btn-ghost btn-sm" @click="showRequestModal = false">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        
        <form @submit.prevent="handleRequest">
          <div class="modal-body">
            <div v-if="selectedBook" class="flex gap-4 mb-6 p-4 bg-app rounded">
              <img v-if="selectedBook.coverUrl" :src="selectedBook.coverUrl" style="width: 60px; height: 80px; object-fit: cover; border-radius: 4px;" />
              <div class="flex flex-column justify-center">
                <span class="font-bold text-main">{{ selectedBook.title }}</span>
                <span class="text-subtle" style="font-size: 0.8125rem">{{ selectedBook.author }}</span>
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Ghi chú cho quản thư</label>
              <textarea v-model="requestNote" class="form-control" placeholder="Nhập lý do hoặc lời nhắn (tùy chọn)..." rows="3"></textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-outline" @click="showRequestModal = false">Hủy</button>
            <button type="submit" class="btn btn-primary">Gửi yêu cầu</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.book-grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-8);
}

.catalog-card {
  background: white;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.2s;
}

.catalog-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.catalog-card-cover {
  height: 200px;
  position: relative;
  background-color: var(--bg-app);
}

.catalog-card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-cover {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  color: var(--text-subtle);
}

.catalog-card-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  backdrop-filter: blur(8px);
}

.catalog-card-badge.available {
  background: rgba(16, 185, 129, 0.9);
  color: white;
}

.catalog-card-badge.unavailable {
  background: rgba(239, 68, 68, 0.9);
  color: white;
}

.catalog-card-body {
  padding: var(--space-5);
  flex: 1;
  display: flex;
  flex-direction: column;
}

.category-tag {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--space-2);
}

.book-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: var(--space-1);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.book-author {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-bottom: var(--space-4);
}

.stock-info {
  font-size: 0.8125rem;
  color: var(--text-subtle);
  font-weight: 500;
}

.font-bold { font-weight: 700; }
.flex-column { flex-direction: column; }
.justify-center { justify-content: center; }
.rounded { border-radius: var(--radius-md); }
</style>
