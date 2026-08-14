import { useState } from 'react';

type CalibrationProps = {
  onSubmit: (score: number) => void;
};

export function Calibration({ onSubmit }: CalibrationProps) {
  const [score, setScore] = useState(60);

  return (
    <div className="space-y-6 rounded-3xl border border-slate-700 bg-slate-900/80 p-5">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Calibration</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Оценка чувствительности города</h2>
      </div>

      <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
        <p className="mb-4 text-sm text-slate-200">Ваша оценка: {score}/100</p>
        <input
          type="range"
          min={0}
          max={100}
          value={score}
          onChange={(event) => setScore(Number(event.target.value))}
          className="w-full accent-emerald-400"
        />
      </div>

      <button
        type="button"
        onClick={() => onSubmit(score)}
        className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-emerald-400"
      >
        Отправить оценку
      </button>
    </div>
  );
}
