import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Excalidraw,
  MainMenu,
  WelcomeScreen,
  convertToExcalidrawElements,
  serializeAsJSON,
} from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import {
  PenTool,
  Plus,
  Layers,
  Download,
  Sparkles,
  CheckCircle2,
  FolderKanban,
  Maximize2,
  Minimize2,
  Scan,
} from 'lucide-react';
import {
  Category,
  LIFE_AREAS,
  Priority,
  TodoItem,
  TopicItem,
  ExcalidrawTemplateKey,
  getTodayIsoDate,
} from '../utils/todoLogic';

interface ExcalidrawPlanDashboardProps {
  todos: TodoItem[];
  topics: TopicItem[];
  onAddTodoFromCanvas: (params: {
    title: string;
    notes: string;
    priority: Priority;
    category: Category;
    dueDate: string;
    isRepeating: boolean;
  }) => void;
}

interface BoardPreset {
  id: string;
  title: string;
  lifeArea: Category;
  templateKey: ExcalidrawTemplateKey;
  description: string;
}

const INITIAL_BOARD_PRESETS: BoardPreset[] = [
  {
    id: 'board-architecture',
    title: '7 Life Areas Master Plan',
    lifeArea: 'Portfolio',
    templateKey: 'life_architecture',
    description:
      'Visual Excalidraw blueprint connecting Portfolio, Knowledge, Strength, and Daily Execution.',
  },
  {
    id: 'board-sprint',
    title: 'Weekly Sprint Flow',
    lifeArea: 'Knowledge',
    templateKey: 'sprint_flow',
    description:
      'Visual pipeline from Brain Dump → Priority Queue → Deep Work Block → MemoSpike Done.',
  },
  {
    id: 'board-system',
    title: 'System RFC Sketch',
    lifeArea: 'Portfolio',
    templateKey: 'system_design',
    description:
      'Hand-drawn system architecture diagram with Leader, Follower nodes, and WAL replication.',
  },
];

function buildInitialExcalidrawElements(
  templateKey: ExcalidrawTemplateKey,
  todos: TodoItem[],
  topics: TopicItem[]
) {
  if (templateKey === 'sprint_flow') {
    const topTasks = todos.filter((t) => !t.completed).slice(0, 3);
    return convertToExcalidrawElements([
      {
        type: 'rectangle',
        id: 'sprint-header',
        x: 60,
        y: 35,
        width: 220,
        height: 74,
        backgroundColor: '#fef3c7',
        strokeColor: '#d97706',
        fillStyle: 'solid',
        label: {
          text: '1. Weekly Brain Dump\nCapture Raw Ideas',
          fontSize: 15,
        },
      },
      {
        type: 'rectangle',
        id: 'sprint-focus',
        x: 345,
        y: 35,
        width: 225,
        height: 74,
        backgroundColor: '#dcfce7',
        strokeColor: '#15803d',
        fillStyle: 'solid',
        label: {
          text: '2. DoteTimer 50m\nDeep Work Execution',
          fontSize: 15,
        },
      },
      {
        type: 'rectangle',
        id: 'sprint-spike',
        x: 635,
        y: 35,
        width: 220,
        height: 74,
        backgroundColor: '#e0f2fe',
        strokeColor: '#0369a1',
        fillStyle: 'solid',
        label: {
          text: '3. MemoSpike Spindle\nImpale Completed Slips',
          fontSize: 15,
        },
      },
      {
        type: 'arrow',
        x: 285,
        y: 72,
        width: 55,
        height: 0,
        strokeColor: '#475569',
      },
      {
        type: 'arrow',
        x: 575,
        y: 72,
        width: 55,
        height: 0,
        strokeColor: '#475569',
      },
      ...topTasks.map((task, idx) => ({
        type: 'rectangle' as const,
        x: 60 + idx * 270,
        y: 145,
        width: 235,
        height: 78,
        backgroundColor: '#fffbeb',
        strokeColor: '#b45309',
        fillStyle: 'solid' as const,
        label: {
          text: `[${task.category}]\n${task.title.slice(0, 26)}`,
          fontSize: 14,
        },
      })),
    ]);
  }

  if (templateKey === 'system_design') {
    return convertToExcalidrawElements([
      {
        type: 'ellipse',
        x: 50,
        y: 80,
        width: 150,
        height: 78,
        backgroundColor: '#e0e7ff',
        strokeColor: '#4338ca',
        fillStyle: 'solid',
        label: {
          text: 'API Gateway\nIngress',
          fontSize: 15,
        },
      },
      {
        type: 'rectangle',
        x: 265,
        y: 75,
        width: 205,
        height: 86,
        backgroundColor: '#fef3c7',
        strokeColor: '#b45309',
        fillStyle: 'solid',
        label: {
          text: 'Raft Leader Node\nConsensus Engine',
          fontSize: 15,
        },
      },
      {
        type: 'rectangle',
        x: 540,
        y: 30,
        width: 195,
        height: 72,
        backgroundColor: '#dcfce7',
        strokeColor: '#15803d',
        fillStyle: 'solid',
        label: {
          text: 'Follower Replica A\nAppendEntries WAL',
          fontSize: 14,
        },
      },
      {
        type: 'rectangle',
        x: 540,
        y: 135,
        width: 195,
        height: 72,
        backgroundColor: '#dcfce7',
        strokeColor: '#15803d',
        fillStyle: 'solid',
        label: {
          text: 'Follower Replica B\nAppendEntries WAL',
          fontSize: 14,
        },
      },
      {
        type: 'arrow',
        x: 205,
        y: 118,
        width: 55,
        height: 0,
        strokeColor: '#334155',
      },
      {
        type: 'arrow',
        x: 475,
        y: 105,
        width: 60,
        height: -35,
        strokeColor: '#15803d',
      },
      {
        type: 'arrow',
        x: 475,
        y: 135,
        width: 60,
        height: 35,
        strokeColor: '#15803d',
      },
    ]);
  }

  // Default: 'life_architecture'
  const primaryTopic = topics[0]?.title ?? 'System Design';
  return convertToExcalidrawElements([
    {
      type: 'diamond',
      x: 305,
      y: 25,
      width: 240,
      height: 110,
      backgroundColor: '#fef3c7',
      strokeColor: '#d97706',
      fillStyle: 'solid',
      label: {
        text: 'FocusFlow Plan Hub\n7 Life Areas',
        fontSize: 15,
      },
    },
    {
      type: 'rectangle',
      x: 35,
      y: 165,
      width: 235,
      height: 82,
      backgroundColor: '#dbeafe',
      strokeColor: '#1d4ed8',
      fillStyle: 'solid',
      label: {
        text: `Portfolio & Code\n${primaryTopic.slice(0, 18)}`,
        fontSize: 14,
      },
    },
    {
      type: 'rectangle',
      x: 308,
      y: 165,
      width: 235,
      height: 82,
      backgroundColor: '#dcfce7',
      strokeColor: '#15803d',
      fillStyle: 'solid',
      label: {
        text: 'Strength & Vitality\nRings & Mobility 5x/wk',
        fontSize: 14,
      },
    },
    {
      type: 'rectangle',
      x: 580,
      y: 165,
      width: 235,
      height: 82,
      backgroundColor: '#fce7f3',
      strokeColor: '#be185d',
      fillStyle: 'solid',
      label: {
        text: 'Knowledge & Karma\nMentorship & Reading',
        fontSize: 14,
      },
    },
    {
      type: 'arrow',
      x: 350,
      y: 120,
      width: -160,
      height: 42,
      strokeColor: '#475569',
    },
    {
      type: 'arrow',
      x: 425,
      y: 135,
      width: 0,
      height: 28,
      strokeColor: '#475569',
    },
    {
      type: 'arrow',
      x: 505,
      y: 120,
      width: 170,
      height: 42,
      strokeColor: '#475569',
    },
  ]);
}

export const ExcalidrawPlanDashboard: React.FC<
  ExcalidrawPlanDashboardProps
> = ({ todos, topics, onAddTodoFromCanvas }) => {
  const [boards, setBoards] = useState<BoardPreset[]>(INITIAL_BOARD_PRESETS);
  const [activeBoardId, setActiveBoardId] = useState<string>(
    INITIAL_BOARD_PRESETS[0].id
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const [isExpandedCanvas, setIsExpandedCanvas] = useState<boolean>(false);
  const [elementCount, setElementCount] = useState<number>(7);

  // Quick Sticky Note -> Canvas + Task List state
  const [stickyText, setStickyText] = useState<string>('');
  const [stickyCategory, setStickyCategory] = useState<Category>('Portfolio');
  const [stickyPriority, setStickyPriority] = useState<Priority>('high');
  const [newBoardTitle, setNewBoardTitle] = useState<string>('');
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const activeBoard = useMemo(
    () => boards.find((b) => b.id === activeBoardId) ?? boards[0],
    [boards, activeBoardId]
  );

  const initialData = useMemo(() => {
    const seededElements = buildInitialExcalidrawElements(
      activeBoard.templateKey,
      todos,
      topics
    );
    return {
      elements: seededElements,
      appState: {
        viewBackgroundColor: '#f8fafc',
        currentItemFontFamily: 1,
      },
      scrollToContent: true,
    };
  }, [activeBoard.id, activeBoard.templateKey]);

  const handleFitCanvasToViewport = useCallback(() => {
    if (!excalidrawAPI) return;
    try {
      const els = excalidrawAPI.getSceneElements();
      if (els && els.length > 0) {
        excalidrawAPI.scrollToContent(els, {
          fitToViewport: true,
          viewportZoomFactor: 0.88,
          animate: false,
        });
      }
    } catch {
      // Ignore if canvas is still mounting
    }
  }, [excalidrawAPI]);

  // Automatically fit the Excalidraw scene inside the viewport whenever API mounts or board changes
  useEffect(() => {
    if (!excalidrawAPI) return;
    const t = window.setTimeout(() => {
      handleFitCanvasToViewport();
    }, 180);
    return () => window.clearTimeout(t);
  }, [excalidrawAPI, activeBoard.id, isExpandedCanvas, handleFitCanvasToViewport]);

  const showTempBanner = (msg: string) => {
    setStatusBanner(msg);
    window.setTimeout(() => {
      setStatusBanner(null);
    }, 3200);
  };

  // Stamp active FocusFlow tasks directly onto the Excalidraw canvas and fit to canvas
  const handleStampActiveTasksOntoCanvas = () => {
    if (!excalidrawAPI) return;
    const currentElements = excalidrawAPI.getSceneElements() ?? [];
    const activeTasks = todos.filter((t) => !t.completed).slice(0, 4);
    if (activeTasks.length === 0) {
      showTempBanner('All tasks are already completed!');
      return;
    }

    const stampedSkeletons = activeTasks.map((task, idx) => ({
      type: 'rectangle' as const,
      x: 35 + idx * 200,
      y: 270,
      width: 190,
      height: 70,
      backgroundColor: '#fef9c3',
      strokeColor: '#ca8a04',
      fillStyle: 'solid' as const,
      label: {
        text: `TODO · ${task.category}\n${task.title.slice(0, 22)}`,
        fontSize: 13,
      },
    }));

    const newEls = convertToExcalidrawElements(stampedSkeletons);
    const combined = [...currentElements, ...newEls];
    excalidrawAPI.updateScene({
      elements: combined,
    });
    setElementCount(combined.length);
    window.setTimeout(() => {
      handleFitCanvasToViewport();
    }, 80);
    showTempBanner(
      `Stamped ${newEls.length} active FocusFlow task nodes and fitted canvas.`
    );
  };

  // Create a sticky note on the Excalidraw canvas AND push it to FocusFlow Tasks
  const handleAddStickyAndTask = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = stickyText.trim();
    if (!clean) return;

    onAddTodoFromCanvas({
      title: clean,
      notes: `Created from Excalidraw Plan Dashboard (${activeBoard.title})`,
      priority: stickyPriority,
      category: stickyCategory,
      dueDate: getTodayIsoDate(),
      isRepeating: false,
    });

    if (excalidrawAPI) {
      const currentElements = excalidrawAPI.getSceneElements() ?? [];
      const offset = (currentElements.length % 4) * 45;
      const stickyEl = convertToExcalidrawElements([
        {
          type: 'rectangle',
          x: 180 + offset,
          y: 120 + offset,
          width: 220,
          height: 80,
          backgroundColor: '#dcfce7',
          strokeColor: '#15803d',
          fillStyle: 'solid',
          label: {
            text: `[${stickyCategory}] ${clean.slice(0, 24)}`,
            fontSize: 14,
          },
        },
      ]);
      const combined = [...currentElements, ...stickyEl];
      excalidrawAPI.updateScene({
        elements: combined,
      });
      setElementCount(combined.length);
      window.setTimeout(() => {
        handleFitCanvasToViewport();
      }, 80);
    }

    setStickyText('');
    showTempBanner(
      `Added "${clean}" to Excalidraw canvas & FocusFlow ${stickyCategory} tasks!`
    );
  };

  const handleCreateNewBoard = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newBoardTitle.trim();
    if (!clean) return;
    const created: BoardPreset = {
      id: `board-${Date.now()}`,
      title: clean,
      lifeArea: stickyCategory,
      templateKey: 'life_architecture',
      description: `Custom Excalidraw visual planning board for ${stickyCategory}.`,
    };
    setBoards((prev) => [created, ...prev]);
    setActiveBoardId(created.id);
    setNewBoardTitle('');
    showTempBanner(`Created new Excalidraw board: "${clean}"`);
  };

  const handleExportExcalidrawJson = () => {
    if (!excalidrawAPI) return;
    const elements = excalidrawAPI.getSceneElements();
    const appState = excalidrawAPI.getAppState();
    const files = excalidrawAPI.getFiles();
    const jsonString = serializeAsJSON(elements, appState, files, 'local');
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeBoard.title.toLowerCase().replace(/\s+/g, '-')}.excalidraw`;
    a.click();
    URL.revokeObjectURL(url);
    showTempBanner('Exported .excalidraw scene file!');
  };

  return (
    <section
      aria-label="Excalidraw Plan Dashboard"
      data-testid="excalidraw-plan-dashboard"
      className="h-[calc(100vh-118px)] min-h-[650px] flex flex-col gap-2.5"
    >
      {/* Compact Top Plan Dashboard Control Bar */}
      <div className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 space-y-2 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <PenTool
              className="w-4 h-4 text-emerald-700 shrink-0"
              aria-hidden="true"
            />
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 font-display">
              Plan Dashboard · Excalidraw Studio
            </h1>
            <span
              data-testid="excalidraw-element-count"
              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px] font-mono tabular-nums font-semibold"
            >
              {elementCount} Elements
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              data-testid="excalidraw-fit-canvas-btn"
              onClick={handleFitCanvasToViewport}
              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Scan className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Fit to Canvas</span>
            </button>

            <button
              type="button"
              data-testid="excalidraw-stamp-tasks-btn"
              onClick={handleStampActiveTasksOntoCanvas}
              className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Stamp Active Tasks</span>
            </button>

            <button
              type="button"
              data-testid="excalidraw-export-json-btn"
              onClick={handleExportExcalidrawJson}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Export .excalidraw</span>
            </button>

            <button
              type="button"
              data-testid="excalidraw-toggle-expand-btn"
              onClick={() => setIsExpandedCanvas((prev) => !prev)}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              {isExpandedCanvas ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Show Controls</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Max Canvas</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Board Presets + Create New Board Bar (Hidden when Max Canvas is active) */}
        {!isExpandedCanvas && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-100">
            <div
              role="tablist"
              aria-label="Excalidraw Planning Boards"
              className="flex flex-wrap items-center gap-1"
            >
              {boards.map((board) => {
                const isSelected = board.id === activeBoard.id;
                return (
                  <button
                    key={board.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    data-testid={`excalidraw-board-tab-${board.id}`}
                    onClick={() => setActiveBoardId(board.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <FolderKanban className="w-3 h-3" aria-hidden="true" />
                    <span>{board.title}</span>
                  </button>
                );
              })}
            </div>

            <form
              onSubmit={handleCreateNewBoard}
              className="flex items-center gap-1.5"
            >
              <input
                type="text"
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
                placeholder="New board name..."
                aria-label="New Excalidraw board name"
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-800 placeholder:text-slate-400 w-36"
              />
              <button
                type="submit"
                disabled={!newBoardTitle.trim()}
                className="px-2 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" aria-hidden="true" />
                <span>New Board</span>
              </button>
            </form>
          </div>
        )}

        {statusBanner && (
          <div
            role="status"
            data-testid="excalidraw-status-banner"
            className="bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-2"
          >
            <CheckCircle2
              className="w-3.5 h-3.5 text-emerald-600 shrink-0"
              aria-hidden="true"
            />
            <span>{statusBanner}</span>
          </div>
        )}
      </div>

      {/* Live Embedded Excalidraw Canvas Container — Expands to Fill Full Remaining Screen */}
      <div
        data-testid="excalidraw-canvas-wrapper"
        className="flex-1 min-h-[480px] w-full bg-white border-2 border-slate-300 rounded-xl overflow-hidden shadow-xs relative"
      >
        <Excalidraw
          key={activeBoard.id}
          excalidrawAPI={(api) => setExcalidrawAPI(api)}
          initialData={initialData}
          onChange={(elements) => {
            const activeEls = elements.filter((el) => !el.isDeleted);
            setElementCount(activeEls.length);
          }}
          UIOptions={{
            canvasActions: {
              changeViewBackgroundColor: true,
              clearCanvas: true,
              export: { saveFileToDisk: true },
              loadScene: true,
              saveToActiveFile: false,
              toggleTheme: true,
            },
          }}
        >
          <MainMenu>
            <MainMenu.DefaultItems.LoadScene />
            <MainMenu.DefaultItems.Export />
            <MainMenu.DefaultItems.SaveAsImage />
            <MainMenu.DefaultItems.ClearCanvas />
            <MainMenu.DefaultItems.ChangeCanvasBackground />
          </MainMenu>
          <WelcomeScreen>
            <WelcomeScreen.Center>
              <WelcomeScreen.Center.Heading>
                FocusFlow × Excalidraw Plan Dashboard
              </WelcomeScreen.Center.Heading>
            </WelcomeScreen.Center>
          </WelcomeScreen>
        </Excalidraw>
      </div>

      {/* Bottom 2-Way Bridge: Drop Sticky Note onto Excalidraw Canvas + Create FocusFlow Task */}
      <form
        onSubmit={handleAddStickyAndTask}
        aria-label="Add sticky note to Excalidraw canvas and FocusFlow task list"
        className="bg-white border border-slate-200 rounded-xl px-3 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0"
      >
        <div className="flex items-center gap-2 min-w-[200px] flex-1">
          <Sparkles
            className="w-3.5 h-3.5 text-emerald-600 shrink-0"
            aria-hidden="true"
          />
          <input
            type="text"
            data-testid="excalidraw-quick-task-input"
            value={stickyText}
            onChange={(e) => setStickyText(e.target.value)}
            placeholder="Type an action item to drop onto the Excalidraw canvas AND your Task List..."
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <select
            value={stickyCategory}
            onChange={(e) => setStickyCategory(e.target.value as Category)}
            aria-label="Select life area for canvas sticky task"
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 font-medium"
          >
            {LIFE_AREAS.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>

          <select
            value={stickyPriority}
            onChange={(e) => setStickyPriority(e.target.value as Priority)}
            aria-label="Select priority for canvas sticky task"
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 font-medium"
          >
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          <button
            type="submit"
            data-testid="excalidraw-push-task-btn"
            disabled={!stickyText.trim()}
            className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Add to Canvas &amp; Tasks</span>
          </button>
        </div>
      </form>
    </section>
  );
};
