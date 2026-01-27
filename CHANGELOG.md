# 版本历史

本文件记录项目的重要改动和版本历史。

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

