# 代码规范（AI 执行用）

## 语言与命名

- **解释与讨论**：中文。
- **标识符**（变量、函数、类型、文件）：英文。
- **注释与 UI 文案**：英文（除非产品明确要求中文）。

## 风格原则

- 不过度设计；优先简单、可读、可维护。
- 控制圈复杂度：拆函数、复用逻辑，避免巨型函数。
- 模块边界清晰：按职责拆分（如 Repository / Service）；不为了用模式而用模式。
- **最小修改**：变更尽量限于当前模块；非必要不改变其他模块行为或接口。

## 前端 / UI

- **组件库**：一律使用 shadcn/ui；优先复用现有组件，不随意造轮子。
- **样式**：尽量用 Tailwind；若需自定义，优先 Tailwind 工具类，类名简洁、语义清晰。
- **默认**：React Server Components；仅在有浏览器交互（事件、状态、useEffect）时在文件顶行加 `"use client"`。
- **图片**：必须使用 `next/image`，禁止原生 `<img>`。

## 类型与数据

- **禁止** `any`。
- 所有数据库访问基于 Prisma 生成类型；禁止「先 any 再补类型」。

## Server Actions

- 返回结构固定包含：`{ success: boolean; message: string }`。
- 需带数据时在此结构上扩展字段，但 `success` 与 `message` 必须存在且语义明确。

## API 响应

- 成功：`{ data?: T; meta?: { total, page, limit }; success?: true }`，或与 Server Actions 一致的结构。
- 错误：HTTP 4xx/5xx + 统一错误体（如 `{ error: string; code?: string }`）。

## Git 提交

- 使用 Conventional Commits：`type(scope): subject`。
- type：`feat` | `fix` | `docs` | `chore` | `refactor`。
