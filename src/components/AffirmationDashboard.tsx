import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Volume2,
  CheckCircle2,
  Plus,
  Trash2,
  RefreshCw,
  ShieldCheck,
  Sun,
  Moon,
  Flame,
  Award,
  HeartHandshake,
  BookOpen,
  Compass,
} from 'lucide-react';
import { Category, LIFE_AREAS, getTodayIsoDate } from '../utils/todoLogic';

export type IdentityPillarId =
  | 'man_of_knowledge'
  | 'communicate_with_everyone'
  | 'fit_to_lead'
  | 'man_who_is_structured'
  | 'financial_freedom'
  | 'self_respect_core';

export interface AffirmationItem {
  id: string;
  statement: string;
  identityPillar: IdentityPillarId;
  lifeArea: Category;
  whyItMatters: string;
  actionAnchor: string;
  convictionScore: number; // 1 to 10
  repsToday: number;
  totalReps: number;
  lastPracticedDateIso?: string;
  morningAnchoredToday: boolean;
  eveningAnchoredToday: boolean;
}

const AFFIRMATION_STORAGE_KEY = 'focusflow-affirmations-v1';

export const IDENTITY_PILLARS: Array<{
  id: IdentityPillarId;
  title: string;
  shortTitle: string;
  horizonNote: string;
  badgeClass: string;
  accentBarClass: string;
}> = [
  {
    id: 'man_of_knowledge',
    title: 'The Man of Knowledge',
    shortTitle: 'Knowledge',
    horizonNote: '30-Year Vision #1 · Deep synthesis & mastery',
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
    accentBarClass: 'bg-purple-700',
  },
  {
    id: 'communicate_with_everyone',
    title: 'The Man Who Can Communicate with Everyone',
    shortTitle: 'Communication',
    horizonNote: '30-Year Vision #2 · Empathy, clarity & presence',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
    accentBarClass: 'bg-blue-600',
  },
  {
    id: 'fit_to_lead',
    title: 'The Man Fit to Lead Our Country',
    shortTitle: 'Leadership',
    horizonNote: '30-Year Vision #3 · Integrity, courage & service',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    accentBarClass: 'bg-emerald-600',
  },
  {
    id: 'man_who_is_structured',
    title: 'The Man Who Is Structured',
    shortTitle: 'Structure',
    horizonNote: '30-Year Vision #4 · Systems that remove friction',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
    accentBarClass: 'bg-blue-600',
  },
  {
    id: 'financial_freedom',
    title: 'The Man Who Doesn’t Need to Worry About Money',
    shortTitle: 'Financial Sovereignty',
    horizonNote: '30-Year Vision #5 · High-value assets & calm abundance',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    accentBarClass: 'bg-emerald-600',
  },
  {
    id: 'self_respect_core',
    title: 'Unconditional Self-Respect & Optimism',
    shortTitle: 'Self-Respect',
    horizonNote: 'Core Philosophy · Discipline as self-respect in action',
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
    accentBarClass: 'bg-purple-700',
  },
];

export function getInitialSeedAffirmations(todayIso: string): AffirmationItem[] {
  return [
    {
      id: 'aff-self-respect-1',
      statement:
        'Discipline is a form of self-respect in action. I show myself respect today by following through on my pre-planned intentions.',
      identityPillar: 'self_respect_core',
      lifeArea: 'Personality',
      whyItMatters:
        'Removes the internal negotiation around priorities and turns every kept promise into self-trust.',
      actionAnchor: 'Complete my #1 scheduled block on the Side Hourly Calendar.',
      convictionScore: 9,
      repsToday: 2,
      totalReps: 24,
      lastPracticedDateIso: todayIso,
      morningAnchoredToday: true,
      eveningAnchoredToday: false,
    },
    {
      id: 'aff-self-love-2',
      statement:
        'I don’t need to do more to earn my love for myself. I already deserve it from myself unconditionally.',
      identityPillar: 'self_respect_core',
      lifeArea: 'Karma',
      whyItMatters:
        'Separates personal worth from perfectionism so I can challenge myself for improvement without fear.',
      actionAnchor: 'Celebrate one imperfection today and let go of the outcome.',
      convictionScore: 9,
      repsToday: 1,
      totalReps: 19,
      lastPracticedDateIso: todayIso,
      morningAnchoredToday: true,
      eveningAnchoredToday: false,
    },
    {
      id: 'aff-alhamdulillah-3',
      statement:
        'Alhamdulillah — I expect good things today, notice the blessings around me, and eat the elephant one bite at a time.',
      identityPillar: 'self_respect_core',
      lifeArea: 'Karma',
      whyItMatters:
        'Trains my mind to scan for opportunity, gratitude, and steady checkpoints rather than overwhelm.',
      actionAnchor: 'Write one blessing and take the very first 5-minute step.',
      convictionScore: 10,
      repsToday: 3,
      totalReps: 35,
      lastPracticedDateIso: todayIso,
      morningAnchoredToday: true,
      eveningAnchoredToday: true,
    },
    {
      id: 'aff-knowledge-4',
      statement:
        'I am becoming the man of knowledge: every day I study, synthesize, and build mental models that move the needle forward.',
      identityPillar: 'man_of_knowledge',
      lifeArea: 'Knowledge',
      whyItMatters:
        'Compounds 30 years of deliberate study into deep intellectual authority.',
      actionAnchor: 'Read 15 pages from my Topic Library and log 1 insight.',
      convictionScore: 8,
      repsToday: 1,
      totalReps: 16,
      lastPracticedDateIso: todayIso,
      morningAnchoredToday: false,
      eveningAnchoredToday: false,
    },
    {
      id: 'aff-communicate-5',
      statement:
        'I am the man who can communicate with everyone — listening deeply, speaking with clarity, and bridging every walk of life.',
      identityPillar: 'communicate_with_everyone',
      lifeArea: 'Social',
      whyItMatters:
        'True leadership and human connection require meeting anyone at their level with warmth and precision.',
      actionAnchor: 'Reach out to 1 person in my Relationship & Orgs network today.',
      convictionScore: 8,
      repsToday: 0,
      totalReps: 14,
      morningAnchoredToday: false,
      eveningAnchoredToday: false,
    },
    {
      id: 'aff-lead-6',
      statement:
        'I am forging the character, stamina, and moral clarity of a man fit to lead our country.',
      identityPillar: 'fit_to_lead',
      lifeArea: 'Strength',
      whyItMatters:
        'Public service demands physical vitality, emotional composure under pressure, and principled courage.',
      actionAnchor: 'Take one deliberate comfort-zone risk today.',
      convictionScore: 8,
      repsToday: 1,
      totalReps: 21,
      lastPracticedDateIso: todayIso,
      morningAnchoredToday: false,
      eveningAnchoredToday: false,
    },
    {
      id: 'aff-structured-7',
      statement:
        'I am the man who is structured: I build systems to remove repetitive decisions and cut out what is not a priority.',
      identityPillar: 'man_who_is_structured',
      lifeArea: 'Portfolio',
      whyItMatters:
        'When my environment and calendar are structured, my cognitive load stays light and focused.',
      actionAnchor: 'Send tomorrow’s priority list to Prianka and prune via Matrix.',
      convictionScore: 9,
      repsToday: 1,
      totalReps: 28,
      lastPracticedDateIso: todayIso,
      morningAnchoredToday: true,
      eveningAnchoredToday: false,
    },
    {
      id: 'aff-money-8',
      statement:
        'I am the man who doesn’t need to worry about money because I create compounding value and steward my resources wisely.',
      identityPillar: 'financial_freedom',
      lifeArea: 'Portfolio',
      whyItMatters:
        'Financial peace unlocks complete creative and civic independence over the next 30 years.',
      actionAnchor: 'Ship one high-leverage Portfolio output today.',
      convictionScore: 8,
      repsToday: 0,
      totalReps: 17,
      morningAnchoredToday: false,
      eveningAnchoredToday: false,
    },
  ];
}

export const AffirmationDashboard: React.FC = () => {
  const todayIso = getTodayIsoDate();

  const [affirmations, setAffirmations] = useState<AffirmationItem[]>(() => {
    try {
      const saved = localStorage.getItem(AFFIRMATION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback to seed affirmations
    }
    return getInitialSeedAffirmations(todayIso);
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        AFFIRMATION_STORAGE_KEY,
        JSON.stringify(affirmations)
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [affirmations]);

  const [selectedPillar, setSelectedPillar] = useState<
    IdentityPillarId | 'all'
  >('all');
  const [spotlightId, setSpotlightId] = useState<string>(
    () => affirmations[0]?.id ?? 'aff-self-respect-1'
  );

  // New Affirmation Form State
  const [newStatement, setNewStatement] = useState('');
  const [newPillar, setNewPillar] =
    useState<IdentityPillarId>('man_of_knowledge');
  const [newLifeArea, setNewLifeArea] = useState<Category>('Knowledge');
  const [newWhy, setNewWhy] = useState('');
  const [newAnchor, setNewAnchor] = useState('');

  const spotlightAffirmation = useMemo(() => {
    return (
      affirmations.find((a) => a.id === spotlightId) ?? affirmations[0] ?? null
    );
  }, [affirmations, spotlightId]);

  const filteredAffirmations = useMemo(() => {
    if (selectedPillar === 'all') return affirmations;
    return affirmations.filter((a) => a.identityPillar === selectedPillar);
  }, [affirmations, selectedPillar]);

  const stats = useMemo(() => {
    const totalRepsToday = affirmations.reduce((acc, a) => acc + a.repsToday, 0);
    const totalLifetimeReps = affirmations.reduce(
      (acc, a) => acc + a.totalReps,
      0
    );
    const avgConviction =
      affirmations.length > 0
        ? (
            affirmations.reduce((acc, a) => acc + a.convictionScore, 0) /
            affirmations.length
          ).toFixed(1)
        : '0.0';
    const morningDoneCount = affirmations.filter(
      (a) => a.morningAnchoredToday
    ).length;
    return {
      totalRepsToday,
      totalLifetimeReps,
      avgConviction,
      morningDoneCount,
    };
  }, [affirmations]);

  const handlePracticeRep = (id: string) => {
    setAffirmations((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              repsToday: item.repsToday + 1,
              totalReps: item.totalReps + 1,
              lastPracticedDateIso: todayIso,
            }
          : item
      )
    );
  };

  const handleToggleRitual = (id: string, period: 'morning' | 'evening') => {
    setAffirmations((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (period === 'morning') {
          const nextVal = !item.morningAnchoredToday;
          return {
            ...item,
            morningAnchoredToday: nextVal,
            repsToday: nextVal ? item.repsToday + 1 : item.repsToday,
            totalReps: nextVal ? item.totalReps + 1 : item.totalReps,
          };
        }
        const nextVal = !item.eveningAnchoredToday;
        return {
          ...item,
          eveningAnchoredToday: nextVal,
          repsToday: nextVal ? item.repsToday + 1 : item.repsToday,
          totalReps: nextVal ? item.totalReps + 1 : item.totalReps,
        };
      })
    );
  };

  const handleAdjustConviction = (id: string, score: number) => {
    const clamped = Math.max(1, Math.min(10, score));
    setAffirmations((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, convictionScore: clamped } : item
      )
    );
  };

  const handleCycleSpotlight = () => {
    if (affirmations.length === 0) return;
    const currentIndex = affirmations.findIndex((a) => a.id === spotlightId);
    const nextIndex = (currentIndex + 1) % affirmations.length;
    setSpotlightId(affirmations[nextIndex].id);
  };

  const handleAddAffirmation = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newStatement.trim();
    if (!trimmed) return;

    const created: AffirmationItem = {
      id: `aff-${Date.now()}`,
      statement: trimmed,
      identityPillar: newPillar,
      lifeArea: newLifeArea,
      whyItMatters:
        newWhy.trim() ||
        'Aligns my daily self-talk with my 30-year identity vision.',
      actionAnchor:
        newAnchor.trim() ||
        'Take 1 mindful action today that proves this identity.',
      convictionScore: 8,
      repsToday: 1,
      totalReps: 1,
      lastPracticedDateIso: todayIso,
      morningAnchoredToday: true,
      eveningAnchoredToday: false,
    };

    setAffirmations((prev) => [created, ...prev]);
    setSpotlightId(created.id);
    setNewStatement('');
    setNewWhy('');
    setNewAnchor('');
  };

  const handleDeleteAffirmation = (id: string) => {
    setAffirmations((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div data-testid="affirmation-dashboard" className="space-y-4">
      {/* Header & KPI Strip */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-purple-50 border border-purple-200 text-purple-900 text-[11px] font-bold uppercase tracking-wider mb-1.5">
              <Sparkles
                className="w-3.5 h-3.5 text-purple-700"
                aria-hidden="true"
              />
              <span>30-Year Identity &amp; Self-Respect Anchors</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-display">
              Affirmation Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5 max-w-2xl">
              Rehearse the thoughts that the identity of your 30-year achievements thinks. Grounded in your 5 Life Visions and unconditional self-respect in action.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 shrink-0">
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-center">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Reps Today
              </div>
              <div
                data-testid="affirmation-reps-today"
                className="text-base font-bold font-mono tabular-nums text-emerald-700 mt-0.5"
              >
                {stats.totalRepsToday}
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-center">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Conviction
              </div>
              <div className="text-base font-bold font-mono tabular-nums text-blue-700 mt-0.5">
                {stats.avgConviction}/10
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-center">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Total Reps
              </div>
              <div className="text-base font-bold font-mono tabular-nums text-purple-700 mt-0.5">
                {stats.totalLifetimeReps}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Spotlight Affirmation Stage (Solid Slate-900 Surface — Zero Gradients) */}
      {spotlightAffirmation && (
        <div
          data-testid="affirmation-spotlight-stage"
          className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 border border-slate-800 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-wider">
                Active Identity Spotlight
              </span>
              <span className="text-xs text-slate-300 font-medium">
                {
                  IDENTITY_PILLARS.find(
                    (p) => p.id === spotlightAffirmation.identityPillar
                  )?.title
                }
              </span>
            </div>

            <button
              type="button"
              data-testid="cycle-spotlight-affirmation-btn"
              onClick={handleCycleSpotlight}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              <span>Next Identity Anchor</span>
            </button>
          </div>

          <blockquote className="text-lg sm:text-xl font-bold leading-snug text-white font-display border-l-4 border-emerald-500 pl-4 py-1">
            &ldquo;{spotlightAffirmation.statement}&rdquo;
          </blockquote>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
                <Compass className="w-3 h-3" aria-hidden="true" />
                <span>Why This Identity Matters</span>
              </div>
              <p className="text-xs text-slate-200 mt-1">
                {spotlightAffirmation.whyItMatters}
              </p>
            </div>

            <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                <span>Self-Respect Action Proof Today</span>
              </div>
              <p className="text-xs text-slate-200 mt-1">
                {spotlightAffirmation.actionAnchor}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                data-testid="spotlight-practice-rep-btn"
                onClick={() => handlePracticeRep(spotlightAffirmation.id)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Volume2 className="w-4 h-4" aria-hidden="true" />
                <span>
                  Speak &amp; Anchor (+1 Rep · {spotlightAffirmation.repsToday}{' '}
                  Today)
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleToggleRitual(spotlightAffirmation.id, 'morning')
                }
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                  spotlightAffirmation.morningAnchoredToday
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <Sun className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Morning Story</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleToggleRitual(spotlightAffirmation.id, 'evening')
                }
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                  spotlightAffirmation.eveningAnchoredToday
                    ? 'bg-purple-700 text-white border-purple-500'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <Moon className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Evening Seal</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
              <span>Conviction:</span>
              <span className="font-bold text-emerald-400">
                {spotlightAffirmation.convictionScore}/10
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 5 Core 30-Year Identity Archetype Filter Pills */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-purple-700" aria-hidden="true" />
            <span>Filter by 30-Year Identity Vision &amp; Core Philosophy</span>
          </span>
          <span className="text-[11px] text-slate-500">
            {filteredAffirmations.length} affirmations shown
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedPillar('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              selectedPillar === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Identities ({affirmations.length})
          </button>

          {IDENTITY_PILLARS.map((pillar) => {
            const isSelected = selectedPillar === pillar.id;
            return (
              <button
                key={pillar.id}
                type="button"
                data-testid={`affirmation-pillar-filter-${pillar.id}`}
                onClick={() => setSelectedPillar(pillar.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-purple-700 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {pillar.shortTitle}
              </button>
            );
          })}
        </div>
      </div>

      {/* Identity-Linked Affirmation Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredAffirmations.map((item) => {
          const pillarMeta = IDENTITY_PILLARS.find(
            (p) => p.id === item.identityPillar
          );
          const isSpotlight = spotlightAffirmation?.id === item.id;

          return (
            <article
              key={item.id}
              data-testid={`affirmation-card-${item.id}`}
              className={`bg-white border rounded-2xl overflow-hidden flex flex-col justify-between transition-colors ${
                isSpotlight
                  ? 'border-purple-600 ring-1 ring-purple-600'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Solid Top Accent Bar */}
              <div
                className={`h-1.5 w-full ${pillarMeta?.accentBarClass ?? 'bg-emerald-600'}`}
              />

              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                        pillarMeta?.badgeClass ??
                        'bg-emerald-100 text-emerald-900 border-emerald-300'
                      }`}
                    >
                      {pillarMeta?.shortTitle ?? 'Identity'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {item.lifeArea}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSpotlightId(item.id)}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded cursor-pointer transition-colors ${
                          isSpotlight
                            ? 'bg-purple-700 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-purple-50 hover:text-purple-800'
                        }`}
                      >
                        {isSpotlight ? 'In Spotlight' : 'Spotlight'}
                      </button>
                    </div>
                  </div>

                  <p className="text-sm font-bold text-slate-900 leading-snug">
                    &ldquo;{item.statement}&rdquo;
                  </p>

                  <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 space-y-1">
                    <div>
                      <strong className="text-slate-800">Why:</strong>{' '}
                      {item.whyItMatters}
                    </div>
                    <div>
                      <strong className="text-emerald-800">Action Proof:</strong>{' '}
                      {item.actionAnchor}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-2.5">
                  {/* Conviction Level Bar */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-slate-600">
                      Identity Conviction:
                    </span>
                    <div className="flex items-center gap-1">
                      {[2, 4, 6, 8, 10].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => handleAdjustConviction(item.id, lvl)}
                          aria-label={`Set conviction score to ${lvl}`}
                          className={`w-6 h-5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                            item.convictionScore >= lvl
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Card Footer Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handlePracticeRep(item.id)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Flame className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Rep ({item.repsToday})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleRitual(item.id, 'morning')}
                        className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 border transition-colors cursor-pointer ${
                          item.morningAnchoredToday
                            ? 'bg-blue-50 text-blue-800 border-blue-300'
                            : 'bg-white text-slate-500 border-slate-200 hover:text-slate-800'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                        <span>AM</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleRitual(item.id, 'evening')}
                        className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 border transition-colors cursor-pointer ${
                          item.eveningAnchoredToday
                            ? 'bg-purple-50 text-purple-800 border-purple-300'
                            : 'bg-white text-slate-500 border-slate-200 hover:text-slate-800'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                        <span>PM</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteAffirmation(item.id)}
                      aria-label={`Delete affirmation`}
                      className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Create Custom Identity Affirmation Form */}
      <form
        onSubmit={handleAddAffirmation}
        data-testid="add-affirmation-form"
        className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-purple-700" aria-hidden="true" />
            <span>Write a New Identity Affirmation</span>
          </span>
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
            <span>What story did I wake telling myself today?</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          <div className="sm:col-span-6">
            <label htmlFor="affirmation-statement-input" className="sr-only">
              Affirmation statement
            </label>
            <input
              id="affirmation-statement-input"
              data-testid="affirmation-statement-input"
              type="text"
              value={newStatement}
              onChange={(e) => setNewStatement(e.target.value)}
              placeholder="e.g., I am the man who stays calm and decisive when cognitive load rises..."
              className="w-full px-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600"
            />
          </div>

          <div className="sm:col-span-4">
            <label htmlFor="affirmation-pillar-select" className="sr-only">
              30-Year Identity Pillar
            </label>
            <select
              id="affirmation-pillar-select"
              value={newPillar}
              onChange={(e) =>
                setNewPillar(e.target.value as IdentityPillarId)
              }
              className="w-full px-2.5 py-2 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600"
            >
              {IDENTITY_PILLARS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="affirmation-area-select" className="sr-only">
              Life Area
            </label>
            <select
              id="affirmation-area-select"
              value={newLifeArea}
              onChange={(e) => setNewLifeArea(e.target.value as Category)}
              className="w-full px-2.5 py-2 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600"
            >
              {LIFE_AREAS.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          <div className="sm:col-span-5">
            <input
              type="text"
              value={newWhy}
              onChange={(e) => setNewWhy(e.target.value)}
              placeholder="Why this identity matters to my 30-year vision..."
              aria-label="Why this identity matters"
              className="w-full px-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600"
            />
          </div>
          <div className="sm:col-span-5">
            <input
              type="text"
              value={newAnchor}
              onChange={(e) => setNewAnchor(e.target.value)}
              placeholder="Daily self-respect action proof (e.g., 1 bite of the elephant)..."
              aria-label="Daily action proof"
              className="w-full px-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              data-testid="affirmation-add-submit-btn"
              className="w-full h-full min-h-[34px] px-3 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Add Anchor</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
