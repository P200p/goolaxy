/**
 * ตัวอย่างการใช้งาน cards.json หลังจากแยกภาพแล้ว
 * 
 * หลังจากใช้ Base64 Image Extractor แยกภาพออกจาก cards.json แล้ว
 * ไฟล์ JSON จะชี้ไปยังไฟล์ภาพแทน base64 data
 * 
 * โครงสร้างไฟล์ที่ได้:
 * goolaxy/
 * ├── cards_updated.json          // JSON ที่อัปเดตแล้ว
 * ├── uuid-mapping.json           // ไฟล์ mapping
 * ├── images/                     // โฟลเดอร์ภาพ
 * │   ├── card_001.png
 * │   ├── card_002.jpg
 * │   └── ...
 * └── src/
 *     └── main.js                 // ไฟล์หลัก
 */

// ตัวอย่างการโหลด cards.json ที่อัปเดตแล้ว
async function loadCards() {
    try {
        // โหลด JSON ที่อัปเดตแล้ว (ขนาดเล็กลง เพราะไม่มี base64)
        const response = await fetch('./cards_updated.json');
        const cardsData = await response.json();
        
        console.log('📄 โหลด cards.json สำเร็จ');
        console.log('🎴 จำนวนการ์ด:', cardsData.cards ? cardsData.cards.length : 0);
        
        return cardsData;
        
    } catch (error) {
        console.error('❌ ไม่สามารถโหลด cards.json ได้:', error);
        
        // Fallback: ลองโหลดไฟล์เดิม
        try {
            const fallbackResponse = await fetch('./cards.json');
            const fallbackData = await fallbackResponse.json();
            console.log('⚠️ ใช้ไฟล์ cards.json เดิม (มี base64)');
            return fallbackData;
        } catch (fallbackError) {
            console.error('❌ ไม่สามารถโหลดไฟล์ใดๆ ได้:', fallbackError);
            throw fallbackError;
        }
    }
}

// ตัวอย่างการโหลดภาพการ์ด
async function loadCardImage(card) {
    try {
        // ตรวจสอบว่าเป็น base64 หรือ file path
        if (card.image && card.image.startsWith('data:image/')) {
            // ยังเป็น base64 - สร้าง Image element โดยตรง
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = card.image;
            });
            
        } else if (card.image) {
            // เป็น file path - โหลดจากไฟล์
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    console.log(`✅ โหลดภาพสำเร็จ: ${card.image}`);
                    resolve(img);
                };
                img.onerror = (error) => {
                    console.error(`❌ ไม่สามารถโหลดภาพได้: ${card.image}`, error);
                    reject(error);
                };
                
                // ตั้งค่า CORS ถ้าจำเป็น
                img.crossOrigin = 'anonymous';
                img.src = card.image;
            });
            
        } else {
            throw new Error('ไม่พบข้อมูลภาพในการ์ด');
        }
        
    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาดในการโหลดภาพ:', error);
        throw error;
    }
}

// ตัวอย่างการใช้งานกับ Three.js
async function createCardMesh(card, scene) {
    try {
        // โหลดภาพการ์ด
        const image = await loadCardImage(card);
        
        // สร้าง texture จากภาพ
        const texture = new THREE.Texture(image);
        texture.needsUpdate = true;
        
        // สร้าง material
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        // สร้าง geometry
        const geometry = new THREE.PlaneGeometry(2, 3); // ขนาดการ์ด
        
        // สร้าง mesh
        const mesh = new THREE.Mesh(geometry, material);
        
        // ตั้งค่าตำแหน่งและข้อมูลเพิ่มเติม
        mesh.userData = {
            cardId: card.id,
            cardName: card.name,
            cardType: card.type
        };
        
        // เพิ่มเข้า scene
        scene.add(mesh);
        
        console.log(`✅ สร้างการ์ด mesh สำเร็จ: ${card.name}`);
        return mesh;
        
    } catch (error) {
        console.error(`❌ ไม่สามารถสร้างการ์ด mesh ได้: ${card.name}`, error);
        throw error;
    }
}

// ตัวอย่างการโหลดการ์ดทั้งหมด
async function loadAllCards(scene) {
    try {
        console.log('🚀 เริ่มโหลดการ์ดทั้งหมด...');
        
        // โหลด cards data
        const cardsData = await loadCards();
        
        if (!cardsData.cards || !Array.isArray(cardsData.cards)) {
            throw new Error('ข้อมูลการ์ดไม่ถูกต้อง');
        }
        
        const cards = cardsData.cards;
        const cardMeshes = [];
        
        // โหลดการ์ดทีละใบ (เพื่อไม่ให้หน่วงเครื่อง)
        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            
            try {
                const mesh = await createCardMesh(card, scene);
                
                // จัดเรียงการ์ดในแถว
                const row = Math.floor(i / 10);
                const col = i % 10;
                mesh.position.set(col * 2.5 - 11.25, -row * 4, 0);
                
                cardMeshes.push(mesh);
                
                // แสดงความคืบหน้า
                if ((i + 1) % 10 === 0 || i === cards.length - 1) {
                    console.log(`📊 โหลดแล้ว: ${i + 1}/${cards.length} การ์ด`);
                }
                
                // หน่วงเวลาเล็กน้อยเพื่อไม่ให้หน่วงเครื่อง
                if (i % 5 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
                
            } catch (error) {
                console.error(`⚠️ ข้ามการ์ด ${card.name}:`, error.message);
            }
        }
        
        console.log(`✅ โหลดการ์ดเสร็จสิ้น: ${cardMeshes.length}/${cards.length} การ์ด`);
        return cardMeshes;
        
    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาดในการโหลดการ์ด:', error);
        throw error;
    }
}

// ตัวอย่างการใช้งานใน main.js
async function initializeCardSystem(scene) {
    try {
        console.log('🎴 เริ่มต้นระบบการ์ด...');
        
        // โหลดการ์ดทั้งหมด
        const cardMeshes = await loadAllCards(scene);
        
        // สร้างกลุ่มการ์ด
        const cardGroup = new THREE.Group();
        cardMeshes.forEach(mesh => cardGroup.add(mesh));
        scene.add(cardGroup);
        
        // เพิ่มการโต้ตอบ (ถ้าต้องการ)
        setupCardInteraction(cardMeshes);
        
        console.log('✅ ระบบการ์ดพร้อมใช้งาน');
        return cardGroup;
        
    } catch (error) {
        console.error('❌ ไม่สามารถเริ่มต้นระบบการ์ดได้:', error);
        throw error;
    }
}

// ตัวอย่างการตั้งค่าการโต้ตอบ
function setupCardInteraction(cardMeshes) {
    // ตัวอย่าง: เมื่อคลิกการ์ดจะแสดงข้อมูล
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    function onCardClick(event) {
        // คำนวณตำแหน่งเมาส์
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // ตรวจสอบการชน
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(cardMeshes);
        
        if (intersects.length > 0) {
            const selectedCard = intersects[0].object;
            const cardData = selectedCard.userData;
            
            console.log('🎴 เลือกการ์ด:', cardData.cardName);
            
            // แสดงข้อมูลการ์ด
            showCardInfo(cardData);
        }
    }
    
    // เพิ่ม event listener
    window.addEventListener('click', onCardClick);
}

function showCardInfo(cardData) {
    // ตัวอย่างการแสดงข้อมูลการ์ด
    const info = `
🎴 การ์ด: ${cardData.cardName}
🆔 ID: ${cardData.cardId}
🏷️ ประเภท: ${cardData.cardType}
    `;
    
    console.log(info);
    
    // สามารถแสดงใน UI ได้
    // document.getElementById('cardInfo').textContent = info;
}

// ตัวอย่างการใช้งานแบบ Preload
async function preloadCardImages(cardsData) {
    console.log('🔄 กำลัง preload ภาพการ์ด...');
    
    const imagePromises = cardsData.cards.map(async (card, index) => {
        try {
            await loadCardImage(card);
            
            if ((index + 1) % 20 === 0) {
                console.log(`📊 Preload: ${index + 1}/${cardsData.cards.length}`);
            }
            
            return true;
        } catch (error) {
            console.warn(`⚠️ ไม่สามารถ preload การ์ด ${card.name}:`, error.message);
            return false;
        }
    });
    
    const results = await Promise.all(imagePromises);
    const successCount = results.filter(Boolean).length;
    
    console.log(`✅ Preload เสร็จสิ้น: ${successCount}/${cardsData.cards.length} ภาพ`);
    return successCount;
}

// Export functions สำหรับใช้งานใน main.js
export {
    loadCards,
    loadCardImage,
    createCardMesh,
    loadAllCards,
    initializeCardSystem,
    preloadCardImages
};

/**
 * วิธีใช้งานใน main.js:
 * 
 * import { initializeCardSystem } from './example-usage.js';
 * 
 * // ใน init function
 * async function init() {
 *     // สร้าง scene, camera, renderer
 *     const scene = new THREE.Scene();
 *     // ...
 *     
 *     // เริ่มต้นระบบการ์ด
 *     try {
 *         const cardGroup = await initializeCardSystem(scene);
 *         console.log('✅ ระบบการ์ดพร้อมใช้งาน');
 *     } catch (error) {
 *         console.error('❌ ไม่สามารถโหลดการ์ดได้:', error);
 *     }
 * }
 */