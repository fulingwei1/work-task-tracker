# 项目上下文（AI 执行用）

## 项目路径

- **绝对路径**：`/Users/flw/work-task-tracker`
- **仓库根**：即上述路径；所有 Git 与 Worktree 操作均以此为基准。

## 技术栈（M1）

| 层级 | 技术 | 说明 |
|------|------|------|
| 框架 | Next.js 14 (App Router) | 全栈 TypeScript |
| UI | shadcn/ui + Tailwind CSS | 禁止 Ant Design；优先复用现有组件 |
| 数据库 | PostgreSQL | 本地或远程均可 |
| ORM | Prisma | 类型与迁移均用 Prisma |
| 认证 | 企业微信 OAuth 2.0 | M1 可先用 Mock Session 开发 |
| 定时任务 | node-cron | 督办扫描、通知发送 |

## 目录结构（目标）

```
work-task-tracker/
├── .env.local              # 本地环境变量（不提交）
├── .env.example            # 示例环境变量
├── .gitignore              # 必须包含 .worktrees/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── tasks/
│   │   └── notifications/
│   ├── components/
│   │   ├── layout/
│   │   ├── task/
│   │   └── ui/              # shadcn
│   ├── lib/
│   │   ├── db.ts
│   │   ├── auth.ts
│   │   └── api.ts
│   └── types/
├── docs/
│   ├── ai-spec/            # 本目录
│   ├── plans/
│   └── prompts/
└── prototype/              # 静态 HTML 原型，可参考样式与交互
```

## 环境变量（.env.example）

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/work_task_tracker"

# WeChat Work (OAuth)
WECHAT_CORP_ID=""
WECHAT_AGENT_ID=""
WECHAT_SECRET=""
WECHAT_OAUTH_REDIRECT_URI="http://localhost:3000/api/auth/wechat/callback"

# App
NEXTAUTH_SECRET="generate-a-random-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Worktree 约定

- **Worktree 根目录**：`.worktrees/<branch-name>`（项目本地）。
- 创建 Worktree 前必须确认 `.worktrees` 已写入 `.gitignore`。
- 分支命名：`feature/<short-name>`，例如 `feature/foundation`、`feature/task-api`。
