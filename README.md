# 🍎 Fruit Catcher – 2D Arcade Game

> **Multimedia Systems Lab — Practical Examination Project**  
> A simple, interactive, customizable 2D arcade game built strictly with **HTML5, CSS3, and Pure Vanilla JavaScript (Canvas API)**.

---

## 📋 Table of Contents
1. [Game Description](#1-game-description)
2. [Game Concept & Rules](#2-game-concept--rules)
3. [Controls](#3-controls)
4. [Scoring System & Penalties](#4-scoring-system--penalties)
5. [Technologies Used](#5-technologies-used)
6. [How to Run the Game](#6-how-to-run-the-game)
7. [Explanation of Animation & Game Loop](#7-explanation-of-animation--game-loop)
8. [Explanation of Collision Detection Algorithm](#8-explanation-of-collision-detection-algorithm)
9. [Explanation of Difficulty Progression](#9-explanation-of-difficulty-progression)
10. [Multimedia & Sound Synthesis (Web Audio API)](#10-multimedia--sound-synthesis-web-audio-api)
11. [Lab Customization Demonstration](#11-lab-customization-demonstration)
12. [Project Structure](#12-project-structure)

---

## 1. Game Description

**Fruit Catcher** is a fast-paced 2D arcade game designed to demonstrate core multimedia concepts including 2D Canvas rendering, continuous frame-rate synchronized animation loops, real-time keyboard and pointer event handling, Axis-Aligned Bounding Box (AABB) collision detection, synthesized audio, and dynamic difficulty scaling.

The player moves a basket horizontally along the bottom of the screen to catch nutritious falling fruits while dodging hazardous bombs. The objective is to maximize your score within a 60-second time limit while protecting 3 vital lives.

---

## 2. Game Concept & Rules

- **Game Duration:** Fixed 60-second countdown timer.
- **Lives:** The player starts with **3 lives** represented by heart icons (❤️❤️❤️).
- **Collecting Fruits:** Normal fruits grant **+10 points**; rare glowing Golden Fruits grant **+30 points**.
- **Missing Fruits:** Missing a fruit incurs **no penalty** (the fruit simply falls off-screen).
- **Bomb Hazard:** Catching a bomb triggers an explosion, causes a camera screen shake, and costs **1 life**.
- **Win / End Conditions:**
  - **Game Over:** If the player loses all 3 lives (`lives <= 0`).
  - **Time's Up:** When the timer reaches `0s`.
- **Restartability:** The player can immediately click **"PLAY AGAIN"** to reset score, lives, timer, and active entities without refreshing the browser window.

---

## 3. Controls

| Action | Primary Keyboard | Alternate Keyboard | Touch / Mouse |
| :--- | :--- | :--- | :--- |
| **Move Left** | `←` Left Arrow | `A` key | Drag / Click left of basket |
| **Move Right** | `→` Right Arrow | `D` key | Drag / Click right of basket |
| **Pause / Resume** | `P` key | — | Pause Icon (`⏸️`) in HUD |
| **Toggle Sound** | `M` key | — | Speaker Icon (`🔊` / `🔇`) in HUD |

> **Boundary Constraint:** The basket is mathematically clamped between `0` and `CanvasWidth - BasketWidth`, preventing it from moving off-screen.

---

## 4. Scoring System & Penalties

| Item | Appearance | Score / Effect | Spawn Frequency |
| :--- | :--- | :--- | :--- |
| **Apple, Orange, Banana, Strawberry, Watermelon** | Distinct hand-crafted Canvas 2D fruits | **+10 Points** | Common (~70%) |
| **Golden Apple** | Glowing golden gradient + star emblem | **+30 Points** | Rare (~15%) |
| **Hazardous Bomb** | Metallic spherical bomb with burning fuse spark | **-1 Life** + Screen Shake | Hazard (~15%–28%) |
| **Missed Fruit** | Falls past bottom boundary | **0 Points** (No penalty) | — |

High scores are automatically persisted in the browser's `localStorage`.

---

## 5. Technologies Used

- **HTML5:** Semantic document structure, modal overlays, `<canvas>` 2D rendering surface.
- **CSS3:** Modern arcade cabinet frame, glassmorphism HUD displays, responsive layout, CSS keyframe animations.
- **Pure Vanilla JavaScript (ES6+):** Object-Oriented game architecture (classes for Basket, Falling Items, Particles, Sounds, Game Controller).
- **HTML5 Canvas 2D API:** Procedural vector rendering of all fruits, bombs, basket textures, and particle bursts without external image dependencies.
- **Web Audio API:** Self-contained procedural sound synthesis (sine, square, sawtooth, noise buffers) — no external MP3/WAV files required.

> **Zero External Dependencies:** No React, Node.js, Express, TypeScript, Phaser, PixiJS, or CDN scripts. 100% offline-ready.

---

## 6. How to Run the Game

1. Navigate to the project directory:
   ```bash
   cd "Fruit-Catcher"
   ```
2. Double-click or open `index.html` in any modern web browser (Google Chrome, Mozilla Firefox, Microsoft Edge, Safari, or Brave).
3. Alternatively, launch with any local static server:
   ```bash
   python -m http.server 8000
   ```
   Then open `http://localhost:8000` in your browser.

---

## 7. Explanation of Animation & Game Loop

The animation loop utilizes the standard browser API `window.requestAnimationFrame()`:

```javascript
gameLoop(timestamp) {
  if (this.state === GAME_STATE.PLAYING) {
    this.update();   // Update basket position, falling items, particle physics
    this.render();   // Clear and redraw canvas frame
    this.animationFrameId = requestAnimationFrame((ts) => this.gameLoop(ts));
  }
}
```

### Why `requestAnimationFrame()`?
1. **Hardware Acceleration:** Coordinates with the display refresh rate (typically 60Hz or 120Hz) for stutter-free, buttery smooth animation.
2. **Battery & Resource Conservation:** Automatically halts rendering when the tab is backgrounded or minimized, preventing CPU waste.
3. **Smooth Delta Times:** Guarantees frame rate synchronization superior to `setInterval()`.

---

## 8. Explanation of Collision Detection Algorithm

The game implements a combined **Axis-Aligned Bounding Box (AABB) and Circle-to-Rectangle Intersection** algorithm.

### The Problem
Falling items are approximated by a circular radius $r$ centered at $(x, y)$. The player's basket catch zone is a horizontal rectangle representing the open rim of the basket:

$$\text{Catch Zone} = [X_{\min}, X_{\max}] \times [Y_{\min}, Y_{\max}]$$

### The Math
To determine if a falling circular fruit intersects the rectangular catch zone:
1. Find the point on the rectangle closest to the circle center:
   $$x_{\text{closest}} = \max(X_{\min}, \min(x, X_{\max}))$$
   $$y_{\text{closest}} = \max(Y_{\min}, \min(y, Y_{\max}))$$
2. Calculate the Euclidean distance vector from $(x, y)$ to $(x_{\text{closest}}, y_{\text{closest}})$:
   $$\Delta x = x - x_{\text{closest}}, \quad \Delta y = y - y_{\text{closest}}$$
3. Check if the squared distance is less than the squared radius:
   $$\Delta x^2 + \Delta y^2 < r^2$$

### Code Implementation in `script.js`
```javascript
const catchZone = this.basket.getCatchZone();
const closestX = Math.max(catchZone.x, Math.min(item.x, catchZone.x + catchZone.width));
const closestY = Math.max(catchZone.y, Math.min(item.y, catchZone.y + catchZone.height));

const distanceX = item.x - closestX;
const distanceY = item.y - closestY;
const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);

if (distanceSquared < (item.radius * item.radius)) {
  // Collision confirmed!
  this.handleCatch(item);
}
```

This ensures fruits are caught realistically **inside the mouth of the basket** rather than hitting the side walls or base.

---

## 9. Explanation of Difficulty Progression

To ensure an engaging arcade experience, both the **speed** and **frequency** of falling items dynamically scale with player performance and elapsed time:

1. **Gradual Speed Scaling:**
   $$\text{FallSpeed} = \text{BaseSpeed} + \min\left(\frac{\text{Score}}{120}, 3.5\right) \times 0.7 + \left(\frac{60 - t_{\text{remaining}}}{25}\right) \times 0.4$$
   - Starts at an easy `3.2 px/frame`.
   - Gradually climbs up to a manageable maximum speed cap of `8.5 px/frame`.

2. **Dynamic Spawn Interval:**
   $$\text{Interval} = \max\left(420\text{ms}, 1100\text{ms} - \min(\text{Score} \times 1.8, 600\text{ms}) + \text{jitter}\right)$$
   - Objects appear every ~1.1 seconds initially.
   - Frequency increases up to ~0.42 seconds at high scores, with organic random jitter ($\pm 80\text{ms}$) to avoid mechanical patterns.

3. **Progressive Hazard Frequency:**
   - Bomb probability begins at **18%** and scales smoothly up to **28%** as the score climbs.

---

## 10. Multimedia & Sound Synthesis (Web Audio API)

All audio is procedurally synthesized in real time via the browser's `AudioContext` without relying on external `.mp3` or `.wav` files:

1. **Normal Fruit Catch Chime:** Ascending two-tone sine-wave arpeggio ($C_5 \to G_5$, $523.25\text{Hz} \to 783.99\text{Hz}$).
2. **Golden Fruit Fanfare:** Four-note sparkling triad arpeggio ($E_5 \to G^{\sharp}_5 \to B_5 \to E_6$) with triangle waveforms.
3. **Bomb Detonation:** Low-pass filtered procedural white-noise burst combined with a descending sawtooth pitch drop ($150\text{Hz} \to 30\text{Hz}$) for sub-bass punch.
4. **Game Over Melancholy Jingle:** Descending minor note progression ($A_4 \to G_4 \to F_4 \to D_4$).
5. **Screen Shake & Particles:** Burst particle physics with velocity vectors and gravity, paired with canvas coordinate offset displacement.

---

## 11. Lab Customization Demonstration

Per the Multimedia Systems Lab evaluation guidelines, students can customize functional aspects of the game:

1. **Visual Scenery & Theme Switcher:**
   - **Sunny Orchard:** Classic blue sky, drifting clouds, and green orchard hills.
   - **Tropical Sunset:** Vibrant violet-orange sunset gradient with silhouette palm ridges.
   - **Cyber Neon Night:** Cyberpunk dark horizon, neon grid perspective lines, and synthwave sunset.
2. **Customizable Gameplay Variables in `script.js`:**
   - `GAME_CONFIG.TOTAL_GAME_TIME`: Adjust round length (e.g., 30s, 60s, 90s).
   - `GAME_CONFIG.INITIAL_LIVES`: Change difficulty (e.g., 1 life hardcore mode or 5 lives casual).
   - `GAME_CONFIG.BASKET_SPEED`: Calibrate basket sensitivity.
   - `FRUIT_TYPES`: Add custom items or modify point values easily.

---

## 12. Project Structure

```text
Fruit-Catcher/
│
├── index.html        # Main HTML5 game interface, canvas viewport, and HUD overlays
├── style.css         # Retro-modern arcade cabinet styling and responsive CSS
├── script.js         # Complete vanilla JS game engine, audio synthesizer, and logic
└── README.md         # Full project documentation and laboratory report
```
