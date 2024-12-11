import { useState, useEffect } from 'react'
import { useNavigate, useParams, Route, Routes } from 'react-router-dom'
import { trpc } from '../trpc'
import { Editor } from '../editor/editor'
import { Debouncer, DebouncerStatus } from '../utils'
import ReactMarkdown from 'react-markdown'
import type { Note } from 'tt-services'

const debouncer = new Debouncer(500)

function NotesList() {
  const [notes, setNotes] = useState<Note[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchNotes()
  }, [])

  const fetchNotes = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const fetchedNotes = await trpc.getAllNotes.query()
      setNotes(fetchedNotes)
    } catch (error) {
      console.error('Error fetching notes:', error)
      setError('Failed to fetch notes. Please try again later.')
    } finally {
      setIsLoading(false)
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
      setError('Failed to create note. Please try again later.')
    }
  }

  const handleDeleteNote = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return

    try {
      await trpc.deleteNote.mutate({ id })
      setNotes(notes.filter(note => note.id !== id))
    } catch (error) {
      console.error('Error deleting note:', error)
      setError('Failed to delete note. Please try again later.')
    }
  }

  if (isLoading) return <p>Loading...</p>
  if (error) return <div className="error-message">{error}</div>

  return (
    <div className="container">
      <h1>Notes</h1>
      {error && <div className="error-message">{error}</div>}

      <button onClick={handleCreateNote} className="btn btn-primary">New Note</button>

      <ul className="list">
        {notes.map(note => (
          <li key={note.id} className="card">
            <div className="card-content">
              <div className="flex justify-between items-center">
                <span className="card-title">{note.title}</span>
                <div className="card-actions">
                  <button onClick={() => navigate(`/notes/view/${note.id}`)} className="btn btn-primary btn-sm">View</button>
                  <button onClick={() => navigate(`/notes/edit/${note.id}`)} className="btn btn-info btn-sm">Edit</button>
                  <button onClick={() => handleDeleteNote(note.id)} className="btn btn-danger btn-sm">Delete</button>
                </div>
              </div>
              <div className="card-meta">
                <span>{new Date(note.date).toLocaleDateString()}</span>
                <span className="ml-4">{note.published ? '📢 Published' : '📝 Draft'}</span>
                {note.tags && note.tags.length > 0 &&
                  note.tags.map(tag => (
                    <span key={tag} className="bg-gray-200 px-2 py-0.5 rounded-full text-xs">#{tag}</span>
                  ))
                }
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function NoteEdit() {
  const { id } = useParams<{ id: string }>()
  const [note, setNote] = useState<Note | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<DebouncerStatus>('synced')
  const navigate = useNavigate()
  const [newTag, setNewTag] = useState('')

  useEffect(() => {
    debouncer.addStatusChangeListener(setSyncStatus)

    const fetchNote = async () => {
      try {
        const fetchedNote = await trpc.getNote.query({ id: id! })
        setNote(fetchedNote)
      } catch (error) {
        console.error('Error fetching note:', error)
        setError('Failed to fetch note. Please try again later.')
      }
    }

    fetchNote()
    return () => debouncer.clear()
  }, [id])

  const handlePublishToggle = async () => {
    if (!note) return
    try {
      const updatedNote = note.published
        ? await trpc.unpublishNote.mutate({ id: note.id })
        : await trpc.publishNote.mutate({ id: note.id })
      setNote(updatedNote)
    } catch (error) {
      console.error('Error toggling publish status:', error)
      setError('Failed to update publish status. Please try again later.')
    }
  }

  const handleContentChange = (newContent: string) => {
    if (!note) return
    setNote({ ...note, content: newContent })
    debouncer.debounce('updateContent', async () => {
      try {
        await trpc.updateNote.mutate({ id: note.id, content: newContent })
      } catch (error) {
        console.error('Error updating note:', error)
        setError('Failed to update note. Please try again later.')
      }
    })
  }

  const handleTitleChange = (newTitle: string) => {
    if (!note) return
    setNote({ ...note, title: newTitle })
    debouncer.debounce('updateTitle', async () => {
      try {
        await trpc.updateNote.mutate({ id: note.id, title: newTitle })
      } catch (error) {
        console.error('Error updating note title:', error)
        setError('Failed to update note title. Please try again later.')
      }
    })
  }

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!note || !newTag.trim()) return
    try {
      const updatedNote = await trpc.addTag.mutate({ id: note.id, tag: newTag.trim() })
      setNote(updatedNote)
      setNewTag('')
    } catch (error) {
      console.error('Error adding tag:', error)
      setError('Failed to add tag. Please try again later.')
    }
  }

  const handleRemoveTag = async (tag: string) => {
    if (!note) return
    try {
      const updatedNote = await trpc.removeTag.mutate({ id: note.id, tag })
      setNote(updatedNote)
    } catch (error) {
      console.error('Error removing tag:', error)
      setError('Failed to remove tag. Please try again later.')
    }
  }

  if (!note) return <p>Loading...</p>
  if (error) return <div className="error-message">{error}</div>

  return (
    <div className="container">
      <header className="flex items-center gap-4 mb-4">
        <button onClick={() => navigate('/notes')} className="btn btn-nav">⬅️</button>
        <h1 className="flex-1">Edit Note</h1>
      </header>
      <div className="flex-1 overflow-y-auto min-h-0 mb-4">
        <div className="items-center gap-4 mb-4 flex-shrink-0">
          <div>
            <label htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              value={note.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="flex gap-4 text-sm text-gray-600">
            <span>Created: {new Date(note.createdAt).toLocaleString()}</span>
            <span>Updated: {new Date(note.updatedAt).toLocaleString()}</span>
          </div>
          <div className="space-y-2">
            <form onSubmit={handleAddTag} className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag..."
                className="px-2 py-1 border border-gray-300 rounded"
              />
              <button type="submit" className="btn btn-primary">Add Tag</button>
            </form>
            <div className="flex flex-wrap gap-2">
              {note.tags && note.tags.map(tag => (
                <span key={tag} className="bg-gray-200 px-2 py-1 rounded-full text-sm flex items-center gap-1">
                  #{tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="text-gray-600 hover:text-red-500 px-1 text-lg"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
          <button onClick={handlePublishToggle} className="btn btn-primary">
            {note.published ? 'Unpublish' : 'Publish'}
          </button>
        </div>
        <div className="flex-1">
          <Editor text={note.content} onTextChange={handleContentChange} />
        </div>
        <p>Status: {syncStatus}</p>
      </div>
    </div>
  )
}

function NoteView() {
  const { id } = useParams<{ id: string }>()
  const [note, setNote] = useState<Note | null>(null)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const fetchedNote = await trpc.getNote.query({ id: id! })
        setNote(fetchedNote)
      } catch (error) {
        console.error('Error fetching note:', error)
        setError('Failed to fetch note. Please try again later.')
      }
    }
    fetchNote()
  }, [id])

  if (!note) return <p>Loading...</p>
  if (error) return <div className="error-message">{error}</div>

  return (
    <div className="container">
      <div className="flex items-center gap-4 mb-4">
        <button onClick={() => navigate('/notes')} className="btn btn-nav">⬅️</button>
        <h1>{note.title}</h1>
        <div className="flex gap-4 text-sm text-gray-600">
          <span>Created: {new Date(note.createdAt).toLocaleString()}</span>
          <span>Updated: {new Date(note.updatedAt).toLocaleString()}</span>
          <span>{note.published ? '📢 Published' : '📝 Draft'}</span>
        </div>
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {note.tags.map(tag => (
              <span key={tag} className="bg-gray-200 px-2 py-1 rounded-full text-sm">#{tag}</span>
            ))}
          </div>
        )}
        <button onClick={() => navigate(`/notes/edit/${note.id}`)} className="btn btn-info">Edit</button>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 p-4">
        <ReactMarkdown>{note.content}</ReactMarkdown>
      </div>
    </div>
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
