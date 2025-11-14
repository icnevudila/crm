'use client'

import { useState, useEffect } from 'react'
import { Search, Loader2, FileText, Briefcase, Receipt, Users, Package, Calendar, CheckSquare } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useData } from '@/hooks/useData'
import { cn } from '@/lib/utils'

interface SearchResult {
  id: string
  type: 'customer' | 'deal' | 'quote' | 'invoice' | 'product' | 'task' | 'meeting'
  title: string
  subtitle?: string
  url: string
}

interface SearchResponse {
  results: SearchResult[]
  total: number
}

export default function GlobalSearchBar() {
  const locale = useLocale()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  
  // Debounced search - kullanıcı yazmayı bitirdikten 300ms sonra arama
  const [debouncedQuery, setDebouncedQuery] = useState('')
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)
    
    return () => clearTimeout(timer)
  }, [query])
  
  // Arama yap (sadece 2+ karakter için)
  const shouldSearch = debouncedQuery.length >= 2
  const searchUrl = shouldSearch ? `/api/search?q=${encodeURIComponent(debouncedQuery)}` : null
  
  const { data, isLoading } = useData<SearchResponse>(searchUrl, {
    dedupingInterval: 2000,
    revalidateOnFocus: false,
  })
  
  // Ctrl+K veya Cmd+K ile aç/kapat
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
      
      // Esc ile kapat
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])
  
  const handleSelect = (url: string) => {
    setOpen(false)
    setQuery('')
    router.push(url)
  }
  
  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'customer':
        return <Users className="h-4 w-4" />
      case 'deal':
        return <Briefcase className="h-4 w-4" />
      case 'quote':
        return <FileText className="h-4 w-4" />
      case 'invoice':
        return <Receipt className="h-4 w-4" />
      case 'product':
        return <Package className="h-4 w-4" />
      case 'task':
        return <CheckSquare className="h-4 w-4" />
      case 'meeting':
        return <Calendar className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }
  
  const getTypeLabel = (type: SearchResult['type']) => {
    const labels: Record<SearchResult['type'], string> = {
      customer: 'Müşteri',
      deal: 'Fırsat',
      quote: 'Teklif',
      invoice: 'Fatura',
      product: 'Ürün',
      task: 'Görev',
      meeting: 'Görüşme',
    }
    return labels[type] || type
  }
  
  // Sonuçları type'a göre grupla
  const groupedResults = data?.results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = []
    }
    acc[result.type].push(result)
    return acc
  }, {} as Record<string, SearchResult[]>) || {}
  
  return (
    <>
      {/* Search Button (Header'da gösterilecek) */}
      <Button
        variant="outline"
        className={cn(
          'relative h-9 w-full sm:w-64 justify-start text-sm text-muted-foreground',
          'hover:bg-accent transition-colors'
        )}
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden sm:inline">Ara...</span>
        <span className="hidden sm:inline-flex ml-auto gap-1 text-xs">
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">Ctrl</span>K
          </kbd>
        </span>
      </Button>
      
      {/* Search Dialog (Search Modal) */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Global Arama
            </DialogTitle>
            <div className="mt-4">
              <Input
                placeholder="Ara... (Müşteri, Fırsat, Teklif, Fatura, vb.)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full"
                autoFocus
              />
            </div>
          </DialogHeader>
          
          <div className="max-h-[60vh] overflow-y-auto px-6">
            {isLoading && debouncedQuery.length >= 2 && (
              <div className="flex items-center justify-center p-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Aranıyor...</span>
              </div>
            )}
            
            {!isLoading && debouncedQuery.length < 2 && (
              <div className="text-center py-12">
                <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  Arama yapmak için en az 2 karakter yazın
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Müşteriler, Fırsatlar, Teklifler, Faturalar ve daha fazlasını arayabilirsiniz
                </p>
              </div>
            )}
            
            {!isLoading && debouncedQuery.length >= 2 && data?.results.length === 0 && (
              <div className="text-center py-12">
                <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="text-sm font-medium">Sonuç bulunamadı</p>
                <p className="text-xs text-muted-foreground mt-2">
                  &quot;{debouncedQuery}&quot; için sonuç bulunamadı
                </p>
              </div>
            )}
            
            {!isLoading && Object.keys(groupedResults).length > 0 && (
              <div className="py-4 space-y-6">
                {Object.entries(groupedResults).map(([type, results]) => (
                  <div key={type} className="space-y-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                      {getTypeLabel(type as SearchResult['type'])}
                    </h3>
                    <div className="space-y-1">
                      {results.map((result) => (
                        <button
                          key={result.id}
                          onClick={() => handleSelect(result.url)}
                          className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left cursor-pointer group"
                        >
                          <div className="mt-0.5 text-muted-foreground group-hover:text-foreground transition-colors">
                            {getTypeIcon(result.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate group-hover:text-primary transition-colors">
                              {result.title}
                            </div>
                            {result.subtitle && (
                              <div className="text-xs text-muted-foreground truncate mt-0.5">
                                {result.subtitle}
                              </div>
                            )}
                          </div>
                          <Badge variant="outline" className="ml-auto shrink-0">
                            {getTypeLabel(result.type)}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                
                {data && data.total > 10 && (
                  <div className="border-t pt-4 text-center text-xs text-muted-foreground">
                    {data.total} sonuç bulundu (ilk 10 gösteriliyor)
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
