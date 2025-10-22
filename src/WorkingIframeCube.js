/**
 * Working Iframe Cube - ใช้เทคนิคแบบ Three.js examples
 * ใช้ CSS3DRenderer ร่วมกับ WebGLRenderer
 */
import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

export class WorkingIframeCube {
    constructor(options = {}) {
        this.options = {
            size: options.size || 400,
            position: options.position || { x: 0, y: 0, z: 0 },
            websites: options.websites || [
                'https://goonee.netlify.app/',
                'https://goorum.netlify.app/',
                'https://gooneepaystop.netlify.app/',
                'https://goometa.figma.site/'
            ],
            ...options
        };
        
        // สร้าง scenes แยกกัน
        this.webglScene = new THREE.Scene();
        this.css3dScene = new THREE.Scene();
        
        // สร้าง groups
        this.webglGroup = new THREE.Group();
        this.css3dGroup = new THREE.Group();
        
        this.iframes = [];
        this.css3dObjects = [];
        
        this.init();
    }
    
    init() {
        this.createWebGLCube();
        this.createCSS3DIframes();
        
        // เพิ่มเข้า scenes
        this.webglScene.add(this.webglGroup);
        this.css3dScene.add(this.css3dGroup);
        
        // ตั้งตำแหน่ง
        this.webglGroup.position.set(
            this.options.position.x,
            this.options.position.y,
            this.options.position.z
        );
        
        this.css3dGroup.position.copy(this.webglGroup.position);
    }
    
    createWebGLCube() {
        const size = this.options.size;
        const geometry = new THREE.BoxGeometry(size, size, size);
        
        // สร้าง materials โปร่งใสสำหรับแต่ละด้าน
        const materials = [];
        
        for (let i = 0; i < 6; i++) {
            const material = new THREE.MeshBasicMaterial({
                color: 0x000000,
                transparent: true,
                opacity: 0.1,
                side: THREE.DoubleSide
            });
            materials.push(material);
        }
        
        // สร้าง cube โปร่งใส
        const cube = new THREE.Mesh(geometry, materials);
        
        // เพิ่ม wireframe
        const wireframeGeometry = new THREE.EdgesGeometry(geometry);
        const wireframeMaterial = new THREE.LineBasicMaterial({ 
            color: 0x00ffff, 
            transparent: true, 
            opacity: 0.5 
        });
        const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
        
        this.webglGroup.add(cube);
        this.webglGroup.add(wireframe);
        
        this.cube = cube;
        this.wireframe = wireframe;
    }
    
    createCSS3DIframes() {
        const size = this.options.size;
        
        // ตำแหน่งสำหรับแต่ละด้าน
        const positions = [
            [0, 0, size/2],      // หน้า
            [size/2, 0, 0],      // ขวา  
            [0, 0, -size/2],     // หลัง
            [-size/2, 0, 0]      // ซ้าย
        ];
        
        const rotations = [
            [0, 0, 0],           // หน้า
            [0, Math.PI/2, 0],   // ขวา
            [0, Math.PI, 0],     // หลัง
            [0, -Math.PI/2, 0]   // ซ้าย
        ];
        
        const names = ['GOONEE', 'GOORUM', 'PAYSTOP', 'GOOMETA'];
        const colors = ['#1a1a2e', '#16213e', '#e94560', '#f39c12'];
        
        this.options.websites.forEach((website, index) => {
            if (index < 4) {
                const element = this.createIframeElement(website, index, names[index], colors[index]);
                const css3dObject = new CSS3DObject(element);
                
                css3dObject.position.set(...positions[index]);
                css3dObject.rotation.set(...rotations[index]);
                
                this.css3dGroup.add(css3dObject);
                this.iframes.push(element);
                this.css3dObjects.push(css3dObject);
            }
        });
    }
    
    createIframeElement(website, index, name, color) {
        // สร้าง container
        const element = document.createElement('div');
        element.className = 'iframe-face';
        element.style.cssText = `
            width: 800px;
            height: 600px;
            background: linear-gradient(135deg, ${color}, #000000);
            border: 3px solid #00ffff;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 
                0 0 30px rgba(0, 255, 255, 0.8),
                inset 0 0 20px rgba(0, 255, 255, 0.1);
            position: relative;
            cursor: pointer;
        `;
        
        // สร้าง header
        const header = document.createElement('div');
        header.style.cssText = `
            background: linear-gradient(90deg, #00ffff, #0080ff);
            color: #1a1a2e;
            padding: 15px 20px;
            font-family: 'Arial', sans-serif;
            font-weight: bold;
            font-size: 20px;
            text-align: center;
            border-bottom: 2px solid #00ffff;
            user-select: none;
        `;
        header.innerHTML = `🌐 ${name}`;
        
        // สร้าง iframe
        const iframe = document.createElement('iframe');
        iframe.src = website;
        iframe.style.cssText = `
            width: 100%;
            height: calc(100% - 60px);
            border: none;
            background: white;
        `;
        
        // เพิ่ม loading overlay
        const loading = document.createElement('div');
        loading.style.cssText = `
            position: absolute;
            top: 60px;
            left: 0;
            width: 100%;
            height: calc(100% - 60px);
            background: ${color};
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: #00ffff;
            font-family: Arial, sans-serif;
            font-size: 18px;
            z-index: 10;
        `;
        
        loading.innerHTML = `
            <div style="
                width: 50px;
                height: 50px;
                border: 4px solid #00ffff;
                border-top: 4px solid transparent;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 20px;
            "></div>
            <div>Loading ${name}...</div>
            <div style="font-size: 14px; margin-top: 10px; opacity: 0.7;">${website}</div>
        `;
        
        // เพิ่ม CSS animation
        if (!document.getElementById('iframe-animations')) {
            const style = document.createElement('style');
            style.id = 'iframe-animations';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .iframe-face {
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                }
                
                .iframe-face:hover {
                    transform: scale(1.02);
                    box-shadow: 
                        0 0 40px rgba(0, 255, 255, 1),
                        inset 0 0 30px rgba(0, 255, 255, 0.2);
                }
            `;
            document.head.appendChild(style);
        }
        
        // ประกอบ elements
        element.appendChild(header);
        element.appendChild(loading);
        element.appendChild(iframe);
        
        // Event handlers
        iframe.addEventListener('load', () => {
            setTimeout(() => {
                loading.style.opacity = '0';
                loading.style.transition = 'opacity 0.5s ease';
                setTimeout(() => {
                    loading.style.display = 'none';
                }, 500);
            }, 1000); // รอ 1 วินาทีก่อนซ่อน loading
            
            console.log(`✅ ${name} loaded successfully`);
        });
        
        iframe.addEventListener('error', () => {
            loading.innerHTML = `
                <div style="color: #ff4444; font-size: 24px;">❌</div>
                <div style="color: #ff4444;">Failed to load ${name}</div>
                <div style="font-size: 14px; margin-top: 10px; opacity: 0.7;">${website}</div>
            `;
        });
        
        // คลิกเพื่อเปิดในหน้าต่างใหม่
        element.addEventListener('click', (e) => {
            if (e.target === element || e.target === header) {
                const message = `🌐 Open ${name} in new window?\n\n${website}`;
                if (confirm(message)) {
                    window.open(website, '_blank', 'noopener,noreferrer');
                }
            }
        });
        
        return element;
    }
    
    update() {
        // หมุนทั้ง WebGL และ CSS3D groups พร้อมกัน
        this.webglGroup.rotation.y += 0.005;
        this.webglGroup.rotation.x += 0.002;
        
        // ซิงค์การหมุน
        this.css3dGroup.rotation.copy(this.webglGroup.rotation);
        
        // อัปเดต wireframe opacity
        if (this.wireframe) {
            const time = Date.now() * 0.001;
            this.wireframe.material.opacity = 0.3 + 0.2 * Math.sin(time * 2);
        }
    }
    
    // Methods สำหรับควบคุม
    setPosition(x, y, z) {
        this.webglGroup.position.set(x, y, z);
        this.css3dGroup.position.copy(this.webglGroup.position);
    }
    
    setRotation(x, y, z) {
        this.webglGroup.rotation.set(x, y, z);
        this.css3dGroup.rotation.copy(this.webglGroup.rotation);
    }
    
    rotateTo(faceIndex) {
        const rotations = [
            { x: 0, y: 0, z: 0 },          // หน้า
            { x: 0, y: -Math.PI/2, z: 0 }, // ขวา
            { x: 0, y: Math.PI, z: 0 },    // หลัง
            { x: 0, y: Math.PI/2, z: 0 }   // ซ้าย
        ];
        
        if (rotations[faceIndex]) {
            this.animateRotation(rotations[faceIndex]);
        }
    }
    
    animateRotation(targetRotation) {
        const startRotation = {
            x: this.webglGroup.rotation.x,
            y: this.webglGroup.rotation.y,
            z: this.webglGroup.rotation.z
        };
        
        const duration = 1000;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing
            const easeProgress = progress < 0.5 
                ? 2 * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            
            // Interpolate
            this.webglGroup.rotation.x = startRotation.x + (targetRotation.x - startRotation.x) * easeProgress;
            this.webglGroup.rotation.y = startRotation.y + (targetRotation.y - startRotation.y) * easeProgress;
            this.webglGroup.rotation.z = startRotation.z + (targetRotation.z - startRotation.z) * easeProgress;
            
            // ซิงค์
            this.css3dGroup.rotation.copy(this.webglGroup.rotation);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    getWebGLScene() {
        return this.webglScene;
    }
    
    getCSS3DScene() {
        return this.css3dScene;
    }
    
    dispose() {
        // ล้างทรัพยากร
        if (this.cube) {
            this.cube.geometry.dispose();
            this.cube.material.forEach(material => material.dispose());
        }
        
        if (this.wireframe) {
            this.wireframe.geometry.dispose();
            this.wireframe.material.dispose();
        }
        
        // ลบ iframe elements
        this.iframes.forEach(iframe => {
            if (iframe.parentNode) {
                iframe.parentNode.removeChild(iframe);
            }
        });
    }
}

export default WorkingIframeCube;