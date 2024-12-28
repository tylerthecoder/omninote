import { useState } from 'react'
import { IoMdAdd, IoMdClose, IoMdPricetag } from 'react-icons/io'

interface TagViewProps {
  tags: string[]
  onNewTag?: (tag: string) => void
  onRemoveTag?: (tag: string) => void
}

export function TagView({ tags, onNewTag, onRemoveTag }: TagViewProps) {
  const [newTag, setNewTag] = useState('')

  const handleAddTag = () => {
    if (newTag.trim() && onNewTag) {
      onNewTag(newTag.trim())
      setNewTag('')
    }
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {tags.map(tag => (
        <div
          key={tag}
          className="inline-flex items-center gap-1 bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded-full text-sm text-gray-700 transition-colors"
        >
          <IoMdPricetag className="w-3 h-3" />
          {tag}
          {onRemoveTag && (
            <button
              onClick={() => onRemoveTag(tag)}
              className="hover:text-red-500 transition-colors"
              aria-label={`Remove tag ${tag}`}
            >
              <IoMdClose className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
      {onNewTag && (
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
            placeholder="Add tag..."
            className="w-24 px-2 py-0.5 text-sm border rounded-full focus:outline-none focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400 transition-colors"
          />
          <button
            onClick={handleAddTag}
            disabled={!newTag.trim()}
            className="hover:text-green-500 transition-colors"
            aria-label="Add tag"
          >
            <IoMdAdd className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}