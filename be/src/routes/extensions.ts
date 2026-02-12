import { Router, Response } from 'express'
import db from '../db/database'
import { AuthRequest, authMiddleware, adminMiddleware } from '../middleware/auth'
import { Member, MAX_BORROW_MONTHS } from '../models/types'

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

function isMemberBlacklisted(member: Member): boolean {
  if (!member.isBlacklisted) return false
  if (!member.blacklistUntil) return true
  return member.blacklistUntil >= getTodayDate()
}

router.get('/', authMiddleware, adminMiddleware, (_req: AuthRequest, res: Response): void => {
  const result = db.extensionRequests
    .map(e => {
      const rental = db.findRental(e.rentalId)
      const book = rental ? db.findBook(rental.bookId) : null
      const user = db.findUser(e.userId)
      return {
        ...e,
        bookId: rental?.bookId || 0,
        currentDueDate: rental?.dueDate || '',
        bookTitle: book?.title || 'N/A',
        userName: user?.name || 'N/A',
      }
    })
    .reverse()
  res.json(result)
})

router.get('/my', authMiddleware, (req: AuthRequest, res: Response): void => {
  const result = db.extensionRequests
    .filter(e => e.userId === req.user!.userId)
    .map(e => {
      const rental = db.findRental(e.rentalId)
      const book = rental ? db.findBook(rental.bookId) : null
      return {
        ...e,
        bookId: rental?.bookId || 0,
        currentDueDate: rental?.dueDate || '',
        bookTitle: book?.title || 'N/A',
      }
    })
    .reverse()
  res.json(result)
})

router.post('/', authMiddleware, (req: AuthRequest, res: Response): void => {
  const { rentalId, requestedDueDate, note } = req.body

  if (!rentalId || !requestedDueDate) {
    res.status(400).json({ error: 'Thiếu thông tin gia hạn' })
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

  const rental = db.findRental(rentalId)
  if (!rental || rental.status !== 'borrowed') {
    res.status(400).json({ error: 'Không tìm thấy phiếu mượn hoặc sách đã trả' })
    return
  }

  const maxDueDate = addMonths(rental.borrowDate, MAX_BORROW_MONTHS)
  if (requestedDueDate <= rental.dueDate || requestedDueDate > maxDueDate) {
    res.status(400).json({ error: 'Ngày gia hạn không hợp lệ (tối đa 3 tháng từ ngày mượn)' })
    return
  }

  const existingPending = db.extensionRequests.find(
    e => e.rentalId === rentalId && e.userId === req.user!.userId && e.status === 'pending'
  )
  if (existingPending) {
    res.status(400).json({ error: 'Đã có yêu cầu gia hạn đang chờ duyệt' })
    return
  }

  const extension = db.addExtensionRequest({
    rentalId,
    userId: req.user!.userId,
    requestDate: getTodayDate(),
    requestedDueDate,
    status: 'pending',
    note: note || '',
    reviewedDate: null,
  })

  res.status(201).json(extension)
})

router.put(
  '/:id/approve',
  authMiddleware,
  adminMiddleware,
  (req: AuthRequest, res: Response): void => {
    const extension = db.findExtensionRequest(Number(req.params.id))
    if (!extension) {
      res.status(404).json({ error: 'Không tìm thấy yêu cầu gia hạn' })
      return
    }

    if (extension.status !== 'pending') {
      res.status(400).json({ error: 'Yêu cầu đã được xử lý' })
      return
    }

    const rental = db.findRental(extension.rentalId)
    if (!rental || rental.status !== 'borrowed') {
      res.status(400).json({ error: 'Phiếu mượn không hợp lệ' })
      return
    }

    const maxDueDate = addMonths(rental.borrowDate, MAX_BORROW_MONTHS)
    if (extension.requestedDueDate <= rental.dueDate || extension.requestedDueDate > maxDueDate) {
      res.status(400).json({ error: 'Ngày gia hạn không còn hợp lệ' })
      return
    }

    db.updateRental(extension.rentalId, { dueDate: extension.requestedDueDate })
    db.updateExtensionRequest(extension.id, { status: 'approved', reviewedDate: getTodayDate() })

    res.json({ message: 'Đã duyệt gia hạn' })
  }
)

router.put(
  '/:id/reject',
  authMiddleware,
  adminMiddleware,
  (req: AuthRequest, res: Response): void => {
    const extension = db.findExtensionRequest(Number(req.params.id))
    if (!extension) {
      res.status(404).json({ error: 'Không tìm thấy yêu cầu gia hạn' })
      return
    }

    if (extension.status !== 'pending') {
      res.status(400).json({ error: 'Yêu cầu đã được xử lý' })
      return
    }

    db.updateExtensionRequest(extension.id, { status: 'rejected', reviewedDate: getTodayDate() })
    res.json({ message: 'Đã từ chối gia hạn' })
  }
)

export default router
