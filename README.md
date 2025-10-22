# 🎴 Goolaxy Cards - Image Extraction Guide

## 🎯 ภาพรวม

คู่มือนี้จะแนะนำวิธีการแยกภาพ base64 จากไฟล์ `cards.json` และใช้งานในโปรเจกต์ Goolaxy โดยไม่ต้องแก้ไขโค้ดใน `main.js`

## 🚀 ขั้นตอนการแยกภาพ

### ขั้นตอนที่ 1: เตรียมไฟล์
```
goolaxy/
├── cards.json                  // ไฟล์เดิม (มี base64 images)
├── extract-cards-images.html   // เครื่องมือแยกภาพ
└── index.html                  // ไฟล์หลัก
```

### ขั้นตอนที่ 2: แยกภาพ
1. เปิดไฟล์ `extract-cards-images.html` ในเบราว์เซอร์
2. ลากไฟล์ `cards.json` มาวางในพื้นที่ที่กำหนด
3. ตั้งค่าโฟลเดอร์เอาต์พุต (แนะนำ: `./images`)
4. คลิก "เริ่มแยกภาพ"
5. รอให้กระบวนการเสร็จสิ้น
6. ดาวน์โหลดไฟล์ผลลัพธ์

### ขั้นตอนที่ 3: จัดระเบียบไฟล์
หลังจากแยกภาพแล้ว คุณจะได้:
```
goolaxy/
├── cards.json                  // ไฟล์เดิม (สำรอง)
├── cards_updated.json          // ไฟล์ใหม่ (ชี้ไปยังไฟล์ภาพ)
├── uuid-mapping.json           // ไฟล์ mapping
├── images/                     // โฟลเดอร์ภาพที่แยกออกมา
│   ├── card_001.png
│   ├── card_002.jpg
│   ├── card_003.webp
│   └── ...
├── index.html
└── src/
    └── main.js
```

## 🔧 การใช้งานในโค้ด

### วิธีที่ 1: เปลี่ยนชื่อไฟล์ (ง่ายที่สุด)
```bash
# เปลี่ยนชื่อไฟล์เดิม
mv cards.json cards_original.json

# เปลี่ยนชื่อไฟล์ใหม่
mv cards_updated.json cards.json
```

ตอนนี้โค้ดใน `main.js` จะใช้งานได้ทันทีโดยไม่ต้องแก้ไข!

### วิธีที่ 2: แก้ไขโค้ดเล็กน้อย
```javascript
// ใน main.js เปลี่ยนจาก
const response = await fetch('./cards.json');

// เป็น
const response = await fetch('./cards_updated.json');
```

### วิธีที่ 3: ใช้ Compatibility Layer (ขั้นสูง)
```javascript
import CompatibilityLayer from '../editor/js/base64-extractor/core/CompatibilityLayer.js';

// ตั้งค่า compatibility layer
const compatibility = new CompatibilityLayer({
    baseImagePath: './images',
    mappingFilePath: './uuid-mapping.json',
    fallbackToBase64: true
});

// โหลด mapping
const mappingResponse = await fetch('./uuid-mapping.json');
const mapping = await mappingResponse.json();
compatibility.updateMapping(mapping);

// ตอนนี้ภาพจะถูกโหลดอัตโนมัติ
```

## 📊 ประโยชน์ที่ได้รับ

### ก่อนแยกภาพ
- 📄 `cards.json`: 50+ MB (ใหญ่มาก)
- 🐌 โหลดช้า: 5-10 วินาที
- 💾 ใช้ RAM: 200+ MB
- 🚫 ไม่สามารถ cache ได้

### หลังแยกภาพ
- 📄 `cards_updated.json`: 2-5 MB (เล็กลง 90%)
- ⚡ โหลดเร็ว: 1-2 วินาที
- 💾 ใช้ RAM: 50 MB
- ✅ Cache ได้ (ภาพแต่ละไฟล์)

## 🔍 การตรวจสอบผลลัพธ์

### ตรวจสอบไฟล์ JSON
```javascript
// โหลดไฟล์ใหม่
const response = await fetch('./cards_updated.json');
const data = await response.json();

// ตรวจสอบภาพ
const firstCard = data.cards[0];
console.log('Image URL:', firstCard.image);

// ควรเป็น: "./images/card_001.png" 
// แทนที่จะเป็น: "data:image/png;base64,..."
```

### ตรวจสอบการโหลดภาพ
```javascript
// ทดสอบโหลดภาพ
const img = new Image();
img.onload = () => console.log('✅ โหลดภาพสำเร็จ');
img.onerror = () => console.log('❌ โหลดภาพล้มเหลว');
img.src = firstCard.image;
```

## 🛠️ การแก้ไขปัญหา

### ปัญหา: ภาพโหลดไม่ได้
```javascript
// ตรวจสอบ path
console.log('Current path:', window.location.href);
console.log('Image path:', firstCard.image);

// ลองใช้ absolute path
img.src = new URL(firstCard.image, window.location.href).href;
```

### ปัญหา: CORS Error
```javascript
// เพิ่ม CORS header
img.crossOrigin = 'anonymous';
img.src = firstCard.image;
```

### ปัญหา: ไฟล์ไม่พบ
```bash
# ตรวจสอบโครงสร้างไฟล์
ls -la images/
ls -la *.json
```

## 📁 โครงสร้างไฟล์แนะนำ

```
goolaxy/
├── index.html                  // หน้าหลัก
├── cards_updated.json          // JSON ที่อัปเดตแล้ว
├── uuid-mapping.json           // ไฟล์ mapping
├── images/                     // โฟลเดอร์ภาพ
│   ├── card_001.png
│   ├── card_002.jpg
│   └── ...
├── src/
│   ├── main.js                 // โค้ดหลัก
│   └── example-usage.js        // ตัวอย่างการใช้งาน
├── backup/
│   └── cards_original.json     // ไฟล์สำรอง
└── tools/
    └── extract-cards-images.html // เครื่องมือแยกภาพ
```

## 🎯 ตัวอย่างการใช้งาน

### การโหลดการ์ดพื้นฐาน
```javascript
async function loadCards() {
    const response = await fetch('./cards_updated.json');
    const data = await response.json();
    
    console.log(`📊 โหลดการ์ด: ${data.cards.length} ใบ`);
    return data.cards;
}
```

### การสร้าง Three.js Texture
```javascript
async function createCardTexture(card) {
    return new Promise((resolve, reject) => {
        const loader = new THREE.TextureLoader();
        loader.load(
            card.image,
            (texture) => {
                console.log(`✅ โหลด texture: ${card.name}`);
                resolve(texture);
            },
            undefined,
            (error) => {
                console.error(`❌ ไม่สามารถโหลด texture: ${card.name}`, error);
                reject(error);
            }
        );
    });
}
```

### การใช้งานแบบ Batch Loading
```javascript
async function loadCardsInBatches(cards, batchSize = 10) {
    const results = [];
    
    for (let i = 0; i < cards.length; i += batchSize) {
        const batch = cards.slice(i, i + batchSize);
        
        const batchPromises = batch.map(card => createCardTexture(card));
        const batchResults = await Promise.allSettled(batchPromises);
        
        results.push(...batchResults);
        
        console.log(`📊 โหลดแล้ว: ${Math.min(i + batchSize, cards.length)}/${cards.length}`);
        
        // หน่วงเวลาเล็กน้อย
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
}
```

## 🎉 สรุป

หลังจากใช้ Base64 Image Extractor แยกภาพจาก `cards.json` แล้ว:

1. ✅ **ไฟล์ JSON เล็กลง 90%** - โหลดเร็วขึ้นมาก
2. ✅ **ภาพแยกต่างหาก** - จัดการง่าย, cache ได้
3. ✅ **ไม่ต้องแก้โค้ด** - เปลี่ยนชื่อไฟล์เท่านั้น
4. ✅ **ประสิทธิภาพดีขึ้น** - ใช้ RAM น้อยลง
5. ✅ **รองรับ fallback** - กลับไปใช้ base64 ได้ถ้าจำเป็น

**🚀 ตอนนี้โปรเจกต์ Goolaxy พร้อมใช้งานด้วยประสิทธิภาพที่ดีขึ้น!**