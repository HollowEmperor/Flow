import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, X } from 'lucide-react';

export interface CelebrationEvent {
  id: number;
  taskTitle: string;
}

interface ConfettiOverlayProps {
  celebration: CelebrationEvent | null;
  onDismiss: () => void;
}

export const ConfettiOverlay: React.FC<ConfettiOverlayProps> = ({
  celebration,
  onDismiss,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const launcherRef = useRef<confetti.CreateTypes | null>(null);

  useEffect(() => {
    if (canvasRef.current && !launcherRef.current) {
      launcherRef.current = confetti.create(canvasRef.current, {
        resize: true,
        useWorker: false,
      });
    }
    return () => {
      if (launcherRef.current) {
        launcherRef.current.reset();
      }
    };
  }, []);

  useEffect(() => {
    if (!celebration || !launcherRef.current) return;

    const fire = launcherRef.current;

    // Primary center burst
    fire({
      particleCount: 65,
      spread: 70,
      origin: { y: 0.65 },
      colors: ['#10b981', '#0f172a', '#047857', '#f59e0b', '#3b82f6'],
    });

    // Secondary side bursts for a richer effect
    const sideTimer = window.setTimeout(() => {
      fire({
        particleCount: 35,
        angle: 60,
        spread: 55,
        origin: { x: 0.15, y: 0.7 },
        colors: ['#10b981', '#047857', '#f59e0b'],
      });
      fire({
        particleCount: 35,
        angle: 120,
        spread: 55,
        origin: { x: 0.85, y: 0.7 },
        colors: ['#10b981', '#0f172a', '#3b82f6'],
      });
    }, 160);

    const dismissTimer = window.setTimeout(() => {
      onDismiss();
    }, 3600);

    return () => {
      window.clearTimeout(sideTimer);
      window.clearTimeout(dismissTimer);
    };
  }, [celebration, onDismiss]);

  return (
    <>
      {/* Full-viewport Confetti Canvas Overlay */}
      <canvas
        ref={canvasRef}
        data-testid="confetti-canvas"
        aria-hidden="true"
        className="fixed inset-0 w-full h-full pointer-events-none z-50"
      />

      {/* Non-blocking Task Completion Toast Banner */}
      {celebration && (
        <div
          role="status"
          aria-live="polite"
          data-testid="completion-celebration-toast"
          className="fixed bottom-5 right-5 z-50 max-w-sm bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-3 transition-all duration-200"
        >
          <CheckCircle2
            className="w-5 h-5 text-emerald-400 shrink-0"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-emerald-400">
              Task Completed
            </p>
            <p className="text-xs text-slate-200 truncate">
              {celebration.taskTitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss completion notification"
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      )}
    </>
  );
};
