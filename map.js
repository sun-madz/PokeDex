/* PokéDex — maps and place search.
   Map tiles: OpenStreetMap (free, no key), recoloured dark in CSS.
   Place search & reverse lookup: Photon by Komoot (free, OSM-based, no key). */
const Geo = (() => {
  const PHOTON = 'https://photon.komoot.io';

  function label(p) {
    const street = p.street ? (p.housenumber ? `${p.street} ${p.housenumber}` : p.street) : null;
    const parts = [p.name, street, p.district || p.locality, p.city || p.county, p.country];
    const seen = new Set();
    return parts.filter((x) => x && !seen.has(x) && seen.add(x)).slice(0, 3).join(', ');
  }

  async function search(q, near) {
    const u = new URL(PHOTON + '/api/');
    u.searchParams.set('q', q);
    u.searchParams.set('limit', '5');
    if (near) {
      u.searchParams.set('lat', near.lat.toFixed(4));
      u.searchParams.set('lon', near.lng.toFixed(4));
    }
    const res = await fetch(u);
    if (!res.ok) throw new Error('search');
    const data = await res.json();
    return (data.features || []).map((f) => ({
      label: label(f.properties),
      sub: [f.properties.city || f.properties.county, f.properties.country].filter(Boolean).join(', '),
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0],
    }));
  }

  async function reverse(lat, lng) {
    const res = await fetch(`${PHOTON}/reverse?lat=${lat.toFixed(6)}&lon=${lng.toFixed(6)}&limit=1`);
    if (!res.ok) throw new Error('reverse');
    const data = await res.json();
    const f = (data.features || [])[0];
    return f ? label(f.properties) : '';
  }

  return { search, reverse };
})();

const PokeMap = (() => {
  // Standard OpenStreetMap tiles (no key). They're darkened in styles.css to match the app.
  const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  const ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';
  const DEFAULT_CENTER = [3.139, 101.6869]; // Kuala Lumpur, used until you have a pin
  const BALL = '<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" fill="#F7F7F5"/><path d="M4 50a46 46 0 0 1 92 0z" fill="#E3350D"/><rect x="4" y="46" width="92" height="8" fill="#0A0A0B"/><circle cx="50" cy="50" r="46" fill="none" stroke="#0A0A0B" stroke-width="6"/><circle cx="50" cy="50" r="15" fill="#F7F7F5" stroke="#0A0A0B" stroke-width="6"/></svg>';

  const available = () => !!window.L;

  function create(el, { interactive = true, center, zoom = 11 } = {}) {
    const map = L.map(el, {
      zoomControl: false,
      dragging: interactive,
      scrollWheelZoom: interactive,
      touchZoom: interactive,
      doubleClickZoom: interactive,
      boxZoom: interactive,
      keyboard: interactive,
      tap: interactive,
    }).setView(center || DEFAULT_CENTER, zoom);
    L.tileLayer(TILES, { attribution: ATTR, maxZoom: 19, className: 'poke-tiles' }).addTo(map);
    map.attributionControl.setPrefix(false);
    requestAnimationFrame(() => map.invalidateSize());
    return map;
  }

  /* Pokémon GO-style marker: the Pokémon stands on the map with a shadow and a pulsing ring. */
  function pin(src, { shiny = false, size = 64 } = {}) {
    const safe = src ? String(src).replace(/"/g, '&quot;') : '';
    return L.divIcon({
      className: 'poke-pin' + (shiny ? ' shiny' : ''),
      html: `<span class="go-pin" style="--s:${size}px">
               <span class="go-ring"></span><span class="go-ring delay"></span>
               <span class="go-shadow"></span>
               ${safe ? `<img src="${safe}" alt="">` : `<span class="go-ball">${BALL}</span>`}
               ${shiny ? '<span class="go-sparkle">✦</span>' : ''}
             </span>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size * 0.9],
      popupAnchor: [0, -size * 0.75],
    });
  }

  return { available, create, pin, DEFAULT_CENTER };
})();
