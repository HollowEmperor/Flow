import React, { useState } from 'react';
import { Plus, Calendar, Flag, Folder, AlignLeft, Repeat } from 'lucide-react';
import { Category, Priority, LIFE_AREAS, getTodayIsoDate } from '../utils/todoLogic';

interface QuickAddTaskProps {
  defaultCategory?: Category;
  onAdd: (params: {
    title: string;
    notes: string;
    priority: Priority;
    category: Category;
    dueDate: string;
    isRepeating: boolean;
  }) => void;
}

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'high', label: 'High Priority' },
  { value: 'medium', label: 'Medium Priority' },
  { value: 'low', label: 'Low Priority' },
];

export const QuickAddTask: React.FC<QuickAddTaskProps> = ({
  defaultCategory = 'Portfolio',
  onAdd,
}) => {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState<Category>(defaultCategory);
  const [dueDate, setDueDate] = useState<string>(getTodayIsoDate());
  const [isRepeating, setIsRepeating] = useState<boolean>(false);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a task title before adding.');
      return;
    }
    setError(null);
    onAdd({
      title,
      notes,
      priority,
      category,
      dueDate: dueDate || getTodayIsoDate(),
      isRepeating,
    });
    setTitle('');
    setNotes('');
    setPriority('medium');
    setIsRepeating(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-slate-200 rounded-xl p-4 transition-colors focus-within:border-slate-400"
      aria-label="Add new task"
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex-1 min-w-[200px] flex items-center gap-2">
          <Plus className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
          <label htmlFor="new-task-title" className="sr-only">
            Task title
          </label>
          <input
            id="new-task-title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Add a new task..."
            className="w-full text-sm text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-1.5 ml-auto">
          <button
            type="button"
            onClick={() => setIsRepeating((prev) => !prev)}
            aria-pressed={isRepeating}
            className={`px-2.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer ${
              isRepeating
                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{isRepeating ? 'Daily Repeat On' : 'Repeat'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDetails((prev) => !prev)}
            aria-expanded={showDetails}
            className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <AlignLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{showDetails ? 'Hide Options' : 'Options'}</span>
          </button>

          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Add Task
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-2 text-xs font-medium text-red-600">
          {error}
        </p>
      )}

      {showDetails && (
        <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label
              htmlFor="new-task-category"
              className="block text-xs font-medium text-slate-600 mb-1"
            >
              <span className="inline-flex items-center gap-1">
                <Folder className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                Life Area
              </span>
            </label>
            <select
              id="new-task-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-slate-400"
            >
              {LIFE_AREAS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="new-task-priority"
              className="block text-xs font-medium text-slate-600 mb-1"
            >
              <span className="inline-flex items-center gap-1">
                <Flag className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                Priority
              </span>
            </label>
            <select
              id="new-task-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-slate-400"
            >
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="new-task-due"
              className="block text-xs font-medium text-slate-600 mb-1"
            >
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                Due Date
              </span>
            </label>
            <input
              id="new-task-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full text-xs font-mono tabular-nums text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-slate-400"
            />
          </div>

          <div className="sm:col-span-3">
            <label
              htmlFor="new-task-notes"
              className="block text-xs font-medium text-slate-600 mb-1"
            >
              Notes (optional)
            </label>
            <input
              id="new-task-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add context, links, or acceptance criteria..."
              className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-400"
            />
          </div>
        </div>
      )}
    </form>
  );
};
