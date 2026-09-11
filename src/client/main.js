/**
 * RODNEY BEACH RUSH - Main Game Controller
 * Orchestrates physics, graphics, audio, and game state
 */

class GameController {
  constructor() {
    // Initialize three.js
    this.setupRenderer();
    
    // Game state
    this.gameState = 'menu'; // menu, countdown, racing, paused, finished
    this.settings = {
      difficulty: 'normal',
      drivingAssist: true,
      soundEnabled: true,
      musicEnabled: true,
      graphicsQuality: 'nice' // or 'fast'
    };
    
    // Game objects
    this.track = null;
    this.race = null;
    this.world = null;
    this.audio = null;
    this.playerKart = null;
    
    // Input handling
    this.input = {
      throttle: 0,
      brake: 0,
      steering: 0,
      keys: {}
    };
    
    // Timing
    this.lastFrameTime = Date.now();
    this.frameCount = 0;
    this.fps = 60;
    
    // Load settings from localStorage
    this.loadSettings();
    this.initialize();
  }

  setupRenderer() {
    // Create scene, camera, renderer
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.Fog(0x87ceeb, 200, 500);
    
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      10000
    );
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowShadowMap;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    document.getElementById('gameContainer').appendChild(this.renderer.domElement);
    
    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());
  }

  initialize() {
    // Initialize audio
    this.audio = new AudioEngine();
    
    // Initialize game world
    this.world = new World(this.scene, this.camera);
    
    // Initialize track and race
    this.track = new Track();
    this.race = new Race(this.track, 1, 3, this.settings.difficulty);
    
    // Create karts in the world
    const kartColors = [0xff6b35, 0x004e89, 0xf77f00, 0x06a77d];
    for (let i = 0; i < this.race.karts.length; i++) {
      const kart = this.race.karts[i];
      this.world.createKart(i, kart.position, kartColors[i % kartColors.length]);
      
      if (kart.isPlayer) {
        this.playerKart = kart;
      }
    }
    
    // Setup input handlers
    this.setupInputHandlers();
    
    // Start game loop
    this.gameLoop();
  }

  setupInputHandlers() {
    // Keyboard input
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    
    // Touch input for mobile
    if ('ontouchstart' in window) {
      this.setupTouchControls();
    }
    
    // Device motion (tilt steering)
    if ('DeviceMotionEvent' in window) {
      window.addEventListener('devicemotion', (e) => this.handleDeviceMotion(e));
    }
  }

  handleKeyDown(e) {
    this.input.keys[e.key.toLowerCase()] = true;
    
    // Update throttle, brake, steering
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      this.input.throttle = 1;
    }
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      this.input.brake = 1;
    }
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      this.input.steering = -1;
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      this.input.steering = 1;
    }
    if (e.key === ' ') {
      e.preventDefault();
      this.input.brake = 1;
    }
    if (e.key === 'p' || e.key === 'P') {
      this.togglePause();
    }
  }

  handleKeyUp(e) {
    this.input.keys[e.key.toLowerCase()] = false;
    
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      this.input.throttle = 0;
    }
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      this.input.brake = 0;
    }
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      this.input.steering = 0;
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      this.input.steering = 0;
    }
    if (e.key === ' ') {
      this.input.brake = 0;
    }
  }

  setupTouchControls() {
    // Create virtual touch buttons (would be implemented in full version)
    // For now, just detect taps
    document.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const x = touch.clientX / window.innerWidth;
        const y = touch.clientY / window.innerHeight;
        
        // Divide screen into zones
        if (y > 0.7) {
          // Bottom controls
          if (x < 0.25) {
            this.input.steering = -1;
          } else if (x > 0.75) {
            this.input.steering = 1;
          } else {
            this.input.throttle = 1;
          }
        }
      }
    });
    
    document.addEventListener('touchend', (e) => {
      this.input.throttle = 0;
      this.input.steering = 0;
      this.input.brake = 0;
    });
  }

  handleDeviceMotion(e) {
    // Tilt-based steering
    if (e.accelerationIncludingGravity) {
      const x = e.accelerationIncludingGravity.x || 0;
      // Map device tilt (-10 to 10) to steering (-1 to 1)
      this.input.steering = Math.max(-1, Math.min(1, x / 10));
    }
  }

  updateHUD() {
    const playerKart = this.playerKart;
    if (!playerKart) return;
    
    // Update position
    const position = this.race.getPlayerPosition();
    document.getElementById('positionInfo').textContent = `P${position} / ${this.race.karts.length}`;
    
    // Update lap info
    document.getElementById('lapInfo').textContent = `LAP ${playerKart.lapCount + 1}/${this.race.lapsToWin}`;
    
    // Update speed
    const speed = Math.round(playerKart.getSpeed());
    document.getElementById('speedometer').textContent = `${speed} km/h`;
    
    // Update timer
    const elapsed = this.race.getElapsedTime();
    const minutes = Math.floor(elapsed / 60);
    const seconds = Math.floor(elapsed % 60);
    document.getElementById('timerInfo').textContent = 
      `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  gameLoop = () => {
    requestAnimationFrame(this.gameLoop);
    
    // Calculate delta time
    const now = Date.now();
    const dt = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;
    
    // Update based on game state
    switch (this.gameState) {
      case 'menu':
        this.updateMenu();
        break;
      case 'countdown':
        this.updateCountdown();
        break;
      case 'racing':
        this.updateRace(dt);
        break;
      case 'paused':
        this.updatePaused();
        break;
      case 'finished':
        this.updateFinished();
        break;
    }
    
    // Update HUD
    if (this.gameState === 'racing') {
      this.updateHUD();
    }
    
    // Render
    this.renderer.render(this.scene, this.camera);
    
    // FPS counter
    this.frameCount++;
  }

  updateMenu() {
    // Menu is static, just render
  }

  updateCountdown() {
    // Countdown logic would go here
    // After 3 seconds, transition to racing
  }

  updateRace(dt) {
    if (this.gameState !== 'racing') return;
    
    // Apply player input to kart
    this.playerKart.throttle = this.input.throttle;
    this.playerKart.brake = this.input.brake;
    this.playerKart.steering = this.input.steering;
    
    // Play engine sound
    if (this.playerKart.throttle > 0 || this.playerKart.brake > 0) {
      this.audio.playEngineSound(this.playerKart.getSpeed());
    }
    
    // Update race physics
    this.race.update(dt, this.settings.drivingAssist);
    
    // Update world graphics
    for (let kart of this.race.karts) {
      this.world.updateKart(kart.id, kart.position, kart.rotation);
    }
    
    // Update camera to follow player
    if (this.playerKart) {
      this.world.updateCameraFollow(this.playerKart.position, this.playerKart.rotation);
    }
    
    // Check if race finished
    if (this.race.isFinished) {
      this.gameState = 'finished';
      this.audio.playFinishJingle();
    }
  }

  updatePaused() {
    // Game is paused, just show pause screen
  }

  updateFinished() {
    // Show results screen
  }

  startGame() {
    this.gameState = 'racing';
    this.race.start();
    
    // Play music
    this.audio.playTropicalMusic();
    this.audio.playBassLine();
    
    // Hide menu
    document.getElementById('mainMenu').classList.add('hidden');
  }

  togglePause() {
    if (this.gameState === 'racing') {
      this.gameState = 'paused';
      this.audio.setVolume(0.3);
    } else if (this.gameState === 'paused') {
      this.gameState = 'racing';
      this.audio.setVolume(0.7);
    }
  }

  loadSettings() {
    const saved = localStorage.getItem('rodneyBeachRushSettings');
    if (saved) {
      this.settings = { ...this.settings, ...JSON.parse(saved) };
    }
  }

  saveSettings() {
    localStorage.setItem('rodneyBeachRushSettings', JSON.stringify(this.settings));
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // Public API for menu interactions
  play() {
    this.startGame();
  }

  showSettings() {
    alert('⚙️ SETTINGS\n\nDifficulty: ' + this.settings.difficulty.toUpperCase() +
          '\nDriving Assist: ' + (this.settings.drivingAssist ? 'ON' : 'OFF') +
          '\nSound: ' + (this.settings.soundEnabled ? 'ON' : 'OFF') +
          '\nGraphics: ' + this.settings.graphicsQuality.toUpperCase());
  }

  showHowToPlay() {
    alert('❓ HOW TO PLAY\n\nCONTROLS:\n' +
          '⬆ Accelerate\n⬇ Brake\n⬅ ➡ Steer\n\n' +
          'SPEED SETTINGS:\n' +
          '🐢 CALM: ~45 km/h\n' +
          '🏃 NORMAL: ~56 km/h\n' +
          '🚀 FAST: ~67 km/h\n\n' +
          'Race 3 laps against your opponents!');
  }
}

// Initialize game when page loads
let gameController = null;

window.addEventListener('load', () => {
  gameController = new GameController();
  
  // Setup menu button handlers
  window.startGame = () => gameController.play();
  window.showSettings = () => gameController.showSettings();
  window.showHowToPlay = () => gameController.showHowToPlay();
  window.showStages = () => alert('🏝️ STAGES\n\nTraditional Beach Circuit coming soon!');
  window.pauseGame = () => gameController.togglePause();
});
