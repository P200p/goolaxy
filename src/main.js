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

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
document.body.appendChild(renderer.domElement);

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
const cards = [];                    // sprites loaded from cards.json
const pointer = new Vector2();       // for raycasting
const raycaster = new Raycaster();   // for raycasting
let hoveredCard = null;              // current hovered sprite

// -------------------- FETCH CARDS (3D JSON) --------------------
fetch("./cards.json")
  .then(r => r.json())
  .then(data => {
    const obj = loader.parse(data);
    scene.add(obj);

    obj.traverse(child => {
      if (child.isSprite) cards.push(child);
    });

    // Positions remain as authored in your scene/JSON
  })
  .catch(err => {
    console.error("Failed to load cards.json:", err);
  });

// -------------------- ANIMATE LOOP --------------------
function animate() {
  requestAnimationFrame(animate);

  // If you later add editor-driven animation, make sure it doesn't overwrite authored positions here.
  controls.update();
  renderer.clear();
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
      if (hoveredCard) hoveredCard.scale.setScalar(1.0);
      hoveredCard = sprite;
      // non-destructive visual feedback (scale-only)
      hoveredCard.scale.setScalar(10.15);
    }
  } else {
    if (hoveredCard) {
      hoveredCard.scale.setScalar(5.0);
      hoveredCard = null;
    }
  }
}
window.addEventListener("mousemove", onMouseMove, { passive: true });
// Touch helpers (วางถัดจาก pointer, raycaster และ listeners)
let touchStartPos = null;
let touchMoved = false;
const TOUCH_MOVE_THRESHOLD = 10; // px

function getTouchPos(touchEvent) {
  const t = touchEvent.touches ? touchEvent.touches[0] : touchEvent;
  return {
    clientX: t.clientX,
    clientY: t.clientY
  };
}

function onTouchStart(e) {
  // ถ้าจะเรียก preventDefault ต้องตั้ง passive:false ใน addEventListener
  const p = getTouchPos(e);
  touchStartPos = p;
  touchMoved = false;
  // แปลงเป็น pointer สำหรับ raycaster (แต่ยังไม่ raycast ที่นี่)
  pointer.x = (p.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(p.clientY / window.innerHeight) * 2 + 1;
}

function onTouchMove(e) {
  const p = getTouchPos(e);
  const dx = Math.abs(p.clientX - (touchStartPos?.clientX || 0));
  const dy = Math.abs(p.clientY - (touchStartPos?.clientY || 0));
  if (dx > TOUCH_MOVE_THRESHOLD || dy > TOUCH_MOVE_THRESHOLD) touchMoved = true;
  // อัพเดต pointer ให้ hover ทำงานถ้าต้องการ
  pointer.x = (p.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(p.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(cards, true);
  if (intersects.length > 0) {
    const sprite = intersects[0].object;
    if (hoveredCard !== sprite) {
      if (hoveredCard) hoveredCard.scale.setScalar(1.0);
      hoveredCard = sprite;
      hoveredCard.scale.setScalar(10.15);
    }
  } else {
    if (hoveredCard) {
      hoveredCard.scale.setScalar(5.0);
      hoveredCard = null;
    }
  }
}

function onTouchEnd(e) {
  // ถ้ามีการเลื่อนมาก ให้ไม่ถือเป็น tap
  if (touchMoved) {
    touchStartPos = null;
    touchMoved = false;
    return;
  }
  // ใช้ last known pointer (จาก touchstart/touchend) ทำ raycast เหมือน click
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(cards, true);
  if (intersects.length > 0) {
    const sprite = intersects[0].object;
    if (sprite.material && sprite.material.userData && sprite.material.userData.url) {
      const url = String(sprite.material.userData.url).trim();
      showOverlay(url); // ใช้ overlay เดิมที่คุณสร้างไว้
    }
  }
  touchStartPos = null;
  touchMoved = false;
}

// Add listeners: ต้องใช้ passive:false ถ้าจะเรียก preventDefault ภายใน handler
window.addEventListener("touchstart", onTouchStart, { passive: true });
window.addEventListener("touchmove", onTouchMove, { passive: true });
window.addEventListener("touchend", onTouchEnd, { passive: true });

// -------------------- OPTIONAL: Click / Pointer handlers (example) --------------------
function onClick(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
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
