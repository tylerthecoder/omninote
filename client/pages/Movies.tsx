import { useState } from 'react'
import { useNavigate, useParams, Route, Routes } from 'react-router-dom'
import { trpc } from '../trpc'
import { Movie } from 'tt-services'
import { AppPage } from '../layout/AppPage'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { IoMdAdd, IoMdCreate, IoMdStar } from 'react-icons/io'
import { MemoizedEditor } from '../components/editor/editor'
import { Debouncer, DebouncerStatus } from '../utils'

const debouncer = new Debouncer(500)

function MoviesList() {
  const [newTitle, setNewTitle] = useState('')
  const [newGenre, setNewGenre] = useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: movies, isLoading, error } = useQuery({
    queryKey: ['movies'],
    queryFn: () => trpc.getAllMovies.query(),
  })

  const createMovieMutation = useMutation({
    mutationFn: (data: { title: string; genre: string }) =>
      trpc.createMovie.mutate({ ...data, notes: '', releaseYear: undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movies'] })
      setNewTitle('')
      setNewGenre('')
    },
  })

  const toggleWatchedMutation = useMutation({
    mutationFn: ({ id, watched }: { id: string; watched: boolean }) =>
      trpc.updateMovie.mutate({ id, watched }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movies'] })
    },
  })

  const handleAddMovie = (e: React.FormEvent) => {
    e.preventDefault()
    if (newTitle.trim()) {
      createMovieMutation.mutate({
        title: newTitle.trim(),
        genre: newGenre.trim(),
      })
    }
  }

  const unwatchedMovies = movies?.filter(movie => !movie.watched) || []
  const watchedMovies = movies?.filter(movie => movie.watched) || []

  const content = (
    <div className="space-y-6">
      <form onSubmit={handleAddMovie} className="space-y-3">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Movie title"
          className="w-full"
        />
        <div className="flex gap-2">
          <input
            type="text"
            value={newGenre}
            onChange={(e) => setNewGenre(e.target.value)}
            placeholder="Genre (optional)"
            className="flex-1"
          />
          <button
            type="submit"
            disabled={!newTitle.trim() || createMovieMutation.isPending}
            className="btn btn-primary flex items-center gap-2"
          >
            <IoMdAdd className="w-5 h-5" />
            Add Movie
          </button>
        </div>
      </form>

      {(error || createMovieMutation.error || toggleWatchedMutation.error) && (
        <div className="error-message">
          {error?.message ||
            createMovieMutation.error?.message ||
            toggleWatchedMutation.error?.message}
        </div>
      )}

      {isLoading ? (
        <div className="loading-message">Loading...</div>
      ) : (
        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">To Watch</h3>
            <div className="space-y-2">
              {unwatchedMovies.map(movie => (
                <div key={movie.id} className="bg-white shadow rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <input
                        type="checkbox"
                        checked={movie.watched}
                        onChange={() => toggleWatchedMutation.mutate({ id: movie.id, watched: !movie.watched })}
                        className="h-5 w-5 rounded border-gray-300"
                      />
                      <div>
                        <h4 className="font-medium">{movie.title}</h4>
                        {movie.genre && <p className="text-sm text-gray-600">{movie.genre}</p>}
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/movies/edit/${movie.id}`)}
                      className="btn btn-info btn-sm"
                    >
                      <IoMdCreate className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {watchedMovies.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Watched</h3>
              <div className="space-y-2">
                {watchedMovies.map(movie => (
                  <div key={movie.id} className="bg-white shadow rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <input
                          type="checkbox"
                          checked={movie.watched}
                          onChange={() => toggleWatchedMutation.mutate({ id: movie.id, watched: !movie.watched })}
                          className="h-5 w-5 rounded border-gray-300"
                        />
                        <div>
                          <h4 className="font-medium">{movie.title}</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            {movie.genre && <span>{movie.genre}</span>}
                            {movie.rating && (
                              <span className="flex items-center gap-1">
                                <IoMdStar className="w-4 h-4 text-yellow-500" />
                                {movie.rating}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/movies/edit/${movie.id}`)}
                        className="btn btn-info btn-sm"
                      >
                        <IoMdCreate className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )

  return <AppPage title="Movies" content={content} />
}

function MovieEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [syncStatus, setSyncStatus] = useState<DebouncerStatus>('synced')

  const { data: movie, error, isLoading } = useQuery({
    queryKey: ['movie', id],
    queryFn: () => trpc.getMovie.query({ id: id! }),
    enabled: !!id,
  })

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<Movie>) => {
      if (!id) throw new Error('Movie ID is required')
      setSyncStatus('syncing')
      return new Promise<void>((resolve, reject) => {
        debouncer.debounce('updateMovie', async () => {
          try {
            await trpc.updateMovie.mutate({ id, ...updates })
            setSyncStatus('synced')
            resolve()
          } catch (error) {
            setSyncStatus('error')
            reject(error)
          }
        })
      })
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ['movie', id] })
      const previousMovie = queryClient.getQueryData<Movie>(['movie', id])
      queryClient.setQueryData<Movie>(['movie', id], old => {
        if (!old) return old
        return { ...old, ...updates }
      })
      return { previousMovie }
    },
    onError: (err, updates, context) => {
      if (context?.previousMovie) {
        queryClient.setQueryData(['movie', id], context.previousMovie)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['movie', id] })
    }
  })

  const content = movie ? (
    <div className="space-y-6">
      {error && <div className="error-message">{error.message}</div>}

      <div className="bg-white shadow rounded-lg">
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <input
              type="text"
              value={movie.title}
              onChange={(e) => updateMutation.mutate({ title: e.target.value })}
              placeholder="Movie title"
              className="title-input"
            />
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Genre
                </label>
                <input
                  type="text"
                  value={movie.genre || ''}
                  onChange={(e) => updateMutation.mutate({ genre: e.target.value })}
                  placeholder="Genre"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Release Year
                </label>
                <input
                  type="number"
                  value={movie.releaseYear || ''}
                  onChange={(e) => updateMutation.mutate({ releaseYear: parseInt(e.target.value) || undefined })}
                  placeholder="Year"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Rating (1-5)
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={movie.rating || ''}
                  onChange={(e) => updateMutation.mutate({ rating: parseInt(e.target.value) || undefined })}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <MemoizedEditor
              initialText={movie.notes || ''}
              onTextChange={(text) => updateMutation.mutate({ notes: text })}
            />
          </div>

          <p className="text-sm text-gray-500 italic">
            Status: {syncStatus}
          </p>
        </div>
      </div>
    </div>
  ) : null

  if (error) return <AppPage title="Error" content={<div className="error-message">{error.message}</div>} />
  if (isLoading || !movie) return <AppPage title="Loading..." content={<div className="loading-message">Loading...</div>} />

  return (
    <AppPage
      title={`Edit: ${movie.title}`}
      content={content}
      showBack
      backTo="/movies"
    />
  )
}

export function MoviesRouter() {
  return (
    <Routes>
      <Route index element={<MoviesList />} />
      <Route path="edit/:id" element={<MovieEdit />} />
    </Routes>
  )
}