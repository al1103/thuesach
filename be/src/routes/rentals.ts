import { Router, Response } from 'express'
import db from '../db/database'
import { AuthRequest, authMiddleware, adminMiddleware } from '../middleware/auth'
import { Rental, Member, DAILY_LATE_FEE, MAX_BORROW_MONTHS } from '../models/types'

import { generateQRUrl } from '../utils/payment'

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

router.get(
  '/',
  authMiddleware,
  adminMiddleware,
  async (_req: AuthRequest, res: Response): Promise<void> => {
    const rentals = await db.getRentals()
    const result = await Promise.all(
      rentals.map(async r => {
        const book = await db.findBook(r.bookId)
        const member = await db.findMember(r.memberId)
        return {
          ...r,
          bookTitle: book?.title || 'N/A',
          memberName: member?.name || 'N/A',
          lateDays: getLateDays(r),
          lateFee: getLateDays(r) * DAILY_LATE_FEE,
        }
      })
    )
    res.json(result.reverse())
  }
)

router.get('/my', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await db.findUser(req.user!.userId)
  if (!user?.memberId) {
    res.json([])
    return
  }

  const rentals = await db.getRentals()
  const userRentals = rentals.filter(r => r.memberId === user.memberId)

  const result = await Promise.all(
    userRentals.map(async r => {
      const book = await db.findBook(r.bookId)
      return {
        ...r,
        bookTitle: book?.title || 'N/A',
        bookAuthor: book?.author || 'N/A',
        lateDays: getLateDays(r),
        lateFee: getLateDays(r) * DAILY_LATE_FEE,
      }
    })
  )

  res.json(result.reverse())
})

router.get('/:id/qr', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const rental = await db.findRental(Number(req.params.id))
  if (!rental) {
    res.status(404).json({ error: 'Không tìm thấy phiếu mượn' })
    return
  }

  const user = await db.findUser(req.user!.userId)
  if (user?.role !== 'admin' && user?.memberId !== rental.memberId) {
    res.status(403).json({ error: 'Không có quyền truy cập' })
    return
  }

  const lateDays = getLateDays(rental)
  const lateFee = lateDays * DAILY_LATE_FEE

  if (lateFee <= 0) {
    res.status(400).json({ error: 'Phiếu mượn không có tiền phạt' })
    return
  }

  const book = await db.findBook(rental.bookId)
  const description = `THANH TOAN TIEN PHAT PHIEU MUON ${rental.id} - ${book?.title || 'SACH'}`
  const qrUrl = generateQRUrl(lateFee, description)

  res.json({
    rentalId: rental.id,
    amount: lateFee,
    description,
    qrUrl,
  })
})

router.post(
  '/',
  authMiddleware,
  adminMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { bookId, memberId, dueDate } = req.body

    if (!bookId || !memberId) {
      res.status(400).json({ error: 'Thiếu thông tin mượn sách' })
      return
    }

    const member = await db.findMember(memberId)
    if (!member) {
      res.status(400).json({ error: 'Không tìm thấy thành viên' })
      return
    }

    if (isMemberBlacklisted(member)) {
      res.status(400).json({ error: 'Thành viên đang bị blacklist' })
      return
    }

    const book = await db.findBook(bookId)
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

    const rental = await db.addRental({
      bookId,
      memberId,
      borrowDate,
      dueDate: finalDueDate,
      returnDate: null,
      status: 'borrowed',
    })

    await db.updateBook(bookId, { available: book.available - 1 })
    res.status(201).json(rental)
  }
)

router.put(
  '/:id/return',
  authMiddleware,
  adminMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const rental = await db.findRental(Number(req.params.id))
    if (!rental) {
      res.status(404).json({ error: 'Không tìm thấy phiếu mượn' })
      return
    }

    if (rental.status === 'returned') {
      res.status(400).json({ error: 'Sách đã được trả' })
      return
    }

    const returnDate = getTodayDate()
    await db.updateRental(rental.id, { returnDate, status: 'returned' })

    const book = await db.findBook(rental.bookId)
    if (book) {
      await db.updateBook(rental.bookId, { available: book.available + 1 })
    }

    const updatedRental = { ...rental, returnDate, status: 'returned' as const }
    const lateDays = getLateDays(updatedRental)
    const lateFee = lateDays * DAILY_LATE_FEE

    res.json({ ...updatedRental, lateDays, lateFee })
  }
)

export default router
