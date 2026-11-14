import React, { useState, useMemo } from 'react';
import {
  Clock,
  Plus,
  CheckCircle2,
  Circle,
  X,
  Calendar as CalendarIcon,
  GripVertical,
  ArrowDownToLine,
} from 'lucide-react';
import {
  Category,
  LIFE_AREAS,
  Priority,
  TodoItem,
  HOURLY_DRAG_MIME_TYPE,
  formatHourSlotLabel,
  getHourlyScheduleForDate,
  getTodayIsoDate,
} from '../utils/todoLogic';

interface HourlyCalendarPanelProps {
  todos: TodoItem[];
  activeDraggedTaskId?: string | null;
  onDragStartTask?: (todoId: string) => void;
  onDragEndTask?: () => void;
  onToggleTodo: (id: string) => void;
  onAssignScheduledHour: (
    todoId: string,
    hour: number | undefined,
    dateIso: string
  ) => void;
  onScheduleBrainDumpAtHour?: (
    dumpId: string,
    hour: number,
    dateIso: string
  ) => string | null;
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
  activeDraggedTaskId = null,
  onDragStartTask,
  onDragEndTask,
  onToggleTodo,
  onAssignScheduledHour,
  onScheduleBrainDumpAtHour,
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

  // Drag-and-drop + Pull-to-Slot state for hour slots
  const [localDraggedTaskId, setLocalDraggedTaskId] = useState<string | null>(
    null
  );
  const [pulledCardIdForSlotClick, setPulledCardIdForSlotClick] = useState<
    string | null
  >(null);
  const [dragOverHour, setDragOverHour] = useState<number | null>(null);
  const [lastDropBanner, setLastDropBanner] = useState<string | null>(null);

  const effectiveDraggedId =
    activeDraggedTaskId ?? localDraggedTaskId ?? pulledCardIdForSlotClick;

  const draggedTaskObj = useMemo(
    () =>
      effectiveDraggedId
        ? todos.find((t) => t.id === effectiveDraggedId) ?? null
        : null,
    [todos, effectiveDraggedId]
  );

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

  const showDropBanner = (msg: string) => {
    setLastDropBanner(msg);
    window.setTimeout(() => {
      setLastDropBanner(null);
    }, 3500);
  };

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
    const matched = todos.find((t) => t.id === assignTaskId);
    onAssignScheduledHour(assignTaskId, assignHour, selectedDate);
    if (matched) {
      showDropBanner(
        `Scheduled "${matched.title}" at ${formatHourSlotLabel(assignHour)}`
      );
    }
    setAssignTaskId('');
  };

  const handleStartDragChip = (
    e: React.DragEvent<HTMLElement>,
    todoId: string
  ) => {
    e.dataTransfer.setData(HOURLY_DRAG_MIME_TYPE, todoId);
    e.dataTransfer.setData('text/plain', todoId);
    e.dataTransfer.effectAllowed = 'move';
    setLocalDraggedTaskId(todoId);
    if (onDragStartTask) {
      onDragStartTask(todoId);
    }
  };

  const handleEndDragChip = () => {
    setLocalDraggedTaskId(null);
    setDragOverHour(null);
    if (onDragEndTask) {
      onDragEndTask();
    }
  };

  const handleSlotDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    hour: number
  ) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverHour !== hour) {
      setDragOverHour(hour);
    }
  };

  const handleSlotDrop = (
    e: React.DragEvent<HTMLDivElement>,
    hour: number
  ) => {
    e.preventDefault();
    const transferredId =
      e.dataTransfer.getData(HOURLY_DRAG_MIME_TYPE) ||
      e.dataTransfer.getData('text/plain') ||
      effectiveDraggedId;
    setDragOverHour(null);
    setLocalDraggedTaskId(null);
    setPulledCardIdForSlotClick(null);
    if (onDragEndTask) {
      onDragEndTask();
    }
    if (!transferredId) return;

    if (transferredId.startsWith('braindump:') && onScheduleBrainDumpAtHour) {
      const dumpId = transferredId.replace('braindump:', '');
      const title = onScheduleBrainDumpAtHour(dumpId, hour, selectedDate);
      if (title) {
        showDropBanner(
          `Pulled Brain Dump card "${title}" into ${formatHourSlotLabel(hour)}!`
        );
      }
      return;
    }

    const matched = todos.find((t) => t.id === transferredId);
    if (!matched) return;

    onAssignScheduledHour(transferredId, hour, selectedDate);
    showDropBanner(
      `Scheduled "${matched.title}" into ${formatHourSlotLabel(hour)}`
    );
  };

  return (
    <section
      aria-label="Hourly Calendar Schedule"
      data-testid="right-hourly-calendar-panel"
      className={`bg-white border rounded-xl p-4 space-y-3.5 transition-all shadow-2xs ${
        effectiveDraggedId
          ? 'border-blue-600 ring-2 ring-blue-500/20'
          : 'border-slate-200'
      }`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-[180px]">
          <div className="flex items-center gap-1.5">
            <Clock
              className="w-4 h-4 text-blue-600 shrink-0"
              aria-hidden="true"
            />
            <h2 className="text-sm font-bold text-slate-900 whitespace-nowrap">
              Hourly Calendar
            </h2>
            <span
              data-testid="hourly-scheduled-count"
              className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap"
            >
              {scheduledCount} blocks
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Drag any task from your list—or from the tray below—into an hour
            slot (07:00 AM – 09:00 PM).
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

      {/* Live Drag Banner / Drop Confirmation Banner */}
      {draggedTaskObj && (
        <div
          data-testid="hourly-active-drag-hint"
          className="bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-2"
        >
          <ArrowDownToLine
            className="w-4 h-4 text-emerald-700 shrink-0"
            aria-hidden="true"
          />
          <span className="truncate">
            Dragging &ldquo;{draggedTaskObj.title}&rdquo; — drop onto any hour
            slot below!
          </span>
        </div>
      )}

      {lastDropBanner && !draggedTaskObj && (
        <div
          role="status"
          data-testid="hourly-drop-confirmation"
          className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-2"
        >
          <CheckCircle2
            className="w-4 h-4 text-emerald-600 shrink-0"
            aria-hidden="true"
          />
          <span>{lastDropBanner}</span>
        </div>
      )}

      {/* Draggable & Pullable Unscheduled Cards Tray (Pull/Drag or Click to Place into Hour Slot) */}
      {unscheduledActiveTodos.length > 0 && (
        <div
          data-testid="hourly-draggable-pool"
          className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-2.5 space-y-2"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-900 flex items-center gap-1">
              <GripVertical
                className="w-3.5 h-3.5 text-blue-600"
                aria-hidden="true"
              />
              <span>Pull / Drag Card into Hour Slot below:</span>
            </span>
            <span className="text-[10px] font-mono text-blue-700 font-semibold">
              {unscheduledActiveTodos.length} unscheduled cards
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-0.5">
            {unscheduledActiveTodos.map((task) => {
              const isSelectedToPull = pulledCardIdForSlotClick === task.id;
              return (
                <div
                  key={task.id}
                  draggable
                  data-testid={`draggable-unscheduled-task-${task.id}`}
                  onDragStart={(e) => handleStartDragChip(e, task.id)}
                  onDragEnd={handleEndDragChip}
                  onClick={() =>
                    setPulledCardIdForSlotClick((prev) =>
                      prev === task.id ? null : task.id
                    )
                  }
                  title={`Pull "${task.title}" onto an hour slot below (or click card then click an hour slot)`}
                  className={`px-2.5 py-1.5 border rounded-lg text-[11px] font-medium flex items-center gap-1.5 shadow-2xs cursor-grab active:cursor-grabbing select-none transition-all max-w-full ${
                    isSelectedToPull
                      ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-300'
                      : 'bg-white hover:bg-blue-50/70 border-slate-200 hover:border-blue-400 text-slate-800'
                  }`}
                >
                  <GripVertical
                    className={`w-3 h-3 shrink-0 ${
                      isSelectedToPull ? 'text-blue-100' : 'text-slate-400'
                    }`}
                    aria-hidden="true"
                  />
                  <span className="truncate max-w-[175px]">{task.title}</span>
                  <span
                    className={`text-[9px] font-mono uppercase px-1 py-0.2 rounded shrink-0 ${
                      isSelectedToPull
                        ? 'bg-blue-700 text-white'
                        : 'bg-purple-50 text-purple-800 border border-purple-200/70'
                    }`}
                  >
                    {task.category}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

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

      {/* Assign Existing Task to an Hour Slot (Keyboard / Select Fallback) */}
      {unscheduledActiveTodos.length > 0 && (
        <form
          onSubmit={handleAssignExistingTask}
          className="flex flex-wrap items-center gap-1.5 pt-0.5"
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
            <option value="">Or select task to place...</option>
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

      {/* Hourly Timeline Drop Zones (07:00 AM to 09:00 PM) */}
      <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
        {hourlySlots.map((slot) => {
          const hasTasks = slot.tasks.length > 0;
          const isDragOver = dragOverHour === slot.hour;
          return (
            <div
              key={slot.hour}
              data-testid={`hourly-slot-${slot.hour}`}
              data-hourly-slot-hour={slot.hour}
              onDragOver={(e) => handleSlotDragOver(e, slot.hour)}
              onDragEnter={(e) => handleSlotDragOver(e, slot.hour)}
              onDragLeave={() => {
                if (dragOverHour === slot.hour) {
                  setDragOverHour(null);
                }
              }}
              onDrop={(e) => handleSlotDrop(e, slot.hour)}
              className={`flex items-start gap-2.5 px-3 py-2.5 text-xs transition-all ${
                isDragOver
                  ? 'bg-emerald-100/80 ring-2 ring-inset ring-emerald-500'
                  : hasTasks
                    ? 'bg-emerald-50/35'
                    : effectiveDraggedId
                      ? 'bg-emerald-50/20 hover:bg-emerald-100/60'
                      : 'hover:bg-slate-50/70'
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
                      draggable
                      data-testid={`hourly-scheduled-task-${task.id}`}
                      onDragStart={(e) => handleStartDragChip(e, task.id)}
                      onDragEnd={handleEndDragChip}
                      title="Drag to move to another hour slot"
                      className={`p-2 rounded-lg border flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing ${
                        task.completed
                          ? 'bg-slate-50 border-slate-200 opacity-65'
                          : 'bg-white border-emerald-200 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <GripVertical
                          className="w-3.5 h-3.5 text-slate-300 shrink-0"
                          aria-hidden="true"
                        />
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
                ) : null}

                {isDragOver ? (
                  <div
                    data-testid={`hourly-drop-indicator-${slot.hour}`}
                    className="py-1.5 px-2.5 rounded-lg border-2 border-dashed border-emerald-500 bg-white/90 text-[11px] font-semibold text-emerald-900 flex items-center gap-1.5"
                  >
                    <ArrowDownToLine
                      className="w-3.5 h-3.5 text-emerald-600 shrink-0"
                      aria-hidden="true"
                    />
                    <span>
                      Drop card here to schedule at {slot.label}
                    </span>
                  </div>
                ) : !hasTasks || effectiveDraggedId ? (
                  <button
                    type="button"
                    data-testid={`hourly-place-slot-btn-${slot.hour}`}
                    onClick={() => {
                      if (effectiveDraggedId && draggedTaskObj) {
                        onAssignScheduledHour(
                          draggedTaskObj.id,
                          slot.hour,
                          selectedDate
                        );
                        showDropBanner(
                          `Placed "${draggedTaskObj.title}" into ${slot.label}`
                        );
                        setPulledCardIdForSlotClick(null);
                        setLocalDraggedTaskId(null);
                        if (onDragEndTask) onDragEndTask();
                        return;
                      }
                      setQuickHour(slot.hour);
                      const el = document.getElementById('hourly-quick-title');
                      if (el) el.focus();
                    }}
                    className={`w-full text-left py-1 px-2 rounded-lg text-[11px] transition-colors cursor-pointer ${
                      effectiveDraggedId
                        ? 'bg-emerald-100/90 hover:bg-emerald-200 text-emerald-950 font-semibold border border-dashed border-emerald-500'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {effectiveDraggedId && draggedTaskObj
                      ? `↳ Place "${draggedTaskObj.title}" here at ${slot.label}`
                      : `+ Pull any card here or click for ${slot.label}`}
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
