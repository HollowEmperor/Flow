import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Play,
  RotateCcw,
  FastForward,
  CheckCircle2,
  Sparkles,
  X,
} from 'lucide-react';
import {
  CalendarTearOffSequence,
  computeCalendarTearOffSequence,
  offsetIsoDate,
  getTodayIsoDate,
} from '../utils/todoLogic';

interface CalendarTearOffModalProps {
  isOpen: boolean;
  initialLastOpenedDateIso: string | null;
  todayIso?: string;
  activeTaskCount: number;
  onClose: () => void;
  onSimulateDaysMissed?: (daysMissed: number) => void;
}

export const CalendarTearOffModal: React.FC<CalendarTearOffModalProps> = ({
  isOpen,
  initialLastOpenedDateIso,
  todayIso = getTodayIsoDate(),
  activeTaskCount,
  onClose,
  onSimulateDaysMissed,
}) => {
  const [simulatedStartIso, setSimulatedStartIso] = useState<string | null>(
    initialLastOpenedDateIso
  );
  const [currentSheetIdx, setCurrentSheetIdx] = useState<number>(0);
  const [tearingSheetIdx, setTearingSheetIdx] = useState<number | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);
  const [runKey, setRunKey] = useState<number>(0);

  useEffect(() => {
    setSimulatedStartIso(initialLastOpenedDateIso);
  }, [initialLastOpenedDateIso]);

  const sequence: CalendarTearOffSequence = useMemo(
    () => computeCalendarTearOffSequence(simulatedStartIso, todayIso, 10),
    [simulatedStartIso, todayIso]
  );

  const totalSheets = sequence.sheets.length;
  const isAtFinalTodaySheet = currentSheetIdx >= totalSheets - 1;

  // Reset and start automatic CSS tear-off sequence whenever modal opens or preset changes
  useEffect(() => {
    if (!isOpen) return;
    setCurrentSheetIdx(0);
    setTearingSheetIdx(null);
    setIsAutoPlaying(true);
  }, [isOpen, simulatedStartIso, runKey]);

  // Step through each missed day sheet using pure CSS tear-off keyframe timing
  useEffect(() => {
    if (!isOpen || !isAutoPlaying) return;
    if (currentSheetIdx >= totalSheets - 1) {
      setIsAutoPlaying(false);
      setTearingSheetIdx(null);
      return;
    }

    // Hold briefly so user reads the past date, then trigger 680ms CSS tear-off keyframe
    const startTearTimer = window.setTimeout(() => {
      setTearingSheetIdx(currentSheetIdx);
    }, 520);

    const finishTearTimer = window.setTimeout(() => {
      setTearingSheetIdx(null);
      setCurrentSheetIdx((prev) => Math.min(totalSheets - 1, prev + 1));
    }, 1180);

    return () => {
      window.clearTimeout(startTearTimer);
      window.clearTimeout(finishTearTimer);
    };
  }, [isOpen, isAutoPlaying, currentSheetIdx, totalSheets]);

  if (!isOpen) return null;

  const visibleBaseIndex =
    tearingSheetIdx !== null
      ? Math.min(totalSheets - 1, currentSheetIdx + 1)
      : currentSheetIdx;

  const baseSheet =
    sequence.sheets[visibleBaseIndex] ??
    sequence.sheets[sequence.sheets.length - 1];
  const tearingSheet =
    tearingSheetIdx !== null ? sequence.sheets[tearingSheetIdx] : null;

  const handleTriggerPreset = (daysMissed: number) => {
    const newStart = offsetIsoDate(todayIso, -daysMissed);
    setSimulatedStartIso(newStart);
    setRunKey((prev) => prev + 1);
    if (onSimulateDaysMissed) {
      onSimulateDaysMissed(daysMissed);
    }
  };

  const handleManualStepTear = () => {
    if (currentSheetIdx >= totalSheets - 1 || tearingSheetIdx !== null) return;
    setIsAutoPlaying(false);
    setTearingSheetIdx(currentSheetIdx);
    window.setTimeout(() => {
      setTearingSheetIdx(null);
      setCurrentSheetIdx((prev) => Math.min(totalSheets - 1, prev + 1));
    }, 660);
  };

  const handleReplay = () => {
    setRunKey((prev) => prev + 1);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Daily Desk Calendar Tear-Off Startup Animation"
      data-testid="calendar-tearoff-modal"
      className="fixed inset-0 z-[120] bg-slate-950/85 flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl p-5 sm:p-6 text-white shadow-2xl space-y-5 relative">
        {/* Top Header & Once-Per-Day Status Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-amber-300 font-semibold">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              <span>
                Daily Startup Ritual · Plays Once Per Day (Mockup Active)
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white font-display">
              Desk Calendar Tear-Off ({sequence.startDateIso} →{' '}
              {sequence.endDateIso})
            </h2>
            <p className="text-xs text-slate-300">
              {sequence.missedDaysCount === 1
                ? 'Tearing off yesterday’s calendar page to reveal today’s fresh schedule.'
                : `Catching up ${sequence.missedDaysCount} missed days—tearing from ${sequence.startDateIso} up to ${sequence.endDateIso}.`}
            </p>
          </div>

          <button
            type="button"
            data-testid="close-calendar-tear-modal-btn"
            onClick={onClose}
            aria-label="Close calendar tear-off modal"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Center 3D Angled Warm-Cream Desk Calendar Block Stage */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl py-7 px-4 flex flex-col items-center justify-center relative overflow-hidden min-h-[340px]">
          {/* Step Progress Strip */}
          <div className="absolute top-3 left-4 right-4 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span data-testid="calendar-tear-progress-label">
              SHEET {Math.min(totalSheets, currentSheetIdx + 1)} OF{' '}
              {totalSheets} ·{' '}
              {isAtFinalTodaySheet ? 'TODAY REACHED' : 'TEARING PAST DAYS...'}
            </span>
            <span className="text-amber-300 font-semibold">
              {sequence.missedDaysCount}d Catch-Up
            </span>
          </div>

          {/* 3D Warm-Cream Desk Calendar Block (Matching Reference Image) */}
          <div className="my-3 pl-5 pr-2 py-2 flex items-center justify-center">
            <div
              data-testid="calendar-3d-block"
              className={`css-calendar-block-3d ${
                isAtFinalTodaySheet && tearingSheetIdx === null
                  ? 'is-settled'
                  : ''
              } w-64 sm:w-72 h-76 rounded-[4px] select-none relative`}
            >
              {/* Top Binding Edge & Perforated Tear Line */}
              <div className="absolute inset-x-0 top-0 h-5 bg-[#DFD5BE] border-b-2 border-dashed border-stone-500/55 z-30 flex items-center justify-between px-8">
                <span className="w-2.5 h-2.5 rounded-full bg-stone-500/60 shadow-inner" />
                <span className="text-[8px] font-mono uppercase tracking-[0.22em] text-stone-600 font-semibold">
                  TEAR ALONG PERFORATION
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-stone-500/60 shadow-inner" />
              </div>

              {/* Underlying / Current Date Sheet Face */}
              <div
                data-testid="calendar-active-sheet"
                className="absolute inset-0 pt-7 pb-4 px-6 flex flex-col items-center justify-between text-[#141413] bg-[#E8DFCA] rounded-[4px]"
              >
                {/* Month Name (Bold Wide-Tracked Uppercase) */}
                <div
                  data-testid="calendar-sheet-month"
                  className="text-xl sm:text-2xl font-extrabold tracking-[0.18em] uppercase font-display text-[#141413] mt-1"
                >
                  {baseSheet.monthName}
                </div>

                {/* Massive Two-Digit Day Number (01 .. 31) */}
                <div
                  data-testid="calendar-sheet-day"
                  className="text-[92px] sm:text-[104px] font-black tracking-tight leading-none font-display text-[#141413] -my-2"
                >
                  {baseSheet.dayNumberPadded}
                </div>

                {/* Weekday + Occasion/Subtitle */}
                <div className="text-center space-y-1">
                  <div
                    data-testid="calendar-sheet-weekday"
                    className="text-base sm:text-lg font-extrabold tracking-[0.18em] uppercase font-display text-[#141413]"
                  >
                    {baseSheet.weekdayName}
                  </div>
                  <div
                    data-testid="calendar-sheet-subtitle"
                    className="text-xs font-bold text-[#292524] tracking-wide"
                  >
                    {baseSheet.subtitle}
                  </div>
                </div>

                {/* Bottom Micro Brand / Date Stamp */}
                <div className="text-[9px] font-mono text-stone-600 tracking-wider pt-1">
                  focusflow · {baseSheet.dateIso}
                </div>
              </div>

              {/* Pure CSS Tearing Top Sheet (Peels & Flutters Off in 3D when Tearing) */}
              {tearingSheet && (
                <div
                  key={`tearing-${tearingSheet.dateIso}-${runKey}`}
                  data-testid="calendar-tearing-sheet"
                  className="css-calendar-sheet-tearing absolute inset-0 pt-7 pb-4 px-6 flex flex-col items-center justify-between text-[#141413] bg-[#EFE7D4] border border-stone-400/70 rounded-[4px] z-40"
                >
                  <div className="text-xl sm:text-2xl font-extrabold tracking-[0.18em] uppercase font-display text-[#141413] mt-1">
                    {tearingSheet.monthName}
                  </div>
                  <div className="text-[92px] sm:text-[104px] font-black tracking-tight leading-none font-display text-[#141413] -my-2">
                    {tearingSheet.dayNumberPadded}
                  </div>
                  <div className="text-center space-y-1">
                    <div className="text-base sm:text-lg font-extrabold tracking-[0.18em] uppercase font-display text-[#141413]">
                      {tearingSheet.weekdayName}
                    </div>
                    <div className="text-xs font-bold text-[#292524] tracking-wide">
                      {tearingSheet.subtitle}
                    </div>
                  </div>
                  <div className="text-[9px] font-mono text-stone-600 tracking-wider pt-1">
                    focusflow · {tearingSheet.dateIso}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Date Sequence Breadcrumb Trail */}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
            {sequence.sheets.map((sheet, idx) => {
              const isPastTorn = idx < currentSheetIdx;
              const isCurrent = idx === currentSheetIdx;
              return (
                <span
                  key={sheet.dateIso}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono tabular-nums border transition-colors ${
                    isCurrent
                      ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold'
                      : isPastTorn
                        ? 'bg-slate-900/90 text-slate-500 border-slate-800 line-through'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700'
                  }`}
                >
                  {sheet.dateIso.slice(5)}
                  {sheet.isToday ? ' (Today)' : ''}
                </span>
              );
            })}
          </div>
        </div>

        {/* Interactive Mockup Controls: Test 1-Day, 3-Day, or 5-Day Catch-Up Tear-Offs */}
        <div className="bg-slate-800/75 border border-slate-700/80 rounded-xl p-3.5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Calendar
                className="w-3.5 h-3.5 text-amber-400"
                aria-hidden="true"
              />
              <span>Mockup Simulator — Test Missed Days Tear-Off:</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                data-testid="simulate-tear-1day-btn"
                onClick={() => handleTriggerPreset(1)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  sequence.missedDaysCount === 1
                    ? 'bg-amber-400 text-slate-950 border-amber-300'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                1 Day Ago
              </button>
              <button
                type="button"
                data-testid="simulate-tear-3days-btn"
                onClick={() => handleTriggerPreset(3)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  sequence.missedDaysCount === 3
                    ? 'bg-amber-400 text-slate-950 border-amber-300'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                3 Days Ago (Default)
              </button>
              <button
                type="button"
                data-testid="simulate-tear-5days-btn"
                onClick={() => handleTriggerPreset(5)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  sequence.missedDaysCount === 5
                    ? 'bg-amber-400 text-slate-950 border-amber-300'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                5 Days Ago
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-700/70">
            <div className="flex items-center gap-2">
              <button
                type="button"
                data-testid="replay-calendar-tear-btn"
                onClick={handleReplay}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-950 text-amber-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Replay Tear-Off</span>
              </button>

              {!isAtFinalTodaySheet && (
                <button
                  type="button"
                  data-testid="step-calendar-tear-btn"
                  onClick={handleManualStepTear}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-950 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FastForward className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Tear Next Sheet</span>
                </button>
              )}
            </div>

            <button
              type="button"
              data-testid="continue-to-workspace-btn"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {isAtFinalTodaySheet ? (
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <Play className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              <span>
                Start Today ({activeTaskCount} Active{' '}
                {activeTaskCount === 1 ? 'Task' : 'Tasks'})
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
