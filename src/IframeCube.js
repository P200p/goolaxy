/**
 * 3D Iframe Cube - แสดงเว็บไซต์ 4 ด้านในรูปแบบ cube 3D พร้อม iframe จริงๆ
 */
import * as THREE from 'three';

export class IframeCube {
    constructor(options = {}) {
        this.options = {
            size: options.size || 8,
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
            iframeScale: options.iframeScale || 0.8, // ขนาดของ iframe เทียบกับหน้า cube
            ...options
        };
        
        this.group = new THREE.Group();
        this.cube = null;
        this.iframes = [];
        this.cssObjects = [];
        this.currentFace = 0;
        this.isTransitioning = false;
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
        
        this.group.rotation.set(
            this.options.rotation.x,
            this.options.rotation.y,
            this.options.rotation.z
        );
    }
    
    createCube() {
        const size = this.options.size;
        const geometry = new THREE.BoxGeometry(size, size, size);
        
        // สร้าง materials แบบโปร่งใสสำหรับแต่ละด้าน
        const materials = [];
        
        for (let i = 0; i < 6; i++) {
            const material = new THREE.MeshBasicMaterial({
                color: i < 4 ? 0x1a1a2e : 0x16213e, // 4 ด้านหลักเป็นสีเข้ม, บน-ล่างเป็นสีอื่น
                transparent: true,
                opacity: 0.1, // โปร่งใสมากเพื่อให้เห็น iframe
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
            opacity: 0.6 
        });
        const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
        
        this.group.add(cube);
        this.group.add(wireframe);
        
        this.cube = cube;
        this.wireframe = wireframe;
    }
    
    createIframes() {
        const size = this.options.size;
        const iframeSize = size * this.options.iframeScale;
        
        // ตำแหน่งและการหมุนสำหรับแต่ละด้าน
        const faceConfigs = [
            // ด้านขวา (Right - X+)
            { 
                position: [size/2 + 0.01, 0, 0], 
                rotation: [0, Math.PI/2, 0] 
            },
            // ด้านซ้าย (Left - X-)
            { 
                position: [-size/2 - 0.01, 0, 0], 
                rotation: [0, -Math.PI/2, 0] 
            },
            // ด้านหน้า (Front - Z+)
            { 
                position: [0, 0, size/2 + 0.01], 
                rotation: [0, 0, 0] 
            },
            // ด้านหลัง (Back - Z-)
            { 
                position: [0, 0, -size/2 - 0.01], 
                rotation: [0, Math.PI, 0] 
            }
        ];
        
        // สร้าง iframe สำหรับแต่ละด้าน
        this.options.websites.forEach((website, index) => {
            if (index < 4) { // เฉพาะ 4 ด้านหลัก
                const iframe = this.createIframe(website, index);
                const cssObject = this.createCSS3DObject(iframe, iframeSize);
                
                // ตั้งตำแหน่งและการหมุน
                const config = faceConfigs[index];
                cssObject.position.set(...config.position);
                cssObject.rotation.set(...config.rotation);
                
                this.group.add(cssObject);
                this.iframes.push(iframe);
                this.cssObjects.push(cssObject);
            }
        });
    }
    
    createIframe(website, index) {
        const iframe = document.createElement('iframe');
        iframe.src = website;
        iframe.style.cssText = `
            width: 800px;
            height: 600px;
            border: 3px solid #00ffff;
            border-radius: 10px;
            background: #1a1a2e;
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
        `;
        
        // เพิ่ม loading indicator
        iframe.addEventListener('load', () => {
            console.log(`Iframe ${index} loaded: ${website}`);
        });
        
        return iframe;
    }
    
    createCSS3DObject(element, size) {
        // สร้าง CSS3D Object (จำลอง - ใช้ HTML element ใน 3D space)
        const object = new THREE.Object3D();
        
        // เพิ่ม element เข้า DOM
        element.style.position = 'absolute';
        element.style.pointerEvents = 'auto';
        
        // สร้าง container สำหรับ iframe
        const container = document.createElement('div');
        container.style.cssText = `
            position: absolute;
            transform-style: preserve-3d;
            pointer-events: auto;
        `;
        container.appendChild(element);
        
        // เพิ่มเข้า DOM
        document.body.appendChild(container);
        
        // เก็บ reference
        object.userData.element = element;
        object.userData.container = container;
        
        return object;
    }
    
    setupControls() {
        // เพิ่ม event listeners สำหรับการคลิก
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // จะถูกเรียกจากภายนอก
        this.onMouseClick = this.onMouseClick.bind(this);
    }
    
    onMouseClick(event, camera) {
        // คำนวณตำแหน่งเมาส์
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // ตรวจสอบการชน
        this.raycaster.setFromCamera(this.mouse, camera);
        const intersects = this.raycaster.intersectObject(this.cube);
        
        if (intersects.length > 0) {
            const face = intersects[0].face;
            const faceIndex = Math.floor(intersects[0].faceIndex / 2);
            
            console.log('Clicked face:', faceIndex);
            
            if (faceIndex < 4) {
                this.openWebsite(faceIndex);
                this.rotateToCube(faceIndex);
            }
        }
    }
    
    openWebsite(index) {
        if (index < this.options.websites.length) {
            const url = this.options.websites[index];
            
            // สร้าง iframe popup
            this.createIframePopup(url, index);
        }
    }
    
    createIframePopup(url, index) {
        // ลบ popup เดิม (ถ้ามี)
        const existingPopup = document.getElementById('iframe-popup');
        if (existingPopup) {
            existingPopup.remove();
        }
        
        // สร้าง popup container
        const popup = document.createElement('div');
        popup.id = 'iframe-popup';
        popup.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 1000;
            display: flex;
            justify-content: center;
            align-items: center;
            backdrop-filter: blur(5px);
        `;
        
        // สร้าง iframe container
        const iframeContainer = document.createElement('div');
        iframeContainer.style.cssText = `
            width: 90%;
            height: 90%;
            max-width: 1200px;
            max-height: 800px;
            background: #1a1a2e;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 0 30px rgba(0, 255, 255, 0.3);
            border: 2px solid #00ffff;
            position: relative;
        `;
        
        // สร้าง header
        const header = document.createElement('div');
        header.style.cssText = `
            background: linear-gradient(90deg, #1a1a2e, #16213e);
            color: #00ffff;
            padding: 15px 20px;
            font-family: Arial, sans-serif;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #00ffff;
        `;
        
        const websiteNames = ['GOONEE', 'GOORUM', 'PAYSTOP', 'GOOMETA'];
        header.innerHTML = `
            <span>🌐 ${websiteNames[index]} - ${url}</span>
            <button id="close-popup" style="
                background: #e94560;
                color: white;
                border: none;
                padding: 8px 15px;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
            ">✕ Close</button>
        `;
        
        // สร้าง iframe
        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.style.cssText = `
            width: 100%;
            height: calc(100% - 60px);
            border: none;
            background: white;
        `;
        
        // ประกอบ elements
        iframeContainer.appendChild(header);
        iframeContainer.appendChild(iframe);
        popup.appendChild(iframeContainer);
        document.body.appendChild(popup);
        
        // เพิ่ม event listeners
        document.getElementById('close-popup').addEventListener('click', () => {
            popup.remove();
        });
        
        popup.addEventListener('click', (e) => {
            if (e.target === popup) {
                popup.remove();
            }
        });
        
        // เพิ่มเอฟเฟกต์เปิด
        popup.style.opacity = '0';
        popup.style.transform = 'scale(0.8)';
        
        requestAnimationFrame(() => {
            popup.style.transition = 'all 0.3s ease';
            popup.style.opacity = '1';
            popup.style.transform = 'scale(1)';
        });
    }
    
    rotateToCube(faceIndex) {
        if (this.isTransitioning) return;
        
        this.isTransitioning = true;
        this.currentFace = faceIndex;
        
        // คำนวณการหมุนสำหรับแต่ละด้าน
        const rotations = [
            { x: 0, y: -Math.PI/2, z: 0 }, // ด้านขวา
            { x: 0, y: Math.PI/2, z: 0 },  // ด้านซ้าย
            { x: 0, y: 0, z: 0 },          // ด้านหน้า
            { x: 0, y: Math.PI, z: 0 }     // ด้านหลัง
        ];
        
        const targetRotation = rotations[faceIndex];
        
        // ใช้ TWEEN หรือ animation ง่ายๆ
        this.animateRotation(targetRotation);
    }
    
    animateRotation(targetRotation) {
        const startRotation = {
            x: this.group.rotation.x,
            y: this.group.rotation.y,
            z: this.group.rotation.z
        };
        
        const duration = 1000; // 1 วินาที
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-in-out)
            const easeProgress = progress < 0.5 
                ? 2 * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            
            // Interpolate rotation
            this.group.rotation.x = startRotation.x + (targetRotation.x - startRotation.x) * easeProgress;
            this.group.rotation.y = startRotation.y + (targetRotation.y - startRotation.y) * easeProgress;
            this.group.rotation.z = startRotation.z + (targetRotation.z - startRotation.z) * easeProgress;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.isTransitioning = false;
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    update() {
        if (this.options.autoRotate && !this.isTransitioning) {
            this.group.rotation.y += this.options.rotationSpeed;
            this.group.rotation.x += this.options.rotationSpeed * 0.5;
        }
        
        // อัปเดต wireframe opacity ตาม distance
        if (this.wireframe) {
            const distance = this.group.position.distanceTo(new THREE.Vector3(0, 0, 0));
            this.wireframe.material.opacity = Math.max(0.1, Math.min(0.5, 1 / (distance + 1)));
        }
    }
    
    // Methods สำหรับควบคุมจากภายนอก
    setPosition(x, y, z) {
        this.group.position.set(x, y, z);
    }
    
    setRotation(x, y, z) {
        this.group.rotation.set(x, y, z);
    }
    
    setAutoRotate(enabled) {
        this.options.autoRotate = enabled;
    }
    
    setRotationSpeed(speed) {
        this.options.rotationSpeed = speed;
    }
    
    getGroup() {
        return this.group;
    }
    
    dispose() {
        // ล้างทรัพยากร
        if (this.cube) {
            this.cube.geometry.dispose();
            this.cube.material.forEach(material => {
                if (material.map) material.map.dispose();
                material.dispose();
            });
        }
        
        if (this.wireframe) {
            this.wireframe.geometry.dispose();
            this.wireframe.material.dispose();
        }
    }
}

export default IframeCube;