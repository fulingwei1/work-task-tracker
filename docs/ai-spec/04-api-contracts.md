# M1 API 契约（AI 执行用）

所有接口需认证（Session）；未登录返回 401。权限按角色在中间件或 Route Handler 内校验。

## 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/auth/wechat | 发起企业微信 OAuth |
| GET | /api/auth/wechat/callback | OAuth 回调，写 Session |
| POST | /api/auth/logout | 登出 |
| GET | /api/auth/me | 当前用户信息 |

## 用户与组织

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/sync/organization | 手动同步企业微信通讯录（可选 M1） |
| GET | /api/users | 用户列表（query: q, departmentId） |
| GET | /api/departments | 部门树 |

## 任务

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/tasks | 创建任务；body: title, ownerId, collaboratorIds?, dueDate, priority, acceptanceCriteria? |
| GET | /api/tasks | 列表；query: status, ownerId, deptId, dueBefore, dueAfter, page, limit；按角色过滤 |
| GET | /api/tasks/[id] | 详情（含最新进度与更新记录） |
| PATCH | /api/tasks/[id] | 编辑任务 |
| DELETE | /api/tasks/[id] | 软删除 |
| PATCH | /api/tasks/[id]/status | 仅更新状态 |

## 进度更新

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/tasks/[id]/updates | 提交进度；body: progressPercent, status?, blockerType?, blockerDesc?, nextAction?, estimatedCompletion? |
| GET | /api/tasks/[id]/updates | 更新记录列表 |

## 通知

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/notifications | 当前用户通知列表；query: isRead, page, limit |
| PATCH | /api/notifications/[id]/read | 标记已读 |
| PATCH | /api/notifications/read-all | 全部已读 |

## 响应格式

- 列表：`{ data: T[]; meta: { total: number; page: number; limit: number } }`。
- 单条：`{ data: T }`。
- 错误：HTTP 4xx/5xx，body `{ error: string; code?: string }`。

## Server Actions（若用）

- 返回 `{ success: boolean; message: string }`，带数据时扩展字段。
