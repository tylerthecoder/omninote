import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { trpc } from '../trpc';
import styles from './Movies.module.css';
import { Movie } from 'tt-services';

export function MoviesList() {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [newMovie, setNewMovie] = useState({ title: '', genre: '' });
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchMovies = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedMovies = await trpc.getAllMovies.query();
            setMovies(fetchedMovies);
        } catch (error) {
            console.error('Error fetching movies:', error);
            setError('Failed to fetch movies. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMovies();
    }, []);

    const handleCreateMovie = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newMovie.title.trim()) {
            try {
                const createdMovie = await trpc.createMovie.mutate({
                    title: newMovie.title,
                    notes: '',
                    genre: newMovie.genre,
                });
                setMovies([createdMovie, ...movies]);
                setNewMovie({ title: '', genre: '' });
            } catch (error) {
                console.error('Error creating movie:', error);
                setError('Failed to create movie. Please try again.');
            }
        }
    };

    const handleToggleWatched = async (movie: Movie) => {
        try {
            const updatedMovie = await trpc.updateMovie.mutate({
                id: movie.id,
                watched: !movie.watched
            });
            if (updatedMovie) {
                setMovies(movies.map(m => m.id === updatedMovie.id ? updatedMovie : m));
            }
        } catch (error) {
            console.error('Error updating movie:', error);
            setError('Failed to update movie. Please try again.');
        }
    };

    const unwatchedMovies = movies.filter(movie => !movie.watched);
    const watchedMovies = movies.filter(movie => movie.watched);

    if (isLoading) return <div className={styles.loadingMessage}>Loading...</div>;

    return (
        <div className="container">
            <h1>Movies to Watch</h1>
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleCreateMovie} className={styles.addForm}>
                <input
                    type="text"
                    value={newMovie.title}
                    onChange={(e) => setNewMovie({ ...newMovie, title: e.target.value })}
                    placeholder="Movie title"
                    className={styles.input}
                />
                <input
                    type="text"
                    value={newMovie.genre}
                    onChange={(e) => setNewMovie({ ...newMovie, genre: e.target.value })}
                    placeholder="Genre (optional)"
                    className={styles.input}
                />
                <button type="submit" className="btn btn-primary">Add Movie</button>
            </form>

            <div className={styles.moviesSection}>
                <h3>To Watch</h3>
                <ul className={styles.movieList}>
                    {unwatchedMovies.map(movie => (
                        <li key={movie.id} className={styles.movieItem}>
                            <input
                                type="checkbox"
                                checked={movie.watched}
                                onChange={() => handleToggleWatched(movie)}
                                className={styles.movieCheckbox}
                            />
                            <div className={styles.movieInfo}>
                                <span className={styles.movieTitle}>{movie.title}</span>
                                {movie.genre && <span className={styles.movieGenre}>{movie.genre}</span>}
                            </div>
                            <div className={styles.movieActions}>
                                <Link
                                    to={`/movies/${movie.id}`}
                                    className={styles.editButton}
                                >
                                    Edit
                                </Link>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {watchedMovies.length > 0 && (
                <div className={styles.moviesSection}>
                    <h3>Watched</h3>
                    <ul className={styles.movieList}>
                        {watchedMovies.map(movie => (
                            <li key={movie.id} className={styles.movieItem}>
                                <input
                                    type="checkbox"
                                    checked={movie.watched}
                                    onChange={() => handleToggleWatched(movie)}
                                    className={styles.movieCheckbox}
                                />
                                <div className={styles.movieInfo}>
                                    <span className={styles.movieTitle}>{movie.title}</span>
                                    {movie.genre && <span className={styles.movieGenre}>{movie.genre}</span>}
                                    {movie.rating && <span className={styles.movieRating}>★ {movie.rating}</span>}
                                </div>
                                <div className={styles.movieActions}>
                                    <Link
                                        to={`/movies/${movie.id}`}
                                        className={styles.editButton}
                                    >
                                        Edit
                                    </Link>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}