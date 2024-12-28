import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { IoMdCalendar, IoMdCheckmark, IoMdCart, IoMdChatbubbles, IoMdBook, IoMdDocument,
  IoMdBrush, IoMdBulb, IoMdFilm, IoMdHammer, IoMdLaptop, IoMdHome, IoMdMenu, IoMdArrowBack } from 'react-icons/io'

interface AppPageProps {
  title: string
  content: React.ReactNode
  actions?: React.ReactNode
  showBack?: boolean
  backTo?: string
}

export function AppPage({ title, content, actions, showBack, backTo }: AppPageProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const mobileNavRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileNavRef.current && !mobileNavRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const navigation = [
    {
      to: '/',
      label: 'Home',
      icon: <IoMdHome className="w-5 h-5" />,
    },
    {
      to: '/daily',
      label: 'Daily',
      icon: <IoMdCalendar className="w-5 h-5" />,
    },
    {
      to: '/todos',
      label: 'Todos',
      icon: <IoMdCheckmark className="w-5 h-5" />,
    },
    {
      to: '/buy-list',
      label: 'Buy List',
      icon: <IoMdCart className="w-5 h-5" />,
    },
    {
      to: '/talk-notes',
      label: 'Talk Notes',
      icon: <IoMdChatbubbles className="w-5 h-5" />,
    },
    {
      to: '/reading-list',
      label: 'Reading List',
      icon: <IoMdBook className="w-5 h-5" />,
    },
    {
      to: '/notes',
      label: 'Notes',
      icon: <IoMdDocument className="w-5 h-5" />,
    },
    {
      to: '/creations',
      label: 'Creations',
      icon: <IoMdBrush className="w-5 h-5" />,
    },
    {
      to: '/sparks',
      label: 'Sparks',
      icon: <IoMdBulb className="w-5 h-5" />,
    },
    {
      to: '/movies',
      label: 'Movies',
      icon: <IoMdFilm className="w-5 h-5" />,
    },
    {
      to: '/weekend-projects',
      label: 'Weekend Projects',
      icon: <IoMdHammer className="w-5 h-5" />,
    },
    {
      to: '/techies',
      label: 'Techies',
      icon: <IoMdLaptop className="w-5 h-5" />,
    }
  ]

  const NavLinks = () => (
    <>
      {navigation.map((item) => (
        <li key={item.to} className="py-2">
          <Link
            to={item.to}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 ${
              location.pathname === item.to || location.pathname.startsWith(item.to + '/')
                ? 'bg-yellow-400 text-gray-900'
                : 'text-gray-800 hover:bg-yellow-200'
            }`}
            onClick={() => setIsMenuOpen(false)}
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </Link>
        </li>
      ))}
    </>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-yellow-400 p-2 rounded-lg shadow-lg hover:bg-yellow-500 transition-colors duration-200"
      >
        <IoMdMenu className="w-6 h-6 text-gray-900" />
      </button>

      {/* Mobile navigation */}
      {isMenuOpen && (
        <div className="lg:hidden">
          <nav className="fixed inset-0 bg-yellow-300 z-40 pt-16" ref={mobileNavRef}>
            <ul className="px-4 py-2">
              <NavLinks />
            </ul>
          </nav>
        </div>
      )}

      {/* Desktop navigation */}
      <nav className="hidden lg:block fixed top-0 left-0 h-full w-64 bg-yellow-300 shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">TylerNote</h1>
          <ul className="space-y-1">
            <NavLinks />
          </ul>
        </div>
      </nav>

      {/* Main content */}
      <main className="lg:pl-64 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {showBack && (
                <button
                  onClick={() => backTo ? navigate(backTo) : navigate(-1)}
                  className="btn btn-ghost p-2 hover:bg-gray-100 rounded-lg"
                >
                  <IoMdArrowBack className="w-6 h-6" />
                </button>
              )}
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            </div>
            {actions && <div>{actions}</div>}
          </div>
          {content}
        </div>
      </main>
    </div>
  )
}