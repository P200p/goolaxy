// -------------------- IMPORTS --------------------
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Raycaster, Vector2 } from 'three';

// -------------------- SCENE / CAMERA / RENDERER --------------------
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 6);

const existingCanvas = document.getElementById('threeCanvas');
const renderer = new THREE.WebGLRenderer({ canvas: existingCanvas || undefined, antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio || 1);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
renderer.outputEncoding = THREE.sRGBEncoding; // ดีสำหรับสีจาก glTF
if (!existingCanvas) document.body.appendChild(renderer.domElement);
else console.debug('Using existing canvas#threeCanvas for renderer');

// -------------------- BACKGROUND (ตัวอย่าง) --------------------
const sphereGeo = new THREE.SphereGeometry(150, 64, 64);
const sphereMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true, side: THREE.BackSide });
const sphere = new THREE.Mesh(sphereGeo, sphereMat);
scene.add(sphere);

// -------------------- LIGHTS (เพิ่มให้ฉากที่มาจาก glTF มักไม่มีไฟ) --------------------
scene.add(new THREE.AmbientLight(0xffffff, 0.35)); // เบื้องต้นให้สว่างขึ้น
const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.4);
hemi.position.set(0, 20, 0);
scene.add(hemi);

const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(5, 10, 7);
dir.castShadow = false;
scene.add(dir);

const fill = new THREE.PointLight(0xffffff, 0.25);
fill.position.set(-5, -3, 5);
scene.add(fill);

// -------------------- CONTROLS --------------------
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// -------------------- STATE VARIABLES --------------------
const loader = new GLTFLoader();
const cards = [];                    // interactive meshes (planes) จาก glTF
const pointer = new Vector2();       // for raycasting
const raycaster = new Raycaster();   // for raycasting
let hoveredCard = null;              // current hovered mesh

// -------------------- LOAD glTF SCENE --------------------
async function loadGLTFScene() {
  const tryPaths = [
    '/scene.gltf',
    '/scene.glb',
    './scene.gltf',
    './models/scene.gltf'
  ];

  let lastErr = null;
  for (const p of tryPaths) {
    try {
      console.debug(`Attempting to load GLTF from: ${p}`);
      const gltf = await new Promise((resolve, reject) => {
        loader.load(p, resolve, undefined, reject);
      });

      // add loaded content to our three.js scene
      scene.add(gltf.scene);

      // traverse to find interactive planes/meshes (heuristic)
      gltf.scene.traverse(child => {
        if (child.isMesh) {
          // heuristics to decide whether this mesh should act like a "card"
          const name = (child.name || '').toLowerCase();
          const hasUrlInUserData = child.userData && child.userData.url;
          const hasUrlInMaterial = child.material && child.material.userData && child.material.userData.url;
          const likelyCardByName = name.includes('card') || name.includes('plane') || name.includes('link');

          if (hasUrlInUserData || hasUrlInMaterial || likelyCardByName) {
            // store original scale (Vector3 copy) so we can restore exactly later
            child.userData = child.userData || {};
            child.userData.origScale = child.scale.clone();
            // optionally ensure the plane is double sided if texture looks one-sided
            if (child.material && child.material.side === undefined) child.material.side = THREE.DoubleSide;
            cards.push(child);
          }
        }
      });

      console.info(`Loaded GLTF from ${p}. Found ${cards.length} interactive mesh(es).`);
      return;
    } catch (err) {
      lastErr = err;
      console.warn(`Error loading ${p}:`, err);
      // try next path
    }
  }

  console.error('Failed to load scene.gltf from any tried path.', lastErr);
}
loadGLTFScene();

// -------------------- ANIMATE LOOP --------------------
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
  // intersect the meshes we collected (no need to traverse scene each time)
  const intersects = raycaster.intersectObjects(cards, false);

  if (intersects.length > 0) {
    const mesh = intersects[0].object;
    if (hoveredCard !== mesh) {
      // restore previous
      if (hoveredCard) {
        hoveredCard.scale.copy(hoveredCard.userData.origScale);
      }
      hoveredCard = mesh;
      // scale uniformly relative to original vector (preserve non-uniform original scales)
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

// -------------------- CLICK HANDLER --------------------
function onClick(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(cards, false);

  if (intersects.length > 0) {
    const mesh = intersects[0].object;
    // try multiple places for url
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
