import { useState } from 'react'
import { useNavigate, useParams, Route, Routes } from 'react-router-dom'
import { trpc } from '../trpc'
import { TalkNote } from 'tt-services'
import { AppPage } from '../layout/AppPage'
import { ItemList } from '../components/ItemList'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { IoMdAdd, IoMdEye, IoMdCreate, IoMdTrash, IoMdPerson, IoMdCalendar } from 'react-icons/io'
import { MemoizedEditor } from '../components/editor/editor'
import { Debouncer, DebouncerStatus } from '../utils'

const debouncer = new Debouncer(500)

function TalkNotesList() {
  const [newTitle, setNewTitle] = useState('')
  const [newSpeaker, setNewSpeaker] = useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: notes, isLoading, error } = useQuery({
    queryKey: ['talkNotes'],
    queryFn: () => trpc.getAllTalkNotes.query(),
  })

  const createNoteMutation = useMutation({
    mutationFn: (data: { title: string; speaker: string }) =>
      trpc.createTalkNote.mutate({ ...data, content: '', date: new Date().toISOString() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talkNotes'] })
      setNewTitle('')
      setNewSpeaker('')
    },
  })

  const deleteNoteMutation = useMutation({
    mutationFn: (id: string) => {
      if (!window.confirm('Are you sure you want to delete this talk note?')) {
        throw new Error('Delete cancelled')
      }
      return trpc.deleteTalkNote.mutate({ id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talkNotes'] })
    },
  })

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault()
    if (newTitle.trim() && newSpeaker.trim()) {
      createNoteMutation.mutate({
        title: newTitle.trim(),
        speaker: newSpeaker.trim(),
      })
    }
  }

  const content = (
    <div className="space-y-6">
      <form onSubmit={handleAddNote} className="space-y-3">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Talk title"
          className="w-full"
        />
        <div className="flex gap-2">
          <input
            type="text"
            value={newSpeaker}
            onChange={(e) => setNewSpeaker(e.target.value)}
            placeholder="Speaker name"
            className="flex-1"
          />
          <button
            type="submit"
            disabled={!newTitle.trim() || !newSpeaker.trim() || createNoteMutation.isPending}
            className="btn btn-primary flex items-center gap-2"
          >
            <IoMdAdd className="w-5 h-5" />
            Add Talk Note
          </button>
        </div>
      </form>

      {(error || createNoteMutation.error || deleteNoteMutation.error) && (
        <div className="error-message">
          {error?.message ||
            createNoteMutation.error?.message ||
            deleteNoteMutation.error?.message}
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
                  <IoMdPerson className="w-4 h-4" />
                  {note.speaker}
                </span>
                <span className="flex items-center gap-1">
                  <IoMdCalendar className="w-4 h-4" />
                  {new Date(note.date).toLocaleDateString()}
                </span>
              </>
            ),
            actions: (
              <>
                <button
                  onClick={() => navigate(`/talk-notes/view/${note.id}`)}
                  className="btn btn-primary btn-sm"
                  aria-label="View talk note"
                >
                  <IoMdEye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate(`/talk-notes/edit/${note.id}`)}
                  className="btn btn-info btn-sm"
                  aria-label="Edit talk note"
                >
                  <IoMdCreate className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteNoteMutation.mutate(note.id)}
                  disabled={deleteNoteMutation.isPending}
                  className="btn btn-danger btn-sm"
                  aria-label="Delete talk note"
                >
                  <IoMdTrash className="w-4 h-4" />
                </button>
              </>
            ),
          })) || []}
        />
      )}
    </div>
  )

  return <AppPage title="Talk Notes" content={content} />
}

function TalkNoteEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [syncStatus, setSyncStatus] = useState<DebouncerStatus>('synced')

  const { data: note, error, isLoading } = useQuery({
    queryKey: ['talkNote', id],
    queryFn: () => trpc.getTalkNote.query({ id: id! }),
    enabled: !!id,
  })

  const updateTitleMutation = useMutation({
    mutationFn: (title: string) => {
      if (!id) throw new Error('Note ID is required')
      return trpc.updateTalkNote.mutate({ id, title })
    },
    onSuccess: (updatedNote) => {
      queryClient.setQueryData<TalkNote>(['talkNote', id], note => {
        if (!note || !updatedNote) return note
        return { ...note, title: updatedNote.title }
      })
    },
  })

  const updateSpeakerMutation = useMutation({
    mutationFn: (speaker: string) => {
      if (!id) throw new Error('Note ID is required')
      return trpc.updateTalkNote.mutate({ id, speaker })
    },
    onSuccess: (updatedNote) => {
      queryClient.setQueryData<TalkNote>(['talkNote', id], note => {
        if (!note || !updatedNote) return note
        return { ...note, speaker: updatedNote.speaker }
      })
    },
  })

  const updateContentMutation = useMutation({
    mutationFn: (content: string) => {
      if (!id) throw new Error('Note ID is required')
      setSyncStatus('syncing')
      return new Promise<void>((resolve, reject) => {
        debouncer.debounce('updateContent', async () => {
          try {
            await trpc.updateTalkNote.mutate({ id, content })
            setSyncStatus('synced')
            resolve()
          } catch (error) {
            setSyncStatus('error')
            reject(error)
          }
        })
      })
    },
    onMutate: async (content: string) => {
      await queryClient.cancelQueries({ queryKey: ['talkNote', id] })
      const previousNote = queryClient.getQueryData<TalkNote>(['talkNote', id])
      queryClient.setQueryData<TalkNote>(['talkNote', id], old => {
        if (!old) return old
        return { ...old, content }
      })
      return { previousNote }
    },
    onError: (err, content, context) => {
      if (context?.previousNote) {
        queryClient.setQueryData(['talkNote', id], context.previousNote)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['talkNote', id] })
    }
  })

  const content = note ? (
    <div className="space-y-6">
      {(error || updateTitleMutation.error || updateSpeakerMutation.error || updateContentMutation.error) && (
        <div className="error-message">
          {error?.message || updateTitleMutation.error?.message || updateSpeakerMutation.error?.message || updateContentMutation.error?.message}
        </div>
      )}

      <div className="bg-white shadow p-6 space-y-4">
        <div className="space-y-3">
          <input
            type="text"
            value={note.title}
            onChange={(e) => updateTitleMutation.mutate(e.target.value)}
            placeholder="Title"
            className="w-full text-2xl font-bold border-0 bg-transparent p-2 focus:outline-none focus:bg-gray-100 rounded transition-colors duration-200"
          />
          <input
            type="text"
            value={note.speaker}
            onChange={(e) => updateSpeakerMutation.mutate(e.target.value)}
            placeholder="Speaker"
            className="w-full text-lg text-gray-600 border-0 bg-transparent p-2 focus:outline-none focus:bg-gray-100 rounded transition-colors duration-200"
          />
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-500 w-24">Status</span>
          <span className="text-sm text-gray-700">{syncStatus}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-500 w-24">Date</span>
          <span className="text-sm text-gray-700 flex items-center gap-1">
            <IoMdCalendar className="w-4 h-4" />
            {new Date(note.date).toLocaleString()}
          </span>
        </div>
      </div>
      <div className="bg-white shadow p-6">
        <MemoizedEditor
          initialText={note.content || ''}
          onTextChange={(text) => updateContentMutation.mutate(text)}
        />
      </div>
    </div>
  ) : null

  if (error) return <AppPage title="Error" content={<div className="error-message">{error.message}</div>} />
  if (isLoading || !note) return <AppPage title="Loading..." content={<div className="loading-message">Loading...</div>} />

  return (
    <AppPage
      title={`Edit: ${note.title}`}
      content={content}
      showBack
      backTo="/talk-notes"
    />
  )
}

function TalkNoteView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: note, error, isLoading } = useQuery({
    queryKey: ['talkNote', id],
    queryFn: () => trpc.getTalkNote.query({ id: id! }),
    enabled: !!id,
  })

  const content = note ? (
    <div className="space-y-6">
      <div className="bg-white shadow p-6 space-y-4">
        <h1 className="text-3xl font-bold">{note.title}</h1>
        <div className="flex items-center gap-4">
          <span className="text-lg text-gray-600 flex items-center gap-1">
            <IoMdPerson className="w-5 h-5" />
            {note.speaker}
          </span>
          <span className="text-lg text-gray-600 flex items-center gap-1">
            <IoMdCalendar className="w-5 h-5" />
            {new Date(note.date).toLocaleString()}
          </span>
        </div>
      </div>
      <div className="bg-white shadow p-6 prose max-w-none">
        {note.content}
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
      backTo="/talk-notes"
      actions={
        <button
          onClick={() => navigate(`/talk-notes/edit/${note.id}`)}
          className="btn btn-primary"
        >
          Edit
        </button>
      }
    />
  )
}

export function TalkNotesRouter() {
  return (
    <Routes>
      <Route index element={<TalkNotesList />} />
      <Route path="view/:id" element={<TalkNoteView />} />
      <Route path="edit/:id" element={<TalkNoteEdit />} />
    </Routes>
  )
}