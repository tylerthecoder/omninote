import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { trpc } from '../trpc'
import { IoMdFolder, IoMdDocument, IoMdAdd, IoMdList, IoMdCalendar, IoMdCart, IoMdChatboxes, IoMdBook, IoMdCreate, IoMdBulb, IoMdFilm, IoMdHammer, IoMdLaptop } from 'react-icons/io'

interface ShortcutItem {
  name: string
  path: string
  icon: React.ReactNode
  type: 'page' | 'action' | 'note'
}

const SHORTCUT_ITEMS: ShortcutItem[] = [
  { name: 'Home', path: '/', icon: <IoMdFolder />, type: 'page' },
  { name: 'Today', path: '/today', icon: <IoMdCalendar />, type: 'page' },
  { name: 'Past Days', path: '/past-days', icon: <IoMdList />, type: 'page' },
  { name: 'All Todos', path: '/todos', icon: <IoMdList />, type: 'page' },
  { name: 'Buy List', path: '/buy-list', icon: <IoMdCart />, type: 'page' },
  { name: 'Talk Notes', path: '/talk-notes', icon: <IoMdChatboxes />, type: 'page' },
  { name: 'Reading List', path: '/reading-list', icon: <IoMdBook />, type: 'page' },
  { name: 'Notes', path: '/notes', icon: <IoMdDocument />, type: 'page' },
  { name: 'Creations', path: '/creations', icon: <IoMdCreate />, type: 'page' },
  { name: 'Sparks', path: '/sparks', icon: <IoMdBulb />, type: 'page' },
  { name: 'Movies', path: '/movies', icon: <IoMdFilm />, type: 'page' },
  { name: 'Weekend Projects', path: '/weekend-projects', icon: <IoMdHammer />, type: 'page' },
  { name: 'Tech Projects', path: '/techies', icon: <IoMdLaptop />, type: 'page' },
]

const ACTIONS: ShortcutItem[] = [
  { name: 'New Note', path: 'new-note', icon: <IoMdAdd />, type: 'action' },
]

interface ShortcutsProps {
  isOpen: boolean
  onClose: () => void
}

export function Shortcuts({ isOpen, onClose }: ShortcutsProps) {
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const queryClient = useRef(null)

  // Fetch notes in the background
  const { data: notes } = useQuery({
    queryKey: ['notes'],
    queryFn: () => trpc.getAllNotes.query(),
  })

  // Combine all items
  const allItems = [
    ...ACTIONS,
    ...SHORTCUT_ITEMS,
    ...(notes?.map(note => ({
      name: note.title,
      path: `/notes/view/${note.id}`,
      icon: <IoMdDocument className="text-gray-500" />,
      type: 'note' as const,
    })) || []),
  ]

  // Filter items based on search
  const filteredItems = allItems.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
      setSearch('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev =>
          prev < filteredItems.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev)
        break
      case 'Enter':
        if (filteredItems[selectedIndex]) {
          const item = filteredItems[selectedIndex]
          if (item.type === 'action') {
            if (item.path === 'new-note') {
              handleCreateNote()
            }
          } else {
            navigate(item.path)
          }
          onClose()
        }
        break
      case 'Escape':
        onClose()
        break
    }
  }

  const handleCreateNote = async () => {
    try {
      const newNote = await trpc.createNote.mutate({
        title: "New Note",
        content: "Start writing...",
        date: new Date().toISOString(),
      })
      navigate(`/notes/edit/${newNote.id}`)
    } catch (error) {
      console.error('Error creating note:', error)
    }
  }

  if (!isOpen) return null

  const renderItem = (item: ShortcutItem, index: number) => {
    const isSelected = index === selectedIndex

    return (
      <div
        key={item.path}
        className={`px-4 py-3 cursor-pointer flex items-center gap-3 ${
          isSelected
            ? 'bg-yellow-100 text-gray-900'
            : 'hover:bg-gray-50 text-gray-700'
        }`}
        onClick={() => {
          if (item.type === 'action') {
            if (item.path === 'new-note') {
              handleCreateNote()
            }
          } else {
            navigate(item.path)
          }
          onClose()
        }}
      >
        <span className="text-xl">{item.icon}</span>
        <span className="flex-1">{item.name}</span>
        {item.type === 'action' && (
          <span className="text-xs text-gray-500">Action</span>
        )}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-[20vh]">
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-xl mx-4 overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        <div className="p-4 border-b border-gray-200">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search pages and notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-search w-full"
          />
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {filteredItems.map((item, index) => renderItem(item, index))}
        </div>
      </div>
    </div>
  )
}