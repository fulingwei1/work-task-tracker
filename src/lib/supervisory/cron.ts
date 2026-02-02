import cron from "node-cron"
import { runSupervisoryScan } from "./index"

let isInitialized = false

/**
 * Schedule supervisory scans
 *
 * Per spec (section 7.2):
 * - 9:00 AM - Scan due dates, trigger reminders
 * - 10:00 AM - Scan overdue tasks, escalate notifications
 * - 14:00 PM - Scan long-stale tasks
 *
 * For simplicity, we run all scans at each scheduled time.
 */
export function initializeSupervisoryCron(): void {
  if (isInitialized) {
    console.log("[Supervisory Cron] Already initialized, skipping")
    return
  }

  // 9:00 AM daily
  cron.schedule("0 9 * * *", async () => {
    console.log("[Supervisory Cron] Running 9:00 AM scan")
    try {
      await runSupervisoryScan()
    } catch (error) {
      console.error("[Supervisory Cron] 9:00 AM scan failed:", error)
    }
  })

  // 10:00 AM daily
  cron.schedule("0 10 * * *", async () => {
    console.log("[Supervisory Cron] Running 10:00 AM scan")
    try {
      await runSupervisoryScan()
    } catch (error) {
      console.error("[Supervisory Cron] 10:00 AM scan failed:", error)
    }
  })

  // 2:00 PM daily
  cron.schedule("0 14 * * *", async () => {
    console.log("[Supervisory Cron] Running 2:00 PM scan")
    try {
      await runSupervisoryScan()
    } catch (error) {
      console.error("[Supervisory Cron] 2:00 PM scan failed:", error)
    }
  })

  isInitialized = true
  console.log("[Supervisory Cron] Initialized - scheduled at 9:00, 10:00, 14:00")
}

/**
 * Check if cron is initialized
 */
export function isCronInitialized(): boolean {
  return isInitialized
}
