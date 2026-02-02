# 主窗口一次性快速启动提示词

**用法**：复制下面「从这里开始」到「到这里结束」之间的整段内容，粘贴到 **主窗口** 的新 Claude 对话中执行。AI 将自动完成：分析项目 → 生成/更新规范文档 → 拆分任务 → 输出 6 个独立开发提示词。

---

## 从这里开始（整段复制）

```
项目路径：/Users/flw/work-task-tracker

请按以下流程在 **主窗口** 完成一次性规划，无需切换 Worktree：

---

### 第一步：分析项目

- 扫描项目根目录、docs/、prototype/ 等结构。
- 阅读 docs/plans/ 下已有设计文档（技术设计、UI 组件、UI/UX 规范）。
- 总结：项目名称、技术栈（M1）、当前状态（仅有设计/原型还是已有代码）、M1 功能范围。

---

### 第二步：生成/更新 AI 规范文档

- 在 **docs/ai-spec/** 下维护或创建：
  - **README.md**：本目录索引与使用说明。
  - **00-project-context.md**：项目绝对路径、技术栈、目录结构、.env.example 占位、Worktree 约定（.worktrees/）。
  - **01-code-conventions.md**：代码风格、命名、禁止 any、Prisma 类型、Server Actions 返回格式、UI 用 shadcn/ui。
  - **02-m1-scope.md**：M1 包含/不包含、角色与可见范围、验收标准。
  - **03-data-model.md**：Prisma 模型摘要、枚举、关系、索引建议。
  - **04-api-contracts.md**：M1 API 路径、方法、请求/响应格式、权限。
- 要求：结构化、无歧义、AI 可直接执行；与 docs/plans/ 设计文档一致，冲突时以实施层为准。

---

### 第三步：拆分任务并更新并行开发计划

- 在 **docs/parallel-dev-plan.md** 中维护：
  - 任务总览表：序号、分支名、任务名称、优先级、依赖、可并行关系。
  - 依赖关系图（文本示意）。
  - 各任务简短说明与验收标准。
  - **合并顺序**（如 1→2→3→4→5→6）。
  - Worktree 与合并流程：主窗口生成提示词 → 新窗口并行开发 → 主窗口按顺序合并。
- 任务拆分建议（可调整）：
  1. foundation：Next.js + Prisma + shadcn + 布局、.gitignore 含 .worktrees
  2. schema-auth：Prisma schema + migrate + 认证（含 Mock）
  3. task-api：任务 CRUD、进度更新、用户/部门 API，按角色过滤
  4. task-ui：Dashboard、任务列表/详情/创建/编辑、更新进度表单
  5. notifications：通知 API、通知页、任务分配时创建通知
  6. supervisory：督办定时任务、创建到期/逾期/未更新等通知、去重

---

### 第四步：生成 6 个独立开发提示词

- 在 **docs/prompts/** 下维护或创建：
  - **00-quick-start.md**：总览、流程说明、提示词文件列表、项目路径与 .worktrees 约定。
  - **worktree-task-01-foundation.md** … **worktree-task-06-supervisory.md**：每个任务一份独立提示词。
- 每个任务提示词必须包含：
  1. **项目路径**：/Users/flw/work-task-tracker
  2. **前提**：该任务依赖哪些分支已合并到 main
  3. **完整 Git 命令**：
     - 在项目根：cd 到仓库、确保 .worktrees 在 .gitignore、`git worktree add .worktrees/<name> -b feature/<branch>`、`cd .worktrees/<name>`、必要时 `npm install`
     - 完成后在 worktree 目录：`git add .`、`git commit -m "feat(scope): 简短描述"`、`git push origin feature/<branch>`
  4. **任务要求**：遵循 docs/ai-spec/ 哪些文件、产出物、验收标准、禁止 any 等
  5. **明确说明**：不要在此窗口合并到 main；合并由主窗口按 docs/parallel-dev-plan.md 顺序执行
  6. **可选**：合并后删除 worktree 与分支的命令
- 要求：每个提示词 **完整独立**，复制到新 Claude 窗口即可执行，无需再补充上下文。

---

### 第五步：确认 .gitignore

- 若项目根尚无 .gitignore，或其中没有 .worktrees，则创建/更新 .gitignore，加入 .worktrees、.env*.local、node_modules 等常见项。

---

请按上述五步依次执行，并输出简短总结：已更新/创建的文件列表、任务与合并顺序、以及「主窗口一次性规划完成，可到 docs/prompts/ 复制各任务提示词到新窗口并行开发」的结论。
```

---

## 到这里结束

---

使用后，各任务的独立提示词在 `docs/prompts/worktree-task-01-foundation.md` … `worktree-task-06-supervisory.md`，按 `docs/parallel-dev-plan.md` 的合并顺序在新窗口执行即可。
