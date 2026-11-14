import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
    onSpikeTask(idToSpike);
    setSelectedSlipId(idToSpike);
  };

  return (
    <section
      aria-label="MemoSpike Task Spindle"
      data-testid="memospike-panel"
      className="bg-white border border-slate-200 rounded-xl p-4 space-y-3.5"
    >
      {/* Header & Live Momentum Spike Waveform */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <Pin
              className="w-4 h-4 text-amber-600 shrink-0"
              aria-hidden="true"
            />
            <h2 className="text-base font-bold tracking-tight text-slate-900 font-display">
              MemoSpike Task Spindle
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Impale completed tasks onto the desk spike and watch your momentum
            waveform surge.
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

      {/* Live MemoSpike Waveform Strip */}
      <div className="bg-slate-900 rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-3">
        <div className="space-y-0.5 shrink-0">
          <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1">
            <Zap className="w-3 h-3" aria-hidden="true" />
            <span>MemoSpike Pulse</span>
          </div>
          <div className="text-xs font-mono tabular-nums text-white font-bold">
            {spikeStats.spikedCount} memos impaled
          </div>
        </div>

        <svg
          key={spikePulseKey}
          data-testid="memospike-waveform"
          viewBox="0 0 240 48"
          className="w-40 sm:w-48 h-10 overflow-visible shrink-0"
          role="img"
          aria-label="MemoSpike momentum pulse waveform"
        >
          <line
            x1="0"
            y1="36"
            x2="240"
            y2="36"
            stroke="#334155"
            strokeDasharray="2 2"
            strokeWidth="1"
          />
          <motion.polyline
            fill="none"
            stroke="#F59E0B"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={spikeStats.waveformPoints}
            initial={{ pathLength: 0.3, opacity: 0.5 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.35 }}
          />
        </svg>
      </div>

      {/* Interactive Desk Spindle Stage + Spiked Slip Inspector */}
      <div className="grid grid-cols-1 @sm:grid-cols-12 gap-3 items-stretch">
        {/* Left: Animated Vertical Metal Spindle with Impaled Paper Slips */}
        <div
          data-testid="memospike-spindle-stage"
          className="@sm:col-span-6 bg-slate-900 rounded-xl p-3.5 flex flex-col items-center justify-end relative overflow-hidden min-h-[230px]"
        >
          {/* Top Label */}
          <div className="absolute top-2.5 left-3 right-3 flex items-center justify-between text-[10px] font-mono tabular-nums text-slate-400">
            <span>DESK SPINDLE</span>
            <span>{spikeStats.spikedCount} SLIPS</span>
          </div>

          {/* Kinetic Impact Ring when a new slip is spiked */}
          <AnimatePresence>
            {spikePulseKey > 0 && (
              <motion.div
                key={`ring-${spikePulseKey}`}
                initial={{ opacity: 0.9, scale: 0.4 }}
                animate={{ opacity: 0, scale: 2.1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="w-12 h-4 rounded-full border-2 border-amber-400 absolute top-10 pointer-events-none z-30"
              />
            )}
          </AnimatePresence>

          {/* The Vertical Metal Spike Rod & Sharp Tip */}
          <div className="relative w-40 h-44 flex flex-col items-center justify-end select-none">
            {/* Sharp Metal Needle Tip */}
            <div
              aria-hidden="true"
              className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[14px] border-b-slate-300 z-20"
            />
            {/* Vertical Brushed Steel Spindle Rod */}
            <div
              aria-hidden="true"
              className="w-1.5 flex-1 bg-gradient-to-r from-slate-400 via-slate-100 to-slate-500 shadow-xs z-10"
            />

            {/* Stacked Impaled Paper Task Slips on the Spindle */}
            <div className="absolute inset-x-0 bottom-4 top-2 pointer-events-none">
              <AnimatePresence>
                {spikeStats.slips.map((slip) => {
                  const isSelected = selectedSlip?.todoId === slip.todoId;
                  return (
                    <motion.button
                      key={slip.id}
                      type="button"
                      data-testid={`spiked-slip-${slip.todoId}`}
                      onClick={() => setSelectedSlipId(slip.todoId)}
                      initial={{
                        opacity: 0,
                        y: -115,
                        scale: 0.78,
                        rotate: slip.rotationDeg - 18,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: isSelected ? 1.06 : 1,
                        rotate: slip.rotationDeg,
                      }}
                      exit={{
                        opacity: 0,
                        y: -60,
                        scale: 0.6,
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 290,
                        damping: 20,
                      }}
                      style={{
                        bottom: `${slip.bottomOffsetPx}px`,
                        backgroundColor: slip.paperBgHex,
                        borderColor: isSelected ? '#FFFFFF' : slip.paperBorderHex,
                        zIndex: isSelected ? 40 : 15 + slip.stackIndex,
                      }}
                      aria-label={`Inspect spiked task memo: ${slip.title}`}
                      title={`Spiked: ${slip.title}`}
                      className={`pointer-events-auto absolute left-1/2 -translate-x-1/2 w-34 px-2.5 py-1 rounded-md border-2 shadow-sm text-left flex items-center justify-between gap-1.5 cursor-pointer transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
                        isSelected ? 'ring-2 ring-amber-400 shadow-md' : ''
                      }`}
                    >
                      <span className="text-[10px] font-bold text-slate-900 truncate flex-1">
                        {slip.title}
                      </span>
                      {/* Center Spindle Puncture Hole */}
                      <span
                        aria-hidden="true"
                        className="w-2 h-2 rounded-full bg-slate-800 border border-slate-400 shrink-0"
                      />
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Weighted Brass & Walnut Desk Base */}
            <div
              aria-hidden="true"
              className="w-28 h-3 bg-amber-500 border-2 border-amber-700 rounded-t-full z-20"
            />
            <div
              aria-hidden="true"
              className="w-36 h-3.5 bg-amber-800 border-2 border-amber-950 rounded-md shadow-md z-20"
            />
          </div>
        </div>

        {/* Right: Spiked Slip Inspector + "Spike Next Task" Action Control */}
        <div className="@sm:col-span-6 flex flex-col justify-between gap-2.5">
          {selectedSlip ? (
            <div
              data-testid="memospike-selected-card"
              className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 space-y-2 flex-1 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-1.5 text-[11px] text-slate-600">
                  <span className="font-semibold text-amber-900">
                    {selectedSlip.category}
                  </span>
                  <span className="font-mono tabular-nums">
                    Slip #{selectedSlip.stackIndex + 1} of{' '}
                    {spikeStats.spikedCount}
                  </span>
                </div>

                <h3
                  data-testid="memospike-selected-title"
                  className="text-xs font-bold text-slate-900 leading-snug"
                >
                  {selectedSlip.title}
                </h3>

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 font-mono tabular-nums">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3" aria-hidden="true" />
                    {selectedSlip.dueDate}
                  </span>
                  {selectedSlip.streakCount > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-amber-800 font-semibold">
                      <Flame className="w-3 h-3" aria-hidden="true" />
                      {selectedSlip.streakCount}d
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                data-testid="unspike-selected-task-btn"
                onClick={() => onSpikeTask(selectedSlip.todoId)}
                className="w-full py-1.5 px-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                <span>Unspike to Active List</span>
              </button>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-center flex-1 flex flex-col items-center justify-center space-y-1">
              <CheckCircle2
                className="w-5 h-5 text-slate-400"
                aria-hidden="true"
              />
              <p className="text-xs font-semibold text-slate-800">
                No tasks spiked yet
              </p>
              <p className="text-[11px] text-slate-500">
                Spike an active task below to impale its memo slip onto the
                spindle.
              </p>
            </div>
          )}

          {/* Action Box: Spike an Active Task onto the Spindle */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-2.5 space-y-2">
            <label
              htmlFor="memospike-task-select"
              className="block text-[11px] font-semibold text-slate-700"
            >
              Select Active Task to Spike:
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
                <option value="">All tasks spiked!</option>
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
              className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Zap className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Spike Task onto Spindle</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
