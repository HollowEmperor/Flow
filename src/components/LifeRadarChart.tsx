import React, { useState } from 'react';
import { Sliders, Plus, Minus } from 'lucide-react';
import {
  Category,
  LIFE_AREAS,
  TodoItem,
  computeRadarScores,
  computeRadarGeometry,
} from '../utils/todoLogic';

interface LifeRadarChartProps {
  todos: TodoItem[];
  activeCategory: Category | 'All';
  baseOverrides: Partial<Record<Category, number>>;
  onSelectCategory: (category: Category | 'All') => void;
  onAdjustBaseScore: (area: Category, delta: number) => void;
}

const GRID_LEVELS = [0.25, 0.5, 0.75, 1.0];

export const LifeRadarChart: React.FC<LifeRadarChartProps> = ({
  todos,
  activeCategory,
  baseOverrides,
  onSelectCategory,
  onAdjustBaseScore,
}) => {
  const [showScoreTuner, setShowScoreTuner] = useState(false);

  const cx = 145;
  const cy = 140;
  const radius = 82;
  const labelRadius = 114;

  const metrics = computeRadarScores(todos, baseOverrides);
  const { pointsString, vertices } = computeRadarGeometry(
    metrics,
    cx,
    cy,
    radius,
    labelRadius
  );

  const averageScore = Math.round(
    metrics.reduce((sum, m) => sum + m.score, 0) / metrics.length
  );

  // Helper to build regular heptagon polygon points for each ring level
  const getLevelPolygonPoints = (levelFactor: number): string => {
    const count = LIFE_AREAS.length;
    return LIFE_AREAS.map((_, idx) => {
      const angleRad = ((-90 + (idx * 360) / count) * Math.PI) / 180;
      const r = radius * levelFactor;
      const x = (cx + r * Math.cos(angleRad)).toFixed(2);
      const y = (cy + r * Math.sin(angleRad)).toFixed(2);
      return `${x},${y}`;
    }).join(' ');
  };

  return (
    <section
      aria-label="Life Balance Radar Chart"
      data-testid="life-radar-chart"
      className="bg-white border border-slate-200 rounded-xl p-5"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Life Focus Radar
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Balance across your 7 core areas of life.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            data-testid="radar-avg-score"
            className="text-xs font-mono tabular-nums font-semibold text-emerald-700"
          >
            Avg {averageScore}
          </span>
          <button
            type="button"
            onClick={() => setShowScoreTuner((prev) => !prev)}
            aria-expanded={showScoreTuner}
            aria-label="Adjust baseline life area scores"
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              showScoreTuner
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* 7-Axis SVG Heptagon Radar Chart */}
      <div className="mt-2 flex justify-center">
        <svg
          viewBox="0 0 290 275"
          className="w-full max-w-[290px] h-auto select-none"
          role="img"
          aria-label="Seven-axis radar chart for Portfolio, Karma, Knowledge, Personality, Social, Strength, and Aesthetics"
        >
          {/* Concentric Heptagon Grid Rings */}
          {GRID_LEVELS.map((lvl) => (
            <polygon
              key={lvl}
              points={getLevelPolygonPoints(lvl)}
              fill={lvl === 1.0 ? '#f8fafc' : 'none'}
              stroke="#e2e8f0"
              strokeWidth={lvl === 1.0 ? '1.5' : '1'}
              strokeDasharray={lvl < 1.0 ? '2 2' : undefined}
            />
          ))}

          {/* Radial Spokes from Center to Each of the 7 Vertices */}
          {vertices.map((v) => (
            <line
              key={`axis-${v.area}`}
              x1={cx}
              y1={cy}
              x2={v.axisX}
              y2={v.axisY}
              stroke="#cbd5e1"
              strokeWidth="1"
            />
          ))}

          {/* Data Polygon Fill & Stroke */}
          <polygon
            data-testid="radar-data-polygon"
            points={pointsString}
            fill="rgba(16, 185, 129, 0.20)"
            stroke="#059669"
            strokeWidth="2.25"
            strokeLinejoin="round"
          />

          {/* Data Vertex Dots & Outer Axis Labels */}
          {vertices.map((v) => {
            const isSelected = activeCategory === v.area;
            return (
              <g
                key={v.area}
                onClick={() =>
                  onSelectCategory(isSelected ? 'All' : v.area)
                }
                className="cursor-pointer group"
              >
                <circle
                  cx={v.x}
                  cy={v.y}
                  r={isSelected ? 5 : 3.75}
                  fill={isSelected ? '#0f172a' : '#059669'}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                <text
                  x={v.labelX}
                  y={v.labelY - 5}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={isSelected ? '#0f172a' : '#334155'}
                  fontSize="10"
                  fontWeight={isSelected ? '700' : '600'}
                >
                  {v.area}
                </text>
                <text
                  x={v.labelX}
                  y={v.labelY + 7}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#059669"
                  fontSize="9"
                  fontWeight="600"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {v.score}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Compact 7-Area Breakdown & Optional Baseline Score Tuner */}
      <div className="mt-2 pt-3 border-t border-slate-100 space-y-1.5">
        {metrics.map((m) => {
          const isSelected = activeCategory === m.area;
          return (
            <div
              key={m.area}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                isSelected ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectCategory(isSelected ? 'All' : m.area)}
                className="flex-1 flex items-center justify-between text-left cursor-pointer"
              >
                <span className="font-medium">{m.area}</span>
                <span
                  className={`font-mono tabular-nums ${
                    isSelected ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {m.completedCount}/{m.totalCount} tasks ·{' '}
                  <strong className={isSelected ? 'text-emerald-300' : 'text-slate-900'}>
                    {m.score}
                  </strong>
                </span>
              </button>

              {showScoreTuner && (
                <div className="ml-2 flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onAdjustBaseScore(m.area, -5)}
                    aria-label={`Decrease ${m.area} baseline score`}
                    className={`p-1 rounded border cursor-pointer ${
                      isSelected
                        ? 'border-slate-700 hover:bg-slate-800 text-white'
                        : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Minus className="w-3 h-3" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onAdjustBaseScore(m.area, 5)}
                    aria-label={`Increase ${m.area} baseline score`}
                    className={`p-1 rounded border cursor-pointer ${
                      isSelected
                        ? 'border-slate-700 hover:bg-slate-800 text-white'
                        : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Plus className="w-3 h-3" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
