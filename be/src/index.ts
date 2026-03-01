import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'

dotenv.config()

import authRoutes from './routes/auth'
import booksRoutes from './routes/books'
import membersRoutes from './routes/members'
import rentalsRoutes from './routes/rentals'
import requestsRoutes from './routes/requests'
import extensionsRoutes from './routes/extensions'
import statsRoutes from './routes/stats'

const app = express()
const PORT = process.env.PORT || 3001

app.use(helmet())
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
    credentials: true,
  })
)
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/books', booksRoutes)
app.use('/api/members', membersRoutes)
app.use('/api/rentals', rentalsRoutes)
app.use('/api/requests', requestsRoutes)
app.use('/api/extensions', extensionsRoutes)
app.use('/api/stats', statsRoutes)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err.message)
  res.status(500).json({ error: 'Lỗi server' })
})

app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`)
  console.log(`📚 API endpoints:`)
  console.log(`   - POST /api/auth/login`)
  console.log(`   - POST /api/auth/register`)
  console.log(`   - GET  /api/books`)
  console.log(`   - GET  /api/members`)
  console.log(`   - GET  /api/rentals`)
  console.log(`   - GET  /api/requests`)
  console.log(`   - GET  /api/extensions`)
  console.log(`   - GET  /api/stats`)
})

export default app
