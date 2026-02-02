import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { withAuth } from "@/lib/auth"
import {
  successList,
  serverError,
  parsePagination,
} from "@/lib/api/response"
import { Prisma } from "@prisma/client"

// GET /api/users - List users with optional filtering
export const GET = withAuth(async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams
    const { page, limit, skip } = parsePagination(searchParams)

    // Build filter conditions
    const where: Prisma.UserWhereInput = {}

    // Search by name
    const q = searchParams.get("q")
    if (q && q.trim().length > 0) {
      where.name = {
        contains: q.trim(),
        mode: "insensitive",
      }
    }

    // Filter by department
    const departmentId = searchParams.get("departmentId")
    if (departmentId) {
      where.departmentId = departmentId
    }

    // Execute queries in parallel
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          role: true,
          departmentId: true,
          department: {
            select: { id: true, name: true },
          },
        },
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    return successList(users, { total, page, limit })
  } catch (error) {
    console.error("Failed to list users:", error)
    return serverError("Failed to list users")
  }
})
