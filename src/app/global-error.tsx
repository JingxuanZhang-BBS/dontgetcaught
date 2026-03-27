'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body style={{ background: '#0c0c0c', color: '#e0dbd0', fontFamily: 'monospace', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Something went wrong</h2>
          <p style={{ fontSize: '.8rem', color: '#666', marginBottom: '1.5rem' }}>{error.message}</p>
          <button
            onClick={reset}
            style={{ padding: '.5rem 1.2rem', background: '#1e3a2f', border: '1px solid #2ecc71', color: '#2ecc71', borderRadius: 8, cursor: 'pointer', fontFamily: 'monospace' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
