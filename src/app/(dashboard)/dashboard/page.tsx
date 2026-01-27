import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">
        Dashboard
      </h1>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="text-gray-500 text-sm mb-2">Style Samples</div>
          <div className="text-3xl font-bold text-blue-600">0</div>
          <div className="text-gray-400 text-sm mt-1">Upload samples to get started</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="text-gray-500 text-sm mb-2">Total Words</div>
          <div className="text-3xl font-bold text-gray-900">0</div>
          <div className="text-gray-400 text-sm mt-1">Need 2,000+ for readiness</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="text-gray-500 text-sm mb-2">Writing Tasks</div>
          <div className="text-3xl font-bold text-gray-900">0</div>
          <div className="text-gray-400 text-sm mt-1">No tasks created yet</div>
        </div>
      </div>

      {/* Profile Status */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-xl mb-8">
        <h2 className="text-2xl font-bold mb-4">Style Profile Status</h2>
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Readiness</span>
            <span className="text-gray-600">0 / 2,000 words</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all"
              style={{ width: '0%' }}
            ></div>
          </div>
        </div>
        <p className="text-gray-600">
          Upload 3-5 English writing samples (total 2,000-6,000 words) to build your style profile.
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
            Upload your English documents to start building your style profile.
          </p>
        </Link>

        <div className="bg-gray-100 p-8 rounded-xl shadow-md opacity-50 cursor-not-allowed">
          <div className="text-4xl mb-4">✨</div>
          <h3 className="text-xl font-semibold mb-2">
            Create New Task
          </h3>
          <p className="text-gray-600">
            Upload samples first to unlock content generation.
          </p>
        </div>
      </div>
    </div>
  )
}
