# PokéDex

A personal Pokémon sighting log. Upload a photo, type the Pokémon's name, and the app pulls in its official artwork, base stats, types, generation, region, rarity, abilities and Pokédex entry automatically. Your sightings are saved in your browser, so they're still there when you close and reopen the app.

## Features

- Upload your own photo of each sighting (auto-compressed)
- Name autocomplete with sprites; info is fetched automatically from [PokéAPI](https://pokeapi.co)
- Official artwork (and shiny artwork if you mark it shiny) shown next to your photo
- Base stats chart, height/weight, generation & region, rarity tier, capture rate, abilities, habitat, Pokédex entry
- Optional nickname, description, date and location
- Edit or delete sightings; search your log
- Pokédex tab: every Pokémon by National Dex number — sighted ones in full colour, unsighted ones as black silhouettes; filter by sighted/missing and generation
- Pokédex entry card under your photo with a personality description (built from type, stats, friendliness, rarity and habitat) plus the official field notes
- Sightings map: every sighting is a pin showing that Pokémon; tap a pin for a card that opens the sighting. Map preview on the home screen and on each sighting
- Location field in the log form: search a place, tap the map to drop a pin (drag to adjust), or use your current location
- Old sightings with a typed location can be placed on the map automatically
- Pokédex scroll rail (drag to jump through the list, shows the Dex number) and a Top button
- Progress rings: Pokédex %, types seen, generations seen
- Data saved on-device (IndexedDB) and works offline once logged
- Export / import a JSON backup

## Files

| File | What it does |
|---|---|
| `index.html` | Page shell and bottom tab bar |
| `styles.css` | Poké Ball theme (black / red / white) with liquid-glass overlays |
| `app.js` | Screens: home, log/edit, sighting detail, settings |
| `api.js` | PokéAPI lookups and rarity logic |
| `db.js` | Saves sightings in the browser (IndexedDB) |
| `map.js` | Map setup (Google Maps via Leaflet, with an OpenStreetMap fallback) and place search (Photon). The Google Maps key is at the top of this file |
| `manifest.webmanifest`, `favicon.svg` | App icon / "Add to Home Screen" |

## Preview it

**Quickest:** double-click `index.html` to open it in Chrome, Edge or Safari. It needs internet for Pokémon lookups.

**Local server (most reliable):** in this folder run

```bash
python -m http.server 8000
```

then open http://localhost:8000. (Or use the "Live Server" extension in VS Code.)

**Vercel (from your GitHub repo):**

1. Push these files to the root of a GitHub repository.
2. On [vercel.com](https://vercel.com), click **Add New → Project**, import the repo.
3. Framework preset: **Other**. Leave build command and output directory empty, then **Deploy**.
4. Every push to `main` redeploys automatically.

**GitHub Pages (alternative):**

1. Create a new public repository on GitHub.
2. Click **Add file → Upload files**, drag in all the files from this folder, and click **Commit changes**.
3. Go to **Settings → Pages**. Under *Build and deployment*, set **Source: Deploy from a branch**, branch **main**, folder **/ (root)**, then **Save**.
4. After about a minute your app is live at `https://<your-username>.github.io/<repo-name>/`.
5. On your phone, open that link and use **Add to Home Screen** to use it like an app.

## Notes

- Sightings live in the browser you used, at that web address. A different browser, device or URL starts with an empty log — use **Settings → Export / Import** to move them.
- iPhone HEIC photos work in Safari. If an image won't load in another browser, use a JPG or PNG.
- Pokémon and Pokémon character names are trademarks of Nintendo, Game Freak and The Pokémon Company. This is a fan project and is not affiliated with them. Data and artwork come from PokéAPI.

## Google Maps key

The key lives at the top of `map.js` (`GOOGLE_MAPS_KEY`). Browser keys are always visible to anyone who opens the site, so lock it down in [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

1. Open the key → **Application restrictions** → **Websites**, and add your site, e.g. `https://your-app.vercel.app/*` (add `http://localhost:8000/*` too if you preview locally).
2. **API restrictions** → **Restrict key** → tick only **Maps JavaScript API**.
3. Save. If the key is ever rejected, the map quietly switches to OpenStreetMap instead of breaking.
