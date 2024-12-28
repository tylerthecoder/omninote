import { useState } from 'react'
import { trpc } from '../trpc'
import { Todo } from 'tt-services'
import { AppPage } from '../layout/AppPage'
import { TodoItemList } from '../components/TodoItemList'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { IoMdAdd } from 'react-icons/io'

export function TodoList() {
  const [newTodoText, setNewTodoText] = useState('')
  const queryClient = useQueryClient()

  const { data: todos, isLoading, error } = useQuery({
    queryKey: ['todos'],
    queryFn: () => trpc.getAllTodos.query(),
  })

  const createTodoMutation = useMutation({
    mutationFn: (text: string) => trpc.createTodo.mutate({ text, completed: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      setNewTodoText('')
    },
  })

  const toggleTodoMutation = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      trpc.updateTodo.mutate({ id, completed }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })

  const deleteTodoMutation = useMutation({
    mutationFn: (id: string) => {
      if (!window.confirm('Are you sure you want to delete this todo?')) {
        throw new Error('Delete cancelled')
      }
      return trpc.deleteTodo.mutate({ id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault()
    if (newTodoText.trim()) {
      createTodoMutation.mutate(newTodoText.trim())
    }
  }

  const activeTodos = todos?.filter(todo => !todo.completed) || []
  const completedTodos = todos?.filter(todo => todo.completed) || []

  const content = (
    <div className="space-y-6">
      <form onSubmit={handleAddTodo} className="flex gap-2">
        <input
          type="text"
          value={newTodoText}
          onChange={(e) => setNewTodoText(e.target.value)}
          placeholder="Add a new todo"
          className="flex-1"
        />
        <button
          type="submit"
          disabled={!newTodoText.trim() || createTodoMutation.isPending}
          className="btn btn-primary flex items-center gap-2"
        >
          <IoMdAdd className="w-5 h-5" />
          Add Todo
        </button>
      </form>

      {(error || createTodoMutation.error || toggleTodoMutation.error || deleteTodoMutation.error) && (
        <div className="error-message">
          {error?.message ||
            createTodoMutation.error?.message ||
            toggleTodoMutation.error?.message ||
            deleteTodoMutation.error?.message}
        </div>
      )}

      {isLoading ? (
        <div className="loading-message">Loading...</div>
      ) : (
        <div className="space-y-8">
          <TodoItemList
            title="Active Todos"
            items={activeTodos}
            onToggle={(id, completed) => toggleTodoMutation.mutate({ id, completed: !completed })}
            onDelete={(id) => deleteTodoMutation.mutate(id)}
          />

          <TodoItemList
            title="Completed Todos"
            items={completedTodos}
            onToggle={(id, completed) => toggleTodoMutation.mutate({ id, completed: !completed })}
            onDelete={(id) => deleteTodoMutation.mutate(id)}
          />
        </div>
      )}
    </div>
  )

  return (
    <AppPage
      title="Todo List"
      content={content}
    />
  )
}