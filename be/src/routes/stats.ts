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
  const today = getTodayDate()

  const borrowed = db.rentals.filter(r => r.status === 'borrowed')
  const overdue = borrowed.filter(r => r.dueDate < today)
  const pendingRequests = db.requests.filter(r => r.status === 'pending').length
  const pendingExtensions = db.extensionRequests.filter(e => e.status === 'pending').length
  const blacklisted = db.members.filter(m => isMemberBlacklisted(m))

  res.json({
    totalBooks: db.books.reduce((sum, b) => sum + b.quantity, 0),
    totalMembers: db.members.length,
    currentlyBorrowed: borrowed.length,
    overdue: overdue.length,
    pendingRequests,
    pendingExtensions,
    availableBooks: db.books.reduce((sum, b) => sum + b.available, 0),
    blacklistedMembers: blacklisted.length,
  })
})

export default router
