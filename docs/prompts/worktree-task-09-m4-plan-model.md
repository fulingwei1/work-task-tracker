# M4 任务1：工作计划模型和API

> 分支名：`feature/m4-plan-model`
> 依赖：无（可独立开发）

---

你是 work-task-tracker 项目开发者。请在 `feature/m4-plan-model` 分支上实现【工作计划模型和API】。

## 项目上下文

- 框架：Next.js 14 (App Router) + TypeScript + Prisma + PostgreSQL
- UI：Tailwind CSS + shadcn/ui
- 认证：`getSession()` from `@/lib/auth`
- 数据库：`prisma` from `@/lib/db`
- 参考：会议 AI 拆解 `src/lib/ai/meeting-parser.ts`

## 任务要求

### 1. 数据库模型 (prisma/schema.prisma)

添加 Plan 和 PlanItem 模型：

```prisma
enum PlanType {
  MONTHLY_PLAN
  PROJECT_PLAN
  SPECIAL_PLAN
}

enum PlanStatus {
  DRAFT
  REVIEWING
  APPROVED
  IN_PROGRESS
  CLOSED
}

model Plan {
  id           String     @id @default(cuid())
  title        String
  type         PlanType
  ownerId      String
  departmentId String?
  description  String     @db.Text
  status       PlanStatus @default(DRAFT)
  startDate    DateTime?
  endDate      DateTime?
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  owner      User        @relation("PlanOwner", fields: [ownerId], references: [id])
  department Department? @relation(fields: [departmentId], references: [id])
  items      PlanItem[]
  tasks      Task[]      @relation("PlanTasks")

  @@index([ownerId])
  @@index([status])
}

model PlanItem {
  id               String       @id @default(cuid())
  planId           String
  content          String
  suggestedOwner   String?
  suggestedDueDate DateTime?
  priority         TaskPriority @default(P2)
  isConverted      Boolean      @default(false)
  convertedTaskId  String?
  createdAt        DateTime     @default(now())

  plan Plan @relation(fields: [planId], references: [id], onDelete: Cascade)

  @@index([planId])
}
```

更新 Task 模型，添加关系：
```prisma
sourcePlan     Plan?   @relation("PlanTasks", fields: [sourcePlanId], references: [id])
```

更新 User 模型，添加关系：
```prisma
ownedPlans Plan[] @relation("PlanOwner")
```

更新 Department 模型，添加关系：
```prisma
plans Plan[]
```

### 2. API 端点

#### GET /api/plans
- 获取计划列表
- 查询参数：status, type, page, limit
- 按创建时间倒序

#### POST /api/plans
- 创建计划
- 请求体：`{ title, type, description, startDate?, endDate? }`

#### GET /api/plans/[id]
- 获取计划详情
- 包含条目列表和关联任务

#### PATCH /api/plans/[id]
- 更新计划
- 可更新：title, description, status, startDate, endDate

#### DELETE /api/plans/[id]
- 删除计划
- 级联删除条目
- 不删除已创建的任务

#### POST /api/plans/[id]/parse
- AI 拆解计划生成 PlanItem
- 调用 plan-parser 服务
- 返回建议的条目列表

#### POST /api/plans/[id]/items
- 批量保存 PlanItem
- 用于保存 AI 拆解结果

#### POST /api/plans/[id]/tasks
- 从 PlanItem 批量创建任务
- 请求体：`{ items: [{ itemId, ownerId, dueDate?, priority? }] }`
- 更新 PlanItem.isConverted 和 convertedTaskId
- 任务 source 设为 PLAN

### 3. AI 拆解服务 (src/lib/ai/plan-parser.ts)

```typescript
interface ParsedPlanItem {
  content: string;
  suggestedOwner?: string;
  suggestedDueDate?: string;
  priority: TaskPriority;
  confidence: number;
}

interface ParseResult {
  items: ParsedPlanItem[];
  summary?: string;
}

export async function parsePlanContent(
  description: string,
  planType: PlanType
): Promise<ParseResult>
```

提示词设计要点：
- 根据计划类型调整识别策略
- 月度计划：按周/天分解
- 项目计划：按阶段/里程碑分解
- 专项计划：按步骤分解

### 4. 状态流转

```
DRAFT → REVIEWING → APPROVED → IN_PROGRESS → CLOSED
  ↑         ↓
  └─────────┘ (驳回)
```

## 开发步骤

```bash
# 1. 创建分支
git checkout -b feature/m4-plan-model

# 2. 修改数据库模型
# 编辑 prisma/schema.prisma

# 3. 运行迁移
pnpm prisma migrate dev --name add_plan_model

# 4. 创建 AI 拆解服务
# 创建 src/lib/ai/plan-parser.ts

# 5. 创建 API 端点
# 创建 src/app/api/plans/route.ts
# 创建 src/app/api/plans/[id]/route.ts
# 创建 src/app/api/plans/[id]/parse/route.ts
# 创建 src/app/api/plans/[id]/items/route.ts
# 创建 src/app/api/plans/[id]/tasks/route.ts

# 6. 测试并提交
pnpm tsc --noEmit
git add .
git commit -m "feat(m4): 工作计划模型和API"
```

## 文件清单

| 操作 | 文件路径 |
|------|----------|
| 修改 | prisma/schema.prisma |
| 新建 | prisma/migrations/xxx_add_plan_model/ |
| 新建 | src/lib/ai/plan-parser.ts |
| 新建 | src/app/api/plans/route.ts |
| 新建 | src/app/api/plans/[id]/route.ts |
| 新建 | src/app/api/plans/[id]/parse/route.ts |
| 新建 | src/app/api/plans/[id]/items/route.ts |
| 新建 | src/app/api/plans/[id]/tasks/route.ts |

## 验收标准

- [ ] Plan 和 PlanItem 模型创建成功
- [ ] 计划 CRUD API 正常工作
- [ ] AI 拆解能识别计划内容并生成条目
- [ ] 可以从条目批量创建任务
- [ ] 任务正确关联到来源计划
- [ ] TypeScript 编译无错误
