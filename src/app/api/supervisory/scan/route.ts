import { NextRequest, NextResponse } from "next/server"
import { withRole } from "@/lib/auth"
import { runSupervisoryScan } from "@/lib/supervisory"
import { initializeSupervisoryCron, isCronInitialized } from "@/lib/supervisory/cron"
import { serverError, successSingle } from "@/lib/api/response"

// Initialize cron on first API request (for environments with persistent processes)
// This is a fallback - prefer initializing in a custom server entry point
if (typeof window === "undefined") {
  initializeSupervisoryCron()
}

// POST /api/supervisory/scan - Manually trigger supervisory scan (Admin only)
export const POST = withRole(["ADMIN", "CEO", "DIRECTOR"], async () => {
  try {
    const result = await runSupervisoryScan()

    return successSingle({
      message: "Supervisory scan completed",
      ...result,
      cronInitialized: isCronInitialized(),
    })
  } catch (error) {
    console.error("Supervisory scan failed:", error)
    return serverError("Failed to run supervisory scan")
  }
})

// GET /api/supervisory/scan - Get cron status
export const GET = withRole(["ADMIN", "CEO", "DIRECTOR"], async () => {
  return successSingle({
    cronInitialized: isCronInitialized(),
    scheduledTimes: ["09:00", "10:00", "14:00"],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  })
})
