const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  getState: () => request<{ day: number; metrics: any; agents: any[]; feed: any[]; actionLog: string[]; selectedAgentId: string }>('/city/state'),
  triggerDay: (event = {}) => request<any>('/day/trigger', { method: 'POST', body: JSON.stringify({ event }) }),
  intervene: (agentId: string, action: string) => request<any>(`/agents/${agentId}/intervene`, { method: 'POST', body: JSON.stringify({ action }) }),
  evaluateCalibration: (score: number) => request<any>('/calibration/answer', { method: 'POST', body: JSON.stringify({ score }) }),
  getFinale: () => request<any>('/finale'),
};
