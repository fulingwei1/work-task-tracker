# 独立开发提示词：任务 6 - 督办定时任务与通知创建

**复制下面整段「快速启动提示词」到新 Claude 窗口。前提：任务 3（task-api）与任务 5（notifications）已合并到 main。**

---

## 快速启动提示词（复制从这里开始）

```
项目路径：/Users/flw/work-task-tracker

请按「Git Worktree」流程完成 **任务 6：督办定时任务与通知创建**。**前提**：main 已包含任务 3（task-api）和任务 5（notifications），即已有任务模型、通知模型与通知 API。

### 一、Git 命令（在项目根目录执行）

```bash
cd /Users/flw/work-task-tracker
git checkout main
git pull origin main || true

git worktree add .worktrees/feature-supervisory -b feature/supervisory
cd .worktrees/feature-supervisory
npm install
```

### 二、任务要求

1. **规范**：遵循 `docs/ai-spec/` 与 `docs/plans/2026-02-01-task-loop-system-design.md` 第七节（督办规则）。
2. **督办规则（摘要）**：
   - 截止前 2 天：站内通知 TASK_DUE_SOON，接收人=负责人。
   - 截止当天 / 逾期：站内通知 TASK_OVERDUE 等，接收人=负责人（+ 主管可选）。
   - 7 天未更新进度：站内通知 TASK_NO_UPDATE，接收人=负责人。
   - 阻塞超过 2 天：站内通知 TASK_BLOCKED，接收人=负责人+主管。
   - 同一任务同一触发类型，24 小时内不重复发送（用 NotificationLog 或等价逻辑去重）。
3. **实现**：
   - 使用 **node-cron**（或 Next.js 内可用的定时方案）在固定时间执行扫描（例如每天 9:00、10:00、14:00 各一次，或合并为单次扫描多类规则）。
   - 扫描任务表（未删除、未取消），按截止日期、最后更新日期、状态（BLOCKED）判断，创建对应 Notification 记录；可选同时写入 NotificationLog 便于去重与审计。
   - 企业微信推送：M1 可为 Stub（仅打日志或预留接口），不强制实现。
4. **验收**：定时任务运行后，符合条件的任务能产生对应类型通知；24h 去重生效；无 `any`。
5. **部署说明**：在 README 或 `docs/ai-spec/00-project-context.md` 中注明「需在服务器/进程中启动 cron 或等效调度」，避免仅依赖 Vercel serverless 无常驻进程导致不执行。

### 三、完成后的 Git 命令

在 **worktree 目录**（`.worktrees/feature-supervisory`）执行：

```bash
git add .
git status
git commit -m "feat(supervisory): cron for due/overdue/no-update/blocked, create notifications, 24h dedup"
git push origin feature/supervisory
```

完成后请告知：worktree 路径、分支名、以及「可合并到 main」的结论。不要在此窗口合并到 main。
```

---

## 复制到这里结束

---

- 合并顺序：任务 6 为最后合并的分支，必须在任务 5 之后。
- 删除 worktree（合并后）：`git worktree remove .worktrees/feature-supervisory`，`git branch -d feature/supervisory`。
