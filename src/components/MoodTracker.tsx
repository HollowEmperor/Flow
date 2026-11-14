import React, { useState, useMemo } from 'react';
import {
  Activity,
  Zap,
  Compass,
  Wind,
  Moon,
  Plus,
} from 'lucide-react';
import {
  Category,
  LIFE_AREAS,
  JournalMood,
  JournalEntry,
  JOURNAL_MOODS,
  MOOD_ENERGY_SCORES,
  computeMoodTrackerStats,
  getTodayIsoDate,
} from '../utils/todoLogic';

interface MoodTrackerProps {
  entries: JournalEntry[];
  onLogMoodCheckIn: (params: {
    title: string;
    content: string;
    gratitude: string;
    lifeArea: Category;
    mood: JournalMood;
    dateIso: string;
  }) => void;
}

const MOOD_META: Record<
  JournalMood,
  {
    label: JournalMood;
    tagline: string;
    energy: number;
    bgClass: string;
    activeClass: string;
    barClass: string;
    dotColor: string;
    icon: React.ReactNode;
  }
> = {
  Peak: {
    label: 'Peak',
    tagline: 'High flow & breakthrough energy',
    energy: MOOD_ENERGY_SCORES.Peak,
    bgClass: 'bg-emerald-50/70 border-emerald-200 text-emerald-900',
    activeClass: 'bg-emerald-700 text-white border-emerald-700 shadow-xs',
    barClass: 'bg-emerald-600',
    dotColor: '#059669',
    icon: <Zap className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
  },
  Focused: {
    label: 'Focused',
    tagline: 'Steady execution & clarity',
    energy: MOOD_ENERGY_SCORES.Focused,
    bgClass: 'bg-blue-50/70 border-blue-200 text-blue-900',
    activeClass: 'bg-blue-700 text-white border-blue-700 shadow-xs',
    barClass: 'bg-blue-600',
    dotColor: '#2563EB',
    icon: <Compass className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
  },
  Calm: {
    label: 'Calm',
    tagline: 'Grounded balance & recovery',
    energy: MOOD_ENERGY_SCORES.Calm,
    bgClass: 'bg-teal-50/70 border-teal-200 text-teal-900',
    activeClass: 'bg-teal-700 text-white border-teal-700 shadow-xs',
    barClass: 'bg-teal-600',
    dotColor: '#0D9488',
    icon: <Wind className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
  },
  Reflective: {
    label: 'Reflective',
    tagline: 'Introspective synthesis & rest',
    energy: MOOD_ENERGY_SCORES.Reflective,
    bgClass: 'bg-amber-50/70 border-amber-200 text-amber-900',
    activeClass: 'bg-amber-600 text-white border-amber-600 shadow-xs',
    barClass: 'bg-amber-500',
    dotColor: '#D97706',
    icon: <Moon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
  },
};

export const MoodTracker: React.FC<MoodTrackerProps> = ({
  entries,
  onLogMoodCheckIn,
}) => {
  const [selectedMood, setSelectedMood] = useState<JournalMood>('Peak');
  const [selectedArea, setSelectedArea] = useState<Category>('Portfolio');
  const [checkInNote, setCheckInNote] = useState('');

  const stats = useMemo(() => computeMoodTrackerStats(entries, 7), [entries]);

  const handleQuickLog = (e: React.FormEvent) => {
    e.preventDefault();
    const noteText =
      checkInNote.trim() ||
      `Logged ${selectedMood} mood check-in (${MOOD_META[selectedMood].tagline.toLowerCase()}).`;

    onLogMoodCheckIn({
      title: `${selectedMood} Mood Check-In · ${selectedArea}`,
      content: noteText,
      gratitude: '',
      lifeArea: selectedArea,
      mood: selectedMood,
      dateIso: getTodayIsoDate(),
    });
    setCheckInNote('');
  };

  return (
    <section
      aria-label="Mood and Energy Tracker"
      data-testid="mood-tracker-section"
      className="bg-white border border-slate-200 rounded-xl p-4 space-y-4"
    >
      {/* Header & Aggregate Metrics */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Activity
              className="w-5 h-5 text-emerald-700 shrink-0"
              aria-hidden="true"
            />
            <h2 className="text-base @sm:text-lg font-bold tracking-tight text-slate-900 font-display">
              Mood &amp; Energy Tracker
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Track daily emotional energy across your 7 Life Areas and spot
            7-day momentum patterns.
          </p>
        </div>

        {/* Summary KPI Strip */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs">
          <div>
            <span className="text-slate-500">Dominant: </span>
            <strong
              data-testid="mood-tracker-dominant"
              className="text-slate-900 font-semibold"
            >
              {stats.dominantMood ?? 'None'}
            </strong>
          </div>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <div>
            <span className="text-slate-500">Avg Energy: </span>
            <strong
              data-testid="mood-tracker-avg-energy"
              className="font-mono tabular-nums text-emerald-700"
            >
              {stats.averageEnergyScore}%
            </strong>
          </div>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <div
            data-testid="mood-tracker-total-logs"
            className="font-mono tabular-nums font-bold text-slate-800"
          >
            {stats.totalMoodLogs} logs
          </div>
        </div>
      </div>

      {/* 7-Day Mood & Energy Curve + Mood Distribution Grid */}
      <div className="grid grid-cols-1 @xl:grid-cols-12 gap-4 items-stretch">
        {/* Left: 7-Day Mood Energy Trend Chart */}
        <div className="@xl:col-span-7 bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-col justify-between space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-800">
              7-Day Mood &amp; Energy Curve
            </span>
            <span className="text-[11px] font-mono tabular-nums text-slate-500">
              Peak (100%) → Reflective (54%)
            </span>
          </div>

          <div className="w-full overflow-hidden">
            <svg
              data-testid="mood-trend-svg"
              viewBox="0 0 280 72"
              className="w-full h-20 overflow-visible"
              role="img"
              aria-label="7-day mood energy trend chart"
            >
              {/* Horizontal Guide Lines */}
              <line
                x1="12"
                y1="14"
                x2="268"
                y2="14"
                stroke="#E2E8F0"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <line
                x1="12"
                y1="36"
                x2="268"
                y2="36"
                stroke="#E2E8F0"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <line
                x1="12"
                y1="58"
                x2="268"
                y2="58"
                stroke="#E2E8F0"
                strokeDasharray="3 3"
                strokeWidth="1"
              />

              {/* Trend Polyline */}
              <polyline
                fill="none"
                stroke="#0F172A"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={stats.svgPolylinePoints}
              />

              {/* Data Nodes */}
              {stats.recentDays.map((pt, idx) => {
                const coords = stats.svgPolylinePoints.split(' ')[idx]?.split(',');
                const cx = Number(coords?.[0] ?? 140);
                const cy = Number(coords?.[1] ?? 36);
                const dotColor = pt.mood
                  ? MOOD_META[pt.mood].dotColor
                  : '#CBD5E1';

                return (
                  <g key={pt.dateIso}>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={pt.mood ? 4.5 : 3}
                      fill={dotColor}
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* 7-Day Timeline Labels */}
          <div className="grid grid-cols-7 gap-1 pt-1 border-t border-slate-200/70 text-center">
            {stats.recentDays.map((pt) => (
              <div key={pt.dateIso} className="space-y-0.5">
                <div className="text-[10px] font-mono tabular-nums text-slate-500">
                  {pt.shortDate}
                </div>
                <div className="text-[10px] font-semibold text-slate-800 truncate">
                  {pt.mood ?? '—'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Mood Distribution Breakdown */}
        <div className="@xl:col-span-5 bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-col justify-between space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">
              Mood Distribution
            </span>
            <span className="text-[11px] text-slate-500 font-mono tabular-nums">
              {stats.totalMoodLogs} total
            </span>
          </div>

          <div className="space-y-2.5 my-auto">
            {JOURNAL_MOODS.map((m) => {
              const meta = MOOD_META[m];
              const count = stats.countsByMood[m];
              const pct = stats.percentsByMood[m];
              return (
                <div
                  key={m}
                  data-testid={`mood-dist-${m.toLowerCase()}`}
                  className="space-y-1"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                      {meta.icon}
                      <span>{m}</span>
                    </span>
                    <span className="font-mono tabular-nums text-slate-600">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-200/80 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${meta.barClass} transition-transform duration-300 origin-left`}
                      style={{ transform: `scaleX(${pct / 100})` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick 1-Tap Mood Check-In Form */}
      <form
        onSubmit={handleQuickLog}
        aria-label="Quick mood check-in"
        className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 space-y-2.5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-800">
            Log Today&rsquo;s Mood Check-In
          </span>
          <span className="text-[11px] text-slate-500 font-mono tabular-nums">
            Energy Level: {MOOD_META[selectedMood].energy}%
          </span>
        </div>

        {/* 4 Selectable Mood Buttons */}
        <div
          role="group"
          aria-label="Select mood state"
          className="grid grid-cols-2 @sm:grid-cols-4 gap-2"
        >
          {JOURNAL_MOODS.map((m) => {
            const meta = MOOD_META[m];
            const isSelected = selectedMood === m;
            return (
              <button
                key={m}
                type="button"
                data-testid={`select-mood-${m.toLowerCase()}`}
                onClick={() => setSelectedMood(m)}
                aria-pressed={isSelected}
                className={`px-2.5 py-2 rounded-lg border text-xs font-semibold flex items-center justify-between gap-1.5 transition-colors cursor-pointer ${
                  isSelected ? meta.activeClass : meta.bgClass
                }`}
              >
                <span className="flex items-center gap-1.5 truncate">
                  {meta.icon}
                  <span className="truncate">{m}</span>
                </span>
                <span className="text-[10px] font-mono tabular-nums opacity-85">
                  {meta.energy}%
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="mood-checkin-note-input" className="sr-only">
            Mood check-in note
          </label>
          <input
            id="mood-checkin-note-input"
            data-testid="mood-checkin-note-input"
            type="text"
            value={checkInNote}
            onChange={(e) => setCheckInNote(e.target.value)}
            placeholder={`Optional note for your ${selectedMood} mood check-in...`}
            className="flex-1 min-w-[180px] text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400"
          />

          <label htmlFor="mood-checkin-area-select" className="sr-only">
            Mood Life Area
          </label>
          <select
            id="mood-checkin-area-select"
            data-testid="mood-checkin-area-select"
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value as Category)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 font-medium"
          >
            {LIFE_AREAS.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>

          <button
            type="submit"
            data-testid="log-mood-checkin-btn"
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Log {selectedMood} Mood</span>
          </button>
        </div>
      </form>
    </section>
  );
};
