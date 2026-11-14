import React, { useState, useEffect } from 'react';
import {
  Check,
  ChevronRight,
  Compass,
  HelpCircle,
  Plus,
  Sparkles,
  Quote,
  Award,
  BookOpenCheck,
  Layers,
} from 'lucide-react';
import {
  GOAL_HORIZONS,
  GOAL_HORIZON_PROMPTS,
  GoalHorizonKey,
  TopicGoalRoadmap,
  TopicItem,
  computeRoadmapCompletionStats,
  computeTopicProgressPercent,
} from '../utils/todoLogic';
import {
  INITIAL_THIRTY_YEAR_VISIONS,
  ThirtyYearVisionItem,
  GOAL_SETTING_MASTERY_QUESTIONS,
  CORE_PHILOSOPHY_QUOTES,
} from '../utils/promptQuestionsData';

interface GoalPlannerProps {
  topics: TopicItem[];
  roadmaps: TopicGoalRoadmap[];
  activeTopicId?: string | null;
  onSelectTopic?: (topicId: string) => void;
  onUpdateHorizonAnswer: (
    topicId: string,
    horizon: GoalHorizonKey,
    answer: string
  ) => void;
  onToggleHorizonCompleted: (topicId: string, horizon: GoalHorizonKey) => void;
  onPushHorizonToTodo: (
    title: string,
    notes: string,
    topic: TopicItem
  ) => void;
  onOpenTopicDetail: (topicId: string) => void;
}

const VISIONS_STORAGE_KEY = 'focusflow_30y_visions_v1';
const MASTERY_STORAGE_KEY = 'focusflow_goal_mastery_answers_v1';

interface GoalMasteryTopicState {
  canMasterChoice: 'yes' | 'no' | null;
  canMasterWhy: string;
  answers: Record<string, string>;
}

export const GoalPlanner: React.FC<GoalPlannerProps> = ({
  topics,
  roadmaps,
  activeTopicId,
  onSelectTopic,
  onUpdateHorizonAnswer,
  onToggleHorizonCompleted,
  onPushHorizonToTodo,
  onOpenTopicDetail,
}) => {
  const [localTopicId, setLocalTopicId] = useState<string>(
    topics[0]?.id ?? ''
  );
  const selectedTopicId = activeTopicId || localTopicId;
  const setSelectedTopicId = (id: string) => {
    setLocalTopicId(id);
    if (onSelectTopic) onSelectTopic(id);
  };

  const [activeGoalSubTab, setActiveGoalSubTab] = useState<
    'horizons' | 'life_goals_30y' | 'mastery_31_prompts'
  >('horizons');
  const [wizardMode, setWizardMode] = useState(false);
  const [wizardStepIndex, setWizardStepIndex] = useState(0);
  const [pushedFeedback, setPushedFeedback] = useState<string | null>(null);

  // 30-Year Life Goals State (5 Archetypes + 2 Milestones per Vision for next 12 months)
  const [canPutVisionsIntoSystem, setCanPutVisionsIntoSystem] = useState<
    Record<string, 'yes_implement' | 'no_break_down'>
  >({});

  const [thirtyYearVisions, setThirtyYearVisions] = useState<
    ThirtyYearVisionItem[]
  >(() => {
    try {
      const saved = localStorage.getItem(VISIONS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_THIRTY_YEAR_VISIONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        VISIONS_STORAGE_KEY,
        JSON.stringify(thirtyYearVisions)
      );
    } catch {
      // ignore
    }
  }, [thirtyYearVisions]);

  // 31 Goal Setting Mastery Answers per Topic
  const [masteryByTopic, setMasteryByTopic] = useState<
    Record<string, GoalMasteryTopicState>
  >(() => {
    try {
      const saved = localStorage.getItem(MASTERY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        MASTERY_STORAGE_KEY,
        JSON.stringify(masteryByTopic)
      );
    } catch {
      // ignore
    }
  }, [masteryByTopic]);

  const activeTopic =
    topics.find((t) => t.id === selectedTopicId) ?? topics[0] ?? null;

  const activeRoadmap = activeTopic
    ? roadmaps.find((r) => r.topicId === activeTopic.id) ?? null
    : null;

  if (!activeTopic || !activeRoadmap) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
        <p className="text-sm text-slate-600">
          Create a topic in the Topic Dashboard first to build its multi-horizon
          goal roadmap.
        </p>
      </div>
    );
  }

  const topicProgressPct = computeTopicProgressPercent(activeTopic);
  const roadmapStats = computeRoadmapCompletionStats(activeRoadmap);
  const currentWizardKey = GOAL_HORIZONS[wizardStepIndex] ?? '5_year';
  const currentWizardConfig = GOAL_HORIZON_PROMPTS[currentWizardKey];
  const currentWizardStep = activeRoadmap.steps[currentWizardKey];

  const currentTopicMastery: GoalMasteryTopicState = masteryByTopic[
    activeTopic.id
  ] ?? {
    canMasterChoice: 'yes',
    canMasterWhy: '',
    answers: {},
  };

  const updateTopicMastery = (
    updater: (prev: GoalMasteryTopicState) => GoalMasteryTopicState
  ) => {
    setMasteryByTopic((prev) => ({
      ...prev,
      [activeTopic.id]: updater(
        prev[activeTopic.id] ?? {
          canMasterChoice: 'yes',
          canMasterWhy: '',
          answers: {},
        }
      ),
    }));
  };

  const handlePushToTasks = (horizonKey: GoalHorizonKey) => {
    const step = activeRoadmap.steps[horizonKey];
    const config = GOAL_HORIZON_PROMPTS[horizonKey];
    if (!step.answer.trim()) return;
    onPushHorizonToTodo(
      step.answer,
      `${config.label} (${activeTopic.title} · ${activeTopic.lifeArea})`,
      activeTopic
    );
    setPushedFeedback(
      `Added "${step.answer}" from ${config.label} to Today's Todo List`
    );
    window.setTimeout(() => setPushedFeedback(null), 3200);
  };

  const handlePushCustomGoalItemToTasks = (title: string, notes: string) => {
    if (!title.trim()) return;
    onPushHorizonToTodo(title.trim(), notes, activeTopic);
    setPushedFeedback(`Added "${title.trim()}" to Today's Todo List`);
    window.setTimeout(() => setPushedFeedback(null), 3200);
  };

  const handleUpdateVision = (
    visionId: string,
    updater: (v: ThirtyYearVisionItem) => ThirtyYearVisionItem
  ) => {
    setThirtyYearVisions((prev) =>
      prev.map((v) => (v.id === visionId ? updater(v) : v))
    );
  };

  const answeredMasteryCount = Object.values(
    currentTopicMastery.answers
  ).filter((val) => val && val.trim().length > 0).length;

  return (
    <div
      className="@container space-y-4 @sm:space-y-5"
      data-testid="goal-planner-view"
    >
      {/* Core Philosophy Quotes Strip (Solid Slate + Green · Blue · Purple Accents) */}
      <div
        data-testid="goal-philosophy-quotes"
        className="bg-slate-900 text-white rounded-xl p-3.5 border border-slate-800 grid grid-cols-1 @xl:grid-cols-3 gap-2.5"
      >
        {CORE_PHILOSOPHY_QUOTES.map((quote, idx) => (
          <div
            key={idx}
            className="bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-2 flex items-start gap-2"
          >
            <Quote
              className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                idx === 0
                  ? 'text-emerald-400'
                  : idx === 1
                    ? 'text-blue-400'
                    : 'text-purple-400'
              }`}
              aria-hidden="true"
            />
            <p className="text-[11px] font-medium text-slate-100 italic leading-snug">
              &ldquo;{quote}&rdquo;
            </p>
          </div>
        ))}
      </div>

      {/* Header & Sub-Navigation Switcher */}
      <div className="flex flex-col @sm:flex-row @sm:items-center justify-between gap-2.5">
        <div>
          <h1 className="text-lg @sm:text-2xl font-bold tracking-tight text-slate-900 font-display">
            Life Vision &amp; Goal Mastery System
          </h1>
          <p className="text-xs @sm:text-sm text-slate-600 mt-0.5">
            From <strong>30-Year Identity Archetypes</strong> &amp;{' '}
            <strong>5Y→1W Horizon Funnel</strong> to the{' '}
            <strong>31 Goal-Setting Mastery Prompts</strong>.
          </p>
        </div>

        {activeGoalSubTab === 'horizons' && (
          <button
            type="button"
            onClick={() => {
              setWizardMode((prev) => !prev);
              setWizardStepIndex(0);
            }}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 self-start @sm:self-auto cursor-pointer ${
              wizardMode
                ? 'bg-slate-900 text-white'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>
              {wizardMode ? 'Exit Guided Prompt Wizard' : 'Guided Prompt Wizard'}
            </span>
          </button>
        )}
      </div>

      {/* 3-Mode Goal System Switcher (Solid Blue · Green · Purple) */}
      <div
        role="tablist"
        aria-label="Goal system sections"
        className="bg-white border border-slate-200 rounded-xl p-1.5 grid grid-cols-1 @md:grid-cols-3 gap-1.5"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeGoalSubTab === 'horizons'}
          data-testid="goal-subtab-horizons"
          onClick={() => setActiveGoalSubTab('horizons')}
          className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            activeGoalSubTab === 'horizons'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-700 hover:bg-blue-50'
          }`}
        >
          <Layers className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>1. 6-Horizon Funnel (5Y → 1W)</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeGoalSubTab === 'life_goals_30y'}
          data-testid="goal-subtab-30y-visions"
          onClick={() => setActiveGoalSubTab('life_goals_30y')}
          className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            activeGoalSubTab === 'life_goals_30y'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'text-slate-700 hover:bg-emerald-50'
          }`}
        >
          <Award className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>2. 30-Year Life Goals (5 Identities)</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeGoalSubTab === 'mastery_31_prompts'}
          data-testid="goal-subtab-31-mastery"
          onClick={() => setActiveGoalSubTab('mastery_31_prompts')}
          className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            activeGoalSubTab === 'mastery_31_prompts'
              ? 'bg-purple-700 text-white shadow-2xs'
              : 'text-slate-700 hover:bg-purple-50'
          }`}
        >
          <BookOpenCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>
            3. Goal Mastery Deep-Dive ({answeredMasteryCount}/
            {GOAL_SETTING_MASTERY_QUESTIONS.length})
          </span>
        </button>
      </div>

      {pushedFeedback && (
        <div
          role="status"
          aria-live="polite"
          className="px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 flex items-center justify-between"
        >
          <span>{pushedFeedback}</span>
          <span className="font-mono">→ Added to Tasks</span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUBTAB 2: 30-YEAR LIFE GOALS (5 THINGS TO BE TRUE + 12-MO MILESTONES) */}
      {/* ===================================================================== */}
      {activeGoalSubTab === 'life_goals_30y' && (
        <section
          data-testid="thirty-year-life-goals-section"
          className="space-y-4"
        >
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
              30-Year Horizon · 5 Core Archetypes
            </span>
            <h2 className="text-base font-bold text-slate-900 font-display">
              What are the 5 things I want to be true about me in the next 30
              years?
            </h2>
            <p className="text-xs text-slate-600">
              For each identity, decide: <strong>Can I put these into the goal setting system?</strong>{' '}
              (<code>[ ] Yes | Then implement</code> or{' '}
              <code>[ ] No | then break them down further</code>) and define{' '}
              <strong>2 milestones per vision for the next 12 months [each month&apos;s focus]</strong>.
            </p>
          </div>

          <div className="space-y-3.5">
            {thirtyYearVisions.map((vision, idx) => {
              const systemChoice =
                canPutVisionsIntoSystem[vision.id] ?? 'yes_implement';
              return (
                <div
                  key={vision.id}
                  data-testid={`thirty-year-vision-card-${vision.id}`}
                  className="bg-white border border-slate-200 rounded-xl p-4 space-y-3.5 shadow-2xs"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-slate-900 text-white text-xs font-mono font-bold flex items-center justify-center">
                          0{idx + 1}
                        </span>
                        <h3 className="text-sm @sm:text-base font-bold text-slate-900 font-display">
                          {vision.archetypeTitle}
                        </h3>
                      </div>
                    </div>

                    {/* Can I put these into the goal setting system? */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-slate-600 mr-1">
                        Can I put this into the goal setting system?
                      </span>
                      <button
                        type="button"
                        data-testid={`vision-system-yes-${vision.id}`}
                        onClick={() =>
                          setCanPutVisionsIntoSystem((prev) => ({
                            ...prev,
                            [vision.id]: 'yes_implement',
                          }))
                        }
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                          systemChoice === 'yes_implement'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        [ {systemChoice === 'yes_implement' ? '✓' : ' '} ] Yes | Then implement
                      </button>
                      <button
                        type="button"
                        data-testid={`vision-system-no-${vision.id}`}
                        onClick={() =>
                          setCanPutVisionsIntoSystem((prev) => ({
                            ...prev,
                            [vision.id]: 'no_break_down',
                          }))
                        }
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                          systemChoice === 'no_break_down'
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        [ {systemChoice === 'no_break_down' ? '✓' : ' '} ] No | break down further
                      </button>
                    </div>
                  </div>

                  {/* If No | then break them down further */}
                  {systemChoice === 'no_break_down' && (
                    <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3 space-y-1.5">
                      <label className="block text-[11px] font-bold text-amber-950">
                        Breakdown Notes (Deconstruct into smaller atomic skills before putting into system):
                      </label>
                      <input
                        type="text"
                        value={vision.breakdownNotes}
                        onChange={(e) =>
                          handleUpdateVision(vision.id, (v) => ({
                            ...v,
                            breakdownNotes: e.target.value,
                          }))
                        }
                        placeholder="Break this 30-year identity down into smaller sub-skills..."
                        className="w-full text-xs bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-slate-900"
                      />
                    </div>
                  )}

                  {/* 2 Milestones per vision for the next 12 months [each month's focus] */}
                  <div className="grid grid-cols-1 @lg:grid-cols-2 gap-3 pt-1">
                    {/* Milestone 1 */}
                    <div className="bg-slate-50 border border-slate-200/90 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-slate-700">
                          12-Month Milestone #1
                        </span>
                        <input
                          type="text"
                          value={vision.milestone1MonthLabel}
                          onChange={(e) =>
                            handleUpdateVision(vision.id, (v) => ({
                              ...v,
                              milestone1MonthLabel: e.target.value,
                            }))
                          }
                          aria-label={`${vision.archetypeTitle} Milestone 1 Month Focus`}
                          className="text-[11px] font-mono font-semibold bg-white border border-slate-200 rounded px-2 py-0.5 text-emerald-800 w-44"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={vision.milestone1Text}
                          onChange={(e) =>
                            handleUpdateVision(vision.id, (v) => ({
                              ...v,
                              milestone1Text: e.target.value,
                            }))
                          }
                          placeholder="First 6-month milestone..."
                          className="flex-1 text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handlePushCustomGoalItemToTasks(
                              vision.milestone1Text,
                              `30Y Vision (${vision.archetypeTitle}) · ${vision.milestone1MonthLabel}`
                            )
                          }
                          title="Push milestone to Today's Tasks"
                          className="px-2 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-semibold shrink-0 cursor-pointer"
                        >
                          + Task
                        </button>
                      </div>
                    </div>

                    {/* Milestone 2 */}
                    <div className="bg-slate-50 border border-slate-200/90 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-slate-700">
                          12-Month Milestone #2
                        </span>
                        <input
                          type="text"
                          value={vision.milestone2MonthLabel}
                          onChange={(e) =>
                            handleUpdateVision(vision.id, (v) => ({
                              ...v,
                              milestone2MonthLabel: e.target.value,
                            }))
                          }
                          aria-label={`${vision.archetypeTitle} Milestone 2 Month Focus`}
                          className="text-[11px] font-mono font-semibold bg-white border border-slate-200 rounded px-2 py-0.5 text-emerald-800 w-44"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={vision.milestone2Text}
                          onChange={(e) =>
                            handleUpdateVision(vision.id, (v) => ({
                              ...v,
                              milestone2Text: e.target.value,
                            }))
                          }
                          placeholder="Second 6-month milestone..."
                          className="flex-1 text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handlePushCustomGoalItemToTasks(
                              vision.milestone2Text,
                              `30Y Vision (${vision.archetypeTitle}) · ${vision.milestone2MonthLabel}`
                            )
                          }
                          title="Push milestone to Today's Tasks"
                          className="px-2 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-semibold shrink-0 cursor-pointer"
                        >
                          + Task
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ===================================================================== */}
      {/* SUBTAB 1 & 3 SHARED TOPIC SELECTOR & PROGRESS BAR                     */}
      {/* ===================================================================== */}
      {activeGoalSubTab !== 'life_goals_30y' && (
        <>
          <div
            role="group"
            aria-label="Select topic for goal roadmap"
            className="bg-white border border-slate-200 rounded-xl p-2 flex flex-wrap items-center gap-1.5"
          >
            {topics.map((topic) => {
              const isSelected = topic.id === activeTopic.id;
              const pct = computeTopicProgressPercent(topic);
              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => setSelectedTopicId(topic.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate max-w-[180px]">{topic.title}</span>
                  <span
                    className={`font-mono tabular-nums text-[11px] ${
                      isSelected ? 'text-emerald-300' : 'text-slate-400'
                    }`}
                  >
                    {pct}%
                  </span>
                </button>
              );
            })}
          </div>

          {/* Connected Topic Progress Bar Banner */}
          <section
            aria-label="Connected Topic Goal Progress"
            className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-2.5">
              <div className="min-w-[200px] flex-1">
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                  <Compass
                    className="w-3.5 h-3.5 text-emerald-600 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="font-semibold text-emerald-700">
                    {activeTopic.lifeArea}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>Connected Topic Goal Progress</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    {roadmapStats.completedHorizons}/
                    {roadmapStats.totalHorizons} horizons achieved
                  </span>
                </div>
                <h2 className="mt-1 text-sm sm:text-base font-bold text-slate-900 font-display">
                  {activeTopic.title} — {activeTopic.goalLabel}
                </h2>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <span
                  data-testid="goal-connected-topic-progress"
                  className="text-xs font-mono tabular-nums font-bold text-slate-900"
                >
                  {activeTopic.currentUnits} / {activeTopic.targetUnits}{' '}
                  {activeTopic.unitName} ({topicProgressPct}%)
                </span>
                <button
                  type="button"
                  onClick={() => onOpenTopicDetail(activeTopic.id)}
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Open Topic</span>
                  <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div
              className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={topicProgressPct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full bg-emerald-600 transition-transform duration-200 origin-left"
                style={{ transform: `scaleX(${topicProgressPct / 100})` }}
              />
            </div>
          </section>
        </>
      )}

      {/* ===================================================================== */}
      {/* SUBTAB 3: 31 GOAL-SETTING MASTERY DEEP-DIVE QUESTIONS                 */}
      {/* ===================================================================== */}
      {activeGoalSubTab === 'mastery_31_prompts' && (
        <section
          data-testid="goal-mastery-31-questions-section"
          className="space-y-4"
        >
          {/* Lead Question: Do I think I can master it? [] Yes | why? [] No | why? */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">
                  Goal Setting Foundation Gate
                </span>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-1">
                  Do I think I can master &ldquo;{activeTopic.title}&rdquo;?
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  data-testid="mastery-gate-yes"
                  onClick={() =>
                    updateTopicMastery((prev) => ({
                      ...prev,
                      canMasterChoice: 'yes',
                    }))
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                    currentTopicMastery.canMasterChoice === 'yes'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  [ {currentTopicMastery.canMasterChoice === 'yes' ? '✓' : ' '} ] Yes | why?
                </button>
                <button
                  type="button"
                  data-testid="mastery-gate-no"
                  onClick={() =>
                    updateTopicMastery((prev) => ({
                      ...prev,
                      canMasterChoice: 'no',
                    }))
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                    currentTopicMastery.canMasterChoice === 'no'
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  [ {currentTopicMastery.canMasterChoice === 'no' ? '✓' : ' '} ] No | why?
                </button>
              </div>
            </div>

            <input
              type="text"
              data-testid="mastery-gate-why-input"
              value={currentTopicMastery.canMasterWhy}
              onChange={(e) =>
                updateTopicMastery((prev) => ({
                  ...prev,
                  canMasterWhy: e.target.value,
                }))
              }
              placeholder={
                currentTopicMastery.canMasterChoice === 'yes'
                  ? 'Why do I believe I can master it? What evidence or system backs this?'
                  : 'Why not? What constraint, belief, or missing prerequisite needs solving first?'
              }
              className="w-full text-xs bg-white border border-amber-300 rounded-lg px-3 py-2 text-slate-900"
            />
          </div>

          {/* All 31 Goal Setting Questions grouped cleanly */}
          <div className="grid grid-cols-1 @xl:grid-cols-2 gap-3">
            {GOAL_SETTING_MASTERY_QUESTIONS.map((q, index) => {
              const val = currentTopicMastery.answers[q.id] ?? '';
              return (
                <div
                  key={q.id}
                  data-testid={`goal-mastery-q-${q.id}`}
                  className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        #{index + 1} · {q.category}
                      </span>
                      {val.trim() && (
                        <button
                          type="button"
                          onClick={() =>
                            handlePushCustomGoalItemToTasks(
                              val,
                              `Goal Mastery (${activeTopic.title}): ${q.question}`
                            )
                          }
                          className="text-[10px] font-semibold text-emerald-700 hover:underline cursor-pointer"
                        >
                          + Push to Tasks
                        </button>
                      )}
                    </div>
                    <label
                      htmlFor={`mastery-input-${q.id}`}
                      className="block text-xs font-bold text-slate-900"
                    >
                      {q.question}
                    </label>
                  </div>

                  <input
                    id={`mastery-input-${q.id}`}
                    type="text"
                    value={val}
                    onChange={(e) => {
                      const nextVal = e.target.value;
                      updateTopicMastery((prev) => ({
                        ...prev,
                        answers: {
                          ...prev.answers,
                          [q.id]: nextVal,
                        },
                      }));
                    }}
                    placeholder={q.placeholder}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:border-slate-400 focus:outline-none"
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ===================================================================== */}
      {/* SUBTAB 1: 6-HORIZON FUNNEL VIEW (5Y -> 3Y -> 1Y -> 4M -> 1M -> 1W)    */}
      {/* ===================================================================== */}
      {activeGoalSubTab === 'horizons' &&
        (wizardMode ? (
          <section
            aria-label="Guided Goal Prompt Wizard"
            className="bg-white border-2 border-slate-900 rounded-xl p-6 space-y-5"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-mono font-bold text-slate-900">
                  Step {wizardStepIndex + 1} of {GOAL_HORIZONS.length}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-emerald-700">
                  {currentWizardConfig.zoomLevel}
                </span>
              </div>

              <div className="flex items-center gap-1">
                {GOAL_HORIZONS.map((hKey, idx) => (
                  <button
                    key={hKey}
                    type="button"
                    onClick={() => setWizardStepIndex(idx)}
                    className={`px-2 py-1 rounded text-[11px] font-mono cursor-pointer ${
                      idx === wizardStepIndex
                        ? 'bg-slate-900 text-white font-bold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {GOAL_HORIZON_PROMPTS[hKey].shortLabel}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900 font-display">
                {currentWizardConfig.label}
              </h3>
              <p className="mt-1 text-sm font-medium text-slate-700">
                {currentWizardConfig.promptQuestion}
              </p>
            </div>

            <div>
              <label
                htmlFor={`wizard-prompt-${currentWizardKey}`}
                className="sr-only"
              >
                {currentWizardConfig.label} response
              </label>
              <textarea
                id={`wizard-prompt-${currentWizardKey}`}
                rows={3}
                value={currentWizardStep.answer}
                onChange={(e) =>
                  onUpdateHorizonAnswer(
                    activeTopic.id,
                    currentWizardKey,
                    e.target.value
                  )
                }
                placeholder="Write your clear, concrete goal for this time horizon..."
                className="w-full text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-3.5 focus:outline-none focus:border-slate-400"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                disabled={wizardStepIndex === 0}
                onClick={() => setWizardStepIndex((i) => Math.max(0, i - 1))}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg cursor-pointer"
              >
                ← Previous Horizon (Zoom Out)
              </button>

              {wizardStepIndex < GOAL_HORIZONS.length - 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    setWizardStepIndex((i) =>
                      Math.min(GOAL_HORIZONS.length - 1, i + 1)
                    )
                  }
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Next Horizon (Narrow Focus) →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setWizardMode(false)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer"
                >
                  Finish &amp; View Full Funnel
                </button>
              )}
            </div>
          </section>
        ) : (
          <div
            className="space-y-3"
            role="list"
            aria-label="Goal horizon funnel"
          >
            {GOAL_HORIZONS.map((horizonKey, idx) => {
              const config = GOAL_HORIZON_PROMPTS[horizonKey];
              const step = activeRoadmap.steps[horizonKey];
              const isTunnelVision =
                horizonKey === '1_week' || horizonKey === '1_month';

              return (
                <div
                  key={horizonKey}
                  role="listitem"
                  data-testid={`goal-horizon-card-${horizonKey}`}
                  className={`bg-white border rounded-xl p-5 transition-colors ${
                    step.completed
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : isTunnelVision
                      ? 'border-slate-300'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <button
                      type="button"
                      onClick={() =>
                        onToggleHorizonCompleted(activeTopic.id, horizonKey)
                      }
                      aria-label={
                        step.completed
                          ? `Mark ${config.label} as incomplete`
                          : `Mark ${config.label} as achieved (+${config.unitWeight} topic progress)`
                      }
                      className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                        step.completed
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 hover:border-slate-500 bg-white'
                      }`}
                    >
                      {step.completed && (
                        <Check
                          className="w-3.5 h-3.5 stroke-[2.5]"
                          aria-hidden="true"
                        />
                      )}
                    </button>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-400">
                            0{idx + 1}.
                          </span>
                          <h3 className="text-sm font-bold text-slate-900 font-display">
                            {config.label}
                          </h3>
                          <span aria-hidden="true" className="text-slate-300">
                            ·
                          </span>
                          <span className="text-xs font-medium text-emerald-700">
                            {config.zoomLevel}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono tabular-nums text-slate-500">
                            +{config.unitWeight} {activeTopic.unitName} on
                            completion
                          </span>
                          {step.answer.trim() && (
                            <button
                              type="button"
                              onClick={() => handlePushToTasks(horizonKey)}
                              className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md inline-flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Plus className="w-3 h-3" aria-hidden="true" />
                              <span>Add to Tasks</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 flex items-start gap-1.5">
                        <HelpCircle
                          className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <span>{config.promptQuestion}</span>
                      </p>

                      <div>
                        <label
                          htmlFor={`horizon-input-${horizonKey}`}
                          className="sr-only"
                        >
                          {config.label} prompt answer
                        </label>
                        <input
                          id={`horizon-input-${horizonKey}`}
                          type="text"
                          value={step.answer}
                          onChange={(e) =>
                            onUpdateHorizonAnswer(
                              activeTopic.id,
                              horizonKey,
                              e.target.value
                            )
                          }
                          placeholder={`Answer prompt for your ${config.label.toLowerCase()}...`}
                          className={`w-full text-xs sm:text-sm rounded-lg px-3 py-2 border transition-colors focus:outline-none ${
                            step.completed
                              ? 'bg-white/80 border-emerald-200 text-slate-600 line-through'
                              : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-slate-400'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
    </div>
  );
};
