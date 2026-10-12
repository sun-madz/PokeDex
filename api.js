/* PokéLog — PokéAPI client (https://pokeapi.co). No API key needed. */
const Api = (() => {
  const BASE = 'https://pokeapi.co/api/v2';
  const LIST_KEY = 'pokelog:species-list:v1';
  const memo = new Map();

  const GENS = {
    'generation-i':    { num: 1, roman: 'I',    region: 'Kanto' },
    'generation-ii':   { num: 2, roman: 'II',   region: 'Johto' },
    'generation-iii':  { num: 3, roman: 'III',  region: 'Hoenn' },
    'generation-iv':   { num: 4, roman: 'IV',   region: 'Sinnoh' },
    'generation-v':    { num: 5, roman: 'V',    region: 'Unova' },
    'generation-vi':   { num: 6, roman: 'VI',   region: 'Kalos' },
    'generation-vii':  { num: 7, roman: 'VII',  region: 'Alola' },
    'generation-viii': { num: 8, roman: 'VIII', region: 'Galar' },
    'generation-ix':   { num: 9, roman: 'IX',   region: 'Paldea' },
  };

  /* "Mr. Mime" -> "mr-mime", "Nidoran♀" -> "nidoran-f", "Farfetch'd" -> "farfetchd" */
  const slugify = (q) => String(q || '')
    .trim().toLowerCase()
    .replace(/♀/g, '-f').replace(/♂/g, '-m')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[.'’:]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const pretty = (slug) => String(slug || '')
    .split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  async function getJSON(url) {
    const res = await fetch(url);
    if (!res.ok) {
      const err = new Error(res.status === 404 ? 'not-found' : 'network');
      err.status = res.status;
      throw err;
    }
    return res.json();
  }

  /* All species names + ids, cached in localStorage for instant autocomplete. */
  let listPromise = null;
  function speciesList() {
    if (listPromise) return listPromise;
    listPromise = (async () => {
      try {
        const cached = JSON.parse(localStorage.getItem(LIST_KEY) || 'null');
        if (Array.isArray(cached) && cached.length) return cached;
      } catch (_) { /* ignore */ }
      const data = await getJSON(`${BASE}/pokemon-species?limit=2000`);
      const list = data.results.map((r) => ({
        slug: r.name,
        id: Number(r.url.split('/').filter(Boolean).pop()),
      }));
      try { localStorage.setItem(LIST_KEY, JSON.stringify(list)); } catch (_) { /* ignore */ }
      return list;
    })().catch((e) => { listPromise = null; throw e; });
    return listPromise;
  }

  function rarityOf(sp) {
    if (sp.is_mythical) return { label: 'Mythical', tier: 5 };
    if (sp.is_legendary) return { label: 'Legendary', tier: 5 };
    const cr = sp.capture_rate;
    if (cr <= 3) return { label: 'Ultra Rare', tier: 5 };
    if (cr <= 45) return { label: 'Very Rare', tier: 4 };
    if (cr <= 100) return { label: 'Rare', tier: 3 };
    if (cr <= 190) return { label: 'Uncommon', tier: 2 };
    return { label: 'Common', tier: 1 };
  }

  const english = (arr) => (arr || []).filter((x) => x.language && x.language.name === 'en');

  async function lookup(query) {
    const slug = slugify(query);
    if (!slug) throw Object.assign(new Error('not-found'), { status: 404 });
    if (memo.has(slug)) return memo.get(slug);

    let species = null;
    let pokemon = null;

    // 1. Species by name or Pokédex number
    try { species = await getJSON(`${BASE}/pokemon-species/${slug}`); }
    catch (e) { if (e.status !== 404) throw e; }

    // 2. A specific form, e.g. "giratina-origin"
    if (!species) {
      try {
        pokemon = await getJSON(`${BASE}/pokemon/${slug}`);
        species = await getJSON(pokemon.species.url);
      } catch (e) { if (e.status && e.status !== 404) throw e; }
    }

    // 3. Closest match from the full list ("pika" -> pikachu)
    if (!species) {
      const list = await speciesList().catch(() => []);
      const hit = list.find((s) => s.slug.startsWith(slug)) || list.find((s) => s.slug.includes(slug));
      if (!hit) throw Object.assign(new Error('not-found'), { status: 404 });
      species = await getJSON(`${BASE}/pokemon-species/${hit.slug}`);
    }

    if (!pokemon) {
      const def = species.varieties.find((v) => v.is_default) || species.varieties[0];
      pokemon = await getJSON(def.pokemon.url);
    }

    const flavors = english(species.flavor_text_entries);
    const flavor = flavors.length
      ? flavors[flavors.length - 1].flavor_text.replace(/[\f\n\r\u00ad]+/g, ' ').replace(/\s+/g, ' ').trim()
      : '';
    const gen = GENS[species.generation && species.generation.name] || { num: 0, roman: '?', region: 'Unknown' };
    const art = (pokemon.sprites.other && pokemon.sprites.other['official-artwork']) || {};

    const info = {
      id: species.id,
      slug: species.name,
      name: (english(species.names)[0] || {}).name || pretty(species.name),
      genus: (english(species.genera)[0] || {}).genus || '',
      generation: gen.num,
      genRoman: gen.roman,
      region: gen.region,
      types: pokemon.types.slice().sort((a, b) => a.slot - b.slot).map((t) => t.type.name),
      stats: pokemon.stats.map((s) => ({ key: s.stat.name, value: s.base_stat })),
      height: pokemon.height / 10,
      weight: pokemon.weight / 10,
      abilities: pokemon.abilities.map((a) => ({ name: pretty(a.ability.name), hidden: a.is_hidden })),
      artwork: art.front_default || pokemon.sprites.front_default,
      artworkShiny: art.front_shiny || pokemon.sprites.front_shiny || null,
      sprite: pokemon.sprites.front_default,
      captureRate: species.capture_rate,
      isLegendary: species.is_legendary,
      isMythical: species.is_mythical,
      isBaby: species.is_baby,
      rarity: rarityOf(species),
      habitat: species.habitat ? pretty(species.habitat.name) : null,
      color: species.color ? species.color.name : null,
      flavor,
      fetchedAt: Date.now(),
    };

    memo.set(slug, info);
    memo.set(info.slug, info);
    return info;
  }

  const spriteUrl = (id) =>
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

  return { slugify, pretty, speciesList, lookup, spriteUrl };
})();
