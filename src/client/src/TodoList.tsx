import { useState, useEffect } from 'react';
import { trpc } from './trpc';
import { Todo } from '../../types/types';

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodoText, setNewTodoText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTodos = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedTodos = await trpc.getAllTodos.query();
      setTodos(fetchedTodos);
    } catch (error) {
      console.error('Error fetching todos:', error);
      setError('Failed to fetch todos. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const handleAddTodo = async () => {
    if (newTodoText.trim()) {
      setError(null);
      try {
        const newTodo = await trpc.createTodo.mutate({ text: newTodoText, completed: false });
        setTodos([...todos, newTodo]);
        setNewTodoText('');
      } catch (error) {
        console.error('Error creating todo:', error);
        setError('Failed to create todo. Please try again.');
      }
    }
  };

  const handleToggleTodo = async (id: string, completed: boolean) => {
    setError(null);
    try {
      const updatedTodo = await trpc.updateTodo.mutate({ id, completed: !completed });
      setTodos(todos.map(todo => todo.id === id ? updatedTodo : todo));
    } catch (error) {
      console.error('Error updating todo:', error);
      setError('Failed to update todo. Please try again.');
    }
  };

  const handleDeleteTodo = async (id: string) => {
    setError(null);
    try {
      await trpc.deleteTodo.mutate({ id });
      setTodos(todos.filter(todo => todo.id !== id));
    } catch (error) {
      console.error('Error deleting todo:', error);
      setError('Failed to delete todo. Please try again.');
    }
  };

  return (
    <div>
      <h2>Todo List</h2>
      {error && <div className="error-message">{error}</div>}
      <input
        type="text"
        value={newTodoText}
        onChange={(e) => setNewTodoText(e.target.value)}
        placeholder="Add a new todo"
      />
      <button onClick={handleAddTodo}>Add Todo</button>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {todos.map(todo => (
            <li key={todo.id}>
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => handleToggleTodo(todo.id, todo.completed)}
              />
              <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
                {todo.text}
              </span>
              <button onClick={() => handleDeleteTodo(todo.id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}