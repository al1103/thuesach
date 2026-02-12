<script setup lang="ts">
/**
 * @component AIAssistantView
 * @description AI chat assistant for borrow purpose-based book recommendations.
 */
import { computed, ref } from 'vue'
import { useLibraryStore, type Book } from '@/stores/library'
import { getBorrowAssistantResponse, type BookRecommendation } from '@/utils/aiBorrowAssistant'

defineOptions({
  name: 'AIAssistantView',
})

type MessageRole = 'assistant' | 'user'

interface ChatMessage {
  id: number
  role: MessageRole
  content: string
  recommendations?: BookRecommendation[]
}

const store = useLibraryStore()
const message = ref<string>('')
const messages = ref<ChatMessage[]>([
  {
    id: 1,
    role: 'assistant',
    content:
      'Chào bạn, mình là AI hỗ trợ mượn sách. Hãy nói mục đích mượn, mình sẽ gợi ý sách phù hợp nhất.',
  },
])

const quickPrompts = [
  'Mình cần sách để cải thiện kỹ năng giao tiếp',
  'Gợi ý sách đọc thư giãn cuối tuần',
  'Mình muốn mượn sách phục vụ học tập',
]

const currentMember = computed(() => {
  if (!store.currentUser?.memberId) return null
  return store.getMember(store.currentUser.memberId)
})

const isBlocked = computed(() => {
  if (!currentMember.value) return false
  return store.isMemberBlacklisted(currentMember.value.id)
})

function submitPrompt(): void {
  const content = message.value.trim()
  if (!content) return

  messages.value.push({
    id: Date.now(),
    role: 'user',
    content,
  })

  const response = getBorrowAssistantResponse(content, store.books)
  messages.value.push({
    id: Date.now() + 1,
    role: 'assistant',
    content: response.answer,
    recommendations: response.recommendations,
  })
  message.value = ''
}

function applyQuickPrompt(prompt: string): void {
  message.value = prompt
  submitPrompt()
}

function hasPendingRequest(bookId: number): boolean {
  return store.requests.some(
    request => request.bookId === bookId && request.userId === store.currentUser?.id && request.status === 'pending',
  )
}

function requestBook(bookId: number, title: string): void {
  if (isBlocked.value) {
    store.showToast('Tài khoản đang bị khóa mượn sách', 'error')
    return
  }
  if (hasPendingRequest(bookId)) {
    store.showToast('Sách này đang có yêu cầu chờ duyệt', 'warning')
    return
  }
  const result = store.addRequest(bookId, 'Yêu cầu từ AI Assistant')
  if (!result) {
    store.showToast('Không thể gửi yêu cầu mượn', 'error')
    return
  }
  store.showToast(`Đã gửi yêu cầu mượn "${title}"`)
}

function getBookById(bookId: number): Book | undefined {
  return store.getBook(bookId)
}
</script>

<template>
  <div class="ai-assistant">
    <div class="card intro-card">
      <h3>🤖 AI Tư Vấn Mượn Sách</h3>
      <p class="text-muted">Nói mục đích mượn sách để nhận gợi ý phù hợp nhất theo nhu cầu.</p>
      <div v-if="isBlocked && currentMember" class="badge badge-danger">
        Tài khoản đang blacklist tới {{ currentMember.blacklistUntil || 'không thời hạn' }}
      </div>
    </div>

    <div class="quick-prompts">
      <button
        v-for="prompt in quickPrompts"
        :key="prompt"
        class="btn btn-secondary btn-sm"
        @click="applyQuickPrompt(prompt)"
      >
        {{ prompt }}
      </button>
    </div>

    <div class="card chat-card">
      <div class="chat-log">
        <div v-for="item in messages" :key="item.id" class="chat-row" :class="item.role">
          <div class="bubble">
            <p>{{ item.content }}</p>
            <div v-if="item.recommendations?.length" class="recommendations">
              <div v-for="book in item.recommendations" :key="book.id" class="recommend-card">
                <div>
                  <strong>{{ book.title }}</strong>
                  <div class="text-muted">{{ book.author }} • {{ book.category }}</div>
                  <div class="text-muted">{{ book.reason }}</div>
                </div>
                <div class="recommend-actions">
                  <span class="badge badge-info">
                    Còn {{ getBookById(book.id)?.available || 0 }} cuốn
                  </span>
                  <button
                    class="btn btn-primary btn-sm"
                    :disabled="hasPendingRequest(book.id) || isBlocked"
                    @click="requestBook(book.id, book.title)"
                  >
                    {{ hasPendingRequest(book.id) ? 'Đang chờ duyệt' : 'Yêu cầu mượn' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <form class="chat-input" @submit.prevent="submitPrompt">
        <input
          v-model="message"
          type="text"
          class="search-input"
          placeholder="Ví dụ: Mình muốn mượn sách để học kỹ năng thuyết trình..."
        />
        <button type="submit" class="btn btn-primary">Gửi</button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.ai-assistant {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.intro-card h3 {
  margin-bottom: 6px;
}

.quick-prompts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chat-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  min-height: 520px;
}

.chat-log {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 520px;
  overflow-y: auto;
  padding-right: 4px;
}

.chat-row {
  display: flex;
}

.chat-row.user {
  justify-content: flex-end;
}

.chat-row.assistant {
  justify-content: flex-start;
}

.bubble {
  max-width: 86%;
  border-radius: 14px;
  padding: 12px;
  border: 1px solid var(--border);
  background: var(--bg-surface);
}

.chat-row.user .bubble {
  background: var(--brand-50);
  border-color: var(--brand-100);
}

.recommendations {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recommend-card {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px;
  background: var(--bg-surface-soft);
}

.recommend-actions {
  margin-top: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.chat-input {
  display: flex;
  gap: 10px;
}

@media (max-width: 768px) {
  .bubble {
    max-width: 100%;
  }

  .recommend-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .chat-input {
    flex-direction: column;
  }
}
</style>
