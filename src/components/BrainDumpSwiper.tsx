import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Archive,
  Check,
  Plus,
  RotateCcw,
  Trash2,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  BrainDumpItem,
  Category,
  Priority,
  LIFE_AREAS,
} from '../utils/todoLogic';

interface BrainDumpSwiperProps {
  items: BrainDumpItem[];
  onAddDumpItems: (rawText: string, category: Category, priority: Priority) => void;
  onSwipeRight: (id: string) => void;
  onSwipeLeft: (id: string) => void;
  onRestoreToDeck: (id: string) => void;
  onDeleteDumpItem: (id: string) => void;
  onSwitchToTodoList: () => void;
}

const PRIORITY_LABELS: Record<Priority, { text: string; color: string }> = {
  high: { text: 'High priority', color: 'text-red-600 font-medium' },
  medium: { text: 'Medium priority', color: 'text-amber-700' },
  low: { text: 'Low priority', color: 'text-slate-500' },
};

export const BrainDumpSwiper: React.FC<BrainDumpSwiperProps> = ({
  items,
  onAddDumpItems,
  onSwipeRight,
  onSwipeLeft,
  onRestoreToDeck,
  onDeleteDumpItem,
  onSwitchToTodoList,
}) => {
  const [rawInput, setRawInput] = useState('');
  const [category, setCategory] = useState<Category>('Portfolio');
  const [priority, setPriority] = useState<Priority>('medium');
  const [inputError, setInputError] = useState<string | null>(null);

  // Drag / Swipe animation state
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);
  const [lastActionFeedback, setLastActionFeedback] = useState<{
    type: 'right' | 'left';
    title: string;
  } | null>(null);

  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  const queueItems = items.filter((i) => i.status === 'queue');
  const storedItems = items.filter((i) => i.status === 'stored');

  const topCard = queueItems[0] ?? null;
  const nextCard = queueItems[1] ?? null;

  const triggerSwipe = (direction: 'left' | 'right') => {
    if (!topCard || exitDirection) return;

    const swipedTitle = topCard.title;
    const swipedId = topCard.id;
    setExitDirection(direction);
    setDragOffset({ x: direction === 'right' ? 340 : -340, y: 12 });

    window.setTimeout(() => {
      if (direction === 'right') {
        onSwipeRight(swipedId);
      } else {
        onSwipeLeft(swipedId);
      }
      setLastActionFeedback({ type: direction, title: swipedTitle });
      setExitDirection(null);
      setDragOffset({ x: 0, y: 0 });
    }, 180);
  };

  // Keyboard support (Left/Right arrows when not typing in input/textarea)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (!topCard || exitDirection) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        triggerSwipe('right');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        triggerSwipe('left');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!topCard || exitDirection) return;
    // Ignore pointer down on interactive child buttons
    if ((e.target as HTMLElement).closest('button')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = (e.clientY - dragStartRef.current.y) * 0.25;
    setDragOffset({ x: dx, y: dy });
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    dragStartRef.current = null;

    const threshold = 95;
    if (dragOffset.x > threshold) {
      triggerSwipe('right');
    } else if (dragOffset.x < -threshold) {
      triggerSwipe('left');
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
  };

  const handleDumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawInput.trim()) {
      setInputError('Enter at least one thought or task idea to add to your Brain Dump.');
      return;
    }
    setInputError(null);
    onAddDumpItems(rawInput, category, priority);
    setRawInput('');
  };

  const rotationDeg = dragOffset.x * 0.045;
  const swipeRightOpacity = Math.min(1, Math.max(0, dragOffset.x / 90));
  const swipeLeftOpacity = Math.min(1, Math.max(0, -dragOffset.x / 90));

  return (
    <div className="space-y-6">
      {/* Header & Instructions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">
            Brain Dump & Swipe Triage
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Unload everything on your mind, then swipe{' '}
            <span className="font-semibold text-emerald-700">Right</span> to add to Today&apos;s
            Todo List or <span className="font-semibold text-slate-800">Left</span> to store for
            later.
          </p>
        </div>

        <button
          type="button"
          onClick={onSwitchToTodoList}
          className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto cursor-pointer"
        >
          View Today&apos;s Todo List
        </button>
      </div>

      {/* Two-Column Brain Dump Layout: Left Capture + Stored Vault, Right Tinder Swipe Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Column 1 (7 cols): Tinder-Like Swipe Card Deck */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-xs text-slate-500 mb-4">
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-500" aria-hidden="true" />
              <span>Triage Swipe Deck</span>
            </span>
            <span
              data-testid="braindump-queue-count"
              className="font-mono tabular-nums font-medium text-slate-700"
            >
              {queueItems.length} {queueItems.length === 1 ? 'card' : 'cards'} remaining
            </span>
          </div>

          {/* Live feedback banner after swipe */}
          {lastActionFeedback && (
            <div
              role="status"
              aria-live="polite"
              data-testid="swipe-feedback-banner"
              className={`w-full mb-4 px-3.5 py-2 rounded-lg text-xs font-medium flex items-center justify-between ${
                lastActionFeedback.type === 'right'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <span className="truncate">
                {lastActionFeedback.type === 'right'
                  ? `Added "${lastActionFeedback.title}" to Today's Todo List`
                  : `Stored "${lastActionFeedback.title}" in Brain Dump Vault`}
              </span>
              <span className="font-mono text-[11px] shrink-0 ml-2">
                {lastActionFeedback.type === 'right' ? '→ Today' : '← Stored'}
              </span>
            </div>
          )}

          {topCard ? (
            <>
              {/* Card Stack Stage */}
              <div className="relative w-full max-w-md h-64 flex items-center justify-center select-none my-2">
                {/* Background Next Card Preview */}
                {nextCard && (
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-4 top-4 bottom-0 bg-slate-50 border border-slate-200 rounded-2xl p-6 scale-[0.96] translate-y-2 opacity-70 pointer-events-none flex flex-col justify-between"
                  >
                    <div>
                      <div className="text-xs text-slate-400">
                        {nextCard.category} · {PRIORITY_LABELS[nextCard.priority].text}
                      </div>
                      <p className="mt-2 text-base font-semibold text-slate-600 line-clamp-2">
                        {nextCard.title}
                      </p>
                    </div>
                  </div>
                )}

                {/* Active Draggable Top Card */}
                <div
                  data-testid="active-swipe-card"
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  style={{
                    transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${rotationDeg}deg)`,
                    transition: isDragging
                      ? 'none'
                      : 'transform 180ms cubic-bezier(0.16, 1, 0.3, 1)',
                    touchAction: 'pan-y',
                  }}
                  className="relative z-10 w-full h-full bg-white border-2 border-slate-900 rounded-2xl p-6 shadow-sm flex flex-col justify-between cursor-grab active:cursor-grabbing"
                >
                  {/* Dynamic Swipe Stamp Badges during drag */}
                  <div
                    aria-hidden="true"
                    style={{ opacity: swipeRightOpacity }}
                    className="pointer-events-none absolute top-4 right-4 border-2 border-emerald-600 text-emerald-700 bg-emerald-50/95 px-2.5 py-1 rounded-md text-xs font-bold tracking-wide uppercase"
                  >
                    Keep for Today →
                  </div>
                  <div
                    aria-hidden="true"
                    style={{ opacity: swipeLeftOpacity }}
                    className="pointer-events-none absolute top-4 left-4 border-2 border-slate-700 text-slate-800 bg-slate-100/95 px-2.5 py-1 rounded-md text-xs font-bold tracking-wide uppercase"
                  >
                    ← Store for Later
                  </div>

                  <div>
                    {/* Unboxed Metadata Line */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="font-semibold text-slate-800">{topCard.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className={PRIORITY_LABELS[topCard.priority].color}>
                        {PRIORITY_LABELS[topCard.priority].text}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums text-slate-400">
                        Card 1 of {queueItems.length}
                      </span>
                    </div>

                    <h2
                      data-testid="active-swipe-card-title"
                      className="mt-3 text-lg sm:text-xl font-bold text-slate-900 font-display leading-snug"
                    >
                      {topCard.title}
                    </h2>

                    {topCard.notes ? (
                      <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3">
                        {topCard.notes}
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-slate-400 italic">
                        Drag card left or right, or use the triage buttons below.
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>← Left: Store in Vault</span>
                    <span>Drag or use Arrow Keys</span>
                    <span>Right: Add to Today →</span>
                  </div>
                </div>
              </div>

              {/* Explicit Tactile Swipe Controls */}
              <div className="mt-5 w-full max-w-md grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => triggerSwipe('left')}
                  aria-label="Swipe left to store task for later"
                  className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-slate-600 shrink-0" aria-hidden="true" />
                  <span>Swipe Left · Store</span>
                </button>

                <button
                  type="button"
                  onClick={() => triggerSwipe('right')}
                  aria-label="Swipe right to add task to Today's Todo list"
                  className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span>Swipe Right · Do Today</span>
                  <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                </button>
              </div>
            </>
          ) : (
            <div className="w-full py-12 px-4 text-center bg-slate-50 border border-slate-100 rounded-xl my-2">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-5 h-5" aria-hidden="true" />
              </div>
              <h2 className="text-sm font-semibold text-slate-900">
                All Brain Dump Cards Triaged!
              </h2>
              <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto">
                You have sorted every thought in your queue. Add more ideas on the right or head
                to Today&apos;s Todo List.
              </p>
              <button
                type="button"
                onClick={onSwitchToTodoList}
                className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Go to Today&apos;s Todo List
              </button>
            </div>
          )}
        </div>

        {/* Column 2 (5 cols): Rapid Brain Dump Input Form */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-900">
            Quick Brain Dump Capture
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Type one or multiple lines below. Each line becomes a swipeable card in your deck.
          </p>

          <form onSubmit={handleDumpSubmit} className="mt-4 space-y-3">
            <div>
              <label htmlFor="braindump-textarea" className="sr-only">
                Brain dump thoughts (one per line)
              </label>
              <textarea
                id="braindump-textarea"
                rows={4}
                value={rawInput}
                onChange={(e) => {
                  setRawInput(e.target.value);
                  if (inputError) setInputError(null);
                }}
                placeholder={
                  'Write anything on your mind (one per line)...\n- Reply to Sarah about design review\n- Book train tickets\n- Clean out garage shelves'
                }
                className="w-full text-xs sm:text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-lg p-3 focus:outline-none focus:border-slate-400 resize-y"
              />
            </div>

            {inputError && (
              <p role="alert" className="text-xs font-medium text-red-600">
                {inputError}
              </p>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label
                  htmlFor="braindump-category"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Default Category
                </label>
                <select
                  id="braindump-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-slate-400"
                >
                  {LIFE_AREAS.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="braindump-priority"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Default Priority
                </label>
                <select
                  id="braindump-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-slate-400"
                >
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Add to Swipe Deck</span>
            </button>
          </form>
        </div>
      </div>

      {/* Stored Vault Section (Items swiped Left) */}
      <section
        aria-label="Stored Brain Dump Vault"
        className="bg-white border border-slate-200 rounded-xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Archive className="w-4 h-4 text-slate-500" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-slate-900">
              Stored Brain Dump Vault (Swiped Left)
            </h2>
          </div>
          <span
            data-testid="braindump-stored-count"
            className="text-xs font-mono tabular-nums text-slate-500"
          >
            {storedItems.length} stored
          </span>
        </div>

        {storedItems.length > 0 ? (
          <div className="divide-y divide-slate-200/80" role="list">
            {storedItems.map((item) => (
              <div
                key={item.id}
                role="listitem"
                className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 break-words">
                    {item.title}
                  </p>
                  {item.notes && (
                    <p className="text-xs text-slate-500 mt-0.5">{item.notes}</p>
                  )}
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="font-medium text-slate-700">{item.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className={PRIORITY_LABELS[item.priority].color}>
                      {PRIORITY_LABELS[item.priority].text}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Stored for later</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onSwipeRight(item.id)}
                    aria-label={`Move "${item.title}" to Today's Todo list`}
                    className="px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg flex items-center gap-1 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Add to Today</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onRestoreToDeck(item.id)}
                    aria-label={`Return "${item.title}" to swipe deck`}
                    className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Re-swipe</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteDumpItem(item.id)}
                    aria-label={`Delete stored item "${item.title}"`}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 px-6 text-center text-xs text-slate-500">
            No stored items yet. Swiping a card left stores it here for future review without
            cluttering Today&apos;s Todo List.
          </div>
        )}
      </section>
    </div>
  );
};
