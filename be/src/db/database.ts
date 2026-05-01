import db from './db'
import { Book, Member, Rental, Request, ExtensionRequest, User } from '../models/types'

class DatabaseManager {
  // Books
  async getBooks(): Promise<Book[]> {
    const res = await db.query('SELECT * FROM books ORDER BY id')
    return res.rows.map(b => ({
      ...b,
      coverUrl: b.cover_url,
    }))
  }

  async findBook(id: number): Promise<Book | undefined> {
    const res = await db.query('SELECT * FROM books WHERE id = $1', [id])
    const b = res.rows[0]
    if (!b) return undefined
    return {
      ...b,
      coverUrl: b.cover_url,
    }
  }

  async addBook(book: Omit<Book, 'id'>): Promise<Book> {
    const res = await db.query(
      'INSERT INTO books (title, author, category, quantity, available, cover_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [book.title, book.author, book.category, book.quantity, book.available, book.coverUrl]
    )
    const b = res.rows[0]
    return {
      ...b,
      coverUrl: b.cover_url,
    }
  }

  async updateBook(id: number, data: Partial<Book>): Promise<Book | undefined> {
    const existing = await this.findBook(id)
    if (!existing) return undefined

    const updated = { ...existing, ...data }
    const res = await db.query(
      'UPDATE books SET title = $1, author = $2, category = $3, quantity = $4, available = $5, cover_url = $6 WHERE id = $7 RETURNING *',
      [updated.title, updated.author, updated.category, updated.quantity, updated.available, updated.coverUrl, id]
    )
    const b = res.rows[0]
    return {
      ...b,
      coverUrl: b.cover_url,
    }
  }

  async deleteBook(id: number): Promise<boolean> {
    const res = await db.query('DELETE FROM books WHERE id = $1', [id])
    return (res.rowCount ?? 0) > 0
  }

  // Members
  async getMembers(): Promise<Member[]> {
    const res = await db.query('SELECT * FROM members ORDER BY id')
    return res.rows.map(m => ({
      ...m,
      isBlacklisted: m.is_blacklisted,
      blacklistUntil: m.blacklist_until,
      blacklistReason: m.blacklist_reason,
      joinDate: m.join_date,
    }))
  }

  async findMember(id: number): Promise<Member | undefined> {
    const res = await db.query('SELECT * FROM members WHERE id = $1', [id])
    const m = res.rows[0]
    if (!m) return undefined
    return {
      ...m,
      isBlacklisted: m.is_blacklisted,
      blacklistUntil: m.blacklist_until,
      blacklistReason: m.blacklist_reason,
      joinDate: m.join_date,
    }
  }

  async addMember(member: Omit<Member, 'id'>): Promise<Member> {
    const res = await db.query(
      'INSERT INTO members (name, email, phone, join_date, is_blacklisted, blacklist_until, blacklist_reason) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [
        member.name,
        member.email,
        member.phone,
        member.joinDate,
        member.isBlacklisted,
        member.blacklistUntil,
        member.blacklistReason,
      ]
    )
    const m = res.rows[0]
    return {
      ...m,
      isBlacklisted: m.is_blacklisted,
      blacklistUntil: m.blacklist_until,
      blacklistReason: m.blacklist_reason,
      joinDate: m.join_date,
    }
  }

  async updateMember(id: number, data: Partial<Member>): Promise<Member | undefined> {
    const existing = await this.findMember(id)
    if (!existing) return undefined

    const updated = { ...existing, ...data }
    const res = await db.query(
      'UPDATE members SET name = $1, email = $2, phone = $3, join_date = $4, is_blacklisted = $5, blacklist_until = $6, blacklist_reason = $7 WHERE id = $8 RETURNING *',
      [
        updated.name,
        updated.email,
        updated.phone,
        updated.joinDate,
        updated.isBlacklisted,
        updated.blacklistUntil,
        updated.blacklistReason,
        id,
      ]
    )
    const m = res.rows[0]
    return {
      ...m,
      isBlacklisted: m.is_blacklisted,
      blacklistUntil: m.blacklist_until,
      blacklistReason: m.blacklist_reason,
      joinDate: m.join_date,
    }
  }

  async deleteMember(id: number): Promise<boolean> {
    const res = await db.query('DELETE FROM members WHERE id = $1', [id])
    return (res.rowCount ?? 0) > 0
  }

  // Users
  async getUsers(): Promise<User[]> {
    const res = await db.query('SELECT * FROM users ORDER BY id')
    return res.rows.map(u => ({
      ...u,
      memberId: u.member_id,
    }))
  }

  async findUser(id: number): Promise<User | undefined> {
    const res = await db.query('SELECT * FROM users WHERE id = $1', [id])
    const u = res.rows[0]
    if (!u) return undefined
    return {
      ...u,
      memberId: u.member_id,
    }
  }

  async findUserByUsername(username: string): Promise<User | undefined> {
    const res = await db.query('SELECT * FROM users WHERE username = $1', [username])
    const u = res.rows[0]
    if (!u) return undefined
    return {
      ...u,
      memberId: u.member_id,
    }
  }

  async addUser(user: Omit<User, 'id'>): Promise<User> {
    const res = await db.query(
      'INSERT INTO users (username, password, role, name, member_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user.username, user.password, user.role, user.name, user.memberId]
    )
    const u = res.rows[0]
    return {
      ...u,
      memberId: u.member_id,
    }
  }

  // Rentals
  async getRentals(): Promise<Rental[]> {
    const res = await db.query('SELECT * FROM rentals ORDER BY id')
    return res.rows.map(r => ({
      ...r,
      bookId: r.book_id,
      memberId: r.member_id,
      borrowDate: r.borrow_date,
      dueDate: r.due_date,
      returnDate: r.return_date,
    }))
  }

  async findRental(id: number): Promise<Rental | undefined> {
    const res = await db.query('SELECT * FROM rentals WHERE id = $1', [id])
    const r = res.rows[0]
    if (!r) return undefined
    return {
      ...r,
      bookId: r.book_id,
      memberId: r.member_id,
      borrowDate: r.borrow_date,
      dueDate: r.due_date,
      returnDate: r.return_date,
    }
  }

  async addRental(rental: Omit<Rental, 'id'>): Promise<Rental> {
    const res = await db.query(
      'INSERT INTO rentals (book_id, member_id, borrow_date, due_date, return_date, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [
        rental.bookId,
        rental.memberId,
        rental.borrowDate,
        rental.dueDate,
        rental.returnDate,
        rental.status,
      ]
    )
    const r = res.rows[0]
    return {
      ...r,
      bookId: r.book_id,
      memberId: r.member_id,
      borrowDate: r.borrow_date,
      dueDate: r.due_date,
      returnDate: r.return_date,
    }
  }

  async updateRental(id: number, data: Partial<Rental>): Promise<Rental | undefined> {
    const existing = await this.findRental(id)
    if (!existing) return undefined

    const updated = { ...existing, ...data }
    const res = await db.query(
      'UPDATE rentals SET book_id = $1, member_id = $2, borrow_date = $3, due_date = $4, return_date = $5, status = $6 WHERE id = $7 RETURNING *',
      [
        updated.bookId,
        updated.memberId,
        updated.borrowDate,
        updated.dueDate,
        updated.returnDate,
        updated.status,
        id,
      ]
    )
    const r = res.rows[0]
    return {
      ...r,
      bookId: r.book_id,
      memberId: r.member_id,
      borrowDate: r.borrow_date,
      dueDate: r.due_date,
      returnDate: r.return_date,
    }
  }

  // Requests
  async getRequests(): Promise<Request[]> {
    const res = await db.query('SELECT * FROM requests ORDER BY id')
    return res.rows.map(r => ({
      ...r,
      bookId: r.book_id,
      userId: r.user_id,
      requestDate: r.request_date,
    }))
  }

  async findRequest(id: number): Promise<Request | undefined> {
    const res = await db.query('SELECT * FROM requests WHERE id = $1', [id])
    const r = res.rows[0]
    if (!r) return undefined
    return {
      ...r,
      bookId: r.book_id,
      userId: r.user_id,
      requestDate: r.request_date,
    }
  }

  async addRequest(request: Omit<Request, 'id'>): Promise<Request> {
    const res = await db.query(
      'INSERT INTO requests (book_id, user_id, request_date, status, note) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [request.bookId, request.userId, request.requestDate, request.status, request.note]
    )
    const r = res.rows[0]
    return {
      ...r,
      bookId: r.book_id,
      userId: r.user_id,
      requestDate: r.request_date,
    }
  }

  async updateRequest(id: number, data: Partial<Request>): Promise<Request | undefined> {
    const existing = await this.findRequest(id)
    if (!existing) return undefined

    const updated = { ...existing, ...data }
    const res = await db.query(
      'UPDATE requests SET book_id = $1, user_id = $2, request_date = $3, status = $4, note = $5 WHERE id = $6 RETURNING *',
      [updated.bookId, updated.userId, updated.requestDate, updated.status, updated.note, id]
    )
    const r = res.rows[0]
    return {
      ...r,
      bookId: r.book_id,
      userId: r.user_id,
      requestDate: r.request_date,
    }
  }

  // Extension Requests
  async getExtensionRequests(): Promise<ExtensionRequest[]> {
    const res = await db.query('SELECT * FROM extension_requests ORDER BY id')
    return res.rows.map(e => ({
      ...e,
      rentalId: e.rental_id,
      userId: e.user_id,
      requestDate: e.request_date,
      requestedDueDate: e.requested_due_date,
      reviewedDate: e.reviewed_date,
    }))
  }

  async findExtensionRequest(id: number): Promise<ExtensionRequest | undefined> {
    const res = await db.query('SELECT * FROM extension_requests WHERE id = $1', [id])
    const e = res.rows[0]
    if (!e) return undefined
    return {
      ...e,
      rentalId: e.rental_id,
      userId: e.user_id,
      requestDate: e.request_date,
      requestedDueDate: e.requested_due_date,
      reviewedDate: e.reviewed_date,
    }
  }

  async addExtensionRequest(ext: Omit<ExtensionRequest, 'id'>): Promise<ExtensionRequest> {
    const res = await db.query(
      'INSERT INTO extension_requests (rental_id, user_id, request_date, requested_due_date, status, note, reviewed_date) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [
        ext.rentalId,
        ext.userId,
        ext.requestDate,
        ext.requestedDueDate,
        ext.status,
        ext.note,
        ext.reviewedDate,
      ]
    )
    const e = res.rows[0]
    return {
      ...e,
      rentalId: e.rental_id,
      userId: e.user_id,
      requestDate: e.request_date,
      requestedDueDate: e.requested_due_date,
      reviewedDate: e.reviewed_date,
    }
  }

  async updateExtensionRequest(
    id: number,
    data: Partial<ExtensionRequest>
  ): Promise<ExtensionRequest | undefined> {
    const existing = await this.findExtensionRequest(id)
    if (!existing) return undefined

    const updated = { ...existing, ...data }
    const res = await db.query(
      'UPDATE extension_requests SET rental_id = $1, user_id = $2, request_date = $3, requested_due_date = $4, status = $5, note = $6, reviewed_date = $7 WHERE id = $8 RETURNING *',
      [
        updated.rentalId,
        updated.userId,
        updated.requestDate,
        updated.requestedDueDate,
        updated.status,
        updated.note,
        updated.reviewedDate,
        id,
      ]
    )
    const e = res.rows[0]
    return {
      ...e,
      rentalId: e.rental_id,
      userId: e.user_id,
      requestDate: e.request_date,
      requestedDueDate: e.requested_due_date,
      reviewedDate: e.reviewed_date,
    }
  }
}

const databaseManager = new DatabaseManager()
export default databaseManager
