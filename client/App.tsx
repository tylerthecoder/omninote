import React, { useState, useEffect, useRef } from 'react'
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom'
import styles from './App.module.css'
import { Today } from './pages/Today.tsx'
import { AllDays } from './pages/PastDays.tsx'
import { TodoList } from './pages/TodoList.tsx'
import { BuyList } from './pages/BuyList.tsx'
import { TalkNotesRouter } from './pages/TalkNotes.tsx'
import { ReadingListRouter } from './pages/ReadingList.tsx'
import { NotesRouter } from './pages/Notes.tsx'
import { CreationsRouter } from './creations/Creations.tsx'
import { Home } from './pages/Home.tsx'
import { SparksList } from './pages/Sparks.tsx'
import { SparkEdit } from './pages/SparkEdit.tsx'
import { MoviesList } from './pages/Movies.tsx'
import { MovieEdit } from './pages/MovieEdit.tsx'
import { WeekendProjectsList } from './pages/WeekendProjects.tsx'
import { WeekendProjectEdit } from './pages/WeekendProjectEdit.tsx'
import { TechiesRouter } from './pages/Techies.tsx'

function App() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const mobileNavRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (mobileNavRef.current && !mobileNavRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const NavLinks = () => (
    <>
      <li className={styles.navItem}><Link to="/" className={styles.navLink} onClick={() => setIsMenuOpen(false)}>Home</Link></li>
      <li className={styles.navItem}><Link to="/today" className={styles.navLink} onClick={() => setIsMenuOpen(false)}>Today</Link></li>
      <li className={styles.navItem}><Link to="/past-days" className={styles.navLink} onClick={() => setIsMenuOpen(false)}>Past Days</Link></li>
      <li className={styles.navItem}><Link to="/todos" className={styles.navLink} onClick={() => setIsMenuOpen(false)}>All Todos</Link></li>
      <li className={styles.navItem}><Link to="/buy-list" className={styles.navLink} onClick={() => setIsMenuOpen(false)}>Buy List</Link></li>
      <li className={styles.navItem}><Link to="/talk-notes" className={styles.navLink} onClick={() => setIsMenuOpen(false)}>Talk Notes</Link></li>
      <li className={styles.navItem}><Link to="/reading-list" className={styles.navLink} onClick={() => setIsMenuOpen(false)}>Reading List</Link></li>
      <li className={styles.navItem}>
        <Link to="/notes" className={styles.navLink} onClick={() => setIsMenuOpen(false)}>Notes</Link>
      </li>
      <li className={styles.navItem}>
        <Link to="/creations" className={styles.navLink} onClick={() => setIsMenuOpen(false)}>Creations</Link>
      </li>
      <li className={styles.navItem}>
        <Link to="/sparks" className={styles.navLink} onClick={() => setIsMenuOpen(false)}>Sparks</Link>
      </li>
      <li className={styles.navItem}>
        <Link to="/movies" className={styles.navLink} onClick={() => setIsMenuOpen(false)}>Movies</Link>
      </li>
      <li className={styles.navItem}>
        <Link to="/weekend-projects" className={styles.navLink} onClick={() => setIsMenuOpen(false)}>Weekend Projects</Link>
      </li>
      <li className={styles.navItem}>
        <Link to="/techies" className={styles.navLink} onClick={() => setIsMenuOpen(false)}>Tech Projects</Link>
      </li>
    </>
  )

  return (
    <Router>
      <div className={styles.root}>
        {isMobile ? (
          <header className={styles.mobileHeader}>
            <button onClick={toggleMenu} className={styles.menuButton}>
              {isMenuOpen ? '✕' : '☰'}
            </button>
            <h1 className={styles.mobileTitle}>TylerNote</h1>
            {isMenuOpen && (
              <nav className={styles.mobileNav} ref={mobileNavRef}>
                <ul className={styles.mobileNavList}>
                  <NavLinks />
                </ul>
              </nav>
            )}
          </header>
        ) : (
          <nav className={styles.sidebar}>
            <ul className={styles.sidebarList}>
              <NavLinks />
            </ul>
          </nav>
        )}
        <main className={styles.mainContent}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/today" element={<Today />} />
            <Route path="/past-days" element={<AllDays />} />
            <Route path="/todos" element={<TodoList />} />
            <Route path="/buy-list" element={<BuyList />} />
            <Route path="/talk-notes/*" element={<TalkNotesRouter />} />
            <Route path="/reading-list/*" element={<ReadingListRouter />} />
            <Route path="/notes/*" element={<NotesRouter />} />
            <Route path="/creations/*" element={<CreationsRouter />} />
            <Route path="/sparks" element={<SparksList />} />
            <Route path="/sparks/:id" element={<SparkEdit />} />
            <Route path="/movies" element={<MoviesList />} />
            <Route path="/movies/:id" element={<MovieEdit />} />
            <Route path="/weekend-projects" element={<WeekendProjectsList />} />
            <Route path="/weekend-projects/:id" element={<WeekendProjectEdit />} />
            <Route path="/techies/*" element={<TechiesRouter />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
