---
name: creative-web-motion-webgl
description: Master-level engineering for Core Modern Frontend (HTML5, Modern CSS, ESNext), GreenSock (GSAP), ScrollTrigger scroll-driven visual storytelling, Framer Motion reactive transitions & gestures, and WebGL / Three.js 3D immersive graphics and shaders.
---

# Creative Web Motion & WebGL 3D Engineering

This skill equips agents with expert mastery in architecting high-performance, visually breathtaking web experiences combining **Core Frontend Fundamentals**, **GSAP & ScrollTrigger**, **Framer Motion**, and **WebGL / Three.js / React Three Fiber**.

---

## 🏛️ 1. Core Frontend Foundation (HTML5, CSS & Modern JS)

### Modern CSS Layout & Styling Standards
- **Modern Layout Engines**: Leverage CSS Grid with `subgrid`, Flexbox gap layouts, and Container Queries (`@container`) for element-responsive modularity rather than brittle viewport media queries.
- **Fluid Typography & Spacing**: Use `clamp()` and CSS Custom Properties for seamless multi-resolution scaling without layout jumps:
  ```css
  :root {
    --fluid-heading: clamp(2rem, 5vw + 1rem, 4.5rem);
    --surface-glass: rgba(10, 26, 20, 0.75);
    --border-subtle: rgba(255, 255, 255, 0.08);
  }
  ```
- **Hardware Acceleration**: Animate strictly composited properties (`transform` and `opacity`). Avoid animating `top`, `left`, `margin`, `width`, `height`, or `box-shadow` which trigger expensive layout recalculations (Reflow) and Paint cycles.
- **Will-Change Management**: Apply `will-change: transform, opacity` dynamically during animation phases, and remove it on complete to avoid memory bloat.

---

## 🎬 2. GreenSock Animation Platform (GSAP) & ScrollTrigger

### Core GSAP Architecture & React Integration
- **Context Isolation (`gsap.context()`)**: ALWAYS scope GSAP animations within `gsap.context()` in React (`useLayoutEffect` / `useEffect`) to ensure clean garbage collection and prevent duplicate listeners upon remount.
  ```typescript
  import { useLayoutEffect, useRef } from 'react';
  import gsap from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';

  gsap.registerPlugin(ScrollTrigger);

  export const HeroShowcase = () => {
    const rootRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
      const ctx = gsap.context(() => {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 1 } });
        tl.from('.hero-badge', { y: -30, opacity: 0 })
          .from('.hero-title', { y: 50, opacity: 0, stagger: 0.1 }, '-=0.6')
          .from('.hero-visual', { scale: 0.9, opacity: 0, ease: 'back.out(1.7)' }, '-=0.4');
      }, rootRef);

      return () => ctx.revert(); // Mandatory cleanup
    }, []);

    return <div ref={rootRef}>...</div>;
  };
  ```

### ScrollTrigger Mastery
- **Pinning & Scrubbing**: Link timeline progress directly to scroll position with smooth damping:
  ```typescript
  gsap.timeline({
    scrollTrigger: {
      trigger: '.product-container',
      start: 'top top',
      end: '+=2000',
      pin: true,
      scrub: 1.2, // Smooth interpolation
      anticipatePin: 1,
      invalidateOnRefresh: true,
    }
  })
  .to('.product-3d-model', { rotateY: 180, scale: 1.2 })
  .to('.feature-card-1', { opacity: 1, x: 0 })
  .to('.feature-card-2', { opacity: 1, x: 0 });
  ```
- **Batch Triggers**: Efficiently animate long grid lists using `ScrollTrigger.batch()` to prevent thousands of independent scroll observers.

---

## 🌀 3. Framer Motion (React Transitions, Layouts & Gestures)

### Shared Element Morphs (`layoutId`) & AnimatePresence
- Use `layoutId` for smooth layout transitions between list and expanded modal views:
  ```tsx
  import { motion, AnimatePresence } from 'framer-motion';

  export const ProductCard = ({ item, isSelected, onSelect }: Props) => (
    <motion.div
      layoutId={`card-container-${item.id}`}
      onClick={onSelect}
      className="glassmorphic-card"
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
    >
      <motion.img layoutId={`card-image-${item.id}`} src={item.imageUrl} />
      <motion.h3 layoutId={`card-title-${item.id}`}>{item.name}</motion.h3>
    </motion.div>
  );
  ```

### Gesture Interactions & Spring Physics
- Prefer spring-based physics (`stiffness`, `damping`, `mass`) over arbitrary cubic-bezier timing functions for natural tactile responses.
- Combine `useScroll()` and `useTransform()` for lightweight parallax effects without full GSAP dependencies when doing simple React component animations.

---

## 🌌 4. WebGL, Three.js & React Three Fiber (R3F)

### Scene Architecture & 60+ FPS Optimization
- **React Three Fiber Setup**:
  ```tsx
  import { Canvas, useFrame } from '@react-three/fiber';
  import { Float, MeshDistortMaterial, Sphere } from '@react-three/drei';
  import * as THREE from 'three';

  const AnimatedSaltOrb = () => {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state, delta) => {
      if (meshRef.current) {
        meshRef.current.rotation.x += delta * 0.2;
        meshRef.current.rotation.y += delta * 0.3;
      }
    });

    return (
      <Float speed={2} rotationIntensity={1} floatIntensity={2}>
        <Sphere ref={meshRef} args={[1, 64, 64]}>
          <MeshDistortMaterial
            color="#006C4C"
            emissive="#0A3A28"
            roughness={0.2}
            metalness={0.8}
            distort={0.4}
            speed={2}
          />
        </Sphere>
      </Float>
    );
  };
  ```

### Memory Lifecycle & Disposal (Zero WebGL Context Loss)
- **Mandatory Disposal**: In raw Three.js or custom components, ALWAYS dispose geometries, materials, and textures when removing objects:
  ```typescript
  geometry.dispose();
  material.dispose();
  texture.dispose();
  renderer.dispose();
  ```
- **InstancedMesh for Heavy Elements**: When rendering thousands of particles or salt crystal geometries, use `THREE.InstancedMesh` instead of creating thousands of individual `THREE.Mesh` instances to keep draw calls below 50.

### Custom Shaders (GLSL)
- Implement custom Vertex & Fragment shaders for fluid waves, particle noise, and chromatic aberration effects.

---

## ⚡ 5. Cross-Platform Orchestration & Accessibility

### Synergy: Three.js Background + GSAP ScrollTrigger + Framer Motion UI
1. **Background Layer**: Three.js `<Canvas>` running WebGL shader particles / 3D models with canvas render loop.
2. **Scroll Bridge**: GSAP ScrollTrigger updates camera position (`camera.position.z`) and model rotations based on user scroll offset.
3. **Interactive UI Layer**: Framer Motion handles overlays, cards, text reveals, modals, and cursor magnetic hover states.

### Accessibility (`prefers-reduced-motion`)
- **ALWAYS** check user motion preferences:
  ```typescript
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    // Fallback to instant cuts or simple opacity fades
  }
  ```
