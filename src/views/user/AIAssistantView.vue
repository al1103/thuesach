<script setup lang="ts">
/**
 * @component AIAssistantView
 * @description User AI assistant view for book recommendations and library help.
 */
import { ref, onMounted, nextTick } from 'vue'
import { useLibraryStore } from '@/stores/library'

defineOptions({
  name: 'AIAssistantView',
})

const store = useLibraryStore()
const userInput = ref('')
const chatContainer = ref<HTMLElement | null>(null)
const messages = ref<{ role: 'user' | 'ai'; content: string }[]>([
  { role: 'ai', content: 'Chào bạn! Tôi là trợ lý AI của thư viện. Tôi có thể giúp bạn tìm sách, gợi ý các tựa sách hay hoặc trả lời các câu hỏi về quy định mượn trả. Bạn muốn tìm hiểu gì hôm nay?' }
])

const isTyping = ref(false)

onMounted(async () => {
  await store.fetchBooks()
})

const scrollToBottom = async () => {
  await nextTick()
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

const sendMessage = async () => {
  if (!userInput.value.trim() || isTyping.value) return

  const userMsg = userInput.value.trim()
  messages.value.push({ role: 'user', content: userMsg })
  userInput.value = ''
  isTyping.value = true
  
  await scrollToBottom()

  try {
    // Basic AI logic for now - can be expanded to call actual AI API
    setTimeout(async () => {
      let aiResponse = ''
      const lowerMsg = userMsg.toLowerCase()

      if (lowerMsg.includes('gợi ý') || lowerMsg.includes('tìm sách') || lowerMsg.includes('hay')) {
        const randomBooks = [...store.books].sort(() => 0.5 - Math.random()).slice(0, 2)
        if (randomBooks.length > 0) {
          aiResponse = `Tôi gợi ý cho bạn 2 cuốn sách này: "${randomBooks[0].title}" của ${randomBooks[0].author} và "${randomBooks[1].title}" của ${randomBooks[1].author}. Bạn thấy sao?`
        } else {
          aiResponse = 'Hiện tại thư viện đang cập nhật danh mục, bạn quay lại sau nhé!'
        }
      } else if (lowerMsg.includes('quy định') || lowerMsg.includes('hạn')) {
        aiResponse = 'Quy định của thư viện là mượn tối đa 3 tháng. Nếu quá hạn sẽ bị phạt 5.000đ/ngày bạn nhé.'
      } else {
        aiResponse = 'Cảm ơn bạn đã chia sẻ. Tôi có thể giúp bạn tìm sách theo thể loại hoặc tác giả mà bạn yêu thích đấy!'
      }

      messages.value.push({ role: 'ai', content: aiResponse })
      isTyping.value = false
      await scrollToBottom()
    }, 1000)
  } catch (error) {
    messages.value.push({ role: 'ai', content: 'Xin lỗi, tôi đang gặp một chút trục trặc kỹ thuật. Thử lại sau nhé!' })
    isTyping.value = false
    await scrollToBottom()
  }
}
</script>

<template>
  <div class="ai-assistant-view">
    <div class="chat-wrapper card">
      <div class="chat-header">
        <div class="flex items-center gap-3">
          <div class="ai-avatar">
            <i class="bi bi-robot"></i>
          </div>
          <div>
            <h3 class="card-title mb-0">Trợ lý Thư viện AI</h3>
            <span class="text-success" style="font-size: 0.75rem">● Đang trực tuyến</span>
          </div>
        </div>
      </div>

      <div ref="chatContainer" class="chat-body">
        <div v-for="(msg, index) in messages" :key="index" class="message-row" :class="msg.role">
          <div class="message-bubble">
            {{ msg.content }}
          </div>
        </div>
        <div v-if="isTyping" class="message-row ai">
          <div class="message-bubble typing">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
        </div>
      </div>

      <div class="chat-footer">
        <form @submit.prevent="sendMessage" class="flex gap-2">
          <input 
            v-model="userInput" 
            type="text" 
            class="form-control" 
            placeholder="Hỏi AI về sách, quy định..." 
            :disabled="isTyping"
          />
          <button type="submit" class="btn btn-primary" :disabled="!userInput.trim() || isTyping">
            <i class="bi bi-send"></i>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ai-assistant-view {
  height: calc(100vh - 160px);
  max-width: 900px;
  margin: 0 auto;
}

.chat-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0 !important;
  overflow: hidden;
}

.chat-header {
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--border-light);
  background: white;
}

.ai-avatar {
  width: 40px;
  height: 40px;
  background: var(--primary-light);
  color: var(--primary);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.chat-body {
  flex: 1;
  padding: var(--space-6);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  background-color: var(--bg-app);
}

.message-row {
  display: flex;
  width: 100%;
}

.message-row.ai { justify-content: flex-start; }
.message-row.user { justify-content: flex-end; }

.message-bubble {
  max-width: 80%;
  padding: 12px 16px;
  border-radius: var(--radius-lg);
  font-size: 0.9375rem;
  line-height: 1.5;
}

.ai .message-bubble {
  background: white;
  color: var(--text-main);
  border: 1px solid var(--border-light);
  border-bottom-left-radius: 4px;
}

.user .message-bubble {
  background: var(--primary);
  color: white;
  border-bottom-right-radius: 4px;
}

.chat-footer {
  padding: var(--space-4) var(--space-6);
  background: white;
  border-top: 1px solid var(--border-light);
}

.mb-0 { margin-bottom: 0 !important; }

/* Typing animation */
.typing {
  display: flex;
  gap: 4px;
  padding: 12px 20px;
}
.dot {
  width: 6px;
  height: 6px;
  background: var(--text-subtle);
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out;
}
.dot:nth-child(1) { animation-delay: -0.32s; }
.dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1.0); }
}
</style>
