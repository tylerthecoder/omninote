import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trpc } from '../trpc';
import { Editor } from '../editor/editor';

export function TechieEdit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTechie = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                const techie = await trpc.getTechie.query({ id });
                if (techie) {
                    setTitle(techie.title);
                    setUrl(techie.url || '');
                    setNotes(techie.content);
                }
            } catch (error) {
                console.error('Error fetching tech project:', error);
                setError('Failed to fetch tech project. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchTechie();
    }, [id]);

    const handleSave = async () => {
        if (!id) return;
        try {
            await trpc.updateTechie.mutate({
                id,
                title,
                url: url || undefined,
                content: notes
            });
            navigate('/techies');
        } catch (error) {
            console.error('Error updating tech project:', error);
            setError('Failed to update tech project. Please try again.');
        }
    };

    const handleDelete = async () => {
        if (!id) return;
        if (window.confirm('Are you sure you want to delete this tech project?')) {
            try {
                await trpc.deleteTechie.mutate({ id });
                navigate('/techies');
            } catch (error) {
                console.error('Error deleting tech project:', error);
                setError('Failed to delete tech project. Please try again.');
            }
        }
    };

    if (isLoading) {
        return <div className="loading-message">Loading...</div>;
    }

    return (
        <div className="container">
            <h1>Edit Tech Project</h1>
            {error && <div className="error-message">{error}</div>}

            <div className="card">
                <div className="card-content">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="title-input"
                        placeholder="Project Title"
                    />

                    <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="input"
                        placeholder="Project URL"
                        style={{ marginTop: '1rem' }}
                    />

                    <div style={{ marginTop: '1rem' }}>
                        <label>Notes</label>
                        <Editor
                            text={notes}
                            onTextChange={setNotes}
                        />
                    </div>

                    <div className="btn-group" style={{ marginTop: '1rem' }}>
                        <button
                            onClick={handleSave}
                            className="btn btn-primary"
                        >
                            Save
                        </button>
                        <button
                            onClick={() => navigate('/techies')}
                            className="btn btn-info"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            className="btn btn-danger"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}