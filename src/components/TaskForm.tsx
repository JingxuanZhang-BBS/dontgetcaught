'use client'

import { useState, useRef } from 'react'
import type { TaskType } from '@/types/database'

interface TaskFormProps {
  onSubmit: (data: {
    title: string
    requirements: string
    taskType: TaskType
    referenceFiles: File[]
  }) => void
  isLoading: boolean
  isReady: boolean
  currentWords: number
  requiredWords: number
}

const TASK_TYPES: { value: TaskType; label: string; description: string }[] = [
  {
    value: 'personal_narrative',
    label: 'Personal Narrative',
    description: 'Stories, personal essays, reflections'
  },
  {
    value: 'argumentative',
    label: 'Argumentative / Persuasive',
    description: 'Essays that argue a point or persuade'
  },
  {
    value: 'general',
    label: 'General Writing',
    description: 'Other types of writing'
  }
]

const MAX_FILES = 3
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB

export default function TaskForm({
  onSubmit,
  isLoading,
  isReady,
  currentWords,
  requiredWords
}: TaskFormProps) {
  const [title, setTitle] = useState('')
  const [requirements, setRequirements] = useState('')
  const [taskType, setTaskType] = useState<TaskType>('general')
  const [referenceFiles, setReferenceFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !requirements.trim()) {
      alert('Please fill in both title and requirements.')
      return
    }

    onSubmit({
      title: title.trim(),
      requirements: requirements.trim(),
      taskType,
      referenceFiles
    })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles: File[] = []
    const errors: string[] = []

    for (const file of files) {
      // Check file type (.docx only)
      if (!file.name.toLowerCase().endsWith('.docx')) {
        errors.push(`${file.name}: Only .docx files are supported`)
        continue
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File too large (max 2MB)`)
        continue
      }

      // Check total count
      if (referenceFiles.length + validFiles.length >= MAX_FILES) {
        errors.push(`Maximum ${MAX_FILES} reference files allowed`)
        break
      }

      validFiles.push(file)
    }

    if (errors.length > 0) {
      alert(errors.join('\n'))
    }

    if (validFiles.length > 0) {
      setReferenceFiles(prev => [...prev, ...validFiles])
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeFile = (index: number) => {
    setReferenceFiles(prev => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const canSubmit = isReady && title.trim() && requirements.trim() && !isLoading

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Style Profile Status */}
      {!isReady && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚠️</div>
            <div>
              <h3 className="font-semibold text-amber-900">Style Profile Not Ready</h3>
              <p className="text-amber-800 text-sm mt-1">
                You need at least {requiredWords} words of writing samples.
                Currently: {currentWords} words.
              </p>
              <a
                href="/style-library"
                className="inline-block mt-2 text-amber-700 hover:text-amber-900 font-medium text-sm underline"
              >
                Go to Style Library to upload samples →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Title Input */}
      <div>
        <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
          Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter the title of your writing..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          disabled={isLoading}
        />
      </div>

      {/* Task Type Selection */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Writing Type
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {TASK_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setTaskType(type.value)}
              disabled={isLoading}
              className={`p-4 rounded-lg border-2 text-left transition ${
                taskType === type.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="font-medium text-gray-900">{type.label}</div>
              <div className="text-xs text-gray-500 mt-1">{type.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Requirements/Description */}
      <div>
        <label htmlFor="requirements" className="block text-sm font-semibold text-gray-700 mb-2">
          Requirements / Description
        </label>
        <textarea
          id="requirements"
          value={requirements}
          onChange={(e) => setRequirements(e.target.value)}
          placeholder="Describe what you want to write about. Include any specific requirements, topics to cover, or style preferences..."
          rows={6}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-y"
          disabled={isLoading}
        />
        <p className="mt-1 text-xs text-gray-500">
          Be specific about your topic and any requirements. The more detail you provide, the better the result.
        </p>
      </div>

      {/* Reference Files Upload */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Reference Files (Optional)
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Upload Word documents to reference in your writing. Content from these files can be cited or used as source material.
        </p>

        {/* File List */}
        {referenceFiles.length > 0 && (
          <div className="mb-3 space-y-2">
            {referenceFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <div className="text-blue-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  disabled={isLoading}
                  className="text-gray-400 hover:text-red-500 transition"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload Button */}
        {referenceFiles.length < MAX_FILES && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition text-center"
            >
              <div className="text-gray-500">
                <svg className="w-8 h-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <p className="text-sm font-medium">Add Reference File</p>
                <p className="text-xs mt-1">.docx only, max 2MB each, up to {MAX_FILES} files</p>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-between pt-4">
        <p className="text-sm text-gray-500">
          {isReady ? (
            <span className="text-green-600">Style profile ready ({currentWords} words)</span>
          ) : (
            <span className="text-amber-600">Need {requiredWords - currentWords} more words</span>
          )}
        </p>
        <button
          type="submit"
          disabled={!canSubmit}
          className={`px-8 py-3 rounded-lg font-semibold text-white transition ${
            canSubmit
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Generating...
            </span>
          ) : (
            'Generate in My Style'
          )}
        </button>
      </div>
    </form>
  )
}
