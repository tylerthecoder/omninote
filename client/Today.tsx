import { useState, useEffect } from 'react'
import { trpc } from './trpc'
import { Editor } from './editor/editor'
import { Debouncer, DebouncerStatus } from './utils'
import { Plan } from 'tt-services'

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

  if (isLoading) return <p>Loading...</p>
  if (error) return <div className="error-message">{error}</div>

  return (
    <div>
      <h1>Today's Plan</h1>
      {plan ? (
        <>
          <Editor text={plan.text} onTextChange={handlePlanChange} />
          <p>Status: {syncStatus}</p>
        </>
      ) : (
        <button onClick={handleCreatePlan}>Create Today's Plan</button>
      )}
    </div>
  )
}