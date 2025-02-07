import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams, Route, Routes, Navigate } from 'react-router-dom'
import { trpc } from '../trpc'
import { MemoizedEditor } from '../components/editor/editor'
import { Debouncer, DebouncerStatus } from '../utils'
import { Note } from 'tt-services'
import { AppPage } from '../layout/AppPage'
import { TagView } from '../components/TagView'
import { ItemList } from '../components/ItemList'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { IoMdAdd, IoMdEye, IoMdCreate, IoMdTrash, IoMdMegaphone, IoMdLock, IoMdTime, IoMdCalendar, IoMdDocument, IoMdPricetag, IoMdClose } from 'react-icons/io'
import { NoteDetails } from '../components/NoteDetails'
import { useNote, useAllNotes, useUpdateNote, useCreateNote } from '../queries'
import MarkdownViewer from '../components/MarkdownViewer'

const debouncer = new Debouncer(500)

type TagState = 'contains' | 'not-contains' | 'none'

function NotesList() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [tagStates, setTagStates] = useState<Record<string, TagState>>({})
  const filterRef = useRef<HTMLDivElement>(null)
  const [focusedIndex, setFocusedIndex] = useState<number>(-1)

  const { data: notes, isLoading, error } = useAllNotes()

  // Get unique tags from all notes
  const allTags = Array.from(new Set(notes?.flatMap(note => note.tags || []) || []))

  // Toggle tag state in cycle: none -> contains -> not-contains -> none
  const toggleTagState = (tag: string) => {
    setTagStates(prev => {
      const currentState = prev[tag] || 'none'
      const nextState: TagState =
        currentState === 'none' ? 'contains' :
          currentState === 'contains' ? 'not-contains' :
            'none'
      return { ...prev, [tag]: nextState }
    })
  }

  // Filter notes based on tag states
  const filteredNotes = notes?.filter(note => {
    return Object.entries(tagStates).every(([tag, state]) => {
      if (state === 'none') return true
      if (state === 'contains') return note.tags?.includes(tag)
      if (state === 'not-contains') return !note.tags?.includes(tag)
      return true
    })
  })

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent | React.KeyboardEvent, index?: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      const nextIndex = index !== undefined ?
        Math.min(index + 1, allTags.length - 1) :
        focusedIndex < 0 ? 0 : Math.min(focusedIndex + 1, allTags.length - 1)
      setFocusedIndex(nextIndex)
      const buttons = filterRef.current?.querySelectorAll('button')
      buttons?.[nextIndex]?.focus()
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      const prevIndex = index !== undefined ?
        Math.max(index - 1, 0) :
        focusedIndex < 0 ? allTags.length - 1 : Math.max(focusedIndex - 1, 0)
      setFocusedIndex(prevIndex)
      const buttons = filterRef.current?.querySelectorAll('button')
      buttons?.[prevIndex]?.focus()
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (index !== undefined) {
        toggleTagState(allTags[index])
      } else if (focusedIndex >= 0) {
        toggleTagState(allTags[focusedIndex])
      }
    }
  }

  // Keyboard shortcut handler
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        const firstChip = filterRef.current?.querySelector('button')
        firstChip?.focus()
        setFocusedIndex(0)
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])

  const getChipStyle = (state: TagState) => {
    switch (state) {
      case 'contains':
        return 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500'
      case 'not-contains':
        return 'bg-red-400 text-red-900 hover:bg-red-500'
      default:
        return 'bg-gray-100 hover:bg-gray-200 text-gray-700'
    }
  }

  const getChipIcon = (state: TagState) => {
    switch (state) {
      case 'contains':
        return <IoMdAdd className="w-3 h-3" />
      case 'not-contains':
        return <IoMdClose className="w-3 h-3" />
      default:
        return <IoMdPricetag className="w-3 h-3" />
    }
  }

  const deleteNoteMutation = useMutation({
    mutationFn: (id: string) => {
      if (!window.confirm('Are you sure you want to delete this note?')) {
        throw new Error('Delete cancelled')
      }
      return trpc.deleteNote.mutate({ id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })

  const content = (
    <>
      {(error || deleteNoteMutation.error) && (
        <div className="error-message">
          {error?.message || deleteNoteMutation.error?.message}
        </div>
      )}

      <div className="mb-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">Filter by tags (use arrow keys or click to navigate):</div>
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-gray-100 rounded-md border border-gray-300">⌘</kbd>
              <kbd className="px-2 py-1 bg-gray-100 rounded-md border border-gray-300">F</kbd>
              <span className="ml-1">to focus</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-gray-100 rounded-md border border-gray-300">←</kbd>
              <kbd className="px-2 py-1 bg-gray-100 rounded-md border border-gray-300">→</kbd>
              <span className="ml-1">to navigate</span>
            </div>
          </div>
        </div>

        <div
          className="flex flex-wrap gap-2"
          ref={filterRef}
          role="group"
          aria-label="Tag filters"
          onKeyDown={handleKeyDown}
        >
          {allTags.map((tag, index) => {
            const state = tagStates[tag] || 'none'
            return (
              <button
                key={tag}
                onClick={() => toggleTagState(tag)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onFocus={() => setFocusedIndex(index)}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400 ${getChipStyle(state)}`}
                role="checkbox"
                aria-checked={state !== 'none'}
                aria-label={`Filter by tag ${tag}: ${state}`}
                tabIndex={0}
              >
                {getChipIcon(state)}
                {tag}
              </button>
            )
          })}
          {Object.values(tagStates).some(state => state !== 'none') && (
            <button
              onClick={() => setTagStates({})}
              onFocus={() => setFocusedIndex(-1)}
              className="text-sm text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded-full px-3 py-1"
              tabIndex={0}
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="flex gap-2 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-gray-100"></div>
            No filter
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
            Contains tag
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-400"></div>
            Doesn't contain tag
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-message">Loading...</div>
      ) : (
        <ItemList
          items={filteredNotes?.map(note => ({
            id: note.id,
            title: note.title,
            meta: (
              <>
                <span className="flex items-center gap-1">
                  <IoMdCalendar className="w-4 h-4" />
                  {new Date(note.date).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  {note.published ? <IoMdMegaphone className="w-4 h-4" /> : <IoMdDocument className="w-4 h-4" />}
                  {note.published ? 'Published' : 'Draft'}
                </span>
                {note.tags && <TagView tags={note.tags} />}
              </>
            ),
            actions: (
              <>
                <button
                  onClick={() => navigate(`/notes/view/${note.id}`)}
                  className="btn btn-primary btn-sm"
                  aria-label="View note"
                >
                  <IoMdEye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate(`/notes/edit/${note.id}`)}
                  className="btn btn-info btn-sm"
                  aria-label="Edit note"
                >
                  <IoMdCreate className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteNoteMutation.mutate(note.id)}
                  disabled={deleteNoteMutation.isPending}
                  className="btn btn-danger btn-sm"
                  aria-label="Delete note"
                >
                  <IoMdTrash className="w-4 h-4" />
                </button>
              </>
            ),
          })) || []}
        />
      )}
    </>
  )

  return (
    <AppPage
      title="Notes"
      content={content}
      actions={
        <button
          onClick={() => navigate('/notes/new')}
          className="btn btn-primary flex items-center gap-2"
        >
          <IoMdAdd className="w-5 h-5" />
          New Note
        </button>
      }
    />
  )
}

function NoteEdit() {
  const { id } = useParams<{ id: string }>()
  if (!id) return <AppPage title="Error" content={<div className="error-message">Note ID is required</div>} />

  const { data: note, error: fetchError } = useNote(id)
  const { mutation: updateMutation, status: syncStatus } = useUpdateNote()

  const content = note ? (
    <div className="space-y-6">
      <NoteDetails noteId={id} isEditable={true} />
      <div className="bg-white shadow p-6">
        <div className="space-y-4">
          <MemoizedEditor
            initialText={note.content}
            onTextChange={(text) => updateMutation.mutate({ id, content: text })}
          />
        </div>
      </div>
    </div>
  ) : null

  if (fetchError) return <AppPage title="Error" content={<div className="error-message">{fetchError.message}</div>} />
  if (!note) return <AppPage title="Loading..." content={<div className="loading-message">Loading...</div>} />

  console.log('NoteEdit', note)

  return (
    <AppPage
      title={note.title}
      content={content}
      showBack
      backTo="/notes"
      showSidebar={false}
    />
  )
}

function NoteView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  if (!id) return <AppPage title="Error" content={<div className="error-message">Note ID is required</div>} />

  const { data: note, error, isLoading } = useNote(id)

  const content = note ? (
    <div className="space-y-6">
      <NoteDetails noteId={id} />
      <div className="bg-white shadow p-6">
        <MarkdownViewer markdown={note.content} />
      </div>
    </div>
  ) : null

  if (error) return <AppPage title="Error" content={<div className="error-message">{error.message}</div>} />
  if (isLoading || !note) return <AppPage title="Loading..." content={<div className="loading-message">Loading...</div>} />

  return (
    <AppPage
      title={note.title}
      content={content}
      showBack
      backTo="/notes"
      showSidebar={false}
      actions={
        <button
          onClick={() => navigate(`/notes/edit/${note.id}`)}
          className="btn btn-info flex items-center gap-2"
        >
          <IoMdCreate className="w-5 h-5" />
          Edit
        </button>
      }
    />
  )
}

function NewNote() {
  const { data: note, error, mutate } = useCreateNote()

  useEffect(() => {
    mutate()
  }, [])

  if (error) return <AppPage title="Error" content={<div className="error-message">{error.message}</div>} />

  if (note) {
    return <Navigate to={`/notes/edit/${note.id}`} />
  }

  return (
    <AppPage
      title="New Note"
      content={
        <div> Making new note</div>
      }
      showBack
      backTo="/notes"
      showSidebar={false}
    />
  )
}

export function NotesRouter() {
  console.log('NotesRouter')
  return (
    <Routes>
      <Route index element={<NotesList />} />
      <Route path="view/:id" element={<NoteView />} />
      <Route path="edit/:id" element={<NoteEdit />} />
      <Route path="new" element={<NewNote />} />
    </Routes>
  )
}
