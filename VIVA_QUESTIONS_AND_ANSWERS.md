# 🎓 Fruit Catcher – Multimedia Systems Lab Practical & Viva Guide
**Course:** Multimedia Systems / Computer Graphics & Multimedia Lab  
**Project:** Fruit Catcher 2D Arcade Game (HTML5 Canvas, CSS3, Pure JavaScript ES6+)

---

## 📌 PART 1: Project Overview — "How We Built This Game"
*(Explain this in 60 to 90 seconds if the faculty asks: "Give an overview of your project and how you built it.")*

> **Sample Answer for Faculty:**  
> *"Good morning/afternoon, Sir/Ma'am. For our Multimedia Systems lab assignment, we developed **Fruit Catcher**, a 2D interactive arcade game built strictly from scratch using **HTML5 Canvas, CSS3, and Pure Vanilla JavaScript** without any third-party libraries or external game engines.*  
>  
> *The game demonstrates all five fundamental pillars of Multimedia Systems:*  
> 1. * **Graphics & Rendering:** Using the HTML5 2D Canvas rendering context to draw dynamic vector shapes, textures, gradients, and custom fruit/bomb sprites.*  
> 2. * **Continuous Animation:** Synchronized at 60 FPS using the browser's hardware-accelerated `requestAnimationFrame()` API.*  
> 3. * **Audio & Sound Synthesis:** Generating procedural audio in real time using the browser's native **Web Audio API** (Oscillators, Gain nodes, and Noise Buffers) without needing external audio files.*  
> 4. * **Interactivity & Event Handling:** Real-time keyboard listeners (`Arrow` / `A-D` keys) with smooth velocity clamping to prevent boundary overflow.*  
> 5. * **Computational Physics & Math:** Circle-to-Rectangle collision detection (AABB) and dynamic difficulty progression based on scoring curves.*  
>  
> *We structured the code cleanly using modular ES6 Object-Oriented classes for the Basket, Falling Items, Particle System, Sound Synthesizer, and the Game State Controller."*

---

## 📌 PART 2: Top Viva Questions & Model Answers

### Q1. Why did you use HTML5 Canvas instead of ordinary HTML `<div>` elements?
**Simple Answer:**  
- Ordinary `<div>` elements belong to the **DOM (Document Object Model)**. When moving dozens of elements around the screen, the browser has to continuously recalculate page layout, reflow, and repaint the entire DOM tree, causing lag and frame drops.
- **HTML5 Canvas** provides an immediate-mode 2D bitmap pixel surface. Instead of keeping thousands of DOM nodes in memory, Canvas directly draws pixels using GPU acceleration. This enables high-performance, butter-smooth 60 FPS rendering of moving fruits, basket textures, and particle explosions.

---

### Q2. How does the animation loop work? Why did you use `requestAnimationFrame()` instead of `setInterval()`?
**Simple Answer:**  
- We use `window.requestAnimationFrame(callback)` to drive our continuous game loop.
- **Why not `setInterval()`?**
  1. `setInterval()` fires at fixed time intervals regardless of the monitor's refresh rate, which causes screen tearing and skipped frames.
  2. `setInterval()` keeps running in the background even if the user switches browser tabs, wasting CPU and battery.
  3. `requestAnimationFrame()` automatically synchronizes with the monitor's vertical refresh rate (usually 60Hz or 120Hz) and automatically pauses when the tab is inactive, ensuring maximum efficiency and zero stutter.

---

### Q3. Explain the Collision Detection algorithm. What is the mathematical logic?
**Simple Answer:**  
- We implemented **Circle-to-Rectangle Intersection Detection** (a specialized form of Axis-Aligned Bounding Box, or AABB).
- **The Logic:**
  - Each falling object (fruit or bomb) is modeled as a **circle** with a center coordinate `(x, y)` and a radius `r`.
  - The basket's catch area is a **rectangle** representing the mouth of the basket with `x`, `y`, `width`, and `height`.
- **The Math:**
  1. We clamp the circle's center coordinates to the boundary of the rectangle to find the **closest point** on the basket:
     $$\text{closestX} = \max(\text{rect.x}, \min(\text{item.x}, \text{rect.x} + \text{rect.width}))$$
     $$\text{closestY} = \max(\text{rect.y}, \min(\text{item.y}, \text{rect.y} + \text{rect.height}))$$
  2. We calculate the Euclidean distance squared between the circle center and that closest point:
     $$\text{distanceSquared} = (\text{item.x} - \text{closestX})^2 + (\text{item.y} - \text{closestY})^2$$
  3. If $\text{distanceSquared} < r^2$, a collision has occurred!
- **Why squared distance?**  
  Calculating square root (`Math.sqrt`) is computationally expensive on every frame. Comparing squared distances is mathematically identical and runs much faster.

---

### Q4. How did you implement sound effects without using any external MP3 or WAV files?
**Simple Answer:**  
- We used the browser's built-in **Web Audio API** (`AudioContext`).
- We synthesize sound waves mathematically in real-time:
  1. **Fruit Catch Chime:** We create an `OscillatorNode` with a `sine` waveform and sweep the frequency upwards from $523.25\text{ Hz}$ (C5) to $783.99\text{ Hz}$ (G5), with an exponential decay envelope on a `GainNode`.
  2. **Golden Fruit Fanfare:** An arpeggiated 4-tone sequence of triangle waves ($E_5 \to G^{\sharp}_5 \to B_5 \to E_6$).
  3. **Bomb Explosion:** We generate a custom buffer filled with randomized float values (`Math.random() * 2 - 1`) to produce white noise, route it through a `BiquadFilter` low-pass filter, and layer a low-frequency sawtooth pitch drop ($150\text{ Hz} \to 30\text{ Hz}$) to produce a deep bass thud.
- **Advantage:** Zero network requests, 100% offline capability, zero audio latency, and tiny code footprint.

---

### Q5. How does the difficulty progression work?
**Simple Answer:**  
- The difficulty scales smoothly as the player's score increases and time elapses:
  1. **Falling Speed Scaling:**
     $$\text{Speed} = \text{BaseSpeed (3.2)} + \left(\frac{\text{Score}}{120}\right) \times 0.7 + \left(\frac{\text{TimeElapsed}}{25}\right) \times 0.4$$
     It smoothly accelerates up to a capped maximum speed of $8.5\text{ px/frame}$.
  2. **Spawn Interval Scaling:**
     As the score rises, the spawn timer decreases from $1100\text{ ms}$ down to $420\text{ ms}$, meaning objects spawn more frequently.
  3. **Hazard Rate:**
     The bomb appearance probability starts at $18\%$ and scales up to $28\%$, testing the player's reflexes.

---

### Q6. How are game states managed in your code?
**Simple Answer:**  
- We use a **Finite State Machine (FSM)** with four explicit states:
  - `START`: Displays instructions, theme picker, and Play button; game loop is idle.
  - `PLAYING`: Game loop updates positions, detects collisions, ticks the timer, and spawns items.
  - `PAUSED`: Freezes the canvas update and halts countdown intervals when the player presses `P`.
  - `GAME_OVER`: Triggered when lives reach 0 or timer reaches 0; shows statistics, calculates accuracy, and checks if a new high score was set in `localStorage`.
- State transitions cleanly cancel active `requestAnimationFrame` IDs and intervals to prevent memory leaks.

---

### Q7. Explain the visual effects: Particle System and Screen Shake.
**Simple Answer:**  
- **Particle System:** When a fruit is caught or a bomb detonates, we instantiate 15 to 30 `Particle` objects. Each particle possesses `x, y` position, random radial velocity `(speedX, speedY)`, gravity acceleration, color, and a decreasing alpha/life value. On each frame, particles disperse outward and fade to transparent before being garbage collected.
- **Screen Shake:** When a bomb explodes, we set a `shakeDuration` (14 frames). In the render loop, before drawing canvas elements, we apply `ctx.translate(shakeX, shakeY)` with random offsets between $-9\text{px}$ and $+9\text{px}$. The canvas is restored on each frame using `ctx.restore()`, creating a violent physical impact illusion.

---

### Q8. How do you prevent input lag when holding down the movement keys?
**Simple Answer:**  
- If you rely solely on standard OS `keydown` repeating events, there is an initial pause (typematic delay) before continuous movement starts.
- **Our Solution:** We use continuous state flags:
  ```javascript
  this.basket.movingLeft = true;  // on keydown
  this.basket.movingLeft = false; // on keyup
  ```
  Inside the 60 FPS `update()` loop, as long as `movingLeft` is `true`, the basket advances smoothly by `BASKET_SPEED` pixels every frame. This gives instant, arcade-grade responsiveness.

---

### Q9. What customization did you implement for this lab test?
**Simple Answer:**  
- We implemented a **Multi-Theme Customization Engine**:
  1. **Sunny Orchard:** Daylight sky gradient, drifting clouds, and green rolling orchard hills.
  2. **Tropical Sunset:** Purple-to-orange gradient sky with palm ridge silhouettes.
  3. **Cyber Neon Night:** Retro synthwave grid lines, dark neon atmosphere, and glowing cyber basket trim.
- The theme dynamically alters the canvas rendering palette and basket styling without requiring page reload.

---

## 📌 PART 3: "Faculty Live Code Modification" Cheat Sheet
*(Examiners frequently ask students: "Change the number of lives to 5" or "Double the speed" to test if you wrote the code yourself. Here is exactly where to change them!)*

All core settings are grouped cleanly at the top of [`script.js`](file:///d:/arcade%20game/script.js#L23-L36):

```javascript
// Located at lines 23-35 of script.js
const GAME_CONFIG = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  TOTAL_GAME_TIME: 60,       // <-- 1. Change Game Duration (e.g. 30 or 90)
  INITIAL_LIVES: 3,          // <-- 2. Change Starting Lives (e.g. 5)
  BASKET_WIDTH: 110,         // <-- 3. Change Basket Size
  BASKET_HEIGHT: 55,
  BASKET_SPEED: 9,           // <-- 4. Change Basket Movement Speed
  NORMAL_FRUIT_PTS: 10,      // <-- 5. Change Points for normal fruit
  GOLDEN_FRUIT_PTS: 30,      // <-- 6. Change Points for golden fruit
  BASE_SPAWN_INTERVAL: 1100, // <-- 7. Change how fast objects spawn
  MIN_SPAWN_INTERVAL: 420,
  BASE_FALL_SPEED: 3.2,      // <-- 8. Change initial falling speed
  MAX_FALL_SPEED: 8.5
};
```

---

## 📌 PART 4: Summary Table of Multimedia Concepts

| Multimedia Concept | Implementation in this Game | Code Location |
| :--- | :--- | :--- |
| **Raster / 2D Canvas Graphics** | Procedural vector drawing of fruits, bombs, basket, gradients | `FallingItem.draw()`, `Basket.draw()` in `script.js` |
| **Animation Loop** | Hardware-synced 60 FPS via `requestAnimationFrame` | `gameLoop()` in `script.js` |
| **Sound Synthesis** | Real-time Web Audio API Oscillators & Noise generation | `SoundManager` class in `script.js` |
| **User Interactivity** | Non-blocking keyboard & touch event listeners | `initEvents()`, `handleKeyDown()` in `script.js` |
| **Physics & Collision** | Circle-to-AABB clamping & squared Euclidean distance | `checkCollisions()` in `script.js` |
| **Particle Simulation** | Velocity vectors, gravity, and opacity decay | `Particle` class in `script.js` |
| **State Management** | Finite State Machine (`START`, `PLAYING`, `PAUSED`, `GAME_OVER`) | `FruitCatcherGame` lifecycle methods |
| **Data Persistence** | `localStorage` API for high score retention | `localStorage.setItem('fruit_catcher_highscore')` |
