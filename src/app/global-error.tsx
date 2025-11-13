'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="tr">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
            <h1 className="mb-4 text-2xl font-bold text-gray-900">
              Bir Hata Oluştu
            </h1>
            <p className="mb-6 text-gray-600">
              Üzgünüz, beklenmeyen bir hata oluştu. Lütfen sayfayı yenileyip tekrar deneyin.
            </p>
            {error?.message && (
              <div className="mb-6 rounded-md bg-red-50 p-4">
                <p className="text-sm font-mono text-red-800">{error.message}</p>
              </div>
            )}
            <div className="flex gap-4">
              <button
                onClick={reset}
                className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
              >
                Tekrar Dene
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                Ana Sayfaya Dön
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}

