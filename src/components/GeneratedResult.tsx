'use client'

import { useState } from 'react'

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
  onNewTask: () => void
}

export default function GeneratedResult({
  text,
  title,
  usage,
  onNewTask
}: GeneratedResultProps) {
  const [copied, setCopied] = useState(false)

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

  // Count words
  const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-gray-500 mt-1">
            {wordCount.toLocaleString()} words generated
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
