'use client'

import { useState } from 'react'

interface VersionInfo {
  id: string
  version_number: number
  generated_text: string
  revision_instruction: string | null
  created_at: string
}

interface GeneratedResultProps {
  text: string
  title: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
    estimated_cost: number
  }
  taskId?: string
  versionNumber?: number
  versions?: VersionInfo[]
  onNewTask: () => void
  onRevise?: (instruction: string) => Promise<void>
  onVersionSelect?: (version: VersionInfo) => void
}

export default function GeneratedResult({
  text,
  title,
  usage,
  taskId,
  versionNumber = 1,
  versions = [],
  onNewTask,
  onRevise,
  onVersionSelect,
}: GeneratedResultProps) {
  const [copied, setCopied] = useState(false)
  const [revisionText, setRevisionText] = useState('')
  const [isRevising, setIsRevising] = useState(false)
  const [revisionError, setRevisionError] = useState<string | null>(null)
  const [showVersions, setShowVersions] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      alert('Failed to copy to clipboard')
    }
  }

  const handleRevise = async () => {
    if (!revisionText.trim() || !onRevise) return
    setIsRevising(true)
    setRevisionError(null)
    try {
      await onRevise(revisionText.trim())
      setRevisionText('')
    } catch (err) {
      setRevisionError(err instanceof Error ? err.message : 'Revision failed')
    } finally {
      setIsRevising(false)
    }
  }

  const handleExport = async () => {
    if (!taskId) return
    setIsExporting(true)
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, versionNumber }),
      })

      if (!response.ok) {
        const err = await response.json()
        alert(err.error || 'Export failed')
        return
      }

      // Download the file
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const disposition = response.headers.get('Content-Disposition')
      const filename = disposition?.match(/filename="(.+)"/)?.[1] || `${title}.docx`
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export error:', err)
      alert('Failed to export document')
    } finally {
      setIsExporting(false)
    }
  }

  const wordCount = text.trim().split(/\s+/).filter((w) => w.length > 0).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-gray-500 mt-1">
            {wordCount.toLocaleString()} words
            {versionNumber > 0 && (
              <span className="ml-2 text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                v{versionNumber}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-700 transition flex items-center gap-2"
          >
            {copied ? (
              <>
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </>
            )}
          </button>
          <button
            onClick={onNewTask}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-white transition"
          >
            New Task
          </button>
        </div>
      </div>

      {/* Version Selector */}
      {versions.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <button
            onClick={() => setShowVersions(!showVersions)}
            className="flex items-center justify-between w-full text-left"
          >
            <span className="font-medium text-gray-700">
              Version History ({versions.length} versions)
            </span>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${showVersions ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showVersions && (
            <div className="mt-3 space-y-2">
              {versions.map((v) => (
                <button
                  key={v.id}
                  onClick={() => onVersionSelect?.(v)}
                  className={`w-full text-left p-3 rounded-lg border transition ${
                    v.version_number === versionNumber
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">
                      Version {v.version_number}
                      {v.version_number === versionNumber && (
                        <span className="ml-2 text-xs text-blue-600">(current)</span>
                      )}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(v.created_at).toLocaleString()}
                    </span>
                  </div>
                  {v.revision_instruction && (
                    <p className="text-sm text-gray-500 mt-1 truncate">
                      Revision: {v.revision_instruction}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Generated Text */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6">
          <div className="prose prose-lg max-w-none">
            {text.split('\n\n').map((paragraph, index) => (
              <p key={index} className="mb-4 text-gray-800 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Revision Input */}
      {taskId && onRevise && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Revise This Text</h3>
          <p className="text-sm text-gray-500 mb-4">
            Describe what you&apos;d like to change. A new version will be created.
          </p>
          {revisionError && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {revisionError}
            </div>
          )}
          <div className="flex gap-3">
            <textarea
              value={revisionText}
              onChange={(e) => setRevisionText(e.target.value)}
              placeholder='e.g. "Make it more casual" or "Add more specific examples in paragraph 2"'
              className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              disabled={isRevising}
            />
            <button
              onClick={handleRevise}
              disabled={isRevising || !revisionText.trim()}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg font-medium text-white transition self-end"
            >
              {isRevising ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Revising...
                </span>
              ) : (
                'Revise'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Usage Stats */}
      {usage && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Generation Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Input Tokens</span>
              <p className="font-medium text-gray-900">{usage.prompt_tokens.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-gray-500">Output Tokens</span>
              <p className="font-medium text-gray-900">{usage.completion_tokens.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-gray-500">Total Tokens</span>
              <p className="font-medium text-gray-900">{usage.total_tokens.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-gray-500">Est. Cost</span>
              <p className="font-medium text-gray-900">
                ${usage.estimated_cost < 0.01
                  ? usage.estimated_cost.toFixed(4)
                  : usage.estimated_cost.toFixed(3)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pt-4 border-t">
        <button
          onClick={handleCopy}
          className="px-6 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-medium text-gray-700 transition"
        >
          Copy to Clipboard
        </button>
        {taskId && (
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg font-medium text-white transition flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export .docx
              </>
            )}
          </button>
        )}
        <a
          href="/history"
          className="px-6 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-medium text-gray-700 transition inline-block"
        >
          View History
        </a>
      </div>
    </div>
  )
}
