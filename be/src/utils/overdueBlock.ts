import db from '../db/database'

export async function checkAndBlockOverdueMembers(): Promise<void> {
  const today = new Date().toISOString().split('T')[0] || ''
  const [rentals, members] = await Promise.all([db.getRentals(), db.getMembers()])

  const overdueMemberIds = new Set<number>()
  for (const rental of rentals) {
    if (rental.status === 'borrowed' && rental.dueDate < today) {
      overdueMemberIds.add(rental.memberId)
    }
  }

  for (const member of members) {
    const isOverdue = overdueMemberIds.has(member.id)
    if (isOverdue && !member.isBlacklisted) {
      await db.updateMember(member.id, {
        isBlacklisted: true,
        blacklistReason: 'Có sách mượn quá hạn chưa trả',
      })
    } else if (
      !isOverdue &&
      member.isBlacklisted &&
      member.blacklistReason === 'Có sách mượn quá hạn chưa trả'
    ) {
      await db.updateMember(member.id, {
        isBlacklisted: false,
        blacklistUntil: null,
        blacklistReason: '',
      })
    }
  }
}
