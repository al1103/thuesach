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
    const today = getTodayDate()

    const [rentals, requests, extensionRequests, books, members] = await Promise.all([
      db.getRentals(),
      db.getRequests(),
      db.getExtensionRequests(),
      db.getBooks(),
      db.getMembers(),
    ])

    const borrowed = rentals.filter(r => r.status === 'borrowed')
    const overdue = borrowed.filter(r => r.dueDate < today)
    const pendingRequests = requests.filter(r => r.status === 'pending').length
    const pendingExtensions = extensionRequests.filter(e => e.status === 'pending').length
    const blacklisted = members.filter(m => isMemberBlacklisted(m))

    res.json({
      totalBooks: books.reduce((sum, b) => sum + b.quantity, 0),
      totalMembers: members.length,
      currentlyBorrowed: borrowed.length,
      overdue: overdue.length,
      pendingRequests,
      pendingExtensions,
      availableBooks: books.reduce((sum, b) => sum + b.available, 0),
      blacklistedMembers: blacklisted.length,
    })
  }
)

export default router
