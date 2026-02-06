'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const [email, setEmail] = useState<string>('')
  const [clearing, setClearing] = useState(false)
  const [clearSuccess, setClearSuccess] = useState(false)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setEmail(user.email || '')
    }
  }

  const handleClearData = async () => {
    if (!confirm('This will permanently delete ALL your data:\n\n- Writing samples\n- Style profile\n- Writing tasks & versions\n\nThis action cannot be undone. Continue?')) {
      return
    }

    setClearing(true)
    setClearSuccess(false)
    try {
      const response = await fetch('/api/account/clear-data', { method: 'POST' })
      if (response.ok) {
        setClearSuccess(true)
        setTimeout(() => setClearSuccess(false), 5000)
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to clear data')
      }
    } catch (err) {
      console.error('Error clearing data:', err)
      alert('Failed to clear data')
    } finally {
      setClearing(false)
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Settings</h1>

      {/* Account Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account</h2>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-500">Email</label>
            <p className="font-medium text-gray-900">{email || 'Loading...'}</p>
          </div>
        </div>
        <div className="mt-6">
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-700 transition"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <h2 className="text-lg font-semibold text-red-900 mb-2">Danger Zone</h2>
        <p className="text-sm text-gray-600 mb-4">
          Clear all your data including writing samples, style profiles, and writing history. This cannot be undone.
        </p>

        {clearSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
            All data has been cleared successfully.
          </div>
        )}

        <button
          onClick={handleClearData}
          disabled={clearing}
          className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg font-medium text-white transition"
        >
          {clearing ? 'Clearing...' : 'Clear All Data'}
        </button>
      </div>
    </div>
  )
}
