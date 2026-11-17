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
  Tablet,
  Smartphone,
  Columns2,
  Plus,
  LayoutGrid,
  Users,
  Timer,
  BookText,
  Flame,
  Clock,
  BarChart3,
  Hexagon,
  CircleDot,
  X,
  Award,
  Kanban,
  GitCommitHorizontal,
  PenTool,
  Grid3X3,
  Archive,
  Brain,
  Compass,
  MapPin,
} from 'lucide-react';
import {
  AppLayoutVersion,
  WorkspaceTab,
  TaskRightPanelMode,
  TaskViewMode,
  KanbanStage,
  EisenhowerQuadrant,
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
  assignTaskQuadrant,
  assignTodoScheduledHour,
  moveTodoToKanbanStage,
  createRelationshipContact,
  logRelationshipCheckIn,
  createOrganizationItem,
  getInitialSeedRelationships,
  getInitialSeedOrganizations,
  createFocusSessionLog,
  getInitialSeedFocusLogs,
  createJournalEntry,
  deleteJournalEntry,
  getInitialSeedJournalEntries,
  createHabitItem,
  toggleHabitDateCompletion,
  getInitialSeedHabits,
  resolveRadarAreaNavigation,
  computeCalendarTearOffSequence,
  offsetIsoDate,
  getTodayIsoDate,
  punchTaskDay,
  extractAutoTaskPunchCards,
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
import { AndroidMobileApp } from './components/AndroidMobileApp';
import { EisenhowerMatrix } from './components/EisenhowerMatrix';
import { RelationshipOrgDashboard } from './components/RelationshipOrgDashboard';
import { FocusDoteTimer } from './components/FocusDoteTimer';
import { HourlyCalendarPanel } from './components/HourlyCalendarPanel';
import { TaskViewsContainer } from './components/TaskViewsContainer';
import { JournalDashboard } from './components/JournalDashboard';
import { HabitDashboard } from './components/HabitDashboard';
import { MemoSpikeWidget } from './components/MemoSpikeWidget';
import { CalendarTearOffModal } from './components/CalendarTearOffModal';
import { ExcalidrawPlanDashboard } from './components/ExcalidrawPlanDashboard';
import { BingoPunchCardDashboard } from './components/BingoPunchCardDashboard';
import { CadenceReviewWidget } from './components/CadenceReviewWidget';
import { BacklogDashboard } from './components/BacklogDashboard';
import { AffirmationDashboard } from './components/AffirmationDashboard';
import { ReflectDashboard } from './components/ReflectDashboard';
import { VisionDashboard } from './components/VisionDashboard';
import { GoogleMapsDashboard } from './components/GoogleMapsDashboard';
import { RealTimeFlipClock } from './components/RealTimeFlipClock';
import { ProductiveDayFeed } from './components/ProductiveDayFeed';
import { ProductiveInfographicsPanel } from './components/ProductiveInfographicsPanel';

const STORAGE_KEY = 'focusflow_todos_v5';
const BRAINDUMP_STORAGE_KEY = 'focusflow_braindump_v2';
const RADAR_BASE_STORAGE_KEY = 'focusflow_radar_base_v1';
const TOPICS_STORAGE_KEY = 'focusflow_topics_v1';
const GOAL_ROADMAPS_STORAGE_KEY = 'focusflow_goal_roadmaps_v1';
const CONTACTS_STORAGE_KEY = 'focusflow_contacts_v1';
const ORGS_STORAGE_KEY = 'focusflow_orgs_v1';
const FOCUS_LOGS_STORAGE_KEY = 'focusflow_focus_logs_v1';
const JOURNAL_STORAGE_KEY = 'focusflow_journal_v1';
const HABITS_STORAGE_KEY = 'focusflow_habits_v3';
const CALENDAR_TEAR_STORAGE_KEY = 'focusflow_last_calendar_tear_date_v1';

const CATEGORIES_WITH_ALL: Array<Category | 'All'> = ['All', ...LIFE_AREAS];

export default function App() {
  const [todos, setTodos] = useState<TodoItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
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

  const [contacts, setContacts] = useState<RelationshipContact[]>(() => {
    try {
      const saved = localStorage.getItem(CONTACTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return getInitialSeedRelationships();
  });

  const [organizations, setOrganizations] = useState<OrganizationItem[]>(() => {
    try {
      const saved = localStorage.getItem(ORGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return getInitialSeedOrganizations();
  });

  const [focusLogs, setFocusLogs] = useState<FocusSessionLog[]>(() => {
    try {
      const saved = localStorage.getItem(FOCUS_LOGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return getInitialSeedFocusLogs();
  });

  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    try {
      const saved = localStorage.getItem(JOURNAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return getInitialSeedJournalEntries();
  });

  const [habits, setHabits] = useState<HabitItem[]>(() => {
    try {
      const saved = localStorage.getItem(HABITS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return getInitialSeedHabits();
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

  const [layoutVersion, setLayoutVersion] = useState<AppLayoutVersion>('tablet');
  const [activeView, setActiveView] = useState<WorkspaceTab>('tasks');
  const [taskViewMode, setTaskViewMode] = useState<TaskViewMode>('list');
  // Hidden by default: Stats, Radar, Wheel, and Side Hourly Bar only appear when their right-side icon is clicked
  const [taskRightPanelMode, setTaskRightPanelMode] =
    useState<TaskRightPanelMode>(null);
  const [activeDraggedTaskId, setActiveDraggedTaskId] = useState<string | null>(
    null
  );
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'All'>('All');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('dueDate');
  const [selectedFocusTaskId, setSelectedFocusTaskId] = useState<string | null>(
    null
  );
  const [celebration, setCelebration] = useState<CelebrationEvent | null>(null);
  const [gmpQuotaExceeded, setGmpQuotaExceeded] = useState(false);

  useEffect(() => {
    const handleQuotaExceeded = () => setGmpQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () =>
      window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
  }, []);

  // Daily Calendar Tear-Off Startup State (Plays Automatically Only Once Per Day)
  const todayIso = useMemo(() => getTodayIsoDate(), []);
  const [initialLastOpenedDateIso, setInitialLastOpenedDateIso] = useState<
    string | null
  >(() => {
    try {
      return localStorage.getItem(CALENDAR_TEAR_STORAGE_KEY);
    } catch {
      return null;
    }
  });

  const [isCalendarTearModalOpen, setIsCalendarTearModalOpen] =
    useState<boolean>(() => {
      try {
        const savedDate = localStorage.getItem(CALENDAR_TEAR_STORAGE_KEY);
        const seq = computeCalendarTearOffSequence(
          savedDate,
          getTodayIsoDate()
        );
        return seq.shouldPlayOnStartup;
      } catch {
        return true;
      }
    });

  useEffect(() => {
    try {
      localStorage.setItem(CALENDAR_TEAR_STORAGE_KEY, todayIso);
    } catch {
      // Ignore storage quota errors
    }
  }, [todayIso]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch {
      // Ignore storage quota errors
    }
  }, [todos]);

  useEffect(() => {
    try {
      localStorage.setItem(
        BRAINDUMP_STORAGE_KEY,
        JSON.stringify(brainDumpItems)
      );
    } catch {
      // Ignore
    }
  }, [brainDumpItems]);

  useEffect(() => {
    try {
      localStorage.setItem(TOPICS_STORAGE_KEY, JSON.stringify(topics));
    } catch {
      // Ignore
    }
  }, [topics]);

  useEffect(() => {
    try {
      localStorage.setItem(
        GOAL_ROADMAPS_STORAGE_KEY,
        JSON.stringify(goalRoadmaps)
      );
    } catch {
      // Ignore
    }
  }, [goalRoadmaps]);

  useEffect(() => {
    try {
      localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(contacts));
    } catch {
      // Ignore
    }
  }, [contacts]);

  useEffect(() => {
    try {
      localStorage.setItem(ORGS_STORAGE_KEY, JSON.stringify(organizations));
    } catch {
      // Ignore
    }
  }, [organizations]);

  useEffect(() => {
    try {
      localStorage.setItem(FOCUS_LOGS_STORAGE_KEY, JSON.stringify(focusLogs));
    } catch {
      // Ignore
    }
  }, [focusLogs]);

  useEffect(() => {
    try {
      localStorage.setItem(
        JOURNAL_STORAGE_KEY,
        JSON.stringify(journalEntries)
      );
    } catch {
      // Ignore
    }
  }, [journalEntries]);

  useEffect(() => {
    try {
      localStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(habits));
    } catch {
      // Ignore
    }
  }, [habits]);

  useEffect(() => {
    try {
      localStorage.setItem(
        RADAR_BASE_STORAGE_KEY,
        JSON.stringify(radarBaseOverrides)
      );
    } catch {
      // Ignore
    }
  }, [radarBaseOverrides]);

  const stats = useMemo(() => computeTodoStats(todos), [todos]);

  const autoPunchCardsCount = useMemo(
    () => extractAutoTaskPunchCards(todos).length,
    [todos]
  );

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
    scheduledHour?: number;
    quadrant?: EisenhowerQuadrant;
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

  const handlePunchTaskDay = (todoId: string, dateIso?: string) => {
    const result = punchTaskDay(todos, todoId, dateIso);
    setTodos(result.todos);
    if (result.newlyMintedPunchCard) {
      setCelebration({
        id: Date.now(),
        taskTitle: `Auto Punch Card Minted: ${result.taskTitle} (${result.daysDone} days done!)`,
      });
    }
  };

  const handleMoveKanbanStage = (todoId: string, stage: KanbanStage) => {
    if (stage === 'done') {
      const completedTask = didTaskTransitionToCompleted(todos, todoId);
      if (completedTask) {
        setCelebration({
          id: Date.now(),
          taskTitle: completedTask.title,
        });
      }
    }
    setTodos((prev) => moveTodoToKanbanStage(prev, todoId, stage));
  };

  const handleAssignQuadrant = (
    todoId: string,
    quadrant: EisenhowerQuadrant
  ) => {
    setTodos((prev) => assignTaskQuadrant(prev, todoId, quadrant));
  };

  const handleAssignScheduledHour = (
    todoId: string,
    hour: number | undefined,
    dateIso: string
  ) => {
    setTodos((prev) => assignTodoScheduledHour(prev, todoId, hour, dateIso));
    setActiveDraggedTaskId(null);
  };

  // Dragging a Brain Dump card directly into an hour slot on the Side Hourly Calendar
  const handleScheduleBrainDumpAtHour = (
    dumpItemId: string,
    hour: number,
    dateIso: string
  ): string | null => {
    const dumpItem = brainDumpItems.find((d) => d.id === dumpItemId);
    if (!dumpItem) return null;
    const newTodo = createTodoItem({
      title: dumpItem.title,
      notes: dumpItem.notes || 'Pulled from Brain Dump into Hourly Calendar',
      priority: dumpItem.priority,
      category: dumpItem.category,
      dueDate: dateIso,
      isRepeating: false,
      scheduledHour: hour,
    });
    setTodos((prev) => [newTodo, ...prev]);
    setBrainDumpItems((prev) => deleteBrainDumpItem(prev, dumpItemId));
    setActiveDraggedTaskId(null);
    return newTodo.title;
  };

  const handleDragStartTask = (todoId: string) => {
    setActiveDraggedTaskId(todoId);
    if (taskRightPanelMode !== 'hourly_calendar') {
      setTaskRightPanelMode('hourly_calendar');
    }
  };

  const handleDragEndTask = () => {
    setActiveDraggedTaskId(null);
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
        | 'quadrant'
        | 'scheduledHour'
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
    setContacts(getInitialSeedRelationships());
    setOrganizations(getInitialSeedOrganizations());
    setFocusLogs(getInitialSeedFocusLogs());
    setJournalEntries(getInitialSeedJournalEntries());
    setHabits(getInitialSeedHabits());
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

  // Brain Dump Handlers (No category or priority required during Brain Dump capture)
  const handleAddDumpItems = (
    rawText: string,
    category: Category = 'Portfolio',
    priority: Priority = 'medium'
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
    resource: {
      title: string;
      type: TopicResourceType;
      url: string;
      fileName?: string;
      fileSizeLabel?: string;
    }
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

  // Relationship & Organization Handlers
  const handleLogRelationshipCheckIn = (contactId: string) => {
    setContacts((prev) => logRelationshipCheckIn(prev, contactId));
  };

  const handleAddContact = (params: {
    name: string;
    role: string;
    organizationName: string;
    lifeArea: Category;
    cadence: RelationshipCadence;
    nextAction: string;
  }) => {
    const created = createRelationshipContact(params);
    setContacts((prev) => [created, ...prev]);
  };

  const handleAddOrganization = (params: {
    name: string;
    type: OrganizationCategory;
    role: string;
    lifeArea: Category;
    cadence: string;
    memberOrContactCount: number;
    focusGoal: string;
  }) => {
    const created = createOrganizationItem(params);
    setOrganizations((prev) => [created, ...prev]);
  };

  // DoteTimer Handlers
  const handleLogFocusSession = (params: {
    taskId?: string;
    taskTitle: string;
    category: Category;
    durationMinutes: number;
    mode: FocusTimerMode;
  }) => {
    const log = createFocusSessionLog({
      ...params,
      completedAt: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    });
    setFocusLogs((prev) => [log, ...prev]);
  };

  // Journal Handlers
  const handleAddJournalEntry = (params: {
    title: string;
    content: string;
    gratitude: string;
    lifeArea: Category;
    mood: JournalMood;
    dateIso: string;
  }) => {
    const created = createJournalEntry(params);
    setJournalEntries((prev) => [created, ...prev]);
  };

  const handleDeleteJournalEntry = (id: string) => {
    setJournalEntries((prev) => deleteJournalEntry(prev, id));
  };

  // Habit & Heatmap Handlers
  const handleToggleHabitDate = (habitId: string, dateIso: string) => {
    setHabits((prev) => toggleHabitDateCompletion(prev, habitId, dateIso));
  };

  const handleAddHabit = (params: {
    title: string;
    lifeArea: Category;
    habitType: HabitCategoryType;
    oldHabitToReplace?: string;
    targetPerWeek: number;
    whenTime?: string;
    durationMinutes?: number;
    streakTargetDays?: number;
  }) => {
    const created = createHabitItem(params);
    setHabits((prev) => [created, ...prev]);
  };

  const handleRadarSelectCategory = (cat: Category | 'All') => {
    const nav = resolveRadarAreaNavigation(cat);
    setCategoryFilter(nav.categoryFilter);
    setActiveView(nav.targetView);
  };

  const focusQuickAdd = () => {
    setActiveView('tasks');
    setTaskViewMode('list');
    window.setTimeout(() => {
      const input = document.getElementById('new-task-title');
      if (input) input.focus();
    }, 20);
  };

  const backlogCount = useMemo(
    () =>
      todos.filter(
        (t) =>
          !t.completed &&
          (t.scheduledHour === undefined || t.dueDate > todayIso)
      ).length,
    [todos, todayIso]
  );

  const leftRailGroups: Array<{
    groupLabel: string;
    items: Array<{
      id: WorkspaceTab;
      label: string;
      badge?: number;
      icon: React.ReactNode;
    }>;
  }> = [
    {
      groupLabel: '01. Daily Rhythm',
      items: [
        {
          id: 'tasks',
          label: 'Today (Time of Day)',
          badge: stats.active,
          icon: <ListTodo className="w-4 h-4 shrink-0" aria-hidden="true" />,
        },
        {
          id: 'habits',
          label: 'Habits & Routines',
          badge: habits.length,
          icon: <Flame className="w-4 h-4 shrink-0" aria-hidden="true" />,
        },
        {
          id: 'calendar',
          label: 'Calendar',
          icon: <CalendarIcon className="w-4 h-4 shrink-0" aria-hidden="true" />,
        },
        {
          id: 'matrix',
          label: 'Eisenhower Matrix',
          icon: <LayoutGrid className="w-4 h-4 shrink-0" aria-hidden="true" />,
        },
        {
          id: 'backlog',
          label: 'Backlog Queue',
          badge: backlogCount,
          icon: <Archive className="w-4 h-4 shrink-0" aria-hidden="true" />,
        },
      ],
    },
    {
      groupLabel: '02. Focus & Time',
      items: [
        {
          id: 'flipclock',
          label: 'Real-Time Flip Clock',
          icon: <Clock className="w-4 h-4 shrink-0" aria-hidden="true" />,
        },
        {
          id: 'timer',
          label: 'DoteTimer Focus',
          badge: focusLogs.length,
          icon: <Timer className="w-4 h-4 shrink-0" aria-hidden="true" />,
        },
        {
          id: 'bingo',
          label: 'Bingo & Punch Cards',
          badge: autoPunchCardsCount,
          icon: <Grid3X3 className="w-4 h-4 shrink-0" aria-hidden="true" />,
        },
      ],
    },
    {
      groupLabel: '03. Strategy & Mastery',
      items: [
        {
          id: 'visions',
          label: 'Vision Dashboard',
          icon: <Compass className="w-4 h-4 shrink-0" aria-hidden="true" />,
        },
        {
          id: 'goals',
          label: 'Goals (30Y & 5Y→1W)',
          icon: <Target className="w-4 h-4 shrink-0" aria-hidden="true" />,
        },
        {
          id: 'topics',
          label: 'Topic Dashboard',
          badge: topics.length,
          icon: <BookOpen className="w-4 h-4 shrink-0" aria-hidden="true" />,
        },
        {
          id: 'plan',
          label: 'Plan Canvas',
          icon: <PenTool className="w-4 h-4 shrink-0" aria-hidden="true" />,
        },
        {
          id: 'maps',
          label: 'Google Maps Studio',
          icon: <MapPin className="w-4 h-4 shrink-0" aria-hidden="true" />,
        },
      ],
    },
    {
      groupLabel: '04. Mind & Network',
      items: [
        {
          id: 'braindump',
          label: 'Brain Dump',
          badge: brainDumpQueueCount,
          icon: <Layers className="w-4 h-4 shrink-0" aria-hidden="true" />,
        },
        {
          id: 'reflect',
          label: 'Reflect Dashboard',
          icon: <Brain className="w-4 h-4 shrink-0" aria-hidden="true" />,
        },
        {
          id: 'journal',
          label: 'Journal & Star Jar',
          badge: journalEntries.length,
          icon: <BookText className="w-4 h-4 shrink-0" aria-hidden="true" />,
        },
        {
          id: 'affirmations',
          label: 'Affirmations',
          icon: <Award className="w-4 h-4 shrink-0" aria-hidden="true" />,
        },
        {
          id: 'network',
          label: 'Relationships & Orgs',
          badge: contacts.length + organizations.length,
          icon: <Users className="w-4 h-4 shrink-0" aria-hidden="true" />,
        },
      ],
    },
  ];

  // Borderless Full-Viewport Tablet / Desktop Version with 3-Zone Top Bar + Left Navigation Rail
  const renderTabletDesktopVersion = () => (
    <div
      data-testid="tablet-desktop-version"
      className="h-screen min-h-[680px] w-full bg-slate-50 flex flex-col overflow-hidden"
    >
      {/* 3-Zone Top Bar Contract: [Zone 1: Brand Wordmark] — [Zone 2: 5 Single-Line Nav Links] — [Zone 3: 1 Primary Action] */}
      <header className="flex items-center justify-between gap-8 px-6 py-3 bg-white border-b border-slate-200 shrink-0">
        <button
          type="button"
          onClick={() => setActiveView('tasks')}
          className="text-[17px] font-bold tracking-[-0.032em] text-slate-950 font-display whitespace-nowrap shrink-0 cursor-pointer"
        >
          FocusFlow
        </button>

        <nav
          aria-label="Primary studio navigation"
          className="hidden md:flex items-center gap-6 text-[13px] font-medium tracking-[-0.01em] text-slate-600"
        >
          {(
            [
              { id: 'tasks', label: 'Today' },
              { id: 'habits', label: 'Habits' },
              { id: 'timer', label: 'Focus Studio' },
              { id: 'goals', label: 'Goals & Topics' },
              { id: 'visions', label: 'Vision & Reflect' },
            ] as const
          ).map((navLink) => {
            const isCurrent = activeView === navLink.id;
            return (
              <button
                key={navLink.id}
                type="button"
                onClick={() => setActiveView(navLink.id)}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                  isCurrent
                    ? 'text-slate-950 font-semibold border-slate-950'
                    : 'text-slate-600 hover:text-slate-950 border-transparent hover:border-slate-300'
                }`}
              >
                {navLink.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={focusQuickAdd}
            className="px-4 py-2 text-[13px] font-semibold tracking-[-0.01em] text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            New Daily Action
          </button>
        </div>
      </header>

      {/* Tablet Body: Left Navigation Bar + Scrollable Main Workspace */}
      <div className="flex-1 min-h-0 flex flex-row overflow-hidden">
        {/* Left Navigation Bar for Tablet & Desktop Version */}
        <aside
          aria-label="Tablet and desktop left navigation bar"
          data-testid="tablet-left-nav"
          className="w-60 sm:w-64 h-full shrink-0 bg-white border-r border-slate-200 p-3.5 flex flex-col justify-between overflow-y-auto"
        >
          <div className="space-y-4">
            {/* Viewport Mode Switcher Bar */}
            <div className="px-1 py-1 flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                Viewport Mode
              </span>

              <div
                role="group"
                aria-label="Change workspace view mode"
                className="flex items-center gap-1 bg-slate-100 border border-slate-200 p-1 rounded-lg shrink-0"
              >
                <button
                  type="button"
                  onClick={() => setLayoutVersion('tablet')}
                  data-testid="switch-version-tablet"
                  aria-label="Tablet / Desktop Full Screen View"
                  title="Tablet / Desktop Full Screen View"
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    layoutVersion === 'tablet'
                      ? 'bg-purple-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  <Tablet className="w-3.5 h-3.5" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => setLayoutVersion('mobile')}
                  data-testid="switch-version-mobile"
                  aria-label="Android 9:16 Mobile View"
                  title="Android 9:16 Mobile View"
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    layoutVersion === 'mobile'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => setLayoutVersion('split')}
                  data-testid="switch-version-split"
                  aria-label="Both Versions Side-by-Side View"
                  title="Both Versions Side-by-Side View"
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    layoutVersion === 'split'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  <Columns2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  data-testid="open-calendar-tearoff-mockup-btn"
                  onClick={() => {
                    setInitialLastOpenedDateIso(offsetIsoDate(todayIso, -3));
                    setIsCalendarTearModalOpen(true);
                  }}
                  aria-label="Open Calendar Tear-Off Mockup"
                  title="Open Calendar Tear-Off Animation Mockup"
                  className="p-1.5 rounded-md text-purple-700 hover:bg-purple-100 transition-colors cursor-pointer"
                >
                  <CalendarIcon className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Grouped Left Navigation Links (4 Curated Editorial Sections) */}
            <nav aria-label="Left workspace navigation" className="space-y-3.5">
              {leftRailGroups.map((group) => (
                <div key={group.groupLabel} className="space-y-1">
                  <div className="px-2 text-[11px] font-semibold tracking-[0.03em] uppercase text-slate-400">
                    {group.groupLabel}
                  </div>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const isActive = activeView === item.id;
                      const activeSolidBg =
                        item.id === 'flipclock' ||
                        item.id === 'tasks' ||
                        item.id === 'habits' ||
                        item.id === 'timer' ||
                        item.id === 'bingo'
                          ? 'bg-emerald-600 text-white font-semibold'
                          : item.id === 'backlog' ||
                              item.id === 'calendar' ||
                              item.id === 'plan' ||
                              item.id === 'matrix' ||
                              item.id === 'network' ||
                              item.id === 'maps'
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'bg-purple-700 text-white font-semibold';
                      return (
                        <button
                          key={item.id}
                          type="button"
                          data-testid={`nav-tab-${item.id}`}
                          onClick={() => setActiveView(item.id)}
                          aria-current={isActive ? 'page' : undefined}
                          className={`w-full px-2.5 py-1.5 rounded-xl text-[13px] font-medium tracking-[-0.008em] flex items-center justify-between gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                            isActive
                              ? `${activeSolidBg} shadow-2xs`
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <span className="flex items-center gap-2 truncate">
                            {item.icon}
                            <span className="truncate">{item.label}</span>
                          </span>
                          {item.badge !== undefined && (
                            <span
                              className={`font-mono tabular-nums text-[11px] ${
                                isActive
                                  ? 'text-white/90 font-bold'
                                  : 'text-slate-400'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* 7 Life Areas Quick Filter in Left Rail */}
            <div className="pt-2 border-t border-slate-200 space-y-1">
              <div className="px-2 text-[11px] font-semibold tracking-[0.03em] uppercase text-slate-400">
                05. Life Focus Areas
              </div>
              <div className="space-y-0.5">
                {CATEGORIES_WITH_ALL.map((area) => {
                  const isSelected =
                    activeView === 'tasks' && categoryFilter === area;
                  return (
                    <button
                      key={area}
                      type="button"
                      onClick={() => {
                        setCategoryFilter(area);
                        setActiveView('tasks');
                      }}
                      className={`w-full text-left px-2.5 py-1 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer whitespace-nowrap ${
                        isSelected
                          ? 'bg-blue-50 text-blue-900 font-semibold border border-blue-200'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <span>{area === 'All' ? 'All Areas' : area}</span>
                      {isSelected && (
                        <span className="text-[10px] font-mono text-blue-700">
                          Active
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Daily Progress Summary inside Left Rail */}
          <div className="pt-2.5 mt-2 border-t border-slate-200 space-y-2 px-1">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-semibold text-slate-800">
                Daily Progress
              </span>
              <span className="text-xs font-mono tabular-nums font-bold text-emerald-700">
                {stats.completionRate}%
              </span>
            </div>
            <div
              className="h-2 w-full bg-slate-100 rounded-full overflow-hidden"
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
            <dl className="grid grid-cols-3 gap-1 pt-0.5 text-center">
              <div>
                <dt className="text-[10px] text-slate-500">Active</dt>
                <dd
                  data-testid="stat-active"
                  className="text-xs font-bold font-mono tabular-nums text-blue-700"
                >
                  {stats.active}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] text-slate-500">Done</dt>
                <dd
                  data-testid="stat-completed"
                  className="text-xs font-bold font-mono tabular-nums text-emerald-700"
                >
                  {stats.completed}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] text-slate-500">High</dt>
                <dd
                  data-testid="stat-high-priority"
                  className="text-xs font-bold font-mono tabular-nums text-purple-700"
                >
                  {stats.highPriorityActive}
                </dd>
              </div>
            </dl>

            <button
              type="button"
              onClick={focusQuickAdd}
              className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Quick New Task</span>
            </button>
          </div>
        </aside>

        {/* Scrollable Tablet / Desktop Main Canvas */}
        <div className="flex-1 h-full overflow-y-auto p-4 sm:p-6 @container">
          <div className="max-w-5xl mx-auto">
            {/* Main Active Workspace */}
            <section className="space-y-4 min-w-0">
              {activeView === 'flipclock' ? (
                <RealTimeFlipClock
                  todos={todos}
                  onCompleteTask={handleToggleTodo}
                  onOpenFocusTimer={() => setActiveView('timer')}
                />
              ) : activeView === 'visions' ? (
                <VisionDashboard
                  topics={topics}
                  roadmaps={goalRoadmaps}
                  habits={habits}
                  todos={todos}
                  brainDumpItems={brainDumpItems}
                  onNavigateTab={(tab) => setActiveView(tab)}
                  onDeployRoutineTaskToTodo={handleAddTodo}
                  onToggleTodo={handleToggleTodo}
                />
              ) : activeView === 'maps' ? (
                <GoogleMapsDashboard
                  todos={todos}
                  habits={habits}
                  topics={topics}
                  onAddTodoWithLocation={handleAddTodo}
                />
              ) : activeView === 'plan' ? (
                <ExcalidrawPlanDashboard
                  todos={todos}
                  topics={topics}
                  onAddTodoFromCanvas={handleAddTodo}
                />
              ) : activeView === 'backlog' ? (
                <BacklogDashboard
                  todos={todos}
                  brainDumpItems={brainDumpItems}
                  onAddBacklogTodo={handleAddTodo}
                  onToggleTodo={handleToggleTodo}
                  onDeleteTodo={handleDeleteTodo}
                  onUpdateTodo={handleUpdateTodo}
                  onAssignScheduledHour={handleAssignScheduledHour}
                  onPromoteBrainDumpItem={handleSwipeRight}
                  onRestoreBrainDumpToDeck={handleRestoreToDeck}
                  onDeleteBrainDumpItem={handleDeleteDumpItem}
                  onDragStartTask={handleDragStartTask}
                  onDragEndTask={handleDragEndTask}
                />
              ) : activeView === 'affirmations' ? (
                <AffirmationDashboard />
              ) : activeView === 'reflect' ? (
                <ReflectDashboard
                  todos={todos}
                  onOpenEisenhowerMatrix={() => setActiveView('matrix')}
                  onAddTaskFromReflection={(params) =>
                    handleAddTodo({ ...params })
                  }
                />
              ) : activeView === 'bingo' ? (
                <BingoPunchCardDashboard
                  todos={todos}
                  onPunchTaskDay={handlePunchTaskDay}
                  onDragStartTask={handleDragStartTask}
                  onDragEndTask={handleDragEndTask}
                  onQuickScheduleTask={(todoId, hour) =>
                    handleAssignScheduledHour(todoId, hour, todayIso)
                  }
                />
              ) : activeView === 'habits' ? (
                <HabitDashboard
                  habits={habits}
                  todos={todos}
                  onToggleHabitDate={handleToggleHabitDate}
                  onAddHabit={handleAddHabit}
                  onDeployRoutineTaskToTodo={handleAddTodo}
                />
              ) : activeView === 'matrix' ? (
                <EisenhowerMatrix
                  todos={todos}
                  onToggleTodo={handleToggleTodo}
                  onDeleteTodo={handleDeleteTodo}
                  onAssignQuadrant={handleAssignQuadrant}
                  onAddTodoInQuadrant={(params) =>
                    handleAddTodo({ ...params, isRepeating: false })
                  }
                  onDragStartTask={handleDragStartTask}
                  onDragEndTask={handleDragEndTask}
                />
              ) : activeView === 'network' ? (
                <RelationshipOrgDashboard
                  contacts={contacts}
                  organizations={organizations}
                  onLogCheckIn={handleLogRelationshipCheckIn}
                  onAddContact={handleAddContact}
                  onAddOrganization={handleAddOrganization}
                  onPushNextActionToTodo={(title, notes, lifeArea) => {
                    handleAddTodo({
                      title,
                      notes,
                      priority: 'high',
                      category: lifeArea,
                      dueDate: new Date().toISOString().slice(0, 10),
                      isRepeating: false,
                    });
                    setActiveView('tasks');
                  }}
                />
              ) : activeView === 'journal' ? (
                <JournalDashboard
                  entries={journalEntries}
                  onAddEntry={handleAddJournalEntry}
                  onDeleteEntry={handleDeleteJournalEntry}
                />
              ) : activeView === 'timer' ? (
                <FocusDoteTimer
                  todos={todos}
                  focusLogs={focusLogs}
                  onLogSession={handleLogFocusSession}
                  onCompleteLinkedTask={handleToggleTodo}
                />
              ) : activeView === 'goals' ? (
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
                  onDragStartBrainDumpCard={handleDragStartTask}
                  onDragEndBrainDumpCard={handleDragEndTask}
                />
              ) : (
                <>
                  {/* Page Header & Utility Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h1 className="text-2xl sm:text-[26px] font-bold tracking-[-0.03em] text-slate-950 font-display leading-[1.15] text-balance">
                        {categoryFilter === 'All'
                          ? 'Today — Morning, Afternoon & Evening Rhythm'
                          : `${categoryFilter} — Daily Rhythm`}
                      </h1>
                      <p className="text-[13.5px] sm:text-sm leading-relaxed text-slate-500 mt-1 max-w-[65ch]">
                        Complete habits and tasks chronologically by time of day, or click the right-side icons to open Stats, Radar, Wheel, or the Side Hourly Bar.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        data-testid="toggle-right-hourly-calendar"
                        onClick={() =>
                          setTaskRightPanelMode((prev) =>
                            prev === 'hourly_calendar'
                              ? null
                              : 'hourly_calendar'
                          )
                        }
                        title="Toggle Side Hourly Bar"
                        aria-label="Toggle Side Hourly Bar"
                        className={`p-2 text-xs font-semibold rounded-lg border transition-colors flex items-center justify-center cursor-pointer ${
                          taskRightPanelMode === 'hourly_calendar'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Clock className="w-4 h-4" aria-hidden="true" />
                      </button>

                      {stats.completed > 0 && (
                        <button
                          type="button"
                          onClick={handleClearCompleted}
                          className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <Trash2
                            className="w-3.5 h-3.5 text-slate-500"
                            aria-hidden="true"
                          />
                          <span>Clear Completed ({stats.completed})</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleResetDemo}
                        className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <RotateCcw
                          className="w-3.5 h-3.5 text-slate-500"
                          aria-hidden="true"
                        />
                        <span>Reset Sample Tasks</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick Add Task Bar */}
                  <QuickAddTask
                    defaultCategory={
                      categoryFilter === 'All' ? 'Portfolio' : categoryFilter
                    }
                    onAdd={handleAddTodo}
                  />

                  {/* Task View Switcher (Time of Day / List View / Kanban View / Timeline View) + Status & Search Toolbar */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-3 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div
                        role="group"
                        aria-label="Select task display view mode"
                        className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl"
                      >
                        <button
                          type="button"
                          data-testid="task-view-mode-list"
                          onClick={() => setTaskViewMode('list')}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            taskViewMode === 'list'
                              ? 'bg-slate-900 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <ListTodo
                            className="w-3.5 h-3.5"
                            aria-hidden="true"
                          />
                          <span>Time of Day &amp; List</span>
                        </button>
                        <button
                          type="button"
                          data-testid="task-view-mode-kanban"
                          onClick={() => setTaskViewMode('kanban')}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            taskViewMode === 'kanban'
                              ? 'bg-slate-900 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Kanban className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Kanban Board</span>
                        </button>
                        <button
                          type="button"
                          data-testid="task-view-mode-timeline"
                          onClick={() => setTaskViewMode('timeline')}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            taskViewMode === 'timeline'
                              ? 'bg-slate-900 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <GitCommitHorizontal
                            className="w-3.5 h-3.5"
                            aria-hidden="true"
                          />
                          <span>Timeline</span>
                        </button>
                      </div>

                      <div
                        role="group"
                        aria-label="Filter tasks by completion status"
                        className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl"
                      >
                        {(
                          [
                            { id: 'all', label: `All (${stats.total})` },
                            { id: 'active', label: `Active (${stats.active})` },
                            {
                              id: 'completed',
                              label: `Completed (${stats.completed})`,
                            },
                          ] as const
                        ).map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setStatusFilter(tab.id)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                              statusFilter === tab.id
                                ? 'bg-white text-slate-900 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative flex-1 min-w-[180px]">
                        <Search
                          className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
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
                          placeholder="Search tasks & habits..."
                          className="w-full pl-8 pr-2.5 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                        />
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
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
                          onChange={(e) =>
                            setSortBy(e.target.value as SortOption)
                          }
                          className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-slate-400"
                        >
                          <option value="dueDate">Sort: Due Date</option>
                          <option value="priority">Sort: Priority</option>
                          <option value="created">Sort: Newest</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Active Task Display Mode: Productive Time-of-Day & List View, Kanban View, or Timeline View */}
                  {taskViewMode === 'list' ? (
                    <div data-testid="tasks-list-view" className="space-y-4">
                      {visibleTodos.length > 0 || habits.length > 0 ? (
                        <ProductiveDayFeed
                          todayIso={todayIso}
                          todos={visibleTodos}
                          habits={
                            categoryFilter === 'All'
                              ? habits
                              : habits.filter(
                                  (h) => h.lifeArea === categoryFilter
                                )
                          }
                          selectedFocusTaskId={selectedFocusTaskId}
                          onToggleTodo={handleToggleTodo}
                          onDeleteTodo={handleDeleteTodo}
                          onUpdateTodo={handleUpdateTodo}
                          onAddSubtask={handleAddSubtask}
                          onToggleSubtask={handleToggleSubtask}
                          onDeleteSubtask={handleDeleteSubtask}
                          onAssignScheduledHour={handleAssignScheduledHour}
                          onToggleHabitDate={handleToggleHabitDate}
                          onDeployRoutineTaskToTodo={handleAddTodo}
                          onPunchTaskDay={handlePunchTaskDay}
                          onOpenBingoPunchCards={() => setActiveView('bingo')}
                          onDragStartTask={handleDragStartTask}
                          onDragEndTask={handleDragEndTask}
                        />
                      ) : (
                        <div className="bg-white border border-slate-200 rounded-2xl py-12 px-6 text-center">
                          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
                            {todos.length === 0 ? (
                              <ListTodo
                                className="w-5 h-5"
                                aria-hidden="true"
                              />
                            ) : (
                              <CheckCircle2
                                className="w-5 h-5"
                                aria-hidden="true"
                              />
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
                        </div>
                      )}
                    </div>
                  ) : (
                    <TaskViewsContainer
                      mode={taskViewMode}
                      todos={visibleTodos}
                      onToggleTodo={handleToggleTodo}
                      onDeleteTodo={handleDeleteTodo}
                      onMoveKanbanStage={handleMoveKanbanStage}
                      onDragStartTask={handleDragStartTask}
                      onDragEndTask={handleDragEndTask}
                    />
                  )}

                  {/* Secondary Studio Instruments (Real-Time Flip Clock · MemoSpike Completed Spindle · Cadence Check-In) */}
                  <div className="pt-2 space-y-4">
                    <RealTimeFlipClock
                      todos={todos}
                      defaultCompact={true}
                      onCompleteTask={handleToggleTodo}
                      onOpenFocusTimer={() => setActiveView('timer')}
                    />

                    <MemoSpikeWidget
                      todos={todos}
                      activeCategory={categoryFilter}
                      onSpikeTask={handleToggleTodo}
                    />

                    <CadenceReviewWidget
                      onOpenEisenhowerMatrix={() => setActiveView('matrix')}
                    />
                  </div>
                </>
              )}
            </section>
          </div>
        </div>

        {/* On-Demand Right Drawer: Only visible when Stats, Radar, Wheel, or Side Hourly Bar icon is clicked */}
        {taskRightPanelMode !== null && (
          <aside
            aria-label="Right utility drawer"
            data-testid="right-utility-drawer"
            className="w-80 sm:w-96 xl:w-[430px] h-full shrink-0 bg-slate-50 border-l border-slate-200 flex flex-col overflow-hidden"
          >
            <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                {taskRightPanelMode === 'hourly_calendar' && (
                  <>
                    <Clock
                      className="w-4 h-4 text-blue-600 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="text-xs font-bold text-slate-900 truncate">
                      Side Hourly Bar
                    </span>
                  </>
                )}
                {(taskRightPanelMode === 'stats' ||
                  taskRightPanelMode === 'insights') && (
                  <>
                    <BarChart3
                      className="w-4 h-4 text-emerald-600 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="text-xs font-bold text-slate-900 truncate">
                      Consistency &amp; Momentum Stats
                    </span>
                  </>
                )}
                {taskRightPanelMode === 'radar' && (
                  <>
                    <Hexagon
                      className="w-4 h-4 text-purple-600 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="text-xs font-bold text-slate-900 truncate">
                      7-Axis Life Focus Radar
                    </span>
                  </>
                )}
                {taskRightPanelMode === 'wheel' && (
                  <>
                    <CircleDot
                      className="w-4 h-4 text-blue-600 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="text-xs font-bold text-slate-900 truncate">
                      Spin-the-Wheel Task Picker
                    </span>
                  </>
                )}
              </div>

              <button
                type="button"
                data-testid="close-right-drawer-btn"
                onClick={() => setTaskRightPanelMode(null)}
                aria-label="Close right panel"
                title="Close panel"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {taskRightPanelMode === 'hourly_calendar' && (
                <HourlyCalendarPanel
                  todos={todos}
                  activeDraggedTaskId={activeDraggedTaskId}
                  onToggleTodo={handleToggleTodo}
                  onAssignScheduledHour={handleAssignScheduledHour}
                  onScheduleBrainDumpAtHour={handleScheduleBrainDumpAtHour}
                  onAddTodoAtHour={handleAddTodo}
                  onCloseHourlyView={() => setTaskRightPanelMode(null)}
                />
              )}

              {(taskRightPanelMode === 'stats' ||
                taskRightPanelMode === 'insights') && (
                <ProductiveInfographicsPanel
                  todayIso={todayIso}
                  todos={todos}
                  habits={habits}
                  activeCategory={categoryFilter}
                  onSelectCategory={handleRadarSelectCategory}
                  onToggleHabitDate={handleToggleHabitDate}
                />
              )}

              {taskRightPanelMode === 'radar' && (
                <LifeRadarChart
                  todos={todos}
                  activeCategory={categoryFilter}
                  baseOverrides={radarBaseOverrides}
                  onSelectCategory={handleRadarSelectCategory}
                  onAdjustBaseScore={handleAdjustBaseScore}
                />
              )}

              {taskRightPanelMode === 'wheel' && (
                <TaskWheelPicker
                  todos={todos}
                  activeCategory={categoryFilter}
                  selectedFocusTaskId={selectedFocusTaskId}
                  onSelectFocusTask={setSelectedFocusTaskId}
                  onCompleteTask={handleToggleTodo}
                />
              )}
            </div>
          </aside>
        )}

        {/* Right-Side Vertical Icon Bar: Stats · Radar · Wheel · Side Hourly Bar */}
        <aside
          aria-label="Right side tool icons"
          data-testid="right-side-icon-bar"
          className="w-14 h-full shrink-0 bg-white border-l border-slate-200 py-3 px-1.5 flex flex-col items-center justify-between select-none"
        >
          <div className="flex flex-col items-center gap-2 w-full">
            {/* 1. Stats Icon */}
            <button
              type="button"
              data-testid="right-panel-tab-insights"
              onClick={() =>
                setTaskRightPanelMode((prev) =>
                  prev === 'stats' || prev === 'insights' ? null : 'stats'
                )
              }
              aria-label="Toggle Stats Infographics"
              aria-pressed={
                taskRightPanelMode === 'stats' ||
                taskRightPanelMode === 'insights'
              }
              title="Stats & Consistency Infographics"
              className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                taskRightPanelMode === 'stats' ||
                taskRightPanelMode === 'insights'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="text-[9px] font-semibold leading-none">
                Stats
              </span>
            </button>

            {/* 2. Radar Icon */}
            <button
              type="button"
              data-testid="right-icon-radar"
              onClick={() =>
                setTaskRightPanelMode((prev) =>
                  prev === 'radar' ? null : 'radar'
                )
              }
              aria-label="Toggle Life Focus Radar"
              aria-pressed={taskRightPanelMode === 'radar'}
              title="7-Axis Life Focus Radar"
              className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                taskRightPanelMode === 'radar'
                  ? 'bg-purple-700 text-white shadow-2xs'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Hexagon className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="text-[9px] font-semibold leading-none">
                Radar
              </span>
            </button>

            {/* 3. Wheel Icon */}
            <button
              type="button"
              data-testid="right-icon-wheel"
              onClick={() =>
                setTaskRightPanelMode((prev) =>
                  prev === 'wheel' ? null : 'wheel'
                )
              }
              aria-label="Toggle Spin-the-Wheel Task Picker"
              aria-pressed={taskRightPanelMode === 'wheel'}
              title="Spin-the-Wheel Task Picker"
              className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                taskRightPanelMode === 'wheel'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <CircleDot className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="text-[9px] font-semibold leading-none">
                Wheel
              </span>
            </button>

            {/* 4. Side Hourly Bar Icon */}
            <button
              type="button"
              data-testid="right-panel-tab-hourly"
              onClick={() =>
                setTaskRightPanelMode((prev) =>
                  prev === 'hourly_calendar' ? null : 'hourly_calendar'
                )
              }
              aria-label="Toggle Side Hourly Bar"
              aria-pressed={taskRightPanelMode === 'hourly_calendar'}
              title="Side Hourly Calendar Bar"
              className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                taskRightPanelMode === 'hourly_calendar'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Clock className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="text-[9px] font-semibold leading-none">
                Hourly
              </span>
            </button>
          </div>

          {taskRightPanelMode !== null && (
            <button
              type="button"
              onClick={() => setTaskRightPanelMode(null)}
              aria-label="Hide open right panel"
              title="Close panel"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </aside>
      </div>
    </div>
  );

  // Android 9:16 Mobile Version with Bottom Navigation Bar
  const renderAndroidMobileVersion = () => (
    <AndroidMobileApp
      activeView={activeView}
      onSelectView={setActiveView}
      taskViewMode={taskViewMode}
      onSelectTaskViewMode={setTaskViewMode}
      todos={todos}
      visibleTodos={visibleTodos}
      stats={stats}
      categoryFilter={categoryFilter}
      onSelectCategoryFilter={setCategoryFilter}
      selectedFocusTaskId={selectedFocusTaskId}
      onSelectFocusTask={setSelectedFocusTaskId}
      radarBaseOverrides={radarBaseOverrides}
      onAdjustBaseScore={handleAdjustBaseScore}
      onAddTodo={handleAddTodo}
      onToggleTodo={handleToggleTodo}
      onDeleteTodo={handleDeleteTodo}
      onUpdateTodo={handleUpdateTodo}
      onAddSubtask={handleAddSubtask}
      onToggleSubtask={handleToggleSubtask}
      onDeleteSubtask={handleDeleteSubtask}
      onMoveKanbanStage={handleMoveKanbanStage}
      onAssignQuadrant={handleAssignQuadrant}
      onAssignScheduledHour={handleAssignScheduledHour}
      topics={topics}
      goalRoadmaps={goalRoadmaps}
      selectedTopicId={selectedTopicId}
      onSelectTopicId={setSelectedTopicId}
      onCreateTopic={handleCreateTopic}
      onUpdateTopicProgress={handleUpdateTopicProgress}
      onAddTopicResource={handleAddTopicResource}
      onToggleTopicResource={handleToggleTopicResource}
      onDeleteTopicResource={handleDeleteTopicResource}
      onUpdateHorizonAnswer={handleUpdateHorizonAnswer}
      onToggleHorizonCompleted={handleToggleHorizonCompleted}
      onPushHorizonToTodo={handlePushHorizonToTodo}
      brainDumpItems={brainDumpItems}
      brainDumpQueueCount={brainDumpQueueCount}
      onAddDumpItems={handleAddDumpItems}
      onSwipeRight={handleSwipeRight}
      onSwipeLeft={handleSwipeLeft}
      onRestoreToDeck={handleRestoreToDeck}
      onDeleteDumpItem={handleDeleteDumpItem}
      contacts={contacts}
      organizations={organizations}
      onLogRelationshipCheckIn={handleLogRelationshipCheckIn}
      onAddContact={handleAddContact}
      onAddOrganization={handleAddOrganization}
      focusLogs={focusLogs}
      onLogFocusSession={handleLogFocusSession}
      journalEntries={journalEntries}
      onAddJournalEntry={handleAddJournalEntry}
      onDeleteJournalEntry={handleDeleteJournalEntry}
      habits={habits}
      onToggleHabitDate={handleToggleHabitDate}
      onAddHabit={handleAddHabit}
    />
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {gmpQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}
      <ConfettiOverlay
        celebration={celebration}
        onDismiss={() => setCelebration(null)}
      />

      {/* Daily Startup Desk Calendar Tear-Off Animation & Mockup Studio */}
      <CalendarTearOffModal
        isOpen={isCalendarTearModalOpen}
        initialLastOpenedDateIso={initialLastOpenedDateIso}
        todayIso={todayIso}
        activeTaskCount={stats.active}
        onClose={() => setIsCalendarTearModalOpen(false)}
        onSimulateDaysMissed={(daysMissed) => {
          setInitialLastOpenedDateIso(offsetIsoDate(todayIso, -daysMissed));
        }}
      />

      {/* Main Workspace Container — Edge-to-Edge Borderless Canvas */}
      <main className="flex-1 w-full min-h-screen flex items-stretch justify-center overflow-hidden">
        {layoutVersion === 'mobile' ? (
          <div className="w-full flex flex-col items-center justify-center gap-2.5">
            {/* Compact Workspace View Switcher when in Mobile-Only Mode */}
            <div className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 flex items-center gap-3 shadow-2xs">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900 font-display">
                Workspace
              </span>
              <div
                role="group"
                aria-label="Change workspace view mode"
                className="flex items-center gap-1 bg-slate-100 border border-slate-200 p-1 rounded-lg"
              >
                <button
                  type="button"
                  onClick={() => setLayoutVersion('tablet')}
                  data-testid="switch-version-tablet"
                  aria-label="Switch to Tablet / Desktop View"
                  title="Tablet / Desktop Full Screen View"
                  className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer"
                >
                  <Tablet className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutVersion('mobile')}
                  data-testid="switch-version-mobile"
                  aria-label="Android 9:16 Mobile View"
                  title="Android 9:16 Mobile View"
                  className="p-1.5 rounded-md bg-blue-600 text-white shadow-2xs transition-colors cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutVersion('split')}
                  data-testid="switch-version-split"
                  aria-label="Switch to Side-by-Side View"
                  title="Both Versions Side-by-Side View"
                  className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer"
                >
                  <Columns2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
            {renderAndroidMobileVersion()}
          </div>
        ) : layoutVersion === 'split' ? (
          <div className="w-full flex flex-col xl:flex-row gap-4 items-center xl:items-stretch justify-center">
            <div className="flex-1 min-w-0 w-full">
              {renderTabletDesktopVersion()}
            </div>
            <div className="shrink-0 flex items-center justify-center">
              {renderAndroidMobileVersion()}
            </div>
          </div>
        ) : (
          <div className="w-full h-screen">{renderTabletDesktopVersion()}</div>
        )}
      </main>
    </div>
  );
}
