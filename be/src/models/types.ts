export interface Book {
  id: number
  title: string
  author: string
  category: string
  quantity: number
  available: number
  coverUrl?: string
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
}

export interface Rental {
  id: number
  bookId: number
  memberId: number
  borrowDate: string
  dueDate: string
  returnDate: string | null
  status: 'borrowed' | 'returned'
}

export interface Request {
  id: number
  bookId: number
  userId: number
  requestDate: string
  status: 'pending' | 'approved' | 'rejected'
  note: string
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
}

export interface User {
  id: number
  username: string
  password: string
  role: 'admin' | 'user'
  name: string
  memberId?: number
}

export interface JwtPayload {
  userId: number
  role: 'admin' | 'user'
}

export const DAILY_LATE_FEE = 5000
export const MAX_BORROW_MONTHS = 3
