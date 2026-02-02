import { UserRole } from "@prisma/client"
import type { SessionUser } from "@/lib/auth"
import { prisma } from "@/lib/db"

/**
 * Get task visibility filter based on user role:
 * - STAFF: only their own tasks
 * - MANAGER: their department's tasks
 * - DIRECTOR/CEO/ADMIN: all tasks
 */
export function getTaskVisibilityFilter(user: SessionUser): {
  ownerId?: string
  owner?: { departmentId: string | null }
} | undefined {
  switch (user.role) {
    case UserRole.STAFF:
      return { ownerId: user.id }
    case UserRole.MANAGER:
      return { owner: { departmentId: user.departmentId } }
    case UserRole.DIRECTOR:
    case UserRole.CEO:
    case UserRole.ADMIN:
      return undefined // No filter - can see all tasks
    default:
      return { ownerId: user.id } // Fallback to own tasks only
  }
}

/**
 * Check if user can assign task to a target user:
 * - STAFF: can only assign to self
 * - MANAGER: can assign to users in their department
 * - DIRECTOR/CEO/ADMIN: can assign to anyone
 */
export async function canAssignTaskTo(
  assigner: SessionUser,
  targetUserId: string
): Promise<boolean> {
  // Staff can only assign to themselves
  if (assigner.role === UserRole.STAFF) {
    return assigner.id === targetUserId
  }

  // DIRECTOR/CEO/ADMIN can assign to anyone
  if (
    assigner.role === UserRole.DIRECTOR ||
    assigner.role === UserRole.CEO ||
    assigner.role === UserRole.ADMIN
  ) {
    return true
  }

  // MANAGER can assign to users in their department
  if (assigner.role === UserRole.MANAGER) {
    // If assigning to self, always allow
    if (assigner.id === targetUserId) {
      return true
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { departmentId: true },
    })

    if (!targetUser) {
      return false
    }

    return targetUser.departmentId === assigner.departmentId
  }

  return false
}

/**
 * Check if user can view a specific task:
 * - STAFF: only their own tasks
 * - MANAGER: their department's tasks
 * - DIRECTOR/CEO/ADMIN: all tasks
 */
export async function canViewTask(
  user: SessionUser,
  taskOwnerId: string,
  taskOwnerDeptId: string | null
): Promise<boolean> {
  switch (user.role) {
    case UserRole.STAFF:
      return user.id === taskOwnerId
    case UserRole.MANAGER:
      return user.departmentId === taskOwnerDeptId
    case UserRole.DIRECTOR:
    case UserRole.CEO:
    case UserRole.ADMIN:
      return true
    default:
      return false
  }
}

/**
 * Check if user can edit a specific task:
 * - Task owner can always edit
 * - Task creator can edit
 * - MANAGER can edit department tasks
 * - DIRECTOR/CEO/ADMIN can edit all tasks
 */
export async function canEditTask(
  user: SessionUser,
  task: { ownerId: string; createdBy: string; owner: { departmentId: string | null } }
): Promise<boolean> {
  // Owner and creator can always edit
  if (task.ownerId === user.id || task.createdBy === user.id) {
    return true
  }

  // Role-based permissions
  switch (user.role) {
    case UserRole.MANAGER:
      return task.owner.departmentId === user.departmentId
    case UserRole.DIRECTOR:
    case UserRole.CEO:
    case UserRole.ADMIN:
      return true
    default:
      return false
  }
}

/**
 * Check if user can delete a specific task:
 * Same rules as edit
 */
export const canDeleteTask = canEditTask
