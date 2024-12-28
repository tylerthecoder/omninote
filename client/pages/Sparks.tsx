import { useState } from 'react'
import { trpc } from '../trpc'
import { Spark } from 'tt-services'
import { AppPage } from '../layout/AppPage'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { IoMdAdd, IoMdCreate, IoMdCheckmark, IoMdClose } from 'react-icons/io'
import { MemoizedEditor } from '../components/editor/editor'
import { Debouncer, DebouncerStatus } from '../utils'

const debouncer = new Debouncer(500)

export function SparksList() {
  const [newSparkName, setNewSparkName] = useState('')
  const [editingSpark, setEditingSpark] = useState<Spark | null>(null)
  const [syncStatus, setSyncStatus] = useState<DebouncerStatus>('synced')
  const queryClient = useQueryClient()

  const { data: sparks, isLoading, error } = useQuery({
    queryKey: ['sparks'],
    queryFn: () => trpc.getAllSparks.query(),
  })

  const createSparkMutation = useMutation({
    mutationFn: (name: string) => trpc.createSpark.mutate({ name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sparks'] })
      setNewSparkName('')
    },
  })

  const updateSparkMutation = useMutation({
    mutationFn: (updates: Partial<Spark> & { id: string }) => {
      setSyncStatus('syncing')
      return new Promise((resolve, reject) => {
        debouncer.debounce('updateSpark', async () => {
          try {
            const result = await trpc.updateSpark.mutate(updates)
            setSyncStatus('synced')
            resolve(result)
          } catch (error) {
            setSyncStatus('error')
            reject(error)
          }
        })
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sparks'] })
    },
  })

  const handleAddSpark = (e: React.FormEvent) => {
    e.preventDefault()
    if (newSparkName.trim()) {
      createSparkMutation.mutate(newSparkName.trim())
    }
  }

  const handleToggleSpark = (spark: Spark) => {
    updateSparkMutation.mutate({
      id: spark.id,
      completed: !spark.completed,
    })
  }

  const activeSparks = sparks?.filter(spark => !spark.completed) || []
  const completedSparks = sparks?.filter(spark => spark.completed) || []

  const content = (
    <div className="space-y-6">
      <form onSubmit={handleAddSpark} className="flex gap-2">
        <input
          type="text"
          value={newSparkName}
          onChange={(e) => setNewSparkName(e.target.value)}
          placeholder="Add a new spark"
          className="flex-1"
        />
        <button
          type="submit"
          disabled={!newSparkName.trim() || createSparkMutation.isPending}
          className="btn btn-primary flex items-center gap-2"
        >
          <IoMdAdd className="w-5 h-5" />
          Add Spark
        </button>
      </form>

      {(error || createSparkMutation.error || updateSparkMutation.error) && (
        <div className="error-message">
          {error?.message ||
            createSparkMutation.error?.message ||
            updateSparkMutation.error?.message}
        </div>
      )}

      {isLoading ? (
        <div className="loading-message">Loading...</div>
      ) : (
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-700">Active Sparks</h2>
            <div className="space-y-4">
              {activeSparks.map(spark => (
                <div key={spark.id} className="bg-white shadow rounded-lg">
                  {editingSpark?.id === spark.id ? (
                    <div className="p-6 space-y-4">
                      <input
                        type="text"
                        value={editingSpark.name}
                        onChange={(e) => setEditingSpark({ ...editingSpark, name: e.target.value })}
                        className="w-full text-lg font-medium"
                      />
                      <MemoizedEditor
                        initialText={editingSpark.notes || ''}
                        onTextChange={(text) => setEditingSpark({ ...editingSpark, notes: text })}
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            updateSparkMutation.mutate({
                              id: editingSpark.id,
                              name: editingSpark.name,
                              notes: editingSpark.notes,
                            })
                            setEditingSpark(null)
                          }}
                          className="btn btn-primary btn-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingSpark(null)}
                          className="btn btn-danger btn-sm"
                        >
                          Cancel
                        </button>
                      </div>
                      <p className="text-sm text-gray-500 italic">Status: {syncStatus}</p>
                    </div>
                  ) : (
                    <div className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleToggleSpark(spark)}
                            className={`w-5 h-5 rounded border ${
                              spark.completed
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'border-gray-300 hover:border-green-500'
                            } flex items-center justify-center transition-colors`}
                          >
                            {spark.completed && <IoMdCheckmark className="w-4 h-4" />}
                          </button>
                          <h3 className="text-lg font-medium">{spark.name}</h3>
                        </div>
                        <button
                          onClick={() => setEditingSpark(spark)}
                          className="text-gray-400 hover:text-blue-500 transition-colors"
                        >
                          <IoMdCreate className="w-5 h-5" />
                        </button>
                      </div>
                      {spark.notes && (
                        <div className="prose max-w-none pl-8">
                          {spark.notes}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {completedSparks.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-700">Completed Sparks</h2>
              <div className="space-y-4">
                {completedSparks.map(spark => (
                  <div key={spark.id} className="bg-white shadow rounded-lg">
                    <div className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleToggleSpark(spark)}
                            className={`w-5 h-5 rounded border ${
                              spark.completed
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'border-gray-300 hover:border-green-500'
                            } flex items-center justify-center transition-colors`}
                          >
                            {spark.completed && <IoMdCheckmark className="w-4 h-4" />}
                          </button>
                          <h3 className="text-lg font-medium line-through text-gray-500">{spark.name}</h3>
                        </div>
                        <button
                          onClick={() => setEditingSpark(spark)}
                          className="text-gray-400 hover:text-blue-500 transition-colors"
                        >
                          <IoMdCreate className="w-5 h-5" />
                        </button>
                      </div>
                      {spark.notes && (
                        <div className="prose max-w-none pl-8 text-gray-500">
                          {spark.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <AppPage
      title="Sparks"
      content={content}
    />
  )
}