import express from 'express';
import { getOrCreateSession, saveSession } from './storage.js';
import { processEvent, handleIntervention } from './orchestrator.js';
import { evaluateCalibration } from './calibration.js';
import { generateFinale } from './finalGenerator.js';

export function createApiRouter() {
  const router = express.Router();

  router.get('/city/state', (req, res) => {
    const sessionId = req.query.sessionId ?? 'demo-session';
    const state = getOrCreateSession(String(sessionId));
    res.json(state);
  });

  router.post('/day/trigger', async (req, res) => {
    const sessionId = req.body.sessionId ?? 'demo-session';
    const state = getOrCreateSession(sessionId);
    const event = req.body.event ?? {
      source: 'system',
      action: 'observe',
      summary: 'В городской ленте появился новый сигнал',
    };

    const result = await processEvent(state, event);
    saveSession(sessionId, result.state);
    res.json(result);
  });

  router.post('/agents/:id/intervene', (req, res) => {
    const { id } = req.params;
    const sessionId = req.body.sessionId ?? 'demo-session';
    const state = getOrCreateSession(sessionId);
    const response = handleIntervention(state, id, req.body.action ?? 'support');
    saveSession(sessionId, state);
    res.json(response);
  });

  router.post('/calibration/answer', (req, res) => {
    const answer = req.body ?? {};
    const result = evaluateCalibration(answer);
    res.json(result);
  });

  router.get('/finale', (req, res) => {
    const sessionId = req.query.sessionId ?? 'demo-session';
    const state = getOrCreateSession(String(sessionId));
    const result = generateFinale(state);
    res.json({ ...result, state });
  });

  return router;
}
