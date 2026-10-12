/* PokéDex — trainer avatar.
   An original pixel-art trainer drawn in code on a 32×50 grid, so every part
   (skin, hair, hat, clothes, shoes, bag) can be recoloured or swapped. */
const Trainer = (() => {
  const KEY = 'pokelog:trainer-profile';
  const OLD_NAME_KEY = 'pokelog:trainer';
  const W = 32;
  const H = 50;
  const OY = 2; // vertical offset so hats/buns never clip the top edge
  const OUTLINE = '#17171A';

  const STYLES = {
    hairStyle: [['short', 'Short'], ['spiky', 'Spiky'], ['long', 'Long'], ['ponytail', 'Ponytail'], ['bun', 'Bun'], ['buzz', 'Buzz']],
    hat: [['cap', 'Cap'], ['beanie', 'Beanie'], ['none', 'None']],
    bottomStyle: [['pants', 'Pants'], ['shorts', 'Shorts'], ['skirt', 'Skirt']],
    bag: [['backpack', 'Backpack'], ['none', 'None']],
  };

  const SWATCHES = {
    skin: ['#FFE0CC', '#F6C9A0', '#E8B07D', '#C68A5A', '#9A6238', '#6B4227'],
    hairColor: ['#1B1B1F', '#3B2416', '#7A4A24', '#C8902E', '#F3DD9B', '#F5F5F5', '#E3350D', '#E86FA6', '#7D5FE8', '#2E86DE', '#21A67A', '#8E8E95'],
    hatColor: ['#E3350D', '#F7F7F5', '#1B1B1F', '#2E86DE', '#21A67A', '#F1C40F', '#7D5FE8', '#F08A24'],
    topColor: ['#F7F7F5', '#1B1B1F', '#E3350D', '#2E86DE', '#21A67A', '#F1C40F', '#7D5FE8', '#F08A24', '#E86FA6', '#7F8C8D'],
    bottomColor: ['#1B1B1F', '#2C3E7A', '#4A78C2', '#6B4F3A', '#7F8C8D', '#E3350D', '#F7F7F5', '#556B2F'],
    shoeColor: ['#E3350D', '#1B1B1F', '#F7F7F5', '#2E86DE', '#8B5A2B', '#F1C40F'],
    bagColor: ['#F1C40F', '#E3350D', '#1B1B1F', '#2E86DE', '#21A67A', '#F7F7F5'],
  };

  const DEFAULT_LOOK = {
    skin: '#F6C9A0', hairStyle: 'short', hairColor: '#3B2416',
    hat: 'cap', hatColor: '#E3350D', topColor: '#1B1B1F',
    bottomStyle: 'pants', bottomColor: '#2C3E7A', shoeColor: '#E3350D',
    bag: 'backpack', bagColor: '#F1C40F',
  };

  /* amt > 0 darkens, amt < 0 lightens */
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const f = (v) => Math.round(amt >= 0 ? v * (1 - amt) : v + (255 - v) * -amt);
    return '#' + [n >> 16, (n >> 8) & 255, n & 255]
      .map((v) => Math.max(0, Math.min(255, f(v))).toString(16).padStart(2, '0')).join('');
  }

  function load() {
    let p = {};
    let oldName = null;
    try { p = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (_) { /* ignore */ }
    try { oldName = localStorage.getItem(OLD_NAME_KEY); } catch (_) { /* ignore */ }
    return {
      name: p.name || oldName || 'Trainer',
      look: { ...DEFAULT_LOOK, ...(p.look || {}) },
      partnerId: p.partnerId || null,
    };
  }

  function save(profile) {
    try { localStorage.setItem(KEY, JSON.stringify(profile)); } catch (_) { /* ignore */ }
  }

  function draw(L) {
    const G = Array.from({ length: H }, () => Array(W).fill(null));
    const rect = (x, y, w, h, c) => {
      for (let j = y; j < y + h; j++) {
        for (let i = x; i < x + w; i++) {
          const yy = j + OY;
          if (yy >= 0 && yy < H && i >= 0 && i < W) G[yy][i] = c;
        }
      }
    };
    const px = (x, y, c) => rect(x, y, 1, 1, c);

    const hair = L.hairColor;
    const top = L.topColor;
    const topS = shade(top, 0.22);
    const bot = L.bottomColor;
    const botS = shade(bot, 0.28);
    const skinS = shade(L.skin, 0.2);
    const hs = L.hairStyle;

    // --- behind the body
    if (hs === 'long') rect(8, 8, 16, 15, hair);
    if (hs === 'ponytail') { rect(22, 9, 3, 9, hair); rect(23, 18, 2, 2, hair); }
    if (L.bag === 'backpack') rect(8, 17, 16, 4, L.bagColor);

    // --- legs / bottoms
    if (L.bottomStyle === 'pants') {
      rect(10, 31, 12, 11, bot);
      rect(15, 35, 2, 7, null);
      rect(10, 41, 5, 1, botS);
      rect(17, 41, 5, 1, botS);
    } else if (L.bottomStyle === 'shorts') {
      rect(11, 36, 4, 6, L.skin);
      rect(17, 36, 4, 6, L.skin);
      rect(10, 31, 12, 5, bot);
      rect(15, 34, 2, 2, null);
    } else {
      rect(11, 37, 4, 5, L.skin);
      rect(17, 37, 4, 5, L.skin);
      rect(10, 31, 12, 2, bot);
      rect(9, 33, 14, 2, bot);
      rect(8, 35, 16, 2, bot);
      rect(8, 36, 16, 1, botS);
    }

    // --- shoes
    rect(10, 42, 5, 3, L.shoeColor);
    rect(17, 42, 5, 3, L.shoeColor);
    rect(10, 44, 5, 1, shade(L.shoeColor, 0.4));
    rect(17, 44, 5, 1, shade(L.shoeColor, 0.4));

    // --- torso & arms
    rect(9, 19, 14, 12, top);
    rect(9, 30, 14, 1, topS);
    rect(14, 19, 4, 1, topS);
    rect(16, 20, 1, 10, topS);
    rect(6, 20, 3, 8, top);
    rect(23, 20, 3, 8, top);
    rect(6, 27, 3, 1, topS);
    rect(23, 27, 3, 1, topS);
    rect(6, 28, 3, 2, L.skin);
    rect(23, 28, 3, 2, L.skin);
    if (L.bag === 'backpack') {
      const strap = shade(L.bagColor, 0.3);
      rect(11, 19, 1, 11, strap);
      rect(20, 19, 1, 11, strap);
    }

    // --- neck & head
    rect(14, 18, 4, 1, skinS);
    rect(10, 6, 12, 12, L.skin);
    [[10, 6], [21, 6], [10, 17], [21, 17]].forEach(([x, y]) => px(x, y, null));
    rect(9, 11, 1, 3, L.skin);
    rect(22, 11, 1, 3, L.skin);

    // --- face
    rect(13, 12, 1, 2, '#1B1B1F');
    rect(18, 12, 1, 2, '#1B1B1F');
    px(12, 14, '#F29B9B');
    px(19, 14, '#F29B9B');
    rect(15, 15, 2, 1, shade(L.skin, 0.45));

    // --- hair (front)
    if (hs === 'buzz') {
      rect(10, 5, 12, 3, hair);
      rect(10, 8, 1, 2, hair);
      rect(21, 8, 1, 2, hair);
    } else {
      rect(10, 4, 12, 5, hair);
      px(10, 4, null);
      px(21, 4, null);
      rect(9, 6, 1, 6, hair);
      rect(22, 6, 1, 6, hair);
      rect(10, 9, 12, 1, hair);
      [10, 11, 13, 14, 17, 20, 21].forEach((x) => px(x, 10, hair));
      rect(10, 10, 1, 3, hair);
      rect(21, 10, 1, 3, hair);
      rect(12, 5, 4, 1, shade(hair, -0.25));
      if (hs === 'spiky') {
        [10, 13, 16, 19].forEach((x) => { rect(x, 3, 2, 1, hair); px(x + 1, 2, hair); });
        rect(8, 7, 1, 3, hair);
        rect(23, 7, 1, 3, hair);
      }
      if (hs === 'long') { rect(9, 10, 2, 11, hair); rect(21, 10, 2, 11, hair); }
      if (hs === 'bun' && L.hat === 'none') { rect(13, 1, 6, 3, hair); px(13, 1, null); px(18, 1, null); }
      if (hs === 'ponytail') rect(22, 8, 2, 2, shade(hair, 0.45));
    }

    // --- hats
    if (L.hat === 'cap') {
      const hc = L.hatColor;
      rect(10, 2, 12, 6, hc);
      px(10, 2, null);
      px(21, 2, null);
      rect(9, 4, 1, 4, hc);
      rect(22, 4, 1, 4, hc);
      rect(13, 3, 6, 3, hc.toUpperCase() === '#F7F7F5' ? '#E3350D' : '#F7F7F5');
      rect(8, 8, 17, 2, shade(hc, 0.3));
      px(8, 9, null);
    } else if (L.hat === 'beanie') {
      const hc = L.hatColor;
      rect(10, 1, 12, 7, hc);
      px(10, 1, null);
      px(21, 1, null);
      rect(9, 3, 1, 5, hc);
      rect(22, 3, 1, 5, hc);
      rect(9, 7, 14, 2, shade(hc, 0.2));
      [10, 12, 14, 16, 18, 20, 22].forEach((x) => px(x, 8, shade(hc, 0.4)));
      rect(15, -1, 2, 2, '#F7F7F5');
    }

    // --- outline + right-edge shading for a classic sprite look
    const out = G.map((r) => r.slice());
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const c = G[y][x];
        if (c) {
          if (x + 1 >= W || !G[y][x + 1]) out[y][x] = shade(c, 0.18);
        } else if (
          (y > 0 && G[y - 1][x]) || (y < H - 1 && G[y + 1][x]) ||
          (x > 0 && G[y][x - 1]) || (x < W - 1 && G[y][x + 1])
        ) {
          out[y][x] = OUTLINE;
        }
      }
    }
    return out;
  }

  const cache = new Map();
  function url(look) {
    const key = JSON.stringify(look);
    if (cache.has(key)) return cache.get(key);
    const grid = draw(look);
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d');
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (grid[y][x]) { ctx.fillStyle = grid[y][x]; ctx.fillRect(x, y, 1, 1); }
      }
    }
    const data = c.toDataURL('image/png');
    cache.set(key, data);
    return data;
  }

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  function randomLook() {
    const look = {};
    Object.keys(STYLES).forEach((k) => { look[k] = pick(STYLES[k])[0]; });
    Object.keys(SWATCHES).forEach((k) => { look[k] = pick(SWATCHES[k]); });
    return look;
  }

  return { load, save, url, randomLook, STYLES, SWATCHES, DEFAULT_LOOK };
})();
