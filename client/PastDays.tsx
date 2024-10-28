import { useState, useEffect } from 'react'
import { trpc } from './trpc'
import { Plan } from 'tt-services'

export function AllDays() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAllPlans = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const fetchedPlans = await trpc.getAllDays.query()
        setPlans(fetchedPlans.map(plan => ({
          ...plan,
          day: new Date(plan.day).toLocaleDateString()
        })))
      } catch (error) {
        console.error('Error fetching all plans:', error)
        setError('Failed to fetch plans. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAllPlans()
  }, [])

  return (
    <div>
      <h1>All Days</h1>
      {error && <div className="error-message">{error}</div>}
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {plans.map(plan => (
            <li key={plan.id}>
              <h3>{plan.day}</h3>
              <p>{plan.text}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}