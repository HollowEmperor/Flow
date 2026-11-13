import React, { useState } from 'react';
import {
  ListTodo,
  Target,
  BookOpen,
  Calendar as CalendarIcon,
  Layers,
  Sparkles,
  Wifi,
  BatteryCharging,
  Signal,
  CheckCircle2,
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
} from '../utils/todoLogic';
import { QuickAddTask } from './QuickAddTask';
import { TaskRow } from './TaskRow';
import { TaskWheelPicker } from './TaskWheelPicker';
import { BrainDumpSwiper } from './BrainDumpSwiper';
import { LifeRadarChart } from './LifeRadarChart';
import { TopicDashboard } from './TopicDashboard';
import { GoalPlanner } from './GoalPlanner';
import { CalendarWorkspace } from './CalendarWorkspace';

interface AndroidMobileAppProps {
  activeView: WorkspaceTab;
  onSelectView: (view: WorkspaceTab) => void;
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
      >
    >
  ) => void;
  onAddSubtask: (todoId: string, title: string) => void;
  onToggleSubtask: (todoId: string, subtaskId: string) => void;
  onDeleteSubtask: (todoId: string, subtaskId: string) => void;
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
    resource: { title: string; type: TopicResourceType; url: string }
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
    category: Category,
    priority: Priority
  ) => void;
  onSwipeRight: (itemId: string) => void;
  onSwipeLeft: (itemId: string) => void;
  onRestoreToDeck: (itemId: string) => void;
  onDeleteDumpItem: (itemId: string) => void;
}

const CATEGORIES_WITH_ALL: Array<Category | 'All'> = ['All', ...LIFE_AREAS];

export const AndroidMobileApp: React.FC<AndroidMobileAppProps> = ({
  activeView,
  onSelectView,
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
  brainDumpQueueCount,
  onAddDumpItems,
  onSwipeRight,
  onSwipeLeft,
  onRestoreToDeck,
  onDeleteDumpItem,
}) => {
  const [mobileTaskSubTab, setMobileTaskSubTab] = useState<'list' | 'insights'>(
    'list'
  );

  const navItems: Array<{
    id: WorkspaceTab;
    label: string;
    badge?: number;
    icon: React.ReactNode;
  }> = [
    {
      id: 'tasks',
      label: 'Tasks',
      badge: stats.active,
      icon: <ListTodo className="w-4 h-4" aria-hidden="true" />,
    },
    {
      id: 'goals',
      label: 'Goals',
      icon: <Target className="w-4 h-4" aria-hidden="true" />,
    },
    {
      id: 'topics',
      label: 'Topics',
      badge: topics.length,
      icon: <BookOpen className="w-4 h-4" aria-hidden="true" />,
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: <CalendarIcon className="w-4 h-4" aria-hidden="true" />,
    },
    {
      id: 'braindump',
      label: 'Dump',
      badge: brainDumpQueueCount,
      icon: <Layers className="w-4 h-4" aria-hidden="true" />,
    },
  ];

  return (
    <div
      data-testid="android-mobile-9-16-app"
      className="mx-auto h-[min(750px,calc(100vh-116px))] min-h-[580px] aspect-[9/16] w-auto max-w-full bg-slate-50 border-[5px] border-slate-900 rounded-[36px] shadow-xl flex flex-col overflow-hidden relative shrink-0"
    >
      {/* Android Status Bar */}
      <div className="bg-slate-900 text-white px-5 pt-2 pb-1.5 flex items-center justify-between text-[11px] font-mono select-none shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold">09:41</span>
          <span className="text-emerald-400 text-[10px]">Android 9:16</span>
        </div>
        <div className="w-16 h-3.5 bg-black rounded-full mx-auto" aria-hidden="true" />
        <div className="flex items-center gap-1.5 text-slate-300">
          <Signal className="w-3 h-3" aria-hidden="true" />
          <Wifi className="w-3 h-3" aria-hidden="true" />
          <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
        </div>
      </div>

      {/* Mobile Top App Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between gap-2 shrink-0">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold tracking-tight text-slate-900 font-display">
              FocusFlow
            </span>
            <span className="text-[11px] font-mono text-emerald-700 font-semibold">
              · {stats.completionRate}%
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            {activeView === 'tasks' && 'Daily Habits, Streaks & Focus Wheel'}
            {activeView === 'goals' && '5-Year to 1-Week Goal Funnel'}
            {activeView === 'topics' && 'Topics, Progress & Learning Links'}
            {activeView === 'calendar' && 'Monthly Schedule & Google Calendar'}
            {activeView === 'braindump' && 'Swipe Right Keep · Left Store'}
          </p>
        </div>

        {activeView === 'tasks' && (
          <div
            role="group"
            aria-label="Mobile task sub-view"
            className="bg-slate-100 p-0.5 rounded-lg flex items-center text-[11px] font-semibold shrink-0"
          >
            <button
              type="button"
              onClick={() => setMobileTaskSubTab('list')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                mobileTaskSubTab === 'list'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              List ({stats.active})
            </button>
            <button
              type="button"
              onClick={() => setMobileTaskSubTab('insights')}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
                mobileTaskSubTab === 'insights'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3 h-3 text-emerald-600" aria-hidden="true" />
              <span>Wheel & Radar</span>
            </button>
          </div>
        )}
      </div>

      {/* Scrollable 9:16 Mobile Content Viewport */}
      <div className="flex-1 overflow-y-auto px-3.5 py-3.5 space-y-3.5">
        {activeView === 'tasks' && mobileTaskSubTab === 'insights' ? (
          <div className="space-y-4">
            <TaskWheelPicker
              todos={todos}
              activeCategory={categoryFilter}
              selectedFocusTaskId={selectedFocusTaskId}
              onSelectFocusTask={onSelectFocusTask}
              onCompleteTask={onToggleTodo}
            />
            <LifeRadarChart
              todos={todos}
              activeCategory={categoryFilter}
              baseOverrides={radarBaseOverrides}
              onSelectCategory={(cat) => {
                onSelectCategoryFilter(cat);
                setMobileTaskSubTab('list');
              }}
              onAdjustBaseScore={onAdjustBaseScore}
            />
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

            {/* Quick Add Task */}
            <QuickAddTask
              defaultCategory={
                categoryFilter === 'All' ? 'Portfolio' : categoryFilter
              }
              onAdd={onAddTodo}
            />

            {/* Compact Progress Strip */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between text-[11px] font-medium text-slate-700 mb-1">
                  <span>Daily Momentum</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {stats.completed}/{stats.total} done ({stats.completionRate}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 transition-transform duration-200 origin-left"
                    style={{
                      transform: `scaleX(${stats.completionRate / 100})`,
                    }}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileTaskSubTab('insights')}
                className="px-2.5 py-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg shrink-0 cursor-pointer"
              >
                Spin Wheel
              </button>
            </div>

            {/* Mobile Tasks List */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              {visibleTodos.length > 0 ? (
                <div role="list" aria-label="Android mobile task list">
                  {visibleTodos.map((todo) => (
                    <TaskRow
                      key={todo.id}
                      todo={todo}
                      isFocused={selectedFocusTaskId === todo.id}
                      onToggle={onToggleTodo}
                      onDelete={onDeleteTodo}
                      onUpdate={onUpdateTodo}
                      onAddSubtask={onAddSubtask}
                      onToggleSubtask={onToggleSubtask}
                      onDeleteSubtask={onDeleteSubtask}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-10 px-4 text-center">
                  <CheckCircle2
                    className="w-6 h-6 text-slate-400 mx-auto mb-2"
                    aria-hidden="true"
                  />
                  <p className="text-xs font-semibold text-slate-800">
                    No tasks in this filter
                  </p>
                </div>
              )}
            </div>
          </div>
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

      {/* Bottom Navigation Bar for Android 9:16 Version */}
      <nav
        aria-label="Android bottom navigation bar"
        data-testid="android-bottom-nav"
        className="bg-white border-t border-slate-200 px-2 pt-1.5 pb-1 grid grid-cols-5 gap-1 shrink-0"
      >
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectView(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`py-1.5 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer relative ${
                isActive
                  ? 'text-slate-900 font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <div
                className={`px-3 py-1 rounded-full flex items-center justify-center transition-colors ${
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
