import React, { useState, useMemo } from 'react';
import {
  BookText,
  Plus,
  Sparkles,
  Trash2,
  Calendar,
  Search,
} from 'lucide-react';
import {
  Category,
  LIFE_AREAS,
  JournalMood,
  JournalEntry,
  getTodayIsoDate,
} from '../utils/todoLogic';

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

const MOODS: JournalMood[] = ['Peak', 'Focused', 'Calm', 'Reflective'];

const MOOD_BADGE_STYLES: Record<JournalMood, string> = {
  Peak: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  Focused: 'bg-blue-50 text-blue-800 border-blue-200',
  Calm: 'bg-teal-50 text-teal-800 border-teal-200',
  Reflective: 'bg-amber-50 text-amber-800 border-amber-200',
};

export const JournalDashboard: React.FC<JournalDashboardProps> = ({
  entries,
  onAddEntry,
  onDeleteEntry,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [gratitude, setGratitude] = useState('');
  const [lifeArea, setLifeArea] = useState<Category>('Portfolio');
  const [mood, setMood] = useState<JournalMood>('Focused');
  const [filterArea, setFilterArea] = useState<Category | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) return;
    onAddEntry({
      title: title.trim() || `${lifeArea} Reflection`,
      content: content.trim(),
      gratitude: gratitude.trim(),
      lifeArea,
      mood,
      dateIso: getTodayIsoDate(),
    });
    setTitle('');
    setContent('');
    setGratitude('');
  };

  return (
    <div data-testid="journal-dashboard" className="space-y-4 @container">
      {/* Header & Entry Composer */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3.5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <BookText
                className="w-5 h-5 text-emerald-700"
                aria-hidden="true"
              />
              <h1 className="text-lg @sm:text-xl font-bold tracking-tight text-slate-900 font-display">
                Journal & Reflection Dashboard
              </h1>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Document daily breakthroughs, lessons learned, and gratitude
              across your 7 Life Areas.
            </p>
          </div>

          <span
            data-testid="journal-entry-count"
            className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-mono font-bold"
          >
            {entries.length} entries
          </span>
        </div>

        {/* New Journal Entry Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5"
        >
          <div className="grid grid-cols-1 @sm:grid-cols-12 gap-2">
            <div className="@sm:col-span-6">
              <label htmlFor="journal-title-input" className="sr-only">
                Journal entry title
              </label>
              <input
                id="journal-title-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Entry title or key takeaway..."
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400"
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
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 font-medium"
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
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 font-medium"
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
              Reflection notes
            </label>
            <textarea
              id="journal-content-input"
              rows={2}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your reflection, synthesis notes, or progress observations..."
              className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400 resize-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="journal-gratitude-input" className="sr-only">
              Gratitude or daily win
            </label>
            <input
              id="journal-gratitude-input"
              type="text"
              value={gratitude}
              onChange={(e) => setGratitude(e.target.value)}
              placeholder="Gratitude or key win today..."
              className="flex-1 min-w-[180px] text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400"
            />

            <button
              type="submit"
              disabled={!title.trim() && !content.trim()}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Save Journal Entry</span>
            </button>
          </div>
        </form>

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
              placeholder="Search reflections & gratitude..."
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

      {/* Journal Entries Feed */}
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
              <p className="text-xs text-slate-700 leading-relaxed">
                {entry.content}
              </p>
            )}

            {entry.gratitude && (
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-lg px-3 py-2 text-xs text-emerald-900 flex items-start gap-1.5">
                <Sparkles
                  className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span>
                  <strong>Gratitude / Win:</strong> {entry.gratitude}
                </span>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
};
