import React, { useState } from 'react';
import { Todo, Subtask } from '../types';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onGenerateSubtasks: (id: string, text: string) => void;
  onToggleSubtask: (todoId: string, subtaskId: string) => void;
  onToggleExpand: (id: string) => void;
}

const TodoItem: React.FC<TodoItemProps> = ({
  todo,
  onToggle,
  onDelete,
  onGenerateSubtasks,
  onToggleSubtask,
  onToggleExpand
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Calculate progress
  const totalItems = 1 + todo.subtasks.length;
  const completedItems = (todo.completed ? 1 : 0) + todo.subtasks.filter(s => s.completed).length;
  const progress = Math.round((completedItems / totalItems) * 100);

  return (
    <div 
      className={`group mb-3 rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md ${todo.completed ? 'opacity-75' : 'opacity-100'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Task Row */}
      <div className="flex items-center p-4">
        <button
          onClick={() => onToggle(todo.id)}
          className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200 ${
            todo.completed
              ? 'border-green-500 bg-green-500 text-white'
              : 'border-gray-300 hover:border-indigo-500'
          }`}
          aria-label={todo.completed ? "Mark as active" : "Mark as completed"}
        >
          {todo.completed && (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        <span 
          className={`ml-4 flex-grow text-lg transition-all duration-200 ${
            todo.completed ? 'text-gray-400 line-through' : 'text-gray-800'
          }`}
        >
          {todo.text}
        </span>

        <div className="flex items-center space-x-2">
           {/* Magic Break Down Button */}
           {todo.subtasks.length === 0 && !todo.completed && (
            <button
              onClick={() => onGenerateSubtasks(todo.id, todo.text)}
              disabled={todo.isGenerating}
              className={`flex items-center space-x-1 rounded-lg px-2 py-1 text-sm font-medium transition-colors ${
                todo.isGenerating 
                  ? 'cursor-wait bg-indigo-50 text-indigo-400' 
                  : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
              }`}
              title="AI Break Down"
            >
              {todo.isGenerating ? (
                 <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  <span className="hidden sm:inline">Break Down</span>
                </>
              )}
            </button>
          )}

          {/* Delete Button */}
          <button
            onClick={() => onDelete(todo.id)}
            className={`rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 ${isHovered ? 'opacity-100' : 'opacity-0'} transition-opacity`}
            aria-label="Delete task"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Subtasks Section */}
      {todo.subtasks.length > 0 && (
        <div className="bg-gray-50 px-4 pb-4 pt-0 rounded-b-xl border-t border-gray-100">
           {/* Progress Bar */}
           <div className="flex items-center py-2">
             <div className="h-1 flex-grow rounded-full bg-gray-200">
               <div 
                  className="h-1 rounded-full bg-green-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
               />
             </div>
             <span className="ml-2 text-xs font-medium text-gray-500">{progress}%</span>
           </div>

          <div className="mt-1 space-y-2">
            {todo.subtasks.map((subtask) => (
              <div key={subtask.id} className="flex items-start pl-2">
                <div className="relative flex h-5 items-center">
                  <input
                    id={`subtask-${subtask.id}`}
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    checked={subtask.completed}
                    onChange={() => onToggleSubtask(todo.id, subtask.id)}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label 
                    htmlFor={`subtask-${subtask.id}`} 
                    className={`font-medium ${subtask.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}
                  >
                    {subtask.text}
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TodoItem;