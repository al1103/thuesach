import { Router, Response } from 'express'
import db from '../db/database'
import { AuthRequest, authMiddleware, adminMiddleware } from '../middleware/auth'
import { Member, MAX_BORROW_MONTHS } from '../models/types'

const router = Router()

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0] || ''
}

function addMonths(date: string | Date, months: number): string {
  const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0] || ''
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(Date.UTC(year || 0, (month || 1) - 1, day || 1))
  d.setUTCMonth(d.getUTCMonth() + months)
  return d.toISOString().split('T')[0] || ''
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
    console.log('GET /api/extensions called')
    const extensionRequests = await db.getExtensionRequests()
    console.log(`Found ${extensionRequests.length} extension requests`)
    const result = await Promise.all(
      extensionRequests.map(async e => {
        const rental = await db.findRental(e.rentalId)
        const book = rental ? await db.findBook(rental.bookId) : null
        const user = await db.findUser(e.userId)
        return {
          ...e,
          bookId: rental?.bookId || 0,
          currentDueDate: rental?.dueDate || '',
          bookTitle: book?.title || 'N/A',
          userName: user?.name || 'N/A',
        }
      })
    )
    console.log('GET /api/extensions success')
    res.json(result.reverse())
  }
)

router.get('/my', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  console.log(`GET /api/extensions/my called for user ${req.user!.userId}`)
  const extensionRequests = await db.getExtensionRequests()
  const userExtensions = extensionRequests.filter(e => e.userId === req.user!.userId)
  console.log(`Found ${userExtensions.length} extension requests for user`)

  const result = await Promise.all(
    userExtensions.map(async e => {
      const rental = await db.findRental(e.rentalId)
      const book = rental ? await db.findBook(rental.bookId) : null
      return {
        ...e,
        bookId: rental?.bookId || 0,
        currentDueDate: rental?.dueDate || '',
        bookTitle: book?.title || 'N/A',
      }
    })
  )
  res.json(result.reverse())
})

router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { rentalId, requestedDueDate, note } = req.body

  if (!rentalId || !requestedDueDate) {
    res.status(400).json({ error: 'Thiếu thông tin gia hạn' })
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

  const rental = await db.findRental(rentalId)
  if (!rental || rental.status !== 'borrowed') {
    res.status(400).json({ error: 'Không tìm thấy phiếu mượn hoặc sách đã trả' })
    return
  }

  const maxDueDate = addMonths(rental.borrowDate, MAX_BORROW_MONTHS)
  if (requestedDueDate <= rental.dueDate || requestedDueDate > maxDueDate) {
    res.status(400).json({ error: 'Ngày gia hạn không hợp lệ (tối đa 3 tháng từ ngày mượn)' })
    return
  }

  const extensionRequests = await db.getExtensionRequests()
  const existingPending = extensionRequests.find(
    e => e.rentalId === rentalId && e.userId === req.user!.userId && e.status === 'pending'
  )
  if (existingPending) {
    res.status(400).json({ error: 'Đã có yêu cầu gia hạn đang chờ duyệt' })
    return
  }

  const extension = await db.addExtensionRequest({
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
  async (req: AuthRequest, res: Response): Promise<void> => {
    const extension = await db.findExtensionRequest(Number(req.params.id))
    if (!extension) {
      res.status(404).json({ error: 'Không tìm thấy yêu cầu gia hạn' })
      return
    }

    if (extension.status !== 'pending') {
      res.status(400).json({ error: 'Yêu cầu đã được xử lý' })
      return
    }

    const rental = await db.findRental(extension.rentalId)
    if (!rental || rental.status !== 'borrowed') {
      res.status(400).json({ error: 'Phiếu mượn không hợp lệ' })
      return
    }

    const maxDueDate = addMonths(rental.borrowDate, MAX_BORROW_MONTHS)
    if (extension.requestedDueDate <= rental.dueDate || extension.requestedDueDate > maxDueDate) {
      res.status(400).json({ error: 'Ngày gia hạn không còn hợp lệ' })
      return
    }

    await db.updateRental(extension.rentalId, { dueDate: extension.requestedDueDate })
    await db.updateExtensionRequest(extension.id, {
      status: 'approved',
      reviewedDate: getTodayDate(),
    })

    res.json({ message: 'Đã duyệt gia hạn' })
  }
)

router.put(
  '/:id/reject',
  authMiddleware,
  adminMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const extension = await db.findExtensionRequest(Number(req.params.id))
    if (!extension) {
      res.status(404).json({ error: 'Không tìm thấy yêu cầu gia hạn' })
      return
    }

    if (extension.status !== 'pending') {
      res.status(400).json({ error: 'Yêu cầu đã được xử lý' })
      return
    }

    await db.updateExtensionRequest(extension.id, {
      status: 'rejected',
      reviewedDate: getTodayDate(),
    })
    res.json({ message: 'Đã từ chối gia hạn' })
  }
)

export default router
