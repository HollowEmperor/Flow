import React, { useState, useEffect, useMemo } from 'react';
import {
  Brain,
  CheckCircle2,
  Compass,
  HeartHandshake,
  LayoutGrid,
  ListChecks,
  Plus,
  Send,
  ShieldAlert,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react';
import {
  Category,
  LIFE_AREAS,
  Priority,
  TodoItem,
  getTodayIsoDate,
} from '../utils/todoLogic';

export interface SavedReflectionSnapshot {
  id: string;
  dateIso: string;
  lifeArea: Category;
  // Cadence & Decision Systems
  monthlyMatrixUsed: boolean;
  monthlyFocus: string;
  weeklyTherapeuticTask: string;
  dailyMatrixUsed: boolean;
  priankaListSent: boolean;
  decisionsCount: number;
  systemToRemoveDecisions: string;
  // Patterns, Resistance & Comfort-Zone Risks
  caughtPreconditionPattern: boolean; // "I should do this but before that I need..."
  howTackledPattern: string;
  imperfectionCelebrated: string;
  comfortZoneRiskTaken: string;
  riskPositiveImpact: string;
  riskPotentialNegative: string;
  gutHintToday: string;
  expectedGoodThings: 'yes_alhamdulillah' | 'no_reframe';
  expectedGoodThingsReframeNote: string;
  burnoutMoment: string;
  overstimulatedMoment: string;
  // Self-Care & Self-Respect
  didForMyselfToday: string;
  betterHumanAction: string;
  needToEarnSelfLove: 'yes_remind' | 'no_unconditional';
  followedPrePlannedIntentions: boolean;
  answeredMindfully: boolean;
}

const REFLECT_STORAGE_KEY = 'focusflow_reflect_snapshots_v1';

export function getInitialSeedReflections(
  todayIso: string
): SavedReflectionSnapshot[] {
  return [
    {
      id: 'reflect-seed-1',
      dateIso: todayIso,
      lifeArea: 'Personality',
      monthlyMatrixUsed: true,
      monthlyFocus:
        'Eliminate low-leverage context switching and ship core architecture milestones.',
      weeklyTherapeuticTask:
        'Unplugged evening sketching & long walks without audio input.',
      dailyMatrixUsed: true,
      priankaListSent: true,
      decisionsCount: 6,
      systemToRemoveDecisions:
        'Pre-commit tomorrow’s top 3 blocks onto the Side Hourly Calendar before 8 PM and send the list to Prianka.',
      caughtPreconditionPattern: true,
      howTackledPattern:
        'Caught myself saying "Before I start the draft I need to reorganize my notes" — started a 5-minute rough outline immediately instead.',
      imperfectionCelebrated:
        'Shipped the first working draft at 85% polish instead of stalling for perfection.',
      comfortZoneRiskTaken:
        'Presented an unpolished architectural proposal directly to senior peers for candid critique.',
      riskPositiveImpact:
        'Saved 4 days of over-engineering and earned immediate buy-in.',
      riskPotentialNegative:
        'Momentary ego discomfort if a flaw was pointed out.',
      gutHintToday:
        'Felt a nudge to simplify the state model before adding new views.',
      expectedGoodThings: 'yes_alhamdulillah',
      expectedGoodThingsReframeNote:
        'Alhamdulillah — approached the morning expecting constructive breakthroughs.',
      burnoutMoment: 'Brief dip at 3:30 PM after back-to-back technical reviews.',
      overstimulatedMoment:
        'When 4 browser tabs and notifications were open simultaneously.',
      didForMyselfToday:
        '25 minutes of quiet tea and mobility work away from screens.',
      betterHumanAction:
        'Listened patiently and offered clear encouragement to a teammate.',
      needToEarnSelfLove: 'no_unconditional',
      followedPrePlannedIntentions: true,
      answeredMindfully: true,
    },
  ];
}

interface ReflectDashboardProps {
  todos: TodoItem[];
  onOpenEisenhowerMatrix: () => void;
  onAddTaskFromReflection: (params: {
    title: string;
    notes: string;
    priority: Priority;
    category: Category;
    dueDate: string;
    isRepeating: boolean;
  }) => void;
}

export const ReflectDashboard: React.FC<ReflectDashboardProps> = ({
  todos,
  onOpenEisenhowerMatrix,
  onAddTaskFromReflection,
}) => {
  const todayIso = getTodayIsoDate();

  const [snapshots, setSnapshots] = useState<SavedReflectionSnapshot[]>(() => {
    try {
      const raw = localStorage.getItem(REFLECT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return getInitialSeedReflections(todayIso);
  });

  useEffect(() => {
    try {
      localStorage.setItem(REFLECT_STORAGE_KEY, JSON.stringify(snapshots));
    } catch {
      // Ignore storage quota errors
    }
  }, [snapshots]);

  const [activeSectionTab, setActiveSectionTab] = useState<
    'all' | 'cadence' | 'patterns_risk' | 'self_care'
  >('all');

  // Form State for Current Daily / Weekly / Monthly Reflection
  const [lifeArea, setLifeArea] = useState<Category>('Personality');
  const [monthlyMatrixUsed, setMonthlyMatrixUsed] = useState(true);
  const [monthlyFocus, setMonthlyFocus] = useState(
    'Deep Systems Mastery & Zero-Friction Daily Execution'
  );
  const [weeklyTherapeuticTask, setWeeklyTherapeuticTask] = useState(
    '90-minute nature walk + analog notebook synthesis'
  );
  const [dailyMatrixUsed, setDailyMatrixUsed] = useState(true);
  const [priankaListSent, setPriankaListSent] = useState(false);
  const [decisionsCount, setDecisionsCount] = useState(5);
  const [systemToRemoveDecisions, setSystemToRemoveDecisions] = useState(
    'Default morning routine + pre-scheduled Side Hourly Calendar blocks the night before'
  );

  // Patterns, Resistance & Risks
  const [caughtPreconditionPattern, setCaughtPreconditionPattern] =
    useState(true);
  const [howTackledPattern, setHowTackledPattern] = useState(
    'Used the 2-minute rule: started one bite of the elephant before allowing any setup tasks.'
  );
  const [imperfectionCelebrated, setImperfectionCelebrated] = useState(
    'Focused on challenging myself for improvement rather than speedrunning or perfectionism.'
  );
  const [comfortZoneRiskTaken, setComfortZoneRiskTaken] = useState('');
  const [riskPositiveImpact, setRiskPositiveImpact] = useState('');
  const [riskPotentialNegative, setRiskPotentialNegative] = useState('');
  const [gutHintToday, setGutHintToday] = useState('');
  const [expectedGoodThings, setExpectedGoodThings] = useState<
    'yes_alhamdulillah' | 'no_reframe'
  >('yes_alhamdulillah');
  const [expectedGoodThingsReframeNote, setExpectedGoodThingsReframeNote] =
    useState('');
  const [burnoutMoment, setBurnoutMoment] = useState('');
  const [overstimulatedMoment, setOverstimulatedMoment] = useState('');

  // Self-Care & Self-Respect
  const [didForMyselfToday, setDidForMyselfToday] = useState('');
  const [betterHumanAction, setBetterHumanAction] = useState('');
  const [needToEarnSelfLove, setNeedToEarnSelfLove] = useState<
    'yes_remind' | 'no_unconditional'
  >('no_unconditional');
  const [followedPrePlannedIntentions, setFollowedPrePlannedIntentions] =
    useState(true);
  const [answeredMindfully, setAnsweredMindfully] = useState(true);
  const [savedBanner, setSavedBanner] = useState<string | null>(null);

  const activePriorityTasksForPrianka = useMemo(() => {
    return todos.filter((t) => !t.completed).slice(0, 4);
  }, [todos]);

  const triggerSavedBanner = (msg: string) => {
    setSavedBanner(msg);
    window.setTimeout(() => {
      setSavedBanner(null);
    }, 3200);
  };

  const handleSaveReflectionSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    const created: SavedReflectionSnapshot = {
      id: `reflect-${Date.now()}`,
      dateIso: todayIso,
      lifeArea,
      monthlyMatrixUsed,
      monthlyFocus:
        monthlyFocus.trim() || 'Focused execution on core priorities',
      weeklyTherapeuticTask:
        weeklyTherapeuticTask.trim() || 'Restorative creative session',
      dailyMatrixUsed,
      priankaListSent,
      decisionsCount,
      systemToRemoveDecisions:
        systemToRemoveDecisions.trim() ||
        'Automate recurring choices via evening schedule lock',
      caughtPreconditionPattern,
      howTackledPattern:
        howTackledPattern.trim() ||
        'Started immediately with the smallest viable checkpoint.',
      imperfectionCelebrated:
        imperfectionCelebrated.trim() ||
        'Valued progress over perfection today.',
      comfortZoneRiskTaken:
        comfortZoneRiskTaken.trim() ||
        'Stepped into a high-ownership conversation.',
      riskPositiveImpact:
        riskPositiveImpact.trim() ||
        'Built momentum and expanded comfort zone.',
      riskPotentialNegative:
        riskPotentialNegative.trim() || 'Temporary uncertainty.',
      gutHintToday:
        gutHintToday.trim() || 'Prioritize deep work before reactive messages.',
      expectedGoodThings,
      expectedGoodThingsReframeNote:
        expectedGoodThings === 'yes_alhamdulillah'
          ? 'Alhamdulillah — expected good things today.'
          : expectedGoodThingsReframeNote.trim() ||
            'Reframed: past friction is not a reason not to expect good things today.',
      burnoutMoment: burnoutMoment.trim() || 'None — paced energy steadily.',
      overstimulatedMoment:
        overstimulatedMoment.trim() || 'Minimized open tabs and noise.',
      didForMyselfToday:
        didForMyselfToday.trim() || 'Protected time for recovery and reflection.',
      betterHumanAction:
        betterHumanAction.trim() ||
        'Acted with patience, integrity, and presence.',
      needToEarnSelfLove,
      followedPrePlannedIntentions,
      answeredMindfully,
    };

    setSnapshots((prev) => [created, ...prev]);
    triggerSavedBanner('Mindful Reflection Snapshot saved to your log.');
  };

  const handleDeleteSnapshot = (id: string) => {
    setSnapshots((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div data-testid="reflect-dashboard" className="space-y-4">
      {/* Header & KPI Summary Strip */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-700" aria-hidden="true" />
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-display">
                Reflect &amp; Decision Audit
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 max-w-2xl">
              Audit your daily decisions, catch resistance patterns early, review comfort-zone risks, and practice unconditional self-respect.
            </p>
          </div>

          <div className="flex items-center divide-x divide-slate-200 border border-slate-200 rounded-xl bg-slate-50/70 shrink-0">
            <div className="px-3.5 py-2 text-center">
              <div className="text-[11px] font-medium text-slate-500">
                Decisions
              </div>
              <div
                data-testid="reflect-decisions-count"
                className="text-base font-bold font-mono tabular-nums text-blue-700 mt-0.5"
              >
                {decisionsCount}
              </div>
            </div>
            <div className="px-3.5 py-2 text-center">
              <div className="text-[11px] font-medium text-slate-500">
                Prianka List
              </div>
              <div className="text-base font-bold font-mono tabular-nums text-emerald-700 mt-0.5">
                {priankaListSent ? 'Sent' : 'Pending'}
              </div>
            </div>
            <div className="px-3.5 py-2 text-center">
              <div className="text-[11px] font-medium text-slate-500">
                Snapshots
              </div>
              <div className="text-base font-bold font-mono tabular-nums text-purple-700 mt-0.5">
                {snapshots.length}
              </div>
            </div>
          </div>
        </div>

        {/* Section Filter Bar */}
        <div
          role="tablist"
          aria-label="Reflection dashboard sections"
          className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-100 p-1 rounded-xl"
        >
          {(
            [
              {
                id: 'all',
                label: 'All Reflection Pillars',
                activeClass: 'bg-slate-900 text-white',
              },
              {
                id: 'cadence',
                label: '1. Monthly · Weekly · Daily',
                activeClass: 'bg-blue-600 text-white',
              },
              {
                id: 'patterns_risk',
                label: '2. Patterns · Risks · Gut',
                activeClass: 'bg-purple-700 text-white',
              },
              {
                id: 'self_care',
                label: '3. Self-Care & Self-Respect',
                activeClass: 'bg-emerald-600 text-white',
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeSectionTab === tab.id}
              data-testid={`reflect-tab-${tab.id}`}
              onClick={() => setActiveSectionTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeSectionTab === tab.id
                  ? tab.activeClass
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {savedBanner && (
        <div
          role="status"
          data-testid="reflect-saved-banner"
          className="bg-emerald-600 text-white rounded-xl px-4 py-2.5 text-xs font-bold flex items-center justify-between"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            <span>{savedBanner}</span>
          </span>
          <span className="font-mono text-[11px]">{todayIso}</span>
        </div>
      )}

      <form onSubmit={handleSaveReflectionSnapshot} className="space-y-4">
        {/* PILLAR 1: MONTHLY, WEEKLY & DAILY CADENCE + DECISION SYSTEMS */}
        {(activeSectionTab === 'all' || activeSectionTab === 'cadence') && (
          <section
            aria-label="Monthly, Weekly, and Daily Decision Systems"
            data-testid="reflect-pillar-cadence"
            className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
          >
            <div className="bg-blue-600 text-white px-5 py-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4" aria-hidden="true" />
                <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider font-display">
                  1. Monthly · Weekly · Daily Decision &amp; System Reflection
                </h2>
              </div>

              <button
                type="button"
                onClick={onOpenEisenhowerMatrix}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
              >
                <LayoutGrid className="w-3 h-3" aria-hidden="true" />
                <span>Open Matrix to Cut Things Out</span>
              </button>
            </div>

            <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Monthly & Weekly Focus */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    Monthly: Have I used the Matrix to cut things out?
                  </span>
                  <div className="flex items-center gap-1">
                    {(['Yes', 'No'] as const).map((opt) => {
                      const active =
                        (opt === 'Yes' && monthlyMatrixUsed) ||
                        (opt === 'No' && !monthlyMatrixUsed);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setMonthlyMatrixUsed(opt === 'Yes')}
                          className={`px-2.5 py-1 rounded-md text-xs font-bold cursor-pointer ${
                            active
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border border-slate-200 text-slate-600'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    What is this month&apos;s Focus?
                  </label>
                  <input
                    type="text"
                    value={monthlyFocus}
                    onChange={(e) => setMonthlyFocus(e.target.value)}
                    placeholder="This month's single needle-moving focus..."
                    className="w-full px-3 py-1.5 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-600">
                      Weekly: What is my therapeutic task for the next 2 weeks?
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (!weeklyTherapeuticTask.trim()) return;
                        onAddTaskFromReflection({
                          title: `[Therapeutic] ${weeklyTherapeuticTask.trim()}`,
                          notes:
                            '2-Week Therapeutic Task pushed from Reflect Dashboard',
                          priority: 'medium',
                          category: 'Karma',
                          dueDate: todayIso,
                          isRepeating: false,
                        });
                        triggerSavedBanner(
                          'Therapeutic task added to your active Tasks!'
                        );
                      }}
                      className="text-[10px] font-bold text-emerald-700 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Push to Tasks</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={weeklyTherapeuticTask}
                    onChange={(e) => setWeeklyTherapeuticTask(e.target.value)}
                    placeholder="e.g., Restorative woodworking, long walk, painting..."
                    className="w-full px-3 py-1.5 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Daily: Prianka List + Decisions Counter + System Builder */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    Daily: Have I used the Matrix to cut things out?
                  </span>
                  <div className="flex items-center gap-1">
                    {(['Yes', 'No'] as const).map((opt) => {
                      const active =
                        (opt === 'Yes' && dailyMatrixUsed) ||
                        (opt === 'No' && !dailyMatrixUsed);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setDailyMatrixUsed(opt === 'Yes')}
                          className={`px-2.5 py-1 rounded-md text-xs font-bold cursor-pointer ${
                            active
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white border border-slate-200 text-slate-600'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Did Prianka get my tomorrow's list yet? */}
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      Did Prianka get my tomorrow&apos;s list yet?
                    </span>
                    <button
                      type="button"
                      data-testid="toggle-prianka-list-btn"
                      onClick={() => setPriankaListSent((prev) => !prev)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                        priankaListSent
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-800'
                      }`}
                    >
                      <Send className="w-3 h-3" aria-hidden="true" />
                      <span>{priankaListSent ? 'Yes — Sent' : 'Mark Sent'}</span>
                    </button>
                  </div>
                  {activePriorityTasksForPrianka.length > 0 && (
                    <div className="text-[11px] text-slate-500 font-mono truncate">
                      Tomorrow&apos;s Queue:{' '}
                      {activePriorityTasksForPrianka
                        .map((t) => t.title)
                        .join(' · ')}
                    </div>
                  )}
                </div>

                {/* How many decisions did I have to make today? */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-700">
                    How many decisions did I have to make today?
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setDecisionsCount((c) => Math.max(0, c - 1))
                      }
                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 font-bold text-slate-700 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-mono text-xs font-bold text-blue-700">
                      {decisionsCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDecisionsCount((c) => c + 1)}
                      className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    What systems can I build to remove these decisions?
                  </label>
                  <input
                    type="text"
                    value={systemToRemoveDecisions}
                    onChange={(e) => setSystemToRemoveDecisions(e.target.value)}
                    placeholder="e.g., Fixed morning block + automated checklist..."
                    className="w-full px-3 py-1.5 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* PILLAR 2: PATTERNS, RESISTANCE, COMFORT-ZONE RISKS & GUT INTUITION */}
        {(activeSectionTab === 'all' ||
          activeSectionTab === 'patterns_risk') && (
          <section
            aria-label="Patterns, Comfort-Zone Risks, and Optimism"
            data-testid="reflect-pillar-patterns"
            className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
          >
            <div className="bg-purple-700 text-white px-5 py-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" aria-hidden="true" />
                <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider font-display">
                  2. Pattern Catcher · Comfort-Zone Risks · Alhamdulillah Optimism
                </h2>
              </div>
              <span className="text-[11px] text-purple-200 font-mono">
                &ldquo;One bite at a time&rdquo;
              </span>
            </div>

            <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Precondition Pattern & Task Resistance */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="p-3 rounded-xl bg-purple-950 text-white space-y-2">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">
                    Target Procrastination Pattern
                  </div>
                  <div className="text-xs sm:text-sm font-bold font-display">
                    &ldquo;I should do this, but before that I need…….&rdquo;
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-purple-200">
                      Have I caught this pattern today?
                    </span>
                    <div className="flex items-center gap-1">
                      {(['Yes', 'No'] as const).map((opt) => {
                        const active =
                          (opt === 'Yes' && caughtPreconditionPattern) ||
                          (opt === 'No' && !caughtPreconditionPattern);
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() =>
                              setCaughtPreconditionPattern(opt === 'Yes')
                            }
                            className={`px-2.5 py-0.5 rounded text-xs font-bold cursor-pointer ${
                              active
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-purple-900 text-purple-200'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    How did I tackle this pattern today?
                  </label>
                  <input
                    type="text"
                    value={howTackledPattern}
                    onChange={(e) => setHowTackledPattern(e.target.value)}
                    placeholder="How did you bypass the precondition excuse?"
                    className="w-full px-3 py-1.5 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    What imperfection can I celebrate today? (Letting go of perfectionism)
                  </label>
                  <input
                    type="text"
                    value={imperfectionCelebrated}
                    onChange={(e) => setImperfectionCelebrated(e.target.value)}
                    placeholder="Did I challenge myself for improvement instead of speedrunning?"
                    className="w-full px-3 py-1.5 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      When did I feel burnt out?
                    </label>
                    <input
                      type="text"
                      value={burnoutMoment}
                      onChange={(e) => setBurnoutMoment(e.target.value)}
                      placeholder="Time / trigger..."
                      className="w-full px-2.5 py-1.5 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-purple-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      When did I feel overstimulated?
                    </label>
                    <input
                      type="text"
                      value={overstimulatedMoment}
                      onChange={(e) => setOverstimulatedMoment(e.target.value)}
                      placeholder="Environment / noise..."
                      className="w-full px-2.5 py-1.5 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-purple-600"
                    />
                  </div>
                </div>
              </div>

              {/* Comfort-Zone Risks, Gut Hints & Expecting Good Things */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Where did I find risks today? (Going out of my comfort zone)
                  </label>
                  <input
                    type="text"
                    value={comfortZoneRiskTaken}
                    onChange={(e) => setComfortZoneRiskTaken(e.target.value)}
                    placeholder="What comfort-zone risk did you take today?"
                    className="w-full px-3 py-1.5 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-800 mb-1">
                      Positive that happened from risk
                    </label>
                    <input
                      type="text"
                      value={riskPositiveImpact}
                      onChange={(e) => setRiskPositiveImpact(e.target.value)}
                      placeholder="Positive impact..."
                      className="w-full px-2.5 py-1.5 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Negative that could have happened
                    </label>
                    <input
                      type="text"
                      value={riskPotentialNegative}
                      onChange={(e) => setRiskPotentialNegative(e.target.value)}
                      placeholder="Worst case vs reality..."
                      className="w-full px-2.5 py-1.5 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-purple-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Did my gut give any hints about anything today?
                  </label>
                  <input
                    type="text"
                    value={gutHintToday}
                    onChange={(e) => setGutHintToday(e.target.value)}
                    placeholder="Intuitive signal or blessing noticed around me..."
                    className="w-full px-3 py-1.5 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-purple-600"
                  />
                </div>

                {/* Did I expect good things today? */}
                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-2">
                  <span className="block text-xs font-bold text-slate-900">
                    Did I expect good things today?
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setExpectedGoodThings('yes_alhamdulillah')
                      }
                      className={`py-1.5 px-2.5 rounded-lg text-xs font-bold text-left transition-colors cursor-pointer ${
                        expectedGoodThings === 'yes_alhamdulillah'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      ✓ Yes | Alhamdulillah
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpectedGoodThings('no_reframe')}
                      className={`py-1.5 px-2.5 rounded-lg text-xs font-bold text-left transition-colors cursor-pointer ${
                        expectedGoodThings === 'no_reframe'
                          ? 'bg-purple-700 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      No | Why not? Reframe now
                    </button>
                  </div>

                  {expectedGoodThings === 'no_reframe' && (
                    <input
                      type="text"
                      value={expectedGoodThingsReframeNote}
                      onChange={(e) =>
                        setExpectedGoodThingsReframeNote(e.target.value)
                      }
                      placeholder="Why not? Is that a reason not to expect good things?"
                      className="w-full px-2.5 py-1.5 text-xs text-slate-900 bg-slate-50 border border-purple-300 rounded-lg focus:outline-none"
                    />
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* PILLAR 3: SELF-CARE & UNCONDITIONAL SELF-RESPECT */}
        {(activeSectionTab === 'all' || activeSectionTab === 'self_care') && (
          <section
            aria-label="Self-Care and Unconditional Self-Respect"
            data-testid="reflect-pillar-self-care"
            className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
          >
            <div className="bg-emerald-600 text-white px-5 py-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-4 h-4" aria-hidden="true" />
                <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider font-display">
                  3. Self-Care &amp; Unconditional Self-Respect Check-In
                </h2>
              </div>
              <span className="text-[11px] text-emerald-100 font-mono">
                &ldquo;Discipline is a form of self-respect in action&rdquo;
              </span>
            </div>

            <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    What did I do today for myself?
                  </label>
                  <input
                    type="text"
                    data-testid="reflect-did-for-myself-input"
                    value={didForMyselfToday}
                    onChange={(e) => setDidForMyselfToday(e.target.value)}
                    placeholder="Rest, nourishment, boundaries, or stillness..."
                    className="w-full px-3 py-1.5 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    What did I do today that made me feel like a better human being?
                  </label>
                  <input
                    type="text"
                    value={betterHumanAction}
                    onChange={(e) => setBetterHumanAction(e.target.value)}
                    placeholder="Kindness, honesty, service, or patience..."
                    className="w-full px-3 py-1.5 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-xs font-semibold text-slate-700">
                    Connected Life Area:
                  </span>
                  <select
                    value={lifeArea}
                    onChange={(e) => setLifeArea(e.target.value as Category)}
                    className="px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg"
                  >
                    {LIFE_AREAS.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                {/* Do I feel the need to do more to earn my love for myself? */}
                <div className="space-y-1.5">
                  <span className="block text-xs font-bold text-slate-900">
                    Do I feel the need to do more to earn my love for myself?
                  </span>
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => setNeedToEarnSelfLove('yes_remind')}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold text-left transition-colors cursor-pointer ${
                        needToEarnSelfLove === 'yes_remind'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      [Yes] → I don’t need to earn it. I already deserve it from myself.
                    </button>
                    <button
                      type="button"
                      onClick={() => setNeedToEarnSelfLove('no_unconditional')}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold text-left transition-colors cursor-pointer ${
                        needToEarnSelfLove === 'no_unconditional'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      [No] → I already love myself unconditionally.
                    </button>
                  </div>
                </div>

                {/* Did I show myself respect in actions by following through my pre-planned intentions? */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-xs font-semibold text-slate-800">
                    Did I show myself respect by following through on pre-planned intentions?
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setFollowedPrePlannedIntentions((prev) => !prev)
                    }
                    className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer shrink-0 ${
                      followedPrePlannedIntentions
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {followedPrePlannedIntentions ? 'Yes' : 'Not Fully'}
                  </button>
                </div>

                {/* Did I answer everything mindfully? */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-800">
                    Did I answer everything mindfully?
                  </span>
                  <button
                    type="button"
                    onClick={() => setAnsweredMindfully((prev) => !prev)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer shrink-0 ${
                      answeredMindfully
                        ? 'bg-purple-700 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {answeredMindfully ? 'Yes — Mindfully' : 'No'}
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Save Reflection Snapshot Footer Bar */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            <span className="text-xs sm:text-sm font-semibold">
              Lock in today&apos;s reflection snapshot to track your patterns and self-respect over time.
            </span>
          </div>

          <button
            type="submit"
            data-testid="save-reflection-snapshot-btn"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ListChecks className="w-4 h-4" aria-hidden="true" />
            <span>Save Today&apos;s Reflection Snapshot</span>
          </button>
        </div>
      </form>

      {/* Saved Reflections History Log */}
      <section
        aria-label="Saved Reflection Snapshots"
        className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
      >
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider font-display">
              Saved Reflection Log ({snapshots.length})
            </h2>
          </div>
          <span className="text-[11px] text-slate-300 font-mono">
            Systems · Patterns · Self-Respect
          </span>
        </div>

        <div className="divide-y divide-slate-200">
          {snapshots.map((snap) => (
            <article
              key={snap.id}
              data-testid={`reflection-snapshot-card-${snap.id}`}
              className="p-4 sm:p-5 space-y-3 hover:bg-slate-50/70 transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-slate-900 text-white">
                    {snap.dateIso}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-900">
                    {snap.lifeArea}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-900">
                    {snap.decisionsCount} Decisions Audited
                  </span>
                  {snap.expectedGoodThings === 'yes_alhamdulillah' && (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900">
                      Alhamdulillah · Expected Good Things
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteSnapshot(snap.id)}
                  aria-label="Delete reflection snapshot"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-bold text-blue-800 uppercase text-[10px]">
                    System Built &amp; Focus
                  </div>
                  <p className="text-slate-800">
                    <strong>Focus:</strong> {snap.monthlyFocus}
                  </p>
                  <p className="text-slate-600">
                    <strong>System:</strong> {snap.systemToRemoveDecisions}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-bold text-purple-800 uppercase text-[10px]">
                    Pattern &amp; Comfort-Zone Risk
                  </div>
                  <p className="text-slate-800">
                    <strong>Pattern Tackled:</strong> {snap.howTackledPattern}
                  </p>
                  <p className="text-slate-600">
                    <strong>Risk Impact:</strong> {snap.riskPositiveImpact}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-bold text-emerald-800 uppercase text-[10px]">
                    Self-Care &amp; Self-Respect
                  </div>
                  <p className="text-slate-800">
                    <strong>For Myself:</strong> {snap.didForMyselfToday}
                  </p>
                  <p className="text-slate-600">
                    <strong>Better Human:</strong> {snap.betterHumanAction}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
