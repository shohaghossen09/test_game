# Assets folder

Put real 3D assets here to make the game look photoreal.

## How to add a real car model

1. Download a free **CC0** car `.glb` from one of these (no account, no attribution needed):
   - https://kenney.nl/assets/car-kit
   - https://quaternius.com/ (Cars pack)
   - https://poly.pizza/ (search "car", filter CC0)
2. Rename the file to `car.glb`
3. In GitHub: open this `assets` folder → **Add file → Upload files** → drag `car.glb` in → Commit

The game auto-detects `assets/car.glb`:
- Loads it and auto-scales it to match the car physics (3.2 m long)
- Keeps the procedural wheels (so steering/rolling animation still works)
- If the file is missing or fails to load, the procedural car is used — nothing breaks

## Texture packs (optional, later)

CC0 PBR textures (asphalt, grass, brick) can also go here:
- https://ambientcg.com — search "asphalt", "grass", "bricks"
