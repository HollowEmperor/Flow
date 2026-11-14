import React, { useState, useMemo } from 'react';
import {
  Flame,
  Plus,
  CheckCircle2,
  Circle,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import {
  Category,
  LIFE_AREAS,
  HabitCategoryType,
  HABIT_CATEGORY_OPTIONS,
  HabitItem,
  computeHabitDailyRings,
  computeHabitYearWeeksGrid,
  computeHabitCurrentStreak,
  getTodayIsoDate,
} from '../utils/todoLogic';

interface HabitDashboardProps {
  habits: HabitItem[];
  onToggleHabitDate: (habitId: string, dateIso: string) => void;
  onAddHabit: (params: {
    title: string;
    lifeArea: Category;
    habitType: HabitCategoryType;
    oldHabitToReplace?: string;
    targetPerWeek: number;
  }) => void;
}

const HABIT_TYPE_BADGES: Record<
  HabitCategoryType,
  { label: string; style: string; icon: React.ReactNode }
> = {
  build_helpful: {
    label: '1. Building a Helpful Habit',
    style: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: (
      <TrendingUp className="w-3 h-3 text-emerald-700" aria-hidden="true" />
    ),
  },
  break_unhelpful: {
    label: '2. Breaking an Unhelpful Habit',
    style: 'bg-purple-50 text-purple-800 border-purple-200',
    icon: <ShieldAlert className="w-3 h-3 text-purple-600" aria-hidden="true" />,
  },
  replace_old: {
    label: '3. Replacing an Old Habit',
    style: 'bg-blue-50 text-blue-900 border-blue-200',
    icon: <RefreshCw className="w-3 h-3 text-blue-700" aria-hidden="true" />,
  },
};

export const HabitDashboard: React.FC<HabitDashboardProps> = ({
  habits,
  onToggleHabitDate,
  onAddHabit,
}) => {
  const todayIso = useMemo(() => getTodayIsoDate(), []);
  const [selectedRingDateIso, setSelectedRingDateIso] =
    useState<string>(todayIso);
  const [ringWindowDays, setRingWindowDays] = useState<7 | 14>(7);

  const [selectedHabitType, setSelectedHabitType] =
    useState<HabitCategoryType>('build_helpful');
  const [typeFilter, setTypeFilter] = useState<HabitCategoryType | 'all'>(
    'all'
  );
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [oldHabitInput, setOldHabitInput] = useState('');
  const [newHabitArea, setNewHabitArea] = useState<Category>('Strength');
  const [areaFilter, setAreaFilter] = useState<Category | 'All'>('All');

  const filteredHabits = useMemo(
    () =>
      habits.filter((h) => {
        const resolvedType = h.habitType ?? 'build_helpful';
        if (typeFilter !== 'all' && resolvedType !== typeFilter) return false;
        if (areaFilter !== 'All' && h.lifeArea !== areaFilter) return false;
        return true;
      }),
    [habits, typeFilter, areaFilter]
  );

  const dailyRings = useMemo(
    () => computeHabitDailyRings(filteredHabits, ringWindowDays, todayIso),
    [filteredHabits, ringWindowDays, todayIso]
  );

  const completedOnSelectedDateCount = useMemo(
    () =>
      filteredHabits.filter((h) =>
        h.completedDates.includes(selectedRingDateIso)
      ).length,
    [filteredHabits, selectedRingDateIso]
  );

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;
    onAddHabit({
      title: newHabitTitle.trim(),
      lifeArea: newHabitArea,
      habitType: selectedHabitType,
      oldHabitToReplace:
        selectedHabitType === 'replace_old' ? oldHabitInput.trim() : undefined,
      targetPerWeek: 7,
    });
    setNewHabitTitle('');
    setOldHabitInput('');
  };

  // Ring geometry constants (matching the reference circular blue arc on dark ring)
  const ringSize = 34;
  const strokeWidth = 3.5;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div data-testid="habit-dashboard" className="space-y-4 @container">
      {/* Header & Daily Ring Strip (Replaces Color-Gradient System) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-emerald-700" aria-hidden="true" />
              <h1 className="text-lg @sm:text-xl font-bold tracking-tight text-slate-900 font-display">
                Habit Dashboard &amp; Daily Completion Rings
              </h1>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              1. Building a Helpful Habit · 2. Breaking an Unhelpful Habit · 3.
              Replacing an Old Habit
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              data-testid="habits-today-progress"
              className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs font-mono font-bold"
            >
              {selectedRingDateIso === todayIso
                ? 'Today'
                : selectedRingDateIso.slice(5)}
              : {completedOnSelectedDateCount}/{filteredHabits.length}
            </span>

            <select
              aria-label="Filter habits by Life Area"
              value={areaFilter}
              onChange={(e) =>
                setAreaFilter(e.target.value as Category | 'All')
              }
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
            >
              <option value="All">All 7 Life Areas</option>
              {LIFE_AREAS.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Daily Completion Rings Strip (Solid Deep Midnight Purple Bar with Circular Progress Rings) */}
        <section
          aria-label="Daily habit completion rings"
          data-testid="habit-daily-rings-strip"
          className="bg-[#161130] text-zinc-200 rounded-2xl px-4 py-4 border border-purple-800 shadow-inner space-y-3"
        >
          <div className="flex items-center justify-between gap-2 text-[11px] text-purple-200">
            <span className="font-medium text-blue-100">
              Daily Completion Rings — Click any day ring to inspect or log
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setRingWindowDays(7)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer ${
                  ringWindowDays === 7
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-purple-950 text-purple-300 hover:text-white'
                }`}
              >
                7 Days
              </button>
              <button
                type="button"
                onClick={() => setRingWindowDays(14)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer ${
                  ringWindowDays === 14
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-purple-950 text-purple-300 hover:text-white'
                }`}
              >
                14 Days
              </button>
            </div>
          </div>

          <div className="flex items-center justify-around gap-2 overflow-x-auto py-1">
            {dailyRings.map((cell) => {
              const isSelected = cell.dateIso === selectedRingDateIso;
              const dashOffset =
                circumference * (1 - Math.max(0, Math.min(1, cell.progressRatio)));

              return (
                <button
                  key={cell.dateIso}
                  type="button"
                  data-testid={`habit-ring-day-${cell.dateIso}`}
                  onClick={() => setSelectedRingDateIso(cell.dateIso)}
                  title={`${cell.weekdayShort} ${cell.dateIso}: ${cell.completedCount}/${cell.totalHabits} habits completed`}
                  className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-purple-900/50 ring-1 ring-blue-400/80'
                      : 'hover:bg-white/5'
                  }`}
                >
                  {/* Weekday short label */}
                  <span
                    className={`text-xs font-medium tracking-tight ${
                      cell.isToday
                        ? 'text-[#60A5FA] font-semibold'
                        : 'text-purple-200/70'
                    }`}
                  >
                    {cell.weekdayShort}
                  </span>

                  {/* Day number */}
                  <span
                    className={`text-base font-bold font-mono leading-none ${
                      cell.isToday ? 'text-[#60A5FA]' : 'text-white'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>

                  {/* Circular Progress Ring */}
                  <div className="relative w-[34px] h-[34px] flex items-center justify-center mt-0.5">
                    <svg
                      width={ringSize}
                      height={ringSize}
                      viewBox={`0 0 ${ringSize} ${ringSize}`}
                      className="-rotate-90"
                      aria-hidden="true"
                    >
                      {/* Unfilled Ring Track */}
                      <circle
                        cx={ringSize / 2}
                        cy={ringSize / 2}
                        r={radius}
                        fill="transparent"
                        stroke="#2E2654"
                        strokeWidth={strokeWidth}
                      />
                      {/* Progress Arc */}
                      {cell.progressRatio > 0 && (
                        <circle
                          cx={ringSize / 2}
                          cy={ringSize / 2}
                          r={radius}
                          fill="transparent"
                          stroke={cell.progressRatio >= 1 ? '#10B981' : '#3B82F6'}
                          strokeWidth={strokeWidth}
                          strokeLinecap="round"
                          strokeDasharray={circumference}
                          strokeDashoffset={dashOffset}
                          className="transition-all duration-300"
                        />
                      )}
                    </svg>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 3 Habit Options Filter Tabs */}
        <div
          role="group"
          aria-label="Filter by 3 habit options"
          className="grid grid-cols-1 @sm:grid-cols-4 gap-2"
        >
          <button
            type="button"
            onClick={() => setTypeFilter('all')}
            className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
              typeFilter === 'all'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="text-xs font-bold">All Habit Modes</div>
            <div
              className={`text-[10px] mt-0.5 ${
                typeFilter === 'all' ? 'text-slate-300' : 'text-slate-500'
              }`}
            >
              {habits.length} total active habits
            </div>
          </button>

          {HABIT_CATEGORY_OPTIONS.map((opt) => {
            const isSelected = typeFilter === opt.key;
            const count = habits.filter(
              (h) => (h.habitType ?? 'build_helpful') === opt.key
            ).length;
            return (
              <button
                key={opt.key}
                type="button"
                data-testid={`habit-option-filter-${opt.key}`}
                onClick={() => {
                  setTypeFilter(opt.key);
                  setSelectedHabitType(opt.key);
                }}
                className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="text-xs font-bold leading-snug">
                  {opt.label}
                </div>
                <div
                  className={`text-[10px] mt-0.5 ${
                    isSelected ? 'text-emerald-300' : 'text-slate-500'
                  }`}
                >
                  {count} habits · {opt.shortLabel}
                </div>
              </button>
            );
          })}
        </div>

        {/* Add New Habit Form with the 3 Habit Options */}
        <form
          onSubmit={handleCreateHabit}
          className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-800">
              Create Habit — Choose 1 of 3 Options:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {HABIT_CATEGORY_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setSelectedHabitType(opt.key)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                    selectedHabitType === opt.key
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedHabitType === 'replace_old' && (
              <input
                type="text"
                value={oldHabitInput}
                onChange={(e) => setOldHabitInput(e.target.value)}
                placeholder="Old habit to replace (e.g. Morning phone scrolling)..."
                aria-label="Old habit to replace"
                className="flex-1 min-w-[180px] text-xs bg-white border border-amber-300 rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400"
              />
            )}

            <label htmlFor="new-habit-title" className="sr-only">
              Habit title
            </label>
            <input
              id="new-habit-title"
              type="text"
              value={newHabitTitle}
              onChange={(e) => setNewHabitTitle(e.target.value)}
              placeholder={
                selectedHabitType === 'build_helpful'
                  ? 'Helpful habit to build (e.g. 30m System Design Study)...'
                  : selectedHabitType === 'break_unhelpful'
                    ? 'Unhelpful habit to break (e.g. Zero late-night scrolling)...'
                    : 'New replacement habit (e.g. Read 15 pages with coffee)...'
              }
              className="flex-1 min-w-[200px] text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400"
            />

            <label htmlFor="new-habit-area" className="sr-only">
              Habit Life Area
            </label>
            <select
              id="new-habit-area"
              value={newHabitArea}
              onChange={(e) => setNewHabitArea(e.target.value as Category)}
              className="text-xs font-medium bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700"
            >
              {LIFE_AREAS.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={!newHabitTitle.trim()}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Add Habit</span>
            </button>
          </div>
        </form>
      </div>

      {/* Individual Habit Cards with Numberless Full-Year (365-Day) Heatmap */}
      <div className="space-y-3">
        {filteredHabits.map((habit) => {
          const isDoneOnSelectedDate =
            habit.completedDates.includes(selectedRingDateIso);
          const streak = computeHabitCurrentStreak(habit, todayIso);
          const resolvedType = habit.habitType ?? 'build_helpful';
          const badge = HABIT_TYPE_BADGES[resolvedType];
          const yearGrid = computeHabitYearWeeksGrid(habit, todayIso);

          return (
            <div
              key={habit.id}
              data-testid={`habit-row-${habit.id}`}
              className="bg-white border border-slate-200 rounded-xl p-4 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={() =>
                      onToggleHabitDate(habit.id, selectedRingDateIso)
                    }
                    aria-label={`Toggle "${habit.title}" completion for ${selectedRingDateIso}`}
                    className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer shrink-0"
                  >
                    {isDoneOnSelectedDate ? (
                      <CheckCircle2
                        className="w-5 h-5 text-emerald-600"
                        aria-hidden="true"
                      />
                    ) : (
                      <Circle className="w-5 h-5" aria-hidden="true" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span
                        className={`px-2 py-0.5 rounded border text-[10px] font-semibold flex items-center gap-1 ${badge.style}`}
                      >
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        {habit.lifeArea}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {yearGrid.totalYearCompletions}/365 days in past year
                      </span>
                    </div>

                    {resolvedType === 'replace_old' &&
                      habit.oldHabitToReplace && (
                        <div className="text-[11px] text-amber-800 bg-amber-50/70 border border-amber-200/70 rounded-md px-2 py-1 mb-1 flex flex-wrap items-center gap-1.5">
                          <span className="line-through text-slate-500">
                            Old: {habit.oldHabitToReplace}
                          </span>
                          <ArrowRight
                            className="w-3 h-3 text-amber-700 shrink-0"
                            aria-hidden="true"
                          />
                          <span className="font-semibold text-slate-900">
                            New: {habit.title}
                          </span>
                        </div>
                      )}

                    <h3 className="text-xs @sm:text-sm font-bold text-slate-900">
                      {habit.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    data-testid={`habit-streak-${habit.id}`}
                    className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-xs font-mono font-bold flex items-center gap-1"
                  >
                    <Flame
                      className="w-3 h-3 text-amber-600"
                      aria-hidden="true"
                    />
                    {streak}d streak
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      onToggleHabitDate(habit.id, selectedRingDateIso)
                    }
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      isDoneOnSelectedDate
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {isDoneOnSelectedDate
                      ? selectedRingDateIso === todayIso
                        ? 'Done Today'
                        : `Done (${selectedRingDateIso.slice(5)})`
                      : selectedRingDateIso === todayIso
                        ? 'Complete Today'
                        : `Complete (${selectedRingDateIso.slice(5)})`}
                  </button>
                </div>
              </div>

              {/* Per-Habit Full-Year (365-Day / 53-Week) Numberless Heatmap */}
              <div
                data-testid={`habit-year-heatmap-${habit.id}`}
                className="pt-2.5 border-t border-slate-100 space-y-1.5"
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-mono flex items-center gap-1 text-slate-500">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>365-Day Full-Year Consistency Map (Numberless)</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-[2px] bg-slate-100 border border-slate-200 inline-block" />
                      <span>Missed</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500 border border-emerald-600 inline-block" />
                      <span>Completed</span>
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto pb-1">
                  <div className="inline-flex flex-col gap-1 min-w-max">
                    {/* Month Headers Row */}
                    <div className="flex items-center gap-[3px] h-3.5">
                      {yearGrid.weeks.map((wk) => (
                        <div
                          key={`m-${wk.weekIndex}`}
                          className="w-2.5 text-[9px] font-mono text-slate-400 leading-none overflow-visible whitespace-nowrap"
                        >
                          {wk.monthLabel ?? ''}
                        </div>
                      ))}
                    </div>

                    {/* 53 Weeks x 7 Days Numberless Cells */}
                    <div className="flex items-start gap-[3px]">
                      {yearGrid.weeks.map((wk) => (
                        <div
                          key={`wk-${wk.weekIndex}`}
                          className="flex flex-col gap-[3px]"
                        >
                          {wk.days.map((dayCell) => (
                            <button
                              key={dayCell.dateIso}
                              type="button"
                              onClick={() =>
                                onToggleHabitDate(habit.id, dayCell.dateIso)
                              }
                              title={`${habit.title} · ${dayCell.dateIso}: ${
                                dayCell.completed
                                  ? 'Completed'
                                  : 'Not completed'
                              }`}
                              aria-label={`Toggle ${habit.title} on ${dayCell.dateIso}`}
                              className={`w-2.5 h-2.5 rounded-[2px] border transition-colors cursor-pointer ${
                                dayCell.completed
                                  ? 'bg-emerald-500 border-emerald-600 hover:bg-emerald-600'
                                  : dayCell.isToday
                                    ? 'bg-slate-200 border-blue-500 hover:bg-slate-300'
                                    : 'bg-slate-100 border-slate-200/80 hover:border-slate-400'
                              }`}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

