import type { CityState } from '../types';

type MyCityProps = {
  city: CityState;
};

export function MyCity({ city }: MyCityProps) {
  const metrics = Object.entries(city.metrics);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-violet-300">My City</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Состояние города</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metrics.map(([key, value]) => (
          <div key={key} className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4">
            <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
              <span>{key}</span>
              <span>{value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-700 bg-slate-900/80 p-5">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-medium text-white">Социальная сеть агентов</h3>
          <span className="text-xs uppercase tracking-[0.2em] text-slate-400">day {city.day}</span>
        </div>

        <svg viewBox="0 0 600 220" className="h-56 w-full rounded-2xl bg-slate-950/60 p-3">
          {city.agents.map((agent, index) => {
            const angle = (index / city.agents.length) * Math.PI * 2;
            const cx = 300 + Math.cos(angle) * 120;
            const cy = 110 + Math.sin(angle) * 70;
            return (
              <g key={agent.id}>
                <circle cx={cx} cy={cy} r="22" fill={index % 2 === 0 ? '#22d3ee' : '#a78bfa'} opacity="0.9" />
                <text x={cx} y={cy + 35} textAnchor="middle" fill="#f8fafc" fontSize="11">
                  {agent.name.split(' ')[0]}
                </text>
                <line x1={300} y1={110} x2={cx} y2={cy} stroke="#475569" strokeWidth="1.2" opacity="0.7" />
              </g>
            );
          })}
          <circle cx={300} cy={110} r="32" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />
          <text x={300} y={116} textAnchor="middle" fill="#f8fafc" fontSize="12">CITY</text>
        </svg>
      </div>
    </div>
  );
}
