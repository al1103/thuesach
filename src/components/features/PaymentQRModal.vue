<script setup lang="ts">
/**
 * @component PaymentQRModal
 * @description Modal to display VietQR for fine payment.
 */
import { ref, onMounted } from 'vue'
import { useLibraryStore } from '@/stores/library'

interface Props {
  rentalId: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'close'): void
}>()

const store = useLibraryStore()
const qrData = ref<{
  rentalId: number
  amount: number
  description: string
  qrUrl: string
} | null>(null)
const loading = ref(true)

onMounted(async () => {
  qrData.value = await store.getRentalQR(props.rentalId)
  loading.value = false
})

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount)
}
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal payment-modal">
      <div class="modal-header">
        <h3>Thanh toán tiền phạt</h3>
        <button class="modal-close" @click="emit('close')">&times;</button>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Đang tải mã QR...</p>
      </div>

      <div v-else-if="qrData" class="payment-content">
        <div class="qr-container">
          <img :src="qrData.qrUrl" alt="VietQR Payment" class="qr-image" />
        </div>

        <div class="payment-details">
          <div class="detail-row">
            <span>Số tiền:</span>
            <strong>{{ formatCurrency(qrData.amount) }}</strong>
          </div>
          <div class="detail-row">
            <span>Nội dung:</span>
            <code class="description">{{ qrData.description }}</code>
          </div>
        </div>

        <div class="alert alert-info">
          <p><strong>Lưu ý:</strong> Sau khi chuyển khoản thành công, vui lòng chụp màn hình và liên hệ với thủ thư để xác nhận.</p>
        </div>

        <button class="btn btn-primary full-width" @click="emit('close')">Đã hiểu</button>
      </div>

      <div v-else class="error-state">
        <p>Không thể tải thông tin thanh toán. Vui lòng thử lại sau.</p>
        <button class="btn btn-secondary" @click="emit('close')">Đóng</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.payment-modal {
  max-width: 450px;
}

.payment-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  text-align: center;
}

.qr-container {
  background: white;
  padding: var(--space-md);
  border-radius: var(--radius-lg);
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: var(--shadow-sm);
}

.qr-image {
  max-width: 300px;
  width: 100%;
  height: auto;
}

.payment-details {
  text-align: left;
  background: var(--bg-surface-soft);
  padding: var(--space-md);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--space-xs);
}

.description {
  display: block;
  font-size: 0.8rem;
  padding: 4px 8px;
  background: #f1f5f9;
  border-radius: var(--radius-sm);
  margin-top: 4px;
}

.loading-state, .error-state {
  padding: var(--space-lg);
  text-align: center;
}

.full-width {
  width: 100%;
}

.alert {
  text-align: left;
  font-size: 0.875rem;
}
</style>
