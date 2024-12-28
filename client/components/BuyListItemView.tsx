import { useState } from 'react'
import { BuyListItem } from 'tt-services'
import { IoMdCheckmark, IoMdTrash, IoMdCreate, IoMdClose, IoMdLink } from 'react-icons/io'

interface BuyListItemViewProps {
  items: BuyListItem[]
  onToggle: (id: string, completed: boolean) => void
  onDelete: (id: string) => void
  onUpdate: (item: BuyListItem) => void
  className?: string
}

export function BuyListItemView({ items, onToggle, onDelete, onUpdate, className = '' }: BuyListItemViewProps) {
  const [editingItem, setEditingItem] = useState<BuyListItem | null>(null)

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingItem) {
      onUpdate(editingItem)
      setEditingItem(null)
    }
  }

  return (
    <div className={`divide-y divide-gray-200 bg-white shadow ${className}`}>
      {items.map(item => (
        <div key={item.id} className="group">
          {editingItem?.id === item.id ? (
            <form onSubmit={handleUpdateSubmit} className="p-4 space-y-3">
              <input
                type="text"
                value={editingItem.text}
                onChange={(e) => setEditingItem({ ...editingItem, text: e.target.value })}
                className="w-full"
                placeholder="Item name"
              />
              <input
                type="url"
                value={editingItem.url || ''}
                onChange={(e) => setEditingItem({ ...editingItem, url: e.target.value })}
                className="w-full"
                placeholder="URL (optional)"
              />
              <textarea
                value={editingItem.notes || ''}
                onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                className="w-full"
                placeholder="Notes (optional)"
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <button type="submit" className="btn btn-primary btn-sm">
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="btn btn-danger btn-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-start justify-between p-4">
              <div className="flex items-start gap-3 flex-1">
                <button
                  onClick={() => onToggle(item.id, item.completed)}
                  className={`mt-1 w-5 h-5 rounded border ${
                    item.completed
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-gray-300 hover:border-green-500'
                  } flex items-center justify-center transition-colors`}
                  aria-label={item.completed ? 'Mark as incomplete' : 'Mark as complete'}
                >
                  {item.completed && <IoMdCheckmark className="w-4 h-4" />}
                </button>
                <div className="space-y-1 flex-1">
                  <span className={item.completed ? 'text-gray-500 line-through' : 'text-gray-900'}>
                    {item.text}
                  </span>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600"
                    >
                      <IoMdLink className="w-4 h-4" />
                      View Link
                    </a>
                  )}
                  {item.notes && (
                    <p className="text-sm text-gray-500">
                      {item.notes}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditingItem(item)}
                  className="text-gray-400 hover:text-blue-500 transition-colors"
                  aria-label="Edit item"
                >
                  <IoMdCreate className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="Delete item"
                >
                  <IoMdTrash className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
      {items.length === 0 && (
        <div className="p-4 text-center text-gray-500 text-sm">
          No items
        </div>
      )}
    </div>
  )
}