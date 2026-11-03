/**
 * ============================================================================
 * Project: Fruit Catcher – 2D Arcade Game
 * Technology: HTML5, CSS3, Pure Vanilla JavaScript (ES6+), HTML5 Canvas
 * Description: 2D Arcade game featuring smooth 60fps animations, keyboard input,
 *              AABB collision detection, Web Audio API sound synthesis,
 *              particle systems, customizable themes, and difficulty scaling.
 * ============================================================================
 */

(() => {
  'use strict';

  // ==========================================================================
  // 1. GAME CONSTANTS & ENUMS
  // ==========================================================================
  const GAME_STATE = {
    START: 'START',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    GAME_OVER: 'GAME_OVER'
  };

  const GAME_CONFIG = {
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    TOTAL_GAME_TIME: 60,       // 60 seconds duration
    INITIAL_LIVES: 3,
    BASKET_WIDTH: 110,
    BASKET_HEIGHT: 55,
    BASKET_SPEED: 9,           // Horizontal movement speed (px/frame)
    NORMAL_FRUIT_PTS: 10,
    GOLDEN_FRUIT_PTS: 30,
    BASE_SPAWN_INTERVAL: 1100, // Milliseconds between spawns at start
    MIN_SPAWN_INTERVAL: 420,   // Fastest spawn rate at high difficulty
    BASE_FALL_SPEED: 3.2,
    MAX_FALL_SPEED: 8.5
  };

  // Fruit Types Definition
  const FRUIT_TYPES = [
    { name: 'Apple', color: '#ef4444', leafColor: '#22c55e', points: 10, radius: 20, isGolden: false },
    { name: 'Orange', color: '#f97316', leafColor: '#16a34a', points: 10, radius: 21, isGolden: false },
    { name: 'Banana', color: '#facc15', leafColor: '#854d0e', points: 10, radius: 22, isGolden: false },
    { name: 'Strawberry', color: '#e11d48', leafColor: '#15803d', points: 10, radius: 18, isGolden: false },
    { name: 'Watermelon', color: '#10b981', fleshColor: '#f43f5e', points: 10, radius: 24, isGolden: false }
  ];

  const GOLDEN_FRUIT = {
    name: 'Golden Apple',
    color: '#fbbf24',
    glowColor: '#f59e0b',
    leafColor: '#fef08a',
    points: 30,
    radius: 23,
    isGolden: true
  };

  // ==========================================================================
  // 2. WEB AUDIO API SYNTHESIZER (Pure JS, Zero External Audio Files Needed)
  // ==========================================================================
  class SoundManager {
    constructor() {
      this.ctx = null;
      this.isMuted = false;
      this.initContext();
    }

    initContext() {
      // Lazy initialization on first user interaction to comply with browser policy
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx && !this.ctx) {
        this.ctx = new AudioCtx();
      }
    }

    resume() {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggleMute() {
      this.isMuted = !this.isMuted;
      return this.isMuted;
    }

    // Melodic chime for normal fruit catch (+10 pts)
    playCatchFruit() {
      if (this.isMuted || !this.ctx) return;
      this.resume();
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      // Arpeggio chime: 523.25Hz (C5) -> 659.25Hz (E5)
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12); // G5

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    }

    // Sparkling fanfare for golden fruit (+30 pts)
    playCatchGolden() {
      if (this.isMuted || !this.ctx) return;
      this.resume();
      const now = this.ctx.currentTime;

      const freqs = [659.25, 830.61, 987.77, 1318.51]; // E5, G#5, B5, E6
      freqs.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.05);

        gain.gain.setValueAtTime(0.2, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.25);
      });
    }

    // Punchy explosion rumble for hitting a bomb
    playBombExplosion() {
      if (this.isMuted || !this.ctx) return;
      this.resume();
      const now = this.ctx.currentTime;

      // 1. Noise buffer for explosion blast
      const bufferSize = this.ctx.sampleRate * 0.35;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      // Low pass filter to create a deep boom
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(80, now + 0.35);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.4, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      // 2. Low sine drop for physical sub-bass thud
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sawtooth';
      subOsc.frequency.setValueAtTime(150, now);
      subOsc.frequency.exponentialRampToValueAtTime(30, now + 0.3);

      subGain.gain.setValueAtTime(0.35, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);

      noise.start(now);
      noise.stop(now + 0.35);
      subOsc.start(now);
      subOsc.stop(now + 0.35);
    }

    // Melancholy descending chime for game over
    playGameOver() {
      if (this.isMuted || !this.ctx) return;
      this.resume();
      const now = this.ctx.currentTime;
      const notes = [440, 392, 349.23, 293.66]; // A4, G4, F4, D4

      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.16);

        gain.gain.setValueAtTime(0.2, now + idx * 0.16);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.16 + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.16);
        osc.stop(now + idx * 0.16 + 0.25);
      });
    }

    // UI Click Sound
    playClick() {
      if (this.isMuted || !this.ctx) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.05);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    }
  }

  // ==========================================================================
  // 3. VISUAL EFFECTS (Particles & Floating Score Popups)
  // ==========================================================================
  class Particle {
    constructor(x, y, color, size, speedX, speedY, life = 1.0, isSparkle = false) {
      this.x = x;
      this.y = y;
      this.color = color;
      this.size = size;
      this.speedX = speedX;
      this.speedY = speedY;
      this.life = life;
      this.maxLife = life;
      this.alpha = 1.0;
      this.isSparkle = isSparkle;
      this.gravity = 0.18;
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.speedY += this.gravity;
      this.life -= 0.025;
      this.alpha = Math.max(0, this.life / this.maxLife);
    }

    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = this.color;
      if (this.isSparkle) {
        // Draw 4-point star for golden sparkles
        ctx.beginPath();
        const r = this.size;
        ctx.moveTo(this.x, this.y - r);
        ctx.lineTo(this.x + r * 0.3, this.y - r * 0.3);
        ctx.lineTo(this.x + r, this.y);
        ctx.lineTo(this.x + r * 0.3, this.y + r * 0.3);
        ctx.lineTo(this.x, this.y + r);
        ctx.lineTo(this.x - r * 0.3, this.y + r * 0.3);
        ctx.lineTo(this.x - r, this.y);
        ctx.lineTo(this.x - r * 0.3, this.y - r * 0.3);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(1, this.size * this.alpha), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  class FloatingText {
    constructor(x, y, text, color, fontSize = 22) {
      this.x = x;
      this.y = y;
      this.text = text;
      this.color = color;
      this.fontSize = fontSize;
      this.alpha = 1.0;
      this.speedY = -1.6;
    }

    update() {
      this.y += this.speedY;
      this.alpha -= 0.02;
    }

    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.alpha);
      ctx.font = `900 ${this.fontSize}px 'Segoe UI', Arial, sans-serif`;
      ctx.fillStyle = this.color;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.textAlign = 'center';
      ctx.strokeText(this.text, this.x, this.y);
      ctx.fillText(this.text, this.x, this.y);
      ctx.restore();
    }
  }

  // ==========================================================================
  // 4. ENTITY CLASSES (Basket, Fruits, Bombs)
  // ==========================================================================

  /**
   * Player Basket class with smooth horizontal movement and custom canvas rendering
   */
  class Basket {
    constructor(canvasWidth, canvasHeight) {
      this.canvasWidth = canvasWidth;
      this.canvasHeight = canvasHeight;
      this.width = GAME_CONFIG.BASKET_WIDTH;
      this.height = GAME_CONFIG.BASKET_HEIGHT;
      this.speed = GAME_CONFIG.BASKET_SPEED;
      this.reset();
    }

    reset() {
      this.x = (this.canvasWidth - this.width) / 2;
      this.y = this.canvasHeight - this.height - 18;
      this.movingLeft = false;
      this.movingRight = false;
    }

    update() {
      if (this.movingLeft) {
        this.x -= this.speed;
      }
      if (this.movingRight) {
        this.x += this.speed;
      }

      // Boundary clamping: Prevent basket from exiting canvas
      if (this.x < 0) {
        this.x = 0;
      } else if (this.x + this.width > this.canvasWidth) {
        this.x = this.canvasWidth - this.width;
      }
    }

    // Get the collision bounding zone for fruit catches (upper mouth of the basket)
    getCatchZone() {
      return {
        x: this.x + 8,
        y: this.y + 4,
        width: this.width - 16,
        height: 24
      };
    }

    draw(ctx, theme = 'orchard') {
      ctx.save();
      const x = this.x;
      const y = this.y;
      const w = this.width;
      const h = this.height;

      // Draw shadow beneath basket
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h + 8, w * 0.45, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Theme-based basket color palette
      let bodyGrad = ctx.createLinearGradient(x, y, x, y + h);
      let rimColor = '#854d0e';
      let weaveColor = '#78350f';

      if (theme === 'cyber') {
        bodyGrad.addColorStop(0, '#06b6d4');
        bodyGrad.addColorStop(1, '#3b82f6');
        rimColor = '#22d3ee';
        weaveColor = '#1d4ed8';
      } else if (theme === 'sunset') {
        bodyGrad.addColorStop(0, '#fb923c');
        bodyGrad.addColorStop(1, '#b45309');
        rimColor = '#78350f';
        weaveColor = '#9a3412';
      } else {
        // Classic Sunny Orchard Woven Wood
        bodyGrad.addColorStop(0, '#d97706');
        bodyGrad.addColorStop(1, '#92400e');
        rimColor = '#78350f';
        weaveColor = '#b45309';
      }

      // 1. Basket Body (Tapered Trapezoid)
      ctx.beginPath();
      const taper = 12;
      ctx.moveTo(x, y + 10);
      ctx.lineTo(x + taper, y + h);
      ctx.lineTo(x + w - taper, y + h);
      ctx.lineTo(x + w, y + 10);
      ctx.closePath();
      ctx.fillStyle = bodyGrad;
      ctx.fill();

      // 2. Weave Texture Lines
      ctx.strokeStyle = weaveColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      // Diagonal weave pattern
      const steps = 7;
      for (let i = 1; i < steps; i++) {
        const offset = (w / steps) * i;
        ctx.moveTo(x + offset, y + 10);
        ctx.lineTo(x + offset - 8, y + h);
        ctx.moveTo(x + offset - 8, y + 10);
        ctx.lineTo(x + offset, y + h);
      }
      ctx.stroke();

      // 3. Thick Basket Rim (Catch surface)
      ctx.fillStyle = rimColor;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(x - 2, y + 2, w + 4, 12, 6);
      } else {
        ctx.rect(x - 2, y + 2, w + 4, 12);
      }
      ctx.fill();

      // Rim highlight
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + 2, y + 5);
      ctx.lineTo(x + w - 2, y + 5);
      ctx.stroke();

      // 4. Handles on the sides
      ctx.strokeStyle = rimColor;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(x - 1, y + 16, 7, Math.PI * 0.5, Math.PI * 1.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + w + 1, y + 16, 7, Math.PI * 1.5, Math.PI * 0.5);
      ctx.stroke();

      ctx.restore();
    }
  }

  /**
   * Base Falling Object Class
   */
  class FallingItem {
    constructor(x, y, speedY, isBomb = false, fruitData = null) {
      this.x = x;
      this.y = y;
      this.speedY = speedY;
      this.isBomb = isBomb;
      this.fruitData = fruitData;
      this.radius = isBomb ? 20 : fruitData.radius;
      this.rotation = Math.random() * Math.PI * 2;
      this.rotSpeed = (Math.random() - 0.5) * 0.05;
      this.active = true;
      this.sparkTimer = 0;
    }

    update() {
      this.y += this.speedY;
      this.rotation += this.rotSpeed;
      this.sparkTimer += 0.2;
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);

      if (this.isBomb) {
        this.drawBomb(ctx);
      } else if (this.fruitData.isGolden) {
        this.drawGoldenFruit(ctx);
      } else {
        this.drawNormalFruit(ctx);
      }

      ctx.restore();
    }

    drawNormalFruit(ctx) {
      const type = this.fruitData.name;
      const r = this.radius;

      if (type === 'Apple') {
        // Red shiny Apple
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(-r * 0.35, 0, r * 0.75, 0, Math.PI * 2);
        ctx.arc(r * 0.35, 0, r * 0.75, 0, Math.PI * 2);
        ctx.fill();

        // Stem & Leaf
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.6);
        ctx.quadraticCurveTo(4, -r * 1.2, 8, -r * 1.1);
        ctx.stroke();

        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.ellipse(6, -r * 0.9, 7, 3.5, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

        // Specular highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.beginPath();
        ctx.ellipse(-r * 0.4, -r * 0.3, 4, 7, -Math.PI / 5, 0, Math.PI * 2);
        ctx.fill();

      } else if (type === 'Orange') {
        // Orange
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Texture dimples
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.arc(-5, -6, 2, 0, Math.PI * 2);
        ctx.arc(6, 4, 1.8, 0, Math.PI * 2);
        ctx.arc(-4, 7, 2, 0, Math.PI * 2);
        ctx.fill();

        // Leaf
        ctx.fillStyle = '#16a34a';
        ctx.beginPath();
        ctx.ellipse(3, -r + 2, 7, 3, -Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();

      } else if (type === 'Banana') {
        // Banana (Curved Crescent)
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.1, 0.2 * Math.PI, 1.1 * Math.PI, false);
        ctx.quadraticCurveTo(-r * 0.6, -r * 0.2, r * 0.8, -r * 0.2);
        ctx.closePath();
        ctx.fill();

        // Banana Tips
        ctx.fillStyle = '#713f12';
        ctx.fillRect(-r * 0.85, -2, 4, 4);
        ctx.fillRect(r * 0.8, -3, 3, 3);

      } else if (type === 'Strawberry') {
        // Strawberry (Heart-like cone)
        ctx.fillStyle = '#e11d48';
        ctx.beginPath();
        ctx.moveTo(0, r);
        ctx.bezierCurveTo(-r * 1.1, 0, -r * 0.8, -r * 0.8, 0, -r * 0.7);
        ctx.bezierCurveTo(r * 0.8, -r * 0.8, r * 1.1, 0, 0, r);
        ctx.fill();

        // Strawberry Seeds
        ctx.fillStyle = '#fef08a';
        [[-4, -4], [4, -4], [-6, 3], [0, 4], [6, 3], [0, -9], [-2, 10]].forEach(([sx, sy]) => {
          ctx.beginPath();
          ctx.arc(sx, sy, 1.2, 0, Math.PI * 2);
          ctx.fill();
        });

        // Green Leafy Crown
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.moveTo(-10, -r * 0.7);
        ctx.lineTo(-2, -r * 0.9);
        ctx.lineTo(0, -r * 1.2);
        ctx.lineTo(2, -r * 0.9);
        ctx.lineTo(10, -r * 0.7);
        ctx.lineTo(3, -r * 0.6);
        ctx.lineTo(-3, -r * 0.6);
        ctx.closePath();
        ctx.fill();

      } else if (type === 'Watermelon') {
        // Watermelon Slice
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.1, 0, Math.PI);
        ctx.closePath();
        ctx.fillStyle = '#15803d'; // Green rind
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, -1, r * 0.92, 0, Math.PI);
        ctx.closePath();
        ctx.fillStyle = '#fecdd3'; // White inner rim
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, -2, r * 0.8, 0, Math.PI);
        ctx.closePath();
        ctx.fillStyle = '#f43f5e'; // Pink flesh
        ctx.fill();

        // Seeds
        ctx.fillStyle = '#1e293b';
        [[-8, 6], [0, 11], [8, 6], [-4, 13], [4, 13]].forEach(([sx, sy]) => {
          ctx.beginPath();
          ctx.arc(sx, sy, 1.4, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    }

    drawGoldenFruit(ctx) {
      const r = this.radius;

      // Radiant glowing aura
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 18;

      const grad = ctx.createRadialGradient(-4, -4, 2, 0, 0, r);
      grad.addColorStop(0, '#fef08a');
      grad.addColorStop(0.5, '#fbbf24');
      grad.addColorStop(1, '#d97706');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Inner Star Emblem
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      const starR = r * 0.55;
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
        const ai = a + Math.PI / 5;
        const x1 = Math.cos(a) * starR;
        const y1 = Math.sin(a) * starR;
        const x2 = Math.cos(ai) * (starR * 0.45);
        const y2 = Math.sin(ai) * (starR * 0.45);
        if (i === 0) ctx.moveTo(x1, y1);
        else ctx.lineTo(x1, y1);
        ctx.lineTo(x2, y2);
      }
      ctx.closePath();
      ctx.fill();

      // Shiny Stem
      ctx.shadowBlur = 0; // reset shadow
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(4, -r - 7);
      ctx.stroke();

      ctx.fillStyle = '#84cc16';
      ctx.beginPath();
      ctx.ellipse(6, -r - 5, 5, 2.5, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
    }

    drawBomb(ctx) {
      const r = this.radius;

      // Dark shadow
      ctx.shadowColor = 'rgba(239, 68, 68, 0.4)';
      ctx.shadowBlur = 12;

      // Bomb Body (Spherical metallic black)
      const grad = ctx.createRadialGradient(-5, -5, 2, 0, 0, r);
      grad.addColorStop(0, '#64748b');
      grad.addColorStop(0.3, '#1e293b');
      grad.addColorStop(1, '#020617');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;

      // Metallic Cap at top
      ctx.fillStyle = '#475569';
      ctx.fillRect(-5, -r - 4, 10, 5);

      // Fuse string
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, -r - 4);
      ctx.quadraticCurveTo(8, -r - 12, 12, -r - 10);
      ctx.stroke();

      // Animated burning spark at tip of fuse
      const sparkX = 12;
      const sparkY = -r - 10;
      const sparkSize = 4 + Math.sin(this.sparkTimer * 4) * 2;

      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(sparkX, sparkY, sparkSize * 0.5, 0, Math.PI * 2);
      ctx.fill();

      // Skull or Danger Exclamation Emblem on bomb
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 15px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('☠', 0, 2);
    }
  }

  // ==========================================================================
  // 5. MAIN GAME CONTROLLER CLASS
  // ==========================================================================
  class FruitCatcherGame {
    constructor() {
      // DOM Elements
      this.canvas = document.getElementById('gameCanvas');
      this.ctx = this.canvas.getContext('2d');
      this.container = document.getElementById('gameContainer');

      // HUD Elements
      this.scoreDisplay = document.getElementById('scoreDisplay');
      this.timerDisplay = document.getElementById('timerDisplay');
      this.livesDisplay = document.getElementById('livesDisplay');
      this.soundToggleBtn = document.getElementById('soundToggleBtn');
      this.pauseToggleBtn = document.getElementById('pauseToggleBtn');

      // Screens / Modals
      this.startScreen = document.getElementById('startScreen');
      this.pauseScreen = document.getElementById('pauseScreen');
      this.gameOverScreen = document.getElementById('gameOverScreen');

      // Buttons
      this.startGameBtn = document.getElementById('startGameBtn');
      this.resumeGameBtn = document.getElementById('resumeGameBtn');
      this.restartFromPauseBtn = document.getElementById('restartFromPauseBtn');
      this.restartGameBtn = document.getElementById('restartGameBtn');
      this.themeSelect = document.getElementById('themeSelect');

      // Game Over Stats
      this.finalScoreVal = document.getElementById('finalScoreVal');
      this.highScoreVal = document.getElementById('highScoreVal');
      this.fruitsCaughtVal = document.getElementById('fruitsCaughtVal');
      this.accuracyVal = document.getElementById('accuracyVal');
      this.gameOverReason = document.getElementById('gameOverReason');
      this.gameOverHeading = document.getElementById('gameOverHeading');
      this.gameOverIcon = document.getElementById('gameOverIcon');
      this.newHighScoreBadge = document.getElementById('newHighScoreBadge');

      // Sub-systems
      this.soundManager = new SoundManager();
      this.basket = new Basket(this.canvas.width, this.canvas.height);

      // Game State Variables
      this.state = GAME_STATE.START;
      this.score = 0;
      this.highScore = parseInt(localStorage.getItem('fruit_catcher_highscore') || '0', 10);
      this.lives = GAME_CONFIG.INITIAL_LIVES;
      this.timeLeft = GAME_CONFIG.TOTAL_GAME_TIME;
      this.selectedTheme = 'orchard';

      // Statistics
      this.totalFruitsSpawned = 0;
      this.fruitsCaught = 0;
      this.bombsHit = 0;

      // Entities & Animation Containers
      this.fallingItems = [];
      this.particles = [];
      this.floatingTexts = [];

      // Timers & Loops
      this.lastTimestamp = 0;
      this.animationFrameId = null;
      this.spawnTimer = null;
      this.gameTimerInterval = null;

      // Screen Shake Effect
      this.shakeDuration = 0;
      this.shakeIntensity = 0;

      // Cloud animation for orchard/sunset themes
      this.clouds = [
        { x: 50, y: 80, speed: 0.35, scale: 1 },
        { x: 340, y: 130, speed: 0.25, scale: 0.8 },
        { x: 620, y: 70, speed: 0.45, scale: 1.2 }
      ];

      this.initEvents();
      this.render(); // Initial static frame
    }

    // ========================================================================
    // Event Binding
    // ========================================================================
    initEvents() {
      // Keyboard input for basket controls and shortcuts
      window.addEventListener('keydown', (e) => this.handleKeyDown(e));
      window.addEventListener('keyup', (e) => this.handleKeyUp(e));

      // Mouse/Touch controls on Canvas for accessibility & tablet support
      let isDragging = false;
      const updateBasketPosition = (clientX) => {
        if (this.state !== GAME_STATE.PLAYING) return;
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const canvasX = (clientX - rect.left) * scaleX;
        this.basket.x = Math.max(0, Math.min(this.canvas.width - this.basket.width, canvasX - this.basket.width / 2));
      };

      this.canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        updateBasketPosition(e.clientX);
      });
      window.addEventListener('mousemove', (e) => {
        if (isDragging) updateBasketPosition(e.clientX);
      });
      window.addEventListener('mouseup', () => {
        isDragging = false;
      });

      // Touch events
      this.canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) updateBasketPosition(e.touches[0].clientX);
      }, { passive: true });
      this.canvas.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) updateBasketPosition(e.touches[0].clientX);
      }, { passive: true });

      // Button listeners
      this.startGameBtn.addEventListener('click', () => {
        this.soundManager.playClick();
        this.startGame();
      });

      this.resumeGameBtn.addEventListener('click', () => {
        this.soundManager.playClick();
        this.resumeGame();
      });

      this.restartFromPauseBtn.addEventListener('click', () => {
        this.soundManager.playClick();
        this.resetGame();
        this.startGame();
      });

      this.restartGameBtn.addEventListener('click', () => {
        this.soundManager.playClick();
        this.resetGame();
        this.startGame();
      });

      this.soundToggleBtn.addEventListener('click', () => {
        const isMuted = this.soundManager.toggleMute();
        this.soundToggleBtn.textContent = isMuted ? '🔇' : '🔊';
        this.soundToggleBtn.title = isMuted ? 'Unmute Sound (M)' : 'Mute Sound (M)';
      });

      this.pauseToggleBtn.addEventListener('click', () => {
        if (this.state === GAME_STATE.PLAYING) {
          this.pauseGame();
        } else if (this.state === GAME_STATE.PAUSED) {
          this.resumeGame();
        }
      });

      this.themeSelect.addEventListener('change', (e) => {
        this.selectedTheme = e.target.value;
        this.renderBackgroundOnly();
      });
    }

    handleKeyDown(e) {
      // Left movement: Left Arrow or 'A' / 'a'
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        this.basket.movingLeft = true;
      }
      // Right movement: Right Arrow or 'D' / 'd'
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        this.basket.movingRight = true;
      }
      // Pause toggle: 'P' or 'p'
      if (e.code === 'KeyP') {
        if (this.state === GAME_STATE.PLAYING) {
          this.pauseGame();
        } else if (this.state === GAME_STATE.PAUSED) {
          this.resumeGame();
        }
      }
      // Mute toggle: 'M' or 'm'
      if (e.code === 'KeyM') {
        const isMuted = this.soundManager.toggleMute();
        this.soundToggleBtn.textContent = isMuted ? '🔇' : '🔊';
      }
    }

    handleKeyUp(e) {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        this.basket.movingLeft = false;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        this.basket.movingRight = false;
      }
    }

    // ========================================================================
    // Game State Lifecycle
    // ========================================================================
    startGame() {
      this.soundManager.initContext();
      this.resetGame();
      this.state = GAME_STATE.PLAYING;

      // Update Screen Overlays
      this.startScreen.classList.add('hidden');
      this.pauseScreen.classList.add('hidden');
      this.gameOverScreen.classList.add('hidden');

      // Start Game Timer (1 second interval)
      this.startGameTimer();

      // Start Dynamic Spawning Loop
      this.scheduleNextSpawn();

      // Start Main Animation Loop
      this.lastTimestamp = performance.now();
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
      this.animationFrameId = requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    pauseGame() {
      if (this.state !== GAME_STATE.PLAYING) return;
      this.state = GAME_STATE.PAUSED;
      clearInterval(this.gameTimerInterval);
      clearTimeout(this.spawnTimer);
      this.pauseScreen.classList.remove('hidden');
    }

    resumeGame() {
      if (this.state !== GAME_STATE.PAUSED) return;
      this.state = GAME_STATE.PLAYING;
      this.pauseScreen.classList.add('hidden');

      this.startGameTimer();
      this.scheduleNextSpawn();

      this.lastTimestamp = performance.now();
      this.animationFrameId = requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    resetGame() {
      this.score = 0;
      this.lives = GAME_CONFIG.INITIAL_LIVES;
      this.timeLeft = GAME_CONFIG.TOTAL_GAME_TIME;
      this.totalFruitsSpawned = 0;
      this.fruitsCaught = 0;
      this.bombsHit = 0;

      this.fallingItems = [];
      this.particles = [];
      this.floatingTexts = [];
      this.shakeDuration = 0;

      this.basket.reset();

      clearInterval(this.gameTimerInterval);
      clearTimeout(this.spawnTimer);

      this.updateHUD();
    }

    endGame(reason = "Time's Up!") {
      this.state = GAME_STATE.GAME_OVER;

      clearInterval(this.gameTimerInterval);
      clearTimeout(this.spawnTimer);

      const isNewHighScore = this.score > this.highScore;
      if (isNewHighScore) {
        this.highScore = this.score;
        localStorage.setItem('fruit_catcher_highscore', this.highScore.toString());
      }

      // Populate Game Over Modal Details
      this.finalScoreVal.textContent = this.score;
      this.highScoreVal.textContent = this.highScore;
      this.fruitsCaughtVal.textContent = this.fruitsCaught;

      const accuracy = this.totalFruitsSpawned > 0
        ? Math.round((this.fruitsCaught / this.totalFruitsSpawned) * 100)
        : 0;
      this.accuracyVal.textContent = `${accuracy}%`;

      this.gameOverReason.textContent = reason;

      if (this.lives <= 0) {
        this.gameOverHeading.textContent = 'GAME OVER';
        this.gameOverIcon.textContent = '💥';
        this.soundManager.playGameOver();
      } else {
        this.gameOverHeading.textContent = "TIME'S UP!";
        this.gameOverIcon.textContent = '🏆';
        this.soundManager.playCatchGolden();
      }

      if (isNewHighScore && this.score > 0) {
        this.newHighScoreBadge.classList.remove('hidden');
      } else {
        this.newHighScoreBadge.classList.add('hidden');
      }

      this.gameOverScreen.classList.remove('hidden');
    }

    // ========================================================================
    // Difficulty Progression & Spawning Logic
    // ========================================================================

    /**
     * Calculates the current falling speed based on score and time elapsed.
     * Smooth, gradual progression: speed increases as score increases.
     */
    getCurrentFallSpeed() {
      const scoreFactor = Math.min(this.score / 120, 3.5);
      const timeFactor = (GAME_CONFIG.TOTAL_GAME_TIME - this.timeLeft) / 25;
      const speed = GAME_CONFIG.BASE_FALL_SPEED + scoreFactor * 0.7 + timeFactor * 0.4;
      return Math.min(speed, GAME_CONFIG.MAX_FALL_SPEED);
    }

    /**
     * Calculates current spawn delay interval.
     * Decreases as the player gets more points, increasing object frequency.
     */
    getCurrentSpawnInterval() {
      const scoreDeduction = Math.min(this.score * 1.8, 600);
      const interval = GAME_CONFIG.BASE_SPAWN_INTERVAL - scoreDeduction;
      // Add slight randomness (±80ms) for organic pacing
      const jitter = (Math.random() - 0.5) * 160;
      return Math.max(GAME_CONFIG.MIN_SPAWN_INTERVAL, interval + jitter);
    }

    scheduleNextSpawn() {
      if (this.state !== GAME_STATE.PLAYING) return;
      const delay = this.getCurrentSpawnInterval();
      this.spawnTimer = setTimeout(() => {
        this.spawnItem();
        this.scheduleNextSpawn();
      }, delay);
    }

    spawnItem() {
      if (this.state !== GAME_STATE.PLAYING) return;

      const margin = 50;
      const spawnX = margin + Math.random() * (this.canvas.width - margin * 2);
      const spawnY = -35;
      const currentSpeed = this.getCurrentFallSpeed();

      // Progressive bomb chance: starts at 18%, scales up to ~28%
      const bombChance = Math.min(0.18 + (this.score / 400) * 0.1, 0.28);
      const isBomb = Math.random() < bombChance;

      if (isBomb) {
        this.fallingItems.push(new FallingItem(spawnX, spawnY, currentSpeed + 0.3, true, null));
      } else {
        this.totalFruitsSpawned++;
        // 15% chance for special golden fruit (+30 points)
        const isGolden = Math.random() < 0.15;
        let fruitData;
        if (isGolden) {
          fruitData = GOLDEN_FRUIT;
        } else {
          const randomIndex = Math.floor(Math.random() * FRUIT_TYPES.length);
          fruitData = FRUIT_TYPES[randomIndex];
        }
        this.fallingItems.push(new FallingItem(spawnX, spawnY, currentSpeed, false, fruitData));
      }
    }

    startGameTimer() {
      clearInterval(this.gameTimerInterval);
      this.gameTimerInterval = setInterval(() => {
        if (this.state === GAME_STATE.PLAYING) {
          this.timeLeft--;
          this.updateHUD();

          if (this.timeLeft <= 0) {
            this.endGame("Time's Up! Excellent Effort!");
          }
        }
      }, 1000);
    }

    // ========================================================================
    // Collision Detection Logic (AABB & Bounding Circle)
    // ========================================================================
    checkCollisions() {
      const catchZone = this.basket.getCatchZone();

      for (let i = this.fallingItems.length - 1; i >= 0; i--) {
        const item = this.fallingItems[i];
        if (!item.active) continue;

        // Collision logic: check if the circle of the falling object intersects
        // the catch zone rectangle at the mouth of the basket
        const closestX = Math.max(catchZone.x, Math.min(item.x, catchZone.x + catchZone.width));
        const closestY = Math.max(catchZone.y, Math.min(item.y, catchZone.y + catchZone.height));

        const distanceX = item.x - closestX;
        const distanceY = item.y - closestY;
        const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);

        if (distanceSquared < (item.radius * item.radius)) {
          // Object caught inside basket!
          item.active = false;
          this.handleCatch(item);
          this.fallingItems.splice(i, 1);
          continue;
        }

        // Missed item passed bottom boundary
        if (item.y - item.radius > this.canvas.height) {
          item.active = false;
          this.fallingItems.splice(i, 1);
          // Note: Missing a fruit has no penalty per specification!
        }
      }
    }

    handleCatch(item) {
      if (item.isBomb) {
        // Hitting a bomb: Deduct 1 life & trigger explosion
        this.lives--;
        this.bombsHit++;
        this.triggerScreenShake(14, 18);
        this.createExplosionParticles(item.x, item.y);
        this.soundManager.playBombExplosion();
        this.floatingTexts.push(new FloatingText(item.x, item.y, '-1 LIFE 💥', '#ef4444', 24));
        this.updateHUD();

        if (this.lives <= 0) {
          this.endGame('Out of Lives! Avoid the bombs!');
        }
      } else {
        // Fruit caught!
        this.fruitsCaught++;
        const pts = item.fruitData.points;
        this.score += pts;

        if (item.fruitData.isGolden) {
          // Golden Fruit (+30 pts)
          this.createSparkleParticles(item.x, item.y, '#f59e0b');
          this.soundManager.playCatchGolden();
          this.floatingTexts.push(new FloatingText(item.x, item.y, `+${pts} ⭐`, '#facc15', 26));
        } else {
          // Normal Fruit (+10 pts)
          this.createFruitParticles(item.x, item.y, item.fruitData.color);
          this.soundManager.playCatchFruit();
          this.floatingTexts.push(new FloatingText(item.x, item.y, `+${pts}`, '#4ade80', 22));
        }

        this.updateHUD();
      }
    }

    triggerScreenShake(duration, intensity) {
      this.shakeDuration = duration;
      this.shakeIntensity = intensity;
    }

    createFruitParticles(x, y, color) {
      for (let i = 0; i < 14; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        const size = 3 + Math.random() * 3.5;
        this.particles.push(new Particle(
          x, y, color, size,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed - 1.5,
          1.0
        ));
      }
    }

    createSparkleParticles(x, y, color) {
      for (let i = 0; i < 22; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 3 + Math.random() * 5.5;
        const size = 4 + Math.random() * 4.5;
        this.particles.push(new Particle(
          x, y, color, size,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed - 2,
          1.2,
          true // Golden 4-point star sparkle
        ));
      }
    }

    createExplosionParticles(x, y) {
      const colors = ['#ef4444', '#f97316', '#fbbf24', '#475569'];
      for (let i = 0; i < 30; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 3 + Math.random() * 7;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = 4 + Math.random() * 6;
        this.particles.push(new Particle(
          x, y, color, size,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed - 2,
          1.4
        ));
      }
    }

    // ========================================================================
    // HUD & UI Management
    // ========================================================================
    updateHUD() {
      this.scoreDisplay.textContent = this.score;
      this.timerDisplay.textContent = `${this.timeLeft}s`;

      // Update heart life indicators
      const hearts = this.livesDisplay.querySelectorAll('.heart');
      hearts.forEach((heart, idx) => {
        if (idx < this.lives) {
          heart.classList.remove('lost');
        } else {
          heart.classList.add('lost');
        }
      });
    }

    // ========================================================================
    // Main Animation & Render Loop
    // ========================================================================
    gameLoop(timestamp) {
      if (this.state === GAME_STATE.PLAYING) {
        this.update();
        this.render();
        this.animationFrameId = requestAnimationFrame((ts) => this.gameLoop(ts));
      }
    }

    update() {
      // 1. Update basket
      this.basket.update();

      // 2. Update falling items
      for (let item of this.fallingItems) {
        item.update();
      }

      // 3. Collision checks
      this.checkCollisions();

      // 4. Update particles
      for (let i = this.particles.length - 1; i >= 0; i--) {
        this.particles[i].update();
        if (this.particles[i].life <= 0) {
          this.particles.splice(i, 1);
        }
      }

      // 5. Update floating score popups
      for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
        this.floatingTexts[i].update();
        if (this.floatingTexts[i].alpha <= 0) {
          this.floatingTexts.splice(i, 1);
        }
      }

      // 6. Update background clouds
      for (let cloud of this.clouds) {
        cloud.x += cloud.speed;
        if (cloud.x > this.canvas.width + 100) {
          cloud.x = -120;
        }
      }
    }

    render() {
      this.ctx.save();

      // Apply screen shake offset if active
      if (this.shakeDuration > 0) {
        const shakeX = (Math.random() - 0.5) * this.shakeIntensity;
        const shakeY = (Math.random() - 0.5) * this.shakeIntensity;
        this.ctx.translate(shakeX, shakeY);
        this.shakeDuration--;
      }

      // 1. Draw animated scenery background
      this.drawBackground();

      // 2. Draw falling fruits & bombs
      for (let item of this.fallingItems) {
        item.draw(this.ctx);
      }

      // 3. Draw player's basket
      this.basket.draw(this.ctx, this.selectedTheme);

      // 4. Draw particle effects
      for (let p of this.particles) {
        p.draw(this.ctx);
      }

      // 5. Draw floating texts (+10, +30, etc.)
      for (let ft of this.floatingTexts) {
        ft.draw(this.ctx);
      }

      this.ctx.restore();
    }

    renderBackgroundOnly() {
      this.drawBackground();
      this.basket.draw(this.ctx, this.selectedTheme);
    }

    drawBackground() {
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;

      if (this.selectedTheme === 'cyber') {
        // Cyber Neon Theme
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, '#090d16');
        bgGrad.addColorStop(0.65, '#1e1b4b');
        bgGrad.addColorStop(1, '#311042');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Neon Grid Lines at bottom
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= w; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, h * 0.7);
          ctx.lineTo(x * 1.4 - w * 0.2, h);
          ctx.stroke();
        }
        for (let y = h * 0.7; y <= h; y += 22) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }

        // Cyber sun / moon
        ctx.fillStyle = 'rgba(236, 72, 153, 0.4)';
        ctx.beginPath();
        ctx.arc(w / 2, h * 0.55, 70, Math.PI, Math.PI * 2);
        ctx.fill();

      } else if (this.selectedTheme === 'sunset') {
        // Tropical Sunset Theme
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, '#4c1d95');
        bgGrad.addColorStop(0.4, '#c026d3');
        bgGrad.addColorStop(0.7, '#f97316');
        bgGrad.addColorStop(1, '#fde047');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Sunset Sun
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(w * 0.75, h * 0.4, 45, 0, Math.PI * 2);
        ctx.fill();

        // Distant hills silhouettes
        ctx.fillStyle = '#2e1065';
        ctx.beginPath();
        ctx.moveTo(0, h);
        ctx.lineTo(0, h * 0.85);
        ctx.quadraticCurveTo(w * 0.25, h * 0.75, w * 0.5, h * 0.85);
        ctx.quadraticCurveTo(w * 0.75, h * 0.95, w, h * 0.82);
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();

      } else {
        // Sunny Orchard (Default)
        const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
        skyGrad.addColorStop(0, '#38bdf8');
        skyGrad.addColorStop(0.65, '#bae6fd');
        skyGrad.addColorStop(1, '#f0fdf4');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, h);

        // Radiant Sun
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(90, 75, 38, 0, Math.PI * 2);
        ctx.fill();

        // Drifting Fluffy Clouds
        ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
        for (let cloud of this.clouds) {
          const cx = cloud.x;
          const cy = cloud.y;
          const s = cloud.scale;
          ctx.beginPath();
          ctx.arc(cx, cy, 22 * s, 0, Math.PI * 2);
          ctx.arc(cx + 20 * s, cy - 10 * s, 26 * s, 0, Math.PI * 2);
          ctx.arc(cx + 42 * s, cy, 20 * s, 0, Math.PI * 2);
          ctx.arc(cx + 18 * s, cy + 8 * s, 20 * s, 0, Math.PI * 2);
          ctx.fill();
        }

        // Rolling Orchard Green Hills
        ctx.fillStyle = '#86efac';
        ctx.beginPath();
        ctx.moveTo(0, h);
        ctx.lineTo(0, h * 0.88);
        ctx.quadraticCurveTo(w * 0.3, h * 0.78, w * 0.6, h * 0.88);
        ctx.quadraticCurveTo(w * 0.85, h * 0.96, w, h * 0.85);
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();

        // Foreground Lush Ground
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.moveTo(0, h);
        ctx.lineTo(0, h * 0.94);
        ctx.quadraticCurveTo(w * 0.5, h * 0.90, w, h * 0.95);
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  // ==========================================================================
  // 6. APPLICATION BOOTSTRAP
  // ==========================================================================
  window.addEventListener('DOMContentLoaded', () => {
    window.fruitCatcherGame = new FruitCatcherGame();
  });

})();
