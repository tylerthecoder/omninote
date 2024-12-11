import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trpc } from '../trpc';
import { Editor } from '../editor/editor';

export function WeekendProjectEdit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProject = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                const project = await trpc.getWeekendProject.query({ id });
                if (project) {
                    setTitle(project.title);
                    setNotes(project.notes);
                }
            } catch (error) {
                console.error('Error fetching weekend project:', error);
                setError('Failed to fetch weekend project. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchProject();
    }, [id]);

    const handleSave = async () => {
        if (!id) return;
        try {
            await trpc.updateWeekendProject.mutate({
                id,
                title,
                notes
            });
            navigate('/weekend-projects');
        } catch (error) {
            console.error('Error updating weekend project:', error);
            setError('Failed to update weekend project. Please try again.');
        }
    };

    const handleDelete = async () => {
        if (!id) return;
        if (window.confirm('Are you sure you want to delete this weekend project?')) {
            try {
                await trpc.deleteWeekendProject.mutate({ id });
                navigate('/weekend-projects');
            } catch (error) {
                console.error('Error deleting weekend project:', error);
                setError('Failed to delete weekend project. Please try again.');
            }
        }
    };

    if (isLoading) {
        return <div className="loading-message">Loading...</div>;
    }

    return (
        <div className="container">
            <h1>Edit Weekend Project</h1>
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
                            onClick={() => navigate('/weekend-projects')}
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