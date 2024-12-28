import { useState, useEffect } from 'react'
import { trpc } from '../trpc'
import { Editor } from '../editor/editor'
import { Debouncer, DebouncerStatus } from '../utils'
import { Plan } from 'tt-services'
import { AppPage } from '../layout/AppPage'

const debouncer = new Debouncer(500)

export function Today() {
  const [plan, setPlan] = useState<Plan | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState<DebouncerStatus>('synced')

  useEffect(() => {
    debouncer.addStatusChangeListener((status) => {
      setSyncStatus(status);
    });

    const fetchPlan = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const fetchedPlan = await trpc.getToday.query()
        setPlan(fetchedPlan)
      } catch (error) {
        console.error('Error fetching today\'s plan:', error)
        setError('Failed to fetch today\'s plan. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlan()

    return () => {
      debouncer.clear()
    }
  }, [])

  const handlePlanChange = (newText: string) => {
    if (!plan) return

    setPlan(prev => prev ? { ...prev, text: newText } : null)
    debouncer.debounce('updatePlan', async () => {
      try {
        await trpc.updatePlan.mutate({ id: plan.id, text: newText })
      } catch (error) {
        console.error('Error updating plan:', error)
        setError('Failed to update plan. Please try again later.')
      }
    })
  }

  const handleCreatePlan = async () => {
    setError(null)
    try {
      const newPlan = await trpc.createToday.mutate({ text: 'Start planning your day...' })
      setPlan(newPlan)
    } catch (error) {
      console.error('Error creating plan:', error)
      setError('Failed to create plan. Please try again later.')
    }
  }

  const content = (
    <>
      {isLoading ? (
        <div className="text-gray-600 text-center py-4">Loading...</div>
      ) : error ? (
        <div className="text-red-600 bg-red-50 border border-red-600 rounded p-2 mb-4">{error}</div>
      ) : plan ? (
        <div className="space-y-4">
          <Editor text={plan.text} onTextChange={handlePlanChange} />
          <p className="text-gray-600 italic mt-4">Status: {syncStatus}</p>
        </div>
      ) : (
        <button
          onClick={handleCreatePlan}
          className="px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600 transition-colors duration-200 text-lg"
        >
          Create Today's Plan
        </button>
      )}
    </>
  )

  return (
    <AppPage
      title="Today's Plan"
      content={content}
    />
  )
}