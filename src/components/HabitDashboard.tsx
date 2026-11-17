import React, { useState, useMemo } from 'react';
import {
  Flame,
  Plus,
  CheckCircle2,
  Circle,
  ArrowRight,
  ShieldAlert,
  RefreshCw,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  Category,
  LIFE_AREAS,
  HabitCategoryType,
  HABIT_CATEGORY_OPTIONS,
  HabitItem,
  TodoItem,
  computeHabitDailyRings,
  computeHabitYearWeeksGrid,
  computeHabitCurrentStreak,
  getTodayIsoDate,
} from '../utils/todoLogic';
import { ProductiveInfographicsPanel } from './ProductiveInfographicsPanel';

interface HabitDashboardProps {
  habits: HabitItem[];
  todos?: TodoItem[];
  onToggleHabitDate: (habitId: string, dateIso: string) => void;
  onAddHabit: (params: {
    title: string;
    lifeArea: Category;
    habitType: HabitCategoryType;
    oldHabitToReplace?: string;
    targetPerWeek: number;
    whenTime?: string;
    durationMinutes?: number;
    streakTargetDays?: number;
  }) => void;
  onDeployRoutineTaskToTodo?: (params: {
    title: string;
    notes: string;
    priority: 'high' | 'medium' | 'low';
    category: Category;
    dueDate: string;
    isRepeating: boolean;
    scheduledHour?: number;
  }) => void;
}

const HABIT_TYPE_BADGES: Record<
  HabitCategoryType,
  { label: string; textColor: string; icon: React.ReactNode }
> = {
  build_helpful: {
    label: 'Build Helpful Habit',
    textColor: 'text-emerald-700',
    icon: (
      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
    ),
  },
  break_unhelpful: {
    label: 'Break Unhelpful Habit',
    textColor: 'text-purple-700',
    icon: (
      <ShieldAlert className="w-3.5 h-3.5 text-purple-600" aria-hidden="true" />
    ),
  },
  replace_old: {
    label: 'Replace Old Habit',
    textColor: 'text-blue-700',
    icon: <RefreshCw className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />,
  },
};

export const HabitDashboard: React.FC<HabitDashboardProps> = ({
  habits,
  todos = [],
  onToggleHabitDate,
  onAddHabit,
  onDeployRoutineTaskToTodo,
}) => {
  const todayIso = useMemo(() => getTodayIsoDate(), []);
  const [selectedRingDateIso, setSelectedRingDateIso] =
    useState<string>(todayIso);
  const [ringWindowDays, setRingWindowDays] = useState<7 | 14>(7);
  const [isCreatorOpen, setIsCreatorOpen] = useState<boolean>(true);

  const [selectedHabitType, setSelectedHabitType] =
    useState<HabitCategoryType>('build_helpful');
  const [typeFilter, setTypeFilter] = useState<HabitCategoryType | 'all'>(
    'all'
  );
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [oldHabitInput, setOldHabitInput] = useState('');
  const [newHabitArea, setNewHabitArea] = useState<Category>('Strength');
  const [newHabitWhenTime, setNewHabitWhenTime] = useState('07:00');
  const [newHabitDuration, setNewHabitDuration] = useState(45);
  const [newHabitStreakTarget, setNewHabitStreakTarget] = useState(21);
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
      whenTime: newHabitWhenTime,
      durationMinutes: newHabitDuration,
      streakTargetDays: newHabitStreakTarget,
    });
    setNewHabitTitle('');
    setOldHabitInput('');
  };

  // Ring geometry constants
  const ringSize = 34;
  const strokeWidth = 3.5;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div data-testid="habit-dashboard" className="space-y-5 @container">
      {/* Header & Daily Completion Rings Strip */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-emerald-600" aria-hidden="true" />
              <h1 className="text-lg @sm:text-xl font-bold tracking-tight text-slate-900 font-display">
                Habits &amp; Consistency Studio
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Build helpful rituals, break unhelpful patterns, or replace old triggers with structured daily routines.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              data-testid="habits-today-progress"
              className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-900 text-xs font-mono tabular-nums font-bold"
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

            <button
              type="button"
              onClick={() => setIsCreatorOpen((prev) => !prev)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>New Habit</span>
              {isCreatorOpen ? (
                <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Daily Completion Rings Strip (Clean Obsidian Slate-900 Surface) */}
        <section
          aria-label="Daily habit completion rings"
          data-testid="habit-daily-rings-strip"
          className="bg-slate-900 text-slate-100 rounded-2xl px-4 py-3.5 border border-slate-800 space-y-3"
        >
          <div className="flex items-center justify-between gap-2 text-xs text-slate-300">
            <span className="font-medium text-slate-200">
              Daily Completion Rings — Select any day to inspect or toggle habits
            </span>
            <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setRingWindowDays(7)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono tabular-nums cursor-pointer whitespace-nowrap ${
                  ringWindowDays === 7
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                7 Days
              </button>
              <button
                type="button"
                onClick={() => setRingWindowDays(14)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono tabular-nums cursor-pointer whitespace-nowrap ${
                  ringWindowDays === 14
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                14 Days
              </button>
            </div>
          </div>

          <div className="flex items-center justify-around gap-1.5 overflow-x-auto py-1">
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
                  className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl transition-colors cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-slate-800 ring-1 ring-emerald-500/80'
                      : 'hover:bg-slate-800/60'
                  }`}
                >
                  <span
                    className={`text-[11px] font-medium ${
                      cell.isToday
                        ? 'text-emerald-400 font-semibold'
                        : 'text-slate-400'
                    }`}
                  >
                    {cell.weekdayShort}
                  </span>

                  <span
                    className={`text-sm font-bold font-mono tabular-nums leading-none ${
                      cell.isToday ? 'text-emerald-400' : 'text-white'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>

                  <div className="relative w-[34px] h-[34px] flex items-center justify-center mt-0.5">
                    <svg
                      width={ringSize}
                      height={ringSize}
                      viewBox={`0 0 ${ringSize} ${ringSize}`}
                      className="-rotate-90"
                      aria-hidden="true"
                    >
                      <circle
                        cx={ringSize / 2}
                        cy={ringSize / 2}
                        r={radius}
                        fill="transparent"
                        stroke="#1E293B"
                        strokeWidth={strokeWidth}
                      />
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

        {/* Segmented Habit Mode Filter Bar */}
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
            <div className="text-xs font-semibold">All Habit Modes</div>
            <div
              className={`text-[11px] font-mono tabular-nums mt-0.5 ${
                typeFilter === 'all' ? 'text-slate-300' : 'text-slate-500'
              }`}
            >
              {habits.length} active habits
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
                <div className="text-xs font-semibold leading-snug">
                  {opt.label}
                </div>
                <div
                  className={`text-[11px] font-mono tabular-nums mt-0.5 ${
                    isSelected ? 'text-emerald-300' : 'text-slate-500'
                  }`}
                >
                  {count} habits · {opt.shortLabel}
                </div>
              </button>
            );
          })}
        </div>

        {/* Collapsible Habit Creation Sheet */}
        {isCreatorOpen && (
          <form
            onSubmit={handleCreateHabit}
            className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-800">
                Create Habit Routine
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {HABIT_CATEGORY_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setSelectedHabitType(opt.key)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
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

              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
                <span className="text-[11px] font-medium text-slate-500">
                  Time:
                </span>
                <input
                  type="time"
                  aria-label="Habit When Time"
                  value={newHabitWhenTime}
                  onChange={(e) => setNewHabitWhenTime(e.target.value)}
                  className="text-xs font-mono tabular-nums text-slate-800 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
                <span className="text-[11px] font-medium text-slate-500">
                  Duration:
                </span>
                <input
                  type="number"
                  min={5}
                  max={240}
                  step={5}
                  aria-label="Habit Duration Minutes"
                  value={newHabitDuration}
                  onChange={(e) =>
                    setNewHabitDuration(Math.max(5, Number(e.target.value) || 30))
                  }
                  className="w-12 text-xs font-mono tabular-nums text-slate-800 focus:outline-none"
                />
                <span className="text-[11px] text-slate-500">min</span>
              </div>

              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
                <span className="text-[11px] font-medium text-slate-500">
                  Goal:
                </span>
                <input
                  type="number"
                  min={3}
                  max={365}
                  aria-label="Habit Streak Target Days"
                  value={newHabitStreakTarget}
                  onChange={(e) =>
                    setNewHabitStreakTarget(
                      Math.max(3, Number(e.target.value) || 21)
                    )
                  }
                  className="w-12 text-xs font-mono tabular-nums text-slate-800 focus:outline-none"
                />
                <span className="text-[11px] text-slate-500">days</span>
              </div>

              <button
                type="submit"
                disabled={!newHabitTitle.trim()}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Add Habit Routine</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Productive Statistics & Streak Chain Infographics Studio */}
      <ProductiveInfographicsPanel
        todayIso={todayIso}
        todos={todos}
        habits={filteredHabits}
        activeCategory={areaFilter}
        onSelectCategory={setAreaFilter}
        onToggleHabitDate={onToggleHabitDate}
      />

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
              className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-start gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() =>
                      onToggleHabitDate(habit.id, selectedRingDateIso)
                    }
                    aria-label={`Toggle "${habit.title}" completion for ${selectedRingDateIso}`}
                    className="w-9 h-9 -ml-1 -mt-0.5 rounded-full flex items-center justify-center text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer shrink-0"
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
                    <h3 className="text-sm font-bold text-slate-900">
                      {habit.title}
                    </h3>

                    {resolvedType === 'replace_old' &&
                      habit.oldHabitToReplace && (
                        <div className="text-xs text-slate-600 mt-0.5 flex flex-wrap items-center gap-1.5">
                          <span className="line-through text-slate-400">
                            Replaces: {habit.oldHabitToReplace}
                          </span>
                          <ArrowRight
                            className="w-3 h-3 text-slate-400 shrink-0"
                            aria-hidden="true"
                          />
                          <span className="font-medium text-slate-800">
                            {habit.title}
                          </span>
                        </div>
                      )}

                    {/* Zero-Pill Inline Metadata Line */}
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-1 text-xs text-slate-500">
                      <span
                        className={`inline-flex items-center gap-1 font-medium ${badge.textColor}`}
                      >
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>
                      <span aria-hidden="true" className="text-slate-300">
                        ·
                      </span>
                      <span className="font-medium text-slate-700">
                        {habit.lifeArea}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">
                        ·
                      </span>
                      <span className="font-mono tabular-nums text-blue-700">
                        {habit.whenTime || '07:00'} ({habit.durationMinutes || 45}m)
                      </span>
                      <span aria-hidden="true" className="text-slate-300">
                        ·
                      </span>
                      <span className="font-mono tabular-nums text-emerald-700 font-medium">
                        Goal {streak}/{habit.streakTargetDays || 21}d
                      </span>
                      <span aria-hidden="true" className="text-slate-300">
                        ·
                      </span>
                      <span className="font-mono tabular-nums text-slate-500">
                        {yearGrid.totalYearCompletions}/365 days past year
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <span
                    data-testid={`habit-streak-${habit.id}`}
                    className="text-xs font-mono tabular-nums font-bold text-emerald-700 flex items-center gap-1"
                  >
                    <Flame
                      className="w-3.5 h-3.5 text-emerald-600"
                      aria-hidden="true"
                    />
                    {streak}d streak
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      onToggleHabitDate(habit.id, selectedRingDateIso)
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
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

              {/* Saved Routine Task Steps */}
              {habit.routineTasks && habit.routineTasks.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-700">
                    <span>
                      Saved Routine Sequence ({habit.routineTasks.length} steps)
                    </span>
                    {onDeployRoutineTaskToTodo && (
                      <button
                        type="button"
                        onClick={() => {
                          habit.routineTasks?.forEach((rt) => {
                            onDeployRoutineTaskToTodo({
                              title: rt.title,
                              notes: `${rt.notes} (Routine: ${habit.title})`,
                              priority: 'medium',
                              category: habit.lifeArea,
                              dueDate: todayIso,
                              isRepeating: true,
                              scheduledHour: rt.scheduledHour,
                            });
                          });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
                      >
                        + Deploy Routine to Today
                      </button>
                    )}
                  </div>
                  <div className="divide-y divide-slate-200/70 bg-white border border-slate-200 rounded-lg px-3">
                    {habit.routineTasks.map((rt) => (
                      <div
                        key={rt.id}
                        className="py-1.5 flex items-center justify-between gap-2 text-xs text-slate-700"
                      >
                        <span className="font-medium text-slate-800">
                          {rt.title}
                        </span>
                        <span className="font-mono tabular-nums text-slate-500 shrink-0">
                          {String(rt.scheduledHour).padStart(2, '0')}:00 ·{' '}
                          {rt.durationMinutes}m
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Per-Habit Full-Year (365-Day / 53-Week) Numberless Heatmap */}
              <div
                data-testid={`habit-year-heatmap-${habit.id}`}
                className="pt-2.5 border-t border-slate-100 space-y-1.5"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-medium">
                    365-Day Consistency Grid
                  </span>
                  <div className="flex items-center gap-3 text-[10px]">
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


