import { Router, Response } from 'express'
import db from '../db/database'
import { AuthRequest, authMiddleware, adminMiddleware } from '../middleware/auth'
import { Member } from '../models/types'

const router = Router()

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0] || ''
}

function isMemberBlacklisted(member: Member): boolean {
  if (!member.isBlacklisted) return false
  if (!member.blacklistUntil) return true
  return member.blacklistUntil >= getTodayDate()
}

router.get('/', authMiddleware, adminMiddleware, (_req: AuthRequest, res: Response): void => {
  const result = db.requests
    .map(r => {
      const book = db.findBook(r.bookId)
      const user = db.findUser(r.userId)
      return {
        ...r,
        bookTitle: book?.title || 'N/A',
        userName: user?.name || 'N/A',
      }
    })
    .reverse()
  res.json(result)
})

router.get('/my', authMiddleware, (req: AuthRequest, res: Response): void => {
  const result = db.requests
    .filter(r => r.userId === req.user!.userId)
    .map(r => {
      const book = db.findBook(r.bookId)
      return {
        ...r,
        bookTitle: book?.title || 'N/A',
        bookAuthor: book?.author || 'N/A',
      }
    })
    .reverse()
  res.json(result)
})

router.post('/', authMiddleware, (req: AuthRequest, res: Response): void => {
  const { bookId, note } = req.body

  if (!bookId) {
    res.status(400).json({ error: 'Thiếu thông tin sách' })
    return
  }

  const user = db.findUser(req.user!.userId)
  if (user?.memberId) {
    const member = db.findMember(user.memberId)
    if (member && isMemberBlacklisted(member)) {
      res.status(400).json({ error: 'Bạn đang bị blacklist, không thể tạo yêu cầu' })
      return
    }
  }

  const request = db.addRequest({
    bookId,
    userId: req.user!.userId,
    requestDate: getTodayDate(),
    status: 'pending',
    note: note || '',
  })

  res.status(201).json(request)
})

router.put(
  '/:id/approve',
  authMiddleware,
  adminMiddleware,
  (req: AuthRequest, res: Response): void => {
    const request = db.findRequest(Number(req.params.id))
    if (!request) {
      res.status(404).json({ error: 'Không tìm thấy yêu cầu' })
      return
    }

    if (request.status !== 'pending') {
      res.status(400).json({ error: 'Yêu cầu đã được xử lý' })
      return
    }

    const user = db.findUser(request.userId)
    if (!user?.memberId) {
      res.status(400).json({ error: 'Người dùng không có thông tin thành viên' })
      return
    }

    const member = db.findMember(user.memberId)
    if (member && isMemberBlacklisted(member)) {
      db.updateRequest(request.id, { status: 'rejected' })
      res.status(400).json({ error: 'Thành viên đang bị blacklist' })
      return
    }

    const book = db.findBook(request.bookId)
    if (!book || book.available <= 0) {
      res.status(400).json({ error: 'Sách không khả dụng' })
      return
    }

    db.updateRequest(request.id, { status: 'approved' })

    const borrowDate = getTodayDate()
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 14)
    const dueDateStr = dueDate.toISOString().split('T')[0] || ''

    db.addRental({
      bookId: request.bookId,
      memberId: user.memberId,
      borrowDate,
      dueDate: dueDateStr,
      returnDate: null,
      status: 'borrowed',
    })

    db.updateBook(request.bookId, { available: book.available - 1 })
    res.json({ message: 'Đã duyệt yêu cầu' })
  }
)

router.put(
  '/:id/reject',
  authMiddleware,
  adminMiddleware,
  (req: AuthRequest, res: Response): void => {
    const request = db.findRequest(Number(req.params.id))
    if (!request) {
      res.status(404).json({ error: 'Không tìm thấy yêu cầu' })
      return
    }

    if (request.status !== 'pending') {
      res.status(400).json({ error: 'Yêu cầu đã được xử lý' })
      return
    }

    db.updateRequest(request.id, { status: 'rejected' })
    res.json({ message: 'Đã từ chối yêu cầu' })
  }
)

export default router
