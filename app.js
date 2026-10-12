/* PokéLog — UI and app logic. */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const view = $('#view');
  const TRAINER_KEY = 'pokelog:trainer';
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
  const trainerName = () => {
    try { return localStorage.getItem(TRAINER_KEY) || 'Trainer'; } catch (_) { return 'Trainer'; }
  };

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
    const parts = (location.hash.slice(1) || '/').split('/').filter(Boolean);
    window.scrollTo(0, 0);
    const [route, id] = parts;
    setTab(route === 'add' || route === 'settings' ? route : 'home');
    if (!route) return renderHome();
    if (route === 'add') return renderForm();
    if (route === 'edit') return renderForm(id);
    if (route === 's') return renderDetail(id);
    if (route === 'settings') return renderSettings();
    renderHome();
  }

  /* ---------- home ---------- */
  function ring(pct, value, label, tone, icon) {
    const r = 38;
    const c = 2 * Math.PI * r;
    const p = Math.max(0, Math.min(1, pct));
    return `
      <div class="ring ring-${tone}">
        <div class="ring-dial">
          <svg class="ring-svg" viewBox="0 0 92 92" aria-hidden="true">
            <circle class="track" cx="46" cy="46" r="${r}"/>
            <circle class="bar" cx="46" cy="46" r="${r}" stroke-dasharray="${c.toFixed(2)}"
              stroke-dashoffset="${c.toFixed(2)}" data-off="${(c * (1 - p)).toFixed(2)}"/>
          </svg>
          <div class="ring-center">${icon}<b>${value}</b></div>
        </div>
        <span>${label}</span>
      </div>`;
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
          <h1 class="hello">Hi, ${esc(trainerName())} <span class="wave">👋</span></h1>
          <div class="top-actions">
            <button class="icon-btn" id="searchBtn" aria-label="Search sightings">${icons.search}</button>
            <a class="icon-btn" href="#/add" aria-label="Log a sighting">${icons.camera}<span class="dot"></span></a>
          </div>
        </header>
        <div class="rings">
          ${ring(dexPct, dexLabel, 'Pokédex', 'white', icons.book)}
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

      ${p.flavor ? `<blockquote class="dex-entry"><span>Pokédex entry</span>${esc(p.flavor)}</blockquote>` : ''}

      <button class="btn btn-danger" id="delBtn">${icons.trash} Delete sighting</button>
    `);

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
      <h1 class="big-name">Trainer<br>settings</h1>

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
      try { localStorage.setItem(TRAINER_KEY, e.target.value.trim() || 'Trainer'); } catch (_) { /* ignore */ }
    });

    $('#exportBtn').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify({ app: 'pokelog', version: 1, exportedAt: new Date().toISOString(), sightings }, null, 0)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `pokelog-backup-${todayISO()}.json`;
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
        toast('That file isn’t a PokéLog backup');
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
