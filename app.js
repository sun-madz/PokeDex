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
  const trainerName = () => Trainer.load().name;
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
    const parts = (location.hash.slice(1) || '/').split('/').filter(Boolean);
    window.scrollTo(0, 0);
    const [route, id] = parts;
    setTab(['add', 'dex', 'trainer', 'settings'].includes(route) ? route : 'home');
    if (route === 'trainer') return renderTrainer();
    if (!route) return renderHome();
    if (route === 'add') return renderForm();
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
      <${tag} class="ring ring-${tone}"${href ? ` href="${href}" aria-label="Open Pokédex"` : ''}>
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
            <button class="icon-btn" id="searchBtn" aria-label="Search sightings">${icons.search}</button>
            <a class="icon-btn avatar-btn" href="#/trainer" aria-label="Trainer profile"><span class="mini-trainer" style="background-image:url('${Trainer.url(Trainer.load().look)}')"></span></a>
          </div>
        </header>
        <div class="rings">
          ${ring(dexPct, dexLabel, 'Pokédex', 'white', icons.book, '#/dex')}
          ${ring(types / 18, `${types}/18`, 'Types', 'red', icons.bolt)}
          ${ring(gens / 9, `${gens}/9`, 'Generations', 'soft', icons.layers)}
        </div>
      </section>

      <div class="search-wrap hidden" id="searchWrap">
        <label class="search">${icons.search}
          <input id="searchInput" type="search" placeholder="Search name, nickname, type, place…" aria-label="Search sightings">
        </label>
      </div>

      <div class="section-head">
        <h2>Your Sightings</h2>
        <span class="count">${sightings.length}</span>
      </div>
      <div id="list" class="stack"></div>
    `);

    requestAnimationFrame(() => {
      document.querySelectorAll('.ring .bar').forEach((b) => b.setAttribute('stroke-dashoffset', b.dataset.off));
    });

    drawList(sightings);

    $('#searchBtn').addEventListener('click', () => {
      const w = $('#searchWrap');
      w.classList.toggle('hidden');
      if (!w.classList.contains('hidden')) $('#searchInput').focus();
      else { $('#searchInput').value = ''; drawList(sightings); }
    });
    $('#searchInput').addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      if (!q) return drawList(sightings);
      drawList(sightings.filter((s) => [
        s.pokemon.name, s.pokemon.slug, s.nickname, s.description, s.location, s.pokemon.region,
        ...s.pokemon.types,
      ].join(' ').toLowerCase().includes(q)), true);
    });
  }

  function drawList(items, filtered = false) {
    const list = $('#list');
    if (!items.length) {
      list.innerHTML = filtered
        ? `<div class="empty"><h3>No matches</h3><p>Try a different name, type or place.</p></div>`
        : `<div class="empty">
             <div class="ball">${POKEBALL}</div>
             <h3>No sightings yet</h3>
             <p>Spotted a Pokémon? Snap it, type its name, and the Pokédex fills itself in.</p>
             <a class="btn btn-red" href="#/add">${icons.camera} Log your first sighting</a>
           </div>`;
      return;
    }
    const variants = ['v-red', 'v-white', 'v-dark'];
    list.innerHTML = items.map((s, i) => {
      const p = s.pokemon;
      const v = i === 0 ? 'v-red' : variants[1 + ((i - 1) % 2)];
      return `
        <a class="s-card ${v}" href="#/s/${encodeURIComponent(s.id)}">
          <div class="s-head">
            <div>
              <h3>${esc(p.name)}</h3>
              ${s.nickname ? `<p class="s-nick">“${esc(s.nickname)}”</p>` : `<p class="s-nick">${dexNo(p.id)}</p>`}
            </div>
            ${s.photo ? `<span class="s-thumb"><img src="${s.photo}" alt="" loading="lazy"></span>` : ''}
          </div>
          <img class="s-art" src="${esc(artOf(s))}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">
          <div class="s-foot">
            <div class="s-meta">
              <span class="tag">Gen ${p.genRoman}</span>
              <span class="tag">${esc(p.rarity.label)}</span>
              ${s.shiny ? '<span class="tag">✦ Shiny</span>' : ''}
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
      <p class="persona">${esc(per.text)}</p>
      ${p.flavor ? `<div class="flavor"><h3>Field notes</h3><p>${esc(p.flavor)}</p></div>` : ''}`;
  }

  /* ---------- pokédex ---------- */
  const dexFilter = { status: 'all', gen: 0 };

  async function renderDex() {
    const seenMap = new Map(); // id -> { s: latest sighting, count }
    for (const s of sightings) {
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

    const draw = () => {
      const items = list.filter((m) => {
        if (dexFilter.gen && Api.genOfId(m.id) !== dexFilter.gen) return false;
        if (dexFilter.status === 'seen') return seenMap.has(m.id);
        if (dexFilter.status === 'missing') return !seenMap.has(m.id);
        return true;
      });
      const grid = $('#dexGrid');
      if (!items.length) {
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
      const shown = list.filter((m) => {
        if (dexFilter.gen && Api.genOfId(m.id) !== dexFilter.gen) return false;
        if (dexFilter.status === 'seen') return seenMap.has(m.id);
        if (dexFilter.status === 'missing') return !seenMap.has(m.id);
        return true;
      });
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

  /* ---------- trainer ---------- */
  const LOOK_LABELS = {
    skin: 'Skin tone', hairStyle: 'Hair style', hairColor: 'Hair colour', hat: 'Hat', hatColor: 'Hat colour',
    topColor: 'Top', bottomStyle: 'Bottoms', bottomColor: 'Bottoms colour', shoeColor: 'Shoes', bag: 'Bag', bagColor: 'Bag colour',
  };
  const LOOK_ORDER = ['skin', 'hairStyle', 'hairColor', 'hat', 'hatColor', 'topColor', 'bottomStyle', 'bottomColor', 'shoeColor', 'bag', 'bagColor'];
  const platformOf = (t) =>
    ['water', 'ice'].includes(t) ? 'water'
      : ['fire', 'ground', 'rock', 'fighting', 'steel'].includes(t) ? 'dirt'
      : ['ghost', 'dark', 'poison', 'psychic', 'dragon', 'fairy'].includes(t) ? 'mystic'
      : 'grass';

  function renderTrainer() {
    const prof = Trainer.load();

    // one entry per species, newest sighting first
    const species = [];
    const ids = new Set();
    for (const s of sightings) {
      if (!ids.has(s.pokemon.id)) { ids.add(s.pokemon.id); species.push(s); }
    }
    const partnerOf = () => (prof.partnerId ? species.find((s) => s.pokemon.id === prof.partnerId) : null);

    const typeCount = {};
    sightings.forEach((s) => s.pokemon.types.forEach((t) => { typeCount[t] = (typeCount[t] || 0) + 1; }));
    const favType = Object.keys(typeCount).sort((a, b) => typeCount[b] - typeCount[a])[0];
    const rarest = sightings.slice().sort((a, b) =>
      (b.pokemon.rarity.tier - a.pokemon.rarity.tier) || (a.pokemon.captureRate - b.pokemon.captureRate))[0];
    const since = sightings.map((s) => s.seenAt).filter(Boolean).sort()[0];

    const stageHTML = () => {
      const ps = partnerOf();
      return `
        <div class="stage-inner plat-${ps ? platformOf(ps.pokemon.types[0]) : 'grass'}">
          <span class="stage-tag glass" id="stageName">${esc(prof.name)}</span>
          ${ps ? `<span class="stage-tag right glass">Partner · ${esc(ps.pokemon.name)}</span>` : ''}
          <div class="platform"></div>
          <div class="actors">
            <img class="trainer-img" src="${Trainer.url(prof.look)}" alt="Your trainer">
            ${ps ? `<img class="partner-img" src="${Api.spriteUrl(ps.pokemon.id, ps.shiny)}" alt="${esc(ps.pokemon.name)}" onerror="this.onerror=null;${artOf(ps) ? `this.src='${esc(artOf(ps))}';this.classList.add('art')` : `this.style.visibility='hidden'`}">` : ''}
          </div>
        </div>`;
    };

    const customHTML = () => LOOK_ORDER.map((k) => {
      const v = prof.look[k];
      const body = Trainer.STYLES[k]
        ? `<div class="opt-chips">${Trainer.STYLES[k].map(([val, label]) =>
            `<button type="button" data-k="${k}" data-v="${val}" class="${v === val ? 'on' : ''}">${label}</button>`).join('')}</div>`
        : `<div class="swatches">${Trainer.SWATCHES[k].map((c) =>
            `<button type="button" data-k="${k}" data-v="${c}" class="sw ${String(v).toLowerCase() === c.toLowerCase() ? 'on' : ''}" style="--c:${c}" aria-label="${LOOK_LABELS[k]} ${c}"></button>`).join('')}</div>`;
      return `<div class="opt" data-opt="${k}"><span class="opt-label">${LOOK_LABELS[k]}</span>${body}</div>`;
    }).join('');

    mount(`<div id="trainerRoot">
      <header class="topbar">
        <span class="icon-btn spacer" aria-hidden="true"></span>
        <span class="topbar-title">Trainer</span>
        <span class="icon-btn spacer" aria-hidden="true"></span>
      </header>

      <div class="stage" id="stage">${stageHTML()}</div>

      <div class="field name-field">
        <label for="tname">Trainer name</label>
        <input id="tname" maxlength="20" value="${esc(prof.name)}">
      </div>

      <section class="facts trainer-facts">
        <div class="fact"><span>Sightings</span><b>${sightings.length}</b></div>
        <div class="fact"><span>Species</span><b>${species.length}</b></div>
        <div class="fact"><span>Shiny finds</span><b>${sightings.filter((s) => s.shiny).length}</b></div>
        <div class="fact"><span>Trainer since</span><b>${since ? fmtDate(since) : '—'}</b></div>
        <div class="fact"><span>Favourite type</span><b>${favType ? cap(favType) : '—'}</b></div>
        <div class="fact"><span>Rarest find</span><b>${rarest ? esc(rarest.pokemon.name) : '—'}</b></div>
      </section>

      <section class="panel">
        <h3>Partner Pokémon</h3>
        ${species.length
          ? `<p>Choose a Pokémon you've sighted to stand next to you.</p>
             <div class="partner-grid">
               <button type="button" class="partner-opt ${partnerOf() ? '' : 'on'}" data-pid="">${icons.x}<b>None</b></button>
               ${species.map((s) => `
                 <button type="button" class="partner-opt ${prof.partnerId === s.pokemon.id ? 'on' : ''}" data-pid="${s.pokemon.id}">
                   <img src="${Api.spriteUrl(s.pokemon.id, s.shiny)}" alt="" loading="lazy" onerror="this.onerror=null;${artOf(s) ? `this.src='${esc(artOf(s))}'` : `this.style.visibility='hidden'`}">
                   <b>${esc(s.pokemon.name)}</b>
                 </button>`).join('')}
             </div>`
          : `<p>Log a sighting first, then pick it as your partner.</p><a class="btn btn-red" href="#/add">${icons.camera} Log a sighting</a>`}
      </section>

      <section class="panel custom">
        <div class="custom-head">
          <h3>Customise your look</h3>
          <button type="button" class="mini-btn" id="randBtn">${icons.dice} Randomise</button>
        </div>
        <div id="customOpts">${customHTML()}</div>
      </section>
    </div>`);

    const redrawStage = () => { $('#stage').innerHTML = stageHTML(); };
    const syncDeps = () => {
      const hatC = view.querySelector('[data-opt="hatColor"]');
      const bagC = view.querySelector('[data-opt="bagColor"]');
      if (hatC) hatC.hidden = prof.look.hat === 'none';
      if (bagC) bagC.hidden = prof.look.bag === 'none';
    };
    syncDeps();

    $('#tname').addEventListener('input', (e) => {
      prof.name = e.target.value.trim() || 'Trainer';
      Trainer.save(prof);
      const tag = $('#stageName');
      if (tag) tag.textContent = prof.name;
    });

    $('#trainerRoot').addEventListener('click', (e) => {
      const opt = e.target.closest('[data-k]');
      if (opt) {
        prof.look[opt.dataset.k] = opt.dataset.v;
        Trainer.save(prof);
        view.querySelectorAll(`[data-k="${opt.dataset.k}"]`).forEach((b) => b.classList.toggle('on', b === opt));
        syncDeps();
        redrawStage();
        return;
      }
      const p = e.target.closest('[data-pid]');
      if (p) {
        prof.partnerId = p.dataset.pid ? Number(p.dataset.pid) : null;
        Trainer.save(prof);
        view.querySelectorAll('[data-pid]').forEach((b) => b.classList.toggle('on', b === p));
        redrawStage();
      }
    });

    $('#randBtn').addEventListener('click', () => {
      prof.look = Trainer.randomLook();
      Trainer.save(prof);
      $('#customOpts').innerHTML = customHTML();
      syncDeps();
      redrawStage();
    });
  }

  /* ---------- detail ---------- */
  async function renderDetail(id) {
    const s = sightings.find((x) => x.id === id) || await DB.get(id).catch(() => null);
    if (!s) {
      mount(`<header class="topbar"><a class="icon-btn" href="#/" aria-label="Back">${icons.back}</a></header>
        <div class="empty"><h3>Sighting not found</h3><p>It may have been deleted.</p><a class="btn btn-red" href="#/">Back home</a></div>`);
      return;
    }
    const p = s.pokemon;
    const total = p.stats.reduce((a, b) => a + b.value, 0);
    const maxStat = Math.max(150, ...p.stats.map((x) => x.value));

    mount(`
      <header class="topbar">
        <a class="icon-btn" href="#/" aria-label="Back">${icons.back}</a>
        <span class="topbar-title">Sighting</span>
        <a class="icon-btn" href="#/edit/${encodeURIComponent(s.id)}" aria-label="Edit sighting">${icons.edit}</a>
      </header>

      <h1 class="big-name">${esc(p.name)}</h1>
      ${s.nickname ? `<p class="nickname">“${esc(s.nickname)}”</p>` : ''}
      ${p.genus ? `<p class="genus">The ${esc(p.genus)}</p>` : ''}

      <div class="art-card">
        <img src="${esc(artOf(s))}" alt="Official artwork of ${esc(p.name)}" onerror="this.style.visibility='hidden'">
        <span class="float-tag dex-tag glass">${dexNo(p.id)}</span>
        ${s.shiny ? `<span class="float-tag shiny-tag glass">✦ Shiny</span>` : ''}
      </div>

      <div class="chip-row">
        <span class="chip"><i>${icons.layers}</i>Gen ${p.genRoman} · ${esc(p.region)}</span>
        <span class="chip"><i>${icons.star}</i>${esc(p.rarity.label)}</span>
        ${p.types.map(typeChip).join('')}
      </div>

      <section class="block">
        <div class="block-head"><h2>Your photo</h2><span class="muted">${fmtDate(s.seenAt)}</span></div>
        ${s.photo
          ? `<figure class="photo-card"><img src="${s.photo}" alt="Your photo of ${esc(p.name)}"></figure>`
          : `<a class="photo-empty" href="#/edit/${encodeURIComponent(s.id)}">${icons.camera}<span>Add your photo</span></a>`}
        <section class="dex-entry" id="dexEntry">${dexEntryHTML(p)}</section>
        ${(s.description || s.location) ? `
          <div class="note-card">
            ${s.description ? `<p>${esc(s.description)}</p>` : ''}
            <div class="note-meta">
              ${s.location ? `<span>${icons.pin}${esc(s.location)}</span>` : ''}
              ${s.seenAt ? `<span>${icons.cal}${fmtDate(s.seenAt)}</span>` : ''}
            </div>
          </div>` : ''}
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
        <div class="vbars" role="list">
          ${p.stats.map((st) => `
            <div class="vbar" role="listitem" aria-label="${STAT_SHORT[st.key] || st.key} ${st.value}">
              <b>${st.value}</b>
              <span class="col" style="--h:${Math.max(6, (st.value / maxStat) * 80).toFixed(1)}%"></span>
            </div>`).join('')}
        </div>
        <div class="vbar-labels">${p.stats.map((st) => `<span>${STAT_SHORT[st.key] || st.key}</span>`).join('')}</div>
      </section>

      <section class="facts">
        <div class="fact"><span>Rarity</span><b class="stars" aria-label="${p.rarity.tier} of 5">${stars(p.rarity.tier)}</b></div>
        <div class="fact"><span>Capture rate</span><b>${p.captureRate} / 255</b></div>
        <div class="fact"><span>Region</span><b>${esc(p.region)}</b></div>
        <div class="fact"><span>Habitat</span><b>${esc(p.habitat || 'Unknown')}</b></div>
        <div class="fact wide"><span>Abilities</span><b>${p.abilities.map((a) => esc(a.name) + (a.hidden ? ' <em class="muted">(hidden)</em>' : '')).join(' · ')}</b></div>
        <div class="fact wide"><span>Status</span><b>${
          p.isMythical ? 'Mythical Pokémon' : p.isLegendary ? 'Legendary Pokémon' : p.isBaby ? 'Baby Pokémon' : 'Regular Pokémon'
        }</b></div>
      </section>

      <button class="btn btn-danger" id="delBtn">${icons.trash} Delete sighting</button>
    `);

    // Sightings logged before the personality update lack a few fields — top them up quietly.
    if (!('baseHappiness' in p) && navigator.onLine !== false) {
      Api.lookup(p.slug).then(async (info) => {
        s.pokemon = info;
        await DB.put(s);
        await refresh();
        const box = $('#dexEntry');
        if (box && location.hash === '#/s/' + encodeURIComponent(s.id)) box.innerHTML = dexEntryHTML(info);
      }).catch(() => {});
    }

    $('#delBtn').addEventListener('click', async () => {
      const ok = await confirmSheet({
        title: `Delete ${p.name}?`,
        body: 'This removes the sighting and your photo from this device.',
      });
      if (!ok) return;
      await DB.remove(s.id);
      await refresh();
      toast('Sighting deleted');
      location.hash = '#/';
    });
  }

  /* ---------- add / edit ---------- */
  async function renderForm(editId) {
    const existing = editId ? (sightings.find((x) => x.id === editId) || await DB.get(editId).catch(() => null)) : null;
    const state = { photo: existing ? existing.photo : null, pokemon: existing ? existing.pokemon : null };

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

        <div class="field-row">
          <div class="field">
            <label for="date">Date seen</label>
            <input type="date" id="date" value="${esc(existing ? existing.seenAt : todayISO())}">
          </div>
          <div class="field">
            <label for="loc">Location <em>optional</em></label>
            <input id="loc" maxlength="60" placeholder="e.g. KLCC Park" value="${esc(existing ? existing.location : '')}">
          </div>
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
