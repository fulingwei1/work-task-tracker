# M4 任务2：工作计划前端页面

> 分支名：`feature/m4-plan-ui`
> 依赖：`feature/m4-plan-model`（API 需先就绪）

---

你是 work-task-tracker 项目开发者。请在 `feature/m4-plan-ui` 分支上实现【工作计划前端页面】。

## 项目上下文

- 框架：Next.js 14 (App Router) + TypeScript + Prisma + PostgreSQL
- UI：Tailwind CSS + shadcn/ui
- 已有参考：会议模块 `src/app/meetings/` 和 `src/components/meeting/`

## 前置依赖

⚠️ 此任务依赖 `feature/m4-plan-model` 分支的 API。

如果 API 分支未就绪，可以先开发 UI 组件，使用 mock 数据：

```typescript
const mockPlan = {
  id: "plan-1",
  title: "2024年Q1产品开发计划",
  type: "PROJECT_PLAN",
  status: "DRAFT",
  description: "...",
  items: [],
  tasks: [],
};
```

## 任务要求

### 1. 页面路由

#### /plans - 计划列表页
- 卡片式布局
- 按类型筛选
- 按状态筛选
- 新建计划按钮
- 空状态提示

#### /plans/new - 创建计划页
- 计划表单
- 提交后跳转到详情页

#### /plans/[id] - 计划详情页
- 计划基本信息
- AI 智能拆解按钮
- 条目列表（可编辑）
- 批量创建任务
- 已关联任务列表

### 2. 前端组件 (src/components/plan/)

#### plan-card.tsx
```typescript
interface PlanCardProps {
  plan: {
    id: string;
    title: string;
    type: PlanType;
    status: PlanStatus;
    createdAt: string;
    owner: { id: string; name: string };
    _count: { items: number; tasks: number };
  };
  onDelete?: (id: string) => void;
}
```
- 显示计划标题、类型、状态
- 显示条目数和任务数
- 操作菜单（查看、删除）

#### plan-form.tsx
- 标题输入
- 类型选择（下拉）
- 描述输入（大文本框）
- 开始/结束日期（可选）
- 提交/取消按钮

#### plan-item-list.tsx
- 条目列表展示
- 支持全选/取消全选
- 选中状态管理

#### plan-item-card.tsx
- 单个条目卡片
- 可编辑：负责人、截止日期、优先级
- 复选框（选择是否转为任务）
- 显示是否已转换

#### plan-status-badge.tsx
```typescript
const statusMap = {
  DRAFT: { label: "草稿", color: "bg-gray-100 text-gray-700" },
  REVIEWING: { label: "审核中", color: "bg-yellow-100 text-yellow-700" },
  APPROVED: { label: "已通过", color: "bg-green-100 text-green-700" },
  IN_PROGRESS: { label: "进行中", color: "bg-blue-100 text-blue-700" },
  CLOSED: { label: "已关闭", color: "bg-gray-100 text-gray-500" },
};
```

#### plan-type-badge.tsx
```typescript
const typeMap = {
  MONTHLY_PLAN: { label: "月度计划", color: "bg-purple-100 text-purple-700" },
  PROJECT_PLAN: { label: "项目计划", color: "bg-indigo-100 text-indigo-700" },
  SPECIAL_PLAN: { label: "专项计划", color: "bg-orange-100 text-orange-700" },
};
```

### 3. 页面实现

参考 `src/app/meetings/` 的实现模式：

#### 列表页 (/plans/page.tsx)
- 顶部：标题 + 新建按钮
- 筛选区：类型、状态
- 内容区：计划卡片网格
- 空状态：引导创建

#### 创建页 (/plans/new/page.tsx)
- 返回链接
- 表单组件
- 提交处理

#### 详情页 (/plans/[id]/page.tsx)
- 计划信息区
- AI 拆解按钮和流程
- 条目列表（类似会议的任务建议）
- 批量创建任务操作
- 已创建任务列表

### 4. 侧边栏导航

在 `src/components/layout/sidebar.tsx` 添加"计划"入口：

```typescript
import { FileSpreadsheet } from "lucide-react";

// 在 navItems 数组中添加
{ href: "/plans", label: "计划", icon: FileSpreadsheet },
```

位置：放在"会议"之后、"通知"之前

### 5. 类型定义 (src/types/plan.ts)

```typescript
export type PlanType = "MONTHLY_PLAN" | "PROJECT_PLAN" | "SPECIAL_PLAN";
export type PlanStatus = "DRAFT" | "REVIEWING" | "APPROVED" | "IN_PROGRESS" | "CLOSED";

export interface Plan {
  id: string;
  title: string;
  type: PlanType;
  status: PlanStatus;
  description: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  owner: { id: string; name: string };
  items: PlanItem[];
  tasks: Task[];
}

export interface PlanItem {
  id: string;
  content: string;
  suggestedOwner?: string;
  suggestedDueDate?: string;
  priority: "P1" | "P2" | "P3";
  isConverted: boolean;
  convertedTaskId?: string;
}
```

## 开发步骤

```bash
# 1. 创建分支
git checkout -b feature/m4-plan-ui

# 2. 创建组件目录
mkdir -p src/components/plan
mkdir -p src/app/plans/new
mkdir -p src/app/plans/[id]

# 3. 创建组件
# 创建 src/components/plan/*.tsx

# 4. 创建页面
# 创建 src/app/plans/page.tsx
# 创建 src/app/plans/new/page.tsx
# 创建 src/app/plans/[id]/page.tsx

# 5. 更新侧边栏
# 修改 src/components/layout/sidebar.tsx

# 6. 测试并提交
pnpm tsc --noEmit
git add .
git commit -m "feat(m4): 工作计划前端页面"
```

## 文件清单

| 操作 | 文件路径 |
|------|----------|
| 新建 | src/components/plan/plan-card.tsx |
| 新建 | src/components/plan/plan-form.tsx |
| 新建 | src/components/plan/plan-item-list.tsx |
| 新建 | src/components/plan/plan-item-card.tsx |
| 新建 | src/components/plan/plan-status-badge.tsx |
| 新建 | src/components/plan/plan-type-badge.tsx |
| 新建 | src/components/plan/index.ts |
| 新建 | src/app/plans/page.tsx |
| 新建 | src/app/plans/new/page.tsx |
| 新建 | src/app/plans/[id]/page.tsx |
| 修改 | src/components/layout/sidebar.tsx |

## 验收标准

- [ ] 计划列表页正常显示
- [ ] 可以创建新计划
- [ ] 计划详情页展示正确
- [ ] AI 拆解按钮可点击（依赖 API）
- [ ] 条目列表可编辑
- [ ] 可批量选择条目创建任务
- [ ] 侧边栏显示"计划"入口
- [ ] TypeScript 编译无错误
