import React, { useState, useMemo, useEffect } from 'react';
import {
  Zap,
  Pin,
  RotateCcw,
  CheckCircle2,
  Flame,
  Calendar,
} from 'lucide-react';
import {
  Category,
  TodoItem,
  MemoSpikeSlip,
  computeMemoSpikeStats,
} from '../utils/todoLogic';

interface MemoSpikeWidgetProps {
  todos: TodoItem[];
  activeCategory: Category | 'All';
  onSpikeTask: (todoId: string) => void;
}

export const MemoSpikeWidget: React.FC<MemoSpikeWidgetProps> = ({
  todos,
  activeCategory,
  onSpikeTask,
}) => {
  const spikeStats = useMemo(() => computeMemoSpikeStats(todos), [todos]);

  const activeCandidates = useMemo(() => {
    const uncompleted = todos.filter((t) => !t.completed);
    if (activeCategory === 'All') return uncompleted;
    const inCat = uncompleted.filter((t) => t.category === activeCategory);
    return inCat.length > 0 ? inCat : uncompleted;
  }, [todos, activeCategory]);

  const [targetActiveId, setTargetActiveId] = useState<string>(() =>
    activeCandidates[0]?.id ?? ''
  );
  const [selectedSlipId, setSelectedSlipId] = useState<string | null>(() =>
    spikeStats.slips.length > 0
      ? spikeStats.slips[spikeStats.slips.length - 1].todoId
      : null
  );
  const [spikePulseKey, setSpikePulseKey] = useState<number>(0);
  const [isCompressingStack, setIsCompressingStack] = useState(false);

  // Keep targetActiveId synced with available active tasks
  useEffect(() => {
    if (activeCandidates.length === 0) {
      setTargetActiveId('');
      return;
    }
    if (!activeCandidates.some((t) => t.id === targetActiveId)) {
      setTargetActiveId(activeCandidates[0].id);
    }
  }, [activeCandidates, targetActiveId]);

  // Select newly spiked slip when spike count increases
  useEffect(() => {
    if (spikeStats.slips.length === 0) {
      setSelectedSlipId(null);
      return;
    }
    const newest = spikeStats.slips[spikeStats.slips.length - 1];
    if (
      !selectedSlipId ||
      !spikeStats.slips.some((s) => s.todoId === selectedSlipId)
    ) {
      setSelectedSlipId(newest.todoId);
    }
  }, [spikeStats.slips, selectedSlipId]);

  const selectedSlip: MemoSpikeSlip | null = useMemo(() => {
    if (!selectedSlipId) return null;
    return (
      spikeStats.slips.find((s) => s.todoId === selectedSlipId) ??
      spikeStats.slips[spikeStats.slips.length - 1] ??
      null
    );
  }, [spikeStats.slips, selectedSlipId]);

  const handleTriggerSpike = () => {
    const idToSpike = targetActiveId || activeCandidates[0]?.id;
    if (!idToSpike) return;
    setSpikePulseKey((prev) => prev + 1);
    setIsCompressingStack(true);
    window.setTimeout(() => {
      setIsCompressingStack(false);
    }, 360);
    onSpikeTask(idToSpike);
    setSelectedSlipId(idToSpike);
  };

  // In each 44px-tall side-view CSS 3D paper button, the center puncture hole is locked at +22px above bottomOffsetPx.
  const topSlip =
    spikeStats.slips.length > 0
      ? spikeStats.slips[spikeStats.slips.length - 1]
      : null;
  const topPunctureBottomPx = topSlip ? topSlip.bottomOffsetPx + 22 : 34;

  // Build 12 deterministic CSS pulse bar heights from waveform coordinates
  const pulseBars = useMemo(() => {
    const pairs = spikeStats.waveformPoints.split(' ').filter(Boolean);
    return pairs.map((pair, idx) => {
      const parts = pair.split(',');
      const y = Number(parts[1] ?? 24);
      const heightPct = Math.max(20, Math.min(100, Math.round(((44 - y) / 36) * 100)));
      return { id: idx, heightPct };
    });
  }, [spikeStats.waveformPoints]);

  return (
    <section
      aria-label="MemoSpike Task Spindle"
      data-testid="memospike-panel"
      className="bg-white border border-slate-200 rounded-xl p-4 space-y-3.5"
    >
      {/* Header & Live Momentum Spike Metrics */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <Pin
              className="w-4 h-4 text-purple-600 shrink-0"
              aria-hidden="true"
            />
            <h2 className="text-base font-bold tracking-tight text-slate-900 font-display">
              MemoSpike Task Spindle — Completed Board
            </h2>
            <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold uppercase">
              Completed Archive
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Your Completed Board in 3D side-elevation—tasks from{' '}
            <strong>To Do</strong>, <strong>Later</strong>, and{' '}
            <strong>Delegate</strong> pierce the needle tip when finished and
            stack on the spindle.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-2.5 py-1 text-xs font-mono tabular-nums">
          <span
            data-testid="memospike-count"
            className="font-bold text-slate-900"
          >
            {spikeStats.spikedCount} Spiked
          </span>
          <span aria-hidden="true" className="text-slate-400">
            ·
          </span>
          <span
            data-testid="memospike-velocity"
            className="font-semibold text-emerald-700"
          >
            {spikeStats.spikeVelocityScore}% Surge
          </span>
        </div>
      </div>

      {/* Live MemoSpike Pure CSS Momentum Waveform Strip */}
      <div className="bg-slate-900 rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-3 border border-slate-800">
        <div className="space-y-0.5 shrink-0">
          <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1">
            <Zap className="w-3 h-3" aria-hidden="true" />
            <span>Side-Profile Stack Height</span>
          </div>
          <div className="text-xs font-mono tabular-nums text-white font-bold">
            {spikeStats.spikedCount} sheets · {spikeStats.stackHeightMm}mm pile
          </div>
        </div>

        {/* Pure CSS Keyframe Waveform Bar Strip */}
        <div
          key={spikePulseKey}
          data-testid="memospike-waveform"
          role="img"
          aria-label="MemoSpike momentum pulse waveform"
          className="css-waveform-strip w-40 sm:w-48 h-9 flex items-end justify-between gap-1.5 px-1 py-1 relative border-b border-dashed border-slate-700 shrink-0"
        >
          {pulseBars.map((bar, idx) => {
            const isRecent = idx >= pulseBars.length - 3;
            return (
              <span
                key={bar.id}
                style={{ height: `${bar.heightPct}%` }}
                className={`flex-1 rounded-t-xs transition-all duration-300 ${
                  isRecent
                    ? 'bg-emerald-400'
                    : idx % 2 === 0
                      ? 'bg-blue-500'
                      : 'bg-purple-500'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Side-View Desk Spindle Stage + 3D Tear-Off Memo Block Inspector */}
      <div className="grid grid-cols-1 @sm:grid-cols-12 gap-3 items-stretch">
        {/* Left: True Side-Elevation Desk Spindle & Layered Horizontal CSS 3D Paper Stack */}
        <div
          data-testid="memospike-spindle-stage"
          className="@sm:col-span-7 bg-slate-900 rounded-xl p-3.5 flex flex-col items-center justify-end relative overflow-hidden min-h-[276px] border border-slate-800"
        >
          {/* Top Technical Side-Elevation Header */}
          <div className="absolute top-2.5 left-3 right-3 flex items-center justify-between text-[10px] font-mono tabular-nums text-slate-400 z-20">
            <span>SIDE VIEW · 15° CSS 3D</span>
            <span>
              {spikeStats.spikedCount} SHEETS ({spikeStats.stackHeightMm}MM)
            </span>
          </div>

          {/* Left-Side Vertical Millimeter Elevation Gauge */}
          <div
            aria-hidden="true"
            className="absolute left-2.5 bottom-9 top-9 w-7 flex flex-col justify-between text-[8px] font-mono tabular-nums text-slate-500 pointer-events-none z-10"
          >
            <div className="flex items-center gap-1">
              <span className="w-2 h-[1px] bg-slate-600" />
              <span>TIP</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-[1px] bg-slate-700" />
              <span>75m</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-[1px] bg-slate-700" />
              <span>50m</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-[1px] bg-slate-700" />
              <span>25m</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-[1px] bg-emerald-400" />
              <span>BASE</span>
            </div>
          </div>

          {/* Desk Surface Horizon at the Bottom of the Side View */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-8 bg-slate-950 border-t border-slate-800 pointer-events-none z-0"
          />

          {/* Pure CSS Elliptical Puncture Shockwave Ring when a new paper is impaled */}
          {spikePulseKey > 0 && (
            <div
              key={`ring-${spikePulseKey}`}
              style={{ bottom: `${topPunctureBottomPx + 6}px` }}
              className="css-spike-shockwave w-16 h-4 rounded-full border-2 border-emerald-400 absolute left-1/2 pointer-events-none z-50"
            />
          )}

          {/* Main Side-Elevation Spindle & Pure CSS 3D Paper Stack Assembly */}
          <div className="relative w-full max-w-[232px] h-58 flex flex-col items-center justify-end select-none">
            {/* 1. Lower Brushed Steel Spindle Rod (from Collar up into bottom sheet) */}
            <div
              aria-hidden="true"
              style={{
                height: `${Math.max(16, topPunctureBottomPx - 26)}px`,
              }}
              className="absolute bottom-7 left-1/2 -translate-x-1/2 w-[6px] bg-slate-300 border-x border-slate-500 z-10 pointer-events-none"
            />

            {/* 2. Horizontally Stacked Side-Profile Paper Memo Sheets (Pure CSS 3D Perspective Planes) */}
            <div
              className={`css-memospike-stack ${
                isCompressingStack ? 'is-compressing' : ''
              } absolute inset-x-0 bottom-0 top-0 pointer-events-none`}
            >
              {spikeStats.slips.map((slip, idx) => {
                const isSelected = selectedSlip?.todoId === slip.todoId;
                const isTopSheet = idx === spikeStats.slips.length - 1;
                const shortTitle =
                  slip.title.length > 14
                    ? `${slip.title.slice(0, 13)}…`
                    : slip.title;

                return (
                  <button
                    key={slip.id}
                    type="button"
                    data-testid={`spiked-slip-${slip.todoId}`}
                    onClick={() => setSelectedSlipId(slip.todoId)}
                    style={
                      {
                        bottom: `${slip.bottomOffsetPx}px`,
                        zIndex: 20 + slip.stackIndex,
                        '--slip-skew-deg': `${slip.perspectiveSkewPx * 0.85}deg`,
                        '--slip-tilt-deg': `${slip.sideTiltPx * 0.9}deg`,
                        '--slip-bg': slip.paperBgHex,
                        '--slip-border': slip.paperBorderHex,
                        '--slip-rule': slip.ruleLineHex,
                        '--slip-scale-x': isSelected ? 1.03 : 1,
                      } as React.CSSProperties
                    }
                    aria-label={`Inspect spiked task memo: ${slip.title}`}
                    title={`Paper Memo #${slip.stackIndex + 1} (${slip.category}): ${slip.title}`}
                    className={`css-side-paper-btn ${
                      isSelected ? 'is-selected' : ''
                    } pointer-events-auto absolute left-1/2 w-[212px] h-[44px] cursor-pointer group focus:outline-none`}
                  >
                    {/* Pure CSS 3D Foreshortened Horizontal Paper Sheet Plane */}
                    <span
                      aria-hidden="true"
                      className="css-side-paper-surface absolute inset-x-2 top-2.5 h-[24px] rounded-[3px] flex items-center justify-between px-2.5 overflow-hidden"
                    >
                      {/* Left Margin Line */}
                      <span className=" -ml-0.5 mr-1 w-[1.5px] h-full bg-purple-500/60 shrink-0" />

                      {/* Left Wing Category Stamp */}
                      <span
                        style={{ color: slip.stampColorHex }}
                        className="text-[8px] font-bold font-mono tracking-tight truncate max-w-[74px] text-left"
                      >
                        #{String(slip.stackIndex + 1).padStart(2, '0')}{' '}
                        {slip.category.toUpperCase()}
                      </span>

                      {/* Center Spacer for Spindle Puncture */}
                      <span className="w-5 shrink-0" />

                      {/* Right Wing Task Title */}
                      <span className="text-[8.5px] font-bold text-slate-900 font-display truncate max-w-[78px] text-right">
                        {shortTitle}
                      </span>

                      {/* Folded Right Dog-Ear Corner (Pure CSS Border Triangle) */}
                      <span
                        style={{
                          borderTopColor: '#0f172a',
                          borderLeftColor: slip.ruleLineHex,
                        }}
                        className="absolute top-0 right-0 w-0 h-0 border-t-[6px] border-l-[6px]"
                      />
                    </span>

                    {/* Center Spindle Puncture Hole + Upturned Torn Paper Burr + Inter-Sheet Steel Rod Segment */}
                    <span
                      aria-hidden="true"
                      className="absolute left-1/2 top-[22px] -translate-x-1/2 -translate-y-1/2 w-4 h-2 flex items-center justify-center pointer-events-none"
                    >
                      {/* Foreshortened Dark Oval Puncture Hole */}
                      <span className="w-3.5 h-1.5 rounded-full bg-slate-900 border border-slate-500 shadow-inner" />

                      {/* Upturned Jagged Paper Collar Pushed Upward by the Spike (clip-path polygon) */}
                      <span
                        style={{
                          backgroundColor: slip.paperBgHex,
                          borderColor: slip.paperBorderHex,
                        }}
                        className="css-paper-puncture-collar absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-1.5 border-t"
                      />

                      {/* Inter-Sheet Cylindrical Steel Spindle Segment Emerging Out of This Sheet's Center Hole */}
                      {!isTopSheet && (
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-[6px] h-[20px] bg-slate-200 border-x border-slate-500" />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 3. Upper Exposed Brushed Steel Needle Shaft + Sharp Conical Point Emerging from Top Sheet's Puncture Hole */}
            <div
              aria-hidden="true"
              style={{
                bottom: `${topPunctureBottomPx}px`,
              }}
              className="absolute left-1/2 -translate-x-1/2 top-3 flex flex-col items-center justify-start pointer-events-none z-50"
            >
              {/* Razor-Sharp Tapered Steel Needle Tip (Pure CSS clip-path cone) */}
              <div className="css-needle-cone-tip w-2.5 h-5 shrink-0 bg-slate-200" />
              {/* Cylindrical Brushed Steel Upper Shaft */}
              <div className="w-[6px] flex-1 bg-slate-300 border-x border-slate-500" />
              {/* Subtle Raised Paper Collar Ring at the Top Puncture Exit */}
              {spikeStats.spikedCount > 0 && (
                <div className="w-3.5 h-1.5 -mt-0.5 rounded-full bg-purple-100 border border-slate-500 shadow-2xs" />
              )}
            </div>

            {/* 4. Side-Profile Tri-Color Spindle Base (Solid Flat Green, Blue, Purple Cylinders) */}
            <div
              aria-hidden="true"
              className="w-[216px] h-[44px] relative z-15 pointer-events-none shrink-0 flex flex-col items-center justify-end pb-1"
            >
              {/* Central Solid Emerald Chuck / Collar */}
              <div className="w-7 h-2.5 -mb-1 rounded-t-sm bg-emerald-500 border border-emerald-700 z-30 shadow-2xs" />
              {/* Stepped Solid Royal Blue Dome */}
              <div className="w-24 h-3 -mb-1 rounded-t-full bg-blue-600 border border-blue-800 z-20 shadow-xs" />
              {/* Turned Solid Deep Purple Plinth */}
              <div className="w-38 h-4 rounded-full bg-purple-800 border border-purple-600 z-10 shadow-md" />
            </div>
          </div>
        </div>

        {/* Right: 3D Tear-Off Memo Block Inspector + "Spike Task onto Spindle" Control */}
        <div className="@sm:col-span-5 flex flex-col justify-between gap-2.5">
          {selectedSlip ? (
            <div className="flex-1 flex flex-col justify-center pl-2.5 pr-1 py-1">
              <div
                data-testid="memospike-selected-card"
                style={{
                  backgroundColor: '#F5F3FF',
                  borderColor: '#C4B5FD',
                }}
                className="css-3d-memo-block border rounded-lg p-3.5 flex-1 flex flex-col justify-between text-slate-900"
              >
                <div className="text-center space-y-1">
                  {/* Top Tear-Off Calendar/Memo Header */}
                  <div className="flex items-center justify-between text-[10px] font-bold tracking-[0.18em] uppercase text-slate-700 font-display border-b border-stone-300/80 pb-1">
                    <span>{selectedSlip.category}</span>
                    <span className="font-mono tracking-normal text-stone-600">
                      {selectedSlip.stackIndex + 1}/{spikeStats.spikedCount}
                    </span>
                  </div>

                  {/* Bold 2-Digit Sheet Number (Tear-Off Desk Block Style) */}
                  <div className="text-3xl font-extrabold tracking-tight text-slate-950 font-display leading-none py-1">
                    {String(selectedSlip.stackIndex + 1).padStart(2, '0')}
                  </div>

                  {/* Day / Due Date Subheader */}
                  <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-700 flex items-center justify-center gap-1.5 font-mono">
                    <Calendar className="w-3 h-3" aria-hidden="true" />
                    <span>{selectedSlip.dueDate}</span>
                    {selectedSlip.streakCount > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-amber-800">
                        · <Flame className="w-3 h-3" aria-hidden="true" />
                        {selectedSlip.streakCount}d
                      </span>
                    )}
                  </div>

                  {/* Selected Spiked Task Title */}
                  <h3
                    data-testid="memospike-selected-title"
                    className="text-xs font-bold text-slate-900 leading-snug pt-0.5 line-clamp-2"
                  >
                    {selectedSlip.title}
                  </h3>
                </div>

                <button
                  type="button"
                  data-testid="unspike-selected-task-btn"
                  onClick={() => onSpikeTask(selectedSlip.todoId)}
                  className="mt-2 w-full py-1.5 px-2.5 bg-white/85 hover:bg-white text-slate-900 border border-stone-400/80 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" aria-hidden="true" />
                  <span>Pull Memo Off Spindle</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-center flex-1 flex flex-col items-center justify-center space-y-1">
              <CheckCircle2
                className="w-5 h-5 text-slate-400"
                aria-hidden="true"
              />
              <p className="text-xs font-semibold text-slate-800">
                No paper memos spiked yet
              </p>
              <p className="text-[11px] text-slate-500">
                Spike an active task below to impale its paper memo sheet onto
                the spindle.
              </p>
            </div>
          )}

          {/* Action Box: Spike an Active Task onto the Spindle */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-2.5 space-y-2">
            <label
              htmlFor="memospike-task-select"
              className="block text-[11px] font-semibold text-slate-700"
            >
              Select Active Task Memo to Spike:
            </label>
            <select
              id="memospike-task-select"
              data-testid="memospike-task-select"
              value={targetActiveId}
              onChange={(e) => setTargetActiveId(e.target.value)}
              disabled={activeCandidates.length === 0}
              className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium disabled:opacity-50"
            >
              {activeCandidates.length === 0 ? (
                <option value="">All task memos spiked!</option>
              ) : (
                activeCandidates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.category})
                  </option>
                ))
              )}
            </select>

            <button
              type="button"
              data-testid="spike-active-task-btn"
              onClick={handleTriggerSpike}
              disabled={activeCandidates.length === 0}
              className="w-full py-2 px-3 bg-purple-700 hover:bg-purple-800 disabled:opacity-40 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Zap className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Spike Paper Memo onto Spindle</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
