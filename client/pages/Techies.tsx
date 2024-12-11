import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Route, Routes } from 'react-router-dom';
import { trpc } from '../trpc';
import { Editor } from '../editor/editor';
import { Debouncer, DebouncerStatus } from '../utils';
import type { Techie } from 'tt-services';

const debouncer = new Debouncer(500);

function TechiesList() {
    const [techies, setTechies] = useState<Techie[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchTechies();
    }, []);

    const fetchTechies = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedTechies = await trpc.getAllTechies.query();
            setTechies(fetchedTechies);
        } catch (error) {
            console.error('Error fetching techies:', error);
            setError('Failed to fetch tech projects. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateTechie = async () => {
        try {
            const newTechie = await trpc.createTechie.mutate({
                title: "New Project",
                content: "Start writing..."
            });
            navigate(`/techies/edit/${newTechie.id}`);
        } catch (error) {
            console.error('Error creating tech project:', error);
            setError('Failed to create tech project. Please try again.');
        }
    };

    const handleDeleteTechie = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this project?')) return;

        try {
            await trpc.deleteTechie.mutate({ id });
            setTechies(techies.filter(techie => techie.id !== id));
        } catch (error) {
            console.error('Error deleting tech project:', error);
            setError('Failed to delete tech project. Please try again.');
        }
    };

    if (isLoading) return <p>Loading...</p>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="container">
            <h1>Tech Projects</h1>
            {error && <div className="error-message">{error}</div>}

            <button onClick={handleCreateTechie} className="btn btn-primary">New Project</button>

            <ul className="list">
                {techies.map(techie => (
                    <li key={techie.id} className="card">
                        <div className="card-content">
                            <div className="flex justify-between items-center">
                                <span className="card-title">{techie.title}</span>
                                <div className="card-actions">
                                    <button onClick={() => navigate(`/techies/view/${techie.id}`)} className="btn btn-primary btn-sm">View</button>
                                    <button onClick={() => navigate(`/techies/edit/${techie.id}`)} className="btn btn-info btn-sm">Edit</button>
                                    <button onClick={() => handleDeleteTechie(techie.id)} className="btn btn-danger btn-sm">Delete</button>
                                </div>
                            </div>
                            {techie.url && (
                                <a href={techie.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                    {techie.url}
                                </a>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function TechieEdit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [techie, setTechie] = useState<Techie | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [syncStatus, setSyncStatus] = useState<DebouncerStatus>('synced');

    useEffect(() => {
        debouncer.addStatusChangeListener(setSyncStatus);

        const fetchTechie = async () => {
            try {
                const fetchedTechie = await trpc.getTechie.query({ id: id! });
                setTechie(fetchedTechie);
            } catch (error) {
                console.error('Error fetching tech project:', error);
                setError('Failed to fetch tech project. Please try again later.');
            }
        };

        fetchTechie();
        return () => debouncer.clear();
    }, [id]);

    const handleContentChange = (newContent: string) => {
        if (!techie) return;
        setTechie({ ...techie, content: newContent });
        debouncer.debounce('updateContent', async () => {
            try {
                await trpc.updateTechie.mutate({ id: techie.id, content: newContent });
            } catch (error) {
                console.error('Error updating tech project:', error);
                setError('Failed to update tech project. Please try again later.');
            }
        });
    };

    const handleTitleChange = (newTitle: string) => {
        if (!techie) return;
        setTechie({ ...techie, title: newTitle });
        debouncer.debounce('updateTitle', async () => {
            try {
                await trpc.updateTechie.mutate({ id: techie.id, title: newTitle });
            } catch (error) {
                console.error('Error updating tech project title:', error);
                setError('Failed to update tech project title. Please try again later.');
            }
        });
    };

    const handleUrlChange = (newUrl: string) => {
        if (!techie) return;
        setTechie({ ...techie, url: newUrl });
        debouncer.debounce('updateUrl', async () => {
            try {
                await trpc.updateTechie.mutate({
                    id: techie.id,
                    url: newUrl || undefined
                });
            } catch (error) {
                console.error('Error updating tech project URL:', error);
                setError('Failed to update tech project URL. Please try again later.');
            }
        });
    };

    if (!techie) return <p>Loading...</p>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="container">
            <header className="flex items-center gap-4 mb-4">
                <button onClick={() => navigate('/techies')} className="btn btn-nav">⬅️</button>
                <h1 className="flex-1">Edit Tech Project</h1>
            </header>

            <div className="flex-1 overflow-y-auto min-h-0 mb-4">
                <div className="items-center gap-4 mb-4 flex-shrink-0">
                    <div>
                        <label htmlFor="title">Title</label>
                        <input
                            id="title"
                            type="text"
                            value={techie.title}
                            onChange={(e) => handleTitleChange(e.target.value)}
                            className="p-2 border border-gray-300 rounded-md"
                        />
                    </div>

                    <div>
                        <label htmlFor="url">URL</label>
                        <input
                            id="url"
                            type="url"
                            value={techie.url || ''}
                            onChange={(e) => handleUrlChange(e.target.value)}
                            className="p-2 border border-gray-300 rounded-md"
                            placeholder="Project URL"
                        />
                    </div>
                </div>

                <div className="flex-1">
                    <Editor text={techie.content} onTextChange={handleContentChange} />
                </div>
                <p>Status: {syncStatus}</p>
            </div>
        </div>
    );
}

function TechieView() {
    const { id } = useParams<{ id: string }>();
    const [techie, setTechie] = useState<Techie | null>(null);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTechie = async () => {
            try {
                const fetchedTechie = await trpc.getTechie.query({ id: id! });
                setTechie(fetchedTechie);
            } catch (error) {
                console.error('Error fetching tech project:', error);
                setError('Failed to fetch tech project. Please try again later.');
            }
        };
        fetchTechie();
    }, [id]);

    if (!techie) return <p>Loading...</p>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="container">
            <div className="flex items-center gap-4 mb-4">
                <button onClick={() => navigate('/techies')} className="btn btn-nav">⬅️</button>
                <h1>{techie.title}</h1>
                {techie.url && (
                    <a href={techie.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        {techie.url}
                    </a>
                )}
                <button onClick={() => navigate(`/techies/edit/${techie.id}`)} className="btn btn-info">Edit</button>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 p-4">
                <div className="markdown-content">{techie.content}</div>
            </div>
        </div>
    );
}

export function TechiesRouter() {
    return (
        <Routes>
            <Route index element={<TechiesList />} />
            <Route path="view/:id" element={<TechieView />} />
            <Route path="edit/:id" element={<TechieEdit />} />
        </Routes>
    );
}