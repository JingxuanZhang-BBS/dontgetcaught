'use client'

import { useState, useEffect } from 'react'
import TaskForm from '@/components/TaskForm'
import GeneratedResult from '@/components/GeneratedResult'
import type { TaskType } from '@/types/database'

interface StyleProfileStats {
  sample_count: number
  total_words: number
  is_ready: boolean
  recommended_words: number
  words_needed: number
}

interface GenerateResponse {
  success: boolean
  task_id?: string
  version_id?: string
  generated_text?: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
    estimated_cost: number
  }
  error?: string
}

export default function NewTaskPage() {
  const [profileStats, setProfileStats] = useState<StyleProfileStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<{
    text: string
    title: string
    usage?: GenerateResponse['usage']
    taskId?: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load style profile stats on mount
  useEffect(() => {
    loadProfileStats()
  }, [])

  const loadProfileStats = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/style-profile')
      if (response.ok) {
        const data = await response.json()
        setProfileStats(data.stats)
      }
    } catch (err) {
      console.error('Error loading profile stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (data: {
    title: string
    requirements: string
    taskType: TaskType
  }) => {
    setGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result: GenerateResponse = await response.json()

      if (!response.ok) {
        setError(result.error || 'Generation failed. Please try again.')
        return
      }

      setResult({
        text: result.generated_text || '',
        title: data.title,
        usage: result.usage,
        taskId: result.task_id
      })
    } catch (err) {
      console.error('Generation error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const handleNewTask = () => {
    setResult(null)
    setError(null)
  }

  // Show loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">New Writing Task</h1>
        <div className="bg-white p-12 rounded-xl shadow-md text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  // Show result if we have one
  if (result) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Generated Content</h1>
        <GeneratedResult
          text={result.text}
          title={result.title}
          usage={result.usage}
          taskId={result.taskId}
          onNewTask={handleNewTask}
        />
      </div>
    )
  }

  // Show form
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">New Writing Task</h1>
        <p className="text-gray-600">
          Describe what you want to write, and we&apos;ll generate it in your personal style.
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="text-red-500 text-xl">⚠️</div>
            <div>
              <h3 className="font-semibold text-red-900">Generation Failed</h3>
              <p className="text-red-800 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Task Form */}
      <div className="bg-white rounded-xl shadow-md p-8">
        <TaskForm
          onSubmit={handleSubmit}
          isLoading={generating}
          isReady={profileStats?.is_ready ?? false}
          currentWords={profileStats?.total_words ?? 0}
          requiredWords={500}
        />
      </div>

      {/* Tips Section */}
      <div className="mt-8 bg-blue-50 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-3">Tips for Better Results</h3>
        <ul className="space-y-2 text-blue-800 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            Be specific about your topic and what points you want to cover
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            Mention any specific requirements (word count, tone, audience)
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            The more writing samples you upload, the better the style matching
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            You can revise the generated text with follow-up instructions (coming in Step 8)
          </li>
        </ul>
      </div>
    </div>
  )
}
