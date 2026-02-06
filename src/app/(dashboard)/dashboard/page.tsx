'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface DashboardStats {
  sampleCount: number
  totalWords: number
  isReady: boolean
  taskCount: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    sampleCount: 0,
    totalWords: 0,
    isReady: false,
    taskCount: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const [profileRes, tasksRes] = await Promise.all([
        fetch('/api/style-profile'),
        fetch('/api/tasks'),
      ])

      let sampleCount = 0
      let totalWords = 0
      let isReady = false
      let taskCount = 0

      if (profileRes.ok) {
        const data = await profileRes.json()
        sampleCount = data.stats?.sample_count || 0
        totalWords = data.stats?.total_words || 0
        isReady = data.stats?.is_ready || false
      }

      if (tasksRes.ok) {
        const data = await tasksRes.json()
        taskCount = data.tasks?.length || 0
      }

      setStats({ sampleCount, totalWords, isReady, taskCount })
    } catch (err) {
      console.error('Error loading stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const readinessPercent = Math.min(100, Math.round((stats.totalWords / 2000) * 100))

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Dashboard</h1>
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-md animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="text-gray-500 text-sm mb-2">Style Samples</div>
          <div className="text-3xl font-bold text-blue-600">{stats.sampleCount}</div>
          <div className="text-gray-400 text-sm mt-1">
            {stats.sampleCount === 0 ? 'Upload samples to get started' : `${stats.sampleCount} document${stats.sampleCount !== 1 ? 's' : ''} uploaded`}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="text-gray-500 text-sm mb-2">Total Words</div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalWords.toLocaleString()}</div>
          <div className="text-gray-400 text-sm mt-1">
            {stats.totalWords < 2000 ? `Need ${(2000 - stats.totalWords).toLocaleString()} more for readiness` : 'Style profile ready'}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="text-gray-500 text-sm mb-2">Writing Tasks</div>
          <div className="text-3xl font-bold text-gray-900">{stats.taskCount}</div>
          <div className="text-gray-400 text-sm mt-1">
            {stats.taskCount === 0 ? 'No tasks created yet' : `${stats.taskCount} task${stats.taskCount !== 1 ? 's' : ''} generated`}
          </div>
        </div>
      </div>

      {/* Profile Status */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-xl mb-8">
        <h2 className="text-2xl font-bold mb-4">Style Profile Status</h2>
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Readiness</span>
            <span className="text-gray-600">{stats.totalWords.toLocaleString()} / 2,000 words</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${stats.isReady ? 'bg-green-500' : 'bg-blue-600'}`}
              style={{ width: `${readinessPercent}%` }}
            ></div>
          </div>
        </div>
        <p className="text-gray-600">
          {stats.isReady
            ? 'Your style profile is ready! Head to New Task to start generating.'
            : 'Upload 3-5 English writing samples (total 2,000-6,000 words) to build your style profile.'}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Link
          href="/style-library"
          className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition group"
        >
          <div className="text-4xl mb-4">📝</div>
          <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-600">
            Upload Style Samples
          </h3>
          <p className="text-gray-600">
            Upload your English documents to build your style profile.
          </p>
        </Link>

        {stats.isReady ? (
          <Link
            href="/new-task"
            className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition group"
          >
            <div className="text-4xl mb-4">✨</div>
            <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-600">
              Create New Task
            </h3>
            <p className="text-gray-600">
              Generate style-matched content with your personal voice.
            </p>
          </Link>
        ) : (
          <div className="bg-gray-100 p-8 rounded-xl shadow-md opacity-50 cursor-not-allowed">
            <div className="text-4xl mb-4">✨</div>
            <h3 className="text-xl font-semibold mb-2">Create New Task</h3>
            <p className="text-gray-600">
              Upload samples first to unlock content generation.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
