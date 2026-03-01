import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api, getToken } from '@/utils/api'

export interface Book {
  id: number
  title: string
  author: string
  category: string
  quantity: number
  available: number
}

export interface Member {
  id: number
  name: string
  email: string
  phone: string
  joinDate: string
  isBlacklisted: boolean
  blacklistUntil: string | null
  blacklistReason: string
  isCurrentlyBlacklisted?: boolean
}

export interface Rental {
  id: number
  bookId: number
  memberId: number
  borrowDate: string
  dueDate: string
  returnDate: string | null
  status: 'borrowed' | 'returned'
  bookTitle?: string
  bookAuthor?: string
  memberName?: string
  lateDays?: number
  lateFee?: number
}

export const DAILY_LATE_FEE = 5000
export const MAX_BORROW_MONTHS = 3

export interface Request {
  id: number
  bookId: number
  userId: number
  requestDate: string
  status: 'pending' | 'approved' | 'rejected'
  note: string
  bookTitle?: string
  bookAuthor?: string
  userName?: string
}

export interface ExtensionRequest {
  id: number
  rentalId: number
  userId: number
  requestDate: string
  requestedDueDate: string
  status: 'pending' | 'approved' | 'rejected'
  note: string
  reviewedDate: string | null
  bookTitle?: string
  currentDueDate?: string
  userName?: string
}

export type ReminderLevel = 'normal' | 'due_soon' | 'overdue'

export interface User {
  id: number
  username: string
  role: 'admin' | 'user'
  name: string
  memberId?: number
}

export interface Stats {
  totalBooks: number
  totalMembers: number
  currentlyBorrowed: number
  overdue: number
  pendingRequests: number
  pendingExtensions: number
  availableBooks: number
  blacklistedMembers: number
}

export const useLibraryStore = defineStore('library', () => {
  const books = ref<Book[]>([])
  const members = ref<Member[]>([])
  const rentals = ref<Rental[]>([])
  const requests = ref<Request[]>([])
  const extensionRequests = ref<ExtensionRequest[]>([])
  const currentUser = ref<User | null>(null)
  const toasts = ref<{ id: number; message: string; type: string }[]>([])
  const loading = ref(false)

  function getTodayDate(): string {
    return new Date().toISOString().split('T')[0] ?? ''
  }

  function getDaysToDue(rental: Rental): number {
    const today = getTodayDate()
    const diffMs = new Date(rental.dueDate).getTime() - new Date(today).getTime()
    return Math.floor(diffMs / (1000 * 60 * 60 * 24))
  }

  function getReminderLevel(rental: Rental): ReminderLevel {
    if (rental.status === 'returned') return 'normal'
    const diffDays = getDaysToDue(rental)
    if (diffDays < 0) return 'overdue'
    if (diffDays <= 3) return 'due_soon'
    return 'normal'
  }

  function getReminderText(rental: Rental): string {
    const reminder = getReminderLevel(rental)
    if (reminder === 'overdue') return 'Đã quá hạn trả sách'
    if (reminder === 'due_soon') return 'Sắp đến hạn trả (trong 3 ngày)'
    return 'Chưa đến hạn'
  }

  function getLateDays(rental: Rental): number {
    const endDate = rental.returnDate || getTodayDate()
    if (!endDate || endDate <= rental.dueDate) return 0
    const diffMs = new Date(endDate).getTime() - new Date(rental.dueDate).getTime()
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
  }

  function getLateFee(rental: Rental): number {
    return getLateDays(rental) * DAILY_LATE_FEE
  }

  const stats = computed<Stats>(() => {
    const today = getTodayDate()
    const borrowed = rentals.value.filter(r => r.status === 'borrowed')
    const overdue = borrowed.filter(r => r.dueDate < today)
    const pending = requests.value.filter(r => r.status === 'pending')
    const pendingExt = extensionRequests.value.filter(e => e.status === 'pending')

    return {
      totalBooks: books.value.reduce((sum, b) => sum + b.quantity, 0),
      totalMembers: members.value.length,
      currentlyBorrowed: borrowed.length,
      overdue: overdue.length,
      pendingRequests: pending.length,
      pendingExtensions: pendingExt.length,
      availableBooks: books.value.reduce((sum, b) => sum + b.available, 0),
      blacklistedMembers: members.value.filter(m => m.isCurrentlyBlacklisted).length,
    }
  })

  async function init(): Promise<void> {
    if (getToken()) {
      try {
        const { user } = await api.auth.me()
        currentUser.value = user as User
      } catch {
        api.auth.logout()
      }
    }
    await fetchBooks()
  }

  async function fetchBooks(): Promise<void> {
    try {
      books.value = (await api.books.getAll()) as Book[]
    } catch (e) {
      showToast((e as Error).message, 'error')
    }
  }

  async function fetchMembers(): Promise<void> {
    try {
      members.value = (await api.members.getAll()) as Member[]
    } catch (e) {
      showToast((e as Error).message, 'error')
    }
  }

  async function fetchRentals(): Promise<void> {
    try {
      rentals.value = (await api.rentals.getAll()) as Rental[]
    } catch (e) {
      showToast((e as Error).message, 'error')
    }
  }

  async function fetchMyRentals(): Promise<void> {
    try {
      rentals.value = (await api.rentals.getMy()) as Rental[]
    } catch (e) {
      showToast((e as Error).message, 'error')
    }
  }

  async function fetchRequests(): Promise<void> {
    try {
      requests.value = (await api.requests.getAll()) as Request[]
    } catch (e) {
      showToast((e as Error).message, 'error')
    }
  }

  async function fetchMyRequests(): Promise<void> {
    try {
      requests.value = (await api.requests.getMy()) as Request[]
    } catch (e) {
      showToast((e as Error).message, 'error')
    }
  }

  async function fetchExtensionRequests(): Promise<void> {
    try {
      extensionRequests.value = (await api.extensions.getAll()) as ExtensionRequest[]
    } catch (e) {
      showToast((e as Error).message, 'error')
    }
  }

  async function fetchMyExtensionRequests(): Promise<void> {
    try {
      extensionRequests.value = (await api.extensions.getMy()) as ExtensionRequest[]
    } catch (e) {
      showToast((e as Error).message, 'error')
    }
  }

  async function fetchStats(): Promise<Stats | null> {
    try {
      return (await api.stats.get()) as Stats
    } catch (e) {
      showToast((e as Error).message, 'error')
      return null
    }
  }

  async function login(username: string, password: string): Promise<User | null> {
    try {
      loading.value = true
      const { user } = await api.auth.login(username, password)
      currentUser.value = user as User
      showToast('Đăng nhập thành công', 'success')
      return currentUser.value
    } catch (e) {
      showToast((e as Error).message, 'error')
      return null
    } finally {
      loading.value = false
    }
  }

  function logout(): void {
    api.auth.logout()
    currentUser.value = null
  }

  async function register(userData: {
    username: string
    password: string
    name: string
    email?: string
    phone?: string
  }): Promise<User | null> {
    try {
      loading.value = true
      const { user } = await api.auth.register(userData)
      currentUser.value = user as User
      showToast('Đăng ký thành công', 'success')
      return currentUser.value
    } catch (e) {
      showToast((e as Error).message, 'error')
      return null
    } finally {
      loading.value = false
    }
  }

  async function addBook(book: Omit<Book, 'id'>): Promise<Book | null> {
    try {
      const newBook = (await api.books.create(book)) as Book
      books.value.push(newBook)
      showToast('Thêm sách thành công', 'success')
      return newBook
    } catch (e) {
      showToast((e as Error).message, 'error')
      return null
    }
  }

  async function updateBook(id: number, data: Partial<Book>): Promise<void> {
    try {
      const updated = (await api.books.update(id, data)) as Book
      const index = books.value.findIndex(b => b.id === id)
      if (index !== -1) books.value[index] = updated
      showToast('Cập nhật sách thành công', 'success')
    } catch (e) {
      showToast((e as Error).message, 'error')
    }
  }

  async function deleteBook(id: number): Promise<void> {
    try {
      await api.books.delete(id)
      books.value = books.value.filter(b => b.id !== id)
      showToast('Xóa sách thành công', 'success')
    } catch (e) {
      showToast((e as Error).message, 'error')
    }
  }

  function getBook(id: number): Book | undefined {
    return books.value.find(b => b.id === id)
  }

  async function addMember(
    member: Omit<Member, 'id' | 'joinDate' | 'isBlacklisted' | 'blacklistUntil' | 'blacklistReason'>
  ): Promise<Member | null> {
    try {
      const newMember = (await api.members.create(member)) as Member
      members.value.push(newMember)
      showToast('Thêm thành viên thành công', 'success')
      return newMember
    } catch (e) {
      showToast((e as Error).message, 'error')
      return null
    }
  }

  async function updateMember(id: number, data: Partial<Member>): Promise<void> {
    try {
      const updated = (await api.members.update(id, data)) as Member
      const index = members.value.findIndex(m => m.id === id)
      if (index !== -1) members.value[index] = updated
      showToast('Cập nhật thành viên thành công', 'success')
    } catch (e) {
      showToast((e as Error).message, 'error')
    }
  }

  async function deleteMember(id: number): Promise<void> {
    try {
      await api.members.delete(id)
      members.value = members.value.filter(m => m.id !== id)
      showToast('Xóa thành viên thành công', 'success')
    } catch (e) {
      showToast((e as Error).message, 'error')
    }
  }

  function getMember(id: number): Member | undefined {
    return members.value.find(m => m.id === id)
  }

  async function setMemberBlacklist(
    memberId: number,
    until: string,
    reason: string
  ): Promise<boolean> {
    try {
      await api.members.blacklist(memberId, until, reason)
      await fetchMembers()
      showToast('Đã đưa vào blacklist', 'success')
      return true
    } catch (e) {
      showToast((e as Error).message, 'error')
      return false
    }
  }

  async function clearMemberBlacklist(memberId: number): Promise<boolean> {
    try {
      await api.members.unblacklist(memberId)
      await fetchMembers()
      showToast('Đã xóa khỏi blacklist', 'success')
      return true
    } catch (e) {
      showToast((e as Error).message, 'error')
      return false
    }
  }

  async function addRental(
    bookId: number,
    memberId: number,
    dueDate?: string
  ): Promise<Rental | null> {
    try {
      const rental = (await api.rentals.create(bookId, memberId, dueDate)) as Rental
      await fetchRentals()
      await fetchBooks()
      showToast('Tạo phiếu mượn thành công', 'success')
      return rental
    } catch (e) {
      showToast((e as Error).message, 'error')
      return null
    }
  }

  async function returnBook(rentalId: number): Promise<number> {
    try {
      const result = (await api.rentals.return(rentalId)) as { lateFee: number }
      await fetchRentals()
      await fetchBooks()
      showToast('Trả sách thành công', 'success')
      return result.lateFee || 0
    } catch (e) {
      showToast((e as Error).message, 'error')
      return 0
    }
  }

  async function getRentalQR(rentalId: number): Promise<{
    rentalId: number
    amount: number
    description: string
    qrUrl: string
  } | null> {
    try {
      return await api.rentals.getQR(rentalId)
    } catch (e) {
      showToast((e as Error).message, 'error')
      return null
    }
  }

  async function addRequest(bookId: number, note: string = ''): Promise<Request | null> {
    try {
      const request = (await api.requests.create(bookId, note)) as Request
      showToast('Tạo yêu cầu mượn thành công', 'success')
      return request
    } catch (e) {
      showToast((e as Error).message, 'error')
      return null
    }
  }

  async function approveRequest(requestId: number): Promise<void> {
    try {
      await api.requests.approve(requestId)
      await fetchRequests()
      await fetchBooks()
      showToast('Đã duyệt yêu cầu', 'success')
    } catch (e) {
      showToast((e as Error).message, 'error')
    }
  }

  async function rejectRequest(requestId: number): Promise<void> {
    try {
      await api.requests.reject(requestId)
      await fetchRequests()
      showToast('Đã từ chối yêu cầu', 'success')
    } catch (e) {
      showToast((e as Error).message, 'error')
    }
  }

  async function addExtensionRequest(
    rentalId: number,
    requestedDueDate: string,
    note: string = ''
  ): Promise<ExtensionRequest | null> {
    try {
      const ext = (await api.extensions.create(
        rentalId,
        requestedDueDate,
        note
      )) as ExtensionRequest
      showToast('Tạo yêu cầu gia hạn thành công', 'success')
      return ext
    } catch (e) {
      showToast((e as Error).message, 'error')
      return null
    }
  }

  async function approveExtensionRequest(extensionRequestId: number): Promise<boolean> {
    try {
      await api.extensions.approve(extensionRequestId)
      await fetchExtensionRequests()
      await fetchRentals()
      showToast('Đã duyệt gia hạn', 'success')
      return true
    } catch (e) {
      showToast((e as Error).message, 'error')
      return false
    }
  }

  async function rejectExtensionRequest(extensionRequestId: number): Promise<boolean> {
    try {
      await api.extensions.reject(extensionRequestId)
      await fetchExtensionRequests()
      showToast('Đã từ chối gia hạn', 'success')
      return true
    } catch (e) {
      showToast((e as Error).message, 'error')
      return false
    }
  }

  function showToast(message: string, type: string = 'success'): void {
    const id = Date.now()
    toasts.value.push({ id, message, type })
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, 3000)
  }

  return {
    books,
    members,
    rentals,
    requests,
    extensionRequests,
    currentUser,
    toasts,
    loading,
    stats,
    init,
    fetchBooks,
    fetchMembers,
    fetchRentals,
    fetchMyRentals,
    fetchRequests,
    fetchMyRequests,
    fetchExtensionRequests,
    fetchMyExtensionRequests,
    fetchStats,
    login,
    logout,
    register,
    addBook,
    updateBook,
    deleteBook,
    getBook,
    addMember,
    updateMember,
    deleteMember,
    getMember,
    setMemberBlacklist,
    clearMemberBlacklist,
    addRental,
    returnBook,
    getDaysToDue,
    getReminderLevel,
    getReminderText,
    addRequest,
    approveRequest,
    rejectRequest,
    addExtensionRequest,
    approveExtensionRequest,
    rejectExtensionRequest,
    getRentalQR,
    getLateDays,
    getLateFee,
    showToast,
  }
})
