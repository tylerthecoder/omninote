import { useState, useEffect } from 'react'
import { useNavigate, useParams, Route, Routes } from 'react-router-dom'
import { trpc } from './trpc'
import { Editor } from './editor/editor'
import { Debouncer, DebouncerStatus } from './utils'
import ReactMarkdown from 'react-markdown'
import styles from './Notes.module.css'
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
    <div>
      <h1>Notes</h1>
      <button onClick={handleCreateNote}>New Note</button>
      <div className={styles.notesGrid}>
        {notes.map(note => (
          <div key={note.id} className={styles.noteCard}>
            <h3>{note.title}</h3>
            <p>{new Date(note.date).toLocaleDateString()}</p>
            <p>{note.published ? '📢 Published' : '📝 Draft'}</p>
            <div className={styles.noteActions}>
              <button onClick={() => navigate(`/notes/view/${note.id}`)}>View</button>
              <button onClick={() => navigate(`/notes/edit/${note.id}`)}>Edit</button>
              <button onClick={() => handleDeleteNote(note.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function NoteEdit() {
  const { id } = useParams<{ id: string }>()
  const [note, setNote] = useState<Note | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<DebouncerStatus>('synced')
  const navigate = useNavigate()

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

  if (!note) return <p>Loading...</p>
  if (error) return <div className="error-message">{error}</div>

  return (
    <div className={styles.noteEditContainer}>
      <div className={styles.noteHeader}>
        <button onClick={() => navigate('/notes')}>Back</button>
        <input
          type="text"
          value={note.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className={styles.titleInput}
        />
        <button onClick={handlePublishToggle}>
          {note.published ? 'Unpublish' : 'Publish'}
        </button>
      </div>
      <div className={styles.editorContainer}>
        <Editor text={note.content} onTextChange={handleContentChange} />
      </div>
      <p>Status: {syncStatus}</p>
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
    <div className={styles.noteViewContainer}>
      <div className={styles.noteHeader}>
        <button onClick={() => navigate('/notes')}>Back</button>
        <h1>{note.title}</h1>
        <button onClick={() => navigate(`/notes/edit/${note.id}`)}>Edit</button>
      </div>
      <div className={styles.noteContent}>
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
