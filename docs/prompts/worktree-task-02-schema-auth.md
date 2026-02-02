# 独立开发提示词：任务 2 - 数据模型与认证

**复制下面整段「快速启动提示词」到新 Claude 窗口，在项目仓库根目录或新 Worktree 中执行。前提：任务 1（foundation）已合并到 main。**

---

## 快速启动提示词（复制从这里开始）

```
项目路径：/Users/flw/work-task-tracker

请按「Git Worktree」流程完成 **任务 2：数据模型与认证**。**前提**：main 已包含任务 1（foundation）的代码。

### 一、Git 命令（在项目根目录执行）

```bash
cd /Users/flw/work-task-tracker
git checkout main
git pull origin main || true

# 从 main 创建 worktree 与分支
git worktree add .worktrees/feature-schema-auth -b feature/schema-auth
cd .worktrees/feature-schema-auth
npm install
```

### 二、任务要求

1. **规范**：遵循 `docs/ai-spec/`（重点：`02-m1-scope.md`、`03-data-model.md`、`04-api-contracts.md`）。
2. **数据模型**：
   - 在 `prisma/schema.prisma` 中实现 M1 所需模型：User、Department、Task、TaskUpdate、Notification、NotificationLog（枚举与字段见 `03-data-model.md`）。
   - 执行 `npx prisma migrate dev --name m1_schema` 生成迁移。
3. **认证**：
   - 实现 `/api/auth/wechat`、`/api/auth/wechat/callback`、`/api/auth/logout`、`/api/auth/me`。
   - M1 允许使用 **Mock Session**（例如基于 cookie 的假登录，写死一个测试用户），以便后续替换为企业微信 OAuth。
   - 实现认证中间件/工具：未登录请求受保护接口返回 401；可从 Session 获取当前用户。
4. **验收**：migrate 成功；未登录访问 `/api/auth/me` 或受保护 API 返回 401；Mock 登录后 `/api/auth/me` 返回当前用户信息。
5. **代码风格**：遵守 `01-code-conventions.md`（无 any、Prisma 类型、Server Actions 若用则返回 `{ success, message }`）。

### 三、完成后的 Git 命令

在 **worktree 目录**（`.worktrees/feature-schema-auth`）执行：

```bash
git add .
git status
git commit -m "feat(schema-auth): Prisma M1 schema + auth API and mock session"
git push origin feature/schema-auth
```

完成后请告知：worktree 路径、分支名、以及「可合并到 main」的结论。不要在此窗口合并到 main。
```

---

## 复制到这里结束

---

- 合并顺序：任务 2 在 main 上于任务 1 之后合并。
- 若需删除 worktree（合并后）：`git worktree remove .worktrees/feature-schema-auth`，`git branch -d feature/schema-auth`。
