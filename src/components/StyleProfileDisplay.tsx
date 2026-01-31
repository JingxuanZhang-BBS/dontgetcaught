'use client'

import { useState } from 'react'
import type { StyleProfile } from '@/lib/style'

interface StyleProfileDisplayProps {
  profile: StyleProfile | null
  stylePrompt: string | null
  stats: {
    sample_count: number
    total_words: number
    is_ready: boolean
    recommended_words: number
    words_needed: number
  } | null
  isLoading: boolean
}

export default function StyleProfileDisplay({
  profile,
  stylePrompt,
  stats,
  isLoading,
}: StyleProfileDisplayProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'details' | 'prompt'>('summary')

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile || !stats) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Style Profile</h3>
        <p className="text-gray-500">
          Upload writing samples to build your style profile.
        </p>
      </div>
    )
  }

  const progressPercent = Math.min(100, (stats.total_words / stats.recommended_words) * 100)

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Header with progress */}
      <div className="p-6 border-b bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Style Profile</h3>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              stats.is_ready
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {stats.is_ready ? 'Ready' : 'Building...'}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mb-2">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>{stats.total_words.toLocaleString()} words analyzed</span>
            <span>{stats.recommended_words.toLocaleString()} recommended</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                stats.is_ready ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {!stats.is_ready && (
          <p className="text-sm text-gray-500">
            Add {stats.words_needed.toLocaleString()} more words for best results
          </p>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'summary'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'details'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('prompt')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'prompt'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            LLM Prompt
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'summary' && (
          <SummaryTab profile={profile} />
        )}
        {activeTab === 'details' && (
          <DetailsTab profile={profile} />
        )}
        {activeTab === 'prompt' && (
          <PromptTab stylePrompt={stylePrompt} />
        )}
      </div>
    </div>
  )
}

function SummaryTab({ profile }: { profile: StyleProfile }) {
  const s = profile.summary

  return (
    <div className="space-y-6">
      {/* Key characteristics */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Key Characteristics</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <MetricCard
            label="Complexity"
            value={s.complexity_level}
            detail={`~${Math.round(s.avg_sentence_length)} words/sentence`}
          />
          <MetricCard
            label="Formality"
            value={s.formality}
          />
          <MetricCard
            label="Confidence"
            value={s.confidence}
          />
          <MetricCard
            label="Tone"
            value={s.emotional_tone}
          />
          <MetricCard
            label="Vocabulary"
            value={s.vocabulary_richness > 70 ? 'Rich' : s.vocabulary_richness > 40 ? 'Moderate' : 'Simple'}
            detail={`MTLD: ${Math.round(s.vocabulary_richness)}`}
          />
          <MetricCard
            label="Errors"
            value={s.error_tendency}
          />
        </div>
      </div>

      {/* Style markers */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Style Markers</h4>
        <div className="flex flex-wrap gap-2">
          {s.uses_contractions && <StyleTag>Uses contractions</StyleTag>}
          {s.uses_first_person && <StyleTag>First person</StyleTag>}
          {s.uses_questions && <StyleTag>Rhetorical questions</StyleTag>}
          {s.uses_exclamations && <StyleTag>Exclamations</StyleTag>}
          {!s.uses_contractions && <StyleTag variant="muted">No contractions</StyleTag>}
          {!s.uses_first_person && <StyleTag variant="muted">Third person</StyleTag>}
        </div>
      </div>

      {/* Signature phrases */}
      {(s.signature_openers.length > 0 || s.favorite_transitions.length > 0) && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Signature Phrases</h4>
          <div className="space-y-2">
            {s.signature_openers.length > 0 && (
              <div>
                <span className="text-xs text-gray-500 uppercase">Openers:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {s.signature_openers.slice(0, 5).map((opener, i) => (
                    <code key={i} className="px-2 py-1 bg-gray-100 rounded text-sm">
                      {opener}
                    </code>
                  ))}
                </div>
              </div>
            )}
            {s.favorite_transitions.length > 0 && (
              <div>
                <span className="text-xs text-gray-500 uppercase">Transitions:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {s.favorite_transitions.slice(0, 5).map((trans, i) => (
                    <code key={i} className="px-2 py-1 bg-gray-100 rounded text-sm">
                      {trans}
                    </code>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Imperfections (important for authenticity) */}
      {s.suggested_imperfections.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Natural Imperfections</h4>
          <p className="text-xs text-gray-500 mb-2">
            These patterns make generated text more authentic:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            {s.suggested_imperfections.map((imp, i) => (
              <li key={i}>{imp}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Generation hints */}
      {s.generation_hints.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Generation Guidelines</h4>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            {s.generation_hints.map((hint, i) => (
              <li key={i}>{hint}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function DetailsTab({ profile }: { profile: StyleProfile }) {
  return (
    <div className="space-y-6">
      {/* Lexical metrics */}
      <DetailSection title="Vocabulary Analysis">
        <DetailRow
          label="Top Bigrams"
          value={profile.lexical.top_bigrams.slice(0, 3).map(b => b.phrase).join(', ') || 'N/A'}
        />
        <DetailRow
          label="Contraction Rate"
          value={`${profile.lexical.contractions_rate.toFixed(1)} per 1000 words`}
        />
        <DetailRow
          label="TTR (Type-Token Ratio)"
          value={profile.lexical.vocab_richness.ttr.toFixed(3)}
        />
        <DetailRow
          label="MTLD Score"
          value={profile.lexical.vocab_richness.mtld.toFixed(1)}
        />
      </DetailSection>

      {/* Syntax metrics */}
      <DetailSection title="Sentence Structure">
        <DetailRow
          label="Average Length"
          value={`${profile.syntax.sentence_length.avg_words.toFixed(1)} words`}
        />
        <DetailRow
          label="Length Distribution"
          value={`Short: ${(profile.syntax.sentence_length.distribution.short * 100).toFixed(0)}%, Medium: ${(profile.syntax.sentence_length.distribution.medium * 100).toFixed(0)}%, Long: ${(profile.syntax.sentence_length.distribution.long * 100).toFixed(0)}%`}
        />
        <DetailRow
          label="Clause Density"
          value={`${profile.syntax.clause_density.toFixed(2)} per sentence`}
        />
        <DetailRow
          label="Question Rate"
          value={`${(profile.syntax.question_rate * 100).toFixed(1)}%`}
        />
      </DetailSection>

      {/* Voice metrics */}
      <DetailSection title="Voice & Tone">
        <DetailRow
          label="Hedging Rate"
          value={`${profile.voice.hedging.rate_per_1000.toFixed(1)} per 1000 words`}
        />
        <DetailRow
          label="Boosting Rate"
          value={`${profile.voice.boosting.rate_per_1000.toFixed(1)} per 1000 words`}
        />
        <DetailRow
          label="Self-mention Rate"
          value={`${profile.voice.self_mention.total_rate.toFixed(1)} per 1000 words`}
        />
        <DetailRow
          label="Formality Score"
          value={`${(profile.voice.formality.formality_score * 100).toFixed(0)}%`}
        />
      </DetailSection>

      {/* Error metrics */}
      <DetailSection title="Error Profile">
        <DetailRow
          label="Typo Rate"
          value={`${profile.errors.typo_rate.toFixed(2)} per 1000 words`}
        />
        <DetailRow
          label="Tense Consistency"
          value={`${(profile.errors.tense_consistency.consistency_score * 100).toFixed(0)}%`}
        />
        <DetailRow
          label="Primary Tense"
          value={profile.errors.tense_consistency.primary_tense}
        />
        <DetailRow
          label="Formality Level"
          value={profile.errors.error_signature.formality_level}
        />
      </DetailSection>

      {/* Discourse metrics */}
      <DetailSection title="Discourse & Cohesion">
        <DetailRow
          label="Transition Rate"
          value={`${profile.discourse.transitions.total_rate.toFixed(1)} per 1000 words`}
        />
        <DetailRow
          label="Cohesion Score"
          value={`${(profile.discourse.cohesion.overall_cohesion_score * 100).toFixed(0)}%`}
        />
        <DetailRow
          label="Organization Style"
          value={profile.discourse.discourse_signature.organization_style}
        />
        <DetailRow
          label="Argumentation Style"
          value={profile.discourse.discourse_signature.argumentation_style}
        />
      </DetailSection>
    </div>
  )
}

function PromptTab({ stylePrompt }: { stylePrompt: string | null }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (stylePrompt) {
      navigator.clipboard.writeText(stylePrompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!stylePrompt) {
    return (
      <p className="text-gray-500">No prompt available yet.</p>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-600">
          This prompt will be used when generating text in your style:
        </p>
        <button
          onClick={handleCopy}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap">
        {stylePrompt}
      </pre>
    </div>
  )
}

// Helper components
function MetricCard({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail?: string
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="text-xs text-gray-500 uppercase mb-1">{label}</div>
      <div className="text-sm font-semibold text-gray-900 capitalize">{value}</div>
      {detail && <div className="text-xs text-gray-500 mt-1">{detail}</div>}
    </div>
  )
}

function StyleTag({
  children,
  variant = 'default',
}: {
  children: React.ReactNode
  variant?: 'default' | 'muted'
}) {
  return (
    <span
      className={`px-2 py-1 rounded text-xs ${
        variant === 'muted'
          ? 'bg-gray-100 text-gray-500'
          : 'bg-blue-100 text-blue-700'
      }`}
    >
      {children}
    </span>
  )
}

function DetailSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-2">{title}</h4>
      <div className="bg-gray-50 rounded-lg p-3 space-y-2">{children}</div>
    </div>
  )
}

function DetailRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-600">{label}</span>
      <span className="text-gray-900 font-medium">{value}</span>
    </div>
  )
}
