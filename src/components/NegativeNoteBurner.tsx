import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Flame,
  Wind,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import {
  Category,
  LIFE_AREAS,
  NegativeBurnPhase,
  NEGATIVE_BURN_PHASE_META,
  BurnedNegativeNoteStats,
} from '../utils/todoLogic';

interface NegativeNoteBurnerProps {
  lifeArea: Category;
  onChangeLifeArea: (area: Category) => void;
  burnedStats: BurnedNegativeNoteStats;
  onCompleteBurn: (lifeArea: Category) => void;
  onSwitchToPositive?: () => void;
}

const SAMPLE_NEGATIVE_PROMPTS = [
  'Overthinking a mistake from earlier today',
  'Frustrated by unexpected blockers and context switching',
  'Carrying unnecessary self-doubt about my progress',
];

const ALL_PHASES: NegativeBurnPhase[] = [
  'idle',
  'crumpling',
  'burning',
  'smoke',
  'released',
];

export const NegativeNoteBurner: React.FC<NegativeNoteBurnerProps> = ({
  lifeArea,
  onChangeLifeArea,
  burnedStats,
  onCompleteBurn,
  onSwitchToPositive,
}) => {
  const [negativeText, setNegativeText] = useState('');
  const [capturedBurnText, setCapturedBurnText] = useState('');
  const [burnPhase, setBurnPhase] = useState<NegativeBurnPhase>('idle');
  const timersRef = useRef<number[]>([]);

  const clearScheduledTimers = () => {
    for (const id of timersRef.current) {
      window.clearTimeout(id);
    }
    timersRef.current = [];
  };

  useEffect(() => {
    return () => clearScheduledTimers();
  }, []);

  const handleStartCrumpleAndBurn = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = negativeText.trim();
    if (!trimmed || (burnPhase !== 'idle' && burnPhase !== 'released')) return;

    clearScheduledTimers();
    setCapturedBurnText(trimmed);
    setBurnPhase('crumpling');

    // Phase 1 -> Phase 2: Crumpling paper ball (850ms) -> Ignite & burn the ball of paper
    const t1 = window.setTimeout(() => {
      setBurnPhase('burning');
    }, 850);

    // Phase 2 -> Phase 3: Burning ball of paper (1100ms) -> Dissolve into rising smoke
    const t2 = window.setTimeout(() => {
      setBurnPhase('smoke');
    }, 1950);

    // Phase 3 -> Phase 4: Smoke disappears (1050ms) -> Released clean state
    const t3 = window.setTimeout(() => {
      setBurnPhase('released');
      setNegativeText('');
      onCompleteBurn(lifeArea);
    }, 3000);

    timersRef.current = [t1, t2, t3];
  };

  const handleInspectPhase = (targetPhase: NegativeBurnPhase) => {
    clearScheduledTimers();
    if (!capturedBurnText && negativeText.trim()) {
      setCapturedBurnText(negativeText.trim());
    } else if (!capturedBurnText) {
      setCapturedBurnText('Letting go of today’s stress and friction');
    }
    setBurnPhase(targetPhase);
  };

  const handleResetToWrite = () => {
    clearScheduledTimers();
    setBurnPhase('idle');
    setCapturedBurnText('');
    setNegativeText('');
  };

  const activeNotePreview =
    (burnPhase === 'idle' ? negativeText.trim() : capturedBurnText) ||
    'Write what is weighing on your mind onto this paper card...';

  const snippetLine1 = activeNotePreview.slice(0, 26);
  const snippetLine2 = activeNotePreview.slice(26, 52);

  const phaseMeta = NEGATIVE_BURN_PHASE_META[burnPhase];
  const isAnimating =
    burnPhase === 'crumpling' ||
    burnPhase === 'burning' ||
    burnPhase === 'smoke';

  return (
    <div
      data-testid="negative-note-burner"
      data-burn-phase={burnPhase}
      className="grid grid-cols-1 @lg:grid-cols-12 gap-4 items-stretch"
    >
      {/* Left Column: Negative Note Composer Controls */}
      <div className="@lg:col-span-6 bg-rose-50/50 border border-rose-200/80 rounded-xl p-3.5 flex flex-col justify-between space-y-3">
        <div className="space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <Flame
                  className="w-4 h-4 text-rose-600 shrink-0"
                  aria-hidden="true"
                />
                <h3 className="text-xs @sm:text-sm font-bold text-slate-900 font-display">
                  Negative Note · Crumple &amp; Burn Release
                </h3>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Write down frustrations, worries, or heavy thoughts on the paper
                card—then crumple it into a ball of paper and burn it until the
                smoke disappears.
              </p>
            </div>

            <span
              data-testid="burned-notes-count"
              className="px-2 py-1 rounded-lg bg-rose-100 text-rose-900 border border-rose-200 text-[11px] font-mono font-bold whitespace-nowrap shrink-0"
            >
              {burnedStats.burnedCount} Burned
            </span>
          </div>

          {/* Quick Prompt Pills */}
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
              Quick Prompts to Release:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_NEGATIVE_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => {
                    if (burnPhase !== 'idle') setBurnPhase('idle');
                    setNegativeText(prompt);
                  }}
                  className="text-[11px] bg-white hover:bg-rose-50 text-slate-700 border border-slate-200/90 rounded-lg px-2 py-1 transition-colors cursor-pointer text-left"
                >
                  “{prompt}”
                </button>
              ))}
            </div>
          </div>

          <form
            id="negative-note-form"
            onSubmit={handleStartCrumpleAndBurn}
            className="space-y-2.5"
          >
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="negative-note-textarea"
                className="text-xs font-semibold text-slate-800"
              >
                Write Negative Thought on Paper Card:
              </label>

              <div className="flex items-center gap-1.5">
                <label
                  htmlFor="negative-note-area-select"
                  className="text-[11px] text-slate-500 font-medium"
                >
                  Area:
                </label>
                <select
                  id="negative-note-area-select"
                  data-testid="negative-note-area-select"
                  value={lifeArea}
                  onChange={(e) => onChangeLifeArea(e.target.value as Category)}
                  className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-medium"
                >
                  {LIFE_AREAS.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <textarea
              id="negative-note-textarea"
              data-testid="negative-note-textarea"
              rows={3}
              value={negativeText}
              onChange={(e) => {
                if (burnPhase === 'released') setBurnPhase('idle');
                setNegativeText(e.target.value);
              }}
              disabled={isAnimating}
              placeholder="Write the negative thought, stress, or worry you want to crumple up and burn away..."
              className="w-full text-xs bg-white border border-rose-200 rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-rose-500/30 disabled:opacity-60"
            />

            <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
              <span className="text-[11px] text-slate-500">
                Not saved to feed · Incinerates into ash &amp; smoke
              </span>

              <button
                type="submit"
                data-testid="crumple-and-burn-btn"
                disabled={!negativeText.trim() || isAnimating}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Flame className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Crumple &amp; Burn Paper</span>
              </button>
            </div>
          </form>
        </div>

        {/* Interactive Stage Progress & Step Inspector Bar */}
        <div className="pt-2 border-t border-rose-200/70 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-600">
            <span>STAGE: {phaseMeta.label.toUpperCase()}</span>
            <span>{phaseMeta.progressPercent}%</span>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {ALL_PHASES.map((ph) => {
              const meta = NEGATIVE_BURN_PHASE_META[ph];
              const isCurrent = burnPhase === ph;
              const shortNames: Record<NegativeBurnPhase, string> = {
                idle: 'Card',
                crumpling: 'Crumple',
                burning: 'Burn',
                smoke: 'Smoke',
                released: 'Cleared',
              };
              return (
                <button
                  key={ph}
                  type="button"
                  data-testid={`burn-phase-pill-${ph}`}
                  onClick={() => handleInspectPhase(ph)}
                  title={`Inspect stage: ${meta.label}`}
                  className={`py-1 px-1 rounded text-[10px] font-mono font-semibold transition-colors cursor-pointer text-center ${
                    isCurrent
                      ? 'bg-rose-600 text-white'
                      : 'bg-white/90 hover:bg-rose-100/70 text-slate-600 border border-rose-200/70'
                  }`}
                >
                  {shortNames[ph]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Column: Live Paper Card -> Crumpling Ball -> Burning Ball -> Disappearing Smoke Stage */}
      <div
        data-testid="negative-burn-stage"
        className="@lg:col-span-6 bg-slate-900 rounded-xl p-4 flex flex-col items-center justify-between relative overflow-hidden min-h-[268px]"
      >
        {/* Top Stage Header */}
        <div className="w-full flex items-center justify-between text-[10px] font-mono text-slate-400 z-20">
          <span className="uppercase tracking-wider text-rose-400 font-semibold flex items-center gap-1">
            <Flame className="w-3 h-3" aria-hidden="true" />
            <span>{phaseMeta.label}</span>
          </span>
          <span>{lifeArea.toUpperCase()} RELEASE</span>
        </div>

        {/* Center Visual Animation Stage */}
        <div className="relative w-full flex-1 min-h-[196px] flex items-center justify-center my-1 select-none">
          <AnimatePresence mode="wait">
            {/* STAGE 1: IDLE — Physical Ruled Paper Note Card */}
            {burnPhase === 'idle' && (
              <motion.div
                key="stage-idle-paper-card"
                data-testid="negative-paper-card-preview"
                initial={{ opacity: 0, y: 4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1, rotate: -1.5 }}
                exit={{
                  opacity: 0,
                  scale: 0.6,
                  transition: { duration: 0.08 },
                }}
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(to bottom, transparent 0px, transparent 17px, #FECDD3 17px, #FECDD3 18px)',
                }}
                className="relative w-60 min-h-[144px] bg-amber-50 border-2 border-rose-300 rounded-sm p-3.5 shadow-xl flex flex-col justify-between"
              >
                {/* Red Vertical Margin Line */}
                <span
                  aria-hidden="true"
                  className="absolute left-5 top-0 bottom-0 w-[1px] bg-rose-400/65 pointer-events-none"
                />

                {/* Folded Dog-Ear Corner */}
                <span
                  aria-hidden="true"
                  className="absolute top-0 right-0 w-0 h-0 border-t-[16px] border-t-slate-900 border-l-[16px] border-l-rose-200 pointer-events-none"
                />

                <div className="pl-3 pr-2 space-y-1.5">
                  <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-wider text-rose-800 font-bold">
                    <span className="inline-flex items-center gap-1">
                      <FileText className="w-2.5 h-2.5" aria-hidden="true" />
                      <span>PAPER NOTE CARD</span>
                    </span>
                    <span>{lifeArea}</span>
                  </div>

                  <p
                    data-testid="negative-card-live-text"
                    className={`text-xs leading-snug font-medium break-words ${
                      negativeText.trim()
                        ? 'text-slate-900 font-semibold'
                        : 'text-slate-400 italic'
                    }`}
                  >
                    {activeNotePreview}
                  </p>
                </div>

                <div className="pl-3 flex items-center justify-between pt-2 text-[9px] font-mono">
                  <span className="px-1.5 py-0.5 border border-rose-700/70 text-rose-800 rounded-2xs font-bold uppercase tracking-widest">
                    READY TO CRUMPLE &amp; BURN
                  </span>
                  <span className="text-slate-500">SHEET #01</span>
                </div>
              </motion.div>
            )}

            {/* STAGE 2: CRUMPLING — Paper Card Crushing into a Multi-Faceted 3D Ball of Paper */}
            {burnPhase === 'crumpling' && (
              <motion.div
                key="stage-crumpling-paper-ball"
                data-testid="crumpled-paper-ball-graphic"
                initial={{ scale: 1.2, rotate: -12, opacity: 0.95 }}
                animate={{
                  scale: [1.15, 0.86, 1.02, 0.96],
                  rotate: [-10, 8, -4, 2],
                  opacity: 1,
                }}
                exit={{ opacity: 0, transition: { duration: 0.08 } }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                className="relative w-48 h-44 flex items-center justify-center"
              >
                <svg
                  viewBox="0 0 200 180"
                  className="w-48 h-44 overflow-visible drop-shadow-xl"
                  role="img"
                  aria-label="Crumpled ball of paper with folded facets"
                >
                  {/* Animated Inward Compression Arrows / Crease Shockwaves */}
                  <circle
                    cx="100"
                    cy="92"
                    r="68"
                    fill="none"
                    stroke="#FDA4AF"
                    strokeWidth="1.2"
                    strokeDasharray="4 4"
                    opacity="0.65"
                  />

                  {/* Outer Jagged Crumpled Paper Ball Base Silhouette */}
                  <polygon
                    points="100,24 134,30 158,52 166,86 156,122 132,148 98,156 64,146 40,120 34,84 46,48 70,28"
                    fill="#FEF3C7"
                    stroke="#A8A29E"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />

                  {/* 3D Faceted Paper Folds & Shadowed Crease Triangles */}
                  <polygon
                    points="100,24 134,30 116,66 82,58"
                    fill="#FFFBEB"
                    stroke="#78716C"
                    strokeWidth="1.2"
                  />
                  <polygon
                    points="134,30 158,52 142,88 116,66"
                    fill="#E7E5E4"
                    stroke="#78716C"
                    strokeWidth="1.2"
                  />
                  <polygon
                    points="158,52 166,86 136,104 142,88"
                    fill="#F5F5F4"
                    stroke="#78716C"
                    strokeWidth="1.2"
                  />
                  <polygon
                    points="166,86 156,122 122,124 136,104"
                    fill="#D6D3D1"
                    stroke="#78716C"
                    strokeWidth="1.2"
                  />
                  <polygon
                    points="156,122 132,148 98,156 122,124"
                    fill="#E7E5E4"
                    stroke="#78716C"
                    strokeWidth="1.2"
                  />
                  <polygon
                    points="98,156 64,146 76,116 122,124"
                    fill="#FDE68A"
                    stroke="#78716C"
                    strokeWidth="1.2"
                  />
                  <polygon
                    points="64,146 40,120 62,92 76,116"
                    fill="#D6D3D1"
                    stroke="#78716C"
                    strokeWidth="1.2"
                  />
                  <polygon
                    points="40,120 34,84 62,92"
                    fill="#F5F5F4"
                    stroke="#78716C"
                    strokeWidth="1.2"
                  />
                  <polygon
                    points="34,84 46,48 82,58 62,92"
                    fill="#FEF3C7"
                    stroke="#78716C"
                    strokeWidth="1.2"
                  />
                  <polygon
                    points="46,48 70,28 100,24 82,58"
                    fill="#E7E5E4"
                    stroke="#78716C"
                    strokeWidth="1.2"
                  />

                  {/* Center Deeply Creased Core Facets of the Paper Ball */}
                  <polygon
                    points="82,58 116,66 142,88 122,124 76,116 62,92"
                    fill="#FFFBEB"
                    stroke="#57534E"
                    strokeWidth="1.4"
                  />
                  <polyline
                    points="62,92 102,88 142,88"
                    fill="none"
                    stroke="#78716C"
                    strokeWidth="1.3"
                  />
                  <polyline
                    points="82,58 102,88 122,124"
                    fill="none"
                    stroke="#78716C"
                    strokeWidth="1.3"
                  />
                  <polyline
                    points="116,66 102,88 76,116"
                    fill="none"
                    stroke="#78716C"
                    strokeWidth="1.3"
                  />

                  {/* Warped Red Margin & Ruled Lines Across the Crumpled Paper Facets */}
                  <line
                    x1="72"
                    y1="64"
                    x2="88"
                    y2="112"
                    stroke="#F43F5E"
                    strokeWidth="1"
                    strokeOpacity="0.65"
                  />
                  <line
                    x1="76"
                    y1="76"
                    x2="128"
                    y2="72"
                    stroke="#93C5FD"
                    strokeWidth="1"
                  />
                  <line
                    x1="68"
                    y1="98"
                    x2="130"
                    y2="104"
                    stroke="#93C5FD"
                    strokeWidth="1"
                  />

                  {/* Warped Handwritten Text Fragment Visible on the Crumpled Ball */}
                  <text
                    x="74"
                    y="83"
                    fill="#334155"
                    fontSize="7.5"
                    fontWeight="700"
                    transform="rotate(-8 100 84)"
                  >
                    {snippetLine1.slice(0, 16)}
                  </text>
                  {snippetLine2 && (
                    <text
                      x="76"
                      y="105"
                      fill="#475569"
                      fontSize="7"
                      transform="rotate(7 100 104)"
                    >
                      {snippetLine2.slice(0, 14)}
                    </text>
                  )}
                </svg>
              </motion.div>
            )}

            {/* STAGE 3: BURNING — Flames Engulfing & Charring the Crumpled Paper Ball */}
            {burnPhase === 'burning' && (
              <motion.div
                key="stage-burning-paper-ball"
                data-testid="burning-paper-ball-graphic"
                initial={{ scale: 0.96, opacity: 1 }}
                animate={{
                  scale: [0.98, 0.92, 0.86],
                  y: [0, 2, 4],
                }}
                exit={{ opacity: 0, transition: { duration: 0.08 } }}
                transition={{ duration: 0.8 }}
                className="relative w-52 h-48 flex items-center justify-center"
              >
                <svg
                  viewBox="0 0 220 200"
                  className="w-52 h-48 overflow-visible"
                  role="img"
                  aria-label="Burning crumpled ball of paper with flames and embers"
                >
                  {/* Ambient Fiery Hearth Glow Behind the Paper Ball */}
                  <circle
                    cx="110"
                    cy="108"
                    r="74"
                    fill="rgba(234, 88, 12, 0.28)"
                  />

                  {/* Outer Dancing Crimson & Deep Orange Flame Tongues */}
                  <motion.path
                    animate={{
                      scaleY: [0.96, 1.09, 0.98],
                      scaleX: [1.02, 0.95, 1.03],
                    }}
                    transition={{
                      duration: 0.26,
                      repeat: Infinity,
                      repeatType: 'reverse',
                    }}
                    style={{ transformOrigin: '110px 148px' }}
                    d="M 48 148 Q 32 100 66 58 Q 78 82 86 38 Q 110 8 116 46 Q 136 12 146 56 Q 166 42 168 86 Q 188 116 170 148 Z"
                    fill="#DC2626"
                    opacity="0.92"
                  />

                  {/* Middle Bright Orange Flame Layer */}
                  <motion.path
                    animate={{
                      scaleY: [0.95, 1.08, 0.97],
                      scaleX: [1.02, 0.96, 1.03],
                    }}
                    transition={{
                      duration: 0.24,
                      repeat: Infinity,
                      repeatType: 'reverse',
                    }}
                    style={{ transformOrigin: '110px 145px' }}
                    d="M 62 146 Q 52 106 78 72 Q 92 90 102 48 Q 116 24 124 62 Q 142 40 148 78 Q 168 108 156 146 Z"
                    fill="#F97316"
                  />

                  {/* Charred & Glowing Crumpled Paper Ball Inside the Flames */}
                  <g>
                    <polygon
                      points="110,54 138,60 156,78 162,106 152,134 132,152 108,158 82,150 64,130 58,102 68,74 88,58"
                      fill="#292524"
                      stroke="#EA580C"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                    {/* Charred Facets Transitioning from Scorched Amber to Carbon Black */}
                    <polygon
                      points="110,54 138,60 124,88 96,82"
                      fill="#78350F"
                      stroke="#F97316"
                      strokeWidth="1.2"
                    />
                    <polygon
                      points="138,60 156,78 142,108 124,88"
                      fill="#451A03"
                      stroke="#EA580C"
                      strokeWidth="1.2"
                    />
                    <polygon
                      points="156,78 162,106 134,122 142,108"
                      fill="#1C1917"
                      stroke="#F97316"
                      strokeWidth="1.2"
                    />
                    <polygon
                      points="134,122 108,158 82,150 92,120"
                      fill="#1C1917"
                      stroke="#FB923C"
                      strokeWidth="1.3"
                    />
                    <polygon
                      points="58,102 68,74 96,82 82,112"
                      fill="#451A03"
                      stroke="#F97316"
                      strokeWidth="1.2"
                    />
                    {/* Glowing Molten Ember Crease Lines Cracking Across the Paper Ball */}
                    <polyline
                      points="74,98 110,104 146,96"
                      fill="none"
                      stroke="#FDBA74"
                      strokeWidth="2"
                    />
                    <polyline
                      points="96,82 110,104 128,134"
                      fill="none"
                      stroke="#FB923C"
                      strokeWidth="1.8"
                    />
                    <polyline
                      points="124,88 110,104 88,132"
                      fill="none"
                      stroke="#FDE047"
                      strokeWidth="1.5"
                    />
                  </g>

                  {/* Front White-Hot & Golden Inner Flame Tongues Licking Over the Paper Ball */}
                  <motion.path
                    animate={{
                      scaleY: [0.92, 1.12, 0.95],
                    }}
                    transition={{
                      duration: 0.22,
                      repeat: Infinity,
                      repeatType: 'reverse',
                    }}
                    style={{ transformOrigin: '110px 152px' }}
                    d="M 76 152 Q 72 122 92 98 Q 104 114 110 82 Q 120 112 130 96 Q 146 122 142 152 Z"
                    fill="#FACC15"
                    opacity="0.88"
                  />

                  {/* Rising Glowing Ember Sparks */}
                  {[
                    { cx: 78, cy: 48, r: 2.5 },
                    { cx: 104, cy: 28, r: 3 },
                    { cx: 136, cy: 36, r: 2.2 },
                    { cx: 152, cy: 56, r: 2.6 },
                    { cx: 66, cy: 68, r: 2 },
                    { cx: 118, cy: 18, r: 2.4 },
                  ].map((spark, i) => (
                    <motion.circle
                      key={i}
                      cx={spark.cx}
                      cy={spark.cy}
                      r={spark.r}
                      fill="#FDE047"
                      animate={{
                        y: [0, -18, -32],
                        opacity: [1, 0.8, 0],
                      }}
                      transition={{
                        duration: 0.75,
                        repeat: Infinity,
                        delay: i * 0.1,
                      }}
                    />
                  ))}
                </svg>
              </motion.div>
            )}

            {/* STAGE 4: SMOKE — Ash Dissolves as Curling Smoke Plumes Rise & Disappear */}
            {burnPhase === 'smoke' && (
              <motion.div
                key="stage-rising-smoke"
                data-testid="disappearing-smoke-graphic"
                initial={{ opacity: 1 }}
                animate={{ opacity: [1, 0.85, 0.15] }}
                exit={{ opacity: 0, transition: { duration: 0.08 } }}
                transition={{ duration: 0.95, ease: 'easeOut' }}
                className="relative w-52 h-48 flex items-center justify-center"
              >
                <svg
                  viewBox="0 0 220 200"
                  className="w-52 h-48 overflow-visible"
                  role="img"
                  aria-label="Curling smoke plumes rising and disappearing from burned paper ash"
                >
                  {/* Dissolving Fine Gray Ash Heap at the Bottom */}
                  <ellipse
                    cx="110"
                    cy="162"
                    rx="34"
                    ry="6"
                    fill="#475569"
                    opacity="0.55"
                  />
                  <ellipse
                    cx="110"
                    cy="162"
                    rx="18"
                    ry="3"
                    fill="#94A3B8"
                    opacity="0.45"
                  />

                  {/* Curling S-Curve Smoke Wisps Drifting Upward */}
                  <motion.path
                    initial={{ y: 12, opacity: 0.85, scale: 0.85 }}
                    animate={{ y: -42, opacity: 0, scale: 1.25 }}
                    transition={{ duration: 0.95, ease: 'easeOut' }}
                    d="M 106 154 C 82 126, 134 96, 98 62 C 76 40, 122 18, 108 4"
                    fill="none"
                    stroke="#CBD5E1"
                    strokeWidth="5"
                    strokeLinecap="round"
                    opacity="0.65"
                  />
                  <motion.path
                    initial={{ y: 16, opacity: 0.75, scale: 0.8 }}
                    animate={{ y: -48, opacity: 0, scale: 1.35 }}
                    transition={{ duration: 0.95, delay: 0.08, ease: 'easeOut' }}
                    d="M 118 152 C 144 122, 92 92, 128 58 C 146 38, 106 16, 122 2"
                    fill="none"
                    stroke="#94A3B8"
                    strokeWidth="4"
                    strokeLinecap="round"
                    opacity="0.55"
                  />

                  {/* Expanding Soft Translucent Smoke Clouds Fading into Nothing */}
                  {[
                    { cx: 106, cy: 126, r: 18, delay: 0 },
                    { cx: 122, cy: 104, r: 22, delay: 0.06 },
                    { cx: 94, cy: 84, r: 25, delay: 0.12 },
                    { cx: 118, cy: 62, r: 28, delay: 0.18 },
                    { cx: 102, cy: 38, r: 32, delay: 0.24 },
                  ].map((puff, idx) => (
                    <motion.circle
                      key={idx}
                      cx={puff.cx}
                      cy={puff.cy}
                      r={puff.r}
                      fill="#CBD5E1"
                      initial={{ opacity: 0.55, scale: 0.7, y: 15 }}
                      animate={{
                        opacity: 0,
                        scale: 1.55,
                        y: -36,
                        x: idx % 2 === 0 ? -12 : 12,
                      }}
                      transition={{
                        duration: 0.92,
                        delay: puff.delay,
                        ease: 'easeOut',
                      }}
                    />
                  ))}
                </svg>
              </motion.div>
            )}

            {/* STAGE 5: RELEASED — Smoke Has Disappeared Completely */}
            {burnPhase === 'released' && (
              <motion.div
                key="stage-released-clean"
                data-testid="negative-burn-complete"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.08 } }}
                transition={{ duration: 0.16 }}
                className="w-full text-center px-4 py-3 space-y-2.5 max-w-xs mx-auto"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                </div>
                <h4 className="text-sm font-bold text-white font-display">
                  Paper Burned &amp; Smoke Has Disappeared
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Your negative note was crumpled into a ball of paper, burned
                  to ash, and dissolved completely as the smoke vanished.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    data-testid="write-another-negative-btn"
                    onClick={handleResetToWrite}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" aria-hidden="true" />
                    <span>Write Another Card</span>
                  </button>
                  {onSwitchToPositive && (
                    <button
                      type="button"
                      data-testid="switch-to-positive-after-burn-btn"
                      onClick={onSwitchToPositive}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Add Positive Star to Jar</span>
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Caption inside Dark Hearth Stage */}
        <div className="w-full flex items-center justify-between text-[11px] text-slate-400 z-20 pt-1 border-t border-slate-800">
          <span className="inline-flex items-center gap-1.5 truncate">
            <Wind className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{phaseMeta.description}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
