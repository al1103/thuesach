import { Router, Response } from 'express'
import db from '../db/database'
import { AuthRequest, authMiddleware, adminMiddleware } from '../middleware/auth'

const router = Router()

router.get('/', (_req: AuthRequest, res: Response): void => {
  res.json(db.books)
})

router.get('/:id', (req: AuthRequest, res: Response): void => {
  const book = db.findBook(Number(req.params.id))
  if (!book) {
    res.status(404).json({ error: 'Không tìm thấy sách' })
    return
  }
  res.json(book)
})

router.post('/', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response): void => {
  const { title, author, category, quantity } = req.body

  if (!title || !author || !category) {
    res.status(400).json({ error: 'Thiếu thông tin sách' })
    return
  }

  const qty = quantity || 1
  const book = db.addBook({ title, author, category, quantity: qty, available: qty })
  res.status(201).json(book)
})

router.put('/:id', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response): void => {
  const { title, author, category, quantity, available } = req.body
  const id = Number(req.params.id)

  const existing = db.findBook(id)
  if (!existing) {
    res.status(404).json({ error: 'Không tìm thấy sách' })
    return
  }

  const updated = db.updateBook(id, {
    title: title ?? existing.title,
    author: author ?? existing.author,
    category: category ?? existing.category,
    quantity: quantity ?? existing.quantity,
    available: available ?? existing.available,
  })

  res.json(updated)
})

router.delete('/:id', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response): void => {
  const deleted = db.deleteBook(Number(req.params.id))
  if (!deleted) {
    res.status(404).json({ error: 'Không tìm thấy sách' })
    return
  }
  res.json({ message: 'Xóa sách thành công' })
})

export default router
