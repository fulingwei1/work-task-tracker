# AI 任务闭环管理系统 - 技术设计文档

> 日期：2026-02-01
> 状态：已确认，待实施

---

## 一、核心决策

| 决策项 | 选择 | 理由 |
|--------|------|------|
| 框架 | Next.js 14 (App Router) | 全栈 TypeScript，API Routes 内置后端 |
| UI | Ant Design 5 + ProComponents | 表格/表单/报表组件成熟，中文生态好 |
| 数据库 | PostgreSQL | 支持 JSON 字段，审计日志友好 |
| ORM | Prisma | 类型安全，迁移管理方便 |
| 认证 | 企业微信 OAuth 2.0 | 免密登录，通讯录同步 |
| 通知 | 企业微信推送（紧急）+ 站内通知（日常） | 双通道分级推送 |
| AI | 云端大模型 API | 会议拆解/点评/督办 |
| 文件存储 | 本地磁盘 + MinIO（可选） | 自有服务器，不依赖云 OSS |
| 定时任务 | node-cron 或 Bull Queue | 督办检查、通知发送 |
| 部署 | 自有服务器 | 数据完全自控 |

---

## 二、技术架构

```
┌─────────────────────────────────────────────┐
│              企业微信                         │
│    OAuth 登录 / 消息推送 / 通讯录同步          │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│          Next.js 应用（自有服务器）            │
│                                             │
│  ┌─────────┐  ┌──────────┐  ┌───────────┐  │
│  │ 前端页面 │  │ API Routes│  │ 定时任务   │  │
│  │Ant Design│  │ (后端逻辑) │  │ (cron)    │  │
│  └─────────┘  └──────────┘  └───────────┘  │
│                    │                        │
│         ┌─────────┼─────────┐              │
│         ▼         ▼         ▼              │
│  ┌──────────┐ ┌────────┐ ┌──────────┐     │
│  │PostgreSQL│ │文件存储  │ │云端大模型 │     │
│  │ (任务/   │ │(证据/   │ │ API     │     │
│  │  用户等) │ │ 附件)   │ │         │     │
│  └──────────┘ └────────┘ └──────────┘     │
└─────────────────────────────────────────────┘
```

---

## 三、数据库模型

```
┌──────────┐     ┌──────────────┐     ┌──────────┐
│Department│◄────│    User      │────►│  Plan    │
└──────────┘     └──────┬───────┘     └────┬─────┘
                        │                   │
                        │              ┌────▼─────┐
                 ┌──────▼───────┐     │ PlanItem │
                 │    Task      │◄────┘──────────┘
                 └──┬───┬───┬──┘
                    │   │   │
            ┌───────┘   │   └────────┐
            ▼           ▼            ▼
     ┌───────────┐ ┌──────────┐ ┌─────────┐
     │TaskUpdate │ │ Evidence │ │ Review  │
     └───────────┘ └──────────┘ └─────────┘

     ┌───────────┐
     │  Meeting  │───► Task (source = MEETING)
     └───────────┘
```

### 3.1 User（从企业微信同步）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键 |
| wx_user_id | string | 企业微信 userid |
| name | string | 姓名 |
| department_id | string | 所属部门 |
| role | enum | STAFF / MANAGER / DIRECTOR / CEO / ADMIN |
| created_at | timestamp | |
| updated_at | timestamp | |

### 3.2 Department（从企业微信同步）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键 |
| wx_dept_id | string | 企业微信部门 ID |
| name | string | 部门名称 |
| parent_id | string | 上级部门（支持多级） |

### 3.3 Task（核心对象）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键 |
| title | string | 标题 |
| owner_id | string | 负责人 |
| collaborator_ids | string[] | 协作人 |
| status | enum | NOT_STARTED / IN_PROGRESS / PENDING_REVIEW / COMPLETED / BLOCKED / CANCELLED |
| priority | enum | P1 / P2 / P3 |
| due_date | date | 截止时间 |
| acceptance_criteria | text | 验收标准 |
| source | enum | MANUAL / MEETING / PLAN |
| source_meeting_id | string? | 来源会议 |
| source_plan_id | string? | 来源方案 |
| source_plan_item_id | string? | 来源方案条目 |
| created_by | string | 创建人 |
| created_at | timestamp | |
| updated_at | timestamp | |
| deleted_at | timestamp? | 软删除 |

### 3.4 TaskUpdate（进度更新）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键 |
| task_id | string | 关联任务 |
| user_id | string | 更新人 |
| progress_percent | number | 进度百分比 |
| status | enum | 当前状态 |
| blocker_type | string? | 阻塞类型 |
| blocker_desc | text? | 阻塞说明 |
| next_action | text? | 下一步行动 |
| estimated_completion | date? | 预计完成时间 |
| created_at | timestamp | |

### 3.5 Evidence（证据）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键 |
| task_id | string | 关联任务 |
| user_id | string | 上传人 |
| type | enum | FILE / IMAGE / LINK / TEXT |
| url | string | 文件路径或链接 |
| description | text? | 文字说明 |
| created_at | timestamp | |

### 3.6 Review（验收与点评）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键 |
| task_id | string | 关联任务 |
| reviewer_id | string | 验收人 |
| result | enum | PASS / FAIL |
| fail_reason | text? | 不通过原因 |
| ai_rating | enum? | EXCELLENT / QUALIFIED / RISK / UNQUALIFIED |
| ai_reason | text? | AI 评级原因 |
| ai_suggestions | text? | AI 改进建议 |
| final_rating | enum? | 主管确认后最终评级 |
| created_at | timestamp | |

### 3.7 Plan（计划/工作方案）

| 字段 | 类型 | 说明 |
|------|------|------|
| plan_id | string | 主键 |
| title | string | 标题 |
| type | enum | MONTHLY_PLAN / PROJECT_PLAN / SPECIAL_PLAN |
| owner_id | string | 负责人 |
| department_id | string | 所属部门 |
| description | text | 方案内容 |
| status | enum | DRAFT / REVIEWING / APPROVED / IN_PROGRESS / CLOSED |
| start_date | date | 开始日期 |
| end_date | date | 结束日期 |
| created_at | timestamp | |

### 3.8 PlanItem（方案条目）

| 字段 | 类型 | 说明 |
|------|------|------|
| item_id | string | 主键 |
| plan_id | string | 关联方案 |
| content | string | 条目内容 |
| suggested_owner | string? | 建议负责人 |
| suggested_due_date | date? | 建议截止时间 |
| priority | enum | P1 / P2 / P3 |

### 3.9 Meeting（会议）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键 |
| title | string | 会议标题 |
| content | text | 会议纪要原文 |
| created_by | string | 创建人 |
| created_at | timestamp | |

### 3.10 Notification（通知）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键 |
| user_id | string | 接收人 |
| type | enum | TASK_ASSIGNED / TASK_DUE_SOON / TASK_OVERDUE / TASK_NO_UPDATE / TASK_BLOCKED / TASK_STATUS_CHANGED |
| title | string | 通知标题 |
| content | text | 通知内容 |
| task_id | string? | 关联任务 |
| is_read | boolean | 是否已读 |
| created_at | timestamp | |

### 3.11 NotificationLog（通知发送日志）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键 |
| task_id | string | 关联任务 |
| trigger_type | string | 触发类型 |
| channel | enum | WECHAT / IN_APP |
| sent_at | timestamp | 发送时间 |

---

## 四、权限矩阵

| 操作 | 员工 | 主管 | 总经理/董事长/超管 |
|------|------|------|-----------------|
| 查看自己的任务 | Yes | Yes | Yes |
| 查看部门任务 | Yes | Yes | Yes |
| 查看全部任务 | No | No | Yes |
| 创建任务 | 仅给自己 | 可指派下属 | 可指派任何人 |
| 更新进度 | 自己的 | 本部门的 | - |
| 删除/取消任务 | No | 本部门 | 全部 |

角色枚举：STAFF / MANAGER / DIRECTOR / CEO / ADMIN

其中 ADMIN 权限等同 CEO/董事长。

---

## 五、M1 功能范围

### 5.1 包含

| 功能 | 说明 |
|------|------|
| 企业微信登录 | OAuth 扫码/自动登录，同步组织架构 |
| 任务 CRUD | 创建、编辑、删除、状态变更 |
| 任务列表 | 我的任务 / 部门任务 / 全部任务（按角色） |
| 进度更新 | 员工填写进度、阻塞、下一步 |
| 基础督办 | 定时检查截止日期，企业微信推送提醒 |
| 站内通知 | 被分配任务、任务被评论等通知 |

### 5.2 不包含

会议拆解、计划管理、证据上传、验收点评、AI 功能、报表

---

## 六、M1 API 设计

### 6.1 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/auth/wechat` | 发起企业微信 OAuth |
| GET | `/api/auth/wechat/callback` | OAuth 回调，创建 session |
| POST | `/api/auth/logout` | 登出 |
| GET | `/api/auth/me` | 获取当前用户信息 |

### 6.2 用户与组织

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/sync/organization` | 手动触发同步企业微信通讯录 |
| GET | `/api/users` | 用户列表（搜索/筛选） |
| GET | `/api/departments` | 部门树 |

### 6.3 任务

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/tasks` | 创建任务 |
| GET | `/api/tasks` | 任务列表（query: status, owner_id, dept_id, due_before, due_after, page, limit） |
| GET | `/api/tasks/:id` | 任务详情（含更新记录） |
| PATCH | `/api/tasks/:id` | 编辑任务 |
| DELETE | `/api/tasks/:id` | 删除任务（软删除） |
| PATCH | `/api/tasks/:id/status` | 变更状态 |

### 6.4 进度更新

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/tasks/:id/updates` | 提交进度更新 |
| GET | `/api/tasks/:id/updates` | 获取更新记录列表 |

### 6.5 通知

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/notifications` | 我的通知列表 |
| PATCH | `/api/notifications/:id/read` | 标记已读 |
| PATCH | `/api/notifications/read-all` | 全部标记已读 |

### 6.6 设计要点

- 所有接口经过认证中间件，从 session 获取当前用户
- 权限校验在中间件层统一处理
- 任务列表根据角色自动过滤可见范围
- 软删除：deleted_at 字段
- 分页格式：`{ data: [], meta: { total, page, limit } }`

---

## 七、督办规则与通知机制

### 7.1 触发规则

| 触发条件 | 通知渠道 | 接收人 | 频率 |
|---------|---------|--------|------|
| 截止前 2 天 | 站内通知 | 负责人 | 1 次 |
| 截止当天 | 企业微信 + 站内 | 负责人 | 1 次 |
| 逾期第 1 天 | 企业微信 + 站内 | 负责人 + 主管 | 1 次 |
| 逾期超过 3 天 | 企业微信 + 站内 | 负责人 + 主管 | 每 3 天 1 次 |
| 7 天未更新进度 | 站内通知 | 负责人 | 1 次 |
| 阻塞超过 2 天 | 企业微信 + 站内 | 负责人 + 主管 | 1 次 |

### 7.2 定时调度

```
每天 9:00  — 扫描截止日期，触发提醒
每天 10:00 — 扫描逾期任务，通知升级
每天 14:00 — 扫描长时间未更新的任务
```

### 7.3 企业微信消息模板

```
【任务提醒】
任务：完成产线 A 自动化改造方案
状态：进行中
截止：2026-02-05（还剩 2 天）
点击更新进度：{链接}
```

```
【逾期警告】
任务：完成产线 A 自动化改造方案
负责人：张三
已逾期：3 天
最近更新：5 天前
点击查看详情：{链接}
抄送主管：李经理
```

### 7.4 去重规则

- 同一任务同一触发条件，24 小时内不重复发送
- 通过 notification_log 表记录发送历史

### 7.5 站内通知类型

| 类型 | 场景 |
|------|------|
| TASK_ASSIGNED | 被分配了新任务 |
| TASK_DUE_SOON | 任务即将到期 |
| TASK_OVERDUE | 任务已逾期 |
| TASK_NO_UPDATE | 长时间未更新 |
| TASK_BLOCKED | 阻塞超时 |
| TASK_STATUS_CHANGED | 任务状态被变更 |

---

## 八、汇总报表（M6）

### 8.1 个人维度

- 任务数、按期率、逾期率、风险任务数

### 8.2 部门维度

- 总任务数、按期率、阻塞任务数、优秀/不佳人数

### 8.3 公司维度

- 各部门对比、Top 逾期任务、Top 优秀员工

### 8.4 员工完成率排名

| 排名 | 姓名 | 部门 | 总任务数 | 按期完成 | 逾期完成 | 未完成 | 按期率 |
|------|------|------|---------|---------|---------|--------|-------|
| 1 | 张三 | 生产部 | 15 | 14 | 1 | 0 | 93% |

- 按期率 = 按期完成数 / 总任务数
- 已取消的任务不计入
- 支持按时间段筛选（本周/本月/本季度/自定义）
- 任务数少于 3 条的不参与排名

### 8.5 经理（部门）完成率排名

| 排名 | 经理 | 部门 | 部门总任务 | 按期完成 | 逾期完成 | 未完成 | 部门按期率 |
|------|------|------|----------|---------|---------|--------|----------|
| 1 | 王经理 | 技术部 | 45 | 40 | 3 | 2 | 89% |

### 8.6 员工完成质量排名

| 排名 | 姓名 | 部门 | 已验收任务 | 一次通过 | 退回次数 | 质量评级分布 | 质量得分 |
|------|------|------|----------|---------|---------|------------|---------|
| 1 | 张三 | 生产部 | 12 | 11 | 1 | 优秀8/达标3/风险1 | 92 |

### 8.7 经理（部门）完成质量排名

| 排名 | 经理 | 部门 | 部门已验收 | 一次通过率 | 平均退回次数 | 部门质量得分 |
|------|------|------|----------|-----------|------------|------------|
| 1 | 王经理 | 技术部 | 38 | 87% | 0.3 | 90 |

### 8.8 质量得分计算

```
评级权重：
  优秀 = 100 分
  达标 = 75 分
  风险 = 40 分
  不达标 = 0 分

最终得分 = 评级加权均分 × 0.8 + 一次通过率 × 100 × 0.2
```

M3 阶段简化版（无 AI 评级时）：质量得分 = 一次通过率 × 100

### 8.9 排名权限

| 角色 | 可见范围 |
|------|---------|
| 员工 | 仅看自己在本部门的排名 |
| 主管 | 本部门员工排名 |
| 总经理/董事长/超管 | 全公司员工排名 + 经理排名 |

---

## 九、M1 前端页面结构

### 9.1 目录结构

```
src/
├── app/
│   ├── layout.tsx                # 全局布局（侧边栏 + 顶部栏）
│   ├── login/page.tsx            # 企业微信登录页
│   ├── dashboard/page.tsx        # 首页看板
│   ├── tasks/
│   │   ├── page.tsx              # 任务列表
│   │   ├── new/page.tsx          # 创建任务
│   │   └── [id]/
│   │       ├── page.tsx          # 任务详情
│   │       └── update/page.tsx   # 填写进度
│   └── notifications/page.tsx    # 通知列表
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   ├── task/
│   │   ├── TaskTable.tsx
│   │   ├── TaskForm.tsx
│   │   ├── TaskStatusTag.tsx
│   │   ├── TaskPriorityTag.tsx
│   │   └── TaskTimeline.tsx
│   └── common/
│       ├── StatCard.tsx
│       └── UserSelect.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useTasks.ts
│   └── useNotifications.ts
├── lib/
│   ├── api.ts
│   ├── auth.ts
│   └── constants.ts
└── types/
    ├── task.ts
    ├── user.ts
    └── notification.ts
```

### 9.2 首页看板

```
┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│  待办任务   │ │  进行中    │ │  本周到期   │ │  已逾期     │
│    12      │ │    8       │ │    3       │ │    2       │
└────────────┘ └────────────┘ └────────────┘ └────────────┘
```

### 9.3 页面交互

| 页面 | 主要组件 | 交互 |
|------|---------|------|
| 首页看板 | 4 个 StatCard + 待办任务列表 | 点击卡片跳转筛选后的任务列表 |
| 任务列表 | ProTable（筛选/排序/分页） | 状态筛选、负责人筛选、关键词搜索 |
| 创建任务 | ProForm（表单校验） | 人员选择器从企业微信通讯录拉取 |
| 任务详情 | Descriptions + Timeline | 上半部分任务信息，下半部分更新时间线 |
| 填写进度 | Form + Slider（进度条） | 提交后跳回任务详情 |

---

## 十、演进路线

```
M1（尽快上线）         M2              M3
手工任务+更新+督办 → 会议纪要拆解 → 证据上传+验收

M4                   M5              M6
计划/方案管理    → AI督办+AI点评 → 汇总报表+排名
```

### 里程碑调整说明

| 原 PRD | 调整后 | 原因 |
|--------|--------|------|
| M2 会议拆解 | 保持 | 管理层最直接感知的 AI 价值 |
| M3 证据+验收 | 保持 | 闭环必须件 |
| M4 AI 督办 | 改为计划/方案管理 | 方案管理是三大任务入口之一，M1 已有基础督办 |
| M5 AI 点评 | 合并 AI 督办+AI 点评 | 共用 AI 基础设施，一起做效率更高 |
| M6 汇总报表 | 保持 | 数据积累够了再做报表才有意义 |

### 各阶段验收标准

- M1：≥60% 员工完成登录并创建/更新过任务
- M2：≥80% 会议行动项被转化为任务
- M3：≥50% 已完成任务附带证据
- M4：≥70% 方案条目被拆解为任务
- M5：AI 点评采纳率 ≥60%
- M6：管理层每周查看报表 ≥1 次

---

## 十一、风险与应对

| 风险 | 应对 |
|------|------|
| 员工不填 | 表单最简，督办提醒 |
| 验收标准缺失 | 创建任务时强提示 |
| 证据不足 | 验收时要求补充 |
| AI 被当裁判 | AI 仅建议，人工确认 |

---

## 十二、产品边界

本系统管理"执行与结果"，不负责：

- 薪酬计算
- 考勤
- 绩效工资结算
