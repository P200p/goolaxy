/**
 * CSS3D Iframe Cube - แสดงเว็บไซต์ 4 ด้านในรูปแบบ cube 3D พร้อม iframe จริงๆ
 */
import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

export class CSS3DIframeCube {
    constructor(options = {}) {
        this.options = {
            size: options.size || 400, // ขนาดใหญ่ขึ้นสำหรับ CSS3D
            position: options.position || { x: 0, y: 0, z: 0 },
            rotation: options.rotation || { x: 0, y: 0, z: 0 },
            autoRotate: options.autoRotate !== false,
            rotationSpeed: options.rotationSpeed || 0.005,
            websites: options.websites || [
                'https://goonee.netlify.app/',
                'https://goorum.netlify.app/',
                'https://gooneepaystop.netlify.app/',
                'https://goometa.figma.site/'
            ],
            ...options
        };
        
        this.group = new THREE.Group();
        this.cssGroup = new THREE.Group();
        this.iframes = [];
        this.cssObjects = [];
        this.isDragging = false;
        this.previousMousePosition = { x: 0, y: 0 };
        
        this.init();
    }
    
    init() {
        this.createCube();
        this.createIframes();
        this.setupControls();
        
        // ตั้งตำแหน่งเริ่มต้น
        this.group.position.set(
            this.options.position.x,
            this.options.position.y,
            this.options.position.z
        );
        
        this.cssGroup.position.copy(this.group.position);
        this.cssGroup.rotation.copy(this.group.rotation);
    }
    
    createCube() {
        const size = this.options.size;
        const geometry = new THREE.BoxGeometry(size, size, size);
        
        // สร้าง materials แบบโปร่งใสสำหรับแต่ละด้าน
        const materials = [];
        
        for (let i = 0; i < 6; i++) {
            const material = new THREE.MeshBasicMaterial({
                color: i < 4 ? 0x1a1a2e : 0x16213e,
                transparent: true,
                opacity: 0.1,
                side: THREE.DoubleSide
            });
            materials.push(material);
        }
        
        // สร้าง cube
        const cube = new THREE.Mesh(geometry, materials);
        
        // เพิ่ม wireframe outline
        const wireframeGeometry = new THREE.EdgesGeometry(geometry);
        const wireframeMaterial = new THREE.LineBasicMaterial({ 
            color: 0x00ffff, 
            transparent: true, 
            opacity: 0.8 
        });
        const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
        
        this.group.add(cube);
        this.group.add(wireframe);
        
        this.cube = cube;
        this.wireframe = wireframe;
    }
    
    createIframes() {
        const size = this.options.size;
        
        // ตำแหน่งและการหมุนสำหรับแต่ละด้าน
        const faceConfigs = [
            // ด้านหน้า (Front - Z+)
            { 
                position: [0, 0, size/2], 
                rotation: [0, 0, 0],
                name: 'GOONEE'
            },
            // ด้านขวา (Right - X+)
            { 
                position: [size/2, 0, 0], 
                rotation: [0, Math.PI/2, 0],
                name: 'GOORUM'
            },
            // ด้านหลัง (Back - Z-)
            { 
                position: [0, 0, -size/2], 
                rotation: [0, Math.PI, 0],
                name: 'PAYSTOP'
            },
            // ด้านซ้าย (Left - X-)
            { 
                position: [-size/2, 0, 0], 
                rotation: [0, -Math.PI/2, 0],
                name: 'GOOMETA'
            }
        ];
        
        // สร้าง iframe สำหรับแต่ละด้าน
        this.options.websites.forEach((website, index) => {
            if (index < 4) { // เฉพาะ 4 ด้านหลัก
                const iframe = this.createIframe(website, index, faceConfigs[index].name);
                const cssObject = new CSS3DObject(iframe);
                
                // ตั้งตำแหน่งและการหมุน
                const config = faceConfigs[index];
                cssObject.position.set(...config.position);
                cssObject.rotation.set(...config.rotation);
                
                this.cssGroup.add(cssObject);
                this.iframes.push(iframe);
                this.cssObjects.push(cssObject);
            }
        });
    }
    
    createIframe(website, index, name) {
        // สร้าง container สำหรับ iframe
        const container = document.createElement('div');
        container.className = 'iframe-face';
        container.style.cssText = `
            width: 800px;
            height: 600px;
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            border: 3px solid #00ffff;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 
                0 0 30px rgba(0, 255, 255, 0.6),
                inset 0 0 20px rgba(0, 255, 255, 0.1);
            position: relative;
        `;
        
        // สร้าง header
        const header = document.createElement('div');
        header.style.cssText = `
            background: linear-gradient(90deg, #00ffff, #0080ff);
            color: #1a1a2e;
            padding: 10px 20px;
            font-family: 'Arial', sans-serif;
            font-weight: bold;
            font-size: 18px;
            text-align: center;
            border-bottom: 2px solid #00ffff;
        `;
        header.textContent = `🌐 ${name}`;
        
        // สร้าง iframe
        const iframe = document.createElement('iframe');
        iframe.src = website;
        iframe.style.cssText = `
            width: 100%;
            height: calc(100% - 50px);
            border: none;
            background: white;
        `;
        
        // เพิ่ม loading indicator
        const loading = document.createElement('div');
        loading.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #00ffff;
            font-family: Arial, sans-serif;
            font-size: 16px;
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        loading.innerHTML = `
            <div style="
                width: 30px;
                height: 30px;
                border: 3px solid #00ffff;
                border-top: 3px solid transparent;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            "></div>
            Loading ${name}...
        `;
        
        // เพิ่ม CSS animation
        if (!document.getElementById('cube-animations')) {
            const style = document.createElement('style');
            style.id = 'cube-animations';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .iframe-face:hover {
                    transform: scale(1.02);
                    transition: transform 0.3s ease;
                }
                
                .iframe-face {
                    transition: transform 0.3s ease;
                }
            `;
            document.head.appendChild(style);
        }
        
        container.appendChild(header);
        container.appendChild(loading);
        container.appendChild(iframe);
        
        // ซ่อน loading เมื่อ iframe โหลดเสร็จ
        iframe.addEventListener('load', () => {
            loading.style.display = 'none';
            console.log(`✅ ${name} loaded successfully`);
        });
        
        iframe.addEventListener('error', () => {
            loading.innerHTML = `❌ Failed to load ${name}`;
            loading.style.color = '#ff4444';
        });
        
        return container;
    }
    
    setupControls() {
        // เพิ่ม mouse controls สำหรับหมุน cube
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onWheel = this.onWheel.bind(this);
        
        // จะถูกเรียกจากภายนอก
    }
    
    onMouseDown(event) {
        this.isDragging = true;
        this.previousMousePosition = {
            x: event.clientX,
            y: event.clientY
        };
    }
    
    onMouseMove(event) {
        if (!this.isDragging) return;
        
        const deltaMove = {
            x: event.clientX - this.previousMousePosition.x,
            y: event.clientY - this.previousMousePosition.y
        };
        
        // หมุน cube ตาม mouse movement
        const rotationSpeed = 0.005;
        this.group.rotation.y += deltaMove.x * rotationSpeed;
        this.group.rotation.x += deltaMove.y * rotationSpeed;
        
        // ซิงค์การหมุนกับ CSS group
        this.cssGroup.rotation.copy(this.group.rotation);
        
        this.previousMousePosition = {
            x: event.clientX,
            y: event.clientY
        };
    }
    
    onMouseUp(event) {
        this.isDragging = false;
    }
    
    onWheel(event) {
        // ซูมเข้า-ออก
        const zoomSpeed = 0.1;
        const currentZ = this.group.position.z;
        const newZ = currentZ + (event.deltaY > 0 ? zoomSpeed : -zoomSpeed);
        
        // จำกัดระยะซูม
        this.group.position.z = Math.max(-10, Math.min(10, newZ));
        this.cssGroup.position.copy(this.group.position);
    }
    
    update() {
        if (this.options.autoRotate && !this.isDragging) {
            this.group.rotation.y += this.options.rotationSpeed;
            this.group.rotation.x += this.options.rotationSpeed * 0.3;
            
            // ซิงค์การหมุนกับ CSS group
            this.cssGroup.rotation.copy(this.group.rotation);
        }
        
        // อัปเดต wireframe opacity
        if (this.wireframe) {
            const distance = this.group.position.distanceTo(new THREE.Vector3(0, 0, 0));
            this.wireframe.material.opacity = Math.max(0.3, Math.min(0.8, 2 / (distance + 1)));
        }
    }
    
    // Methods สำหรับควบคุมจากภายนอก
    setPosition(x, y, z) {
        this.group.position.set(x, y, z);
        this.cssGroup.position.copy(this.group.position);
    }
    
    setRotation(x, y, z) {
        this.group.rotation.set(x, y, z);
        this.cssGroup.rotation.copy(this.group.rotation);
    }
    
    setAutoRotate(enabled) {
        this.options.autoRotate = enabled;
    }
    
    setRotationSpeed(speed) {
        this.options.rotationSpeed = speed;
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
            x: this.group.rotation.x,
            y: this.group.rotation.y,
            z: this.group.rotation.z
        };
        
        const duration = 1000;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeProgress = progress < 0.5 
                ? 2 * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            
            // Interpolate rotation
            this.group.rotation.x = startRotation.x + (targetRotation.x - startRotation.x) * easeProgress;
            this.group.rotation.y = startRotation.y + (targetRotation.y - startRotation.y) * easeProgress;
            this.group.rotation.z = startRotation.z + (targetRotation.z - startRotation.z) * easeProgress;
            
            // ซิงค์กับ CSS group
            this.cssGroup.rotation.copy(this.group.rotation);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    getGroup() {
        return this.group;
    }
    
    getCSSGroup() {
        return this.cssGroup;
    }
    
    dispose() {
        // ล้างทรัพยากร
        if (this.cube) {
            this.cube.geometry.dispose();
            this.cube.material.forEach(material => {
                material.dispose();
            });
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

export default CSS3DIframeCube;