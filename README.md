# 🌴 RODNEY BEACH RUSH

> **"Relax, Race, and Enjoy the Ride."**

An original, relaxing tropical beach kart-racing game for mobile browsers.
One beautiful island, one high-quality track, three friendly rivals, three laps of sunshine.

---

## ▶️ How to run

**Option A — just open it (recommended):**
Open `index.html` in any modern browser (phone, tablet, or desktop).
Everything — code, textures, audio — is baked into that one file. No internet needed.

**Option B — serve the folder (nicer for phones on the same Wi-Fi):**

```bash
cd rodney-beach-rush
python3 -m http.server 8000
# then on your phone: http://<computer-ip>:8000
```

**Best experience:** add it to your home screen, hold the phone **landscape**, and play.

---

## 🎮 How to play

**Choose your own controls** (⚙️ SETTINGS → CONTROLS):

| Mode | How it works |
|---|---|
| **PAD** (default) | Hold the big **▲ GO**, **◀ LEFT / ▶ RIGHT**, **■ BRAKE** buttons |
| **WHEEL** | Slide the on-screen steering wheel left/right to steer (GO + BRAKE on the right) |
| **TILT** | Steer by tilting your phone (GO + BRAKE on the right). If no motion sensor is found, the game falls back to PAD automatically. |

Desktop keyboard always works too: arrow keys or WASD, Space = brake.

**Choose your own speed** (⚙️ SETTINGS → MY SPEED):

| Speed | Top speed | Feeling |
|---|---|---|
| **CALM** | ~45 km/h | relaxed sightseeing, great for beginners |
| **NORMAL** | ~56 km/h | the intended balance |
| **FAST** | ~67 km/h | for competitive adults |

Race **3 laps** against Sunny, Coco and Breezy, and watch your live
**speedometer** on the HUD. Cross the checkered line first!

## 👵 Friendly by design

- **Huge buttons** (≥ 80 px), high-contrast text, simple words.
- **Player choice everywhere:** three control schemes and three speeds —
  the player decides how the game feels.
- **DRIVING ASSIST (ON by default):** helps you steer, slows you a little before
  tricky corners, pulls you back from the edge, and automatically recovers the kart
  if you wander off. You can turn it off in **SETTINGS** once you feel confident.
- **Difficulty:** EASY (default — relaxed), NORMAL (moderate), HARD (competitive).
- **Wrong-way warning**, lap banners, large position/lap/timer/speed indicators.
- If a phone can't keep up, the game automatically switches graphics to
  **FAST** so the frame rate stays smooth (you can change this in SETTINGS too).

## ⚙️ Settings

- **Difficulty** — EASY / NORMAL / HARD
- **Driving Assist** — ON / OFF (default ON)
- **Sound** — music + effects ON / OFF
- **Graphics** — NICE (shadows, hi-res) / FAST (best for older phones)

Settings are remembered on the device (localStorage).

---

## 🏝️ The track (one high-quality course)

START → **Tropical Beach** → **Palm Tree Road** → **Gentle Corner** →
**Wooden Bridge** (over the lagoon) → **Small Ramp** → **Forest Road** →
**Ocean View** → **Beach Road** → FINISH (under the big banner).

Gentle corners only (minimum radius ≈ 24 m), soft hills, wooden rails on the
bridge, striped ramp, clear white/yellow road markings.

---

## 🛠️ Tech notes

- **No build tools required.** Plain HTML + CSS + JavaScript.
- **three.js r128** (vendored, MIT license) for 3D rendering.
- Custom lightweight arcade physics (no physics engine — fast and stable).
- **100 % original, procedurally generated assets**: geometry, road/sand/banner
  textures, and all audio (engine, tires, ocean, countdown, finish jingle and the
  tropical music are synthesized live with the Web Audio API).
  No characters, names, logos, artwork or sounds from any existing game.
- Performance: merged geometries, instanced vegetation, one shadow-casting light,
  small canvas textures, capped pixel ratio, NICE/FAST quality switch with an
  automatic fallback if the frame rate drops.

### Project layout

```
rodney-beach-rush/
├── index.html              ← THE GAME (self-contained build — open this)
├── README.md
└── src/
    ├── build.js            ← inlines everything into ../index.html
    ├── index.template.html
    ├── style.css           ← large, high-contrast UI
    ├── sim.js              ← track, terrain, physics, AI, assist, race logic
    ├── vendor/three.min.js ← three.js r128
    └── client/
        ├── world.js        ← 3D island, karts, driver (procedural)
        ├── audio.js        ← procedural Web Audio sound + music
        └── main.js         ← game states, camera, input, HUD
```

### Rebuilding after editing the source

```bash
node src/build.js
```

### Testing

```bash
node test/headless-race.js   # 18 checks: track, physics, AI, assist, full sim races
```

`test/` also contains browser screenshots taken by an automated 27-check
end-to-end test (menu → settings → how-to → countdown → driving → 3 laps →
results → play again → main menu → portrait layout).

---

## 🔮 Left for future updates (on purpose)

Multiplayer, more tracks/karts/characters, customization, shop/economy,
campaign, servers — after the first stable release.

---

*RODNEY BEACH RUSH — an original game. Made with sunshine. ☀️*
