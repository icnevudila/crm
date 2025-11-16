'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Target, Edit2, Check, X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface GoalData {
  monthlyGoal: number
  currentProgress: number
  percentage: number
}

async function fetchGoal(): Promise<GoalData> {
  const res = await fetch('/api/automations/goal-tracker', {
    cache: 'no-store',
    credentials: 'include',
  })
  if (!res.ok) {
    return {
      monthlyGoal: 0,
      currentProgress: 0,
      percentage: 0,
    }
  }
  return res.json()
}

async function updateGoal(goal: number): Promise<{ monthlyGoal: number }> {
  const res = await fetch('/api/automations/goal-tracker', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ monthlyGoal: goal }),
    credentials: 'include',
  })
  if (!res.ok) {
    throw new Error('Failed to update goal')
  }
  return res.json()
}

/**
 * AutoGoalTracker - Hedef takibi
 * Kullanıcı kendi aylık hedefini girer (ör. "50.000₺ satış")
 * Sistem her fatura kesildiğinde kalan hedefi gösterir
 * "Bu ay hedefin %72'sine ulaştın 💪"
 */
export default function AutoGoalTracker() {
  const [isEditing, setIsEditing] = useState(false)
  const [goalInput, setGoalInput] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['goal-tracker'],
    queryFn: fetchGoal,
    staleTime: 60 * 1000, // 1 dakika cache
    refetchOnWindowFocus: false,
  })

  const mutation = useMutation({
    mutationFn: updateGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal-tracker'] })
      setIsEditing(false)
    },
  })

  useEffect(() => {
    if (data?.monthlyGoal) {
      setGoalInput(data.monthlyGoal.toString())
    }
  }, [data])

  const handleSave = () => {
    const goal = parseFloat(goalInput)
    if (goal > 0) {
      mutation.mutate(goal)
    }
  }

  const handleCancel = () => {
    setGoalInput(data?.monthlyGoal?.toString() || '')
    setIsEditing(false)
  }

  if (isLoading || !data) {
    return null
  }

  // Hedef yoksa ve düzenleme modunda değilse göster
  if (!data.monthlyGoal && !isEditing) {
    return (
      <Card className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-indigo-600" />
            <span className="font-medium text-indigo-900">Aylık Hedef Belirle</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Hedef Belirle
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-indigo-600" />
            <span className="font-medium text-indigo-900">Aylık Hedef</span>
          </div>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder="Hedef tutar (₺)"
              className="flex-1"
            />
            <Button
              size="sm"
              onClick={handleSave}
              disabled={mutation.isPending}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  İlerleme: {formatCurrency(data.currentProgress)}
                </span>
                <span className="font-semibold text-indigo-600">
                  {data.percentage.toFixed(0)}%
                </span>
              </div>
              <Progress value={data.percentage} className="h-2" />
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Hedef: {formatCurrency(data.monthlyGoal)}</span>
                <span>
                  Kalan: {formatCurrency(Math.max(0, data.monthlyGoal - data.currentProgress))}
                </span>
              </div>
            </div>
            {data.percentage >= 100 && (
              <div className="text-center text-sm font-semibold text-green-600">
                🎉 Tebrikler! Hedefini aştın!
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  )
}













