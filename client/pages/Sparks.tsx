import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { trpc } from '../trpc';
import { Spark } from 'tt-services';

export function SparksList() {
    const [sparks, setSparks] = useState<Spark[]>([]);
    const [newSparkName, setNewSparkName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchSparks = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedSparks = await trpc.getAllSparks.query();
            setSparks(fetchedSparks);
        } catch (error) {
            console.error('Error fetching sparks:', error);
            setError('Failed to fetch sparks. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSparks();
    }, []);

    const handleCreateSpark = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newSparkName.trim()) {
            try {
                const newSpark = await trpc.createSpark.mutate({ name: newSparkName });
                setSparks([newSpark, ...sparks]);
                setNewSparkName('');
            } catch (error) {
                console.error('Error creating spark:', error);
                setError('Failed to create spark. Please try again.');
            }
        }
    };

    const handleToggleSpark = async (spark: Spark) => {
        try {
            const updatedSpark = await trpc.updateSpark.mutate({
                id: spark.id,
                completed: !spark.completed
            });
            if (updatedSpark) {
                setSparks(sparks.map(s => s.id === updatedSpark.id ? updatedSpark : s));
            }
        } catch (error) {
            console.error('Error updating spark:', error);
            setError('Failed to update spark. Please try again.');
        }
    };

    const activeSparks = sparks.filter(spark => !spark.completed);
    const completedSparks = sparks.filter(spark => spark.completed);

    if (isLoading) {
        return <div className="loading-message">Loading...</div>;
    }

    return (
        <div className="container">
            <h1>Sparks</h1>
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleCreateSpark} className="input-container">
                <input
                    type="text"
                    value={newSparkName}
                    onChange={(e) => setNewSparkName(e.target.value)}
                    placeholder="Add a new spark"
                />
                <button type="submit" className="btn btn-primary">Add Spark</button>
            </form>

            <div>
                <h3>Active Sparks</h3>
                <ul className="list">
                    {activeSparks.map(spark => (
                        <li key={spark.id} className="card">
                            <div className="card-content">
                                <div className="checkbox-container">
                                    <input
                                        type="checkbox"
                                        checked={spark.completed}
                                        onChange={() => handleToggleSpark(spark)}
                                        className="checkbox"
                                    />
                                    <span className="card-title">{spark.name}</span>
                                </div>
                                {spark.notes && <p className="card-meta">{spark.notes}</p>}
                            </div>
                            <div className="card-actions">
                                <Link
                                    to={`/sparks/${spark.id}`}
                                    className="btn btn-info"
                                >
                                    Edit
                                </Link>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {completedSparks.length > 0 && (
                <div>
                    <h3>Completed Sparks</h3>
                    <ul className="list">
                        {completedSparks.map(spark => (
                            <li key={spark.id} className="card">
                                <div className="card-content">
                                    <div className="checkbox-container">
                                        <input
                                            type="checkbox"
                                            checked={spark.completed}
                                            onChange={() => handleToggleSpark(spark)}
                                            className="checkbox"
                                        />
                                        <span className="card-title">{spark.name}</span>
                                    </div>
                                    {spark.notes && <p className="card-meta">{spark.notes}</p>}
                                </div>
                                <div className="card-actions">
                                    <Link
                                        to={`/sparks/${spark.id}`}
                                        className="btn btn-info"
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