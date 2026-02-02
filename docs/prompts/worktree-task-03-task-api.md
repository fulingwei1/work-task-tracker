# 独立开发提示词：任务 3 - 任务 CRUD 与进度 API

**复制下面整段「快速启动提示词」到新 Claude 窗口。前提：任务 2（schema-auth）已合并到 main。**

---

## 快速启动提示词（复制从这里开始）

```
项目路径：/Users/flw/work-task-tracker

请按「Git Worktree」流程完成 **任务 3：任务 CRUD 与进度 API**。**前提**：main 已包含任务 2（schema-auth）。

### 一、Git 命令（在项目根目录执行）

```bash
cd /Users/flw/work-task-tracker
git checkout main
git pull origin main || true

git worktree add .worktrees/feature-task-api -b feature/task-api
cd .worktrees/feature-task-api
npm install
```

### 二、任务要求

1. **规范**：遵循 `docs/ai-spec/`（重点：`02-m1-scope.md`、`03-data-model.md`、`04-api-contracts.md`、`01-code-conventions.md`）。
2. **API 实现**：
   - **任务**：`POST /api/tasks`、`GET /api/tasks`（query: status, ownerId, deptId, dueBefore, dueAfter, page, limit）、`GET /api/tasks/[id]`、`PATCH /api/tasks/[id]`、`DELETE /api/tasks/[id]`（软删除）、`PATCH /api/tasks/[id]/status`。
   - **进度更新**：`POST /api/tasks/[id]/updates`、`GET /api/tasks/[id]/updates`。
   - **组织**：`GET /api/users`、`GET /api/departments`。
   - 列表按当前用户角色过滤可见范围（STAFF=自己，MANAGER=部门，DIRECTOR/CEO/ADMIN=全部）。
   - 响应格式：列表为 `{ data, meta: { total, page, limit } }`；单条为 `{ data }`；错误为 4xx/5xx + `{ error, code? }`。
3. **权限**：创建任务时员工只能给自己；主管可指派下属；超管可指派任何人。编辑/删除按设计文档权限矩阵。
4. **验收**：上述接口按 spec 工作；权限与角色矩阵一致；软删除后列表不包含已删除任务。
5. **禁止**：使用 `any`；偏离 Prisma 类型。

### 三、完成后的 Git 命令

在 **worktree 目录**（`.worktrees/feature-task-api`）执行：

```bash
git add .
git status
git commit -m "feat(task-api): task CRUD, updates API, users/departments, role-based visibility"
git push origin feature/task-api
```

完成后请告知：worktree 路径、分支名、以及「可合并到 main」的结论。不要在此窗口合并到 main。
```

---

## 复制到这里结束

---

- 合并顺序：任务 3 在任务 2 之后合并。
- 删除 worktree（合并后）：`git worktree remove .worktrees/feature-task-api`，`git branch -d feature/task-api`。
