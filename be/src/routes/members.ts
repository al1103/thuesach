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
    const members = await db.getMembers()
    const result = members.map(m => ({
      ...m,
      isCurrentlyBlacklisted: isMemberBlacklisted(m),
    }))
    res.json(result)
  }
)

router.get(
  '/:id',
  authMiddleware,
  adminMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const member = await db.findMember(Number(req.params.id))
    if (!member) {
      res.status(404).json({ error: 'Không tìm thấy thành viên' })
      return
    }
    res.json({
      ...member,
      isCurrentlyBlacklisted: isMemberBlacklisted(member),
    })
  }
)

router.post(
  '/',
  authMiddleware,
  adminMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { name, email, phone } = req.body

    if (!name || !email || !phone) {
      res.status(400).json({ error: 'Thiếu thông tin thành viên' })
      return
    }

    const member = await db.addMember({
      name,
      email,
      phone,
      joinDate: getTodayDate(),
      isBlacklisted: false,
      blacklistUntil: null,
      blacklistReason: '',
    })

    res.status(201).json(member)
  }
)

router.put(
  '/:id',
  authMiddleware,
  adminMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { name, email, phone } = req.body
    const id = Number(req.params.id)

    const existing = await db.findMember(id)
    if (!existing) {
      res.status(404).json({ error: 'Không tìm thấy thành viên' })
      return
    }

    const updated = await db.updateMember(id, {
      name: name ?? existing.name,
      email: email ?? existing.email,
      phone: phone ?? existing.phone,
    })

    res.json(updated)
  }
)

router.delete(
  '/:id',
  authMiddleware,
  adminMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const deleted = await db.deleteMember(Number(req.params.id))
    if (!deleted) {
      res.status(404).json({ error: 'Không tìm thấy thành viên' })
      return
    }
    res.json({ message: 'Xóa thành viên thành công' })
  }
)

router.post(
  '/:id/blacklist',
  authMiddleware,
  adminMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { until, reason } = req.body
    const id = Number(req.params.id)

    const member = await db.findMember(id)
    if (!member) {
      res.status(404).json({ error: 'Không tìm thấy thành viên' })
      return
    }

    try {
      await db.updateMember(id, {
        isBlacklisted: true,
        blacklistUntil: until || null,
        blacklistReason: reason || '',
      })
      res.json({ message: 'Đã đưa vào blacklist' })
    } catch (error) {
      console.error('Lỗi khi blacklist thành viên:', error)
      res.status(500).json({ error: 'Không thể cập nhật trạng thái blacklist' })
    }
  }
)

router.delete(
  '/:id/blacklist',
  authMiddleware,
  adminMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const id = Number(req.params.id)

    const member = await db.findMember(id)
    if (!member) {
      res.status(404).json({ error: 'Không tìm thấy thành viên' })
      return
    }

    try {
      await db.updateMember(id, {
        isBlacklisted: false,
        blacklistUntil: null,
        blacklistReason: '',
      })
      res.json({ message: 'Đã gỡ khỏi blacklist' })
    } catch (error) {
      console.error('Lỗi khi gỡ blacklist thành viên:', error)
      res.status(500).json({ error: 'Không thể gỡ trạng thái blacklist' })
    }
  }
)

export default router
