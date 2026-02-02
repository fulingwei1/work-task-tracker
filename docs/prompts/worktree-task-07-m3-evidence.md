# M3 任务1：证据上传功能

> 分支名：`feature/m3-evidence`
> 依赖：无（可独立开发）

---

你是 work-task-tracker 项目开发者。请在 `feature/m3-evidence` 分支上实现【证据上传】功能。

## 项目上下文

- 框架：Next.js 14 (App Router) + TypeScript + Prisma + PostgreSQL
- UI：Tailwind CSS + shadcn/ui
- 认证：`getSession()` from `@/lib/auth`
- 数据库：`prisma` from `@/lib/db`

## 任务要求

### 1. 数据库模型 (prisma/schema.prisma)

添加 Evidence 模型：

```prisma
enum EvidenceType {
  FILE
  IMAGE
  LINK
  TEXT
}

model Evidence {
  id          String       @id @default(cuid())
  taskId      String
  userId      String
  type        EvidenceType
  url         String
  fileName    String?
  fileSize    Int?
  description String?
  createdAt   DateTime     @default(now())

  task Task @relation(fields: [taskId], references: [id])
  user User @relation("EvidenceUploader", fields: [userId], references: [id])

  @@index([taskId])
}
```

在 Task 模型添加关系：
```prisma
evidences Evidence[]
```

在 User 模型添加关系：
```prisma
uploadedEvidences Evidence[] @relation("EvidenceUploader")
```

### 2. 文件上传服务 (src/lib/upload.ts)

```typescript
// 功能要求：
// - 本地磁盘存储到 public/uploads/evidence/
// - 支持图片（jpg, png, gif, webp）和文件（pdf, doc, docx, xls, xlsx）
// - 生成唯一文件名（使用 cuid 或 uuid）
// - 返回访问 URL
// - 文件大小限制：10MB

export async function uploadFile(file: File): Promise<{
  url: string;
  fileName: string;
  fileSize: number;
}>
```

### 3. API 端点

#### POST /api/tasks/[id]/evidence
- 上传证据（multipart/form-data）
- 支持多文件上传
- 返回创建的 Evidence 列表

#### GET /api/tasks/[id]/evidence
- 获取任务的证据列表
- 按创建时间倒序

#### DELETE /api/evidence/[id]
- 删除证据
- 同时删除本地文件
- 只有上传者或管理员可删除

### 4. 前端组件 (src/components/evidence/)

#### evidence-upload.tsx
- 拖拽上传区域
- 点击选择文件
- 上传进度显示
- 支持多文件

#### evidence-list.tsx
- 证据列表展示
- 网格布局
- 空状态提示

#### evidence-item.tsx
- 单个证据卡片
- 图片预览（缩略图）
- 文件图标显示
- 下载和删除按钮

### 5. 集成到任务详情页

在 `src/app/tasks/[id]/page.tsx` 添加证据区块：
- 证据上传区域
- 已上传证据列表
- 位置：进度更新记录下方

## 开发步骤

```bash
# 1. 创建分支
git checkout -b feature/m3-evidence

# 2. 修改数据库模型
# 编辑 prisma/schema.prisma

# 3. 运行迁移
pnpm prisma migrate dev --name add_evidence_model

# 4. 创建上传服务
# 创建 src/lib/upload.ts

# 5. 创建 API 端点
# 创建 src/app/api/tasks/[id]/evidence/route.ts
# 创建 src/app/api/evidence/[id]/route.ts

# 6. 创建前端组件
# 创建 src/components/evidence/*.tsx

# 7. 集成到任务详情页
# 修改 src/app/tasks/[id]/page.tsx

# 8. 测试并提交
pnpm tsc --noEmit
git add .
git commit -m "feat(m3): 证据上传功能"
```

## 文件清单

| 操作 | 文件路径 |
|------|----------|
| 修改 | prisma/schema.prisma |
| 新建 | prisma/migrations/xxx_add_evidence_model/ |
| 新建 | src/lib/upload.ts |
| 新建 | src/app/api/tasks/[id]/evidence/route.ts |
| 新建 | src/app/api/evidence/[id]/route.ts |
| 新建 | src/components/evidence/evidence-upload.tsx |
| 新建 | src/components/evidence/evidence-list.tsx |
| 新建 | src/components/evidence/evidence-item.tsx |
| 新建 | src/components/evidence/index.ts |
| 修改 | src/app/tasks/[id]/page.tsx |

## 验收标准

- [ ] 可以拖拽或点击上传文件
- [ ] 图片类型显示缩略图预览
- [ ] 文件类型显示对应图标
- [ ] 可以删除自己上传的证据
- [ ] 上传进度有视觉反馈
- [ ] TypeScript 编译无错误
