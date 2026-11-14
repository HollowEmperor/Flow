import React, { useState, useMemo } from 'react';
import {
  Ticket,
  Grid,
  Sparkles,
  CheckCircle2,
  Plus,
  Flame,
  Trophy,
  GripVertical,
  Clock,
  Star,
} from 'lucide-react';
import {
  Category,
  LIFE_AREAS,
  TodoItem,
  HOURLY_DRAG_MIME_TYPE,
  PUNCH_CARD_MIN_DAYS_THRESHOLD,
  computeTaskBingoBoard,
  formatHourSlotLabel,
  getTodayIsoDate,
} from '../utils/todoLogic';

interface BingoPunchCardDashboardProps {
  todos: TodoItem[];
  onPunchTaskDay: (todoId: string) => void;
  onDragStartTask?: (todoId: string) => void;
  onDragEndTask?: () => void;
  onQuickScheduleTask?: (todoId: string, hour: number) => void;
}

const TIER_STYLES = {
  gold: {
    cardBg: 'bg-purple-50',
    border: 'border-purple-400',
    badge: 'bg-purple-800 text-purple-100 border-purple-700',
    holePunched: 'bg-purple-600 border-purple-800 text-white shadow-inner',
  },
  silver: {
    cardBg: 'bg-emerald-50',
    border: 'border-emerald-400',
    badge: 'bg-emerald-800 text-emerald-100 border-emerald-700',
    holePunched: 'bg-emerald-600 border-emerald-800 text-white shadow-inner',
  },
  bronze: {
    cardBg: 'bg-blue-50',
    border: 'border-blue-400',
    badge: 'bg-blue-800 text-blue-100 border-blue-700',
    holePunched: 'bg-blue-600 border-blue-800 text-white shadow-inner',
  },
};

export const BingoPunchCardDashboard: React.FC<
  BingoPunchCardDashboardProps
> = ({
  todos,
  onPunchTaskDay,
  onDragStartTask,
  onDragEndTask,
  onQuickScheduleTask,
}) => {
  const todayIso = useMemo(() => getTodayIsoDate(), []);
  const [manualStampedIndices, setManualStampedIndices] = useState<number[]>(
    []
  );
  const [areaFilter, setAreaFilter] = useState<Category | 'All'>('All');
  const [recentMintBanner, setRecentMintBanner] = useState<string | null>(null);
  const [lastPunchedSlotKey, setLastPunchedSlotKey] = useState<string | null>(
    null
  );

  const filteredTodos = useMemo(
    () =>
      areaFilter === 'All'
        ? todos
        : todos.filter((t) => t.category === areaFilter),
    [todos, areaFilter]
  );

  const board = useMemo(
    () => computeTaskBingoBoard(filteredTodos, manualStampedIndices, todayIso),
    [filteredTodos, manualStampedIndices, todayIso]
  );

  const handlePunchWithFeedback = (
    todoId: string,
    title: string,
    currentDays: number
  ) => {
    const nextDays = currentDays + 1;
    onPunchTaskDay(todoId);
    setLastPunchedSlotKey(`${todoId}-${nextDays}`);
    if (
      currentDays <= PUNCH_CARD_MIN_DAYS_THRESHOLD &&
      nextDays > PUNCH_CARD_MIN_DAYS_THRESHOLD
    ) {
      setRecentMintBanner(
        `🎉 Auto-Minted New Punch Card! "${title}" has now been done ${nextDays} days (more than thrice)!`
      );
    } else {
      setRecentMintBanner(
        `🎟️ Punched Day #${nextDays} on "${title}"! (${nextDays} total days done)`
      );
    }
  };

  const handleBingoCellClick = (cellIndex: number, linkedTodoId?: string) => {
    if (cellIndex === 12) return; // Free space
    if (linkedTodoId) {
      const target = todos.find((t) => t.id === linkedTodoId);
      if (target) {
        const curDays = Math.max(
          target.completedDates?.length ?? 0,
          target.streakCount ?? 0,
          target.completed ? 1 : 0
        );
        handlePunchWithFeedback(target.id, target.title, curDays);
        return;
      }
    }
    setManualStampedIndices((prev) =>
      prev.includes(cellIndex)
        ? prev.filter((i) => i !== cellIndex)
        : [...prev, cellIndex]
    );
  };

  const handleDragStartCard = (
    e: React.DragEvent<HTMLElement>,
    todoId: string
  ) => {
    e.dataTransfer.setData(HOURLY_DRAG_MIME_TYPE, todoId);
    e.dataTransfer.setData('text/plain', todoId);
    e.dataTransfer.effectAllowed = 'move';
    if (onDragStartTask) {
      onDragStartTask(todoId);
    }
  };

  return (
    <div
      data-testid="bingo-punch-card-dashboard"
      className="space-y-4 @container"
    >
      {/* Top Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-amber-600" aria-hidden="true" />
              <h1 className="text-lg @sm:text-xl font-bold tracking-tight text-slate-900 font-display">
                Task Bingo Card &amp; Auto-Minted Punch Cards
              </h1>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Do any task <strong>more than thrice (&gt; 3 times / 4+ days)</strong>{' '}
              and it automatically generates a physical{' '}
              <strong>Task Punch Card</strong> marking every day you completed
              it. Pull any card to the right-side Hourly Calendar to schedule it!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              data-testid="auto-punch-cards-count"
              className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-300 text-amber-950 text-xs font-mono font-bold flex items-center gap-1.5"
            >
              <Ticket className="w-3.5 h-3.5 text-amber-700" />
              <span>{board.autoPunchCards.length} Auto Punch Cards</span>
            </span>

            <span
              data-testid="bingo-lines-count"
              className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-mono font-bold flex items-center gap-1.5"
            >
              <Trophy className="w-3.5 h-3.5 text-emerald-700" />
              <span>
                {board.bingoCount} {board.bingoCount === 1 ? 'BINGO' : 'BINGOs'}{' '}
                ({board.stampedCount}/25)
              </span>
            </span>

            <select
              aria-label="Filter Bingo and Punch Cards by Life Area"
              value={areaFilter}
              onChange={(e) =>
                setAreaFilter(e.target.value as Category | 'All')
              }
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
            >
              <option value="All">All 7 Life Areas</option>
              {LIFE_AREAS.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>
        </div>

        {recentMintBanner && (
          <div
            role="status"
            data-testid="punch-card-mint-banner"
            className="bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-xl px-3.5 py-2.5 text-xs font-semibold flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2">
              <Sparkles
                className="w-4 h-4 text-emerald-600 shrink-0"
                aria-hidden="true"
              />
              <span>{recentMintBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => setRecentMintBanner(null)}
              className="text-[11px] font-mono text-emerald-800 hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* SECTION 1: AUTOMATIC TASK PUNCH CARDS (Tasks done > 3 times / 4+ days) */}
      <section
        aria-label="Automatic Task Punch Cards"
        data-testid="auto-punch-cards-section"
        className="bg-white border border-slate-200 rounded-xl p-4 space-y-3.5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Ticket className="w-4 h-4 text-amber-600" aria-hidden="true" />
              <span>
                Automatic Task Punch Cards (Tasks Done More Than Thrice · 4+
                Days)
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Each punched hole marks a day you completed this task. Click any
              unpunched hole or &ldquo;+1 Punch Today&rdquo; to mark another
              day, or drag the card into the Side Hourly Calendar!
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Threshold: &gt; 3 days (4+ completions)
          </span>
        </div>

        <div className="grid grid-cols-1 @xl:grid-cols-2 gap-3.5">
          {board.autoPunchCards.map((card) => {
            const style = TIER_STYLES[card.tier];
            const linkedTodo = todos.find((t) => t.id === card.todoId);
            return (
              <div
                key={card.id}
                draggable
                data-testid={`auto-punch-card-${card.todoId}`}
                onDragStart={(e) => handleDragStartCard(e, card.todoId)}
                onDragEnd={() => onDragEndTask && onDragEndTask()}
                className={`relative rounded-2xl border-2 ${style.border} ${style.cardBg} p-4 shadow-xs flex flex-col justify-between gap-3 cursor-grab active:cursor-grabbing transition-transform hover:-translate-y-0.5`}
              >
                {/* Ticket Side Cutout Notches */}
                <div
                  aria-hidden="true"
                  className="w-4 h-4 rounded-full bg-white border-r-2 border-amber-300 absolute -left-2.5 top-1/2 -translate-y-1/2"
                />
                <div
                  aria-hidden="true"
                  className="w-4 h-4 rounded-full bg-white border-l-2 border-amber-300 absolute -right-2.5 top-1/2 -translate-y-1/2"
                />

                {/* Top Ticket Header */}
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <GripVertical
                        className="w-3.5 h-3.5 text-slate-400 shrink-0"
                        aria-hidden="true"
                      />
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${style.badge}`}
                      >
                        {card.tierLabel}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-white/90 border border-slate-200 text-[10px] font-semibold text-slate-700">
                        {card.category}
                      </span>
                    </div>

                    <span className="font-mono text-[10px] font-bold text-slate-500">
                      #{card.serialCode}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-2 pt-0.5">
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {card.title}
                    </h3>

                    <div
                      data-testid={`punch-card-days-badge-${card.todoId}`}
                      className="px-2.5 py-1 rounded-xl bg-slate-900 text-white font-mono text-xs font-bold shrink-0 flex items-center gap-1 shadow-2xs"
                    >
                      <Flame
                        className="w-3.5 h-3.5 text-amber-400 fill-amber-400"
                        aria-hidden="true"
                      />
                      <span>{card.daysDone} Days Done</span>
                    </div>
                  </div>
                </div>

                {/* Perforated Punch Hole Grid */}
                <div className="bg-white/85 border border-dashed border-amber-300/90 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>
                      PUNCHED DAYS RECORD ({card.daysDone} of{' '}
                      {card.cardCapacity} card holes punched)
                    </span>
                    <span className="font-bold text-emerald-800">
                      Last: {card.lastCompletedDate}
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-2">
                    {card.slots.map((slot) => {
                      const isJustPunched =
                        lastPunchedSlotKey ===
                        `${card.todoId}-${slot.slotNumber}`;
                      return (
                        <button
                          key={slot.slotNumber}
                          type="button"
                          data-testid={`punch-hole-${card.todoId}-${slot.slotNumber}`}
                          onClick={() =>
                            handlePunchWithFeedback(
                              card.todoId,
                              card.title,
                              card.daysDone
                            )
                          }
                          title={
                            slot.isPunched
                              ? `Day #${slot.slotNumber} Completed (${slot.dateIso})`
                              : `Click to punch Day #${slot.slotNumber} for "${card.title}"`
                          }
                          className={`relative h-11 rounded-xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer ${
                            slot.isPunched
                              ? `${style.holePunched} ${
                                  isJustPunched ? 'scale-110 ring-2 ring-emerald-500' : ''
                                }`
                              : 'bg-slate-50/90 border-dashed border-slate-300 text-slate-400 hover:border-amber-500 hover:text-amber-800 hover:bg-amber-50/50'
                          }`}
                        >
                          <div className="flex items-center gap-0.5 text-[10px] font-mono font-bold">
                            {slot.isPunched ? (
                              <>
                                <CheckCircle2
                                  className="w-3 h-3 shrink-0"
                                  aria-hidden="true"
                                />
                                <span>D{slot.slotNumber}</span>
                              </>
                            ) : (
                              <span>#{slot.slotNumber}</span>
                            )}
                          </div>
                          <span className="text-[8px] font-mono opacity-85 truncate max-w-full px-1">
                            {slot.isPunched
                              ? slot.shortDateLabel
                              : slot.milestoneTag || 'Punch'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Card Footer: +1 Punch Day & Quick Pull to Hourly Calendar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                    <Clock
                      className="w-3.5 h-3.5 text-emerald-700"
                      aria-hidden="true"
                    />
                    {linkedTodo?.scheduledHour !== undefined ? (
                      <span className="font-mono font-semibold text-emerald-800">
                        Scheduled at{' '}
                        {formatHourSlotLabel(linkedTodo.scheduledHour)}
                      </span>
                    ) : (
                      <span>Pull card to Hourly Calendar →</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {onQuickScheduleTask && (
                      <button
                        type="button"
                        onClick={() => onQuickScheduleTask(card.todoId, 10)}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 text-slate-700 border border-slate-300 text-[11px] font-semibold cursor-pointer"
                      >
                        Schedule 10 AM
                      </button>
                    )}

                    <button
                      type="button"
                      data-testid={`punch-card-add-day-${card.todoId}`}
                      onClick={() =>
                        handlePunchWithFeedback(
                          card.todoId,
                          card.title,
                          card.daysDone
                        )
                      }
                      className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Punch +1 Day ({card.daysDone + 1}d)</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tasks Approaching > 3 Completions ("Almost a Punch Card: 1–3 Days Done") */}
        {board.almostPunchCardTasks.length > 0 && (
          <div
            data-testid="almost-punch-card-tray"
            className="mt-3 pt-3 border-t border-slate-200 space-y-2.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Tasks Approaching Auto-Punch Card (0–3 Days Done · Complete &gt;
                3 Times to Auto-Mint Card)
              </h3>
              <span className="text-[11px] font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Click &ldquo;+1 Do Task&rdquo; to cross 3 days &amp; auto-create
                its Punch Card!
              </span>
            </div>

            <div className="grid grid-cols-1 @md:grid-cols-2 gap-2.5">
              {board.almostPunchCardTasks.map(
                ({ todo, daysDone, daysRemainingToAutoCard }) => (
                  <div
                    key={todo.id}
                    draggable
                    data-testid={`almost-punch-task-${todo.id}`}
                    onDragStart={(e) => handleDragStartCard(e, todo.id)}
                    onDragEnd={() => onDragEndTask && onDragEndTask()}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2.5 cursor-grab active:cursor-grabbing"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-semibold text-slate-700">
                          {todo.category}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-amber-800">
                          {daysDone}/4 days ({daysRemainingToAutoCard} more to
                          Auto-Punch Card)
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {todo.title}
                      </p>
                      {/* Mini 4-dot progress toward auto punch card */}
                      <div className="flex items-center gap-1 pt-0.5">
                        {[1, 2, 3, 4].map((stepNum) => (
                          <span
                            key={stepNum}
                            className={`h-2 w-6 rounded-full border ${
                              stepNum <= daysDone
                                ? 'bg-amber-500 border-amber-600'
                                : 'bg-white border-slate-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      data-testid={`increment-task-day-${todo.id}`}
                      onClick={() =>
                        handlePunchWithFeedback(todo.id, todo.title, daysDone)
                      }
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shrink-0 flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>+1 Do Task ({daysDone + 1}/4)</span>
                    </button>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </section>

      {/* SECTION 2: 5x5 INTERACTIVE BINGO CARD (B - I - N - G - O) */}
      <section
        aria-label="5x5 Task and Habit Bingo Card"
        data-testid="task-bingo-board-section"
        className="bg-white border border-slate-200 rounded-xl p-4 space-y-3.5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Grid className="w-4 h-4 text-emerald-700" aria-hidden="true" />
              <span>5×5 Task &amp; Habit Consistency BINGO Card</span>
            </h2>
            <p className="text-xs text-slate-500">
              Squares automatically stamp when a task earns a Punch Card (&gt;3
              days) or is completed. Click any square to punch +1 day on that
              task and complete 5-in-a-row BINGO lines!
            </p>
          </div>

          {board.winningLines.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {board.winningLines.map((line) => (
                <span
                  key={line.id}
                  className="px-2 py-0.5 rounded-md bg-emerald-100 border border-emerald-300 text-emerald-950 text-[11px] font-mono font-bold flex items-center gap-1"
                >
                  <Trophy
                    className="w-3 h-3 text-emerald-700"
                    aria-hidden="true"
                  />
                  <span>BINGO: {line.label}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* B - I - N - G - O Column Headers (Solid Flat Green · Blue · Purple) */}
        <div className="grid grid-cols-5 gap-2 text-center">
          {(
            [
              { letter: 'B', cls: 'bg-emerald-600' },
              { letter: 'I', cls: 'bg-blue-600' },
              { letter: 'N', cls: 'bg-purple-700' },
              { letter: 'G', cls: 'bg-emerald-700' },
              { letter: 'O', cls: 'bg-blue-700' },
            ] as const
          ).map(({ letter, cls }) => (
            <div
              key={letter}
              className={`py-2 rounded-xl ${cls} text-white font-display font-bold text-base tracking-widest shadow-xs`}
            >
              {letter}
            </div>
          ))}
        </div>

        {/* 25 Bingo Squares Grid */}
        <div
          data-testid="bingo-grid-25"
          className="grid grid-cols-5 gap-2"
        >
          {board.cells.map((cell) => {
            if (cell.isFreeSpace) {
              return (
                <div
                  key={cell.id}
                  data-testid="bingo-cell-12-free"
                  className="min-h-[98px] p-2.5 rounded-xl border-2 border-purple-500 bg-purple-100 text-purple-950 flex flex-col items-center justify-center text-center gap-1 shadow-xs"
                >
                  <Star
                    className="w-5 h-5 text-purple-700 fill-purple-600"
                    aria-hidden="true"
                  />
                  <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider">
                    FREE SPACE
                  </span>
                  <span className="text-[10px] font-semibold leading-tight">
                    3+ Days Auto-Punch Studio
                  </span>
                </div>
              );
            }

            return (
              <button
                key={cell.id}
                type="button"
                draggable={Boolean(cell.linkedTodoId)}
                onDragStart={(e) => {
                  if (cell.linkedTodoId) {
                    handleDragStartCard(e, cell.linkedTodoId);
                  }
                }}
                onDragEnd={() => onDragEndTask && onDragEndTask()}
                data-testid={`bingo-cell-${cell.index}`}
                onClick={() =>
                  handleBingoCellClick(cell.index, cell.linkedTodoId)
                }
                className={`min-h-[98px] p-2.5 rounded-xl border-2 text-left flex flex-col justify-between gap-1.5 transition-all cursor-pointer ${
                  cell.isInWinningBingoLine
                    ? 'bg-emerald-100/90 border-emerald-600 ring-2 ring-emerald-500/30 text-emerald-950'
                    : cell.isStamped
                      ? 'bg-emerald-50/80 border-emerald-400 text-slate-900'
                      : 'bg-slate-50/70 hover:bg-white border-slate-200 hover:border-slate-400 text-slate-800'
                }`}
              >
                <div className="w-full flex items-center justify-between gap-1">
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/90 border border-slate-200 text-slate-600 truncate">
                    {cell.colLetter}
                    {cell.row + 1} · {cell.category}
                  </span>

                  {cell.hasAutoPunchCard && (
                    <span
                      title="Has Auto-Minted Punch Card (>3 days)"
                      className="px-1.5 py-0.5 rounded bg-amber-200/90 text-amber-950 font-mono text-[9px] font-bold shrink-0"
                    >
                      🎟️ Card
                    </span>
                  )}
                </div>

                <p className="text-[11px] font-bold leading-snug line-clamp-2">
                  {cell.title}
                </p>

                <div className="w-full flex items-center justify-between gap-1 pt-1 border-t border-slate-200/60">
                  <span
                    className={`text-[10px] font-mono font-bold ${
                      cell.daysDone > 3
                        ? 'text-emerald-800'
                        : 'text-slate-500'
                    }`}
                  >
                    {cell.daysDone}d done
                  </span>

                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                      cell.isStamped
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {cell.isStamped ? '✓' : '+'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
