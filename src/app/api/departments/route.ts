import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { withAuth } from "@/lib/auth"
import { successSingle, serverError } from "@/lib/api/response"

interface DepartmentNode {
  id: string
  name: string
  parentId: string | null
  children: DepartmentNode[]
}

// GET /api/departments - Get department tree
export const GET = withAuth(async (request: NextRequest) => {
  try {
    // Get all departments
    const departments = await prisma.department.findMany({
      select: {
        id: true,
        name: true,
        parentId: true,
      },
      orderBy: { name: "asc" },
    })

    // Build tree structure
    const departmentMap = new Map<string, DepartmentNode>()
    const roots: DepartmentNode[] = []

    // First pass: create nodes
    for (const dept of departments) {
      departmentMap.set(dept.id, {
        id: dept.id,
        name: dept.name,
        parentId: dept.parentId,
        children: [],
      })
    }

    // Second pass: link children to parents
    for (const dept of departments) {
      const node = departmentMap.get(dept.id)!
      if (dept.parentId) {
        const parent = departmentMap.get(dept.parentId)
        if (parent) {
          parent.children.push(node)
        } else {
          // Parent not found, treat as root
          roots.push(node)
        }
      } else {
        roots.push(node)
      }
    }

    return successSingle(roots)
  } catch (error) {
    console.error("Failed to get departments:", error)
    return serverError("Failed to get departments")
  }
})
