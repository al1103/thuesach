<script setup lang="ts">
/**
 * @component CatalogView
 * @description User catalog view to browse books and create borrow requests.
 */
import { computed, ref } from 'vue'
import { useLibraryStore } from '@/stores/library'

defineOptions({
  name: 'CatalogView',
})

const store = useLibraryStore()

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
  if (!store.currentUser?.memberId) return null
  return store.getMember(store.currentUser.memberId)
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

function handleRequest(): void {
  if (!selectedBookId.value) return
  const result = store.addRequest(selectedBookId.value, requestNote.value)
  if (!result) {
    store.showToast('Không thể gửi yêu cầu mượn', 'error')
    return
  }
  store.showToast('Đã gửi yêu cầu mượn sách')
  showRequestModal.value = false
}
</script>

<template>
  <div class="catalog-view">
    <div v-if="isBlocked && currentMember" class="card" style="margin-bottom: 12px">
      <strong>⚠️ Tài khoản đang bị blacklist</strong>
      <p class="text-muted" style="margin-top: 6px">
        Bạn bị khóa mượn đến {{ currentMember.blacklistUntil || 'không thời hạn' }}.
        {{ currentMember.blacklistReason || '' }}
      </p>
    </div>

    <div class="search-box">
      <input
        v-model="searchQuery"
        type="text"
        class="search-input"
        placeholder="🔍 Tìm kiếm sách theo tên, tác giả, thể loại..."
      />
    </div>

    <div class="book-grid">
      <div v-for="book in filteredBooks" :key="book.id" class="book-card">
        <div class="book-cover">📖</div>
        <div class="book-info">
          <h4>{{ book.title }}</h4>
          <p>{{ book.author }}</p>
          <p>{{ book.category }}</p>
          <div class="book-availability" :class="book.available > 0 ? 'available' : 'unavailable'">
            {{ book.available > 0 ? `Còn ${book.available} cuốn` : 'Hết sách' }}
          </div>
          <button
            v-if="book.available > 0 && !hasExistingRequest(book.id)"
            class="btn btn-primary btn-sm"
            style="width: 100%; margin-top: 12px"
            :disabled="isBlocked"
            @click="openRequestModal(book.id)"
          >
            📨 Yêu cầu mượn
          </button>
          <button
            v-else-if="hasExistingRequest(book.id)"
            class="btn btn-secondary btn-sm"
            style="width: 100%; margin-top: 12px"
            disabled
          >
            ⏳ Đang chờ duyệt
          </button>
        </div>
      </div>
    </div>

    <div v-if="!filteredBooks.length" class="empty-state">
      <div class="icon">📚</div>
      <p>Không tìm thấy sách nào</p>
    </div>

    <div v-if="showRequestModal" class="modal-overlay" @click.self="showRequestModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>Yêu cầu mượn sách</h3>
          <button class="modal-close" @click="showRequestModal = false">&times;</button>
        </div>
        <div v-if="selectedBook" class="request-book-info">
          <p><strong>Sách:</strong> {{ selectedBook.title }}</p>
          <p><strong>Tác giả:</strong> {{ selectedBook.author }}</p>
        </div>
        <form @submit.prevent="handleRequest">
          <div class="form-group">
            <label>Ghi chú (tùy chọn)</label>
            <textarea v-model="requestNote" placeholder="Nhập lý do mượn sách..." rows="3"></textarea>
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%">Gửi yêu cầu</button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.request-book-info {
  padding: var(--space-md);
  background: var(--bg-surface-soft);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-lg);
  border: 1px solid var(--border);
}

.request-book-info p {
  font-size: 0.875rem;
  margin-bottom: var(--space-xs);
}
</style>
