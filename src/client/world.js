/**
 * RODNEY BEACH RUSH - 3D World & Graphics
 * Uses three.js to render the island, track, karts, and environment
 */

class World {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.karts = {};
    this.track = null;
    
    // Lighting
    this.sun = null;
    this.ambientLight = null;
    
    // Terrain
    this.terrain = null;
    this.trackMesh = null;
    this.vegetation = [];
    
    this.initialize();
  }

  initialize() {
    // Setup lighting
    this.setupLighting();
    
    // Create island terrain
    this.createTerrain();
    
    // Create track
    this.createTrack();
    
    // Add vegetation
    this.createVegetation();
    
    // Setup camera
    this.setupCamera();
  }

  setupLighting() {
    // Ambient light for overall illumination
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(this.ambientLight);
    
    // Directional light (sun)
    this.sun = new THREE.DirectionalLight(0xffffff, 0.8);
    this.sun.position.set(50, 50, 50);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.width = 2048;
    this.sun.shadow.mapSize.height = 2048;
    this.sun.shadow.camera.far = 200;
    this.sun.shadow.camera.left = -100;
    this.sun.shadow.camera.right = 100;
    this.sun.shadow.camera.top = 100;
    this.sun.shadow.camera.bottom = -100;
    this.scene.add(this.sun);
    
    // Hemisphere light for sky
    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x8b7355, 0.4);
    this.scene.add(hemiLight);
  }

  createTerrain() {
    // Create a simple heightmap-based terrain
    const geometry = new THREE.BufferGeometry();
    
    const size = 200;
    const segments = 64;
    const vertices = [];
    const indices = [];
    
    for (let i = 0; i <= segments; i++) {
      for (let j = 0; j <= segments; j++) {
        const x = (i / segments) * size - size / 2;
        const z = (j / segments) * size - size / 2;
        const distFromCenter = Math.hypot(x, z);
        
        // Height based on distance from center (island shape)
        let y = 0;
        if (distFromCenter < 70) {
          y = Math.max(0, 15 - distFromCenter * 0.15);
          y += Math.sin(x * 0.1) * Math.cos(z * 0.1) * 2; // Subtle variation
        }
        
        vertices.push(x, y, z);
      }
    }
    
    // Create indices for faces
    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < segments; j++) {
        const a = i * (segments + 1) + j;
        const b = a + segments + 1;
        
        indices.push(a, b, a + 1);
        indices.push(a + 1, b, b + 1);
      }
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
    geometry.computeVertexNormals();
    
    // Create materials for different terrain types
    const materials = [
      new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.8 }), // Sand
      new THREE.MeshStandardMaterial({ color: 0x228b22, roughness: 0.8 }),  // Grass
      new THREE.MeshStandardMaterial({ color: 0x1e90ff, roughness: 0.3 })   // Water
    ];
    
    this.terrain = new THREE.Mesh(geometry, materials[0]);
    this.terrain.castShadow = true;
    this.terrain.receiveShadow = true;
    this.scene.add(this.terrain);
    
    // Add water plane
    const waterGeometry = new THREE.PlaneGeometry(300, 300);
    const waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e90ff,
      metalness: 0.3,
      roughness: 0.4,
      transparent: true,
      opacity: 0.7
    });
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -0.5;
    water.receiveShadow = true;
    this.scene.add(water);
  }

  createTrack() {
    // Create procedural track geometry
    const trackGeometry = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];
    const colors = [];
    
    const segments = 200;
    const trackWidth = 10;
    const radius = 40;
    
    // Generate track as a ribbon
    for (let i = 0; i < segments; i++) {
      const t = i / segments;
      const angle = t * Math.PI * 2;
      
      // Main track centerline (circular with wave)
      const r = radius + Math.sin(angle * 3) * 5;
      const cx = Math.cos(angle) * r;
      const cz = Math.sin(angle) * r;
      
      // Track normal (perpendicular to centerline)
      const nextAngle = ((i + 1) / segments) * Math.PI * 2;
      const nextR = radius + Math.sin(nextAngle * 3) * 5;
      const nextCx = Math.cos(nextAngle) * nextR;
      const nextCz = Math.sin(nextAngle) * nextR;
      
      const tangent = {
        x: nextCx - cx,
        z: nextCz - cz
      };
      const tangentLen = Math.hypot(tangent.x, tangent.z);
      const normal = {
        x: -tangent.z / tangentLen,
        z: tangent.x / tangentLen
      };
      
      // Create track width
      const left = {
        x: cx - normal.x * (trackWidth / 2),
        z: cz - normal.z * (trackWidth / 2),
        y: 0.1
      };
      const right = {
        x: cx + normal.x * (trackWidth / 2),
        z: cz + normal.z * (trackWidth / 2),
        y: 0.1
      };
      
      vertices.push(left.x, left.y, left.z);
      vertices.push(right.x, right.y, right.z);
      
      // Coloring: alternating stripes
      const stripe = Math.floor(t * 12) % 2;
      const color = stripe === 0 ? 0xffffff : 0xffff00;
      colors.push(color, color);
      
      // Add indices
      if (i < segments - 1) {
        const base = i * 2;
        indices.push(base, base + 2, base + 1);
        indices.push(base + 1, base + 2, base + 3);
      }
    }
    
    trackGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    trackGeometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
    trackGeometry.computeVertexNormals();
    
    const trackMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0,
      roughness: 0.7,
      side: THREE.DoubleSide
    });
    
    this.trackMesh = new THREE.Mesh(trackGeometry, trackMaterial);
    this.trackMesh.castShadow = true;
    this.trackMesh.receiveShadow = true;
    this.scene.add(this.trackMesh);
    
    // Add start/finish line markers
    this.addStartFinishLine();
  }

  addStartFinishLine() {
    // Checkered flag start/finish line
    const lineGeometry = new THREE.PlaneGeometry(12, 2);
    const lineMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      metalness: 0.3,
      roughness: 0.4
    });
    
    const line = new THREE.Mesh(lineGeometry, lineMaterial);
    line.position.set(0, 0.2, -42);
    line.rotation.x = -Math.PI / 2;
    line.receiveShadow = true;
    this.scene.add(line);
    
    // Add checkered flag geometry
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 2; j++) {
        if ((i + j) % 2 === 0) {
          const tileGeometry = new THREE.PlaneGeometry(2, 1);
          const tileMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
          const tile = new THREE.Mesh(tileGeometry, tileMaterial);
          tile.position.set(-6 + i * 2, 0.25, -42 + j);
          tile.rotation.x = -Math.PI / 2;
          tile.receiveShadow = true;
          this.scene.add(tile);
        }
      }
    }
  }

  createVegetation() {
    // Add palm trees around the track
    const palmPositions = [
      { x: -50, z: 50 },
      { x: 50, z: 50 },
      { x: 50, z: -50 },
      { x: -50, z: -50 },
      { x: 60, z: 0 },
      { x: -60, z: 0 },
      { x: 0, z: 60 },
      { x: 0, z: -60 }
    ];
    
    for (let pos of palmPositions) {
      this.createPalmTree(pos.x, pos.z);
    }
    
    // Add grass patches (visual only)
    const grassGeometry = new THREE.PlaneGeometry(8, 8);
    const grassMaterial = new THREE.MeshStandardMaterial({
      color: 0x228b22,
      roughness: 0.9
    });
    
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const dist = 35 + Math.random() * 10;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      
      const grass = new THREE.Mesh(grassGeometry, grassMaterial);
      grass.position.set(x, 0.05, z);
      grass.rotation.x = -Math.PI / 2;
      grass.receiveShadow = true;
      this.scene.add(grass);
      this.vegetation.push(grass);
    }
  }

  createPalmTree(x, z) {
    // Trunk
    const trunkGeometry = new THREE.CylinderGeometry(1, 1.2, 8, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, 4, z);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    this.scene.add(trunk);
    this.vegetation.push(trunk);
    
    // Leaves (cone shape)
    const leavesGeometry = new THREE.ConeGeometry(6, 8, 8);
    const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.set(x, 10, z);
    leaves.castShadow = true;
    leaves.receiveShadow = true;
    this.scene.add(leaves);
    this.vegetation.push(leaves);
  }

  createKart(id, position, color = 0xff6b35) {
    // Simple procedural kart geometry
    const kartGroup = new THREE.Group();
    
    // Main body
    const bodyGeometry = new THREE.BoxGeometry(1.5, 0.8, 3);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: color });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    kartGroup.add(body);
    
    // Cockpit (sphere)
    const cockpitGeometry = new THREE.SphereGeometry(0.5, 8, 8);
    const cockpitMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.y = 0.6;
    cockpit.castShadow = true;
    cockpit.receiveShadow = true;
    kartGroup.add(cockpit);
    
    // Wheels (4 cylinders)
    const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.5, 8);
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    
    const wheelPositions = [
      { x: -0.8, y: -0.3, z: 0.8 },
      { x: 0.8, y: -0.3, z: 0.8 },
      { x: -0.8, y: -0.3, z: -0.8 },
      { x: 0.8, y: -0.3, z: -0.8 }
    ];
    
    for (let pos of wheelPositions) {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos.x, pos.y, pos.z);
      wheel.castShadow = true;
      wheel.receiveShadow = true;
      kartGroup.add(wheel);
    }
    
    // Set position and add to scene
    kartGroup.position.set(position.x, position.y + 1, position.z);
    this.scene.add(kartGroup);
    
    this.karts[id] = {
      group: kartGroup,
      body: body,
      position: position
    };
  }

  updateKart(id, position, rotation) {
    if (this.karts[id]) {
      const kart = this.karts[id];
      kart.group.position.set(position.x, position.y + 1, position.z);
      kart.group.rotation.y = rotation;
    }
  }

  setupCamera() {
    this.camera.position.set(0, 25, -50);
    this.camera.lookAt(0, 5, 0);
  }

  updateCameraFollow(playerPosition, playerRotation) {
    // Follow camera behind the player's kart
    const distance = 15;
    const height = 8;
    
    const targetX = playerPosition.x - Math.cos(playerRotation) * distance;
    const targetZ = playerPosition.z - Math.sin(playerRotation) * distance;
    const targetY = playerPosition.y + height;
    
    // Smooth camera movement
    this.camera.position.x += (targetX - this.camera.position.x) * 0.1;
    this.camera.position.y += (targetY - this.camera.position.y) * 0.1;
    this.camera.position.z += (targetZ - this.camera.position.z) * 0.1;
    
    this.camera.lookAt(
      playerPosition.x,
      playerPosition.y + 2,
      playerPosition.z
    );
  }

  dispose() {
    this.scene.clear();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { World };
}
