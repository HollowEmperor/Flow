import React, { useState, useMemo } from 'react';
import {
  Flame,
  CalendarClock,
  Users,
  Archive,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  LayoutGrid,
  GripVertical,
  Clock,
} from 'lucide-react';
import {
  Category,
  LIFE_AREAS,
  Priority,
  TodoItem,
  EisenhowerQuadrant,
  EISENHOWER_QUADRANTS,
  EISENHOWER_QUADRANT_META,
  HOURLY_DRAG_MIME_TYPE,
  formatHourSlotLabel,
  groupTodosByEisenhower,
  computeEisenhowerSummary,
  getTodayIsoDate,
} from '../utils/todoLogic';

interface EisenhowerMatrixProps {
  todos: TodoItem[];
  onToggleTodo: (id: string) => void;
  onDeleteTodo: (id: string) => void;
  onAssignQuadrant: (id: string, quadrant: EisenhowerQuadrant) => void;
  onAddTodoInQuadrant: (params: {
    title: string;
    notes: string;
    priority: Priority;
    category: Category;
    dueDate: string;
    quadrant: EisenhowerQuadrant;
  }) => void;
  onDragStartTask?: (todoId: string) => void;
  onDragEndTask?: () => void;
}

const QUADRANT_STYLES: Record<
  EisenhowerQuadrant,
  {
    badgeBg: string;
    borderAccent: string;
    headerBg: string;
    icon: React.ReactNode;
  }
> = {
  do_first: {
    badgeBg: 'bg-red-100 text-red-800 border-red-200',
    borderAccent: 'border-red-200',
    headerBg: 'bg-red-50/70',
    icon: <Flame className="w-4 h-4 text-red-600" aria-hidden="true" />,
  },
  schedule: {
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    borderAccent: 'border-emerald-200',
    headerBg: 'bg-emerald-50/70',
    icon: (
      <CalendarClock className="w-4 h-4 text-emerald-600" aria-hidden="true" />
    ),
  },
  delegate: {
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
    borderAccent: 'border-amber-200',
    headerBg: 'bg-amber-50/70',
    icon: <Users className="w-4 h-4 text-amber-600" aria-hidden="true" />,
  },
  eliminate: {
    badgeBg: 'bg-slate-200 text-slate-700 border-slate-300',
    borderAccent: 'border-slate-200',
    headerBg: 'bg-slate-100/80',
    icon: <Archive className="w-4 h-4 text-slate-600" aria-hidden="true" />,
  },
};

export const EisenhowerMatrix: React.FC<EisenhowerMatrixProps> = ({
  todos,
  onToggleTodo,
  onDeleteTodo,
  onAssignQuadrant,
  onAddTodoInQuadrant,
  onDragStartTask,
  onDragEndTask,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>(
    'All'
  );
  const [showCompleted, setShowCompleted] = useState(true);
  const [quickAddTitle, setQuickAddTitle] = useState('');
  const [quickAddQuadrant, setQuickAddQuadrant] =
    useState<EisenhowerQuadrant>('do_first');
  const [quickAddCategory, setQuickAddCategory] =
    useState<Category>('Portfolio');

  const grouped = useMemo(
    () =>
      groupTodosByEisenhower(todos, {
        includeCompleted: showCompleted,
        category: selectedCategory,
      }),
    [todos, showCompleted, selectedCategory]
  );

  const summary = useMemo(() => computeEisenhowerSummary(todos), [todos]);

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = quickAddTitle.trim();
    if (!clean) return;
    const meta = EISENHOWER_QUADRANT_META[quickAddQuadrant];
    onAddTodoInQuadrant({
      title: clean,
      notes: '',
      priority: meta.defaultPriority,
      category: quickAddCategory,
      dueDate: getTodayIsoDate(),
      quadrant: quickAddQuadrant,
    });
    setQuickAddTitle('');
  };

  const handleDragStartCard = (
    e: React.DragEvent<HTMLDivElement>,
    todoId: string
  ) => {
    e.dataTransfer.setData(HOURLY_DRAG_MIME_TYPE, todoId);
    e.dataTransfer.setData('text/plain', todoId);
    e.dataTransfer.effectAllowed = 'move';
    if (onDragStartTask) {
      onDragStartTask(todoId);
    }
  };

  return (
    <div
      data-testid="eisenhower-matrix-workspace"
      className="space-y-4 @container"
    >
      {/* Header & Summary */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <LayoutGrid
                className="w-5 h-5 text-emerald-700"
                aria-hidden="true"
              />
              <h1 className="text-lg @sm:text-xl font-bold tracking-tight text-slate-900 font-display">
                Eisenhower Decision Matrix
              </h1>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Prioritize tasks by Urgency and Importance. Pull any matrix card
              directly into the Side Hourly Calendar to schedule it!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="matrix-area-filter" className="sr-only">
              Filter matrix by Life Area
            </label>
            <select
              id="matrix-area-filter"
              value={selectedCategory}
              onChange={(e) =>
                setSelectedCategory(e.target.value as Category | 'All')
              }
              className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5"
            >
              <option value="All">All 7 Life Areas</option>
              {LIFE_AREAS.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setShowCompleted((prev) => !prev)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                showCompleted
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {showCompleted ? 'Showing Completed' : 'Active Only'}
            </button>
          </div>
        </div>

        {/* Inline Quick-Add directly to an Eisenhower Quadrant */}
        <form
          onSubmit={handleQuickAddSubmit}
          className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2"
        >
          <label htmlFor="matrix-quick-task-input" className="sr-only">
            New matrix task title
          </label>
          <input
            id="matrix-quick-task-input"
            type="text"
            value={quickAddTitle}
            onChange={(e) => setQuickAddTitle(e.target.value)}
            placeholder="Add a task directly to a quadrant..."
            className="flex-1 min-w-[180px] text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
          />

          <label htmlFor="matrix-quadrant-select" className="sr-only">
            Target Eisenhower Quadrant
          </label>
          <select
            id="matrix-quadrant-select"
            value={quickAddQuadrant}
            onChange={(e) =>
              setQuickAddQuadrant(e.target.value as EisenhowerQuadrant)
            }
            className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700"
          >
            <option value="do_first">Q1: Do First (Urgent & Important)</option>
            <option value="schedule">
              Q2: Schedule (Not Urgent & Important)
            </option>
            <option value="delegate">
              Q3: Delegate (Urgent & Not Important)
            </option>
            <option value="eliminate">
              Q4: Eliminate (Not Urgent & Not Important)
            </option>
          </select>

          <label htmlFor="matrix-category-select" className="sr-only">
            Task Life Area
          </label>
          <select
            id="matrix-category-select"
            value={quickAddCategory}
            onChange={(e) => setQuickAddCategory(e.target.value as Category)}
            className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700"
          >
            {LIFE_AREAS.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={!quickAddTitle.trim()}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Add to Matrix</span>
          </button>
        </form>
      </div>

      {/* 2x2 Quadrant Grid (Responsive via @container) */}
      <div className="grid grid-cols-1 @xl:grid-cols-2 gap-4">
        {EISENHOWER_QUADRANTS.map((qKey) => {
          const meta = EISENHOWER_QUADRANT_META[qKey];
          const style = QUADRANT_STYLES[qKey];
          const tasks = grouped[qKey];
          const qStats = summary[qKey];

          return (
            <section
              key={qKey}
              data-testid={`eisenhower-quadrant-${qKey}`}
              aria-label={`${meta.code} ${meta.title}: ${meta.subtitle}`}
              className={`bg-white border ${style.borderAccent} rounded-xl overflow-hidden flex flex-col`}
            >
              {/* Quadrant Header */}
              <div
                className={`${style.headerBg} px-4 py-3 border-b ${style.borderAccent} flex items-center justify-between gap-2`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {style.icon}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${style.badgeBg}`}
                      >
                        {meta.code}
                      </span>
                      <h2 className="text-sm font-bold text-slate-900 truncate">
                        {meta.title}
                      </h2>
                    </div>
                    <p className="text-[11px] text-slate-600 truncate">
                      {meta.subtitle} · {meta.actionTag}
                    </p>
                  </div>
                </div>

                <span
                  data-testid={`quadrant-count-${qKey}`}
                  className="text-xs font-mono font-bold text-slate-700 bg-white/90 border border-slate-200 px-2 py-0.5 rounded-md shrink-0"
                >
                  {qStats.active} active / {tasks.length}
                </span>
              </div>

              {/* Quadrant Task List */}
              <div className="p-3 space-y-2 flex-1 min-h-[150px]">
                {tasks.length === 0 ? (
                  <div className="h-full min-h-[120px] flex flex-col items-center justify-center text-center px-3 py-6 text-slate-400">
                    <p className="text-xs font-medium text-slate-500">
                      No tasks in {meta.code} ({meta.title})
                    </p>
                    <p className="text-[11px] mt-0.5">
                      Move a task here or use the bar above.
                    </p>
                  </div>
                ) : (
                  tasks.map((todo) => (
                    <div
                      key={todo.id}
                      draggable
                      data-testid={`matrix-card-${todo.id}`}
                      onDragStart={(e) => handleDragStartCard(e, todo.id)}
                      onDragEnd={() => onDragEndTask && onDragEndTask()}
                      title="Pull this card into the Side Hourly Calendar to schedule it"
                      className={`p-2.5 rounded-lg border transition-colors cursor-grab active:cursor-grabbing ${
                        todo.completed
                          ? 'bg-slate-50 border-slate-200/70 opacity-70'
                          : 'bg-white border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1 mt-0.5 shrink-0">
                          <GripVertical
                            className="w-3.5 h-3.5 text-slate-400"
                            aria-hidden="true"
                          />
                          <button
                            type="button"
                            onClick={() => onToggleTodo(todo.id)}
                            aria-label={`Mark "${todo.title}" as ${
                              todo.completed ? 'incomplete' : 'completed'
                            }`}
                            className="text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                          >
                            {todo.completed ? (
                              <CheckCircle2
                                className="w-4 h-4 text-emerald-600"
                                aria-hidden="true"
                              />
                            ) : (
                              <Circle className="w-4 h-4" aria-hidden="true" />
                            )}
                          </button>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-xs font-semibold leading-snug ${
                              todo.completed
                                ? 'line-through text-slate-400'
                                : 'text-slate-900'
                            }`}
                          >
                            {todo.title}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px]">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                              {todo.category}
                            </span>
                            {todo.scheduledHour !== undefined && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-semibold flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                {formatHourSlotLabel(todo.scheduledHour)}
                              </span>
                            )}
                            <span className="font-mono text-slate-500">
                              Due {todo.dueDate}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onDeleteTodo(todo.id)}
                          aria-label={`Delete "${todo.title}"`}
                          className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors shrink-0 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>

                      {/* Quick Quadrant Reassignment Buttons */}
                      <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1">
                        <span className="text-[10px] text-slate-400">
                          Move quadrant:
                        </span>
                        <div className="flex items-center gap-1">
                          {EISENHOWER_QUADRANTS.map((targetQ) => {
                            const targetMeta =
                              EISENHOWER_QUADRANT_META[targetQ];
                            const isCurrent = targetQ === qKey;
                            return (
                              <button
                                key={targetQ}
                                type="button"
                                disabled={isCurrent}
                                onClick={() =>
                                  onAssignQuadrant(todo.id, targetQ)
                                }
                                aria-label={`Move "${todo.title}" to ${targetMeta.code} ${targetMeta.title}`}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold transition-colors cursor-pointer ${
                                  isCurrent
                                    ? 'bg-slate-900 text-white cursor-default'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {targetMeta.code}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};

