import React, { useState, useEffect, useMemo } from 'react';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import {
  Category,
  LIFE_AREAS,
  TodoItem,
  FocusTimerMode,
  FocusSessionLog,
  formatTimerDisplay,
  computeFocusTimerStats,
} from '../utils/todoLogic';

interface FocusDoteTimerProps {
  todos: TodoItem[];
  focusLogs: FocusSessionLog[];
  onLogSession: (params: {
    taskId?: string;
    taskTitle: string;
    category: Category;
    durationMinutes: number;
    mode: FocusTimerMode;
  }) => void;
  onCompleteLinkedTask?: (taskId: string) => void;
}

const MODE_PRESETS: Array<{
  mode: FocusTimerMode;
  label: string;
  seconds: number;
  defaultMinutes: number;
}> = [
  {
    mode: 'pomodoro_25',
    label: '25m Dote Focus',
    seconds: 25 * 60,
    defaultMinutes: 25,
  },
  {
    mode: 'deep_50',
    label: '50m Deep Block',
    seconds: 50 * 60,
    defaultMinutes: 50,
  },
  {
    mode: 'sprint_15',
    label: '15m Quick Sprint',
    seconds: 15 * 60,
    defaultMinutes: 15,
  },
  {
    mode: 'stopwatch',
    label: 'Stopwatch',
    seconds: 0,
    defaultMinutes: 20,
  },
];

const AREA_DOT_COLORS: Record<Category, string> = {
  Portfolio: 'bg-emerald-600',
  Karma: 'bg-amber-500',
  Knowledge: 'bg-blue-600',
  Personality: 'bg-purple-600',
  Social: 'bg-rose-500',
  Strength: 'bg-red-600',
  Aesthetics: 'bg-teal-600',
};

export const FocusDoteTimer: React.FC<FocusDoteTimerProps> = ({
  todos,
  focusLogs,
  onLogSession,
  onCompleteLinkedTask,
}) => {
  const activeTodos = useMemo(
    () => todos.filter((t) => !t.completed),
    [todos]
  );

  const [mode, setMode] = useState<FocusTimerMode>('pomodoro_25');
  const [secondsLeft, setSecondsLeft] = useState<number>(25 * 60);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>(
    () => activeTodos[0]?.id ?? ''
  );
  const [selectedCategory, setSelectedCategory] =
    useState<Category>('Portfolio');

  const selectedTask = useMemo(
    () => todos.find((t) => t.id === selectedTaskId),
    [todos, selectedTaskId]
  );

  const stats = useMemo(
    () => computeFocusTimerStats(focusLogs),
    [focusLogs]
  );

  const currentPreset = useMemo(
    () => MODE_PRESETS.find((p) => p.mode === mode) ?? MODE_PRESETS[0],
    [mode]
  );

  useEffect(() => {
    if (!isRunning) return;
    const interval = window.setInterval(() => {
      if (mode === 'stopwatch') {
        setElapsedSeconds((prev) => prev + 1);
      } else {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isRunning, mode]);

  const handleSelectMode = (nextMode: FocusTimerMode) => {
    setIsRunning(false);
    setMode(nextMode);
    const preset =
      MODE_PRESETS.find((p) => p.mode === nextMode) ?? MODE_PRESETS[0];
    setSecondsLeft(preset.seconds);
    setElapsedSeconds(0);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(currentPreset.seconds);
    setElapsedSeconds(0);
  };

  const handleFinishAndLogSession = () => {
    setIsRunning(false);
    const loggedMinutes =
      mode === 'stopwatch'
        ? Math.max(5, Math.round(elapsedSeconds / 60) || 20)
        : currentPreset.defaultMinutes;

    onLogSession({
      taskId: selectedTask?.id,
      taskTitle: selectedTask?.title ?? `${selectedCategory} Deep Focus`,
      category: selectedTask?.category ?? selectedCategory,
      durationMinutes: loggedMinutes,
      mode,
    });
    handleReset();
  };

  const displaySeconds = mode === 'stopwatch' ? elapsedSeconds : secondsLeft;
  const progressFraction =
    mode === 'stopwatch'
      ? Math.min(1, (elapsedSeconds % 1800) / 1800)
      : currentPreset.seconds > 0
      ? (currentPreset.seconds - secondsLeft) / currentPreset.seconds
      : 0;

  const circleRadius = 76;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference * (1 - progressFraction);

  return (
    <div data-testid="focus-dotetimer" className="space-y-4 @container">
      {/* Main DoteTimer Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 @sm:p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Timer className="w-5 h-5 text-emerald-700" aria-hidden="true" />
              <h1 className="text-lg @sm:text-xl font-bold tracking-tight text-slate-900 font-display">
                DoteTimer Focus Studio
              </h1>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Collect focus dots across your 7 Life Areas with distraction-free
              time blocks.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
            <Sparkles
              className="w-3.5 h-3.5 text-emerald-700"
              aria-hidden="true"
            />
            <span
              data-testid="dotetimer-total-minutes"
              className="text-xs font-mono font-bold text-emerald-900"
            >
              {stats.totalMinutes}m focused ({stats.totalSessions} dots)
            </span>
          </div>
        </div>

        {/* Mode Selector */}
        <div
          role="group"
          aria-label="Focus timer mode"
          className="grid grid-cols-2 @sm:grid-cols-4 gap-1.5 bg-slate-100 p-1 rounded-xl"
        >
          {MODE_PRESETS.map((preset) => (
            <button
              key={preset.mode}
              type="button"
              onClick={() => handleSelectMode(preset.mode)}
              className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                mode === preset.mode
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Circular Timer Ring + Task Link Controls */}
        <div className="grid grid-cols-1 @lg:grid-cols-12 gap-5 items-center pt-1">
          {/* Left: SVG Ring Readout */}
          <div className="@lg:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg
                viewBox="0 0 180 180"
                className="w-full h-full -rotate-90 select-none"
              >
                <circle
                  cx="90"
                  cy="90"
                  r={circleRadius}
                  fill="none"
                  stroke="#f1f5f9"
                  strokeWidth="10"
                />
                <circle
                  cx="90"
                  cy="90"
                  r={circleRadius}
                  fill="none"
                  stroke="#059669"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span
                  data-testid="dotetimer-readout"
                  className="text-3xl font-bold font-mono tabular-nums tracking-tight text-slate-900"
                >
                  {formatTimerDisplay(displaySeconds)}
                </span>
                <span className="text-[11px] font-medium text-emerald-700 mt-0.5">
                  {selectedTask ? selectedTask.category : selectedCategory}
                </span>
              </div>
            </div>

            {/* Play / Pause / Log Dote Controls */}
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => setIsRunning((prev) => !prev)}
                data-testid="dotetimer-start-pause"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {isRunning ? (
                  <>
                    <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Start Focus</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleFinishAndLogSession}
                data-testid="dotetimer-log-session"
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Log Dote</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                aria-label="Reset focus timer"
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Right: Linked Task & Visual Dote Collection Grid */}
          <div className="@lg:col-span-7 space-y-3.5">
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="dotetimer-task-select"
                  className="text-xs font-bold text-slate-700"
                >
                  Linked Focus Task
                </label>
                {selectedTask && onCompleteLinkedTask && (
                  <button
                    type="button"
                    onClick={() => onCompleteLinkedTask(selectedTask.id)}
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                  >
                    Mark Task Done
                  </button>
                )}
              </div>

              <select
                id="dotetimer-task-select"
                value={selectedTaskId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  setSelectedTaskId(nextId);
                  const found = todos.find((t) => t.id === nextId);
                  if (found) setSelectedCategory(found.category);
                }}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800"
              >
                <option value="">General Area Focus (Unlinked)</option>
                {activeTodos.map((t) => (
                  <option key={t.id} value={t.id}>
                    [{t.category}] {t.title}
                  </option>
                ))}
              </select>

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {LIFE_AREAS.map((area) => {
                  const activeArea =
                    (selectedTask?.category ?? selectedCategory) === area;
                  return (
                    <button
                      key={area}
                      type="button"
                      onClick={() => {
                        setSelectedTaskId('');
                        setSelectedCategory(area);
                      }}
                      className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                        activeArea
                          ? 'bg-slate-900 text-white'
                          : 'bg-white border border-slate-200 text-slate-600'
                      }`}
                    >
                      {area}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Visual Dote Grid (Collected Session Dots) */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-slate-800">
                  Today&apos;s Focus Dotes ({focusLogs.length})
                </h2>
                <span className="text-[11px] font-mono text-slate-500">
                  1 dot = 1 completed block
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {focusLogs.map((log) => (
                  <div
                    key={log.id}
                    title={`${log.taskTitle} (${log.durationMinutes}m · ${log.category})`}
                    className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-full px-2.5 py-1 text-[11px]"
                  >
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        AREA_DOT_COLORS[log.category]
                      }`}
                    />
                    <span className="font-medium text-slate-800 max-w-[130px] truncate">
                      {log.taskTitle}
                    </span>
                    <span className="font-mono font-bold text-slate-500">
                      {log.durationMinutes}m
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
