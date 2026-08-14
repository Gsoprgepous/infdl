import type { Agent } from '../types';

type ProfileProps = {
  agent: Agent;
  onIntervene: (action: string) => void;
};

export function Profile({ agent, onIntervene }: ProfileProps) {
  return (
    <div className="space-y-6 rounded-3xl border border-slate-700 bg-slate-900/80 p-5">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-amber-300">Profile</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">{agent.name}</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-slate-950/70 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Архетип</p>
          <p className="mt-2 text-lg text-white">{agent.archetype}</p>
        </div>
        <div className="rounded-2xl bg-slate-950/70 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Темперамент</p>
          <p className="mt-2 text-lg text-white">{agent.temperament}</p>
        </div>
      </div>

      <p className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4 text-sm leading-6 text-slate-200">
        {agent.systemPrompt}
      </p>

      <div className="flex flex-wrap gap-3">
        {['support', 'repair', 'accelerate', 'warn'].map((action) => (
          <button
            key={action}
            type="button"
            onClick={() => onIntervene(action)}
            className="rounded-full border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-slate-100 transition hover:border-sky-400 hover:text-sky-300"
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  );
}
