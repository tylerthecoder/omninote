import React, { useState, useEffect } from 'react';
import { trpc } from '../trpc';
import styles from './BuyList.module.css';
import { BuyListItem } from 'tt-services';

export function BuyList() {
  const [items, setItems] = useState<BuyListItem[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const [editingItem, setEditingItem] = useState<BuyListItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBuyListItems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedItems = await trpc.getAllBuyListItems.query();
      setItems(fetchedItems as BuyListItem[]);
    } catch (error) {
      console.error('Error fetching buy list items:', error);
      setError('Failed to fetch buy list items. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBuyListItems();
  }, []);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemText.trim()) {
      try {
        const newItem = await trpc.createBuyListItem.mutate({
          text: newItemText,
          completed: false,
        });
        setItems([...items, newItem]);
        setNewItemText('');
      } catch (error) {
        console.error('Error creating buy list item:', error);
        setError('Failed to create buy list item. Please try again.');
      }
    }
  };

  const handleUpdateItem = async (item: BuyListItem) => {
    try {
      const updatedItem = await trpc.updateBuyListItem.mutate(item);
      setItems(items.map(i => i.id === updatedItem.id ? updatedItem : i));
      setEditingItem(null);
    } catch (error) {
      console.error('Error updating buy list item:', error);
      setError('Failed to update buy list item. Please try again.');
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await trpc.deleteBuyListItem.mutate({ id });
      setItems(items.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting buy list item:', error);
      setError('Failed to delete buy list item. Please try again.');
    }
  };

  if (isLoading) {
    return <div className={styles.loadingMessage}>Loading...</div>;
  }

  return (
    <div className="container">
      <h1>Buy List</h1>
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleCreateItem} className="input-container">
        <input
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          placeholder="Add new item"
        />
        <button type="submit" className="btn btn-primary">Add</button>
      </form>

      <ul className="list">
        {items.map(item => (
          <li key={item.id} className="card">
            {editingItem?.id === item.id ? (
              <form onSubmit={(e) => { e.preventDefault(); handleUpdateItem(editingItem); }} className="card-content">
                <input
                  type="text"
                  value={editingItem.text}
                  onChange={(e) => setEditingItem({ ...editingItem, text: e.target.value })}
                />
                <input
                  type="text"
                  value={editingItem.url || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, url: e.target.value })}
                  placeholder="URL"
                />
                <textarea
                  value={editingItem.notes || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                  placeholder="Notes"
                />
                <div className="btn-group">
                  <button type="submit" className="btn btn-info">Save</button>
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="btn btn-danger"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="card-content">
                  <div className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => handleUpdateItem({ ...item, completed: !item.completed })}
                      className="checkbox"
                    />
                    <span className="card-title" style={{ textDecoration: item.completed ? 'line-through' : 'none' }}>
                      {item.text}
                    </span>
                  </div>
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="card-link">
                      View Link
                    </a>
                  )}
                  {item.notes && <p className="card-meta">{item.notes}</p>}
                </div>
                <div className="card-actions">
                  <button
                    onClick={() => setEditingItem(item)}
                    className="btn btn-info"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="btn btn-danger"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}