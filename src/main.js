import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// --- Scene / Camera / Renderer ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 0, 6);

// --- Renderer ---
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // ✅ โปร่งใส
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0); // ✅ ไม่มีพื้นหลังทึบ
document.body.appendChild(renderer.domElement);

// --- Sphere hologram ---
const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(10.5, 14, 14),
  new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true })
);
scene.add(sphere);

// --- Small Sphere ---
const smallSphere = new THREE.Mesh(
  new THREE.SphereGeometry(0.2, 12, 32),
  new THREE.MeshBasicMaterial({ color: 0xff00ff, wireframe: true })
);
scene.add(smallSphere);

// --- Light ---
scene.add(new THREE.AmbientLight(0x404040));
const light = new THREE.PointLight(0xffffff, 1.2);
light.position.set(5, 5, 5);
scene.add(light);

// --- Controls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// --- Overlay Cards Container ---
const cardsContainer = document.createElement('div');
Object.assign(cardsContainer.style, {
  position: 'absolute',
  top: '0',
  left: '0',
  width: '100%',
  height: '100%',
  pointerEvents: 'auto',
});
document.body.appendChild(cardsContainer);

const radius = 3.5;
const cardObjects = [];
let rotationSpeed = 0.0003;
let dragSpeed = 0;

// --- Load cards.json ---
fetch('./cards.json')
  .then((res) => res.json())
  .then((data) => {
    data.forEach((card, i) => {
      const div = document.createElement('div');

      if (card.image) {
        div.innerHTML = `
          <a href="${card.link}" target="_blank" style="text-decoration:none;">
            <img src="${card.image}" style="width:100%;border-radius:4px;">
            <div style="color:#0ff;margin-top:4px;">${card.title}</div>
          </a>
        `;
        Object.assign(div.style, {
          position: 'absolute',
          width: '200px',
          height: '100px',
          borderRadius: '8px',
          border: '1px solid rgba(0, 255, 255, 0.49)',
          fontFamily: 'sans-serif',
          fontSize: '14px',
          textAlign: 'center',
          transform: 'translate(-50%,-50%)',
          pointerEvents: 'auto',
        });
      } else {
        div.style.display = 'none';
      }

      cardsContainer.appendChild(div);

      const angle = (i / data.length) * Math.PI * 2;
      const group = i % 2 === 0 ? 'diag1' : 'diag2';
      cardObjects.push({ el: div, angle, group, pos: new THREE.Vector3() });
    });

    animate(); // ✅ เริ่ม loop หลังโหลดเสร็จ
  });

// --- Update Cards ---
function updateCards() {
  const a = radius;

  cardObjects.forEach((obj) => {
    obj.angle += rotationSpeed + dragSpeed;
    const theta = obj.angle;

    let x, y, z;
    if (obj.group === 'diag1') {
      x = a * Math.sin(theta);
      y = (a / 2) * Math.sin(2 * theta);
      z = a * 0.4 * Math.cos(theta * 1.5);
    } else {
      x = a * Math.sin(theta) * Math.cos(Math.PI / 6);
      y = (a / 2) * Math.sin(2 * theta) * Math.sin(Math.PI / 6);
      z = a * 0.5 * Math.cos(theta + Math.PI / 2);
    }

    obj.pos.set(x, y, z);

    const screenPos = obj.pos.clone().project(camera);
    const left = (screenPos.x * 0.2 + 0.2) * window.innerWidth;
    const top = (-screenPos.y * 0.2 + 0.2) * window.innerHeight;
    obj.el.style.left = `${left}px`;
    obj.el.style.top = `${top}px`;

    const depthScale = 1 + (obj.pos.z / radius) * 0.5;
    obj.el.style.transform = `translate(-50%, -50%) scale(${depthScale})`;
    obj.el.style.opacity = `${0.5 + 0.5 * (obj.pos.z / radius + 1) / 2}`;
  });

  dragSpeed *= 0.95;
}

// --- Loop ---
let angle = 0;
function animate() {
  requestAnimationFrame(animate);

  angle += 0.01;
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

// --- Resize ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}, { passive: true });

// --- Gesture ---
let isDragging = false;
let startX = 0;

cardsContainer.addEventListener('mousedown', (e) => {
  isDragging = true;
  startX = e.clientX;
}, { passive: true });
cardsContainer.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  const deltaX = e.clientX - startX;
  dragSpeed = deltaX * 0.001;
  startX = e.clientX;
}, { passive: true });
cardsContainer.addEventListener('mouseup', () => {
  isDragging = false;
}, { passive: true });
cardsContainer.addEventListener('mouseleave', () => {
  isDragging = false;
}, { passive: true });
cardsContainer.addEventListener('touchstart', (e) => {
  startX = e.touches[0].clientX;
}, { passive: true });
cardsContainer.addEventListener('touchmove', (e) => {
  const deltaX = e.touches[0].clientX - startX;
  dragSpeed = deltaX * 0.001;
  startX = e.touches[0].clientX;
}, { passive: true });
fetch('./public/cards.json')
  .then(res => res.json())
  .then(data => {
    // สร้างการ์ด
    animate();
  })
  .catch(err => {
    console.error("cards.json not found, running sphere only", err);
    animate(); // ✅ รัน sphere ต่อให้ไม่มีการ์ด
  });
  cardsContainer.addEventListener('mousedown', (e) => {
  if (e.button === 1) {
    // 👇 ฟังก์ชันพิเศษตอนกดลูกกลิ้ง
    console.log("Middle click detected!");
    // ตัวอย่าง: reset กล้อง
    camera.position.set(0, 0, 20);
    camera.lookAt(0, 0, 0);
  } else if (e.button === 0) {
    // left click → drag
    isDragging = true;
    startX = e.clientX;
  }
});
