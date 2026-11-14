import React, { useState, useMemo } from 'react';
import {
  Flame,
  Plus,
  CheckCircle2,
  Circle,
  Grid,
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
  computeHabitHeatmapGrid,
  computeHabitCurrentStreak,
  getRecentIsoDates,
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

const INTENSITY_CLASSES: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: 'bg-slate-100 border-slate-200 text-slate-400',
  1: 'bg-emerald-100 border-emerald-200 text-emerald-800',
  2: 'bg-emerald-300 border-emerald-400 text-emerald-950',
  3: 'bg-emerald-500 border-emerald-600 text-white',
  4: 'bg-emerald-700 border-emerald-800 text-white',
};

const HABIT_TYPE_BADGES: Record<
  HabitCategoryType,
  { label: string; style: string; icon: React.ReactNode }
> = {
  build_helpful: {
    label: '1. Building a Helpful Habit',
    style: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: <TrendingUp className="w-3 h-3 text-emerald-700" aria-hidden="true" />,
  },
  break_unhelpful: {
    label: '2. Breaking an Unhelpful Habit',
    style: 'bg-red-50 text-red-800 border-red-200',
    icon: <ShieldAlert className="w-3 h-3 text-red-600" aria-hidden="true" />,
  },
  replace_old: {
    label: '3. Replacing an Old Habit',
    style: 'bg-amber-50 text-amber-900 border-amber-200',
    icon: <RefreshCw className="w-3 h-3 text-amber-700" aria-hidden="true" />,
  },
};

export const HabitDashboard: React.FC<HabitDashboardProps> = ({
  habits,
  onToggleHabitDate,
  onAddHabit,
}) => {
  const todayIso = useMemo(() => getTodayIsoDate(), []);
  const last14Days = useMemo(() => getRecentIsoDates(14, todayIso), [todayIso]);

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

  const heatmapCells = useMemo(
    () => computeHabitHeatmapGrid(filteredHabits, 28, todayIso),
    [filteredHabits, todayIso]
  );

  const completedTodayCount = useMemo(
    () =>
      filteredHabits.filter((h) => h.completedDates.includes(todayIso)).length,
    [filteredHabits, todayIso]
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

  return (
    <div data-testid="habit-dashboard" className="space-y-4 @container">
      {/* Header & 3 Habit Options Selector */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-emerald-700" aria-hidden="true" />
              <h1 className="text-lg @sm:text-xl font-bold tracking-tight text-slate-900 font-display">
                Habit Dashboard & Completion Heatmap
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
              className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-mono font-bold"
            >
              Today: {completedTodayCount}/{filteredHabits.length}
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

        {/* 28-Day Habit Completion Heatmap */}
        <section
          aria-label="28-day habit completion heatmap"
          data-testid="habit-completion-heatmap"
          className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Grid
                className="w-3.5 h-3.5 text-emerald-700"
                aria-hidden="true"
              />
              <h2 className="text-xs font-bold text-slate-800">
                28-Day Habit Completion Heatmap
              </h2>
            </div>

            {/* Heatmap Intensity Legend */}
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <span>Less</span>
              {([0, 1, 2, 3, 4] as const).map((lvl) => (
                <span
                  key={lvl}
                  className={`w-3 h-3 rounded-xs border ${INTENSITY_CLASSES[lvl]}`}
                />
              ))}
              <span>More</span>
            </div>
          </div>

          <div className="grid grid-cols-7 @sm:grid-cols-14 gap-1.5 pt-1">
            {heatmapCells.map((cell) => (
              <div
                key={cell.dateIso}
                data-testid={`heatmap-cell-${cell.dateIso}`}
                title={`${cell.dateIso}: ${cell.completedCount}/${cell.totalHabits} habits completed`}
                className={`h-8 rounded-md border flex flex-col items-center justify-center text-[9px] font-mono font-semibold transition-colors ${
                  INTENSITY_CLASSES[cell.intensityLevel]
                }`}
              >
                <span>{cell.shortLabel.slice(3)}</span>
                <span className="text-[8px] opacity-85">
                  {cell.completedCount}/{cell.totalHabits}
                </span>
              </div>
            ))}
          </div>
        </section>

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

      {/* Individual Habit Rows with Interactive 14-Day Check-In Cells */}
      <div className="space-y-2.5">
        {filteredHabits.map((habit) => {
          const isDoneToday = habit.completedDates.includes(todayIso);
          const streak = computeHabitCurrentStreak(habit, todayIso);
          const resolvedType = habit.habitType ?? 'build_helpful';
          const badge = HABIT_TYPE_BADGES[resolvedType];

          return (
            <div
              key={habit.id}
              data-testid={`habit-row-${habit.id}`}
              className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => onToggleHabitDate(habit.id, todayIso)}
                    aria-label={`Toggle "${habit.title}" completion for today`}
                    className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer shrink-0"
                  >
                    {isDoneToday ? (
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
                    onClick={() => onToggleHabitDate(habit.id, todayIso)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      isDoneToday
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {isDoneToday ? 'Done Today' : 'Complete Today'}
                  </button>
                </div>
              </div>

              {/* Per-Habit 14-Day Mini Heatmap Strip */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 overflow-x-auto">
                <span className="text-[10px] font-mono text-slate-400 shrink-0 mr-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  Last 14d:
                </span>
                <div className="flex items-center gap-1">
                  {last14Days.map((dIso) => {
                    const checked = habit.completedDates.includes(dIso);
                    return (
                      <button
                        key={dIso}
                        type="button"
                        onClick={() => onToggleHabitDate(habit.id, dIso)}
                        title={`${habit.title} on ${dIso}: ${
                          checked ? 'Completed' : 'Not completed'
                        }`}
                        aria-label={`Toggle ${habit.title} on ${dIso}`}
                        className={`w-5 h-5 rounded text-[9px] font-mono font-semibold border transition-colors cursor-pointer ${
                          checked
                            ? 'bg-emerald-600 border-emerald-700 text-white'
                            : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        {dIso.slice(8)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
