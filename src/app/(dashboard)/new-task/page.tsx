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

interface ReviseResponse {
  success: boolean
  task_id?: string
  version_id?: string
  version_number?: number
  generated_text?: string
  revision_instruction?: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
    estimated_cost: number
  }
  error?: string
}

interface VersionInfo {
  id: string
  version_number: number
  generated_text: string
  revision_instruction: string | null
  created_at: string
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
    versionNumber: number
  } | null>(null)
  const [versions, setVersions] = useState<VersionInfo[]>([])
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
    referenceFiles: File[]
  }) => {
    setGenerating(true)
    setError(null)

    try {
      // Use FormData to support file uploads
      const formData = new FormData()
      formData.append('title', data.title)
      formData.append('requirements', data.requirements)
      formData.append('taskType', data.taskType)

      // Add reference files
      for (const file of data.referenceFiles) {
        formData.append('referenceFiles', file)
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
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
        taskId: result.task_id,
        versionNumber: 1,
      })

      // Set initial version
      if (result.task_id && result.version_id) {
        setVersions([
          {
            id: result.version_id,
            version_number: 1,
            generated_text: result.generated_text || '',
            revision_instruction: null,
            created_at: new Date().toISOString(),
          },
        ])
      }
    } catch (err) {
      console.error('Generation error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const handleRevise = async (instruction: string) => {
    if (!result?.taskId) throw new Error('No task to revise')

    const response = await fetch('/api/revise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taskId: result.taskId,
        revisionInstruction: instruction,
      }),
    })

    const data: ReviseResponse = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Revision failed')
    }

    // Update result with revised text
    setResult((prev) =>
      prev
        ? {
            ...prev,
            text: data.generated_text || prev.text,
            usage: data.usage || prev.usage,
            versionNumber: data.version_number || prev.versionNumber + 1,
          }
        : null
    )

    // Add new version to list
    if (data.version_id) {
      setVersions((prev) => [
        ...prev,
        {
          id: data.version_id!,
          version_number: data.version_number || prev.length + 1,
          generated_text: data.generated_text || '',
          revision_instruction: instruction,
          created_at: new Date().toISOString(),
        },
      ])
    }
  }

  const handleVersionSelect = (version: VersionInfo) => {
    setResult((prev) =>
      prev
        ? {
            ...prev,
            text: version.generated_text,
            versionNumber: version.version_number,
            usage: undefined, // Usage not stored per version
          }
        : null
    )
  }

  const handleNewTask = () => {
    setResult(null)
    setVersions([])
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
          versionNumber={result.versionNumber}
          versions={versions}
          onNewTask={handleNewTask}
          onRevise={handleRevise}
          onVersionSelect={handleVersionSelect}
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
            After generating, use the revision box to refine the output
          </li>
        </ul>
      </div>
    </div>
  )
}
