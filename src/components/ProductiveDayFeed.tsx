import React, { useState, useMemo } from 'react';
import {
  Sun,
  Sunset,
  Moon,
  Clock,
  Check,
  ChevronDown,
  ChevronRight,
  Flame,
  Play,
  Plus,
  BarChart3,
  Trophy,
  CheckCircle2,
} from 'lucide-react';
import {
  Category,
  Priority,
  TodoItem,
  HabitItem,
  ProductiveTimeOfDay,
  ProductiveTimeFilter,
  DEFAULT_HOUR_FOR_TIME_OF_DAY,
  resolveTodoTimeOfDay,
  resolveHabitTimeOfDay,
  buildProductiveWeekRibbon,
  computeHabitCurrentStreak,
} from '../utils/todoLogic';
import { TaskRow } from './TaskRow';
import { ProductiveInfographicsPanel } from './ProductiveInfographicsPanel';

interface ProductiveDayFeedProps {
  todayIso: string;
  todos: TodoItem[];
  habits: HabitItem[];
  selectedFocusTaskId?: string | null;
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
        | 'scheduledHour'
      >
    >
  ) => void;
  onAddSubtask: (todoId: string, title: string) => void;
  onToggleSubtask: (todoId: string, subtaskId: string) => void;
  onDeleteSubtask: (todoId: string, subtaskId: string) => void;
  onAssignScheduledHour?: (
    todoId: string,
    hour: number | undefined,
    dateIso: string
  ) => void;
  onToggleHabitDate: (habitId: string, dateIso: string) => void;
  onDeployRoutineTaskToTodo?: (params: {
    title: string;
    notes: string;
    priority: Priority;
    category: Category;
    dueDate: string;
    isRepeating: boolean;
    scheduledHour?: number;
  }) => void;
  onPunchTaskDay?: (todoId: string) => void;
  onOpenBingoPunchCards?: () => void;
  onDragStartTask?: (todoId: string) => void;
  onDragEndTask?: () => void;
}

interface PhaseMeta {
  id: ProductiveTimeOfDay;
  label: string;
  timeRangeLabel: string;
  subtitle: string;
  iconBg: string;
  iconText: string;
  progressFill: string;
  icon: React.ReactNode;
}

const PHASES: PhaseMeta[] = [
  {
    id: 'morning',
    label: 'Morning',
    timeRangeLabel: '05:00 – 12:00',
    subtitle: 'Keystone rituals, hydration & high-clarity deep work',
    iconBg: 'bg-emerald-50 border border-emerald-200',
    iconText: 'text-emerald-700',
    progressFill: 'bg-emerald-600',
    icon: <Sun className="w-4 h-4" aria-hidden="true" />,
  },
  {
    id: 'afternoon',
    label: 'Afternoon',
    timeRangeLabel: '12:00 – 17:00',
    subtitle: 'Execution blocks, collaboration & momentum milestones',
    iconBg: 'bg-blue-50 border border-blue-200',
    iconText: 'text-blue-700',
    progressFill: 'bg-blue-600',
    icon: <Sunset className="w-4 h-4" aria-hidden="true" />,
  },
  {
    id: 'evening',
    label: 'Evening',
    timeRangeLabel: '17:00 – 24:00',
    subtitle: 'Reflection, reading, relationships & next-day preparation',
    iconBg: 'bg-purple-50 border border-purple-200',
    iconText: 'text-purple-700',
    progressFill: 'bg-purple-700',
    icon: <Moon className="w-4 h-4" aria-hidden="true" />,
  },
  {
    id: 'anytime',
    label: 'Anytime',
    timeRangeLabel: 'Flexible Window',
    subtitle: 'Unscheduled tasks & flexible daily habits',
    iconBg: 'bg-slate-100 border border-slate-200',
    iconText: 'text-slate-700',
    progressFill: 'bg-slate-800',
    icon: <Clock className="w-4 h-4" aria-hidden="true" />,
  },
];

export const ProductiveDayFeed: React.FC<ProductiveDayFeedProps> = ({
  todayIso,
  todos,
  habits,
  selectedFocusTaskId = null,
  onToggleTodo,
  onDeleteTodo,
  onUpdateTodo,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onAssignScheduledHour,
  onToggleHabitDate,
  onDeployRoutineTaskToTodo,
  onPunchTaskDay,
  onOpenBingoPunchCards,
  onDragStartTask,
  onDragEndTask,
}) => {
  const [selectedDateIso, setSelectedDateIso] = useState<string>(todayIso);
  const [timeFilter, setTimeFilter] = useState<ProductiveTimeFilter>('all');
  const [showInlineInfographics, setShowInlineInfographics] =
    useState<boolean>(false);
  const [collapsedPhases, setCollapsedPhases] = useState<
    Record<ProductiveTimeOfDay, boolean>
  >({
    morning: false,
    afternoon: false,
    evening: false,
    anytime: false,
  });

  const weekRibbon = useMemo(
    () => buildProductiveWeekRibbon(todayIso, todos, habits),
    [todayIso, todos, habits]
  );

  // Group habits and tasks into Morning, Afternoon, Evening, Anytime
  const groupedByPhase = useMemo(() => {
    const map: Record<
      ProductiveTimeOfDay,
      {
        habits: HabitItem[];
        todos: TodoItem[];
        completedCount: number;
        totalCount: number;
      }
    > = {
      morning: { habits: [], todos: [], completedCount: 0, totalCount: 0 },
      afternoon: { habits: [], todos: [], completedCount: 0, totalCount: 0 },
      evening: { habits: [], todos: [], completedCount: 0, totalCount: 0 },
      anytime: { habits: [], todos: [], completedCount: 0, totalCount: 0 },
    };

    for (const habit of habits) {
      const phase = resolveHabitTimeOfDay(habit);
      map[phase].habits.push(habit);
      map[phase].totalCount += 1;
      if (habit.completedDates.includes(selectedDateIso)) {
        map[phase].completedCount += 1;
      }
    }

    for (const todo of todos) {
      const phase = resolveTodoTimeOfDay(todo);
      map[phase].todos.push(todo);
      map[phase].totalCount += 1;
      if (todo.completed) {
        map[phase].completedCount += 1;
      }
    }

    return map;
  }, [habits, todos, selectedDateIso]);

  const totalItemsToday = useMemo(
    () =>
      PHASES.reduce(
        (acc, p) => acc + groupedByPhase[p.id].totalCount,
        0
      ),
    [groupedByPhase]
  );

  const completedItemsToday = useMemo(
    () =>
      PHASES.reduce(
        (acc, p) => acc + groupedByPhase[p.id].completedCount,
        0
      ),
    [groupedByPhase]
  );

  const overallCompletionPct =
    totalItemsToday > 0
      ? Math.round((completedItemsToday / totalItemsToday) * 100)
      : 0;

  // Productive Summary Metrics for the Daily Infographic Strip
  const summaryInfographicStats = useMemo(() => {
    const bestHabitStreak = habits.reduce(
      (max, h) => Math.max(max, computeHabitCurrentStreak(h, todayIso)),
      0
    );
    const activeWeekChain = weekRibbon.filter((d) => d.completionRatio > 0).length;
    const perfectDaysInWeek = weekRibbon.filter(
      (d) => d.completionRatio >= 0.99 && d.totalCount > 0
    ).length;

    return {
      currentChain: Math.max(activeWeekChain, bestHabitStreak > 0 ? 3 : 0),
      bestStreak: Math.max(bestHabitStreak, activeWeekChain),
      perfectDaysInWeek,
    };
  }, [habits, todayIso, weekRibbon]);

  const visiblePhases = useMemo(
    () =>
      timeFilter === 'all'
        ? PHASES
        : PHASES.filter((p) => p.id === timeFilter),
    [timeFilter]
  );

  const handleAssignPhase = (todo: TodoItem, phase: ProductiveTimeOfDay) => {
    const targetHour = DEFAULT_HOUR_FOR_TIME_OF_DAY[phase];
    if (onAssignScheduledHour) {
      onAssignScheduledHour(todo.id, targetHour, selectedDateIso);
    } else {
      onUpdateTodo(todo.id, { scheduledHour: targetHour });
    }
  };

  return (
    <div data-testid="productive-day-feed" className="space-y-4">
      {/* 1. Productive 7-Day Horizontal Date Ribbon & Daily Momentum Infographic Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-[15px] sm:text-base font-bold tracking-[-0.022em] text-slate-950 font-display">
              Daily Rhythm &amp; Time-of-Day Schedule
            </h2>
            <p className="text-[13px] text-slate-500 mt-0.5">
              <span className="font-medium text-slate-700">
                {selectedDateIso === todayIso ? 'Today' : selectedDateIso}
              </span>
              <span aria-hidden="true" className="text-slate-300"> · </span>
              <span className="font-mono tabular-nums font-medium text-slate-700 text-[12.5px]">
                {completedItemsToday} of {totalItemsToday} completed (
                {overallCompletionPct}%)
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedDateIso !== todayIso && (
              <button
                type="button"
                onClick={() => setSelectedDateIso(todayIso)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Jump to Today
              </button>
            )}

            <button
              type="button"
              data-testid="toggle-inline-productive-infographics"
              onClick={() => setShowInlineInfographics((prev) => !prev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                showInlineInfographics
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>
                {showInlineInfographics ? 'Hide Infographics' : 'Infographics'}
              </span>
            </button>
          </div>
        </div>

        {/* Productive 4-Metric Infographic Strip + Proportional Time-of-Day Stacked Bar */}
        <div
          data-testid="productive-daily-infographic-strip"
          className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 space-y-2.5"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="flex items-center gap-2.5">
              <svg
                viewBox="0 0 36 36"
                className="w-9 h-9 -rotate-90 shrink-0"
                aria-hidden="true"
              >
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="3.5"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#059669"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 14}
                  strokeDashoffset={
                    2 * Math.PI * 14 * (1 - overallCompletionPct / 100)
                  }
                />
              </svg>
              <div className="min-w-0">
                <span className="text-[11px] text-slate-500 block leading-tight">
                  Daily Rate
                </span>
                <span className="text-sm font-extrabold font-mono tabular-nums text-slate-950">
                  {overallCompletionPct}%
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                <Flame className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] text-slate-500 block leading-tight">
                  Current Chain
                </span>
                <span className="text-sm font-extrabold font-mono tabular-nums text-slate-950">
                  {summaryInfographicStats.currentChain}d
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
                <Trophy className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] text-slate-500 block leading-tight">
                  Best Streak
                </span>
                <span className="text-sm font-extrabold font-mono tabular-nums text-slate-950">
                  {summaryInfographicStats.bestStreak}d
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] text-slate-500 block leading-tight">
                  Perfect Days
                </span>
                <span className="text-sm font-extrabold font-mono tabular-nums text-slate-950">
                  {summaryInfographicStats.perfectDaysInWeek}/7d
                </span>
              </div>
            </div>
          </div>

          {/* Proportional Time-of-Day Progress Bar (Morning · Afternoon · Evening · Anytime) */}
          <div className="space-y-1">
            <div className="h-2 w-full bg-slate-200/80 rounded-full overflow-hidden flex gap-0.5">
              {PHASES.map((p) => {
                const grp = groupedByPhase[p.id];
                const pct =
                  grp.totalCount > 0
                    ? Math.round((grp.completedCount / grp.totalCount) * 100)
                    : 0;
                return (
                  <div
                    key={`bar-${p.id}`}
                    style={{ flexGrow: Math.max(1, grp.totalCount) }}
                    className="h-full bg-slate-200 overflow-hidden"
                    title={`${p.label}: ${grp.completedCount}/${grp.totalCount} (${pct}%)`}
                  >
                    <div
                      className={`h-full ${p.progressFill} transition-transform duration-200 origin-left`}
                      style={{ transform: `scaleX(${pct / 100})` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono tabular-nums text-slate-500">
              {PHASES.map((p) => {
                const grp = groupedByPhase[p.id];
                return (
                  <span key={`lbl-${p.id}`}>
                    {p.label} {grp.completedCount}/{grp.totalCount}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* 7-Day Interactive Date Scroller with Micro SVG Completion Rings */}
        <div
          data-testid="productive-date-ribbon"
          role="group"
          aria-label="Select date in 7-day ribbon"
          className="grid grid-cols-7 gap-1.5 overflow-x-auto pb-0.5"
        >
          {weekRibbon.map((day) => {
            const isSelected = day.dateIso === selectedDateIso;
            const ringRadius = 7;
            const ringCirc = 2 * Math.PI * ringRadius;
            const ringOffset = ringCirc * (1 - day.completionRatio);

            return (
              <button
                key={day.dateIso}
                type="button"
                data-testid={`productive-day-btn-${day.dateIso}`}
                onClick={() => setSelectedDateIso(day.dateIso)}
                className={`min-h-[62px] py-2 px-1.5 rounded-xl border flex flex-col items-center justify-between transition-colors cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : day.isToday
                      ? 'bg-emerald-50/70 border-emerald-300 text-slate-900 hover:bg-emerald-50'
                      : 'bg-slate-50/70 border-slate-200/80 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span
                  className={`text-[11px] font-medium tracking-[0.02em] uppercase ${
                    isSelected ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {day.weekdayShort}
                </span>
                <span className="text-[13px] sm:text-sm font-bold font-mono tabular-nums">
                  {day.dayNumber}
                </span>
                <svg
                  viewBox="0 0 20 20"
                  className="w-4 h-4 -rotate-90 shrink-0"
                  aria-hidden="true"
                >
                  <circle
                    cx="10"
                    cy="10"
                    r={ringRadius}
                    fill="none"
                    stroke={isSelected ? '#334155' : '#e2e8f0'}
                    strokeWidth="2.5"
                  />
                  <circle
                    cx="10"
                    cy="10"
                    r={ringRadius}
                    fill="none"
                    stroke={isSelected ? '#10b981' : '#059669'}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray={ringCirc}
                    strokeDashoffset={ringOffset}
                  />
                </svg>
              </button>
            );
          })}
        </div>

        {/* Segmented Time-of-Day Filter Bar (All Day · Morning · Afternoon · Evening · Anytime) */}
        <div
          data-testid="productive-time-of-day-bar"
          role="group"
          aria-label="Filter by time of day"
          className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto no-scrollbar"
        >
          <button
            type="button"
            data-testid="productive-filter-all"
            onClick={() => setTimeFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-[13px] font-medium tracking-[-0.01em] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              timeFilter === 'all'
                ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Day · {totalItemsToday}
          </button>
          {PHASES.map((phase) => {
            const count = groupedByPhase[phase.id].totalCount;
            const isActive = timeFilter === phase.id;
            return (
              <button
                key={phase.id}
                type="button"
                data-testid={`productive-filter-${phase.id}`}
                onClick={() => setTimeFilter(phase.id)}
                className={`px-3 py-1.5 rounded-lg text-[13px] font-medium tracking-[-0.01em] flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{phase.label}</span>
                <span className="font-mono tabular-nums text-[11px] text-slate-400">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Expandable Inline Productive Infographics Studio */}
      {showInlineInfographics && (
        <ProductiveInfographicsPanel
          todayIso={todayIso}
          todos={todos}
          habits={habits}
          onToggleHabitDate={onToggleHabitDate}
        />
      )}

      {/* 2. Chronological Time-of-Day Sections (Morning / Afternoon / Evening / Anytime) */}
      <div className="space-y-3.5">
        {visiblePhases.map((phase) => {
          const group = groupedByPhase[phase.id];
          const isCollapsed = collapsedPhases[phase.id];
          const pct =
            group.totalCount > 0
              ? Math.round((group.completedCount / group.totalCount) * 100)
              : 0;

          return (
            <section
              key={phase.id}
              data-testid={`productive-section-${phase.id}`}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
            >
              {/* Phase Header */}
              <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-200/80 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setCollapsedPhases((prev) => ({
                      ...prev,
                      [phase.id]: !prev[phase.id],
                    }))
                  }
                  className="flex items-center gap-2.5 text-left min-w-0 cursor-pointer"
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${phase.iconBg} ${phase.iconText}`}
                  >
                    {phase.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[15px] sm:text-base font-bold tracking-[-0.02em] text-slate-950 font-display">
                        {phase.label}
                      </h3>
                      <span className="text-xs font-mono tabular-nums text-slate-500">
                        {phase.timeRangeLabel}
                      </span>
                    </div>
                    <p className="text-[12.5px] text-slate-500 truncate">
                      {phase.subtitle}
                    </p>
                  </div>
                </button>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-mono tabular-nums font-semibold text-slate-700">
                      {group.completedCount}/{group.totalCount}
                    </span>
                    <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1">
                      <div
                        className={`h-full ${phase.progressFill} transition-transform duration-200 origin-left`}
                        style={{ transform: `scaleX(${pct / 100})` }}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setCollapsedPhases((prev) => ({
                        ...prev,
                        [phase.id]: !prev[phase.id],
                      }))
                    }
                    aria-label={`Toggle ${phase.label} section`}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="w-4 h-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {/* Phase Body: Habits first, then Tasks */}
              {!isCollapsed && (
                <div className="divide-y divide-slate-100">
                  {/* Daily Habits Scheduled in this Time-of-Day Phase */}
                  {group.habits.map((habit) => {
                    const isDoneOnDate =
                      habit.completedDates.includes(selectedDateIso);
                    const currentStreak = computeHabitCurrentStreak(
                      habit,
                      todayIso
                    );
                    const targetStreak = habit.streakTargetDays ?? 21;

                    return (
                      <div
                        key={habit.id}
                        data-testid={`productive-habit-row-${habit.id}`}
                        className={`px-4 py-3 flex items-center justify-between gap-3 transition-colors ${
                          isDoneOnDate
                            ? 'bg-emerald-50/30'
                            : 'bg-white hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Tactile 44x44px Habit Completion Check Button */}
                          <button
                            type="button"
                            data-testid={`productive-habit-toggle-${habit.id}`}
                            onClick={() =>
                              onToggleHabitDate(habit.id, selectedDateIso)
                            }
                            aria-label={
                              isDoneOnDate
                                ? `Mark habit "${habit.title}" incomplete for ${selectedDateIso}`
                                : `Complete habit "${habit.title}" for ${selectedDateIso}`
                            }
                            className="-ml-1 min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0 cursor-pointer group/hcheck"
                          >
                            <span
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-transform duration-150 ${
                                isDoneOnDate
                                  ? 'bg-emerald-600 border-emerald-600 text-white scale-100'
                                  : 'border-emerald-400 group-hover/hcheck:border-emerald-600 bg-emerald-50/40 group-active/hcheck:scale-95'
                              }`}
                            >
                              {isDoneOnDate && (
                                <Check
                                  className="w-3.5 h-3.5 stroke-[2.75]"
                                  aria-hidden="true"
                                />
                              )}
                            </span>
                          </button>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`text-[15px] font-medium tracking-[-0.012em] leading-[1.38] ${
                                  isDoneOnDate
                                    ? 'line-through text-slate-400'
                                    : 'text-slate-900'
                                }`}
                              >
                                {habit.title}
                              </span>
                            </div>

                            {/* Unboxed Metadata with Typographic Separators (Zero-Pill Discipline) */}
                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[12.5px] leading-snug text-slate-500">
                              <span className="font-semibold text-emerald-700">
                                Daily Habit
                              </span>
                              <span aria-hidden="true" className="text-slate-300">·</span>
                              <span className="font-medium text-slate-700">
                                {habit.lifeArea}
                              </span>
                              {habit.whenTime && (
                                <>
                                  <span aria-hidden="true" className="text-slate-300">·</span>
                                  <span className="font-mono tabular-nums text-slate-600 text-[12px]">
                                    {habit.whenTime}
                                  </span>
                                </>
                              )}
                              {habit.durationMinutes && (
                                <>
                                  <span aria-hidden="true" className="text-slate-300">·</span>
                                  <span className="font-mono tabular-nums text-slate-600 text-[12px]">
                                    {habit.durationMinutes}m
                                  </span>
                                </>
                              )}
                              <span aria-hidden="true" className="text-slate-300">·</span>
                              <span className="inline-flex items-center gap-1 font-mono tabular-nums font-medium text-emerald-700 text-[12px]">
                                <Flame
                                  className="w-3 h-3 text-emerald-600"
                                  aria-hidden="true"
                                />
                                <span>
                                  {currentStreak}/{targetStreak}d streak
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Optional Deploy Routine Steps Button */}
                        {habit.routineTasks &&
                          habit.routineTasks.length > 0 &&
                          onDeployRoutineTaskToTodo && (
                            <button
                              type="button"
                              onClick={() => {
                                for (const step of habit.routineTasks ?? []) {
                                  const hr =
                                    step.scheduledHour ??
                                    DEFAULT_HOUR_FOR_TIME_OF_DAY[phase.id];
                                  onDeployRoutineTaskToTodo({
                                    title: `${habit.title}: ${step.title}`,
                                    notes:
                                      step.notes ??
                                      `Routine step (${step.durationMinutes ?? 25}m)`,
                                    priority: 'medium',
                                    category: habit.lifeArea,
                                    dueDate: selectedDateIso,
                                    isRepeating: false,
                                    scheduledHour: hr,
                                  });
                                }
                              }}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              <Play
                                className="w-3 h-3 fill-emerald-700"
                                aria-hidden="true"
                              />
                              <span>
                                Run Routine ({habit.routineTasks.length})
                              </span>
                            </button>
                          )}
                      </div>
                    );
                  })}

                  {/* Tasks Scheduled in this Time-of-Day Phase */}
                  {group.todos.map((todo) => (
                    <div key={todo.id} className="relative group/phaserow">
                      <TaskRow
                        todo={todo}
                        isFocused={selectedFocusTaskId === todo.id}
                        onToggle={onToggleTodo}
                        onDelete={onDeleteTodo}
                        onUpdate={onUpdateTodo}
                        onAddSubtask={onAddSubtask}
                        onToggleSubtask={onToggleSubtask}
                        onDeleteSubtask={onDeleteSubtask}
                        onPunchTaskDay={onPunchTaskDay}
                        onOpenBingoPunchCards={onOpenBingoPunchCards}
                        onDragStartTask={onDragStartTask}
                        onDragEndTask={onDragEndTask}
                      />
                      {/* Quick Time-of-Day Phase Mover Strip */}
                      <div className="px-11 pb-2.5 -mt-1 flex flex-wrap items-center gap-1 text-[11px] text-slate-400">
                        <span>Phase:</span>
                        {PHASES.map((targetPhase) => {
                          const isCurrent = targetPhase.id === phase.id;
                          return (
                            <button
                              key={targetPhase.id}
                              type="button"
                              onClick={() =>
                                handleAssignPhase(todo, targetPhase.id)
                              }
                              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                                isCurrent
                                  ? 'bg-slate-900 text-white font-semibold'
                                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                              }`}
                            >
                              {targetPhase.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Empty State for this Phase */}
                  {group.habits.length === 0 && group.todos.length === 0 && (
                    <div className="py-6 px-4 text-center flex flex-col items-center justify-center gap-1">
                      <p className="text-xs font-medium text-slate-500">
                        No habits or tasks scheduled for {phase.label.toLowerCase()}.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const input =
                            document.getElementById('new-task-title');
                          if (input) input.focus();
                        }}
                        className="mt-1 px-3 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                      >
                        <Plus className="w-3 h-3" aria-hidden="true" />
                        <span>Add {phase.label} Task</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
};
