# 版本历史

本文件记录项目的重要改动和版本历史。

---

## 2026-03-12 UI polish: grid devtools + 界面优化
- 新增 GridBackground (THREE.js shader 透视网格 + scan 动效)
- 新增 GridDevTools 浮窗调试工具：实时滑块控制所有 grid 参数、颜色选择器、copy/reset
- 新增 CreditsDisplay 进度条（导航栏显示剩余 credits）
- 新增 credits.ts（localStorage 存储，生成后扣除）
- TextPressure 字体还原为 Compressa VF（恢复变宽/变重动效）
- Dashboard 导航 logo 改为链接到首页
- Dashboard 卡片对比度提升、文字加亮
- Login/Signup 页面改为深色主题

---

## 2026-02-06 Steps 8-10 完成 + 多语言检测修复

**✅ Step 8 完成 - Revision & Version Management**
- 修订 API、版本 API、修订 UI、版本切换

**✅ Step 9 完成 - Export .docx**
- docx 生成模块、导出 API、导出按钮

**✅ Step 10 完成 - History, Settings, Data Management**
- History 页面（任务/版本浏览、删除、导出）
- Settings 页面（账户信息、登出、清除数据）
- Dashboard 页面（实时统计、就绪进度条）

**✅ 任务组 A 修复 - 多语言检测**
- 6 层检测：非拉丁字符 → 西班牙标点 → 拉丁变音符 → 非英语词库 → franc → 英文比例
- 覆盖 16+ 非拉丁文字系统 + 5 种拉丁语系语言（西/法/葡/德/意）
- 修复 revise/generate 路由语言校验漏洞
- 修复短英文文本 franc 误判问题

**Commit**: 8643a18

---

## 2026-02-01 Step 7 增强 - Reference Files 功能

**新增 Reference Files 上传功能**：
- 支持上传 .docx 文件作为参考资料（最多3个，每个2MB）
- 参考内容会被解析并整合到生成提示词中
- 内容超过8000字符会自动截断

**修改文件**：
- `src/components/TaskForm.tsx` - 添加文件上传UI
- `src/app/(dashboard)/new-task/page.tsx` - 使用FormData发送请求
- `src/app/api/generate/route.ts` - 处理文件上传和解析
- `src/lib/generation/prompt-builder.ts` - 整合参考内容到提示词

---

## Step 10 完成后待返工事项清单

以下是各 Step 完成后标记的待返工事项，将在 Step 10 完成后统一处理：

### Step 8 待返工
1. **生成文本AI味过重** - 修订后的文本仍然有明显AI痕迹，需要整体重塑生成逻辑
   - 统一在所有Step完成后对 prompt-builder + revision-builder + generator 进行全面优化
   - 目标：生成内容通过AI检测工具（GPT0等）
2. **短文本中文检测失败** - 修订指令输入短中文时 franc 无法识别为非英语，导致中文被混入修改
   - 原因：franc 对短文本（<20字符）检测不准
   - 方案：增加 CJK 字符正则预检测，短文本先用正则判断再用 franc

### Step 7 待返工
1. **Reference Files PDF支持** - 目前只支持 .docx，需要添加 .pdf 上传作为参考资料
2. **AI检测规避优化** - 目标：GPT0等平台检测率 < 20%
   - 方案A：提供AI经典表达规避文档，避免模块化/规律化表达
   - 方案B：丰富个人风格库，增强输出的个人特色

### Step 3 待返工
1. **Style Samples PDF上传支持** - 风格样本目前只支持 .docx 和粘贴文本，需要修复 pdf-parse 兼容性问题以支持 .pdf 上传
   - 原因：pdf-parse 2.x API 变更导致解析失败（Step 3 已知问题）
   - 方案：降级 pdf-parse 或换用其他 PDF 解析库

### Step 6 待返工
- （如有，后续补充）

### Step 5 待返工
- （如有，后续补充）

### Step 4 待返工
- （如有，后续补充）

### Step 2 待返工
- （如有，后续补充）

### Step 1 待返工
- （如有，后续补充）

---

## 2026-02-01 Step 7 完成

**✅ Step 7 完成 - Task Creation and Text Generation (任务创建与文本生成)**

**核心特性**：
实现了完整的写作任务创建和风格匹配文本生成功能：

1. **任务表单** - 标题、写作类型（个人叙事/议论文/通用）、需求描述
2. **向量搜索** - 使用pgvector搜索相似风格片段（cosine similarity）
3. **提示词构建** - 整合风格画像 + 样本片段 + 任务需求
4. **GPT-4o生成** - temperature 0.85, max_tokens 4000
5. **结果展示** - 生成文章、用量统计、成本估算、一键复制

**新增文件**：
- `src/app/api/generate/route.ts` - 生成API端点
- `src/components/TaskForm.tsx` - 任务表单组件
- `src/components/GeneratedResult.tsx` - 结果展示组件
- `src/lib/generation/generator.ts` - GPT-4o调用模块
- `src/lib/generation/prompt-builder.ts` - 提示词构建模块
- `src/lib/generation/index.ts` - 生成模块导出
- `src/lib/vector/search.ts` - 向量搜索模块
- `supabase/migrations/004_vector_search_function.sql` - 向量搜索RPC函数

**修改文件**：
- `src/app/(dashboard)/new-task/page.tsx` - 完整任务创建页面
- `src/lib/vector/index.ts` - 添加搜索模块导出

---

## 2026-01-31 Step 6 完成

**✅ Step 6 完成 - Style Profile Analysis (风格画像分析)**

**核心特性**：
实现了6大指标类别的纯JavaScript统计分析（无需GPT API调用）：

1. **词汇画像 (Lexical)** - n-grams, TTR, MTLD, 缩写率, 拼写风格
2. **句法画像 (Syntax)** - 句长分布, 从句密度, 段落结构
3. **模板库 (Patterns)** - 签名开头/结尾, 修辞框架
4. **错误画像 (Errors)** - 拼写错误, 冠词错误, 逗号拼接, 时态一致性
5. **语气人格 (Voice)** - 模糊/强调词, 正式度, 态度, 自我提及
6. **篇章结构 (Discourse)** - 过渡词, 衔接性, 话题发展

**新增文件**：
- `src/lib/style/metrics/lexical.ts` - 词汇分析模块
- `src/lib/style/metrics/syntax.ts` - 句法分析模块
- `src/lib/style/metrics/patterns.ts` - 模式提取模块
- `src/lib/style/metrics/errors.ts` - 错误检测模块（关键：避免AI检测）
- `src/lib/style/metrics/voice.ts` - 语气分析模块
- `src/lib/style/metrics/discourse.ts` - 篇章分析模块
- `src/lib/style/metrics/index.ts` - 指标模块导出
- `src/lib/style/analyzer.ts` - 聚合模块 + LLM提示词生成
- `src/lib/style/index.ts` - 风格模块导出
- `src/app/api/style-profile/route.ts` - GET/POST API端点
- `src/components/StyleProfileDisplay.tsx` - 3标签UI组件

**修改文件**：
- `src/app/(dashboard)/style-library/page.tsx` - 集成StyleProfileDisplay

**UI功能**：
- Summary标签：关键特征、风格标记、签名短语、自然瑕疵、生成指南
- Details标签：所有细粒度指标数据
- LLM Prompt标签：生成的系统提示词（用于Step 7生成）

**关键亮点**：
- 错误画像检测"自然瑕疵"（comma splices, tense shifts等）帮助生成更人性化的文本
- 自动生成LLM系统提示词，包含所有风格特征

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


## 2026-03-12 存档
- 业务转型：去除 style library，改为 prompt-first 极简工作台
- 首页：背景换成 muted slate 渐变，主 CTA 改为 prompt 输入框
- Dashboard layout：精简导航，加积分显示占位
- Dashboard page：全新工作台 UI（prompt + 文件上传 + 写作类型/字数 + 输出区）
- Generate API：移除 style profile / vector 逻辑，留 Gemini Flash 集成 TODO 占位
