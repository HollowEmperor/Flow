import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LIFE_AREAS,
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
  getEligibleWheelTasks,
  calculateWheelSpinResult,
  didTaskTransitionToCompleted,
  parseBrainDumpInput,
  swipeBrainDumpRight,
  swipeBrainDumpLeft,
  restoreStoredBrainDumpToDeck,
  computeRadarScores,
  computeRadarGeometry,
  normalizeCategory,
  createTopicItem,
  computeTopicProgressPercent,
  updateTopicProgress,
  addTopicResource,
  toggleTopicResourceCompletion,
  GOAL_HORIZONS,
  createTopicGoalRoadmap,
  updateGoalHorizonAnswer,
  toggleGoalHorizonStepWithTopicSync,
  computeRoadmapCompletionStats,
  TodoItem,
} from './todoLogic';

test('LIFE_AREAS contains exact 7 focus areas', () => {
  assert.deepEqual(LIFE_AREAS, [
    'Portfolio',
    'Karma',
    'Knowledge',
    'Personality',
    'Social',
    'Strength',
    'Aesthetics',
  ]);
});

test('createTodoItem trims input and sets defaults', () => {
  const item = createTodoItem({
    id: 'test-1',
    title: '  Update portfolio case study  ',
    notes: '  Add metrics ',
    priority: 'high',
    category: 'Portfolio',
    dueDate: '2026-11-15',
    createdAt: 1000,
  });

  assert.equal(item.id, 'test-1');
  assert.equal(item.title, 'Update portfolio case study');
  assert.equal(item.notes, 'Add metrics');
  assert.equal(item.completed, false);
  assert.equal(item.priority, 'high');
  assert.equal(item.category, 'Portfolio');
  assert.equal(item.dueDate, '2026-11-15');
});

test('normalizeCategory maps legacy categories and preserves the 7 life areas', () => {
  assert.equal(normalizeCategory('Work'), 'Portfolio');
  assert.equal(normalizeCategory('Health'), 'Strength');
  assert.equal(normalizeCategory('Aesthetics'), 'Aesthetics');
  assert.equal(normalizeCategory('Karma'), 'Karma');
});

test('createTodoItem throws on empty whitespace title', () => {
  assert.throws(() => {
    createTodoItem({ title: '   ' });
  }, /Task title is required/);
});

test('toggleTodoCompletion and clearCompletedTodos update list state properly', () => {
  const initial: TodoItem[] = [
    createTodoItem({ id: '1', title: 'Task A', dueDate: '2026-11-13' }),
    createTodoItem({ id: '2', title: 'Task B', dueDate: '2026-11-13' }),
  ];

  const afterToggle = toggleTodoCompletion(initial, '1');
  assert.equal(afterToggle[0].completed, true);
  assert.equal(afterToggle[1].completed, false);

  const afterClear = clearCompletedTodos(afterToggle);
  assert.equal(afterClear.length, 1);
  assert.equal(afterClear[0].id, '2');
});

test('updateTodoItem and deleteTodoItem work as expected', () => {
  const initial: TodoItem[] = [
    createTodoItem({ id: '1', title: 'Initial Title', priority: 'low', dueDate: '2026-11-13' }),
  ];

  const updated = updateTodoItem(initial, '1', {
    title: 'Updated Title',
    priority: 'high',
  });
  assert.equal(updated[0].title, 'Updated Title');
  assert.equal(updated[0].priority, 'high');

  const ignored = updateTodoItem(updated, '1', { title: '   ' });
  assert.equal(ignored[0].title, 'Updated Title');

  const afterDelete = deleteTodoItem(updated, '1');
  assert.equal(afterDelete.length, 0);
});

test('subtask lifecycle: add, toggle, delete', () => {
  const initial: TodoItem[] = [
    createTodoItem({ id: '1', title: 'Main Task', dueDate: '2026-11-13' }),
  ];

  const withSub = addSubtask(initial, '1', '  First step  ', 'sub-1');
  assert.equal(withSub[0].subtasks.length, 1);
  assert.equal(withSub[0].subtasks[0].title, 'First step');
  assert.equal(withSub[0].subtasks[0].completed, false);

  const toggled = toggleSubtask(withSub, '1', 'sub-1');
  assert.equal(toggled[0].subtasks[0].completed, true);

  const deleted = deleteSubtask(toggled, '1', 'sub-1');
  assert.equal(deleted[0].subtasks.length, 0);
});

test('filterAndSortTodos filters by status, category, priority, search, and sorts', () => {
  const items: TodoItem[] = [
    createTodoItem({
      id: '1',
      title: 'Deploy API server',
      category: 'Portfolio',
      priority: 'high',
      dueDate: '2026-11-14',
      createdAt: 100,
    }),
    createTodoItem({
      id: '2',
      title: 'Morning run',
      category: 'Strength',
      priority: 'medium',
      dueDate: '2026-11-13',
      createdAt: 200,
    }),
    {
      ...createTodoItem({
        id: '3',
        title: 'Write unit tests',
        category: 'Portfolio',
        priority: 'low',
        dueDate: '2026-11-12',
        createdAt: 300,
      }),
      completed: true,
    },
  ];

  const activePortfolio = filterAndSortTodos(items, {
    status: 'active',
    category: 'Portfolio',
    priority: 'All',
    searchQuery: '',
    sortBy: 'priority',
  });
  assert.equal(activePortfolio.length, 1);
  assert.equal(activePortfolio[0].id, '1');

  const searchResult = filterAndSortTodos(items, {
    status: 'all',
    category: 'All',
    priority: 'All',
    searchQuery: 'run',
    sortBy: 'dueDate',
  });
  assert.equal(searchResult.length, 1);
  assert.equal(searchResult[0].id, '2');

  const sortedByDueDate = filterAndSortTodos(items, {
    status: 'all',
    category: 'All',
    priority: 'All',
    searchQuery: '',
    sortBy: 'dueDate',
  });
  assert.deepEqual(
    sortedByDueDate.map((i) => i.id),
    ['2', '1', '3']
  );
});

test('computeTodoStats returns accurate metrics', () => {
  const items: TodoItem[] = [
    createTodoItem({ id: '1', title: 'High task', priority: 'high', dueDate: '2026-11-13' }),
    createTodoItem({ id: '2', title: 'Low task', priority: 'low', dueDate: '2026-11-20' }),
    {
      ...createTodoItem({ id: '3', title: 'Done task', priority: 'high', dueDate: '2026-11-13' }),
      completed: true,
    },
  ];

  const stats = computeTodoStats(items, '2026-11-13');
  assert.equal(stats.total, 3);
  assert.equal(stats.active, 2);
  assert.equal(stats.completed, 1);
  assert.equal(stats.completionRate, 33);
  assert.equal(stats.highPriorityActive, 1);
  assert.equal(stats.dueTodayActive, 1);
});

test('getEligibleWheelTasks filters out completed tasks and respects category', () => {
  const items: TodoItem[] = [
    createTodoItem({ id: '1', title: 'Portfolio task 1', category: 'Portfolio' }),
    createTodoItem({ id: '2', title: 'Strength task 1', category: 'Strength' }),
    { ...createTodoItem({ id: '3', title: 'Done portfolio', category: 'Portfolio' }), completed: true },
  ];

  const allActive = getEligibleWheelTasks(items, 'All');
  assert.equal(allActive.length, 2);

  const portfolioActive = getEligibleWheelTasks(items, 'Portfolio');
  assert.equal(portfolioActive.length, 1);
  assert.equal(portfolioActive[0].id, '1');

  const socialFallback = getEligibleWheelTasks(items, 'Social');
  assert.equal(socialFallback.length, 2);
});

test('calculateWheelSpinResult selects deterministic slice and aligns center to 0 deg', () => {
  const tasks: TodoItem[] = [
    createTodoItem({ id: 'a', title: 'Task A' }),
    createTodoItem({ id: 'b', title: 'Task B' }),
    createTodoItem({ id: 'c', title: 'Task C' }),
    createTodoItem({ id: 'd', title: 'Task D' }),
  ];

  const outcome = calculateWheelSpinResult(tasks, 0.6, 0, 5);
  assert.equal(outcome.selectedIndex, 2);
  assert.equal(outcome.selectedTask.id, 'c');
  assert.equal((outcome.targetRotation + 225) % 360, 0);
  assert.ok(outcome.targetRotation >= 5 * 360);
});

test('didTaskTransitionToCompleted returns task only when transitioning from incomplete to completed', () => {
  const tasks: TodoItem[] = [
    createTodoItem({ id: 'incomplete-1', title: 'Write docs' }),
    { ...createTodoItem({ id: 'completed-1', title: 'Setup repo' }), completed: true },
  ];

  const completedTask = didTaskTransitionToCompleted(tasks, 'incomplete-1');
  assert.ok(completedTask);
  assert.equal(completedTask.id, 'incomplete-1');

  const uncheckedTask = didTaskTransitionToCompleted(tasks, 'completed-1');
  assert.equal(uncheckedTask, null);
});

test('parseBrainDumpInput splits multiline thoughts and strips bullet prefixes', () => {
  const raw = `
    - Call accountant about quarterly taxes
    * Pick up dry cleaning
    1. Refactor auth middleware
  `;
  const parsed = parseBrainDumpInput(raw, 'Portfolio', 'high', 5000);
  assert.equal(parsed.length, 3);
  assert.equal(parsed[0].title, 'Call accountant about quarterly taxes');
  assert.equal(parsed[1].title, 'Pick up dry cleaning');
  assert.equal(parsed[2].title, 'Refactor auth middleware');
  assert.equal(parsed[0].status, 'queue');
  assert.equal(parsed[0].category, 'Portfolio');
  assert.equal(parsed[0].priority, 'high');
});

test('swipeBrainDumpRight moves item to Today todo list and swipeBrainDumpLeft stores item', () => {
  const initialDump = parseBrainDumpInput('First idea\nSecond idea', 'Knowledge', 'medium', 1000);
  const firstId = initialDump[0].id;
  const secondId = initialDump[1].id;
  const initialTodos: TodoItem[] = [];

  const rightResult = swipeBrainDumpRight(initialDump, initialTodos, firstId, '2026-11-13');
  assert.equal(rightResult.dumpItems.length, 1);
  assert.equal(rightResult.todos.length, 1);
  assert.equal(rightResult.todos[0].title, 'First idea');
  assert.equal(rightResult.todos[0].dueDate, '2026-11-13');

  const afterLeft = swipeBrainDumpLeft(rightResult.dumpItems, secondId);
  assert.equal(afterLeft.length, 1);
  assert.equal(afterLeft[0].status, 'stored');

  const restored = restoreStoredBrainDumpToDeck(afterLeft, secondId);
  assert.equal(restored[0].status, 'queue');
});

test('computeRadarScores and computeRadarGeometry generate 7-axis heptagon radar data', () => {
  const items: TodoItem[] = [
    { ...createTodoItem({ id: '1', title: 'Done Portfolio', category: 'Portfolio' }), completed: true },
    createTodoItem({ id: '2', title: 'Active Karma', category: 'Karma' }),
  ];

  const scores = computeRadarScores(items);
  assert.equal(scores.length, 7);
  const portfolioMetric = scores.find((s) => s.area === 'Portfolio')!;
  assert.equal(portfolioMetric.completedCount, 1);
  assert.ok(portfolioMetric.score > 55);

  const geo = computeRadarGeometry(scores, 140, 140, 86, 114);
  assert.equal(geo.vertices.length, 7);
  assert.equal(geo.pointsString.split(' ').length, 7);
});

test('toggleTodoCompletion increments and decrements streakCount for repeating tasks', () => {
  const items: TodoItem[] = [
    createTodoItem({
      id: 'rep-1',
      title: 'Daily reading',
      isRepeating: true,
      streakCount: 5,
    }),
    createTodoItem({
      id: 'one-off',
      title: 'Buy notebook',
      isRepeating: false,
      streakCount: 0,
    }),
  ];

  const afterComplete = toggleTodoCompletion(items, 'rep-1', '2026-11-13');
  assert.equal(afterComplete[0].completed, true);
  assert.equal(afterComplete[0].streakCount, 6);
  assert.equal(afterComplete[0].lastCompletedDate, '2026-11-13');

  const afterUncheck = toggleTodoCompletion(afterComplete, 'rep-1', '2026-11-13');
  assert.equal(afterUncheck[0].completed, false);
  assert.equal(afterUncheck[0].streakCount, 5);
});

test('Topic Dashboard helpers calculate progress and manage resources', () => {
  const topic = createTopicItem({
    id: 't1',
    title: 'System Design',
    lifeArea: 'Portfolio',
    goalLabel: 'Finish 10 modules',
    currentUnits: 4,
    targetUnits: 10,
    unitName: 'modules',
  });

  assert.equal(computeTopicProgressPercent(topic), 40);

  const updatedList = updateTopicProgress([topic], 't1', 3);
  assert.equal(updatedList[0].currentUnits, 7);
  assert.equal(computeTopicProgressPercent(updatedList[0]), 70);

  const withRes = addTopicResource(updatedList, 't1', {
    id: 'r1',
    title: 'System Design YouTube Channel',
    type: 'YouTube',
    url: 'youtube.com/@ByteByteGo',
  });
  assert.equal(withRes[0].resources.length, 1);
  assert.equal(withRes[0].resources[0].url, 'https://youtube.com/@ByteByteGo');

  const toggledRes = toggleTopicResourceCompletion(withRes, 't1', 'r1');
  assert.equal(toggledRes[0].resources[0].completed, true);
});

test('Multi-horizon Goal Roadmap updates prompt answers and syncs directly with Topic progress bar', () => {
  assert.deepEqual(GOAL_HORIZONS, [
    '5_year',
    '3_year',
    '1_year',
    '4_month',
    '1_month',
    '1_week',
  ]);

  const topic = createTopicItem({
    id: 'topic-a',
    title: 'Distributed Systems',
    lifeArea: 'Portfolio',
    goalLabel: 'Complete 10 modules',
    currentUnits: 4,
    targetUnits: 10,
  });

  const roadmap = createTopicGoalRoadmap({
    topicId: 'topic-a',
    lifeArea: 'Portfolio',
    answers: {
      '5_year': 'Become Principal Architect',
    },
  });

  const updatedRoadmaps = updateGoalHorizonAnswer(
    [roadmap],
    'topic-a',
    '1_week',
    'Ship Raft prototype'
  );
  assert.equal(updatedRoadmaps[0].steps['1_week'].answer, 'Ship Raft prototype');

  // Completing 1_year horizon (unitWeight = 2) increments linked topic currentUnits from 4 -> 6 (60%)
  const synced = toggleGoalHorizonStepWithTopicSync(
    updatedRoadmaps,
    [topic],
    'topic-a',
    '1_year'
  );
  assert.equal(synced.roadmaps[0].steps['1_year'].completed, true);
  assert.equal(synced.topics[0].currentUnits, 6);
  assert.equal(computeTopicProgressPercent(synced.topics[0]), 60);

  const stats = computeRoadmapCompletionStats(synced.roadmaps[0]);
  assert.equal(stats.completedHorizons, 1);
  assert.equal(stats.answeredHorizons, 2);
});

test('getLayoutSpec returns left navigation for tablet/desktop and bottom navigation with 9:16 aspect ratio for Android mobile', async () => {
  const { getLayoutSpec } = await import('./todoLogic.ts');
  const tabletSpec = getLayoutSpec('tablet');
  assert.equal(tabletSpec.navPosition, 'left');
  assert.equal(tabletSpec.version, 'tablet');

  const mobileSpec = getLayoutSpec('mobile');
  assert.equal(mobileSpec.navPosition, 'bottom');
  assert.equal(mobileSpec.aspectRatio, '9:16');
  assert.equal(mobileSpec.version, 'mobile');
});

test('Eisenhower Matrix resolves quadrants, reassigns tasks, and groups by 4 quadrants', async () => {
  const {
    resolveTaskQuadrant,
    assignTaskQuadrant,
    groupTodosByEisenhower,
    computeEisenhowerSummary,
  } = await import('./todoLogic.ts');

  const today = '2026-11-13';
  const t1 = createTodoItem({
    id: 'q1-task',
    title: 'Fix production outage',
    priority: 'high',
    dueDate: today,
  });
  const t2 = createTodoItem({
    id: 'q2-task',
    title: 'Design Q1 architecture roadmap',
    priority: 'high',
    dueDate: '2026-11-25',
  });
  const t3 = createTodoItem({
    id: 'q3-task',
    title: 'Reply to vendor scheduling emails',
    priority: 'medium',
    dueDate: today,
  });
  const t4 = createTodoItem({
    id: 'q4-task',
    title: 'Reorganize archived icon folder',
    priority: 'low',
    dueDate: '2026-11-28',
  });

  assert.equal(resolveTaskQuadrant(t1, today), 'do_first');
  assert.equal(resolveTaskQuadrant(t2, today), 'schedule');
  assert.equal(resolveTaskQuadrant(t3, today), 'delegate');
  assert.equal(resolveTaskQuadrant(t4, today), 'eliminate');

  const list = [t1, t2, t3, t4];
  const grouped = groupTodosByEisenhower(list, { todayIso: today });
  assert.equal(grouped.do_first.length, 1);
  assert.equal(grouped.schedule.length, 1);
  assert.equal(grouped.delegate.length, 1);
  assert.equal(grouped.eliminate.length, 1);

  const movedList = assignTaskQuadrant(list, 'q4-task', 'do_first');
  const movedTask = movedList.find((t) => t.id === 'q4-task')!;
  assert.equal(movedTask.quadrant, 'do_first');
  assert.equal(movedTask.priority, 'high');

  const summary = computeEisenhowerSummary(movedList, today);
  assert.equal(summary.do_first.total, 2);
  assert.equal(summary.eliminate.total, 0);
});

test('Hourly Calendar, Relationship/Organization Dashboard, DoteTimer, and Kanban/Timeline views work as expected', async () => {
  const {
    formatHourSlotLabel,
    assignTodoScheduledHour,
    getHourlyScheduleForDate,
    createRelationshipContact,
    logRelationshipCheckIn,
    createOrganizationItem,
    formatTimerDisplay,
    createFocusSessionLog,
    computeFocusTimerStats,
    resolveKanbanStage,
    moveTodoToKanbanStage,
    groupTodosByKanban,
    groupTodosForTimeline,
  } = await import('./todoLogic.ts');

  const today = '2026-11-13';
  assert.equal(formatHourSlotLabel(9), '09:00 AM');
  assert.equal(formatHourSlotLabel(14), '02:00 PM');

  const taskA = createTodoItem({
    id: 'h1',
    title: 'Morning Deep Work',
    dueDate: today,
    scheduledHour: 9,
  });
  const taskB = createTodoItem({
    id: 'h2',
    title: 'Afternoon Sync',
    dueDate: today,
  });

  const withAssignedHour = assignTodoScheduledHour([taskA, taskB], 'h2', 14, today);
  const hourlySlots = getHourlyScheduleForDate(withAssignedHour, today, 8, 15);
  const slot9 = hourlySlots.find((s) => s.hour === 9)!;
  const slot14 = hourlySlots.find((s) => s.hour === 14)!;
  assert.equal(slot9.tasks.length, 1);
  assert.equal(slot14.tasks.length, 1);

  // Relationship & Organization
  const contact = createRelationshipContact({
    id: 'c1',
    name: 'Elena Rostova',
    role: 'Mentor',
    lifeArea: 'Portfolio',
    streakCount: 3,
    lastContactedDate: '2026-11-01',
  });
  const afterCheckIn = logRelationshipCheckIn([contact], 'c1', today);
  assert.equal(afterCheckIn[0].streakCount, 4);
  assert.equal(afterCheckIn[0].lastContactedDate, today);

  const org = createOrganizationItem({
    id: 'o1',
    name: 'CloudScale Guild',
    role: 'Core Member',
    lifeArea: 'Portfolio',
  });
  assert.equal(org.name, 'CloudScale Guild');

  // DoteTimer
  assert.equal(formatTimerDisplay(1500), '25:00');
  const log = createFocusSessionLog({
    taskTitle: 'System Design',
    category: 'Portfolio',
    durationMinutes: 25,
    mode: 'pomodoro_25',
  });
  const focusStats = computeFocusTimerStats([log]);
  assert.equal(focusStats.totalMinutes, 25);
  assert.equal(focusStats.byArea.Portfolio, 25);

  // Kanban & Timeline
  assert.equal(resolveKanbanStage(taskA), 'todo');
  const movedKanban = moveTodoToKanbanStage(withAssignedHour, 'h1', 'in_progress', today);
  const kanbanCols = groupTodosByKanban(movedKanban);
  assert.equal(kanbanCols.in_progress.length, 1);
  assert.equal(kanbanCols.todo.length, 1);

  const timelineGroups = groupTodosForTimeline(movedKanban, today);
  assert.equal(timelineGroups.length, 1);
  assert.equal(timelineGroups[0].items[0].id, 'h1');
});

test('Radar Social navigation, Journal Dashboard, and Habit Heatmap work as expected', async () => {
  const {
    resolveRadarAreaNavigation,
    createJournalEntry,
    deleteJournalEntry,
    createHabitItem,
    toggleHabitDateCompletion,
    computeHabitHeatmapGrid,
    computeHabitCurrentStreak,
    HABIT_CATEGORY_OPTIONS,
  } = await import('./todoLogic.ts');

  assert.equal(HABIT_CATEGORY_OPTIONS.length, 3);
  assert.equal(HABIT_CATEGORY_OPTIONS[0].key, 'build_helpful');
  assert.equal(HABIT_CATEGORY_OPTIONS[1].key, 'break_unhelpful');
  assert.equal(HABIT_CATEGORY_OPTIONS[2].key, 'replace_old');

  const socialNav = resolveRadarAreaNavigation('Social');
  assert.equal(socialNav.targetView, 'network');
  assert.equal(socialNav.categoryFilter, 'Social');

  const portfolioNav = resolveRadarAreaNavigation('Portfolio');
  assert.equal(portfolioNav.targetView, 'tasks');
  assert.equal(portfolioNav.categoryFilter, 'Portfolio');

  // Journal Dashboard
  const entry = createJournalEntry({
    id: 'j1',
    title: 'Evening Synthesis',
    content: 'Reflected on distributed systems trade-offs.',
    gratitude: 'Supportive team',
    lifeArea: 'Knowledge',
    mood: 'Focused',
    dateIso: '2026-11-13',
  });
  assert.equal(entry.title, 'Evening Synthesis');
  assert.equal(deleteJournalEntry([entry], 'j1').length, 0);

  // Habit Dashboard & Heatmap
  const habit = createHabitItem({
    id: 'hb1',
    title: 'Read 15 pages',
    lifeArea: 'Strength',
    habitType: 'replace_old',
    oldHabitToReplace: 'Morning doomscrolling',
    completedDates: ['2026-11-11', '2026-11-12'],
  });
  assert.equal(habit.habitType, 'replace_old');
  assert.equal(habit.oldHabitToReplace, 'Morning doomscrolling');
  const toggledHabits = toggleHabitDateCompletion([habit], 'hb1', '2026-11-13');
  assert.equal(toggledHabits[0].completedDates.includes('2026-11-13'), true);
  assert.equal(computeHabitCurrentStreak(toggledHabits[0], '2026-11-13'), 3);

  const heatmap = computeHabitHeatmapGrid(toggledHabits, 7, '2026-11-13');
  assert.equal(heatmap.length, 7);
  const todayCell = heatmap[heatmap.length - 1];
  assert.equal(todayCell.completedCount, 1);
  assert.equal(todayCell.intensityLevel, 4);
});





