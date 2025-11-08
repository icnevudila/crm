'use client'

import { useState, useCallback, useMemo } from 'react'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { Plus, Edit, Trash2, TrendingUp, TrendingDown, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import FinanceForm from './FinanceForm'
import SkeletonList from '@/components/skeletons/SkeletonList'
import { formatCurrency } from '@/lib/utils'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'

interface Finance {
  id: string
  type: string
  amount: number
  relatedTo?: string
  createdAt: string
}

export default function FinanceList() {
  const locale = useLocale()
  const [type, setType] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [selectedFinance, setSelectedFinance] = useState<Finance | null>(null)

  // SWR ile veri çekme (repo kurallarına uygun)
  const params = new URLSearchParams()
  if (type) params.append('type', type)
  
  const apiUrl = `/api/finance?${params.toString()}`
  const { data: financeRecords = [], isLoading, error, mutate: mutateFinance } = useData<Finance[]>(apiUrl, {
    dedupingInterval: 5000, // 5 saniye cache (daha kısa - güncellemeler daha hızlı)
    revalidateOnFocus: false, // Focus'ta yeniden fetch yapma
  })

  // Toplam hesaplama - useMemo ile optimize et
  const { totalIncome, totalExpense, netProfit } = useMemo(() => {
    const income = financeRecords
      .filter((f) => f.type === 'INCOME')
      .reduce((sum, f) => sum + (f.amount || 0), 0)
    const expense = financeRecords
      .filter((f) => f.type === 'EXPENSE')
      .reduce((sum, f) => sum + (f.amount || 0), 0)
    return {
      totalIncome: income,
      totalExpense: expense,
      netProfit: income - expense,
    }
  }, [financeRecords])

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Bu finans kaydını silmek istediğinize emin misiniz?')) {
      return
    }

    try {
      const res = await fetch(`/api/finance/${id}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete finance record')
      }
      
      // Optimistic update - silinen kaydı listeden kaldır
      const updatedFinance = financeRecords.filter((f) => f.id !== id)
      
      // Cache'i güncelle - yeni listeyi hemen göster
      await mutateFinance(updatedFinance, { revalidate: false })
      
      // Tüm diğer finance URL'lerini de güncelle
      await Promise.all([
        mutate('/api/finance', updatedFinance, { revalidate: false }),
        mutate('/api/finance?', updatedFinance, { revalidate: false }),
        mutate(apiUrl, updatedFinance, { revalidate: false }),
      ])
    } catch (error: any) {
      // Production'da console.error kaldırıldı
      if (process.env.NODE_ENV === 'development') {
        console.error('Delete error:', error)
      }
      alert(error?.message || 'Silme işlemi başarısız oldu')
    }
  }, [financeRecords, mutateFinance, apiUrl])

  const handleAdd = useCallback(() => {
    setSelectedFinance(null)
    setFormOpen(true)
  }, [])

  const handleEdit = useCallback((finance: Finance) => {
    setSelectedFinance(finance)
    setFormOpen(true)
  }, [])

  const handleFormClose = useCallback(() => {
    setFormOpen(false)
    setSelectedFinance(null)
  }, [])

  if (isLoading) {
    return <SkeletonList />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Finans</h1>
          <p className="mt-2 text-gray-600">Toplam {financeRecords.length} kayıt</p>
        </div>
        <Button
          onClick={handleAdd}
          className="bg-gradient-primary text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Yeni Kayıt
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Toplam Gelir</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(totalIncome)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Toplam Gider</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(totalExpense)}
              </p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Net Kar/Zarar</p>
              <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(netProfit)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={type || 'all'} onValueChange={(v) => setType(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Tip" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="INCOME">Gelir</SelectItem>
            <SelectItem value="EXPENSE">Gider</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tip</TableHead>
              <TableHead>Tutar</TableHead>
              <TableHead>İlişkili</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {financeRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  Finans kaydı bulunamadı
                </TableCell>
              </TableRow>
            ) : (
              financeRecords.map((finance) => (
                <TableRow key={finance.id}>
                  <TableCell>
                    <Badge
                      className={
                        finance.type === 'INCOME'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }
                    >
                      {finance.type === 'INCOME' ? 'Gelir' : 'Gider'}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={`font-semibold ${
                      finance.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {finance.type === 'INCOME' ? '+' : '-'}
                    {formatCurrency(finance.amount || 0)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {finance.relatedTo || '-'}
                  </TableCell>
                  <TableCell>
                    {new Date(finance.createdAt).toLocaleDateString('tr-TR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/${locale}/finance/${finance.id}`} prefetch={true}>
                        <Button variant="ghost" size="icon" aria-label={`Finans kaydını görüntüle`}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(finance)}
                        aria-label="Finans kaydını düzenle"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(finance.id)}
                        className="text-red-600 hover:text-red-700"
                        aria-label="Finans kaydını sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Form Modal */}
      <FinanceForm
        finance={selectedFinance || undefined}
        open={formOpen}
        onClose={handleFormClose}
        onSuccess={async (savedFinance: Finance) => {
          let updatedFinance: Finance[]
          
          if (selectedFinance) {
            updatedFinance = financeRecords.map((f) =>
              f.id === savedFinance.id ? savedFinance : f
            )
          } else {
            updatedFinance = [savedFinance, ...financeRecords]
          }
          
          await mutateFinance(updatedFinance, { revalidate: false })
          
          await Promise.all([
            mutate('/api/finance', updatedFinance, { revalidate: false }),
            mutate('/api/finance?', updatedFinance, { revalidate: false }),
            mutate(apiUrl, updatedFinance, { revalidate: false }),
          ])
        }}
      />
    </div>
  )
}





