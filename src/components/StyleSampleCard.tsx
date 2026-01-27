'use client'

import type { StyleSample } from '@/types/database'

interface StyleSampleCardProps {
  sample: StyleSample
  onDelete?: (id: string) => void
  deleting?: boolean
}

export default function StyleSampleCard({ sample, onDelete, deleting }: StyleSampleCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'indexed':
        return 'bg-green-100 text-green-700'
      case 'parsing':
        return 'bg-yellow-100 text-yellow-700'
      case 'lang_failed':
        return 'bg-red-100 text-red-700'
      case 'error':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'uploaded':
        return '✓ Uploaded'
      case 'parsing':
        return '⏳ Processing...'
      case 'lang_failed':
        return '⚠️ Language Error'
      case 'indexed':
        return '✓ Ready'
      case 'error':
        return '⚠️ Error'
      default:
        return status
    }
  }

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'docx':
        return '📄'
      case 'pdf':
        return '📕'
      case 'paste':
        return '📝'
      default:
        return '📄'
    }
  }

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-blue-300 transition">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{getSourceIcon(sample.source_type)}</div>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg truncate max-w-[300px]">
              {sample.filename}
            </h3>
            <p className="text-sm text-gray-500">
              {new Date(sample.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {onDelete && (
          <button
            onClick={() => onDelete(sample.id)}
            disabled={deleting}
            className="text-red-600 hover:text-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete sample"
          >
            {deleting ? '⏳' : '🗑️'}
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(sample.status)}`}>
            {getStatusText(sample.status)}
          </span>

          {sample.word_count_en > 0 && (
            <span className="text-sm text-gray-600">
              {sample.word_count_en.toLocaleString()} words
            </span>
          )}
        </div>
      </div>

      {sample.error_message && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{sample.error_message}</p>
        </div>
      )}

      {sample.status === 'lang_failed' && !sample.error_message && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>English-only requirement:</strong> This sample contains non-English content.
            Please upload English-only documents to build your style profile.
          </p>
        </div>
      )}
    </div>
  )
}
