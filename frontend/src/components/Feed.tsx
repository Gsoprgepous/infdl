import { motion } from 'framer-motion';
import type { FeedItem } from '../types';

type FeedProps = {
  feed: FeedItem[];
  onTrigger: () => void;
};

export function Feed({ feed, onTrigger }: FeedProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-sky-300">Feed</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Лента событий города</h2>
        </div>
        <button
          type="button"
          onClick={onTrigger}
          className="rounded-full bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-sky-400"
        >
          Запустить день
        </button>
      </div>

      <div className="space-y-4">
        {feed.map((item) => (
          <motion.article
            key={item.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/40"
          >
            <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
              <span>{item.agentId}</span>
              <span>{item.kind}</span>
            </div>
            <p className="text-sm leading-6 text-slate-200">{item.text}</p>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
