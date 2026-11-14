export const LIFE_AREAS = [
  'Portfolio',
  'Karma',
  'Knowledge',
  'Personality',
  'Social',
  'Strength',
  'Aesthetics',
] as const;

export type Category = (typeof LIFE_AREAS)[number];
export type Priority = 'high' | 'medium' | 'low';
export type StatusFilter = 'all' | 'active' | 'completed';
export type SortOption = 'dueDate' | 'priority' | 'created';
export type EisenhowerQuadrant =
  | 'do_first'
  | 'schedule'
  | 'delegate'
  | 'eliminate';

export type TaskViewMode = 'list' | 'kanban' | 'timeline';
export type KanbanStage = 'todo' | 'in_progress' | 'done';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TodoItem {
  id: string;
  title: string;
  notes: string;
  completed: boolean;
  priority: Priority;
  category: Category;
  dueDate: string; // YYYY-MM-DD
  createdAt: number;
  subtasks: Subtask[];
  isRepeating?: boolean;
  streakCount?: number;
  lastCompletedDate?: string;
  quadrant?: EisenhowerQuadrant;
  scheduledHour?: number; // 0..23 hour slot for Hourly Calendar view
  kanbanStage?: KanbanStage;
}

export type TopicResourceType = 'YouTube' | 'Udemy' | 'App' | 'Article' | 'Book';

export interface TopicResource {
  id: string;
  title: string;
  type: TopicResourceType;
  url: string;
  completed: boolean;
}

export interface TopicItem {
  id: string;
  title: string;
  description: string;
  lifeArea: Category;
  goalLabel: string;
  currentUnits: number;
  targetUnits: number;
  unitName: string;
  resources: TopicResource[];
  createdAt: number;
}

export interface FilterCriteria {
  status: StatusFilter;
  category: Category | 'All';
  priority: Priority | 'All';
  searchQuery: string;
  sortBy: SortOption;
}

export interface TodoStats {
  total: number;
  active: number;
  completed: number;
  completionRate: number;
  highPriorityActive: number;
  dueTodayActive: number;
}

export interface RadarAxisMetric {
  area: Category;
  score: number; // 0 to 100
  completedCount: number;
  activeCount: number;
  totalCount: number;
}

export interface RadarVertex {
  area: Category;
  score: number;
  x: number;
  y: number;
  axisX: number;
  axisY: number;
  labelX: number;
  labelY: number;
}

const PRIORITY_WEIGHT: Record<Priority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

const LEGACY_CATEGORY_MAP: Record<string, Category> = {
  Work: 'Portfolio',
  Personal: 'Personality',
  Health: 'Strength',
  Errands: 'Karma',
};

export function normalizeCategory(raw: string | undefined | null): Category {
  if (!raw) return 'Portfolio';
  if ((LIFE_AREAS as readonly string[]).includes(raw)) {
    return raw as Category;
  }
  return LEGACY_CATEGORY_MAP[raw] ?? 'Portfolio';
}

export function getTodayIsoDate(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function createTodoItem(params: {
  id?: string;
  title: string;
  notes?: string;
  priority?: Priority;
  category?: Category;
  dueDate?: string;
  createdAt?: number;
  subtasks?: Subtask[];
  isRepeating?: boolean;
  streakCount?: number;
  lastCompletedDate?: string;
  quadrant?: EisenhowerQuadrant;
  scheduledHour?: number;
  kanbanStage?: KanbanStage;
}): TodoItem {
  const trimmedTitle = params.title.trim();
  if (!trimmedTitle) {
    throw new Error('Task title is required');
  }
  const isRepeating = Boolean(params.isRepeating);
  const streakCount = Math.max(0, Math.floor(params.streakCount ?? 0));
  const scheduledHour =
    params.scheduledHour !== undefined &&
    params.scheduledHour >= 0 &&
    params.scheduledHour <= 23
      ? Math.floor(params.scheduledHour)
      : undefined;
  return {
    id: params.id ?? `todo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: trimmedTitle,
    notes: (params.notes ?? '').trim(),
    completed: params.kanbanStage === 'done',
    priority: params.priority ?? 'medium',
    category: normalizeCategory(params.category),
    dueDate: params.dueDate || getTodayIsoDate(),
    createdAt: params.createdAt ?? Date.now(),
    subtasks: params.subtasks ?? [],
    isRepeating,
    streakCount,
    lastCompletedDate: params.lastCompletedDate,
    quadrant: params.quadrant,
    scheduledHour,
    kanbanStage: params.kanbanStage ?? 'todo',
  };
}

export function toggleTodoCompletion(
  todos: TodoItem[],
  id: string,
  todayIso: string = getTodayIsoDate()
): TodoItem[] {
  return todos.map((todo) => {
    if (todo.id !== id) return todo;
    const nextCompleted = !todo.completed;
    const currentStreak = todo.streakCount ?? 0;

    if (todo.isRepeating) {
      if (nextCompleted) {
        return {
          ...todo,
          completed: true,
          streakCount: currentStreak + 1,
          lastCompletedDate: todayIso,
        };
      } else {
        return {
          ...todo,
          completed: false,
          streakCount: Math.max(0, currentStreak - 1),
        };
      }
    }

    return { ...todo, completed: nextCompleted };
  });
}

export function updateTodoItem(
  todos: TodoItem[],
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
): TodoItem[] {
  return todos.map((todo) => {
    if (todo.id !== id) return todo;
    const nextTitle = updates.title !== undefined ? updates.title.trim() : todo.title;
    if (!nextTitle) return todo;
    return {
      ...todo,
      ...updates,
      title: nextTitle,
    };
  });
}

export function deleteTodoItem(todos: TodoItem[], id: string): TodoItem[] {
  return todos.filter((todo) => todo.id !== id);
}

export function clearCompletedTodos(todos: TodoItem[]): TodoItem[] {
  return todos.filter((todo) => !todo.completed);
}

export function addSubtask(
  todos: TodoItem[],
  todoId: string,
  subtaskTitle: string,
  subtaskId?: string
): TodoItem[] {
  const clean = subtaskTitle.trim();
  if (!clean) return todos;
  return todos.map((todo) => {
    if (todo.id !== todoId) return todo;
    const newSubtask: Subtask = {
      id: subtaskId ?? `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: clean,
      completed: false,
    };
    return {
      ...todo,
      subtasks: [...todo.subtasks, newSubtask],
    };
  });
}

export function toggleSubtask(
  todos: TodoItem[],
  todoId: string,
  subtaskId: string
): TodoItem[] {
  return todos.map((todo) => {
    if (todo.id !== todoId) return todo;
    return {
      ...todo,
      subtasks: todo.subtasks.map((st) =>
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      ),
    };
  });
}

export function deleteSubtask(
  todos: TodoItem[],
  todoId: string,
  subtaskId: string
): TodoItem[] {
  return todos.map((todo) => {
    if (todo.id !== todoId) return todo;
    return {
      ...todo,
      subtasks: todo.subtasks.filter((st) => st.id !== subtaskId),
    };
  });
}

export function filterAndSortTodos(
  todos: TodoItem[],
  criteria: FilterCriteria
): TodoItem[] {
  const query = criteria.searchQuery.trim().toLowerCase();

  const filtered = todos.filter((todo) => {
    if (criteria.status === 'active' && todo.completed) return false;
    if (criteria.status === 'completed' && !todo.completed) return false;
    if (criteria.category !== 'All' && todo.category !== criteria.category) return false;
    if (criteria.priority !== 'All' && todo.priority !== criteria.priority) return false;

    if (query) {
      const inTitle = todo.title.toLowerCase().includes(query);
      const inNotes = todo.notes.toLowerCase().includes(query);
      const inCategory = todo.category.toLowerCase().includes(query);
      const inSubtasks = todo.subtasks.some((s) =>
        s.title.toLowerCase().includes(query)
      );
      if (!inTitle && !inNotes && !inCategory && !inSubtasks) return false;
    }

    return true;
  });

  return [...filtered].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }

    if (criteria.sortBy === 'priority') {
      const diff = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
      if (diff !== 0) return diff;
      return a.dueDate.localeCompare(b.dueDate);
    }

    if (criteria.sortBy === 'dueDate') {
      const dateCompare = a.dueDate.localeCompare(b.dueDate);
      if (dateCompare !== 0) return dateCompare;
      return PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
    }

    return b.createdAt - a.createdAt;
  });
}

export function computeTodoStats(
  todos: TodoItem[],
  todayIso: string = getTodayIsoDate()
): TodoStats {
  const total = todos.length;
  const completed = todos.filter((t) => t.completed).length;
  const active = total - completed;
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);
  const highPriorityActive = todos.filter(
    (t) => !t.completed && t.priority === 'high'
  ).length;
  const dueTodayActive = todos.filter(
    (t) => !t.completed && t.dueDate <= todayIso
  ).length;

  return {
    total,
    active,
    completed,
    completionRate,
    highPriorityActive,
    dueTodayActive,
  };
}

const DEFAULT_BASE_SCORES: Record<Category, number> = {
  Portfolio: 55,
  Karma: 50,
  Knowledge: 60,
  Personality: 52,
  Social: 48,
  Strength: 58,
  Aesthetics: 50,
};

/**
 * Computes a 0..100 score for each of the 7 Life Areas:
 * Portfolio, Karma, Knowledge, Personality, Social, Strength, Aesthetics.
 */
export function computeRadarScores(
  todos: TodoItem[],
  baseOverrides: Partial<Record<Category, number>> = {}
): RadarAxisMetric[] {
  return LIFE_AREAS.map((area) => {
    const areaTodos = todos.filter((t) => normalizeCategory(t.category) === area);
    const totalCount = areaTodos.length;
    const completedCount = areaTodos.filter((t) => t.completed).length;
    const activeCount = totalCount - completedCount;

    const base = baseOverrides[area] ?? DEFAULT_BASE_SCORES[area];
    const rawScore = base + completedCount * 18 + activeCount * 5;
    const score = Math.max(10, Math.min(100, Math.round(rawScore)));

    return {
      area,
      score,
      completedCount,
      activeCount,
      totalCount,
    };
  });
}

/**
 * Computes exact SVG polygon coordinates for the 7-point radar chart.
 */
export function computeRadarGeometry(
  metrics: RadarAxisMetric[],
  cx: number = 140,
  cy: number = 140,
  radius: number = 86,
  labelRadius: number = 114
): {
  pointsString: string;
  vertices: RadarVertex[];
} {
  const count = metrics.length;
  const vertices: RadarVertex[] = metrics.map((m, idx) => {
    const angleRad = ((-90 + (idx * 360) / count) * Math.PI) / 180;
    const normalized = Math.max(0, Math.min(100, m.score)) / 100;
    const r = radius * normalized;

    return {
      area: m.area,
      score: m.score,
      x: Number((cx + r * Math.cos(angleRad)).toFixed(2)),
      y: Number((cy + r * Math.sin(angleRad)).toFixed(2)),
      axisX: Number((cx + radius * Math.cos(angleRad)).toFixed(2)),
      axisY: Number((cy + radius * Math.sin(angleRad)).toFixed(2)),
      labelX: Number((cx + labelRadius * Math.cos(angleRad)).toFixed(2)),
      labelY: Number((cy + labelRadius * Math.sin(angleRad)).toFixed(2)),
    };
  });

  const pointsString = vertices.map((v) => `${v.x},${v.y}`).join(' ');
  return { pointsString, vertices };
}

export function getInitialSeedTodos(todayIso: string = getTodayIsoDate()): TodoItem[] {
  return [
    {
      id: 'seed-1',
      title: 'Ship Q4 case study and update engineering portfolio repo',
      notes: 'Include architecture diagrams and latency benchmarks.',
      completed: false,
      priority: 'high',
      category: 'Portfolio',
      dueDate: todayIso,
      createdAt: 1731480000000,
      isRepeating: true,
      streakCount: 6,
      quadrant: 'do_first',
      scheduledHour: 9,
      subtasks: [
        { id: 'sub-101', title: 'Record 60-second demo capture', completed: true },
        { id: 'sub-102', title: 'Write technical postmortem section', completed: false },
      ],
    },
    {
      id: 'seed-2',
      title: 'Read 2 chapters of Designing Data-Intensive Applications',
      notes: 'Take structured synthesis notes on replication and consensus.',
      completed: true,
      priority: 'medium',
      category: 'Knowledge',
      dueDate: todayIso,
      createdAt: 1731480100000,
      isRepeating: true,
      streakCount: 14,
      lastCompletedDate: todayIso,
      quadrant: 'schedule',
      scheduledHour: 8,
      subtasks: [],
    },
    {
      id: 'seed-3',
      title: '45-minute compound strength & mobility session',
      notes: 'Focus on weighted pull-ups, overhead press, and thoracic mobility.',
      completed: true,
      priority: 'high',
      category: 'Strength',
      dueDate: todayIso,
      createdAt: 1731479000000,
      isRepeating: true,
      streakCount: 9,
      lastCompletedDate: todayIso,
      quadrant: 'do_first',
      scheduledHour: 7,
      subtasks: [
        { id: 'sub-201', title: '10-min dynamic warm-up', completed: true },
        { id: 'sub-202', title: 'Main strength sets (4x6)', completed: true },
      ],
    },
    {
      id: 'seed-4',
      title: 'Mentor junior developer on open-source PR review',
      notes: 'Walk through test coverage and clean error handling patterns.',
      completed: false,
      priority: 'medium',
      category: 'Karma',
      dueDate: todayIso,
      createdAt: 1731480200000,
      isRepeating: false,
      streakCount: 0,
      quadrant: 'delegate',
      scheduledHour: 11,
      subtasks: [],
    },
    {
      id: 'seed-5',
      title: 'Practice 15 minutes of impromptu vocal storytelling',
      notes: 'Record voice memo focusing on pacing and clarity.',
      completed: false,
      priority: 'medium',
      category: 'Personality',
      dueDate: todayIso,
      createdAt: 1731480300000,
      isRepeating: true,
      streakCount: 4,
      quadrant: 'schedule',
      scheduledHour: 14,
      subtasks: [],
    },
    {
      id: 'seed-6',
      title: 'Host Thursday coffee catch-up with design peers',
      notes: 'Confirm venue and invite two new community members.',
      completed: false,
      priority: 'low',
      category: 'Social',
      dueDate: todayIso,
      createdAt: 1731480400000,
      isRepeating: false,
      streakCount: 0,
      quadrant: 'delegate',
      scheduledHour: 16,
      subtasks: [],
    },
    {
      id: 'seed-7',
      title: 'Curate minimalist workspace lighting & desk layout',
      notes: 'Calibrate warm key light and declutter cable tray.',
      completed: false,
      priority: 'low',
      category: 'Aesthetics',
      dueDate: todayIso,
      createdAt: 1731480500000,
      isRepeating: true,
      streakCount: 3,
      quadrant: 'eliminate',
      scheduledHour: 19,
      subtasks: [],
    },
  ];
}

export interface WheelSpinOutcome {
  selectedTask: TodoItem;
  selectedIndex: number;
  targetRotation: number;
}

export function getEligibleWheelTasks(
  todos: TodoItem[],
  category: Category | 'All' = 'All'
): TodoItem[] {
  const activeTodos = todos.filter((t) => !t.completed);
  if (category === 'All') return activeTodos;
  const inCategory = activeTodos.filter((t) => t.category === category);
  return inCategory.length > 0 ? inCategory : activeTodos;
}

export function calculateWheelSpinResult(
  tasks: TodoItem[],
  randomValue: number,
  currentRotation: number = 0,
  extraSpins: number = 5
): WheelSpinOutcome {
  if (tasks.length === 0) {
    throw new Error('Cannot spin wheel with no active tasks');
  }
  const clampedRandom = Math.max(0, Math.min(0.999999, randomValue));
  const count = tasks.length;
  const selectedIndex = Math.floor(clampedRandom * count);
  const sliceAngle = 360 / count;

  const sliceCenter = (selectedIndex + 0.5) * sliceAngle;
  const desiredMod = (360 - sliceCenter + 360) % 360;
  const currentMod = ((currentRotation % 360) + 360) % 360;
  let delta = (desiredMod - currentMod + 360) % 360;
  if (delta < 30) {
    delta += 360;
  }

  const targetRotation = currentRotation + extraSpins * 360 + delta;

  return {
    selectedTask: tasks[selectedIndex],
    selectedIndex,
    targetRotation,
  };
}

export function didTaskTransitionToCompleted(
  todos: TodoItem[],
  id: string
): TodoItem | null {
  const target = todos.find((t) => t.id === id);
  if (!target || target.completed) {
    return null;
  }
  return target;
}

export type BrainDumpStatus = 'queue' | 'stored';

export interface BrainDumpItem {
  id: string;
  title: string;
  notes: string;
  category: Category;
  priority: Priority;
  status: BrainDumpStatus;
  createdAt: number;
}

export function parseBrainDumpInput(
  rawText: string,
  category: Category = 'Portfolio',
  priority: Priority = 'medium',
  baseTimestamp: number = Date.now()
): BrainDumpItem[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^[-*•\d.)]+\s*/, '').trim())
    .filter((line) => line.length > 0);

  return lines.map((title, idx) => ({
    id: `dump-${baseTimestamp}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
    title,
    notes: '',
    category: normalizeCategory(category),
    priority,
    status: 'queue',
    createdAt: baseTimestamp + idx,
  }));
}

export function swipeBrainDumpRight(
  dumpItems: BrainDumpItem[],
  todos: TodoItem[],
  itemId: string,
  todayIso: string = getTodayIsoDate()
): {
  dumpItems: BrainDumpItem[];
  todos: TodoItem[];
  addedTodo: TodoItem | null;
} {
  const target = dumpItems.find((d) => d.id === itemId);
  if (!target) {
    return { dumpItems, todos, addedTodo: null };
  }

  const addedTodo = createTodoItem({
    title: target.title,
    notes: target.notes,
    category: normalizeCategory(target.category),
    priority: target.priority,
    dueDate: todayIso,
  });

  return {
    dumpItems: dumpItems.filter((d) => d.id !== itemId),
    todos: [addedTodo, ...todos],
    addedTodo,
  };
}

export function swipeBrainDumpLeft(
  dumpItems: BrainDumpItem[],
  itemId: string
): BrainDumpItem[] {
  return dumpItems.map((item) =>
    item.id === itemId ? { ...item, status: 'stored' } : item
  );
}

export function restoreStoredBrainDumpToDeck(
  dumpItems: BrainDumpItem[],
  itemId: string
): BrainDumpItem[] {
  return dumpItems.map((item) =>
    item.id === itemId ? { ...item, status: 'queue' } : item
  );
}

export function deleteBrainDumpItem(
  dumpItems: BrainDumpItem[],
  itemId: string
): BrainDumpItem[] {
  return dumpItems.filter((item) => item.id !== itemId);
}

export function getInitialSeedBrainDump(): BrainDumpItem[] {
  return [
    {
      id: 'dump-seed-1',
      title: 'Publish interactive UI component library showcase',
      notes: 'Add live playground links to main portfolio page.',
      category: 'Portfolio',
      priority: 'high',
      status: 'queue',
      createdAt: 1731481000000,
    },
    {
      id: 'dump-seed-2',
      title: 'Volunteer for weekend community code workshop',
      notes: 'Help beginners set up their first TypeScript project.',
      category: 'Karma',
      priority: 'medium',
      status: 'queue',
      createdAt: 1731481100000,
    },
    {
      id: 'dump-seed-3',
      title: 'Tailor autumn wool overshirt and organize wardrobe',
      notes: 'Keep color palette cohesive and donate unused items.',
      category: 'Aesthetics',
      priority: 'low',
      status: 'queue',
      createdAt: 1731481200000,
    },
    {
      id: 'dump-seed-4',
      title: 'Summarize key takeaways from distributed systems paper',
      notes: 'Add flashcards to spaced-repetition deck.',
      category: 'Knowledge',
      priority: 'high',
      status: 'queue',
      createdAt: 1731481300000,
    },
    {
      id: 'dump-seed-5',
      title: 'Plan weekend dinner party for close friends',
      notes: 'Stored for next month when schedule clears up.',
      category: 'Social',
      priority: 'low',
      status: 'stored',
      createdAt: 1731480500000,
    },
  ];
}

// ============================================================================
// Topic Dashboard Pure Functions & Seed Data
// ============================================================================

export function computeTopicProgressPercent(topic: TopicItem): number {
  if (topic.targetUnits <= 0) return 0;
  const pct = Math.round((topic.currentUnits / topic.targetUnits) * 100);
  return Math.max(0, Math.min(100, pct));
}

export function createTopicItem(params: {
  id?: string;
  title: string;
  description?: string;
  lifeArea: Category;
  goalLabel: string;
  currentUnits?: number;
  targetUnits: number;
  unitName?: string;
  resources?: TopicResource[];
  createdAt?: number;
}): TopicItem {
  const cleanTitle = params.title.trim();
  if (!cleanTitle) {
    throw new Error('Topic title is required');
  }
  const targetUnits = Math.max(1, Math.floor(params.targetUnits || 10));
  const currentUnits = Math.max(
    0,
    Math.min(targetUnits, Math.floor(params.currentUnits ?? 0))
  );
  return {
    id: params.id ?? `topic-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: cleanTitle,
    description: (params.description ?? '').trim(),
    lifeArea: normalizeCategory(params.lifeArea),
    goalLabel: params.goalLabel.trim() || `Complete ${targetUnits} ${params.unitName || 'milestones'}`,
    currentUnits,
    targetUnits,
    unitName: (params.unitName ?? 'modules').trim() || 'modules',
    resources: params.resources ?? [],
    createdAt: params.createdAt ?? Date.now(),
  };
}

export function updateTopicProgress(
  topics: TopicItem[],
  topicId: string,
  deltaUnits: number
): TopicItem[] {
  return topics.map((t) => {
    if (t.id !== topicId) return t;
    const nextUnits = Math.max(
      0,
      Math.min(t.targetUnits, t.currentUnits + deltaUnits)
    );
    return { ...t, currentUnits: nextUnits };
  });
}

export function addTopicResource(
  topics: TopicItem[],
  topicId: string,
  resource: {
    id?: string;
    title: string;
    type: TopicResourceType;
    url: string;
  }
): TopicItem[] {
  const cleanTitle = resource.title.trim();
  const cleanUrl = resource.url.trim();
  if (!cleanTitle || !cleanUrl) return topics;

  const formattedUrl =
    cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')
      ? cleanUrl
      : `https://${cleanUrl}`;

  return topics.map((t) => {
    if (t.id !== topicId) return t;
    const newRes: TopicResource = {
      id: resource.id ?? `res-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: cleanTitle,
      type: resource.type,
      url: formattedUrl,
      completed: false,
    };
    return {
      ...t,
      resources: [...t.resources, newRes],
    };
  });
}

export function toggleTopicResourceCompletion(
  topics: TopicItem[],
  topicId: string,
  resourceId: string
): TopicItem[] {
  return topics.map((t) => {
    if (t.id !== topicId) return t;
    return {
      ...t,
      resources: t.resources.map((r) =>
        r.id === resourceId ? { ...r, completed: !r.completed } : r
      ),
    };
  });
}

export function deleteTopicResource(
  topics: TopicItem[],
  topicId: string,
  resourceId: string
): TopicItem[] {
  return topics.map((t) => {
    if (t.id !== topicId) return t;
    return {
      ...t,
      resources: t.resources.filter((r) => r.id !== resourceId),
    };
  });
}

export function getInitialSeedTopics(): TopicItem[] {
  return [
    {
      id: 'topic-1',
      title: 'Full-Stack System Design & Architecture',
      description:
        'Master scalable distributed backends, caching layers, and production system case studies.',
      lifeArea: 'Portfolio',
      goalLabel: 'Build & document 10 production-grade system architecture modules',
      currentUnits: 7,
      targetUnits: 10,
      unitName: 'modules',
      createdAt: 1731480000000,
      resources: [
        {
          id: 'res-101',
          title: 'ByteByteGo — System Design Interview Deep Dive',
          type: 'YouTube',
          url: 'https://www.youtube.com/@ByteByteGo',
          completed: true,
        },
        {
          id: 'res-102',
          title: 'Mastering Distributed Systems & Microservices Architecture',
          type: 'Udemy',
          url: 'https://www.udemy.com/topic/software-architecture/',
          completed: true,
        },
        {
          id: 'res-103',
          title: 'Excalidraw Architecture Diagramming Workspace',
          type: 'App',
          url: 'https://excalidraw.com',
          completed: false,
        },
      ],
    },
    {
      id: 'topic-2',
      title: 'Cognitive Science & Mental Models',
      description:
        'Deepen decision-making frameworks, probabilistic reasoning, and spaced-repetition synthesis.',
      lifeArea: 'Knowledge',
      goalLabel: 'Complete 20 synthesis notes & lecture reviews',
      currentUnits: 13,
      targetUnits: 20,
      unitName: 'notes',
      createdAt: 1731480100000,
      resources: [
        {
          id: 'res-201',
          title: 'MIT OpenCourseWare — Cognitive Science & AI Lectures',
          type: 'YouTube',
          url: 'https://www.youtube.com/@mitocw',
          completed: true,
        },
        {
          id: 'res-202',
          title: 'Obsidian Knowledge Graph & Zettelkasten App',
          type: 'App',
          url: 'https://obsidian.md',
          completed: true,
        },
        {
          id: 'res-203',
          title: 'Anki Spaced Repetition Flashcards',
          type: 'App',
          url: 'https://apps.ankiweb.net',
          completed: false,
        },
      ],
    },
    {
      id: 'topic-3',
      title: 'Athletic Calisthenics & Mobility Mastery',
      description:
        'Progressive overload on weighted calisthenics, handstand balance, and joint longevity.',
      lifeArea: 'Strength',
      goalLabel: 'Complete 30 structured strength & mobility sessions',
      currentUnits: 21,
      targetUnits: 30,
      unitName: 'sessions',
      createdAt: 1731480200000,
      resources: [
        {
          id: 'res-301',
          title: 'FitnessFAQs — Rings & Scapular Strength Progression',
          type: 'YouTube',
          url: 'https://www.youtube.com/@FitnessFAQs',
          completed: true,
        },
        {
          id: 'res-302',
          title: 'Complete Mobility & Joint Conditioning Bootcamp',
          type: 'Udemy',
          url: 'https://www.udemy.com/topic/fitness/',
          completed: false,
        },
        {
          id: 'res-303',
          title: 'Hevy Workout Log & Progressive Overload Tracker',
          type: 'App',
          url: 'https://www.hevyapp.com',
          completed: true,
        },
      ],
    },
    {
      id: 'topic-4',
      title: 'Charisma, Vocal Presence & Public Speaking',
      description:
        'Refine storytelling cadence, active listening, and high-stakes presentation delivery.',
      lifeArea: 'Personality',
      goalLabel: 'Deliver 12 recorded speaking drills & live talks',
      currentUnits: 6,
      targetUnits: 12,
      unitName: 'drills',
      createdAt: 1731480300000,
      resources: [
        {
          id: 'res-401',
          title: 'Stanford GSB — Think Fast, Talk Smart Communication Series',
          type: 'YouTube',
          url: 'https://www.youtube.com/@stanfordgsb',
          completed: true,
        },
        {
          id: 'res-402',
          title: 'Executive Public Speaking & Storytelling Masterclass',
          type: 'Udemy',
          url: 'https://www.udemy.com/topic/public-speaking/',
          completed: false,
        },
      ],
    },
    {
      id: 'topic-5',
      title: 'Industrial Design, Typography & Minimalist Spaces',
      description:
        'Study Swiss typographic grids, interior lighting composition, and cohesive personal style.',
      lifeArea: 'Aesthetics',
      goalLabel: 'Complete 8 design studies & spatial audits',
      currentUnits: 5,
      targetUnits: 8,
      unitName: 'studies',
      createdAt: 1731480400000,
      resources: [
        {
          id: 'res-501',
          title: 'The Futur — Typography, Grid Systems & Visual Hierarchy',
          type: 'YouTube',
          url: 'https://www.youtube.com/@thefutur',
          completed: true,
        },
        {
          id: 'res-502',
          title: 'Are.na Visual Research & Moodboard App',
          type: 'App',
          url: 'https://www.are.na',
          completed: false,
        },
      ],
    },
  ];
}

// ============================================================================
// Multi-Horizon Goal Planner (Zoom-Out 5Y -> Tunnel-Vision 1W) Connected to Topics
// ============================================================================

export const GOAL_HORIZONS = [
  '5_year',
  '3_year',
  '1_year',
  '4_month',
  '1_month',
  '1_week',
] as const;

export type GoalHorizonKey = (typeof GOAL_HORIZONS)[number];

export interface GoalHorizonConfig {
  key: GoalHorizonKey;
  label: string;
  shortLabel: string;
  zoomLevel: string;
  promptQuestion: string;
  unitWeight: number;
}

export const GOAL_HORIZON_PROMPTS: Record<GoalHorizonKey, GoalHorizonConfig> = {
  '5_year': {
    key: '5_year',
    label: '5-Year Goal',
    shortLabel: '5 Years',
    zoomLevel: 'Zoom Out · Macro Vision',
    promptQuestion:
      'Zoom out 5 years: What does ultimate mastery, impact, and identity look like for this topic?',
    unitWeight: 3,
  },
  '3_year': {
    key: '3_year',
    label: '3-Year Goal',
    shortLabel: '3 Years',
    zoomLevel: 'Strategic Anchor',
    promptQuestion:
      'At the 3-year mark: What major capability, portfolio asset, or milestone proves you are halfway there?',
    unitWeight: 2,
  },
  '1_year': {
    key: '1_year',
    label: '1-Year Goal',
    shortLabel: '1 Year',
    zoomLevel: 'Annual Breakthrough',
    promptQuestion:
      '1 year from today: What concrete, measurable outcome must be finished to make this year a success?',
    unitWeight: 2,
  },
  '4_month': {
    key: '4_month',
    label: '4-Month Goal',
    shortLabel: '4 Months',
    zoomLevel: 'Quarterly Sprint',
    promptQuestion:
      'Next 4 months: What focused project or skill sprint will build the strongest momentum?',
    unitWeight: 1,
  },
  '1_month': {
    key: '1_month',
    label: '1-Month Goal',
    shortLabel: '1 Month',
    zoomLevel: '30-Day Deliverable',
    promptQuestion:
      'This month: What specific deliverables or modules will you complete in the next 30 days?',
    unitWeight: 1,
  },
  '1_week': {
    key: '1_week',
    label: '1-Week Goal',
    shortLabel: '1 Week',
    zoomLevel: 'Tunnel Vision · Immediate Execution',
    promptQuestion:
      'Tunnel vision for the next 7 days: What exact actions will you execute this week with zero distractions?',
    unitWeight: 1,
  },
};

export interface GoalHorizonStep {
  horizon: GoalHorizonKey;
  answer: string;
  completed: boolean;
}

export interface TopicGoalRoadmap {
  id: string;
  topicId: string;
  lifeArea: Category;
  updatedAt: number;
  steps: Record<GoalHorizonKey, GoalHorizonStep>;
}

export function createTopicGoalRoadmap(params: {
  id?: string;
  topicId: string;
  lifeArea: Category;
  answers?: Partial<Record<GoalHorizonKey, string>>;
  completedMap?: Partial<Record<GoalHorizonKey, boolean>>;
  updatedAt?: number;
}): TopicGoalRoadmap {
  const steps = {} as Record<GoalHorizonKey, GoalHorizonStep>;
  for (const key of GOAL_HORIZONS) {
    steps[key] = {
      horizon: key,
      answer: (params.answers?.[key] ?? '').trim(),
      completed: Boolean(params.completedMap?.[key]),
    };
  }
  return {
    id: params.id ?? `roadmap-${params.topicId}`,
    topicId: params.topicId,
    lifeArea: normalizeCategory(params.lifeArea),
    updatedAt: params.updatedAt ?? Date.now(),
    steps,
  };
}

/**
 * Updates a prompt answer for a specific horizon on a topic's goal roadmap.
 */
export function updateGoalHorizonAnswer(
  roadmaps: TopicGoalRoadmap[],
  topicId: string,
  horizon: GoalHorizonKey,
  answer: string
): TopicGoalRoadmap[] {
  return roadmaps.map((rm) => {
    if (rm.topicId !== topicId) return rm;
    return {
      ...rm,
      updatedAt: Date.now(),
      steps: {
        ...rm.steps,
        [horizon]: {
          ...rm.steps[horizon],
          answer,
        },
      },
    };
  });
}

/**
 * Toggles completion of a horizon goal step AND synchronizes the linked
 * TopicItem's progress bar (currentUnits) by the horizon's unitWeight.
 */
export function toggleGoalHorizonStepWithTopicSync(
  roadmaps: TopicGoalRoadmap[],
  topics: TopicItem[],
  topicId: string,
  horizon: GoalHorizonKey
): {
  roadmaps: TopicGoalRoadmap[];
  topics: TopicItem[];
} {
  const targetRoadmap = roadmaps.find((r) => r.topicId === topicId);
  if (!targetRoadmap) {
    return { roadmaps, topics };
  }

  const currentStep = targetRoadmap.steps[horizon];
  const nextCompleted = !currentStep.completed;
  const weight = GOAL_HORIZON_PROMPTS[horizon].unitWeight;
  const deltaUnits = nextCompleted ? weight : -weight;

  const updatedRoadmaps = roadmaps.map((rm) => {
    if (rm.topicId !== topicId) return rm;
    return {
      ...rm,
      updatedAt: Date.now(),
      steps: {
        ...rm.steps,
        [horizon]: {
          ...currentStep,
          completed: nextCompleted,
        },
      },
    };
  });

  const updatedTopics = updateTopicProgress(topics, topicId, deltaUnits);

  return {
    roadmaps: updatedRoadmaps,
    topics: updatedTopics,
  };
}

export function computeRoadmapCompletionStats(roadmap: TopicGoalRoadmap): {
  completedHorizons: number;
  answeredHorizons: number;
  totalHorizons: number;
  percentCompleted: number;
} {
  const totalHorizons = GOAL_HORIZONS.length;
  let completedHorizons = 0;
  let answeredHorizons = 0;
  for (const key of GOAL_HORIZONS) {
    const step = roadmap.steps[key];
    if (step?.answer.trim()) answeredHorizons++;
    if (step?.completed) completedHorizons++;
  }
  return {
    completedHorizons,
    answeredHorizons,
    totalHorizons,
    percentCompleted: Math.round((completedHorizons / totalHorizons) * 100),
  };
}

export function getInitialSeedGoalRoadmaps(): TopicGoalRoadmap[] {
  return [
    createTopicGoalRoadmap({
      id: 'roadmap-topic-1',
      topicId: 'topic-1',
      lifeArea: 'Portfolio',
      answers: {
        '5_year': 'Principal Distributed Systems Architect leading high-scale global cloud platforms.',
        '3_year': 'Staff Engineer owning core real-time data pipelines and open-source benchmarks.',
        '1_year': 'Publish 10 production architecture case studies and pass senior system design loops.',
        '4_month': 'Build and benchmark a distributed Raft key-value store and event-driven queue.',
        '1_month': 'Complete 3 architecture deep-dive modules on caching, sharding, and replication.',
        '1_week': 'Finish the Excalidraw diagram and write the replication latency benchmark report.',
      },
      completedMap: {
        '5_year': false,
        '3_year': false,
        '1_year': false,
        '4_month': true,
        '1_month': true,
        '1_week': true,
      },
      updatedAt: 1731480000000,
    }),
    createTopicGoalRoadmap({
      id: 'roadmap-topic-2',
      topicId: 'topic-2',
      lifeArea: 'Knowledge',
      answers: {
        '5_year': 'Build a 2,000-node interconnected Zettelkasten across computer science, economics, and cognitive psychology.',
        '3_year': 'Publish a synthesized handbook of mental models and probabilistic decision-making.',
        '1_year': 'Complete 20 university-grade lecture series with permanent spaced-repetition notes.',
        '4_month': 'Finish MIT Cognitive Science lectures and synthesize 8 core chapters.',
        '1_month': 'Write 4 atomic synthesis notes and review Anki deck daily.',
        '1_week': 'Summarize 2 chapters of Designing Data-Intensive Applications into Obsidian.',
      },
      completedMap: {
        '5_year': false,
        '3_year': false,
        '1_year': false,
        '4_month': true,
        '1_month': true,
        '1_week': false,
      },
      updatedAt: 1731480100000,
    }),
    createTopicGoalRoadmap({
      id: 'roadmap-topic-3',
      topicId: 'topic-3',
      lifeArea: 'Strength',
      answers: {
        '5_year': 'Maintain effortless ring strength, full mobility, and peak cardiovascular conditioning year-round.',
        '3_year': 'Hold a 30-second freestanding handstand and strict ring muscle-ups for reps.',
        '1_year': 'Complete 150 structured calisthenics and mobility sessions with zero injury.',
        '4_month': 'Add +15kg to weighted pull-ups and unlock full pancake thoracic mobility.',
        '1_month': 'Complete 12 compound strength & mobility sessions.',
        '1_week': 'Hit 3 progressive overload strength workouts and 2 dedicated 20-minute mobility flows.',
      },
      completedMap: {
        '5_year': false,
        '3_year': false,
        '1_year': false,
        '4_month': true,
        '1_month': true,
        '1_week': true,
      },
      updatedAt: 1731480200000,
    }),
    createTopicGoalRoadmap({
      id: 'roadmap-topic-4',
      topicId: 'topic-4',
      lifeArea: 'Personality',
      answers: {
        '5_year': 'Keynote speaker and charismatic communicator able to articulate complex ideas with warmth and clarity.',
        '3_year': 'Deliver 10 conference talks and host regular technical roundtables.',
        '1_year': 'Complete 12 recorded storytelling and impromptu speaking drills.',
        '4_month': 'Finish the Stanford GSB communication series and practice vocal pacing weekly.',
        '1_month': 'Record 4 5-minute unscripted explanations of technical architectures.',
        '1_week': 'Complete two 15-minute impromptu vocal storytelling drills and review playback.',
      },
      completedMap: {
        '5_year': false,
        '3_year': false,
        '1_year': false,
        '4_month': false,
        '1_month': true,
        '1_week': true,
      },
      updatedAt: 1731480300000,
    }),
    createTopicGoalRoadmap({
      id: 'roadmap-topic-5',
      topicId: 'topic-5',
      lifeArea: 'Aesthetics',
      answers: {
        '5_year': 'Design and live in a serene, museum-grade minimalist studio with timeless personal aesthetics.',
        '3_year': 'Master Swiss editorial typography, industrial design principles, and architectural lighting.',
        '1_year': 'Complete 8 spatial & typographic design studies and curate a capsule wardrobe.',
        '4_month': 'Redesign home office ergonomics, warm lighting, and acoustic treatment.',
        '1_month': 'Complete 2 typography grid studies and declutter desk cable architecture.',
        '1_week': 'Calibrate warm key light and mount under-desk cable management tray.',
      },
      completedMap: {
        '5_year': false,
        '3_year': false,
        '1_year': false,
        '4_month': false,
        '1_month': true,
        '1_week': false,
      },
      updatedAt: 1731480400000,
    }),
  ];
}

// ============================================================================
// Dual Version Layout Configuration (Tablet/Desktop Left Nav vs Android 9:16 Bottom Nav)
// ============================================================================

export type AppLayoutVersion = 'tablet' | 'mobile' | 'split';

export type WorkspaceTab =
  | 'tasks'
  | 'habits'
  | 'matrix'
  | 'network'
  | 'journal'
  | 'timer'
  | 'goals'
  | 'topics'
  | 'calendar'
  | 'braindump';

export type TaskRightPanelMode = 'insights' | 'hourly_calendar';

export function resolveRadarAreaNavigation(cat: Category | 'All'): {
  targetView: WorkspaceTab;
  categoryFilter: Category | 'All';
} {
  if (cat === 'Social') {
    return {
      targetView: 'network',
      categoryFilter: 'Social',
    };
  }
  return {
    targetView: 'tasks',
    categoryFilter: cat,
  };
}

export interface LayoutSpec {
  version: 'tablet' | 'mobile';
  navPosition: 'left' | 'bottom';
  aspectRatio: '16:10' | '9:16';
  label: string;
}

export function getLayoutSpec(version: 'tablet' | 'mobile'): LayoutSpec {
  if (version === 'mobile') {
    return {
      version: 'mobile',
      navPosition: 'bottom',
      aspectRatio: '9:16',
      label: 'Android Mobile (9:16 · Bottom Nav)',
    };
  }
  return {
    version: 'tablet',
    navPosition: 'left',
    aspectRatio: '16:10',
    label: 'Tablet / Desktop (Left Nav)',
  };
}

// ============================================================================
// Eisenhower Matrix (Urgent vs Important 4-Quadrant Prioritization)
// ============================================================================

export const EISENHOWER_QUADRANTS: readonly EisenhowerQuadrant[] = [
  'do_first',
  'schedule',
  'delegate',
  'eliminate',
] as const;

export interface EisenhowerQuadrantMeta {
  key: EisenhowerQuadrant;
  code: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  title: string;
  subtitle: string;
  actionTag: string;
  urgencyLabel: 'Urgent' | 'Not Urgent';
  importanceLabel: 'Important' | 'Not Important';
  defaultPriority: Priority;
}

export const EISENHOWER_QUADRANT_META: Record<
  EisenhowerQuadrant,
  EisenhowerQuadrantMeta
> = {
  do_first: {
    key: 'do_first',
    code: 'Q1',
    title: 'Do First',
    subtitle: 'Urgent & Important',
    actionTag: 'Execute Immediately',
    urgencyLabel: 'Urgent',
    importanceLabel: 'Important',
    defaultPriority: 'high',
  },
  schedule: {
    key: 'schedule',
    code: 'Q2',
    title: 'Schedule',
    subtitle: 'Not Urgent & Important',
    actionTag: 'Plan Deep Work',
    urgencyLabel: 'Not Urgent',
    importanceLabel: 'Important',
    defaultPriority: 'high',
  },
  delegate: {
    key: 'delegate',
    code: 'Q3',
    title: 'Delegate',
    subtitle: 'Urgent & Not Important',
    actionTag: 'Delegate / Batch',
    urgencyLabel: 'Urgent',
    importanceLabel: 'Not Important',
    defaultPriority: 'medium',
  },
  eliminate: {
    key: 'eliminate',
    code: 'Q4',
    title: 'Eliminate / Later',
    subtitle: 'Not Urgent & Not Important',
    actionTag: 'Minimize or Drop',
    urgencyLabel: 'Not Urgent',
    importanceLabel: 'Not Important',
    defaultPriority: 'low',
  },
};

export function resolveTaskQuadrant(
  todo: TodoItem,
  todayIso: string = getTodayIsoDate()
): EisenhowerQuadrant {
  if (
    todo.quadrant &&
    (EISENHOWER_QUADRANTS as readonly string[]).includes(todo.quadrant)
  ) {
    return todo.quadrant;
  }

  const isUrgent = Boolean(todo.dueDate && todo.dueDate <= todayIso);
  if (todo.priority === 'high') {
    return isUrgent ? 'do_first' : 'schedule';
  }
  if (todo.priority === 'medium') {
    return isUrgent ? 'delegate' : 'schedule';
  }
  return isUrgent ? 'delegate' : 'eliminate';
}

export function assignTaskQuadrant(
  todos: TodoItem[],
  todoId: string,
  quadrant: EisenhowerQuadrant
): TodoItem[] {
  const defaultPriority = EISENHOWER_QUADRANT_META[quadrant].defaultPriority;
  return todos.map((todo) => {
    if (todo.id !== todoId) return todo;
    return {
      ...todo,
      quadrant,
      priority: defaultPriority,
    };
  });
}

export function groupTodosByEisenhower(
  todos: TodoItem[],
  options: {
    includeCompleted?: boolean;
    category?: Category | 'All';
    todayIso?: string;
  } = {}
): Record<EisenhowerQuadrant, TodoItem[]> {
  const includeCompleted = options.includeCompleted ?? true;
  const category = options.category ?? 'All';
  const todayIso = options.todayIso ?? getTodayIsoDate();

  const grouped: Record<EisenhowerQuadrant, TodoItem[]> = {
    do_first: [],
    schedule: [],
    delegate: [],
    eliminate: [],
  };

  for (const todo of todos) {
    if (!includeCompleted && todo.completed) continue;
    if (category !== 'All' && normalizeCategory(todo.category) !== category) {
      continue;
    }
    const q = resolveTaskQuadrant(todo, todayIso);
    grouped[q].push(todo);
  }

  for (const key of EISENHOWER_QUADRANTS) {
    grouped[key].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
  }

  return grouped;
}

export function computeEisenhowerSummary(
  todos: TodoItem[],
  todayIso: string = getTodayIsoDate()
): Record<
  EisenhowerQuadrant,
  { total: number; active: number; completed: number }
> {
  const summary: Record<
    EisenhowerQuadrant,
    { total: number; active: number; completed: number }
  > = {
    do_first: { total: 0, active: 0, completed: 0 },
    schedule: { total: 0, active: 0, completed: 0 },
    delegate: { total: 0, active: 0, completed: 0 },
    eliminate: { total: 0, active: 0, completed: 0 },
  };

  for (const todo of todos) {
    const q = resolveTaskQuadrant(todo, todayIso);
    summary[q].total += 1;
    if (todo.completed) {
      summary[q].completed += 1;
    } else {
      summary[q].active += 1;
    }
  }

  return summary;
}

// ============================================================================
// Hourly Calendar View (Right-Side Task Panel Schedule)
// ============================================================================

export interface HourlyScheduleSlot {
  hour: number;
  label: string;
  tasks: TodoItem[];
}

export function formatHourSlotLabel(hour: number): string {
  const normalized = ((Math.floor(hour) % 24) + 24) % 24;
  const suffix = normalized >= 12 ? 'PM' : 'AM';
  const displayHour = normalized % 12 === 0 ? 12 : normalized % 12;
  return `${String(displayHour).padStart(2, '0')}:00 ${suffix}`;
}

export function assignTodoScheduledHour(
  todos: TodoItem[],
  todoId: string,
  scheduledHour: number | undefined,
  dateIso?: string
): TodoItem[] {
  return todos.map((t) => {
    if (t.id !== todoId) return t;
    return {
      ...t,
      scheduledHour,
      dueDate: dateIso ?? t.dueDate,
    };
  });
}

export function getHourlyScheduleForDate(
  todos: TodoItem[],
  dateIso: string,
  startHour: number = 7,
  endHour: number = 21
): HourlyScheduleSlot[] {
  const slots: HourlyScheduleSlot[] = [];
  for (let h = startHour; h <= endHour; h++) {
    const matching = todos.filter(
      (t) => t.dueDate === dateIso && t.scheduledHour === h
    );
    slots.push({
      hour: h,
      label: formatHourSlotLabel(h),
      tasks: matching,
    });
  }
  return slots;
}

// ============================================================================
// Relationship & Organization Dashboard (7 Life Areas CRM & Communities)
// ============================================================================

export type RelationshipCadence =
  | 'Weekly'
  | 'Bi-weekly'
  | 'Monthly'
  | 'Quarterly';

export interface RelationshipContact {
  id: string;
  name: string;
  role: string;
  organizationName: string;
  lifeArea: Category;
  cadence: RelationshipCadence;
  lastContactedDate: string; // YYYY-MM-DD
  streakCount: number;
  nextAction: string;
}

export type OrganizationCategory =
  | 'Company'
  | 'Community'
  | 'Open Source'
  | 'Club'
  | 'Volunteer';

export interface OrganizationItem {
  id: string;
  name: string;
  type: OrganizationCategory;
  role: string;
  lifeArea: Category;
  cadence: string;
  memberOrContactCount: number;
  focusGoal: string;
}

export function createRelationshipContact(params: {
  id?: string;
  name: string;
  role: string;
  organizationName?: string;
  lifeArea: Category;
  cadence?: RelationshipCadence;
  lastContactedDate?: string;
  streakCount?: number;
  nextAction?: string;
}): RelationshipContact {
  const cleanName = params.name.trim();
  if (!cleanName) {
    throw new Error('Contact name is required');
  }
  return {
    id:
      params.id ??
      `rel-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: cleanName,
    role: params.role.trim() || 'Collaborator',
    organizationName: (params.organizationName ?? '').trim() || 'Independent',
    lifeArea: normalizeCategory(params.lifeArea),
    cadence: params.cadence ?? 'Bi-weekly',
    lastContactedDate: params.lastContactedDate || getTodayIsoDate(),
    streakCount: Math.max(0, Math.floor(params.streakCount ?? 1)),
    nextAction:
      (params.nextAction ?? '').trim() || 'Send quick check-in message',
  };
}

export function logRelationshipCheckIn(
  contacts: RelationshipContact[],
  contactId: string,
  todayIso: string = getTodayIsoDate()
): RelationshipContact[] {
  return contacts.map((c) => {
    if (c.id !== contactId) return c;
    return {
      ...c,
      lastContactedDate: todayIso,
      streakCount: c.streakCount + 1,
    };
  });
}

export function createOrganizationItem(params: {
  id?: string;
  name: string;
  type?: OrganizationCategory;
  role: string;
  lifeArea: Category;
  cadence?: string;
  memberOrContactCount?: number;
  focusGoal?: string;
}): OrganizationItem {
  const cleanName = params.name.trim();
  if (!cleanName) {
    throw new Error('Organization name is required');
  }
  return {
    id:
      params.id ??
      `org-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: cleanName,
    type: params.type ?? 'Community',
    role: params.role.trim() || 'Active Member',
    lifeArea: normalizeCategory(params.lifeArea),
    cadence: (params.cadence ?? '').trim() || 'Weekly Sync',
    memberOrContactCount: Math.max(
      1,
      Math.floor(params.memberOrContactCount ?? 1)
    ),
    focusGoal:
      (params.focusGoal ?? '').trim() ||
      'Contribute consistently and build deep trust',
  };
}

export function getInitialSeedRelationships(
  todayIso: string = getTodayIsoDate()
): RelationshipContact[] {
  return [
    {
      id: 'rel-1',
      name: 'Elena Rostova',
      role: 'Principal Systems Mentor',
      organizationName: 'CloudScale Architecture Guild',
      lifeArea: 'Portfolio',
      cadence: 'Bi-weekly',
      lastContactedDate: todayIso,
      streakCount: 8,
      nextAction: 'Review distributed consensus benchmark draft together',
    },
    {
      id: 'rel-2',
      name: 'Marcus Vance',
      role: 'Design & Typography Peer',
      organizationName: 'Swiss Grid Design Collective',
      lifeArea: 'Aesthetics',
      cadence: 'Weekly',
      lastContactedDate: todayIso,
      streakCount: 12,
      nextAction: 'Share minimalist workspace lighting photos & feedback',
    },
    {
      id: 'rel-3',
      name: 'Aisha Patel',
      role: 'Open-Source Mentee',
      organizationName: 'CodeBridge Community Workshop',
      lifeArea: 'Karma',
      cadence: 'Weekly',
      lastContactedDate: todayIso,
      streakCount: 6,
      nextAction: 'Pair-program on her first TypeScript PR test suite',
    },
    {
      id: 'rel-4',
      name: 'Devon Brooks',
      role: 'Calisthenics & Rings Partner',
      organizationName: 'Metro Calisthenics Club',
      lifeArea: 'Strength',
      cadence: 'Weekly',
      lastContactedDate: todayIso,
      streakCount: 15,
      nextAction: 'Saturday morning weighted pull-up & handstand session',
    },
    {
      id: 'rel-5',
      name: 'Sofia Lin',
      role: 'Close Friend & Book Club Host',
      organizationName: 'Founders & Thinkers Salon',
      lifeArea: 'Social',
      cadence: 'Monthly',
      lastContactedDate: todayIso,
      streakCount: 5,
      nextAction: 'Confirm Thursday coffee catch-up guest list',
    },
  ];
}

export function getInitialSeedOrganizations(): OrganizationItem[] {
  return [
    {
      id: 'org-1',
      name: 'CloudScale Architecture Guild',
      type: 'Open Source',
      role: 'Core Maintainer',
      lifeArea: 'Portfolio',
      cadence: 'Tuesdays · Architecture Review',
      memberOrContactCount: 6,
      focusGoal: 'Co-author 3 high-throughput backend RFCs this quarter',
    },
    {
      id: 'org-2',
      name: 'CodeBridge Community Workshop',
      type: 'Volunteer',
      role: 'Lead Mentor',
      lifeArea: 'Karma',
      cadence: 'Saturdays · Mentorship Cohort',
      memberOrContactCount: 14,
      focusGoal: 'Help 10 junior developers land their first open-source merge',
    },
    {
      id: 'org-3',
      name: 'Founders & Thinkers Salon',
      type: 'Community',
      role: 'Discussion Host',
      lifeArea: 'Social',
      cadence: 'Bi-weekly · Dinner & Roundtable',
      memberOrContactCount: 9,
      focusGoal: 'Curate high-trust conversations across science and art',
    },
    {
      id: 'org-4',
      name: 'Metro Calisthenics Club',
      type: 'Club',
      role: 'Training Squad',
      lifeArea: 'Strength',
      cadence: '3x / Week · Morning Rings & Mobility',
      memberOrContactCount: 4,
      focusGoal: 'Hit group freestanding handstand and weighted dip milestones',
    },
  ];
}

// ============================================================================
// DoteTimer Focus Timer (Pomodoro, Deep Work, Sprint & Stopwatch + Session Dots)
// ============================================================================

export type FocusTimerMode =
  | 'pomodoro_25'
  | 'deep_50'
  | 'sprint_15'
  | 'stopwatch';

export interface FocusSessionLog {
  id: string;
  taskId?: string;
  taskTitle: string;
  category: Category;
  durationMinutes: number;
  mode: FocusTimerMode;
  completedAt: string;
}

export function formatTimerDisplay(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function createFocusSessionLog(params: {
  id?: string;
  taskId?: string;
  taskTitle: string;
  category: Category;
  durationMinutes: number;
  mode: FocusTimerMode;
  completedAt?: string;
}): FocusSessionLog {
  return {
    id:
      params.id ??
      `focus-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    taskId: params.taskId,
    taskTitle: params.taskTitle.trim() || 'Deep Focus Session',
    category: normalizeCategory(params.category),
    durationMinutes: Math.max(1, Math.round(params.durationMinutes)),
    mode: params.mode,
    completedAt: params.completedAt ?? 'Today',
  };
}

export function computeFocusTimerStats(logs: FocusSessionLog[]): {
  totalMinutes: number;
  totalSessions: number;
  byArea: Record<Category, number>;
} {
  const byArea: Record<Category, number> = {
    Portfolio: 0,
    Karma: 0,
    Knowledge: 0,
    Personality: 0,
    Social: 0,
    Strength: 0,
    Aesthetics: 0,
  };
  let totalMinutes = 0;
  for (const log of logs) {
    const area = normalizeCategory(log.category);
    const mins = Math.max(0, log.durationMinutes);
    totalMinutes += mins;
    byArea[area] += mins;
  }
  return {
    totalMinutes,
    totalSessions: logs.length,
    byArea,
  };
}

export function getInitialSeedFocusLogs(): FocusSessionLog[] {
  return [
    {
      id: 'flog-1',
      taskId: 'seed-1',
      taskTitle: 'Ship Q4 case study and update engineering portfolio repo',
      category: 'Portfolio',
      durationMinutes: 50,
      mode: 'deep_50',
      completedAt: '09:30 AM',
    },
    {
      id: 'flog-2',
      taskId: 'seed-2',
      taskTitle: 'Read 2 chapters of Designing Data-Intensive Applications',
      category: 'Knowledge',
      durationMinutes: 25,
      mode: 'pomodoro_25',
      completedAt: '10:45 AM',
    },
    {
      id: 'flog-3',
      taskId: 'seed-3',
      taskTitle: '45-minute compound strength & mobility session',
      category: 'Strength',
      durationMinutes: 45,
      mode: 'deep_50',
      completedAt: '07:45 AM',
    },
    {
      id: 'flog-4',
      taskId: 'seed-5',
      taskTitle: 'Practice 15 minutes of impromptu vocal storytelling',
      category: 'Personality',
      durationMinutes: 15,
      mode: 'sprint_15',
      completedAt: '01:15 PM',
    },
  ];
}

// ============================================================================
// Task View Modes: List View, Kanban View, and Timeline View
// ============================================================================

export function resolveKanbanStage(todo: TodoItem): KanbanStage {
  if (todo.completed) return 'done';
  if (todo.kanbanStage === 'in_progress') return 'in_progress';
  if (todo.subtasks && todo.subtasks.some((s) => s.completed)) {
    return 'in_progress';
  }
  return 'todo';
}

export function moveTodoToKanbanStage(
  todos: TodoItem[],
  todoId: string,
  stage: KanbanStage,
  todayIso: string = getTodayIsoDate()
): TodoItem[] {
  return todos.map((todo) => {
    if (todo.id !== todoId) return todo;
    const isNowDone = stage === 'done';
    const wasDone = todo.completed;
    let nextStreak = todo.streakCount ?? 0;
    if (todo.isRepeating) {
      if (isNowDone && !wasDone) nextStreak += 1;
      if (!isNowDone && wasDone) nextStreak = Math.max(0, nextStreak - 1);
    }
    return {
      ...todo,
      completed: isNowDone,
      kanbanStage: stage,
      streakCount: nextStreak,
      lastCompletedDate: isNowDone ? todayIso : todo.lastCompletedDate,
    };
  });
}

export function groupTodosByKanban(
  todos: TodoItem[]
): Record<KanbanStage, TodoItem[]> {
  const columns: Record<KanbanStage, TodoItem[]> = {
    todo: [],
    in_progress: [],
    done: [],
  };
  for (const t of todos) {
    const stage = resolveKanbanStage(t);
    columns[stage].push(t);
  }
  return columns;
}

export interface TimelineDateGroup {
  dateIso: string;
  bucketLabel: string; // e.g., 'Today', 'Overdue', or formatted date
  items: TodoItem[];
}

export function groupTodosForTimeline(
  todos: TodoItem[],
  todayIso: string = getTodayIsoDate()
): TimelineDateGroup[] {
  const byDate = new Map<string, TodoItem[]>();
  for (const todo of todos) {
    const key = todo.dueDate || todayIso;
    const existing = byDate.get(key) ?? [];
    existing.push(todo);
    byDate.set(key, existing);
  }

  const sortedDates = Array.from(byDate.keys()).sort((a, b) =>
    a.localeCompare(b)
  );

  return sortedDates.map((dateIso) => {
    const items = [...(byDate.get(dateIso) ?? [])].sort((a, b) => {
      const hourA = a.scheduledHour ?? 24;
      const hourB = b.scheduledHour ?? 24;
      if (hourA !== hourB) return hourA - hourB;
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return a.createdAt - b.createdAt;
    });

    let bucketLabel = dateIso;
    if (dateIso === todayIso) {
      bucketLabel = `Today · ${dateIso}`;
    } else if (dateIso < todayIso) {
      bucketLabel = `Overdue · ${dateIso}`;
    } else {
      bucketLabel = `Upcoming · ${dateIso}`;
    }

    return {
      dateIso,
      bucketLabel,
      items,
    };
  });
}

// ============================================================================
// Journal Dashboard (7 Life Areas Reflections, Wins & Gratitude)
// ============================================================================

export type JournalMood = 'Peak' | 'Focused' | 'Calm' | 'Reflective';

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  gratitude: string;
  lifeArea: Category;
  mood: JournalMood;
  dateIso: string;
  createdAt: number;
}

export function createJournalEntry(params: {
  id?: string;
  title: string;
  content: string;
  gratitude?: string;
  lifeArea: Category;
  mood?: JournalMood;
  dateIso?: string;
  createdAt?: number;
}): JournalEntry {
  const cleanTitle = params.title.trim();
  const cleanContent = params.content.trim();
  if (!cleanTitle && !cleanContent) {
    throw new Error('Journal title or reflection content is required');
  }
  return {
    id:
      params.id ??
      `journal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: cleanTitle || 'Daily Reflection',
    content: cleanContent,
    gratitude: (params.gratitude ?? '').trim(),
    lifeArea: normalizeCategory(params.lifeArea),
    mood: params.mood ?? 'Focused',
    dateIso: params.dateIso || getTodayIsoDate(),
    createdAt: params.createdAt ?? Date.now(),
  };
}

export function deleteJournalEntry(
  entries: JournalEntry[],
  id: string
): JournalEntry[] {
  return entries.filter((e) => e.id !== id);
}

export function getInitialSeedJournalEntries(
  todayIso: string = getTodayIsoDate()
): JournalEntry[] {
  return [
    {
      id: 'journal-1',
      title: 'Breakthrough on Distributed Consensus Architecture',
      content:
        'Mapped out the Raft leader election state transitions and benchmarked tail latency under simulated packet loss. Writing the postmortem clarified our replication guarantees.',
      gratitude: 'Grateful for Elena’s thoughtful review on the RFC.',
      lifeArea: 'Portfolio',
      mood: 'Peak',
      dateIso: todayIso,
      createdAt: 1731482000000,
    },
    {
      id: 'journal-2',
      title: 'Weighted Rings & Morning Mobility Flow',
      content:
        'Held a clean 20-second freestanding handstand and completed 4 sets of weighted pull-ups with zero shoulder impingement.',
      gratitude: 'Consistent morning training energy with Devon.',
      lifeArea: 'Strength',
      mood: 'Focused',
      dateIso: todayIso,
      createdAt: 1731481000000,
    },
    {
      id: 'journal-3',
      title: 'Founders & Thinkers Salon Conversation',
      content:
        'Hosted an energizing evening roundtable on cognitive mental models and minimalist industrial design.',
      gratitude: 'High-trust community friendships that sharpen perspective.',
      lifeArea: 'Social',
      mood: 'Calm',
      dateIso: todayIso,
      createdAt: 1731480000000,
    },
  ];
}

// ============================================================================
// Habit Dashboard & Completion Heatmap (28-Day Visual Consistency Grid)
// 3 Options: 1. Building a Helpful Habit, 2. Breaking an Unhelpful Habit, 3. Replacing an Old Habit
// ============================================================================

export type HabitCategoryType =
  | 'build_helpful'
  | 'break_unhelpful'
  | 'replace_old';

export const HABIT_CATEGORY_OPTIONS: Array<{
  key: HabitCategoryType;
  optionNumber: number;
  label: string;
  shortLabel: string;
  description: string;
}> = [
  {
    key: 'build_helpful',
    optionNumber: 1,
    label: '1. Building a Helpful Habit',
    shortLabel: 'Build Helpful',
    description: 'Establish a positive compound routine with daily cues.',
  },
  {
    key: 'break_unhelpful',
    optionNumber: 2,
    label: '2. Breaking an Unhelpful Habit',
    shortLabel: 'Break Unhelpful',
    description: 'Eliminate a negative habit by adding friction & tracking clean days.',
  },
  {
    key: 'replace_old',
    optionNumber: 3,
    label: '3. Replacing an Old Habit',
    shortLabel: 'Replace Old',
    description: 'Swap an existing trigger behavior with a better replacement routine.',
  },
];

export interface HabitItem {
  id: string;
  title: string;
  lifeArea: Category;
  habitType?: HabitCategoryType;
  oldHabitToReplace?: string;
  targetPerWeek: number;
  completedDates: string[]; // Array of YYYY-MM-DD strings
}

export interface HeatmapDayCell {
  dateIso: string;
  shortLabel: string;
  completedCount: number;
  totalHabits: number;
  intensityLevel: 0 | 1 | 2 | 3 | 4;
}

export function getRecentIsoDates(
  daysCount: number = 28,
  endDateIso: string = getTodayIsoDate()
): string[] {
  const parts = endDateIso.split('-').map(Number);
  const baseDate = new Date(
    parts[0] || 2026,
    (parts[1] || 11) - 1,
    parts[2] || 13
  );
  const dates: string[] = [];
  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${day}`);
  }
  return dates;
}

export function createHabitItem(params: {
  id?: string;
  title: string;
  lifeArea: Category;
  habitType?: HabitCategoryType;
  oldHabitToReplace?: string;
  targetPerWeek?: number;
  completedDates?: string[];
}): HabitItem {
  const clean = params.title.trim();
  if (!clean) {
    throw new Error('Habit title is required');
  }
  const habitType = params.habitType ?? 'build_helpful';
  const oldHabitToReplace = (params.oldHabitToReplace ?? '').trim() || undefined;
  return {
    id:
      params.id ??
      `habit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: clean,
    lifeArea: normalizeCategory(params.lifeArea),
    habitType,
    oldHabitToReplace,
    targetPerWeek: Math.max(1, Math.min(7, params.targetPerWeek ?? 7)),
    completedDates: Array.from(new Set(params.completedDates ?? [])).sort(),
  };
}

export function toggleHabitDateCompletion(
  habits: HabitItem[],
  habitId: string,
  dateIso: string = getTodayIsoDate()
): HabitItem[] {
  return habits.map((h) => {
    if (h.id !== habitId) return h;
    const exists = h.completedDates.includes(dateIso);
    const nextDates = exists
      ? h.completedDates.filter((d) => d !== dateIso)
      : [...h.completedDates, dateIso].sort();
    return {
      ...h,
      completedDates: nextDates,
    };
  });
}

export function computeHabitCurrentStreak(
  habit: HabitItem,
  todayIso: string = getTodayIsoDate()
): number {
  const recent = getRecentIsoDates(60, todayIso).reverse();
  const dateSet = new Set(habit.completedDates);
  let streak = 0;
  for (let i = 0; i < recent.length; i++) {
    const d = recent[i];
    if (dateSet.has(d)) {
      streak += 1;
    } else if (i === 0) {
      // Allow today to be unchecked without zeroing yesterday's streak
      continue;
    } else {
      break;
    }
  }
  return streak;
}

export function computeHabitHeatmapGrid(
  habits: HabitItem[],
  daysCount: number = 28,
  todayIso: string = getTodayIsoDate()
): HeatmapDayCell[] {
  const dates = getRecentIsoDates(daysCount, todayIso);
  const totalHabits = Math.max(1, habits.length);

  return dates.map((dateIso) => {
    const completedCount = habits.filter((h) =>
      h.completedDates.includes(dateIso)
    ).length;
    const ratio = completedCount / totalHabits;
    let intensityLevel: 0 | 1 | 2 | 3 | 4 = 0;
    if (completedCount > 0) {
      if (ratio >= 0.85) intensityLevel = 4;
      else if (ratio >= 0.6) intensityLevel = 3;
      else if (ratio >= 0.35) intensityLevel = 2;
      else intensityLevel = 1;
    }

    return {
      dateIso,
      shortLabel: dateIso.slice(5), // MM-DD
      completedCount,
      totalHabits: habits.length,
      intensityLevel,
    };
  });
}

export function getInitialSeedHabits(
  todayIso: string = getTodayIsoDate()
): HabitItem[] {
  const last28 = getRecentIsoDates(28, todayIso);
  return [
    {
      id: 'habit-1',
      title: '90m Deep Architecture & Code Block',
      lifeArea: 'Portfolio',
      habitType: 'build_helpful',
      targetPerWeek: 6,
      completedDates: last28.filter((_, idx) => idx % 5 !== 0),
    },
    {
      id: 'habit-2',
      title: '45m Calisthenics & Thoracic Mobility',
      lifeArea: 'Strength',
      habitType: 'build_helpful',
      targetPerWeek: 5,
      completedDates: last28.filter((_, idx) => idx % 3 !== 0),
    },
    {
      id: 'habit-3',
      title: 'Zero Late-Night Doomscrolling After 10:00 PM',
      lifeArea: 'Knowledge',
      habitType: 'break_unhelpful',
      targetPerWeek: 7,
      completedDates: last28.filter((_, idx) => idx % 4 !== 1),
    },
    {
      id: 'habit-4',
      title: 'Zero Refined Sugar or Afternoon Energy Drinks',
      lifeArea: 'Strength',
      habitType: 'break_unhelpful',
      targetPerWeek: 7,
      completedDates: last28.filter((_, idx) => idx % 2 === 0 || idx > 22),
    },
    {
      id: 'habit-5',
      title: 'Read 15 Pages of System Design & Philosophy',
      oldHabitToReplace: 'Checking social feeds first thing in the morning',
      lifeArea: 'Knowledge',
      habitType: 'replace_old',
      targetPerWeek: 6,
      completedDates: last28.filter((_, idx) => idx % 3 === 1 || idx >= 24),
    },
    {
      id: 'habit-6',
      title: '10m Impromptu Vocal Storytelling Walk',
      oldHabitToReplace: 'Sitting at desk during afternoon slump',
      lifeArea: 'Personality',
      habitType: 'replace_old',
      targetPerWeek: 5,
      completedDates: last28.filter((_, idx) => idx % 2 === 1 || idx >= 23),
    },
  ];
}







