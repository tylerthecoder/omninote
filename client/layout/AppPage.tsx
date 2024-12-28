import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'

interface AppPageProps {
  content: React.ReactNode
  title: string
  actions?: React.ReactNode
  showBack?: boolean
  backTo?: string
}

export function AppPage({ content, title, actions, showBack, backTo }: AppPageProps) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const mobileNavRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

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

  const NavLinks = () => (
    <>
      <li className="py-2"><Link to="/" className="font-bold text-gray-800 hover:text-red-600 transition-colors duration-300" onClick={() => setIsMenuOpen(false)}>Home</Link></li>
      <li className="py-2"><Link to="/today" className="font-bold text-gray-800 hover:text-red-600 transition-colors duration-300" onClick={() => setIsMenuOpen(false)}>Today</Link></li>
      <li className="py-2"><Link to="/past-days" className="font-bold text-gray-800 hover:text-red-600 transition-colors duration-300" onClick={() => setIsMenuOpen(false)}>Past Days</Link></li>
      <li className="py-2"><Link to="/todos" className="font-bold text-gray-800 hover:text-red-600 transition-colors duration-300" onClick={() => setIsMenuOpen(false)}>All Todos</Link></li>
      <li className="py-2"><Link to="/buy-list" className="font-bold text-gray-800 hover:text-red-600 transition-colors duration-300" onClick={() => setIsMenuOpen(false)}>Buy List</Link></li>
      <li className="py-2"><Link to="/talk-notes" className="font-bold text-gray-800 hover:text-red-600 transition-colors duration-300" onClick={() => setIsMenuOpen(false)}>Talk Notes</Link></li>
      <li className="py-2"><Link to="/reading-list" className="font-bold text-gray-800 hover:text-red-600 transition-colors duration-300" onClick={() => setIsMenuOpen(false)}>Reading List</Link></li>
      <li className="py-2"><Link to="/notes" className="font-bold text-gray-800 hover:text-red-600 transition-colors duration-300" onClick={() => setIsMenuOpen(false)}>Notes</Link></li>
      <li className="py-2"><Link to="/creations" className="font-bold text-gray-800 hover:text-red-600 transition-colors duration-300" onClick={() => setIsMenuOpen(false)}>Creations</Link></li>
      <li className="py-2"><Link to="/sparks" className="font-bold text-gray-800 hover:text-red-600 transition-colors duration-300" onClick={() => setIsMenuOpen(false)}>Sparks</Link></li>
      <li className="py-2"><Link to="/movies" className="font-bold text-gray-800 hover:text-red-600 transition-colors duration-300" onClick={() => setIsMenuOpen(false)}>Movies</Link></li>
      <li className="py-2"><Link to="/weekend-projects" className="font-bold text-gray-800 hover:text-red-600 transition-colors duration-300" onClick={() => setIsMenuOpen(false)}>Weekend Projects</Link></li>
      <li className="py-2"><Link to="/techies" className="font-bold text-gray-800 hover:text-red-600 transition-colors duration-300" onClick={() => setIsMenuOpen(false)}>Tech Projects</Link></li>
    </>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {isMobile ? (
        <header className="bg-yellow-300 shadow-sm fixed top-0 left-0 right-0 z-50">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-2xl text-gray-800 hover:text-red-600 transition-colors duration-300"
            >
              {isMenuOpen ? '✕' : '☰'}
            </button>
            <h1 className="text-xl font-semibold text-gray-900">TylerNote</h1>
          </div>
          {isMenuOpen && (
            <nav className="fixed inset-0 bg-yellow-300 z-40 pt-16" ref={mobileNavRef}>
              <ul className="px-4 py-2">
                <NavLinks />
              </ul>
            </nav>
          )}
        </header>
      ) : (
        <nav className="fixed top-0 left-0 h-full w-[150px] bg-yellow-300 shadow-lg border-r border-gray-200">
          <ul className="px-4 py-6">
            <NavLinks />
          </ul>
        </nav>
      )}
      <main className={`flex-1 overflow-auto ${isMobile ? 'pt-16 ml-0' : 'ml-[150px]'} p-6 min-h-screen`}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
              {showBack && (
                <button
                  onClick={() => backTo ? navigate(backTo) : navigate(-1)}
                  className="text-2xl text-gray-600 hover:text-gray-900 transition-colors"
                >
                  ←
                </button>
              )}
              <h1 className="text-2xl font-bold text-red-600">{title}</h1>
            </div>
            {actions && (
              <div className="flex items-center gap-2">
                {actions}
              </div>
            )}
          </div>
          {content}
        </div>
      </main>
    </div>
  )
}