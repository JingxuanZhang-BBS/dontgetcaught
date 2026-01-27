# spec.md — "English Style Writer" (方案二：风格画像 + 向量库) — v0.2 (English-only)

> 版本：v0.2（MVP，English-only）
> 范围：仅支持英文写作风格学习与生成；非英文内容会提示并拒绝进入风格库/生成流程。

---

## 1. 项目概览 (Project Overview)

**一句话**：用户上传 3–5 篇英文旧文章，系统提取其英文写作"风格画像"（含自然不完美特征）并建立向量风格库；用户输入新的英文题目/要求后，系统检索相关风格片段并生成更像用户本人英文文章，支持轻量迭代与导出（文本 / Word）。

**核心价值（English-only 强化版）**：
- 针对英文写作"AI味"问题：过度标准语法、过度正式、缺乏个人语感
- 保留英文个人特征：sentence rhythm、word choice、punctuation habits、preferred transitions、typical minor grammar quirks（不影响理解）
- 极简体验：Upload English samples → Write prompt → Generate → One-line revision → Export .docx

**明确不做（MVP）**：
- 多语言写作/翻译
- 中英混写风格学习（将视为不支持或需要用户清理样本）

---

## 2. 用户流程 & UI 设计（English-only）

### 2.1 语言限制策略
- 上传样文后，系统必须进行 **Language Detection**
  - 若检测为非英文：提示用户"Only English is supported"并阻止入库
  - 若为混合语言：提示用户清理非英文段落或仅保留英文部分后再上传
- 新写作任务输入也需检测：
  - 如果用户输入中文题目/要求：提示"Please provide the task in English."

### 2.2 页面与交互（与 v0.1 相同，但文案与校验改为 English-only）
1) Landing（首页）
- 核心文案强调：**English-only**
- FAQ 增加：
  - "Do you support other languages?" → "Not in MVP."
  - "Will it intentionally add mistakes?" → "It preserves your natural imperfections without harming clarity."

2) Style Library（样文管理）
- 上传支持：Word / PDF / Paste text（但必须英文）
- 每条样文状态：
  - Parsing
  - Language Check Failed (Non-English / Mixed)
  - Embedded & Indexed
- 提示：建议总字数达到阈值（例如 2,000–6,000 English words）

3) New Task（新写作任务）
- 输入项均以英文描述与示例呈现
- 默认类型：
  - Personal narrative
  - Argumentative / persuasive essay
  - General
- 生成前校验：任务文本必须为英文

4) Revision（轻量迭代）
- 用户用自然语言给修改指令（英文）
  - e.g., "More like me—less polished, more conversational."
  - 若用户用中文输入微调：提示改用英文

---

## 3. 技术栈 (Tech Stack) — English-only 关键点

### 3.1 向量库与检索
- 向量库：Pinecone / Supabase Vector / Weaviate（三选一）
- Embeddings 模型：优先选对英文语义表现稳定的 embedding
- Chunking 以英文句段为单位（段落/句群），避免中文分句问题

### 3.2 文本解析
- Word / PDF 解析后：
  1) 清洗（去页眉页脚、目录噪声）
  2) 英文检测（language detection）
  3) 分段与入库

### 3.3 英文风格画像（Style Profile）
MVP 的风格画像应围绕英文维度抽取并缓存（存 DB）：
- Sentence length distribution（短句/长句占比）
- Punctuation habits（comma density, em-dash, semicolon usage）
- Preferred transitions（"However", "Honestly", "I think", etc.）
- Voice & tone markers（casual vs formal, hedging words like "maybe", "kind of"）
- Common quirks（轻微不完美）
  - occasional fragments
  - minor tense inconsistency
  - informal contractions ("I'm", "don't")
> 注意：不追求"造错"，而是"保留用户的自然写法"。必须保证可读性。

---

## 4. 核心功能 & 逻辑（English-only 版）

### 4.1 样文入库流程（Upload → Parse → Detect → Index）
伪流程：
1) 用户上传样文（docx/pdf/text）
2) 系统解析出纯文本
3) language_detect(text)
   - if not English → mark failed + show message
   - if mixed → mark mixed + suggest cleaning
4) chunk(text) into English paragraph/sentence blocks
5) embed(chunks) → upsert into vector DB (namespace = user_id, type = "style_sample")
6) update style_profile(user_id) based on aggregated samples

### 4.2 生成流程（Retrieve → Compose Prompt → Generate）
伪流程：
1) 用户提交英文任务（title + requirements）
2) language_detect(task) must be English
3) retrieve topK style chunks from vector DB using task as query
4) build generation prompt:
   - system: "Write in the user's style (English-only), preserve natural imperfections without hurting clarity."
   - include: style_profile summary
   - include: retrieved chunks as style exemplars (short, bounded)
   - include: task requirements
5) LLM generate draft
6) show draft + allow revision instruction (English-only)
7) revision → rerun generation with "revision instruction" + previous draft context (bounded)

### 4.3 导出 Word
- 输出为 .docx（保留段落结构）
- 字体与排版默认极简（MVP 不做复杂模板）

---

## 5. 数据结构（更新：增加 language 字段与失败状态）

### 5.1 style_samples（样文）
- id
- user_id
- filename
- source_type: "docx" | "pdf" | "paste"
- raw_text (optional, if stored; 可仅存清洗后文本)
- detected_language: "en" | "non_en" | "mixed" | "unknown"
- status: "parsing" | "lang_failed" | "indexed" | "error"
- word_count_en (estimate)
- created_at

### 5.2 style_profile（风格画像）
- user_id
- language: "en" (固定)
- metrics_json:
  - sentence_length_hist
  - punctuation_usage
  - transition_phrases_top
  - tone_markers
  - quirks_summary
- readiness:
  - is_ready: boolean
  - total_english_words
  - recommended_threshold_words

### 5.3 writing_tasks / generations（任务与版本）
- task_id, user_id
- task_language: "en"
- title, prompt_text
- versions: [{version_id, text, created_at, revision_instruction?}]
- export_count

---

## 6. 文件结构 (File Structure)（无重大变化，仅标注语言模块）
- /app
  - /landing
  - /dashboard
  - /style-library
  - /new-task
  - /history
  - /settings
- /server
  - /parsing
  - /language-detect   (English-only gate)
  - /style-profile
  - /vector-store
  - /generation
  - /export-docx

---

## 7. 分步开发计划 (Implementation Steps) — English-only 关键顺序

Step 1 — 基础账号与极简 UI 骨架（Landing/Dashboard）
Step 2 — 上传与解析（docx/pdf/paste）+ 文本清洗
Step 3 — Language Detection Gate（拒绝 non-English / 标注 mixed）
Step 4 — Chunking + Embedding + 向量库入库（按 user namespace）
Step 5 — style_profile 计算与 readiness UI（English words 阈值）
Step 6 — New Task 生成链路（retrieve → prompt → LLM）
Step 7 — Revision（英文自然语言微调）+ 版本管理（最简）
Step 8 — 导出 .docx
Step 9 — 数据删除与隐私（样文/风格库/历史一键清空）
Step 10 — 基础监控与成本控制（token/embedding 用量）
