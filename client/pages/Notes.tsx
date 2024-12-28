import { useState } from 'react'
import { useNavigate, useParams, Route, Routes } from 'react-router-dom'
import { trpc } from '../trpc'
import { Editor } from '../editor/editor'
import { Debouncer, DebouncerStatus } from '../utils'
import ReactMarkdown from 'react-markdown'
import { Note } from 'tt-services'
import { AppPage } from '../layout/AppPage'
import { TagView } from '../components/TagView'
import { ItemList } from '../components/ItemList'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { IoMdAdd, IoMdEye, IoMdCreate, IoMdTrash, IoMdMegaphone, IoMdLock, IoMdTime, IoMdCalendar, IoMdDocument } from 'react-icons/io'
import { NoteDetails } from '../components/NoteDetails'
import { MemoizedEditor } from '../components/MemoizedEditor'

const debouncer = new Debouncer(500)

function NotesList() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: notes, isLoading, error } = useQuery({
    queryKey: ['notes'],
    queryFn: () => trpc.getAllNotes.query(),
  })

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

      {isLoading ? (
        <div className="loading-message">Loading...</div>
      ) : (
        <ItemList
          items={notes?.map(note => ({
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
  const queryClient = useQueryClient()
  const [syncStatus, setSyncStatus] = useState<DebouncerStatus>('synced')

  const { data: note, error: fetchError } = useQuery({
    queryKey: ['note', id],
    queryFn: () => trpc.getNote.query({ id: id! }),
    enabled: !!id,
  })

  const updateNoteTitleMutation = useMutation({
    mutationFn: (title: string) => {
      if (!id) throw new Error('Note ID is required')
      return trpc.updateNote.mutate({ id, title })
    },
    onSuccess: (updatedNote) => {
      queryClient.setQueryData(['note', id], (oldNote: Note) => ({
        ...oldNote,
        title: updatedNote.title,
      }))
    },
  })

  const updateNoteContentMutation = useMutation({
    mutationFn: (content: string) => {
      if (!id) throw new Error('Note ID is required')
      setSyncStatus('syncing')
      return new Promise<Note>((resolve, reject) => {
        debouncer.debounce('updateContent', async () => {
          try {
            const result = await trpc.updateNote.mutate({ id, content })
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
      queryClient.setQueryData(['note', id], (oldNote: Note) => ({
        ...oldNote,
        content: updatedNote.content,
      }))
    },
  })

  const publishMutation = useMutation({
    mutationFn: (isPublished: boolean) => {
      if (!id) throw new Error('Note ID is required')
      return isPublished
        ? trpc.unpublishNote.mutate({ id })
        : trpc.publishNote.mutate({ id })
    },
    onSuccess: (updatedNote) => {
      queryClient.setQueryData(['note', id], updatedNote)
    },
  })

  const addTagMutation = useMutation({
    mutationFn: (tag: string) => {
      if (!id) throw new Error('Note ID is required')
      if (!tag.trim()) throw new Error('Tag cannot be empty')
      return trpc.addTag.mutate({ id, tag: tag.trim() })
    },
    onSuccess: (updatedNote) => {
      queryClient.setQueryData(['note', id], updatedNote)
    },
  })

  const removeTagMutation = useMutation({
    mutationFn: (tag: string) => {
      if (!id) throw new Error('Note ID is required')
      return trpc.removeTag.mutate({ id, tag })
    },
    onSuccess: (updatedNote) => {
      queryClient.setQueryData(['note', id], updatedNote)
    },
  })

  const content = note ? (
    <div className="space-y-6">
      <NoteDetails
        note={note}
        syncStatus={syncStatus}
        onTitleChange={(title) => updateNoteTitleMutation.mutate(title)}
        onPublishToggle={(isPublished) => publishMutation.mutate(isPublished)}
        onAddTag={(tag) => addTagMutation.mutate(tag)}
        onRemoveTag={(tag) => removeTagMutation.mutate(tag)}
      />
      <div className="bg-white shadow p-6">
        <MemoizedEditor
          initialText={note.content}
          onTextChange={(text) => updateNoteContentMutation.mutate(text)}
        />
      </div>
    </div>
  ) : null

  if (fetchError) return <AppPage title="Error" content={<div className="error-message">{fetchError.message}</div>} />
  if (!note) return <AppPage title="Loading..." content={<div className="loading-message">Loading...</div>} />

  return (
    <AppPage
      title={note.title}
      content={content}
      showBack
      backTo="/notes"
    />
  )
}

function NoteView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: note, error, isLoading } = useQuery({
    queryKey: ['note', id],
    queryFn: () => trpc.getNote.query({ id: id! }),
    enabled: !!id,
  })

  const content = note ? (
    <div className="space-y-6">
      <NoteDetails note={note} />
      <div className="bg-white shadow p-6">
        <div className="prose max-w-none">
          <ReactMarkdown>{note.content}</ReactMarkdown>
        </div>
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

export function NotesRouter() {
  return (
    <Routes>
      <Route index element={<NotesList />} />
      <Route path="view/:id" element={<NoteView />} />
      <Route path="edit/:id" element={<NoteEdit />} />
    </Routes>
  )
}
