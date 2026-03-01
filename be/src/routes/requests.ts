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

router.get(
  '/',
  authMiddleware,
  adminMiddleware,
  async (_req: AuthRequest, res: Response): Promise<void> => {
    const requests = await db.getRequests()
    const result = await Promise.all(
      requests.map(async r => {
        const book = await db.findBook(r.bookId)
        const user = await db.findUser(r.userId)
        return {
          ...r,
          bookTitle: book?.title || 'N/A',
          userName: user?.name || 'N/A',
        }
      })
    )
    res.json(result.reverse())
  }
)

router.get('/my', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const requests = await db.getRequests()
  const userRequests = requests.filter(r => r.userId === req.user!.userId)

  const result = await Promise.all(
    userRequests.map(async r => {
      const book = await db.findBook(r.bookId)
      return {
        ...r,
        bookTitle: book?.title || 'N/A',
        bookAuthor: book?.author || 'N/A',
      }
    })
  )
  res.json(result.reverse())
})

router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { bookId, note } = req.body

  if (!bookId) {
    res.status(400).json({ error: 'Thiếu thông tin sách' })
    return
  }

  const user = await db.findUser(req.user!.userId)
  if (user?.memberId) {
    const member = await db.findMember(user.memberId)
    if (member && isMemberBlacklisted(member)) {
      res.status(400).json({ error: 'Bạn đang bị blacklist, không thể tạo yêu cầu' })
      return
    }
  }

  const request = await db.addRequest({
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
  async (req: AuthRequest, res: Response): Promise<void> => {
    const request = await db.findRequest(Number(req.params.id))
    if (!request) {
      res.status(404).json({ error: 'Không tìm thấy yêu cầu' })
      return
    }

    if (request.status !== 'pending') {
      res.status(400).json({ error: 'Yêu cầu đã được xử lý' })
      return
    }

    const user = await db.findUser(request.userId)
    if (!user?.memberId) {
      res.status(400).json({ error: 'Người dùng không có thông tin thành viên' })
      return
    }

    const member = await db.findMember(user.memberId)
    if (member && isMemberBlacklisted(member)) {
      await db.updateRequest(request.id, { status: 'rejected' })
      res.status(400).json({ error: 'Thành viên đang bị blacklist' })
      return
    }

    const book = await db.findBook(request.bookId)
    if (!book || book.available <= 0) {
      res.status(400).json({ error: 'Sách không khả dụng' })
      return
    }

    await db.updateRequest(request.id, { status: 'approved' })

    const borrowDate = getTodayDate()
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 14)
    const dueDateStr = dueDate.toISOString().split('T')[0] || ''

    await db.addRental({
      bookId: request.bookId,
      memberId: user.memberId,
      borrowDate,
      dueDate: dueDateStr,
      returnDate: null,
      status: 'borrowed',
    })

    await db.updateBook(request.bookId, { available: book.available - 1 })
    res.json({ message: 'Đã duyệt yêu cầu' })
  }
)

router.put(
  '/:id/reject',
  authMiddleware,
  adminMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const request = await db.findRequest(Number(req.params.id))
    if (!request) {
      res.status(404).json({ error: 'Không tìm thấy yêu cầu' })
      return
    }

    if (request.status !== 'pending') {
      res.status(400).json({ error: 'Yêu cầu đã được xử lý' })
      return
    }

    await db.updateRequest(request.id, { status: 'rejected' })
    res.json({ message: 'Đã từ chối yêu cầu' })
  }
)

export default router
