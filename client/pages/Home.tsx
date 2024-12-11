import { Link } from 'react-router-dom'
import styles from './Home.module.css'

interface NavButton {
  to: string
  label: string
  icon: string
  description: string
}

export function Home() {
  const navigationButtons: NavButton[] = [
    {
      to: "/today",
      label: "Today",
      icon: "📅",
      description: "Plan and track your day"
    },
    {
      to: "/past-days",
      label: "Past Days",
      icon: "📚",
      description: "Review previous days"
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
    }
  ]

  return (
    <div className={styles.homeContainer}>
      <h1>TylerNote</h1>
      <div className={styles.buttonGrid}>
        {navigationButtons.map((button) => (
          <Link
            key={button.to}
            to={button.to}
            className={styles.navButton}
          >
            <span className={styles.icon}>{button.icon}</span>
            <span className={styles.label}>{button.label}</span>
            <span className={styles.description}>{button.description}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}