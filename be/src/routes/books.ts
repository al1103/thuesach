import { Router, Response } from 'express'
import db from '../db/database'
import { AuthRequest, authMiddleware, adminMiddleware } from '../middleware/auth'

const router = Router()

router.get('/', async (_req: AuthRequest, res: Response): Promise<void> => {
  const books = await db.getBooks()
  res.json(books)
})

router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const book = await db.findBook(Number(req.params.id))
  if (!book) {
    res.status(404).json({ error: 'Không tìm thấy sách' })
    return
  }
  res.json(book)
})

router.post(
  '/',
  authMiddleware,
  adminMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { title, author, category, quantity } = req.body

    if (!title || !author || !category) {
      res.status(400).json({ error: 'Thiếu thông tin sách' })
      return
    }

    const qty = quantity || 1
    const book = await db.addBook({ title, author, category, quantity: qty, available: qty })
    res.status(201).json(book)
  }
)

router.put(
  '/:id',
  authMiddleware,
  adminMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { title, author, category, quantity, available } = req.body
    const id = Number(req.params.id)

    const existing = await db.findBook(id)
    if (!existing) {
      res.status(404).json({ error: 'Không tìm thấy sách' })
      return
    }

    const updated = await db.updateBook(id, {
      title: title ?? existing.title,
      author: author ?? existing.author,
      category: category ?? existing.category,
      quantity: quantity ?? existing.quantity,
      available: available ?? existing.available,
    })

    res.json(updated)
  }
)

router.delete(
  '/:id',
  authMiddleware,
  adminMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const deleted = await db.deleteBook(Number(req.params.id))
    if (!deleted) {
      res.status(404).json({ error: 'Không tìm thấy sách' })
      return
    }
    res.json({ message: 'Xóa sách thành công' })
  }
)

export default router
