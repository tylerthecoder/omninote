import { useState, useEffect } from 'react'
import { useNavigate, useParams, Route, Routes } from 'react-router-dom'
import { trpc } from '../trpc'
import { Debouncer, DebouncerStatus } from '../utils'
import styles from './Creations.module.css'
import { Creation } from 'tt-services'

const debouncer = new Debouncer(500)

export function CreationsList() {
  const [creations, setCreations] = useState<Creation[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchCreations()
  }, [])

  const fetchCreations = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const fetchedCreations = await trpc.getAllCreations.query()
      setCreations(fetchedCreations)
    } catch (error) {
      console.error('Error fetching creations:', error)
      setError('Failed to fetch creations. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateCreation = async () => {
    setError(null)
    try {
      const newCreation = await trpc.createCreation.mutate({
        name: "New Creation",
        description: "Start writing your description here...",
        link: "",
        type: "web",
        img: ""
      })
      navigate(`/creations/edit/${newCreation.id}`)
    } catch (error) {
      console.error('Error creating creation:', error)
      setError('Failed to create creation. Please try again later.')
    }
  }

  const handleDeleteCreation = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this creation?')) {
      try {
        await trpc.deleteCreation.mutate({ id })
        setCreations(prevCreations => prevCreations.filter(creation => creation.id !== id))
      } catch (error) {
        console.error('Error deleting creation:', error)
        setError('Failed to delete creation. Please try again later.')
      }
    }
  }

  const handlePublishToggle = async (id: string, currentlyPublished: boolean) => {
    try {
      if (currentlyPublished) {
        await trpc.unpublishCreation.mutate({ id })
      } else {
        await trpc.publishCreation.mutate({ id })
      }
      // Refresh the list after publishing/unpublishing
      fetchCreations()
    } catch (error) {
      console.error('Error toggling publish status:', error)
      setError('Failed to update publish status. Please try again later.')
    }
  }

  if (isLoading) return <p>Loading...</p>
  if (error) return <div className="error-message">{error}</div>

  return (
    <div className={styles.creationsList}>
      <h1>Creations</h1>
      <div className={styles.creationsGrid}>
        {creations.map(creation => (
          <div key={creation.id} className={styles.creationItem}>
            {creation.img && (
              <img src={creation.img} alt={creation.name} className={styles.creationImage} />
            )}
            <h3>{creation.name}</h3>
            <p>{creation.description}</p>
            <div className={styles.creationMeta}>
              <span className={creation.published ? styles.publishedBadge : styles.unpublishedBadge}>
                {creation.published ? 'Published' : 'Draft'}
              </span>
            </div>
            <div className={styles.creationActions}>
              <button onClick={() => navigate(`/creations/view/${creation.id}`)} className="btn btn-primary">View</button>
              <button onClick={() => navigate(`/creations/edit/${creation.id}`)} className="btn btn-info">Edit</button>
              <button
                onClick={() => handlePublishToggle(creation.id, creation.published)}
                className={`btn ${creation.published ? 'btn-warning' : 'btn-primary'}`}
              >
                {creation.published ? 'Unpublish' : 'Publish'}
              </button>
              <button onClick={() => handleDeleteCreation(creation.id)} className="btn btn-danger">Delete</button>
            </div>
          </div>
        ))}
      </div>
      <div className={styles.actionButtons}>
        <button onClick={handleCreateCreation} className="btn btn-primary">New Creation</button>
      </div>
    </div>
  )
}

export function CreationView() {
  const { id } = useParams<{ id: string }>()
  const [creation, setCreation] = useState<Creation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchCreation = async () => {
      try {
        const fetchedCreation = await trpc.getCreation.query({ id: id! })
        setCreation(fetchedCreation)
      } catch (error) {
        console.error('Error fetching creation:', error)
        setError('Failed to fetch creation. Please try again later.')
      }
    }
    fetchCreation()
  }, [id])

  if (error) return <div className="error-message">{error}</div>
  if (!creation) return <p>Loading...</p>

  return (
    <div className={styles.creationView}>
      <header className={styles.header}>
        <button onClick={() => navigate('/creations')} className="btn btn-nav">⬅️</button>
        <h1>{creation.name}</h1>
      </header>
      <div className={styles.creationContent}>
        {creation.img && (
          <img src={creation.img} alt={creation.name} className={styles.creationImage} />
        )}
        <p>{creation.description}</p>
        {creation.link && (
          <a href={creation.link} target="_blank" rel="noopener noreferrer" className={styles.creationLink}>
            View Project
          </a>
        )}
      </div>
    </div>
  )
}

export function CreationEdit() {
  const { id } = useParams<{ id: string }>()
  const [creation, setCreation] = useState<Creation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<DebouncerStatus>('synced')
  const navigate = useNavigate()

  useEffect(() => {
    debouncer.addStatusChangeListener((status) => {
      setSyncStatus(status)
    })

    const fetchCreation = async () => {
      try {
        const fetchedCreation = await trpc.getCreation.query({ id: id! })
        setCreation(fetchedCreation)
      } catch (error) {
        console.error('Error fetching creation:', error)
        setError('Failed to fetch creation. Please try again later.')
      }
    }
    fetchCreation()

    return () => {
      debouncer.clear()
    }
  }, [id])

  const handleUpdate = (field: keyof Creation, value: string) => {
    if (!creation) return

    setCreation(prev => prev ? { ...prev, [field]: value } : null)
    debouncer.debounce(`update${field}`, async () => {
      try {
        await trpc.updateCreation.mutate({ id: creation.id, [field]: value })
      } catch (error) {
        console.error(`Error updating creation ${field}:`, error)
        setError(`Failed to update creation ${field}. Please try again later.`)
      }
    })
  }

  const handlePublishToggle = async () => {
    if (!creation) return

    try {
      if (creation.published) {
        await trpc.unpublishCreation.mutate({ id: creation.id })
        setCreation(prev => prev ? { ...prev, published: false } : null)
      } else {
        await trpc.publishCreation.mutate({ id: creation.id })
        setCreation(prev => prev ? { ...prev, published: true } : null)
      }
    } catch (error) {
      console.error('Error toggling publish status:', error)
      setError('Failed to update publish status. Please try again later.')
    }
  }

  if (error) return <div className="error-message">{error}</div>
  if (!creation) return <p>Loading...</p>

  return (
    <div className={styles.creationEdit}>
      <header className={styles.header}>
        <button onClick={() => navigate('/creations')} className="btn btn-nav">⬅️</button>
        <h1>Edit Creation</h1>
        <div className={styles.headerActions}>
          <button
            onClick={handlePublishToggle}
            className={`btn ${creation.published ? 'btn-warning' : 'btn-primary'}`}
          >
            {creation.published ? 'Unpublish' : 'Publish'}
          </button>
        </div>
      </header>
      <div className={styles.creationForm}>
        <input
          type="text"
          value={creation.name}
          onChange={(e) => handleUpdate('name', e.target.value)}
          placeholder="Creation name"
          className={styles.input}
        />
        <input
          type="text"
          value={creation.link}
          onChange={(e) => handleUpdate('link', e.target.value)}
          placeholder="Project link"
          className={styles.input}
        />
        <input
          type="text"
          value={creation.img}
          onChange={(e) => handleUpdate('img', e.target.value)}
          placeholder="Image URL"
          className={styles.input}
        />
        <textarea
          value={creation.description}
          onChange={(e) => handleUpdate('description', e.target.value)}
          placeholder="Description"
          className={styles.textarea}
        />
        <p className={styles.syncStatus}>Status: {syncStatus}</p>
      </div>
    </div>
  )
}

export function CreationsRouter() {
  return (
    <Routes>
      <Route index element={<CreationsList />} />
      <Route path="view/:id" element={<CreationView />} />
      <Route path="edit/:id" element={<CreationEdit />} />
    </Routes>
  )
}
