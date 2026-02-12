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
  const result = db.members.map(m => ({
    ...m,
    isCurrentlyBlacklisted: isMemberBlacklisted(m),
  }))
  res.json(result)
})

router.get('/:id', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response): void => {
  const member = db.findMember(Number(req.params.id))
  if (!member) {
    res.status(404).json({ error: 'Không tìm thấy thành viên' })
    return
  }
  res.json({
    ...member,
    isCurrentlyBlacklisted: isMemberBlacklisted(member),
  })
})

router.post('/', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response): void => {
  const { name, email, phone } = req.body

  if (!name || !email || !phone) {
    res.status(400).json({ error: 'Thiếu thông tin thành viên' })
    return
  }

  const member = db.addMember({
    name,
    email,
    phone,
    joinDate: getTodayDate(),
    isBlacklisted: false,
    blacklistUntil: null,
    blacklistReason: '',
  })

  res.status(201).json(member)
})

router.put('/:id', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response): void => {
  const { name, email, phone } = req.body
  const id = Number(req.params.id)

  const existing = db.findMember(id)
  if (!existing) {
    res.status(404).json({ error: 'Không tìm thấy thành viên' })
    return
  }

  const updated = db.updateMember(id, {
    name: name ?? existing.name,
    email: email ?? existing.email,
    phone: phone ?? existing.phone,
  })

  res.json(updated)
})

router.delete('/:id', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response): void => {
  const deleted = db.deleteMember(Number(req.params.id))
  if (!deleted) {
    res.status(404).json({ error: 'Không tìm thấy thành viên' })
    return
  }
  res.json({ message: 'Xóa thành viên thành công' })
})

router.post(
  '/:id/blacklist',
  authMiddleware,
  adminMiddleware,
  (req: AuthRequest, res: Response): void => {
    const { until, reason } = req.body
    const id = Number(req.params.id)

    const member = db.findMember(id)
    if (!member) {
      res.status(404).json({ error: 'Không tìm thấy thành viên' })
      return
    }

    db.updateMember(id, {
      isBlacklisted: true,
      blacklistUntil: until || null,
      blacklistReason: reason || '',
    })

    res.json({ message: 'Đã đưa vào blacklist' })
  }
)

router.delete(
  '/:id/blacklist',
  authMiddleware,
  adminMiddleware,
  (req: AuthRequest, res: Response): void => {
    const id = Number(req.params.id)

    const member = db.findMember(id)
    if (!member) {
      res.status(404).json({ error: 'Không tìm thấy thành viên' })
      return
    }

    db.updateMember(id, {
      isBlacklisted: false,
      blacklistUntil: null,
      blacklistReason: '',
    })

    res.json({ message: 'Đã xóa khỏi blacklist' })
  }
)

export default router
