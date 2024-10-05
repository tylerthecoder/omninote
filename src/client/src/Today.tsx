import { useState, useEffect } from 'react'
import { trpc } from './trpc'
import { Editor } from './editor/editor'
import { Debouncer } from './utils'

type SyncStatus = 'not-synced' | 'synced' | 'syncing...' | 'error';

const prettySyncStatus = (status: SyncStatus) => {
  switch (status) {
    case 'not-synced':
      return 'Not synced';
    case 'synced':
      return 'Synced';
    case 'syncing...':
      return 'Syncing...';
    case 'error':
      return 'Error';
  }
}

export function Today() {
  const [todaysPlan, setTodaysPlan] = useState<{ id: string, text: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('not-synced')
  const debouncer = new Debouncer(500)

  useEffect(() => {
    debouncer.addStartListener(() => setSyncStatus('syncing...'))
    debouncer.addDoneListener(() => setSyncStatus('synced'))
    debouncer.addErrorListener(() => setSyncStatus('error'))

    return () => {
      debouncer.clear()
    }
  }, [])

  const fetchTodaysPlan = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const plan = await trpc.getToday.query()
      setTodaysPlan(plan)
    } catch (error) {
      console.error('Error fetching today\'s plan:', error)
      setError('Failed to fetch today\'s plan. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTodaysPlan()
  }, [])

  const handleCreatePlan = async () => {
    setError(null)
    try {
      const newPlan = await trpc.createToday.mutate({ text: "Default plan for today" })
      setTodaysPlan(newPlan)
    } catch (error) {
      console.error('Error creating today\'s plan:', error)
      setError('Failed to create today\'s plan. Please try again later.')
    }
  }

  const handleTextChange = (newText: string) => {
    if (!todaysPlan) return

    setTodaysPlan(prev => prev ? { ...prev, text: newText } : null)
    setSyncStatus('not-synced')
    debouncer.debounce(async () => {
      try {
        await trpc.updatePlan.mutate({ id: todaysPlan.id, text: newText })
      } catch (error) {
        console.error('Error updating plan:', error)
        setSyncStatus('error')
      }
    })
  }

  return (
    <>
      <h1>Today's Plan</h1>
      {error && <div className="error-message">{error}</div>}
      <div className="editor-wrapper">
        {isLoading ? (
          <p>Loading...</p>
        ) : todaysPlan ? (
          <>
            <Editor text={todaysPlan.text} onTextChange={handleTextChange} />
            <p>Status: {prettySyncStatus(syncStatus)}</p>
          </>
        ) : (
          <>
            <p>No plan for today yet.</p>
            <button onClick={handleCreatePlan}>Make Today's Note</button>
          </>
        )}
      </div>
    </>
  )
}