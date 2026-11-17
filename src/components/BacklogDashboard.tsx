import React, { useState, useMemo } from 'react';
import {
  Archive,
  Clock,
  GripVertical,
  Plus,
  Search,
  CheckCircle2,
  Trash2,
  ArrowUpRight,
  Layers,
  Calendar as CalendarIcon,
  Filter,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import {
  Category,
  LIFE_AREAS,
  Priority,
  TodoItem,
  BrainDumpItem,
  EisenhowerQuadrant,
  HOURLY_DRAG_MIME_TYPE,
  formatHourSlotLabel,
  getTodayIsoDate,
  offsetIsoDate,
} from '../utils/todoLogic';

const SCHEDULE_HOURS = [
  6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
] as const;

export type BacklogHorizonBucket = 'all' | 'next_up' | 'this_month' | 'icebox';

interface BacklogDashboardProps {
  todos: TodoItem[];
  brainDumpItems: BrainDumpItem[];
  onAddBacklogTodo: (params: {
    title: string;
    notes: string;
    priority: Priority;
    category: Category;
    dueDate: string;
    isRepeating: boolean;
    scheduledHour?: number;
    quadrant?: EisenhowerQuadrant;
  }) => void;
  onToggleTodo: (id: string) => void;
  onDeleteTodo: (id: string) => void;
  onUpdateTodo: (
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
        | 'quadrant'
        | 'scheduledHour'
      >
    >
  ) => void;
  onAssignScheduledHour: (
    todoId: string,
    hour: number | undefined,
    dateIso: string
  ) => void;
  onPromoteBrainDumpItem: (itemId: string) => void;
  onRestoreBrainDumpToDeck: (itemId: string) => void;
  onDeleteBrainDumpItem: (itemId: string) => void;
  onDragStartTask?: (taskId: string) => void;
  onDragEndTask?: () => void;
}

const PRIORITY_BADGE_STYLES: Record<Priority, string> = {
  high: 'bg-purple-100 text-purple-900 border-purple-300',
  medium: 'bg-blue-100 text-blue-900 border-blue-300',
  low: 'bg-emerald-100 text-emerald-900 border-emerald-300',
};

export function classifyBacklogHorizon(
  todo: TodoItem,
  todayIso: string
): Exclude<BacklogHorizonBucket, 'all'> {
  const sevenDaysOut = offsetIsoDate(todayIso, 7);
  const thirtyDaysOut = offsetIsoDate(todayIso, 30);

  if (todo.priority === 'high' || todo.dueDate <= sevenDaysOut) {
    return 'next_up';
  }
  if (todo.dueDate <= thirtyDaysOut) {
    return 'this_month';
  }
  return 'icebox';
}

export const BacklogDashboard: React.FC<BacklogDashboardProps> = ({
  todos,
  brainDumpItems,
  onAddBacklogTodo,
  onToggleTodo,
  onDeleteTodo,
  onUpdateTodo,
  onAssignScheduledHour,
  onPromoteBrainDumpItem,
  onRestoreBrainDumpToDeck,
  onDeleteBrainDumpItem,
  onDragStartTask,
  onDragEndTask,
}) => {
  const todayIso = getTodayIsoDate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [selectedPriority, setSelectedPriority] = useState<Priority | 'all'>('all');
  const [selectedHorizon, setSelectedHorizon] =
    useState<BacklogHorizonBucket>('all');

  // Quick Add to Backlog form state
  const [newTitle, setNewTitle] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newCategory, setNewCategory] = useState<Category>('Portfolio');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [newHorizonChoice, setNewHorizonChoice] =
    useState<Exclude<BacklogHorizonBucket, 'all'>>('next_up');

  // Unscheduled / Backlog tasks: active tasks that do not have an hourly time slot assigned today, or are scheduled for future dates
  const backlogTodos = useMemo(() => {
    return todos.filter(
      (t) =>
        !t.completed &&
        (t.scheduledHour === undefined || t.dueDate > todayIso)
    );
  }, [todos, todayIso]);

  const storedBrainDumpItems = useMemo(() => {
    return brainDumpItems.filter(
      (item) => item.status === 'stored' || item.status === 'queue'
    );
  }, [brainDumpItems]);

  const filteredBacklogTodos = useMemo(() => {
    return backlogTodos.filter((todo) => {
      if (selectedCategory !== 'All' && todo.category !== selectedCategory) {
        return false;
      }
      if (selectedPriority !== 'all' && todo.priority !== selectedPriority) {
        return false;
      }
      const bucket = classifyBacklogHorizon(todo, todayIso);
      if (selectedHorizon !== 'all' && bucket !== selectedHorizon) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = todo.title.toLowerCase().includes(q);
        const matchNotes = todo.notes.toLowerCase().includes(q);
        const matchCat = todo.category.toLowerCase().includes(q);
        if (!matchTitle && !matchNotes && !matchCat) return false;
      }
      return true;
    });
  }, [
    backlogTodos,
    selectedCategory,
    selectedPriority,
    selectedHorizon,
    searchQuery,
    todayIso,
  ]);

  const bucketCounts = useMemo(() => {
    const counts = {
      all: backlogTodos.length,
      next_up: 0,
      this_month: 0,
      icebox: 0,
    };
    for (const t of backlogTodos) {
      const bucket = classifyBacklogHorizon(t, todayIso);
      counts[bucket] += 1;
    }
    return counts;
  }, [backlogTodos, todayIso]);

  const handleCreateBacklogItem = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed) return;

    const targetDueDate =
      newHorizonChoice === 'next_up'
        ? offsetIsoDate(todayIso, 3)
        : newHorizonChoice === 'this_month'
          ? offsetIsoDate(todayIso, 14)
          : offsetIsoDate(todayIso, 45);

    onAddBacklogTodo({
      title: trimmed,
      notes:
        newNotes.trim() ||
        `Backlog (${newHorizonChoice.replace('_', ' ')}) — ready to pull into Side Hourly Calendar`,
      priority: newPriority,
      category: newCategory,
      dueDate: targetDueDate,
      isRepeating: false,
      quadrant: newPriority === 'high' ? 'schedule' : 'delegate',
    });

    setNewTitle('');
    setNewNotes('');
  };

  const handleMoveToHorizon = (
    todo: TodoItem,
    bucket: Exclude<BacklogHorizonBucket, 'all'>
  ) => {
    const targetDueDate =
      bucket === 'next_up'
        ? offsetIsoDate(todayIso, 2)
        : bucket === 'this_month'
          ? offsetIsoDate(todayIso, 14)
          : offsetIsoDate(todayIso, 45);
    onUpdateTodo(todo.id, {
      dueDate: targetDueDate,
      priority: bucket === 'next_up' ? 'high' : todo.priority,
    });
  };

  return (
    <div
      data-testid="backlog-dashboard"
      className="space-y-4"
    >
      {/* Top Header Strip */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-bold uppercase tracking-wider mb-1.5">
              <Archive className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
              <span>Unscheduled Staging &amp; Someday Vault</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-display">
              Backlog Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5 max-w-2xl">
              Stage unscheduled work across horizons without cluttering today&apos;s focus. Drag any backlog card by its handle (<strong className="text-blue-700">⋮⋮</strong>) straight into the <strong className="text-blue-700">Side Hourly Calendar</strong> on the right, or assign an hour in one click.
            </p>
          </div>

          {/* KPI Summary Strip */}
          <div className="grid grid-cols-3 gap-2 shrink-0">
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-center">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Unscheduled
              </div>
              <div
                data-testid="backlog-total-count"
                className="text-base font-bold font-mono tabular-nums text-blue-700 mt-0.5"
              >
                {backlogTodos.length}
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-center">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Sprint Ready
              </div>
              <div className="text-base font-bold font-mono tabular-nums text-emerald-700 mt-0.5">
                {bucketCounts.next_up}
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-center">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Idea Vault
              </div>
              <div className="text-base font-bold font-mono tabular-nums text-purple-700 mt-0.5">
                {storedBrainDumpItems.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add to Backlog Form */}
      <form
        onSubmit={handleCreateBacklogItem}
        data-testid="backlog-quick-add-form"
        className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
            <span>Capture Directly to Backlog</span>
          </span>
          <span className="text-[11px] text-slate-500">
            Staged outside today&apos;s hourly schedule until pulled
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          <div className="sm:col-span-5">
            <label htmlFor="backlog-new-title" className="sr-only">
              Backlog task title
            </label>
            <input
              id="backlog-new-title"
              data-testid="backlog-new-title-input"
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="What needs to be staged in the backlog?"
              className="w-full px-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="backlog-new-notes" className="sr-only">
              Context or notes
            </label>
            <input
              id="backlog-new-notes"
              type="text"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Optional notes / definition of done..."
              className="w-full px-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="backlog-new-category" className="sr-only">
              Life Area
            </label>
            <select
              id="backlog-new-category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as Category)}
              className="w-full px-2.5 py-2 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
            >
              {LIFE_AREAS.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              data-testid="backlog-add-submit-btn"
              className="w-full h-full min-h-[34px] px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Stage Item</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500">
              Horizon Bucket:
            </span>
            {(
              [
                {
                  id: 'next_up',
                  label: 'Next Up (Sprint Ready)',
                  activeClass: 'bg-emerald-600 text-white',
                },
                {
                  id: 'this_month',
                  label: 'Later This Month',
                  activeClass: 'bg-blue-600 text-white',
                },
                {
                  id: 'icebox',
                  label: 'Someday / Icebox',
                  activeClass: 'bg-purple-700 text-white',
                },
              ] as const
            ).map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setNewHorizonChoice(b.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                  newHorizonChoice === b.id
                    ? b.activeClass
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500">
              Priority:
            </span>
            {(['high', 'medium', 'low'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setNewPriority(p)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase border transition-colors cursor-pointer ${
                  newPriority === p
                    ? PRIORITY_BADGE_STYLES[p]
                    : 'bg-white text-slate-500 border-slate-200 hover:text-slate-800'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </form>

      {/* Horizon Tabs + Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-3">
        <div
          role="tablist"
          aria-label="Backlog horizon buckets"
          className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-100 p-1 rounded-xl"
        >
          {(
            [
              {
                id: 'all',
                label: 'All Backlog',
                count: bucketCounts.all,
                activeBg: 'bg-slate-900 text-white',
              },
              {
                id: 'next_up',
                label: 'Next Up / Ready',
                count: bucketCounts.next_up,
                activeBg: 'bg-emerald-600 text-white',
              },
              {
                id: 'this_month',
                label: 'Later This Month',
                count: bucketCounts.this_month,
                activeBg: 'bg-blue-600 text-white',
              },
              {
                id: 'icebox',
                label: 'Someday / Icebox',
                count: bucketCounts.icebox,
                activeBg: 'bg-purple-700 text-white',
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selectedHorizon === tab.id}
              data-testid={`backlog-horizon-tab-${tab.id}`}
              onClick={() => setSelectedHorizon(tab.id)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between gap-1.5 transition-colors cursor-pointer ${
                selectedHorizon === tab.id
                  ? tab.activeBg
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <span className="truncate">{tab.label}</span>
              <span
                className={`text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded-md ${
                  selectedHorizon === tab.id
                    ? 'bg-white/20 text-white font-bold'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search
              className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search backlog tasks by title, notes, or life area..."
              aria-label="Search backlog tasks"
              className="w-full pl-8 pr-3 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <Filter
                className="w-3.5 h-3.5 text-slate-400"
                aria-hidden="true"
              />
              <select
                aria-label="Filter backlog by life area"
                value={selectedCategory}
                onChange={(e) =>
                  setSelectedCategory(e.target.value as Category | 'All')
                }
                className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-600"
              >
                <option value="All">All 7 Life Areas</option>
                {LIFE_AREAS.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>

            <select
              aria-label="Filter backlog by priority"
              value={selectedPriority}
              onChange={(e) =>
                setSelectedPriority(e.target.value as Priority | 'all')
              }
              className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-600"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>
        </div>
      </div>

      {/* Draggable Backlog Task Cards List */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Archive className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            <h2 className="text-xs sm:text-sm font-bold tracking-wide uppercase font-display">
              Staged Backlog Cards ({filteredBacklogTodos.length})
            </h2>
          </div>
          <span className="text-[11px] text-slate-300 font-mono">
            Drag ⋮⋮ to Side Hourly Calendar →
          </span>
        </div>

        {filteredBacklogTodos.length > 0 ? (
          <div className="divide-y divide-slate-200" role="list">
            {filteredBacklogTodos.map((todo) => {
              const horizonBucket = classifyBacklogHorizon(todo, todayIso);
              const horizonBadge =
                horizonBucket === 'next_up'
                  ? {
                      label: 'Next Up',
                      cls: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                    }
                  : horizonBucket === 'this_month'
                    ? {
                        label: 'This Month',
                        cls: 'bg-blue-50 text-blue-800 border-blue-200',
                      }
                    : {
                        label: 'Icebox',
                        cls: 'bg-purple-50 text-purple-800 border-purple-200',
                      };

              return (
                <div
                  key={todo.id}
                  role="listitem"
                  data-testid={`backlog-task-card-${todo.id}`}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(HOURLY_DRAG_MIME_TYPE, todo.id);
                    e.dataTransfer.setData('text/plain', todo.id);
                    e.dataTransfer.effectAllowed = 'move';
                    onDragStartTask?.(todo.id);
                  }}
                  onDragEnd={() => {
                    onDragEndTask?.();
                  }}
                  className="p-3.5 sm:p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-grab active:cursor-grabbing"
                >
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <div
                      title="Drag card to Side Hourly Calendar"
                      className="mt-0.5 p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 shrink-0"
                    >
                      <GripVertical className="w-4 h-4" aria-hidden="true" />
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleTodo(todo.id)}
                      aria-label={`Complete backlog task "${todo.title}"`}
                      className="mt-0.5 w-4 h-4 rounded-md border border-slate-300 hover:border-emerald-600 flex items-center justify-center shrink-0 cursor-pointer"
                    />

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs sm:text-sm font-semibold text-slate-900">
                          {todo.title}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${PRIORITY_BADGE_STYLES[todo.priority]}`}
                        >
                          {todo.priority}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          {todo.category}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${horizonBadge.cls}`}
                        >
                          {horizonBadge.label}
                        </span>
                      </div>

                      {todo.notes && (
                        <p className="text-xs text-slate-600 line-clamp-2">
                          {todo.notes}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                        <span className="inline-flex items-center gap-1 font-mono">
                          <CalendarIcon className="w-3 h-3 text-slate-400" />
                          Target: {todo.dueDate}
                        </span>

                        {/* Horizon Quick Re-bucket Controls */}
                        <div className="inline-flex items-center gap-1">
                          <span>Move to:</span>
                          {(
                            [
                              { id: 'next_up', label: 'Next Up' },
                              { id: 'this_month', label: 'Month' },
                              { id: 'icebox', label: 'Icebox' },
                            ] as const
                          ).map((b) => (
                            <button
                              key={b.id}
                              type="button"
                              onClick={() => handleMoveToHorizon(todo, b.id)}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                                horizonBucket === b.id
                                  ? 'bg-slate-900 text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {b.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions: 1-Click Hourly Schedule + Promote to Today + Delete */}
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0 pl-7 sm:pl-0">
                    <div className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1">
                      <Clock
                        className="w-3.5 h-3.5 text-blue-600 shrink-0"
                        aria-hidden="true"
                      />
                      <select
                        aria-label={`Schedule ${todo.title} at hour`}
                        value={todo.scheduledHour ?? ''}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (!raw) return;
                          onAssignScheduledHour(todo.id, Number(raw), todayIso);
                        }}
                        className="text-[11px] font-semibold text-blue-900 bg-transparent focus:outline-none cursor-pointer"
                      >
                        <option value="">Schedule Hour...</option>
                        {SCHEDULE_HOURS.map((hour) => (
                          <option key={hour} value={hour}>
                            {formatHourSlotLabel(hour)} Today
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onUpdateTodo(todo.id, {
                          dueDate: todayIso,
                          priority: 'high',
                          quadrant: 'do_first',
                        })
                      }
                      title="Promote to Today's Do First priority"
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
                      <span>Today</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteTodo(todo.id)}
                      aria-label={`Delete ${todo.title}`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-10 px-6 text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2.5">
              <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">
              No backlog items match this filter
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Stage new future work above or switch your Horizon Bucket / Life Area filter to inspect other backlog items.
            </p>
          </div>
        )}
      </div>

      {/* Stored Brain Dump Idea Vault Section */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 bg-purple-900 text-white flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            <h2 className="text-xs sm:text-sm font-bold tracking-wide uppercase font-display">
              Brain Dump Idea Vault ({storedBrainDumpItems.length})
            </h2>
          </div>
          <span className="text-[11px] text-purple-200">
            Raw ideas waiting to become structured tasks
          </span>
        </div>

        {storedBrainDumpItems.length > 0 ? (
          <div className="divide-y divide-slate-200">
            {storedBrainDumpItems.map((item) => (
              <div
                key={item.id}
                data-testid={`backlog-braindump-item-${item.id}`}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs sm:text-sm font-semibold text-slate-900">
                      {item.title}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      · {item.status === 'stored' ? 'Stored for Later' : 'In Queue'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onPromoteBrainDumpItem(item.id)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" aria-hidden="true" />
                    <span>Promote to Active Task</span>
                  </button>

                  {item.status === 'stored' && (
                    <button
                      type="button"
                      onClick={() => onRestoreBrainDumpToDeck(item.id)}
                      title="Restore to Swiper Deck"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onDeleteBrainDumpItem(item.id)}
                    aria-label={`Delete brain dump idea ${item.title}`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-500">
            No unpromoted Brain Dump ideas in the vault.
          </div>
        )}
      </div>
    </div>
  );
};
