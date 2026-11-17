import React, { useState, useEffect } from 'react';
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
  GripVertical,
  Clock,
  Ticket,
  HelpCircle,
} from 'lucide-react';
import {
  Category,
  Priority,
  LIFE_AREAS,
  TodoItem,
  HOURLY_DRAG_MIME_TYPE,
  formatHourSlotLabel,
  getTaskDaysDoneCount,
  doesTaskQualifyForPunchCard,
  getTodayIsoDate,
} from '../utils/todoLogic';
import {
  DailySpecificTaskPromptData,
  DEFAULT_DAILY_SPECIFIC_TASK_PROMPT,
} from '../utils/promptQuestionsData';

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
  onPunchTaskDay?: (todoId: string) => void;
  onOpenBingoPunchCards?: () => void;
  onDragStartTask?: (todoId: string) => void;
  onDragEndTask?: () => void;
}

const PRIORITY_TEXT: Record<Priority, { label: string; colorClass: string }> = {
  high: { label: 'High priority', colorClass: 'text-purple-700 font-semibold' },
  medium: { label: 'Medium priority', colorClass: 'text-blue-700 font-medium' },
  low: { label: 'Low priority', colorClass: 'text-emerald-700' },
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
  onPunchTaskDay,
  onOpenBingoPunchCards,
  onDragStartTask,
  onDragEndTask,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'subtasks' | 'daily_prompts'>(
    'subtasks'
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isDraggingSelf, setIsDraggingSelf] = useState(false);
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

  const taskPromptStorageKey = `focusflow_task_prompt_${todo.id}`;
  const [taskPrompt, setTaskPrompt] = useState<DailySpecificTaskPromptData>(
    () => {
      try {
        const saved = localStorage.getItem(taskPromptStorageKey);
        if (saved) {
          return { ...DEFAULT_DAILY_SPECIFIC_TASK_PROMPT, ...JSON.parse(saved) };
        }
      } catch {
        // Ignore
      }
      return DEFAULT_DAILY_SPECIFIC_TASK_PROMPT;
    }
  );

  useEffect(() => {
    try {
      localStorage.setItem(taskPromptStorageKey, JSON.stringify(taskPrompt));
    } catch {
      // Ignore
    }
  }, [taskPrompt, taskPromptStorageKey]);

  const todayIso = getTodayIsoDate();
  const isOverdue = !todo.completed && todo.dueDate < todayIso;
  const isDueToday = todo.dueDate === todayIso;

  const completedSubtasks = todo.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = todo.subtasks.length;
  const daysDoneCount = getTaskDaysDoneCount(todo);
  const hasAutoPunchCard = doesTaskQualifyForPunchCard(todo);

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

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (isEditing) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData(HOURLY_DRAG_MIME_TYPE, todo.id);
    e.dataTransfer.setData('text/plain', todo.id);
    e.dataTransfer.effectAllowed = 'move';
    setIsDraggingSelf(true);
    if (onDragStartTask) {
      onDragStartTask(todo.id);
    }
  };

  const handleDragEnd = () => {
    setIsDraggingSelf(false);
    if (onDragEndTask) {
      onDragEndTask();
    }
  };

  const priorityMeta = PRIORITY_TEXT[todo.priority];

  return (
    <div
      id={`task-row-${todo.id}`}
      data-testid={`task-row-${todo.id}`}
      draggable={!isEditing}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`border-b border-slate-200/80 last:border-b-0 transition-all ${
        isDraggingSelf
          ? 'opacity-55 bg-emerald-50/80 ring-2 ring-emerald-500/50'
          : todo.completed
            ? 'bg-slate-50/60'
            : isFocused
              ? 'bg-emerald-50/60'
              : 'bg-white hover:bg-slate-50/50'
      }`}
    >
      <div className="px-3.5 py-3 flex items-start gap-2.5">
        {/* Tactile Drag Handle to Pull Card into Side Hourly Calendar */}
        {!isEditing && (
          <div
            data-testid={`drag-handle-${todo.id}`}
            title="Pull card into the Side Hourly Calendar to automatically schedule it"
            aria-label={`Pull "${todo.title}" into Side Hourly Calendar`}
            className="mt-0.5 p-0.5 text-slate-400 hover:text-emerald-700 cursor-grab active:cursor-grabbing shrink-0 rounded transition-colors"
          >
            <GripVertical className="w-4 h-4" aria-hidden="true" />
          </div>
        )}

        <button
          type="button"
          onClick={() => onToggle(todo.id)}
          aria-label={
            todo.completed
              ? `Mark "${todo.title}" as incomplete`
              : `Mark "${todo.title}" as completed`
          }
          className="-ml-1.5 -mt-1 min-w-[40px] min-h-[40px] flex items-center justify-center shrink-0 cursor-pointer group/check"
        >
          <span
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-transform duration-150 ${
              todo.completed
                ? 'bg-emerald-600 border-emerald-600 text-white scale-100'
                : 'border-slate-300 group-hover/check:border-emerald-600 bg-white group-active/check:scale-95'
            }`}
          >
            {todo.completed && (
              <Check className="w-3.5 h-3.5 stroke-[2.75]" aria-hidden="true" />
            )}
          </span>
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
                  className={`text-sm font-semibold leading-snug break-words ${
                    todo.completed
                      ? 'line-through text-slate-400'
                      : 'text-slate-900'
                  }`}
                >
                  {todo.title}
                </span>

                {/* Interactive Punch Card Button when task is done > 3 times (4+ days) */}
                {hasAutoPunchCard && (
                  <button
                    type="button"
                    data-testid={`task-punch-card-badge-${todo.id}`}
                    onClick={() =>
                      onOpenBingoPunchCards && onOpenBingoPunchCards()
                    }
                    title={`Done ${daysDoneCount} days (>3 times) — Auto Punch Card minted! Click to view Punch Card`}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono tabular-nums font-semibold bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100 shrink-0 whitespace-nowrap cursor-pointer"
                  >
                    <Ticket
                      className="w-3 h-3 text-purple-700"
                      aria-hidden="true"
                    />
                    <span>Punch Card · {daysDoneCount}d done</span>
                  </button>
                )}

                {onPunchTaskDay && (
                  <button
                    type="button"
                    data-testid={`task-row-punch-day-${todo.id}`}
                    onClick={() => onPunchTaskDay(todo.id)}
                    title={`Log +1 completed day on "${todo.title}" (auto-creates Punch Card once > 3 days)`}
                    className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[11px] font-mono tabular-nums font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    <Plus className="w-2.5 h-2.5" aria-hidden="true" />
                    <span>1d</span>
                  </button>
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

              {/* Unboxed metadata with typographic separators (Zero-Pill Discipline) */}
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

                {todo.scheduledHour !== undefined && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span
                      data-testid={`task-scheduled-badge-${todo.id}`}
                      className="font-mono tabular-nums font-semibold text-blue-700"
                    >
                      {formatHourSlotLabel(todo.scheduledHour)}
                    </span>
                  </>
                )}

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

                {!hasAutoPunchCard && daysDoneCount > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span
                      data-testid={`streak-badge-${todo.id}`}
                      title={`Done ${daysDoneCount} ${
                        daysDoneCount === 1 ? 'day' : 'days'
                      } — do ${4 - daysDoneCount} more ${
                        4 - daysDoneCount === 1 ? 'time' : 'times'
                      } (>3) to auto-mint a Punch Card!`}
                      className="font-mono tabular-nums font-medium text-emerald-700"
                    >
                      {daysDoneCount}/4d to Punch Card
                    </span>
                  </>
                )}

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
              data-testid={`task-prompt-btn-${todo.id}`}
              onClick={() => {
                setDrawerTab('daily_prompts');
                setExpanded(true);
              }}
              title="Open Daily Specific Task Reflection Prompts"
              className="px-2 py-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3 h-3" aria-hidden="true" />
              <span className="hidden sm:inline">Task Prompts</span>
            </button>

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

      {/* Expandable Subtasks & "In My Daily Specific Tasks" Prompts Drawer */}
      {expanded && (
        <div className="px-4 pb-3.5 pl-12 bg-slate-50/70 border-t border-slate-100 space-y-3 pt-2.5">
          {/* Sub-Drawer Switcher: Subtasks vs In My Daily Specific Tasks Prompts */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setDrawerTab('subtasks')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                drawerTab === 'subtasks'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
              }`}
            >
              Subtasks ({completedSubtasks}/{totalSubtasks})
            </button>
            <button
              type="button"
              data-testid={`switch-daily-task-prompts-${todo.id}`}
              onClick={() => setDrawerTab('daily_prompts')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                drawerTab === 'daily_prompts'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
              }`}
            >
              In My Daily Specific Tasks Prompts (7 Questions)
            </button>
          </div>

          {drawerTab === 'subtasks' ? (
            <div className="space-y-2">
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
          ) : (
            /* In My Daily Specific Tasks Guided Prompts */
            <div
              data-testid={`daily-specific-task-prompts-${todo.id}`}
              className="bg-white border border-slate-200 rounded-xl p-3 space-y-2.5 text-xs"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="font-bold text-slate-900">
                    1. What did I do/watch/made today that moved the needle
                    forward for this topic?
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-slate-200 bg-slate-50 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={taskPrompt.executionMode === 'pre-planned'}
                        onChange={() =>
                          setTaskPrompt((p) => ({
                            ...p,
                            executionMode: 'pre-planned',
                          }))
                        }
                        className="rounded border-slate-300 text-emerald-600"
                      />
                      <span>[ ] pre-planned</span>
                    </label>
                    <label className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-slate-200 bg-slate-50 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={taskPrompt.executionMode === 'rouge'}
                        onChange={() =>
                          setTaskPrompt((p) => ({
                            ...p,
                            executionMode: 'rouge',
                          }))
                        }
                        className="rounded border-slate-300 text-amber-600"
                      />
                      <span>[ ] rouge</span>
                    </label>
                  </div>
                </div>
                <input
                  type="text"
                  value={taskPrompt.needleMoverAction}
                  onChange={(e) =>
                    setTaskPrompt((p) => ({
                      ...p,
                      needleMoverAction: e.target.value,
                    }))
                  }
                  placeholder="Describe what you built, watched, or executed today..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    2. How much time will it take?
                  </label>
                  <input
                    type="text"
                    value={taskPrompt.estimatedTime}
                    onChange={(e) =>
                      setTaskPrompt((p) => ({
                        ...p,
                        estimatedTime: e.target.value,
                      }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    3. Can I extend the time?
                  </label>
                  <input
                    type="text"
                    value={taskPrompt.canExtendTime}
                    onChange={(e) =>
                      setTaskPrompt((p) => ({
                        ...p,
                        canExtendTime: e.target.value,
                      }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    4. What cognitive load did I have?
                  </label>
                  <select
                    value={taskPrompt.cognitiveLoad}
                    onChange={(e) =>
                      setTaskPrompt((p) => ({
                        ...p,
                        cognitiveLoad:
                          e.target.value as DailySpecificTaskPromptData['cognitiveLoad'],
                      }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-900"
                  >
                    <option value="Low">Low Load</option>
                    <option value="Medium">Medium Load</option>
                    <option value="High">High Deep-Focus Load</option>
                    <option value="Overloaded">Overloaded</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    5. What made focusing on this task harder than it needed to
                    be?
                  </label>
                  <input
                    type="text"
                    value={taskPrompt.whatMadeFocusingHarder}
                    onChange={(e) =>
                      setTaskPrompt((p) => ({
                        ...p,
                        whatMadeFocusingHarder: e.target.value,
                      }))
                    }
                    placeholder="Context switching, unclear next step, notifications..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    6. What else is in my mind? What tool can I use right NOW?
                  </label>
                  <input
                    type="text"
                    value={taskPrompt.whatElseInMindAndToolRightNow}
                    onChange={(e) =>
                      setTaskPrompt((p) => ({
                        ...p,
                        whatElseInMindAndToolRightNow: e.target.value,
                      }))
                    }
                    placeholder="Use Brain Dump Swiper, Negative Note Burner, or DoteTimer..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                <span className="font-bold text-slate-900">
                  7. Is it because I didn’t find it a priority anymore?
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setTaskPrompt((p) => ({ ...p, isNoLongerPriority: 'yes' }))
                    }
                    className={`px-2.5 py-0.5 rounded font-semibold border cursor-pointer ${
                      taskPrompt.isNoLongerPriority === 'yes'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    [ ] Yes (Move to Q4 Eliminate)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setTaskPrompt((p) => ({ ...p, isNoLongerPriority: 'no' }))
                    }
                    className={`px-2.5 py-0.5 rounded font-semibold border cursor-pointer ${
                      taskPrompt.isNoLongerPriority === 'no'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    [x] No (Still a Priority)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

