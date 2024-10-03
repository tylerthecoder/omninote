import { useState, useEffect } from 'react'
import { trpc } from './trpc'
import './App.css'
import { PlanEditor } from './plan-editor'

function App() {
  const [todaysPlan, setTodaysPlan] = useState<{ id: string, text: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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

  return (
    <>
      <div className="sidebar">
        <ul>
          <li><a href="#">Today</a></li>
          <li><a href="#">Past Days</a></li>
          <li><a href="#">All Todos</a></li>
        </ul>
      </div>
      <div className="main-content">
        <h1>Today's Plan</h1>
        {error && <div className="error-message">{error}</div>}
        {isLoading ? (
          <p>Loading...</p>
        ) : todaysPlan ? (
          <PlanEditor initialPlan={todaysPlan.text} planId={todaysPlan.id} />
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

export default App
