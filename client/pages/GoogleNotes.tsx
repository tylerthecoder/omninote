import { useEffect, useState } from 'react'
import { useNavigate, useParams, Route, Routes, Navigate } from 'react-router-dom'
import { trpc } from '../trpc'
import ReactMarkdown from 'react-markdown'
import { GoogleNote } from 'tt-services'
import { AppPage } from '../layout/AppPage'
import { TagView } from '../components/TagView'
import { ItemList } from '../components/ItemList'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { IoMdAdd, IoMdEye, IoMdTrash, IoMdMegaphone, IoMdDocument, IoMdCalendar, IoMdOpen } from 'react-icons/io'
import { NoteDetails } from '../components/NoteDetails'

function GoogleNotesList() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: notes, isLoading, error } = useQuery({
    queryKey: ['google-notes'],
    queryFn: () => trpc.getAllGoogleNotes.query(),
  })

  const deleteNoteMutation = useMutation({
    mutationFn: (id: string) => {
      if (!window.confirm('Are you sure you want to delete this note?')) {
        throw new Error('Delete cancelled')
      }
      return trpc.deleteGoogleNote.mutate({ id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-notes'] })
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
                  onClick={() => navigate(`/google-notes/view/${note.id}`)}
                  className="btn btn-primary btn-sm"
                  aria-label="View note"
                >
                  <IoMdEye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => window.open(`https://docs.google.com/document/d/${note.googleDocId}`, '_blank')}
                  className="btn btn-info btn-sm"
                  aria-label="Open in Google Docs"
                >
                  <IoMdOpen className="w-4 h-4" />
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
      title="Google Notes"
      content={content}
      actions={
        <button
          onClick={() => navigate('/google-notes/new')}
          className="btn btn-primary flex items-center gap-2"
        >
          <IoMdAdd className="w-5 h-5" />
          New Google Note
        </button>
      }
    />
  )
}

function GoogleNoteView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  if (!id) return <AppPage title="Error" content={<div className="error-message">Note ID is required</div>} />

  const { data: note, error, isLoading } = useQuery({
    queryKey: ['google-note', id],
    queryFn: () => trpc.getGoogleNoteById.query({ id }),
  })

  const { data: content, isLoading: isContentLoading } = useQuery({
    queryKey: ['google-note-content', note?.googleDocId],
    queryFn: () => note?.googleDocId ? trpc.getGoogleDocContent.query({ googleDocId: note.googleDocId }) : null,
    enabled: !!note?.googleDocId,
  })

  if (error) return <AppPage title="Error" content={<div className="error-message">{error.message}</div>} />
  if (isLoading || !note) return <AppPage title="Loading..." content={<div className="loading-message">Loading...</div>} />

  const pageContent = (
    <div className="space-y-6">
      <NoteDetails noteId={id} />
      <div className="bg-white shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Content</h2>
          <button
            onClick={() => window.open(`https://docs.google.com/document/d/${note.googleDocId}`, '_blank')}
            className="btn btn-info flex items-center gap-2"
          >
            <IoMdOpen className="w-5 h-5" />
            Open in Google Docs
          </button>
        </div>
        {isContentLoading ? (
          <div className="loading-message">Loading content...</div>
        ) : (
          <div className="prose max-w-none">
            <ReactMarkdown>{content || ''}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <AppPage
      title={note.title}
      content={pageContent}
      showBack
      backTo="/google-notes"
      showSidebar={false}
    />
  )
}

function NewGoogleNote() {
  const [docId, setDocId] = useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const createNoteMutation = useMutation({
    mutationFn: (googleDocId: string) => trpc.createGoogleNote.mutate({ googleDocId }),
    onSuccess: (note) => {
      queryClient.invalidateQueries({ queryKey: ['google-notes'] })
      navigate(`/google-notes/view/${note.id}`)
    },
  })

  const content = (
    <div className="bg-white shadow p-6">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (docId) {
            createNoteMutation.mutate(docId)
          }
        }}
        className="space-y-4"
      >
        <div>
          <label htmlFor="docId" className="block text-sm font-medium text-gray-700">
            Google Doc ID
          </label>
          <input
            type="text"
            id="docId"
            value={docId}
            onChange={(e) => setDocId(e.target.value)}
            placeholder="Enter Google Doc ID"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
          <p className="mt-2 text-sm text-gray-500">
            You can find the Doc ID in the URL of your Google Doc:
            https://docs.google.com/document/d/<strong>document-id</strong>/edit
          </p>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!docId || createNoteMutation.isPending}
            className="btn btn-primary"
          >
            Create Note
          </button>
        </div>
      </form>
      {createNoteMutation.error && (
        <div className="mt-4 error-message">
          {createNoteMutation.error.message}
        </div>
      )}
    </div>
  )

  return (
    <AppPage
      title="New Google Note"
      content={content}
      showBack
      backTo="/google-notes"
      showSidebar={false}
    />
  )
}

export function GoogleNotesRouter() {
  return (
    <Routes>
      <Route index element={<GoogleNotesList />} />
      <Route path="view/:id" element={<GoogleNoteView />} />
      <Route path="new" element={<NewGoogleNote />} />
    </Routes>
  )
}