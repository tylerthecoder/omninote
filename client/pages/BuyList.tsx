import { useState } from 'react'
import { trpc } from '../trpc'
import { BuyListItem } from 'tt-services'
import { AppPage } from '../layout/AppPage'
import { BuyListItemView } from '../components/BuyListItemView'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { IoMdAdd } from 'react-icons/io'

export function BuyList() {
  const [newItemText, setNewItemText] = useState('')
  const queryClient = useQueryClient()

  const { data: items, isLoading, error } = useQuery({
    queryKey: ['buyList'],
    queryFn: () => trpc.getAllBuyListItems.query(),
  })

  const createItemMutation = useMutation({
    mutationFn: (text: string) => trpc.createBuyListItem.mutate({ text, completed: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyList'] })
      setNewItemText('')
    },
  })

  const updateItemMutation = useMutation({
    mutationFn: (item: BuyListItem) => trpc.updateBuyListItem.mutate(item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyList'] })
    },
  })

  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => {
      if (!window.confirm('Are you sure you want to delete this item?')) {
        throw new Error('Delete cancelled')
      }
      return trpc.deleteBuyListItem.mutate({ id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyList'] })
    },
  })

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (newItemText.trim()) {
      createItemMutation.mutate(newItemText.trim())
    }
  }

  const activeItems = items?.filter(item => !item.completed) || []
  const completedItems = items?.filter(item => item.completed) || []

  const content = (
    <div className="space-y-6">
      <form onSubmit={handleAddItem} className="flex gap-2">
        <input
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          placeholder="Add new item"
          className="flex-1"
        />
        <button
          type="submit"
          disabled={!newItemText.trim() || createItemMutation.isPending}
          className="btn btn-primary flex items-center gap-2"
        >
          <IoMdAdd className="w-5 h-5" />
          Add Item
        </button>
      </form>

      {(error || createItemMutation.error || updateItemMutation.error || deleteItemMutation.error) && (
        <div className="error-message">
          {error?.message ||
            createItemMutation.error?.message ||
            updateItemMutation.error?.message ||
            deleteItemMutation.error?.message}
        </div>
      )}

      {isLoading ? (
        <div className="loading-message">Loading...</div>
      ) : (
        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-medium text-gray-700 mb-2">Active Items</h2>
            <BuyListItemView
              items={activeItems}
              onToggle={(id, completed) => updateItemMutation.mutate({ id, completed: !completed } as BuyListItem)}
              onDelete={(id) => deleteItemMutation.mutate(id)}
              onUpdate={(item) => updateItemMutation.mutate(item)}
            />
          </div>

          <div>
            <h2 className="text-lg font-medium text-gray-700 mb-2">Completed Items</h2>
            <BuyListItemView
              items={completedItems}
              onToggle={(id, completed) => updateItemMutation.mutate({ id, completed: !completed } as BuyListItem)}
              onDelete={(id) => deleteItemMutation.mutate(id)}
              onUpdate={(item) => updateItemMutation.mutate(item)}
            />
          </div>
        </div>
      )}
    </div>
  )

  return (
    <AppPage
      title="Buy List"
      content={content}
    />
  )
}