# 快速启动：并行开发总览

本目录包含 **6 个独立开发提示词**，对应 6 个 Git Worktree 任务。

- **想重新生成整套规划**：复制 [master-quick-start-prompt.md](./master-quick-start-prompt.md) 中「从这里开始」到「到这里结束」的整段内容，粘贴到 **主窗口** 新对话执行。
- **直接开始并行开发**：在主窗口完成规划后，按下面流程在新窗口使用各任务提示词。

---

## 整体流程

1. **主窗口（本窗口）**  
   - 已生成：`docs/ai-spec/`、`docs/parallel-dev-plan.md`、`docs/prompts/worktree-task-01-*.md` … `worktree-task-06-*.md`。  
   - 无需再执行分析；若需重新生成，可复制「快速启动提示词」到主窗口让 AI 重新跑一遍流程。

2. **新窗口并行开发**  
   - 按 **合并顺序** 依次完成，或 **可并行** 的任务（如 4 与 5）在不同窗口同时进行：
     - 任务 1 → 任务 2 → 任务 3 → 任务 4 / 5（可并行）→ 任务 6。  
   - 每个新窗口：打开对应 `docs/prompts/worktree-task-XX-*.md`，复制其中「快速启动提示词」整段，粘贴到新 Claude 窗口执行。  
   - 在该窗口内完成：创建 worktree → 开发 → 自测 → 提交（及可选 push）。**不要在新窗口合并到 main。**

3. **主窗口合并**  
   - 回到主仓库 `cd /Users/flw/work-task-tracker`，`git checkout main`。  
   - 按 `docs/parallel-dev-plan.md` 第四节「主窗口按顺序合并」执行 merge。  
   - 合并后可选：删除已合并的 worktree 与分支（见各任务提示词末尾）。

---

## 提示词文件列表

| 任务 | 文件 | 依赖 |
|------|------|------|
| 1 脚手架与布局 | [worktree-task-01-foundation.md](./worktree-task-01-foundation.md) | 无 |
| 2 数据模型与认证 | [worktree-task-02-schema-auth.md](./worktree-task-02-schema-auth.md) | 1 |
| 3 任务 CRUD 与进度 API | [worktree-task-03-task-api.md](./worktree-task-03-task-api.md) | 2 |
| 4 任务相关页面与组件 | [worktree-task-04-task-ui.md](./worktree-task-04-task-ui.md) | 3 |
| 5 通知 API 与通知页 | [worktree-task-05-notifications.md](./worktree-task-05-notifications.md) | 3（可与 4 并行） |
| 6 督办定时任务 | [worktree-task-06-supervisory.md](./worktree-task-06-supervisory.md) | 3, 5 |

---

## 项目路径

- **仓库根**：`/Users/flw/work-task-tracker`  
- **Worktree 根**：`.worktrees/<branch-name>`（例如 `.worktrees/feature-foundation`）。  
- 创建 worktree 前请确认 `.worktrees` 已写入 `.gitignore`（任务 1 的提示词会执行 `echo ".worktrees" >> .gitignore` 若尚未包含）。
