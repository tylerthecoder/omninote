import { useState } from 'react'
import { useNavigate, useParams, Route, Routes } from 'react-router-dom'
import { trpc } from '../trpc'
import { ReadingListItem } from 'tt-services'
import { AppPage } from '../layout/AppPage'
import { ReadingListItemView } from '../components/ReadingListItemView'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { IoMdAdd, IoMdArrowBack } from 'react-icons/io'
import { MemoizedEditor } from '../components/editor/editor'
import { Debouncer, DebouncerStatus } from '../utils'

const debouncer = new Debouncer(500)

function ReadingListMain() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: items, isLoading, error } = useQuery({
    queryKey: ['readingList'],
    queryFn: () => trpc.getAllReadingListItems.query(),
  })

  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => {
      if (!window.confirm('Are you sure you want to delete this item?')) {
        throw new Error('Delete cancelled')
      }
      return trpc.deleteReadingListItem.mutate({ id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readingList'] })
    },
  })

  const content = (
    <div className="space-y-6">
      {(error || deleteItemMutation.error) && (
        <div className="error-message">
          {error?.message || deleteItemMutation.error?.message}
        </div>
      )}

      {isLoading ? (
        <div className="loading-message">Loading...</div>
      ) : (
        <ReadingListItemView
          items={items || []}
          onDelete={(id) => deleteItemMutation.mutate(id)}
          onUpdate={(item) => navigate(`/reading-list/edit/${item.id}`)}
          onOpenNotes={(item) => navigate(`/reading-list/notes/${item.id}`)}
        />
      )}
    </div>
  )

  return (
    <AppPage
      title="Reading List"
      content={content}
      actions={
        <button
          onClick={() => navigate('/reading-list/new')}
          className="btn btn-primary flex items-center gap-2"
        >
          <IoMdAdd className="w-5 h-5" />
          New Item
        </button>
      }
    />
  )
}

function NewReadingListItem() {
  const [newItem, setNewItem] = useState({
    name: '',
    url: '',
    type: 'article' as 'article' | 'book',
  })
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const createItemMutation = useMutation({
    mutationFn: (item: { name: string; url?: string; type: 'article' | 'book' }) =>
      trpc.createReadingListItem.mutate(item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readingList'] })
      navigate('/reading-list')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newItem.name.trim()) {
      createItemMutation.mutate({
        name: newItem.name.trim(),
        url: newItem.url.trim() || undefined,
        type: newItem.type,
      })
    }
  }

  const content = (
    <div className="space-y-6">
      <div className="bg-white shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              type="text"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              placeholder="Item name"
              className="w-full"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              URL (optional)
            </label>
            <input
              type="url"
              value={newItem.url}
              onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
              placeholder="https://..."
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Type
            </label>
            <select
              value={newItem.type}
              onChange={(e) => setNewItem({ ...newItem, type: e.target.value as 'article' | 'book' })}
              className="w-full"
            >
              <option value="article">Article</option>
              <option value="book">Book</option>
            </select>
          </div>

          {createItemMutation.error && (
            <div className="error-message">
              {createItemMutation.error.message}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => navigate('/reading-list')}
              className="btn btn-danger"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newItem.name.trim() || createItemMutation.isPending}
              className="btn btn-primary"
            >
              Create Item
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return (
    <AppPage
      title="New Reading List Item"
      content={content}
      showBack
      backTo="/reading-list"
    />
  )
}

function ReadingListNotes() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [syncStatus, setSyncStatus] = useState<DebouncerStatus>('synced')

  const { data: item, error, isLoading } = useQuery({
    queryKey: ['readingListItem', id],
    queryFn: () => trpc.getReadingListItem.query({ id: id! }),
    enabled: !!id,
  })

  const updateNotesMutation = useMutation({
    mutationFn: (notes: string) => {
      if (!id) throw new Error('Item ID is required')
      setSyncStatus('syncing')
      return new Promise<ReadingListItem>((resolve, reject) => {
        debouncer.debounce('updateNotes', async () => {
          try {
            const result = await trpc.updateReadingListItem.mutate({ id, notes })
            setSyncStatus('synced')
            resolve(result)
          } catch (error) {
            setSyncStatus('error')
            reject(error)
          }
        })
      })
    },
    onSuccess: (updatedItem) => {
      queryClient.setQueryData(['readingListItem', id], updatedItem)
    },
  })

  const content = item ? (
    <div className="space-y-6">
      <div className="bg-white shadow p-6">
        <MemoizedEditor
          initialText={item.notes || ''}
          onTextChange={(text) => updateNotesMutation.mutate(text)}
        />
      </div>
      <p className="text-sm text-gray-500 italic">
        Status: {syncStatus}
      </p>
    </div>
  ) : null

  if (error) return <AppPage title="Error" content={<div className="error-message">{error.message}</div>} />
  if (isLoading || !item) return <AppPage title="Loading..." content={<div className="loading-message">Loading...</div>} />

  return (
    <AppPage
      title={`Notes: ${item.name}`}
      content={content}
      showBack
      backTo="/reading-list"
    />
  )
}

export function ReadingListRouter() {
  return (
    <Routes>
      <Route index element={<ReadingListMain />} />
      <Route path="new" element={<NewReadingListItem />} />
      <Route path="notes/:id" element={<ReadingListNotes />} />
    </Routes>
  )
}