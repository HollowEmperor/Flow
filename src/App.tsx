import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  ListTodo,
  Trash2,
  RotateCcw,
  SlidersHorizontal,
  Layers,
  BookOpen,
  Target,
  Calendar as CalendarIcon,
} from 'lucide-react';
import {
  Category,
  LIFE_AREAS,
  Priority,
  StatusFilter,
  SortOption,
  TodoItem,
  BrainDumpItem,
  TopicItem,
  TopicResourceType,
  GoalHorizonKey,
  TopicGoalRoadmap,
  createTodoItem,
  toggleTodoCompletion,
  updateTodoItem,
  deleteTodoItem,
  clearCompletedTodos,
  addSubtask,
  toggleSubtask,
  deleteSubtask,
  filterAndSortTodos,
  computeTodoStats,
  getInitialSeedTodos,
  didTaskTransitionToCompleted,
  parseBrainDumpInput,
  swipeBrainDumpRight,
  swipeBrainDumpLeft,
  restoreStoredBrainDumpToDeck,
  deleteBrainDumpItem,
  getInitialSeedBrainDump,
  normalizeCategory,
  getInitialSeedTopics,
  createTopicItem,
  updateTopicProgress,
  addTopicResource,
  toggleTopicResourceCompletion,
  deleteTopicResource,
  getInitialSeedGoalRoadmaps,
  createTopicGoalRoadmap,
  updateGoalHorizonAnswer,
  toggleGoalHorizonStepWithTopicSync,
} from './utils/todoLogic';
import { QuickAddTask } from './components/QuickAddTask';
import { TaskRow } from './components/TaskRow';
import { TaskWheelPicker } from './components/TaskWheelPicker';
import { ConfettiOverlay, CelebrationEvent } from './components/ConfettiOverlay';
import { BrainDumpSwiper } from './components/BrainDumpSwiper';
import { LifeRadarChart } from './components/LifeRadarChart';
import { TopicDashboard } from './components/TopicDashboard';
import { GoalPlanner } from './components/GoalPlanner';
import { CalendarWorkspace } from './components/CalendarWorkspace';

const STORAGE_KEY = 'focusflow_todos_v3';
const BRAINDUMP_STORAGE_KEY = 'focusflow_braindump_v2';
const RADAR_BASE_STORAGE_KEY = 'focusflow_radar_base_v1';
const TOPICS_STORAGE_KEY = 'focusflow_topics_v1';
const GOAL_ROADMAPS_STORAGE_KEY = 'focusflow_goal_roadmaps_v1';

const CATEGORIES_WITH_ALL: Array<Category | 'All'> = ['All', ...LIFE_AREAS];

export default function App() {
  const [todos, setTodos] = useState<TodoItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((t: TodoItem) => ({
            ...t,
            category: normalizeCategory(t.category),
          }));
        }
      }
    } catch {
      // Fallback to seed data if storage is unavailable
    }
    return getInitialSeedTodos();
  });

  const [brainDumpItems, setBrainDumpItems] = useState<BrainDumpItem[]>(() => {
    try {
      const saved = localStorage.getItem(BRAINDUMP_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((d: BrainDumpItem) => ({
            ...d,
            category: normalizeCategory(d.category),
          }));
        }
      }
    } catch {
      // Fallback to seed data
    }
    return getInitialSeedBrainDump();
  });

  const [topics, setTopics] = useState<TopicItem[]>(() => {
    try {
      const saved = localStorage.getItem(TOPICS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((tp: TopicItem) => ({
            ...tp,
            lifeArea: normalizeCategory(tp.lifeArea),
          }));
        }
      }
    } catch {
      // Fallback to seed data
    }
    return getInitialSeedTopics();
  });

  const [goalRoadmaps, setGoalRoadmaps] = useState<TopicGoalRoadmap[]>(() => {
    try {
      const saved = localStorage.getItem(GOAL_ROADMAPS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback to seed data
    }
    return getInitialSeedGoalRoadmaps();
  });

  const [radarBaseOverrides, setRadarBaseOverrides] = useState<
    Partial<Record<Category, number>>
  >(() => {
    try {
      const saved = localStorage.getItem(RADAR_BASE_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved) ?? {};
      }
    } catch {
      // Ignore
    }
    return {};
  });

  const [activeView, setActiveView] = useState<
    'tasks' | 'goals' | 'topics' | 'calendar' | 'braindump'
  >('tasks');
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'All'>('All');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('dueDate');
  const [selectedFocusTaskId, setSelectedFocusTaskId] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<CelebrationEvent | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch {
      // Ignore storage quota errors
    }
  }, [todos]);

  useEffect(() => {
    try {
      localStorage.setItem(BRAINDUMP_STORAGE_KEY, JSON.stringify(brainDumpItems));
    } catch {
      // Ignore storage quota errors
    }
  }, [brainDumpItems]);

  useEffect(() => {
    try {
      localStorage.setItem(TOPICS_STORAGE_KEY, JSON.stringify(topics));
    } catch {
      // Ignore storage quota errors
    }
  }, [topics]);

  useEffect(() => {
    try {
      localStorage.setItem(
        GOAL_ROADMAPS_STORAGE_KEY,
        JSON.stringify(goalRoadmaps)
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [goalRoadmaps]);

  useEffect(() => {
    try {
      localStorage.setItem(
        RADAR_BASE_STORAGE_KEY,
        JSON.stringify(radarBaseOverrides)
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [radarBaseOverrides]);

  const stats = useMemo(() => computeTodoStats(todos), [todos]);

  const brainDumpQueueCount = useMemo(
    () => brainDumpItems.filter((i) => i.status === 'queue').length,
    [brainDumpItems]
  );

  const visibleTodos = useMemo(
    () =>
      filterAndSortTodos(todos, {
        status: statusFilter,
        category: categoryFilter,
        priority: priorityFilter,
        searchQuery,
        sortBy,
      }),
    [todos, statusFilter, categoryFilter, priorityFilter, searchQuery, sortBy]
  );

  const handleAddTodo = (params: {
    title: string;
    notes: string;
    priority: Priority;
    category: Category;
    dueDate: string;
    isRepeating: boolean;
  }) => {
    const newItem = createTodoItem({
      ...params,
      streakCount: params.isRepeating ? 1 : 0,
    });
    setTodos((prev) => [newItem, ...prev]);
  };

  const handleToggleTodo = (id: string) => {
    const completedTask = didTaskTransitionToCompleted(todos, id);
    if (completedTask) {
      setCelebration({
        id: Date.now(),
        taskTitle: completedTask.title,
      });
    }
    setTodos((prev) => toggleTodoCompletion(prev, id));
  };

  const handleUpdateTodo = (
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
      >
    >
  ) => {
    setTodos((prev) => updateTodoItem(prev, id, updates));
  };

  const handleDeleteTodo = (id: string) => {
    setTodos((prev) => deleteTodoItem(prev, id));
  };

  const handleClearCompleted = () => {
    setTodos((prev) => clearCompletedTodos(prev));
  };

  const handleResetDemo = () => {
    setTodos(getInitialSeedTodos());
    setBrainDumpItems(getInitialSeedBrainDump());
    setTopics(getInitialSeedTopics());
    setGoalRoadmaps(getInitialSeedGoalRoadmaps());
    setRadarBaseOverrides({});
    setStatusFilter('all');
    setCategoryFilter('All');
    setPriorityFilter('All');
    setSearchQuery('');
  };

  const handleAddSubtask = (todoId: string, title: string) => {
    setTodos((prev) => addSubtask(prev, todoId, title));
  };

  const handleToggleSubtask = (todoId: string, subtaskId: string) => {
    setTodos((prev) => toggleSubtask(prev, todoId, subtaskId));
  };

  const handleDeleteSubtask = (todoId: string, subtaskId: string) => {
    setTodos((prev) => deleteSubtask(prev, todoId, subtaskId));
  };

  const handleAdjustBaseScore = (area: Category, delta: number) => {
    setRadarBaseOverrides((prev) => {
      const current = prev[area] ?? 55;
      const next = Math.max(10, Math.min(90, current + delta));
      return { ...prev, [area]: next };
    });
  };

  // Brain Dump Handlers
  const handleAddDumpItems = (
    rawText: string,
    category: Category,
    priority: Priority
  ) => {
    const newItems = parseBrainDumpInput(rawText, category, priority);
    if (newItems.length > 0) {
      setBrainDumpItems((prev) => [...newItems, ...prev]);
    }
  };

  const handleSwipeRight = (itemId: string) => {
    const outcome = swipeBrainDumpRight(brainDumpItems, todos, itemId);
    setBrainDumpItems(outcome.dumpItems);
    setTodos(outcome.todos);
  };

  const handleSwipeLeft = (itemId: string) => {
    setBrainDumpItems((prev) => swipeBrainDumpLeft(prev, itemId));
  };

  const handleRestoreToDeck = (itemId: string) => {
    setBrainDumpItems((prev) => restoreStoredBrainDumpToDeck(prev, itemId));
  };

  const handleDeleteDumpItem = (itemId: string) => {
    setBrainDumpItems((prev) => deleteBrainDumpItem(prev, itemId));
  };

  // Topic Dashboard & Multi-Horizon Goal Roadmap Handlers
  const handleCreateTopic = (params: {
    title: string;
    description: string;
    lifeArea: Category;
    goalLabel: string;
    targetUnits: number;
    unitName: string;
  }) => {
    const created = createTopicItem(params);
    setTopics((prev) => [created, ...prev]);
    const roadmap = createTopicGoalRoadmap({
      topicId: created.id,
      lifeArea: created.lifeArea,
    });
    setGoalRoadmaps((prev) => [roadmap, ...prev]);
  };

  const handleUpdateTopicProgress = (topicId: string, deltaUnits: number) => {
    setTopics((prev) => updateTopicProgress(prev, topicId, deltaUnits));
  };

  const handleAddTopicResource = (
    topicId: string,
    resource: { title: string; type: TopicResourceType; url: string }
  ) => {
    setTopics((prev) => addTopicResource(prev, topicId, resource));
  };

  const handleToggleTopicResource = (topicId: string, resourceId: string) => {
    setTopics((prev) =>
      toggleTopicResourceCompletion(prev, topicId, resourceId)
    );
  };

  const handleDeleteTopicResource = (topicId: string, resourceId: string) => {
    setTopics((prev) => deleteTopicResource(prev, topicId, resourceId));
  };

  const handleUpdateHorizonAnswer = (
    topicId: string,
    horizon: GoalHorizonKey,
    answer: string
  ) => {
    const matchedTopic = topics.find((t) => t.id === topicId);
    const fallbackArea: Category = matchedTopic?.lifeArea ?? 'Portfolio';
    setGoalRoadmaps((prev) => {
      const exists = prev.some((r) => r.topicId === topicId);
      const base = exists
        ? prev
        : [
            ...prev,
            createTopicGoalRoadmap({ topicId, lifeArea: fallbackArea }),
          ];
      return updateGoalHorizonAnswer(base, topicId, horizon, answer);
    });
  };

  const handleToggleHorizonCompleted = (
    topicId: string,
    horizon: GoalHorizonKey
  ) => {
    const matchedTopic = topics.find((t) => t.id === topicId);
    const fallbackArea: Category = matchedTopic?.lifeArea ?? 'Portfolio';
    const exists = goalRoadmaps.some((r) => r.topicId === topicId);
    const currentRoadmaps = exists
      ? goalRoadmaps
      : [
          ...goalRoadmaps,
          createTopicGoalRoadmap({ topicId, lifeArea: fallbackArea }),
        ];
    const synced = toggleGoalHorizonStepWithTopicSync(
      currentRoadmaps,
      topics,
      topicId,
      horizon
    );
    setGoalRoadmaps(synced.roadmaps);
    setTopics(synced.topics);
  };

  const handlePushHorizonToTodo = (
    title: string,
    notes: string,
    topic: TopicItem
  ) => {
    const newItem = createTodoItem({
      title,
      notes,
      priority: 'high',
      category: topic.lifeArea,
      dueDate: new Date().toISOString().slice(0, 10),
      isRepeating: false,
    });
    setTodos((prev) => [newItem, ...prev]);
  };

  const focusQuickAdd = () => {
    setActiveView('tasks');
    window.setTimeout(() => {
      const input = document.getElementById('new-task-title');
      if (input) input.focus();
    }, 20);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <ConfettiOverlay
        celebration={celebration}
        onDismiss={() => setCelebration(null)}
      />

      {/* Top Bar Contract: 3 zones (Brand, 5 concise single-line nav links, 1 primary action) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-6 py-3.5 flex items-center justify-between gap-8">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveView('tasks');
            setCategoryFilter('All');
            setStatusFilter('all');
          }}
          className="text-lg font-bold tracking-tight text-slate-900 font-display whitespace-nowrap shrink-0"
        >
          FocusFlow
        </a>

        <nav
          aria-label="Primary workspace navigation"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
        >
          <button
            type="button"
            onClick={() => setActiveView('tasks')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 border-b-2 ${
              activeView === 'tasks'
                ? 'text-slate-900 border-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Tasks
          </button>
          <button
            type="button"
            onClick={() => setActiveView('goals')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 border-b-2 ${
              activeView === 'goals'
                ? 'text-slate-900 border-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Goals (5Y→1W)
          </button>
          <button
            type="button"
            onClick={() => setActiveView('topics')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 border-b-2 ${
              activeView === 'topics'
                ? 'text-slate-900 border-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Topic Dashboard
          </button>
          <button
            type="button"
            onClick={() => setActiveView('calendar')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 border-b-2 ${
              activeView === 'calendar'
                ? 'text-slate-900 border-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Calendar
          </button>
          <button
            type="button"
            onClick={() => setActiveView('braindump')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 border-b-2 ${
              activeView === 'braindump'
                ? 'text-slate-900 border-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Brain Dump
          </button>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={focusQuickAdd}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            New Task
          </button>
        </div>
      </header>

      {/* Main 1440px Multi-Column Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sidebar: Workspace Mode Switcher, 7-Axis Life Radar Chart, Task Wheel Picker & Overview */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Workspace Mode Switcher (5 modes: Tasks, Goals, Topics, Calendar, Brain Dump) */}
          <section
            aria-label="Workspace mode"
            className="bg-white border border-slate-200 rounded-xl p-1.5 grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-3 gap-1"
          >
            <button
              type="button"
              onClick={() => setActiveView('tasks')}
              className={`py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeView === 'tasks'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Tasks ({stats.active})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('goals')}
              className={`py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeView === 'goals'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Target className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Goals</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('topics')}
              className={`py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeView === 'topics'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Topics ({topics.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('calendar')}
              className={`py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeView === 'calendar'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <CalendarIcon
                className="w-3.5 h-3.5 shrink-0"
                aria-hidden="true"
              />
              <span>Calendar</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('braindump')}
              className={`py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeView === 'braindump'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Dump ({brainDumpQueueCount})</span>
            </button>
          </section>

          {/* 7-Point Life Balance Radar Chart */}
          <LifeRadarChart
            todos={todos}
            activeCategory={categoryFilter}
            baseOverrides={radarBaseOverrides}
            onSelectCategory={(cat) => {
              setActiveView('tasks');
              setCategoryFilter(cat);
            }}
            onAdjustBaseScore={handleAdjustBaseScore}
          />

          {/* Task Wheel Picker */}
          <TaskWheelPicker
            todos={todos}
            activeCategory={categoryFilter}
            selectedFocusTaskId={selectedFocusTaskId}
            onSelectFocusTask={setSelectedFocusTaskId}
            onCompleteTask={handleToggleTodo}
          />

          {/* Progress Summary Surface */}
          <section
            aria-label="Daily progress summary"
            className="bg-white border border-slate-200 rounded-xl p-5"
          >
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Task Overview
              </h2>
              <span className="text-xs font-mono tabular-nums font-semibold text-emerald-700">
                {stats.completionRate}% done
              </span>
            </div>

            <div
              className="mt-3 h-2 w-full bg-slate-100 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={stats.completionRate}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full bg-emerald-600 transition-transform duration-200 origin-left"
                style={{
                  transform: `scaleX(${stats.completionRate / 100})`,
                }}
              />
            </div>

            <dl className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
              <div>
                <dt className="text-xs text-slate-500">Active</dt>
                <dd
                  data-testid="stat-active"
                  className="mt-0.5 text-lg font-bold font-mono tabular-nums text-slate-900"
                >
                  {stats.active}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Completed</dt>
                <dd
                  data-testid="stat-completed"
                  className="mt-0.5 text-lg font-bold font-mono tabular-nums text-emerald-700"
                >
                  {stats.completed}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">High Prio</dt>
                <dd
                  data-testid="stat-high-priority"
                  className="mt-0.5 text-lg font-bold font-mono tabular-nums text-red-600"
                >
                  {stats.highPriorityActive}
                </dd>
              </div>
            </dl>
          </section>
        </aside>

        {/* Main Workspace Column */}
        <section className="lg:col-span-8 space-y-5">
          {activeView === 'goals' ? (
            <GoalPlanner
              topics={topics}
              roadmaps={goalRoadmaps}
              activeTopicId={selectedTopicId}
              onSelectTopic={(id) => setSelectedTopicId(id)}
              onUpdateHorizonAnswer={handleUpdateHorizonAnswer}
              onToggleHorizonCompleted={handleToggleHorizonCompleted}
              onPushHorizonToTodo={handlePushHorizonToTodo}
              onOpenTopicDetail={(topicId) => {
                setSelectedTopicId(topicId);
                setActiveView('topics');
              }}
            />
          ) : activeView === 'topics' ? (
            <TopicDashboard
              topics={topics}
              roadmaps={goalRoadmaps}
              selectedTopicId={selectedTopicId}
              onSelectTopicId={setSelectedTopicId}
              onCreateTopic={handleCreateTopic}
              onUpdateProgress={handleUpdateTopicProgress}
              onAddResource={handleAddTopicResource}
              onToggleResource={handleToggleTopicResource}
              onDeleteResource={handleDeleteTopicResource}
              onNavigateToLifeArea={(area) => {
                setCategoryFilter(area);
                setActiveView('tasks');
              }}
              onOpenGoalPlanner={(topicId) => {
                setSelectedTopicId(topicId);
                setActiveView('goals');
              }}
              onToggleHorizonCompleted={handleToggleHorizonCompleted}
            />
          ) : activeView === 'calendar' ? (
            <CalendarWorkspace
              todos={todos}
              onAddTodoOnDate={handleAddTodo}
              onToggleTodo={handleToggleTodo}
            />
          ) : activeView === 'braindump' ? (
            <BrainDumpSwiper
              items={brainDumpItems}
              onAddDumpItems={handleAddDumpItems}
              onSwipeRight={handleSwipeRight}
              onSwipeLeft={handleSwipeLeft}
              onRestoreToDeck={handleRestoreToDeck}
              onDeleteDumpItem={handleDeleteDumpItem}
              onSwitchToTodoList={() => setActiveView('tasks')}
            />
          ) : (
            <>
              {/* Page Header & Contextual Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">
                    {categoryFilter === 'All' ? 'All Life Areas' : `${categoryFilter} Tasks`}
                  </h1>
                  <p className="text-sm text-slate-600 mt-0.5">
                    {stats.active === 0
                      ? 'All caught up! Add a new task below or swipe from your Brain Dump.'
                      : `You have ${stats.active} active ${
                          stats.active === 1 ? 'task' : 'tasks'
                        } across your 7 core areas.`}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveView('goals')}
                    className="px-3 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Target className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                    <span>Goals (5Y→1W)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveView('topics')}
                    className="px-3 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
                    <span>Topic Dashboard ({topics.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveView('calendar')}
                    className="px-3 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <CalendarIcon className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
                    <span>Calendar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveView('braindump')}
                    className="px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Open Brain Dump ({brainDumpQueueCount})</span>
                  </button>

                  {stats.completed > 0 && (
                    <button
                      type="button"
                      onClick={handleClearCompleted}
                      className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                      <span>Clear Completed ({stats.completed})</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleResetDemo}
                    className="px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                    <span>Reset Sample Tasks</span>
                  </button>
                </div>
              </div>

              {/* Interactive 7-Area Filter Bar */}
              <div
                role="group"
                aria-label="Filter by life focus area"
                className="flex flex-wrap items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-2"
              >
                {CATEGORIES_WITH_ALL.map((area) => {
                  const isActive = categoryFilter === area;
                  return (
                    <button
                      key={area}
                      type="button"
                      onClick={() => setCategoryFilter(area)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        isActive
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      {area === 'All' ? 'All Areas' : area}
                    </button>
                  );
                })}
              </div>

              {/* Quick Add Task Bar */}
              <QuickAddTask
                defaultCategory={categoryFilter === 'All' ? 'Portfolio' : categoryFilter}
                onAdd={handleAddTodo}
              />

              {/* Search, Status Tabs, and Sort Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-3">
                <div
                  role="group"
                  aria-label="Filter tasks by completion status"
                  className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start"
                >
                  {(
                    [
                      { id: 'all', label: `All (${stats.total})` },
                      { id: 'active', label: `Active (${stats.active})` },
                      { id: 'completed', label: `Completed (${stats.completed})` },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setStatusFilter(tab.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        statusFilter === tab.id
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-1 sm:max-w-md items-center gap-2">
                  <div className="relative flex-1">
                    <Search
                      className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <label htmlFor="search-tasks" className="sr-only">
                      Search tasks
                    </label>
                    <input
                      id="search-tasks"
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search tasks or notes..."
                      className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <SlidersHorizontal
                      className="w-3.5 h-3.5 text-slate-400 hidden sm:inline"
                      aria-hidden="true"
                    />
                    <label htmlFor="sort-tasks" className="sr-only">
                      Sort tasks by
                    </label>
                    <select
                      id="sort-tasks"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-slate-400"
                    >
                      <option value="dueDate">Sort: Due Date</option>
                      <option value="priority">Sort: Priority</option>
                      <option value="created">Sort: Newest</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Task List Container */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                {visibleTodos.length > 0 ? (
                  <div divide-y="true" role="list" aria-label="Task list">
                    {visibleTodos.map((todo) => (
                      <TaskRow
                        key={todo.id}
                        todo={todo}
                        isFocused={selectedFocusTaskId === todo.id}
                        onToggle={handleToggleTodo}
                        onDelete={handleDeleteTodo}
                        onUpdate={handleUpdateTodo}
                        onAddSubtask={handleAddSubtask}
                        onToggleSubtask={handleToggleSubtask}
                        onDeleteSubtask={handleDeleteSubtask}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-14 px-6 text-center">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
                      {todos.length === 0 ? (
                        <ListTodo className="w-5 h-5" aria-hidden="true" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      {todos.length === 0
                        ? 'Your task list is empty'
                        : 'No matching tasks found'}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                      {todos.length === 0
                        ? 'Add your first task above to start organizing your day.'
                        : 'Try clearing your search query or switching the active status and life area filters.'}
                    </p>
                    {(statusFilter !== 'all' ||
                      categoryFilter !== 'All' ||
                      priorityFilter !== 'All' ||
                      searchQuery.trim() !== '') && (
                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter('all');
                          setCategoryFilter('All');
                          setPriorityFilter('All');
                          setSearchQuery('');
                        }}
                        className="mt-4 px-3.5 py-2 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                      >
                        Clear All Filters
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            FocusFlow — Portfolio · Karma · Knowledge · Personality · Social · Strength · Aesthetics
          </span>
          <span className="font-mono tabular-nums">
            {stats.completed} of {stats.total} tasks completed
          </span>
        </div>
      </footer>
    </div>
  );
}
