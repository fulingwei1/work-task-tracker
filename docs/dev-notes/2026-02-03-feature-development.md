# 开发记录：2026-02-03 新功能开发

> 开发时间：2026-02-03 00:00 - 00:10
> 开发者：AI Assistant (乖乖)

---

## 📋 完成的功能

### 1. 企业微信消息推送框架 ✅

**文件：** `src/lib/wechat/index.ts`

**功能：**
- Access Token 获取和缓存（带过期处理）
- 文本消息发送
- 文本卡片消息发送（更美观，支持跳转）
- 任务提醒消息模板
- 逾期警告消息模板
- 阻塞通知消息模板
- 任务分配通知模板

**集成：**
- 更新了 `src/lib/supervisory/index.ts`
- 截止当天：发送企业微信
- 逾期：发送企业微信给负责人和主管
- 阻塞超2天：发送企业微信给负责人和主管

**经验：**
- 企业微信 API 的 access_token 有效期 7200 秒，需要缓存
- 提前 5 分钟刷新 token 避免过期
- 消息发送失败不应阻塞业务流程

---

### 2. 任务评论功能 ✅

**文件：**
- `src/app/api/tasks/[id]/comments/route.ts` - API
- `src/components/task/comment-list.tsx` - 前端组件

**功能：**
- 获取评论列表（分页）
- 创建评论
- 评论通知（通知任务负责人和创建者）
- 支持 Cmd/Ctrl + Enter 快捷发送

**数据模型变更：**
```prisma
model Comment {
  id        String   @id @default(cuid())
  taskId    String
  userId    String
  content   String   @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**经验：**
- API 响应函数命名要与现有代码一致（successSingle vs apiSuccess）
- Session 用户 ID 字段是 `id` 不是 `userId`
- 评论通知要避免通知自己

---

### 3. 证据上传功能 ✅

**文件：**
- `src/app/api/tasks/[id]/evidences/route.ts` - 上传 API
- `src/app/api/evidences/[id]/route.ts` - 删除 API
- `src/components/task/evidence-list.tsx` - 前端组件

**功能：**
- 支持四种证据类型：FILE、IMAGE、LINK、TEXT
- 文件上传（最大 10MB）
- 支持图片、PDF、Office 文档、压缩包等
- 链接添加（带 URL 验证）
- 文本记录
- 证据删除（带权限检查）
- 删除文件时同时删除物理文件

**数据模型：**
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
  filename    String?
  url         String
  mimeType    String?
  size        Int?
  description String?      @db.Text
  createdAt   DateTime     @default(now())
}
```

**经验：**
- Next.js App Router 的文件上传用 `request.formData()`
- 上传目录需要提前创建（用 `mkdir` 带 `recursive`）
- 删除权限：上传者、任务负责人、任务创建者、管理员

---

### 4. 任务验收流程 ✅

**文件：**
- `src/app/api/tasks/[id]/reviews/route.ts` - 验收 API
- `src/app/api/tasks/[id]/submit-review/route.ts` - 提交验收 API
- `src/components/task/review-section.tsx` - 前端组件

**功能：**
- 负责人提交验收（状态变为 PENDING_REVIEW）
- 验收人审核（通过/不通过）
- 质量评级（优秀/达标/风险/不达标）
- 评级说明和改进建议
- 验收结果通知
- 验收记录历史

**数据模型：**
```prisma
enum ReviewResult {
  PASS
  FAIL
}

enum QualityRating {
  EXCELLENT
  QUALIFIED
  RISK
  UNQUALIFIED
}

model Review {
  id            String         @id @default(cuid())
  taskId        String
  reviewerId    String
  result        ReviewResult
  failReason    String?        @db.Text
  rating        QualityRating?
  ratingReason  String?        @db.Text
  suggestions   String?        @db.Text
  createdAt     DateTime       @default(now())
}
```

**权限规则：**
- 只有任务负责人可以提交验收
- 任务创建者、主管、管理员可以进行验收
- 不能验收自己负责的任务（管理员除外）

**经验：**
- 验收流程要考虑状态流转：IN_PROGRESS → PENDING_REVIEW → COMPLETED/IN_PROGRESS
- 验收不通过时任务状态回退到 IN_PROGRESS
- 前端需要获取当前用户信息来判断权限

---

## 📊 代码统计

| 类型 | 新增文件 | 修改文件 | 新增行数 |
|------|---------|---------|---------|
| API | 5 | 0 | ~600 |
| 组件 | 3 | 1 | ~900 |
| 库 | 1 | 1 | ~400 |
| Schema | 0 | 1 | ~50 |
| **总计** | **9** | **3** | **~2000** |

---

## 🔧 技术要点

1. **Prisma 类型安全**：用 `@prisma/client` 导出的枚举类型确保类型正确
2. **文件上传**：Next.js 14 用 `formData()` 处理，不需要额外库
3. **权限判断**：在 API 层统一处理，前端只做 UI 控制
4. **通知去重**：使用 NotificationLog 表记录发送历史

---

## ⚠️ 待办事项

- [ ] 企业微信配置后测试消息推送
- [ ] 添加评论的编辑和删除功能
- [ ] 证据预览（图片缩略图、PDF 预览）
- [ ] 验收评级的统计报表

---

## 🎯 下一步

1. 配置企业微信 CorpID、AgentID、Secret
2. 测试完整的任务生命周期流程
3. 开始 M4 计划管理功能开发
