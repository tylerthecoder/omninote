import { useState } from 'react'
import { trpc } from '../trpc'
import { Plan } from 'tt-services'
import { AppPage } from '../layout/AppPage'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { IoMdCalendar, IoMdTime } from 'react-icons/io'
import { MemoizedEditor } from '../components/editor/editor'
import { Debouncer, DebouncerStatus } from '../utils'

const debouncer = new Debouncer(500)

function TodayTab() {
  const queryClient = useQueryClient()
  const [syncStatus, setSyncStatus] = useState<DebouncerStatus>('synced')

  const { data: plan, error, isLoading } = useQuery({
    queryKey: ['today'],
    queryFn: () => trpc.getToday.query(),
  })

  console.log('plan', plan, error, isLoading)

  const updateMutation = useMutation({
    mutationFn: (text: string) => {
      setSyncStatus('syncing')
      console.log('updateMutation', text)
      console.log('plan', plan)
      return new Promise<void>((resolve, reject) => {
        debouncer.debounce('updateToday', async () => {
          console.log('debounced', text)
          try {
            if (!plan?.id) {
              console.log('Creating today\'s plan')
              await trpc.createToday.mutate({ text })
            } else {
              console.log('Updating today\'s plan')
              await trpc.updatePlan.mutate({ id: plan?.id, text })
            }
            setSyncStatus('synced')
            resolve()
          } catch (error) {
            setSyncStatus('error')
            reject(error)
          }
        })
      })
    },
    onMutate: async (text) => {
      await queryClient.cancelQueries({ queryKey: ['today'] })
      const previousPlan = queryClient.getQueryData<Plan>(['today'])
      queryClient.setQueryData<Plan>(['today'], old => {
        if (!old) return old
        return { ...old, text }
      })
      return { previousPlan }
    },
    onError: (err, text, context) => {
      console.log('onError', err, text, context)
      if (context?.previousPlan) {
        queryClient.setQueryData(['today'], context.previousPlan)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['today'] })
    }
  })

  if (error) return <div className="error-message">{error.message}</div>
  if (isLoading) return <div className="loading-message">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
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
            onTextChange={(text) => updateMutation.mutate(text)}
          />
        </div>
      </div>
    </div>
  )
}

function PastDaysTab() {
  const { data: plans, error, isLoading } = useQuery({
    queryKey: ['pastDays'],
    queryFn: async () => {
      const plans = await trpc.getAllDays.query()
      return plans.sort((a, b) => new Date(b.day).getTime() - new Date(a.day).getTime())
    },
  })

  if (error) return <div className="error-message">{error.message}</div>
  if (isLoading) return <div className="loading-message">Loading...</div>

  return (
    <div className="space-y-6">
      {plans?.map(plan => (
        <div key={plan.id} className="bg-white shadow rounded-lg">
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-gray-600">
              <IoMdCalendar className="w-5 h-5" />
              <span>{new Date(plan.day).toLocaleDateString()}</span>
            </div>
            <div className="prose max-w-none">
              {plan.text}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function Daily() {
  const [activeTab, setActiveTab] = useState<'today' | 'past'>('today')

  const tabs = [
    { id: 'today', label: 'Today' },
    { id: 'past', label: 'Past Days' },
  ]

  const content = (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'today' | 'past')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'today' ? <TodayTab /> : <PastDaysTab />}
    </div>
  )

  return (
    <AppPage
      title="Daily Plans"
      content={content}
    />
  )
}