import fs from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'
import { Book, Member, Rental, Request, ExtensionRequest, User } from '../models/types'

interface Database {
  books: Book[]
  members: Member[]
  rentals: Rental[]
  requests: Request[]
  extensionRequests: ExtensionRequest[]
  users: User[]
}

const dbPath = path.join(__dirname, '../../data/database.json')

function ensureDataDir(): void {
  const dataDir = path.dirname(dbPath)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

function getDefaultData(): Database {
  const hashedAdmin = bcrypt.hashSync('admin123', 10)
  const hashedUser = bcrypt.hashSync('user123', 10)

  return {
    books: [
      {
        id: 1,
        title: 'Đắc Nhân Tâm',
        author: 'Dale Carnegie',
        category: 'Kỹ năng sống',
        quantity: 5,
        available: 3,
      },
      {
        id: 2,
        title: 'Nhà Giả Kim',
        author: 'Paulo Coelho',
        category: 'Tiểu thuyết',
        quantity: 3,
        available: 2,
      },
      {
        id: 3,
        title: 'Sapiens: Lược Sử Loài Người',
        author: 'Yuval Noah Harari',
        category: 'Lịch sử',
        quantity: 4,
        available: 4,
      },
      {
        id: 4,
        title: 'Atomic Habits',
        author: 'James Clear',
        category: 'Kỹ năng sống',
        quantity: 6,
        available: 1,
      },
      {
        id: 5,
        title: 'Think and Grow Rich',
        author: 'Napoleon Hill',
        category: 'Kinh doanh',
        quantity: 3,
        available: 3,
      },
      {
        id: 6,
        title: '1984',
        author: 'George Orwell',
        category: 'Tiểu thuyết',
        quantity: 2,
        available: 0,
      },
    ],
    members: [
      {
        id: 1,
        name: 'Nguyễn Văn A',
        email: 'nguyenvana@email.com',
        phone: '0901234567',
        joinDate: '2024-01-15',
        isBlacklisted: false,
        blacklistUntil: null,
        blacklistReason: '',
      },
      {
        id: 2,
        name: 'Trần Thị B',
        email: 'tranthib@email.com',
        phone: '0912345678',
        joinDate: '2024-02-20',
        isBlacklisted: false,
        blacklistUntil: null,
        blacklistReason: '',
      },
      {
        id: 3,
        name: 'Lê Văn C',
        email: 'levanc@email.com',
        phone: '0923456789',
        joinDate: '2024-03-10',
        isBlacklisted: false,
        blacklistUntil: null,
        blacklistReason: '',
      },
    ],
    users: [
      { id: 1, username: 'admin', password: hashedAdmin, role: 'admin', name: 'Admin' },
      {
        id: 2,
        username: 'user',
        password: hashedUser,
        role: 'user',
        name: 'Nguyễn Văn User',
        memberId: 1,
      },
    ],
    rentals: [
      {
        id: 1,
        bookId: 1,
        memberId: 1,
        borrowDate: '2026-01-20',
        dueDate: '2026-02-03',
        returnDate: null,
        status: 'borrowed',
      },
      {
        id: 2,
        bookId: 2,
        memberId: 2,
        borrowDate: '2026-01-25',
        dueDate: '2026-02-08',
        returnDate: '2026-02-05',
        status: 'returned',
      },
      {
        id: 3,
        bookId: 4,
        memberId: 3,
        borrowDate: '2026-02-01',
        dueDate: '2026-02-15',
        returnDate: null,
        status: 'borrowed',
      },
    ],
    requests: [
      {
        id: 1,
        bookId: 3,
        userId: 2,
        requestDate: '2026-02-05',
        status: 'pending',
        note: 'Mượn để làm bài tập',
      },
    ],
    extensionRequests: [],
  }
}

function loadDatabase(): Database {
  ensureDataDir()
  if (!fs.existsSync(dbPath)) {
    const defaultData = getDefaultData()
    fs.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2), 'utf8')
    return defaultData
  }
  const data = fs.readFileSync(dbPath, 'utf8')
  return JSON.parse(data)
}

function saveDatabase(db: Database): void {
  ensureDataDir()
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8')
}

class DatabaseManager {
  private data: Database

  constructor() {
    this.data = loadDatabase()
  }

  save(): void {
    saveDatabase(this.data)
  }

  get books(): Book[] {
    return this.data.books
  }
  set books(value: Book[]) {
    this.data.books = value
    this.save()
  }

  get members(): Member[] {
    return this.data.members
  }
  set members(value: Member[]) {
    this.data.members = value
    this.save()
  }

  get users(): User[] {
    return this.data.users
  }
  set users(value: User[]) {
    this.data.users = value
    this.save()
  }

  get rentals(): Rental[] {
    return this.data.rentals
  }
  set rentals(value: Rental[]) {
    this.data.rentals = value
    this.save()
  }

  get requests(): Request[] {
    return this.data.requests
  }
  set requests(value: Request[]) {
    this.data.requests = value
    this.save()
  }

  get extensionRequests(): ExtensionRequest[] {
    return this.data.extensionRequests
  }
  set extensionRequests(value: ExtensionRequest[]) {
    this.data.extensionRequests = value
    this.save()
  }

  findBook(id: number): Book | undefined {
    return this.data.books.find(b => b.id === id)
  }

  findMember(id: number): Member | undefined {
    return this.data.members.find(m => m.id === id)
  }

  findUser(id: number): User | undefined {
    return this.data.users.find(u => u.id === id)
  }

  findUserByUsername(username: string): User | undefined {
    return this.data.users.find(u => u.username === username)
  }

  findRental(id: number): Rental | undefined {
    return this.data.rentals.find(r => r.id === id)
  }

  findRequest(id: number): Request | undefined {
    return this.data.requests.find(r => r.id === id)
  }

  findExtensionRequest(id: number): ExtensionRequest | undefined {
    return this.data.extensionRequests.find(e => e.id === id)
  }

  nextBookId(): number {
    return Math.max(0, ...this.data.books.map(b => b.id)) + 1
  }

  nextMemberId(): number {
    return Math.max(0, ...this.data.members.map(m => m.id)) + 1
  }

  nextUserId(): number {
    return Math.max(0, ...this.data.users.map(u => u.id)) + 1
  }

  nextRentalId(): number {
    return Math.max(0, ...this.data.rentals.map(r => r.id)) + 1
  }

  nextRequestId(): number {
    return Math.max(0, ...this.data.requests.map(r => r.id)) + 1
  }

  nextExtensionRequestId(): number {
    return Math.max(0, ...this.data.extensionRequests.map(e => e.id)) + 1
  }

  updateBook(id: number, data: Partial<Book>): Book | undefined {
    const index = this.data.books.findIndex(b => b.id === id)
    if (index === -1) return undefined
    this.data.books[index] = { ...this.data.books[index]!, ...data }
    this.save()
    return this.data.books[index]
  }

  updateMember(id: number, data: Partial<Member>): Member | undefined {
    const index = this.data.members.findIndex(m => m.id === id)
    if (index === -1) return undefined
    this.data.members[index] = { ...this.data.members[index]!, ...data }
    this.save()
    return this.data.members[index]
  }

  updateRental(id: number, data: Partial<Rental>): Rental | undefined {
    const index = this.data.rentals.findIndex(r => r.id === id)
    if (index === -1) return undefined
    this.data.rentals[index] = { ...this.data.rentals[index]!, ...data }
    this.save()
    return this.data.rentals[index]
  }

  updateRequest(id: number, data: Partial<Request>): Request | undefined {
    const index = this.data.requests.findIndex(r => r.id === id)
    if (index === -1) return undefined
    this.data.requests[index] = { ...this.data.requests[index]!, ...data }
    this.save()
    return this.data.requests[index]
  }

  updateExtensionRequest(
    id: number,
    data: Partial<ExtensionRequest>
  ): ExtensionRequest | undefined {
    const index = this.data.extensionRequests.findIndex(e => e.id === id)
    if (index === -1) return undefined
    this.data.extensionRequests[index] = { ...this.data.extensionRequests[index]!, ...data }
    this.save()
    return this.data.extensionRequests[index]
  }

  addBook(book: Omit<Book, 'id'>): Book {
    const newBook: Book = { ...book, id: this.nextBookId() }
    this.data.books.push(newBook)
    this.save()
    return newBook
  }

  addMember(member: Omit<Member, 'id'>): Member {
    const newMember: Member = { ...member, id: this.nextMemberId() }
    this.data.members.push(newMember)
    this.save()
    return newMember
  }

  addUser(user: Omit<User, 'id'>): User {
    const newUser: User = { ...user, id: this.nextUserId() }
    this.data.users.push(newUser)
    this.save()
    return newUser
  }

  addRental(rental: Omit<Rental, 'id'>): Rental {
    const newRental: Rental = { ...rental, id: this.nextRentalId() }
    this.data.rentals.push(newRental)
    this.save()
    return newRental
  }

  addRequest(request: Omit<Request, 'id'>): Request {
    const newRequest: Request = { ...request, id: this.nextRequestId() }
    this.data.requests.push(newRequest)
    this.save()
    return newRequest
  }

  addExtensionRequest(ext: Omit<ExtensionRequest, 'id'>): ExtensionRequest {
    const newExt: ExtensionRequest = { ...ext, id: this.nextExtensionRequestId() }
    this.data.extensionRequests.push(newExt)
    this.save()
    return newExt
  }

  deleteBook(id: number): boolean {
    const len = this.data.books.length
    this.data.books = this.data.books.filter(b => b.id !== id)
    if (this.data.books.length < len) {
      this.save()
      return true
    }
    return false
  }

  deleteMember(id: number): boolean {
    const len = this.data.members.length
    this.data.members = this.data.members.filter(m => m.id !== id)
    if (this.data.members.length < len) {
      this.save()
      return true
    }
    return false
  }
}

const db = new DatabaseManager()
export default db
