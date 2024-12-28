import { useState } from 'react'
import { ReadingListItem } from 'tt-services'
import { IoMdCreate, IoMdTrash, IoMdLink, IoMdBook, IoMdPaper, IoMdDocument } from 'react-icons/io'

interface ReadingListItemViewProps {
  items: ReadingListItem[]
  onDelete: (id: string) => void
  onUpdate: (item: ReadingListItem) => void
  onOpenNotes: (item: ReadingListItem) => void
  className?: string
}

export function ReadingListItemView({
  items,
  onDelete,
  onUpdate,
  onOpenNotes,
  className = ''
}: ReadingListItemViewProps) {
  const [editingItem, setEditingItem] = useState<ReadingListItem | null>(null)

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingItem) {
      onUpdate(editingItem)
      setEditingItem(null)
    }
  }

  const TypeIcon = ({ type }: { type: 'article' | 'book' }) => {
    return type === 'book' ? (
      <IoMdBook className="w-4 h-4" title="Book" />
    ) : (
      <IoMdPaper className="w-4 h-4" title="Article" />
    )
  }

  return (
    <div className={`divide-y divide-gray-200 bg-white shadow ${className}`}>
      {items.map(item => (
        <div key={item.id} className="group">
          {editingItem?.id === item.id ? (
            <form onSubmit={handleUpdateSubmit} className="p-4 space-y-3">
              <input
                type="text"
                value={editingItem.name}
                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
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
              <select
                value={editingItem.type}
                onChange={(e) => setEditingItem({ ...editingItem, type: e.target.value as 'article' | 'book' })}
                className="w-full"
              >
                <option value="article">Article</option>
                <option value="book">Book</option>
              </select>
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
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <TypeIcon type={item.type} />
                  <span className="text-gray-900">{item.name}</span>
                </div>
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
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <IoMdDocument className="w-4 h-4" />
                    Has notes
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onOpenNotes(item)}
                  className="text-gray-400 hover:text-blue-500 transition-colors"
                  aria-label="Open notes"
                >
                  <IoMdDocument className="w-5 h-5" />
                </button>
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