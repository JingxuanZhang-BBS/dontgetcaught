require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const multer = require("multer");
const mammoth = require("mammoth");

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));
app.use((req, res, next) => { req.setTimeout(300000); res.setTimeout(300000); next(); });

const ANTHROPIC = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const MODEL = "claude-sonnet-4-20250514";
const GPTZERO_KEY = process.env.GPTZERO_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_KEY;

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

function headers() {
  return {
    "Content-Type": "application/json",
    "x-api-key": ANTHROPIC_KEY,
    "anthropic-version": ANTHROPIC_VERSION,
    "anthropic-beta": "prompt-caching-2024-07-31"
  };
}

// Claude call with prompt caching on system prompt
async function claude(systemText, userMessage, useWebSearch) {
  const body = {
    model: MODEL,
    max_tokens: 4000,
    system: [
      {
        type: "text",
        text: systemText,
        cache_control: { type: "ephemeral" }
      }
    ],
    messages: [{ role: "user", content: userMessage }]
  };
  if (useWebSearch) {
    body.tools = [{ type: "web_search_20250305", name: "web_search" }];
  }
  const res = await axios.post(ANTHROPIC, body, { headers: headers() });
  return (res.data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n").trim();
}

const TEXT_TYPES = {
  article: {
    name: "Article",
    format: `FORMAT: 1. Headline 2. Introduction — hook, introduce topic 3. Body paragraphs — one point each, facts and examples 4. Conclusion — summarize, leave reader thinking. TONE: formal or semi-formal, clear, organized.`,
    searchGuidance: "factual reporting, expert opinions, and statistics that inform a general audience"
  },
  blog: {
    name: "Blog Post",
    format: `FORMAT: 1. Catchy title 2. Opening hook — personal, engaging 3. Introduction 4. Main body — ideas, tips, anecdotes 5. Conclusion — final thought or question. TONE: informal, friendly, personal. Use "I" and "you".`,
    searchGuidance: "personal stories, practical tips, and conversational takes"
  },
  oped: {
    name: "Op-Ed",
    format: `FORMAT: 1. Headline 2. Introduction — hook, state issue, present opinion 3. Argument 1 with evidence 4. Argument 2 with evidence 5. Counterargument addressed 6. Conclusion — reinforce opinion, strong ending. TONE: confident, persuasive, assertive.`,
    searchGuidance: "evidence, statistics, and expert opinions that support a persuasive argument, plus one counterargument"
  },
  speech: {
    name: "Speech",
    format: `FORMAT: 1. Greeting and opening — grab attention 2. Introduction — topic and purpose 3. Main points — 2 to 3 key ideas with examples 4. Conclusion — memorable final line. TONE: written to be heard. Short sentences, repetition, emotional appeal, direct audience address.`,
    searchGuidance: "powerful quotes, emotional stories, and compelling facts that resonate when spoken aloud"
  },
  essay: {
    name: "Essay",
    format: `FORMAT: 1. Introduction — topic, clear thesis 2. Body paragraph 1 — point, evidence, explanation 3. Body paragraph 2 4. Body paragraph 3 5. Conclusion — summarize, restate thesis freshly. TONE: formal and academic. Analytical, precise vocabulary.`,
    searchGuidance: "academic evidence and logical arguments for a structured analytical essay"
  },
  review: {
    name: "Review",
    format: `FORMAT: 1. Title 2. Introduction — what is reviewed, brief context 3. Description 4. Evaluation — strengths and weaknesses 5. Conclusion — final judgment and recommendation. TONE: semi-formal, lively, balanced.`,
    searchGuidance: "detailed descriptions, critic opinions, and evaluative takes"
  },
  report: {
    name: "Report",
    format: `FORMAT: 1. Title 2. Introduction — purpose 3. Background and context 4. Findings 5. Analysis 6. Recommendations if needed 7. Conclusion. TONE: formal, objective, neutral. Use plain text subheadings.`,
    searchGuidance: "data, research findings, official statistics, and expert analysis"
  }
};

app.get("/health", (req, res) => res.json({ ok: true }));

// Extract text from uploaded document
app.post("/extract", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const mime = req.file.mimetype;
  const buffer = req.file.buffer;

  try {
    let text = "";
    if (mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (mime === "text/plain") {
      text = buffer.toString("utf-8");
    } else if (mime === "application/pdf") {
      return res.status(400).json({ error: "PDF upload not supported yet. Please paste your text directly or upload a .docx or .txt file." });
    } else {
      text = buffer.toString("utf-8");
    }
    res.json({ text: text.trim() });
  } catch (err) {
    res.status(500).json({ error: "Could not extract text from file: " + err.message });
  }
});

app.post("/generate", async (req, res) => {
  const { prompt, citations, textType } = req.body;
  if (!prompt) return res.status(400).json({ error: "Missing prompt" });

  const typeConfig = TEXT_TYPES[textType] || TEXT_TYPES.oped;
  const citationRule = citations
    ? "Add a short in-text citation in parentheses after each translated passage e.g. (Source Name, Year, translated from [language]). Always include a full SOURCES section at the end."
    : "Do NOT include any in-text citations in the body. Always include a full SOURCES section at the end listing every URL used.";

  const system = `You are a Research Curator writing a ${typeConfig.name}. Your strategy: find human-written source material in foreign languages, translate it literally into English, assemble the piece from those translations. This produces genuinely human-originated text with a distinctive non-native fingerprint.

LANGUAGE STRATEGY:
1. Think about which languages have the richest human-written content on this specific topic. Choose 3-4 languages that genuinely make sense.
2. Translate search terms into those languages and search for human-written articles, academic pieces, or journalism in those languages.
3. Find 5-7 sources total.
4. Extract the longest useful consecutive block you can from each source — up to 5-6 sentences from one source if highly relevant. Fewer sources with longer extracts beats many sources with short fragments.
5. Translate each block into English following these rules:
   - Stay close to the original sentence structure and word order to preserve the foreign rhythm.
   - When the source is scientific or academic, translate technical jargon into plain language appropriate for the text type. A speech audience does not know what "enteric fermentation in the rumen" means — say "digestive gases produced by cattle."
   - When a sentence uses a passive construction that hides who is doing what (e.g. "with the anticipation of X deaths"), rewrite it to make the agent clear ("researchers project X deaths by 2050 from antibiotic-resistant infections").
   - When a sentence references a mechanism or process without explaining it, either explain it in plain terms or cut it.
   - When a statistic needs context to make sense, add the minimal necessary context.
   - Never leave a sentence that would confuse a reader with no background in the topic.
   - Do NOT over-smooth into polished English — preserve the rhythm of the source language.
6. Assemble the piece from translated blocks.

CONNECTIVE TISSUE — keep it minimal (max 1-2 short sentences between blocks):
- Sound like a sharp, slightly impatient human expert.
- NO m-dashes. NO symmetry patterns. NO colons in connective sentences.
- After a long block, use one short reaction. After a short fact, use a slightly longer bridge.
- BANNED: delve, elevate, underscore, testament, navigate, foster, tapestry, unlock, robust, inherently, comprehensive, imperative, multifaceted
- NO: Furthermore, In addition, Subsequently
- USE: Then there is the fact that / What is wild is / But then you look at / This suggests that

TEXT TYPE: ${typeConfig.name}
${typeConfig.format}

WORD COUNT — CRITICAL:
The user will specify a word count. You must hit it accurately. Before writing, plan how many words each section needs. Count the words as you write. Do not exceed the target by more than 20 words. Do not fall short by more than 20 words. If you finish a section and you have too many words, cut. If you are short, expand a paragraph. The word count is a hard constraint.

BEFORE OUTPUTTING, review and fix:
- Any named individual the reader has not met — rewrite without the name
- Any phrase referencing a website's own tools or database — rewrite without it
- Any numbered footnote markers — delete them
- Any sentence that only makes sense in the original source context
- Any incomplete ending — write a proper conclusion for the text type
- Any two consecutive statistics that appear to contradict each other — explain or cut one

${citationRule}
Do NOT bold any text. No markdown # headers. No footnote numbers.

Output ONLY the finished piece and SOURCES section. Nothing else.`;

  try {
    const draft = await claude(system, prompt, true);
    res.json({ draft: draft.replace(/^#{1,6}\s+/gm, "").replace(/\*\*/g, "").replace(/\[\d+\]/g, "").trim() });
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.message;
    res.status(500).json({ error: "Generate error: " + msg });
  }
});

app.post("/scan", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Missing text" });
  try {
    const response = await axios.post(
      "https://api.gptzero.me/v2/predict/text",
      { document: text },
      { headers: { "Content-Type": "application/json", "x-api-key": GPTZERO_KEY } }
    );
    const doc = response.data.documents?.[0];
    if (!doc) return res.status(500).json({ error: "No document in GPTZero response" });
    res.json({
      overallAiProb: doc.completely_generated_prob ?? 0,
      sentences: (doc.sentences || []).map(s => ({ text: s.sentence, aiProb: s.generated_prob ?? 0 }))
    });
  } catch (err) {
    res.status(500).json({ error: "GPTZero error: " + (err.response?.data?.message || err.message) });
  }
});

app.post("/humanize", async (req, res) => {
  const { draft, flaggedSentences, textType, citations } = req.body;
  if (!draft || !flaggedSentences?.length) return res.status(400).json({ error: "Missing data" });

  const typeConfig = TEXT_TYPES[textType] || TEXT_TYPES.oped;
  const citationNote = citations ? "Preserve all existing in-text citations." : "Do not add any in-text citations.";

  const system = `You are a humanization editor. You receive a draft assembled from foreign-language source material translated into English, plus a list of AI-flagged sentences. Rewrite ONLY the connective tissue — the short bridging sentences between translated blocks. Do not touch the translated source passages themselves.

RULES:
- Sound like a sharp, slightly impatient human expert
- Vary sentence length dramatically — short punchy reactions after long blocks
- Use contractions naturally. Use abrupt stops. Add brief tangents or second-guessing.
- NO m-dashes. NO symmetry patterns. NO colons.
- BANNED: delve, elevate, underscore, testament, navigate, foster, tapestry, unlock, robust, inherently
- ${citationNote}
- Do NOT bold anything. Do NOT change any translated factual content or statistics.

Return the COMPLETE rewritten draft. No preamble. Just the full piece.`;

  const flaggedList = flaggedSentences.slice(0, 8).map((s, i) => (i + 1) + ". " + s).join("\n");

  try {
    const humanized = await claude(system, `Text type: ${typeConfig.name}\n\nFlagged sentences to rewrite:\n${flaggedList}\n\nFull draft:\n${draft}`);
    res.json({ humanized: humanized.replace(/\*\*/g, "").replace(/\[\d+\]/g, "").trim() });
  } catch (err) {
    res.status(500).json({ error: "Humanize error: " + (err.response?.data?.error?.message || err.message) });
  }
});

app.post("/polish", async (req, res) => {
  const { text, textType, citations } = req.body;
  if (!text) return res.status(400).json({ error: "Missing text" });

  const typeConfig = TEXT_TYPES[textType] || TEXT_TYPES.oped;
  const citationNote = citations
    ? "Keep all existing in-text citations exactly as they are."
    : "Remove any in-text citations from the body. Keep the SOURCES section at the end intact.";

  const system = `You are a strict final editor reviewing a ${typeConfig.name} assembled from foreign-language sources translated into English.

FIX these specific issues:
- Any named individual the reader has not met (e.g. "Sam") — cut or rewrite without the name
- Any phrase referencing a website's own tools or database — rewrite without it
- Numbered footnote markers like [1] [2] — delete them
- Sentences that only make sense in the original source context
- Phrases like "as we mentioned", "as noted above", "here is word for word"
- Tonal shifts away from the expected ${typeConfig.name} voice
- Any bolded text — remove it
- Any incomplete ending — write a proper conclusion appropriate to the text type
- Any passive construction hiding who is doing what — rewrite to make the agent clear
- Any technical jargon inappropriate for this text type and audience — translate to plain language
- Any statistic missing its essential context — add minimal context
- Any two consecutive statistics that appear to contradict — explain or cut one
- ${citationNote}

Do NOT over-smooth the translated passages. Preserve the slightly foreign rhythm — that is intentional.
Do NOT change the structure. Do NOT add new claims.
Output the full polished piece only. No preamble.`;

  try {
    const polished = await claude(system, "Polish this " + typeConfig.name + ":\n\n" + text);
    res.json({ polished: polished.replace(/\*\*/g, "").replace(/\[\d+\]/g, "").trim() });
  } catch (err) {
    res.status(500).json({ error: "Polish error: " + (err.response?.data?.error?.message || err.message) });
  }
});

const PORT = process.env.PORT || 3131;
app.listen(PORT, () => console.log("Humanizer server running on http://localhost:" + PORT));
