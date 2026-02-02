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

## 部署说明

### 督办定时任务

督办系统使用 `node-cron` 在固定时间执行扫描任务：
- 09:00 - 扫描截止日期，触发提醒
- 10:00 - 扫描逾期任务，通知升级
- 14:00 - 扫描长时间未更新的任务

**重要**：`node-cron` 需要常驻进程才能正常执行。

#### 部署方式

1. **自有服务器（推荐）**
   - 使用 `next start` 或 PM2 运行 Next.js 生产版本
   - 确保进程持续运行（可使用 systemd 或 supervisor）
   - 示例：`pm2 start npm --name "task-tracker" -- start`

2. **Docker 容器**
   - 使用 `node server.js` 或 `next start` 作为入口
   - 确保容器不会因为空闲而被回收

3. **Vercel / Serverless（不推荐）**
   - Vercel 的 serverless 函数无常驻进程，cron 无法自动执行
   - 需配合外部调度服务（如 Vercel Cron、GitHub Actions）定时调用 `/api/supervisory/scan` 接口

#### 手动触发

管理员可通过 API 手动触发督办扫描：
```bash
POST /api/supervisory/scan
```

查看 cron 状态：
```bash
GET /api/supervisory/scan
```
