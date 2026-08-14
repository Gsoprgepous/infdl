(function(){
  const API_BASE = '';

  let prepared = [];

  async function fetchPrepared(){
    try{
      const res = await fetch(API_BASE + '/api/prepared-posts');
      prepared = await res.json();
      // expose for dev/comment samples
      window.prepared = prepared;
      console.log('prepared posts', prepared);
      renderControlPanel();
      // attempt to map prepared posts to visible cards
      mapPreparedToCards();
    }catch(e){
      console.warn('Cannot load prepared posts from API, falling back to local data', e);
      try{
        const r = await fetch('data/prepared_posts.json');
        prepared = await r.json();
        window.prepared = prepared;
        renderControlPanel();
        mapPreparedToCards();
      }catch(e2){
        console.warn('Local fallback prepared posts failed', e2);
      }
    }
  }

  async function publish(postId){
    try{
      const res = await fetch(API_BASE + '/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId })
      });
      const data = await res.json();
      console.log('published', data);
      showOverlay('Published', JSON.stringify(data, null, 2));
      // insert new post into feed if possible
      try{ insertPostIntoFeed(data.post || data); }catch(e){ console.warn('Insert feed failed', e); }
    }catch(e){
      console.error(e);
      alert('Publish failed: ' + e.message);
    }
  }

  async function triggerDay(){
    try{
      const res = await fetch(API_BASE + '/api/day/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: 'demo-session' })
      });
      const data = await res.json();
      console.log('day triggered', data);
      showOverlay('Day trigger', JSON.stringify(data, null, 2));
    }catch(e){
      console.error(e);
    }
  }

  async function loadFeed(){
    try{
      const res = await fetch(API_BASE + '/api/feed');
      const data = await res.json();
      // render feed items into the visible feed-container
      if(Array.isArray(data) && data.length>0){
        renderFeedFromApi(data);
      } else if(data && Array.isArray(data.posts)){
        renderFeedFromApi(data.posts);
      } else {
        showOverlay('Feed', JSON.stringify(data, null, 2));
      }
    }catch(e){
      console.error(e);
    }
  }

  // Render posts fetched from backend into the feed container
  function renderFeedFromApi(posts){
    const feed = document.querySelector('.feed-container');
    if(!feed) return;
    // create a simple map of existing post ids in DOM to avoid duplicates
    const existing = new Set(Array.from(feed.querySelectorAll('[data-post-id]')).map(n=>n.dataset.postId));
    // insert in reverse so newest on top
    posts.slice().reverse().forEach(p=>{
      if(!p) return;
      const pid = p.id || p.postId || p._id;
      if(pid && existing.has(pid)) return;
      // set canonical id on the object for insertPostIntoFeed
      p.id = pid || p.id;
      insertPostIntoFeed(p);
      // mark inserted node(s)
      const added = feed.querySelector('[data-post-id="'+(p.id||'')+'"]');
      if(added) existing.add(p.id);
    });
  }

  function showOverlay(title, text){
    let overlay = document.getElementById('dev-overlay');
    if(!overlay){
      overlay = document.createElement('div');
      overlay.id = 'dev-overlay';
      Object.assign(overlay.style, {
        position: 'fixed', right: '20px', bottom: '20px', width: '420px', maxHeight: '70vh', overflow: 'auto',
        background: 'rgba(255,255,255,0.98)', border: '1px solid #ccc', padding: '12px', zIndex: 99999, boxShadow: '0 6px 24px rgba(0,0,0,0.2)'
      });
      document.body.appendChild(overlay);
    }
    overlay.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><strong>${title}</strong><button id='dev-overlay-close'>Close</button></div><pre style="white-space:pre-wrap;font-size:12px">${escapeHtml(text)}</pre>`;
    document.getElementById('dev-overlay-close').onclick = () => overlay.remove();
  }

  function escapeHtml(s){
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function renderControlPanel(){
    let panel = document.getElementById('dev-controls');
    if(panel) return; // already added
    panel = document.createElement('div');
    panel.id = 'dev-controls';
    Object.assign(panel.style, {
      position: 'fixed', left: '20px', bottom: '20px', width: '220px', background: '#fff', padding: '10px', border: '1px solid rgba(0,0,0,0.08)', zIndex: 99999, borderRadius: '8px', boxShadow: '0 6px 18px rgba(0,0,0,0.12)'
    });

    const title = document.createElement('div');
    title.textContent = 'Dev Controls';
    title.style.fontWeight = '700';
    title.style.marginBottom = '8px';
    panel.appendChild(title);

    const publishBtn = document.createElement('button');
    publishBtn.textContent = 'Publish first prepared';
    publishBtn.onclick = () => {
      if(prepared.length === 0) return alert('No prepared posts loaded');
      publish(prepared[0].id);
    };
    publishBtn.style.width = '100%';
    publishBtn.style.marginBottom = '6px';
    panel.appendChild(publishBtn);

    const choose = document.createElement('select');
    choose.style.width = '100%';
    prepared.forEach(p => {
      const o = document.createElement('option'); o.value = p.id; o.text = p.id + ' — ' + (p.text.slice(0,40).replace(/\n/g,' ')) + '...';
      choose.appendChild(o);
    });
    panel.appendChild(choose);

    const publishChosen = document.createElement('button');
    publishChosen.textContent = 'Publish chosen';
    publishChosen.style.width = '100%';
    publishChosen.onclick = () => publish(choose.value);
    publishChosen.style.marginTop = '6px';
    panel.appendChild(publishChosen);

    const feedBtn = document.createElement('button');
    feedBtn.textContent = 'Show feed';
    feedBtn.style.width = '100%';
    feedBtn.style.marginTop = '8px';
    feedBtn.onclick = loadFeed;
    panel.appendChild(feedBtn);

    const dayBtn = document.createElement('button');
    dayBtn.textContent = 'Trigger day event';
    dayBtn.style.width = '100%';
    dayBtn.style.marginTop = '6px';
    dayBtn.onclick = triggerDay;
    panel.appendChild(dayBtn);

    // quick navigation buttons for important screens
    const openCal = document.createElement('button'); openCal.textContent = 'Open Calibration'; openCal.style.width='100%'; openCal.style.marginTop='6px'; openCal.onclick = ()=>{ showScreen('real-ai-screen'); wireDeepfakeCard(); };
    panel.appendChild(openCal);
    const openStats = document.createElement('button'); openStats.textContent = 'Open Statistics'; openStats.style.width='100%'; openStats.style.marginTop='6px'; openStats.onclick = ()=>{ showScreen('stats-screen'); showStats(); };
    panel.appendChild(openStats);
    const openFinal = document.createElement('button'); openFinal.textContent = 'Show Results'; openFinal.style.width='100%'; openFinal.style.marginTop='6px'; openFinal.onclick = showFinal;
    panel.appendChild(openFinal);

    document.body.appendChild(panel);

    // wire existing Start button if present
    const start = document.querySelector('.btn-start');
    if(start){
      start.style.cursor = 'pointer';
      start.addEventListener('click', (e)=>{ e.preventDefault(); triggerDay(); });
    }
    // wire post cards after control panel is added
    wirePostCards();
    // wire navigation tabs and actions
    wireTabs();
    wireActionCards();
    wireDeepfakeCard();
    wirePostActions();
    wireArrows();
    // show feed by default
    showScreen('feed-screen');
  }

  function wirePostCards(){
    const cards = Array.from(document.querySelectorAll('[class*="post-card"], .main-post-card'));
    if(cards.length === 0) return;
    cards.forEach((card, idx) => {
      card.style.cursor = 'pointer';
      // avoid attaching multiple times
      if(card.__dev_wired) return;
      card.__dev_wired = true;
      card.addEventListener('click', (e) => {
        e.preventDefault();
        // prefer explicit mapping via dataset
        const pid = card.dataset.postId;
        let p = null;
        if(pid) p = prepared.find(x => x.id === pid);
        // fallback: use same index mapping
        if(!p) p = prepared[idx];
        if(!p){
          showOverlay('No mapping', 'No prepared post mapped for this card. Use Dev Controls.');
          return;
        }
        populatePostDetail(p);
        showScreen('post-detail-screen');
      });
    });
  }

  // Try to associate prepared posts with visible cards by matching author or text snippet
  function mapPreparedToCards(){
    if(!prepared || prepared.length===0) return;
    const cards = Array.from(document.querySelectorAll('[class*="post-card"], .main-post-card'));
    if(cards.length===0) return;
    // build a simple index of card text content
    const cardTexts = cards.map(c => (c.innerText || '').toLowerCase());
    prepared.forEach(p => {
      const text = (p.text || p.content || '').toLowerCase();
      const author = (p.author || '').toLowerCase();
      let matched = -1;
      // try author match
      if(author){
        matched = cardTexts.findIndex(t => t.includes(author));
      }
      // try text snippet match (first 8 chars words)
      if(matched === -1 && text){
        const snippet = text.split(/\s+/).slice(0,8).join(' ');
        if(snippet) matched = cardTexts.findIndex(t => t.includes(snippet));
        // try any significant word
        if(matched === -1){
          const words = text.split(/\W+/).filter(w=>w.length>4).slice(0,6);
          for(const w of words){
            matched = cardTexts.findIndex(t => t.includes(w));
            if(matched !== -1) break;
          }
        }
      }
      // if matched, attach dataset and visual badge
      if(matched !== -1){
        const card = cards[matched];
        if(card){
          card.dataset.postId = p.id;
          // add small badge for dev visibility
          if(!card.querySelector('.dev-post-badge')){
            const b = document.createElement('div');
            b.className = 'dev-post-badge';
            Object.assign(b.style, {position:'absolute', right:'8px', top:'8px', background:'#000', color:'#fff', padding:'2px 6px', fontSize:'11px', borderRadius:'6px', opacity:0.85});
            b.textContent = p.id;
            // ensure card positioned relative
            if(getComputedStyle(card).position === 'static') card.style.position = 'relative';
            card.appendChild(b);
          }
        }
      }
    });
    // re-wire post cards after mapping
    wirePostCards();
  }

  // Navigation: show/hide main screen sections
  function showScreen(className){
    const container = document.querySelector('.main-container');
    if(!container) return;
    const screens = Array.from(container.children).filter(n => n.nodeType===1);
    screens.forEach(s => {
      if(s.classList.contains(className)){
        // force visible screens to use flex when applicable so CSS layouts render reliably
        const useFlex = /\b(screen|feed|city|actions|profile|stats)\b/i.test(s.className);
        s.style.display = useFlex ? 'flex' : 'block';
      } else {
        s.style.display = 'none';
      }
    });
    // ensure visible screen is scrolled into view
    const visible = container.querySelector('.' + className);
    if(visible && typeof visible.scrollIntoView === 'function') visible.scrollIntoView({behavior:'auto', block:'start'});
    // small visual hint in console
    console.log('Navigated to', className);
  }

  // Wire bottom nav tabs to screens
  function wireTabs(){
    const tabFeed = document.querySelectorAll('[class*="tab-feed"]');
    const tabCity = document.querySelectorAll('[class*="tab-city"]');
    const tabActions = document.querySelectorAll('[class*="tab-actions"]');
    const tabStats = document.querySelectorAll('[class*="tab-stats"]');
    const tabProfile = document.querySelectorAll('[class*="tab-profile"]');
    function attach(tabList, handler){
      tabList.forEach(t => {
        try{ t.style.cursor = 'pointer'; t.style.zIndex = 9999; t.style.pointerEvents = 'auto'; }catch(e){}
        // attach to container
        t.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); handler(e); });
        // also attach to child label if present (some variants put label deeper)
        const span = t.querySelector('span');
        if(span) span.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); handler(e); });
      });
    }
    attach(tabFeed, ()=> showScreen('feed-screen'));
    attach(tabCity, ()=> showScreen('my-city-screen'));
    attach(tabActions, ()=> showScreen('actions-screen'));
    attach(tabStats, ()=> { showScreen('stats-screen'); showStats(); });
    attach(tabProfile, ()=> showScreen('character-profile-screen'));
  }

  // Insert published post into the visible feed (clones first post-card as template)
  function insertPostIntoFeed(post){
    if(!post) return;
    const feed = document.querySelector('.feed-container');
    if(!feed) return;
    // prefer to clone an existing post card
    const template = feed.querySelector('.post-card-katya, .post-card-max, .main-post-card');
    let node;
    if(template){
      node = template.cloneNode(true);
      // remove dev badge if any
      const badge = node.querySelector('.dev-post-badge'); if(badge) badge.remove();
      // fill fields
      const authorEl = node.querySelector('.author-name, .author-name-d, .ann-journalist, .author-meta span');
      const contentEl = node.querySelector('.post-text, .post-text-f, .post-content');
      const timeEl = node.querySelector('.post-time, .post-time-e, .time-ago-116');
      const imgEl = node.querySelector('.post-image, .post-image-117, .post-image');
      if(authorEl) authorEl.textContent = post.author || (post.user && post.user.name) || (post.id || 'Author');
      if(contentEl) contentEl.textContent = post.text || post.content || '';
      if(timeEl) timeEl.textContent = post.time || 'just now';
      if(imgEl){
        if(post.image_url) imgEl.style.backgroundImage = 'url("'+post.image_url+'")';
        else imgEl.style.backgroundImage = '';
      }
      // insert at top
      // set dataset id for future dedupe/mapping
      if(post.id) node.dataset.postId = post.id;
      feed.insertBefore(node, feed.firstChild);
    } else {
      // fallback: simple DOM element
      node = document.createElement('div');
      node.className = 'post-card-generated';
      node.style.padding = '12px'; node.style.borderBottom = '1px solid #eee';
      node.innerHTML = '<strong>'+(post.author||post.id||'Author')+'</strong><div>'+(post.text||'')+'</div>';
      if(post.id) node.dataset.postId = post.id;
      feed.insertBefore(node, feed.firstChild);
    }
    // re-run mapping/wiring so new card is interactive
    mapPreparedToCards();
  }

  // Populate post-detail-screen with a prepared post object
  function populatePostDetail(post){
    const detail = document.querySelector('.post-detail-screen');
    if(!detail) return;
    const title = detail.querySelector('.anns-post');
    const content = detail.querySelector('.post-content');
    const time = detail.querySelector('.time-ago-116');
    const img = detail.querySelector('.post-image-117');
    if(title) title.textContent = (post.author || post.id || 'Post');
    if(content) content.textContent = post.text || post.content || '(no text)';
    if(time) time.textContent = post.time || 'just now';
    if(img){
      if(post.image_url) img.style.backgroundImage = 'url("'+post.image_url+'")';
      else img.style.backgroundImage = '';
    }
  }

  // Wire action cards inside Actions screen to simulate API interaction
  function wireActionCards(){
    const actionCards = Array.from(document.querySelectorAll('.action-card, .action-card-91, .action-card-9b, .action-card-a3'));
    actionCards.forEach(card => {
      if(card.__action_wired) return; card.__action_wired = true;
      card.style.cursor = 'pointer';
      card.addEventListener('click', (e)=>{
        e.preventDefault();
        const title = card.querySelector('.action-title, .action-title-97, .action-title-9f, .action-title-a8');
        const actionName = title ? title.textContent.trim() : 'Action';
        const ok = confirm('Perform "'+actionName+'"?');
        if(!ok) return;
        // simple simulated behaviour
        if(/fact/i.test(actionName)){
          showOverlay('Fact check', 'Request sent. Result will appear in ~1 day (simulated).');
        } else if(/calm|question/i.test(actionName)){
          showOverlay('Calm question', 'Sent an empathetic reply to the conversation.');
        } else if(/reveal|sticker/i.test(actionName)){
          showOverlay('Revealing sticker', 'Sticker deployed. Message spread increased.');
        } else {
          showOverlay(actionName, 'Action simulated.');
        }
      });
    });
  }

  // Wire like/comment icons to open a small chat/comment area below the post
  function wirePostActions(){
    const cards = Array.from(document.querySelectorAll('[class*="post-card"], .main-post-card'));
    cards.forEach(card => {
      if(card.__actions_wired) return; card.__actions_wired = true;
      const like = card.querySelector('.action-like, .action-like-119, .heart-off, .heart');
      const comment = card.querySelector('.action-comment, .action-comment, .action-comment-11a, .message-circle');
      if(like){ like.style.cursor='pointer'; like.addEventListener('click', (e)=>{ e.preventDefault(); // increment likes count visually
        const cnt = like.querySelector('.likes-count') || like.querySelector('.like-count') || like.querySelector('span');
        if(cnt){ const n = parseInt(cnt.textContent||'0'); cnt.textContent = (n+1).toString(); }
      }); }
      if(comment){ comment.style.cursor='pointer'; comment.addEventListener('click', (e)=>{ e.preventDefault(); toggleCommentsArea(card); }); }
    });
  }

  function toggleCommentsArea(card){
    let area = card.querySelector('.dev-comments');
    if(area){ area.remove(); return; }
    area = document.createElement('div'); area.className = 'dev-comments';
    Object.assign(area.style,{padding:'8px',background:'#fafafa',borderTop:'1px solid #eee'});
    // try to show sample comments from mapped prepared post
    const pid = card.dataset.postId;
    let comments = [];
    if(pid && window.prepared){ const p = window.prepared.find(x=>x.id===pid); if(p && p.sample_comments) comments = p.sample_comments; }
    // fallback sample
    if(comments.length===0) comments = ['Nice!', 'Is this true?', 'We should check.'];
    const list = document.createElement('div');
    comments.forEach(c=>{ const d = document.createElement('div'); d.textContent = c; d.style.marginBottom='6px'; list.appendChild(d); });
    const input = document.createElement('input'); input.type='text'; input.placeholder='Write a comment...'; input.style.width='100%'; input.style.marginTop='6px';
    input.addEventListener('keydown', (e)=>{ if(e.key==='Enter' && input.value.trim()){ const d = document.createElement('div'); d.textContent = 'You: '+input.value; d.style.marginBottom='6px'; list.appendChild(d); input.value=''; } });
    area.appendChild(list); area.appendChild(input);
    card.appendChild(area);
  }

  // Make arrow/chevron icons navigational (back/home)
  function wireArrows(){
    const arrows = Array.from(document.querySelectorAll('[class*="arrow-left"], [class*="chevron-left"], .chevron-right, .arrow-left-111'));
    arrows.forEach(a=>{ if(a.__arrow_wired) return; a.__arrow_wired = true; a.style.cursor='pointer'; a.addEventListener('click',(e)=>{ e.preventDefault(); showScreen('feed-screen'); }); });
  }

  // Wire the image-analysis (deepfake) card: load a random image and handle buttons
  function wireDeepfakeCard(){
    const card = document.querySelector('.image-analysis-card');
    if(!card || card.__df_wired) return; card.__df_wired = true;
    const img = card.querySelector('.ambiguous-image');
    const btnReal = card.querySelector('.btn-real');
    const btnAi = card.querySelector('.btn-ai');
    const btnUnsure = card.querySelector('.btn-unsure');
    // use placeholder images from picsum
    function loadImage(){
      const seed = Math.floor(Math.random()*1000);
      if(img) img.style.backgroundImage = 'url(https://picsum.photos/seed/'+seed+'/600/360)';
      // decide ground truth randomly and store on card
      const isAi = Math.random() > 0.6;
      card.dataset.isAi = isAi ? 'true' : 'false';
      // reset buttons
      [btnReal, btnAi, btnUnsure].forEach(b => { if(b){ b.style.background=''; b.style.color=''; b.disabled = false; } });
      // remove feedback area
      const old = card.querySelector('.dev-calib-feedback'); if(old) old.remove();
    }

    function showFeedback(correct, groundTruth, explanation){
      let area = card.querySelector('.dev-calib-feedback');
      if(!area){ area = document.createElement('div'); area.className = 'dev-calib-feedback'; Object.assign(area.style,{marginTop:'10px',padding:'8px',background:'#fff',border:'1px solid #e6e6e6',borderRadius:'6px'}); card.querySelector('.card-content')?.appendChild(area); }
      area.innerHTML = '<strong>' + (correct ? 'Correct' : 'Incorrect') + '</strong><div style="margin-top:6px">Ground truth (simulated): <em>'+(groundTruth? 'AI' : 'Real')+'</em></div><div style="margin-top:6px;font-size:13px;color:#333">'+explanation+'</div>';
    }

    function onChoice(choice){
      const isAi = card.dataset.isAi === 'true';
      // highlight selected
      [btnReal, btnAi, btnUnsure].forEach(b=>{ if(!b) return; b.style.background=''; b.style.color=''; });
      const selectedBtn = choice === 'real' ? btnReal : choice === 'ai' ? btnAi : btnUnsure;
      if(selectedBtn){ selectedBtn.style.background = '#0a66ff'; selectedBtn.style.color = '#fff'; }
      // determine correctness
      let correct = false;
      if(choice === 'real') correct = !isAi;
      else if(choice === 'ai') correct = isAi;
      else correct = false; // 'not sure' considered incorrect for scoring
      // placeholder explanation
      const explanation = correct ? 'Good: look for natural texture, consistent lighting and readable text.' : 'Look for artifacts: distorted text, odd edges, or unnatural lighting — these often indicate AI-generated images.';
      showFeedback(correct, isAi, explanation);
      // disable buttons until next image
      [btnReal, btnAi, btnUnsure].forEach(b=>{ if(b) b.disabled = true; });
      // report to backend (simulated score)
      const score = correct ? 100 : (choice === 'unsure' ? 50 : 0);
      fetch('/api/calibration/answer', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ score }) })
        .then(r=>r.json()).then(j=>{ const area = card.querySelector('.dev-calib-feedback'); if(area) area.innerHTML += '<div style="margin-top:8px;color:#666;font-size:12px">Server: '+(j.label || JSON.stringify(j))+'</div>'; }).catch(()=>{});
    }

    // initial load
    loadImage();
    if(btnReal) btnReal.addEventListener('click', ()=> onChoice('real'));
    if(btnAi) btnAi.addEventListener('click', ()=> onChoice('ai'));
    if(btnUnsure) btnUnsure.addEventListener('click', ()=> onChoice('unsure'));
    // Next image button
    const next = document.createElement('button'); next.textContent = 'Next image'; Object.assign(next.style,{marginTop:'8px',padding:'6px 8px',cursor:'pointer'});
    next.addEventListener('click', ()=> loadImage());
    card.querySelector('.card-content')?.appendChild(next);
  }

  // Fetch finale and show in stats screen or overlay
  async function showFinal(){
    try{
      const res = await fetch('/api/final');
      const data = await res.json();
      // put content into stats screen area
      // prefer finale-screen when present (final results page)
      const finale = document.querySelector('.finale-screen');
      const stats = finale || document.querySelector('.stats-screen');
      if(stats){
        let fc = stats.querySelector('.final-content');
        if(!fc){ fc = document.createElement('div'); fc.className='final-content'; fc.style.padding='12px';
          // support variants where main-scroll may have numeric suffix
          const mainScroll = stats.querySelector('[class*="main-scroll"]');
          if(mainScroll) mainScroll.prepend(fc);
          else stats.prepend(fc);
        }
        fc.innerHTML = '<h3>Results of the game</h3><pre style="white-space:pre-wrap">'+escapeHtml(JSON.stringify(data, null, 2))+'</pre>';
        // show the appropriate screen
        if(finale) showScreen('finale-screen'); else showScreen('stats-screen');
      } else {
        showOverlay('Results', JSON.stringify(data, null, 2));
      }
    }catch(e){ console.warn('Final load failed', e); }
  }

  // Compute simple stats from /api/feed and populate stats-screen
  async function showStats(){
    try{
      const res = await fetch(API_BASE + '/api/feed');
      const data = await res.json();
      // simple metrics: posts count, reactions count
      const posts = Array.isArray(data) ? data : (data.posts||[]);
      const total = posts.length;
      const trust = Math.max(10, 60 - total*2); // placeholder logic
      const anxiety = Math.min(90, 30 + total*3);
      const polarization = Math.min(100, 40 + total*4);
      // update stats screen DOM
      const pct = document.querySelector('.percentage-cb'); if(pct) pct.textContent = trust + '%';
      const trustEl = document.querySelector('.percentage'); if(trustEl) trustEl.textContent = trust + '%';
      const anxEl = document.querySelector('.percentage-25'); if(anxEl) anxEl.textContent = anxiety + '%';
      const polEl = document.querySelector('.percentage-2a'); if(polEl) polEl.textContent = polarization + '%';
      showOverlay('Stats', 'Posts: '+total+'\nTrust: '+trust+'%\nAnxiety: '+anxiety+'%\nPolarization: '+polarization+'%');
    }catch(e){ console.warn('Stats load failed', e); }
  }

  // Force certain UI texts to English for consistency
  function setEnglishText(){
    // robustly set bottom tab labels by matching parent tab classes
    document.querySelectorAll('[class*="tab-feed"]').forEach(tab=>{ const s = tab.querySelector('span'); if(s) s.textContent='Feed'; });
    document.querySelectorAll('[class*="tab-city"]').forEach(tab=>{ const s = tab.querySelector('span'); if(s) s.textContent='City'; });
    document.querySelectorAll('[class*="tab-actions"]').forEach(tab=>{ const s = tab.querySelector('span'); if(s) s.textContent='Actions'; });
    document.querySelectorAll('[class*="tab-stats"]').forEach(tab=>{ const s = tab.querySelector('span'); if(s) s.textContent='Stats'; });
    document.querySelectorAll('[class*="tab-profile"]').forEach(tab=>{ const s = tab.querySelector('span'); if(s) s.textContent='Profile'; });
    // header titles
    document.querySelectorAll('.header-title, .header-title-21').forEach(el=>{ if(el) el.textContent = el.textContent.includes('city')? 'My city': el.textContent; });
    // actions list titles
    document.querySelectorAll('.action-title, .action-title-97, .action-title-9f, .action-title-a8').forEach(el=>{ if(el) el.textContent = el.textContent.trim(); });
    // Calibration / real-ai screen texts
    const calTitle = document.querySelector('.header-title-c8'); if(calTitle) calTitle.textContent = 'Calibration of confidence';
    const calSubtitle = document.querySelector('.header-subtitle-ca'); if(calSubtitle) calSubtitle.textContent = 'Mission: 3 out of 10';
    const progLabel = document.querySelector('.progress'); if(progLabel) progLabel.textContent = 'Progress';
    const progPct = document.querySelector('.percentage-cb'); if(progPct) progPct.textContent = '30%';
    const question = document.querySelector('.question'); if(question) question.textContent = 'Was this image created by AI?';
    const btnReal = document.querySelector('.btn-real'); if(btnReal) btnReal.textContent = 'Real';
    const btnAi = document.querySelector('.btn-ai'); if(btnAi) btnAi.textContent = 'AI';
    const btnUnsure = document.querySelector('.btn-unsure'); if(btnUnsure) btnUnsure.textContent = 'Not sure';
    const hint = document.querySelector('.hint-text'); if(hint) hint.textContent = 'Hint: Look at the text on the presentation slide.';
    // Stats screen header
    document.querySelectorAll('.statistics, .header-title-13d').forEach(el=>{ if(el) el.textContent = 'Statistics'; });
    // Results header placeholder
    document.querySelectorAll('.results-of-the-day').forEach(el=>{ if(el) el.textContent = 'Results of the day'; });
    // ensure labels in bottom nav are English where possible
    document.querySelectorAll('[class*="feed"]').forEach(el=>{ if(el && el.textContent.trim()) el.textContent = 'Feed'; });
  }

  // Add floating quick-access buttons for Calibration/Stats/Results (always visible)
  function addQuickAccessButtons(){
    if(document.getElementById('quick-access')) return;
    const wrap = document.createElement('div'); wrap.id = 'quick-access';
    Object.assign(wrap.style, {position:'fixed', right:'16px', top:'16px', zIndex:99999, display:'flex', flexDirection:'column', gap:'6px'});
    // Add direct Feed/City buttons for users when bottom tabs are unresponsive
    const bFeed = document.createElement('button'); bFeed.textContent='Feed'; bFeed.onclick = ()=>{ showScreen('feed-screen'); loadFeed(); };
    const bCity = document.createElement('button'); bCity.textContent='City'; bCity.onclick = ()=>{ showScreen('my-city-screen'); };
    [bFeed,bCity].forEach(b=>{ Object.assign(b.style,{padding:'8px 10px',background:'#fff',border:'1px solid #ddd',borderRadius:'6px',cursor:'pointer'}); wrap.appendChild(b); });
    const b1 = document.createElement('button'); b1.textContent='Calibration'; b1.onclick = ()=>{ showScreen('real-ai-screen'); wireDeepfakeCard(); };
    const b2 = document.createElement('button'); b2.textContent='Statistics'; b2.onclick = ()=>{ showScreen('stats-screen'); showStats(); };
    const b3 = document.createElement('button'); b3.textContent='Results'; b3.onclick = showFinal;
    [b1,b2,b3].forEach(b=>{ Object.assign(b.style,{padding:'8px 10px',background:'#fff',border:'1px solid #ddd',borderRadius:'6px',cursor:'pointer'}); wrap.appendChild(b); });
    document.body.appendChild(wrap);
  }

  // init
  document.addEventListener('DOMContentLoaded', () => {
    setEnglishText();
    addQuickAccessButtons();
    // hide initial cover elements that may overlay the feed
    document.querySelectorAll('.frame-1, .iphone, .splash-bottom, .no-bg-preview').forEach(n=>{ try{ n.style.display='none'; }catch(e){} });
    showScreen('feed-screen');
    fetchPrepared();
    loadFeed();
  });
})();
