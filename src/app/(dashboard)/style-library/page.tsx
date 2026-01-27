'use client'

import { useState, useEffect } from 'react'
import UploadZone from '@/components/UploadZone'
import StyleSampleCard from '@/components/StyleSampleCard'
import type { StyleSample, SourceType } from '@/types/database'

// Mock data for development mode
const mockSamples: StyleSample[] = [
  {
    id: 'mock-1',
    user_id: 'dev-user-123',
    filename: 'Sample Essay.docx',
    source_type: 'docx',
    storage_path: null,
    raw_text: null,
    cleaned_text: null,
    detected_language: 'en',
    status: 'indexed',
    word_count_en: 1250,
    error_message: null,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'mock-2',
    user_id: 'dev-user-123',
    filename: 'Personal Statement.pdf',
    source_type: 'pdf',
    storage_path: null,
    raw_text: null,
    cleaned_text: null,
    detected_language: 'en',
    status: 'indexed',
    word_count_en: 800,
    error_message: null,
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString()
  },
  {
    id: 'mock-3',
    user_id: 'dev-user-123',
    filename: 'Email Draft.txt',
    source_type: 'paste',
    storage_path: null,
    raw_text: null,
    cleaned_text: null,
    detected_language: 'en',
    status: 'indexed',
    word_count_en: 350,
    error_message: null,
    created_at: new Date(Date.now() - 259200000).toISOString(),
    updated_at: new Date(Date.now() - 259200000).toISOString()
  }
]

export default function StyleLibraryPage() {
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'
  const [samples, setSamples] = useState<StyleSample[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    loadSamples()
  }, [])

  const loadSamples = async () => {
    setLoading(true)
    try {
      if (isDevMode) {
        // Development mode: use mock data
        await new Promise(resolve => setTimeout(resolve, 500))
        setSamples(mockSamples)
      } else {
        // Production mode: fetch from Supabase
        // TODO: Implement Supabase fetch
        setSamples([])
      }
    } catch (error) {
      console.error('Error loading samples:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (files: File[], type: SourceType) => {
    if (isDevMode) {
      alert('Development Mode: Upload functionality requires Supabase configuration.\n\nPlease configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local, then set NEXT_PUBLIC_DEV_MODE=false to enable uploads.')
      return
    }

    setUploading(true)
    try {
      // TODO: Implement file upload to Supabase
      console.log('Uploading files:', files, 'Type:', type)
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handlePasteText = async (text: string) => {
    if (isDevMode) {
      alert('Development Mode: Upload functionality requires Supabase configuration.\n\nPlease configure Supabase in .env.local and set NEXT_PUBLIC_DEV_MODE=false to enable text uploads.')
      return
    }

    setUploading(true)
    try {
      // TODO: Implement text paste to Supabase
      console.log('Pasting text:', text.substring(0, 100) + '...')
    } catch (error) {
      console.error('Paste error:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sample? This action cannot be undone.')) {
      return
    }

    if (isDevMode) {
      alert('Development Mode: Delete functionality requires Supabase configuration.')
      return
    }

    setDeleting(id)
    try {
      // TODO: Implement delete from Supabase
      console.log('Deleting sample:', id)
    } catch (error) {
      console.error('Delete error:', error)
      alert('Delete failed. Please try again.')
    } finally {
      setDeleting(null)
    }
  }

  // Calculate statistics
  const totalWords = samples
    .filter(s => s.status === 'indexed' && s.detected_language === 'en')
    .reduce((sum, s) => sum + s.word_count_en, 0)
  const recommendedWords = 2000
  const readinessPercentage = Math.min(100, Math.round((totalWords / recommendedWords) * 100))
  const isReady = totalWords >= recommendedWords

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Style Library
        </h1>
        <p className="text-gray-600">
          Upload your English writing samples to build your personal style profile.
        </p>
      </div>

      {/* Development Mode Warning */}
      {isDevMode && (
        <div className="mb-6 p-6 bg-amber-50 border-2 border-amber-300 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="text-3xl">⚠️</div>
            <div>
              <h3 className="font-semibold text-amber-900 text-lg mb-2">
                Development Mode Active
              </h3>
              <p className="text-amber-800 mb-3">
                You're viewing mock data. To enable full functionality:
              </p>
              <ol className="list-decimal list-inside text-amber-800 space-y-1 text-sm">
                <li>Set up your Supabase project at <a href="https://supabase.com" target="_blank" className="underline font-semibold">supabase.com</a></li>
                <li>Run the database migrations in <code className="bg-amber-200 px-1 rounded">supabase/migrations/</code></li>
                <li>Update <code className="bg-amber-200 px-1 rounded">.env.local</code> with your Supabase credentials</li>
                <li>Set <code className="bg-amber-200 px-1 rounded">NEXT_PUBLIC_DEV_MODE=false</code></li>
              </ol>
              <p className="text-xs text-amber-700 mt-3">
                📚 See <code>supabase/README.md</code> for detailed setup instructions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Style Profile Readiness */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-xl mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Style Profile Status</h2>
            <p className="text-gray-600 mt-1">
              {isReady
                ? '✅ Your profile is ready! You can start generating content.'
                : `Upload more samples to reach the recommended ${recommendedWords.toLocaleString()} words.`}
            </p>
          </div>
          {isReady && (
            <div className="text-5xl">🎉</div>
          )}
        </div>

        <div className="mb-3">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 font-semibold">
              {totalWords.toLocaleString()} / {recommendedWords.toLocaleString()} words
            </span>
            <span className="text-gray-600 font-semibold">{readinessPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all duration-500 ${
                isReady ? 'bg-green-500' : 'bg-blue-600'
              }`}
              style={{ width: `${readinessPercentage}%` }}
            ></div>
          </div>
        </div>

        <p className="text-sm text-gray-500">
          💡 <strong>Tip:</strong> More samples = better style matching. Upload 3-5 documents for optimal results.
        </p>
      </div>

      {/* Upload Zone */}
      <div className="mb-8">
        <UploadZone
          onUpload={handleUpload}
          onPasteText={handlePasteText}
          maxFiles={10}
          maxFileSize={10}
          disabled={uploading}
        />
      </div>

      {/* Samples List */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Your Samples ({samples.length})
          </h2>
          {samples.length > 0 && !isDevMode && (
            <button
              onClick={loadSamples}
              className="text-blue-600 hover:text-blue-700 font-semibold transition"
            >
              🔄 Refresh
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-600">Loading your samples...</p>
          </div>
        ) : samples.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border-2 border-gray-200">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-600 text-lg mb-2">No samples yet</p>
            <p className="text-gray-500">Upload your first writing sample to get started!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {samples.map(sample => (
              <StyleSampleCard
                key={sample.id}
                sample={sample}
                onDelete={isDevMode ? undefined : handleDelete}
                deleting={deleting === sample.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
