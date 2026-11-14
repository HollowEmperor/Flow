import React, { useState, useMemo, useEffect } from 'react';
import {
  BookText,
  Plus,
  Sparkles,
  Trash2,
  Calendar,
  Search,
  Flame,
  HeartHandshake,
  Brain,
  ShieldAlert,
  Heart,
} from 'lucide-react';
import {
  Category,
  LIFE_AREAS,
  JournalMood,
  JournalEntry,
  JournalNotePolarity,
  BurnedNegativeNoteStats,
  getInitialBurnedNegativeStats,
  recordBurnedNegativeNote,
  getTodayIsoDate,
} from '../utils/todoLogic';
import { TASK_JOURNAL_GUIDED_PROMPTS } from '../utils/promptQuestionsData';
import { GratitudeJar } from './GratitudeJar';
import { MoodTracker } from './MoodTracker';
import { NegativeNoteBurner } from './NegativeNoteBurner';

interface PatternCatchEntry {
  caughtPatternToday: boolean;
  beforeThatINeedWhat: string;
  howITackledIt: string;
}

interface SelfCareCheckInState {
  whatIDidForMyself: string;
  whatMadeMeFeelBetterHuman: string;
  earnLoveForMyself: 'yes_reminder' | 'no_unconditional';
  showedSelfRespectInAction: string;
  answeredMindfully: 'yes' | 'no';
}

interface JournalDashboardProps {
  entries: JournalEntry[];
  onAddEntry: (params: {
    title: string;
    content: string;
    gratitude: string;
    lifeArea: Category;
    mood: JournalMood;
    dateIso: string;
  }) => void;
  onDeleteEntry: (id: string) => void;
}

const BURNED_NOTES_STORAGE_KEY = 'focusflow_burned_negative_notes_v1';
const GUIDED_JOURNAL_STORAGE_KEY = 'focusflow_guided_journal_prompts_v1';

const MOODS: JournalMood[] = ['Peak', 'Focused', 'Calm', 'Reflective'];

const MOOD_BADGE_STYLES: Record<JournalMood, string> = {
  Peak: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  Focused: 'bg-blue-50 text-blue-800 border-blue-200',
  Calm: 'bg-teal-50 text-teal-800 border-teal-200',
  Reflective: 'bg-purple-50 text-purple-800 border-purple-200',
};

interface GuidedJournalStorageState {
  justWriteText: string;
  expectedGoodThings: 'yes_ahmadullah' | 'no_why_not' | null;
  expectedGoodThingsWhyNot: string;
  promptAnswers: Record<string, string>;
  patternState: PatternCatchEntry;
  selfCareState: SelfCareCheckInState;
}

const INITIAL_GUIDED_JOURNAL_STATE: GuidedJournalStorageState = {
  justWriteText: '',
  expectedGoodThings: 'yes_ahmadullah',
  expectedGoodThingsWhyNot: '',
  promptAnswers: {},
  patternState: {
    caughtPatternToday: true,
    beforeThatINeedWhat:
      'I should start the deep work block, but before that I need to reorganize my tabs and check messages.',
    howITackledIt:
      'Used the 5-minute starter rule and closed all browser tabs except the active workspace.',
  },
  selfCareState: {
    whatIDidForMyself:
      'Took a 25-minute evening walk without headphones and hydrated properly.',
    whatMadeMeFeelBetterHuman:
      'Listened patiently and encouraged a teammate without rushing.',
    earnLoveForMyself: 'no_unconditional',
    showedSelfRespectInAction:
      'Followed through on my pre-planned morning deep-work block before checking notifications.',
    answeredMindfully: 'yes',
  },
};

export const JournalDashboard: React.FC<JournalDashboardProps> = ({
  entries,
  onAddEntry,
  onDeleteEntry,
}) => {
  const [notePolarity, setNotePolarity] =
    useState<JournalNotePolarity>('positive');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [gratitude, setGratitude] = useState('');
  const [lifeArea, setLifeArea] = useState<Category>('Portfolio');
  const [mood, setMood] = useState<JournalMood>('Peak');
  const [filterArea, setFilterArea] = useState<Category | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedStarEntryId, setHighlightedStarEntryId] = useState<
    string | null
  >(null);

  // Guided Reflection Tabs: Task Journal ({JUST WRITE} + 23 prompts) | Patterns | Self-Care
  const [guidedTab, setGuidedTab] = useState<
    'task_journal' | 'patterns' | 'self_care'
  >('task_journal');

  const [guidedState, setGuidedState] = useState<GuidedJournalStorageState>(
    () => {
      try {
        const saved = localStorage.getItem(GUIDED_JOURNAL_STORAGE_KEY);
        if (saved) {
          return { ...INITIAL_GUIDED_JOURNAL_STATE, ...JSON.parse(saved) };
        }
      } catch {
        // ignore
      }
      return INITIAL_GUIDED_JOURNAL_STATE;
    }
  );

  useEffect(() => {
    try {
      localStorage.setItem(
        GUIDED_JOURNAL_STORAGE_KEY,
        JSON.stringify(guidedState)
      );
    } catch {
      // ignore
    }
  }, [guidedState]);

  const [burnedStats, setBurnedStats] = useState<BurnedNegativeNoteStats>(
    () => {
      try {
        const saved = localStorage.getItem(BURNED_NOTES_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed.burnedCount === 'number') {
            return parsed;
          }
        }
      } catch {
        // Fallback to initial stats
      }
      return getInitialBurnedNegativeStats();
    }
  );

  useEffect(() => {
    try {
      localStorage.setItem(
        BURNED_NOTES_STORAGE_KEY,
        JSON.stringify(burnedStats)
      );
    } catch {
      // Ignore storage errors
    }
  }, [burnedStats]);

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return entries.filter((entry) => {
      if (filterArea !== 'All' && entry.lifeArea !== filterArea) return false;
      if (q) {
        const inTitle = entry.title.toLowerCase().includes(q);
        const inContent = entry.content.toLowerCase().includes(q);
        const inGratitude = entry.gratitude.toLowerCase().includes(q);
        if (!inTitle && !inContent && !inGratitude) return false;
      }
      return true;
    });
  }, [entries, filterArea, searchQuery]);

  const handlePositiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    const cleanContent = content.trim();
    const cleanGratitude = gratitude.trim();
    if (!cleanTitle && !cleanContent && !cleanGratitude) return;

    const connectedGratitudeStarText =
      cleanGratitude || cleanContent || cleanTitle;

    onAddEntry({
      title: cleanTitle || `${lifeArea} Positive Note · Gratitude Star`,
      content: cleanContent,
      gratitude: connectedGratitudeStarText,
      lifeArea,
      mood,
      dateIso: getTodayIsoDate(),
    });
    setTitle('');
    setContent('');
    setGratitude('');
  };

  const handleSaveGuidedReflectionToJar = () => {
    const answeredLines = TASK_JOURNAL_GUIDED_PROMPTS.map((p) => {
      const a = guidedState.promptAnswers[p.id];
      return a && a.trim() ? `• ${p.question} → ${a.trim()}` : null;
    })
      .filter(Boolean)
      .join('\n');

    const bodyParts = [
      guidedState.justWriteText.trim()
        ? `{JUST WRITE}: ${guidedState.justWriteText.trim()}`
        : '',
      answeredLines,
    ]
      .filter(Boolean)
      .join('\n\n');

    const gratitudeLine =
      guidedState.expectedGoodThings === 'yes_ahmadullah'
        ? 'Alhamdulillah — Expected good things today & celebrated progress.'
        : guidedState.selfCareState.whatIDidForMyself ||
          'Mindful Task Journal & Self-Care Reflection';

    onAddEntry({
      title: 'Guided Task Journal, Pattern & Self-Care Check-In',
      content:
        bodyParts ||
        `Self-Care: ${guidedState.selfCareState.whatIDidForMyself} | Pattern Tackled: ${guidedState.patternState.howITackledIt}`,
      gratitude: gratitudeLine,
      lifeArea,
      mood,
      dateIso: getTodayIsoDate(),
    });
  };

  const handleCompleteNegativeBurn = (burnedArea: Category) => {
    setBurnedStats((prev) =>
      recordBurnedNegativeNote(prev, burnedArea, getTodayIsoDate())
    );
  };

  return (
    <div data-testid="journal-dashboard" className="space-y-4 @container">
      {/* Animated Gratitude Jar with Paper Stars (Connected to Positive Notes) */}
      <GratitudeJar
        entries={entries}
        selectedEntryId={highlightedStarEntryId}
        onAddGratitudeNote={onAddEntry}
      />

      {/* Daily Mood & Energy Tracker */}
      <MoodTracker entries={entries} onLogMoodCheckIn={onAddEntry} />

      {/* ===================================================================== */}
      {/* GUIDED REFLECTION STUDIO: TASK JOURNAL, PATTERNS & SELF-CARE          */}
      {/* ===================================================================== */}
      <section
        data-testid="journal-guided-prompts-studio"
        className="bg-white border border-slate-200 rounded-xl p-4 space-y-3.5 shadow-2xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
              Structured Daily Reflection Prompts
            </span>
            <h2 className="text-sm @sm:text-base font-bold text-slate-900 font-display mt-1">
              Task Journal (&ldquo;&#123;JUST WRITE&#125;&rdquo;), Procrastination Patterns &amp; Self-Care
            </h2>
          </div>

          <button
            type="button"
            data-testid="save-guided-reflection-to-jar-btn"
            onClick={handleSaveGuidedReflectionToJar}
            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Save Reflection to Gratitude Jar</span>
          </button>
        </div>

        {/* 3-Tab Switcher: Task Journal | Patterns | Self-Care (Solid Blue · Purple · Green) */}
        <div
          role="tablist"
          aria-label="Guided reflection categories"
          className="grid grid-cols-3 gap-1.5 bg-slate-100 border border-slate-200 p-1 rounded-xl"
        >
          <button
            type="button"
            role="tab"
            aria-selected={guidedTab === 'task_journal'}
            data-testid="guided-tab-task-journal"
            onClick={() => setGuidedTab('task_journal')}
            className={`py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              guidedTab === 'task_journal'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-700 hover:bg-white'
            }`}
          >
            <Brain className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Task Journal (23 Prompts)</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={guidedTab === 'patterns'}
            data-testid="guided-tab-patterns"
            onClick={() => setGuidedTab('patterns')}
            className={`py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              guidedTab === 'patterns'
                ? 'bg-purple-700 text-white shadow-2xs'
                : 'text-slate-700 hover:bg-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Patterns Breaker</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={guidedTab === 'self_care'}
            data-testid="guided-tab-self-care"
            onClick={() => setGuidedTab('self_care')}
            className={`py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              guidedTab === 'self_care'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-700 hover:bg-white'
            }`}
          >
            <Heart className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Self-Care &amp; Respect</span>
          </button>
        </div>

        {/* TAB 1: TASK JOURNAL ({JUST WRITE} + 23 QUESTIONS) */}
        {guidedTab === 'task_journal' && (
          <div
            data-testid="guided-panel-task-journal"
            className="space-y-3 pt-1"
          >
            {/* {JUST WRITE} Freeform Stream */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="task-journal-just-write"
                  className="text-xs font-bold font-mono text-slate-900"
                >
                  Task journal : &#123;JUST WRITE&#125;
                </label>
                <span className="text-[10px] font-mono text-slate-500">
                  Unfiltered stream of consciousness
                </span>
              </div>
              <textarea
                id="task-journal-just-write"
                data-testid="task-journal-just-write-input"
                rows={3}
                value={guidedState.justWriteText}
                onChange={(e) =>
                  setGuidedState((prev) => ({
                    ...prev,
                    justWriteText: e.target.value,
                  }))
                }
                placeholder="{JUST WRITE} — Dump every thought, resistance, win, or friction point from today's tasks..."
                className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-slate-400"
              />
            </div>

            {/* Did I expect good things today? [] yes | Ahmadullah [] No | why not? */}
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-emerald-950">
                  Did I expect good things today?
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    data-testid="expect-good-yes-btn"
                    onClick={() =>
                      setGuidedState((prev) => ({
                        ...prev,
                        expectedGoodThings: 'yes_ahmadullah',
                      }))
                    }
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                      guidedState.expectedGoodThings === 'yes_ahmadullah'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    [ {guidedState.expectedGoodThings === 'yes_ahmadullah' ? '✓' : ' '} ] yes | Alhamdulillah
                  </button>
                  <button
                    type="button"
                    data-testid="expect-good-no-btn"
                    onClick={() =>
                      setGuidedState((prev) => ({
                        ...prev,
                        expectedGoodThings: 'no_why_not',
                      }))
                    }
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                      guidedState.expectedGoodThings === 'no_why_not'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    [ {guidedState.expectedGoodThings === 'no_why_not' ? '✓' : ' '} ] No | why not? Is that a reason not to expect good things?
                  </button>
                </div>
              </div>

              {guidedState.expectedGoodThings === 'no_why_not' && (
                <input
                  type="text"
                  value={guidedState.expectedGoodThingsWhyNot}
                  onChange={(e) =>
                    setGuidedState((prev) => ({
                      ...prev,
                      expectedGoodThingsWhyNot: e.target.value,
                    }))
                  }
                  placeholder="Why not? Is that really a reason not to expect good things today?"
                  className="w-full text-xs bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-slate-900"
                />
              )}
            </div>

            {/* 23 Task Journal Guided Prompts */}
            <div className="grid grid-cols-1 @lg:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
              {TASK_JOURNAL_GUIDED_PROMPTS.map((p, idx) => (
                <div
                  key={p.id}
                  className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-mono font-semibold text-slate-500">
                      Q{idx + 1} · {p.section}
                    </span>
                  </div>
                  <label
                    htmlFor={`tj-${p.id}`}
                    className="block text-[11px] font-bold text-slate-800"
                  >
                    {p.question}
                  </label>
                  <input
                    id={`tj-${p.id}`}
                    type="text"
                    value={guidedState.promptAnswers[p.id] ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setGuidedState((prev) => ({
                        ...prev,
                        promptAnswers: {
                          ...prev.promptAnswers,
                          [p.id]: val,
                        },
                      }));
                    }}
                    placeholder="Reflect honestly..."
                    className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 text-slate-900"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: PATTERNS (“I should do this but before that I need…….”) */}
        {guidedTab === 'patterns' && (
          <div
            data-testid="guided-panel-patterns"
            className="bg-amber-50/50 border border-amber-200 rounded-xl p-3.5 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">
                  Pattern Interruption
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-1">
                  &ldquo;I should do this, but before that I need…….&rdquo;
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">
                  Have I caught this pattern today?
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setGuidedState((prev) => ({
                      ...prev,
                      patternState: {
                        ...prev.patternState,
                        caughtPatternToday: true,
                      },
                    }))
                  }
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer ${
                    guidedState.patternState.caughtPatternToday === true
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  [ {guidedState.patternState.caughtPatternToday === true ? '✓' : ' '} ] Yes
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setGuidedState((prev) => ({
                      ...prev,
                      patternState: {
                        ...prev.patternState,
                        caughtPatternToday: false,
                      },
                    }))
                  }
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer ${
                    guidedState.patternState.caughtPatternToday === false
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  [ {guidedState.patternState.caughtPatternToday === false ? '✓' : ' '} ] No
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-800">
                What was the exact &ldquo;I should do this, but before that I need...&rdquo; excuse?
              </label>
              <input
                type="text"
                value={guidedState.patternState.beforeThatINeedWhat}
                onChange={(e) =>
                  setGuidedState((prev) => ({
                    ...prev,
                    patternState: {
                      ...prev.patternState,
                      beforeThatINeedWhat: e.target.value,
                    },
                  }))
                }
                placeholder="I should do [X], but before that I need [Y]..."
                className="w-full text-xs bg-white border border-amber-200 rounded-lg px-3 py-2 text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-800">
                How did I tackle this pattern?
              </label>
              <input
                type="text"
                value={guidedState.patternState.howITackledIt}
                onChange={(e) =>
                  setGuidedState((prev) => ({
                    ...prev,
                    patternState: {
                      ...prev.patternState,
                      howITackledIt: e.target.value,
                    },
                  }))
                }
                placeholder="Started immediately for 2 minutes before allowing the detour..."
                className="w-full text-xs bg-white border border-amber-200 rounded-lg px-3 py-2 text-slate-900"
              />
            </div>
          </div>
        )}

        {/* TAB 3: SELF-CARE & UNCONDITIONAL SELF-RESPECT */}
        {guidedTab === 'self_care' && (
          <div
            data-testid="guided-panel-self-care"
            className="bg-emerald-50/40 border border-emerald-200 rounded-xl p-3.5 space-y-3"
          >
            <div className="grid grid-cols-1 @sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">
                  What did I do today for myself?
                </label>
                <input
                  type="text"
                  value={guidedState.selfCareState.whatIDidForMyself}
                  onChange={(e) =>
                    setGuidedState((prev) => ({
                      ...prev,
                      selfCareState: {
                        ...prev.selfCareState,
                        whatIDidForMyself: e.target.value,
                      },
                    }))
                  }
                  className="w-full text-xs bg-white border border-emerald-200 rounded-lg px-3 py-2 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">
                  What did I do today that made me feel like a better human being?
                </label>
                <input
                  type="text"
                  value={guidedState.selfCareState.whatMadeMeFeelBetterHuman}
                  onChange={(e) =>
                    setGuidedState((prev) => ({
                      ...prev,
                      selfCareState: {
                        ...prev.selfCareState,
                        whatMadeMeFeelBetterHuman: e.target.value,
                      },
                    }))
                  }
                  className="w-full text-xs bg-white border border-emerald-200 rounded-lg px-3 py-2 text-slate-900"
                />
              </div>
            </div>

            {/* Do I feel the need to do more to earn my love for myself? */}
            <div className="bg-white border border-emerald-200 rounded-lg p-3 space-y-2">
              <span className="block text-xs font-bold text-slate-900">
                Do I feel the need to do more to earn my love for myself?
              </span>
              <div className="grid grid-cols-1 @sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setGuidedState((prev) => ({
                      ...prev,
                      selfCareState: {
                        ...prev.selfCareState,
                        earnLoveForMyself: 'yes_reminder',
                      },
                    }))
                  }
                  className={`p-2 rounded-lg text-left text-xs font-bold border cursor-pointer ${
                    guidedState.selfCareState.earnLoveForMyself ===
                    'yes_reminder'
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  [ {guidedState.selfCareState.earnLoveForMyself === 'yes_reminder' ? '✓' : ' '} ] Yes | I don&apos;t need to earn it. I already deserve it from myself
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setGuidedState((prev) => ({
                      ...prev,
                      selfCareState: {
                        ...prev.selfCareState,
                        earnLoveForMyself: 'no_unconditional',
                      },
                    }))
                  }
                  className={`p-2 rounded-lg text-left text-xs font-bold border cursor-pointer ${
                    guidedState.selfCareState.earnLoveForMyself ===
                    'no_unconditional'
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  [ {guidedState.selfCareState.earnLoveForMyself === 'no_unconditional' ? '✓' : ' '} ] No | I already love myself unconditionally
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-800">
                Did I show myself respect in actions by following through my pre-planned intentions?
              </label>
              <input
                type="text"
                value={guidedState.selfCareState.showedSelfRespectInAction}
                onChange={(e) =>
                  setGuidedState((prev) => ({
                    ...prev,
                    selfCareState: {
                      ...prev.selfCareState,
                      showedSelfRespectInAction: e.target.value,
                    },
                  }))
                }
                className="w-full text-xs bg-white border border-emerald-200 rounded-lg px-3 py-2 text-slate-900"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-bold text-slate-800">
                Did I answer everything mindfully?
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setGuidedState((prev) => ({
                      ...prev,
                      selfCareState: {
                        ...prev.selfCareState,
                        answeredMindfully: 'yes',
                      },
                    }))
                  }
                  className={`px-3 py-1 rounded-lg text-xs font-bold border cursor-pointer ${
                    guidedState.selfCareState.answeredMindfully === 'yes'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  [ {guidedState.selfCareState.answeredMindfully === 'yes' ? '✓' : ' '} ] yes
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setGuidedState((prev) => ({
                      ...prev,
                      selfCareState: {
                        ...prev.selfCareState,
                        answeredMindfully: 'no',
                      },
                    }))
                  }
                  className={`px-3 py-1 rounded-lg text-xs font-bold border cursor-pointer ${
                    guidedState.selfCareState.answeredMindfully === 'no'
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  [ {guidedState.selfCareState.answeredMindfully === 'no' ? '✓' : ' '} ] No
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Header & Positive / Negative Notes Studio */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3.5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <BookText
                className="w-5 h-5 text-emerald-700"
                aria-hidden="true"
              />
              <h1 className="text-lg @sm:text-xl font-bold tracking-tight text-slate-900 font-display">
                Journal &amp; Reflection Dashboard
              </h1>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Choose between Positive Notes (which fold into paper stars inside
              your Gratitude Jar) or Negative Notes (crumpled into a ball of
              paper and burned until the smoke disappears).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              data-testid="journal-entry-count"
              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-mono font-bold"
            >
              {entries.length} Positive
            </span>
            <span
              data-testid="journal-burned-count-badge"
              className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-900 border border-rose-200 text-xs font-mono font-bold"
            >
              {burnedStats.burnedCount} Burned
            </span>
          </div>
        </div>

        {/* Polarity Mode Switcher */}
        <div
          role="group"
          aria-label="Select journal note type: Positive or Negative"
          className="grid grid-cols-1 @sm:grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200/80"
        >
          <button
            type="button"
            data-testid="journal-polarity-positive"
            aria-pressed={notePolarity === 'positive'}
            onClick={() => setNotePolarity('positive')}
            className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              notePolarity === 'positive'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-slate-700 hover:bg-white/70'
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Positive Note · Send to Gratitude Jar</span>
          </button>

          <button
            type="button"
            data-testid="journal-polarity-negative"
            aria-pressed={notePolarity === 'negative'}
            onClick={() => setNotePolarity('negative')}
            className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              notePolarity === 'negative'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-white/70'
            }`}
          >
            <Flame className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Negative Note · Crumple &amp; Burn Ball of Paper</span>
          </button>
        </div>

        {notePolarity === 'positive' ? (
          <form
            data-testid="positive-note-form"
            onSubmit={handlePositiveSubmit}
            className="bg-purple-50/50 border border-purple-200/90 rounded-xl p-3.5 space-y-2.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-purple-200/60">
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-950">
                <HeartHandshake
                  className="w-4 h-4 text-purple-600 shrink-0"
                  aria-hidden="true"
                />
                <span>
                  Positive Note Card — Connected to Animated Gratitude Star Jar
                </span>
              </div>
              <span className="text-[11px] font-mono font-semibold text-purple-800 bg-purple-100/90 px-2 py-0.5 rounded-md border border-purple-300/60">
                Auto-folds into a Paper Star (+10% Jar Fill)
              </span>
            </div>

            <div className="grid grid-cols-1 @sm:grid-cols-12 gap-2">
              <div className="@sm:col-span-6">
                <label htmlFor="journal-title-input" className="sr-only">
                  Positive note title
                </label>
                <input
                  id="journal-title-input"
                  data-testid="positive-note-title-input"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Positive highlight or breakthrough title..."
                  className="w-full text-xs bg-white border border-purple-200 rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div className="@sm:col-span-3">
                <label htmlFor="journal-area-select" className="sr-only">
                  Life Area
                </label>
                <select
                  id="journal-area-select"
                  value={lifeArea}
                  onChange={(e) => setLifeArea(e.target.value as Category)}
                  className="w-full text-xs bg-white border border-purple-200 rounded-lg px-2.5 py-2 text-slate-700 font-medium"
                >
                  {LIFE_AREAS.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>

              <div className="@sm:col-span-3">
                <label htmlFor="journal-mood-select" className="sr-only">
                  Energy / Mood
                </label>
                <select
                  id="journal-mood-select"
                  value={mood}
                  onChange={(e) => setMood(e.target.value as JournalMood)}
                  className="w-full text-xs bg-white border border-purple-200 rounded-lg px-2.5 py-2 text-slate-700 font-medium"
                >
                  {MOODS.map((m) => (
                    <option key={m} value={m}>
                      Mood: {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="journal-content-input" className="sr-only">
                Positive reflection notes
              </label>
              <textarea
                id="journal-content-input"
                data-testid="positive-note-content-input"
                rows={2}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your positive note, win, or moment of gratitude—saving this folds a new paper star into the Gratitude Jar above..."
                className="w-full text-xs bg-white border border-purple-200 rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400 resize-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="journal-gratitude-input" className="sr-only">
                Gratitude star inscription
              </label>
              <input
                id="journal-gratitude-input"
                data-testid="positive-note-gratitude-input"
                type="text"
                value={gratitude}
                onChange={(e) => setGratitude(e.target.value)}
                placeholder="Optional star quote (defaults to your positive note above)..."
                className="flex-1 min-w-[180px] text-xs bg-white border border-purple-200 rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400"
              />

              <button
                type="submit"
                data-testid="save-positive-note-btn"
                disabled={!title.trim() && !content.trim() && !gratitude.trim()}
                className="px-3.5 py-2 bg-purple-700 hover:bg-purple-800 disabled:opacity-40 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Save Positive Note &amp; Add Star to Jar</span>
              </button>
            </div>
          </form>
        ) : (
          <NegativeNoteBurner
            lifeArea={lifeArea}
            onChangeLifeArea={setLifeArea}
            burnedStats={burnedStats}
            onCompleteBurn={handleCompleteNegativeBurn}
            onSwitchToPositive={() => setNotePolarity('positive')}
          />
        )}

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="relative flex-1 min-w-[180px]">
            <Search
              className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <label htmlFor="journal-search" className="sr-only">
              Search journal entries
            </label>
            <input
              id="journal-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search positive reflections & gratitude stars..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            />
          </div>

          <select
            aria-label="Filter journal by Life Area"
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value as Category | 'All')}
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

      {/* Positive Journal Entries Feed */}
      <div className="space-y-3">
        {filteredEntries.map((entry) => (
          <article
            key={entry.id}
            data-testid={`journal-entry-${entry.id}`}
            className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  <span className="px-2 py-0.5 rounded bg-slate-900 text-white text-[10px] font-semibold">
                    {entry.lifeArea}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-semibold">
                    Positive Note
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${
                      MOOD_BADGE_STYLES[entry.mood]
                    }`}
                  >
                    {entry.mood}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" aria-hidden="true" />
                    {entry.dateIso}
                  </span>
                </div>
                <h2 className="text-sm font-bold text-slate-900">
                  {entry.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => onDeleteEntry(entry.id)}
                aria-label={`Delete journal entry "${entry.title}"`}
                className="text-slate-400 hover:text-red-600 p-1 rounded cursor-pointer shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>

            {entry.content && (
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                {entry.content}
              </p>
            )}

            {entry.gratitude && (
              <button
                type="button"
                onClick={() => setHighlightedStarEntryId(entry.id)}
                title="Click to highlight and unfold this positive note’s paper star in the Gratitude Jar"
                className="w-full text-left bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200/80 rounded-lg px-3 py-2 text-xs text-emerald-900 flex items-start justify-between gap-2 transition-colors cursor-pointer"
              >
                <span className="flex items-start gap-1.5">
                  <Sparkles
                    className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>
                    <strong>Gratitude Jar Star:</strong> {entry.gratitude}
                  </span>
                </span>
                <span className="text-[10px] font-mono font-semibold text-emerald-800 whitespace-nowrap shrink-0">
                  View in Jar ↑
                </span>
              </button>
            )}
          </article>
        ))}
      </div>
    </div>
  );
};
