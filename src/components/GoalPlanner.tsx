import React, { useState } from 'react';
import {
  Check,
  ChevronRight,
  Compass,
  HelpCircle,
  Layers,
  Plus,
  Sparkles,
  Target,
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
  const [wizardMode, setWizardMode] = useState(false);
  const [wizardStepIndex, setWizardStepIndex] = useState(0);
  const [pushedFeedback, setPushedFeedback] = useState<string | null>(null);

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

  return (
    <div className="space-y-6" data-testid="goal-planner-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">
            Zoom-Out to Tunnel-Vision Goals
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Prompt-based goal funnel from <strong>5-Year Macro Vision</strong>{' '}
            down to <strong>1-Week Tunnel Vision</strong>, synchronized with
            your Topic Progress Bars.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setWizardMode((prev) => !prev);
            setWizardStepIndex(0);
          }}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 self-start sm:self-auto cursor-pointer ${
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
      </div>

      {/* Topic Selector Tabs (Connecting Goals to Topics) */}
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
        className="bg-white border border-slate-200 rounded-xl p-5 space-y-3"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Compass
                className="w-3.5 h-3.5 text-emerald-600"
                aria-hidden="true"
              />
              <span className="font-semibold text-emerald-700">
                {activeTopic.lifeArea}
              </span>
              <span aria-hidden="true">·</span>
              <span>Connected Topic Goal Progress</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {roadmapStats.completedHorizons}/{roadmapStats.totalHorizons}{' '}
                horizons achieved
              </span>
            </div>
            <h2 className="mt-1 text-base font-bold text-slate-900 font-display">
              {activeTopic.title} — {activeTopic.goalLabel}
            </h2>
          </div>

          <div className="flex items-center gap-3 shrink-0">
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

        {/* Synchronized Progress Bar */}
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
        <p className="text-[11px] text-slate-500">
          Checking off any horizon milestone below automatically advances this
          topic&apos;s goal progress bar.
        </p>
      </section>

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

      {/* Guided Step-by-Step Prompt Wizard Mode */}
      {wizardMode ? (
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
                Finish & View Full Funnel
              </button>
            )}
          </div>
        </section>
      ) : (
        /* Full 6-Horizon Funnel View (5Y -> 3Y -> 1Y -> 4M -> 1M -> 1W) */
        <div className="space-y-3" role="list" aria-label="Goal horizon funnel">
          {GOAL_HORIZONS.map((horizonKey, idx) => {
            const config = GOAL_HORIZON_PROMPTS[horizonKey];
            const step = activeRoadmap.steps[horizonKey];
            const isTunnelVision = horizonKey === '1_week' || horizonKey === '1_month';

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
                          +{config.unitWeight} {activeTopic.unitName} on completion
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

                    {/* Guided Prompt Question */}
                    <p className="text-xs text-slate-600 flex items-start gap-1.5">
                      <HelpCircle
                        className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <span>{config.promptQuestion}</span>
                    </p>

                    {/* Prompt Answer Input */}
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
      )}
    </div>
  );
};
