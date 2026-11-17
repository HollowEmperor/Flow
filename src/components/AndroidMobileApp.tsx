import React, { useState } from 'react';
import {
  ListTodo,
  Target,
  BookOpen,
  Calendar as CalendarIcon,
  Layers,
  BarChart3,
  Hexagon,
  CircleDot,
  X,
  Award,
  ChevronDown,
  ChevronUp,
  Wifi,
  BatteryCharging,
  Signal,
  CheckCircle2,
  LayoutGrid,
  Users,
  Timer,
  BookText,
  Flame,
  Clock,
  Kanban,
  GitCommitHorizontal,
  PenTool,
  Archive,
  Brain,
  Compass,
  MapPin,
} from 'lucide-react';
import {
  Category,
  LIFE_AREAS,
  Priority,
  TodoItem,
  BrainDumpItem,
  TopicItem,
  TopicResourceType,
  GoalHorizonKey,
  TopicGoalRoadmap,
  WorkspaceTab,
  TaskViewMode,
  KanbanStage,
  EisenhowerQuadrant,
  RelationshipCadence,
  RelationshipContact,
  OrganizationCategory,
  OrganizationItem,
  FocusTimerMode,
  FocusSessionLog,
  JournalMood,
  JournalEntry,
  HabitCategoryType,
  HabitItem,
  resolveRadarAreaNavigation,
  getTodayIsoDate,
} from '../utils/todoLogic';
import { QuickAddTask } from './QuickAddTask';
import { TaskWheelPicker } from './TaskWheelPicker';
import { BrainDumpSwiper } from './BrainDumpSwiper';
import { LifeRadarChart } from './LifeRadarChart';
import { TopicDashboard } from './TopicDashboard';
import { GoalPlanner } from './GoalPlanner';
import { CalendarWorkspace } from './CalendarWorkspace';
import { EisenhowerMatrix } from './EisenhowerMatrix';
import { RelationshipOrgDashboard } from './RelationshipOrgDashboard';
import { FocusDoteTimer } from './FocusDoteTimer';
import { HourlyCalendarPanel } from './HourlyCalendarPanel';
import { TaskViewsContainer } from './TaskViewsContainer';
import { JournalDashboard } from './JournalDashboard';
import { HabitDashboard } from './HabitDashboard';
import { MemoSpikeWidget } from './MemoSpikeWidget';
import { ExcalidrawPlanDashboard } from './ExcalidrawPlanDashboard';
import { BacklogDashboard } from './BacklogDashboard';
import { AffirmationDashboard } from './AffirmationDashboard';
import { ReflectDashboard } from './ReflectDashboard';
import { VisionDashboard } from './VisionDashboard';
import { GoogleMapsDashboard } from './GoogleMapsDashboard';
import { RealTimeFlipClock } from './RealTimeFlipClock';
import { ProductiveDayFeed } from './ProductiveDayFeed';
import { ProductiveInfographicsPanel } from './ProductiveInfographicsPanel';

interface AndroidMobileAppProps {
  activeView: WorkspaceTab;
  onSelectView: (view: WorkspaceTab) => void;
  taskViewMode: TaskViewMode;
  onSelectTaskViewMode: (mode: TaskViewMode) => void;
  todos: TodoItem[];
  visibleTodos: TodoItem[];
  stats: {
    total: number;
    active: number;
    completed: number;
    highPriorityActive: number;
    completionRate: number;
  };
  categoryFilter: Category | 'All';
  onSelectCategoryFilter: (cat: Category | 'All') => void;
  selectedFocusTaskId: string | null;
  onSelectFocusTask: (id: string | null) => void;
  radarBaseOverrides: Partial<Record<Category, number>>;
  onAdjustBaseScore: (area: Category, delta: number) => void;
  onAddTodo: (params: {
    title: string;
    notes: string;
    priority: Priority;
    category: Category;
    dueDate: string;
    isRepeating: boolean;
    scheduledHour?: number;
    quadrant?: EisenhowerQuadrant;
  }) => void;
  onToggleTodo: (id: string) => void;
  onDeleteTodo: (id: string) => void;
  onUpdateTodo: (
    id: string,
    updates: Partial<
      Pick<
        TodoItem,
        | 'title'
        | 'notes'
        | 'priority'
        | 'category'
        | 'dueDate'
        | 'isRepeating'
        | 'streakCount'
        | 'quadrant'
        | 'scheduledHour'
      >
    >
  ) => void;
  onAddSubtask: (todoId: string, title: string) => void;
  onToggleSubtask: (todoId: string, subtaskId: string) => void;
  onDeleteSubtask: (todoId: string, subtaskId: string) => void;
  onMoveKanbanStage: (todoId: string, stage: KanbanStage) => void;
  onAssignQuadrant: (todoId: string, quadrant: EisenhowerQuadrant) => void;
  onAssignScheduledHour: (
    todoId: string,
    hour: number | undefined,
    dateIso: string
  ) => void;
  // Topics & Goals
  topics: TopicItem[];
  goalRoadmaps: TopicGoalRoadmap[];
  selectedTopicId: string | null;
  onSelectTopicId: (id: string | null) => void;
  onCreateTopic: (params: {
    title: string;
    description: string;
    lifeArea: Category;
    goalLabel: string;
    targetUnits: number;
    unitName: string;
  }) => void;
  onUpdateTopicProgress: (topicId: string, deltaUnits: number) => void;
  onAddTopicResource: (
    topicId: string,
    resource: {
      title: string;
      type: TopicResourceType;
      url: string;
      fileName?: string;
      fileSizeLabel?: string;
    }
  ) => void;
  onToggleTopicResource: (topicId: string, resourceId: string) => void;
  onDeleteTopicResource: (topicId: string, resourceId: string) => void;
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
  // Brain Dump
  brainDumpItems: BrainDumpItem[];
  brainDumpQueueCount: number;
  onAddDumpItems: (
    rawText: string,
    category?: Category,
    priority?: Priority
  ) => void;
  onSwipeRight: (itemId: string) => void;
  onSwipeLeft: (itemId: string) => void;
  onRestoreToDeck: (itemId: string) => void;
  onDeleteDumpItem: (itemId: string) => void;
  // Relationships & Organizations
  contacts: RelationshipContact[];
  organizations: OrganizationItem[];
  onLogRelationshipCheckIn: (contactId: string) => void;
  onAddContact: (params: {
    name: string;
    role: string;
    organizationName: string;
    lifeArea: Category;
    cadence: RelationshipCadence;
    nextAction: string;
  }) => void;
  onAddOrganization: (params: {
    name: string;
    type: OrganizationCategory;
    role: string;
    lifeArea: Category;
    cadence: string;
    memberOrContactCount: number;
    focusGoal: string;
  }) => void;
  // DoteTimer
  focusLogs: FocusSessionLog[];
  onLogFocusSession: (params: {
    taskId?: string;
    taskTitle: string;
    category: Category;
    durationMinutes: number;
    mode: FocusTimerMode;
  }) => void;
  // Journal
  journalEntries: JournalEntry[];
  onAddJournalEntry: (params: {
    title: string;
    content: string;
    gratitude: string;
    lifeArea: Category;
    mood: JournalMood;
    dateIso: string;
  }) => void;
  onDeleteJournalEntry: (id: string) => void;
  // Habits & Heatmap
  habits: HabitItem[];
  onToggleHabitDate: (habitId: string, dateIso: string) => void;
  onAddHabit: (params: {
    title: string;
    lifeArea: Category;
    habitType: HabitCategoryType;
    oldHabitToReplace?: string;
    targetPerWeek: number;
    whenTime?: string;
    durationMinutes?: number;
    streakTargetDays?: number;
  }) => void;
}

const CATEGORIES_WITH_ALL: Array<Category | 'All'> = ['All', ...LIFE_AREAS];

export const AndroidMobileApp: React.FC<AndroidMobileAppProps> = ({
  activeView,
  onSelectView,
  taskViewMode,
  onSelectTaskViewMode,
  todos,
  visibleTodos,
  stats,
  categoryFilter,
  onSelectCategoryFilter,
  selectedFocusTaskId,
  onSelectFocusTask,
  radarBaseOverrides,
  onAdjustBaseScore,
  onAddTodo,
  onToggleTodo,
  onDeleteTodo,
  onUpdateTodo,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onMoveKanbanStage,
  onAssignQuadrant,
  onAssignScheduledHour,
  topics,
  goalRoadmaps,
  selectedTopicId,
  onSelectTopicId,
  onCreateTopic,
  onUpdateTopicProgress,
  onAddTopicResource,
  onToggleTopicResource,
  onDeleteTopicResource,
  onUpdateHorizonAnswer,
  onToggleHorizonCompleted,
  onPushHorizonToTodo,
  brainDumpItems,
  onAddDumpItems,
  onSwipeRight,
  onSwipeLeft,
  onRestoreToDeck,
  onDeleteDumpItem,
  contacts,
  organizations,
  onLogRelationshipCheckIn,
  onAddContact,
  onAddOrganization,
  focusLogs,
  onLogFocusSession,
  journalEntries,
  onAddJournalEntry,
  onDeleteJournalEntry,
  habits,
  onToggleHabitDate,
  onAddHabit,
}) => {
  // Hidden by default: Stats, Radar, Wheel, and Side Hourly Bar only appear when their right-side icon is clicked
  const [mobileTaskSubTab, setMobileTaskSubTab] = useState<
    'stats' | 'radar' | 'wheel' | 'hourly' | null
  >(null);
  const todayIso = getTodayIsoDate();

  const bottomNavItems: Array<{
    id: WorkspaceTab;
    label: string;
    badge?: number;
    icon: React.ReactNode;
  }> = [
    {
      id: 'tasks',
      label: 'Today',
      badge: stats.active,
      icon: <ListTodo className="w-4 h-4" aria-hidden="true" />,
    },
    {
      id: 'habits',
      label: 'Habits',
      icon: <Flame className="w-4 h-4" aria-hidden="true" />,
    },
    {
      id: 'timer',
      label: 'Focus',
      icon: <Timer className="w-4 h-4" aria-hidden="true" />,
    },
    {
      id: 'goals',
      label: 'Goals',
      icon: <Target className="w-4 h-4" aria-hidden="true" />,
    },
    {
      id: 'reflect',
      label: 'Reflect',
      icon: <Brain className="w-4 h-4" aria-hidden="true" />,
    },
  ];

  const secondaryQuickPills: Array<{
    id: WorkspaceTab;
    label: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'flipclock',
      label: 'Flip Clock',
      icon: <Clock className="w-3 h-3" aria-hidden="true" />,
    },
    {
      id: 'visions',
      label: 'Visions',
      icon: <Compass className="w-3 h-3" aria-hidden="true" />,
    },
    {
      id: 'maps',
      label: 'Google Maps',
      icon: <MapPin className="w-3 h-3" aria-hidden="true" />,
    },
    {
      id: 'backlog',
      label: 'Backlog',
      icon: <Archive className="w-3 h-3" aria-hidden="true" />,
    },
    {
      id: 'affirmations',
      label: 'Affirmations',
      icon: <Award className="w-3 h-3" aria-hidden="true" />,
    },
    {
      id: 'reflect',
      label: 'Reflect',
      icon: <Brain className="w-3 h-3" aria-hidden="true" />,
    },
    {
      id: 'plan',
      label: 'Plan (Excalidraw)',
      icon: <PenTool className="w-3 h-3" aria-hidden="true" />,
    },
    {
      id: 'timer',
      label: 'DoteTimer',
      icon: <Timer className="w-3 h-3" aria-hidden="true" />,
    },
    {
      id: 'goals',
      label: 'Goals (5Y→1W)',
      icon: <Target className="w-3 h-3" aria-hidden="true" />,
    },
    {
      id: 'topics',
      label: 'Topics',
      icon: <BookOpen className="w-3 h-3" aria-hidden="true" />,
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: <CalendarIcon className="w-3 h-3" aria-hidden="true" />,
    },
    {
      id: 'braindump',
      label: 'Brain Dump',
      icon: <Layers className="w-3 h-3" aria-hidden="true" />,
    },
  ];

  return (
    <div
      data-testid="android-mobile-9-16-app"
      className="mx-auto h-[min(750px,calc(100vh-116px))] min-h-[580px] aspect-[9/16] w-auto max-w-full bg-slate-50 rounded-2xl shadow-sm flex flex-col overflow-hidden relative shrink-0"
    >
      {/* Android Status Bar */}
      <div className="bg-slate-900 text-white px-5 pt-2 pb-1.5 flex items-center justify-between text-[11px] font-mono select-none shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold">09:41</span>
          <span className="text-emerald-400 text-[10px]">Android 9:16</span>
        </div>
        <div
          className="w-16 h-3.5 bg-black rounded-full mx-auto"
          aria-hidden="true"
        />
        <div className="flex items-center gap-1.5 text-slate-300">
          <Signal className="w-3 h-3" aria-hidden="true" />
          <Wifi className="w-3 h-3" aria-hidden="true" />
          <BatteryCharging
            className="w-3.5 h-3.5 text-emerald-400"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Mobile Top App Bar (Strict <=15% Viewport Sticky Cap with Collapsible Studios Sheet) */}
      <div className="bg-white border-b border-slate-200 px-3.5 py-2 space-y-1.5 shrink-0">
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[15px] font-bold tracking-[-0.028em] text-slate-950 font-display truncate">
              FocusFlow
            </span>
            <span className="text-[11.5px] font-mono tabular-nums text-emerald-700 font-semibold shrink-0">
              · {stats.completionRate}%
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Right-Side Icon Cluster: Stats · Radar · Wheel · Side Hourly Bar */}
            <div
              role="group"
              aria-label="Right side tool icons"
              data-testid="mobile-right-icon-bar"
              className="flex items-center gap-1 shrink-0"
            >
              <button
                type="button"
                data-testid="mobile-right-icon-stats"
                onClick={() =>
                  setMobileTaskSubTab((prev) =>
                    prev === 'stats' ? null : 'stats'
                  )
                }
                aria-label="Toggle Stats Infographics"
                aria-pressed={mobileTaskSubTab === 'stats'}
                title="Stats & Consistency Infographics"
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                  mobileTaskSubTab === 'stats'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" aria-hidden="true" />
              </button>

              <button
                type="button"
                data-testid="mobile-right-icon-radar"
                onClick={() =>
                  setMobileTaskSubTab((prev) =>
                    prev === 'radar' ? null : 'radar'
                  )
                }
                aria-label="Toggle Life Focus Radar"
                aria-pressed={mobileTaskSubTab === 'radar'}
                title="7-Axis Life Focus Radar"
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                  mobileTaskSubTab === 'radar'
                    ? 'bg-purple-700 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <Hexagon className="w-3.5 h-3.5" aria-hidden="true" />
              </button>

              <button
                type="button"
                data-testid="mobile-right-icon-wheel"
                onClick={() =>
                  setMobileTaskSubTab((prev) =>
                    prev === 'wheel' ? null : 'wheel'
                  )
                }
                aria-label="Toggle Spin-the-Wheel Task Picker"
                aria-pressed={mobileTaskSubTab === 'wheel'}
                title="Spin-the-Wheel Task Picker"
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                  mobileTaskSubTab === 'wheel'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <CircleDot className="w-3.5 h-3.5" aria-hidden="true" />
              </button>

              <button
                type="button"
                data-testid="mobile-right-icon-hourly"
                onClick={() =>
                  setMobileTaskSubTab((prev) =>
                    prev === 'hourly' ? null : 'hourly'
                  )
                }
                aria-label="Toggle Side Hourly Bar"
                aria-pressed={mobileTaskSubTab === 'hourly'}
                title="Side Hourly Calendar Bar"
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                  mobileTaskSubTab === 'hourly'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>

            <details className="relative group">
              <summary className="list-none px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold flex items-center gap-1 cursor-pointer select-none whitespace-nowrap">
                <span>Studios</span>
                <ChevronDown className="w-3 h-3 text-slate-500 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="absolute right-0 mt-1.5 w-60 bg-white border border-slate-200 rounded-xl shadow-lg p-2 z-30 grid grid-cols-2 gap-1">
                {secondaryQuickPills.map((pill) => {
                  const isCurrent = activeView === pill.id;
                  return (
                    <button
                      key={pill.id}
                      type="button"
                      onClick={() => {
                        setMobileTaskSubTab(null);
                        onSelectView(pill.id);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
                        isCurrent
                          ? 'bg-slate-900 text-white font-semibold'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {pill.icon}
                      <span className="truncate">{pill.label}</span>
                    </button>
                  );
                })}
              </div>
            </details>
          </div>
        </div>
      </div>

      {/* Scrollable 9:16 Mobile Content Viewport */}
      <div className="flex-1 overflow-y-auto px-3.5 py-3.5 space-y-3.5 @container">
        {mobileTaskSubTab !== null ? (
          <div className="space-y-3">
            <div className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                {mobileTaskSubTab === 'stats' && (
                  <>
                    <BarChart3
                      className="w-4 h-4 text-emerald-600"
                      aria-hidden="true"
                    />
                    <span>Consistency &amp; Momentum Stats</span>
                  </>
                )}
                {mobileTaskSubTab === 'radar' && (
                  <>
                    <Hexagon
                      className="w-4 h-4 text-purple-600"
                      aria-hidden="true"
                    />
                    <span>7-Axis Life Focus Radar</span>
                  </>
                )}
                {mobileTaskSubTab === 'wheel' && (
                  <>
                    <CircleDot
                      className="w-4 h-4 text-blue-600"
                      aria-hidden="true"
                    />
                    <span>Spin-the-Wheel Task Picker</span>
                  </>
                )}
                {mobileTaskSubTab === 'hourly' && (
                  <>
                    <Clock
                      className="w-4 h-4 text-blue-600"
                      aria-hidden="true"
                    />
                    <span>Side Hourly Bar</span>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => setMobileTaskSubTab(null)}
                aria-label="Close tool panel"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {mobileTaskSubTab === 'stats' && (
              <ProductiveInfographicsPanel
                todayIso={todayIso}
                todos={todos}
                habits={habits}
                activeCategory={categoryFilter}
                onSelectCategory={(cat) => {
                  const nav = resolveRadarAreaNavigation(cat);
                  onSelectCategoryFilter(nav.categoryFilter);
                }}
                onToggleHabitDate={onToggleHabitDate}
              />
            )}

            {mobileTaskSubTab === 'radar' && (
              <LifeRadarChart
                todos={todos}
                activeCategory={categoryFilter}
                baseOverrides={radarBaseOverrides}
                onSelectCategory={(cat) => {
                  const nav = resolveRadarAreaNavigation(cat);
                  onSelectCategoryFilter(nav.categoryFilter);
                  onSelectView(nav.targetView);
                  setMobileTaskSubTab(null);
                }}
                onAdjustBaseScore={onAdjustBaseScore}
              />
            )}

            {mobileTaskSubTab === 'wheel' && (
              <TaskWheelPicker
                todos={todos}
                activeCategory={categoryFilter}
                selectedFocusTaskId={selectedFocusTaskId}
                onSelectFocusTask={onSelectFocusTask}
                onCompleteTask={onToggleTodo}
              />
            )}

            {mobileTaskSubTab === 'hourly' && (
              <HourlyCalendarPanel
                todos={todos}
                onToggleTodo={onToggleTodo}
                onAssignScheduledHour={onAssignScheduledHour}
                onAddTodoAtHour={onAddTodo}
                onCloseHourlyView={() => setMobileTaskSubTab(null)}
              />
            )}
          </div>
        ) : activeView === 'tasks' ? (
          <div className="space-y-3">
            {/* Horizontal 7 Life Area Filter Scroll */}
            <div
              role="group"
              aria-label="Mobile life area filter"
              className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar"
            >
              {CATEGORIES_WITH_ALL.map((area) => {
                const isActive = categoryFilter === area;
                return (
                  <button
                    key={area}
                    type="button"
                    onClick={() => onSelectCategoryFilter(area)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-slate-900 text-white'
                        : 'bg-white border border-slate-200 text-slate-600'
                    }`}
                  >
                    {area === 'All' ? 'All Areas' : area}
                  </button>
                );
              })}
            </div>

            {/* List / Kanban / Timeline Switcher for Mobile */}
            <div
              role="group"
              aria-label="Mobile task display mode"
              className="grid grid-cols-3 gap-1 bg-slate-200/70 p-1 rounded-xl"
            >
              <button
                type="button"
                onClick={() => onSelectTaskViewMode('list')}
                className={`py-1 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer ${
                  taskViewMode === 'list'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600'
                }`}
              >
                <ListTodo className="w-3 h-3" />
                <span>List</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectTaskViewMode('kanban')}
                className={`py-1 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer ${
                  taskViewMode === 'kanban'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600'
                }`}
              >
                <Kanban className="w-3 h-3" />
                <span>Kanban</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectTaskViewMode('timeline')}
                className={`py-1 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer ${
                  taskViewMode === 'timeline'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600'
                }`}
              >
                <GitCommitHorizontal className="w-3 h-3" />
                <span>Timeline</span>
              </button>
            </div>

            {/* Quick Add Task */}
            <QuickAddTask
              defaultCategory={
                categoryFilter === 'All' ? 'Portfolio' : categoryFilter
              }
              onAdd={onAddTodo}
            />

            {taskViewMode === 'list' ? (
              <ProductiveDayFeed
                todayIso={todayIso}
                todos={visibleTodos}
                habits={
                  categoryFilter === 'All'
                    ? habits
                    : habits.filter((h) => h.lifeArea === categoryFilter)
                }
                selectedFocusTaskId={selectedFocusTaskId}
                onToggleTodo={onToggleTodo}
                onDeleteTodo={onDeleteTodo}
                onUpdateTodo={onUpdateTodo}
                onAddSubtask={onAddSubtask}
                onToggleSubtask={onToggleSubtask}
                onDeleteSubtask={onDeleteSubtask}
                onAssignScheduledHour={onAssignScheduledHour}
                onToggleHabitDate={onToggleHabitDate}
                onDeployRoutineTaskToTodo={onAddTodo}
              />
            ) : (
              <TaskViewsContainer
                mode={taskViewMode}
                todos={visibleTodos}
                onToggleTodo={onToggleTodo}
                onDeleteTodo={onDeleteTodo}
                onMoveKanbanStage={onMoveKanbanStage}
              />
            )}

            {/* Real-Time Flip Clock & MemoSpike Completed Spindle in Mobile Studio Shelf */}
            <RealTimeFlipClock
              todos={todos}
              defaultCompact={true}
              onCompleteTask={onToggleTodo}
              onOpenFocusTimer={() => onSelectView('timer')}
            />

            <MemoSpikeWidget
              todos={todos}
              activeCategory={categoryFilter}
              onSpikeTask={onToggleTodo}
            />
          </div>
        ) : activeView === 'flipclock' ? (
          <RealTimeFlipClock
            todos={todos}
            defaultCompact={true}
            onCompleteTask={onToggleTodo}
            onOpenFocusTimer={() => onSelectView('timer')}
          />
        ) : activeView === 'visions' ? (
          <VisionDashboard
            topics={topics}
            roadmaps={goalRoadmaps}
            habits={habits}
            todos={todos}
            brainDumpItems={brainDumpItems}
            onNavigateTab={(tab) => onSelectView(tab)}
            onDeployRoutineTaskToTodo={onAddTodo}
            onToggleTodo={onToggleTodo}
          />
        ) : activeView === 'maps' ? (
          <GoogleMapsDashboard
            todos={todos}
            habits={habits}
            topics={topics}
            onAddTodoWithLocation={onAddTodo}
          />
        ) : activeView === 'backlog' ? (
          <BacklogDashboard
            todos={todos}
            brainDumpItems={brainDumpItems}
            onAddBacklogTodo={onAddTodo}
            onToggleTodo={onToggleTodo}
            onDeleteTodo={onDeleteTodo}
            onUpdateTodo={onUpdateTodo}
            onAssignScheduledHour={onAssignScheduledHour}
            onPromoteBrainDumpItem={onSwipeRight}
            onRestoreBrainDumpToDeck={onRestoreToDeck}
            onDeleteBrainDumpItem={onDeleteDumpItem}
          />
        ) : activeView === 'affirmations' ? (
          <AffirmationDashboard />
        ) : activeView === 'reflect' ? (
          <ReflectDashboard
            todos={todos}
            onOpenEisenhowerMatrix={() => onSelectView('matrix')}
            onAddTaskFromReflection={(params) => onAddTodo({ ...params })}
          />
        ) : activeView === 'plan' ? (
          <ExcalidrawPlanDashboard
            todos={todos}
            topics={topics}
            onAddTodoFromCanvas={onAddTodo}
          />
        ) : activeView === 'habits' ? (
          <HabitDashboard
            habits={habits}
            todos={todos}
            onToggleHabitDate={onToggleHabitDate}
            onAddHabit={onAddHabit}
            onDeployRoutineTaskToTodo={onAddTodo}
          />
        ) : activeView === 'matrix' ? (
          <EisenhowerMatrix
            todos={todos}
            onToggleTodo={onToggleTodo}
            onDeleteTodo={onDeleteTodo}
            onAssignQuadrant={onAssignQuadrant}
            onAddTodoInQuadrant={(params) =>
              onAddTodo({ ...params, isRepeating: false })
            }
          />
        ) : activeView === 'network' ? (
          <RelationshipOrgDashboard
            contacts={contacts}
            organizations={organizations}
            onLogCheckIn={onLogRelationshipCheckIn}
            onAddContact={onAddContact}
            onAddOrganization={onAddOrganization}
            onPushNextActionToTodo={(title, notes, lifeArea) => {
              onAddTodo({
                title,
                notes,
                priority: 'high',
                category: lifeArea,
                dueDate: new Date().toISOString().slice(0, 10),
                isRepeating: false,
              });
              onSelectView('tasks');
            }}
          />
        ) : activeView === 'journal' ? (
          <JournalDashboard
            entries={journalEntries}
            onAddEntry={onAddJournalEntry}
            onDeleteEntry={onDeleteJournalEntry}
          />
        ) : activeView === 'timer' ? (
          <FocusDoteTimer
            todos={todos}
            focusLogs={focusLogs}
            onLogSession={onLogFocusSession}
            onCompleteLinkedTask={onToggleTodo}
          />
        ) : activeView === 'goals' ? (
          <GoalPlanner
            topics={topics}
            roadmaps={goalRoadmaps}
            activeTopicId={selectedTopicId}
            onSelectTopic={(id) => onSelectTopicId(id)}
            onUpdateHorizonAnswer={onUpdateHorizonAnswer}
            onToggleHorizonCompleted={onToggleHorizonCompleted}
            onPushHorizonToTodo={onPushHorizonToTodo}
            onOpenTopicDetail={(topicId) => {
              onSelectTopicId(topicId);
              onSelectView('topics');
            }}
          />
        ) : activeView === 'topics' ? (
          <TopicDashboard
            topics={topics}
            roadmaps={goalRoadmaps}
            selectedTopicId={selectedTopicId}
            onSelectTopicId={onSelectTopicId}
            onCreateTopic={onCreateTopic}
            onUpdateProgress={onUpdateTopicProgress}
            onAddResource={onAddTopicResource}
            onToggleResource={onToggleTopicResource}
            onDeleteResource={onDeleteTopicResource}
            onNavigateToLifeArea={(area) => {
              onSelectCategoryFilter(area);
              onSelectView('tasks');
            }}
            onOpenGoalPlanner={(topicId) => {
              onSelectTopicId(topicId);
              onSelectView('goals');
            }}
            onToggleHorizonCompleted={onToggleHorizonCompleted}
          />
        ) : activeView === 'calendar' ? (
          <CalendarWorkspace
            todos={todos}
            onAddTodoOnDate={onAddTodo}
            onToggleTodo={onToggleTodo}
          />
        ) : (
          <BrainDumpSwiper
            items={brainDumpItems}
            onAddDumpItems={onAddDumpItems}
            onSwipeRight={onSwipeRight}
            onSwipeLeft={onSwipeLeft}
            onRestoreToDeck={onRestoreToDeck}
            onDeleteDumpItem={onDeleteDumpItem}
            onSwitchToTodoList={() => onSelectView('tasks')}
          />
        )}
      </div>

      {/* Bottom Navigation Bar for Android 9:16 Version (44x44px Minimum Touch Hitboxes) */}
      <nav
        aria-label="Android bottom navigation bar"
        data-testid="android-bottom-nav"
        className="bg-white border-t border-slate-200 px-2 pt-1 pb-1 grid grid-cols-5 gap-1 shrink-0"
      >
        {bottomNavItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectView(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`min-h-[48px] min-w-[44px] py-1 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer relative whitespace-nowrap ${
                isActive
                  ? 'text-slate-900 font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <div
                className={`px-2.5 py-0.5 rounded-full flex items-center justify-center transition-colors ${
                  isActive ? 'bg-emerald-100 text-emerald-900' : ''
                }`}
              >
                {item.icon}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-1 text-[10px] font-mono tabular-nums font-bold">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] leading-tight tracking-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Android Gesture Navigation Pill */}
      <div className="bg-white pb-2 pt-0.5 flex justify-center shrink-0">
        <div
          className="w-28 h-1 rounded-full bg-slate-300"
          aria-hidden="true"
        />
      </div>
    </div>
  );
};
