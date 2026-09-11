/**
 * RODNEY BEACH RUSH - Physics Simulation & Game Logic
 * Handles track geometry, kart physics, AI opponents, driving assist, and race management
 */

class Track {
  constructor() {
    this.name = "Tropical Beach Circuit";
    this.lapLength = 800; // meters
    this.checkpoints = this.generateCheckpoints();
    this.width = 10; // meters
    this.terrain = new TerrainMap();
  }

  generateCheckpoints() {
    // Generate track checkpoints as a series of waypoints
    const checkpoints = [];
    const segments = 12; // Number of track segments
    
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const radius = 40 + Math.sin(angle * 3) * 10; // Wavy track
      
      checkpoints.push({
        id: i,
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius,
        radius: 5, // Checkpoint radius
        nextCheckpoint: (i + 1) % segments
      });
    }
    
    return checkpoints;
  }

  getClosestCheckpoint(position) {
    let closest = null;
    let minDist = Infinity;
    
    for (let cp of this.checkpoints) {
      const dist = Math.hypot(position.x - cp.x, position.z - cp.z);
      if (dist < minDist) {
        minDist = dist;
        closest = cp;
      }
    }
    
    return closest;
  }

  isOnTrack(position) {
    const closest = this.getClosestCheckpoint(position);
    const distToCenter = Math.hypot(position.x - closest.x, position.z - closest.z);
    return distToCenter < this.width * 1.5;
  }

  getTrackNormal(position) {
    const closest = this.getClosestCheckpoint(position);
    const angle = Math.atan2(closest.z, closest.x);
    return {
      x: Math.cos(angle),
      z: Math.sin(angle)
    };
  }
}

class TerrainMap {
  constructor() {
    this.sandFriction = 0.95; // Slow down on sand
    this.grassFriction = 0.92;
    this.roadFriction = 0.98;
    this.oceanFriction = 0.5; // Very slow in water
  }

  getTerrainType(x, z) {
    const distFromCenter = Math.hypot(x, z);
    
    if (distFromCenter > 60) return 'ocean'; // Water beyond track
    if (distFromCenter > 50) return 'sand';  // Beach
    if (distFromCenter > 40) return 'grass'; // Grass
    return 'road'; // Track
  }

  getFriction(x, z) {
    const type = this.getTerrainType(x, z);
    const frictions = {
      'road': this.roadFriction,
      'grass': this.grassFriction,
      'sand': this.sandFriction,
      'ocean': this.oceanFriction
    };
    return frictions[type] || this.roadFriction;
  }
}

class Kart {
  constructor(id, isPlayer = false, startCheckpoint = 0) {
    this.id = id;
    this.isPlayer = isPlayer;
    
    // Position & Physics
    this.position = { x: 0, y: 0, z: 0 };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.acceleration = { x: 0, y: 0, z: 0 };
    this.rotation = 0; // Radians, heading
    this.angularVelocity = 0;
    
    // Input
    this.throttle = 0; // 0-1
    this.brake = 0; // 0-1
    this.steering = 0; // -1 to 1
    
    // Kart properties
    this.maxSpeed = 25; // m/s (90 km/h)
    this.maxAccel = 15; // m/s²
    this.maxBrakeAccel = 20; // m/s²
    this.maxSteerAngle = 0.6; // radians
    this.drag = 0.15;
    this.mass = 1.0;
    this.wheelRadius = 0.35;
    
    // Lap tracking
    this.currentCheckpoint = startCheckpoint;
    this.lapCount = 0;
    this.lapStartTime = 0;
    this.totalDistance = 0;
    this.passedCheckpoints = new Set();
    
    // Status
    this.isOffTrack = false;
    this.offTrackTimer = 0;
    this.hasFinished = false;
    this.finishTime = Infinity;
  }

  update(dt, track, drivingAssist = true) {
    dt = Math.min(dt, 0.016); // Cap dt to 16ms (60fps)
    
    // Apply throttle and brake
    let targetAccel = this.throttle * this.maxAccel;
    if (this.brake > 0) {
      targetAccel = -this.maxBrakeAccel * this.brake;
    }
    
    // Calculate forward direction
    const forward = {
      x: Math.cos(this.rotation),
      z: Math.sin(this.rotation)
    };
    
    // Apply acceleration in forward direction
    const currentSpeed = Math.hypot(this.velocity.x, this.velocity.z);
    
    if (Math.abs(targetAccel) > 0.01) {
      this.velocity.x += forward.x * targetAccel * dt;
      this.velocity.z += forward.z * targetAccel * dt;
    }
    
    // Apply drag (air resistance)
    this.velocity.x *= (1 - this.drag * dt);
    this.velocity.z *= (1 - this.drag * dt);
    
    // Apply terrain friction
    const friction = track.terrain.getFriction(this.position.x, this.position.z);
    this.velocity.x *= friction;
    this.velocity.z *= friction;
    
    // Cap speed
    const speed = Math.hypot(this.velocity.x, this.velocity.z);
    if (speed > this.maxSpeed) {
      const scale = this.maxSpeed / speed;
      this.velocity.x *= scale;
      this.velocity.z *= scale;
    }
    
    // Apply steering
    if (Math.abs(this.steering) > 0.01 && speed > 0.5) {
      this.angularVelocity = this.steering * speed * 2; // Steering proportional to speed
    } else {
      this.angularVelocity *= 0.9; // Damping
    }
    
    this.rotation += this.angularVelocity * dt;
    
    // Update position
    this.position.x += this.velocity.x * dt;
    this.position.z += this.velocity.z * dt;
    
    // Driving assist
    if (drivingAssist && !this.isPlayer) {
      this.applyDrivingAssist(track);
    }
    
    // Check if on track
    const wasOnTrack = !this.isOffTrack;
    this.isOffTrack = !track.isOnTrack(this.position);
    
    if (this.isOffTrack) {
      this.offTrackTimer += dt;
      // Slow down significantly off-track
      this.velocity.x *= 0.95;
      this.velocity.z *= 0.95;
    } else {
      this.offTrackTimer = 0;
    }
    
    // Update total distance for lap tracking
    this.totalDistance += speed * dt;
    
    // Check checkpoint progression
    this.updateCheckpoints(track);
  }

  applyDrivingAssist(track) {
    // AI steering assistance
    const closest = track.getClosestCheckpoint(this.position);
    const toCheckpoint = {
      x: closest.x - this.position.x,
      z: closest.z - this.position.z
    };
    const distance = Math.hypot(toCheckpoint.x, toCheckpoint.z);
    
    if (distance > 0.1) {
      const targetAngle = Math.atan2(toCheckpoint.z, toCheckpoint.x);
      let angleDiff = targetAngle - this.rotation;
      
      // Normalize angle difference to [-PI, PI]
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      
      // Smooth steering toward target
      this.steering = Math.max(-1, Math.min(1, angleDiff * 0.5));
    }
    
    // Auto-throttle for AI
    if (this.offTrackTimer < 0.5) {
      this.throttle = 0.8;
    } else {
      this.throttle = 0.5; // Slow down if off-track
    }
  }

  updateCheckpoints(track) {
    const closest = track.getClosestCheckpoint(this.position);
    const distToCheckpoint = Math.hypot(
      this.position.x - closest.x,
      this.position.z - closest.z
    );
    
    if (distToCheckpoint < closest.radius && !this.passedCheckpoints.has(closest.id)) {
      this.passedCheckpoints.add(closest.id);
      
      // Check if completed a lap
      if (closest.id === 0 && this.passedCheckpoints.size > 1) {
        this.lapCount++;
        this.passedCheckpoints.clear();
        this.passedCheckpoints.add(0); // Already at checkpoint 0
      }
    }
  }

  getSpeed() {
    return Math.hypot(this.velocity.x, this.velocity.z) * 3.6; // Convert to km/h
  }

  reset(track) {
    const startCheckpoint = track.checkpoints[0];
    this.position = { x: startCheckpoint.x + 5, y: 0, z: startCheckpoint.z };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.rotation = 0;
    this.angularVelocity = 0;
    this.throttle = 0;
    this.brake = 0;
    this.steering = 0;
    this.lapCount = 0;
    this.passedCheckpoints.clear();
    this.hasFinished = false;
    this.finishTime = Infinity;
    this.offTrackTimer = 0;
  }
}

class Race {
  constructor(track, players = 1, lapsToWin = 3, difficulty = 'normal') {
    this.track = track;
    this.lapsToWin = lapsToWin;
    this.difficulty = difficulty;
    this.startTime = 0;
    this.isStarted = false;
    this.isFinished = false;
    this.countdownTimer = 3;
    
    // Initialize karts
    this.karts = [];
    for (let i = 0; i < players; i++) {
      this.karts.push(new Kart(i, i === 0, 0));
    }
    
    // Add AI opponents
    const aiCount = Math.max(2, 4 - players);
    for (let i = 0; i < aiCount; i++) {
      const aiKart = new Kart(players + i, false, i % track.checkpoints.length);
      this.karts.push(aiKart);
    }
    
    // Initialize kart positions
    this.initializeKartPositions();
    
    this.standings = []; // Will be updated each frame
    this.updateStandings();
  }

  initializeKartPositions() {
    for (let i = 0; i < this.karts.length; i++) {
      const checkpoint = this.track.checkpoints[i % this.track.checkpoints.length];
      const angle = (i / this.karts.length) * Math.PI * 2;
      this.karts[i].position = {
        x: checkpoint.x + Math.cos(angle) * (3 + i),
        y: 0,
        z: checkpoint.z + Math.sin(angle) * (3 + i)
      };
      this.karts[i].reset(this.track);
    }
  }

  start() {
    this.isStarted = true;
    this.startTime = Date.now();
  }

  update(dt, drivingAssist = true) {
    if (!this.isStarted) return;
    
    // Update all karts
    for (let kart of this.karts) {
      if (!kart.hasFinished) {
        kart.update(dt, this.track, drivingAssist || !kart.isPlayer);
        
        // Check if finished
        if (kart.lapCount >= this.lapsToWin) {
          kart.hasFinished = true;
          kart.finishTime = Date.now() - this.startTime;
        }
      }
    }
    
    this.updateStandings();
    
    // Check if race is finished (first player finishes)
    if (this.karts[0].hasFinished && !this.isFinished) {
      this.isFinished = true;
    }
  }

  updateStandings() {
    // Sort karts by lap count and distance traveled
    this.standings = [...this.karts].sort((a, b) => {
      if (a.lapCount !== b.lapCount) {
        return b.lapCount - a.lapCount; // More laps = higher position
      }
      return b.totalDistance - a.totalDistance; // Same laps = more distance ahead
    });
  }

  getPlayerPosition() {
    return this.standings.findIndex(k => k.isPlayer) + 1;
  }

  getElapsedTime() {
    if (!this.isStarted) return 0;
    return (Date.now() - this.startTime) / 1000;
  }

  reset() {
    this.isStarted = false;
    this.isFinished = false;
    this.countdownTimer = 3;
    for (let kart of this.karts) {
      kart.reset(this.track);
    }
    this.updateStandings();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Track, TerrainMap, Kart, Race };
}
