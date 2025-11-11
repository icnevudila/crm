import SessionProvider from '@/components/providers/SessionProvider'
import QueryProvider from '@/components/providers/QueryProvider'
import { Toaster } from 'sonner'

// Landing sayfası için özel layout - sidebar ve navbar YOK
export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <QueryProvider>
        <div className="min-h-screen w-full overflow-x-hidden">
          {children}
        </div>
        <Toaster 
          position="top-right" 
          expand={false}
          richColors
          closeButton
          duration={4000}
          toastOptions={{
            classNames: {
              toast: 'group toast shadow-lg border-2',
              title: 'text-base font-semibold',
              description: 'text-sm',
              actionButton: 'bg-indigo-600 text-white hover:bg-indigo-700',
              cancelButton: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
              closeButton: 'bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700',
              error: 'border-red-300 bg-red-50 text-red-900',
              success: 'border-emerald-300 bg-emerald-50 text-emerald-900',
              warning: 'border-amber-300 bg-amber-50 text-amber-900',
              info: 'border-indigo-300 bg-indigo-50 text-indigo-900',
            },
            style: {
              borderRadius: '12px',
              padding: '16px',
              fontSize: '14px',
            }
          }}
        />
      </QueryProvider>
    </SessionProvider>
  )
}


