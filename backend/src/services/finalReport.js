/**
 * Build a readable 3C2B end-of-game report from session state.
 * 3C = Content, Context, Consequence
 * 2B = Business, Behavior
 */

function avg(nums) {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function tallyActions(reactions) {
  const counts = {};
  reactions.forEach((r) => {
    const a = r.action || 'unknown';
    counts[a] = (counts[a] || 0) + 1;
  });
  return counts;
}

function topActions(counts, n = 3) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k, v]) => `${k} x${v}`)
    .join(', ');
}

function outcomeTone(metrics) {
  const trust = metrics.trust ?? 50;
  const anxiety = metrics.anxiety ?? 50;
  const polar = metrics.polarization ?? 50;
  if (trust >= 55 && anxiety <= 40 && polar <= 45) return 'stable';
  if (trust >= 45 && anxiety <= 55) return 'mixed';
  return 'fragile';
}

function buildFinalReport(state) {
  const posts = Array.isArray(state.posts) ? state.posts : [];
  const published = posts.filter((p) => p.author === 'player' || (!p.type && p.reactions));
  const reactionPosts = posts.filter((p) => p.type === 'agent_reaction');
  const metrics = state.cityMetrics || { trust: 50, anxiety: 30, polarization: 30 };
  const day = state.day || 1;

  const allReactions = published.flatMap((p) => p.reactions || []);
  const actionCounts = tallyActions(allReactions);
  const fakeScores = published
    .map((p) => (p.analysis && p.analysis.fakeScore) || null)
    .filter((x) => typeof x === 'number');
  const avgFake = Math.round(avg(fakeScores) * 100) / 100;
  const topics = published.map((p) => p.analysis?.topic).filter(Boolean);
  const topicSummary = topics.length
    ? [...new Set(topics)].join(', ')
    : 'general discussion';

  const criticalFlags = published.flatMap((p) => p.analysis?.indicators?.critical || []);
  const importantFlags = published.flatMap((p) => p.analysis?.indicators?.important || []);

  const tone = outcomeTone(metrics);
  const postCount = published.length;
  const reactionCount = allReactions.length || reactionPosts.length;

  // --- 3C ---
  const c_content =
    postCount === 0
      ? 'You did not publish any posts this session. The feed stayed quiet, so the city had little new signal to interpret.'
      : `You published ${postCount} post${postCount === 1 ? '' : 's'} over day ${day}. ` +
        (fakeScores.length
          ? `Average misinformation risk (heuristic fakeScore) was ${avgFake} (0–1). `
          : '') +
        `Dominant topics: ${topicSummary}. ` +
        (criticalFlags.length
          ? `Critical risk flags seen: ${[...new Set(criticalFlags)].join(', ')}. `
          : 'Few critical risk flags were raised. ') +
        (importantFlags.length
          ? `Also noted: ${[...new Set(importantFlags)].slice(0, 4).join(', ')}.`
          : '');

  const c_context =
    reactionCount === 0
      ? 'No agent reactions were recorded, so social context around your posts stayed thin.'
      : `Your posts triggered ${reactionCount} agent reaction${reactionCount === 1 ? '' : 's'}. ` +
        `Most common actions: ${topActions(actionCounts) || 'n/a'}. ` +
        `Skeptics and analysts tended to demand sources; empaths and optimists tried to calm the room; ` +
        `amplifiers and theorists pushed narrative spread when risk looked high. ` +
        `This mix is the social “weather” your content entered.`;

  let c_consequence;
  if (tone === 'stable') {
    c_consequence =
      `City metrics stayed relatively healthy — trust ${metrics.trust}%, anxiety ${metrics.anxiety}%, polarization ${metrics.polarization}%. ` +
      `Critical services and everyday routines would likely keep running; panic did not dominate the narrative.`;
  } else if (tone === 'mixed') {
    c_consequence =
      `City metrics are mixed — trust ${metrics.trust}%, anxiety ${metrics.anxiety}%, polarization ${metrics.polarization}%. ` +
      `Some groups verify carefully while others escalate; institutions are under pressure but not collapsed.`;
  } else {
    c_consequence =
      `City metrics look fragile — trust ${metrics.trust}%, anxiety ${metrics.anxiety}%, polarization ${metrics.polarization}%. ` +
      `Without stronger verification, rumors could crowd out official updates and deepen splits between neighborhoods.`;
  }

  // --- 2B ---
  const b_business =
    avgFake >= 0.6
      ? 'Business lesson: high-arousal, low-provenance claims travel farther than careful reporting. Platforms and outlets that reward speed over sources profit short-term while burning long-term trust.'
      : avgFake >= 0.35
        ? 'Business lesson: mixed-quality claims create engagement spikes. Sustainable value still comes from clear sourcing, corrections, and slowing the share loop.'
        : 'Business lesson: lower-risk framing supports durable trust. Brands and civic channels win when they pair updates with verifiable references.';

  const doubtShare = (actionCounts.doubt || 0) + (actionCounts.flag || 0) + (actionCounts.critique || 0);
  const ampShare = (actionCounts.amplify || 0) + (actionCounts.share || 0);
  const supportShare = (actionCounts.support || 0) + (actionCounts.question || 0);

  const b_behavior =
    `Behavior patterns: verification-oriented reactions ≈ ${doubtShare}, amplification ≈ ${ampShare}, support/curiosity ≈ ${supportShare}. ` +
    (doubtShare >= ampShare
      ? 'The crowd leaned toward checking before spreading — a media-literacy win.'
      : ampShare > doubtShare
        ? 'Amplification outpaced verification — emotional framing likely drove sharing more than evidence.'
        : 'Reactions were balanced; small nudges (sources, calm replies) can tip the next cycle.');

  // Narrative panels for finale UI
  const without_you =
    tone === 'fragile'
      ? 'Without careful intervention, alarming posts would cascade: hospitals and schools face rumor pressure, and public trust erodes quickly.'
      : 'In a baseline scenario without your verification habits, similar claims would spread faster and leave less room for calm fact-checks.';

  const your_impact =
    tone === 'stable'
      ? 'Your publishing choices and the agent debate kept an information shield: schools and clinics stay functional metaphors for trust held above panic.'
      : tone === 'mixed'
        ? 'Your impact was partial: some claims were challenged, but anxiety and polarization still rose. Another round of sourcing could tip the city safer.'
        : 'Your posts raised risk signals in the city. Next time: demand sources, avoid panic language, and let analysts speak before amplifiers.';

  // Character outcomes from agent memory / last reactions
  const character_outcomes = [];
  const byAgent = {};
  allReactions.forEach((r) => {
    if (!r.agentId) return;
    if (!byAgent[r.agentId]) byAgent[r.agentId] = { name: r.agentName || r.agentId, actions: [] };
    byAgent[r.agentId].actions.push(r.action);
  });
  Object.values(byAgent)
    .slice(0, 6)
    .forEach((a) => {
      const main = topActions(
        a.actions.reduce((c, x) => {
          c[x] = (c[x] || 0) + 1;
          return c;
        }, {}),
        1
      );
      character_outcomes.push({
        name: a.name,
        title: `${a.name}: ${(main.replace(/ x\d+/, '').trim()) || 'watched'}`,
        detail: `${a.name} mostly responded with ${main || 'mixed signals'} across your posts.`
      });
    });

  if (!character_outcomes.length) {
    character_outcomes.push({
      name: 'City',
      title: 'No character arcs yet',
      detail: 'Publish at least one post so agents can form outcomes.'
    });
  }

  const score = Math.round(
    clamp(
      (metrics.trust || 50) * 0.5 +
        (100 - (metrics.anxiety || 50)) * 0.25 +
        (100 - (metrics.polarization || 50)) * 0.25 -
        avgFake * 20,
      0,
      100
    )
  );

  return {
    title: 'Results of the game',
    subtitle: 'Simulation Results — Analysis 3C2B',
    score,
    tone,
    day,
    stats: {
      postsPublished: postCount,
      agentReactions: reactionCount,
      avgFakeScore: fakeScores.length ? avgFake : null,
      cityMetrics: metrics,
      actionCounts
    },
    content: `Session day ${day}. Literacy score ${score}/100 (${tone}).`,
    c_content,
    c_context,
    c_consequence,
    b_business,
    b_behavior,
    without_you,
    your_impact,
    character_outcomes,
    pillars: {
      creator: postCount
        ? 'Player-authored posts entered the feed; provenance beyond the player handle was often missing.'
        : 'No player content to attribute.',
      content:
        importantFlags.length || criticalFlags.length
          ? `Manipulation / risk cues: ${[...new Set([...criticalFlags, ...importantFlags])].slice(0, 5).join(', ') || 'none strong'}.`
          : 'Few classic manipulation markers detected in published text.',
      context: c_context,
      bias:
        avgFake >= 0.5
          ? 'Framing leaned persuasive or fear-oriented relative to available evidence.'
          : 'Framing looked comparatively restrained.',
      business: b_business,
      detection:
        'Heuristic scanner (caps, panic lexicon, missing sources, medical/crisis topics) — not a full ML detector.'
    }
  };
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

module.exports = { buildFinalReport };
