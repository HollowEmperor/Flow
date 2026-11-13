import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Check,
  ExternalLink,
  LogOut,
  Plus,
  RefreshCw,
  Trash2,
  UploadCloud,
  AlertTriangle,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  Category,
  LIFE_AREAS,
  Priority,
  TodoItem,
  getTodayIsoDate,
} from '../utils/todoLogic';
import {
  GoogleCalendarEventItem,
  initAuth,
  googleSignIn,
  logout,
  listGoogleCalendarEvents,
  createGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
} from '../utils/googleCalendarAuth';

interface CalendarWorkspaceProps {
  todos: TodoItem[];
  onToggleTodo: (id: string) => void;
  onAddTodoOnDate: (params: {
    title: string;
    notes: string;
    priority: Priority;
    category: Category;
    dueDate: string;
    isRepeating: boolean;
  }) => void;
}

interface PendingCalendarConfirmation {
  type: 'create' | 'delete';
  title: string;
  description: string;
  dateIso?: string;
  eventId?: string;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function formatYearMonthDay(year: number, monthIndex: number, day: number): string {
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function getEventDateIso(ev: GoogleCalendarEventItem): string {
  if (ev.start?.date) return ev.start.date;
  if (ev.start?.dateTime) return ev.start.dateTime.slice(0, 10);
  return '';
}

export const CalendarWorkspace: React.FC<CalendarWorkspaceProps> = ({
  todos,
  onToggleTodo,
  onAddTodoOnDate,
}) => {
  const todayIso = getTodayIsoDate();
  const initialDateParts = todayIso.split('-').map(Number);

  const [viewYear, setViewYear] = useState<number>(initialDateParts[0]);
  const [viewMonth, setViewMonth] = useState<number>(initialDateParts[1] - 1); // 0-indexed
  const [selectedDateIso, setSelectedDateIso] = useState<string>(todayIso);

  // Google Auth & Calendar API State
  const [needsAuth, setNeedsAuth] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(false);
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEventItem[]>([]);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Confirmation dialog state for mutating/destructive Google Calendar API operations
  const [pendingConfirm, setPendingConfirm] =
    useState<PendingCalendarConfirmation | null>(null);
  const [isMutatingCalendar, setIsMutatingCalendar] = useState<boolean>(false);

  // Quick add task on selected date
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<Category>('Portfolio');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('medium');

  const fetchMonthEvents = useCallback(
    async (year: number, monthIndex: number) => {
      setIsLoadingEvents(true);
      setSyncError(null);
      try {
        const startOfMonth = new Date(year, monthIndex, 1, 0, 0, 0);
        const endOfMonth = new Date(year, monthIndex + 1, 0, 23, 59, 59);
        const items = await listGoogleCalendarEvents(
          startOfMonth.toISOString(),
          endOfMonth.toISOString()
        );
        setGoogleEvents(items);
      } catch (err: any) {
        if (err?.message === 'AUTH_REQUIRED') {
          setNeedsAuth(true);
        } else {
          setSyncError(
            err?.message || 'Could not load Google Calendar events.'
          );
        }
      } finally {
        setIsLoadingEvents(false);
      }
    },
    []
  );

  useEffect(() => {
    const unsubscribe = initAuth(
      (authedUser) => {
        setUser(authedUser);
        setNeedsAuth(false);
        fetchMonthEvents(viewYear, viewMonth);
      },
      () => {
        setUser(null);
        setNeedsAuth(true);
        setGoogleEvents([]);
      }
    );
    return () => unsubscribe();
  }, [fetchMonthEvents, viewYear, viewMonth]);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setSyncError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setNeedsAuth(false);
        await fetchMonthEvents(viewYear, viewMonth);
      }
    } catch (err: any) {
      setSyncError(
        err?.message || 'Google Sign-In was cancelled or could not complete.'
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logout();
    setUser(null);
    setNeedsAuth(true);
    setGoogleEvents([]);
    setSyncMessage(null);
  };

  const handleConfirmCalendarMutation = async () => {
    if (!pendingConfirm) return;
    setIsMutatingCalendar(true);
    setSyncError(null);
    try {
      if (pendingConfirm.type === 'create' && pendingConfirm.dateIso) {
        await createGoogleCalendarEvent({
          summary: pendingConfirm.title,
          description: pendingConfirm.description,
          dateIso: pendingConfirm.dateIso,
        });
        setSyncMessage(
          `Added "${pendingConfirm.title}" to your Google Calendar (${pendingConfirm.dateIso}).`
        );
      } else if (pendingConfirm.type === 'delete' && pendingConfirm.eventId) {
        await deleteGoogleCalendarEvent(pendingConfirm.eventId);
        setSyncMessage(
          `Removed "${pendingConfirm.title}" from your Google Calendar.`
        );
      }
      setPendingConfirm(null);
      await fetchMonthEvents(viewYear, viewMonth);
    } catch (err: any) {
      if (err?.message === 'AUTH_REQUIRED') {
        setNeedsAuth(true);
        setPendingConfirm(null);
      } else {
        setSyncError(err?.message || 'Google Calendar update failed.');
      }
    } finally {
      setIsMutatingCalendar(false);
    }
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleJumpToday = () => {
    const parts = todayIso.split('-').map(Number);
    setViewYear(parts[0]);
    setViewMonth(parts[1] - 1);
    setSelectedDateIso(todayIso);
  };

  // Compute calendar grid cells for viewYear & viewMonth
  const calendarCells = useMemo(() => {
    const firstDayWeekday = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const cells: Array<{
      dateIso: string | null;
      dayNumber: number | null;
    }> = [];

    for (let i = 0; i < firstDayWeekday; i++) {
      cells.push({ dateIso: null, dayNumber: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        dateIso: formatYearMonthDay(viewYear, viewMonth, d),
        dayNumber: d,
      });
    }
    return cells;
  }, [viewYear, viewMonth]);

  // Index tasks and Google Calendar events by YYYY-MM-DD
  const todosByDate = useMemo(() => {
    const map: Record<string, TodoItem[]> = {};
    for (const t of todos) {
      if (!map[t.dueDate]) map[t.dueDate] = [];
      map[t.dueDate].push(t);
    }
    return map;
  }, [todos]);

  const gcalByDate = useMemo(() => {
    const map: Record<string, GoogleCalendarEventItem[]> = {};
    for (const ev of googleEvents) {
      const iso = getEventDateIso(ev);
      if (iso) {
        if (!map[iso]) map[iso] = [];
        map[iso].push(ev);
      }
    }
    return map;
  }, [googleEvents]);

  const selectedDayTodos = todosByDate[selectedDateIso] ?? [];
  const selectedDayGcalEvents = gcalByDate[selectedDateIso] ?? [];

  const handleAddOnSelectedDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    onAddTodoOnDate({
      title: newTaskTitle,
      notes: '',
      category: newTaskCategory,
      priority: newTaskPriority,
      dueDate: selectedDateIso,
      isRepeating: false,
    });
    setNewTaskTitle('');
  };

  return (
    <div className="space-y-6" data-testid="calendar-workspace-view">
      {/* Confirmation Modal for Mutating/Destructive Google Calendar Actions */}
      {pendingConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="gcal-confirm-title"
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <h2
                  id="gcal-confirm-title"
                  className="text-base font-bold text-slate-900 font-display"
                >
                  {pendingConfirm.type === 'create'
                    ? 'Add Event to Google Calendar?'
                    : 'Delete Event from Google Calendar?'}
                </h2>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  {pendingConfirm.type === 'create'
                    ? `Please confirm that you want to create the event "${pendingConfirm.title}" on your primary Google Calendar for ${pendingConfirm.dateIso}.`
                    : `Are you sure you want to permanently delete "${pendingConfirm.title}" from your Google Calendar? This action cannot be undone.`}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isMutatingCalendar}
                onClick={() => setPendingConfirm(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isMutatingCalendar}
                onClick={handleConfirmCalendarMutation}
                className={`px-4 py-2 text-xs font-semibold text-white rounded-lg cursor-pointer ${
                  pendingConfirm.type === 'delete'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isMutatingCalendar
                  ? 'Updating...'
                  : pendingConfirm.type === 'create'
                  ? 'Confirm & Add to Google Calendar'
                  : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header & Google Calendar Connection Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">
            Schedule & Google Calendar Sync
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Plan daily tasks across the month and sync your schedule with Google
            Calendar.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {needsAuth ? (
            /* Official Sign in with Google button style */
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              data-testid="google-signin-button"
              className="inline-flex items-center gap-2.5 bg-white hover:bg-slate-50 text-slate-800 font-medium text-xs px-4 py-2.5 rounded-full border border-slate-300 shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
            >
              <div className="w-4 h-4 shrink-0">
                <svg
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  className="w-full h-full block"
                >
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                  <path fill="none" d="M0 0h48v48H0z" />
                </svg>
              </div>
              <span>
                {isLoggingIn ? 'Signing in...' : 'Sign in with Google'}
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 hidden sm:inline">
                Connected as{' '}
                <strong className="text-slate-900">
                  {user?.email || user?.displayName || 'Google User'}
                </strong>
              </span>
              <button
                type="button"
                onClick={() => fetchMonthEvents(viewYear, viewMonth)}
                disabled={isLoadingEvents}
                aria-label="Refresh Google Calendar events"
                className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    isLoadingEvents ? 'animate-spin' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>
              <button
                type="button"
                onClick={handleGoogleLogout}
                className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {syncMessage && (
        <div
          role="status"
          aria-live="polite"
          className="px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 flex items-center justify-between"
        >
          <span>{syncMessage}</span>
          <button
            type="button"
            onClick={() => setSyncMessage(null)}
            className="text-emerald-700 underline ml-3"
          >
            Dismiss
          </button>
        </div>
      )}

      {syncError && (
        <div
          role="alert"
          className="px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700 flex items-center justify-between"
        >
          <span>{syncError}</span>
          <button
            type="button"
            onClick={() => setSyncError(null)}
            className="text-red-700 underline ml-3"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Calendar Grid & Selected Day Detail Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Monthly Calendar Grid (7 cols) */}
        <section
          aria-label="Monthly calendar"
          className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 font-display">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </h2>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleJumpToday}
                className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label="Previous month"
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="Next month"
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-400 pb-2 border-b border-slate-100">
            {WEEKDAYS.map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="mt-2 grid grid-cols-7 gap-1">
            {calendarCells.map((cell, idx) => {
              if (!cell.dateIso || cell.dayNumber === null) {
                return <div key={`empty-${idx}`} className="h-16" />;
              }

              const dayTasks = todosByDate[cell.dateIso] ?? [];
              const dayGcal = gcalByDate[cell.dateIso] ?? [];
              const isSelected = cell.dateIso === selectedDateIso;
              const isToday = cell.dateIso === todayIso;
              const activeCount = dayTasks.filter((t) => !t.completed).length;
              const completedCount = dayTasks.length - activeCount;

              return (
                <button
                  key={cell.dateIso}
                  type="button"
                  onClick={() => setSelectedDateIso(cell.dateIso!)}
                  data-testid={`calendar-day-${cell.dateIso}`}
                  className={`h-16 p-1.5 rounded-lg border text-left flex flex-col justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900'
                      : isToday
                      ? 'bg-emerald-50/50 border-emerald-300 text-slate-900'
                      : 'bg-white border-slate-100 hover:border-slate-300 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-mono tabular-nums font-semibold ${
                        isSelected
                          ? 'text-white'
                          : isToday
                          ? 'text-emerald-700 font-bold'
                          : 'text-slate-700'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>
                    {dayGcal.length > 0 && (
                      <span
                        className={`text-[10px] font-mono ${
                          isSelected ? 'text-blue-300' : 'text-blue-600'
                        }`}
                        title={`${dayGcal.length} Google Calendar events`}
                      >
                        G:{dayGcal.length}
                      </span>
                    )}
                  </div>

                  {/* Task indicators */}
                  {(activeCount > 0 || completedCount > 0) && (
                    <div className="text-[10px] font-mono tabular-nums truncate">
                      {activeCount > 0 && (
                        <span
                          className={
                            isSelected ? 'text-emerald-300' : 'text-slate-600'
                          }
                        >
                          {activeCount} due
                        </span>
                      )}
                      {activeCount === 0 && completedCount > 0 && (
                        <span
                          className={
                            isSelected ? 'text-slate-300' : 'text-emerald-700'
                          }
                        >
                          {completedCount} done
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Selected Date Agenda & Google Calendar Sync Panel (5 cols) */}
        <section
          aria-label="Selected date schedule"
          className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-5"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <CalendarIcon
                className="w-4 h-4 text-slate-500"
                aria-hidden="true"
              />
              <h2 className="text-sm font-bold text-slate-900 font-mono tabular-nums">
                {selectedDateIso === todayIso
                  ? `Today (${selectedDateIso})`
                  : selectedDateIso}
              </h2>
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {selectedDayTodos.length} tasks · {selectedDayGcalEvents.length}{' '}
              GCal
            </span>
          </div>

          {/* Local FocusFlow Tasks on Selected Date */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold text-slate-500">
              FocusFlow Tasks Due on {selectedDateIso}
            </h3>

            {selectedDayTodos.length > 0 ? (
              <ul className="space-y-2">
                {selectedDayTodos.map((task) => (
                  <li
                    key={task.id}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-2"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => onToggleTodo(task.id)}
                        aria-label={`Toggle completion for "${task.title}"`}
                        className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 cursor-pointer ${
                          task.completed
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'bg-white border-slate-300'
                        }`}
                      >
                        {task.completed && (
                          <Check className="w-3 h-3" aria-hidden="true" />
                        )}
                      </button>
                      <div className="min-w-0">
                        <p
                          className={`text-xs font-medium break-words ${
                            task.completed
                              ? 'line-through text-slate-400'
                              : 'text-slate-900'
                          }`}
                        >
                          {task.title}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {task.category} · {task.priority} priority
                        </p>
                      </div>
                    </div>

                    {!needsAuth && (
                      <button
                        type="button"
                        onClick={() =>
                          setPendingConfirm({
                            type: 'create',
                            title: task.title,
                            description: `${task.notes || ''} [Life Area: ${
                              task.category
                            }]`.trim(),
                            dateIso: task.dueDate,
                          })
                        }
                        title="Push task to Google Calendar"
                        className="px-2 py-1 text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md inline-flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <UploadCloud className="w-3 h-3" aria-hidden="true" />
                        <span>Push to GCal</span>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400 py-2">
                No tasks scheduled for {selectedDateIso}.
              </p>
            )}
          </div>

          {/* Google Calendar Events on Selected Date */}
          <div className="pt-3 border-t border-slate-100 space-y-2.5">
            <h3 className="text-xs font-semibold text-slate-500">
              Google Calendar Events
            </h3>

            {needsAuth ? (
              <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200/70 rounded-lg p-3">
                Sign in with Google above to view, sync, and manage your Google
                Calendar events alongside your tasks.
              </p>
            ) : selectedDayGcalEvents.length > 0 ? (
              <ul className="space-y-2">
                {selectedDayGcalEvents.map((ev) => (
                  <li
                    key={ev.id}
                    className="p-3 rounded-lg bg-blue-50/40 border border-blue-200/70 flex items-start justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 break-words">
                        {ev.summary || '(Untitled Event)'}
                      </p>
                      {ev.description && (
                        <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">
                          {ev.description}
                        </p>
                      )}
                      {ev.htmlLink && (
                        <a
                          href={ev.htmlLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-[11px] text-blue-700 hover:underline"
                        >
                          <span>Open in Google Calendar</span>
                          <ExternalLink
                            className="w-3 h-3"
                            aria-hidden="true"
                          />
                        </a>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setPendingConfirm({
                          type: 'delete',
                          title: ev.summary || 'Untitled Event',
                          description: '',
                          eventId: ev.id,
                        })
                      }
                      aria-label={`Delete Google Calendar event "${
                        ev.summary || 'Untitled Event'
                      }"`}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400 py-1">
                No Google Calendar events on {selectedDateIso}.
              </p>
            )}
          </div>

          {/* Schedule New Task on Selected Date */}
          <form
            onSubmit={handleAddOnSelectedDate}
            className="pt-3 border-t border-slate-100 space-y-2.5"
          >
            <label
              htmlFor="calendar-new-task-input"
              className="block text-xs font-semibold text-slate-700"
            >
              Schedule Task on {selectedDateIso}
            </label>
            <input
              id="calendar-new-task-input"
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Task title..."
              className="w-full text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-400"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                aria-label="Task life area"
                value={newTaskCategory}
                onChange={(e) => setNewTaskCategory(e.target.value as Category)}
                className="text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5"
              >
                {LIFE_AREAS.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Add on Date</span>
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};
