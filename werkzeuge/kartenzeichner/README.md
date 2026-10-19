# Kartenzeichner

Zeichnet Städte, Wälder, Gebirge, Weltenbäume und mehr auf die Grundkarte `karte/arkadia.jpg`
und erzeugt daraus `karte/arkadia-illustriert.jpg`.

- `lib.js` – Zeichenbausteine (Bäume, Berge, Städte, Schiffe, Weltenbäume …)
- `scene.js` – was wo gezeichnet wird, in einem 2000 × 1500 Raster
- `render.html` / `run.js` – rendert im Browser (Chromium über Playwright)

So neu rendern:

```sh
cp ../../karte/arkadia.jpg base.jpg
python3 -m http.server 8765 --bind 127.0.0.1 &
node run.js            # schreibt out.jpg
```
