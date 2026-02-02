# 生产环境数据库配置指南

## 方案一：Vercel + Vercel Postgres（推荐）

### 1. 创建 Vercel Postgres 数据库

```bash
# 安装 Vercel CLI（如未安装）
npm i -g vercel

# 登录 Vercel
vercel login

# 在项目目录下
vercel link

# 创建 Postgres 数据库
vercel postgres create
```

或者在 Vercel Dashboard 中：
1. 进入项目 → Storage 标签
2. 点击 "Create Database" → 选择 "Postgres"
3. 选择区域（建议选离你用户最近的）

### 2. 连接数据库到项目

Vercel 会自动添加环境变量到项目：
- `POSTGRES_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_PRISMA_URL`

### 3. 更新 Prisma 配置

修改 `prisma/schema.prisma`：

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("POSTGRES_PRISMA_URL")      // 连接池 URL
  directUrl = env("POSTGRES_URL_NON_POOLING") // 迁移用直连
}
```

### 4. 配置环境变量

本地 `.env.local`：

```bash
# Vercel Postgres（开发时使用相同的变量名）
POSTGRES_PRISMA_URL="postgresql://..."
POSTGRES_URL_NON_POOLING="postgresql://..."

# 其他配置保持不变
NEXTAUTH_SECRET="your-production-secret"
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
```

### 5. 执行数据库迁移

```bash
# 生成本地迁移文件
npx prisma migrate dev --name init

# 部署到生产数据库
npx prisma migrate deploy
```

---

## 方案二：Neon Serverless Postgres（免费额度高）

### 1. 创建 Neon 账户和数据库

1. 访问 https://neon.tech
2. 创建项目 → 选择区域（如 Singapore / Asia）
3. 复制连接字符串

### 2. 配置环境变量

```bash
# .env.local 或 Vercel Environment Variables
DATABASE_URL="postgresql://username:password@ep-xxx.ap-southeast-1.aws.neon.tech/dbname?sslmode=require"
```

### 3. 更新 Prisma Schema（连接池优化）

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]  // 可选，用于 edge runtime
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 4. 执行迁移

```bash
npx prisma migrate deploy
```

---

## 方案三：自建服务器 + PostgreSQL

### 1. 安装 PostgreSQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# 启动服务
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. 创建数据库和用户

```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE work_task_tracker;
CREATE USER tasktracker WITH ENCRYPTED PASSWORD 'your-strong-password';
GRANT ALL PRIVILEGES ON DATABASE work_task_tracker TO tasktracker;

-- Prisma 迁移需要额外权限
ALTER USER tasktracker WITH SUPERUSER;
-- 或者更安全的做法：
-- GRANT CREATE ON SCHEMA public TO tasktracker;
```

### 3. 配置远程访问（如需要）

编辑 `/etc/postgresql/16/main/postgresql.conf`：
```
listen_addresses = '*'
```

编辑 `/etc/postgresql/16/main/pg_hba.conf`：
```
# 允许特定 IP
host    all             all             your-server-ip/32       scram-sha-256
# 或允许所有（不推荐用于生产）
# host    all             all             0.0.0.0/0               scram-sha-256
```

```bash
sudo systemctl restart postgresql
```

### 4. 配置环境变量

```bash
DATABASE_URL="postgresql://tasktracker:your-strong-password@your-server-ip:5432/work_task_tracker?schema=public"
```

---

## 方案四：阿里云/腾讯云 RDS PostgreSQL

### 1. 创建 RDS 实例

- 登录云控制台
- 创建 PostgreSQL 实例
- 选择版本：14 或 15
- 配置网络：公网访问（或内网 + VPN）

### 2. 创建数据库和用户

在 RDS 控制台或连接后执行：

```sql
CREATE DATABASE work_task_tracker;
CREATE USER tasktracker WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE work_task_tracker TO tasktracker;
```

### 3. 配置白名单

将 Vercel/你的服务器 IP 加入 RDS 白名单。

Vercel 的 IP 范围可能会变化，建议使用代理或使用 Vercel Postgres。

### 4. 环境变量

```bash
DATABASE_URL="postgresql://tasktracker:password@xxx.rds.aliyuncs.com:5432/work_task_tracker?sslmode=require"
```

---

## 部署检查清单

### 部署前

- [ ] 数据库已创建并可连接
- [ ] 环境变量已配置到生产环境
- [ ] Prisma Client 已生成：`npx prisma generate`
- [ ] 数据库迁移已执行：`npx prisma migrate deploy`

### 部署命令

```bash
# 1. 生成本地迁移（开发环境）
npx prisma migrate dev --name add_xx_feature

# 2. 生成 Prisma Client
npx prisma generate

# 3. 构建项目
npm run build

# 4. 部署到 Vercel
vercel --prod
```

---

## 生产环境环境变量配置

在 Vercel Dashboard 或服务器上配置：

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `DATABASE_URL` | 数据库连接字符串 | `postgresql://...` |
| `NEXTAUTH_SECRET` | 加密密钥 | `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | 应用域名 | `https://your-app.vercel.app` |
| `WECHAT_CORP_ID` | 企业微信 CorpID | `wwxxxxxxxxxxxxxxxx` |
| `WECHAT_AGENT_ID` | 应用 AgentID | `1000002` |
| `WECHAT_SECRET` | 应用 Secret | `xxxxxxxx...` |
| `WECHAT_OAUTH_REDIRECT_URI` | OAuth 回调地址 | `https://your-app.vercel.app/api/auth/wechat/callback` |

---

## 故障排查

### 连接超时
- 检查防火墙/安全组规则
- 确认数据库允许外部连接
- 使用 SSL 模式：`?sslmode=require`

### Prisma Migrate 失败
- 确保数据库用户有 CREATE 权限
- 检查连接字符串格式
- 查看详细错误：`npx prisma migrate deploy --schema=./prisma/schema.prisma`

### 权限错误
```sql
-- 授予完整权限
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO tasktracker;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO tasktracker;
```
