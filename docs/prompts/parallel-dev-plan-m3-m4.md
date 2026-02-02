# M3 + M4 并行开发计划

> 创建日期：2026-02-02
> 目标：并行开发 M3（证据上传+验收）和 M4（工作计划拆解）

---

## 任务总览

| 任务 | 分支名 | 功能模块 | 依赖 | 预计文件数 |
|------|--------|----------|------|-----------|
| 任务1 | `feature/m3-evidence` | 证据上传 | 无 | ~10 |
| 任务2 | `feature/m3-review` | 验收流程 | 无 | ~10 |
| 任务3 | `feature/m4-plan-model` | 计划模型+API | 无 | ~8 |
| 任务4 | `feature/m4-plan-ui` | 计划前端 | 任务3 | ~10 |

---

## 并行开发流程

```
┌─────────────────────────────────────┐
│  主窗口：分析项目，拆分任务          │
│  输出 4 个独立开发提示词             │
└─────────────────────────────────────┘
                 ↓
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ 新窗口1   │  │ 新窗口2   │  │ 新窗口3   │  │ 新窗口4   │
│ M3证据   │  │ M3验收   │  │ M4模型   │  │ M4前端   │
│ 独立开发  │  │ 独立开发  │  │ 独立开发  │  │ 等任务3   │
└──────────┘  └──────────┘  └──────────┘  └──────────┘
     ↓              ↓              ↓              ↓
   独立提交       独立提交       独立提交       独立提交
                 ↓
┌─────────────────────────────────────┐
│  主窗口：按顺序合并各分支到 main     │
└─────────────────────────────────────┘
```

---

## 提示词文件

| 任务 | 提示词文件 |
|------|-----------|
| 任务1 | [worktree-task-07-m3-evidence.md](./worktree-task-07-m3-evidence.md) |
| 任务2 | [worktree-task-08-m3-review.md](./worktree-task-08-m3-review.md) |
| 任务3 | [worktree-task-09-m4-plan-model.md](./worktree-task-09-m4-plan-model.md) |
| 任务4 | [worktree-task-10-m4-plan-ui.md](./worktree-task-10-m4-plan-ui.md) |

---

## 合并顺序

开发完成后，回到主窗口按以下顺序合并：

```bash
# 确保在主分支
git checkout main
git pull origin main

# 1. 合并 M3 证据上传（无依赖）
git merge feature/m3-evidence --no-ff -m "Merge feature/m3-evidence: 证据上传功能"

# 2. 合并 M3 验收流程（无依赖）
git merge feature/m3-review --no-ff -m "Merge feature/m3-review: 验收流程功能"

# 3. 合并 M4 计划模型（需先合并，UI 依赖它）
git merge feature/m4-plan-model --no-ff -m "Merge feature/m4-plan-model: 工作计划模型和API"

# 4. 合并 M4 计划前端
git merge feature/m4-plan-ui --no-ff -m "Merge feature/m4-plan-ui: 工作计划前端页面"

# 5. 统一运行迁移
pnpm prisma migrate dev

# 6. 验证
pnpm tsc --noEmit
pnpm vitest run
pnpm e2e

# 7. 推送
git push origin main
```

---

## 冲突处理

### 可能的冲突文件

| 文件 | 冲突来源 | 解决方式 |
|------|----------|----------|
| prisma/schema.prisma | 多个分支都修改 | 合并所有模型定义 |
| src/components/layout/sidebar.tsx | 任务4 添加导航 | 保留所有导航项 |

### Schema 合并示例

如果遇到 schema 冲突，确保包含所有模型：

```prisma
// M3 Evidence
model Evidence { ... }
enum EvidenceType { ... }

// M3 Review
model Review { ... }
enum ReviewResult { ... }
enum AiRating { ... }

// M4 Plan
model Plan { ... }
model PlanItem { ... }
enum PlanType { ... }
enum PlanStatus { ... }
```

---

## 验收清单

### M3 证据上传
- [ ] Evidence 模型已创建
- [ ] 文件上传到 public/uploads/evidence/
- [ ] 任务详情页显示证据区块
- [ ] 可以上传、预览、删除证据

### M3 验收流程
- [ ] Review 模型已创建
- [ ] PENDING_REVIEW 状态显示验收按钮
- [ ] 验收通过 → COMPLETED
- [ ] 验收不通过 → IN_PROGRESS + 通知
- [ ] 验收历史正确显示

### M4 工作计划
- [ ] Plan 和 PlanItem 模型已创建
- [ ] 计划 CRUD 正常工作
- [ ] AI 拆解能生成条目
- [ ] 可从条目批量创建任务
- [ ] 侧边栏显示"计划"入口
- [ ] /plans 路由正常访问

---

## 注意事项

1. **分支隔离**：每个任务在独立分支开发，避免相互影响
2. **迁移命名**：每个分支使用不同的迁移名称，避免冲突
3. **任务4依赖**：任务4（M4前端）依赖任务3（M4模型），可以先开发 UI 使用 mock 数据
4. **测试验证**：合并后运行完整测试套件确保功能正常
