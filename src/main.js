// main.js - updated to load scene.gltf, add GLTFLoader, register Service Worker and send image URLs to SW
// ปรับให้ใช้กับ three.js r180 (ES module) 
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Raycaster, Vector2 } from 'three';

// -------------------- REGISTER SERVICE WORKER (ถ้ามี) --------------------
// src/main.js (ส่วน register SW)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // ใช้ BASE_URL ของ Vite เพื่อรองรับ base path ที่ไม่ใช่ '/'
      const swUrl = `${import.meta.env.BASE_URL}service-worker.js`;
      const reg = await navigator.serviceWorker.register(swUrl, { scope: import.meta.env.BASE_URL || '/' });
      console.log('ServiceWorker registered:', reg);
    } catch (err) {
      console.warn('ServiceWorker registration failed:', err);
    }
  });
}

// -------------------- SCENE / CAMERA / RENDERER --------------------
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 6);

const existingCanvas = document.getElementById('threeCanvas');
const renderer = new THREE.WebGLRenderer({ canvas: existingCanvas || undefined, antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio || 1);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
renderer.outputEncoding = THREE.sRGBEncoding;
if (!existingCanvas) document.body.appendChild(renderer.domElement);
else console.debug('Using existing canvas#threeCanvas for renderer');

// -------------------- BACKGROUND (ตัวอย่าง) --------------------
const sphereGeo = new THREE.SphereGeometry(150, 64, 64);
const sphereMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true, side: THREE.BackSide });
const sphere = new THREE.Mesh(sphereGeo, sphereMat);
scene.add(sphere);

// -------------------- LIGHTS --------------------
scene.add(new THREE.AmbientLight(0xffffff, 0.35));
const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.4);
hemi.position.set(0, 20, 0);
scene.add(hemi);
const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(5, 10, 7);
scene.add(dir);
const fill = new THREE.PointLight(0xffffff, 0.25);
fill.position.set(-5, -3, 5);
scene.add(fill);

// -------------------- CONTROLS --------------------
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// -------------------- STATE --------------------
const gltfLoader = new GLTFLoader();
const cards = [];                    // interactive meshes (planes) จาก glTF
const pointer = new Vector2();       // for raycasting
const raycaster = new Raycaster();   // for raycasting
let hoveredCard = null;              // current hovered mesh

// -------------------- HELPER: collect image URLs from a scene --------------------
function collectImageUrlsFromGLTF(gltfScene) {
  const urls = [];
  gltfScene.traverse(child => {
    if (child.isMesh) {
      const mat = child.material;
      if (mat) {
        // texture map
        if (mat.map && mat.map.image && mat.map.image.src) urls.push(mat.map.image.src);
        if (mat.emissiveMap && mat.emissiveMap.image && mat.emissiveMap.image.src) urls.push(mat.emissiveMap.image.src);
        // material.userData.url support
        if (mat.userData && mat.userData.url) urls.push(mat.userData.url);
      }
      // mesh.userData.url
      if (child.userData && child.userData.url) urls.push(child.userData.url);
    }
    if (child.isSprite && child.material && child.material.map && child.material.map.image && child.material.map.image.src) {
      urls.push(child.material.map.image.src);
    }
  });
  return Array.from(new Set(urls.filter(Boolean)));
}

// -------------------- LOAD GLTF SCENE --------------------
async function loadGLTFScene() {
  const tryPaths = ['/scene.gltf', '/scene.glb', './scene.gltf', './models/scene.gltf'];
  let lastErr = null;
  for (const p of tryPaths) {
    try {
      console.debug(`Attempting to load GLTF from: ${p}`);
      const gltf = await new Promise((resolve, reject) => {
        gltfLoader.load(p, resolve, undefined, reject);
      });

      scene.add(gltf.scene);

      // find interactive meshes
      gltf.scene.traverse(child => {
        if (child.isMesh) {
          const name = (child.name || '').toLowerCase();
          const hasUrlInUserData = child.userData && child.userData.url;
          const hasUrlInMaterial = child.material && child.material.userData && child.material.userData.url;
          const likelyCardByName = name.includes('card') || name.includes('plane') || name.includes('link');
          if (hasUrlInUserData || hasUrlInMaterial || likelyCardByName) {
            child.userData = child.userData || {};
            child.userData.origScale = child.scale.clone();
            if (child.material && child.material.side === undefined) child.material.side = THREE.DoubleSide;
            cards.push(child);
          }
        }
      });

      console.info(`Loaded GLTF from ${p}. Found ${cards.length} interactive mesh(es).`);

      // collect image URLs and send to service worker for precache
      const foundUrls = collectImageUrlsFromGLTF(gltf.scene);
      if (foundUrls.length > 0 && 'serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(reg => {
          if (reg.active) {
            reg.active.postMessage({ type: 'CACHE_URLS', urls: foundUrls });
            console.log('Sent URLs to SW for precache:', foundUrls.length);
          }
        });
      }

      return;
    } catch (err) {
      lastErr = err;
      console.warn(`Error loading ${p}:`, err);
    }
  }
  console.error('Failed to load scene.gltf from any tried path.', lastErr);
}

// start loading
loadGLTFScene();

// -------------------- ANIMATE --------------------
function animate() {
  requestAnimationFrame(animate);
  controls.update();
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
  const intersects = raycaster.intersectObjects(cards, false);

  if (intersects.length > 0) {
    const mesh = intersects[0].object;
    if (hoveredCard !== mesh) {
      if (hoveredCard) hoveredCard.scale.copy(hoveredCard.userData.origScale);
      hoveredCard = mesh;
      const orig = hoveredCard.userData && hoveredCard.userData.origScale ? hoveredCard.userData.origScale.clone() : new THREE.Vector3(1,1,1);
      const HOVER_FACTOR = 1.5;
      hoveredCard.scale.copy(orig.multiplyScalar(HOVER_FACTOR));
    }
  } else {
    if (hoveredCard) {
      hoveredCard.scale.copy(hoveredCard.userData.origScale);
      hoveredCard = null;
    }
  }
}
window.addEventListener('mousemove', onMouseMove, { passive: true });

// -------------------- CLICK --------------------
function onClick(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(cards, false);

  if (intersects.length > 0) {
    const mesh = intersects[0].object;
    const url = (mesh.userData && mesh.userData.url) || (mesh.material && mesh.material.userData && mesh.material.userData.url);
    if (url) {
      const message = `พบลิงค์: ${url}\n\nต้องการเปิดลิงค์นี้ไหม?`;
      if (window.confirm(message)) window.open(url, "_blank", "noopener,noreferrer");
    } else {
      console.info('Clicked interactive mesh but no URL found in userData or material.userData.', mesh);
    }
  }
}
window.addEventListener('click', onClick);
