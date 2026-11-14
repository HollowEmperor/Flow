import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Shuffle,
  Plus,
  Calendar,
  X,
  ChevronRight,
  HeartHandshake,
} from 'lucide-react';
import {
  Category,
  LIFE_AREAS,
  JournalMood,
  JournalEntry,
  GratitudeStar,
  extractGratitudeStars,
  computeGratitudeJarStats,
  pickRandomGratitudeStar,
  getTodayIsoDate,
} from '../utils/todoLogic';

interface GratitudeJarProps {
  entries: JournalEntry[];
  selectedEntryId?: string | null;
  onAddGratitudeNote: (params: {
    title: string;
    content: string;
    gratitude: string;
    lifeArea: Category;
    mood: JournalMood;
    dateIso: string;
  }) => void;
}

export const GratitudeJar: React.FC<GratitudeJarProps> = ({
  entries,
  selectedEntryId,
  onAddGratitudeNote,
}) => {
  const stars = React.useMemo(() => extractGratitudeStars(entries), [entries]);
  const jarStats = React.useMemo(
    () => computeGratitudeJarStats(entries, 10),
    [entries]
  );

  const [selectedStarId, setSelectedStarId] = useState<string | null>(() =>
    stars.length > 0 ? stars[stars.length - 1].id : null
  );
  const [isShaking, setIsShaking] = useState(false);
  const [recentlyDroppedId, setRecentlyDroppedId] = useState<string | null>(
    null
  );
  const [quickGratitude, setQuickGratitude] = useState('');
  const [quickLifeArea, setQuickLifeArea] = useState<Category>('Portfolio');

  // Sync when external entry is clicked in journal feed
  useEffect(() => {
    if (!selectedEntryId) return;
    const match = stars.find(
      (s) => s.entryId === selectedEntryId || s.id === selectedEntryId
    );
    if (match) {
      setSelectedStarId(match.id);
    }
  }, [selectedEntryId, stars]);

  // Keep selected star valid or select newly added star when count increases
  useEffect(() => {
    if (stars.length === 0) {
      setSelectedStarId(null);
      return;
    }
    if (
      selectedStarId &&
      !stars.some(
        (s) => s.id === selectedStarId || s.entryId === selectedStarId
      )
    ) {
      setSelectedStarId(stars[stars.length - 1].id);
    }
  }, [stars, selectedStarId]);

  const activeStar: GratitudeStar | null = React.useMemo(() => {
    if (!selectedStarId) return null;
    return (
      stars.find(
        (s) => s.id === selectedStarId || s.entryId === selectedStarId
      ) ?? null
    );
  }, [stars, selectedStarId]);

  const handleOpenStar = (star: GratitudeStar) => {
    setSelectedStarId(star.id);
  };

  const handleDrawRandomStar = () => {
    if (stars.length === 0) return;
    setIsShaking(true);
    window.setTimeout(() => {
      setIsShaking(false);
    }, 450);
    const chosen = pickRandomGratitudeStar(stars, selectedStarId);
    if (chosen) {
      setSelectedStarId(chosen.id);
    }
  };

  const handleDropNewStar = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickGratitude.trim();
    if (!trimmed) return;

    onAddGratitudeNote({
      title: `${quickLifeArea} Gratitude Star`,
      content: '',
      gratitude: trimmed,
      lifeArea: quickLifeArea,
      mood: 'Peak',
      dateIso: getTodayIsoDate(),
    });

    setQuickGratitude('');
    setRecentlyDroppedId(trimmed);
  };

  // Whenever a new star is added that matches our recent drop, select it automatically
  useEffect(() => {
    if (!recentlyDroppedId || stars.length === 0) return;
    const newest = stars[stars.length - 1];
    if (newest && newest.gratitudeText === recentlyDroppedId) {
      setSelectedStarId(newest.id);
      const timer = window.setTimeout(() => setRecentlyDroppedId(null), 1200);
      return () => window.clearTimeout(timer);
    }
  }, [stars, recentlyDroppedId]);

  return (
    <section
      aria-label="Animated Gratitude Jar"
      data-testid="gratitude-jar-section"
      className="bg-white border border-slate-200 rounded-xl p-4 space-y-4"
    >
      {/* Top Header & Automatic Fill Status */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles
              className="w-5 h-5 text-amber-500 shrink-0"
              aria-hidden="true"
            />
            <h2 className="text-base @sm:text-lg font-bold tracking-tight text-slate-900 font-display">
              Animated Gratitude Star Jar
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Every gratitude note folds into a paper star inside your jar. Click
            any paper star to unfold and revisit a past gratitude note.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-amber-50/80 border border-amber-200/80 rounded-xl px-3 py-1.5">
          <div className="text-right">
            <div
              data-testid="gratitude-jar-star-count"
              className="text-xs font-bold font-mono tabular-nums text-slate-900"
            >
              {jarStats.starCount}{' '}
              {jarStats.starCount === 1 ? 'Paper Star' : 'Paper Stars'}
            </div>
            <div
              data-testid="gratitude-jar-fill-label"
              className="text-[11px] text-amber-900 font-medium"
            >
              {jarStats.fillPercent}% Full · {jarStats.fillLevelLabel}
            </div>
          </div>
          <div
            className="w-12 h-2.5 bg-amber-100 rounded-full overflow-hidden border border-amber-300/60"
            role="progressbar"
            aria-label="Gratitude jar fill percentage"
            aria-valuenow={jarStats.fillPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              data-testid="gratitude-jar-fill-bar"
              className="h-full bg-amber-500 transition-transform duration-300 origin-left"
              style={{
                transform: `scaleX(${jarStats.fillPercent / 100})`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Two-Column Interactive Showcase: Animated Glass Jar + Unfolded Star Note Viewer */}
      <div className="grid grid-cols-1 @xl:grid-cols-12 gap-4 items-stretch">
        {/* Left Column: Interactive Glass Jar with Paper Stars */}
        <div className="@xl:col-span-5 bg-slate-900 rounded-xl p-4 flex flex-col items-center justify-between relative overflow-hidden min-h-[320px]">
          {/* Ambient Starlight Header inside Dark Showcase */}
          <div className="w-full flex items-center justify-between gap-2 text-[11px] text-slate-300 z-10 mb-1">
            <span className="font-mono tabular-nums whitespace-nowrap">
              Fill: {jarStats.fillPercent}% ({jarStats.starCount}/
              {jarStats.jarCapacity})
            </span>
            <button
              type="button"
              data-testid="draw-random-star-btn"
              onClick={handleDrawRandomStar}
              disabled={stars.length === 0}
              className="px-2.5 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 disabled:opacity-40 text-amber-200 border border-amber-400/30 text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Shuffle className="w-3 h-3" aria-hidden="true" />
              <span>Shake &amp; Pick</span>
            </button>
          </div>

          {/* The Physical Glass Jar Vessel */}
          <motion.div
            data-testid="gratitude-jar-vessel"
            animate={
              isShaking
                ? {
                    rotate: [0, -5, 5, -4, 4, 0],
                    scale: [1, 1.02, 1],
                  }
                : { rotate: 0, scale: 1 }
            }
            transition={{ duration: 0.42 }}
            className="relative w-44 h-60 my-1 flex flex-col items-center select-none"
          >
            {/* Cork Lid & Glass Neck Rim */}
            <div className="w-22 h-3.5 bg-amber-700 border-2 border-amber-900 rounded-t-md shadow-xs z-20" />
            <div className="w-26 h-3 bg-slate-700 border-2 border-slate-400/70 rounded-xs z-20" />

            {/* Glass Jar Body */}
            <div
              data-testid="gratitude-jar-body"
              className="relative w-42 flex-1 rounded-b-[34px] rounded-t-[18px] border-2 border-slate-300/60 bg-slate-800/90 shadow-inner overflow-hidden"
            >
              {/* Automatic Rising Golden Glow Fill Level inside the Jar */}
              <div
                data-testid="gratitude-jar-liquid-fill"
                className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-amber-500/35 via-amber-400/20 to-amber-300/5 transition-transform duration-500 origin-bottom pointer-events-none"
                style={{
                  transform: `scaleY(${Math.max(0.04, jarStats.fillPercent / 100)})`,
                }}
              />

              {/* Glass Measurement Tick Marks on Right Edge */}
              <div
                aria-hidden="true"
                className="absolute right-1.5 inset-y-4 flex flex-col justify-between text-[9px] font-mono tabular-nums text-slate-400/75 pointer-events-none z-10"
              >
                <span>100%</span>
                <span>75%</span>
                <span>50%</span>
                <span>25%</span>
              </div>

              {/* Specular Left Glass Highlight */}
              <div
                aria-hidden="true"
                className="absolute left-2.5 top-4 bottom-6 w-1.5 rounded-full bg-white/10 pointer-events-none z-20"
              />

              {/* Empty Jar Prompt if 0 stars */}
              {stars.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                  <Sparkles
                    className="w-6 h-6 text-slate-500 mb-1.5"
                    aria-hidden="true"
                  />
                  <p className="text-[11px] text-slate-400 font-medium">
                    Your jar is waiting for its first gratitude paper star.
                  </p>
                </div>
              )}

              {/* Interactive Paper Stars Inside Jar */}
              <AnimatePresence>
                {stars.map((star, idx) => {
                  const isSelected = activeStar?.id === star.id;
                  return (
                    <motion.button
                      key={star.id}
                      type="button"
                      data-testid={`gratitude-star-${star.entryId}`}
                      onClick={() => handleOpenStar(star)}
                      initial={{
                        opacity: 0,
                        y: -90,
                        scale: 0.4,
                        rotate: star.rotationDeg - 90,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: isSelected ? 1.22 : star.scale,
                        rotate: isShaking
                          ? star.rotationDeg + (idx % 2 === 0 ? 14 : -14)
                          : star.rotationDeg,
                      }}
                      exit={{ opacity: 0, scale: 0.3 }}
                      transition={{
                        type: 'spring',
                        stiffness: 240,
                        damping: 18,
                      }}
                      style={{
                        left: `${star.xPercent}%`,
                        top: `${star.yPercent}%`,
                      }}
                      aria-label={`Open gratitude star from ${star.dateIso}: ${star.gratitudeText}`}
                      aria-pressed={isSelected}
                      title={`Click to unfold: "${star.gratitudeText}"`}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full cursor-pointer transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
                        isSelected ? 'z-30' : 'z-10 hover:scale-115'
                      }`}
                    >
                      {/* Origami Folded 3D Paper Star SVG */}
                      <svg
                        viewBox="0 0 40 40"
                        className="w-7 h-7 overflow-visible drop-shadow-xs"
                        aria-hidden="true"
                      >
                        {isSelected && (
                          <circle
                            cx="20"
                            cy="20"
                            r="18"
                            fill="none"
                            stroke="#FDE68A"
                            strokeWidth="2"
                            strokeDasharray="3 2"
                          />
                        )}
                        <polygon
                          points="20,3 25.2,13.6 36.9,15.3 28.4,23.5 30.4,35.1 20,29.6 9.6,35.1 11.6,23.5 3.1,15.3 14.8,13.6"
                          fill={star.colorHex}
                          stroke={isSelected ? '#FFFFFF' : star.strokeHex}
                          strokeWidth={isSelected ? '2.2' : '1.4'}
                          strokeLinejoin="round"
                        />
                        {/* Origami Paper Crease Lines for Puffy 3D Star Look */}
                        <line
                          x1="20"
                          y1="20"
                          x2="20"
                          y2="3"
                          stroke={star.strokeHex}
                          strokeOpacity="0.45"
                          strokeWidth="1"
                        />
                        <line
                          x1="20"
                          y1="20"
                          x2="36.9"
                          y2="15.3"
                          stroke={star.strokeHex}
                          strokeOpacity="0.45"
                          strokeWidth="1"
                        />
                        <line
                          x1="20"
                          y1="20"
                          x2="30.4"
                          y2="35.1"
                          stroke={star.strokeHex}
                          strokeOpacity="0.45"
                          strokeWidth="1"
                        />
                        <line
                          x1="20"
                          y1="20"
                          x2="9.6"
                          y2="35.1"
                          stroke={star.strokeHex}
                          strokeOpacity="0.45"
                          strokeWidth="1"
                        />
                        <line
                          x1="20"
                          y1="20"
                          x2="3.1"
                          y2="15.3"
                          stroke={star.strokeHex}
                          strokeOpacity="0.45"
                          strokeWidth="1"
                        />
                      </svg>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          </motion.div>

          <p className="text-[11px] text-slate-300 text-center z-10">
            Tap any paper star inside the jar to unfold your note
          </p>
        </div>

        {/* Right Column: Unfolded Star Note Viewer + Quick Drop Star Form */}
        <div className="@xl:col-span-7 flex flex-col justify-between gap-3">
          {/* Unfolded Paper Star Note Display */}
          <div className="flex-1 flex flex-col">
            <AnimatePresence mode="wait">
              {activeStar ? (
                <motion.div
                  key={activeStar.id}
                  data-testid="opened-gratitude-star-card"
                  initial={{ opacity: 0, scale: 0.98, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: -4 }}
                  transition={{ duration: 0.16 }}
                  className="flex-1 bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-slate-900 whitespace-nowrap">
                          <span
                            className="w-3 h-3 rounded-full inline-block shrink-0 border"
                            style={{
                              backgroundColor: activeStar.colorHex,
                              borderColor: activeStar.strokeHex,
                            }}
                            aria-hidden="true"
                          />
                          <span>Unfolded Star</span>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-amber-900 whitespace-nowrap">
                          {activeStar.lifeArea}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="whitespace-nowrap">
                          {activeStar.mood}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums inline-flex items-center gap-1 whitespace-nowrap">
                          <Calendar className="w-3 h-3" aria-hidden="true" />
                          {activeStar.dateIso}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedStarId(null)}
                        aria-label="Close unfolded gratitude star note"
                        className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer shrink-0"
                      >
                        <X className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>

                    <blockquote
                      data-testid="opened-star-gratitude-text"
                      className="text-sm @sm:text-base font-bold text-slate-900 font-display leading-snug bg-white/95 border border-amber-200/80 rounded-xl p-3.5 shadow-2xs"
                    >
                      “{activeStar.gratitudeText}”
                    </blockquote>

                    {activeStar.reflectionContent && (
                      <div className="text-xs text-slate-600 leading-relaxed px-1">
                        <span className="font-semibold text-slate-800">
                          From entry “{activeStar.entryTitle}”:{' '}
                        </span>
                        {activeStar.reflectionContent}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-amber-200/60">
                    <span className="text-[11px] text-amber-900/80 font-mono tabular-nums whitespace-nowrap">
                      Star #{stars.findIndex((s) => s.id === activeStar.id) + 1}{' '}
                      of {stars.length} in jar
                    </span>

                    {stars.length > 1 && (
                      <button
                        type="button"
                        data-testid="unfold-next-star-btn"
                        onClick={handleDrawRandomStar}
                        className="px-3 py-1.5 rounded-lg bg-white hover:bg-amber-100/70 text-amber-950 border border-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <span>Open Another Star</span>
                        <ChevronRight
                          className="w-3.5 h-3.5"
                          aria-hidden="true"
                        />
                      </button>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="no-star-selected"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 bg-slate-50 border border-slate-200/80 rounded-xl p-5 flex flex-col items-center justify-center text-center space-y-2"
                >
                  <HeartHandshake
                    className="w-7 h-7 text-amber-600"
                    aria-hidden="true"
                  />
                  <h3 className="text-sm font-bold text-slate-900">
                    Tap a Paper Star to Unfold a Gratitude Note
                  </h3>
                  <p className="text-xs text-slate-600 max-w-md">
                    Select any folded paper star inside the glass jar on the
                    left—or click &ldquo;Shake &amp; Pick&rdquo;—to revisit a
                    past gratitude note.
                  </p>
                  {stars.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedStarId(stars[stars.length - 1].id)
                      }
                      className="mt-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Open Latest Star
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Fold & Drop a New Paper Star Form */}
          <form
            onSubmit={handleDropNewStar}
            aria-label="Fold and drop a gratitude star into the jar"
            className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="quick-gratitude-star-input"
                className="text-xs font-semibold text-slate-800 flex items-center gap-1.5"
              >
                <Sparkles
                  className="w-3.5 h-3.5 text-amber-600 shrink-0"
                  aria-hidden="true"
                />
                <span>Fold &amp; Drop a Gratitude Star</span>
              </label>
              <span className="text-[11px] text-slate-500 font-mono tabular-nums whitespace-nowrap">
                +10% jar fill
              </span>
            </div>

            <input
              id="quick-gratitude-star-input"
              data-testid="quick-gratitude-star-input"
              type="text"
              value={quickGratitude}
              onChange={(e) => setQuickGratitude(e.target.value)}
              placeholder="Write a gratitude note to fold into a paper star..."
              className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400"
            />

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <label
                  htmlFor="quick-gratitude-area-select"
                  className="text-[11px] text-slate-500 font-medium whitespace-nowrap"
                >
                  Life Area:
                </label>
                <select
                  id="quick-gratitude-area-select"
                  data-testid="quick-gratitude-area-select"
                  value={quickLifeArea}
                  onChange={(e) => setQuickLifeArea(e.target.value as Category)}
                  className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium"
                >
                  {LIFE_AREAS.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                data-testid="drop-gratitude-star-btn"
                disabled={!quickGratitude.trim()}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Fold &amp; Drop Star</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};
