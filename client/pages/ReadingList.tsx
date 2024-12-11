import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Route, Routes } from 'react-router-dom';
import { trpc } from '../trpc';
import { Debouncer, DebouncerStatus } from '../utils';
import { Editor } from '../editor/editor';
import styles from './ReadingList.module.css';
import { ReadingListItem } from 'tt-services';

const debouncer = new Debouncer(500);

const prettySyncStatus = (status: DebouncerStatus) => {
  switch (status) {
    case 'not-synced':
      return 'Not synced';
    case 'synced':
      return 'Synced';
    case 'syncing':
      return 'Syncing...';
    case 'error':
      return 'Error';
  }
};

export function ReadingList() {
  const [items, setItems] = useState<ReadingListItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemUrl, setNewItemUrl] = useState('');
  const [newItemType, setNewItemType] = useState<'article' | 'book'>('article');
  const [editingItem, setEditingItem] = useState<ReadingListItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<DebouncerStatus>('synced');
  const navigate = useNavigate();

  useEffect(() => {
    debouncer.addStatusChangeListener((status) => {
      setSyncStatus(status);
    });

    fetchReadingList();

    return () => {
      debouncer.clear();
    };
  }, []);

  const fetchReadingList = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedItems = await trpc.getAllReadingListItems.query();
      setItems(fetchedItems);
    } catch (error) {
      console.error('Error fetching reading list:', error);
      setError('Failed to fetch reading list. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateItem = async () => {
    if (!newItemName.trim()) return;

    setError(null);
    try {
      const newItem = await trpc.createReadingListItem.mutate({
        name: newItemName.trim(),
        url: newItemUrl.trim() || undefined,
        type: newItemType,
      });
      setItems((prev) => [newItem, ...prev]);
      setNewItemName('');
      setNewItemUrl('');
      setNewItemType('article');
    } catch (error) {
      console.error('Error creating reading list item:', error);
      setError('Failed to create reading list item. Please try again later.');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await trpc.deleteReadingListItem.mutate({ id });
        setItems((prev) => prev.filter((item) => item.id !== id));
      } catch (error) {
        console.error('Error deleting reading list item:', error);
        setError('Failed to delete reading list item. Please try again later.');
      }
    }
  };

  const handleEditItem = (item: ReadingListItem) => {
    setEditingItem(item);
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;

    setError(null);
    try {
      const updatedItem = await trpc.updateReadingListItem.mutate({
        id: editingItem.id,
        name: editingItem.name.trim(),
        url: editingItem.url?.trim() || undefined,
        type: editingItem.type,
      });
      setItems((prev) => prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
      setEditingItem(null);
    } catch (error) {
      console.error('Error updating reading list item:', error);
      setError('Failed to update reading list item. Please try again later.');
    }
  };

  const handleOpenNotes = (item: ReadingListItem) => {
    navigate(`/reading-list/notes/${item.id}`);
  };

  if (isLoading) return <p>Loading...</p>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="container">
      <h1>Reading List</h1>
      {error && <div className="error-message">{error}</div>}
      <div className={styles.addItemForm}>
        <input
          type="text"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          placeholder="Item name"
          className={styles.input}
        />
        <input
          type="url"
          value={newItemUrl}
          onChange={(e) => setNewItemUrl(e.target.value)}
          placeholder="URL (optional)"
          className={styles.input}
        />
        <select
          value={newItemType}
          onChange={(e) => setNewItemType(e.target.value as 'article' | 'book')}
          className={styles.input}
        >
          <option value="article">Article</option>
          <option value="book">Book</option>
        </select>
        <button onClick={handleCreateItem} className="btn btn-primary">
          Add Item
        </button>
      </div>
      <ul className={styles.itemList}>
        {items.map((item) => (
          <li key={item.id} className={styles.item}>
            {editingItem && editingItem.id === item.id ? (
              <div className={styles.editItemForm}>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className={styles.input}
                />
                <input
                  type="url"
                  value={editingItem.url || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, url: e.target.value })}
                  className={styles.input}
                />
                <select
                  value={editingItem.type}
                  onChange={(e) => setEditingItem({ ...editingItem, type: e.target.value as 'article' | 'book' })}
                  className={styles.input}
                >
                  <option value="article">Article</option>
                  <option value="book">Book</option>
                </select>
                <button onClick={handleUpdateItem} className="btn btn-primary">
                  Update
                </button>
                <button onClick={() => setEditingItem(null)} className="btn btn-danger">
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <div className={styles.itemContent}>
                  <span className={styles.itemName}>{item.name}</span>
                  <span className={styles.itemType}>{item.type}</span>
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className={styles.itemUrl}>
                      Link
                    </a>
                  )}
                </div>
                <div className={styles.itemActions}>
                  <button onClick={() => handleEditItem(item)} className="btn btn-info">
                    Edit
                  </button>
                  <button onClick={() => handleOpenNotes(item)} className="btn btn-primary">
                    Notes
                  </button>
                  <button onClick={() => handleDeleteItem(item.id)} className="btn btn-danger">
                    Delete
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
      <p className={styles.syncStatus}>Status: {prettySyncStatus(syncStatus)}</p>
    </div>
  );
}

export function ReadingListNotes() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<ReadingListItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<DebouncerStatus>('synced');
  const navigate = useNavigate();

  useEffect(() => {
    debouncer.addStatusChangeListener((status) => {
      setSyncStatus(status);
    });

    const fetchItem = async () => {
      try {
        const fetchedItem = await trpc.getReadingListItem.query({ id: id! });
        setItem(fetchedItem);
      } catch (error) {
        console.error('Error fetching reading list item:', error);
        setError('Failed to fetch reading list item. Please try again later.');
      }
    };
    fetchItem();

    return () => {
      debouncer.clear();
    };
  }, [id]);

  const handleNotesChange = (newNotes: string) => {
    if (!item) return;

    setItem(prev => prev ? { ...prev, notes: newNotes } : null);
    debouncer.debounce('updateNotes', async () => {
      try {
        await trpc.updateReadingListItem.mutate({ id: item.id, notes: newNotes });
      } catch (error) {
        console.error('Error updating reading list item notes:', error);
        setError('Failed to update notes. Please try again later.');
      }
    });
  };

  if (error) return <div className="error-message">{error}</div>;
  if (!item) return <p>Loading...</p>;

  return (
    <div className="container">
      <header className={styles.header}>
        <button onClick={() => navigate('/reading-list')} className="btn btn-nav">⬅️</button>
        <h1>Notes: {item.name}</h1>
      </header>
      <Editor text={item.notes || ''} onTextChange={handleNotesChange} />
      <p className={styles.syncStatus}>Status: {prettySyncStatus(syncStatus)}</p>
    </div>
  );
}

export function ReadingListRouter() {
  return (
    <Routes>
      <Route index element={<ReadingList />} />
      <Route path="notes/:id" element={<ReadingListNotes />} />
    </Routes>
  );
}