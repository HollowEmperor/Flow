import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  Flame,
  Trash2,
  ArrowRight,
  ArrowLeft,
  GripVertical,
  Pin,
  Users,
  CalendarClock,
  ListTodo,
} from 'lucide-react';
import {
  TodoItem,
  KanbanStage,
  HOURLY_DRAG_MIME_TYPE,
  groupTodosByKanban,
  groupTodosForTimeline,
  formatHourSlotLabel,
} from '../utils/todoLogic';

interface TaskViewsContainerProps {
  mode: 'kanban' | 'timeline';
  todos: TodoItem[];
  onToggleTodo: (id: string) => void;
  onDeleteTodo: (id: string) => void;
  onMoveKanbanStage: (todoId: string, stage: KanbanStage) => void;
  onDragStartTask?: (todoId: string) => void;
  onDragEndTask?: () => void;
}

const KANBAN_COLUMNS: Array<{
  stage: 'todo' | 'later' | 'delegate';
  title: string;
  subtitle: string;
  accent: string;
  badgeStyle: string;
  icon: React.ReactNode;
}> = [
  {
    stage: 'todo',
    title: 'To Do',
    subtitle: 'Execute now · Immediate focus queue',
    accent: 'border-emerald-200 bg-emerald-50/40',
    badgeStyle: 'bg-emerald-600 text-white',
    icon: <ListTodo className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />,
  },
  {
    stage: 'later',
    title: 'Later',
    subtitle: 'Deferred & scheduled for later',
    accent: 'border-blue-200 bg-blue-50/40',
    badgeStyle: 'bg-blue-600 text-white',
    icon: (
      <CalendarClock className="w-3.5 h-3.5 text-blue-700" aria-hidden="true" />
    ),
  },
  {
    stage: 'delegate',
    title: 'Delegate',
    subtitle: 'Handed off · Assigned or delegated',
    accent: 'border-purple-200 bg-purple-50/40',
    badgeStyle: 'bg-purple-700 text-white',
    icon: <Users className="w-3.5 h-3.5 text-purple-700" aria-hidden="true" />,
  },
];

export const TaskViewsContainer: React.FC<TaskViewsContainerProps> = ({
  mode,
  todos,
  onToggleTodo,
  onDeleteTodo,
  onMoveKanbanStage,
  onDragStartTask,
  onDragEndTask,
}) => {
  const [dragOverStage, setDragOverStage] = useState<
    'todo' | 'later' | 'delegate' | null
  >(null);

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    todoId: string
  ) => {
    e.dataTransfer.setData(HOURLY_DRAG_MIME_TYPE, todoId);
    e.dataTransfer.setData('text/plain', todoId);
    e.dataTransfer.effectAllowed = 'move';
    if (onDragStartTask) {
      onDragStartTask(todoId);
    }
  };

  const handleDragEnd = () => {
    setDragOverStage(null);
    if (onDragEndTask) {
      onDragEndTask();
    }
  };

  const handleColumnDrop = (
    e: React.DragEvent<HTMLElement>,
    targetStage: 'todo' | 'later' | 'delegate'
  ) => {
    e.preventDefault();
    setDragOverStage(null);
    const todoId =
      e.dataTransfer.getData(HOURLY_DRAG_MIME_TYPE) ||
      e.dataTransfer.getData('text/plain');
    if (todoId) {
      onMoveKanbanStage(todoId, targetStage);
    }
  };

  if (mode === 'kanban') {
    const columns = groupTodosByKanban(todos);
    const spikedCompletedCount = columns.done.length;

    return (
      <div data-testid="tasks-kanban-view" className="space-y-3.5">
        {/* MemoSpike Completed Board Connection Strip */}
        <div
          data-testid="kanban-memospike-completed-banner"
          className="bg-slate-900 text-white rounded-xl px-4 py-3 border border-slate-800 flex flex-wrap items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-purple-700 text-white flex items-center justify-center shrink-0">
              <Pin className="w-3.5 h-3.5" aria-hidden="true" />
            </div>
            <div>
              <div className="text-xs font-bold flex items-center gap-2">
                <span>Kanban Triage: To Do · Later · Delegate</span>
                <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-mono uppercase">
                  Completed = MemoSpike Spindle
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Active tasks flow across <strong>To Do</strong>,{' '}
                <strong>Later</strong>, and <strong>Delegate</strong>. When a
                task is completed, spike it directly onto the{' '}
                <strong className="text-emerald-400">
                  MemoSpike Task Spindle
                </strong>{' '}
                above (your Completed Board).
              </p>
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-emerald-400 shrink-0">
            {spikedCompletedCount} Spiked on MemoSpike
          </div>
        </div>

        {/* 3 Columns: To Do, Later, Delegate */}
        <div className="grid grid-cols-1 @xl:grid-cols-3 gap-3.5">
          {KANBAN_COLUMNS.map((col) => {
            const colTasks = columns[col.stage];
            const isDropTarget = dragOverStage === col.stage;

            return (
              <section
                key={col.stage}
                data-testid={`kanban-col-${col.stage}`}
                aria-label={`Kanban column ${col.title}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragOverStage !== col.stage) {
                    setDragOverStage(col.stage);
                  }
                }}
                onDragLeave={() => setDragOverStage(null)}
                onDrop={(e) => handleColumnDrop(e, col.stage)}
                className={`rounded-xl border ${col.accent} ${
                  isDropTarget ? 'ring-2 ring-blue-500' : ''
                } p-3 flex flex-col gap-2.5 min-h-[280px] transition-shadow`}
              >
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    {col.icon}
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">
                        {col.title}
                      </h3>
                      <p className="text-[10px] text-slate-500">
                        {col.subtitle}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${col.badgeStyle}`}
                  >
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-2 flex-1">
                  {colTasks.length === 0 ? (
                    <div className="h-32 flex items-center justify-center text-center text-[11px] text-slate-400 border border-dashed border-slate-200 rounded-lg px-3">
                      Drop tasks here or move to {col.title}
                    </div>
                  ) : (
                    colTasks.map((todo) => (
                      <div
                        key={todo.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, todo.id)}
                        onDragEnd={handleDragEnd}
                        title="Drag card between To Do / Later / Delegate or into an Hourly Calendar slot"
                        className="bg-white border border-slate-200 hover:border-emerald-300 rounded-lg p-2.5 shadow-2xs space-y-2 cursor-grab active:cursor-grabbing"
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="flex items-start gap-1.5 min-w-0">
                            <GripVertical
                              className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-0.5"
                              aria-hidden="true"
                            />
                            <p className="text-xs font-semibold leading-snug text-slate-900">
                              {todo.title}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onDeleteTodo(todo.id)}
                            aria-label={`Delete "${todo.title}"`}
                            className="text-slate-400 hover:text-red-600 p-0.5 rounded cursor-pointer shrink-0"
                          >
                            <Trash2
                              className="w-3.5 h-3.5"
                              aria-hidden="true"
                            />
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                            {todo.category}
                          </span>
                          {todo.scheduledHour !== undefined && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-semibold flex items-center gap-0.5">
                              <Clock
                                className="w-2.5 h-2.5"
                                aria-hidden="true"
                              />
                              {formatHourSlotLabel(todo.scheduledHour)}
                            </span>
                          )}
                          <span className="font-mono text-slate-500">
                            {todo.dueDate}
                          </span>
                          {todo.isRepeating && (todo.streakCount ?? 0) > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-mono font-bold flex items-center gap-0.5">
                              <Flame
                                className="w-2.5 h-2.5 text-amber-600"
                                aria-hidden="true"
                              />
                              {todo.streakCount}d
                            </span>
                          )}
                        </div>

                        {/* Stage Move Controls (To Do / Later / Delegate) + Spike to MemoSpike Completed Board */}
                        <div className="pt-1.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1">
                          <div className="flex items-center gap-1">
                            {col.stage !== 'todo' && (
                              <button
                                type="button"
                                onClick={() =>
                                  onMoveKanbanStage(todo.id, 'todo')
                                }
                                className="px-2 py-0.5 text-[10px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded flex items-center gap-0.5 cursor-pointer"
                              >
                                <ArrowLeft className="w-2.5 h-2.5" />
                                <span>To Do</span>
                              </button>
                            )}
                            {col.stage !== 'later' && (
                              <button
                                type="button"
                                onClick={() =>
                                  onMoveKanbanStage(todo.id, 'later')
                                }
                                className="px-2 py-0.5 text-[10px] font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded flex items-center gap-0.5 cursor-pointer"
                              >
                                <span>Later</span>
                                {col.stage === 'todo' && (
                                  <ArrowRight className="w-2.5 h-2.5" />
                                )}
                              </button>
                            )}
                            {col.stage !== 'delegate' && (
                              <button
                                type="button"
                                onClick={() =>
                                  onMoveKanbanStage(todo.id, 'delegate')
                                }
                                className="px-2 py-0.5 text-[10px] font-semibold text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded flex items-center gap-0.5 cursor-pointer"
                              >
                                <span>Delegate</span>
                                <ArrowRight className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>

                          {/* Complete -> Impale onto MemoSpike Completed Board */}
                          <button
                            type="button"
                            data-testid={`kanban-spike-complete-${todo.id}`}
                            onClick={() => onToggleTodo(todo.id)}
                            title="Complete task and spike onto the MemoSpike Completed Board"
                            className="px-2 py-0.5 text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded flex items-center gap-1 cursor-pointer"
                          >
                            <Pin className="w-2.5 h-2.5" aria-hidden="true" />
                            <span>Spike Done</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    );
  }

  // Timeline View
  const groups = groupTodosForTimeline(todos);
  return (
    <div
      data-testid="tasks-timeline-view"
      className="bg-white border border-slate-200 rounded-xl p-4 space-y-5"
    >
      {groups.length === 0 ? (
        <div className="py-10 text-center text-xs text-slate-500">
          No tasks to display on the timeline.
        </div>
      ) : (
        groups.map((group) => (
          <div key={group.dateIso} className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono">
                {group.bucketLabel}
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                ({group.items.length} tasks)
              </span>
            </div>

            <div className="ml-1 pl-4 border-l-2 border-slate-200 space-y-2.5">
              {group.items.map((todo) => (
                <div
                  key={todo.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, todo.id)}
                  onDragEnd={handleDragEnd}
                  title="Drag task into an Hourly Calendar slot"
                  className={`p-3 rounded-xl border flex items-start justify-between gap-3 transition-colors cursor-grab active:cursor-grabbing ${
                    todo.completed
                      ? 'bg-slate-50 border-slate-200 opacity-70'
                      : 'bg-white border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <GripVertical
                      className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <button
                      type="button"
                      onClick={() => onToggleTodo(todo.id)}
                      aria-label={`Toggle "${todo.title}" completion`}
                      className="mt-0.5 text-slate-400 hover:text-emerald-600 cursor-pointer shrink-0"
                    >
                      {todo.completed ? (
                        <CheckCircle2
                          className="w-4 h-4 text-emerald-600"
                          aria-hidden="true"
                        />
                      ) : (
                        <Circle className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {todo.scheduledHour !== undefined && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono font-semibold flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" aria-hidden="true" />
                            {formatHourSlotLabel(todo.scheduledHour)}
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                          {todo.category}
                        </span>
                        <span className="text-[10px] font-mono uppercase text-slate-500">
                          {todo.priority}
                        </span>
                      </div>

                      <p
                        className={`text-xs font-semibold mt-1 ${
                          todo.completed
                            ? 'line-through text-slate-400'
                            : 'text-slate-900'
                        }`}
                      >
                        {todo.title}
                      </p>
                      {todo.notes && (
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {todo.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteTodo(todo.id)}
                    aria-label={`Delete "${todo.title}"`}
                    className="text-slate-400 hover:text-red-600 p-1 rounded cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};
