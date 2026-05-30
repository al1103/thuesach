import { Request, Response, NextFunction } from 'express'
import { checkAndBlockOverdueMembers } from '../utils/overdueBlock'

export async function overdueMiddleware(_req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    await checkAndBlockOverdueMembers()
  } catch (error) {
    console.error('Error checking overdue members:', error)
  }
  next()
}
