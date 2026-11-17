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
  TrendingUp,
  Layers,
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
  chainLengthAtDay: number;
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
  onToggleHabitDate,
}) => {
  const [windowDays, setWindowDays] = useState<AnalyticsWindow>(28);
  const [selectedChainDate, setSelectedChainDate] = useState<string>(todayIso);
  const [selectedHabitId, setSelectedHabitId] = useState<string | 'all'>('all');

  const scopedHabits = useMemo(
    () =>
      activeCategory === 'All'
        ? habits
        : habits.filter((h) => h.lifeArea === activeCategory),
    [habits, activeCategory]
  );

  const activeFocusedHabit = useMemo(
    () =>
      selectedHabitId === 'all'
        ? null
        : scopedHabits.find((h) => h.id === selectedHabitId) ?? null,
    [scopedHabits, selectedHabitId]
  );

  const effectiveHabits = useMemo(
    () => (activeFocusedHabit ? [activeFocusedHabit] : scopedHabits),
    [activeFocusedHabit, scopedHabits]
  );

  const scopedTodos = useMemo(
    () =>
      activeFocusedHabit
        ? []
        : activeCategory === 'All'
          ? todos
          : todos.filter((t) => t.category === activeCategory),
    [todos, activeCategory, activeFocusedHabit]
  );

  // Build 28-day connected streak chain nodes ("Never Break the Chain" — Apalon Productive capsule style)
  const chainNodes = useMemo<ChainDayNode[]>(() => {
    const dates = getRecentIsoDates(windowDays, todayIso);
    const totalHabitsCount = Math.max(1, effectiveHabits.length);

    let runningStreak = 0;
    const raw = dates.map((dateIso) => {
      const parsed = new Date(`${dateIso}T12:00:00`);
      const weekdayShort = parsed.toLocaleDateString('en-US', {
        weekday: 'short',
      });
      const dayNumber = String(parsed.getDate()).padStart(2, '0');

      const habitsDone = effectiveHabits.filter((h) =>
        h.completedDates.includes(dateIso)
      ).length;
      const tasksDone = scopedTodos.filter(
        (t) =>
          (t.completedDates && t.completedDates.includes(dateIso)) ||
          (dateIso === todayIso && t.completed)
      ).length;

      const completedCount = habitsDone + tasksDone;
      const totalCount =
        totalHabitsCount + (dateIso === todayIso ? scopedTodos.length : 0);
      const ratio = Math.min(1, completedCount / Math.max(1, totalHabitsCount));
      const isPerfectDay =
        habitsDone >= totalHabitsCount && effectiveHabits.length > 0;
      const hasAnyActivity = completedCount > 0;

      if (hasAnyActivity) {
        runningStreak += 1;
      } else {
        runningStreak = 0;
      }

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
        chainLengthAtDay: runningStreak,
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
  }, [windowDays, todayIso, effectiveHabits, scopedTodos]);

  // Core Productive KPIs: Habits Done, Current Streak, Best Streak, Perfect Days, Completion Rate
  const kpiMetrics = useMemo(() => {
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
    const maxHabitStreak = effectiveHabits.reduce(
      (max, h) => Math.max(max, computeHabitCurrentStreak(h, todayIso)),
      0
    );
    const bestStreak = Math.max(longestInWindow, maxHabitStreak, currentChain);

    const perfectDaysCount = chainNodes.filter((n) => n.isPerfectDay).length;
    const totalDoneInWindow = chainNodes.reduce(
      (acc, n) => acc + n.completedCount,
      0
    );
    const avgRatio =
      chainNodes.length > 0
        ? chainNodes.reduce((acc, n) => acc + n.ratio, 0) / chainNodes.length
        : 0;
    const completionRatePct = Math.round(avgRatio * 100);

    return {
      currentChain,
      bestStreak,
      perfectDaysCount,
      totalDoneInWindow,
      completionRatePct,
    };
  }, [chainNodes, effectiveHabits, todayIso]);

  // 6-Week Rolling Momentum Trend (Productive Monthly/Weekly Trend Infographic)
  const weeklyMomentumBars = useMemo(() => {
    const dates42 = getRecentIsoDates(42, todayIso);
    const totalHabitsCount = Math.max(1, effectiveHabits.length);
    const weeks: Array<{
      label: string;
      rangeText: string;
      pct: number;
      perfectCount: number;
    }> = [];

    for (let w = 0; w < 6; w++) {
      const slice = dates42.slice(w * 7, w * 7 + 7);
      if (slice.length === 0) continue;
      let sumRatio = 0;
      let perfectCount = 0;
      for (const d of slice) {
        const hDone = effectiveHabits.filter((h) =>
          h.completedDates.includes(d)
        ).length;
        const tDone = scopedTodos.filter(
          (t) =>
            (t.completedDates && t.completedDates.includes(d)) ||
            (d === todayIso && t.completed)
        ).length;
        const r = Math.min(1, (hDone + tDone) / totalHabitsCount);
        sumRatio += r;
        if (hDone >= totalHabitsCount && effectiveHabits.length > 0) {
          perfectCount += 1;
        }
      }
      const pct = Math.round((sumRatio / slice.length) * 100);
      const firstDate = slice[0].slice(5);
      const lastDate = slice[slice.length - 1].slice(5);
      weeks.push({
        label: w === 5 ? 'Now' : `W-${5 - w}`,
        rangeText: `${firstDate}–${lastDate}`,
        pct,
        perfectCount,
      });
    }

    const latestPct = weeks[weeks.length - 1]?.pct ?? 0;
    const prevAvg =
      weeks.length > 1
        ? Math.round(
            weeks
              .slice(0, weeks.length - 1)
              .reduce((acc, item) => acc + item.pct, 0) /
              (weeks.length - 1)
          )
        : latestPct;
    const deltaPct = latestPct - prevAvg;

    return { weeks, deltaPct };
  }, [todayIso, effectiveHabits, scopedTodos]);

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
        strokeHex: '#059669',
        trackHex: '#d1fae5',
        textColor: 'text-emerald-700',
        icon: <Sun className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />,
      },
      {
        id: 'afternoon' as const,
        label: 'Afternoon',
        windowLabel: '12:00–17:00',
        barColor: 'bg-blue-600',
        strokeHex: '#2563eb',
        trackHex: '#dbeafe',
        textColor: 'text-blue-700',
        icon: <Sunset className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />,
      },
      {
        id: 'evening' as const,
        label: 'Evening',
        windowLabel: '17:00–24:00',
        barColor: 'bg-purple-700',
        strokeHex: '#7c3aed',
        trackHex: '#ede9fe',
        textColor: 'text-purple-700',
        icon: <Moon className="w-3.5 h-3.5 text-purple-700" aria-hidden="true" />,
      },
      {
        id: 'anytime' as const,
        label: 'Anytime',
        windowLabel: 'Flexible',
        barColor: 'bg-slate-800',
        strokeHex: '#1e293b',
        trackHex: '#e2e8f0',
        textColor: 'text-slate-700',
        icon: <Clock className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />,
      },
    ];

    return phases.map((p) => {
      const phaseHabits = effectiveHabits.filter(
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
  }, [effectiveHabits, scopedTodos, todayIso]);

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

  // Concentric 3-ring geometry for Morning (outer), Afternoon (middle), Evening (inner)
  const outerR = 36;
  const midR = 27;
  const innerR = 18;
  const outerC = 2 * Math.PI * outerR;
  const midC = 2 * Math.PI * midR;
  const innerC = 2 * Math.PI * innerR;

  const morningPct = timeOfDayBreakdown[0]?.pct ?? 0;
  const afternoonPct = timeOfDayBreakdown[1]?.pct ?? 0;
  const eveningPct = timeOfDayBreakdown[2]?.pct ?? 0;

  return (
    <section
      aria-label="Productive Habit and Task Infographics"
      data-testid="productive-infographics-panel"
      className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-5"
    >
      {/* Header & Rolling Timeframe Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[16px] sm:text-[17px] font-bold tracking-[-0.024em] text-slate-950 font-display">
            Productive Statistics &amp; Streak Infographics
          </h2>
          <p className="text-[12.5px] text-slate-500 mt-0.5">
            <span>Concentric rhythm rings</span>
            <span aria-hidden="true" className="text-slate-300"> · </span>
            <span>Capsule streak chains</span>
            <span aria-hidden="true" className="text-slate-300"> · </span>
            <span>6-week momentum &amp; weekday breakdown</span>
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

      {/* Interactive Habit Scope Selector (Inspect Overall Routine vs. Single Habit Chain) */}
      {scopedHabits.length > 0 && (
        <div
          role="group"
          aria-label="Filter infographics by specific habit"
          data-testid="productive-habit-scope-bar"
          className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar"
        >
          <button
            type="button"
            data-testid="infographic-habit-scope-all"
            onClick={() => setSelectedHabitId('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              selectedHabitId === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" aria-hidden="true" />
            <span>All Routine ({scopedHabits.length})</span>
          </button>
          {scopedHabits.map((h) => {
            const isSelected = selectedHabitId === h.id;
            const hStreak = computeHabitCurrentStreak(h, todayIso);
            return (
              <button
                key={h.id}
                type="button"
                data-testid={`infographic-habit-scope-${h.id}`}
                onClick={() =>
                  setSelectedHabitId((prev) => (prev === h.id ? 'all' : h.id))
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <span className="truncate max-w-[150px]">{h.title}</span>
                <span
                  className={`font-mono tabular-nums text-[11px] ${
                    isSelected ? 'text-emerald-100' : 'text-emerald-700'
                  }`}
                >
                  {hStreak}d
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* 1. Concentric 3-Ring Rhythm Gauge + Signature 4-Card Productive KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
        {/* Left: Concentric Multi-Ring Rhythm Infographic (Morning / Afternoon / Evening) */}
        <div
          data-testid="productive-concentric-rings-card"
          className="md:col-span-5 bg-slate-900 text-white rounded-2xl p-4 flex items-center justify-between gap-3.5"
        >
          <div className="space-y-2 min-w-0">
            <span className="text-[11px] font-semibold tracking-[0.03em] uppercase text-emerald-400 block">
              Daily Rhythm Rings
            </span>
            <div>
              <span
                data-testid="infographic-kpi-completion"
                className="text-2xl font-extrabold font-mono tabular-nums text-white block leading-none"
              >
                {kpiMetrics.completionRatePct}%
              </span>
              <span className="text-[11.5px] text-slate-400 mt-1 block">
                {windowDays}-day consistency score
              </span>
            </div>

            <div className="space-y-1 pt-1 text-[11px] font-mono tabular-nums">
              <div className="flex items-center gap-2 text-emerald-300">
                <span className="w-2 h-2 rounded-xs bg-emerald-500 shrink-0" />
                <span>Morning · {morningPct}%</span>
              </div>
              <div className="flex items-center gap-2 text-blue-300">
                <span className="w-2 h-2 rounded-xs bg-blue-500 shrink-0" />
                <span>Afternoon · {afternoonPct}%</span>
              </div>
              <div className="flex items-center gap-2 text-purple-300">
                <span className="w-2 h-2 rounded-xs bg-purple-400 shrink-0" />
                <span>Evening · {eveningPct}%</span>
              </div>
            </div>
          </div>

          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg
              viewBox="0 0 88 88"
              className="w-24 h-24 -rotate-90"
              aria-hidden="true"
            >
              {/* Outer Ring: Morning */}
              <circle
                cx="44"
                cy="44"
                r={outerR}
                fill="none"
                stroke="#1e293b"
                strokeWidth="5.5"
              />
              <circle
                cx="44"
                cy="44"
                r={outerR}
                fill="none"
                stroke="#10b981"
                strokeWidth="5.5"
                strokeLinecap="round"
                strokeDasharray={outerC}
                strokeDashoffset={outerC * (1 - morningPct / 100)}
              />
              {/* Middle Ring: Afternoon */}
              <circle
                cx="44"
                cy="44"
                r={midR}
                fill="none"
                stroke="#1e293b"
                strokeWidth="5.5"
              />
              <circle
                cx="44"
                cy="44"
                r={midR}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="5.5"
                strokeLinecap="round"
                strokeDasharray={midC}
                strokeDashoffset={midC * (1 - afternoonPct / 100)}
              />
              {/* Inner Ring: Evening */}
              <circle
                cx="44"
                cy="44"
                r={innerR}
                fill="none"
                stroke="#1e293b"
                strokeWidth="5.5"
              />
              <circle
                cx="44"
                cy="44"
                r={innerR}
                fill="none"
                stroke="#a855f7"
                strokeWidth="5.5"
                strokeLinecap="round"
                strokeDasharray={innerC}
                strokeDashoffset={innerC * (1 - eveningPct / 100)}
              />
            </svg>
            <span className="absolute text-[11px] font-mono tabular-nums font-bold text-white">
              {kpiMetrics.currentChain}d
            </span>
          </div>
        </div>

        {/* Right: 4 Signature Productive Stat Cards (Current Streak · Best Streak · Perfect Days · Habits Done) */}
        <div className="md:col-span-7 grid grid-cols-2 gap-2.5">
          {/* Card 1: Current Streak Chain */}
          <div
            data-testid="infographic-kpi-current-streak"
            className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] font-medium text-slate-500">
                Current Streak
              </span>
              <Flame className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            </div>
            <div className="mt-1.5">
              <span className="text-xl font-extrabold font-mono tabular-nums text-slate-950">
                {kpiMetrics.currentChain}{' '}
                <span className="text-xs font-semibold text-slate-500">days</span>
              </span>
              <span className="text-[11px] text-emerald-700 font-medium block">
                Unbroken active chain
              </span>
            </div>
          </div>

          {/* Card 2: Best Streak Record */}
          <div
            data-testid="infographic-kpi-best-streak"
            className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] font-medium text-slate-500">
                Best Streak
              </span>
              <Trophy className="w-4 h-4 text-blue-600" aria-hidden="true" />
            </div>
            <div className="mt-1.5">
              <span className="text-xl font-extrabold font-mono tabular-nums text-slate-950">
                {kpiMetrics.bestStreak}{' '}
                <span className="text-xs font-semibold text-slate-500">days</span>
              </span>
              <span className="text-[11px] text-blue-700 font-medium block">
                Personal record chain
              </span>
            </div>
          </div>

          {/* Card 3: Perfect Days */}
          <div
            data-testid="infographic-kpi-perfect-days"
            className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] font-medium text-slate-500">
                Perfect Days
              </span>
              <CheckCircle2
                className="w-4 h-4 text-purple-700"
                aria-hidden="true"
              />
            </div>
            <div className="mt-1.5">
              <span className="text-xl font-extrabold font-mono tabular-nums text-slate-950">
                {kpiMetrics.perfectDaysCount}
                <span className="text-xs font-semibold text-slate-400">
                  /{windowDays}d
                </span>
              </span>
              <span className="text-[11px] text-purple-700 font-medium block">
                100% daily habit clears
              </span>
            </div>
          </div>

          {/* Card 4: Habits & Tasks Done (Apalon Productive 4th Core Card) */}
          <div
            data-testid="infographic-kpi-habits-done"
            className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] font-medium text-slate-500">
                Habits Done
              </span>
              <TrendingUp
                className="w-4 h-4 text-emerald-600"
                aria-hidden="true"
              />
            </div>
            <div className="mt-1.5">
              <span className="text-xl font-extrabold font-mono tabular-nums text-slate-950">
                {kpiMetrics.totalDoneInWindow}
              </span>
              <span className="text-[11px] text-slate-500 block">
                Completed in {windowDays}d window
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Connected Capsule Streak Chain Calendar ("Don't Break the Chain" — com.apalon.to.do.list style) */}
      <div className="border-t border-slate-100 pt-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <CalendarIcon
                className="w-4 h-4 text-emerald-700"
                aria-hidden="true"
              />
              <h3 className="text-[13.5px] font-bold text-slate-950 font-display">
                {activeFocusedHabit
                  ? `Streak Chain Calendar — ${activeFocusedHabit.title}`
                  : 'Streak Chain Calendar — Never Break the Chain'}
              </h3>
            </div>
            <p className="text-[11.5px] text-slate-500 mt-0.5">
              {activeFocusedHabit
                ? 'Click any date below to toggle completion and link or break the emerald capsule chain.'
                : 'Consecutive active days fuse into a continuous emerald streak chain. Select a habit above to toggle dates directly.'}
            </p>
          </div>

          {selectedNode && (
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {selectedNode.weekdayShort} {selectedNode.dateIso} ·{' '}
              <strong className="text-slate-900">
                {Math.round(selectedNode.ratio * 100)}%
              </strong>{' '}
              ({selectedNode.completedCount} done · {selectedNode.chainLengthAtDay}d chain)
            </span>
          )}
        </div>

        {/* Weekday Column Header Row */}
        <div className="grid grid-cols-7 text-center text-[10px] font-mono font-semibold uppercase text-slate-400 pt-1">
          {chainNodes.slice(0, 7).map((n) => (
            <span key={`hdr-${n.dateIso}`}>{n.weekdayShort.slice(0, 3)}</span>
          ))}
        </div>

        {/* 7-Column Connected Capsule Chain Grid */}
        <div
          data-testid="productive-streak-chain-grid"
          className="grid grid-cols-7 gap-y-2 select-none"
        >
          {chainNodes.map((node) => {
            const isSelected = node.dateIso === selectedChainDate;
            const ringR = 13;
            const ringC = 2 * Math.PI * ringR;
            const ringOff = ringC * (1 - node.ratio);

            return (
              <div
                key={node.dateIso}
                className="relative flex flex-col items-center justify-center py-0.5"
              >
                {/* Continuous Capsule Bridge for Consecutive Active Days (Productive App Signature) */}
                {node.connectLeft && (
                  <span
                    aria-hidden="true"
                    className={`absolute left-0 right-1/2 top-1/2 -translate-y-1/2 h-7 z-0 ${
                      node.isPerfectDay
                        ? 'bg-emerald-600/20'
                        : 'bg-emerald-500/15'
                    }`}
                  />
                )}
                {node.connectRight && (
                  <span
                    aria-hidden="true"
                    className={`absolute left-1/2 right-0 top-1/2 -translate-y-1/2 h-7 z-0 ${
                      node.isPerfectDay
                        ? 'bg-emerald-600/20'
                        : 'bg-emerald-500/15'
                    }`}
                  />
                )}

                <button
                  type="button"
                  data-testid={`chain-day-${node.dateIso}`}
                  onClick={() => {
                    setSelectedChainDate(node.dateIso);
                    if (activeFocusedHabit && onToggleHabitDate) {
                      onToggleHabitDate(activeFocusedHabit.id, node.dateIso);
                    }
                  }}
                  title={`${node.weekdayShort} ${node.dateIso}: ${Math.round(
                    node.ratio * 100
                  )}% completed (${node.chainLengthAtDay}d chain)`}
                  className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-150 cursor-pointer ${
                    isSelected
                      ? 'scale-110 ring-2 ring-slate-900 ring-offset-1'
                      : ''
                  }`}
                >
                  {node.isPerfectDay ? (
                    <span className="w-7 h-7 rounded-full bg-emerald-600 text-white text-[11px] font-mono tabular-nums font-bold flex items-center justify-center shadow-2xs">
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
                          stroke={node.isToday ? '#2563eb' : '#e2e8f0'}
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
              </div>
            );
          })}
        </div>

        {/* Chain Legend */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-500">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
              <span>Perfect Chain Day (100%)</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full border-2 border-emerald-500 bg-emerald-50 inline-block" />
              <span>Partial Progress Ring</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full border border-slate-300 bg-slate-50 inline-block" />
              <span>Missed</span>
            </span>
          </div>
          <span className="font-mono tabular-nums text-emerald-700 font-semibold">
            Longest unbroken chain: {kpiMetrics.bestStreak}d
          </span>
        </div>
      </div>

      {/* 3. Two-Column Infographics: Weekday Distribution + 6-Week Momentum Trend */}
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
                Weekday Consistency
              </h3>
            </div>
            <span className="text-[11px] font-mono tabular-nums text-emerald-700 font-semibold">
              Best: {weekdayBars.bestWeekday.day} ({weekdayBars.bestWeekday.pct}%)
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

        {/* Right: 6-Week Rolling Momentum Trend (Productive Monthly/Weekly Trend) */}
        <div
          data-testid="productive-weekly-momentum-chart"
          className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-3"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <TrendingUp
                className="w-3.5 h-3.5 text-purple-700"
                aria-hidden="true"
              />
              <h3 className="text-xs font-bold text-slate-900 font-display">
                6-Week Momentum Trend
              </h3>
            </div>
            <span
              className={`text-[11px] font-mono tabular-nums font-semibold ${
                weeklyMomentumBars.deltaPct >= 0
                  ? 'text-emerald-700'
                  : 'text-slate-600'
              }`}
            >
              {weeklyMomentumBars.deltaPct >= 0
                ? `+${weeklyMomentumBars.deltaPct}% vs prior`
                : `${weeklyMomentumBars.deltaPct}% vs prior`}
            </span>
          </div>

          <div className="h-28 flex items-end justify-between gap-2 pt-3 px-1">
            {weeklyMomentumBars.weeks.map((wk, idx) => {
              const isCurrent = idx === weeklyMomentumBars.weeks.length - 1;
              const heightPct = Math.max(10, wk.pct);
              return (
                <div
                  key={wk.label}
                  title={`${wk.rangeText}: ${wk.pct}% completion (${wk.perfectCount} perfect days)`}
                  className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
                >
                  <span className="text-[10px] font-mono tabular-nums font-semibold text-slate-600">
                    {wk.pct}%
                  </span>
                  <div className="w-full max-w-[24px] h-16 bg-slate-200/80 rounded-lg overflow-hidden flex items-end">
                    <div
                      className={`w-full rounded-lg transition-all duration-200 ${
                        isCurrent ? 'bg-purple-700' : 'bg-slate-700'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span
                    className={`text-[10px] font-mono ${
                      isCurrent
                        ? 'text-purple-800 font-bold'
                        : 'text-slate-500 font-medium'
                    }`}
                  >
                    {wk.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Time-of-Day Chronological Adherence Infographic (Stacked Distribution Bar + Phase Meters) */}
      <div
        data-testid="productive-timeofday-infographic"
        className="border-t border-slate-100 pt-4 space-y-3"
      >
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-bold text-slate-900 font-display">
            Time-of-Day Chronological Adherence
          </h3>
          <span className="text-[11px] font-mono text-slate-500">
            Morning · Afternoon · Evening · Anytime
          </span>
        </div>

        {/* Stacked Proportional Distribution Bar */}
        <div
          aria-label="Time of day completion distribution"
          className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-0.5"
        >
          {timeOfDayBreakdown.map((item) => {
            const weight = Math.max(1, item.total);
            return (
              <div
                key={`seg-${item.id}`}
                style={{ flexGrow: weight }}
                className="h-full bg-slate-200 overflow-hidden"
                title={`${item.label}: ${item.done}/${item.total} (${item.pct}%)`}
              >
                <div
                  className={`h-full ${item.barColor} transition-transform duration-200 origin-left`}
                  style={{ transform: `scaleX(${item.pct / 100})` }}
                />
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
          {timeOfDayBreakdown.map((item) => (
            <div
              key={item.id}
              className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-200/70 space-y-1.5"
            >
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
              <div className="h-1.5 w-full bg-slate-200/80 rounded-full overflow-hidden">
                <div
                  className={`h-full ${item.barColor} transition-transform duration-200 origin-left`}
                  style={{ transform: `scaleX(${item.pct / 100})` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Category Progress Meters Across 7 Life Areas */}
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

      {/* 6. Productive Guided Challenges (Morning Momentum · Deep Focus · Evening Wind-Down) */}
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
