# 独立开发提示词：任务 1 - 项目脚手架与布局

**复制下面整段「快速启动提示词」到新 Claude 窗口，在项目仓库根目录或新 Worktree 中执行。**

---

## 快速启动提示词（复制从这里开始）

```
项目路径：/Users/flw/work-task-tracker

请按「Git Worktree」流程完成 **任务 1：项目脚手架与布局**。

### 一、Git 命令（在项目根目录执行）

若当前不在 worktree 中，请先创建 worktree 并进入：

```bash
cd /Users/flw/work-task-tracker

# 确保 .worktrees 被忽略（若没有则添加并提交）
echo ".worktrees" >> .gitignore
git add .gitignore && git commit -m "chore: ignore .worktrees directory" || true

# 创建 worktree 与分支
git worktree add .worktrees/feature-foundation -b feature/foundation
cd .worktrees/feature-foundation
```

### 二、任务要求

1. **规范**：严格遵循 `docs/ai-spec/` 下文档（优先读 `00-project-context.md`、`01-code-conventions.md`）。
2. **产出**：
   - Next.js 14 (App Router) + TypeScript 项目初始化。
   - Prisma 初始化 + PostgreSQL 连接配置（`DATABASE_URL` 在 `.env.example` 中说明）。
   - 安装并初始化 shadcn/ui（Tailwind 已包含），不做额外自定义样式堆砌。
   - 全局布局：侧栏 + 顶栏（参考 `prototype/index.html` 结构），占位导航项即可。
   - 根路径 `/` 可重定向到 `/dashboard` 或直接展示简单 Dashboard 占位页。
   - 创建 `.env.example`（含 `DATABASE_URL`、`NEXTAUTH_SECRET`、`NEXT_PUBLIC_APP_URL` 等占位）。
   - 确保 `.gitignore` 含 `.env*.local`、`node_modules`、`.worktrees`。
3. **验收**：在 worktree 目录执行 `npm run build` 通过；`npm run dev` 可访问带布局的页面。

### 三、完成后的 Git 命令

在 **worktree 目录**（`.worktrees/feature-foundation`）执行：

```bash
git add .
git status
git commit -m "feat(foundation): Next.js 14 + Prisma + shadcn/ui + layout"
git push origin feature/foundation
```

完成后请告知：worktree 路径、分支名、以及「可合并到 main」的结论。不要在此窗口合并到 main，合并将在主窗口按 `docs/parallel-dev-plan.md` 顺序进行。
```

---

## 复制到这里结束

---

- 合并顺序：见 `docs/parallel-dev-plan.md` 第四节；任务 1 为第一个合并入 main 的分支。
- 若需删除 worktree（合并后）：`git worktree remove .worktrees/feature-foundation`，`git branch -d feature/foundation`。
