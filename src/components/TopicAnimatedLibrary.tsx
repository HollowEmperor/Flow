import React, { useState, useRef, useEffect } from 'react';
import {
  BookOpen,
  FileText,
  Upload,
  Plus,
  Check,
  Trash2,
  ExternalLink,
  Library,
  Sparkles,
  Monitor,
} from 'lucide-react';
import {
  TopicItem,
  TopicResource,
  TopicResourceType,
} from '../utils/todoLogic';

interface TopicAnimatedLibraryProps {
  topic: TopicItem;
  topics?: TopicItem[];
  onSelectTopic?: (topicId: string) => void;
  onAddResource: (
    topicId: string,
    resource: {
      title: string;
      type: TopicResourceType;
      url: string;
      fileName?: string;
      fileSizeLabel?: string;
    }
  ) => void;
  onToggleResource: (topicId: string, resourceId: string) => void;
  onDeleteResource: (topicId: string, resourceId: string) => void;
  onOpenVideoOnMonitor?: (resourceId: string) => void;
}

const RESOURCE_TYPES: TopicResourceType[] = [
  'PDF',
  'Book',
  'Article',
  'YouTube',
  'Udemy',
  'App',
];

interface SpinePalette {
  spineBg: string;
  spineBorder: string;
  edgeColor: string;
  bandColor: string;
  badgeBg: string;
  badgeText: string;
}

// Solid Flat Green · Blue · Purple Analogous Triad Bookbinding Palettes (Zero Gradients)
const SPINE_PALETTES: SpinePalette[] = [
  {
    spineBg: '#5B21B6', // Deep Purple
    spineBorder: '#7C3AED',
    edgeColor: '#2E1065',
    bandColor: '#34D399',
    badgeBg: '#2E1065',
    badgeText: '#DDD6FE',
  },
  {
    spineBg: '#1D4ED8', // Royal Blue
    spineBorder: '#3B82F6',
    edgeColor: '#172554',
    bandColor: '#60A5FA',
    badgeBg: '#172554',
    badgeText: '#DBEAFE',
  },
  {
    spineBg: '#047857', // Emerald Green
    spineBorder: '#10B981',
    edgeColor: '#022C22',
    bandColor: '#A7F3D0',
    badgeBg: '#022C22',
    badgeText: '#D1FAE5',
  },
  {
    spineBg: '#6D28D9', // Amethyst Purple
    spineBorder: '#8B5CF6',
    edgeColor: '#3B0764',
    bandColor: '#93C5FD',
    badgeBg: '#3B0764',
    badgeText: '#F3E8FF',
  },
  {
    spineBg: '#2563EB', // Cobalt Blue
    spineBorder: '#60A5FA',
    edgeColor: '#1E3A8A',
    bandColor: '#34D399',
    badgeBg: '#1E3A8A',
    badgeText: '#EFF6FF',
  },
  {
    spineBg: '#059669', // Forest Emerald
    spineBorder: '#34D399',
    edgeColor: '#064E3B',
    bandColor: '#C4B5FD',
    badgeBg: '#064E3B',
    badgeText: '#ECFDF5',
  },
];

function getSpineShortTypeLabel(type: TopicResourceType): string {
  switch (type) {
    case 'PDF':
      return 'PDF';
    case 'Book':
      return 'BOOK';
    case 'YouTube':
      return 'YT';
    case 'Udemy':
      return 'UDM';
    case 'App':
      return 'APP';
    case 'Article':
    default:
      return 'LINK';
  }
}

function getBookHeightPx(title: string, idx: number): number {
  const baseHeights = [196, 210, 188, 216, 202, 192];
  const charBonus = Math.min(12, (title.length % 5) * 3);
  return baseHeights[idx % baseHeights.length] + charBonus;
}

export const TopicAnimatedLibrary: React.FC<TopicAnimatedLibraryProps> = ({
  topic,
  topics,
  onSelectTopic,
  onAddResource,
  onToggleResource,
  onDeleteResource,
  onOpenVideoOnMonitor,
}) => {
  const [selectedBookId, setSelectedBookId] = useState<string | null>(
    () => topic.resources[topic.resources.length - 1]?.id ?? null
  );
  const [resType, setResType] = useState<TopicResourceType>('PDF');
  const [resTitle, setResTitle] = useState('');
  const [resUrl, setResUrl] = useState('');
  const [isDraggingPdfOver, setIsDraggingPdfOver] = useState(false);
  const [justShelvedToast, setJustShelvedToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync selected book when topic changes or when a new book is added
  const prevCountRef = useRef<number>(topic.resources.length);
  const prevTopicIdRef = useRef<string>(topic.id);

  useEffect(() => {
    if (topic.id !== prevTopicIdRef.current) {
      prevTopicIdRef.current = topic.id;
      prevCountRef.current = topic.resources.length;
      setSelectedBookId(
        topic.resources[topic.resources.length - 1]?.id ?? null
      );
      return;
    }

    if (topic.resources.length > prevCountRef.current) {
      const newest = topic.resources[topic.resources.length - 1];
      if (newest) {
        setSelectedBookId(newest.id);
      }
      prevCountRef.current = topic.resources.length;
      return;
    }

    prevCountRef.current = topic.resources.length;
    if (
      selectedBookId &&
      !topic.resources.some((r) => r.id === selectedBookId)
    ) {
      setSelectedBookId(
        topic.resources[topic.resources.length - 1]?.id ?? null
      );
    }
  }, [topic.id, topic.resources, selectedBookId]);

  const selectedBook: TopicResource | null =
    topic.resources.find((r) => r.id === selectedBookId) ??
    topic.resources[topic.resources.length - 1] ??
    null;

  const triggerShelvedToast = (bookName: string) => {
    setJustShelvedToast(`Generated book spine for "${bookName}" on the shelf!`);
    window.setTimeout(() => {
      setJustShelvedToast(null);
    }, 3400);
  };

  // Directly generate a book on the shelf from one or more uploaded/dropped PDF files
  const handlePdfFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const rawName = file.name || 'Uploaded_Document.pdf';
      const cleanBookTitle = rawName
        .replace(/\.pdf$/i, '')
        .replace(/[-_]+/g, ' ')
        .trim();
      const sizeKb = Math.max(1, Math.round(file.size / 1024));
      const sizeLabel =
        sizeKb >= 1024
          ? `${(sizeKb / 1024).toFixed(1)} MB PDF`
          : `${sizeKb} KB PDF`;

      let objectUrl = `https://library.focusflow.local/${encodeURIComponent(rawName)}`;
      try {
        if (typeof URL !== 'undefined' && URL.createObjectURL) {
          objectUrl = URL.createObjectURL(file);
        }
      } catch {
        // Fallback URL
      }

      onAddResource(topic.id, {
        title: cleanBookTitle || rawName,
        type: 'PDF',
        url: objectUrl,
        fileName: rawName,
        fileSizeLabel: sizeLabel,
      });

      triggerShelvedToast(cleanBookTitle || rawName);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleManualAddBookOrPdf = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = resTitle.trim();
    const trimmedUrl = resUrl.trim();

    if (!trimmedTitle && !trimmedUrl) return;

    const finalTitle =
      trimmedTitle ||
      trimmedUrl
        .split('/')
        .pop()
        ?.replace(/\.pdf$/i, '')
        .replace(/[-_]+/g, ' ') ||
      'Untitled Resource';

    const slug = finalTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const finalUrl =
      trimmedUrl ||
      (resType === 'PDF'
        ? `https://library.focusflow.local/${slug || 'document'}.pdf`
        : `https://library.focusflow.local/${slug || 'resource'}`);

    const isPdfDetected =
      resType === 'PDF' ||
      finalUrl.toLowerCase().endsWith('.pdf') ||
      finalTitle.toLowerCase().endsWith('.pdf');

    onAddResource(topic.id, {
      title: finalTitle,
      type: isPdfDetected ? 'PDF' : resType,
      url: finalUrl,
      fileName: isPdfDetected
        ? finalTitle.endsWith('.pdf')
          ? finalTitle
          : `${finalTitle}.pdf`
        : undefined,
      fileSizeLabel: isPdfDetected ? 'PDF Volume' : undefined,
    });

    triggerShelvedToast(finalTitle);
    setResTitle('');
    setResUrl('');
  };

  const handleShelfDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isDraggingPdfOver) {
      setIsDraggingPdfOver(true);
    }
  };

  const handleShelfDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingPdfOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handlePdfFilesSelected(e.dataTransfer.files);
    }
  };

  const completedCount = topic.resources.filter((r) => r.completed).length;

  return (
    <section
      aria-label="Animated Topic Resource Library"
      data-testid="topic-animated-library"
      className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4 shadow-2xs"
    >
      {/* Library Header & Topic Switcher (if multiple topics passed) */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Library
              className="w-5 h-5 text-purple-700 shrink-0"
              aria-hidden="true"
            />
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 font-display">
              Animated Topic Library — Spine Bookshelf
            </h2>
            <span
              data-testid="library-book-count"
              className="text-xs font-mono tabular-nums font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-md px-2 py-0.5"
            >
              {topic.resources.length}{' '}
              {topic.resources.length === 1 ? 'Book' : 'Books'} on Shelf
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Upload a PDF or add any book/link to directly generate a standing
            book on the shelf—only the vertical spine is visible with the name
            of your book, PDF, or link printed along the spine.
          </p>
        </div>

        {/* Direct PDF Upload Button -> Immediately Generates a Book */}
        <div className="flex items-center gap-2 shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            data-testid="library-pdf-file-input"
            onChange={(e) => handlePdfFilesSelected(e.target.files)}
            className="hidden"
          />
          <button
            type="button"
            data-testid="upload-pdf-generate-book-btn"
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Upload PDF → Generate Book</span>
          </button>
        </div>
      </div>

      {/* Optional Topic Selector Strip when shown on the main Topic Dashboard overview */}
      {topics && topics.length > 1 && onSelectTopic && (
        <div
          role="group"
          aria-label="Select topic bookshelf"
          className="flex flex-wrap items-center gap-1.5 pt-1"
        >
          <span className="text-[11px] font-semibold text-slate-500 mr-1">
            Shelf Topic:
          </span>
          {topics.map((t) => {
            const isActive = t.id === topic.id;
            return (
              <button
                key={t.id}
                type="button"
                data-testid={`library-topic-tab-${t.id}`}
                onClick={() => onSelectTopic(t.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {t.title} ({t.resources.length})
              </button>
            );
          })}
        </div>
      )}

      {/* Confirmation Banner when a new PDF/Book is shelved */}
      {justShelvedToast && (
        <div
          role="status"
          data-testid="library-shelved-toast"
          className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl px-3.5 py-2 text-xs font-semibold flex items-center justify-between gap-2"
        >
          <span className="flex items-center gap-1.5">
            <Sparkles
              className="w-4 h-4 text-emerald-600 shrink-0"
              aria-hidden="true"
            />
            <span>{justShelvedToast}</span>
          </span>
          <span className="font-mono text-[11px] text-emerald-700">
            Spine Added ↓
          </span>
        </div>
      )}

      {/* Main Two-Column Library Stage: 1. Spine-Only Bookshelf + 2. Pulled-Out Book Inspector */}
      <div className="grid grid-cols-1 @xl:grid-cols-12 gap-4 items-stretch">
        {/* Left / Center (7 cols): Dark Slate Library Bookshelf Where Only Book Spines Are Visible */}
        <div
          data-testid="library-bookshelf-stage"
          onDragOver={handleShelfDragOver}
          onDragLeave={() => setIsDraggingPdfOver(false)}
          onDrop={handleShelfDrop}
          className={`@xl:col-span-7 bg-slate-900 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden min-h-[288px] border transition-colors ${
            isDraggingPdfOver
              ? 'border-emerald-400 ring-2 ring-emerald-400/30'
              : 'border-slate-800'
          }`}
        >
          {/* Top Shelf Header Bar */}
          <div className="flex items-center justify-between gap-2 text-[11px] font-mono tabular-nums text-slate-300 z-10">
            <span className="truncate font-semibold text-white">
              {topic.lifeArea.toUpperCase()} SHELF · {topic.title}
            </span>
            <span className="text-emerald-400 shrink-0">
              {completedCount}/{topic.resources.length} Read
            </span>
          </div>

          {/* Bookshelf Row: Standing Books with ONLY Spines Visible */}
          <div className="flex-1 flex flex-col justify-end pt-6 pb-1 z-10">
            {topic.resources.length > 0 ? (
              <div
                role="list"
                aria-label="Bookshelf spines"
                data-testid="library-spines-row"
                className="flex items-end gap-2.5 overflow-x-auto px-3 pt-5 pb-0.5 min-h-[228px]"
              >
                {topic.resources.map((res, idx) => {
                  const palette = SPINE_PALETTES[idx % SPINE_PALETTES.length];
                  const isSelected = selectedBook?.id === res.id;
                  const heightPx = getBookHeightPx(res.title, idx);
                  const shortType = getSpineShortTypeLabel(res.type);

                  return (
                    <button
                      key={res.id}
                      type="button"
                      role="listitem"
                      data-testid={`library-book-spine-${res.id}`}
                      onClick={() => setSelectedBookId(res.id)}
                      aria-pressed={isSelected}
                      aria-label={`${res.type} book spine: ${res.title}`}
                      title={`${res.title} (${res.type}) — Click spine to inspect or open`}
                      style={
                        {
                          height: `${heightPx}px`,
                          backgroundColor: palette.spineBg,
                          borderColor: palette.spineBorder,
                          '--spine-edge-color': palette.edgeColor,
                          animationDelay: `${Math.min(idx * 45, 240)}ms`,
                        } as React.CSSProperties
                      }
                      className={`css-library-book-spine ${
                        isSelected ? 'is-selected' : ''
                      } w-11 sm:w-12 shrink-0 rounded-t-[4px] rounded-b-[2px] border flex flex-col items-center justify-between py-2 px-1 text-white cursor-pointer select-none focus:outline-none`}
                    >
                      {/* Top Bookbinding Headcap & Resource Type Tag */}
                      <div className="w-full flex flex-col items-center gap-1 shrink-0">
                        <span
                          style={{ backgroundColor: palette.bandColor }}
                          className="w-full h-[2px] rounded-full opacity-90"
                        />
                        <span
                          style={{
                            backgroundColor: palette.badgeBg,
                            color: palette.badgeText,
                          }}
                          className="text-[8px] font-mono font-bold uppercase tracking-tighter px-1 py-0.5 rounded-[2px] leading-none"
                        >
                          {shortType}
                        </span>
                      </div>

                      {/* Vertical Spine Title: The Name of the Book / PDF / Link */}
                      <div className="flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden py-1.5">
                        <span
                          data-testid={`library-spine-title-${res.id}`}
                          className="css-spine-vertical-title text-[10.5px] font-bold tracking-wide text-white font-display leading-none max-h-full truncate"
                        >
                          {res.title}
                        </span>
                      </div>

                      {/* Bottom Bookbinding Tailband & Call Number / Read Stamp */}
                      <div className="w-full flex flex-col items-center gap-1 shrink-0">
                        <span
                          className={`text-[9px] font-mono tabular-nums font-bold leading-none px-1 py-0.5 rounded-[2px] ${
                            res.completed
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-black/25 text-slate-200'
                          }`}
                        >
                          {res.completed
                            ? '✓'
                            : String(idx + 1).padStart(2, '0')}
                        </span>
                        <span
                          style={{ backgroundColor: palette.bandColor }}
                          className="w-full h-[2px] rounded-full opacity-90"
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <BookOpen
                  className="w-7 h-7 text-slate-500 mb-1.5"
                  aria-hidden="true"
                />
                <p className="text-xs font-semibold text-slate-300">
                  This topic shelf is empty
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Upload a PDF or add a link below to generate your first
                  standing book spine.
                </p>
              </div>
            )}

            {/* Architectural Solid Library Shelf Plank */}
            <div
              aria-hidden="true"
              className="w-full h-4 bg-slate-800 border-t-2 border-blue-500/60 border-b border-slate-950 rounded-xs shadow-md"
            />
          </div>

          {/* Bottom Shelf Caption */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 z-10">
            <span>
              Hover or click any spine to pull the book from the shelf
            </span>
            <span className="font-mono">Drop .PDF anywhere on shelf</span>
          </div>
        </div>

        {/* Right (5 cols): Pulled-Off-Shelf 3D Book Inspector & Reader Card */}
        <div className="@xl:col-span-5 flex flex-col justify-between">
          {selectedBook ? (
            <div
              key={selectedBook.id}
              data-testid="library-selected-book-card"
              className="css-open-book-inspector flex-1 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <FileText
                      className="w-3.5 h-3.5 text-purple-700 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="font-bold text-purple-800">
                      {selectedBook.type} Volume
                    </span>
                    {selectedBook.fileSizeLabel && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-[11px]">
                          {selectedBook.fileSizeLabel}
                        </span>
                      </>
                    )}
                  </div>

                  <span className="font-mono text-[11px] text-slate-500">
                    Spine #
                    {String(
                      topic.resources.findIndex(
                        (r) => r.id === selectedBook.id
                      ) + 1
                    ).padStart(2, '0')}
                  </span>
                </div>

                {/* Book Cover Title Block */}
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Spine Inscription &amp; Title
                  </div>
                  <h3
                    data-testid="library-selected-book-title"
                    className="text-sm sm:text-base font-bold text-slate-900 font-display leading-snug break-words"
                  >
                    {selectedBook.title}
                  </h3>
                  {selectedBook.fileName && (
                    <p className="text-[11px] font-mono text-purple-700 truncate">
                      File: {selectedBook.fileName}
                    </p>
                  )}
                  <p className="text-[11px] font-mono text-slate-500 truncate">
                    {selectedBook.url}
                  </p>
                </div>

                {/* Inline PDF Preview if it's a blob: or data: PDF */}
                {selectedBook.type === 'PDF' &&
                  (selectedBook.url.startsWith('blob:') ||
                    selectedBook.url.startsWith('data:')) && (
                    <div className="rounded-lg border border-slate-200 overflow-hidden bg-slate-900 h-32">
                      <iframe
                        src={selectedBook.url}
                        title={`PDF Preview: ${selectedBook.title}`}
                        className="w-full h-full border-0"
                      />
                    </div>
                  )}
              </div>

              {/* Book Actions: Open PDF/Link, Mark Read, Delete */}
              <div className="space-y-2 pt-2 border-t border-slate-200/80">
                <div className="flex flex-wrap items-center gap-2">
                  {(selectedBook.type === 'YouTube' ||
                    selectedBook.type === 'Udemy') &&
                  onOpenVideoOnMonitor ? (
                    <button
                      type="button"
                      data-testid="library-open-on-pc-monitor-btn"
                      onClick={() => onOpenVideoOnMonitor(selectedBook.id)}
                      className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Monitor className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Open on PC Monitor</span>
                    </button>
                  ) : (
                    <a
                      href={selectedBook.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid="library-open-book-link"
                      className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                    >
                      <span>
                        Open{' '}
                        {selectedBook.type === 'PDF' ? 'PDF Book' : 'Resource'}
                      </span>
                      <ExternalLink
                        className="w-3.5 h-3.5"
                        aria-hidden="true"
                      />
                    </a>
                  )}

                  <button
                    type="button"
                    data-testid="library-toggle-complete-btn"
                    onClick={() =>
                      onToggleResource(topic.id, selectedBook.id)
                    }
                    className={`py-2 px-3 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 border transition-colors cursor-pointer whitespace-nowrap ${
                      selectedBook.completed
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white hover:bg-emerald-50 text-slate-800 border-slate-200'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>
                      {selectedBook.completed ? 'Completed' : 'Mark Read'}
                    </span>
                  </button>

                  <button
                    type="button"
                    data-testid="library-delete-book-btn"
                    onClick={() =>
                      onDeleteResource(topic.id, selectedBook.id)
                    }
                    aria-label={`Remove "${selectedBook.title}" from library`}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col items-center justify-center text-center">
              <BookOpen
                className="w-6 h-6 text-slate-400 mb-1.5"
                aria-hidden="true"
              />
              <p className="text-xs font-semibold text-slate-800">
                Select any book spine on the left
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Click a spine to inspect its details, mark it read, or open the
                PDF/link.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add PDF / Book / Link Directly to the Library Shelf */}
      <form
        onSubmit={handleManualAddBookOrPdf}
        aria-label="Add a PDF, Book, or Link to generate a spine on the library shelf"
        className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-800">
            Add PDF, Book, or Link to Shelf (Directly Generates Spine)
          </span>
          <span className="text-[11px] text-slate-500">
            Tip: Leave URL blank when adding a PDF/Book title to auto-generate
            a shelf volume
          </span>
        </div>

        <div className="grid grid-cols-1 @sm:grid-cols-12 gap-2">
          <div className="@sm:col-span-2">
            <label htmlFor="library-res-type" className="sr-only">
              Resource format
            </label>
            <select
              id="library-res-type"
              data-testid="library-res-type-select"
              value={resType}
              onChange={(e) =>
                setResType(e.target.value as TopicResourceType)
              }
              className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-blue-600"
            >
              {RESOURCE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="@sm:col-span-5">
            <label htmlFor="library-res-title" className="sr-only">
              Book, PDF, or Link Name (displayed on spine)
            </label>
            <input
              id="library-res-title"
              data-testid="library-res-title-input"
              type="text"
              value={resTitle}
              onChange={(e) => setResTitle(e.target.value)}
              placeholder="Book / PDF / Link name for spine (e.g., Clean Architecture.pdf)"
              className="w-full text-xs text-slate-900 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="@sm:col-span-3">
            <label htmlFor="library-res-url" className="sr-only">
              PDF path or Link URL
            </label>
            <input
              id="library-res-url"
              data-testid="library-res-url-input"
              type="text"
              value={resUrl}
              onChange={(e) => setResUrl(e.target.value)}
              placeholder="Optional URL or .pdf link..."
              className="w-full text-xs font-mono text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="@sm:col-span-2">
            <button
              type="submit"
              data-testid="library-add-spine-btn"
              disabled={!resTitle.trim() && !resUrl.trim()}
              className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Shelve Book</span>
            </button>
          </div>
        </div>
      </form>
    </section>
  );
};
