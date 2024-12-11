import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trpc } from '../trpc';
import styles from './MovieEdit.module.css';
import { Editor } from '../editor/editor';

export function MovieEdit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [movie, setMovie] = useState({
        title: '',
        notes: '',
        genre: '',
        releaseYear: undefined as number | undefined,
        rating: undefined as number | undefined
    });
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchMovie = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                const fetchedMovie = await trpc.getMovie.query({ id });
                if (fetchedMovie) {
                    setMovie({
                        title: fetchedMovie.title,
                        notes: fetchedMovie.notes,
                        genre: fetchedMovie.genre || '',
                        releaseYear: fetchedMovie.releaseYear,
                        rating: fetchedMovie.rating
                    });
                }
            } catch (error) {
                console.error('Error fetching movie:', error);
                setError('Failed to fetch movie. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchMovie();
    }, [id]);

    const handleSave = async () => {
        if (!id) return;
        try {
            await trpc.updateMovie.mutate({
                id,
                ...movie
            });
            navigate('/movies');
        } catch (error) {
            console.error('Error updating movie:', error);
            setError('Failed to update movie. Please try again.');
        }
    };

    if (isLoading) return <div className={styles.loadingMessage}>Loading...</div>;

    return (
        <div className="container">
            <h1>Edit Movie</h1>
            {error && <div className="error-message">{error}</div>}

            <div className={styles.editForm}>
                <div className={styles.formGroup}>
                    <label htmlFor="title">Title</label>
                    <input
                        id="title"
                        type="text"
                        value={movie.title}
                        onChange={(e) => setMovie({ ...movie, title: e.target.value })}
                        className={styles.input}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="genre">Genre</label>
                    <input
                        id="genre"
                        type="text"
                        value={movie.genre}
                        onChange={(e) => setMovie({ ...movie, genre: e.target.value })}
                        className={styles.input}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="releaseYear">Release Year</label>
                    <input
                        id="releaseYear"
                        type="number"
                        value={movie.releaseYear || ''}
                        onChange={(e) => setMovie({ ...movie, releaseYear: parseInt(e.target.value) || undefined })}
                        className={styles.input}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="rating">Rating (1-5)</label>
                    <input
                        id="rating"
                        type="number"
                        min="1"
                        max="5"
                        value={movie.rating || ''}
                        onChange={(e) => setMovie({ ...movie, rating: parseInt(e.target.value) || undefined })}
                        className={styles.input}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="notes">Notes</label>
                    <Editor
                        text={movie.notes}
                        onTextChange={(text) => setMovie({ ...movie, notes: text })}
                    />
                </div>

                <div className={styles.buttonGroup}>
                    <button
                        onClick={handleSave}
                        className="btn btn-primary"
                    >
                        Save
                    </button>
                    <button
                        onClick={() => navigate('/movies')}
                        className="btn btn-danger"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}