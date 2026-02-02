# 并行开发计划（Git Worktree）

> 项目路径：`/Users/flw/work-task-tracker`  
> 使用 **Git Worktree** 在独立目录并行开发，最后按顺序合并到 `main`。

---

## 一、任务总览

| 序号 | 分支名 | 任务名称 | 优先级 | 依赖 | 可并行 |
|------|--------|----------|--------|------|--------|
| 1 | feature/foundation | 项目脚手架与布局 | P0 | 无 | — |
| 2 | feature/schema-auth | 数据模型与认证 | P0 | 1 | — |
| 3 | feature/task-api | 任务 CRUD 与进度 API | P0 | 2 | — |
| 4 | feature/task-ui | 任务相关页面与组件 | P0 | 3 | — |
| 5 | feature/notifications | 通知 API 与通知页 | P1 | 3 | 可与 4 并行 |
| 6 | feature/supervisory | 督办定时任务与通知创建 | P1 | 3, 5 | — |

---

## 二、依赖关系图

```
main
  │
  ├─ 1. foundation (Next.js + Prisma + shadcn + layout)
  │
  ├─ 2. schema-auth (Prisma schema + migrate + Auth/Mock)
  │
  ├─ 3. task-api (Tasks CRUD + TaskUpdates API)
  │
  ├─ 4. task-ui ──────────────┐
  │   (Dashboard + 任务列表/详情/创建/进度)   │
  │                            │
  ├─ 5. notifications ────────┤ 可并行
  │   (API + 通知页)            │
  │                            │
  └─ 6. supervisory (cron + 创建通知) ────────┘
```

**合并顺序**：1 → 2 → 3 → 4 → 5 → 6（或 4 与 5 顺序可调，6 必须在 5 之后）。

---

## 三、各任务说明

### 任务 1：foundation

- **产出**：Next.js 14 (App Router) + TypeScript、Prisma + PostgreSQL 连接、shadcn/ui 初始化、全局布局（侧栏 + 顶栏）、`.env.example`、`.gitignore`（含 `.worktrees`）。
- **验收**：`npm run build` 通过，`npm run dev` 可访问空白布局页。

### 任务 2：schema-auth

- **产出**：完整 Prisma schema（User、Department、Task、TaskUpdate、Notification、NotificationLog）、首次 migrate、认证：企业微信 OAuth 或 Mock Session、`/api/auth/*`、认证中间件（从 Session 取当前用户）。
- **验收**：migrate 成功；未登录访问受保护接口返回 401；登录后 `/api/auth/me` 返回当前用户。

### 任务 3：task-api

- **产出**：`/api/tasks` CRUD、`/api/tasks/[id]/updates`、`/api/users`、`/api/departments`；按角色过滤任务列表；软删除。
- **验收**：创建/列表/详情/编辑/删除/进度更新接口按 spec 工作；权限符合角色矩阵。

### 任务 4：task-ui

- **产出**：Dashboard（统计卡片 + 待办列表）、任务列表（筛选/分页）、任务详情、创建任务、编辑任务、更新进度表单；使用 shadcn/ui。
- **验收**：页面与 `docs/ai-spec` 及 `prototype/index.html` 行为一致；与 task-api 联调通过。

### 任务 5：notifications

- **产出**：`/api/notifications` 列表、已读、全部已读；任务分配时创建 TASK_ASSIGNED 通知；通知中心页面。
- **验收**：分配任务后产生通知；通知列表与已读状态正确。

### 任务 6：supervisory

- **产出**：node-cron 定时任务：扫描截止/逾期/长时间未更新；创建对应站内通知（TASK_DUE_SOON、TASK_OVERDUE、TASK_NO_UPDATE 等）；可选企业微信推送 Stub。
- **验收**：定时任务按规则创建通知；去重规则（如 24h 内同任务同类型不重复）生效。

---

## 四、Worktree 与合并流程

### 第一步：主窗口生成提示词

- 已在本仓库 `docs/prompts/` 下为每个任务生成「独立开发提示词」。
- 每个提示词包含：任务说明、规范引用、**完整 Git 命令**（创建 worktree → 开发 → 提交 → 可选 push）。

### 第二步：新窗口并行开发

- 打开新 Cursor/Claude 窗口，**将工作区切换到对应 worktree 路径**（例如 `.worktrees/feature-task-api`）。
- 复制对应 `docs/prompts/worktree-task-XX-*.md` 中的提示词，粘贴到新窗口执行。
- 在该窗口内完成开发、自测、提交；不在此窗口合并其他分支。

### 第三步：主窗口按顺序合并

在**主仓库**（`/Users/flw/work-task-tracker`）执行：

```bash
git checkout main
git pull origin main   # 如有远程

# 按顺序合并
git merge feature/foundation --no-ff -m "Merge feature/foundation: project scaffold and layout"
git merge feature/schema-auth --no-ff -m "Merge feature/schema-auth: schema and auth"
git merge feature/task-api --no-ff -m "Merge feature/task-api: task CRUD and updates API"
git merge feature/task-ui --no-ff -m "Merge feature/task-ui: task pages and components"
git merge feature/notifications --no-ff -m "Merge feature/notifications: notifications API and page"
git merge feature/supervisory --no-ff -m "Merge feature/supervisory: supervisory cron and notifications"
```

合并后可选：删除已合并的 worktree 与分支（见各提示词末尾）。

---

## 五、规范与提示词位置

- **AI 规范**：`docs/ai-spec/`（README、项目上下文、代码规范、M1 范围、数据模型、API 契约）。
- **独立开发提示词**：`docs/prompts/worktree-task-01-foundation.md` … `worktree-task-06-supervisory.md`。
- **设计参考**：`docs/plans/2026-02-01-task-loop-system-design.md`、`docs/plans/task-loop-ui-components.md`、`prototype/index.html`。
