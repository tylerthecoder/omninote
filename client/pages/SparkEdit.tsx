import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trpc } from '../trpc';
import styles from './SparkEdit.module.css';
import { Editor } from '../editor/editor';

export function SparkEdit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSpark = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                const spark = await trpc.getSpark.query({ id });
                if (spark) {
                    setName(spark.name);
                    setNotes(spark.notes);
                }
            } catch (error) {
                console.error('Error fetching spark:', error);
                setError('Failed to fetch spark. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchSpark();
    }, [id]);

    const handleSave = async () => {
        if (!id) return;
        try {
            await trpc.updateSpark.mutate({
                id,
                name,
                notes
            });
            navigate('/sparks');
        } catch (error) {
            console.error('Error updating spark:', error);
            setError('Failed to update spark. Please try again.');
        }
    };

    if (isLoading) return <div className={styles.loadingMessage}>Loading...</div>;

    return (
        <div className="container">
            <h1>Edit Spark</h1>
            {error && <div className="error-message">{error}</div>}

            <div className={styles.editForm}>
                <div className={styles.formGroup}>
                    <label htmlFor="name">Name</label>
                    <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={styles.input}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="notes">Notes</label>
                    <Editor
                        text={notes}
                        onTextChange={setNotes}
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
                        onClick={() => navigate('/sparks')}
                        className="btn btn-danger"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}