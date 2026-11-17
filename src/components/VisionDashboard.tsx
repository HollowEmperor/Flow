import React, { useState } from 'react';
import {
  Compass,
  Target,
  BookOpen,
  Flame,
  FolderKanban,
  CheckSquare,
  FileText,
  Award,
  Plus,
  CheckCircle2,
  Clock,
  ArrowRight,
  Layers,
} from 'lucide-react';
import {
  Category,
  LIFE_AREAS,
  Priority,
  TodoItem,
  TopicItem,
  TopicGoalRoadmap,
  HabitItem,
  BrainDumpItem,
  computeRoadmapCompletionStats,
  computeTopicProgressPercent,
} from '../utils/todoLogic';
import { INITIAL_THIRTY_YEAR_VISIONS } from '../utils/promptQuestionsData';

export interface CustomVisionRecord {
  id: string;
  title: string;
  mantra: string;
  lifeArea: Category;
  linkedTopicIds: string[];
}

export interface WorkspaceProjectRecord {
  id: string;
  title: string;
  description: string;
  lifeArea: Category;
  linkedHabitIds: string[]; // Routines (saved sets of tasks)
  linkedTaskIds: string[]; // Tasks (notes with tickbox & time schedule)
}

const VISIONS_STORAGE_KEY = 'focusflow_custom_visions_v1';
const PROJECTS_STORAGE_KEY = 'focusflow_projects_v1';

interface VisionDashboardProps {
  topics: TopicItem[];
  roadmaps: TopicGoalRoadmap[];
  habits: HabitItem[];
  todos: TodoItem[];
  brainDumpItems: BrainDumpItem[];
  onNavigateTab: (
    tab:
      | 'goals'
      | 'topics'
      | 'habits'
      | 'tasks'
      | 'braindump'
      | 'maps'
  ) => void;
  onDeployRoutineTaskToTodo: (params: {
    title: string;
    notes: string;
    priority: Priority;
    category: Category;
    dueDate: string;
    isRepeating: boolean;
    scheduledHour?: number;
  }) => void;
  onToggleTodo: (todoId: string) => void;
}

export const VisionDashboard: React.FC<VisionDashboardProps> = ({
  topics,
  roadmaps,
  habits,
  todos,
  brainDumpItems,
  onNavigateTab,
  onDeployRoutineTaskToTodo,
  onToggleTodo,
}) => {
  const [customVisions, setCustomVisions] = useState<CustomVisionRecord[]>(
    () => {
      try {
        const raw = localStorage.getItem(VISIONS_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      } catch {
        // Ignore
      }
      return [];
    }
  );

  const [projects, setProjects] = useState<WorkspaceProjectRecord[]>(() => {
    try {
      const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Ignore
    }
    return [
      {
        id: 'proj-seed-1',
        title: 'Production Systems Architecture & Portfolio Launch',
        description:
          'Completed by combining daily Deep Work Habit Routines with scheduled Tickbox Task Notes.',
        lifeArea: 'Portfolio',
        linkedHabitIds: habits.slice(0, 2).map((h) => h.id),
        linkedTaskIds: todos.slice(0, 3).map((t) => t.id),
      },
      {
        id: 'proj-seed-2',
        title: '10K Endurance & Peak Physical Conditioning Project',
        description:
          'Completed by Zone-2 Running Routines and scheduled strength training task notes.',
        lifeArea: 'Strength',
        linkedHabitIds: habits.slice(1, 3).map((h) => h.id),
        linkedTaskIds: todos.slice(1, 4).map((t) => t.id),
      },
    ];
  });

  const [newVisionTitle, setNewVisionTitle] = useState('');
  const [newVisionMantra, setNewVisionMantra] = useState('');
  const [newVisionArea, setNewVisionArea] = useState<Category>('Knowledge');

  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectArea, setNewProjectArea] = useState<Category>('Portfolio');
  const [selectedHabitIdForProject, setSelectedHabitIdForProject] = useState(
    habits[0]?.id ?? ''
  );

  const saveCustomVisions = (next: CustomVisionRecord[]) => {
    setCustomVisions(next);
    try {
      localStorage.setItem(VISIONS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore
    }
  };

  const saveProjects = (next: WorkspaceProjectRecord[]) => {
    setProjects(next);
    try {
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore
    }
  };

  const handleAddVision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVisionTitle.trim()) return;
    const matchedTopics = topics
      .filter((t) => t.lifeArea === newVisionArea)
      .map((t) => t.id);
    const created: CustomVisionRecord = {
      id: `vision-${Date.now()}`,
      title: newVisionTitle.trim(),
      mantra:
        newVisionMantra.trim() ||
        `Completed by achieving ${newVisionArea} goals & habit streaks.`,
      lifeArea: newVisionArea,
      linkedTopicIds: matchedTopics,
    };
    saveCustomVisions([created, ...customVisions]);
    setNewVisionTitle('');
    setNewVisionMantra('');
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectTitle.trim()) return;
    const areaTasks = todos
      .filter((t) => t.category === newProjectArea)
      .slice(0, 3)
      .map((t) => t.id);
    const created: WorkspaceProjectRecord = {
      id: `proj-${Date.now()}`,
      title: newProjectTitle.trim(),
      description: `Project in ${newProjectArea} — completed by Routines and Scheduled Tickbox Task Notes.`,
      lifeArea: newProjectArea,
      linkedHabitIds: selectedHabitIdForProject
        ? [selectedHabitIdForProject]
        : [],
      linkedTaskIds: areaTasks,
    };
    saveProjects([created, ...projects]);
    setNewProjectTitle('');
  };

  // Compute completion for each 30-Year Vision Pillar based on its linked Goals (Roadmaps + Habits)
  const visionCards = [
    ...INITIAL_THIRTY_YEAR_VISIONS.map((pillar) => {
      const areaTopics = topics.filter((t) => t.lifeArea === pillar.lifeArea);
      const areaRoadmaps = roadmaps.filter((r) =>
        areaTopics.some((t) => t.id === r.topicId)
      );
      const areaHabits = habits.filter((h) => h.lifeArea === pillar.lifeArea);

      const goalPercents = areaRoadmaps.map(
        (r) => computeRoadmapCompletionStats(r).percentCompleted
      );
      const topicPercents = areaTopics.map((t) =>
        computeTopicProgressPercent(t)
      );
      const habitPercents = areaHabits.map((h) => {
        const target = h.streakTargetDays ?? 21;
        return Math.min(
          100,
          Math.round((h.completedDates.length / Math.max(1, target)) * 100)
        );
      });

      const allScores = [...goalPercents, ...topicPercents, ...habitPercents];
      const completionPct =
        allScores.length > 0
          ? Math.round(
              allScores.reduce((sum, v) => sum + v, 0) / allScores.length
            )
          : 25;

      return {
        id: pillar.id,
        title: pillar.archetypeTitle,
        subtitle: `${pillar.milestone1Text} · ${pillar.milestone2Text}`,
        areas: [pillar.lifeArea] as Category[],
        linkedTopics: areaTopics,
        linkedHabits: areaHabits,
        completionPct,
      };
    }),
    ...customVisions.map((cv) => {
      const areaTopics = topics.filter((t) => t.lifeArea === cv.lifeArea);
      const areaHabits = habits.filter((h) => h.lifeArea === cv.lifeArea);
      const completionPct =
        areaTopics.length > 0
          ? Math.round(
              areaTopics.reduce(
                (acc, t) => acc + computeTopicProgressPercent(t),
                0
              ) / areaTopics.length
            )
          : 20;
      return {
        id: cv.id,
        title: cv.title,
        subtitle: cv.mantra,
        areas: [cv.lifeArea],
        linkedTopics: areaTopics,
        linkedHabits: areaHabits,
        completionPct,
      };
    }),
  ];

  return (
    <div data-testid="vision-dashboard" className="space-y-5 text-slate-900">
      {/* 1. Architecture & Horizon Navigation Strip */}
      <section
        aria-label="Workspace Completion Hierarchy and Ontology"
        data-testid="ontology-hierarchy-banner"
        className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 font-display">
              Long-Term Vision &amp; Architecture
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Connect 30-year life visions to 5-year roadmaps, topic mastery credentials, and daily habit routines.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('maps')}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Open Google Maps Studio</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        {/* 4-Stage Horizon Navigation Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => onNavigateTab('goals')}
            className="text-left p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-700">
                01 · Vision → Goals
              </span>
              <Target className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <p className="text-xs font-bold text-slate-900">
              5Y → 1W Horizon Roadmaps
            </p>
            <p className="text-[11px] text-slate-500">
              Break 30-year visions into measurable milestones and weekly habits.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('topics')}
            className="text-left p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-700">
                02 · Topics → Mastery
              </span>
              <Award className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <p className="text-xs font-bold text-slate-900">
              Curriculum &amp; Credentials
            </p>
            <p className="text-[11px] text-slate-500">
              Track books, courses, certificates, medals, and leadership positions.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('habits')}
            className="text-left p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700">
                03 · Habits → Routines
              </span>
              <Flame className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <p className="text-xs font-bold text-slate-900">
              Daily Rituals &amp; Streaks
            </p>
            <p className="text-[11px] text-slate-500">
              Execute repeatable task sequences anchored to time and duration.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('tasks')}
            className="text-left p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700">
                04 · Today &amp; Brain Dump
              </span>
              <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <p className="text-xs font-bold text-slate-900">
              Daily Execution Feed
            </p>
            <p className="text-[11px] text-slate-500">
              Schedule actions by Morning, Afternoon, and Evening ({brainDumpItems.length} notes).
            </p>
          </button>
        </div>
      </section>

      {/* 2. Visions Completed by Goals Section */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-display">
              30-Year Life Visions &amp; Goal Completion Matrix
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Each long-term vision tracks its linked topics, roadmaps, and supporting habits.
            </p>
          </div>

          <form
            onSubmit={handleAddVision}
            className="flex flex-wrap items-center gap-2"
          >
            <input
              type="text"
              value={newVisionTitle}
              onChange={(e) => setNewVisionTitle(e.target.value)}
              placeholder="New Vision (e.g., The Polymath Builder)..."
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-purple-700"
            />
            <select
              value={newVisionArea}
              onChange={(e) => setNewVisionArea(e.target.value as Category)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
            >
              {LIFE_AREAS.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Add Vision</span>
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visionCards.map((vision) => (
            <div
              key={vision.id}
              data-testid={`vision-card-${vision.id}`}
              className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-1 mb-1">
                      {vision.areas.map((a) => (
                        <span
                          key={a}
                          className="px-2 py-0.5 rounded bg-purple-100 text-purple-900 text-[10px] font-bold"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {vision.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {vision.subtitle}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-purple-700 text-white text-xs font-mono font-bold shrink-0">
                    {vision.completionPct}%
                  </span>
                </div>

                {/* Solid Progress Bar */}
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-700"
                    style={{ width: `${vision.completionPct}%` }}
                  />
                </div>

                {/* Linked Goals & Topics */}
                <div className="pt-1 space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Completed by Goals &amp; Learning Topics (
                    {vision.linkedTopics.length})
                  </div>
                  {vision.linkedTopics.slice(0, 2).map((tp) => (
                    <div
                      key={tp.id}
                      className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div className="truncate pr-2">
                        <span className="font-bold text-slate-800">
                          Goal: {tp.goalLabel}
                        </span>
                        <span className="text-[11px] text-slate-500 block truncate">
                          Topic Area: {tp.title}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] font-bold text-blue-700 shrink-0">
                        {computeTopicProgressPercent(tp)}%
                      </span>
                    </div>
                  ))}
                </div>

                {/* Linked Habit Metrics */}
                {vision.linkedHabits.length > 0 && (
                  <div className="pt-1 space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                      Tracked Habit Metrics ({vision.linkedHabits.length})
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {vision.linkedHabits.slice(0, 3).map((hb) => (
                        <span
                          key={hb.id}
                          className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] font-semibold"
                        >
                          {hb.title} ({hb.whenTime || '07:00'} ·{' '}
                          {hb.durationMinutes || 30}m)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onNavigateTab('goals')}
                  className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer"
                >
                  <Target className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Open Linked Goals</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab('topics')}
                  className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Open Learning Topics</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Projects Completed by Routines & Tasks Section */}
      <section
        data-testid="projects-routines-tasks-section"
        className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
              The Completion of Projects by Routines and Tasks
            </span>
            <h2 className="text-base font-bold text-slate-900 font-display">
              Active Projects (Driven by Saved Habit Routines + Scheduled Tickbox Task Notes)
            </h2>
          </div>

          <form
            onSubmit={handleAddProject}
            className="flex flex-wrap items-center gap-2"
          >
            <input
              type="text"
              value={newProjectTitle}
              onChange={(e) => setNewProjectTitle(e.target.value)}
              placeholder="New Project title..."
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
            />
            <select
              value={newProjectArea}
              onChange={(e) => setNewProjectArea(e.target.value as Category)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
            >
              {LIFE_AREAS.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
            <select
              value={selectedHabitIdForProject}
              onChange={(e) => setSelectedHabitIdForProject(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
            >
              {habits.map((h) => (
                <option key={h.id} value={h.id}>
                  Routine: {h.title}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Add Project</span>
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((proj) => {
            const projHabits = habits.filter((h) =>
              proj.linkedHabitIds.includes(h.id)
            );
            const projTasks = todos.filter(
              (t) =>
                proj.linkedTaskIds.includes(t.id) ||
                t.category === proj.lifeArea
            );
            const completedTasks = projTasks.filter((t) => t.completed).length;
            const taskRatio =
              projTasks.length > 0
                ? Math.round((completedTasks / projTasks.length) * 100)
                : 50;

            return (
              <div
                key={proj.id}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold uppercase">
                      Project · {proj.lifeArea}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">
                      {proj.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {proj.description}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-mono font-bold shrink-0">
                    {taskRatio}%
                  </span>
                </div>

                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600"
                    style={{ width: `${taskRatio}%` }}
                  />
                </div>

                {/* Linked Routines (Habits = Saved Sets of Tasks) */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1">
                    <FolderKanban className="w-3 h-3" aria-hidden="true" />
                    <span>
                      1. Linked Habit Routines (Saved Sets of Tasks)
                    </span>
                  </div>
                  {projHabits.map((hb) => (
                    <div
                      key={hb.id}
                      className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900">
                          {hb.title}
                        </span>
                        <span className="text-[11px] font-mono text-blue-700 font-semibold">
                          When: {hb.whenTime || '07:00'} ·{' '}
                          {hb.durationMinutes || 45} min
                        </span>
                      </div>
                      {hb.routineTasks && hb.routineTasks.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {hb.routineTasks.map((rt) => (
                            <button
                              key={rt.id}
                              type="button"
                              onClick={() =>
                                onDeployRoutineTaskToTodo({
                                  title: rt.title,
                                  notes: `${rt.notes} (From Routine: ${hb.title})`,
                                  priority: 'medium',
                                  category: hb.lifeArea,
                                  dueDate: new Date()
                                    .toISOString()
                                    .slice(0, 10),
                                  isRepeating: true,
                                  scheduledHour: rt.scheduledHour,
                                })
                              }
                              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-[10px] font-medium border border-slate-200 cursor-pointer"
                              title="Click to deploy this saved routine step as a scheduled task note"
                            >
                              + [✓] {rt.title} ({rt.scheduledHour}:00 ·{' '}
                              {rt.durationMinutes}m)
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Linked Tasks (Notes with Tickbox & Time Schedule) */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                    <FileText className="w-3 h-3" aria-hidden="true" />
                    <span>
                      2. Scheduled Tickbox Task Notes ({completedTasks}/
                      {projTasks.length} Done)
                    </span>
                  </div>
                  <div className="space-y-1">
                    {projTasks.slice(0, 3).map((task) => (
                      <div
                        key={task.id}
                        onClick={() => onToggleTodo(task.id)}
                        className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between gap-2 text-xs cursor-pointer hover:border-emerald-400"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <CheckCircle2
                            className={`w-3.5 h-3.5 shrink-0 ${
                              task.completed
                                ? 'text-emerald-600'
                                : 'text-slate-300'
                            }`}
                          />
                          <span
                            className={`truncate font-medium ${
                              task.completed
                                ? 'line-through text-slate-400'
                                : 'text-slate-800'
                            }`}
                          >
                            {task.title}
                          </span>
                        </div>
                        {task.scheduledHour !== undefined && (
                          <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded shrink-0 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {String(task.scheduledHour).padStart(2, '0')}:00
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
