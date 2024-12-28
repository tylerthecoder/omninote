import { useState, useEffect } from 'react'
import { useNavigate, useParams, Route, Routes } from 'react-router-dom'
import { trpc } from '../trpc'
import { Editor } from '../editor/editor'
import { Debouncer, DebouncerStatus } from '../utils'
import ReactMarkdown from 'react-markdown'
import { TalkNote } from 'tt-services'
import { AppPage } from '../layout/AppPage'
import { ListCard } from '../components/ListCard'

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

  const content = (
    <>
      <div className="page-header">
        <h2 className="page-title">Talk Notes</h2>
        <button onClick={handleCreateNote} className="btn btn-primary">
          New Talk Note
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {isLoading ? (
        <div className="loading-message">Loading...</div>
      ) : (
        <div className="cards-grid">
          {talkNotes.map(note => (
            <ListCard
              key={note.id}
              title={note.title}
              meta={
                <div className="flex items-center gap-2">
                  <span>{new Date(note.date).toLocaleDateString()}</span>
                  <span>👤 {note.speaker}</span>
                </div>
              }
              actions={
                <>
                  <button onClick={() => navigate(`/talk-notes/view/${note.id}`)} className="btn btn-primary btn-sm">View</button>
                  <button onClick={() => navigate(`/talk-notes/edit/${note.id}`)} className="btn btn-info btn-sm">Edit</button>
                  <button onClick={() => handleDeleteNote(note.id)} className="btn btn-danger btn-sm">Delete</button>
                </>
              }
            />
          ))}
        </div>
      )}
    </>
  )

  return <AppPage title="Talk Notes" content={content} />
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

  const content = (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/talk-notes')} className="btn btn-nav">⬅️</button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{note?.title}</h2>
          <p className="text-gray-600">Speaker: {note?.speaker} | Date: {note?.date && new Date(note.date).toLocaleDateString()}</p>
        </div>
        <button onClick={() => navigate(`/talk-notes/edit/${id}`)} className="btn btn-info">
          Edit
        </button>
      </div>
      <div className="prose max-w-none">
        <ReactMarkdown>{note?.content || ''}</ReactMarkdown>
      </div>
    </div>
  )

  if (error) return <AppPage title="Error" content={<div className="error-message">{error}</div>} />
  if (!note) return <AppPage title="Loading..." content={<div className="loading-message">Loading...</div>} />

  return <AppPage title={note.title} content={content} />
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

  const content = (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/talk-notes')} className="btn btn-nav">⬅️</button>
        <input
          type="text"
          value={note?.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="title-input"
          placeholder="Talk title"
        />
      </div>
      <input
        type="text"
        value={note?.speaker}
        onChange={(e) => handleSpeakerChange(e.target.value)}
        placeholder="Speaker name"
        className="w-full px-4 py-2 border border-gray-300 rounded focus:border-yellow-400"
      />
      <Editor text={note?.content || ''} onTextChange={handleNoteChange} />
      <div className="flex justify-between items-center">
        <p className="sync-status">Status: {prettySyncStatus(syncStatus)}</p>
        <button onClick={handleDelete} className="btn btn-danger">Delete Talk Note</button>
      </div>
    </div>
  )

  if (error) return <AppPage title="Error" content={<div className="error-message">{error}</div>} />
  if (!note) return <AppPage title="Loading..." content={<div className="loading-message">Loading...</div>} />

  return <AppPage title="Edit Talk Note" content={content} />
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