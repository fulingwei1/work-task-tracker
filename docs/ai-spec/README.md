# AI 可执行规范文档

本目录包含供 AI（Claude/Cursor）在开发时直接引用的结构化规范，目标：**无歧义、可执行**。

## 文档索引

| 文件 | 用途 |
|------|------|
| [00-project-context.md](./00-project-context.md) | 项目路径、技术栈、目录结构、环境变量 |
| [01-code-conventions.md](./01-code-conventions.md) | 代码风格、命名、Server Actions 约定、禁止项 |
| [02-m1-scope.md](./02-m1-scope.md) | M1 功能范围、包含/不包含、验收标准 |
| [03-data-model.md](./03-data-model.md) | Prisma 模型摘要、枚举、关系、索引 |
| [04-api-contracts.md](./04-api-contracts.md) | M1 API 路径、方法、请求/响应格式、权限 |

## 使用方式

- 在新窗口执行「独立开发提示词」时，将本目录路径与相关 spec 文件一并提供给 AI。
- 实现某功能前，先读取对应 spec（如做任务 API 则读 03 + 04）。
- 所有接口、类型、枚举以 spec 为准；与 `docs/plans/` 中设计文档冲突时，以本目录为准（本目录为实施层精简版）。

## 版本

- 与 `docs/plans/2026-02-01-task-loop-system-design.md` 对齐，适用于 M1 阶段。
