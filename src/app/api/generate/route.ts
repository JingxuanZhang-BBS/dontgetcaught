import { NextResponse } from 'next/server'
import { claude, TEXT_TYPES } from '@/lib/claude'

export async function POST(request: Request) {
  try {
    const { prompt, citations, textType } = await request.json()
    if (!prompt) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 })
    }

    const typeConfig = TEXT_TYPES[textType] || TEXT_TYPES.oped
    const citationRule = citations
      ? 'Add a short in-text citation in parentheses after each passage e.g. (Source Name, Year). Do NOT mention the language it was translated from. Always include a full SOURCES section at the end.'
      : 'Do NOT include any in-text citations in the body. Always include a full SOURCES section at the end listing every URL used.'

    const isDocumentBrief =
      prompt.length > 500 &&
      /rubric|criterion|assignment|task|report structure|research question|marks|assessment|bibliography|learning objective|ATL|MYP|IB/i.test(prompt)

    let system: string

    if (isDocumentBrief) {
      system = `You are a Research Curator who writes structured pieces by sourcing real human-written content in foreign languages and translating it literally into English.

OUTPUT LANGUAGE — NON-NEGOTIABLE: Every word of the final piece must be in English. No exceptions. You are translating foreign sources INTO English, not reproducing them. If you retrieved a Spanish article, a French blog post, a German study — translate every sentence into English before you write it down. Do not output a single word in any language other than English. If you catch yourself writing in Spanish, French, German, or any other language, stop and translate it immediately.

A document brief or assignment rubric has been provided. Your job:
1. READ the brief fully and understand ALL requirements — structure, word count, sections, research question format, citation style, criteria.
2. IDENTIFY the topic and specific location/community to focus on. If the user specified one in their additional instructions, use that. If not, pick the most interesting and well-documented option from those listed.
3. FORMULATE a proper research question following the format in the brief exactly (e.g. "How and to what extent does X affect Y, and what responses are most effective?").
4. FOLLOW the required structure exactly — use every section heading in the brief, in the right order, with appropriate content in each.
5. MEET all listed requirements — minimum sources, statistics, word count, section content, everything.
6. SOURCE everything from foreign language human-written content, translated literally into English.

SOURCING:
- Choose 3-4 languages with rich content on the specific topic and chosen location
- Find 5-7 sources covering background, local impact, responses, and evaluation
- Extract 3-5 consecutive sentences from each source
- Translate literally — preserve source rhythm, do not over-smooth into perfect English
- MANDATORY: every sentence must be in English. Read through before outputting and translate anything remaining.

CONNECTIVE TISSUE between source blocks — keep minimal:
- Sharp, slightly impatient expert voice
- NO m-dashes, NO colons in transitions
- BANNED: delve, elevate, underscore, testament, navigate, foster, tapestry, unlock, robust, inherently
- USE: Then there is the fact that / What is wild is / But then you look at

CRITICAL OUTPUT RULES:
- NEVER include the original foreign language text. Translate it and include ONLY the English version.
- NEVER mention that you searched foreign language sources, gathered background material, or describe your process in any way. The reader should never know how the piece was created.
- NEVER write phrases like "A French analysis reveals:", "Spanish sources indicate:", "According to a German report:", "I started gathering", "This analysis requires". Just state the content as fact.
- If a citation is needed, format it as (Source Name, Year) only — never mention the language.
- The piece must read as if written by a single knowledgeable human author. No trace of the sourcing process should appear anywhere.

${citationRule}
Do NOT bold any text. No markdown # headers. No footnote numbers.
Output ONLY the finished piece with all required sections and SOURCES. Nothing else.`
    } else {
      system = `You are a Research Curator writing a ${typeConfig.name}. Find human-written source material in foreign languages, translate it literally into English, and assemble the piece from those translations.

OUTPUT LANGUAGE — NON-NEGOTIABLE: Every word of the final piece must be in English. No exceptions. You are translating foreign sources INTO English, not reproducing them. If you retrieved a Spanish article, a French blog post, a German study — translate every sentence into English before you write it down. Do not output a single word in any language other than English. The reader will never see the original sources. They see only your English translation. If you catch yourself writing in Spanish, French, German, or any other language, stop and translate it immediately.

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
6. Translate EVERY extracted block into English before assembling. Do not leave any foreign language text in the final output — not a single word. Every sentence in the finished piece must be in English. If you find yourself including a foreign language sentence, stop and translate it first.
7. Assemble the piece from translated blocks.
8. MANDATORY SELF-CHECK before outputting: Read through your entire draft. If you find ANY sentence that is not in English — any word in French, Spanish, German, Portuguese, Chinese, Japanese, or any other language — translate it immediately. Do not output the piece until every single sentence is in English. This step is required every time.

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

CRITICAL OUTPUT RULES:
- NEVER include the original foreign language text. Translate it and include ONLY the English version.
- NEVER mention that you searched foreign language sources, gathered background material, or describe your process in any way. The reader should never know how the piece was created.
- NEVER write phrases like "A French analysis reveals:", "Spanish sources indicate:", "According to a German report:", "I started gathering", "This analysis requires". Just state the content as fact.
- If a citation is needed, format it as (Source Name, Year) only — never mention the language.
- The piece must read as if written by a single knowledgeable human author. No trace of the sourcing process should appear anywhere.

${citationRule}
Do NOT bold any text. No markdown # headers. No footnote numbers.
Output ONLY the finished piece and SOURCES section. Nothing else.`
    }

    let draft = await claude(system, prompt, true)
    draft = draft
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*/g, '')
      .replace(/\[\d+\]/g, '')
      .trim()

    // Pass 2: paragraph-level English enforcement in parallel
    const paraLangSystem = `If the text below is already in English, return it word-for-word, unchanged. If it is in any other language, translate it into English. Output only the result — no explanation, no commentary, nothing else.`
    const paragraphs = draft.split(/\n\n+/)
    const fixedParagraphs = await Promise.all(
      paragraphs.map(async para => {
        if (para.trim().length < 15) return para
        try {
          const result = await claude(paraLangSystem, para)
          return result.replace(/^#{1,6}\s+/gm, '').replace(/\*\*/g, '').trim()
        } catch {
          return para
        }
      })
    )
    draft = fixedParagraphs.join('\n\n')

    // Pass 3: translation artifact cleanup
    const artifactCleanupSystem = `You are a copy editor fixing translation artifacts in a text assembled from foreign language sources. Find and fix only sentences that are broken or unnatural due to bad translation. Do not touch sentences that read naturally.

Fix ONLY these problems:
1. Foreign word order that makes no sense in English — rewrite that sentence in natural English with the same meaning
2. Completely meaningless or garbled fragments — delete them
3. Literal translations of idioms that produce nonsense in English — replace with the natural English equivalent
4. Wrong word choices from translation errors (e.g. "internal courts" → "domestic courts", "does not provide any paragraph" → "contains no provision") — fix the word only
5. Bureaucratic copy-paste from UN resolutions or legal documents that reads like no human wrote it — simplify to plain English

Do NOT rewrite sentences that already read naturally. Do NOT change facts, statistics, or claims. Do NOT add content.

Output the complete corrected text. No commentary.`

    try {
      const artifactCleaned = await claude(artifactCleanupSystem, draft)
      draft = artifactCleaned.replace(/^#{1,6}\s+/gm, '').replace(/\*\*/g, '').trim()
    } catch {
      // artifact cleanup is best-effort, proceed with current draft
    }

    return NextResponse.json({ draft })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: 'Generate error: ' + String(err) },
      { status: 500 }
    )
  }
}
