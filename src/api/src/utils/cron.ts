import cron from 'node-cron'
import { TransactionService } from '../services/transaction.service'

export class CronScheduler {
  private static isInitialized = false

  static initialize() {
    if (this.isInitialized) {
      return
    }

    // Run every 5 minutes to check for expired transactions
    // Nomor 2-C: Automatic Status Changes - expire after 2 hours
    cron.schedule('*/5 * * * *', async () => {
      console.log('[CRON] Checking for expired transactions...')
      try {
        const result = await TransactionService.expireOldTransactions()
        if (result.expiredCount > 0) {
          console.log(`[CRON] Expired ${result.expiredCount} transactions`)
        }
      } catch (error) {
        console.error('[CRON] Error expiring transactions:', error)
      }
    })

    // Run every hour to check for unconfirmed transactions
    // Nomor 2-C: Auto cancel if organizer doesn't confirm within 3 days
    cron.schedule('0 * * * *', async () => {
      console.log('[CRON] Checking for unconfirmed transactions...')
      try {
        const result = await TransactionService.cancelUnconfirmedTransactions()
        if (result.cancelledCount > 0) {
          console.log(`[CRON] Auto-cancelled ${result.cancelledCount} unconfirmed transactions`)
        }
      } catch (error) {
        console.error('[CRON] Error cancelling unconfirmed transactions:', error)
      }
    })

    this.isInitialized = true
    console.log('[CRON] Scheduler initialized successfully')
  }
}
