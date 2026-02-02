# 独立开发提示词：任务 5 - 通知 API 与通知页

**复制下面整段「快速启动提示词」到新 Claude 窗口。前提：任务 3（task-api）已合并到 main；可与任务 4 并行开发。**

---

## 快速启动提示词（复制从这里开始）

```
项目路径：/Users/flw/work-task-tracker

请按「Git Worktree」流程完成 **任务 5：通知 API 与通知页**。**前提**：main 已包含任务 3（task-api）。可与任务 4（task-ui）并行开发，分支从 main 拉取即可。

### 一、Git 命令（在项目根目录执行）

```bash
cd /Users/flw/work-task-tracker
git checkout main
git pull origin main || true

git worktree add .worktrees/feature-notifications -b feature/notifications
cd .worktrees/feature-notifications
npm install
```

### 二、任务要求

1. **规范**：遵循 `docs/ai-spec/`（重点：`02-m1-scope.md`、`04-api-contracts.md`、`01-code-conventions.md`）。
2. **API**：
   - `GET /api/notifications`：当前用户通知列表，query 支持 isRead、page、limit；返回 `{ data, meta }`。
   - `PATCH /api/notifications/[id]/read`：标记单条已读。
   - `PATCH /api/notifications/read-all`：全部标记已读。
   - 在 **创建任务** 或 **分配负责人** 时，创建一条 `TASK_ASSIGNED` 类型的 Notification，接收人为 owner（若为新建则 owner 即被分配人）。
3. **通知页**：
   - 页面路径：`/notifications`（或与现有布局中的「通知中心」一致）。
   - 列表展示：类型、标题、内容、是否已读、时间；支持「全部已读」；点击单条可标记已读并可选跳转关联任务。
   - 使用 shadcn/ui 组件。
4. **验收**：分配/创建任务后，负责人收到 TASK_ASSIGNED 通知；通知列表与已读状态正确；无 `any`。
5. **数据**：Notification 模型已在任务 2 的 schema 中；若尚未包含 NotificationLog，本任务可不实现推送去重表，留给任务 6。

### 三、完成后的 Git 命令

在 **worktree 目录**（`.worktrees/feature-notifications`）执行：

```bash
git add .
git status
git commit -m "feat(notifications): notifications API, mark read, TASK_ASSIGNED on task create/assign"
git push origin feature/notifications
```

完成后请告知：worktree 路径、分支名、以及「可合并到 main」的结论。不要在此窗口合并到 main。
```

---

## 复制到这里结束

---

- 合并顺序：任务 5 在任务 3 之后；可与任务 4 互换合并顺序；任务 6 必须在任务 5 之后。
- 删除 worktree（合并后）：`git worktree remove .worktrees/feature-notifications`，`git branch -d feature/notifications`。
