import { create } from 'zustand';
import { api } from '../lib/api';
import type { CityState } from '../types';

const defaultState: CityState = {
  sessionId: 'demo-session',
  day: 1,
  metrics: { economy: 58, social: 62, safety: 57, mood: 60, trust: 63 },
  agents: [
    { id: 'planner', name: 'Алина Планы', archetype: 'planner', temperament: 'structured', systemPrompt: 'Стратег и координатор.' },
    { id: 'maker', name: 'Борис Мастер', archetype: 'builder', temperament: 'actionable', systemPrompt: 'Создатель и исполнитель.' },
    { id: 'caregiver', name: 'Вера Тихая', archetype: 'caretaker', temperament: 'empathetic', systemPrompt: 'Поддержка и эмпатия.' },
    { id: 'critic', name: 'Глеб Критик', archetype: 'critic', temperament: 'skeptical', systemPrompt: 'Аналитик и риск-оценщик.' },
    { id: 'dreamer', name: 'Даша Мечтатель', archetype: 'innovator', temperament: 'creative', systemPrompt: 'Фантазёр и визионер.' },
    { id: 'guardian', name: 'Егор Сторож', archetype: 'guardian', temperament: 'protective', systemPrompt: 'Защитник порядка.' },
  ],
  feed: [
    { id: '1', agentId: 'planner', text: 'Город проснулся: первые решения уже в работе.', kind: 'update' },
    { id: '2', agentId: 'caregiver', text: 'Соседи ждут стабильности и тишины.', kind: 'warning' },
  ],
  actionLog: ['Системный старт уровня 1', 'Синхронизация агентов завершена'],
  selectedAgentId: 'planner',
  finale: null,
};

type CityStore = {
  city: CityState;
  loading: boolean;
  loadState: () => Promise<void>;
  triggerDay: (event?: Record<string, unknown>) => Promise<void>;
  intervene: (agentId: string, action: string) => Promise<void>;
  selectAgent: (agentId: string) => void;
  evaluateCalibration: (score: number) => Promise<void>;
  fetchFinale: () => Promise<void>;
};

export const useCityStore = create<CityStore>((set, get) => ({
  city: defaultState,
  loading: false,
  loadState: async () => {
    set({ loading: true });
    try {
      const data = await api.getState();
      set({ city: { ...defaultState, ...data } });
    } catch {
      set({ city: defaultState });
    } finally {
      set({ loading: false });
    }
  },
  triggerDay: async (event = {}) => {
    set({ loading: true });
    try {
      const response = await api.triggerDay(event);
      set({ city: { ...get().city, ...response.state } });
    } finally {
      set({ loading: false });
    }
  },
  intervene: async (agentId, action) => {
    set({ loading: true });
    try {
      const response = await api.intervene(agentId, action);
      const next = { ...get().city, actionLog: [response.text, ...get().city.actionLog], feed: [{ id: String(Date.now()), agentId, text: response.text, kind: 'intervention' }, ...get().city.feed] };
      set({ city: next });
    } finally {
      set({ loading: false });
    }
  },
  selectAgent: (agentId) => set((state) => ({ city: { ...state.city, selectedAgentId: agentId } })),
  evaluateCalibration: async (score) => {
    const response = await api.evaluateCalibration(score);
    set((state) => ({ city: { ...state.city, actionLog: [response.label, ...state.city.actionLog] } }));
  },
  fetchFinale: async () => {
    const response = await api.getFinale();
    set((state) => ({ city: { ...state.city, finale: response } }));
  },
}));
