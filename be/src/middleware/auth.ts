import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { JwtPayload } from '../models/types'

const JWT_SECRET = process.env.JWT_SECRET || 'library_secret_key_2024'

export interface AuthRequest extends Request {
  user?: JwtPayload
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Không có token xác thực' })
    return
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ error: 'Token không hợp lệ' })
  }
}

export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Chỉ admin mới có quyền truy cập' })
    return
  }
  next()
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' })
}

export { JWT_SECRET }
