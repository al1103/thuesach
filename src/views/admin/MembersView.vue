<script setup lang="ts">
/**
 * @component MembersView
 * @description Admin member management with blacklist controls.
 */
import { computed, ref } from 'vue'
import { useLibraryStore, type Member } from '@/stores/library'
import { exportToExcel, exportToPdf, type ExportColumn } from '@/utils/export'

defineOptions({
  name: 'MembersView',
})

const store = useLibraryStore()

const searchQuery = ref<string>('')
const showModal = ref<boolean>(false)
const editingMember = ref<Member | null>(null)

const formData = ref({
  name: '',
  email: '',
  phone: '',
})

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
  { header: 'Blacklist', value: member => (store.isMemberBlacklisted(member.id) ? 'Đang khóa' : 'Bình thường') },
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

function handleSubmit(): void {
  if (editingMember.value) {
    store.updateMember(editingMember.value.id, formData.value)
    store.showToast('Cập nhật thành viên thành công')
  } else {
    store.addMember(formData.value)
    store.showToast('Thêm thành viên thành công')
  }
  showModal.value = false
}

function handleDelete(member: Member): void {
  if (confirm(`Bạn có chắc muốn xóa "${member.name}"?`)) {
    store.deleteMember(member.id)
    store.showToast('Đã xóa thành viên', 'error')
  }
}

function getMemberRentals(memberId: number): number {
  return store.rentals.filter(rental => rental.memberId === memberId && rental.status === 'borrowed').length
}

function handleBlacklist(member: Member): void {
  const defaultUntil = addDays(new Date().toISOString().split('T')[0] ?? '', 7)
  const until = window.prompt('Khóa đến ngày (YYYY-MM-DD)', defaultUntil)
  if (!until) return
  const reason = window.prompt('Lý do blacklist', 'Quá hạn nhiều lần') || 'Quá hạn nhiều lần'
  const success = store.setMemberBlacklist(member.id, until, reason)
  if (!success) {
    store.showToast('Không thể blacklist thành viên', 'error')
    return
  }
  store.showToast('Đã blacklist thành viên', 'warning')
}

function handleClearBlacklist(member: Member): void {
  const success = store.clearMemberBlacklist(member.id)
  if (!success) {
    store.showToast('Không thể gỡ blacklist', 'error')
    return
  }
  store.showToast('Đã gỡ blacklist')
}

function handleExportExcel(): void {
  if (!filteredMembers.value.length) {
    store.showToast('Không có dữ liệu để xuất', 'error')
    return
  }
  exportToExcel(filteredMembers.value, memberExportColumns, 'Members', 'danh-sach-thanh-vien')
  store.showToast('Đã xuất Excel danh sách thành viên')
}

function handleExportPdf(): void {
  if (!filteredMembers.value.length) {
    store.showToast('Không có dữ liệu để xuất', 'error')
    return
  }
  exportToPdf(filteredMembers.value, memberExportColumns, 'Danh sách thành viên', 'danh-sach-thanh-vien')
  store.showToast('Đã xuất PDF danh sách thành viên')
}

function addDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(value => Number(value))
  const result = new Date(Date.UTC(year || 0, (month || 1) - 1, day || 1))
  result.setUTCDate(result.getUTCDate() + days)
  const y = result.getUTCFullYear()
  const m = `${result.getUTCMonth() + 1}`.padStart(2, '0')
  const d = `${result.getUTCDate()}`.padStart(2, '0')
  return `${y}-${m}-${d}`
}
</script>

<template>
  <div class="members-view">
    <div class="search-box">
      <input v-model="searchQuery" type="text" class="search-input" placeholder="🔍 Tìm kiếm thành viên..." />
      <div class="action-buttons">
        <button class="btn btn-secondary" @click="handleExportExcel">
          <i class="bi bi-file-earmark-excel"></i>
          Excel
        </button>
        <button class="btn btn-secondary" @click="handleExportPdf">
          <i class="bi bi-file-earmark-pdf"></i>
          PDF
        </button>
        <button class="btn btn-primary" @click="openAddModal">➕ Thêm thành viên</button>
      </div>
    </div>

    <div class="card">
      <div class="table-container">
        <table v-if="filteredMembers.length" class="table table-hover align-middle">
          <thead>
            <tr>
              <th>Thành viên</th>
              <th>Email</th>
              <th>Điện thoại</th>
              <th>Ngày tham gia</th>
              <th>Đang mượn</th>
              <th>Blacklist</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="member in filteredMembers" :key="member.id">
              <td>
                <div class="member-cell">
                  <div class="member-avatar">{{ member.name.charAt(0) }}</div>
                  <div class="member-info">
                    <div class="name">{{ member.name }}</div>
                  </div>
                </div>
              </td>
              <td>{{ member.email || '—' }}</td>
              <td>{{ member.phone || '—' }}</td>
              <td>{{ member.joinDate }}</td>
              <td>
                <span class="badge" :class="getMemberRentals(member.id) > 0 ? 'badge-warning' : 'badge-success'">
                  {{ getMemberRentals(member.id) }} cuốn
                </span>
              </td>
              <td>
                <span class="badge" :class="store.isMemberBlacklisted(member.id) ? 'badge-danger' : 'badge-success'">
                  {{ store.isMemberBlacklisted(member.id) ? `Khóa tới ${member.blacklistUntil || ''}` : 'Bình thường' }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button class="btn-icon" title="Sửa" @click="openEditModal(member)">✏️</button>
                  <button class="btn-icon" title="Xóa" @click="handleDelete(member)">🗑️</button>
                  <button
                    v-if="!store.isMemberBlacklisted(member.id)"
                    class="btn btn-sm btn-danger"
                    @click="handleBlacklist(member)"
                  >
                    Blacklist
                  </button>
                  <button
                    v-else
                    class="btn btn-sm btn-success"
                    @click="handleClearBlacklist(member)"
                  >
                    Gỡ khóa
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">
          <div class="icon">👥</div>
          <p>Không tìm thấy thành viên nào</p>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ editingMember ? 'Sửa thành viên' : 'Thêm thành viên mới' }}</h3>
          <button class="modal-close" @click="showModal = false">&times;</button>
        </div>
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>Họ và tên</label>
            <input v-model="formData.name" type="text" placeholder="Nhập họ tên" required />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input v-model="formData.email" type="email" placeholder="Nhập email" />
          </div>
          <div class="form-group">
            <label>Số điện thoại</label>
            <input v-model="formData.phone" type="tel" placeholder="Nhập số điện thoại" />
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%">
            {{ editingMember ? 'Cập nhật' : 'Thêm thành viên' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
