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
// replace ObjectLoader+loadCards block with GLTF loading
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const gltfLoader = new GLTFLoader();
const animateMixers = []; // keep if GLTF has animations

// Load GLB/GLTF, track imported root for safe removal, collect plane meshes as "cards"
async function loadCards() {
  const tryPaths = [
    '/scene.glb',
    '/scene.gltf',
    './scene.glb',
    './scene.gltf'
  ];

  let lastErr = null;

  for (const p of tryPaths) {
    try {
      console.debug(`Attempting to load glTF from: ${p}`);
      const gltf = await gltfLoader.loadAsync(p);

      // remove previously imported roots only (do not remove camera/light you want to keep)
      if (scene.userData.importedRoots && scene.userData.importedRoots.length) {
        scene.userData.importedRoots.forEach(root => { if (root && root.parent) root.parent.remove(root); });
      }
      scene.userData.importedRoots = scene.userData.importedRoots || [];

      // add new root and remember it
      scene.add(gltf.scene);
      scene.userData.importedRoots.push(gltf.scene);

      // import lights (attach nested lights to scene so they actually affect rendering)
      const importedLights = [];
      gltf.scene.traverse((child) => {
        if (child.isLight) {
          if (child.parent !== scene) scene.add(child);
          importedLights.push(child);
        }
      });
      if (importedLights.length) {
        scene.userData.importedLights = (scene.userData.importedLights || []).concat(importedLights);
        console.info(`Imported ${importedLights.length} light(s) from glTF.`);
      }

      // handle animations
      if (gltf.animations && gltf.animations.length) {
        const mixer = new THREE.AnimationMixer(gltf.scene);
        gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
        animateMixers.push(mixer);
      }

      // rebuild cards array from gltf.scene (expect Plane meshes)
      cards.length = 0; // reuse existing cards declared at file top
      gltf.scene.traverse((child) => {
        if (child.isMesh) {
          // Prefer matching by material.userData.url if exporter writes it
          const mat = child.material;
          const url = mat && mat.userData && mat.userData.url;
          // fallback: accept mesh whose geometry type name contains 'Plane'
          const isPlane = child.geometry && child.geometry.type && /Plane/i.test(child.geometry.type);
          if (url || isPlane) {
            child.userData = child.userData || {};
            child.userData.origScale = child.scale && child.scale.x ? child.scale.x : 1;
            cards.push(child);
          }
        }
      });

      console.info(`Loaded GLTF from ${p}. Found ${cards.length} card mesh(es).`);
      if (cards.length === 0) console.warn('No card planes found in glTF scene. Check exported node names or material.userData.');
      return;
    } catch (err) {
      lastErr = err;
      console.warn(`Failed to load ${p}:`, err);
    }
  }

  console.error('Failed to load any glTF paths.', lastErr);
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