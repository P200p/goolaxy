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
// -------------------- OBJECTS --------------------
const sphereGeo = new THREE.SphereGeometry(150, 64, 64);
const sphereMat = new THREE.MeshBasicMaterial({
  color: 0x00ff00,   // เลือกสีเส้น wireframe
  wireframe: true,   // เปิดโหมด wireframe
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
const cards = [];
const radius = 20.5;
let rotationSpeed = 0.00003;
let dragSpeed = 0;
let angle = 0;

// -------------------- UPDATE CARDS --------------------
function updateCards() {
  // หมุนการ์ดรอบ ๆ วงกลม
  cards.forEach((card, i) => {
    const theta = (i / cards.length) * Math.PI * 2 + angle;
    card.position.set(Math.cos(theta) * radius, 0, Math.sin(theta) * radius);
    card.lookAt(camera.position);
  });
}
// -------------------- FETCH CARDS (3D JSON) --------------------
// -------------------- FETCH CARDS (3D JSON) --------------------
fetch("./cards.json")
  .then(r => r.json())
  .then(data => {
    const obj = loader.parse(data);
    scene.add(obj);

    obj.traverse(child => {
      if (child.isSprite) {
        cards.push(child);
      }
    });
  });

// -------------------- ANIMATE LOOP --------------------
function animate() {
  requestAnimationFrame(animate);

  angle += 0.001;
  camera.position.x = Math.sin(angle) * 1;
  camera.position.z = Math.cos(angle) * 1;
  camera.lookAt(scene.position);

  sphere.rotation.y += 0.001;
  sphere.rotation.x += 0.001;

  controls.update();
  renderer.clear();
  renderer.render(scene, camera);
  updateCards();
}
// -------------------- RESIZE --------------------
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}, { passive: true });
// -------------------- GESTURE --------------------

// -------------------- INTERACTION --------------------
const raycaster = new Raycaster();
const pointer = new Vector2();

function onClick(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(cards, true); // recursive

  if (intersects.length > 0) {
    const sprite = intersects[0].object;
    if (sprite.material && sprite.material.userData && sprite.material.userData.url) {
      window.open(sprite.material.userData.url, "_blank");
    }
  }
}
window.addEventListener("click", onClick);

animate();
