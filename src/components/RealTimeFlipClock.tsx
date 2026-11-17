import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  Sparkles,
  Maximize2,
  Minimize2,
  Globe,
  RotateCcw,
  Play,
  Pause,
  Timer,
  CheckCircle2,
} from 'lucide-react';
import { TodoItem } from '../utils/todoLogic';

export type FlipClockThemeId = 'obsidian' | 'emerald' | 'blue' | 'purple';

interface FlipClockThemePalette {
  id: FlipClockThemeId;
  label: string;
  flapTopBg: string;
  flapBottomBg: string;
  flapBorder: string;
  flapText: string;
  flapAccent: string;
  housingBg: string;
  housingBorder: string;
  badgeBg: string;
  badgeText: string;
}

const FLIP_CLOCK_THEMES: Record<FlipClockThemeId, FlipClockThemePalette> = {
  obsidian: {
    id: 'obsidian',
    label: 'Obsidian Slate',
    flapTopBg: '#1e293b',
    flapBottomBg: '#0f172a',
    flapBorder: '#334155',
    flapText: '#f8fafc',
    flapAccent: '#10b981',
    housingBg: 'bg-slate-900',
    housingBorder: 'border-slate-800',
    badgeBg: 'bg-emerald-600',
    badgeText: 'text-white',
  },
  emerald: {
    id: 'emerald',
    label: 'Emerald Action',
    flapTopBg: '#047857',
    flapBottomBg: '#064e3b',
    flapBorder: '#10b981',
    flapText: '#ecfdf5',
    flapAccent: '#34d399',
    housingBg: 'bg-emerald-950',
    housingBorder: 'border-emerald-800',
    badgeBg: 'bg-emerald-500',
    badgeText: 'text-slate-950',
  },
  blue: {
    id: 'blue',
    label: 'Royal Blue',
    flapTopBg: '#1d4ed8',
    flapBottomBg: '#1e3a8a',
    flapBorder: '#3b82f6',
    flapText: '#eff6ff',
    flapAccent: '#60a5fa',
    housingBg: 'bg-blue-950',
    housingBorder: 'border-blue-800',
    badgeBg: 'bg-blue-600',
    badgeText: 'text-white',
  },
  purple: {
    id: 'purple',
    label: 'Amethyst Vision',
    flapTopBg: '#5b21b6',
    flapBottomBg: '#2e1065',
    flapBorder: '#8b5cf6',
    flapText: '#f5f3ff',
    flapAccent: '#a78bfa',
    housingBg: 'bg-purple-950',
    housingBorder: 'border-purple-800',
    badgeBg: 'bg-purple-600',
    badgeText: 'text-white',
  },
};

interface WorldTimeZoneOption {
  id: string;
  label: string;
  timeZone?: string; // undefined means local system timezone
  shortCode: string;
}

const TIMEZONE_OPTIONS: WorldTimeZoneOption[] = [
  { id: 'local', label: 'Local System Time', shortCode: 'LOCAL' },
  { id: 'utc', label: 'UTC / GMT', timeZone: 'UTC', shortCode: 'UTC' },
  {
    id: 'ny',
    label: 'New York (ET)',
    timeZone: 'America/New_York',
    shortCode: 'NYC',
  },
  {
    id: 'lon',
    label: 'London (UK)',
    timeZone: 'Europe/London',
    shortCode: 'LON',
  },
  { id: 'tyo', label: 'Tokyo (JST)', timeZone: 'Asia/Tokyo', shortCode: 'TYO' },
  {
    id: 'syd',
    label: 'Sydney (AEST)',
    timeZone: 'Australia/Sydney',
    shortCode: 'SYD',
  },
];

interface SplitFlapCardProps {
  value: string;
  label: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  forceFlipSignal?: number;
  testId?: string;
}

export const SplitFlapCard: React.FC<SplitFlapCardProps> = ({
  value,
  label,
  size = 'md',
  forceFlipSignal = 0,
  testId,
}) => {
  const [displayState, setDisplayState] = useState<{
    current: string;
    previous: string;
    flipKey: number;
    isFlipping: boolean;
  }>({
    current: value,
    previous: value,
    flipKey: 0,
    isFlipping: false,
  });

  // Trigger 3D split-flap animation whenever value changes
  useEffect(() => {
    if (value !== displayState.current) {
      setDisplayState((prev) => ({
        current: value,
        previous: prev.current,
        flipKey: prev.flipKey + 1,
        isFlipping: true,
      }));
    }
  }, [value, displayState.current]);

  // Also trigger 3D split-flap animation when user clicks "Test Flip"
  useEffect(() => {
    if (forceFlipSignal > 0) {
      setDisplayState((prev) => ({
        current: value,
        previous: prev.current,
        flipKey: prev.flipKey + 1,
        isFlipping: true,
      }));
    }
  }, [forceFlipSignal, value]);

  // Settle animation after 540ms so static lower flap shows current value
  useEffect(() => {
    if (!displayState.isFlipping) return;
    const timer = window.setTimeout(() => {
      setDisplayState((prev) => ({
        ...prev,
        previous: prev.current,
        isFlipping: false,
      }));
    }, 540);
    return () => window.clearTimeout(timer);
  }, [displayState.flipKey, displayState.isFlipping]);

  const sizeDimensions =
    size === 'xl'
      ? 'w-28 h-36 sm:w-36 sm:h-44 text-5xl sm:text-7xl'
      : size === 'lg'
        ? 'w-20 h-24 sm:w-28 sm:h-32 text-4xl sm:text-6xl'
        : size === 'sm'
          ? 'w-14 h-16 sm:w-16 sm:h-20 text-xl sm:text-2xl'
          : 'w-16 h-20 sm:w-22 sm:h-26 text-2xl sm:text-4xl';

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        data-testid={testId}
        className={`css-flip-clock-unit ${sizeDimensions} font-mono font-extrabold tracking-tight`}
      >
        {/* 1. Static Upper Flap (Always renders top 50% of NEW value) */}
        <div className="css-flip-half css-flip-half-top">
          <div className="w-full h-[200%] flex items-center justify-center tabular-nums">
            {displayState.current}
          </div>
        </div>

        {/* 2. Static Lower Flap (Renders bottom 50% of PREVIOUS value while flipping, or CURRENT when settled) */}
        <div className="css-flip-half css-flip-half-bottom">
          <div className="w-full h-[200%] -translate-y-1/2 flex items-center justify-center tabular-nums">
            {displayState.isFlipping
              ? displayState.previous
              : displayState.current}
          </div>
        </div>

        {/* 3. Animated Upper Leaf (Folds down 0deg -> -90deg showing top 50% of PREVIOUS value) */}
        {displayState.isFlipping && (
          <div
            key={`top-${displayState.flipKey}`}
            className="css-flip-half css-flip-half-top css-flip-leaf-top-animating"
          >
            <div className="w-full h-[200%] flex items-center justify-center tabular-nums">
              {displayState.previous}
            </div>
          </div>
        )}

        {/* 4. Animated Lower Leaf (Unfolds 90deg -> 0deg showing bottom 50% of NEW value) */}
        {displayState.isFlipping && (
          <div
            key={`bottom-${displayState.flipKey}`}
            className="css-flip-half css-flip-half-bottom css-flip-leaf-bottom-animating"
          >
            <div className="w-full h-[200%] -translate-y-1/2 flex items-center justify-center tabular-nums">
              {displayState.current}
            </div>
          </div>
        )}

        {/* 5. Mechanical Split Hinge Line & Side Rivets */}
        <div
          aria-hidden="true"
          className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-slate-950 z-30 flex items-center justify-between px-1"
        >
          <span
            className="w-1.5 h-3 rounded-xs"
            style={{ backgroundColor: 'var(--flap-accent, #10b981)' }}
          />
          <span
            className="w-1.5 h-3 rounded-xs"
            style={{ backgroundColor: 'var(--flap-accent, #10b981)' }}
          />
        </div>
      </div>

      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
        {label}
      </span>
    </div>
  );
};

interface RealTimeFlipClockProps {
  todos?: TodoItem[];
  defaultCompact?: boolean;
  onOpenFocusTimer?: () => void;
  onCompleteTask?: (todoId: string) => void;
}

export const RealTimeFlipClock: React.FC<RealTimeFlipClockProps> = ({
  todos = [],
  defaultCompact = false,
  onOpenFocusTimer,
  onCompleteTask,
}) => {
  const [now, setNow] = useState<Date>(() => new Date());
  const [use24Hour, setUse24Hour] = useState<boolean>(false);
  const [showSeconds, setShowSeconds] = useState<boolean>(true);
  const [themeId, setThemeId] = useState<FlipClockThemeId>('obsidian');
  const [selectedTzId, setSelectedTzId] = useState<string>('local');
  const [forceFlipSignal, setForceFlipSignal] = useState<number>(0);
  const [isDeskFullscreen, setIsDeskFullscreen] = useState<boolean>(false);

  // Optional built-in Flip Pomodoro / Stopwatch sub-mode
  const [clockMode, setClockMode] = useState<'realtime' | 'pomodoro'>(
    'realtime'
  );
  const [pomoSecondsLeft, setPomoSecondsLeft] = useState<number>(25 * 60);
  const [isPomoRunning, setIsPomoRunning] = useState<boolean>(false);

  // Real-time 1-second tick synchronized to system clock
  useEffect(() => {
    const updateClock = () => setNow(new Date());
    updateClock();
    const interval = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(interval);
  }, []);

  // Optional Pomodoro countdown tick when in 'pomodoro' flip mode
  useEffect(() => {
    if (clockMode !== 'pomodoro' || !isPomoRunning) return;
    const interval = window.setInterval(() => {
      setPomoSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsPomoRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [clockMode, isPomoRunning]);

  const activeTz = useMemo(
    () =>
      TIMEZONE_OPTIONS.find((tz) => tz.id === selectedTzId) ??
      TIMEZONE_OPTIONS[0],
    [selectedTzId]
  );

  // Extract formatted Hours, Minutes, Seconds, Meridiem, Weekday, Date for selected timezone
  const timeParts = useMemo(() => {
    try {
      const options: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: !use24Hour,
        weekday: 'short',
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        ...(activeTz.timeZone ? { timeZone: activeTz.timeZone } : {}),
      };
      const formatter = new Intl.DateTimeFormat('en-US', options);
      const parts = formatter.formatToParts(now);
      const getPart = (type: Intl.DateTimeFormatPartTypes) =>
        parts.find((p) => p.type === type)?.value ?? '';

      const rawHour = getPart('hour').padStart(2, '0');
      const minute = getPart('minute').padStart(2, '0');
      const second = getPart('second').padStart(2, '0');
      const dayPeriod = (
        getPart('dayPeriod') || (now.getHours() >= 12 ? 'PM' : 'AM')
      ).toUpperCase();
      const weekday = getPart('weekday').toUpperCase();
      const month = getPart('month').toUpperCase();
      const day = getPart('day').padStart(2, '0');
      const year = getPart('year');

      return {
        hours: rawHour,
        minutes: minute,
        seconds: second,
        meridiem: dayPeriod,
        weekday,
        dateLabel: `${month} ${day}, ${year}`,
      };
    } catch {
      const h24 = now.getHours();
      const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
      return {
        hours: String(use24Hour ? h24 : h12).padStart(2, '0'),
        minutes: String(now.getMinutes()).padStart(2, '0'),
        seconds: String(now.getSeconds()).padStart(2, '0'),
        meridiem: h24 >= 12 ? 'PM' : 'AM',
        weekday: now
          .toLocaleDateString('en-US', { weekday: 'short' })
          .toUpperCase(),
        dateLabel: now
          .toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
          })
          .toUpperCase(),
      };
    }
  }, [now, use24Hour, activeTz]);

  // Pomodoro flip values
  const pomoParts = useMemo(() => {
    const hrs = Math.floor(pomoSecondsLeft / 3600);
    const mins = Math.floor((pomoSecondsLeft % 3600) / 60);
    const secs = pomoSecondsLeft % 60;
    return {
      hours: String(hrs).padStart(2, '0'),
      minutes: String(mins).padStart(2, '0'),
      seconds: String(secs).padStart(2, '0'),
    };
  }, [pomoSecondsLeft]);

  const activeTheme = FLIP_CLOCK_THEMES[themeId];
  const topPriorityTodo = useMemo(
    () =>
      todos.find((t) => !t.completed && t.priority === 'high') ??
      todos.find((t) => !t.completed),
    [todos]
  );

  const cssVariablesStyle = {
    '--flap-top-bg': activeTheme.flapTopBg,
    '--flap-bottom-bg': activeTheme.flapBottomBg,
    '--flap-border': activeTheme.flapBorder,
    '--flap-text': activeTheme.flapText,
    '--flap-accent': activeTheme.flapAccent,
  } as React.CSSProperties;

  const cardSize: 'sm' | 'md' | 'lg' | 'xl' = isDeskFullscreen
    ? 'xl'
    : defaultCompact
      ? 'md'
      : 'lg';

  const displayedHours =
    clockMode === 'realtime' ? timeParts.hours : pomoParts.hours;
  const displayedMinutes =
    clockMode === 'realtime' ? timeParts.minutes : pomoParts.minutes;
  const displayedSeconds =
    clockMode === 'realtime' ? timeParts.seconds : pomoParts.seconds;

  const clockContent = (
    <div
      data-testid="real-time-flip-clock"
      style={cssVariablesStyle}
      className={`${activeTheme.housingBg} ${activeTheme.housingBorder} border-2 rounded-2xl p-4 sm:p-5 text-white transition-colors duration-300 ${
        isDeskFullscreen
          ? 'fixed inset-0 z-50 rounded-none flex flex-col justify-between p-6 sm:p-10 overflow-y-auto'
          : 'shadow-xs'
      }`}
    >
      {/* Top Bar: Mechanical Flip Clock Header + Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-xl ${activeTheme.badgeBg} ${activeTheme.badgeText} flex items-center justify-center shrink-0`}
          >
            <Clock className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-extrabold tracking-tight font-display text-white">
                Real-Time Split-Flap Clock
              </h2>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {clockMode === 'realtime'
                  ? `LIVE · ${activeTz.shortCode}`
                  : 'FLIP TIMER'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-mono">
              {timeParts.weekday} · {timeParts.dateLabel}
            </p>
          </div>
        </div>

        {/* Right Controls: Mode, 12H/24H, Seconds, Test Flip, Desk Stand */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Real-Time Clock vs Flip Timer Toggle */}
          <div
            role="group"
            aria-label="Flip clock mode"
            className="flex items-center bg-slate-950/70 border border-white/15 p-0.5 rounded-lg text-[11px] font-semibold"
          >
            <button
              type="button"
              data-testid="flip-clock-mode-realtime"
              onClick={() => setClockMode('realtime')}
              className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                clockMode === 'realtime'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Live Clock
            </button>
            <button
              type="button"
              data-testid="flip-clock-mode-pomodoro"
              onClick={() => setClockMode('pomodoro')}
              className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                clockMode === 'pomodoro'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              25m Flip Timer
            </button>
          </div>

          {clockMode === 'realtime' && (
            <button
              type="button"
              data-testid="flip-clock-toggle-24h"
              onClick={() => setUse24Hour((prev) => !prev)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-slate-950/70 hover:bg-slate-800 text-slate-200 border border-white/15 transition-colors cursor-pointer"
              title="Toggle 12-hour or 24-hour format"
            >
              {use24Hour ? '24H' : '12H'}
            </button>
          )}

          <button
            type="button"
            data-testid="flip-clock-toggle-seconds"
            onClick={() => setShowSeconds((prev) => !prev)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border transition-colors cursor-pointer ${
              showSeconds
                ? 'bg-purple-700 text-white border-purple-500'
                : 'bg-slate-950/70 text-slate-300 border-white/15 hover:text-white'
            }`}
            title="Show or hide seconds split-flap drum"
          >
            SEC {showSeconds ? 'ON' : 'OFF'}
          </button>

          <button
            type="button"
            data-testid="flip-clock-trigger-demo"
            onClick={() => setForceFlipSignal((prev) => prev + 1)}
            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 transition-colors cursor-pointer"
            title="Trigger mechanical 3D split-flap animation across all cards"
          >
            <Sparkles className="w-3 h-3" aria-hidden="true" />
            <span>Test Flip</span>
          </button>

          <button
            type="button"
            data-testid="flip-clock-fullscreen-toggle"
            onClick={() => setIsDeskFullscreen((prev) => !prev)}
            aria-label={
              isDeskFullscreen
                ? 'Exit Fullscreen Desk Clock'
                : 'Expand Fullscreen Desk Clock'
            }
            title={
              isDeskFullscreen
                ? 'Exit Fullscreen Desk Clock'
                : 'Expand Fullscreen Desk Clock'
            }
            className="p-1.5 rounded-lg bg-slate-950/70 hover:bg-slate-800 text-slate-200 border border-white/15 transition-colors cursor-pointer"
          >
            {isDeskFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Center Stage: 3D Split-Flap Mechanical Drums */}
      <div className="py-4 sm:py-6 flex flex-col items-center justify-center gap-4">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3.5">
          {/* Hours Split-Flap Drum */}
          <SplitFlapCard
            value={displayedHours}
            label={clockMode === 'realtime' ? 'Hours' : 'Hours'}
            size={cardSize}
            forceFlipSignal={forceFlipSignal}
            testId="flip-card-hours"
          />

          {/* Pulsing Mechanical Colon Separator */}
          <div
            aria-hidden="true"
            className="flex flex-col items-center justify-center gap-2.5 pb-5 px-0.5"
          >
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full css-flip-colon-dot" />
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full css-flip-colon-dot" />
          </div>

          {/* Minutes Split-Flap Drum */}
          <SplitFlapCard
            value={displayedMinutes}
            label="Minutes"
            size={cardSize}
            forceFlipSignal={forceFlipSignal}
            testId="flip-card-minutes"
          />

          {/* Optional Seconds Split-Flap Drum */}
          {showSeconds && (
            <>
              <div
                aria-hidden="true"
                className="flex flex-col items-center justify-center gap-2.5 pb-5 px-0.5"
              >
                <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full css-flip-colon-dot" />
                <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full css-flip-colon-dot" />
              </div>

              <SplitFlapCard
                value={displayedSeconds}
                label="Seconds"
                size={cardSize}
                forceFlipSignal={forceFlipSignal}
                testId="flip-card-seconds"
              />
            </>
          )}

          {/* AM / PM Split-Flap Drum (when in 12H real-time mode) */}
          {clockMode === 'realtime' && !use24Hour && (
            <div className="ml-1 sm:ml-2">
              <SplitFlapCard
                value={timeParts.meridiem}
                label="Period"
                size="sm"
                forceFlipSignal={forceFlipSignal}
                testId="flip-card-meridiem"
              />
            </div>
          )}

          {/* Weekday Split-Flap Drum */}
          <div className="hidden md:block ml-1 sm:ml-2">
            <SplitFlapCard
              value={timeParts.weekday}
              label="Day"
              size="sm"
              forceFlipSignal={forceFlipSignal}
              testId="flip-card-weekday"
            />
          </div>
        </div>

        {/* Pomodoro Flip Timer Controls when in 'pomodoro' mode */}
        {clockMode === 'pomodoro' && (
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              type="button"
              data-testid="flip-pomo-start-pause"
              onClick={() => setIsPomoRunning((prev) => !prev)}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {isPomoRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Pause Flip Timer</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Start Flip Timer</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsPomoRunning(false);
                setPomoSecondsLeft(25 * 60);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>25m Reset</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsPomoRunning(false);
                setPomoSecondsLeft(50 * 60);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
            >
              50m Deep Block
            </button>
          </div>
        )}
      </div>

      {/* Bottom Bar: Solid 60-30-10 Chassis Theme Switcher, World Timezone Selector & Active Focus Task */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10 text-xs">
        {/* Solid Color Chassis Selector */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mr-1">
            Flap Theme:
          </span>
          {(Object.keys(FLIP_CLOCK_THEMES) as FlipClockThemeId[]).map((id) => {
            const theme = FLIP_CLOCK_THEMES[id];
            const active = themeId === id;
            return (
              <button
                key={id}
                type="button"
                data-testid={`flip-theme-${id}`}
                onClick={() => setThemeId(id)}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer border ${
                  active
                    ? 'bg-white text-slate-950 border-white font-bold'
                    : 'bg-slate-950/60 text-slate-300 border-white/15 hover:text-white'
                }`}
              >
                {theme.label}
              </button>
            );
          })}
        </div>

        {/* World Timezone Selector + Quick Focus Task Action */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-950/70 border border-white/15 rounded-lg px-2.5 py-1">
            <Globe
              className="w-3.5 h-3.5 text-blue-400 shrink-0"
              aria-hidden="true"
            />
            <label htmlFor="flip-clock-tz-select" className="sr-only">
              Select Timezone
            </label>
            <select
              id="flip-clock-tz-select"
              data-testid="flip-clock-timezone-select"
              value={selectedTzId}
              onChange={(e) => setSelectedTzId(e.target.value)}
              className="bg-transparent text-[11px] font-mono font-semibold text-slate-100 focus:outline-none cursor-pointer"
            >
              {TIMEZONE_OPTIONS.map((tz) => (
                <option
                  key={tz.id}
                  value={tz.id}
                  className="bg-slate-900 text-white"
                >
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          {topPriorityTodo && (
            <div className="flex items-center gap-1.5 bg-slate-950/70 border border-emerald-500/30 rounded-lg px-2.5 py-1 max-w-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-[11px] text-slate-200 truncate">
                Next: <strong>{topPriorityTodo.title}</strong>
              </span>
              {onCompleteTask && (
                <button
                  type="button"
                  onClick={() => onCompleteTask(topPriorityTodo.id)}
                  title="Complete task and spike onto MemoSpike"
                  className="text-emerald-400 hover:text-emerald-300 ml-1 shrink-0 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          )}

          {onOpenFocusTimer && (
            <button
              type="button"
              onClick={onOpenFocusTimer}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Timer className="w-3 h-3" aria-hidden="true" />
              <span>DoteTimer</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return clockContent;
};
