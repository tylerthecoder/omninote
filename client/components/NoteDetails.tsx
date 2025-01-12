import { useState, ReactNode, useEffect, useRef } from 'react'
import { IoMdArrowDropdown, IoMdArrowDropright, IoMdCalendar, IoMdTime, IoMdMegaphone, IoMdLock } from 'react-icons/io'
import { Note } from 'tt-services'
import { TagView } from './TagView'
import { trpc } from '../trpc'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Debouncer, DebouncerStatus } from '../utils'
import { useNote } from '../queries'

const debouncer = new Debouncer(500)

interface DetailRowProps {
  label: string
  children: ReactNode
}

const DetailRow = ({ label, children }: DetailRowProps) => (
  <div className="flex items-center gap-4">
    <span className="text-sm font-medium text-gray-500 w-24">{label}</span>
    {children}
  </div>
)

interface NoteDetailsProps {
  noteId: string
  isEditable?: boolean
}

export function NoteDetails({ noteId, isEditable = false }: NoteDetailsProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [syncStatus, setSyncStatus] = useState<DebouncerStatus>('synced')
  const queryClient = useQueryClient()
  const titleInitialized = useRef(false)

  const { data: note, error, isLoading } = useNote(noteId)
  const [localTitle, setLocalTitle] = useState('')

  useEffect(() => {
    if (note?.title && !titleInitialized.current) {
      setLocalTitle(note.title)
      titleInitialized.current = true
    }
  }, [note?.title])

  const updateNoteTitleMutation = useMutation({
    mutationFn: (title: string) => {
      setSyncStatus('syncing')
      return new Promise<Note>((resolve, reject) => {
        debouncer.debounce('updateTitle', async () => {
          try {
            const result = await trpc.updateNote.mutate({ id: noteId, title })
            setSyncStatus('synced')
            resolve(result)
          } catch (error) {
            setSyncStatus('error')
            reject(error)
          }
        })
      })
    },
    onSuccess: (updatedNote) => {
      queryClient.setQueryData(['note', noteId], (oldNote: Note) => ({
        ...oldNote,
        title: updatedNote.title,
      }))
    },
  })

  const handleTitleChange = (newTitle: string) => {
    setLocalTitle(newTitle)
    setSyncStatus('syncing')
    updateNoteTitleMutation.mutate(newTitle)
  }

  const publishMutation = useMutation({
    mutationFn: (isPublished: boolean) => {
      return isPublished
        ? trpc.unpublishNote.mutate({ id: noteId })
        : trpc.publishNote.mutate({ id: noteId })
    },
    onSuccess: (updatedNote) => {
      queryClient.setQueryData(['note', noteId], updatedNote)
    },
  })

  const addTagMutation = useMutation({
    mutationFn: (tag: string) => {
      if (!tag.trim()) throw new Error('Tag cannot be empty')
      return trpc.addTag.mutate({ id: noteId, tag: tag.trim() })
    },
    onSuccess: (updatedNote) => {
      queryClient.setQueryData(['note', noteId], updatedNote)
    },
  })

  const removeTagMutation = useMutation({
    mutationFn: (tag: string) => {
      return trpc.removeTag.mutate({ id: noteId, tag })
    },
    onSuccess: (updatedNote) => {
      queryClient.setQueryData(['note', noteId], updatedNote)
    },
  })

  if (error) return <div className="error-message">{error.message}</div>
  if (isLoading || !note) return <div className="loading-message">Loading...</div>

  return (
    <div className="bg-white shadow">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 p-4 hover:bg-gray-50 transition-colors"
      >
        {isExpanded ? <IoMdArrowDropdown className="w-5 h-5" /> : <IoMdArrowDropright className="w-5 h-5" />}
        <span className="font-medium">Note Details</span>
      </button>
      {isExpanded && (
        <div className="p-6 space-y-4 border-t">
          <DetailRow label="Title">
            {isEditable ? (
              <input
                type="text"
                value={localTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="flex-1 text-2xl font-bold border-0 bg-transparent p-2 focus:outline-none focus:bg-gray-100 rounded transition-colors duration-200"
              />
            ) : (
              <span className="text-2xl font-bold">{localTitle}</span>
            )}
          </DetailRow>
          {syncStatus && (
            <DetailRow label="Status">
              <span className="text-sm text-gray-700">{syncStatus}</span>
            </DetailRow>
          )}
          <DetailRow label="Created">
            <span className="text-sm text-gray-700 flex items-center gap-1">
              <IoMdCalendar className="w-4 h-4" />
              {new Date(note.createdAt).toLocaleString()}
            </span>
          </DetailRow>
          <DetailRow label="Updated">
            <span className="text-sm text-gray-700 flex items-center gap-1">
              <IoMdTime className="w-4 h-4" />
              {new Date(note.updatedAt).toLocaleString()}
            </span>
          </DetailRow>
          <DetailRow label="Tags">
            <div className="flex-1">
              <TagView
                tags={note.tags || []}
                onNewTag={isEditable ? (tag) => addTagMutation.mutate(tag) : undefined}
                onRemoveTag={isEditable ? (tag) => removeTagMutation.mutate(tag) : undefined}
              />
            </div>
          </DetailRow>
          {isEditable && (
            <DetailRow label="Visibility">
              <button
                onClick={() => publishMutation.mutate(note.published)}
                className="btn btn-primary btn-sm flex items-center gap-2"
              >
                {note.published ? <IoMdLock className="w-4 h-4" /> : <IoMdMegaphone className="w-4 h-4" />}
                {note.published ? 'Unpublish' : 'Publish'}
              </button>
            </DetailRow>
          )}
        </div>
      )}
    </div>
  )
}