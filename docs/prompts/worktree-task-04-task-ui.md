# 独立开发提示词：任务 4 - 任务相关页面与组件

**复制下面整段「快速启动提示词」到新 Claude 窗口。前提：任务 3（task-api）已合并到 main。**

---

## 快速启动提示词（复制从这里开始）

```
项目路径：/Users/flw/work-task-tracker

请按「Git Worktree」流程完成 **任务 4：任务相关页面与组件**。**前提**：main 已包含任务 3（task-api）。UI 使用 shadcn/ui，参考 `prototype/index.html` 与 `docs/plans/task-loop-ui-components.md`。

### 一、Git 命令（在项目根目录执行）

```bash
cd /Users/flw/work-task-tracker
git checkout main
git pull origin main || true

git worktree add .worktrees/feature-task-ui -b feature/task-ui
cd .worktrees/feature-task-ui
npm install
```

### 二、任务要求

1. **规范**：遵循 `docs/ai-spec/00-project-context.md`、`01-code-conventions.md`、`02-m1-scope.md`；UI 一律 shadcn/ui + Tailwind，默认 Server Components，仅交互处使用 "use client"。
2. **页面与功能**：
   - **Dashboard**（`/dashboard`）：统计卡片（待办、进行中、本周到期、已逾期），点击卡片可跳转到对应筛选的任务列表；下方待办任务列表（表格或卡片）。
   - **任务列表**（`/tasks`）：筛选（状态、负责人、优先级、截止时间）、搜索、分页；使用 shadcn Table 或 Card；操作：详情、编辑、删除。
   - **任务详情**（`/tasks/[id]`）：任务信息、验收标准、更新记录时间线；按钮：编辑、更新进度。
   - **创建任务**（`/tasks/new`）：表单（标题、负责人、协作人、截止时间、优先级、验收标准）；负责人/协作人从 `/api/users` 或部门树选择。
   - **编辑任务**：复用创建表单逻辑，PATCH 更新。
   - **更新进度**（`/tasks/[id]/update` 或弹窗）：进度百分比、状态、阻塞说明、下一步行动、预计完成时间；POST `/api/tasks/[id]/updates`。
3. **数据**：所有数据来自已实现的 API（task-api）；列表按角色可见范围与筛选条件请求。
4. **验收**：与 task-api 联调通过；页面布局与交互参考 prototype；无 `any`；图片用 next/image。
5. **类型**：前端类型与 API 响应一致，可用 Prisma 生成类型或手写与 API 契约一致的 TypeScript 类型。

### 三、完成后的 Git 命令

在 **worktree 目录**（`.worktrees/feature-task-ui`）执行：

```bash
git add .
git status
git commit -m "feat(task-ui): dashboard, task list/detail/create/edit, progress update form"
git push origin feature/task-ui
```

完成后请告知：worktree 路径、分支名、以及「可合并到 main」的结论。不要在此窗口合并到 main。
```

---

## 复制到这里结束

---

- 合并顺序：任务 4 在任务 3 之后；可与任务 5（notifications）并行开发，合并顺序可 4→5 或 5→4。
- 删除 worktree（合并后）：`git worktree remove .worktrees/feature-task-ui`，`git branch -d feature/task-ui`。
