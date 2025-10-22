/**
 * Three.js Iframe Cube - แสดงเว็บไซต์ 4 ด้านในรูปแบบ cube 3D ใช้ Three.js แท้ๆ
 */
import * as THREE from 'three';

export class ThreeJSIframeCube {
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
            ...options
        };
        
        this.group = new THREE.Group();
        this.cube = null;
        this.wireframe = null;
        this.iframes = [];
        this.canvases = [];
        this.textures = [];
        this.materials = [];
        this.isDragging = false;
        this.previousMousePosition = { x: 0, y: 0 };
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        this.init();
    }
    
    init() {
        this.createIframes();
        this.createCube();
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
        
        // เริ่มการอัปเดต texture
        this.startTextureUpdate();
    }
    
    createIframes() {
        // สร้าง iframe สำหรับแต่ละเว็บไซต์
        this.options.websites.forEach((website, index) => {
            if (index < 4) { // เฉพาะ 4 ด้านหลัก
                const iframe = this.createIframe(website, index);
                const canvas = this.createCanvasFromIframe(iframe, index);
                
                this.iframes.push(iframe);
                this.canvases.push(canvas);
            }
        });
    }
    
    createIframe(website, index) {
        const iframe = document.createElement('iframe');
        iframe.src = website;
        iframe.style.cssText = `
            width: 1024px;
            height: 768px;
            border: none;
            position: absolute;
            left: -9999px;
            top: -9999px;
            visibility: hidden;
        `;
        
        // เพิ่มเข้า DOM (ซ่อนไว้)
        document.body.appendChild(iframe);
        
        // รอให้โหลดเสร็จ
        iframe.addEventListener('load', () => {
            console.log(`✅ Iframe ${index} loaded: ${website}`);
        });
        
        return iframe;
    }
    
    createCanvasFromIframe(iframe, index) {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 768;
        const ctx = canvas.getContext('2d');
        
        // สร้างพื้นหลังเริ่มต้น
        this.drawLoadingScreen(ctx, index);
        
        return canvas;
    }
    
    drawLoadingScreen(ctx, index) {
        const canvas = ctx.canvas;
        const colors = ['#1a1a2e', '#16213e', '#e94560', '#f39c12'];
        const names = ['GOONEE', 'GOORUM', 'PAYSTOP', 'GOOMETA'];
        
        // พื้นหลัง gradient
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, colors[index]);
        gradient.addColorStop(1, '#000000');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // ข้อความ
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 72px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(names[index], canvas.width/2, canvas.height/2 - 50);
        
        // Loading indicator
        ctx.fillStyle = '#00ffff';
        ctx.font = '36px Arial';
        ctx.fillText('🌐 Loading...', canvas.width/2, canvas.height/2 + 50);
        
        // เส้นขอบ
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 8;
        ctx.strokeRect(20, 20, canvas.width-40, canvas.height-40);
    }
    
    createCube() {
        const size = this.options.size;
        const geometry = new THREE.BoxGeometry(size, size, size);
        
        // สร้าง materials สำหรับแต่ละด้าน
        this.materials = [];
        
        for (let i = 0; i < 6; i++) {
            let texture;
            
            if (i < 4) {
                // ใช้ canvas texture สำหรับ 4 ด้านหลัก
                texture = new THREE.CanvasTexture(this.canvases[i]);
                texture.needsUpdate = true;
                this.textures.push(texture);
            } else {
                // ด้านบนและล่าง - ใช้สีธรรมดา
                texture = null;
            }
            
            const material = new THREE.MeshBasicMaterial({
                map: texture,
                color: i < 4 ? 0xffffff : (i === 4 ? 0x1a1a2e : 0x16213e),
                transparent: false,
                side: THREE.DoubleSide
            });
            
            this.materials.push(material);
        }
        
        // สร้าง cube
        this.cube = new THREE.Mesh(geometry, this.materials);
        
        // เพิ่ม wireframe outline
        const wireframeGeometry = new THREE.EdgesGeometry(geometry);
        const wireframeMaterial = new THREE.LineBasicMaterial({ 
            color: 0x00ffff, 
            transparent: true, 
            opacity: 0.3 
        });
        this.wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
        
        this.group.add(this.cube);
        this.group.add(this.wireframe);
    }
    
    startTextureUpdate() {
        // อัปเดต texture จาก iframe ทุกๆ 100ms
        setInterval(() => {
            this.updateTextures();
        }, 100);
    }
    
    updateTextures() {
        this.iframes.forEach((iframe, index) => {
            if (index < 4 && iframe.contentDocument) {
                try {
                    // ลองจับภาพจาก iframe (อาจไม่ได้ผลเนื่องจาก CORS)
                    this.captureIframeToCanvas(iframe, this.canvases[index], index);
                    
                    // อัปเดต texture
                    if (this.textures[index]) {
                        this.textures[index].needsUpdate = true;
                    }
                } catch (error) {
                    // ถ้าไม่สามารถจับภาพได้ ให้แสดงข้อความแทน
                    this.drawWebsiteInfo(this.canvases[index].getContext('2d'), index);
                    if (this.textures[index]) {
                        this.textures[index].needsUpdate = true;
                    }
                }
            }
        });
    }
    
    captureIframeToCanvas(iframe, canvas, index) {
        const ctx = canvas.getContext('2d');
        
        try {
            // ลองใช้ html2canvas หรือวิธีอื่น (ถ้ามี library)
            // เนื่องจาก CORS policy ทำให้ไม่สามารถจับภาพ iframe ข้าม domain ได้
            // ให้แสดงข้อมูลเว็บไซต์แทน
            this.drawWebsiteInfo(ctx, index);
        } catch (error) {
            this.drawWebsiteInfo(ctx, index);
        }
    }
    
    drawWebsiteInfo(ctx, index) {
        const canvas = ctx.canvas;
        const colors = ['#1a1a2e', '#16213e', '#e94560', '#f39c12'];
        const names = ['GOONEE', 'GOORUM', 'PAYSTOP', 'GOOMETA'];
        const urls = this.options.websites;
        
        // ล้างพื้นหลัง
        const gradient = ctx.createRadialGradient(
            canvas.width/2, canvas.height/2, 0,
            canvas.width/2, canvas.height/2, canvas.width/2
        );
        gradient.addColorStop(0, colors[index]);
        gradient.addColorStop(1, '#000000');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // เพิ่มเอฟเฟกต์พื้นหลัง
        ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
        for (let i = 0; i < 20; i++) {
            ctx.beginPath();
            ctx.arc(
                Math.random() * canvas.width,
                Math.random() * canvas.height,
                Math.random() * 50 + 10,
                0, Math.PI * 2
            );
            ctx.fill();
        }
        
        // ชื่อเว็บไซต์
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 96px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 20;
        ctx.fillText(names[index], canvas.width/2, canvas.height/2 - 100);
        
        // URL
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#00ffff';
        ctx.font = '32px Arial';
        ctx.fillText(urls[index], canvas.width/2, canvas.height/2);
        
        // คำแนะนำ
        ctx.fillStyle = '#ffffff';
        ctx.font = '28px Arial';
        ctx.fillText('🖱️ Click to open website', canvas.width/2, canvas.height/2 + 80);
        
        // เส้นขอบเรืองแสง
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 6;
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 15;
        ctx.strokeRect(30, 30, canvas.width-60, canvas.height-60);
        
        // เพิ่มเอฟเฟกต์เวลา
        const time = Date.now() * 0.001;
        ctx.shadowBlur = 0;
        ctx.fillStyle = `rgba(0, 255, 255, ${0.3 + 0.2 * Math.sin(time * 2)})`;
        ctx.fillRect(0, 0, canvas.width, 10);
        ctx.fillRect(0, canvas.height-10, canvas.width, 10);
        ctx.fillRect(0, 0, 10, canvas.height);
        ctx.fillRect(canvas.width-10, 0, 10, canvas.height);
    }
    
    setupControls() {
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onMouseClick = this.onMouseClick.bind(this);
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
        
        this.previousMousePosition = {
            x: event.clientX,
            y: event.clientY
        };
    }
    
    onMouseUp(event) {
        this.isDragging = false;
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
            const names = ['GOONEE', 'GOORUM', 'PAYSTOP', 'GOOMETA'];
            
            const message = `🌐 Open ${names[index]}?\n\n${url}`;
            if (confirm(message)) {
                window.open(url, '_blank', 'noopener,noreferrer');
            }
        }
    }
    
    rotateToCube(faceIndex) {
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
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    update() {
        if (this.options.autoRotate && !this.isDragging) {
            this.group.rotation.y += this.options.rotationSpeed;
            this.group.rotation.x += this.options.rotationSpeed * 0.3;
        }
        
        // อัปเดต wireframe opacity
        if (this.wireframe) {
            const distance = this.group.position.distanceTo(new THREE.Vector3(0, 0, 0));
            this.wireframe.material.opacity = Math.max(0.2, Math.min(0.6, 2 / (distance + 1)));
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
    
    rotateTo(faceIndex) {
        this.rotateToCube(faceIndex);
    }
    
    getGroup() {
        return this.group;
    }
    
    dispose() {
        // ล้างทรัพยากร
        if (this.cube) {
            this.cube.geometry.dispose();
            this.materials.forEach(material => {
                if (material.map) material.map.dispose();
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

export default ThreeJSIframeCube;