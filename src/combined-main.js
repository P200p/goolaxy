// -------------------- IMPORTS --------------------
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { ObjectLoader, Raycaster, Vector2 } from "three";

// -------------------- SCENE SETUP --------------------
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  5000
);
camera.position.set(0, 0, 6);

// -------------------- DUAL RENDERER SETUP --------------------
// WebGL Renderer (for cards and background)
const existingCanvas = document.getElementById('threeCanvas');
const webglRenderer = new THREE.WebGLRenderer({ 
  canvas: existingCanvas || undefined, 
  antialias: true, 
  alpha: true 
});
webglRenderer.setPixelRatio(window.devicePixelRatio || 1);
webglRenderer.setSize(window.innerWidth, window.innerHeight);
webglRenderer.setClearColor(0x000000, 0);

if (!existingCanvas) {
  document.body.appendChild(webglRenderer.domElement);
}

// CSS3D Renderer (for YouTube cube)
const css3dRenderer = new CSS3DRenderer();
css3dRenderer.setSize(window.innerWidth, window.innerHeight);
css3dRenderer.domElement.style.position = 'absolute';
css3dRenderer.domElement.style.top = '0';
css3dRenderer.domElement.style.left = '0';
css3dRenderer.domElement.style.pointerEvents = 'none';
css3dRenderer.domElement.style.zIndex = '2';
document.body.appendChild(css3dRenderer.domElement);

// -------------------- CONTROLS --------------------
const controls = new OrbitControls(camera, webglRenderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = true;
controls.enableZoom = true;
controls.enableRotate = true;

// -------------------- BACKGROUND SCENE --------------------
// Background sphere
const sphereGeo = new THREE.SphereGeometry(150, 64, 64);
const sphereMat = new THREE.MeshBasicMaterial({
  color: 0x00ff00,
  wireframe: true,
  side: THREE.BackSide
});
const sphere = new THREE.Mesh(sphereGeo, sphereMat);
scene.add(sphere);

// Lights
scene.add(new THREE.AmbientLight(0x404040));
const light = new THREE.PointLight(0xffffff, 1.2);
light.position.set(5, 5, 5);
scene.add(light);

// -------------------- CARDS SYSTEM --------------------
const loader = new ObjectLoader();
const cards = [];
const pointer = new Vector2();
const raycaster = new Raycaster();
let hoveredCard = null;
let cardsVisible = true;

// Load cards
async function loadCards() {
  const tryPaths = [
    '/cards.json',
    './cards.json',
    './file/cards_updated.json',
    './public/cards.json'
  ];

  let lastErr = null;
  for (const p of tryPaths) {
    try {
      console.debug(`Attempting to fetch cards JSON from: ${p}`);
      const res = await fetch(p);
      if (!res.ok) {
        lastErr = new Error(`HTTP ${res.status} when fetching ${p}`);
        console.warn(lastErr.message);
        continue;
      }
      const data = await res.json();
      const obj = loader.parse(data);
      scene.add(obj);

      obj.traverse(child => {
        if (child.isSprite) {
          child.userData = child.userData || {};
          child.userData.origScale = child.scale && child.scale.x ? child.scale.x : 1;
          cards.push(child);
        }
      });

      console.info(`Loaded cards object from ${p}. Found ${cards.length} sprite(s).`);
      return;
    } catch (err) {
      lastErr = err;
      console.warn(`Error loading ${p}:`, err);
    }
  }

  console.error('Failed to load cards.json from any tried path.', lastErr);
}

// -------------------- YOUTUBE CUBE --------------------
let youtubeCube;
let cubeVisible = true;

function createYouTubeCube() {
  youtubeCube = new THREE.Object3D();
  
  const videos = [
    'dQw4w9WgXcQ', // Never Gonna Give You Up
    'L_jWHffIx5E', // Smash Mouth - All Star
    '9bZkp7q19f0', // PSY - GANGNAM STYLE
    'kJQP7kiw5Fk'  // Despacito
  ];

  const size = 240;
  const positions = [
    [size, 0, 0],     // Right
    [-size, 0, 0],    // Left
    [0, size, 0],     // Top
    [0, -size, 0]     // Bottom
  ];

  const rotations = [
    [0, Math.PI/2, 0],    // Right
    [0, -Math.PI/2, 0],   // Left
    [-Math.PI/2, 0, 0],   // Top
    [Math.PI/2, 0, 0]     // Bottom
  ];

  videos.forEach((videoId, index) => {
    if (index < 4) {
      const element = createYouTubeElement(videoId);
      const object = new CSS3DObject(element);
      
      object.position.set(...positions[index]);
      object.rotation.set(...rotations[index]);
      
      youtubeCube.add(object);
    }
  });

  // Position cube away from cards
  youtubeCube.position.set(3, 2, 0);
  scene.add(youtubeCube);
  
  console.log('📺 YouTube cube created with', youtubeCube.children.length, 'videos');
}

function createYouTubeElement(videoId) {
  const div = document.createElement('div');
  div.style.width = '480px';
  div.style.height = '360px';
  div.style.backgroundColor = '#000';
  div.style.border = '2px solid #ff0000';
  div.style.borderRadius = '8px';

  const iframe = document.createElement('iframe');
  iframe.style.width = '480px';
  iframe.style.height = '360px';
  iframe.style.border = '0px';
  iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1`;
  iframe.title = `YouTube Video ${videoId}`;
  iframe.setAttribute('allowfullscreen', '');

  div.appendChild(iframe);
  return div;
}

// -------------------- INTERACTION --------------------
function onMouseMove(event) {
  if (!cardsVisible) return;
  
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(cards, true);

  if (intersects.length > 0) {
    const sprite = intersects[0].object;
    if (hoveredCard !== sprite) {
      // Restore previous
      if (hoveredCard) {
        const prevOrig = hoveredCard.userData && hoveredCard.userData.origScale ? hoveredCard.userData.origScale : 1;
        hoveredCard.scale.setScalar(prevOrig);
      }
      hoveredCard = sprite;
      // Scale up hovered card
      const orig = hoveredCard.userData && hoveredCard.userData.origScale ? hoveredCard.userData.origScale : (hoveredCard.scale.x || 1);
      const HOVER_FACTOR = 1.5;
      hoveredCard.scale.setScalar(orig * HOVER_FACTOR);
    }
  } else {
    if (hoveredCard) {
      const prevOrig = hoveredCard.userData && hoveredCard.userData.origScale ? hoveredCard.userData.origScale : 1;
      hoveredCard.scale.setScalar(prevOrig);
      hoveredCard = null;
    }
  }
}

function onClick(event) {
  if (!cardsVisible) return;
  
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(cards, true);

  if (intersects.length > 0) {
    const sprite = intersects[0].object;
    if (sprite.material && sprite.material.userData && sprite.material.userData.url) {
      const url = sprite.material.userData.url;
      const message = `พบลิงค์: ${url}\n\nต้องการเปิดลิงค์นี้ไหม?`;
      if (window.confirm(message)) {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    }
  }
}

// -------------------- GLOBAL FUNCTIONS --------------------
window.toggleCube = function() {
  cubeVisible = !cubeVisible;
  if (youtubeCube) {
    youtubeCube.visible = cubeVisible;
  }
  console.log('📺 Cube visibility:', cubeVisible);
};

window.rotateCube = function() {
  if (youtubeCube) {
    youtubeCube.rotation.y += Math.PI / 2;
  }
};

window.resetView = function() {
  camera.position.set(0, 0, 6);
  controls.reset();
};

window.toggleCards = function() {
  cardsVisible = !cardsVisible;
  cards.forEach(card => {
    card.visible = cardsVisible;
  });
  console.log('🎴 Cards visibility:', cardsVisible);
};

// -------------------- ANIMATION LOOP --------------------
function animate() {
  requestAnimationFrame(animate);

  // Update controls
  controls.update();
  
  // Auto-rotate cube slowly
  if (youtubeCube && cubeVisible) {
    youtubeCube.rotation.y += 0.002;
  }

  // Render both scenes
  webglRenderer.render(scene, camera);
  css3dRenderer.render(scene, camera);
}

// -------------------- RESIZE --------------------
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  webglRenderer.setSize(window.innerWidth, window.innerHeight);
  css3dRenderer.setSize(window.innerWidth, window.innerHeight);
}, { passive: true });

// -------------------- EVENT LISTENERS --------------------
window.addEventListener("mousemove", onMouseMove, { passive: true });
window.addEventListener("click", onClick);

// -------------------- INITIALIZE --------------------
loadCards();
createYouTubeCube();
animate();

console.log('🌐 Combined Goolaxy Portal initialized!');
console.log('🎴 Cards loaded, 📺 YouTube cube created');
console.log('🎮 Use controls to toggle visibility and interact');