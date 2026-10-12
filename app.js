/* PokéDex — UI and app logic. */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const view = $('#view');
  const DEX_TOTAL = 1025;
  let sightings = [];

  /* ---------- helpers ---------- */
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ic = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

  const icons = {
    search: ic('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
    sliders: ic('<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>'),
    back: ic('<path d="m15 18-6-6 6-6"/>'),
    play: ic('<path d="m10 8 5 4-5 4z" fill="currentColor"/>'),
    edit: ic('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>'),
    trash: ic('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
    camera: ic('<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>'),
    book: ic('<path d="M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2z"/><path d="M5 18a2 2 0 0 1 2-2h12"/>'),
    bolt: ic('<path d="M13 3 5 14h6l-1 7 8-11h-6z"/>'),
    layers: ic('<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>'),
    star: ic('<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>'),
    pin: ic('<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>'),
    cal: ic('<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>'),
    download: ic('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'),
    upload: ic('<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>'),
    check: ic('<path d="m5 12 5 5 9-10"/>'),
    x: ic('<path d="M6 6l12 12M18 6 6 18"/>'),
    map: ic('<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>'),
    target: ic('<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.5" fill="currentColor"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>'),
    expand: ic('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
    up: ic('<path d="M12 19V5M6 11l6-6 6 6"/>'),
    dice: ic('<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1" fill="currentColor"/><circle cx="15" cy="15" r="1" fill="currentColor"/><circle cx="15" cy="9" r="1" fill="currentColor"/><circle cx="9" cy="15" r="1" fill="currentColor"/>'),
    sparkle: ic('<path d="M12 3c.6 4.2 2.8 6.4 7 7-4.2.6-6.4 2.8-7 7-.6-4.2-2.8-6.4-7-7 4.2-.6 6.4-2.8 7-7z"/>'),
  };

  const POKEBALL = `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" fill="#F7F7F5"/><path d="M4 50a46 46 0 0 1 92 0z" fill="#E3350D"/><rect x="4" y="46" width="92" height="8" fill="#0A0A0B"/><circle cx="50" cy="50" r="46" fill="none" stroke="#0A0A0B" stroke-width="6"/><circle cx="50" cy="50" r="15" fill="#F7F7F5" stroke="#0A0A0B" stroke-width="6"/><circle cx="50" cy="50" r="6" fill="#F7F7F5" stroke="#0A0A0B" stroke-width="3"/></svg>`;

  const TYPE_COLORS = {
    normal: '#A8A77A', fire: '#EE8130', water: '#6390F0', electric: '#F7D02C', grass: '#7AC74C',
    ice: '#96D9D6', fighting: '#C22E28', poison: '#A33EA1', ground: '#E2BF65', flying: '#A98FF3',
    psychic: '#F95587', bug: '#A6B91A', rock: '#B6A136', ghost: '#735797', dragon: '#6F35FC',
    dark: '#705746', steel: '#B7B7CE', fairy: '#D685AD',
  };
  const STAT_SHORT = { hp: 'HP', attack: 'ATK', defense: 'DEF', 'special-attack': 'SP.A', 'special-defense': 'SP.D', speed: 'SPE' };

  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
  const dexNo = (n) => '#' + String(n).padStart(3, '0');
  const stars = (t) => '★'.repeat(t) + '☆'.repeat(5 - t);
  const artOf = (s) => s.artData || s.artUrl || (s.pokemon && s.pokemon.artwork) || '';
  const uid = () => (window.crypto && crypto.randomUUID)
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);
  const todayISO = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  };
  const fmtDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso.length === 10 ? iso + 'T00:00:00' : iso);
    return isNaN(d) ? '' : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  };
  const typeChip = (t) =>
    `<span class="chip type" style="--c:${TYPE_COLORS[t] || '#999'}"><span class="type-dot"></span>${cap(t)}</span>`;
  const NAME_KEY = 'pokelog:trainer';
  const trainerName = () => {
    try {
      const prof = JSON.parse(localStorage.getItem('pokelog:trainer-profile') || '{}');
      return localStorage.getItem(NAME_KEY) || prof.name || 'Trainer';
    } catch (_) { return 'Trainer'; }
  };
  let activeMaps = [];
  const hasCoords = (s) => typeof s.lat === 'number' && typeof s.lng === 'number';
  let viewCleanup = null; // screens that add page-level listeners register a teardown here

  async function refresh() {
    sightings = (await DB.all()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }

  function mount(html) {
    view.innerHTML = html;
    view.classList.remove('view-enter');
    void view.offsetWidth;
    view.classList.add('view-enter');
  }

  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  function confirmSheet({ title, body, ok = 'Delete' }) {
    return new Promise((resolve) => {
      const el = document.createElement('div');
      el.className = 'sheet-backdrop';
      el.innerHTML = `
        <div class="sheet glass" role="dialog" aria-modal="true" aria-label="${esc(title)}">
          <h3>${esc(title)}</h3>
          <p>${esc(body)}</p>
          <div class="sheet-actions">
            <button class="btn btn-ghost" data-v="0">Cancel</button>
            <button class="btn btn-red" data-v="1">${esc(ok)}</button>
          </div>
        </div>`;
      document.body.appendChild(el);
      requestAnimationFrame(() => el.classList.add('open'));
      const close = (v) => {
        el.classList.remove('open');
        setTimeout(() => el.remove(), 220);
        document.removeEventListener('keydown', onKey);
        resolve(v);
      };
      const onKey = (e) => { if (e.key === 'Escape') close(false); };
      document.addEventListener('keydown', onKey);
      el.addEventListener('click', (e) => {
        if (e.target === el) return close(false);
        const b = e.target.closest('[data-v]');
        if (b) close(b.dataset.v === '1');
      });
      el.querySelector('[data-v="0"]').focus();
    });
  }

  function compressImage(file, max = 1400, quality = 0.82) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('decode')); };
      img.src = url;
    });
  }

  async function urlToDataURL(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('fetch');
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  }

  /* ---------- router ---------- */
  function setTab(name) {
    document.querySelectorAll('[data-tab]').forEach((t) =>
      t.classList.toggle('active', t.dataset.tab === name));
  }

  function router() {
    if (viewCleanup) { viewCleanup(); viewCleanup = null; }
    activeMaps.forEach((m) => m.remove());
    activeMaps = [];
    const parts = (location.hash.slice(1) || '/').split('/').filter(Boolean);
    window.scrollTo(0, 0);
    const [route, id] = parts;
    setTab(['add', 'dex', 'map', 'settings'].includes(route) ? route : 'home');
    if (route === 'map') return renderMap(id);
    if (route === 'types') return renderTypes(id);
    if (!route) return renderHome();
    if (route === 'add') return renderForm(null, id);
    if (route === 'dex') return renderDex();
    if (route === 'edit') return renderForm(id);
    if (route === 's') return renderDetail(id);
    if (route === 'settings') return renderSettings();
    renderHome();
  }

  /* ---------- home ---------- */
  function ring(pct, value, label, tone, icon, href) {
    const r = 38;
    const c = 2 * Math.PI * r;
    const p = Math.max(0, Math.min(1, pct));
    const tag = href ? 'a' : 'div';
    return `
      <${tag} class="ring ring-${tone}"${href ? ` href="${href}" aria-label="Open ${label}"` : ''}>
        <div class="ring-dial">
          <svg class="ring-svg" viewBox="0 0 92 92" aria-hidden="true">
            <circle class="track" cx="46" cy="46" r="${r}"/>
            <circle class="bar" cx="46" cy="46" r="${r}" stroke-dasharray="${c.toFixed(2)}"
              stroke-dashoffset="${c.toFixed(2)}" data-off="${(c * (1 - p)).toFixed(2)}"/>
          </svg>
          <div class="ring-center">${icon}<b>${value}</b></div>
        </div>
        <span>${label}</span>
      </${tag}>`;
  }

  function renderHome() {
    const unique = new Set(sightings.map((s) => s.pokemon.id)).size;
    const types = new Set(sightings.flatMap((s) => s.pokemon.types)).size;
    const gens = new Set(sightings.map((s) => s.pokemon.generation)).size;
    const dexPct = unique / DEX_TOTAL;
    const dexLabel = dexPct === 0 ? '0%' : dexPct < 0.1 ? (dexPct * 100).toFixed(1) + '%' : Math.round(dexPct * 100) + '%';

    mount(`
      <section class="hero-panel">
        <header class="top">
          <h1 class="hello">Hi, ${esc(trainerName())}</h1>
          <div class="top-actions">
            <a class="icon-btn" href="#/map" aria-label="Sightings map">${icons.map}</a>
          </div>
        </header>
        <div class="rings">
          ${ring(dexPct, dexLabel, 'Pokédex', 'white', icons.book, '#/dex')}
          ${ring(types / 18, `${types}/18`, 'Types', 'red', icons.bolt, '#/types')}
          ${ring(gens / 9, `${gens}/9`, 'Generations', 'soft', icons.layers)}
        </div>
      </section>



      <div class="section-head">
        <h2>Your Pokémon</h2>
        <span class="count" id="listCount">${sightings.length}</span>
      </div>
      <div class="date-filter">
        <div class="gen-chips" id="dateChips" aria-label="Filter by date seen">
          <button type="button" class="sort-chip" id="sortBtn" aria-label="Change sort order">${homeFilter.sort === 'new' ? '↓ Newest' : '↑ Oldest'}</button>
          ${DATE_RANGES.map(([k, l]) => `<button type="button" data-range="${k}" class="${homeFilter.range === k ? 'on' : ''}">${l}</button>`).join('')}
        </div>
        <div class="date-custom" id="dateCustom" ${homeFilter.range === 'custom' ? '' : 'hidden'}>
          <label>From<input type="date" id="dFrom" value="${esc(homeFilter.from)}"></label>
          <label>To<input type="date" id="dTo" value="${esc(homeFilter.to)}"></label>
        </div>
      </div>
      <div id="list" class="stack"></div>
    `);

    requestAnimationFrame(() => {
      document.querySelectorAll('.ring .bar').forEach((b) => b.setAttribute('stroke-dashoffset', b.dataset.off));
    });

    const update = () => {
      const [from, to] = rangeBounds();
      const logs = sightings
        .filter((s) => {
          const d = s.seenAt || '';
          if (from && d < from) return false;
          if (to && d > to) return false;
          return true;
        })
        .sort(byDateDesc);
      // group the matching logs by Pokémon
      const groups = new Map();
      logs.forEach((s) => {
        const g = groups.get(s.pokemon.id);
        if (g) g.logs.push(s); else groups.set(s.pokemon.id, { logs: [s] });
      });
      const items = [...groups.values()].map((g) => ({
        latest: g.logs[0],
        oldest: g.logs[g.logs.length - 1],
        matching: g.logs,
        total: sightings.filter((x) => x.pokemon.id === g.logs[0].pokemon.id).length,
      }));
      items.sort((a, b) => (homeFilter.sort === 'new'
        ? byDateDesc(a.latest, b.latest)
        : (a.oldest.seenAt || '').localeCompare(b.oldest.seenAt || '') || (a.oldest.createdAt || 0) - (b.oldest.createdAt || 0)));
      $('#listCount').textContent = items.length;
      drawList(items, !!(from || to));
    };
    update();

    $('#dateChips').addEventListener('click', (e) => {
      const b = e.target.closest('[data-range]');
      if (!b) return;
      homeFilter.range = b.dataset.range;
      $('#dateChips').querySelectorAll('[data-range]').forEach((x) => x.classList.toggle('on', x === b));
      $('#dateCustom').hidden = homeFilter.range !== 'custom';
      update();
    });
    $('#sortBtn').addEventListener('click', () => {
      homeFilter.sort = homeFilter.sort === 'new' ? 'old' : 'new';
      $('#sortBtn').textContent = homeFilter.sort === 'new' ? '↓ Newest' : '↑ Oldest';
      update();
    });
    ['dFrom', 'dTo'].forEach((idName) => $('#' + idName).addEventListener('change', (e) => {
      homeFilter[idName === 'dFrom' ? 'from' : 'to'] = e.target.value;
      update();
    }));
  }

  /* ---------- date filter helpers ---------- */
  function byDateDesc(a, b) { return (b.seenAt || '').localeCompare(a.seenAt || '') || (b.createdAt || 0) - (a.createdAt || 0); }
  const DATE_RANGES = [['all', 'All time'], ['today', 'Today'], ['week', 'Last 7 days'], ['month', 'Last 30 days'], ['year', 'This year'], ['custom', 'Custom']];
  const homeFilter = { range: 'all', from: '', to: '', sort: 'new' };
  const isoDaysAgo = (n) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  };
  function rangeBounds() {
    const today = todayISO();
    switch (homeFilter.range) {
      case 'today': return [today, today];
      case 'week': return [isoDaysAgo(6), today];
      case 'month': return [isoDaysAgo(29), today];
      case 'year': return [today.slice(0, 4) + '-01-01', today];
      case 'custom': return [homeFilter.from || '', homeFilter.to || ''];
      default: return ['', ''];
    }
  }

  function drawList(items, filtered = false) {
    const list = $('#list');
    if (!items.length) {
      list.innerHTML = filtered
        ? `<div class="empty"><h3>No sightings here</h3><p>Nothing was sighted in this date range — try widening it.</p></div>`
        : `<div class="empty">
             <div class="ball">${POKEBALL}</div>
             <h3>No sightings yet</h3>
             <p>Spotted a Pokémon? Snap it, type its name, and the Pokédex fills itself in.</p>
             <a class="btn btn-red" href="#/add">${icons.camera} Log your first sighting</a>
           </div>`;
      return;
    }
    const variants = ['v-red', 'v-white', 'v-dark'];
    list.innerHTML = items.map((g, i) => {
      const s = g.latest;
      const p = s.pokemon;
      const withPhoto = g.matching.find((x) => x.photo);
      const v = i === 0 ? 'v-red' : variants[1 + ((i - 1) % 2)];
      return `
        <a class="s-card ${v}" href="#/s/${encodeURIComponent(s.id)}">
          <div class="s-head">
            <div>
              <h3>${esc(p.name)}</h3>
              ${s.nickname ? `<p class="s-nick">“${esc(s.nickname)}”</p>` : `<p class="s-nick">${dexNo(p.id)}</p>`}
            </div>
            ${withPhoto ? `<span class="s-thumb"><img src="${withPhoto.photo}" alt="" loading="lazy">${g.total > 1 ? `<em class="s-count">×${g.total}</em>` : ''}</span>`
              : g.total > 1 ? `<span class="s-thumb s-thumb-count"><em class="s-count">×${g.total}</em></span>` : ''}
          </div>
          <img class="s-art" src="${esc(artOf(s))}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">
          <div class="s-foot">
            <div class="s-meta">
              <span class="tag">Gen ${p.genRoman}</span>
              <span class="tag">${esc(p.rarity.label)}</span>
              ${g.matching.some((x) => x.shiny) ? '<span class="tag">✦ Shiny</span>' : ''}
              ${g.total > 1 ? `<span class="tag">${g.total} sightings</span>` : ''}
            </div>
            <span class="go-pill">${fmtDate(s.seenAt) || 'View'} <span class="go">${icons.play}</span></span>
          </div>
        </a>`;
    }).join('');
  }

  /* ---------- personality (built from the Pokémon's real data) ---------- */
  const TYPE_TRAITS = {
    normal: ['Easygoing', 'easygoing and adaptable'],
    fire: ['Fiery', 'fiery and passionate'],
    water: ['Serene', 'serene and happy to go with the flow'],
    grass: ['Gentle', 'gentle and patient'],
    electric: ['Energetic', 'energetic and a little restless'],
    ice: ['Reserved', 'cool-headed and reserved'],
    fighting: ['Disciplined', 'disciplined and determined'],
    poison: ['Wary', 'wary and quick to defend itself'],
    ground: ['Steady', 'steady and stubborn'],
    flying: ['Free-spirited', 'free-spirited and adventurous'],
    psychic: ['Perceptive', 'perceptive and introspective'],
    bug: ['Curious', 'curious and hard-working'],
    rock: ['Tough', 'tough and unshakeable'],
    ghost: ['Mischievous', 'mischievous and mysterious'],
    dragon: ['Proud', 'proud and strong-willed'],
    dark: ['Cunning', 'cunning and independent'],
    steel: ['Stoic', 'stoic and resilient'],
    fairy: ['Playful', 'playful and affectionate'],
  };
  const STAT_TRAITS = {
    hp: ['Resilient', 'has incredible stamina and rarely gives up'],
    attack: ['Bold', 'meets every challenge head-on'],
    defense: ['Cautious', 'would rather hold its ground than strike first'],
    'special-attack': ['Clever', 'relies on its wits and special powers'],
    'special-defense': ['Composed', 'stays calm even under pressure'],
    speed: ['Swift', 'is always on the move and hates sitting still'],
  };
  const HABITAT_PLACES = {
    cave: 'caves', forest: 'forests', grassland: 'grasslands', mountain: 'the mountains',
    'rough terrain': 'rough terrain', sea: 'the open sea', urban: 'towns and cities', 'waters edge': 'places near water',
  };

  function personality(p) {
    const traits = [];
    const sentences = [];
    const [t1, t2] = p.types;
    const a = TYPE_TRAITS[t1] || TYPE_TRAITS.normal;
    const b = t2 && TYPE_TRAITS[t2];
    traits.push(a[0]);
    sentences.push(`${p.name} is ${a[1]}${b ? `, with a ${b[0].toLowerCase()} streak` : ''}.`);

    const top = p.stats.slice().sort((x, y) => y.value - x.value)[0];
    const st = top && STAT_TRAITS[top.key];
    if (st) { traits.push(st[0]); sentences.push(`In battle it ${st[1]}.`); }

    const hb = p.baseHappiness;
    if (typeof hb === 'number') {
      const h = hb >= 100 ? ['Affectionate', 'It warms up to people almost instantly.']
        : hb >= 50 ? ['Loyal', 'Once it trusts you, it makes a loyal companion.']
        : hb > 0 ? ['Aloof', 'It tends to keep a polite distance from people.']
        : ['Independent', 'It is fiercely independent and hard to befriend.'];
      traits.push(h[0]);
      sentences.push(h[1]);
    }

    if (p.isMythical || p.isLegendary) sentences.push('Few have ever seen it, and it carries an air of ancient majesty.');
    else if (p.isBaby) sentences.push('Still young, it is innocent and endlessly curious about the world.');
    else if (p.captureRate <= 45) sentences.push('It is elusive and shy around trainers.');
    else if (p.captureRate >= 190) sentences.push('It is a common, approachable sight near people.');

    const place = HABITAT_PLACES[(p.habitat || '').toLowerCase()];
    if (place) sentences.push(`It feels most at home in ${place}.`);

    return { traits: [...new Set(traits)], text: sentences.join(' ') };
  }

  function dexEntryHTML(p) {
    const per = personality(p);
    return `
      <div class="dex-entry-head"><span>Pokédex entry</span><small>${dexNo(p.id)}</small></div>
      <h3>Personality</h3>
      <div class="traits">${per.traits.map((t) => `<span>${esc(t)}</span>`).join('')}</div>
      <div class="entry-body">
        <p class="persona">${esc(per.text)}</p>
        ${p.flavor ? `<div class="flavor"><h3>Field notes</h3><p>${esc(p.flavor)}</p></div>` : ''}
      </div>
      <button type="button" class="entry-toggle" aria-expanded="false">Read more <span aria-hidden="true">▾</span></button>`;
  }

  /* ---------- pokédex ---------- */
  const dexFilter = { status: 'all', gen: 0, q: '' };

  async function renderDex() {
    const seenMap = new Map(); // id -> { s: latest sighting, count }
    for (const s of sightings.slice().sort(byDateDesc)) {
      const e = seenMap.get(s.pokemon.id);
      if (e) e.count++; else seenMap.set(s.pokemon.id, { s, count: 1 });
    }
    let list = await Api.speciesList().catch(() => null);
    if (!list || !list.length) list = Array.from({ length: DEX_TOTAL }, (_, i) => ({ id: i + 1, slug: '' }));
    list = list.slice().sort((a, b) => a.id - b.id);
    const total = list.length;
    const seen = seenMap.size;
    const pct = total ? (seen / total) * 100 : 0;

    mount(`
      <header class="topbar">
        <span class="icon-btn spacer" aria-hidden="true"></span>
        <span class="topbar-title">Pokédex</span>
        <a class="icon-btn" href="#/add" aria-label="Log a sighting">${icons.camera}</a>
      </header>
      <h1 class="big-name">My<br>Pokédex</h1>

      <div class="dex-progress">
        <div class="dex-progress-top"><b>${seen}<small> / ${total}</small></b><span class="muted">${pct < 10 ? pct.toFixed(1) : Math.round(pct)}% sighted</span></div>
        <div class="meter"><i style="--p:${pct.toFixed(2)}%"></i></div>
      </div>

      <label class="search dex-search">${icons.search}
        <input id="dexSearch" type="search" placeholder="Search name or number…" value="${esc(dexFilter.q)}" aria-label="Search the Pokédex" autocomplete="off" spellcheck="false">
      </label>

      <div class="seg" role="tablist" aria-label="Show">
        ${[['all', 'All'], ['seen', 'Sighted'], ['missing', 'Missing']].map(([k, l]) =>
          `<button role="tab" data-status="${k}" class="${dexFilter.status === k ? 'on' : ''}" aria-selected="${dexFilter.status === k}">${l}</button>`).join('')}
      </div>
      <div class="gen-chips" aria-label="Generation">
        ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) =>
          `<button data-gen="${g}" class="${dexFilter.gen === g ? 'on' : ''}">${g ? 'Gen ' + Api.ROMAN[g] : 'All gens'}</button>`).join('')}
      </div>

      <div class="dex-grid" id="dexGrid"></div>
    `);

    const dexMatch = (m) => {
      if (dexFilter.gen && Api.genOfId(m.id) !== dexFilter.gen) return false;
      if (dexFilter.status === 'seen' && !seenMap.has(m.id)) return false;
      if (dexFilter.status === 'missing' && seenMap.has(m.id)) return false;
      const q = dexFilter.q.trim().toLowerCase().replace(/^#/, '');
      if (!q) return true;
      if (/^\d+$/.test(q)) return String(m.id).startsWith(String(Number(q))) || String(m.id).padStart(3, '0').startsWith(q);
      const e = seenMap.get(m.id);
      const hay = [m.slug, m.slug.replace(/-/g, ' '), e && e.s.pokemon.name, ...(e ? sightings.filter((x) => x.pokemon.id === m.id).map((x) => x.nickname) : [])]
        .filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q) || hay.includes(Api.slugify(q));
    };
    const draw = () => {
      const grid = $('#dexGrid');
      if (!grid) return; // left the Pokédex before a pending search ran
      const items = list.filter(dexMatch);
      if (!items.length) {
        if (dexFilter.q.trim()) {
          grid.innerHTML = `<div class="empty dex-empty"><h3>No matches</h3><p>Nothing in this view matches “${esc(dexFilter.q.trim())}”.</p></div>`;
          return;
        }
        grid.innerHTML = `<div class="empty dex-empty"><h3>${dexFilter.status === 'seen' ? 'None sighted here yet' : 'All caught here!'}</h3><p>${dexFilter.status === 'seen' ? 'Log a sighting and it will light up.' : 'Every Pokémon in this view has been sighted.'}</p></div>`;
        return;
      }
      grid.innerHTML = items.map((m) => {
        const e = seenMap.get(m.id);
        if (e) {
          return `
            <a class="dex-cell seen" href="#/s/${encodeURIComponent(e.s.id)}" aria-label="${esc(e.s.pokemon.name)}, ${dexNo(m.id)}">
              <span class="dex-num">${dexNo(m.id)}</span>
              ${e.count > 1 ? `<span class="dex-count">×${e.count}</span>` : ''}
              <img src="${esc(artOf(e.s))}" alt="" loading="lazy" onerror="this.src='${Api.spriteUrl(m.id)}'">
              <b>${esc(e.s.pokemon.name)}</b>
            </a>`;
        }
        return `
          <div class="dex-cell unseen" aria-label="${dexNo(m.id)}, not sighted yet">
            <span class="dex-num">${dexNo(m.id)}</span>
            <img src="${Api.spriteUrl(m.id)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">
            <b>???</b>
          </div>`;
      }).join('');
    };
    draw();

    view.querySelectorAll('[data-status]').forEach((b) => b.addEventListener('click', () => {
      dexFilter.status = b.dataset.status;
      view.querySelectorAll('[data-status]').forEach((x) => {
        x.classList.toggle('on', x === b);
        x.setAttribute('aria-selected', x === b);
      });
      draw();
      window.dispatchEvent(new Event('scroll'));
    }));
    let dexTimer;
    $('#dexSearch').addEventListener('input', (e) => {
      dexFilter.q = e.target.value;
      clearTimeout(dexTimer);
      dexTimer = setTimeout(() => { draw(); window.dispatchEvent(new Event('scroll')); }, 120);
    });
    view.querySelectorAll('[data-gen]').forEach((b) => b.addEventListener('click', () => {
      dexFilter.gen = Number(b.dataset.gen);
      view.querySelectorAll('[data-gen]').forEach((x) => x.classList.toggle('on', x === b));
      draw();
      window.dispatchEvent(new Event('scroll'));
    }));

    /* scroll rail you can drag through the list + back-to-top button */
    const rail = document.createElement('div');
    rail.className = 'scrubber';
    rail.setAttribute('aria-hidden', 'true');
    rail.innerHTML = '<div class="scrub-track"></div><div class="scrub-thumb"><span class="scrub-bubble glass"></span></div>';
    const topBtn = document.createElement('button');
    topBtn.className = 'to-top glass';
    topBtn.innerHTML = `${icons.up}<span>Top</span>`;
    topBtn.setAttribute('aria-label', 'Back to top of the Pokédex');
    document.body.append(rail, topBtn);

    const thumb = rail.querySelector('.scrub-thumb');
    const bubble = rail.querySelector('.scrub-bubble');
    const maxScroll = () => Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const labelAt = (f) => {
      const shown = list.filter(dexMatch);
      if (!shown.length) return '';
      return dexNo(shown[Math.min(shown.length - 1, Math.round(f * (shown.length - 1)))].id);
    };
    const sync = () => {
      const f = Math.min(1, window.scrollY / maxScroll());
      thumb.style.transform = `translateY(${f * (rail.clientHeight - thumb.offsetHeight)}px)`;
      if (rail.classList.contains('drag')) bubble.textContent = labelAt(f);
      rail.classList.toggle('show', document.documentElement.scrollHeight > window.innerHeight * 1.6);
      topBtn.classList.toggle('show', window.scrollY > 500);
    };
    const seek = (clientY) => {
      const r = rail.getBoundingClientRect();
      const th = thumb.offsetHeight;
      const f = Math.max(0, Math.min(1, (clientY - r.top - th / 2) / (r.height - th)));
      window.scrollTo(0, f * maxScroll());
      bubble.textContent = labelAt(f);
    };
    let dragging = false;
    rail.addEventListener('pointerdown', (e) => {
      dragging = true;
      rail.setPointerCapture(e.pointerId);
      rail.classList.add('drag');
      seek(e.clientY);
      e.preventDefault();
    });
    rail.addEventListener('pointermove', (e) => { if (dragging) seek(e.clientY); });
    const endDrag = () => { dragging = false; rail.classList.remove('drag'); };
    rail.addEventListener('pointerup', endDrag);
    rail.addEventListener('pointercancel', endDrag);
    topBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    window.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    requestAnimationFrame(sync);
    viewCleanup = () => {
      window.removeEventListener('scroll', sync);
      window.removeEventListener('resize', sync);
      rail.remove();
      topBtn.remove();
    };
  }

  /* ---------- types ---------- */
  const ALL_TYPES = ['normal', 'fire', 'water', 'grass', 'electric', 'ice', 'fighting', 'poison', 'ground',
    'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'];
  const inkOn = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    const l = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
    return l > 0.62 ? '#141416' : '#ffffff';
  };

  function renderTypes(selected) {
    // newest sighting of each species, grouped by type
    const latest = new Map();
    sightings.slice().sort(byDateDesc).forEach((s) => { if (!latest.has(s.pokemon.id)) latest.set(s.pokemon.id, s); });
    const byType = {};
    ALL_TYPES.forEach((t) => { byType[t] = []; });
    latest.forEach((s) => s.pokemon.types.forEach((t) => byType[t] && byType[t].push(s)));
    const found = ALL_TYPES.filter((t) => byType[t].length).length;
    let current = ALL_TYPES.includes(selected) ? selected : null;

    mount(`
      <header class="topbar">
        <a class="icon-btn" href="#/" aria-label="Back">${icons.back}</a>
        <span class="topbar-title">Types</span>
        <span class="icon-btn spacer" aria-hidden="true"></span>
      </header>
      <h1 class="big-name">Pokémon<br>types</h1>
      <div class="dex-progress">
        <div class="dex-progress-top"><b>${found}<small> / 18</small></b><span class="muted">types sighted</span></div>
        <div class="meter"><i style="--p:${(found / 18 * 100).toFixed(1)}%"></i></div>
      </div>

      <div class="type-grid" role="list">
        ${ALL_TYPES.map((t) => {
          const c = TYPE_COLORS[t];
          const n = byType[t].length;
          return `<button type="button" role="listitem" class="type-tile ${n ? 'found' : 'missing'}" data-type="${t}"
            style="--c:${c};--ink:${inkOn(c)}" aria-label="${cap(t)}: ${n} sighted">
            <span class="type-name">${cap(t)}</span><span class="type-count">${n}</span>
          </button>`;
        }).join('')}
      </div>

      <section id="typeResults" class="type-results"></section>
    `);

    const show = (t, scroll) => {
      current = t;
      view.querySelectorAll('.type-tile').forEach((b) => b.classList.toggle('on', b.dataset.type === t));
      const box = $('#typeResults');
      if (!t) { box.innerHTML = `<p class="muted type-tip">Tap a type to see the Pokémon you've sighted.</p>`; return; }
      const list = byType[t].slice().sort((a, b) => a.pokemon.id - b.pokemon.id);
      box.innerHTML = `
        <div class="section-head">
          <h2><span class="type-dot big" style="--c:${TYPE_COLORS[t]}"></span>${cap(t)}</h2>
          <span class="count">${list.length}</span>
        </div>
        ${list.length ? `<div class="dex-grid">${list.map((s) => `
          <a class="dex-cell seen" href="#/s/${encodeURIComponent(s.id)}" style="background:${TYPE_COLORS[t]}">
            <span class="dex-num" style="color:${inkOn(TYPE_COLORS[t])}">${dexNo(s.pokemon.id)}</span>
            <img src="${esc(artOf(s))}" alt="" loading="lazy">
            <b style="color:${inkOn(TYPE_COLORS[t])}">${esc(s.pokemon.name)}</b>
          </a>`).join('')}</div>`
          : `<div class="empty"><h3>No ${cap(t)} types yet</h3><p>Keep exploring — your first ${cap(t)}-type sighting will show up here.</p></div>`}`;
      history.replaceState(null, '', '#/types/' + t);
      if (scroll) box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    show(current, false);
    view.querySelector('.type-grid').addEventListener('click', (e) => {
      const b = e.target.closest('[data-type]');
      if (b) show(b.dataset.type, true);
    });
  }

  /* ---------- maps ---------- */
  function addPins(map, list, { interactive = true } = {}) {
    const byId = {};
    const used = new Map();
    list.forEach((s) => {
      // nudge pins that share the exact same spot so they don't hide each other
      const key = s.lat.toFixed(5) + ',' + s.lng.toFixed(5);
      const n = used.get(key) || 0;
      used.set(key, n + 1);
      const angle = n * 2.4;
      const ll = n ? [s.lat + Math.cos(angle) * 0.00012 * Math.sqrt(n), s.lng + Math.sin(angle) * 0.00012 * Math.sqrt(n)] : [s.lat, s.lng];
      const m = L.marker(ll, { icon: PokeMap.cluster([{ src: artOf(s), count: 1, shiny: s.shiny }], { d: interactive ? 42 : 36 }), interactive, keyboard: interactive });
      if (interactive) {
        m.bindPopup(`
          <a class="map-pop" href="#/s/${encodeURIComponent(s.id)}">
            <img src="${esc(artOf(s))}" alt="">
            <div>
              <b>${esc(s.pokemon.name)}</b>
              ${s.nickname ? `<small>“${esc(s.nickname)}”</small>` : ''}
              <small>${fmtDate(s.seenAt)}${s.location ? ' · ' + esc(s.location) : ''}</small>
            </div>
            <span class="arrow">${icons.play}</span>
          </a>`, { maxWidth: 280, closeButton: false });
      }
      m.addTo(map);
      byId[s.id] = m;
    });
    return byId;
  }

  function fitPins(map, list, maxZoom = 15) {
    if (!list.length) return;
    if (list.length === 1) { map.setView([list[0].lat, list[0].lng], maxZoom); return; }
    map.fitBounds(L.latLngBounds(list.map((s) => [s.lat, s.lng])).pad(0.25), { maxZoom });
  }

  function drawMiniMap(el, list) {
    if (!el) return;
    if (!PokeMap.available()) { el.innerHTML = `<div class="map-empty">${icons.map}<span>Map needs an internet connection</span></div>`; return; }
    const map = PokeMap.create(el, { interactive: false, zoom: 10 });
    activeMaps.push(map);
    addPins(map, list, { interactive: false });
    fitPins(map, list, 14);
  }

  /* sightings within ~75 m of each other count as the same place */
  const distM = (aLat, aLng, bLat, bLng) => {
    const x = (bLng - aLng) * Math.cos(((aLat + bLat) / 2) * Math.PI / 180);
    return Math.sqrt(x * x + (bLat - aLat) * (bLat - aLat)) * 111320;
  };
  function groupByPlace(list, meters = 75) {
    const groups = [];
    list.slice().sort(byDateDesc).forEach((s) => {
      let g = groups.find((x) => distM(x.lat, x.lng, s.lat, s.lng) <= meters);
      if (!g) { g = { lat: s.lat, lng: s.lng, label: '', logs: [] }; groups.push(g); }
      g.logs.push(s);
      if (!g.label && s.location) g.label = s.location;
    });
    groups.forEach((g, i) => {
      g.idx = i;
      g.lat = g.logs.reduce((a, s) => a + s.lat, 0) / g.logs.length;
      g.lng = g.logs.reduce((a, s) => a + s.lng, 0) / g.logs.length;
      const bySpecies = new Map();
      g.logs.forEach((s) => {
        const e = bySpecies.get(s.pokemon.id);
        if (e) e.count++; else bySpecies.set(s.pokemon.id, { s, count: 1, shiny: s.shiny });
        if (s.shiny) bySpecies.get(s.pokemon.id).shiny = true;
      });
      g.species = [...bySpecies.values()];
    });
    return groups;
  }

  function placePopup(g) {
    return `
      <div class="place-pop">
        <b class="pp-title">${icons.pin}${esc(g.label || 'Pinned spot')}</b>
        <small class="pp-sub">${g.logs.length} sightings · ${g.species.length} Pokémon</small>
        ${g.species.map((e) => `
          <a class="pp-row" href="#/s/${encodeURIComponent(e.s.id)}">
            <img src="${esc(artOf(e.s))}" alt="">
            <span>${esc(e.s.pokemon.name)}${e.shiny ? ' <i class="pp-shiny">✦</i>' : ''}</span>
            ${e.count > 1 ? `<em>×${e.count}</em>` : ''}
            <span class="arrow">${icons.play}</span>
          </a>`).join('')}
      </div>`;
  }

  async function renderMap(focusId) {
    const pinned = sightings.filter(hasCoords);
    const unplaced = sightings.filter((s) => !hasCoords(s));
    const placeable = unplaced.filter((s) => s.location);
    const groups = groupByPlace(pinned);
    const ordered = groups.slice().sort((a, b) => b.logs.length - a.logs.length || byDateDesc(a.logs[0], b.logs[0]));

    mount(`
      <header class="topbar">
        <a class="icon-btn" href="#/" aria-label="Back">${icons.back}</a>
        <span class="topbar-title">Sightings map</span>
        <a class="icon-btn" href="#/add" aria-label="Log a sighting">${icons.camera}</a>
      </header>

      <div class="map-card big">
        <div class="map-el" id="bigMap"></div>
        <span class="map-count glass">${groups.length} place${groups.length === 1 ? '' : 's'} · ${pinned.length} sighting${pinned.length === 1 ? '' : 's'}</span>
        <div class="map-tools">
          <button class="icon-btn glass" id="fitBtn" aria-label="Show all pins">${icons.expand}</button>
          <button class="icon-btn glass" id="meBtn" aria-label="Show my location">${icons.target}</button>
        </div>
      </div>

      ${groups.length ? `
        <section class="places">
          <div class="section-head"><h2>Places</h2><span class="count">${groups.length}</span></div>
          ${ordered.map((g) => `
            <article class="place-card">
              <button type="button" class="place-head" data-place="${g.idx}" aria-label="Show ${esc(g.label || 'this spot')} on the map">
                <span class="place-ico">${icons.pin}</span>
                <span class="place-text">
                  <b>${esc(g.label || 'Pinned spot')}</b>
                  <small>${g.logs.length} sighting${g.logs.length === 1 ? '' : 's'} · last ${fmtDate(g.logs[0].seenAt)}</small>
                </span>
                <span class="mini-icon">${icons.target}</span>
              </button>
              <div class="place-mons">
                ${g.species.map((e) => `
                  <a class="place-mon" href="#/s/${encodeURIComponent(e.s.id)}">
                    <span class="pm-ball${e.shiny ? ' shiny' : ''}"><img src="${esc(artOf(e.s))}" alt="" loading="lazy">${e.count > 1 ? `<em>×${e.count}</em>` : ''}</span>
                    <b>${esc(e.s.pokemon.name)}</b>
                  </a>`).join('')}
              </div>
            </article>`).join('')}
        </section>` : ''}

      ${unplaced.length ? `
        <section class="panel unplaced">
          <h3>Not on the map yet</h3>
          <p>${unplaced.length} sighting${unplaced.length === 1 ? ' has' : 's have'} no pin. Tap one to add its location${placeable.length ? ', or place the ones with a typed location automatically' : ''}.</p>
          ${placeable.length ? `<button class="btn btn-white" id="placeBtn">${icons.pin} Place ${placeable.length} automatically</button>` : ''}
          <div class="unplaced-list">
            ${unplaced.map((s) => `
              <a class="unplaced-item" href="#/edit/${encodeURIComponent(s.id)}">
                <img src="${esc(artOf(s))}" alt="" loading="lazy">
                <div><b>${esc(s.pokemon.name)}</b><small>${s.location ? esc(s.location) : 'No location'}</small></div>
                <span class="tag">Add pin</span>
              </a>`).join('')}
          </div>
        </section>` : ''}
    `);

    const el = $('#bigMap');
    if (!PokeMap.available()) {
      el.innerHTML = `<div class="map-empty">${icons.map}<b>Map unavailable</b><span>Check your internet connection and reload.</span></div>`;
      return;
    }
    const map = PokeMap.create(el, { interactive: true, zoom: 11 });
    activeMaps.push(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    const card = el.closest('.map-card');
    map.on('popupopen', () => card.classList.add('pop-open'));
    map.on('popupclose', () => card.classList.remove('pop-open'));
    // one marker per place: a standing Pokémon for a single sighting, a bubble for several
    const placeMarkers = {};
    const markers = {};
    groups.forEach((g) => {
      let m;
      if (g.logs.length === 1) {
        const s = g.logs[0];
        m = L.marker([g.lat, g.lng], { icon: PokeMap.cluster([{ src: artOf(s), count: 1, shiny: s.shiny }]) })
          .bindPopup(`
            <a class="map-pop" href="#/s/${encodeURIComponent(s.id)}">
              <img src="${esc(artOf(s))}" alt="">
              <div>
                <b>${esc(s.pokemon.name)}</b>
                ${s.nickname ? `<small>“${esc(s.nickname)}”</small>` : ''}
                <small>${fmtDate(s.seenAt)}${s.location ? ' · ' + esc(s.location) : ''}</small>
              </div>
              <span class="arrow">${icons.play}</span>
            </a>`, { maxWidth: 280, closeButton: false });
      } else {
        m = L.marker([g.lat, g.lng], {
          icon: PokeMap.cluster(g.species.map((e) => ({ src: artOf(e.s), count: e.count, shiny: e.shiny }))),
          zIndexOffset: 500,
        }).bindPopup(placePopup(g), { maxWidth: 290, closeButton: false });
      }
      m.addTo(map);
      placeMarkers[g.idx] = m;
      g.logs.forEach((s) => { markers[s.id] = m; });
    });
    fitPins(map, pinned);
    if (!pinned.length) {
      el.insertAdjacentHTML('beforeend', `<div class="map-hint glass">No pins yet — add a location when you log a sighting.</div>`);
    }
    if (focusId && markers[focusId]) {
      map.setView(markers[focusId].getLatLng(), 16);
      setTimeout(() => markers[focusId].openPopup(), 250);
    }

    const placesEl = view.querySelector('.places');
    if (placesEl) placesEl.addEventListener('click', (e) => {
      const b = e.target.closest('[data-place]');
      if (!b) return;
      const g = groups[Number(b.dataset.place)];
      const m = placeMarkers[g.idx];
      window.scrollTo({ top: 0, behavior: 'smooth' });
      map.flyTo([g.lat, g.lng], Math.max(map.getZoom(), 17), { duration: 0.8 });
      map.once('moveend', () => m.openPopup());
    });

    $('#fitBtn').addEventListener('click', () => (pinned.length ? fitPins(map, pinned) : map.setView(PokeMap.DEFAULT_CENTER, 11)));
    let meDot = null;
    $('#meBtn').addEventListener('click', () => {
      if (!navigator.geolocation) return toast('Location isn’t available on this device');
      navigator.geolocation.getCurrentPosition((pos) => {
        const ll = [pos.coords.latitude, pos.coords.longitude];
        if (meDot) meDot.setLatLng(ll);
        else meDot = L.circleMarker(ll, { radius: 8, color: '#fff', weight: 3, fillColor: '#2E86DE', fillOpacity: 1 }).addTo(map);
        map.flyTo(ll, 15);
      }, () => toast('Couldn’t get your location — allow location access'), { enableHighAccuracy: true, timeout: 10000 });
    });

    const placeBtn = $('#placeBtn');
    if (placeBtn) placeBtn.addEventListener('click', async () => {
      placeBtn.disabled = true;
      let placed = 0;
      for (const s of placeable) {
        placeBtn.textContent = `Placing ${s.pokemon.name}…`;
        try {
          const [hit] = await Geo.search(s.location);
          if (hit) { s.lat = hit.lat; s.lng = hit.lng; await DB.put(s); placed++; }
        } catch (_) { /* skip */ }
        await new Promise((r) => setTimeout(r, 700)); // be gentle with the free place-search service
      }
      await refresh();
      toast(placed ? `Placed ${placed} on the map` : 'Couldn’t find those places — add pins by hand');
      if (location.hash.startsWith('#/map')) renderMap();
    });
  }

  /* ---------- stats hexagon (game order, clockwise from the top) ---------- */
  const RADAR_ORDER = [
    ['hp', 'HP'], ['attack', 'Attack'], ['defense', 'Defense'],
    ['speed', 'Speed'], ['special-defense', 'Sp. Def'], ['special-attack', 'Sp. Atk'],
  ];
  function statRadar(stats) {
    const val = (k) => (stats.find((x) => x.key === k) || { value: 0 }).value;
    const W = 340, H = 300, cx = W / 2, cy = 150, R = 92, CAP = 160; // CAP keeps shapes comparable between Pokémon
    const pt = (i, r) => {
      const a = (-90 + i * 60) * Math.PI / 180;
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    };
    const poly = (r) => RADAR_ORDER.map((_, i) => pt(i, r).map((n) => n.toFixed(1)).join(',')).join(' ');
    const values = RADAR_ORDER.map(([k]) => val(k));
    const top = Math.max(...values);
    const shape = RADAR_ORDER.map(([k], i) => pt(i, Math.max(0.08, Math.min(1, val(k) / CAP)) * R).map((n) => n.toFixed(1)).join(',')).join(' ');
    const labels = RADAR_ORDER.map(([k, name], i) => {
      const [x, y] = pt(i, R + 34);
      const anchor = Math.abs(x - cx) < 4 ? 'middle' : x > cx ? 'start' : 'end';
      const dx = anchor === 'start' ? -14 : anchor === 'end' ? 14 : 0;
      const dy = i === 0 ? -8 : i === 3 ? 6 : 0;
      const hi = val(k) === top;
      return `<text x="${(x + dx).toFixed(1)}" y="${(y + dy).toFixed(1)}" text-anchor="${anchor}" class="r-label${hi ? ' hi' : ''}">
                <tspan x="${(x + dx).toFixed(1)}" class="r-name">${name}</tspan>
                <tspan x="${(x + dx).toFixed(1)}" dy="20" class="r-val">${val(k)}</tspan>
              </text>`;
    }).join('');
    return `
      <svg class="radar" viewBox="0 0 ${W} ${H}" role="img"
        aria-label="${RADAR_ORDER.map(([k, n]) => `${n} ${val(k)}`).join(', ')}">
        ${[1, 0.75, 0.5, 0.25].map((f) => `<polygon class="r-grid${f === 1 ? ' outer' : ''}" points="${poly(R * f)}"/>`).join('')}
        ${RADAR_ORDER.map((_, i) => { const [x, y] = pt(i, R); return `<line class="r-axis" x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`; }).join('')}
        <g class="r-shape-wrap" style="transform-origin:${cx}px ${cy}px">
          <polygon class="r-shape" points="${shape}"/>
          ${RADAR_ORDER.map(([k], i) => { const [x, y] = pt(i, Math.max(0.08, Math.min(1, val(k) / CAP)) * R); return `<circle class="r-dot" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5"/>`; }).join('')}
        </g>
        ${labels}
      </svg>`;
  }

  /* ---------- pokémon page: every log of one species, newest first ---------- */
  async function renderDetail(id) {
    const focus = sightings.find((x) => x.id === id) || await DB.get(id).catch(() => null);
    if (!focus) {
      mount(`<header class="topbar"><a class="icon-btn" href="#/" aria-label="Back">${icons.back}</a></header>
        <div class="empty"><h3>Sighting not found</h3><p>It may have been deleted.</p><a class="btn btn-red" href="#/">Back home</a></div>`);
      return;
    }
    const logs = sightings.filter((x) => x.pokemon.id === focus.pokemon.id).sort(byDateDesc);
    if (!logs.length) logs.push(focus);
    const p = logs[0].pokemon;
    const total = p.stats.reduce((a, b) => a + b.value, 0);
    const maxStat = Math.max(150, ...p.stats.map((x) => x.value));
    const pinned = logs.filter(hasCoords);
    const places = groupByPlace(pinned);
    const first = logs[logs.length - 1];

    mount(`
      <header class="topbar">
        <a class="icon-btn" href="#/" aria-label="Back">${icons.back}</a>
        <span class="topbar-title">${dexNo(p.id)}</span>
        <a class="icon-btn" href="#/add/${encodeURIComponent(p.slug)}" aria-label="Log another ${esc(p.name)}">${icons.camera}</a>
      </header>

      <h1 class="big-name">${esc(p.name)}</h1>
      ${p.genus ? `<p class="genus">The ${esc(p.genus)}</p>` : ''}

      <div class="art-card">
        <img src="${esc(artOf(focus))}" alt="Official artwork of ${esc(p.name)}" onerror="this.style.visibility='hidden'">
        <span class="float-tag dex-tag glass">${dexNo(p.id)}</span>
        ${logs.some((l) => l.shiny) ? `<span class="float-tag shiny-tag glass">✦ Shiny seen</span>` : ''}
      </div>

      <div class="chip-row">
        <span class="chip"><i>${icons.layers}</i>Gen ${p.genRoman} · ${esc(p.region)}</span>
        <span class="chip"><i>${icons.star}</i>${esc(p.rarity.label)}</span>
        ${p.types.map(typeChip).join('')}
      </div>

      <section class="block">
        <div class="block-head">
          <h2>Your sightings</h2>
          <span class="count">${logs.length}</span>
        </div>
        ${logs.length > 1 ? `<p class="muted log-span">First seen ${fmtDate(first.seenAt)} · latest ${fmtDate(logs[0].seenAt)}</p>` : ''}
        <div class="timeline">
          ${logs.map((l, i) => `
            <article class="log ${l.id === focus.id && focus.id !== logs[0].id ? 'focus' : ''}" id="log-${esc(l.id)}">
              <span class="log-dot" aria-hidden="true"></span>
              <div class="log-body">
                <div class="log-head">
                  <div>
                    <span class="log-num">Sighting ${logs.length - i}</span>
                    <b class="log-date">${fmtDate(l.seenAt) || 'No date'}</b>
                  </div>
                  <div class="log-actions">
                    ${l.shiny ? '<span class="tag shiny">✦ Shiny</span>' : ''}
                    <a class="mini-icon" href="#/edit/${encodeURIComponent(l.id)}" aria-label="Edit this sighting">${icons.edit}</a>
                    <button type="button" class="mini-icon" data-del="${esc(l.id)}" aria-label="Delete this sighting">${icons.trash}</button>
                  </div>
                </div>
                ${l.nickname ? `<p class="log-nick">“${esc(l.nickname)}”</p>` : ''}
                ${l.photo
                  ? `<figure class="photo-card"><img src="${l.photo}" alt="Your photo of ${esc(p.name)}" loading="lazy"></figure>`
                  : `<a class="photo-empty small" href="#/edit/${encodeURIComponent(l.id)}">${icons.camera}<span>Add a photo</span></a>`}
                ${l.description ? `<p class="log-desc">${esc(l.description)}</p>` : ''}
                ${l.location ? `<a class="log-place" href="${hasCoords(l) ? '#/map/' + encodeURIComponent(l.id) : '#/edit/' + encodeURIComponent(l.id)}">${icons.pin}${esc(l.location)}</a>` : ''}
              </div>
            </article>`).join('')}
        </div>
        <a class="btn btn-white log-another" href="#/add/${encodeURIComponent(p.slug)}">${icons.camera} Log another ${esc(p.name)}</a>

        <section class="dex-entry" id="dexEntry">${dexEntryHTML(p)}</section>

        ${pinned.length ? `
          <a class="map-card detail" href="#/map/${encodeURIComponent((pinned.find((l) => l.id === focus.id) || pinned[0]).id)}" aria-label="See on the map">
            <div class="map-el" id="detailMap"></div>
            <div class="map-card-label glass">
              <span>${icons.pin} ${places.length === 1 ? esc(places[0].label || 'View on map') : `Seen in ${places.length} places`}</span>
              <span class="go">${icons.play}</span>
            </div>
          </a>` : ''}
      </section>

      <div class="split-pill glass">
        <div><b>${p.height}</b><span>M<br>HEIGHT</span></div>
        <i aria-hidden="true"></i>
        <div><b>${p.weight}</b><span>KG<br>WEIGHT</span></div>
      </div>

      <section class="stats-card">
        <div class="stats-top">
          <span class="pill-today">${icons.bolt} Base stat total</span>
          <b class="total">${total}</b>
        </div>
        ${statRadar(p.stats)}
      </section>

      <section class="facts">
        <div class="fact"><span>Rarity</span><b class="stars" aria-label="${p.rarity.tier} of 5">${stars(p.rarity.tier)}</b></div>
        <div class="fact"><span>Region</span><b>${esc(p.region)}</b></div>
        <div class="fact"><span>Generation</span><b>Gen ${p.genRoman}</b></div>
        <div class="fact"><span>Habitat</span><b>${esc(p.habitat || 'Unknown')}</b></div>
        <div class="fact wide"><span>Status</span><b>${
          p.isMythical ? 'Mythical Pokémon' : p.isLegendary ? 'Legendary Pokémon' : p.isBaby ? 'Baby Pokémon' : 'Regular Pokémon'
        }</b></div>
      </section>
    `);

    if (pinned.length && PokeMap.available()) {
      const dm = PokeMap.create($('#detailMap'), { interactive: false, center: [pinned[0].lat, pinned[0].lng], zoom: 15 });
      activeMaps.push(dm);
      places.forEach((g) => L.marker([g.lat, g.lng], {
        icon: PokeMap.cluster(g.species.map((e) => ({ src: artOf(e.s), count: e.count, shiny: e.shiny })), { d: 36 }),
        interactive: false, keyboard: false,
      }).addTo(dm));
      fitPins(dm, places, 15);
    }

    // came here from a specific older sighting (map pin, Pokédex…) — bring it into view
    if (logs.length > 1 && focus.id !== logs[0].id) {
      setTimeout(() => {
        const el = document.getElementById('log-' + focus.id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 350);
    }

    // Sightings logged before the personality update lack a few fields — top them up quietly.
    if (!('baseHappiness' in p) && navigator.onLine !== false) {
      Api.lookup(p.slug).then(async (info) => {
        for (const l of logs) { l.pokemon = info; await DB.put(l); }
        await refresh();
        const box = $('#dexEntry');
        if (box) box.innerHTML = dexEntryHTML(info);
      }).catch(() => {});
    }

    // Pokédex entry: collapsed until you tap "Read more"
    $('#dexEntry').addEventListener('click', (e) => {
      const t = e.target.closest('.entry-toggle');
      if (!t) return;
      const box = $('#dexEntry');
      const open = box.classList.toggle('open');
      t.setAttribute('aria-expanded', open);
      t.innerHTML = open ? 'Show less <span aria-hidden="true">▴</span>' : 'Read more <span aria-hidden="true">▾</span>';
    });

    view.querySelector('.timeline').addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-del]');
      if (!btn) return;
      const target = logs.find((l) => l.id === btn.dataset.del);
      if (!target) return;
      const ok = await confirmSheet({
        title: `Delete this ${p.name} sighting?`,
        body: `The sighting from ${fmtDate(target.seenAt) || 'this date'} and its photo will be removed from this device.`,
      });
      if (!ok) return;
      await DB.remove(target.id);
      await refresh();
      toast('Sighting deleted');
      const rest = logs.filter((l) => l.id !== target.id);
      if (rest.length) { history.replaceState(null, '', '#/s/' + encodeURIComponent(rest[0].id)); renderDetail(rest[0].id); }
      else location.hash = '#/';
    });
  }

  /* ---------- add / edit ---------- */
  async function renderForm(editId, presetSlug) {
    const existing = editId ? (sightings.find((x) => x.id === editId) || await DB.get(editId).catch(() => null)) : null;
    const state = {
      photo: existing ? existing.photo : null,
      pokemon: existing ? existing.pokemon : null,
      lat: existing && hasCoords(existing) ? existing.lat : null,
      lng: existing && hasCoords(existing) ? existing.lng : null,
    };
    let locMap = null;
    let locMarker = null;
    const pinIcon = () => PokeMap.cluster([{ src: state.pokemon ? ((shinyEl.checked && state.pokemon.artworkShiny) || state.pokemon.artwork) : null, count: 1, shiny: shinyEl.checked }]);

    mount(`
      <header class="topbar">
        <a class="icon-btn" href="${existing ? '#/s/' + encodeURIComponent(existing.id) : '#/'}" aria-label="Back">${icons.back}</a>
        <span class="topbar-title">${existing ? 'Edit sighting' : 'New sighting'}</span>
        <span class="icon-btn spacer" aria-hidden="true"></span>
      </header>
      <h1 class="big-name">${existing ? 'Update your<br>sighting' : 'What did<br>you see?'}</h1>

      <form class="form" id="form" autocomplete="off" novalidate>
        <label class="dropzone" id="drop">
          <input type="file" accept="image/*" id="file" class="sr-only">
          <div class="drop-empty" id="dropEmpty">
            <span class="cam">${icons.camera}</span>
            <b>Upload your photo</b>
            <span>Tap to choose, or drop an image here</span>
          </div>
          <img id="photoPrev" alt="Your photo" hidden>
          <span class="drop-change glass" id="dropChange" hidden>${icons.camera} Change photo</span>
        </label>

        <div class="field">
          <label for="pname">Pokémon</label>
          <div class="name-wrap">
            <input id="pname" placeholder="Start typing… e.g. Pikachu" value="${esc(existing ? existing.pokemon.name : '')}"
              role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="suggest" spellcheck="false">
            <span class="status" id="status" aria-hidden="true"></span>
            <ul class="suggest glass" id="suggest" role="listbox" hidden></ul>
          </div>
          <p class="hint" id="hint">Type a name or Pokédex number — the info fills in automatically.</p>
        </div>

        <div id="preview"></div>

        <label class="toggle">
          <input type="checkbox" id="shiny" ${existing && existing.shiny ? 'checked' : ''}>
          <span class="switch"></span>
          It was shiny ✦
        </label>

        <div class="field">
          <label for="nick">Nickname <em>optional</em></label>
          <input id="nick" maxlength="40" placeholder="e.g. Sparky" value="${esc(existing ? existing.nickname : '')}">
        </div>

        <div class="field">
          <label for="desc">Description</label>
          <textarea id="desc" rows="4" placeholder="Where was it? What was it doing?">${esc(existing ? existing.description : '')}</textarea>
        </div>

        <div class="field">
          <label for="date">Date seen</label>
          <input type="date" id="date" value="${esc(existing ? existing.seenAt : todayISO())}">
        </div>

        <div class="field">
          <label for="loc">Location <em>shows on your map</em></label>
          <div class="name-wrap">
            <input id="loc" maxlength="80" placeholder="Search a place, or tap the map" value="${esc(existing ? existing.location : '')}"
              role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="locSuggest" spellcheck="false">
            <span class="status" id="locStatus" aria-hidden="true"></span>
            <ul class="suggest glass" id="locSuggest" role="listbox" hidden></ul>
          </div>
          <div class="loc-map"><div class="map-el" id="locMap"></div></div>
          <div class="loc-actions">
            <button type="button" class="chip-btn" id="gpsBtn">${icons.target} Use my location</button>
            <button type="button" class="chip-btn" id="clearPin" hidden>${icons.x} Remove pin</button>
          </div>
          <p class="hint" id="locHint">Tap the map to drop a pin, then drag it to fine-tune.</p>
        </div>

        <button class="btn btn-red" type="submit" id="saveBtn">${icons.check} ${existing ? 'Save changes' : 'Log sighting'}</button>
      </form>
    `);

    const pname = $('#pname');
    const suggest = $('#suggest');
    const statusEl = $('#status');
    const hint = $('#hint');
    const shinyEl = $('#shiny');

    /* photo */
    const showPhoto = () => {
      const has = !!state.photo;
      $('#photoPrev').hidden = !has;
      $('#dropChange').hidden = !has;
      $('#dropEmpty').hidden = has;
      if (has) $('#photoPrev').src = state.photo;
    };
    const takeFile = async (file) => {
      if (!file) return;
      if (!file.type.startsWith('image/')) return toast('That file isn’t an image');
      try { state.photo = await compressImage(file); showPhoto(); }
      catch (_) { toast('Couldn’t read that image — try a JPG or PNG'); }
    };
    showPhoto();
    $('#file').addEventListener('change', (e) => takeFile(e.target.files[0]));
    const drop = $('#drop');
    ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('drag'); }));
    ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('drag'); }));
    drop.addEventListener('drop', (e) => takeFile(e.dataTransfer.files[0]));

    /* preview of identified Pokémon */
    const renderPreview = () => {
      const box = $('#preview');
      const p = state.pokemon;
      if (locMarker) locMarker.setIcon(pinIcon());
      if (!p) { box.innerHTML = ''; return; }
      const art = (shinyEl.checked && p.artworkShiny) || p.artwork;
      box.innerHTML = `
        <div class="preview">
          <img src="${esc(art)}" alt="${esc(p.name)}">
          <div>
            <h4>${esc(p.name)} <small>${dexNo(p.id)}</small></h4>
            <p>Gen ${p.genRoman} · ${esc(p.region)} · ${esc(p.rarity.label)}</p>
            <div class="tags">${p.types.map((t) => `<span class="tag">${cap(t)}</span>`).join('')}</div>
          </div>
        </div>`;
    };
    renderPreview();
    shinyEl.addEventListener('change', renderPreview);

    const setStatus = (kind) => {
      statusEl.className = 'status ' + (kind || '');
      statusEl.innerHTML = kind === 'ok' ? icons.check : kind === 'bad' ? icons.x : '';
      hint.classList.toggle('bad', kind === 'bad');
      hint.textContent = {
        loading: 'Looking it up in the Pokédex…',
        ok: 'Identified! Check the card below.',
        bad: 'Couldn’t find that Pokémon — check the spelling.',
        offline: 'Couldn’t reach the Pokédex. Check your connection.',
      }[kind] || 'Type a name or Pokédex number — the info fills in automatically.';
      if (kind === 'offline') { statusEl.className = 'status bad'; statusEl.innerHTML = icons.x; hint.classList.add('bad'); }
    };
    if (existing) setStatus('ok');

    let token = 0;
    async function identify(q) {
      if (!q.trim()) return;
      const my = ++token;
      setStatus('loading');
      try {
        const info = await Api.lookup(q);
        if (my !== token) return;
        state.pokemon = info;
        pname.value = info.name;
        setStatus('ok');
      } catch (e) {
        if (my !== token) return;
        state.pokemon = null;
        setStatus(e.status === 404 ? 'bad' : 'offline');
      }
      renderPreview();
    }

    /* autocomplete */
    let list = [];
    Api.speciesList().then((l) => { list = l; }).catch(() => {});
    let active = -1;
    let matches = [];

    const closeSuggest = () => { suggest.hidden = true; pname.setAttribute('aria-expanded', 'false'); active = -1; };
    const showSuggest = (q) => {
      const slug = Api.slugify(q);
      if (!slug || !list.length) return closeSuggest();
      const starts = list.filter((s) => s.slug.startsWith(slug));
      const contains = list.filter((s) => !s.slug.startsWith(slug) && s.slug.includes(slug));
      matches = starts.concat(contains).slice(0, 6);
      if (!matches.length || (matches.length === 1 && matches[0].slug === slug && state.pokemon)) return closeSuggest();
      active = -1;
      suggest.innerHTML = matches.map((m, i) => `
        <li role="option" id="opt-${i}" data-i="${i}">
          <img src="${Api.spriteUrl(m.id)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">
          <b>${esc(Api.pretty(m.slug))}</b><small>${dexNo(m.id)}</small>
        </li>`).join('');
      suggest.hidden = false;
      pname.setAttribute('aria-expanded', 'true');
    };
    const highlight = () => {
      [...suggest.children].forEach((li, i) => li.classList.toggle('active', i === active));
      pname.setAttribute('aria-activedescendant', active >= 0 ? 'opt-' + active : '');
    };
    const pick = (i) => {
      const m = matches[i];
      if (!m) return;
      pname.value = Api.pretty(m.slug);
      closeSuggest();
      identify(m.slug);
    };

    let timer;
    pname.addEventListener('input', () => {
      const q = pname.value;
      const slug = Api.slugify(q);
      if (state.pokemon && slug !== state.pokemon.slug && slug !== Api.slugify(state.pokemon.name)) {
        state.pokemon = null;
        renderPreview();
        setStatus('');
      }
      showSuggest(q);
      clearTimeout(timer);
      if (slug && (list.some((s) => s.slug === slug) || /^\d+$/.test(slug))) {
        timer = setTimeout(() => identify(q), 350);
      }
    });
    pname.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' && !suggest.hidden) { e.preventDefault(); active = Math.min(matches.length - 1, active + 1); highlight(); }
      else if (e.key === 'ArrowUp' && !suggest.hidden) { e.preventDefault(); active = Math.max(0, active - 1); highlight(); }
      else if (e.key === 'Escape') closeSuggest();
      else if (e.key === 'Enter') {
        e.preventDefault();
        if (!suggest.hidden && matches.length) pick(active >= 0 ? active : 0);
        else identify(pname.value);
      }
    });
    pname.addEventListener('blur', () => setTimeout(() => {
      closeSuggest();
      if (pname.value.trim() && !state.pokemon) identify(pname.value);
    }, 160));
    suggest.addEventListener('mousedown', (e) => e.preventDefault());
    suggest.addEventListener('click', (e) => {
      const li = e.target.closest('li');
      if (li) pick(Number(li.dataset.i));
    });

    /* location: search box + tap-to-pin map */
    const locInput = $('#loc');
    const locSuggest = $('#locSuggest');
    const locStatus = $('#locStatus');
    const locHint = $('#locHint');
    const clearPin = $('#clearPin');
    let autoLabel = false; // true when the text was filled in for you, so moving the pin may update it
    let locMatches = [];
    let locActive = -1;

    const setPin = (lat, lng, { fly = true } = {}) => {
      state.lat = lat;
      state.lng = lng;
      clearPin.hidden = false;
      locStatus.className = 'status ok';
      locStatus.innerHTML = icons.pin;
      if (!locMap) return;
      if (!locMarker) {
        locMarker = L.marker([lat, lng], { icon: pinIcon(), draggable: true }).addTo(locMap);
        locMarker.on('dragend', () => {
          const ll = locMarker.getLatLng();
          setPin(ll.lat, ll.lng, { fly: false });
          fillLabel(ll.lat, ll.lng);
        });
      } else {
        locMarker.setLatLng([lat, lng]);
      }
      if (fly) locMap.flyTo([lat, lng], Math.max(locMap.getZoom(), 16), { duration: 0.6 });
    };
    const fillLabel = async (lat, lng) => {
      if (locInput.value.trim() && !autoLabel) return;
      try {
        const name = await Geo.reverse(lat, lng);
        if (name && (!locInput.value.trim() || autoLabel)) { locInput.value = name; autoLabel = true; }
      } catch (_) { /* offline: keep the pin without a name */ }
    };

    if (PokeMap.available()) {
      const last = sightings.find(hasCoords);
      const center = state.lat !== null ? [state.lat, state.lng] : last ? [last.lat, last.lng] : PokeMap.DEFAULT_CENTER;
      locMap = PokeMap.create($('#locMap'), { interactive: true, center, zoom: state.lat !== null ? 16 : last ? 13 : 11 });
      activeMaps.push(locMap);
      if (state.lat !== null) setPin(state.lat, state.lng, { fly: false });
      locMap.on('click', (e) => {
        setPin(e.latlng.lat, e.latlng.lng, { fly: false });
        fillLabel(e.latlng.lat, e.latlng.lng);
      });
    } else {
      $('#locMap').innerHTML = `<div class="map-empty">${icons.map}<span>Map needs an internet connection — you can still type a place.</span></div>`;
    }

    const closeLoc = () => { locSuggest.hidden = true; locInput.setAttribute('aria-expanded', 'false'); locActive = -1; };
    const pickLoc = (i) => {
      const m = locMatches[i];
      if (!m) return;
      locInput.value = m.label;
      autoLabel = true;
      closeLoc();
      setPin(m.lat, m.lng);
    };
    let locTimer;
    let locToken = 0;
    locInput.addEventListener('input', () => {
      autoLabel = false;
      clearTimeout(locTimer);
      const q = locInput.value.trim();
      if (q.length < 3) return closeLoc();
      locTimer = setTimeout(async () => {
        const my = ++locToken;
        const c = locMap ? locMap.getCenter() : null;
        try {
          const res = await Geo.search(q, c);
          if (my !== locToken) return;
          locMatches = res;
          if (!res.length) return closeLoc();
          locSuggest.innerHTML = res.map((m, i) => `
            <li role="option" id="loc-${i}" data-i="${i}">
              <span class="loc-ico">${icons.pin}</span>
              <span class="loc-text"><b>${esc(m.label)}</b>${m.sub ? `<small>${esc(m.sub)}</small>` : ''}</span>
            </li>`).join('');
          locSuggest.hidden = false;
          locInput.setAttribute('aria-expanded', 'true');
        } catch (_) { closeLoc(); }
      }, 400);
    });
    locInput.addEventListener('keydown', (e) => {
      if (locSuggest.hidden) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); locActive = Math.min(locMatches.length - 1, locActive + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); locActive = Math.max(0, locActive - 1); }
      else if (e.key === 'Enter') { e.preventDefault(); return pickLoc(locActive >= 0 ? locActive : 0); }
      else if (e.key === 'Escape') return closeLoc();
      else return;
      [...locSuggest.children].forEach((li, i) => li.classList.toggle('active', i === locActive));
    });
    locInput.addEventListener('blur', () => setTimeout(closeLoc, 160));
    locSuggest.addEventListener('mousedown', (e) => e.preventDefault());
    locSuggest.addEventListener('click', (e) => {
      const li = e.target.closest('li');
      if (li) pickLoc(Number(li.dataset.i));
    });

    $('#gpsBtn').addEventListener('click', () => {
      if (!navigator.geolocation) return toast('Location isn’t available on this device');
      locHint.textContent = 'Finding you…';
      navigator.geolocation.getCurrentPosition((pos) => {
        setPin(pos.coords.latitude, pos.coords.longitude);
        if (!locInput.value.trim()) autoLabel = true;
        fillLabel(pos.coords.latitude, pos.coords.longitude);
        locHint.textContent = 'Pinned to where you are — drag the pin if it’s a little off.';
      }, () => {
        locHint.textContent = 'Couldn’t get your location — allow location access, or tap the map.';
      }, { enableHighAccuracy: true, timeout: 10000 });
    });
    clearPin.addEventListener('click', () => {
      state.lat = null;
      state.lng = null;
      if (locMarker) { locMarker.remove(); locMarker = null; }
      clearPin.hidden = true;
      locStatus.className = 'status';
      locStatus.innerHTML = '';
    });

    if (!existing && presetSlug) {
      const slug = decodeURIComponent(presetSlug);
      pname.value = Api.pretty(slug);
      identify(slug);
    }

    /* save */
    $('#form').addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!state.pokemon && pname.value.trim()) await identify(pname.value);
      if (!state.pokemon) { toast('Type a Pokémon name so it can be identified'); pname.focus(); return; }

      const btn = $('#saveBtn');
      btn.disabled = true;
      btn.textContent = 'Saving…';

      const shiny = shinyEl.checked;
      const artUrl = (shiny && state.pokemon.artworkShiny) || state.pokemon.artwork;
      let artData = null;
      if (existing && existing.artData && existing.artUrl === artUrl) artData = existing.artData;
      else artData = await urlToDataURL(artUrl).catch(() => null); // saved so it shows offline too

      const entry = {
        ...(existing || {}),
        id: existing ? existing.id : uid(),
        createdAt: existing ? existing.createdAt : Date.now(),
        updatedAt: Date.now(),
        pokemon: state.pokemon,
        photo: state.photo,
        nickname: $('#nick').value.trim(),
        description: $('#desc').value.trim(),
        seenAt: $('#date').value || todayISO(),
        location: $('#loc').value.trim(),
        lat: state.lat,
        lng: state.lng,
        shiny,
        artUrl,
        artData,
      };

      try {
        await DB.put(entry);
      } catch (_) {
        toast('Couldn’t save — your browser storage may be full');
        btn.disabled = false;
        btn.innerHTML = `${icons.check} Try again`;
        return;
      }
      await refresh();
      toast(existing ? 'Sighting updated' : `${entry.pokemon.name} logged!`);
      location.hash = '#/s/' + encodeURIComponent(entry.id);
    });
  }

  /* ---------- settings ---------- */
  function renderSettings() {
    mount(`
      <header class="topbar">
        <a class="icon-btn" href="#/" aria-label="Back">${icons.back}</a>
        <span class="topbar-title">Settings</span>
        <span class="icon-btn spacer" aria-hidden="true"></span>
      </header>
      <h1 class="big-name">Settings</h1>

      <div class="settings">
        <div class="panel">
          <div class="field">
            <label for="trainer">Trainer name</label>
            <input id="trainer" maxlength="24" value="${esc(trainerName())}">
          </div>
        </div>

        <div class="panel">
          <h3>Your data</h3>
          <p>${sightings.length} sighting${sightings.length === 1 ? '' : 's'} saved in this browser. They stay when you close the app, but only on this device. Export a backup to move them or keep them safe.</p>
          <div class="btn-row">
            <button class="btn btn-white" id="exportBtn">${icons.download} Export</button>
            <label class="btn btn-ghost" for="importFile">${icons.upload} Import</label>
            <input type="file" id="importFile" accept="application/json,.json" class="sr-only">
          </div>
        </div>

        <div class="panel">
          <h3>Danger zone</h3>
          <p>Permanently delete every sighting on this device.</p>
          <button class="btn btn-danger" id="wipeBtn" style="margin-top:0">${icons.trash} Delete all sightings</button>
        </div>

        <p class="credit">Pokémon data &amp; artwork from <a href="https://pokeapi.co" target="_blank" rel="noopener">PokéAPI</a>. Pokémon is © Nintendo / Game Freak / The Pokémon Company. Fan project, not affiliated.</p>
      </div>
    `);

    $('#trainer').addEventListener('input', (e) => {
      try { localStorage.setItem(NAME_KEY, e.target.value.trim() || 'Trainer'); } catch (_) { /* ignore */ }
    });

    $('#exportBtn').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify({ app: 'pokedex', version: 1, exportedAt: new Date().toISOString(), sightings }, null, 0)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `pokedex-backup-${todayISO()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      toast('Backup downloaded');
    });

    $('#importFile').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        const items = Array.isArray(data) ? data : data.sightings;
        if (!Array.isArray(items)) throw new Error('format');
        let n = 0;
        for (const s of items) {
          if (s && s.id && s.pokemon) { await DB.put(s); n++; }
        }
        await refresh();
        toast(`Imported ${n} sighting${n === 1 ? '' : 's'}`);
        renderSettings();
      } catch (_) {
        toast('That file isn’t a PokéDex backup');
      }
    });

    $('#wipeBtn').addEventListener('click', async () => {
      const ok = await confirmSheet({ title: 'Delete everything?', body: 'All sightings and photos on this device will be gone for good.', ok: 'Delete all' });
      if (!ok) return;
      await DB.clear();
      await refresh();
      toast('All sightings deleted');
      renderSettings();
    });
  }

  /* ---------- boot ---------- */
  window.addEventListener('hashchange', router);
  (async () => {
    try { await refresh(); }
    catch (_) { toast('Storage is blocked in this browser — sightings won’t be saved'); }
    router();
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    Api.speciesList().catch(() => {});
  })();
})();
