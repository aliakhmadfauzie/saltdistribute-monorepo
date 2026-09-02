# 🌐 Creative Motion, GSAP, Framer Motion & WebGL 3D Prompts

This guide contains prompts specifically targeted at the **`creative-web-motion-webgl`** skill covering modern Core Frontend, GreenSock (GSAP), ScrollTrigger, Framer Motion, and WebGL / Three.js.

---

## 🎬 1. GSAP & ScrollTrigger Prompts

### Scroll-Driven Storytelling & Pinned Showcase
```text
Please use the 'creative-web-motion-webgl' skill to build a scroll-driven product showcase using GSAP and ScrollTrigger:
- Pin the central visual container for 2000px of scroll travel
- Scrub the 3D model rotation (rotateY: 360deg) and scale smoothly (scrub: 1.2)
- Fade and stagger in bullet point feature cards with 'power3.out' easing
- Ensure proper cleanup with gsap.context() on component unmount
```

### Complex Staggered Hero Section Entrance
```text
Using 'creative-web-motion-webgl', create an entrance timeline with GSAP:
- Animate split text typography (words sliding up from mask with 0.05s stagger)
- Parallax floating background particles with subtle continuous floating bobbing
- Magnetic cursor hover effect on the primary CTA button
```

---

## 🌀 2. Framer Motion Prompts

### Shared Element Layout Transitions (`layoutId`)
```text
Please use 'creative-web-motion-webgl' and Framer Motion to implement a shared element transition:
- When a user clicks a product card in the grid, expand the card smoothly into a full-screen detail view using layoutId
- Morph the product image, title, and badge with realistic spring physics (stiffness: 300, damping: 25)
- Include AnimatePresence for smooth exit transitions
```

### Drag & Swipe Gestures with Physics
```text
Use 'creative-web-motion-webgl' to build an interactive draggable bottom-sheet or swipeable order card using Framer Motion with drag constraints, elastic snap points, and velocity-based release physics.
```

---

## 🌌 3. WebGL & Three.js 3D Prompts

### 3D Interactive Mesh & Liquid Particle Canvas
```text
Using 'creative-web-motion-webgl', build a 3D WebGL hero background using Three.js / React Three Fiber:
- Render an interactive organic distorted sphere (MeshDistortMaterial) in Emerald theme (#006C4C)
- Add 500 floating salt crystal particles using THREE.InstancedMesh to maintain 60 FPS
- Mouse / touch interaction: the particles subtly disperse when the cursor moves near them
- Ensure proper memory disposal of geometries, materials, and textures on unmount
```

### Custom GLSL Shader Wave Effect
```text
Use 'creative-web-motion-webgl' to write a custom WebGL vertex & fragment shader creating a refractive liquid wave ripple effect on image hover.
```

---

## ⚡ 4. Full Tri-Stack Orchestration (Three.js + GSAP + Framer Motion)

### Immersive Multi-Layer Landing Experience
```text
Use 'creative-web-motion-webgl' to orchestrate a 3-layer landing page:
1. WebGL Layer (Background): Three.js canvas with an animated 3D Salt Crystal mesh that rotates on scroll.
2. Scroll Bridge: GSAP ScrollTrigger updates the Three.js camera position (camera.position.z) linked to page scroll.
3. UI Layer (Foreground): Framer Motion manages interactive glassmorphic cards, typography reveals, and modal popups.
4. Accessibility: Include full fallback with prefers-reduced-motion check.
```
