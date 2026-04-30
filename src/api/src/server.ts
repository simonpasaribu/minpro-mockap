import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import routes from './routes'
import { CronScheduler } from './utils/cron'
import { verifyEmailConfig } from './utils/email'

const app = express()
const PORT = process.env.PORT || 3001

// Initialize cron jobs for auto-expiring transactions
CronScheduler.initialize()

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api', routes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  })
})

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  })
})

app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  
  // Verify email configuration
  const emailReady = await verifyEmailConfig()
  if (emailReady) {
    console.log('✅ Email server is ready to send emails')
  } else {
    console.log('⚠️ Email server not configured. Email notifications will be skipped.')
  }
})

export default app
