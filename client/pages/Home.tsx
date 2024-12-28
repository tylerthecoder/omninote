import { Link } from 'react-router-dom'

interface NavButton {
  to: string
  label: string
  icon: string
  description: string
}

export function Home() {
  const navigationButtons: NavButton[] = [
    {
      to: "/daily",
      label: "Daily",
      icon: "📅",
      description: "Plan your day and review past days"
    },
    {
      to: "/todos",
      label: "All Todos",
      icon: "✓",
      description: "Manage your tasks"
    },
    {
      to: "/buy-list",
      label: "Buy List",
      icon: "🛒",
      description: "Track items to purchase"
    },
    {
      to: "/talk-notes",
      label: "Talk Notes",
      icon: "💭",
      description: "Notes from conversations"
    },
    {
      to: "/reading-list",
      label: "Reading List",
      icon: "📖",
      description: "Track your reading"
    },
    {
      to: "/notes",
      label: "Notes",
      icon: "📝",
      description: "General notes"
    },
    {
      to: "/creations",
      label: "Creations",
      icon: "🎨",
      description: "Your creative projects"
    },
    {
      to: "/sparks",
      label: "Sparks",
      icon: "💡",
      description: "Quick ideas and things to explore"
    },
    {
      to: "/movies",
      label: "Movies",
      icon: "🎬",
      description: "Movies to watch and reviews"
    },
    {
      to: "/weekend-projects",
      label: "Weekend Projects",
      icon: "🔨",
      description: "Weekend project ideas and tracking"
    },
    {
      to: "/techies",
      label: "Techies",
      icon: "💻",
      description: "Tech people to follow and learn from"
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-12 text-gray-800">TylerNote</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {navigationButtons.map((button) => (
            <Link
              key={button.to}
              to={button.to}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col items-center text-center group"
            >
              <span className="text-4xl mb-4 transform group-hover:scale-110 transition-transform duration-200">
                {button.icon}
              </span>
              <span className="text-lg font-semibold text-gray-800 mb-2">
                {button.label}
              </span>
              <span className="text-sm text-gray-600">
                {button.description}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}