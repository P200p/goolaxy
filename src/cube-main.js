import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let camera, scene, renderer, controls;
let cube;

const websites = [
  { name: 'GOONEE', url: 'https://goonee.netlify.app/' },
  { name: 'SHARKKADAW', url: 'https://sharkkadaw.netlify.app/' },
  { name: 'GOONEE LAB', url: 'https://goonee.netlify.app/lab' },
  { name: 'GOOMETA', url: 'https://goometa.figma.site/' }
];

init();
animate();

function init() {
  console.log('🚀 Initializing 3D Cube...');
  
  // Camera
  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 5000);
  camera.position.set(500, 350, 750);
  
  console.log('📷 Camera positioned at:', camera.position);

  // Scene
  scene = new THREE.Scene();

  // Create cube
  createCube();

  // Renderer
  renderer = new CSS3DRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 500;
  controls.maxDistance = 2000;
  
  // เปิดการใช้งาน touch
  controls.enablePan = true;
  controls.enableZoom = true;
  controls.enableRotate = true;
  
  // ปรับความไวสำหรับ touch
  controls.rotateSpeed = 1.0;
  controls.zoomSpeed = 1.2;
  controls.panSpeed = 0.8;

  // Events
  window.addEventListener('resize', onWindowResize);
}

function createCube() {
  cube = new THREE.Object3D();

  const sides = [
    { position: [ 250, 0, 0 ], rotation: [ 0, Math.PI / 2, 0 ] }, // right
    { position: [ - 250, 0, 0 ], rotation: [ 0, - Math.PI / 2, 0 ] }, // left
    { position: [ 0, 250, 0 ], rotation: [ Math.PI / 2, 0, 0 ] }, // top
    { position: [ 0, - 250, 0 ], rotation: [ - Math.PI / 2, 0, 0 ] } // bottom
  ];

  for (let i = 0; i < 4; i ++) {
    const element = createIframe(websites[ i ]);
    const object = new CSS3DObject(element);

    object.position.set(...sides[ i ].position);
    object.rotation.set(...sides[ i ].rotation);

    cube.add(object);
  }

  scene.add(cube);
  
  console.log('🎲 Cube created with', cube.children.length, 'faces');
  console.log('📋 Websites:', websites.map(w => w.name));
}

function createIframe(site) {
  const div = document.createElement('div');
  div.style.width = '480px';
  div.style.height = '360px';
  div.style.backgroundColor = '#1a1a2e';
  div.style.border = '2px solid #00ffff';
  div.style.borderRadius = '8px';
  div.style.display = 'flex';
  div.style.alignItems = 'center';
  div.style.justifyContent = 'center';
  div.style.color = '#00ffff';
  div.style.fontSize = '18px';
  div.style.fontWeight = 'bold';

  const iframe = document.createElement('iframe');
  iframe.style.width = '480px';
  iframe.style.height = '360px';
  iframe.style.border = '0px';
  iframe.src = site.url;
  iframe.title = site.name;
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');

  // จัดการ error
  iframe.onerror = () => {
    div.innerHTML = `<div style="text-align: center;">
      <div>❌ Cannot load</div>
      <div style="font-size: 14px; margin-top: 10px;">${site.name}</div>
      <div style="font-size: 12px; margin-top: 5px; opacity: 0.7;">X-Frame-Options blocked</div>
    </div>`;
  };

  div.appendChild(iframe);

  return div;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  render();
}

function animate() {
  requestAnimationFrame(animate);

  // Auto rotate (ปิดไว้ก่อนเพื่อให้ controls ทำงาน)
  // cube.rotation.y += 0.005;

  // Update controls
  controls.update();

  render();
}

function render() {
  renderer.render(scene, camera);
}

// Global access for buttons
window.rotateTo = function(index) {
  const targetY = - index * Math.PI / 2;

  // Simple rotation animation
  const startY = cube.rotation.y;
  const duration = 1000;
  const startTime = Date.now();

  function animateRotation() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);

    cube.rotation.y = startY + (targetY - startY) * eased;

    if (progress < 1) {
      requestAnimationFrame(animateRotation);
    }
  }

  animateRotation();
};

console.log('🌐 Simple CSS3D Cube initialized!');
console.log('Available websites:', websites.map((w, i) => `${i}: ${w.name}`));