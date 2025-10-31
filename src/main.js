// -------------------- IMPORTS --------------------
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ObjectLoader, Raycaster, Vector2 } from "three";

// -------------------- SCENE / CAMERA / RENDERER --------------------
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 0, 6);

// -------------------- RENDERER --------------------
const existingCanvas = document.getElementById('threeCanvas');
const renderer = new THREE.WebGLRenderer({ canvas: existingCanvas || undefined, antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio || 1);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
if (!existingCanvas) {
  document.body.appendChild(renderer.domElement);
} else {
  console.debug('Using existing canvas#threeCanvas for renderer');
}

// -------------------- OBJECTS --------------------
// ตัวอย่าง: background sphere
const sphereGeo = new THREE.SphereGeometry(150, 64, 64);
const sphereMat = new THREE.MeshBasicMaterial({
  color: 0x00ff00,
  wireframe: true,
  side: THREE.BackSide
});
const sphere = new THREE.Mesh(sphereGeo, sphereMat);
scene.add(sphere);

// -------------------- LIGHTS --------------------
scene.add(new THREE.AmbientLight(0x404040));
const light = new THREE.PointLight(0xffffff, 1.2);
light.position.set(5, 5, 5);
scene.add(light);

// -------------------- CONTROLS --------------------
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// -------------------- STATE VARIABLES --------------------
const loader = new ObjectLoader();
const cards = [];                    // sprites (THREE.Sprite) loaded from cards.json
const pointer = new Vector2();       // for raycasting
const raycaster = new Raycaster();   // for raycasting
let hoveredCard = null;              // current hovered sprite



// -------------------- FETCH CARDS (3D JSON) --------------------
// Try a few likely locations for `cards.json` and give helpful console output so it's
// easy to diagnose why a JSON didn't load (wrong path, server not serving `public/`, etc.).
async function loadCards() {
  const tryPaths = [
    '/project.json',          // Vite serves public files at root
    './file/project.json', // alternative location
    './public/project.json'   // last resort
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
          // store original scale so hover can be non-destructive
          child.userData = child.userData || {};
          child.userData.origScale = child.scale && child.scale.x ? child.scale.x : 1;
          cards.push(child);
        }
      });

      console.info(`Loaded cards object from ${p}. Found ${cards.length} sprite(s).`);
      if (cards.length === 0) console.warn('No sprites found in parsed cards.json object.');
      return;
    } catch (err) {
      lastErr = err;
      console.warn(`Error loading ${p}:`, err);
      // try next path
    }
  }

  console.error('Failed to load cards.json from any tried path.', lastErr);
}

loadCards();

// -------------------- ANIMATE LOOP --------------------
function animate() {
  requestAnimationFrame(animate);

  // If you later add editor-driven animation, make sure it doesn't overwrite authored positions here.
  controls.update();
  
  // Render scene
  renderer.render(scene, camera);
}
animate();

// -------------------- RESIZE --------------------
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}, { passive: true });

// -------------------- INTERACTION / HOVER --------------------
function onMouseMove(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(cards, true);

  if (intersects.length > 0) {
    const sprite = intersects[0].object;
       if (hoveredCard !== sprite) {
      // restore previous
      if (hoveredCard) {
        const prevOrig = hoveredCard.userData && hoveredCard.userData.origScale ? hoveredCard.userData.origScale : 1;
        hoveredCard.scale.setScalar(prevOrig);
      }
      hoveredCard = sprite;
      // non-destructive visual feedback (scale-only)
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
window.addEventListener("mousemove", onMouseMove, { passive: true });



// -------------------- OPTIONAL: Click / Pointer handlers (example) --------------------
function onClick(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  
  // ตรวจสอบ cards เท่านั้น (ไม่มี iframe cube แล้ว)
  const intersects = raycaster.intersectObjects(cards, true); // recursive

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
window.addEventListener("click", onClick);