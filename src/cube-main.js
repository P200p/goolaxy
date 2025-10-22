// -------------------- IMPORTS --------------------
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

// -------------------- SCENE / CAMERA --------------------
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 0, 5);

// -------------------- DUAL RENDERER SETUP --------------------
// WebGL Renderer (for background effects)
const webglRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
webglRenderer.setPixelRatio(window.devicePixelRatio);
webglRenderer.setSize(window.innerWidth, window.innerHeight);
webglRenderer.setClearColor(0x000000, 0);
document.body.appendChild(webglRenderer.domElement);

// CSS3D Renderer (for iframes)
const css3dRenderer = new CSS3DRenderer();
css3dRenderer.setSize(window.innerWidth, window.innerHeight);
css3dRenderer.domElement.style.position = 'absolute';
css3dRenderer.domElement.style.top = '0';
css3dRenderer.domElement.style.left = '0';
css3dRenderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(css3dRenderer.domElement);

// -------------------- CONTROLS --------------------
const controls = new OrbitControls(camera, webglRenderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.5;

// -------------------- BACKGROUND EFFECTS --------------------
// Starfield
const starGeometry = new THREE.BufferGeometry();
const starCount = 1000;
const starPositions = new Float32Array(starCount * 3);

for (let i = 0; i < starCount * 3; i++) {
  starPositions[i] = (Math.random() - 0.5) * 200;
}

starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
const starMaterial = new THREE.PointsMaterial({ color: 0x00ffff, size: 0.5 });
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// Wireframe sphere background
const sphereGeo = new THREE.SphereGeometry(50, 32, 32);
const sphereMat = new THREE.MeshBasicMaterial({
  color: 0x001122,
  wireframe: true,
  transparent: true,
  opacity: 0.1
});
const backgroundSphere = new THREE.Mesh(sphereGeo, sphereMat);
scene.add(backgroundSphere);

// -------------------- IFRAME CUBE CLASS --------------------
class WorkingIframeCube {
  constructor() {
    this.group = new THREE.Group();
    this.css3dGroup = new THREE.Group();
    this.currentFace = 0;
    this.isRotating = false;
    
    this.websites = [
      { name: 'GOONEE', url: 'https://goonee.io' },
      { name: 'GOORUM', url: 'https://goorum.io' },
      { name: 'GOOLAXY', url: 'https://goolaxy.io' },
      { name: 'GOOMETA', url: 'https://goometa.io' }
    ];
    
    this.createCube();
    scene.add(this.group);
    scene.add(this.css3dGroup);
  }

  createCube() {
    const size = 2;
    
    // Create wireframe cube structure
    const wireframeGeo = new THREE.BoxGeometry(size, size, size);
    const wireframeMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });
    const wireframeCube = new THREE.Mesh(wireframeGeo, wireframeMat);
    this.group.add(wireframeCube);

    // Create CSS3D iframe faces
    const positions = [
      [size/2, 0, 0],   // Right - GOONEE
      [-size/2, 0, 0],  // Left - GOORUM  
      [0, size/2, 0],   // Top - GOOLAXY
      [0, -size/2, 0]   // Bottom - GOOMETA
    ];

    const rotations = [
      [0, Math.PI/2, 0],    // Right
      [0, -Math.PI/2, 0],   // Left
      [-Math.PI/2, 0, 0],   // Top
      [Math.PI/2, 0, 0]     // Bottom
    ];

    this.websites.forEach((site, index) => {
      if (index < 4) { // Only create 4 faces
        const iframe = this.createIframe(site.url, site.name);
        const css3dObject = new CSS3DObject(iframe);
        
        css3dObject.position.set(...positions[index]);
        css3dObject.rotation.set(...rotations[index]);
        css3dObject.scale.setScalar(0.01);
        
        this.css3dGroup.add(css3dObject);
      }
    });
  }

  createIframe(url, name) {
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.style.width = '200px';
    iframe.style.height = '200px';
    iframe.style.border = '2px solid #00ffff';
    iframe.style.borderRadius = '8px';
    iframe.style.background = '#1a1a2e';
    iframe.title = name;
    
    // Enable pointer events for interaction
    iframe.style.pointerEvents = 'auto';
    
    return iframe;
  }

  rotateTo(faceIndex) {
    if (this.isRotating || faceIndex === this.currentFace) return;
    
    this.isRotating = true;
    this.currentFace = faceIndex;
    
    const targetRotations = [
      [0, 0, 0],           // GOONEE (Right face forward)
      [0, Math.PI, 0],     // GOORUM (Left face forward)
      [Math.PI/2, 0, 0],   // GOOLAXY (Top face forward)
      [-Math.PI/2, 0, 0]   // GOOMETA (Bottom face forward)
    ];
    
    const targetRotation = targetRotations[faceIndex];
    
    // Animate both groups
    this.animateRotation(this.group, targetRotation);
    this.animateRotation(this.css3dGroup, targetRotation);
    
    console.log(`Rotating to ${this.websites[faceIndex].name}`);
  }

  animateRotation(group, targetRotation) {
    const startRotation = {
      x: group.rotation.x,
      y: group.rotation.y,
      z: group.rotation.z
    };
    
    const duration = 1000; // 1 second
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Smooth easing
      const eased = 1 - Math.pow(1 - progress, 3);
      
      group.rotation.x = startRotation.x + (targetRotation[0] - startRotation.x) * eased;
      group.rotation.y = startRotation.y + (targetRotation[1] - startRotation.y) * eased;
      group.rotation.z = startRotation.z + (targetRotation[2] - startRotation.z) * eased;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.isRotating = false;
      }
    };
    
    animate();
  }
}

// -------------------- INITIALIZE CUBE --------------------
const iframeCube = new WorkingIframeCube();
window.iframeCube = iframeCube; // Make it globally accessible

// -------------------- LIGHTS --------------------
const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0x00ffff, 1, 100);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

// -------------------- ANIMATION LOOP --------------------
function animate() {
  requestAnimationFrame(animate);
  
  // Update controls
  controls.update();
  
  // Rotate background effects
  stars.rotation.y += 0.0005;
  backgroundSphere.rotation.x += 0.001;
  backgroundSphere.rotation.y += 0.002;
  
  // Render both scenes
  webglRenderer.render(scene, camera);
  css3dRenderer.render(scene, camera);
}

// -------------------- RESIZE HANDLER --------------------
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  
  webglRenderer.setSize(window.innerWidth, window.innerHeight);
  css3dRenderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize, false);

// -------------------- START ANIMATION --------------------
animate();

console.log('🌐 3D Web Portal initialized!');
console.log('Use window.iframeCube.rotateTo(0-3) to navigate between websites');