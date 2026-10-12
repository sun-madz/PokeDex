/* PokéDex — maps and place search.
   Map: Google Maps (dark style) shown through Leaflet with the GoogleMutant plugin,
        so the Pokémon bubbles and popups work the same. If Google can't load or the
        key is rejected, it falls back to OpenStreetMap automatically.
   Place search & reverse lookup: Photon by Komoot (free, OSM-based, no key). */

// Your Google Maps JavaScript API key. Restrict it to your site in Google Cloud (see README).
const GOOGLE_MAPS_KEY = 'AIzaSyB1XNVbOv3psmyp8JIKjYN2X8e0brabw7M';
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
  // Fallback tiles if Google isn't available: standard OpenStreetMap, darkened in styles.css.
  const OSM_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  const OSM_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';
  const DEFAULT_CENTER = [3.139, 101.6869]; // Kuala Lumpur, used until you have a pin
  const BALL = '<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" fill="#F7F7F5"/><path d="M4 50a46 46 0 0 1 92 0z" fill="#E3350D"/><rect x="4" y="46" width="92" height="8" fill="#0A0A0B"/><circle cx="50" cy="50" r="46" fill="none" stroke="#0A0A0B" stroke-width="6"/><circle cx="50" cy="50" r="15" fill="#F7F7F5" stroke="#0A0A0B" stroke-width="6"/></svg>';

  // Dark Google style tuned to the app's black / red palette
  const DARK_STYLE = [
    { elementType: 'geometry', stylers: [{ color: '#1b1b1f' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#9c9ca3' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#121214' }] },
    { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#3a3a40' }] },
    { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d6d6db' }] },
    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#8a8a91' }] },
    { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1f2a22' }] },
    { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b8f6f' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c2c32' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1a1a1d' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#a5a5ab' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#5a2418' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#2a1410' }] },
    { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#e8a08f' }] },
    { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#26262b' }] },
    { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#b0b0b6' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1a24' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4e6a80' }] },
  ];

  /* ---- load Google Maps once; remember if it fails ---- */
  let googleState = GOOGLE_MAPS_KEY ? 'loading' : 'off'; // loading | ready | failed | off
  const liveMaps = new Set();
  function useFallback() {
    if (googleState === 'failed') return;
    googleState = 'failed';
    liveMaps.forEach((map) => {
      if (map._pokeBase) map.removeLayer(map._pokeBase);
      map._pokeBase = osmLayer().addTo(map);
    });
  }
  if (GOOGLE_MAPS_KEY) {
    window.gm_authFailure = useFallback; // Google calls this if the key is rejected
    const sc = document.createElement('script');
    sc.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_KEY)}&v=weekly`;
    sc.async = true;
    sc.onload = () => { googleState = (window.google && google.maps) ? 'ready' : 'failed'; if (googleState === 'failed') useFallback(); };
    sc.onerror = useFallback;
    document.head.appendChild(sc);
  }

  const osmLayer = () => L.tileLayer(OSM_TILES, { attribution: OSM_ATTR, maxZoom: 19, className: 'poke-tiles' });
  const googleLayer = () => L.gridLayer.googleMutant({ type: 'roadmap', styles: DARK_STYLE, maxZoom: 21 });
  const canUseGoogle = () => googleState !== 'failed' && googleState !== 'off' && L.gridLayer && L.gridLayer.googleMutant;

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
      maxZoom: 20,
    }).setView(center || DEFAULT_CENTER, zoom);
    map._pokeBase = (canUseGoogle() ? googleLayer() : osmLayer()).addTo(map);
    map.attributionControl.setPrefix(false);
    liveMaps.add(map);
    map.on('unload', () => liveMaps.delete(map));
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

  /* Several sightings at one place: a pill of Pokémon circles pointing down at the spot.
     A circle shows ×N when the same Pokémon was seen there more than once. */
  function cluster(items, { d = 42 } = {}) {
    const MAX = 4;
    const shown = items.length > MAX ? items.slice(0, MAX - 1) : items;
    const extra = items.length - shown.length;
    const n = shown.length + (extra ? 1 : 0);
    const overlap = 8;
    const W = n * d - (n - 1) * overlap + 14;
    const H = d + 14 + 18;
    const balls = shown.map((it) => {
      const safe = String(it.src || '').replace(/"/g, '&quot;');
      return `<span class="c-ball${it.shiny ? ' shiny' : ''}">${safe ? `<img src="${safe}" alt="">` : BALL}${it.count > 1 ? `<em>×${it.count}</em>` : ''}</span>`;
    }).join('') + (extra ? `<span class="c-ball c-more">+${extra}</span>` : '');
    return L.divIcon({
      className: 'poke-cluster',
      html: `<span class="cluster" style="--d:${d}px;--o:${overlap}px"><span class="cluster-pill">${balls}</span><span class="cluster-tail"></span><span class="cluster-dot"></span></span>`,
      iconSize: [W, H],
      iconAnchor: [W / 2, H],
      popupAnchor: [0, -H + 4],
    });
  }

  return { available, create, pin, cluster, DEFAULT_CENTER };
})();
