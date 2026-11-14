import React, { useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  ExternalLink,
  GraduationCap,
  Plus,
  Minus,
  Smartphone,
  Trash2,
  Video,
  FileText,
  Compass,
  ChevronRight,
  Target,
  Check,
  Wrench,
  Award,
  Crown,
  Monitor,
} from 'lucide-react';
import {
  Category,
  GOAL_HORIZONS,
  GOAL_HORIZON_PROMPTS,
  GoalHorizonKey,
  LIFE_AREAS,
  TopicGoalRoadmap,
  TopicItem,
  TopicResourceType,
  computeTopicProgressPercent,
} from '../utils/todoLogic';
import { TopicAnimatedLibrary } from './TopicAnimatedLibrary';
import {
  TopicPcMonitorStation,
  isVideoTopicResource,
} from './TopicPcMonitorStation';
import {
  TopicMasteryOverviewCabinet,
  TopicMasteryStudio,
  TopicMasteryRecord,
  getDefaultMasteryRecordForTopic,
  loadTopicMasteryMap,
  saveTopicMasteryMap,
} from './TopicMasterySection';

interface TopicDashboardProps {
  topics: TopicItem[];
  roadmaps?: TopicGoalRoadmap[];
  selectedTopicId?: string | null;
  onSelectTopicId?: (topicId: string | null) => void;
  onCreateTopic: (params: {
    title: string;
    description: string;
    lifeArea: Category;
    goalLabel: string;
    targetUnits: number;
    unitName: string;
  }) => void;
  onUpdateProgress: (topicId: string, deltaUnits: number) => void;
  onAddResource: (
    topicId: string,
    resource: {
      title: string;
      type: TopicResourceType;
      url: string;
      fileName?: string;
      fileSizeLabel?: string;
    }
  ) => void;
  onToggleResource: (topicId: string, resourceId: string) => void;
  onDeleteResource: (topicId: string, resourceId: string) => void;
  onNavigateToLifeArea: (area: Category) => void;
  onOpenGoalPlanner?: (topicId: string) => void;
  onToggleHorizonCompleted?: (topicId: string, horizon: GoalHorizonKey) => void;
}

const RESOURCE_TYPES: TopicResourceType[] = [
  'PDF',
  'Book',
  'YouTube',
  'Udemy',
  'App',
  'Article',
];

function getResourceIcon(type: TopicResourceType) {
  switch (type) {
    case 'PDF':
      return (
        <FileText
          className="w-4 h-4 text-purple-700 shrink-0"
          aria-hidden="true"
        />
      );
    case 'YouTube':
      return <Video className="w-4 h-4 text-red-600 shrink-0" aria-hidden="true" />;
    case 'Udemy':
      return (
        <GraduationCap
          className="w-4 h-4 text-purple-600 shrink-0"
          aria-hidden="true"
        />
      );
    case 'App':
      return (
        <Smartphone
          className="w-4 h-4 text-emerald-600 shrink-0"
          aria-hidden="true"
        />
      );
    case 'Book':
      return (
        <BookOpen
          className="w-4 h-4 text-blue-700 shrink-0"
          aria-hidden="true"
        />
      );
    case 'Article':
    default:
      return (
        <FileText
          className="w-4 h-4 text-blue-600 shrink-0"
          aria-hidden="true"
        />
      );
  }
}

export const TopicDashboard: React.FC<TopicDashboardProps> = ({
  topics,
  roadmaps = [],
  selectedTopicId: controlledSelectedTopicId,
  onSelectTopicId,
  onCreateTopic,
  onUpdateProgress,
  onAddResource,
  onToggleResource,
  onDeleteResource,
  onNavigateToLifeArea,
  onOpenGoalPlanner,
  onToggleHorizonCompleted,
}) => {
  const [localSelectedTopicId, setLocalSelectedTopicId] = useState<string | null>(
    null
  );
  const selectedTopicId =
    controlledSelectedTopicId !== undefined
      ? controlledSelectedTopicId
      : localSelectedTopicId;

  const setSelectedTopicId = (id: string | null) => {
    setLocalSelectedTopicId(id);
    if (onSelectTopicId) onSelectTopicId(id);
  };

  const [showNewTopicForm, setShowNewTopicForm] = useState(false);

  // New Topic form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newLifeArea, setNewLifeArea] = useState<Category>('Portfolio');
  const [newGoalLabel, setNewGoalLabel] = useState('');
  const [newTargetUnits, setNewTargetUnits] = useState(10);
  const [newUnitName, setNewUnitName] = useState('modules');
  // New Topic Mastery Outcomes state (1: Skill, 2: Certificate/Medal, 3: Title/Position)
  const [newSkillName, setNewSkillName] = useState('');
  const [newAwardKind, setNewAwardKind] = useState<'Certificate' | 'Medal'>(
    'Certificate'
  );
  const [newAwardTitle, setNewAwardTitle] = useState('');
  const [newRoleKind, setNewRoleKind] = useState<'Title' | 'Position'>('Title');
  const [newRoleName, setNewRoleName] = useState('');
  const [topicFormError, setTopicFormError] = useState<string | null>(null);

  // Pending mastery overrides for newly created topic
  const pendingNewMasteryRef = React.useRef<{
    skillName?: string;
    awardKind?: 'Certificate' | 'Medal';
    awardTitle?: string;
    roleKind?: 'Title' | 'Position';
    roleName?: string;
  } | null>(null);

  // Topic Mastery Records Map (persisted in localStorage)
  const [masteryMap, setMasteryMap] = useState<
    Record<string, TopicMasteryRecord>
  >(() => loadTopicMasteryMap(topics));

  React.useEffect(() => {
    setMasteryMap((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const t of topics) {
        if (!next[t.id]) {
          const base = getDefaultMasteryRecordForTopic(t);
          const pending = pendingNewMasteryRef.current;
          if (pending) {
            next[t.id] = {
              ...base,
              skillName: pending.skillName?.trim() || base.skillName,
              awardKind: pending.awardKind ?? base.awardKind,
              awardTitle: pending.awardTitle?.trim() || base.awardTitle,
              titlePositionKind: pending.roleKind ?? base.titlePositionKind,
              titlePositionName:
                pending.roleName?.trim() || base.titlePositionName,
            };
            pendingNewMasteryRef.current = null;
          } else {
            next[t.id] = base;
          }
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [topics]);

  React.useEffect(() => {
    saveTopicMasteryMap(masteryMap);
  }, [masteryMap]);

  const handleUpdateMasteryRecord = (
    topicId: string,
    updated: TopicMasteryRecord
  ) => {
    setMasteryMap((prev) => ({
      ...prev,
      [topicId]: updated,
    }));
  };

  // New Resource form state (inside Topic Detail view)
  const [resTitle, setResTitle] = useState('');
  const [resType, setResType] = useState<TopicResourceType>('PDF');
  const [resUrl, setResUrl] = useState('');
  const [resError, setResError] = useState<string | null>(null);
  const [overviewLibraryTopicId, setOverviewLibraryTopicId] = useState<string>(
    () => topics[0]?.id ?? ''
  );
  const [activeMonitorVideoId, setActiveMonitorVideoId] = useState<
    string | null
  >(null);

  const handleOpenVideoOnPcMonitor = (resourceId: string) => {
    setActiveMonitorVideoId(resourceId);
    const el = document.querySelector(
      '[data-testid="topic-pc-monitor-station"]'
    );
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const selectedTopic = topics.find((t) => t.id === selectedTopicId) ?? null;
  const overviewLibraryTopic =
    topics.find((t) => t.id === overviewLibraryTopicId) ?? topics[0] ?? null;
  const selectedRoadmap = selectedTopic
    ? roadmaps.find((r) => r.topicId === selectedTopic.id) ?? null
    : null;

  const handleCreateTopicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setTopicFormError('Please provide a topic title.');
      return;
    }
    setTopicFormError(null);
    pendingNewMasteryRef.current = {
      skillName: newSkillName,
      awardKind: newAwardKind,
      awardTitle: newAwardTitle,
      roleKind: newRoleKind,
      roleName: newRoleName,
    };
    onCreateTopic({
      title: newTitle,
      description: newDesc,
      lifeArea: newLifeArea,
      goalLabel:
        newGoalLabel.trim() ||
        `Complete ${newTargetUnits} ${newUnitName.trim() || 'modules'}`,
      targetUnits: newTargetUnits,
      unitName: newUnitName.trim() || 'modules',
    });
    setNewTitle('');
    setNewDesc('');
    setNewGoalLabel('');
    setNewSkillName('');
    setNewAwardTitle('');
    setNewRoleName('');
    setShowNewTopicForm(false);
  };

  const handleAddResourceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopic) return;
    if (!resTitle.trim() || !resUrl.trim()) {
      setResError('Please enter both a resource title and a link/URL.');
      return;
    }
    setResError(null);
    onAddResource(selectedTopic.id, {
      title: resTitle,
      type: resType,
      url: resUrl,
    });
    setResTitle('');
    setResUrl('');
  };

  // ==========================================================================
  // Detail View for a Selected Topic
  // ==========================================================================
  if (selectedTopic) {
    const progressPct = computeTopicProgressPercent(selectedTopic);
    const completedResources = selectedTopic.resources.filter(
      (r) => r.completed
    ).length;

    return (
      <div className="@container space-y-5" data-testid="topic-detail-view">
        {/* Top Back Navigation & Connected Life Area */}
        <div className="flex flex-col @sm:flex-row @sm:items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={() => setSelectedTopicId(null)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer self-start"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back to All Topics</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateToLifeArea(selectedTopic.lifeArea)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-800 cursor-pointer self-start @sm:self-auto"
          >
            <Compass className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Connected Area of Life: {selectedTopic.lifeArea}</span>
            <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        {/* Topic Overview & Goal Progress Card */}
        <section
          aria-label="Topic Goal Progress"
          className="bg-white border border-slate-200 rounded-xl p-4 @sm:p-6 space-y-4"
        >
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-emerald-700">
                {selectedTopic.lifeArea}
              </span>
              <span aria-hidden="true">·</span>
              <span>Topic Focus</span>
            </div>
            <h1 className="mt-1 text-lg @sm:text-2xl font-bold tracking-tight text-slate-900 font-display">
              {selectedTopic.title}
            </h1>
            {selectedTopic.description && (
              <p className="mt-1.5 text-xs @sm:text-sm text-slate-600 leading-relaxed">
                {selectedTopic.description}
              </p>
            )}
          </div>

          {/* Goal Progress Section */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex flex-col @sm:flex-row @sm:items-baseline justify-between gap-2">
              <div>
                <h2 className="text-xs font-semibold text-slate-500">
                  Topic Goal
                </h2>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">
                  {selectedTopic.goalLabel}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span
                  data-testid="topic-detail-progress-text"
                  className="text-xs font-mono tabular-nums font-semibold text-slate-700"
                >
                  {selectedTopic.currentUnits} / {selectedTopic.targetUnits}{' '}
                  {selectedTopic.unitName} ({progressPct}%)
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onUpdateProgress(selectedTopic.id, -1)}
                    aria-label="Decrease topic goal progress"
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateProgress(selectedTopic.id, 1)}
                    aria-label="Increase topic goal progress"
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Log +1</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Goal Progress Bar */}
            <div
              className="h-3 w-full bg-slate-100 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full bg-emerald-600 transition-transform duration-200 origin-left"
                style={{ transform: `scaleX(${progressPct / 100})` }}
              />
            </div>
          </div>

          {/* Connected Multi-Horizon Goal Funnel (5Y -> 3Y -> 1Y -> 4M -> 1M -> 1W) */}
          {selectedRoadmap && (
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                    <Target
                      className="w-3.5 h-3.5 text-emerald-600"
                      aria-hidden="true"
                    />
                    <span>
                      Connected Goal Funnel (5-Year Vision → 1-Week Tunnel
                      Vision)
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Completing any horizon milestone directly advances this
                    topic&apos;s goal progress bar above.
                  </p>
                </div>

                {onOpenGoalPlanner && (
                  <button
                    type="button"
                    onClick={() => onOpenGoalPlanner(selectedTopic.id)}
                    className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    <span>Edit Prompt-Based Goals</span>
                    <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 @sm:grid-cols-2 gap-2">
                {GOAL_HORIZONS.map((hKey) => {
                  const config = GOAL_HORIZON_PROMPTS[hKey];
                  const step = selectedRoadmap.steps[hKey];
                  return (
                    <div
                      key={hKey}
                      className={`p-3 rounded-lg border flex items-start gap-2.5 ${
                        step.completed
                          ? 'bg-emerald-50/30 border-emerald-200'
                          : 'bg-slate-50/70 border-slate-200/80'
                      }`}
                    >
                      {onToggleHorizonCompleted && (
                        <button
                          type="button"
                          onClick={() =>
                            onToggleHorizonCompleted(selectedTopic.id, hKey)
                          }
                          aria-label={`Toggle ${config.label} for ${selectedTopic.title}`}
                          className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 cursor-pointer ${
                            step.completed
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'bg-white border-slate-300 hover:border-slate-500'
                          }`}
                        >
                          {step.completed && (
                            <Check
                              className="w-3 h-3 stroke-[2.5]"
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1 text-[11px]">
                          <span className="font-bold text-slate-800">
                            {config.label}
                          </span>
                          <span className="font-mono text-slate-400">
                            +{config.unitWeight} {selectedTopic.unitName}
                          </span>
                        </div>
                        <p
                          className={`mt-0.5 text-xs truncate ${
                            step.completed
                              ? 'line-through text-slate-400'
                              : 'text-slate-700'
                          }`}
                        >
                          {step.answer || 'No prompt answer yet'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* 3-Pathway Topic Mastery Verification Studio (1: Skill, 2: Certificate/Medal + Photos, 3: Title/Position) */}
        <TopicMasteryStudio
          topic={selectedTopic}
          record={
            masteryMap[selectedTopic.id] ??
            getDefaultMasteryRecordForTopic(selectedTopic)
          }
          onUpdateRecord={(updated) =>
            handleUpdateMasteryRecord(selectedTopic.id, updated)
          }
          onMarkTopic100Percent={() => {
            const remaining = Math.max(
              0,
              selectedTopic.targetUnits - selectedTopic.currentUnits
            );
            if (remaining > 0) {
              onUpdateProgress(selectedTopic.id, remaining);
            }
          }}
        />

        {/* Animated Library Bookshelf (Spine-Only View + Direct PDF Book Generator) */}
        <TopicAnimatedLibrary
          topic={selectedTopic}
          onAddResource={onAddResource}
          onToggleResource={onToggleResource}
          onDeleteResource={onDeleteResource}
          onOpenVideoOnMonitor={handleOpenVideoOnPcMonitor}
        />

        {/* PC & Monitor Video Workstation (Opens Video Links on Monitor Screen) */}
        <TopicPcMonitorStation
          topic={selectedTopic}
          activeVideoResourceId={activeMonitorVideoId}
          onSelectVideoResourceId={setActiveMonitorVideoId}
          onAddResource={onAddResource}
          onToggleResource={onToggleResource}
          onDeleteResource={onDeleteResource}
        />

        {/* Learning & Practice Resources List (PDFs, Books, YouTube, Udemy, Apps, Articles) */}
        <section
          aria-label="Topic Resources"
          className="bg-white border border-slate-200 rounded-xl overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                All Shelved Resources (PDFs, Books, Courses &amp; Video Links)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Books &amp; PDFs stand on your <strong>Animated Library Shelf</strong>; video links (YouTube &amp; Udemy) open directly inside your <strong>PC Monitor Screen</strong> above.
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {completedResources}/{selectedTopic.resources.length} completed
            </span>
          </div>

          {selectedTopic.resources.length > 0 ? (
            <div className="divide-y divide-slate-200/80" role="list">
              {selectedTopic.resources.map((res) => {
                const isVideo = isVideoTopicResource(res);
                const isPlayingOnMonitor = activeMonitorVideoId === res.id;
                return (
                  <div
                    key={res.id}
                    role="listitem"
                    className={`px-6 py-3.5 flex items-center justify-between gap-4 transition-colors ${
                      isPlayingOnMonitor
                        ? 'bg-blue-50/70'
                        : 'hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={res.completed}
                        onChange={() =>
                          onToggleResource(selectedTopic.id, res.id)
                        }
                        aria-label={`Mark resource "${res.title}" as completed`}
                        className="mt-1 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {getResourceIcon(res.type)}
                          {isVideo ? (
                            <button
                              type="button"
                              onClick={() => handleOpenVideoOnPcMonitor(res.id)}
                              className={`text-left text-sm font-semibold hover:text-blue-700 inline-flex items-center gap-1.5 break-words cursor-pointer ${
                                res.completed
                                  ? 'line-through text-slate-400'
                                  : 'text-slate-900'
                              }`}
                            >
                              <span>{res.title}</span>
                              <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold inline-flex items-center gap-1">
                                <Monitor className="w-3 h-3" />
                                <span>
                                  {isPlayingOnMonitor
                                    ? 'On PC Monitor'
                                    : 'Open on Monitor'}
                                </span>
                              </span>
                            </button>
                          ) : (
                            <a
                              href={res.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`text-sm font-medium hover:underline inline-flex items-center gap-1.5 break-words ${
                                res.completed
                                  ? 'line-through text-slate-400'
                                  : 'text-slate-900'
                              }`}
                            >
                              <span>{res.title}</span>
                              <ExternalLink
                                className="w-3 h-3 text-slate-400 shrink-0"
                                aria-hidden="true"
                              />
                            </a>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                          <span className="font-medium text-slate-700">
                            {res.type}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="truncate max-w-xs font-mono text-[11px] text-slate-400">
                            {res.url}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isVideo && (
                        <button
                          type="button"
                          data-testid={`open-video-on-monitor-${res.id}`}
                          onClick={() => handleOpenVideoOnPcMonitor(res.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Monitor className="w-3.5 h-3.5 text-blue-600" />
                          <span className="hidden sm:inline">PC Monitor</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          onDeleteResource(selectedTopic.id, res.id)
                        }
                        aria-label={`Remove resource "${res.title}"`}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 px-6 text-center text-xs text-slate-500">
              No resources added yet. Add a YouTube video, Udemy course, or App
              below.
            </div>
          )}

          {/* Add New Resource Form */}
          <form
            onSubmit={handleAddResourceSubmit}
            className="p-5 bg-slate-50/70 border-t border-slate-200 space-y-3"
          >
            <div className="text-xs font-semibold text-slate-700">
              Add Resource (YouTube Link, Udemy Course, App, etc.)
            </div>

            {resError && (
              <p role="alert" className="text-xs font-medium text-red-600">
                {resError}
              </p>
            )}

            <div className="grid grid-cols-1 @sm:grid-cols-12 gap-2.5">
              <div className="@sm:col-span-3">
                <label htmlFor="res-type" className="sr-only">
                  Resource Type
                </label>
                <select
                  id="res-type"
                  value={resType}
                  onChange={(e) =>
                    setResType(e.target.value as TopicResourceType)
                  }
                  className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-slate-400"
                >
                  {RESOURCE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="@sm:col-span-4">
                <label htmlFor="res-title" className="sr-only">
                  Resource Title
                </label>
                <input
                  id="res-title"
                  type="text"
                  value={resTitle}
                  onChange={(e) => {
                    setResTitle(e.target.value);
                    if (resError) setResError(null);
                  }}
                  placeholder="Title (e.g., React Course, Anki App)"
                  className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="@sm:col-span-3">
                <label htmlFor="res-url" className="sr-only">
                  Resource URL
                </label>
                <input
                  id="res-url"
                  type="text"
                  value={resUrl}
                  onChange={(e) => {
                    setResUrl(e.target.value);
                    if (resError) setResError(null);
                  }}
                  placeholder="https://youtube.com/..."
                  className="w-full text-xs font-mono text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="@sm:col-span-2">
                <button
                  type="submit"
                  className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Add Link</span>
                </button>
              </div>
            </div>
          </form>
        </section>
      </div>
    );
  }

  // ==========================================================================
  // Topics List / Grid Overview
  // ==========================================================================
  return (
    <div className="@container space-y-5" data-testid="topic-dashboard-list">
      <div className="flex flex-col @sm:flex-row @sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg @sm:text-2xl font-bold tracking-tight text-slate-900 font-display">
            Topic Dashboard
          </h1>
          <p className="text-xs @sm:text-sm text-slate-600 mt-0.5">
            Select a topic to inspect its connected Area of Life, track goal
            progress, and access your YouTube, Udemy, and App resources.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowNewTopicForm((prev) => !prev)}
          aria-expanded={showNewTopicForm}
          className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 self-start @sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>{showNewTopicForm ? 'Cancel' : 'New Topic'}</span>
        </button>
      </div>

      {/* Create New Topic Drawer */}
      {showNewTopicForm && (
        <form
          onSubmit={handleCreateTopicSubmit}
          className="bg-white border border-slate-200 rounded-xl p-4 @sm:p-5 space-y-4"
          aria-label="Create new topic"
        >
          <h2 className="text-sm font-semibold text-slate-900">
            Create New Learning or Growth Topic
          </h2>

          {topicFormError && (
            <p role="alert" className="text-xs font-medium text-red-600">
              {topicFormError}
            </p>
          )}

          <div className="grid grid-cols-1 @sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="topic-title-input"
                className="block text-xs font-medium text-slate-600 mb-1"
              >
                Topic Title
              </label>
              <input
                id="topic-title-input"
                type="text"
                value={newTitle}
                onChange={(e) => {
                  setNewTitle(e.target.value);
                  if (topicFormError) setTopicFormError(null);
                }}
                placeholder="e.g., Machine Learning Foundations"
                className="w-full text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-400"
              />
            </div>

            <div>
              <label
                htmlFor="topic-area-select"
                className="block text-xs font-medium text-slate-600 mb-1"
              >
                Connected Area of Life
              </label>
              <select
                id="topic-area-select"
                value={newLifeArea}
                onChange={(e) => setNewLifeArea(e.target.value as Category)}
                className="w-full text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-slate-400"
              >
                {LIFE_AREAS.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>

            <div className="@sm:col-span-2">
              <label
                htmlFor="topic-desc-input"
                className="block text-xs font-medium text-slate-600 mb-1"
              >
                Description
              </label>
              <input
                id="topic-desc-input"
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="What is the focus of this topic?"
                className="w-full text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-400"
              />
            </div>

            <div>
              <label
                htmlFor="topic-goal-input"
                className="block text-xs font-medium text-slate-600 mb-1"
              >
                Goal Statement
              </label>
              <input
                id="topic-goal-input"
                type="text"
                value={newGoalLabel}
                onChange={(e) => setNewGoalLabel(e.target.value)}
                placeholder="e.g., Complete 15 video lectures"
                className="w-full text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label
                  htmlFor="topic-target-units"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Target Count
                </label>
                <input
                  id="topic-target-units"
                  type="number"
                  min={1}
                  value={newTargetUnits}
                  onChange={(e) =>
                    setNewTargetUnits(Math.max(1, Number(e.target.value) || 1))
                  }
                  className="w-full text-xs font-mono tabular-nums text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label
                  htmlFor="topic-unit-name"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Unit Label
                </label>
                <input
                  id="topic-unit-name"
                  type="text"
                  value={newUnitName}
                  onChange={(e) => setNewUnitName(e.target.value)}
                  placeholder="modules / hours"
                  className="w-full text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-400"
                />
              </div>
            </div>
          </div>

          {/* 3 Mastery Completion Outcomes Configuration in New Topic Form */}
          <div className="pt-3 border-t border-slate-200 space-y-2.5">
            <div className="text-xs font-bold text-slate-800">
              How Will You Know You Have Mastered This Topic? (Define 3 Completion Rewards)
            </div>
            <div className="grid grid-cols-1 @sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-1.5">
                <label className="block text-[11px] font-bold text-emerald-900">
                  1. Skill You Will Gain
                </label>
                <input
                  type="text"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  placeholder="e.g., System Design Mastery"
                  className="w-full text-xs text-slate-900 bg-white border border-emerald-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-blue-900">
                    2. {newAwardKind}
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setNewAwardKind((prev) =>
                        prev === 'Certificate' ? 'Medal' : 'Certificate'
                      )
                    }
                    className="text-[10px] font-bold text-blue-700 underline cursor-pointer"
                  >
                    Switch to {newAwardKind === 'Certificate' ? 'Medal' : 'Certificate'}
                  </button>
                </div>
                <input
                  type="text"
                  value={newAwardTitle}
                  onChange={(e) => setNewAwardTitle(e.target.value)}
                  placeholder={`e.g., Official ${newAwardKind} (Attach photos inside)`}
                  className="w-full text-xs text-slate-900 bg-white border border-blue-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-purple-900">
                    3. New {newRoleKind}
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setNewRoleKind((prev) =>
                        prev === 'Title' ? 'Position' : 'Title'
                      )
                    }
                    className="text-[10px] font-bold text-purple-700 underline cursor-pointer"
                  >
                    Switch to {newRoleKind === 'Title' ? 'Position' : 'Title'}
                  </button>
                </div>
                <input
                  type="text"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder={`e.g., Lead Architect / Senior Fellow`}
                  className="w-full text-xs text-slate-900 bg-white border border-purple-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-purple-600"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowNewTopicForm(false)}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              Create Topic
            </button>
          </div>
        </form>
      )}

      {/* Topic Mastery Trophy & Verification Cabinet (1: Skills, 2: Certificates/Medals with Photos, 3: Titles/Positions) */}
      <TopicMasteryOverviewCabinet
        topics={topics}
        masteryMap={masteryMap}
        onSelectTopic={(id) => setSelectedTopicId(id)}
      />

      {/* Animated Library Bookshelf + Desktop PC & Monitor Video Workstation */}
      {overviewLibraryTopic && (
        <div className="space-y-5">
          <TopicAnimatedLibrary
            topic={overviewLibraryTopic}
            topics={topics}
            onSelectTopic={(id) => setOverviewLibraryTopicId(id)}
            onAddResource={onAddResource}
            onToggleResource={onToggleResource}
            onDeleteResource={onDeleteResource}
            onOpenVideoOnMonitor={handleOpenVideoOnPcMonitor}
          />

          <TopicPcMonitorStation
            topic={overviewLibraryTopic}
            topics={topics}
            activeVideoResourceId={activeMonitorVideoId}
            onSelectVideoResourceId={setActiveMonitorVideoId}
            onSelectTopic={(id) => setOverviewLibraryTopicId(id)}
            onAddResource={onAddResource}
            onToggleResource={onToggleResource}
            onDeleteResource={onDeleteResource}
          />
        </div>
      )}

      {/* Topics Cards Grid */}
      <div className="grid grid-cols-1 @md:grid-cols-2 gap-3.5" role="list">
        {topics.map((topic) => {
          const pct = computeTopicProgressPercent(topic);
          const mRecord =
            masteryMap[topic.id] ?? getDefaultMasteryRecordForTopic(topic);
          return (
            <button
              key={topic.id}
              type="button"
              role="listitem"
              onClick={() => setSelectedTopicId(topic.id)}
              data-testid={`topic-card-${topic.id}`}
              className="text-left bg-white border border-slate-200 hover:border-slate-400 rounded-xl p-5 transition-colors flex flex-col justify-between gap-4 cursor-pointer group"
            >
              <div>
                {/* Unboxed metadata showing connected Life Area */}
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                  <div>
                    <span className="font-semibold text-emerald-700">
                      {topic.lifeArea}
                    </span>
                    <span aria-hidden="true" className="mx-1.5">
                      ·
                    </span>
                    <span>{topic.resources.length} resources</span>
                  </div>
                  <ChevronRight
                    className="w-4 h-4 text-slate-400 group-hover:text-slate-800 transition-colors"
                    aria-hidden="true"
                  />
                </div>

                <h2 className="mt-1.5 text-base font-bold text-slate-900 font-display group-hover:text-emerald-800 transition-colors">
                  {topic.title}
                </h2>
                <p className="mt-1 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {topic.description}
                </p>

                {/* 3 Mastery Outcomes Preview Strip on Topic Card */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 text-[10px] font-semibold">
                    <Wrench className="w-3 h-3 text-emerald-600" />
                    <span className="truncate max-w-[140px]">
                      {mRecord.skillName}
                    </span>
                  </span>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-900 text-[10px] font-semibold">
                    <Award className="w-3 h-3 text-blue-600" />
                    <span>
                      {mRecord.awardKind} ({mRecord.awardPhotos.length} photo
                      {mRecord.awardPhotos.length === 1 ? '' : 's'})
                    </span>
                  </span>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200 text-purple-900 text-[10px] font-semibold">
                    <Crown className="w-3 h-3 text-purple-700" />
                    <span className="truncate max-w-[140px]">
                      {mRecord.titlePositionName}
                    </span>
                  </span>
                </div>
              </div>

              <div className="w-full pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-baseline justify-between gap-2 text-xs">
                  <span className="text-slate-600 truncate">
                    {topic.goalLabel}
                  </span>
                  <span className="font-mono tabular-nums font-semibold text-slate-900 shrink-0">
                    {pct}%
                  </span>
                </div>

                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 transition-transform duration-200 origin-left"
                    style={{ transform: `scaleX(${pct / 100})` }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
