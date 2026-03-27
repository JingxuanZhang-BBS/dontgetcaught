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

async function claude(systemText, userMessage, useWebSearch) {
  const body = {
    model: MODEL,
    max_tokens: 4000,
    system: [{ type: "text", text: systemText, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: userMessage }]
  };
  if (useWebSearch) body.tools = [{ type: "web_search_20250305", name: "web_search" }];
  const res = await axios.post(ANTHROPIC, body, { headers: headers() });
  return (res.data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n").trim();
}

const TEXT_TYPES = {
  article: { name: "Article", format: `FORMAT: 1. Headline 2. Introduction — hook, introduce topic 3. Body paragraphs — one point each, facts and examples 4. Conclusion — summarize, leave reader thinking. TONE: formal or semi-formal, clear, organized.`, searchGuidance: "factual reporting, expert opinions, and statistics that inform a general audience" },
  blog: { name: "Blog Post", format: `FORMAT: 1. Catchy title 2. Opening hook — personal, engaging 3. Introduction 4. Main body — ideas, tips, anecdotes 5. Conclusion — final thought or question. TONE: informal, friendly, personal. Use "I" and "you".`, searchGuidance: "personal stories, practical tips, and conversational takes" },
  oped: { name: "Op-Ed", format: `FORMAT: 1. Headline 2. Introduction — hook, state issue, present opinion 3. Argument 1 with evidence 4. Argument 2 with evidence 5. Counterargument addressed 6. Conclusion — reinforce opinion, strong ending. TONE: confident, persuasive, assertive.`, searchGuidance: "evidence, statistics, and expert opinions that support a persuasive argument, plus one counterargument" },
  speech: { name: "Speech", format: `FORMAT: 1. Greeting and opening — grab attention 2. Introduction — topic and purpose 3. Main points — 2 to 3 key ideas with examples 4. Conclusion — memorable final line. TONE: written to be heard. Short sentences, repetition, emotional appeal, direct audience address.`, searchGuidance: "powerful quotes, emotional stories, and compelling facts that resonate when spoken aloud" },
  essay: { name: "Essay", format: `FORMAT: 1. Introduction — topic, clear thesis 2. Body paragraph 1 — point, evidence, explanation 3. Body paragraph 2 4. Body paragraph 3 5. Conclusion — summarize, restate thesis freshly. TONE: formal and academic. Analytical, precise vocabulary.`, searchGuidance: "academic evidence and logical arguments for a structured analytical essay" },
  review: { name: "Review", format: `FORMAT: 1. Title 2. Introduction — what is reviewed, brief context 3. Description 4. Evaluation — strengths and weaknesses 5. Conclusion — final judgment and recommendation. TONE: semi-formal, lively, balanced.`, searchGuidance: "detailed descriptions, critic opinions, and evaluative takes" },
  report: { name: "Report", format: `FORMAT: 1. Title 2. Introduction — purpose 3. Background and context 4. Findings 5. Analysis 6. Recommendations if needed 7. Conclusion. TONE: formal, objective, neutral. Use plain text subheadings.`, searchGuidance: "data, research findings, official statistics, and expert analysis" }
};

app.get("/health", (req, res) => res.json({ ok: true }));

// NEW: Analyze prompt before generation
app.post("/analyze", async (req, res) => {
  const { prompt, textType } = req.body;
  if (!prompt) return res.status(400).json({ error: "Missing prompt" });

  const system = `You are an AI writing quality analyst. Your job is to estimate how well an AI writing system can complete a given prompt by finding real human-written sources online.

The system works by:
1. Searching for human-written content in foreign languages on the topic
2. Translating those passages literally into English
3. Stitching them together with minimal AI connective tissue

This means the system performs BEST when:
- The topic is widely covered by human journalists, academics, bloggers, researchers
- Content exists in multiple languages (not just English)
- The writing does not require personal experiences or private information
- The content does not depend on a specific document the user has not provided

The system performs POORLY when:
- The prompt requires personal experiences, memories, or private information only the user has
- The prompt requires analysis of a specific document, poem, or text that has not been provided
- The topic is so niche or personal that no online sources exist
- The prompt is primarily creative/fictional with no factual basis to research

Analyze the prompt and return ONLY a JSON object with this exact structure:
{
  "estimatedHumanPct": <number between 5 and 98>,
  "category": "research_based" | "semi_personal" | "highly_personal" | "impossible",
  "reasoning": "<one sentence explaining why>"
}

Categories:
- "research_based": Topic is well-covered online, system will perform at 85%+. Examples: science topics, history, current events, culture, academic subjects, opinion pieces on known topics.
- "semi_personal": Topic has some personal element but general themes exist online. System will get 65-84%. Examples: personal essay on a universal theme like resilience or family, reflective writing on a common experience.
- "highly_personal": Topic depends heavily on specific personal information or an unknown document. System will get 30-64%. Examples: "write about how my grandmother's death changed me", "analyze this poem my teacher wrote".
- "impossible": Topic is almost entirely personal/private with nothing to research. System will get under 30%. Examples: analysis of a private document not provided, purely fictional story with no factual basis, writing that requires information only the user holds.

Return ONLY the JSON. No preamble, no explanation.`;

  try {
    const raw = await claude(system, "Analyze this prompt for a " + (textType || "essay") + ":\n\n" + prompt);
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    res.json(parsed);
  } catch (err) {
    // If analysis fails, default to proceeding normally
    res.json({ estimatedHumanPct: 85, category: "research_based", reasoning: "Could not analyze — proceeding normally." });
  }
});

app.post("/extract", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const mime = req.file.mimetype;
  const buffer = req.file.buffer;
  try {
    let text = "";
    if (mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      text = buffer.toString("utf-8");
    }
    res.json({ text: text.trim() });
  } catch (err) {
    res.status(500).json({ error: "Could not extract text: " + err.message });
  }
});

app.post("/generate", async (req, res) => {
  const { prompt, citations, textType } = req.body;
  if (!prompt) return res.status(400).json({ error: "Missing prompt" });

  const typeConfig = TEXT_TYPES[textType] || TEXT_TYPES.oped;
  const citationRule = citations
    ? "Add a short in-text citation in parentheses after each translated passage e.g. (Source Name, Year, translated from [language]). Always include a full SOURCES section at the end."
    : "Do NOT include any in-text citations in the body. Always include a full SOURCES section at the end listing every URL used.";

  const system = `You are a Research Curator writing a ${typeConfig.name}. Find human-written source material in foreign languages, translate it literally into English, and assemble the piece from those translations.

LANGUAGE STRATEGY:
1. Think about which languages have the richest human-written content on this specific topic. Choose 3-4 languages that genuinely make sense.
2. Search in those languages for human-written articles, academic pieces, or journalism.
3. Find 5-7 sources total.
4. Extract the longest useful consecutive block you can from each source — up to 5-6 sentences from one source if highly relevant.
5. Translate each block into English:
   - Stay close to the original sentence structure to preserve the foreign rhythm.
   - When the source is scientific or academic, translate technical jargon into plain language appropriate for the text type.
   - When a sentence uses a passive construction that hides who is doing what, rewrite it to make the agent clear.
   - When a sentence references a mechanism or process without explaining it, either explain it in plain terms or cut it.
   - When a statistic needs context to make sense, add minimal necessary context.
   - Never leave a sentence that would confuse a reader with no background in the topic.
   - Do NOT over-smooth into polished English — preserve the rhythm of the source language.
6. Assemble the piece from translated blocks.

CONNECTIVE TISSUE — keep it minimal (max 1-2 short sentences between blocks):
- Sharp, slightly impatient human expert voice.
- NO m-dashes. NO symmetry patterns. NO colons in connective sentences.
- BANNED: delve, elevate, underscore, testament, navigate, foster, tapestry, unlock, robust, inherently, comprehensive, imperative, multifaceted
- NO: Furthermore, In addition, Subsequently
- USE: Then there is the fact that / What is wild is / But then you look at / This suggests that

TEXT TYPE: ${typeConfig.name}
${typeConfig.format}

WORD COUNT — CRITICAL: Hit the word count in the prompt accurately. Do not exceed by more than 20 words. Do not fall short by more than 20 words.

BEFORE OUTPUTTING, fix:
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
    res.status(500).json({ error: "Generate error: " + (err.response?.data?.error?.message || err.message) });
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

  const system = `You are a humanization editor. You receive a full draft and a list of AI-flagged sentences. For each flagged sentence, follow this exact process:

STEP 1 — SEARCH FOR A REPLACEMENT FIRST:
Search the web in foreign languages (choose the language most likely to have good human-written content on this specific topic) for a human-written source that covers the same claim or fact as the flagged sentence. Try to find 1-3 consecutive sentences from a real human author that express the same idea.

If you find a good source:
- Extract the relevant sentences verbatim from the foreign language source
- Translate them literally into English, preserving the original sentence structure and rhythm
- Use this translation as the replacement for the flagged sentence
- The replacement must cover the same factual ground — do not change the underlying claim

If you cannot find a good foreign language source after searching:
- Rewrite the flagged sentence to break its AI-like symmetry and structure
- Add natural human messiness — interruptions, abrupt stops, incomplete thoughts, tangents
- Keep the same fact but present it differently
- Example: "His training combines explosive power with endurance work, speed work with agility exercises" becomes "The training is built around explosions. Short violent sprints. Then agility. Then strength — in that order, every time."

RULES FOR ALL REPLACEMENTS:
- Do NOT change any underlying facts or statistics
- Do NOT bold anything
- Do NOT use m-dashes
- Avoid symmetrical list structures ("X with Y, A with B")
- Vary sentence length dramatically in replacements
- ${citationNote}

After replacing all flagged sentences, return the COMPLETE rewritten draft with replacements inserted in the correct positions.
No preamble. Just the full piece.`;

  const flaggedList = flaggedSentences.slice(0, 8).map((s, i) => (i + 1) + ". " + s).join("\n");

  try {
    const humanized = await claude(system, `Text type: ${typeConfig.name}\n\nFlagged sentences to replace:\n${flaggedList}\n\nFull draft:\n${draft}`, true);
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

FIX:
- Any named individual the reader has not met — cut or rewrite without the name
- Any phrase referencing a website's own tools or database — rewrite without it
- Numbered footnote markers like [1] [2] — delete them
- Sentences that only make sense in the original source context
- Phrases like "as we mentioned", "as noted above", "here is word for word"
- Tonal shifts away from the expected ${typeConfig.name} voice
- Any bolded text — remove it
- Any incomplete ending — write a proper conclusion appropriate to the text type
- Any passive construction hiding who is doing what — rewrite to make the agent clear
- Any technical jargon inappropriate for this text type — translate to plain language
- Any statistic missing essential context — add minimal context
- Any two consecutive contradictory statistics — explain or cut one
- ${citationNote}

Do NOT over-smooth translated passages. Preserve the slightly foreign rhythm.
Do NOT change the structure. Do NOT add new claims.
Output the full polished piece only. No preamble.`;

  try {
    const polished = await claude(system, "Polish this " + typeConfig.name + ":\n\n" + text);
    res.json({ polished: polished.replace(/\*\*/g, "").replace(/\[\d+\]/g, "").trim() });
  } catch (err) {
    res.status(500).json({ error: "Polish error: " + (err.response?.data?.error?.message || err.message) });
  }
});

app.post("/clarify", async (req, res) => {
  const { prompt, clarificationsSoFar } = req.body;
  if (!prompt) return res.status(400).json({ error: "Missing prompt" });

  const prevAnswered = clarificationsSoFar && clarificationsSoFar.length > 0
    ? clarificationsSoFar.map(c => c.question + " -> " + c.answer).join("\n")
    : "None";

  const system = `You are a writing assistant with one specific goal: identify the single most important question to ask the user before writing begins. You have TWO reasons to ask a question:

REASON 1 — TOPIC AMBIGUITY: The prompt refers to something unclear that would produce a completely different piece depending on the answer.
Examples:
- "Write about the big world war" -> "Which world war are you referring to — World War I or World War II?"
- "Write about the president's policy" -> "Which country's president are you referring to?"
- "Write about the recent election" -> "Which country's election are you referring to?"
- "Write about the war" -> "Which conflict are you referring to?"
- "Write about the company" -> "Which company are you referring to?"
- "Write a review of the new Batman movie" -> "Which Batman film are you referring to?"

REASON 2 — TOO VAGUE TO SOURCE WELL: The prompt is so broad that searching for sources will return generic, formulaic content that AI detectors flag easily. A more specific angle will produce better, more distinctive human-written sources and a lower AI detection score.
Examples:
- "Why is Cristiano Ronaldo so good?" -> "Are you focusing on his athleticism, his career achievements, his mental strength, or his technical skills?"
- "Write about climate change" -> "Are you focusing on the science behind it, the political response, the economic impact, or human stories affected by it?"
- "Write about the Roman Empire" -> "Are you focusing on its rise, its fall, its military, its culture, or a specific period or figure?"
- "Write about mental health" -> "Are you focusing on a specific condition, the stigma around it, treatment approaches, or its prevalence in society?"
- "Write about technology" -> "Are you focusing on a specific technology, its societal impact, its ethical implications, or its future?"
- "Write about football" -> "Are you focusing on a specific team, player, tournament, tactical evolution, or the culture around the sport?"
- "Write about the economy" -> "Are you focusing on a specific country, a particular issue like inflation or unemployment, or the global picture?"
- "Write about music" -> "Are you focusing on a specific genre, artist, era, or the music industry as a whole?"
- "Write about social media" -> "Are you focusing on its impact on mental health, political influence, business use, or youth culture?"

IMPORTANT RULES:
- Ask only ONE question — the single most valuable one.
- Do NOT ask about word count, tone, text type, or citations. Those are handled separately.
- Do NOT ask a question if the prompt is already specific enough to find good targeted sources.
- If clarifications have already been given, check if the prompt is now specific enough. If yes, return needsClarification false.
- Prefer Reason 2 questions when the topic is clear but broad — specificity directly improves output quality.

Previous clarifications already given:
\${prevAnswered}

Return ONLY valid JSON:
{"needsClarification": true, "question": "Your specific question here?"}
or
{"needsClarification": false}`;

  try {
    const raw = await claude(system, "Prompt: " + prompt);
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    res.json(parsed);
  } catch (err) {
    res.json({ needsClarification: false });
  }
});

const PORT = process.env.PORT || 3131;
app.listen(PORT, () => console.log("Humanizer server running on http://localhost:" + PORT));
