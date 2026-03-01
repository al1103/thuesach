import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'mysecretpassword',
  database: process.env.DB_NAME || 'thuesach',
})

async function initDb() {
  const sqlPath = path.join(__dirname, '../../../database.sql')
  const sql = fs.readFileSync(sqlPath, 'utf8')

  console.log('Connecting to PostgreSQL and initializing database...')

  const client = await pool.connect()
  try {
    await client.query(sql)
    console.log('✅ Database initialized successfully with sample data.')
  } catch (err) {
    console.error('❌ Error initializing database:', err)
  } finally {
    client.release()
    await pool.end()
  }
}

initDb()
