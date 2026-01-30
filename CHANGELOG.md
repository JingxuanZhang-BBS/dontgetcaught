# 版本历史

本文件记录项目的重要改动和版本历史。

---

## 2026-01-30 Step 5 完成

**✅ Step 5 完成 - 文本分块与OpenAI Embeddings**

**新增功能**：
- 文本分块：将文档按语义边界分割成300-500词的块
- OpenAI Embeddings：使用 text-embedding-ada-002 生成1536维向量
- 自动索引：英文内容上传后自动进行分块和向量化
- 状态流转：`parsing` → `indexed`（成功）或 `error`（失败）

**新增文件**：
- `src/lib/vector/chunker.ts` - 文本分块模块
- `src/lib/vector/embeddings.ts` - OpenAI Embeddings模块
- `src/lib/vector/indexer.ts` - 索引帮助函数
- `src/lib/vector/index.ts` - 模块导出
- `src/app/api/process-sample/route.ts` - 手动索引API端点

**修改文件**：
- `src/app/api/upload/route.ts` - 添加自动索引调用
- `src/app/api/paste/route.ts` - 添加自动索引调用
- `src/app/api/samples/[id]/route.ts` - 修复Next.js 15 async params
- `package.json` - 添加openai依赖

**测试验证**：
- ✅ 英文DOCX上传 → 自动分块 → 生成embeddings → 状态变为绿色"Ready"
- ✅ Supabase `style_chunks` 表有对应的embedding记录

---

## 2026-01-30 Step 4 完成

**✅ Step 4 完成 - 语言检测门控**

**新增功能**：
- 使用 franc 库进行语言检测
- 英文内容（>90%）→ 正常处理
- 非英文内容（<50%）→ 标记为 `lang_failed`，显示红色警告
- 混合语言（50-90%）→ 标记为 `lang_failed`，显示黄色建议
- 上传区域添加 "English Only" 提示标签

**新增文件**：
- `src/lib/language/detector.ts` - 语言检测模块

**修改文件**：
- `src/app/api/upload/route.ts` - 集成语言检测
- `src/app/api/paste/route.ts` - 集成语言检测
- `src/components/UploadZone.tsx` - 添加英文提示
- `src/components/StyleSampleCard.tsx` - 显示语言错误详情
- `src/app/(dashboard)/style-library/page.tsx` - 语言警告提示

**测试验证**：
- ✅ 英文文本/文档 → 正常处理，显示单词数
- ✅ 中文文本 → 显示 "Non-English Content Detected"
- ✅ 中英混合 → 显示 "Mixed Language Content Detected"

---

## 2026-01-30 Step 3 完成

**✅ Step 3 完成 - 文本解析与清理（DOCX）**

**新增功能**：
- DOCX 文件上传后自动解析提取文本
- 文本清理（去除页码、多余空白等）
- 英文单词统计
- 数据库保存 `raw_text`、`cleaned_text`、`word_count_en`

**新增文件**：
- `src/lib/parsing/docx-parser.ts` - DOCX 解析器（使用 mammoth）
- `src/lib/parsing/pdf-parser.ts` - PDF 解析器（待修复）
- `src/lib/parsing/text-cleaner.ts` - 文本清理工具
- `src/lib/parsing/index.ts` - 统一解析接口
- `src/app/api/process-sample/route.ts` - 处理样本 API

**修改文件**：
- `src/app/api/upload/route.ts` - 上传后自动触发解析

**已知问题**：
- ⚠️ PDF 解析暂不可用（pdf-parse 2.x API 变更，待后续修复）

**测试验证**：
- ✅ DOCX 上传 → 解析 → 单词数显示
- ✅ 粘贴文本功能正常（未受影响）
- ✅ 进度条正确累计单词数

---

## 2026-01-30 回退

**⏪ 回退：撤销 Step 3 所有改动**

Step 3 实现过程中遇到多个级联错误，决定回退到 Step 2 完成的稳定状态：
- 撤销的改动：
  - `src/lib/parsing/` 目录及所有解析模块
  - `src/app/api/process-sample/route.ts` API 端点
  - `src/app/api/upload/route.ts` 的解析触发逻辑
  - `src/app/api/paste/route.ts` 的文本清理逻辑
  - `src/types/database.ts` 的 'parsed' 状态
  - `src/components/StyleSampleCard.tsx` 的解析状态显示
  - `src/app/(dashboard)/style-library/page.tsx` 的自动刷新
  - mammoth 和 pdf-parse 依赖

- 回退到 commit: `9f0e20a`

**状态**: 回到 Step 2 完成状态，所有功能正常工作

---

## 2026-01-28 20:45

**✅ Step 2 完成 - 后端 API 全流程打通 + Supabase 配置完成**

**Supabase 配置**：
- 成功执行所有数据库迁移
- 创建 Storage bucket 并配置 RLS 策略
- 完成用户注册和认证测试
- 修复迁移文件幂等性问题（添加 IF NOT EXISTS）

**后端 API 实现**：
- ✅ `POST /api/upload` - 文件上传到 Supabase Storage
  - 支持 .docx 和 .pdf（最大 10MB，10 个文件）
  - 自动验证文件类型和大小
  - 存储文件 + 创建数据库记录
  - 失败时自动清理
- ✅ `POST /api/paste` - 粘贴文本保存
  - 支持最多 10,000 词
  - 自动计算单词数
  - 直接存储到数据库
- ✅ `GET /api/samples` - 获取用户样本列表
  - 按时间倒序排序
  - RLS 自动过滤用户数据
- ✅ `DELETE /api/samples/[id]` - 删除样本
  - 同时删除 Storage 文件和数据库记录
  - 验证所有权

**前端集成**：
- 更新 Style Library 页面调用真实 API
- 实现上传/粘贴/删除完整流程
- 修复进度条统计逻辑（临时统计所有样本，等 Step 3-5 完成后改为只统计已索引样本）
- 关闭开发模式（`NEXT_PUBLIC_DEV_MODE=false`）

**测试验证**：
- ✅ 文件上传 → Storage + 数据库 → 页面显示
- ✅ 粘贴文本 → 数据库 → 单词数统计 → 进度条更新
- ✅ 删除样本 → Storage + 数据库清理 → 页面刷新
- ✅ 用户注册和登录流程正常

**已知限制（等待后续 Step 实现）**：
- 文件上传后 word_count_en = 0（Step 3 实现文本解析后会更新）
- detected_language = 'unknown'（Step 4 实现语言检测）
- status = 'uploaded'（Step 5 向量化后更新为 'indexed'）

**Commit**: a725205

---

## 2026-01-27 17:35

**Step 2 完成 - 数据库 Schema & 上传 UI（开发模式）**

**数据库迁移**：
- 创建完整的 SQL 迁移文件（待执行）
  - `001_initial_schema.sql` - 核心表结构
  - `002_enable_pgvector.sql` - 向量搜索支持
  - `003_rls_policies.sql` - 行级安全策略
- 添加 Supabase 设置指南（`supabase/README.md`）

**类型定义**：
- 创建 `src/types/database.ts` 包含所有数据库类型
- API 请求/响应类型
- UI 状态类型

**UI 组件**：
- `UploadZone` - 拖拽上传 + 文本粘贴组件
  - 支持 .docx, .pdf 文件（最大 10MB）
  - 单次上传限制：10 个文档或 10,000 字
  - 完整的验证和错误处理
- `StyleSampleCard` - 样本卡片组件
  - 状态显示（颜色编码）
  - 字数统计和元数据
  - 删除功能
- Style Library 页面
  - Mock 数据展示（开发模式）
  - 风格画像准备度进度条
  - Supabase 配置引导

**开发模式体验**：
- 显示 Mock 数据（3 个样本，2400 字）
- 上传/删除操作提示需要配置 Supabase
- 清晰的设置指引，便于后续接入

**Commit**: bd6cd94

---

## 2026-01-27 16:57

**添加开发模式 - 支持无需 Supabase 快速测试**

- 新增 `NEXT_PUBLIC_DEV_MODE` 环境变量（默认启用）
- 登录/注册页面支持开发模式：任何输入都能通过
- 中间件支持 mock 用户会话（通过 cookie）
- 创建 `SignOutButton` 组件，支持开发模式退出登录
- Dashboard 使用客户端登出按钮
- 添加 `.env.local` 配置文件
- Mock 用户：`dev@example.com (Dev Mode)`

**改进**：现在可以不配置 Supabase 直接测试产品功能和 UI/UX

**Commit**: bc550ec

---

## 2026-01-27 16:35

**初始提交 - Step 1 完成**

- 初始化 Next.js 14+ 项目（App Router + TypeScript + Tailwind CSS）
- 集成 Supabase 认证系统（@supabase/ssr）
- 实现三种 Supabase 客户端模式（Browser/Server/Middleware）
- 创建认证页面（登录/注册）
- 实现路由保护中间件
- 创建 Landing Page（强调 English-only MVP）
- 创建 Dashboard 基础结构和占位页面
- 添加项目文档（README.md, spec.md, CLAUDE.md）
- 配置 .gitignore 和版本控制
- 开发服务器成功启动 (http://localhost:3000)

**技术栈**:
- Next.js 15.1.5 (App Router)
- React 18.3.1
- Supabase (supabase-js 2.93.1 + ssr 0.8.0)
- TypeScript 5.7.2
- Tailwind CSS 3.4.17

**进度**: ✅ Step 1/10 完成

