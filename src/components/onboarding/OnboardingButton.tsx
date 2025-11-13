'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'
import { OnboardingModal } from './OnboardingModal'
import { cn } from '@/lib/utils'

interface OnboardingButtonProps {
  className?: string
}

export function OnboardingButton({ className }: OnboardingButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        size="sm"
        className={cn(
          'w-full justify-start gap-2 text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 border-gray-200 hover:border-indigo-300 transition-all',
          className
        )}
      >
        <Sparkles className="h-4 w-4 text-indigo-600" />
        Sistem Rehberi
      </Button>
      <OnboardingModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}









