'use client'

import { useState, useEffect } from 'react'

interface TaskVersion {
  id: string
  version_number: number
  generated_text: string
  revision_instruction: string | null
  created_at: string
}

interface WritingTask {
  id: string
  title: string
  task_type: string | null
  prompt_text: string
  created_at: string
  task_versions: TaskVersion[]
}

export default function HistoryPage() {
  const [tasks, setTasks] = useState<WritingTask[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedTask, setExpandedTask] = useState<string | null>(null)
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [exportingId, setExportingId] = useState<string | null>(null)

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    try {
      const response = await fetch('/api/tasks')
      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks || [])
      }
    } catch (err) {
      console.error('Error loading tasks:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (taskId: string) => {
    if (!confirm('Delete this task and all its versions?')) return
    setDeletingId(taskId)
    try {
      const response = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
      if (response.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId))
      }
    } catch (err) {
      console.error('Error deleting task:', err)
    } finally {
      setDeletingId(null)
    }
  }

  const handleExport = async (taskId: string, versionNumber: number) => {
    setExportingId(`${taskId}-${versionNumber}`)
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, versionNumber }),
      })
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const disposition = response.headers.get('Content-Disposition')
        a.download = disposition?.match(/filename="(.+)"/)?.[1] || 'export.docx'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error('Export error:', err)
    } finally {
      setExportingId(null)
    }
  }

  const getTypeLabel = (type: string | null) => {
    switch (type) {
      case 'personal_narrative': return 'Personal Narrative'
      case 'argumentative': return 'Argumentative'
      default: return 'General'
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">History</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-gray-900">History</h1>
        <span className="text-gray-500">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</span>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow-md text-center">
          <div className="text-6xl mb-4">📝</div>
          <p className="text-gray-600 text-lg mb-4">No writing tasks yet</p>
          <a
            href="/new-task"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
          >
            Create Your First Task
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className="bg-white rounded-xl shadow-sm border border-gray-200">
              {/* Task Header */}
              <div
                className="p-5 cursor-pointer hover:bg-gray-50 transition"
                onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{task.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span className="bg-gray-100 px-2 py-0.5 rounded">{getTypeLabel(task.task_type)}</span>
                      <span>{task.task_versions.length} version{task.task_versions.length !== 1 ? 's' : ''}</span>
                      <span>{new Date(task.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(task.id) }}
                      disabled={deletingId === task.id}
                      className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      {deletingId === task.id ? 'Deleting...' : 'Delete'}
                    </button>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${expandedTask === task.id ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Expanded: Versions */}
              {expandedTask === task.id && (
                <div className="border-t px-5 pb-5">
                  {task.task_versions.map((v) => (
                    <div key={v.id} className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            v{v.version_number}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(v.created_at).toLocaleString()}
                          </span>
                          {v.revision_instruction && (
                            <span className="text-xs text-gray-500 italic truncate max-w-xs">
                              &quot;{v.revision_instruction}&quot;
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setExpandedVersion(expandedVersion === v.id ? null : v.id)}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            {expandedVersion === v.id ? 'Hide' : 'View'}
                          </button>
                          <button
                            onClick={() => handleExport(task.id, v.version_number)}
                            disabled={exportingId === `${task.id}-${v.version_number}`}
                            className="text-sm text-green-600 hover:text-green-800"
                          >
                            {exportingId === `${task.id}-${v.version_number}` ? 'Exporting...' : 'Export'}
                          </button>
                        </div>
                      </div>

                      {expandedVersion === v.id && (
                        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 leading-relaxed max-h-96 overflow-y-auto">
                          {v.generated_text.split('\n\n').map((p, i) => (
                            <p key={i} className="mb-3">{p}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
