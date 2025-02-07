import { useState } from 'react'
import { useNavigate, useParams, Routes, Route, Link, useLocation } from 'react-router-dom'
import { Plan } from 'tt-services'
import { AppPage } from '../layout/AppPage'
import { IoMdCalendar, IoMdTime, IoMdPlay, IoMdSquare } from 'react-icons/io'
import { MemoizedEditor } from '../components/editor/editor'
import { DebouncerStatus } from '../utils'
import MarkdownViewer from '../components/MarkdownViewer'
import { useToday, useDayPlan, useDaysWithNotes, useTimeBlocksForDay, useUpdatePlan, useCreatePlan, useStartTimeBlock, useEndTimeBlock } from '../queries'

function TimeTracker({ date }: { date: string }) {
  const [label, setLabel] = useState('')
  const { data: timeBlocks, isLoading } = useTimeBlocksForDay(date)
  const startMutation = useStartTimeBlock()
  const endMutation = useEndTimeBlock()

  const currentBlock = timeBlocks?.find(block => !block.endTime)

  const formatDuration = (start: string, end?: string) => {
    const startDate = new Date(start)
    const endDate = end ? new Date(end) : new Date()
    const diffMs = endDate.getTime() - startDate.getTime()
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {currentBlock ? (
          <>
            <div className="flex-1">
              <div className="text-lg font-medium">{currentBlock.label}</div>
              <div className="text-sm text-gray-500">
                Started at {formatTime(currentBlock.startTime)}
                {' • '}
                {formatDuration(currentBlock.startTime)}
              </div>
            </div>
            <button
              onClick={() => endMutation.mutate()}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <IoMdSquare className="w-5 h-5" />
              Stop
            </button>
          </>
        ) : (
          <div className="flex-1 flex items-center gap-2">
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="What are you working on?"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
            />
            <button
              onClick={() => {
                if (label) {
                  startMutation.mutate(label)
                  setLabel('')
                }
              }}
              disabled={!label}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <IoMdPlay className="w-5 h-5" />
              Start
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {timeBlocks?.filter(block => block.endTime).map(block => (
          <div key={block.id} className="bg-white shadow rounded-lg p-4">
            <div className="font-medium">{block.label}</div>
            <div className="text-sm text-gray-500">
              {formatTime(block.startTime)} - {formatTime(block.endTime!)}
              {' • '}
              {formatDuration(block.startTime, block.endTime)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Calendar() {
  const navigate = useNavigate()
  const { data: daysWithNotes } = useDaysWithNotes()
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()
  const weeks = Math.ceil((daysInMonth + firstDayOfMonth) / 7)

  const hasNote = (day: number) => {
    const date = new Date(currentYear, currentMonth, day).toISOString().split('T')[0]
    return daysWithNotes?.some(d => d.day.startsWith(date))
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => {
            if (currentMonth === 0) {
              setCurrentMonth(11)
              setCurrentYear(currentYear - 1)
            } else {
              setCurrentMonth(currentMonth - 1)
            }
          }}
          className="text-gray-600 hover:text-gray-800"
        >
          ←
        </button>
        <h2 className="text-lg font-medium">
          {new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <button
          onClick={() => {
            if (currentMonth === 11) {
              setCurrentMonth(0)
              setCurrentYear(currentYear + 1)
            } else {
              setCurrentMonth(currentMonth + 1)
            }
          }}
          className="text-gray-600 hover:text-gray-800"
        >
          →
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
            {day}
          </div>
        ))}
        {Array.from({ length: weeks * 7 }).map((_, i) => {
          const day = i - firstDayOfMonth + 1
          const isValid = day > 0 && day <= daysInMonth
          const date = new Date(currentYear, currentMonth, day)
          const isToday = isValid && date.toDateString() === today.toDateString()
          const hasNotes = isValid && hasNote(day)

          return (
            <button
              key={i}
              onClick={() => {
                if (isValid) {
                  navigate(`/daily/day/${date.toISOString().split('T')[0]}`)
                }
              }}
              disabled={!isValid}
              className={`
                aspect-square flex items-center justify-center relative
                ${isValid ? 'hover:bg-gray-100' : 'text-gray-300'}
                ${isToday ? 'bg-yellow-50' : ''}
                rounded-lg
              `}
            >
              {isValid && (
                <>
                  <span className={isToday ? 'font-bold' : ''}>{day}</span>
                  {hasNotes && (
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                      <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
                    </div>
                  )}
                </>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function DayView() {
  const { date } = useParams<{ date: string }>()
  const { data: plan, isLoading } = useDayPlan(date!)
  const { mutation: updateMutation, status: syncStatus } = useUpdatePlan()
  const { mutation: createMutation } = useCreatePlan()

  if (isLoading) return <div>Loading...</div>

  const handleTextChange = async (text: string) => {
    if (!plan?.id) {
      createMutation.mutate({ text, day: date! })
    } else {
      updateMutation.mutate({ id: plan.id, text })
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-600">
              <IoMdCalendar className="w-5 h-5" />
              <span>{new Date(date!).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <IoMdTime className="w-5 h-5" />
              <span className="text-sm italic">Status: {syncStatus}</span>
            </div>
          </div>
          {plan?.text ? (
            <MarkdownViewer markdown={plan.text} />
          ) : (
            <MemoizedEditor
              initialText=""
              onTextChange={handleTextChange}
            />
          )}
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Time Tracker</h2>
        <TimeTracker date={date!} />
      </div>
    </div>
  )
}

function DayEditor() {
  const { data: plan, error, isLoading } = useToday()
  const { mutation: updateMutation, status: syncStatus } = useUpdatePlan()
  const { mutation: createMutation } = useCreatePlan()
  const today = new Date().toISOString()

  if (error) return <div className="error-message">{error.message}</div>
  if (isLoading) return <div className="loading-message">Loading...</div>

  const handleTextChange = async (text: string) => {
    if (!plan?.id) {
      createMutation.mutate({ text: "", day: today })
    } else {
      updateMutation.mutate({ id: plan.id, text })
    }
  }

  return <div className="bg-white shadow rounded-lg">
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-600">
          <IoMdCalendar className="w-5 h-5" />
          <span>{new Date().toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <IoMdTime className="w-5 h-5" />
          <span className="text-sm italic">Status: {syncStatus}</span>
        </div>
      </div>
      <MemoizedEditor
        initialText={plan?.text || ''}
        onTextChange={handleTextChange}
      />
    </div>
  </div>
}

function TodayView() {
  const today = new Date().toISOString()
  return (
    <div className="space-y-6">
      <DayEditor />
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Time Tracker</h2>
        <TimeTracker date={today} />
      </div>
    </div>
  )
}

export function DailyRouter() {
  const tabs = [
    { id: '', label: 'Today' },
    { id: 'calendar', label: 'Calendar' },
  ]
  const location = useLocation()

  const content = (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              to={`/daily${tab.id ? `/${tab.id}` : ''}`}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${location.pathname === `/daily${tab.id ? `/${tab.id}` : ''}`
                ? 'border-yellow-500 text-yellow-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      <Routes>
        <Route path="/" element={<TodayView />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/day/:date" element={<DayView />} />
      </Routes>
    </div>
  )

  return (
    <AppPage
      title="Daily Plans"
      content={content}
    />
  )
}