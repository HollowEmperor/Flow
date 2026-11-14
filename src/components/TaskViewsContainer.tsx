import React from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  Flame,
  Trash2,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import {
  TodoItem,
  KanbanStage,
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
}

const KANBAN_COLUMNS: Array<{
  stage: KanbanStage;
  title: string;
  subtitle: string;
  accent: string;
}> = [
  {
    stage: 'todo',
    title: 'To Do',
    subtitle: 'Queued for execution',
    accent: 'border-slate-200 bg-slate-50/70',
  },
  {
    stage: 'in_progress',
    title: 'In Progress',
    subtitle: 'Active focus right now',
    accent: 'border-amber-200 bg-amber-50/40',
  },
  {
    stage: 'done',
    title: 'Completed',
    subtitle: 'Shipped & verified',
    accent: 'border-emerald-200 bg-emerald-50/40',
  },
];

export const TaskViewsContainer: React.FC<TaskViewsContainerProps> = ({
  mode,
  todos,
  onToggleTodo,
  onDeleteTodo,
  onMoveKanbanStage,
}) => {
  if (mode === 'kanban') {
    const columns = groupTodosByKanban(todos);
    return (
      <div
        data-testid="tasks-kanban-view"
        className="grid grid-cols-1 @xl:grid-cols-3 gap-3.5"
      >
        {KANBAN_COLUMNS.map((col) => {
          const colTasks = columns[col.stage];
          return (
            <section
              key={col.stage}
              data-testid={`kanban-col-${col.stage}`}
              aria-label={`Kanban column ${col.title}`}
              className={`rounded-xl border ${col.accent} p-3 flex flex-col gap-2.5 min-h-[260px]`}
            >
              <div className="flex items-center justify-between px-1">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    {col.title}
                  </h3>
                  <p className="text-[10px] text-slate-500">{col.subtitle}</p>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                  {colTasks.length}
                </span>
              </div>

              <div className="space-y-2 flex-1">
                {colTasks.length === 0 ? (
                  <div className="h-32 flex items-center justify-center text-center text-[11px] text-slate-400 border border-dashed border-slate-200 rounded-lg px-3">
                    No tasks in {col.title}
                  </div>
                ) : (
                  colTasks.map((todo) => (
                    <div
                      key={todo.id}
                      className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-2xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-xs font-semibold leading-snug ${
                            todo.completed
                              ? 'line-through text-slate-400'
                              : 'text-slate-900'
                          }`}
                        >
                          {todo.title}
                        </p>
                        <button
                          type="button"
                          onClick={() => onDeleteTodo(todo.id)}
                          aria-label={`Delete "${todo.title}"`}
                          className="text-slate-400 hover:text-red-600 p-0.5 rounded cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          {todo.category}
                        </span>
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

                      {/* Stage Move Controls */}
                      <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1">
                        {col.stage !== 'todo' ? (
                          <button
                            type="button"
                            onClick={() =>
                              onMoveKanbanStage(
                                todo.id,
                                col.stage === 'done' ? 'in_progress' : 'todo'
                              )
                            }
                            className="px-2 py-0.5 text-[10px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 rounded flex items-center gap-1 cursor-pointer"
                          >
                            <ArrowLeft className="w-2.5 h-2.5" />
                            <span>
                              {col.stage === 'done' ? 'In Progress' : 'To Do'}
                            </span>
                          </button>
                        ) : (
                          <span />
                        )}

                        {col.stage !== 'done' && (
                          <button
                            type="button"
                            onClick={() =>
                              onMoveKanbanStage(
                                todo.id,
                                col.stage === 'todo' ? 'in_progress' : 'done'
                              )
                            }
                            className="px-2 py-0.5 text-[10px] font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded flex items-center gap-1 cursor-pointer"
                          >
                            <span>
                              {col.stage === 'todo' ? 'Start' : 'Complete'}
                            </span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          );
        })}
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
                  className={`p-3 rounded-xl border flex items-start justify-between gap-3 transition-colors ${
                    todo.completed
                      ? 'bg-slate-50 border-slate-200 opacity-70'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
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
