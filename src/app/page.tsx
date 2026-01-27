import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="container mx-auto px-6 py-6">
        <nav className="flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-600">
            DontGetCaught.AI
          </div>
          <div className="space-x-4">
            <Link
              href="/login"
              className="px-4 py-2 text-gray-700 hover:text-blue-600 transition"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Sign Up
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Write Like <span className="text-blue-600">Yourself</span>,<br />
          Not Like AI
        </h1>
        <p className="text-xl text-gray-600 mb-4 max-w-2xl mx-auto">
          Upload your English writing samples. Our AI learns your unique style and helps you generate new content that sounds authentically you.
        </p>
        <p className="text-lg text-blue-600 font-semibold mb-8">
          🇬🇧 English-Only MVP
        </p>
        <Link
          href="/signup"
          className="inline-block px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition shadow-lg"
        >
          Get Started Free
        </Link>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          How It Works
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-md">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-xl font-semibold mb-3">Upload Samples</h3>
            <p className="text-gray-600">
              Upload 3-5 of your English documents (Word, PDF, or paste text). We need about 2,000-6,000 words to learn your style.
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-md">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-xl font-semibold mb-3">We Learn Your Style</h3>
            <p className="text-gray-600">
              Our AI analyzes your sentence rhythm, word choice, punctuation habits, and even your natural imperfections that make writing yours.
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-md">
            <div className="text-4xl mb-4">✨</div>
            <h3 className="text-xl font-semibold mb-3">Generate & Export</h3>
            <p className="text-gray-600">
              Give us a topic or prompt. We generate content in your style. Revise with natural language, then export to Word.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-6 py-20 bg-white rounded-2xl shadow-lg mb-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Frequently Asked Questions
        </h2>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold mb-2">
              Do you support other languages?
            </h3>
            <p className="text-gray-600">
              Not in this MVP. We currently only support English to ensure the highest quality style matching.
            </p>
          </div>
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold mb-2">
              Will it intentionally add mistakes to my writing?
            </h3>
            <p className="text-gray-600">
              No. It preserves your natural imperfections without harming clarity. The goal is authenticity, not sloppiness.
            </p>
          </div>
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold mb-2">
              How is this different from ChatGPT?
            </h3>
            <p className="text-gray-600">
              ChatGPT writes in a generic, polished AI style. We learn from YOUR writing to generate text that sounds like you actually wrote it.
            </p>
          </div>
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold mb-2">
              Is my data private?
            </h3>
            <p className="text-gray-600">
              Yes. Your writing samples and generated content are private to your account. You can delete everything at any time from Settings.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 text-center text-gray-600">
        <p>&copy; 2026 DontGetCaught.AI. All rights reserved.</p>
      </footer>
    </div>
  )
}
