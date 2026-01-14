import React, { useState, useEffect, useCallback } from 'react';
import { Todo, FilterType, Subtask } from './types';
import TodoItem from './components/TodoItem';
import { generateSubtasks } from './services/geminiService';

const App: React.FC = () => {
  // State
  const [todos, setTodos] = useState<Todo[]>(() => {
    const saved = localStorage.getItem('gemini-todos');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [inputText, setInputText] = useState('');
  const [filter, setFilter] = useState<FilterType>(FilterType.ALL);
  const [error, setError] = useState<string | null>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('gemini-todos', JSON.stringify(todos));
  }, [todos]);

  // Handlers
  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text: inputText.trim(),
      completed: false,
      isExpanded: false,
      subtasks: [],
    };

    setTodos(prev => [newTodo, ...prev]);
    setInputText('');
  };

  const handleToggleTodo = (id: string) => {
    setTodos(prev => prev.map(todo => {
      if (todo.id === id) {
        const newCompleted = !todo.completed;
        // If marking complete, also mark all subtasks complete
        // If marking incomplete, leave subtasks as is (user preference usually)
        const newSubtasks = newCompleted 
            ? todo.subtasks.map(s => ({ ...s, completed: true })) 
            : todo.subtasks;
            
        return { ...todo, completed: newCompleted, subtasks: newSubtasks };
      }
      return todo;
    }));
  };

  const handleDeleteTodo = (id: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  };

  const handleToggleSubtask = (todoId: string, subtaskId: string) => {
    setTodos(prev => prev.map(todo => {
      if (todo.id !== todoId) return todo;

      const newSubtasks = todo.subtasks.map(s => 
        s.id === subtaskId ? { ...s, completed: !s.completed } : s
      );

      // Check if all subtasks are complete to auto-complete parent (optional UX choice)
      const allSubComplete = newSubtasks.every(s => s.completed);
      
      return { 
        ...todo, 
        subtasks: newSubtasks,
        completed: allSubComplete && newSubtasks.length > 0
      };
    }));
  };

  const handleExpand = (id: string) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, isExpanded: !t.isExpanded } : t));
  };

  const handleGenerateSubtasks = useCallback(async (id: string, text: string) => {
    // Optimistic update: set generating state
    setTodos(prev => prev.map(t => t.id === id ? { ...t, isGenerating: true } : t));
    setError(null);

    try {
      const subtaskTexts = await generateSubtasks(text);
      
      const newSubtasks: Subtask[] = subtaskTexts.map(st => ({
        id: crypto.randomUUID(),
        text: st,
        completed: false
      }));

      setTodos(prev => prev.map(t => {
        if (t.id !== id) return t;
        return {
          ...t,
          isGenerating: false,
          isExpanded: true,
          subtasks: newSubtasks
        };
      }));

    } catch (err) {
      console.error(err);
      setError("Failed to generate subtasks. Please try again or check your API key.");
      setTodos(prev => prev.map(t => t.id === id ? { ...t, isGenerating: false } : t));
    }
  }, []);

  const handleClearCompleted = () => {
    setTodos(prev => prev.filter(t => !t.completed));
  };

  // Filtering
  const filteredTodos = todos.filter(todo => {
    if (filter === FilterType.ACTIVE) return !todo.completed;
    if (filter === FilterType.COMPLETED) return todo.completed;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Tasks<span className="text-indigo-600">.ai</span>
          </h1>
          <p className="mt-2 text-gray-600">
            Smart task management powered by Gemini
          </p>
        </header>

        {/* Input Card */}
        <div className="mb-6 rounded-2xl bg-white p-2 shadow-lg ring-1 ring-gray-900/5 sm:p-4">
          <form onSubmit={handleAddTodo} className="relative flex items-center">
            <input
              type="text"
              name="todo"
              id="todo"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="block w-full rounded-xl border-0 bg-gray-50 py-4 pl-4 pr-14 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-lg sm:leading-6"
              placeholder="What needs to be done?"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="absolute right-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </form>
        </div>

        {/* Error Toast */}
        {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-700 border border-red-200 flex justify-between items-center">
                <span>{error}</span>
                <button onClick={() => setError(null)} className="font-bold">&times;</button>
            </div>
        )}

        {/* Controls */}
        <div className="mb-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex space-x-1 rounded-lg bg-gray-200 p-1">
            {[FilterType.ALL, FilterType.ACTIVE, FilterType.COMPLETED].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
                  filter === f
                    ? 'bg-white text-gray-900 shadow'
                    : 'text-gray-600 hover:bg-gray-200/50 hover:text-gray-900'
                }`}
              >
                {f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          
          <div className="text-sm text-gray-500">
             {todos.filter(t => !t.completed).length} items left
          </div>
        </div>

        {/* List */}
        <div className="space-y-1">
          {filteredTodos.length > 0 ? (
            filteredTodos.map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={handleToggleTodo}
                onDelete={handleDeleteTodo}
                onGenerateSubtasks={handleGenerateSubtasks}
                onToggleSubtask={handleToggleSubtask}
                onToggleExpand={handleExpand}
              />
            ))
          ) : (
             <div className="mt-12 text-center">
                <div className="mx-auto mb-4 h-24 w-24 text-gray-200">
                    <svg fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 3H5c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2h14c1.103 0 2-.897 2-2V5c0-1.103-.897-2-2-2zm-5 14H5v-2h9v2zm5-4H5v-2h14v2zm0-4h-9V7h9v2z"/>
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">No tasks found</h3>
                <p className="mt-1 text-gray-500">
                   {filter === FilterType.COMPLETED ? "Start completing tasks to see them here!" : "Add a new task to get started."}
                </p>
             </div>
          )}
        </div>

         {/* Footer */}
         {todos.some(t => t.completed) && (
            <div className="mt-8 flex justify-center">
                <button 
                    onClick={handleClearCompleted}
                    className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
                >
                    Clear completed tasks
                </button>
            </div>
         )}
      </div>
    </div>
  );
};

export default App;