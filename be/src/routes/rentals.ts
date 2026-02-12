import { Router, Response } from 'express'
import db from '../db/database'
import { AuthRequest, authMiddleware, adminMiddleware } from '../middleware/auth'
import { Rental, Member, DAILY_LATE_FEE, MAX_BORROW_MONTHS } from '../models/types'

const router = Router()

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0] || ''
}

function addMonths(date: string, months: number): string {
  const [year, month, day] = date.split('-').map(Number)
  const d = new Date(Date.UTC(year || 0, (month || 1) - 1, day || 1))
  d.setUTCMonth(d.getUTCMonth() + months)
  return d.toISOString().split('T')[0] || ''
}

function getLateDays(rental: Rental): number {
  const endDate = rental.returnDate || getTodayDate()
  if (!endDate || endDate <= rental.dueDate) return 0
  const diffMs = new Date(endDate).getTime() - new Date(rental.dueDate).getTime()
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}

function isMemberBlacklisted(member: Member): boolean {
  if (!member.isBlacklisted) return false
  if (!member.blacklistUntil) return true
  return member.blacklistUntil >= getTodayDate()
}

router.get('/', authMiddleware, adminMiddleware, (_req: AuthRequest, res: Response): void => {
  const result = db.rentals
    .map(r => {
      const book = db.findBook(r.bookId)
      const member = db.findMember(r.memberId)
      return {
        ...r,
        bookTitle: book?.title || 'N/A',
        memberName: member?.name || 'N/A',
        lateDays: getLateDays(r),
        lateFee: getLateDays(r) * DAILY_LATE_FEE,
      }
    })
    .reverse()
  res.json(result)
})

router.get('/my', authMiddleware, (req: AuthRequest, res: Response): void => {
  const user = db.findUser(req.user!.userId)
  if (!user?.memberId) {
    res.json([])
    return
  }

  const result = db.rentals
    .filter(r => r.memberId === user.memberId)
    .map(r => {
      const book = db.findBook(r.bookId)
      return {
        ...r,
        bookTitle: book?.title || 'N/A',
        bookAuthor: book?.author || 'N/A',
        lateDays: getLateDays(r),
        lateFee: getLateDays(r) * DAILY_LATE_FEE,
      }
    })
    .reverse()

  res.json(result)
})

router.post('/', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response): void => {
  const { bookId, memberId, dueDate } = req.body

  if (!bookId || !memberId) {
    res.status(400).json({ error: 'Thiếu thông tin mượn sách' })
    return
  }

  const member = db.findMember(memberId)
  if (!member) {
    res.status(400).json({ error: 'Không tìm thấy thành viên' })
    return
  }

  if (isMemberBlacklisted(member)) {
    res.status(400).json({ error: 'Thành viên đang bị blacklist' })
    return
  }

  const book = db.findBook(bookId)
  if (!book || book.available <= 0) {
    res.status(400).json({ error: 'Sách không khả dụng' })
    return
  }

  const borrowDate = getTodayDate()
  const maxDueDate = addMonths(borrowDate, MAX_BORROW_MONTHS)
  const finalDueDate = dueDate && dueDate.trim() ? dueDate : maxDueDate

  if (finalDueDate < borrowDate || finalDueDate > maxDueDate) {
    res.status(400).json({ error: 'Ngày hẹn trả không hợp lệ' })
    return
  }

  const rental = db.addRental({
    bookId,
    memberId,
    borrowDate,
    dueDate: finalDueDate,
    returnDate: null,
    status: 'borrowed',
  })

  db.updateBook(bookId, { available: book.available - 1 })
  res.status(201).json(rental)
})

router.put(
  '/:id/return',
  authMiddleware,
  adminMiddleware,
  (req: AuthRequest, res: Response): void => {
    const rental = db.findRental(Number(req.params.id))
    if (!rental) {
      res.status(404).json({ error: 'Không tìm thấy phiếu mượn' })
      return
    }

    if (rental.status === 'returned') {
      res.status(400).json({ error: 'Sách đã được trả' })
      return
    }

    const returnDate = getTodayDate()
    db.updateRental(rental.id, { returnDate, status: 'returned' })

    const book = db.findBook(rental.bookId)
    if (book) {
      db.updateBook(rental.bookId, { available: book.available + 1 })
    }

    const updatedRental = { ...rental, returnDate, status: 'returned' as const }
    const lateDays = getLateDays(updatedRental)
    const lateFee = lateDays * DAILY_LATE_FEE

    res.json({ ...updatedRental, lateDays, lateFee })
  }
)

export default router
