# M3 任务2：验收流程功能

> 分支名：`feature/m3-review`
> 依赖：无（可独立开发）

---

你是 work-task-tracker 项目开发者。请在 `feature/m3-review` 分支上实现【验收流程】功能。

## 项目上下文

- 框架：Next.js 14 (App Router) + TypeScript + Prisma + PostgreSQL
- UI：Tailwind CSS + shadcn/ui
- 认证：`getSession()` from `@/lib/auth`
- 数据库：`prisma` from `@/lib/db`

## 任务要求

### 1. 数据库模型 (prisma/schema.prisma)

添加 Review 模型：

```prisma
enum ReviewResult {
  PASS
  FAIL
}

enum AiRating {
  EXCELLENT
  QUALIFIED
  RISK
  UNQUALIFIED
}

model Review {
  id            String       @id @default(cuid())
  taskId        String
  reviewerId    String
  result        ReviewResult
  failReason    String?
  aiRating      AiRating?
  aiReason      String?
  aiSuggestions String?
  finalRating   AiRating?
  createdAt     DateTime     @default(now())

  task     Task @relation(fields: [taskId], references: [id])
  reviewer User @relation("TaskReviewer", fields: [reviewerId], references: [id])

  @@index([taskId])
}
```

在 Task 模型添加关系：
```prisma
reviews Review[]
```

在 User 模型添加关系：
```prisma
reviewedTasks Review[] @relation("TaskReviewer")
```

### 2. API 端点

#### POST /api/tasks/[id]/review
- 提交验收
- 请求体：`{ result: "PASS" | "FAIL", failReason?: string }`
- 验收通过：任务状态变为 COMPLETED
- 验收不通过：任务状态变为 IN_PROGRESS，创建通知给负责人

#### GET /api/tasks/[id]/reviews
- 获取验收历史
- 按创建时间倒序
- 包含验收人信息

#### PATCH /api/reviews/[id]
- 更新验收（主管确认最终评级）
- 请求体：`{ finalRating: AiRating }`

### 3. 验收逻辑

```typescript
// 验收权限检查
// - 只有任务状态为 PENDING_REVIEW 时可验收
// - 验收人需要有权限：
//   - 任务负责人的主管（MANAGER 角色）
//   - 或更高角色（DIRECTOR / CEO / ADMIN）
//   - 不能验收自己的任务

// 验收通过
// - 任务状态 → COMPLETED
// - 创建通知：恭喜，任务已验收通过

// 验收不通过
// - 任务状态 → IN_PROGRESS
// - 创建通知：任务验收未通过，原因：xxx
```

### 4. 前端组件 (src/components/review/)

#### review-dialog.tsx
- 验收弹窗
- 通过/不通过选择
- 不通过时必填原因
- 提交按钮

#### review-history.tsx
- 验收历史列表
- 时间线样式
- 显示验收人、结果、原因

#### review-badge.tsx
- 评级徽章组件
- EXCELLENT = 绿色 "优秀"
- QUALIFIED = 蓝色 "合格"
- RISK = 黄色 "风险"
- UNQUALIFIED = 红色 "不合格"

### 5. 集成

#### 任务详情页
- 添加"验收"按钮（状态为 PENDING_REVIEW 时显示）
- 添加验收历史区块

#### 任务列表卡片
- 显示验收状态徽章

## 开发步骤

```bash
# 1. 创建分支
git checkout -b feature/m3-review

# 2. 修改数据库模型
# 编辑 prisma/schema.prisma

# 3. 运行迁移
pnpm prisma migrate dev --name add_review_model

# 4. 创建 API 端点
# 创建 src/app/api/tasks/[id]/review/route.ts
# 创建 src/app/api/tasks/[id]/reviews/route.ts
# 创建 src/app/api/reviews/[id]/route.ts

# 5. 创建前端组件
# 创建 src/components/review/*.tsx

# 6. 集成到任务详情页
# 修改 src/app/tasks/[id]/page.tsx

# 7. 测试并提交
pnpm tsc --noEmit
git add .
git commit -m "feat(m3): 验收流程功能"
```

## 文件清单

| 操作 | 文件路径 |
|------|----------|
| 修改 | prisma/schema.prisma |
| 新建 | prisma/migrations/xxx_add_review_model/ |
| 新建 | src/app/api/tasks/[id]/review/route.ts |
| 新建 | src/app/api/tasks/[id]/reviews/route.ts |
| 新建 | src/app/api/reviews/[id]/route.ts |
| 新建 | src/components/review/review-dialog.tsx |
| 新建 | src/components/review/review-history.tsx |
| 新建 | src/components/review/review-badge.tsx |
| 新建 | src/components/review/index.ts |
| 修改 | src/app/tasks/[id]/page.tsx |

## 验收标准

- [ ] PENDING_REVIEW 状态的任务显示验收按钮
- [ ] 验收通过后任务状态变为 COMPLETED
- [ ] 验收不通过后任务状态变为 IN_PROGRESS
- [ ] 验收不通过必须填写原因
- [ ] 验收历史正确显示
- [ ] 验收后发送通知给负责人
- [ ] TypeScript 编译无错误
