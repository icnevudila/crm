'use client'

import { useState, useMemo } from 'react'
import { Calendar, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Meeting {
  id: string
  title: string
  meetingDate: string
  status: string
  Customer?: {
    id: string
    name: string
  }
  Deal?: {
    id: string
    title: string
  }
}

interface MeetingCalendarProps {
  meetings: Meeting[]
  onDateClick?: (date: Date) => void
  onMeetingClick?: (meeting: Meeting) => void
  onCreateMeeting?: (date: Date) => void
}

export default function MeetingCalendar({
  meetings,
  onDateClick,
  onMeetingClick,
  onCreateMeeting,
}: MeetingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Ayın ilk günü
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)

  // Takvim başlangıcı (ayın ilk günü haftanın hangi günü)
  const startDay = firstDayOfMonth.getDay()
  const daysInMonth = lastDayOfMonth.getDate()

  // Takvim günlerini oluştur
  const days = useMemo(() => {
    const calendarDays: Array<{ date: Date; isCurrentMonth: boolean; meetings: Meeting[] }> = []

    // Önceki ayın son günleri
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i)
      calendarDays.push({
        date,
        isCurrentMonth: false,
        meetings: [],
      })
    }

    // Bu ayın günleri
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayMeetings = meetings.filter((meeting) => {
        const meetingDate = new Date(meeting.meetingDate)
        const meetingDateStr = meetingDate.toISOString().split('T')[0]
        return meetingDateStr === dateStr
      })

      calendarDays.push({
        date,
        isCurrentMonth: true,
        meetings: dayMeetings,
      })
    }

    // Sonraki ayın ilk günleri (takvimi tamamlamak için)
    const remainingDays = 42 - calendarDays.length // 6 hafta x 7 gün = 42
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day)
      calendarDays.push({
        date,
        isCurrentMonth: false,
        meetings: [],
      })
    }

    return calendarDays
  }, [year, month, daysInMonth, startDay, meetings])

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const statusColors: Record<string, string> = {
    PLANNED: 'bg-blue-100 text-blue-800 border-blue-200',
    DONE: 'bg-green-100 text-green-800 border-green-200',
    CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  }

  const weekDays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">
            {new Date(year, month, 1).toLocaleDateString('tr-TR', {
              month: 'long',
              year: 'numeric',
            })}
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPreviousMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={goToToday}
              className="ml-2"
            >
              Bugün
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Week day headers */}
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-gray-600 py-2"
          >
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {days.map((day, index) => {
          const isToday =
            day.date.toDateString() === new Date().toDateString()
          const hasMeetings = day.meetings.length > 0

          return (
            <div
              key={index}
              className={cn(
                'min-h-[100px] border rounded-lg p-2 cursor-pointer transition-colors',
                !day.isCurrentMonth && 'bg-gray-50 opacity-50',
                day.isCurrentMonth && 'hover:bg-gray-50',
                isToday && 'ring-2 ring-indigo-500',
                hasMeetings && 'bg-indigo-50'
              )}
              onClick={() => {
                if (onDateClick && day.isCurrentMonth) {
                  onDateClick(day.date)
                }
              }}
            >
              {/* Day number */}
              <div
                className={cn(
                  'text-sm font-medium mb-1',
                  isToday && 'text-indigo-600 font-bold',
                  !day.isCurrentMonth && 'text-gray-400'
                )}
              >
                {day.date.getDate()}
              </div>

              {/* Meetings */}
              <div className="space-y-1">
                {day.meetings.slice(0, 2).map((meeting) => (
                  <div
                    key={meeting.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (onMeetingClick) {
                        onMeetingClick(meeting)
                      }
                    }}
                    className={cn(
                      'text-xs p-1 rounded truncate cursor-pointer hover:opacity-80',
                      statusColors[meeting.status] || 'bg-gray-100 text-gray-800'
                    )}
                    title={meeting.title}
                  >
                    {meeting.title}
                  </div>
                ))}
                {day.meetings.length > 2 && (
                  <div className="text-xs text-gray-500 font-medium">
                    +{day.meetings.length - 2} daha
                  </div>
                )}
              </div>

              {/* Create meeting button */}
              {day.isCurrentMonth && onCreateMeeting && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 mt-1 opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation()
                    onCreateMeeting(day.date)
                  }}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-100 border border-blue-200" />
          <span className="text-sm text-gray-600">Planlandı</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-100 border border-green-200" />
          <span className="text-sm text-gray-600">Tamamlandı</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-100 border border-red-200" />
          <span className="text-sm text-gray-600">İptal Edildi</span>
        </div>
      </div>
    </div>
  )
}
