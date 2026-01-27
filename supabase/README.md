# Supabase 数据库迁移

本目录包含 DontGetCaught.AI 项目的数据库迁移文件。

## 📋 迁移文件列表

1. **001_initial_schema.sql** - 创建核心数据表
   - `style_samples` - 用户上传的写作样本
   - `style_chunks` - 文本分块和向量嵌入
   - `style_profiles` - 用户风格画像
   - `writing_tasks` - 写作任务
   - `task_versions` - 生成文本版本

2. **002_enable_pgvector.sql** - 启用 pgvector 扩展
   - 启用 PostgreSQL vector 扩展
   - 创建向量索引（IVFFlat）
   - 创建相似度搜索辅助函数

3. **003_rls_policies.sql** - 行级安全策略
   - 确保用户只能访问自己的数据
   - 为所有表设置 RLS 策略

## 🚀 如何使用

### 方法 1: 使用 Supabase CLI（推荐）

1. 安装 Supabase CLI：
   ```bash
   npm install -g supabase
   ```

2. 登录 Supabase：
   ```bash
   supabase login
   ```

3. 链接到你的项目：
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. 运行迁移：
   ```bash
   supabase db push
   ```

### 方法 2: 使用 Supabase Dashboard（简单）

1. 访问你的 Supabase 项目：https://supabase.com/dashboard/project/YOUR_PROJECT_ID

2. 进入 **SQL Editor**

3. 按顺序复制并执行迁移文件内容：
   - 先执行 `001_initial_schema.sql`
   - 再执行 `002_enable_pgvector.sql`
   - 最后执行 `003_rls_policies.sql`

## ✅ 验证迁移成功

执行以下 SQL 来验证表是否创建成功：

```sql
-- 查看所有表
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 验证 pgvector 扩展
SELECT * FROM pg_extension WHERE extname = 'vector';

-- 查看 RLS 策略
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';
```

## 📊 数据库结构概览

```
auth.users (Supabase 自带)
    ↓
style_profiles (1:1)
    ↓
style_samples (1:N)
    ↓
style_chunks (1:N, 包含 vector embeddings)

writing_tasks (1:N)
    ↓
task_versions (1:N)
```

## 🔐 Storage Bucket 设置

除了数据库表外，还需要在 Supabase Dashboard 创建 Storage Bucket：

1. 进入 **Storage** → **Create a new bucket**
2. Bucket 名称：`style-samples`
3. 设置为 **Private** （仅认证用户可访问）
4. 添加 RLS 策略：
   ```sql
   -- 用户只能访问自己的文件
   CREATE POLICY "Users can upload own files"
   ON storage.objects FOR INSERT
   WITH CHECK (bucket_id = 'style-samples' AND auth.uid()::text = (storage.foldername(name))[1]);

   CREATE POLICY "Users can view own files"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'style-samples' AND auth.uid()::text = (storage.foldername(name))[1]);

   CREATE POLICY "Users can delete own files"
   ON storage.objects FOR DELETE
   USING (bucket_id = 'style-samples' AND auth.uid()::text = (storage.foldername(name))[1]);
   ```

## 🛠️ 故障排除

### 问题：pgvector 扩展无法安装

**解决方案**：确保你的 Supabase 项目支持 pgvector。大多数新项目默认支持，如果不支持，请联系 Supabase 支持。

### 问题：迁移执行失败

**解决方案**：
1. 检查是否按顺序执行（001 → 002 → 003）
2. 查看错误信息，确保没有表名冲突
3. 如果需要重新开始，先删除所有表再重新执行

## 📝 注意事项

- ⚠️ 生产环境执行迁移前，请先在测试环境验证
- 🔄 迁移文件一旦执行，不应修改历史文件，而是创建新的迁移文件
- 🗄️ 建议定期备份数据库
