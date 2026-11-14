import React, { useState, useMemo } from 'react';
import {
  Clock,
  Plus,
  CheckCircle2,
  Circle,
  X,
  Calendar as CalendarIcon,
} from 'lucide-react';
import {
  Category,
  LIFE_AREAS,
  Priority,
  TodoItem,
  formatHourSlotLabel,
  getHourlyScheduleForDate,
  getTodayIsoDate,
} from '../utils/todoLogic';

interface HourlyCalendarPanelProps {
  todos: TodoItem[];
  onToggleTodo: (id: string) => void;
  onAssignScheduledHour: (
    todoId: string,
    hour: number | undefined,
    dateIso: string
  ) => void;
  onAddTodoAtHour: (params: {
    title: string;
    notes: string;
    priority: Priority;
    category: Category;
    dueDate: string;
    isRepeating: boolean;
    scheduledHour: number;
  }) => void;
  onCloseHourlyView?: () => void;
}

export const HourlyCalendarPanel: React.FC<HourlyCalendarPanelProps> = ({
  todos,
  onToggleTodo,
  onAssignScheduledHour,
  onAddTodoAtHour,
  onCloseHourlyView,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    getTodayIsoDate()
  );
  const [quickTitle, setQuickTitle] = useState('');
  const [quickHour, setQuickHour] = useState<number>(10);
  const [quickCategory, setQuickCategory] = useState<Category>('Portfolio');
  const [assignTaskId, setAssignTaskId] = useState<string>('');
  const [assignHour, setAssignHour] = useState<number>(13);

  const hourlySlots = useMemo(
    () => getHourlyScheduleForDate(todos, selectedDate, 7, 21),
    [todos, selectedDate]
  );

  const unscheduledActiveTodos = useMemo(
    () =>
      todos.filter(
        (t) =>
          !t.completed &&
          (t.dueDate !== selectedDate || t.scheduledHour === undefined)
      ),
    [todos, selectedDate]
  );

  const scheduledCount = useMemo(
    () =>
      todos.filter(
        (t) => t.dueDate === selectedDate && t.scheduledHour !== undefined
      ).length,
    [todos, selectedDate]
  );

  const handleQuickCreateAtHour = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = quickTitle.trim();
    if (!clean) return;
    onAddTodoAtHour({
      title: clean,
      notes: `Scheduled for ${formatHourSlotLabel(quickHour)}`,
      priority: 'high',
      category: quickCategory,
      dueDate: selectedDate,
      isRepeating: false,
      scheduledHour: quickHour,
    });
    setQuickTitle('');
  };

  const handleAssignExistingTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTaskId) return;
    onAssignScheduledHour(assignTaskId, assignHour, selectedDate);
    setAssignTaskId('');
  };

  return (
    <section
      aria-label="Hourly Calendar Schedule"
      data-testid="right-hourly-calendar-panel"
      className="bg-white border border-slate-200 rounded-xl p-4 space-y-3.5"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-[180px]">
          <div className="flex items-center gap-1.5">
            <Clock
              className="w-4 h-4 text-emerald-700 shrink-0"
              aria-hidden="true"
            />
            <h2 className="text-sm font-bold text-slate-900 whitespace-nowrap">
              Hourly Calendar
            </h2>
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">
              {scheduledCount} blocks
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Time-block your day hour by hour (07:00 AM – 09:00 PM).
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="relative">
            <CalendarIcon
              className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <label htmlFor="hourly-calendar-date" className="sr-only">
              Hourly schedule date
            </label>
            <input
              id="hourly-calendar-date"
              type="date"
              value={selectedDate}
              onChange={(e) =>
                setSelectedDate(e.target.value || getTodayIsoDate())
              }
              className="pl-6 pr-2 py-1 text-[11px] font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            />
          </div>

          {onCloseHourlyView && (
            <button
              type="button"
              onClick={onCloseHourlyView}
              aria-label="Close hourly calendar and restore Wheel Picker and Radar Chart"
              className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              Radar & Wheel
            </button>
          )}
        </div>
      </div>

      {/* Quick Time-Block Creator */}
      <form
        onSubmit={handleQuickCreateAtHour}
        className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 space-y-2"
      >
        <div className="text-[11px] font-semibold text-slate-700">
          Add Time-Blocked Task
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <label htmlFor="hourly-quick-hour" className="sr-only">
            Select hour slot
          </label>
          <select
            id="hourly-quick-hour"
            value={quickHour}
            onChange={(e) => setQuickHour(Number(e.target.value))}
            className="text-xs font-mono bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-800"
          >
            {Array.from({ length: 15 }, (_, idx) => idx + 7).map((h) => (
              <option key={h} value={h}>
                {formatHourSlotLabel(h)}
              </option>
            ))}
          </select>

          <label htmlFor="hourly-quick-title" className="sr-only">
            Time-blocked task title
          </label>
          <input
            id="hourly-quick-title"
            type="text"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="Block hour for..."
            className="flex-1 min-w-[130px] text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 placeholder:text-slate-400"
          />

          <label htmlFor="hourly-quick-area" className="sr-only">
            Life area for time block
          </label>
          <select
            id="hourly-quick-area"
            value={quickCategory}
            onChange={(e) => setQuickCategory(e.target.value as Category)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700"
          >
            {LIFE_AREAS.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={!quickTitle.trim()}
            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Block</span>
          </button>
        </div>
      </form>

      {/* Assign Existing Task to an Hour Slot */}
      {unscheduledActiveTodos.length > 0 && (
        <form
          onSubmit={handleAssignExistingTask}
          className="flex flex-wrap items-center gap-1.5 pt-1"
        >
          <label htmlFor="assign-existing-task" className="sr-only">
            Pick unscheduled task
          </label>
          <select
            id="assign-existing-task"
            value={assignTaskId}
            onChange={(e) => setAssignTaskId(e.target.value)}
            className="flex-1 min-w-[140px] text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 truncate"
          >
            <option value="">Assign existing task to hour...</option>
            {unscheduledActiveTodos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} ({t.category})
              </option>
            ))}
          </select>

          <label htmlFor="assign-target-hour" className="sr-only">
            Target hour
          </label>
          <select
            id="assign-target-hour"
            value={assignHour}
            onChange={(e) => setAssignHour(Number(e.target.value))}
            className="text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700"
          >
            {Array.from({ length: 15 }, (_, idx) => idx + 7).map((h) => (
              <option key={h} value={h}>
                {formatHourSlotLabel(h)}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={!assignTaskId}
            className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white text-xs font-semibold rounded-lg cursor-pointer"
          >
            Place
          </button>
        </form>
      )}

      {/* Hourly Timeline Slots (07:00 AM to 09:00 PM) */}
      <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-[460px] overflow-y-auto">
        {hourlySlots.map((slot) => {
          const hasTasks = slot.tasks.length > 0;
          return (
            <div
              key={slot.hour}
              data-testid={`hourly-slot-${slot.hour}`}
              className={`flex items-start gap-2.5 px-3 py-2 text-xs transition-colors ${
                hasTasks ? 'bg-emerald-50/35' : 'hover:bg-slate-50/70'
              }`}
            >
              <div className="w-16 shrink-0 pt-0.5 font-mono text-[11px] font-semibold text-slate-500">
                {slot.label}
              </div>

              <div className="flex-1 min-w-0 space-y-1.5">
                {hasTasks ? (
                  slot.tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`p-2 rounded-lg border flex items-center justify-between gap-2 ${
                        task.completed
                          ? 'bg-slate-50 border-slate-200 opacity-65'
                          : 'bg-white border-emerald-200 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          type="button"
                          onClick={() => onToggleTodo(task.id)}
                          aria-label={`Toggle "${task.title}" completion`}
                          className="text-slate-400 hover:text-emerald-600 shrink-0 cursor-pointer"
                        >
                          {task.completed ? (
                            <CheckCircle2
                              className="w-3.5 h-3.5 text-emerald-600"
                              aria-hidden="true"
                            />
                          ) : (
                            <Circle
                              className="w-3.5 h-3.5"
                              aria-hidden="true"
                            />
                          )}
                        </button>
                        <div className="min-w-0">
                          <p
                            className={`text-xs font-semibold truncate ${
                              task.completed
                                ? 'line-through text-slate-400'
                                : 'text-slate-900'
                            }`}
                          >
                            {task.title}
                          </p>
                          <span className="text-[10px] font-medium text-emerald-800">
                            {task.category}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          onAssignScheduledHour(
                            task.id,
                            undefined,
                            selectedDate
                          )
                        }
                        aria-label={`Remove "${task.title}" from ${slot.label}`}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded shrink-0 cursor-pointer"
                      >
                        <X className="w-3 h-3" aria-hidden="true" />
                      </button>
                    </div>
                  ))
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setQuickHour(slot.hour);
                      const el = document.getElementById('hourly-quick-title');
                      if (el) el.focus();
                    }}
                    className="w-full text-left py-0.5 text-[11px] text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    + Open slot — click to schedule at {slot.label}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
