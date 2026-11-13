import React, { useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit3,
  Plus,
  X,
  Flame,
  Repeat,
} from 'lucide-react';
import {
  Category,
  Priority,
  LIFE_AREAS,
  TodoItem,
  getTodayIsoDate,
} from '../utils/todoLogic';

interface TaskRowProps {
  todo: TodoItem;
  isFocused?: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (
    id: string,
    updates: Partial<
      Pick<
        TodoItem,
        | 'title'
        | 'notes'
        | 'priority'
        | 'category'
        | 'dueDate'
        | 'isRepeating'
        | 'streakCount'
      >
    >
  ) => void;
  onAddSubtask: (todoId: string, title: string) => void;
  onToggleSubtask: (todoId: string, subtaskId: string) => void;
  onDeleteSubtask: (todoId: string, subtaskId: string) => void;
}

const PRIORITY_TEXT: Record<Priority, { label: string; colorClass: string }> = {
  high: { label: 'High priority', colorClass: 'text-red-600 font-medium' },
  medium: { label: 'Medium priority', colorClass: 'text-amber-700' },
  low: { label: 'Low priority', colorClass: 'text-slate-500' },
};

export const TaskRow: React.FC<TaskRowProps> = ({
  todo,
  isFocused = false,
  onToggle,
  onDelete,
  onUpdate,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [editNotes, setEditNotes] = useState(todo.notes);
  const [editPriority, setEditPriority] = useState<Priority>(todo.priority);
  const [editCategory, setEditCategory] = useState<Category>(todo.category);
  const [editDueDate, setEditDueDate] = useState(todo.dueDate);
  const [editIsRepeating, setEditIsRepeating] = useState<boolean>(
    Boolean(todo.isRepeating)
  );
  const [editStreakCount, setEditStreakCount] = useState<number>(
    todo.streakCount ?? 0
  );
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const todayIso = getTodayIsoDate();
  const isOverdue = !todo.completed && todo.dueDate < todayIso;
  const isDueToday = todo.dueDate === todayIso;

  const completedSubtasks = todo.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = todo.subtasks.length;
  const streakCount = todo.streakCount ?? 0;

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;
    onUpdate(todo.id, {
      title: editTitle,
      notes: editNotes,
      priority: editPriority,
      category: editCategory,
      dueDate: editDueDate,
      isRepeating: editIsRepeating,
      streakCount: editIsRepeating ? Math.max(0, editStreakCount) : 0,
    });
    setIsEditing(false);
  };

  const handleSubtaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    onAddSubtask(todo.id, newSubtaskTitle);
    setNewSubtaskTitle('');
  };

  const priorityMeta = PRIORITY_TEXT[todo.priority];

  return (
    <div
      id={`task-row-${todo.id}`}
      className={`border-b border-slate-200/80 last:border-b-0 transition-colors ${
        todo.completed
          ? 'bg-slate-50/60'
          : isFocused
          ? 'bg-emerald-50/60'
          : 'bg-white hover:bg-slate-50/50'
      }`}
    >
      <div className="px-4 py-3.5 flex items-start gap-3.5">
        <button
          type="button"
          onClick={() => onToggle(todo.id)}
          aria-label={
            todo.completed
              ? `Mark "${todo.title}" as incomplete`
              : `Mark "${todo.title}" as completed`
          }
          className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
            todo.completed
              ? 'bg-emerald-600 border-emerald-600 text-white'
              : 'border-slate-300 hover:border-slate-500 bg-white'
          }`}
        >
          {todo.completed && (
            <Check className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="space-y-3 py-1">
              <div>
                <label htmlFor={`edit-title-${todo.id}`} className="sr-only">
                  Edit task title
                </label>
                <input
                  id={`edit-title-${todo.id}`}
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-sm font-medium text-slate-900 bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-slate-500"
                />
              </div>
              <div>
                <label htmlFor={`edit-notes-${todo.id}`} className="sr-only">
                  Edit task notes
                </label>
                <input
                  id={`edit-notes-${todo.id}`}
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Task notes..."
                  className="w-full text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-slate-400"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="Edit category"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as Category)}
                  className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1"
                >
                  {LIFE_AREAS.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Edit priority"
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as Priority)}
                  className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1"
                >
                  <option value="high">High priority</option>
                  <option value="medium">Medium priority</option>
                  <option value="low">Low priority</option>
                </select>
                <input
                  aria-label="Edit due date"
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="text-xs font-mono tabular-nums text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1"
                />
                <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsRepeating}
                    onChange={(e) => setEditIsRepeating(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600"
                  />
                  <span>Daily Repeat</span>
                </label>
                {editIsRepeating && (
                  <label className="inline-flex items-center gap-1 text-xs text-slate-700">
                    <span>Streak:</span>
                    <input
                      type="number"
                      min={0}
                      value={editStreakCount}
                      onChange={(e) =>
                        setEditStreakCount(Number(e.target.value) || 0)
                      }
                      className="w-14 text-xs font-mono tabular-nums text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1"
                    />
                  </label>
                )}
                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md"
                  >
                    Save
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-sm font-medium leading-snug break-words ${
                    todo.completed
                      ? 'line-through text-slate-400'
                      : 'text-slate-900'
                  }`}
                >
                  {todo.title}
                </span>

                {/* Daily Streak Badge for Repeating Tasks */}
                {todo.isRepeating && (
                  <span
                    data-testid={`streak-badge-${todo.id}`}
                    title={`Daily repeating task — ${streakCount} day streak`}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono tabular-nums font-semibold shrink-0 ${
                      streakCount > 0
                        ? 'bg-amber-50 text-amber-800 border border-amber-200/80'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {streakCount > 0 ? (
                      <Flame
                        className="w-3 h-3 text-amber-500 fill-amber-500"
                        aria-hidden="true"
                      />
                    ) : (
                      <Repeat
                        className="w-3 h-3 text-slate-500"
                        aria-hidden="true"
                      />
                    )}
                    <span>{streakCount}d streak</span>
                  </span>
                )}
              </div>

              {todo.notes && (
                <p
                  className={`mt-1 text-xs leading-relaxed ${
                    todo.completed ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  {todo.notes}
                </p>
              )}

              {/* Unboxed metadata with typographic separators */}
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                <span className="font-medium text-slate-700">
                  {todo.category}
                </span>
                <span aria-hidden="true">·</span>
                <span
                  className={
                    todo.completed ? 'text-slate-400' : priorityMeta.colorClass
                  }
                >
                  {priorityMeta.label}
                </span>
                <span aria-hidden="true">·</span>
                <span
                  className={`font-mono tabular-nums ${
                    isOverdue
                      ? 'text-red-600 font-medium'
                      : isDueToday && !todo.completed
                      ? 'text-slate-700 font-medium'
                      : 'text-slate-500'
                  }`}
                >
                  {isOverdue
                    ? `Overdue (${todo.dueDate})`
                    : isDueToday
                    ? 'Due Today'
                    : `Due ${todo.dueDate}`}
                </span>

                {totalSubtasks > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums text-slate-600">
                      {completedSubtasks}/{totalSubtasks} subtasks
                    </span>
                  </>
                )}

                {isFocused && !todo.completed && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-emerald-700">
                      Picked by Wheel
                    </span>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Action controls */}
        {!isEditing && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              aria-expanded={expanded}
              aria-label={
                expanded
                  ? `Hide checklist for "${todo.title}"`
                  : `Show checklist for "${todo.title}"`
              }
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4" aria-hidden="true" />
              ) : (
                <ChevronDown className="w-4 h-4" aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setEditTitle(todo.title);
                setEditNotes(todo.notes);
                setEditPriority(todo.priority);
                setEditCategory(todo.category);
                setEditDueDate(todo.dueDate);
                setEditIsRepeating(Boolean(todo.isRepeating));
                setEditStreakCount(todo.streakCount ?? 0);
                setIsEditing(true);
              }}
              aria-label={`Edit "${todo.title}"`}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <Edit3 className="w-4 h-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => onDelete(todo.id)}
              aria-label={`Delete "${todo.title}"`}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {/* Expandable Subtasks Drawer */}
      {expanded && (
        <div className="px-4 pb-3.5 pl-12 bg-slate-50/70 border-t border-slate-100">
          <div className="pt-2.5 space-y-2">
            <div className="text-xs font-medium text-slate-600">
              Subtasks & Checklist
            </div>

            {todo.subtasks.length > 0 ? (
              <ul className="space-y-1.5">
                {todo.subtasks.map((sub) => (
                  <li
                    key={sub.id}
                    className="flex items-center justify-between gap-2 text-xs py-1 group"
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={sub.completed}
                        onChange={() => onToggleSubtask(todo.id, sub.id)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span
                        className={
                          sub.completed
                            ? 'line-through text-slate-400'
                            : 'text-slate-700'
                        }
                      >
                        {sub.title}
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => onDeleteSubtask(todo.id, sub.id)}
                      aria-label={`Remove subtask "${sub.title}"`}
                      className="text-slate-400 hover:text-red-600 p-1 rounded"
                    >
                      <X className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400">
                No subtasks yet. Break this task into smaller steps below.
              </p>
            )}

            <form
              onSubmit={handleSubtaskSubmit}
              className="flex items-center gap-2 pt-1"
            >
              <label htmlFor={`new-subtask-${todo.id}`} className="sr-only">
                Add subtask
              </label>
              <input
                id={`new-subtask-${todo.id}`}
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Add a step..."
                className="flex-1 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-slate-400"
              />
              <button
                type="submit"
                className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Add Step</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
