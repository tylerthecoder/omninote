import { useState, useEffect } from 'react'
import { useNavigate, useParams, Route, Routes } from 'react-router-dom'
import { trpc } from '../trpc'
import { Editor } from '../editor/editor'
import { Debouncer, DebouncerStatus } from '../utils'
import ReactMarkdown from 'react-markdown'
import styles from './TalkNotes.module.css'
import { TalkNote } from 'tt-services'

const debouncer = new Debouncer(500)

const prettySyncStatus = (status: DebouncerStatus) => {
  switch (status) {
    case 'not-synced':
      return 'Not synced';
    case 'synced':
      return 'Synced';
    case 'syncing':
      return 'Syncing...';
    case 'error':
      return 'Error';
  }
}

export function TalkNotesList() {
  const [talkNotes, setTalkNotes] = useState<TalkNote[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchTalkNotes()
  }, [])

  const fetchTalkNotes = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const notes = await trpc.getAllTalkNotes.query()
      setTalkNotes(notes)
    } catch (error) {
      console.error('Error fetching talk notes:', error)
      setError('Failed to fetch talk notes. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateNote = async () => {
    setError(null)
    try {
      const newNote = await trpc.createTalkNote.mutate({
        title: "New Talk Note",
        content: "Start writing your note here...",
        speaker: "Unknown Speaker",
        date: new Date().toISOString()
      })
      navigate(`/talk-notes/edit/${newNote.id}`)
    } catch (error) {
      console.error('Error creating talk note:', error)
      setError('Failed to create talk note. Please try again later.')
    }
  }

  const handleDeleteNote = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this talk note?')) {
      try {
        await trpc.deleteTalkNote.mutate({ id })
        setTalkNotes(prevNotes => prevNotes.filter(note => note.id !== id))
      } catch (error) {
        console.error('Error deleting talk note:', error)
        setError('Failed to delete talk note. Please try again later.')
      }
    }
  }

  return (
    <div className="container">
      <h1>Talk Notes</h1>
      {error && <div className="error-message">{error}</div>}
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <ul className={styles.talkNotesGrid}>
          {talkNotes.map(note => (
            <li key={note.id} className={styles.talkNoteItem}>
              <h3>{note.title}</h3>
              <p>{new Date(note.date).toLocaleDateString()} - {note.speaker}</p>
              <div className={styles.talkNoteActions}>
                <button onClick={() => navigate(`/talk-notes/view/${note.id}`)} className="btn btn-primary">View</button>
                <button onClick={() => navigate(`/talk-notes/edit/${note.id}`)} className="btn btn-info">Edit</button>
                <button onClick={() => handleDeleteNote(note.id)} className="btn btn-danger">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className={styles.actionButtons}>
        <button onClick={handleCreateNote} className="btn btn-primary">New Talk</button>
      </div>
    </div>
  )
}

export function TalkNoteView() {
  const { id } = useParams<{ id: string }>()
  const [note, setNote] = useState<TalkNote | null>(null)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const fetchedNote = await trpc.getTalkNote.query({ id: id! })
        setNote(fetchedNote)
      } catch (error) {
        console.error('Error fetching talk note:', error)
        setError('Failed to fetch talk note. Please try again later.')
      }
    }
    fetchNote()
  }, [id])

  if (error) return <div className="error-message">{error}</div>
  if (!note) return <p>Loading...</p>

  return (
    <div className="container">
      <header className={styles.header}>
        <button onClick={() => navigate('/talk-notes')} className="btn btn-nav">⬅️</button>
        <h1>{note.title}</h1>
      </header>
      <div className={styles.talkNoteContent}>
        <p className={styles.talkNoteMeta}>Speaker: {note.speaker} | Date: {new Date(note.date).toLocaleDateString()}</p>
        <ReactMarkdown>{note.content}</ReactMarkdown>
      </div>
    </div>
  )
}

export function TalkNoteEdit() {
  const { id } = useParams<{ id: string }>()
  const [note, setNote] = useState<TalkNote | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<DebouncerStatus>('synced')
  const navigate = useNavigate()

  useEffect(() => {
    debouncer.addStatusChangeListener((status) => {
      setSyncStatus(status);
    });

    const fetchNote = async () => {
      try {
        const fetchedNote = await trpc.getTalkNote.query({ id: id! })
        setNote(fetchedNote)
      } catch (error) {
        console.error('Error fetching talk note:', error)
        setError('Failed to fetch talk note. Please try again later.')
      }
    }
    fetchNote()

    return () => {
      debouncer.clear()
    }
  }, [id])

  const handleNoteChange = (newContent: string) => {
    if (!note) return

    setNote(prev => prev ? { ...prev, content: newContent } : null)
    debouncer.debounce('updateContent', async () => {
      try {
        await trpc.updateTalkNote.mutate({ id: note.id, content: newContent })
      } catch (error) {
        console.error('Error updating talk note:', error)
        setError('Failed to update talk note. Please try again later.')
      }
    })
  }

  const handleSpeakerChange = (newSpeaker: string) => {
    if (!note) return

    setNote(prev => prev ? { ...prev, speaker: newSpeaker } : null)
    debouncer.debounce('updateSpeaker', async () => {
      try {
        await trpc.updateTalkNote.mutate({ id: note.id, speaker: newSpeaker })
      } catch (error) {
        console.error('Error updating talk note speaker:', error)
        setError('Failed to update talk note speaker. Please try again later.')
      }
    })
  }

  const handleTitleChange = (newTitle: string) => {
    if (!note) return

    setNote(prev => prev ? { ...prev, title: newTitle } : null)
    debouncer.debounce('updateTitle', async () => {
      try {
        await trpc.updateTalkNote.mutate({ id: note.id, title: newTitle })
      } catch (error) {
        console.error('Error updating talk note title:', error)
        setError('Failed to update talk note title. Please try again later.')
      }
    })
  }

  const handleDelete = async () => {
    if (!note) return

    if (window.confirm('Are you sure you want to delete this talk note?')) {
      try {
        await trpc.deleteTalkNote.mutate({ id: note.id })
        navigate('/talk-notes')
      } catch (error) {
        console.error('Error deleting talk note:', error)
        setError('Failed to delete talk note. Please try again later.')
      }
    }
  }

  if (error) return <div className="error-message">{error}</div>
  if (!note) return <p>Loading...</p>

  return (
    <div className="container">
      <header className={styles.header}>
        <button onClick={() => navigate('/talk-notes')} className="btn btn-nav">⬅️</button>
        <h1>Edit Talk Note</h1>
      </header>
      <div className={styles.talkNoteForm}>
        <input
          type="text"
          value={note.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Talk title"
          className={styles.talkNoteInput}
        />
        <input
          type="text"
          value={note.speaker}
          onChange={(e) => handleSpeakerChange(e.target.value)}
          placeholder="Speaker name"
          className={styles.talkNoteInput}
        />
        <Editor text={note.content} onTextChange={handleNoteChange} />
      </div>
      <div className={styles.actionButtons}>
        <p className={styles.syncStatus}>Status: {prettySyncStatus(syncStatus)}</p>
        <button onClick={handleDelete} className="btn btn-danger">Delete Talk Note</button>
      </div>
    </div>
  )
}

export function TalkNotesRouter() {
  return (
    <Routes>
      <Route index element={<TalkNotesList />} />
      <Route path="view/:id" element={<TalkNoteView />} />
      <Route path="edit/:id" element={<TalkNoteEdit />} />
    </Routes>
  );
}