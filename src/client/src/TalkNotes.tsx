import { useState, useEffect } from 'react'
import { useNavigate, useParams, Route, Routes } from 'react-router-dom'
import { trpc } from './trpc'
import { Editor } from './editor/editor'
import { Debouncer } from './utils'
import { TalkNote } from '../../types/types'
import ReactMarkdown from 'react-markdown'
import styles from './TalkNotes.module.css'

type SyncStatus = 'not-synced' | 'synced' | 'syncing...' | 'error';

const prettySyncStatus = (status: SyncStatus) => {
  switch (status) {
    case 'not-synced':
      return 'Not synced';
    case 'synced':
      return 'Synced';
    case 'syncing...':
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
    <div className={styles.talkNotesList}>
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
                <button onClick={() => navigate(`/talk-notes/view/${note.id}`)}>View</button>
                <button onClick={() => navigate(`/talk-notes/edit/${note.id}`)}>Edit</button>
                <button onClick={() => handleDeleteNote(note.id)} className={styles.deleteButton}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className={styles.actionButtons}>
        <button onClick={handleCreateNote} className={styles.createButton}>New Talk</button>
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
    <div className={styles.talkNoteView}>
      <header className={styles.header}>
        <button onClick={() => navigate('/talk-notes')} className={styles.backButton}>⬅️</button>
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
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced')
  const navigate = useNavigate()
  const debouncer = new Debouncer(500)

  useEffect(() => {
    debouncer.addStartListener(() => setSyncStatus('syncing...'))
    debouncer.addDoneListener(() => setSyncStatus('synced'))
    debouncer.addErrorListener(() => setSyncStatus('error'))

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
    setSyncStatus('not-synced')
    debouncer.debounce(async () => {
      try {
        await trpc.updateTalkNote.mutate({ id: note.id, content: newContent })
      } catch (error) {
        console.error('Error updating talk note:', error)
        setSyncStatus('error')
      }
    })
  }

  const handleSpeakerChange = (newSpeaker: string) => {
    if (!note) return

    setNote(prev => prev ? { ...prev, speaker: newSpeaker } : null)
    setSyncStatus('not-synced')
    debouncer.debounce(async () => {
      try {
        await trpc.updateTalkNote.mutate({ id: note.id, speaker: newSpeaker })
      } catch (error) {
        console.error('Error updating talk note:', error)
        setSyncStatus('error')
      }
    })
  }

  const handleTitleChange = (newTitle: string) => {
    if (!note) return

    setNote(prev => prev ? { ...prev, title: newTitle } : null)
    setSyncStatus('not-synced')
    debouncer.debounce(async () => {
      try {
        await trpc.updateTalkNote.mutate({ id: note.id, title: newTitle })
      } catch (error) {
        console.error('Error updating talk note title:', error)
        setSyncStatus('error')
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
    <div className={styles.talkNoteEdit}>
      <header className={styles.header}>
        <button onClick={() => navigate('/talk-notes')} className={styles.backButton}>⬅️</button>
        <h1>Editing Talk Note</h1>
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
        <button onClick={handleDelete} className={styles.deleteButton}>Delete Talk Note</button>
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