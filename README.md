# Folio Drive

A playful Three.js driving portfolio game — an original implementation inspired by Bruno Simon's interactive portfolio.

## How to run

Open `index.html` via any static server, e.g.:

```bash
npx serve .
```

or just visit the GitHub Pages deployment after enabling it in repo settings.

## Controls

| Key | Action |
|-----|--------|
| WASD / Arrows | Drive |
| Shift | Boost |
| Space | Jump |
| B / Left Ctrl | Brake |
| R | Respawn |
| M | Toggle minimap |
| L | Mute |
| H | Honk |
| C | Start circuit race |
| 1–9 | Hydraulics bounce |
| O | Options |
| K | Controls help |

Mouse: drag to orbit camera, wheel to zoom.

## Tech

- Three.js (ES modules via CDN import map)
- Plain JS arcade physics (no engine)
- Canvas 2D minimap
- WebAudio honk
