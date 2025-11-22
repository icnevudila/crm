'use client'

import { Check, Circle, Lock, AlertTriangle } from 'lucide-react'
import { Badge } from './badge'
import { Card } from './card'

interface Step {
  id: string
  label: string
  description: string
  status: 'completed' | 'current' | 'upcoming' | 'locked'
  requirements?: string[]
}

interface WorkflowStepperProps {
  steps: Step[]
  currentStep: number
  title?: string
  onStepClick?: (stepIndex: number) => void
}

export default function WorkflowStepper({
  steps,
  currentStep,
  title,
  onStepClick,
}: WorkflowStepperProps) {
  return (
    <Card className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-indigo-600">📋</span>
          {title}
        </h3>
      )}

      {/* Desktop: Horizontal Stepper */}
      <div className="hidden md:flex items-start justify-between gap-4">
        {steps.map((step, index) => {
          const isCompleted = step.status === 'completed'
          const isCurrent = step.status === 'current'
          const isLocked = step.status === 'locked'
          const isUpcoming = step.status === 'upcoming'
          const isClickable = !isLocked && onStepClick

          return (
            <div key={step.id} className="flex-1 relative">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={`absolute top-5 left-1/2 w-full h-0.5 -z-10 ${
                    isCompleted
                      ? 'bg-gradient-to-r from-green-500 to-green-400'
                      : 'bg-gray-300'
                  }`}
                  style={{ marginLeft: '1.5rem' }}
                />
              )}

              {/* Step Circle */}
              <div
                className={`flex flex-col items-center text-center ${
                  isClickable ? 'cursor-pointer' : ''
                }`}
                onClick={() => isClickable && onStepClick(index)}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all ${
                    isCompleted
                      ? 'bg-green-500 text-white shadow-lg'
                      : isCurrent
                      ? 'bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-300'
                      : isLocked
                      ? 'bg-gray-300 text-gray-500'
                      : 'bg-white text-gray-400 border-2 border-gray-300'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : isLocked ? (
                    <Lock className="w-4 h-4" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                </div>

                {/* Step Label */}
                <div
                  className={`text-sm font-medium mb-1 ${
                    isCurrent
                      ? 'text-indigo-700 font-bold'
                      : isCompleted
                      ? 'text-green-700'
                      : 'text-gray-600'
                  }`}
                >
                  {step.label}
                </div>

                {/* Step Description */}
                <div
                  className={`text-xs ${
                    isCurrent ? 'text-indigo-600' : 'text-gray-500'
                  }`}
                >
                  {step.description}
                </div>

                {/* Current Step Badge */}
                {isCurrent && (
                  <Badge className="mt-2 bg-indigo-100 text-indigo-800 border-0 text-xs">
                    Mevcut Aşama
                  </Badge>
                )}

                {/* Requirements Warning */}
                {isCurrent && step.requirements && step.requirements.length > 0 && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-left w-full">
                    <div className="flex items-center gap-1 text-yellow-800 font-medium mb-1">
                      <AlertTriangle className="w-3 h-3" />
                      Gereklilikler:
                    </div>
                    <ul className="text-yellow-700 space-y-1">
                      {step.requirements.map((req, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-yellow-600 mt-0.5">•</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Mobile: Vertical Stepper */}
      <div className="md:hidden space-y-4">
        {steps.map((step, index) => {
          const isCompleted = step.status === 'completed'
          const isCurrent = step.status === 'current'
          const isLocked = step.status === 'locked'

          return (
            <div key={step.id} className="flex gap-3">
              {/* Vertical Line & Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isCurrent
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-200'
                      : 'bg-gray-300 text-gray-500'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : isLocked ? (
                    <Lock className="w-3 h-3" />
                  ) : (
                    <Circle className="w-3 h-3" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-0.5 flex-1 min-h-8 ${
                      isCompleted ? 'bg-green-400' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div
                  className={`font-medium ${
                    isCurrent
                      ? 'text-indigo-700 text-base'
                      : isCompleted
                      ? 'text-green-700'
                      : 'text-gray-600'
                  }`}
                >
                  {step.label}
                </div>
                <div className="text-sm text-gray-600 mt-1">{step.description}</div>
                {isCurrent && (
                  <Badge className="mt-2 bg-indigo-100 text-indigo-800 border-0 text-xs">
                    Mevcut Aşama
                  </Badge>
                )}
                {isCurrent && step.requirements && step.requirements.length > 0 && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                    <div className="flex items-center gap-1 text-yellow-800 font-medium mb-1">
                      <AlertTriangle className="w-3 h-3" />
                      Gereklilikler:
                    </div>
                    <ul className="text-yellow-700 space-y-1">
                      {step.requirements.map((req, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span>•</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

