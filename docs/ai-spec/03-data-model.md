# 数据模型摘要（AI 执行用）

Prisma 实现以本摘要与 `docs/plans/2026-02-01-task-loop-system-design.md` 第三节为准。

## 枚举

```prisma
enum UserRole { STAFF MANAGER DIRECTOR CEO ADMIN }
enum TaskStatus { NOT_STARTED IN_PROGRESS PENDING_REVIEW COMPLETED BLOCKED CANCELLED }
enum TaskPriority { P1 P2 P3 }
enum TaskSource { MANUAL MEETING PLAN }
enum NotificationType { TASK_ASSIGNED TASK_DUE_SOON TASK_OVERDUE TASK_NO_UPDATE TASK_BLOCKED TASK_STATUS_CHANGED }
```

## 核心模型（M1 必选）

- **User**：id, wxUserId, name, departmentId, role, createdAt, updatedAt。
- **Department**：id, wxDeptId, name, parentId。
- **Task**：id, title, ownerId, collaboratorIds (JSON/String[]), status, priority, dueDate, acceptanceCriteria, source, sourceMeetingId?, sourcePlanId?, sourcePlanItemId?, createdBy, createdAt, updatedAt, deletedAt?。
- **TaskUpdate**：id, taskId, userId, progressPercent, status, blockerType?, blockerDesc?, nextAction?, estimatedCompletion?, createdAt。
- **Notification**：id, userId, type, title, content, taskId?, isRead, createdAt。
- **NotificationLog**（可选，用于去重）：id, taskId, triggerType, channel (WECHAT/IN_APP), sentAt。

## 关系

- User belongsTo Department (departmentId)。
- Task belongsTo User (ownerId, createdBy)；Task hasMany TaskUpdate；Task 软删除用 deletedAt。
- Notification belongsTo User (userId)；可选 taskId。

## 索引建议

- Task: (ownerId), (status), (dueDate), (deletedAt)。
- TaskUpdate: (taskId)。
- Notification: (userId), (isRead)。

## 说明

- 主键统一用 `id String @id @default(cuid())` 或 `@default(uuid())`。
- 时间字段用 `DateTime`。
- collaboratorIds 可用 `String[]` 或 Json；查询时按需过滤。
