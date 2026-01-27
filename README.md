# English Style Writer

AI-powered English writing assistant that learns and mimics your personal writing style.

## 项目概览

这是一个 English-only 的写作风格学习与生成系统，用户上传 3-5 篇英文文章，系统提取写作风格并建立向量库，之后可以生成符合用户个人风格的新内容。

## 技术栈

- **前端框架**: Next.js 14+ (App Router)
- **数据库**: Supabase (PostgreSQL + pgvector + Auth + Storage)
- **向量数据库**: Supabase pgvector
- **LLM API**: OpenAI (GPT-4o/GPT-4)
- **样式**: Tailwind CSS
- **语言**: TypeScript

## 开发步骤进度

- [x] **Step 1**: 项目基础 & 认证系统
- [ ] **Step 2**: 数据库 Schema & 文件上传
- [ ] **Step 3**: 文本解析 & 清洗
- [ ] **Step 4**: 语言检测
- [ ] **Step 5**: 文本分块 & 向量嵌入
- [ ] **Step 6**: 风格画像分析
- [ ] **Step 7**: 新任务创建 & 生成
- [ ] **Step 8**: 修订 & 版本管理
- [ ] **Step 9**: Word 文档导出
- [ ] **Step 10**: 历史记录、设置 & 数据管理

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 设置 Supabase

1. 访问 [Supabase](https://supabase.com) 创建新项目
2. 获取项目的 URL 和 API Keys：
   - 项目设置 → API → Project URL
   - 项目设置 → API → anon/public key
   - 项目设置 → API → service_role key

### 3. 配置环境变量

创建 `.env.local` 文件：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI (Step 5 之后需要)
OPENAI_API_KEY=your_openai_api_key
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 项目结构

```
dontgetcaught/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # 认证页面组
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── (dashboard)/       # 受保护路由组
│   │   │   ├── dashboard/
│   │   │   ├── style-library/
│   │   │   ├── new-task/
│   │   │   ├── history/
│   │   │   └── settings/
│   │   ├── api/               # API 路由
│   │   └── page.tsx           # 首页
│   ├── components/            # React 组件
│   ├── lib/                   # 核心库
│   │   ├── supabase/         # Supabase 客户端
│   │   ├── parsing/          # 文本解析
│   │   ├── language/         # 语言检测
│   │   ├── style/            # 风格分析
│   │   ├── vector/           # 向量嵌入
│   │   ├── generation/       # 文本生成
│   │   └── export/           # 导出功能
│   └── types/                 # TypeScript 类型定义
├── supabase/
│   └── migrations/            # 数据库迁移
└── spec.md                    # 项目规格文档
```

## 数据库设置（Step 2）

在 Step 2 中，你需要在 Supabase 中运行数据库迁移来创建所需的表和扩展。

## 功能特性

### 已完成 (Step 1)
- ✅ 用户注册和登录
- ✅ 受保护的路由
- ✅ 基础 Dashboard
- ✅ 响应式导航

### 待开发
- ⏳ 文件上传（Word/PDF/文本）
- ⏳ 语言检测（English-only）
- ⏳ 风格画像提取
- ⏳ AI 内容生成
- ⏳ 版本管理
- ⏳ Word 导出

## 开发说明

### 路由保护

项目使用 middleware.ts 来保护需要认证的路由：
- `/dashboard/*` 页面需要登录
- 未登录用户会被重定向到 `/login`
- 已登录用户访问 `/login` 或 `/signup` 会被重定向到 `/dashboard`

### Supabase 客户端

- `lib/supabase/client.ts` - 浏览器端客户端（用于客户端组件）
- `lib/supabase/server.ts` - 服务器端客户端（用于服务器组件和 API 路由）

## 下一步

完成 Step 1 后，下一步是 **Step 2: Database Schema & File Upload**，将实现：
1. 创建数据库表和启用 pgvector 扩展
2. 设置 Supabase Storage bucket
3. 实现文件上传 UI 和 API

## License

Private Project
