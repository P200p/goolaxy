# 🔄 คู่มือการอัปเดต Scene ใหม่

## 🎯 เมื่อคุณต้องการเปลี่ยน scene และ export JSON ใหม่จาก Three.js Editor

### 📋 ขั้นตอนการอัปเดต:

## 1️⃣ Export JSON ใหม่จาก Three.js Editor

```
Three.js Editor → File → Export Scene → JSON
```
- ได้ไฟล์ใหม่ เช่น `new_scene.json` (มี base64 images)

## 2️⃣ แยกภาพจากไฟล์ JSON ใหม่

### วิธีที่ 1: ใช้เครื่องมือที่มีอยู่
```bash
# เปิดไฟล์ extract-cards-simple.html
open goolaxy/extract-cards-simple.html

# หรือ
open goolaxy/extract-cards-images.html (ต้องใช้ live server)
```

### วิธีที่ 2: ใช้ Command Line (ถ้ามี)
```bash
# ถ้ามี CLI tool
node extract-images.js new_scene.json --output ./temp-images
```

## 3️⃣ จัดระเบียบไฟล์ใหม่

### ขั้นตอนที่ 3.1: สำรองไฟล์เดิม
```bash
# สำรองไฟล์เดิม
mkdir goolaxy/backup/$(date +%Y%m%d)
cp goolaxy/public/cards.json goolaxy/backup/$(date +%Y%m%d)/cards_old.json
cp -r goolaxy/images goolaxy/backup/$(date +%Y%m%d)/images_old
```

### ขั้นตอนที่ 3.2: ล้างไฟล์เดิม
```bash
# ล้างภาพเดิม (ระวัง!)
rm goolaxy/images/card_*.png
rm goolaxy/images/card_*.jpg  
rm goolaxy/images/card_*.webp
```

### ขั้นตอนที่ 3.3: ย้ายไฟล์ใหม่
```bash
# ย้าย JSON ที่อัปเดตแล้ว
cp new_scene_updated.json goolaxy/public/cards.json

# ย้ายภาพใหม่
cp temp-images/card_*.* goolaxy/images/

# ย้าย mapping file (ถ้ามี)
cp uuid-mapping.json goolaxy/file/
```

## 4️⃣ ตรวจสอบและทดสอบ

### ตรวจสอบไฟล์
```bash
# ตรวจสอบ JSON
ls -la goolaxy/public/cards.json

# ตรวจสอบภาพ
ls -la goolaxy/images/card_*

# นับจำนวนภาพ
ls goolaxy/images/card_* | wc -l
```

### ทดสอบการทำงาน
```bash
# เปิดเว็บไซต์
open goolaxy/index.html

# หรือใช้ live server
cd goolaxy
python -m http.server 8000
# เปิด http://localhost:8000
```

## 🔧 สคริปต์อัตโนมัติ

### สร้างสคริปต์สำหรับอัปเดต
```bash
#!/bin/bash
# update-scene.sh

echo "🔄 เริ่มอัปเดต scene..."

# ตรวจสอบไฟล์ใหม่
if [ ! -f "$1" ]; then
    echo "❌ ไม่พบไฟล์ JSON ใหม่: $1"
    exit 1
fi

NEW_JSON="$1"
BACKUP_DIR="goolaxy/backup/$(date +%Y%m%d_%H%M%S)"

echo "📁 สร้างโฟลเดอร์สำรอง: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

echo "💾 สำรองไฟล์เดิม..."
cp goolaxy/public/cards.json "$BACKUP_DIR/cards_old.json"
cp -r goolaxy/images "$BACKUP_DIR/images_old"

echo "🖼️ แยกภาพจากไฟล์ใหม่..."
# ใช้เครื่องมือแยกภาพ (ต้องปรับตาม implementation)
node extract-images.js "$NEW_JSON" --output temp-images

echo "🗑️ ล้างไฟล์เดิม..."
rm -f goolaxy/images/card_*.*

echo "📦 ย้ายไฟล์ใหม่..."
cp "${NEW_JSON%.*}_updated.json" goolaxy/public/cards.json
cp temp-images/card_*.* goolaxy/images/

echo "🧹 ล้างไฟล์ชั่วคราว..."
rm -rf temp-images

echo "✅ อัปเดต scene เสร็จสิ้น!"
echo "📊 ภาพใหม่: $(ls goolaxy/images/card_* | wc -l) ไฟล์"
```

### การใช้งานสคริปต์
```bash
chmod +x update-scene.sh
./update-scene.sh new_scene.json
```

## 📝 Checklist การอัปเดต

### ก่อนเริ่ม:
- [ ] มีไฟล์ JSON ใหม่จาก Three.js Editor
- [ ] สำรองไฟล์เดิมแล้ว
- [ ] เครื่องมือแยกภาพพร้อมใช้งาน

### ระหว่างดำเนินการ:
- [ ] แยกภาพจากไฟล์ JSON ใหม่
- [ ] ได้ไฟล์ `xxx_updated.json`
- [ ] ได้ภาพที่แยกออกมา (card_001.png, ...)
- [ ] ได้ไฟล์ mapping (ถ้าต้องการ)

### หลังเสร็จสิ้น:
- [ ] JSON ใหม่อยู่ที่ `goolaxy/public/cards.json`
- [ ] ภาพใหม่อยู่ที่ `goolaxy/images/card_*.*`
- [ ] ทดสอบเว็บไซต์ทำงานปกติ
- [ ] ไฟล์เดิมถูกสำรองไว้

## 🚨 ข้อควรระวัง

### 1. การสำรองข้อมูล
```bash
# สำรองก่อนทำอะไรเสมอ!
cp -r goolaxy/images goolaxy/backup/images_$(date +%Y%m%d)
cp goolaxy/public/cards.json goolaxy/backup/cards_$(date +%Y%m%d).json
```

### 2. การตรวจสอบ Path
```json
// ตรวจสอบใน JSON ว่า path ถูกต้อง
{
  "images": [
    {
      "uuid": "xxx",
      "url": "./images/card_001.png"  // ต้องขึ้นต้นด้วย ./images/
    }
  ]
}
```

### 3. การตรวจสอบไฟล์
```bash
# ตรวจสอบว่าภาพมีจริง
for img in goolaxy/images/card_*.png; do
    if [ ! -f "$img" ]; then
        echo "❌ ไม่พบไฟล์: $img"
    fi
done
```

## 🔄 ตัวอย่างการใช้งานจริง

### สถานการณ์: อัปเดต scene ใหม่
```bash
# 1. Export จาก Three.js Editor
# ได้ไฟล์: my_new_scene.json (50MB)

# 2. แยกภาพ
open goolaxy/extract-cards-simple.html
# ลาก my_new_scene.json เข้าไป
# ได้: my_new_scene_updated.json + ภาพ 45 ไฟล์

# 3. สำรองไฟล์เดิม
mkdir goolaxy/backup/20241022
cp goolaxy/public/cards.json goolaxy/backup/20241022/
cp -r goolaxy/images goolaxy/backup/20241022/

# 4. ล้างและย้ายไฟล์ใหม่
rm goolaxy/images/card_*.*
cp my_new_scene_updated.json goolaxy/public/cards.json
cp extracted_images/card_*.* goolaxy/images/

# 5. ทดสอบ
open goolaxy/index.html
```

## 📊 เปรียบเทียบก่อน-หลัง

| ขั้นตอน | ก่อน | หลัง |
|---------|------|------|
| ไฟล์ JSON | 50MB+ | 2-5MB |
| จำนวนภาพ | 0 (base64) | 45 ไฟล์ |
| เวลาโหลด | 10+ วินาที | 1-2 วินาที |
| การจัดการ | ยาก | ง่าย |

## 🎯 Tips สำหรับครั้งต่อไป

1. **ตั้งชื่อไฟล์ให้ดี**: `scene_v2_20241022.json`
2. **สำรองเสมอ**: ก่อนลบไฟล์เดิม
3. **ทดสอบก่อน**: ใช้โฟลเดอร์ temp ก่อน
4. **เก็บ mapping**: สำหรับ debug ภายหลัง
5. **ใช้ version control**: Git สำหรับไฟล์สำคัญ

## 🔧 เครื่องมือที่แนะนำ

- **แยกภาพ**: `extract-cards-simple.html`
- **สำรอง**: `rsync` หรือ `cp -r`
- **ทดสอบ**: Live Server หรือ Python HTTP server
- **จัดการ**: File manager หรือ command line

---

**💡 หมายเหตุ: เก็บไฟล์นี้ไว้เป็นคู่มืออ้างอิงสำหรับการอัปเดต scene ครั้งต่อไป**