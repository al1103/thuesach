<script setup lang="ts">
/**
 * @component MembersView
 * @description Admin member management with professional SaaS aesthetics.
 */
import { computed, onMounted, ref } from 'vue'
import { useLibraryStore, type Member } from '@/stores/library'
import { exportToExcel, exportToPdf, type ExportColumn } from '@/utils/export'

defineOptions({
  name: 'MembersView',
})

const store = useLibraryStore()

onMounted(async () => {
  await store.fetchMembers()
  await store.fetchRentals() // Needed for "Đang mượn" count
})
const searchQuery = ref<string>('')
const showModal = ref<boolean>(false)
const editingMember = ref<Member | null>(null)

const formData = ref({
  name: '',
  email: '',
  phone: '',
})

const showBlacklistModal = ref<boolean>(false)
const blacklistData = ref({
  until: '',
  reason: '',
})
const memberForBlacklist = ref<Member | null>(null)

const filteredMembers = computed<Member[]>(() => {
  const query = searchQuery.value.toLowerCase()
  if (!query) return store.members
  return store.members.filter(
    member =>
      member.name.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query) ||
      member.phone.includes(query),
  )
})

const memberExportColumns: ExportColumn<Member>[] = [
  { header: 'ID', value: member => member.id },
  { header: 'Họ tên', value: member => member.name },
  { header: 'Email', value: member => member.email || '-' },
  { header: 'Điện thoại', value: member => member.phone || '-' },
  { header: 'Ngày tham gia', value: member => member.joinDate },
]

function openAddModal(): void {
  editingMember.value = null
  formData.value = { name: '', email: '', phone: '' }
  showModal.value = true
}

function openEditModal(member: Member): void {
  editingMember.value = member
  formData.value = {
    name: member.name,
    email: member.email,
    phone: member.phone,
  }
  showModal.value = true
}

async function handleSubmit(): Promise<void> {
  if (editingMember.value) {
    await store.updateMember(editingMember.value.id, formData.value)
  } else {
    await store.addMember(formData.value)
  }
  showModal.value = false
}

async function handleDelete(member: Member): Promise<void> {
  if (confirm(`Bạn có chắc muốn xóa "${member.name}"?`)) {
    await store.deleteMember(member.id)
  }
}

function getMemberRentals(memberId: number): number {
  return store.rentals.filter(rental => rental.memberId === memberId && rental.status === 'borrowed').length
}

function handleBlacklist(member: Member): void {
  memberForBlacklist.value = member
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  blacklistData.value = {
    until: nextWeek.toISOString().split('T')[0],
    reason: 'Quá hạn trả sách nhiều lần',
  }
  showBlacklistModal.value = true
}

async function submitBlacklist(): Promise<void> {
  if (!memberForBlacklist.value) return
  const { until, reason } = blacklistData.value
  const success = await store.setMemberBlacklist(memberForBlacklist.value.id, until, reason)
  if (success) {
    showBlacklistModal.value = false
    memberForBlacklist.value = null
  }
}

async function handleClearBlacklist(member: Member): Promise<void> {
  await store.clearMemberBlacklist(member.id)
}

function handleExportExcel(): void {
  if (!filteredMembers.value.length) {
    store.showToast('Không có dữ liệu để xuất', 'error')
    return
  }
  exportToExcel(filteredMembers.value, memberExportColumns, 'Members', 'danh-sach-thanh-vien')
  store.showToast('Đã xuất Excel')
}
</script>

<template>
  <div class="members-view">
    <!-- Header Actions -->
    <div class="flex justify-between items-center mb-6">
      <div class="search-bar">
        <i class="bi bi-search"></i>
        <input v-model="searchQuery" type="text" placeholder="Tìm kiếm tên, email, SĐT..." style="width: 320px;" />
      </div>
      
      <div class="action-buttons">
        <button class="btn btn-outline" @click="handleExportExcel">
          <i class="bi bi-download"></i> Xuất Excel
        </button>
        <button class="btn btn-primary" @click="openAddModal">
          <i class="bi bi-plus-lg"></i> Thêm thành viên
        </button>
      </div>
    </div>

    <!-- Members Table -->
    <div class="card">
      <div class="table-container">
        <table v-if="filteredMembers.length">
          <thead>
            <tr>
              <th>Thành viên</th>
              <th>Liên hệ</th>
              <th>Ngày tham gia</th>
              <th>Đang mượn</th>
              <th>Trạng thái</th>
              <th class="text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="member in filteredMembers" :key="member.id">
              <td>
                <div class="flex items-center gap-2">
                  <div class="avatar" style="width: 36px; height: 36px;">{{ member.name ? member.name.charAt(0) : '?' }}</div>
                  <span class="font-bold text-main">{{ member.name || 'N/A' }}</span>
                </div>
              </td>
              <td>
                <div class="flex flex-column">
                  <span class="text-main" style="font-size: 0.875rem">{{ member.email || '—' }}</span>
                  <span class="text-subtle" style="font-size: 0.75rem">{{ member.phone || '—' }}</span>
                </div>
              </td>
              <td class="text-subtle">{{ member.joinDate }}</td>
              <td>
                <span class="badge" :class="getMemberRentals(member.id) > 0 ? 'badge-warning' : 'badge-info'">
                  {{ getMemberRentals(member.id) }} cuốn
                </span>
              </td>
              <td>
                <span v-if="store.isMemberBlacklisted(member.id)" class="badge badge-danger">
                  Bị khóa đến {{ member.blacklistUntil }}
                </span>
                <span v-else class="badge badge-success">Hoạt động</span>
              </td>
              <td class="text-right">
                <div class="flex gap-1 justify-end">
                  <button class="btn btn-ghost btn-sm" @click="openEditModal(member)" title="Sửa">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button 
                    v-if="!store.isMemberBlacklisted(member.id)"
                    class="btn btn-ghost btn-sm text-danger" 
                    @click="handleBlacklist(member)" 
                    title="Khóa thành viên"
                  >
                    <i class="bi bi-slash-circle"></i>
                  </button>
                  <button 
                    v-else
                    class="btn btn-ghost btn-sm text-success" 
                    @click="handleClearBlacklist(member)" 
                    title="Mở khóa"
                  >
                    <i class="bi bi-check-circle"></i>
                  </button>
                  <button class="btn btn-ghost btn-sm text-danger" @click="handleDelete(member)" title="Xóa">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div v-else class="empty-state">
          <i class="bi bi-people empty-icon"></i>
          <h3 class="empty-title">Không tìm thấy thành viên</h3>
          <p class="empty-text">Hãy thử tìm kiếm theo tên khác hoặc thêm thành viên mới.</p>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="card-title">{{ editingMember ? 'Cập nhật thành viên' : 'Thêm thành viên mới' }}</h3>
          <button class="btn btn-ghost btn-sm" @click="showModal = false">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <form @submit.prevent="handleSubmit">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Họ và tên</label>
              <input v-model="formData.name" class="form-control" placeholder="Nhập tên đầy đủ" required />
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input v-model="formData.email" type="email" class="form-control" placeholder="example@gmail.com" />
            </div>
            <div class="form-group">
              <label class="form-label">Số điện thoại</label>
              <input v-model="formData.phone" class="form-control" placeholder="0xxx xxx xxx" />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline" @click="showModal = false">Hủy</button>
            <button type="submit" class="btn btn-primary">{{ editingMember ? 'Lưu thay đổi' : 'Thêm mới' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Blacklist Modal -->
    <div v-if="showBlacklistModal" class="modal-overlay" @click.self="showBlacklistModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="card-title">Khóa thành viên</h3>
          <button class="btn btn-ghost btn-sm" @click="showBlacklistModal = false">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <form @submit.prevent="submitBlacklist">
          <div class="modal-body">
            <p class="mb-4 text-subtle">Thành viên <strong>{{ memberForBlacklist?.name }}</strong> sẽ không thể mượn sách mới trong thời gian bị khóa.</p>
            <div class="form-group">
              <label class="form-label">Khóa đến ngày</label>
              <input v-model="blacklistData.until" type="date" class="form-control" required />
            </div>
            <div class="form-group">
              <label class="form-label">Lý do khóa</label>
              <textarea v-model="blacklistData.reason" class="form-control" rows="3" placeholder="Nhập lý do khóa..." required></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline" @click="showBlacklistModal = false">Hủy</button>
            <button type="submit" class="btn btn-danger">Xác nhận khóa</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.text-right { text-align: right; }
.text-danger { color: var(--danger) !important; }
.text-success { color: var(--success) !important; }
.font-bold { font-weight: 700; }
.flex-column { flex-direction: column; }
</style>
