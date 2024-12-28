import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Daily } from './pages/Daily.tsx'
import { TodoList } from './pages/TodoList.tsx'
import { BuyList } from './pages/BuyList.tsx'
import { TalkNotesRouter } from './pages/TalkNotes.tsx'
import { ReadingListRouter } from './pages/ReadingList.tsx'
import { NotesRouter } from './pages/Notes.tsx'
import { Home } from './pages/Home.tsx'
import { SparksList } from './pages/Sparks.tsx'
import { MoviesRouter } from './pages/Movies.tsx'
import { TechiesRouter } from './pages/Techies.tsx'
import { Shortcuts } from './components/Shortcuts'
import { WeekendProjectsRouter } from './pages/WeekendProjects.tsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // Data is fresh for 1 minute
      retry: 2, // Retry failed requests twice
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnMount: true, // Refetch on component mount
    },
    mutations: {
      retry: 1, // Retry failed mutations once
      onError: (error) => {
        console.error('Mutation error:', error)
      },
    },
  },
})

function App() {
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsShortcutsOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Shortcuts
          isOpen={isShortcutsOpen}
          onClose={() => setIsShortcutsOpen(false)}
        />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/daily" element={<Daily />} />
          <Route path="/todos" element={<TodoList />} />
          <Route path="/buy-list" element={<BuyList />} />
          <Route path="/talk-notes/*" element={<TalkNotesRouter />} />
          <Route path="/reading-list/*" element={<ReadingListRouter />} />
          <Route path="/notes/*" element={<NotesRouter />} />
          <Route path="/sparks" element={<SparksList />} />
          <Route path="/movies/*" element={<MoviesRouter />} />
          <Route path="/weekend-projects/*" element={<WeekendProjectsRouter />} />
          <Route path="/techies/*" element={<TechiesRouter />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  )
}

export default App
