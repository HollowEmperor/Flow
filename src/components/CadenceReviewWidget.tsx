import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Sparkles,
  Send,
  Cpu,
} from 'lucide-react';
import {
  CadenceReviewState,
  INITIAL_CADENCE_REVIEW_STATE,
  CORE_PHILOSOPHY_QUOTES,
} from '../utils/promptQuestionsData';

interface CadenceReviewWidgetProps {
  onOpenEisenhowerMatrix?: () => void;
}

const CADENCE_STORAGE_KEY = 'focusflow_cadence_review_prompts_v1';

export const CadenceReviewWidget: React.FC<CadenceReviewWidgetProps> = ({
  onOpenEisenhowerMatrix,
}) => {
  const [state, setState] = useState<CadenceReviewState>(() => {
    try {
      const saved = localStorage.getItem(CADENCE_STORAGE_KEY);
      if (saved) {
        return { ...INITIAL_CADENCE_REVIEW_STATE, ...JSON.parse(saved) };
      }
    } catch {
      // Ignore
    }
    return INITIAL_CADENCE_REVIEW_STATE;
  });

  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeCadenceTab, setActiveCadenceTab] = useState<
    'daily' | 'weekly' | 'monthly'
  >('daily');

  useEffect(() => {
    try {
      localStorage.setItem(CADENCE_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore
    }
  }, [state]);

  return (
    <section
      aria-label="Daily, Weekly, and Monthly Reflection Prompts"
      data-testid="cadence-review-widget"
      className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3 shadow-2xs"
    >
      {/* Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarCheck
            className="w-4 h-4 text-purple-600 shrink-0"
            aria-hidden="true"
          />
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900">
              Daily · Weekly · Monthly System Check-In Prompts
            </h2>
            <p className="text-[11px] text-slate-500">
              {CORE_PHILOSOPHY_QUOTES[2]} · {CORE_PHILOSOPHY_QUOTES[1]}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div
            role="group"
            aria-label="Select check-in cadence"
            className="flex items-center gap-1 bg-slate-100 border border-slate-200 p-1 rounded-lg"
          >
            {(
              [
                { id: 'daily', label: 'Daily', activeBg: 'bg-emerald-600 text-white' },
                { id: 'weekly', label: 'Weekly (2W)', activeBg: 'bg-blue-600 text-white' },
                { id: 'monthly', label: 'Monthly', activeBg: 'bg-purple-700 text-white' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                data-testid={`cadence-tab-${tab.id}`}
                onClick={() => {
                  setActiveCadenceTab(tab.id);
                  setIsExpanded(true);
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  activeCadenceTab === tab.id
                    ? `${tab.activeBg} shadow-2xs`
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-expanded={isExpanded}
            aria-label="Toggle cadence check-in prompts"
            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="pt-2 border-t border-slate-100">
          {activeCadenceTab === 'daily' && (
            <div
              data-testid="cadence-panel-daily"
              className="grid grid-cols-1 @lg:grid-cols-2 gap-3"
            >
              {/* Daily Q1: Have I used the matrix to cut things out? */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    1. Have I used the matrix to cut things out today?
                  </span>
                  {onOpenEisenhowerMatrix && (
                    <button
                      type="button"
                      onClick={onOpenEisenhowerMatrix}
                      className="text-[10px] font-semibold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <LayoutGrid className="w-3 h-3" />
                      <span>Open Matrix</span>
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold cursor-pointer bg-white border-slate-200">
                    <input
                      type="checkbox"
                      checked={state.dailyUsedMatrix === 'yes'}
                      onChange={() =>
                        setState((s) => ({
                          ...s,
                          dailyUsedMatrix:
                            s.dailyUsedMatrix === 'yes' ? null : 'yes',
                        }))
                      }
                      className="rounded border-slate-300 text-emerald-600"
                    />
                    <span>[x] Yes</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold cursor-pointer bg-white border-slate-200">
                    <input
                      type="checkbox"
                      checked={state.dailyUsedMatrix === 'no'}
                      onChange={() =>
                        setState((s) => ({
                          ...s,
                          dailyUsedMatrix:
                            s.dailyUsedMatrix === 'no' ? null : 'no',
                        }))
                      }
                      className="rounded border-slate-300 text-rose-600"
                    />
                    <span>[ ] No</span>
                  </label>
                </div>

                {/* Daily Q2: Did Prianka get my tomorrow's list yet? */}
                <div className="pt-2 border-t border-slate-200/70 space-y-1.5">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-emerald-700" />
                    <span>2. Did Prianka get my tomorrow’s list yet?</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      data-testid="prianka-tomorrow-list-yes"
                      onClick={() =>
                        setState((s) => ({
                          ...s,
                          dailyPriankaGotTomorrowList: 'yes',
                        }))
                      }
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
                        state.dailyPriankaGotTomorrowList === 'yes'
                          ? 'bg-emerald-700 text-white border-emerald-700'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      [x] Yes · Sent to Prianka
                    </button>
                    <button
                      type="button"
                      data-testid="prianka-tomorrow-list-no"
                      onClick={() =>
                        setState((s) => ({
                          ...s,
                          dailyPriankaGotTomorrowList: 'no',
                        }))
                      }
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
                        state.dailyPriankaGotTomorrowList === 'no'
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      [ ] No · Prepare Tomorrow’s List Now
                    </button>
                  </div>
                </div>
              </div>

              {/* Daily Q3 & Q4: Decisions count & Systems to remove decisions */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="daily-decisions-count"
                    className="text-xs font-bold text-slate-900 flex items-center gap-1.5"
                  >
                    <Cpu className="w-3.5 h-3.5 text-emerald-700" />
                    <span>3. How many decisions did I have to make today?</span>
                  </label>
                  <input
                    id="daily-decisions-count"
                    type="number"
                    min={0}
                    value={state.dailyDecisionsCount}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        dailyDecisionsCount: Math.max(
                          0,
                          Number(e.target.value) || 0
                        ),
                      }))
                    }
                    className="w-16 text-xs font-mono font-bold text-slate-900 bg-white border border-slate-200 rounded-lg px-2 py-1 text-center"
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="daily-systems-remove-decisions"
                    className="block text-xs font-bold text-slate-900"
                  >
                    4. What systems can I build to remove these decisions?
                  </label>
                  <input
                    id="daily-systems-remove-decisions"
                    type="text"
                    value={state.dailySystemsToRemoveDecisions}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        dailySystemsToRemoveDecisions: e.target.value,
                      }))
                    }
                    placeholder="Build a default rule or schedule system to eliminate decision fatigue..."
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800"
                  />
                </div>
              </div>
            </div>
          )}

          {activeCadenceTab === 'weekly' && (
            <div
              data-testid="cadence-panel-weekly"
              className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2"
            >
              <label
                htmlFor="weekly-therapeutic-task"
                className="text-xs font-bold text-slate-900 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                <span>
                  Weekly Prompt: What is my therapeutic task for the next 2
                  weeks?
                </span>
              </label>
              <input
                id="weekly-therapeutic-task"
                type="text"
                value={state.weeklyTherapeuticTask}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    weeklyTherapeuticTask: e.target.value,
                  }))
                }
                placeholder="Enter your restorative / therapeutic task for the next 2 weeks..."
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
              />
            </div>
          )}

          {activeCadenceTab === 'monthly' && (
            <div
              data-testid="cadence-panel-monthly"
              className="grid grid-cols-1 @lg:grid-cols-2 gap-3"
            >
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2">
                <span className="text-xs font-bold text-slate-900 block">
                  Monthly: Have I used the matrix to cut things out?
                </span>
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold cursor-pointer bg-white border-slate-200">
                    <input
                      type="checkbox"
                      checked={state.monthlyUsedMatrix === 'yes'}
                      onChange={() =>
                        setState((s) => ({
                          ...s,
                          monthlyUsedMatrix:
                            s.monthlyUsedMatrix === 'yes' ? null : 'yes',
                        }))
                      }
                      className="rounded border-slate-300 text-emerald-600"
                    />
                    <span>[x] Yes</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold cursor-pointer bg-white border-slate-200">
                    <input
                      type="checkbox"
                      checked={state.monthlyUsedMatrix === 'no'}
                      onChange={() =>
                        setState((s) => ({
                          ...s,
                          monthlyUsedMatrix:
                            s.monthlyUsedMatrix === 'no' ? null : 'no',
                        }))
                      }
                      className="rounded border-slate-300 text-rose-600"
                    />
                    <span>[ ] No</span>
                  </label>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-1.5">
                <label
                  htmlFor="monthly-focus-input"
                  className="block text-xs font-bold text-slate-900"
                >
                  Monthly: What is this month’s Focus?
                </label>
                <input
                  id="monthly-focus-input"
                  type="text"
                  value={state.monthlyFocus}
                  onChange={(e) =>
                    setState((s) => ({ ...s, monthlyFocus: e.target.value }))
                  }
                  placeholder="Define this month's #1 overarching focus..."
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
