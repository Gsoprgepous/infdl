export type MetricKey = 'economy' | 'social' | 'safety' | 'mood' | 'trust';

export type Agent = {
  id: string;
  name: string;
  archetype: string;
  temperament: string;
  systemPrompt: string;
  energy?: number;
  trust?: number;
  focus?: number;
  relationshipScore?: number;
};

export type FeedItem = {
  id: string;
  agentId: string;
  text: string;
  kind: string;
};

export type CityState = {
  sessionId: string;
  day: number;
  metrics: Record<MetricKey, number>;
  agents: Agent[];
  feed: FeedItem[];
  actionLog: string[];
  selectedAgentId: string;
  finale: null | { summary: string; status: string };
};
