'use client'

import { useState, useCallback, useRef } from 'react'
import type { SourceType } from '@/types/database'

interface UploadZoneProps {
  onUpload: (files: File[], type: SourceType) => Promise<void>
  onPasteText: (text: string) => Promise<void>
  maxFiles?: number
  maxFileSize?: number // in MB
  disabled?: boolean
}

export default function UploadZone({
  onUpload,
  onPasteText,
  maxFiles = 10,
  maxFileSize = 10,
  disabled = false
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [showPasteModal, setShowPasteModal] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [pasteLoading, setPasteLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFiles = (files: FileList): { valid: File[]; errors: string[] } => {
    const validFiles: File[] = []
    const errors: string[] = []

    if (files.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed per upload`)
      return { valid: [], errors }
    }

    Array.from(files).forEach(file => {
      // Check file type
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (ext !== 'docx' && ext !== 'pdf') {
        errors.push(`${file.name}: Only .docx and .pdf files are supported`)
        return
      }

      // Check file size
      if (file.size > maxFileSize * 1024 * 1024) {
        errors.push(`${file.name}: File size exceeds ${maxFileSize}MB limit`)
        return
      }

      validFiles.push(file)
    })

    return { valid: validFiles, errors }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled) return

    const files = e.dataTransfer.files
    const { valid, errors } = validateFiles(files)

    if (errors.length > 0) {
      alert(errors.join('\n'))
    }

    if (valid.length > 0) {
      const firstFileExt = valid[0].name.split('.').pop()?.toLowerCase()
      const sourceType: SourceType = firstFileExt === 'pdf' ? 'pdf' : 'docx'
      await onUpload(valid, sourceType)
    }
  }, [disabled, onUpload, maxFiles, maxFileSize])

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const { valid, errors } = validateFiles(files)

    if (errors.length > 0) {
      alert(errors.join('\n'))
    }

    if (valid.length > 0) {
      const firstFileExt = valid[0].name.split('.').pop()?.toLowerCase()
      const sourceType: SourceType = firstFileExt === 'pdf' ? 'pdf' : 'docx'
      await onUpload(valid, sourceType)
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [onUpload, maxFiles, maxFileSize])

  const handlePasteSubmit = async () => {
    if (!pasteText.trim()) {
      alert('Please enter some text')
      return
    }

    // Check word count (rough estimate)
    const wordCount = pasteText.trim().split(/\s+/).length
    if (wordCount > 10000) {
      alert('Text exceeds 10,000 words limit. Please paste shorter content.')
      return
    }

    setPasteLoading(true)
    try {
      await onPasteText(pasteText)
      setPasteText('')
      setShowPasteModal(false)
    } catch (error) {
      console.error('Paste error:', error)
    } finally {
      setPasteLoading(false)
    }
  }

  return (
    <>
      {/* Upload Zone */}
      <div
        className={`
          border-2 border-dashed rounded-xl p-12 text-center transition-all
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-400 hover:bg-gray-50'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".docx,.pdf"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />

        <div className="text-6xl mb-4">📄</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Upload Your Writing Samples
        </h3>
        <p className="text-gray-600 mb-4">
          Drag & drop files here, or click to browse
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Supports: <span className="font-semibold">.docx, .pdf</span> • Max {maxFiles} files • Max {maxFileSize}MB each
        </p>

        <div className="flex justify-center gap-4">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              fileInputRef.current?.click()
            }}
            disabled={disabled}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Choose Files
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setShowPasteModal(true)
            }}
            disabled={disabled}
            className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Paste Text
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-6">
          💡 Tip: Upload 3-5 documents (2,000-6,000 words total) for best results
        </p>
      </div>

      {/* Paste Text Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Paste Your Text</h2>
              <p className="text-gray-600 mt-1">
                Copy and paste your English writing sample here (max 10,000 words)
              </p>
            </div>

            <div className="p-6 flex-1 overflow-auto">
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Paste your text here..."
                className="w-full h-full min-h-[300px] p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                autoFocus
              />
              <p className="text-sm text-gray-500 mt-2">
                Word count: ~{pasteText.trim().split(/\s+/).filter(w => w).length} words
              </p>
            </div>

            <div className="p-6 border-t flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowPasteModal(false)
                  setPasteText('')
                }}
                disabled={pasteLoading}
                className="px-6 py-3 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePasteSubmit}
                disabled={pasteLoading || !pasteText.trim()}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pasteLoading ? 'Uploading...' : 'Upload Text'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
