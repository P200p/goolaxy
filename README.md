# 🌐 Goolaxy - 3D Web Portal

Interactive 3D web experience with card gallery and iframe cube portal.

## 📁 Project Structure

```
goolaxy/
├── index.html          # 🎴 Main cards gallery page
├── cube.html           # 🌐 3D Web Portal with iframe cube
├── src/
│   ├── main.js         # Cards gallery logic
│   └── cube-main.js    # 3D cube portal logic
├── public/
│   ├── cards.json      # Cards data
│   └── images/         # Card images
└── file/
    └── cards_updated.json  # Updated cards data
```

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open in browser:**
   - Cards Gallery: http://localhost:5173/
   - 3D Web Portal: http://localhost:5173/cube.html

## 🎯 Features

### 🎴 Cards Gallery (index.html)
- Interactive 3D card display
- Hover effects and animations
- Click to open website links
- Navigate to 3D Web Portal

### 🌐 3D Web Portal (cube.html)
- Live website iframes on cube faces
- Smooth touch interactions
- GPU-accelerated rendering
- Auto-rotating cube with manual controls

## 🌐 Websites in Cube
- **GOONEE**: https://goonee.netlify.app/
- **SHARKKADAW**: https://sharkkadaw.netlify.app/
- **GOONEE LAB**: https://goonee.netlify.app/lab
- **GOOMETA**: https://goometa.figma.site/

## 🛠️ Technologies
- Three.js (WebGL + CSS3D)
- Vite (Development server)
- Modern JavaScript (ES6+)