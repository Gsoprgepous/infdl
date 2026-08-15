const express = require('express');
const { orchestratePost } = require('../orchestrator');
const { analyzeText } = require('../agents/analyzeText');
const { loadAgents, getAgentById } = require('../agents/loadAgents');
const { generateReaction } = require('../agents/generateReaction');
const {
  applyCityDelta,
  recordAgentMemories,
  saveGameState
} = require('../services/gameState');
const { v4: uuidv4 } = require('uuid');

function createApiRouter({ getState, setState, preparedPosts }) {
  const router = express.Router();

  router.get('/prepared-posts', (req, res) => {
    res.json(preparedPosts);
  });

  router.get('/agents', (req, res) => {
    res.json(loadAgents());
  });

  router.get('/agents/:id', (req, res) => {
    const agent = getAgentById(req.params.id);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    res.json(agent);
  });

  router.post('/agents/analyze', (req, res) => {
    const text = (req.body && req.body.text) || '';
    const agentId = req.body && req.body.agentId;
    const analysis = analyzeText(text, req.body || {});
    if (agentId) {
      const agent = getAgentById(agentId);
      if (!agent) return res.status(404).json({ error: 'Agent not found' });
      return res.json({ analysis, reaction: generateReaction(analysis, agent) });
    }
    res.json({ analysis });
  });

  router.get('/city/state', (req, res) => {
    res.json(getState());
  });

  router.get('/city/metrics', (req, res) => {
    const state = getState();
    res.json(state.cityMetrics || { trust: 50, anxiety: 30, polarization: 30 });
  });

  router.post('/city/actions', (req, res) => {
    const state = getState();
    const raw = ((req.body && (req.body.action || req.body.type || req.body.name)) || '')
      .toString()
      .toLowerCase();

    const catalog = {
      'fact check': {
        key: 'fact_check',
        label: 'Fact check',
        delta: { trust: 4, anxiety: -3, polarization: -2 },
        effect:
          'You ordered a fact-check. Trust rises as sources get verified; anxiety and polarization ease a bit (result lands next day narratively).'
      },
      fact_check: null,
      'calm question': {
        key: 'calm_question',
        label: 'Calm question',
        delta: { trust: 2, anxiety: -4, polarization: -1 },
        effect:
          'You asked a calm clarifying question. Anxiety drops; the city cools slightly without amplifying the rumor.'
      },
      calm_question: null,
      'revealing sticker': {
        key: 'revealing_sticker',
        label: 'Revealing sticker',
        delta: { trust: -1, anxiety: 2, polarization: 4 },
        effect:
          'Viral sticker spread fast. Polarization jumped — some people felt exposed, others doubled down. Risky tool.'
      },
      revealing_sticker: null,
      'do nothing': {
        key: 'do_nothing',
        label: 'Do nothing',
        delta: { trust: 0, anxiety: 1, polarization: 0 },
        effect:
          'You chose not to react. The rumor keeps circulating quietly; anxiety ticks up a little from unanswered claims.'
      },
      do_nothing: null
    };
    // alias keys
    catalog.fact_check = catalog['fact check'];
    catalog.calm_question = catalog['calm question'];
    catalog.revealing_sticker = catalog['revealing sticker'];
    catalog.do_nothing = catalog['do nothing'];

    let picked =
      catalog[raw] ||
      Object.values(catalog).find(
        (a) => a && (raw.includes(a.key.replace(/_/g, ' ')) || raw.includes(a.label.toLowerCase()))
      );

    if (!picked) {
      return res.status(400).json({
        error: 'Unknown action',
        allowed: ['fact check', 'calm question', 'revealing sticker', 'do nothing']
      });
    }

    if (typeof state.actionsRemaining !== 'number') state.actionsRemaining = 5;
    if (typeof state.actionsMax !== 'number') state.actionsMax = 5;
    if (state.actionsRemaining <= 0) {
      return res.status(400).json({
        error: 'No actions remaining today',
        actionsRemaining: 0,
        cityMetrics: state.cityMetrics
      });
    }

    state.actionsRemaining -= 1;
    const metrics = applyCityDelta(state, picked.delta);
    if (!Array.isArray(state.actionLog)) state.actionLog = [];
    state.actionLog.push({
      at: Date.now(),
      day: state.day,
      action: picked.key,
      delta: picked.delta
    });
    saveGameState(state);
    setState(state);

    res.json({
      ok: true,
      action: picked.key,
      label: picked.label,
      effect: picked.effect,
      delta: picked.delta,
      cityMetrics: metrics,
      actionsRemaining: state.actionsRemaining,
      actionsMax: state.actionsMax
    });
  });

  router.post('/day/trigger', async (req, res) => {
    const state = getState();
    state.day = (state.day || 1) + 1;
    saveGameState(state);
    setState(state);
    res.json({ ok: true, day: state.day, state });
  });

  router.post('/agents/:id/intervene', (req, res) => {
    const state = getState();
    const { id } = req.params;
    const action = (req.body && req.body.action) || 'support';
    if (!state.agentStates[id]) state.agentStates[id] = [];
    const note = { at: Date.now(), action, by: 'player' };
    state.agentStates[id].push(note);
    saveGameState(state);
    setState(state);
    res.json({ ok: true, agent: id, action, note });
  });

  router.post('/calibration/answer', (req, res) => {
    const payload = req.body || {};
    const score = Number(payload.score || 50);
    res.json({
      correct: score >= 50,
      score,
      total: 100,
      label:
        score >= 70
          ? 'High calibration'
          : score >= 40
            ? 'Medium calibration'
            : 'Needs more calibration'
    });
  });

  router.post('/posts', async (req, res) => {
    try {
      const state = getState();
      const { postId, text } = req.body || {};

      let preparedPost = null;
      let contentText = text;

      if (postId) {
        preparedPost = preparedPosts.find((p) => p.id === postId);
        if (!preparedPost) {
          return res.status(404).json({ error: 'Пост не найден' });
        }
        contentText = preparedPost.text;
      }

      if (!contentText || !String(contentText).trim()) {
        return res.status(400).json({ error: 'text or postId required' });
      }

      const enrichedContent = {
        text: contentText,
        visual_description: preparedPost?.visual_description || null,
        genre: preparedPost?.genre || req.body.genre || null,
        provocation_level:
          preparedPost?.provocation_level ?? req.body.provocation_level ?? null,
        intent: preparedPost?.intent || req.body.intent || null
      };

      const playerHistory = state.agentStates.player || 'Нет истории';
      const result = await orchestratePost(
        enrichedContent,
        playerHistory,
        state.day
      );
      const { analysis, reactions, cityDelta } = result;

      const newPost = {
        id: uuidv4(),
        day: state.day,
        author: 'player',
        text: contentText,
        content: contentText,
        image_url: preparedPost?.image_url || null,
        visual_description: preparedPost?.visual_description || null,
        analysis,
        reactions
      };

      // Agent reaction posts appear in the feed under the player post
      const reactionPosts = reactions
        .filter((r) => r.action !== 'ignore')
        .map((r) => ({
          id: uuidv4(),
          day: state.day,
          author: r.agentName || r.agentId,
          agentId: r.agentId,
          type: 'agent_reaction',
          text: r.post_text,
          content: r.post_text,
          parentPostId: newPost.id,
          action: r.action,
          confidence: r.confidence
        }));

      state.posts.push(newPost, ...reactionPosts);
      recordAgentMemories(state, reactions, contentText, state.day);
      const metrics = applyCityDelta(state, cityDelta);
      saveGameState(state);
      setState(state);

      res.json({
        post: newPost,
        reactionPosts,
        reactions,
        analysis,
        cityMetrics: metrics,
        cityDelta
      });
    } catch (err) {
      console.error('POST /posts failed', err);
      res.status(500).json({ error: 'Failed to publish post', detail: err.message });
    }
  });

  router.get('/feed', (req, res) => {
    res.json(getState().posts || []);
  });

  router.get('/final', (req, res) => {
    const { buildFinalReport } = require('../services/finalReport');
    const state = getState();
    res.json(buildFinalReport(state));
  });

  return router;
}

module.exports = { createApiRouter };
