import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { trpc } from '../trpc';
import { WeekendProject } from 'tt-services';

export function WeekendProjectsList() {
    const [projects, setProjects] = useState<WeekendProject[]>([]);
    const [newProjectTitle, setNewProjectTitle] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchProjects = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedProjects = await trpc.getAllWeekendProjects.query();
            setProjects(fetchedProjects);
        } catch (error) {
            console.error('Error fetching weekend projects:', error);
            setError('Failed to fetch weekend projects. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newProjectTitle.trim()) {
            try {
                const newProject = await trpc.createWeekendProject.mutate({ title: newProjectTitle });
                setProjects([newProject, ...projects]);
                setNewProjectTitle('');
            } catch (error) {
                console.error('Error creating weekend project:', error);
                setError('Failed to create weekend project. Please try again.');
            }
        }
    };

    if (isLoading) {
        return <div className="loading-message">Loading...</div>;
    }

    return (
        <div className="container">
            <h1>Weekend Projects</h1>
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleCreateProject} className="input-container">
                <input
                    type="text"
                    value={newProjectTitle}
                    onChange={(e) => setNewProjectTitle(e.target.value)}
                    placeholder="Add a new weekend project"
                />
                <button type="submit" className="btn btn-primary">Add Project</button>
            </form>

            <ul className="list">
                {projects.map(project => (
                    <li key={project.id} className="card">
                        <div className="card-content">
                            <span className="card-title">{project.title}</span>
                            {project.notes && <p className="card-meta">{project.notes}</p>}
                        </div>
                        <div className="card-actions">
                            <Link
                                to={`/weekend-projects/${project.id}`}
                                className="btn btn-info"
                            >
                                Edit
                            </Link>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}