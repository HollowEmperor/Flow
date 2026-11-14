import React, { useState, useEffect } from 'react';
import { Check, RotateCw, Target, ArrowRight, X } from 'lucide-react';
import {
  TodoItem,
  Category,
  getEligibleWheelTasks,
  calculateWheelSpinResult,
} from '../utils/todoLogic';

interface TaskWheelPickerProps {
  todos: TodoItem[];
  activeCategory: Category | 'All';
  selectedFocusTaskId: string | null;
  onSelectFocusTask: (taskId: string | null) => void;
  onCompleteTask: (taskId: string) => void;
}

const SLICE_PALETTE = [
  { fill: '#6D28D9', text: '#F5F3FF' }, // Royal Purple 700
  { fill: '#059669', text: '#ECFDF5' }, // Emerald Green 600
  { fill: '#2563EB', text: '#EFF6FF' }, // Cobalt Blue 600
  { fill: '#7C3AED', text: '#FAF5FF' }, // Violet 600
  { fill: '#047857', text: '#ECFDF5' }, // Deep Green 700
  { fill: '#1D4ED8', text: '#EFF6FF' }, // Royal Blue 700
  { fill: '#4F46E5', text: '#EEF2FF' }, // Indigo Blue-Purple 600
  { fill: '#10B981', text: '#064E3B' }, // Bright Mint Emerald
];

function polarToCartesian(cx: number, cy: number, r: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: cx + r * Math.cos(angleInRadians),
    y: cy + r * Math.sin(angleInRadians),
  };
}

function createSlicePath(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return [
    'M',
    cx,
    cy,
    'L',
    start.x,
    start.y,
    'A',
    r,
    r,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
    'Z',
  ].join(' ');
}

function truncateSliceLabel(title: string, maxLen: number = 16): string {
  const clean = title.trim();
  if (clean.length <= maxLen) return clean;
  return `${clean.slice(0, maxLen - 1)}…`;
}

export const TaskWheelPicker: React.FC<TaskWheelPickerProps> = ({
  todos,
  activeCategory,
  selectedFocusTaskId,
  onSelectFocusTask,
  onCompleteTask,
}) => {
  const eligibleTasks = getEligibleWheelTasks(todos, activeCategory);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [chosenTask, setChosenTask] = useState<TodoItem | null>(null);

  // Keep chosenTask synced if the task is completed or deleted externally
  useEffect(() => {
    if (chosenTask) {
      const updated = todos.find((t) => t.id === chosenTask.id);
      if (!updated || updated.completed) {
        setChosenTask(null);
      } else {
        setChosenTask(updated);
      }
    }
  }, [todos, chosenTask]);

  const handleSpin = () => {
    if (isSpinning || eligibleTasks.length === 0) return;

    if (eligibleTasks.length === 1) {
      setChosenTask(eligibleTasks[0]);
      onSelectFocusTask(eligibleTasks[0].id);
      return;
    }

    setIsSpinning(true);
    setChosenTask(null);

    const outcome = calculateWheelSpinResult(
      eligibleTasks,
      Math.random(),
      rotation,
      5
    );
    setRotation(outcome.targetRotation);

    window.setTimeout(() => {
      setIsSpinning(false);
      setChosenTask(outcome.selectedTask);
      onSelectFocusTask(outcome.selectedTask.id);
    }, 1800);
  };

  const count = eligibleTasks.length;
  const sliceAngle = count > 0 ? 360 / count : 360;

  return (
    <section
      aria-label="Task Wheel Picker"
      className="bg-white border border-slate-200 rounded-xl p-5"
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Task Wheel Picker
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Not sure where to start? Spin to pick your next task.
          </p>
        </div>
        <span className="text-xs font-mono tabular-nums text-slate-500 shrink-0">
          {count} {count === 1 ? 'option' : 'options'}
        </span>
      </div>

      {count === 0 ? (
        <div className="mt-4 py-6 px-3 bg-slate-50 border border-slate-100 rounded-lg text-center">
          <p className="text-xs text-slate-500">
            Add at least one active task to spin the decision wheel.
          </p>
        </div>
      ) : (
        <div className="mt-4 flex flex-col items-center">
          {/* Wheel Viewport with Top Pointer */}
          <div className="relative w-56 h-56 flex items-center justify-center">
            {/* Fixed 12-o'clock Pointer Indicator */}
            <div
              aria-hidden="true"
              className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-20 drop-shadow-xs"
            >
              <svg width="22" height="20" viewBox="0 0 22 20" fill="none">
                <path
                  d="M11 20L1.47372 2.75L20.5263 2.75L11 20Z"
                  fill="#7C3AED"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              </svg>
            </div>

            {/* Rotating SVG Wheel */}
            <div
              data-testid="task-wheel-rotor"
              className="w-full h-full rounded-full shadow-md border-4 border-purple-950 overflow-hidden"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning
                  ? 'transform 1.8s cubic-bezier(0.16, 1, 0.3, 1)'
                  : 'none',
              }}
            >
              <svg
                viewBox="0 0 220 220"
                className="w-full h-full"
                role="img"
                aria-label={`Decision wheel with ${count} active tasks`}
              >
                {count === 1 ? (
                  <g>
                    <circle cx="110" cy="110" r="110" fill="#4C1D95" />
                    <text
                      x="110"
                      y="62"
                      fill="#f8fafc"
                      fontSize="10"
                      fontWeight="600"
                      textAnchor="middle"
                    >
                      {truncateSliceLabel(eligibleTasks[0].title, 22)}
                    </text>
                  </g>
                ) : (
                  eligibleTasks.map((task, idx) => {
                    const startAngle = idx * sliceAngle;
                    const endAngle = (idx + 1) * sliceAngle;
                    const midAngle = startAngle + sliceAngle / 2;
                    const palette = SLICE_PALETTE[idx % SLICE_PALETTE.length];
                    const isSelected = chosenTask?.id === task.id && !isSpinning;

                    // Position label along slice bisector radius
                    const labelRadius = 64;
                    const labelPos = polarToCartesian(110, 110, labelRadius, midAngle);
                    // Rotate text so it reads radially from center outward
                    const textRotation = midAngle - 90;

                    return (
                      <g key={task.id}>
                        <path
                          d={createSlicePath(110, 110, 110, startAngle, endAngle)}
                          fill={isSelected ? '#10B981' : palette.fill}
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />
                        <text
                          x={labelPos.x}
                          y={labelPos.y}
                          fill={palette.text}
                          fontSize={count > 6 ? '7.5' : '8.5'}
                          fontWeight="600"
                          textAnchor="middle"
                          dominantBaseline="central"
                          transform={`rotate(${textRotation}, ${labelPos.x}, ${labelPos.y})`}
                        >
                          {truncateSliceLabel(task.title, count > 6 ? 12 : 15)}
                        </text>
                      </g>
                    );
                  })
                )}
              </svg>
            </div>

            {/* Center Spin Trigger Hub */}
            <button
              type="button"
              onClick={handleSpin}
              disabled={isSpinning}
              aria-label="Spin task wheel"
              className="absolute z-10 w-14 h-14 rounded-full bg-white border-4 border-purple-900 text-purple-950 font-display font-bold text-xs tracking-tight flex items-center justify-center shadow-sm hover:bg-purple-50 active:scale-95 transition-transform disabled:opacity-60 cursor-pointer"
            >
              {isSpinning ? '...' : 'SPIN'}
            </button>
          </div>

          {/* Primary Spin CTA Button */}
          <button
            type="button"
            onClick={handleSpin}
            disabled={isSpinning}
            className="mt-4 w-full py-2.5 px-4 rounded-lg bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            <RotateCw
              className={`w-3.5 h-3.5 ${isSpinning ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span>{isSpinning ? 'Spinning Wheel...' : 'Spin to Pick a Task'}</span>
          </button>
        </div>
      )}

      {/* Selected Task Result Banner */}
      {chosenTask && !isSpinning && (
        <div
          role="region"
          aria-live="polite"
          aria-label="Selected task from wheel"
          data-testid="wheel-picked-result"
          className="mt-4 pt-4 border-t border-slate-200 space-y-3"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <Target className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Up Next: Selected Task</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setChosenTask(null);
                if (selectedFocusTaskId === chosenTask.id) {
                  onSelectFocusTask(null);
                }
              }}
              aria-label="Dismiss selected task"
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3">
            <p className="text-xs font-semibold text-slate-900 leading-snug">
              {chosenTask.title}
            </p>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
              <span>{chosenTask.category}</span>
              <span aria-hidden="true">·</span>
              <span>
                {chosenTask.priority.charAt(0).toUpperCase() +
                  chosenTask.priority.slice(1)}{' '}
                priority
              </span>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onCompleteTask(chosenTask.id);
                  setChosenTask(null);
                  onSelectFocusTask(null);
                }}
                className="flex-1 py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Complete Now</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectFocusTask(chosenTask.id);
                  const rowEl = document.getElementById(`task-row-${chosenTask.id}`);
                  if (rowEl) {
                    rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}
                className="py-1.5 px-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-md flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <span>Locate</span>
                <ArrowRight className="w-3 h-3" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
