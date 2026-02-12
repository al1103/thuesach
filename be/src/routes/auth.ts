import { Router, Response } from 'express'
import bcrypt from 'bcryptjs'
import db from '../db/database'
import { AuthRequest, authMiddleware, generateToken } from '../middleware/auth'

const router = Router()

router.post('/login', (req: AuthRequest, res: Response): void => {
  const { username, password } = req.body

  if (!username || !password) {
    res.status(400).json({ error: 'Thiếu username hoặc password' })
    return
  }

  const user = db.findUserByUsername(username)
  if (!user) {
    res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu' })
    return
  }

  if (!bcrypt.compareSync(password, user.password)) {
    res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu' })
    return
  }

  const token = generateToken({ userId: user.id, role: user.role })
  const { password: _, ...userWithoutPassword } = user

  res.json({ user: userWithoutPassword, token })
})

router.post('/register', (req: AuthRequest, res: Response): void => {
  const { username, password, name, email, phone } = req.body

  if (!username || !password || !name) {
    res.status(400).json({ error: 'Thiếu thông tin đăng ký' })
    return
  }

  if (db.findUserByUsername(username)) {
    res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' })
    return
  }

  const hashedPassword = bcrypt.hashSync(password, 10)
  const today = new Date().toISOString().split('T')[0] || ''

  const member = db.addMember({
    name,
    email: email || '',
    phone: phone || '',
    joinDate: today,
    isBlacklisted: false,
    blacklistUntil: null,
    blacklistReason: '',
  })

  const user = db.addUser({
    username,
    password: hashedPassword,
    role: 'user',
    name,
    memberId: member.id,
  })

  const { password: _, ...userWithoutPassword } = user
  const token = generateToken({ userId: user.id, role: user.role })
  res.status(201).json({ user: userWithoutPassword, token })
})

router.get('/me', authMiddleware, (req: AuthRequest, res: Response): void => {
  const user = db.findUser(req.user!.userId)
  if (!user) {
    res.status(404).json({ error: 'Không tìm thấy user' })
    return
  }
  const { password: _, ...userWithoutPassword } = user
  res.json({ user: userWithoutPassword })
})

router.post('/logout', (_req: AuthRequest, res: Response): void => {
  res.json({ message: 'Đăng xuất thành công' })
})

export default router
