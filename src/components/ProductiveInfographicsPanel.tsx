import React, { useState, useMemo } from 'react';
import {
  Flame,
  Trophy,
  CheckCircle2,
  BarChart3,
  Sun,
  Sunset,
  Moon,
  Clock,
  Calendar as CalendarIcon,
} from 'lucide-react';
import {
  Category,
  LIFE_AREAS,
  TodoItem,
  HabitItem,
  getRecentIsoDates,
  resolveTodoTimeOfDay,
  resolveHabitTimeOfDay,
  computeHabitCurrentStreak,
} from '../utils/todoLogic';

interface ProductiveInfographicsPanelProps {
  todayIso: string;
  todos: TodoItem[];
  habits: HabitItem[];
  activeCategory?: Category | 'All';
  onSelectCategory?: (category: Category | 'All') => void;
  onToggleHabitDate?: (habitId: string, dateIso: string) => void;
}

type AnalyticsWindow = 7 | 14 | 28;

interface ChainDayNode {
  dateIso: string;
  dayNumber: string;
  weekdayShort: string;
  completedCount: number;
  totalCount: number;
  ratio: number;
  isPerfectDay: boolean;
  hasAnyActivity: boolean;
  isToday: boolean;
  connectLeft: boolean;
  connectRight: boolean;
}

const WEEKDAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export const ProductiveInfographicsPanel: React.FC<
  ProductiveInfographicsPanelProps
> = ({
  todayIso,
  todos,
  habits,
  activeCategory = 'All',
  onSelectCategory,
}) => {
  const [windowDays, setWindowDays] = useState<AnalyticsWindow>(28);
  const [selectedChainDate, setSelectedChainDate] = useState<string>(todayIso);

  const scopedHabits = useMemo(
    () =>
      activeCategory === 'All'
        ? habits
        : habits.filter((h) => h.lifeArea === activeCategory),
    [habits, activeCategory]
  );

  const scopedTodos = useMemo(
    () =>
      activeCategory === 'All'
        ? todos
        : todos.filter((t) => t.category === activeCategory),
    [todos, activeCategory]
  );

  // Build 28-day connected streak chain nodes ("Never Break the Chain")
  const chainNodes = useMemo<ChainDayNode[]>(() => {
    const dates = getRecentIsoDates(windowDays, todayIso);
    const totalHabitsCount = Math.max(1, scopedHabits.length);

    const raw = dates.map((dateIso) => {
      const parsed = new Date(`${dateIso}T12:00:00`);
      const weekdayShort = parsed.toLocaleDateString('en-US', {
        weekday: 'short',
      });
      const dayNumber = String(parsed.getDate()).padStart(2, '0');

      const habitsDone = scopedHabits.filter((h) =>
        h.completedDates.includes(dateIso)
      ).length;
      const tasksDone = scopedTodos.filter(
        (t) =>
          (t.completedDates && t.completedDates.includes(dateIso)) ||
          (dateIso === todayIso && t.completed)
      ).length;

      const completedCount = habitsDone + tasksDone;
      const totalCount = totalHabitsCount + (dateIso === todayIso ? scopedTodos.length : 0);
      const ratio = Math.min(1, completedCount / Math.max(1, totalHabitsCount));
      const isPerfectDay = habitsDone >= totalHabitsCount && scopedHabits.length > 0;
      const hasAnyActivity = completedCount > 0;

      return {
        dateIso,
        dayNumber,
        weekdayShort,
        completedCount,
        totalCount,
        ratio,
        isPerfectDay,
        hasAnyActivity,
        isToday: dateIso === todayIso,
      };
    });

    return raw.map((node, idx) => {
      const prev = idx > 0 ? raw[idx - 1] : undefined;
      const next = idx < raw.length - 1 ? raw[idx + 1] : undefined;
      const colInRow = idx % 7;
      return {
        ...node,
        connectLeft:
          colInRow > 0 && node.hasAnyActivity && Boolean(prev?.hasAnyActivity),
        connectRight:
          colInRow < 6 && node.hasAnyActivity && Boolean(next?.hasAnyActivity),
      };
    });
  }, [windowDays, todayIso, scopedHabits, scopedTodos]);

  // Core Productive KPIs: Current Streak, Best Streak, Perfect Days, Completion Rate
  const kpiMetrics = useMemo(() => {
    // Current streak across habits/activity
    let currentChain = 0;
    for (let i = chainNodes.length - 1; i >= 0; i--) {
      if (chainNodes[i].hasAnyActivity) {
        currentChain += 1;
      } else if (i === chainNodes.length - 1) {
        continue;
      } else {
        break;
      }
    }

    // Best streak in window + max habit streak
    let longestInWindow = 0;
    let running = 0;
    for (const node of chainNodes) {
      if (node.hasAnyActivity) {
        running += 1;
        if (running > longestInWindow) longestInWindow = running;
      } else {
        running = 0;
      }
    }
    const maxHabitStreak = scopedHabits.reduce(
      (max, h) => Math.max(max, computeHabitCurrentStreak(h, todayIso)),
      0
    );
    const bestStreak = Math.max(longestInWindow, maxHabitStreak, currentChain);

    const perfectDaysCount = chainNodes.filter((n) => n.isPerfectDay).length;
    const avgRatio =
      chainNodes.length > 0
        ? chainNodes.reduce((acc, n) => acc + n.ratio, 0) / chainNodes.length
        : 0;
    const completionRatePct = Math.round(avgRatio * 100);

    return {
      currentChain,
      bestStreak,
      perfectDaysCount,
      completionRatePct,
    };
  }, [chainNodes, scopedHabits, todayIso]);

  // Weekday Performance Bar Chart (Mon -> Sun)
  const weekdayBars = useMemo(() => {
    const buckets: Record<
      (typeof WEEKDAY_ORDER)[number],
      { sumRatio: number; days: number; completedTotal: number }
    > = {
      Mon: { sumRatio: 0, days: 0, completedTotal: 0 },
      Tue: { sumRatio: 0, days: 0, completedTotal: 0 },
      Wed: { sumRatio: 0, days: 0, completedTotal: 0 },
      Thu: { sumRatio: 0, days: 0, completedTotal: 0 },
      Fri: { sumRatio: 0, days: 0, completedTotal: 0 },
      Sat: { sumRatio: 0, days: 0, completedTotal: 0 },
      Sun: { sumRatio: 0, days: 0, completedTotal: 0 },
    };

    for (const node of chainNodes) {
      const key = node.weekdayShort as (typeof WEEKDAY_ORDER)[number];
      if (buckets[key]) {
        buckets[key].sumRatio += node.ratio;
        buckets[key].days += 1;
        buckets[key].completedTotal += node.completedCount;
      }
    }

    const list = WEEKDAY_ORDER.map((day) => {
      const b = buckets[day];
      const pct = b.days > 0 ? Math.round((b.sumRatio / b.days) * 100) : 0;
      return {
        day,
        pct,
        completedTotal: b.completedTotal,
      };
    });

    const bestWeekday = list.reduce(
      (best, item) => (item.pct > best.pct ? item : best),
      list[0]
    );

    return { list, bestWeekday };
  }, [chainNodes]);

  // Time-of-Day Infographic Breakdown (Morning / Afternoon / Evening / Anytime)
  const timeOfDayBreakdown = useMemo(() => {
    const phases = [
      {
        id: 'morning' as const,
        label: 'Morning',
        windowLabel: '05:00–12:00',
        barColor: 'bg-emerald-600',
        textColor: 'text-emerald-700',
        icon: <Sun className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />,
      },
      {
        id: 'afternoon' as const,
        label: 'Afternoon',
        windowLabel: '12:00–17:00',
        barColor: 'bg-blue-600',
        textColor: 'text-blue-700',
        icon: <Sunset className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />,
      },
      {
        id: 'evening' as const,
        label: 'Evening',
        windowLabel: '17:00–24:00',
        barColor: 'bg-purple-700',
        textColor: 'text-purple-700',
        icon: <Moon className="w-3.5 h-3.5 text-purple-700" aria-hidden="true" />,
      },
      {
        id: 'anytime' as const,
        label: 'Anytime',
        windowLabel: 'Flexible',
        barColor: 'bg-slate-800',
        textColor: 'text-slate-700',
        icon: <Clock className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />,
      },
    ];

    return phases.map((p) => {
      const phaseHabits = scopedHabits.filter(
        (h) => resolveHabitTimeOfDay(h) === p.id
      );
      const phaseTodos = scopedTodos.filter(
        (t) => resolveTodoTimeOfDay(t) === p.id
      );
      const doneHabits = phaseHabits.filter((h) =>
        h.completedDates.includes(todayIso)
      ).length;
      const doneTodos = phaseTodos.filter((t) => t.completed).length;

      const total = phaseHabits.length + phaseTodos.length;
      const done = doneHabits + doneTodos;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;

      return {
        ...p,
        done,
        total,
        pct,
      };
    });
  }, [scopedHabits, scopedTodos, todayIso]);

  // 7 Life Area Category Progress Meters
  const areaMeters = useMemo(() => {
    return LIFE_AREAS.map((area, idx) => {
      const areaHabits = habits.filter((h) => h.lifeArea === area);
      const areaTodos = todos.filter((t) => t.category === area);
      const habitsDoneToday = areaHabits.filter((h) =>
        h.completedDates.includes(todayIso)
      ).length;
      const todosDone = areaTodos.filter((t) => t.completed).length;
      const total = areaHabits.length + areaTodos.length;
      const done = habitsDoneToday + todosDone;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      const fillClasses = ['bg-emerald-600', 'bg-blue-600', 'bg-purple-700'];

      return {
        area,
        done,
        total,
        pct,
        fillClass: fillClasses[idx % fillClasses.length],
      };
    });
  }, [habits, todos, todayIso]);

  const selectedNode = useMemo(
    () =>
      chainNodes.find((n) => n.dateIso === selectedChainDate) ??
      chainNodes[chainNodes.length - 1],
    [chainNodes, selectedChainDate]
  );

  // Radial ring geometry for Completion Rate card
  const kpiRingRadius = 18;
  const kpiRingCirc = 2 * Math.PI * kpiRingRadius;
  const kpiRingOffset =
    kpiRingCirc * (1 - kpiMetrics.completionRatePct / 100);

  return (
    <section
      aria-label="Productive Habit and Task Infographics"
      data-testid="productive-infographics-panel"
      className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-5"
    >
      {/* Header & Rolling Timeframe Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold tracking-tight text-slate-900 font-display">
            Consistency &amp; Momentum Infographics
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            <span>Streak chains</span>
            <span aria-hidden="true"> · </span>
            <span>Perfect days</span>
            <span aria-hidden="true"> · </span>
            <span>Weekday &amp; time-of-day distribution</span>
          </p>
        </div>

        <div
          role="group"
          aria-label="Select analytics window"
          className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl"
        >
          {([7, 14, 28] as const).map((days) => (
            <button
              key={days}
              type="button"
              data-testid={`infographic-window-${days}d`}
              onClick={() => setWindowDays(days)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono tabular-nums font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                windowDays === days
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {days}D
            </button>
          ))}
        </div>
      </div>

      {/* 1. Signature Productive 4-Card KPI Strip (Completion Ring · Current Chain · Best Streak · Perfect Days) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Card 1: Completion Rate with Radial SVG Ring */}
        <div
          data-testid="infographic-kpi-completion"
          className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between gap-2"
        >
          <div>
            <span className="text-[11px] font-medium text-slate-500 block">
              Completion Rate
            </span>
            <span className="text-xl font-extrabold font-mono tabular-nums text-slate-900 mt-0.5 block">
              {kpiMetrics.completionRatePct}%
            </span>
            <span className="text-[11px] text-emerald-700 font-medium">
              {windowDays}d rolling avg
            </span>
          </div>

          <svg
            viewBox="0 0 44 44"
            className="w-11 h-11 -rotate-90 shrink-0"
            aria-hidden="true"
          >
            <circle
              cx="22"
              cy="22"
              r={kpiRingRadius}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="4"
            />
            <circle
              cx="22"
              cy="22"
              r={kpiRingRadius}
              fill="none"
              stroke="#059669"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={kpiRingCirc}
              strokeDashoffset={kpiRingOffset}
            />
          </svg>
        </div>

        {/* Card 2: Current Streak Chain */}
        <div
          data-testid="infographic-kpi-current-streak"
          className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500">
              Current Streak
            </span>
            <Flame className="w-4 h-4 text-emerald-600" aria-hidden="true" />
          </div>
          <div className="mt-1">
            <span className="text-xl font-extrabold font-mono tabular-nums text-slate-900">
              {kpiMetrics.currentChain}d
            </span>
            <span className="text-[11px] text-slate-500 block">
              Active chain
            </span>
          </div>
        </div>

        {/* Card 3: Best Streak */}
        <div
          data-testid="infographic-kpi-best-streak"
          className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500">
              Best Streak
            </span>
            <Trophy className="w-4 h-4 text-blue-600" aria-hidden="true" />
          </div>
          <div className="mt-1">
            <span className="text-xl font-extrabold font-mono tabular-nums text-slate-900">
              {kpiMetrics.bestStreak}d
            </span>
            <span className="text-[11px] text-blue-700 font-medium block">
              Longest record
            </span>
          </div>
        </div>

        {/* Card 4: Perfect Days */}
        <div
          data-testid="infographic-kpi-perfect-days"
          className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500">
              Perfect Days
            </span>
            <CheckCircle2
              className="w-4 h-4 text-purple-700"
              aria-hidden="true"
            />
          </div>
          <div className="mt-1">
            <span className="text-xl font-extrabold font-mono tabular-nums text-slate-900">
              {kpiMetrics.perfectDaysCount}
            </span>
            <span className="text-[11px] text-purple-700 font-medium block">
              100% daily clears
            </span>
          </div>
        </div>
      </div>

      {/* 2. Connected Streak Chain Calendar ("Don't Break the Chain") */}
      <div className="border-t border-slate-100 pt-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarIcon
              className="w-4 h-4 text-emerald-700"
              aria-hidden="true"
            />
            <h3 className="text-xs font-bold text-slate-900 font-display">
              Streak Chain Calendar — Never Break the Chain
            </h3>
          </div>
          {selectedNode && (
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {selectedNode.weekdayShort} {selectedNode.dateIso} ·{' '}
              <strong className="text-slate-900">
                {Math.round(selectedNode.ratio * 100)}%
              </strong>{' '}
              ({selectedNode.completedCount} logged)
            </span>
          )}
        </div>

        {/* 7-Column Connected Chain Grid */}
        <div
          data-testid="productive-streak-chain-grid"
          className="grid grid-cols-7 gap-y-2.5 select-none pt-1"
        >
          {chainNodes.map((node) => {
            const isSelected = node.dateIso === selectedChainDate;
            const ringR = 13;
            const ringC = 2 * Math.PI * ringR;
            const ringOff = ringC * (1 - node.ratio);

            return (
              <div
                key={node.dateIso}
                className="relative flex flex-col items-center justify-center"
              >
                {/* Horizontal Left/Right Chain Connector Bars for Consecutive Active Days */}
                {node.connectLeft && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 right-1/2 top-4 h-2 bg-emerald-100 z-0"
                  />
                )}
                {node.connectRight && (
                  <span
                    aria-hidden="true"
                    className="absolute left-1/2 right-0 top-4 h-2 bg-emerald-100 z-0"
                  />
                )}

                <button
                  type="button"
                  data-testid={`chain-day-${node.dateIso}`}
                  onClick={() => setSelectedChainDate(node.dateIso)}
                  title={`${node.weekdayShort} ${node.dateIso}: ${Math.round(
                    node.ratio * 100
                  )}% completed`}
                  className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-150 cursor-pointer ${
                    isSelected ? 'scale-110 ring-2 ring-slate-900 ring-offset-1' : ''
                  }`}
                >
                  {node.isPerfectDay ? (
                    <span className="w-7 h-7 rounded-full bg-emerald-600 text-white text-[11px] font-mono tabular-nums font-bold flex items-center justify-center">
                      {node.dayNumber}
                    </span>
                  ) : (
                    <>
                      <svg
                        viewBox="0 0 32 32"
                        className="absolute inset-0 w-8 h-8 -rotate-90"
                        aria-hidden="true"
                      >
                        <circle
                          cx="16"
                          cy="16"
                          r={ringR}
                          fill={node.hasAnyActivity ? '#ecfdf5' : '#f8fafc'}
                          stroke="#e2e8f0"
                          strokeWidth="2.5"
                        />
                        {node.hasAnyActivity && (
                          <circle
                            cx="16"
                            cy="16"
                            r={ringR}
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeDasharray={ringC}
                            strokeDashoffset={ringOff}
                          />
                        )}
                      </svg>
                      <span
                        className={`relative text-[10px] font-mono tabular-nums font-bold ${
                          node.hasAnyActivity
                            ? 'text-emerald-950'
                            : 'text-slate-400'
                        }`}
                      >
                        {node.dayNumber}
                      </span>
                    </>
                  )}
                </button>

                <span className="text-[9px] font-mono text-slate-400 mt-0.5">
                  {node.weekdayShort.slice(0, 2)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Two-Column Infographics: Weekday Distribution Bar Chart + Time-of-Day Adherence */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
        {/* Left: Weekday Performance Bar Chart (Mon - Sun) */}
        <div
          data-testid="productive-weekday-barchart"
          className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-3"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <BarChart3
                className="w-3.5 h-3.5 text-blue-600"
                aria-hidden="true"
              />
              <h3 className="text-xs font-bold text-slate-900 font-display">
                Weekday Performance
              </h3>
            </div>
            <span className="text-[11px] font-mono tabular-nums text-blue-700 font-semibold">
              Peak: {weekdayBars.bestWeekday.day} ({weekdayBars.bestWeekday.pct}%)
            </span>
          </div>

          <div className="h-28 flex items-end justify-between gap-2 pt-3 px-1">
            {weekdayBars.list.map((bar) => {
              const isPeak =
                bar.day === weekdayBars.bestWeekday.day && bar.pct > 0;
              const heightPct = Math.max(10, bar.pct);
              return (
                <div
                  key={bar.day}
                  className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
                >
                  <span className="text-[10px] font-mono tabular-nums font-semibold text-slate-600">
                    {bar.pct}%
                  </span>
                  <div className="w-full max-w-[24px] h-16 bg-slate-200/80 rounded-lg overflow-hidden flex items-end">
                    <div
                      className={`w-full rounded-lg transition-all duration-200 ${
                        isPeak ? 'bg-emerald-600' : 'bg-blue-600'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span
                    className={`text-[10px] font-mono font-semibold ${
                      isPeak ? 'text-emerald-800 font-bold' : 'text-slate-500'
                    }`}
                  >
                    {bar.day.slice(0, 1)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Time-of-Day Adherence Meters (Morning / Afternoon / Evening / Anytime) */}
        <div
          data-testid="productive-timeofday-infographic"
          className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-bold text-slate-900 font-display">
              Time-of-Day Adherence
            </h3>
            <span className="text-[11px] font-mono text-slate-500">
              Today&apos;s Split
            </span>
          </div>

          <div className="space-y-2.5 pt-0.5">
            {timeOfDayBreakdown.map((item) => (
              <div key={item.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium text-slate-800">
                    {item.icon}
                    <span>{item.label}</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {item.windowLabel}
                    </span>
                  </span>
                  <span className="font-mono tabular-nums text-[11px] font-semibold text-slate-700">
                    {item.done}/{item.total} · {item.pct}%
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-200/80 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.barColor} transition-transform duration-200 origin-left`}
                    style={{ transform: `scaleX(${item.pct / 100})` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Category Progress Meters Across 7 Life Areas */}
      <div className="border-t border-slate-100 pt-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 font-display">
            Life Area Completion Meters
          </h3>
          {activeCategory !== 'All' && onSelectCategory && (
            <button
              type="button"
              onClick={() => onSelectCategory('All')}
              className="text-[11px] font-semibold text-blue-700 hover:underline cursor-pointer"
            >
              Show All Areas
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
          {areaMeters.map((m) => {
            const isSelected = activeCategory === m.area;
            return (
              <button
                key={m.area}
                type="button"
                onClick={() =>
                  onSelectCategory &&
                  onSelectCategory(isSelected ? 'All' : m.area)
                }
                className={`text-left p-2 rounded-xl border transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50/60 hover:bg-slate-100/80 border-slate-200/70 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold">{m.area}</span>
                  <span
                    className={`font-mono tabular-nums text-[11px] ${
                      isSelected ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {m.done}/{m.total} · {m.pct}%
                  </span>
                </div>
                <div
                  className={`h-1.5 w-full rounded-full overflow-hidden ${
                    isSelected ? 'bg-slate-700' : 'bg-slate-200'
                  }`}
                >
                  <div
                    className={`h-full ${
                      isSelected ? 'bg-emerald-400' : m.fillClass
                    } transition-transform duration-200 origin-left`}
                    style={{ transform: `scaleX(${m.pct / 100})` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Productive Guided Challenges (Morning Momentum · Deep Focus · Evening Wind-Down) */}
      <div
        data-testid="productive-guided-challenges"
        className="border-t border-slate-100 pt-4 space-y-2.5"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 font-display">
            Guided Consistency Challenges
          </h3>
          <span className="text-xs text-slate-500">
            Active multi-day habit chains
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {[
            {
              id: 'morning-7d',
              title: '7-Day Morning Ritual',
              meta: 'Morning · Hydration & Mobility',
              targetDays: 7,
              doneDays: Math.min(7, Math.max(3, kpiMetrics.currentChain)),
              barColor: 'bg-emerald-600',
            },
            {
              id: 'focus-14d',
              title: '14-Day Deep Focus',
              meta: 'Afternoon · 50m Zero Distraction',
              targetDays: 14,
              doneDays: Math.min(14, Math.max(6, kpiMetrics.currentChain + 3)),
              barColor: 'bg-blue-600',
            },
            {
              id: 'evening-21d',
              title: '21-Day Evening Shutdown',
              meta: 'Evening · Reading & Reflection',
              targetDays: 21,
              doneDays: Math.min(21, Math.max(9, kpiMetrics.bestStreak)),
              barColor: 'bg-purple-700',
            },
          ].map((challenge) => {
            const pct = Math.round(
              (challenge.doneDays / challenge.targetDays) * 100
            );
            return (
              <div
                key={challenge.id}
                className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-2"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-900">
                    {challenge.title}
                  </span>
                  <span className="text-xs font-mono tabular-nums font-bold text-slate-700">
                    {challenge.doneDays}/{challenge.targetDays}d
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">{challenge.meta}</p>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${challenge.barColor} transition-transform duration-200 origin-left`}
                    style={{ transform: `scaleX(${pct / 100})` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
