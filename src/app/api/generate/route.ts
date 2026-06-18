export const maxDuration = 300

import { NextResponse } from 'next/server'
import { claude, TEXT_TYPES } from '@/lib/claude'
import { createClient } from '@/lib/supabase/server'
import { looksLikeMetaRefusal } from '@/lib/enforce-english'
import { deductCredit, refundCredit } from '@/lib/credits-server'
import { checkRateLimit } from '@/lib/rate-limit'
import { askClaudeIsHarmful, HARMFUL_PROMPT_MESSAGE } from '@/lib/harm-check'
import {
  resolveWordCountTarget,
  resolveWordCountIncludesSources,
  wordCountBandLine,
  reviseWordCountBand,
} from '@/lib/word-count'


function detectNonTextDeliverable(prompt: string): boolean {
  if (!prompt || typeof prompt !== 'string') return false
  const t = prompt.trim()
  if (/\bhelp me write\b/i.test(t) || /\bwrite (my |the |a )(reflection|essay|paper)\b/i.test(t)) return false
  return /\bI want to (make|create) a drawing\.?\s*$/i.test(t)
    || /\bI want to (make|create) a painting\.?\s*$/i.test(t)
}


export async function POST(request: Request) {
  let userId: string | null = null
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    userId = user.id

    const rateLimited = await checkRateLimit(userId, 'generate')
    if (rateLimited) return rateLimited

    const { prompt, citations, textType, category, writingMode, wordCount: wordCountBody, wordCountIncludesSources: wcIncludesBody } = await request.json()
    if (!prompt) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 })
    }

    if (await askClaudeIsHarmful(prompt)) {
      return NextResponse.json({ error: 'HARMFUL_PROMPT', message: HARMFUL_PROMPT_MESSAGE }, { status: 400 })
    }

    if (detectNonTextDeliverable(prompt)) {
      return NextResponse.json(
        {
          error: 'NON_TEXT',
          message:
            "DontGetCaught only outputs written text — we can't create drawings, paintings, filmed dances, or other non-text art. If you need the written part of an assignment (for example a reflection or essay about your creative work), ask specifically for that written piece and we'll help.",
        },
        { status: 400 }
      )
    }

    // ── CREDIT CHECK ───────────────────────────────────────────────────────────
    const refundToken = await deductCredit(userId!)
    if (!refundToken) {
      return NextResponse.json(
        { error: 'INSUFFICIENT_CREDITS', message: "You've used all 3 beta credits. Contact us on Instagram @dontgetcaught_ai to request more access." },
        { status: 402 }
      )
    }

    const wordCountTarget = resolveWordCountTarget(prompt, wordCountBody)
    const includeSourcesInCount = resolveWordCountIncludesSources(prompt, wcIncludesBody === true)
    const wcInstruction = wordCountTarget
      ? wordCountBandLine(wordCountTarget, includeSourcesInCount)
      : 'If the prompt states a word count, get as close as you can — aim within ±50 words.'

    const typeConfig = TEXT_TYPES[textType] || TEXT_TYPES.oped
    const citationRule = citations
      ? 'Add a short in-text citation in parentheses after each passage e.g. (Source Name, Year). Do NOT mention the language it was translated from. Always include a full SOURCES section at the end.'
      : 'Do NOT include any in-text citations in the body. Always include a full SOURCES section at the end listing every URL used.'

    let resolvedMode = writingMode
    if (!resolvedMode) {
      resolvedMode = !category || category === 'research_based' ? 'research' : 'best_effort'
    }
    const useResearchPipeline = resolvedMode === 'research'

    // ── BEST EFFORT MODE ───────────────────────────────────────────────────
    if (!useResearchPipeline) {
      const bestEffortSystem = `You are dontgetcaught in direct writing mode. The user's request does not fit our usual workflow (finding foreign news and translating it). You must write the full piece yourself in strong, natural English.

STRICT RULES:
- Output ONLY the completed written work (essay, reflection, memoir, literary analysis, etc.). No title line like "Here is your essay." No preamble or postscript.
- NEVER refuse. NEVER say you don't see a document, never ask the user to paste or attach text, never apologize for lacking a file, never describe translation or editing workflows you cannot perform.
- If the prompt contains a long course handout, read it and produce what the student actually needs (often a personal reflection, creative rationale, or analysis) using details from their instructions.
- Match the text type and tone implied by the prompt. Use "I" for personal reflection when appropriate.
- ${wcInstruction}
- ${citationRule}

TEXT TYPE: ${typeConfig.name}
${typeConfig.format}`

      try {
        let draft = await claude(bestEffortSystem, prompt, false, 16384)
        draft = draft.replace(/^#{1,6}\s+/gm, '').replace(/\*\*/g, '').replace(/\[\d+\]/g, '').trim()
        if (looksLikeMetaRefusal(draft)) {
          await refundCredit(userId!)
          return NextResponse.json(
            { error: "The model refused to write. Try rephrasing your request as a clear writing task (e.g. 'Write a 700-word reflection about…')." },
            { status: 500 }
          )
        }
        if (wordCountTarget) {
          draft = await reviseWordCountBand(draft, wordCountTarget, includeSourcesInCount)
        }
        return NextResponse.json({ draft, writingMode: 'best_effort', refundToken })
      } catch (err: unknown) {
        await refundCredit(userId!)
        return NextResponse.json({ error: 'Generate error: ' + String(err) }, { status: 500 })
      }
    }

    // ── RESEARCH PIPELINE MODE ─────────────────────────────────────────────
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
6. ${wcInstruction}
7. SOURCE everything from foreign language human-written content, translated literally into English.

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
- NEVER mention that you searched foreign language sources, gathered background material, or describe your process in any way.
- NEVER write phrases like "A French analysis reveals:", "Spanish sources indicate:", "According to a German report:". Just state the content as fact.
- If a citation is needed, format it as (Source Name, Year) only — never mention the language.
- The piece must read as if written by a single knowledgeable human author.

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
6. Translate EVERY extracted block into English before assembling. Not a single word of another language in the final output.
7. Assemble the piece from translated blocks.
8. MANDATORY SELF-CHECK before outputting: Read through your entire draft. If you find ANY sentence that is not in English — translate it immediately. Do not output the piece until every single sentence is in English.

CONNECTIVE TISSUE — keep it minimal (max 1-2 short sentences between blocks):
- Sharp, slightly impatient human expert voice.
- NO m-dashes. NO symmetry patterns. NO colons in connective sentences.
- BANNED: delve, elevate, underscore, testament, navigate, foster, tapestry, unlock, robust, inherently, comprehensive, imperative, multifaceted
- NO: Furthermore, In addition, Subsequently
- USE: Then there is the fact that / What is wild is / But then you look at / This suggests that

TEXT TYPE: ${typeConfig.name}
${typeConfig.format}

${wcInstruction}

BEFORE OUTPUTTING, fix:
- Any named individual the reader has not met — rewrite without the name
- Any phrase referencing a website's own tools or database — rewrite without it
- Any numbered footnote markers — delete them
- Any sentence that only makes sense in the original source context
- Any incomplete ending — write a proper conclusion for the text type
- Any two consecutive statistics that appear to contradict each other — explain or cut one

CRITICAL OUTPUT RULES:
- NEVER include the original foreign language text.
- NEVER mention that you searched foreign language sources or describe your process.
- NEVER write phrases like "A French analysis reveals:", "Spanish sources indicate:". Just state content as fact.
- If a citation is needed, format it as (Source Name, Year) only.
- The piece must read as if written by a single knowledgeable human author.

${citationRule}
Do NOT bold any text. No markdown # headers. No footnote numbers.
Output ONLY the finished piece and SOURCES section. Nothing else.`
    }

    let draft = await claude(system, prompt, true)
    draft = draft.replace(/^#{1,6}\s+/gm, '').replace(/\*\*/g, '').replace(/\[\d+\]/g, '').trim()

    return NextResponse.json({ draft, writingMode: 'research', refundToken })
  } catch (err: unknown) {
    await refundCredit(userId!).catch(() => {})
    return NextResponse.json(
      { error: 'Generate error: ' + String(err) },
      { status: 500 }
    )
  }
}
