import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const FutarchyHero3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // SCENE & CAMERA
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      55,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 8, 32);
    camera.lookAt(0, 0, 0);

    // RENDERER
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // PARTICLE TEXTURE GENERATOR (Soft Gaussian glow)
    const createGlowTexture = () => {
      const pCanvas = document.createElement('canvas');
      pCanvas.width = 64;
      pCanvas.height = 64;
      const ctx = pCanvas.getContext('2d')!;
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.2, 'rgba(110, 231, 183, 0.85)');
      grad.addColorStop(0.55, 'rgba(16, 185, 129, 0.35)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(32, 32, 32, 0, Math.PI * 2);
      ctx.fill();
      return new THREE.CanvasTexture(pCanvas);
    };

    const texture = createGlowTexture();

    // 1. DUAL WAVE RIBBONS (Futarchy Timelines: Baseline Cyan vs Proposal Emerald)
    const cols = 55;
    const rows = 28;
    const count = cols * rows;

    const waveGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const baseCoords = new Float32Array(count * 2); // original x, z

    const colorCyan = new THREE.Color(0x38bdf8); // Status Quo
    const colorEmerald = new THREE.Color(0x10b981); // Decision Premium
    const colorDeep = new THREE.Color(0x064e3b); // Shadow

    let idx = 0;
    for (let i = 0; i < cols; i++) {
      const u = (i / (cols - 1) - 0.5) * 56;
      for (let j = 0; j < rows; j++) {
        const v = (j / (rows - 1) - 0.5) * 28;

        positions[idx * 3] = u;
        positions[idx * 3 + 1] = 0;
        positions[idx * 3 + 2] = v;

        baseCoords[idx * 2] = u;
        baseCoords[idx * 2 + 1] = v;

        // Gradient: Left = Status Quo Cyan, Right = Winning Proposal Emerald
        const factor = Math.min(Math.max((u + 25) / 50, 0), 1);
        const c = colorCyan.clone().lerp(colorEmerald, factor);
        if (Math.abs(v) > 10) {
          c.lerp(colorDeep, 0.5);
        }

        colors[idx * 3] = c.r;
        colors[idx * 3 + 1] = c.g;
        colors[idx * 3 + 2] = c.b;

        idx++;
      }
    }

    waveGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    waveGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const waveMat = new THREE.PointsMaterial({
      size: 1.1,
      vertexColors: true,
      map: texture,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const wavePoints = new THREE.Points(waveGeo, waveMat);
    scene.add(wavePoints);

    // 2. CELESTIAL AMBIENT PARTICLES (Floating Data Quanta)
    const dustCount = 80;
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    const dustSpeeds = new Float32Array(dustCount);

    for (let i = 0; i < dustCount; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 60;
      dustPositions[i * 3 + 1] = Math.random() * 12 - 2;
      dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 30;
      dustSpeeds[i] = 0.005 + Math.random() * 0.01;
    }

    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));

    const dustMat = new THREE.PointsMaterial({
      size: 0.8,
      color: 0x67e8f9,
      map: texture,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const dustPoints = new THREE.Points(dustGeo, dustMat);
    scene.add(dustPoints);

    // INTERACTIVE MOUSE PARALLAX
    let targetX = 0;
    let targetY = 8;
    let mouseNormX = 0;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseNormX = nx;
      targetX = nx * 5;
      targetY = ny * 2.5 + 8;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // INTERSECTION OBSERVER
    let isVisible = true;
    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0].isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    // ANIMATION LOOP
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const t = clock.getElapsedTime();

      // Camera lerp
      camera.position.x += (targetX - camera.position.x) * 0.04;
      camera.position.y += (targetY - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      if (!prefersReducedMotion) {
        // Dynamic Wave Simulation: Dual Sine Waves symbolizing diverging timelines
        const posArr = waveGeo.attributes.position.array as Float32Array;

        for (let i = 0; i < count; i++) {
          const u = baseCoords[i * 2];
          const v = baseCoords[i * 2 + 1];

          // Wave equation: combination of baseline ripple and proposal surge
          const wave1 = Math.sin(u * 0.14 + t * 1.2) * Math.cos(v * 0.16 + t * 0.8) * 2.2;
          // Proposal divergence: right side (u > 0) surges higher (decision premium)
          const divergence = u > 0 ? (u / 25) * 1.6 * Math.sin(t * 1.5 + u * 0.1) : 0;
          // Mouse proximity ripple
          const distToMouse = Math.abs(u - mouseNormX * 25);
          const mouseRipple = distToMouse < 10 ? Math.sin((10 - distToMouse) * 0.5) * 0.8 : 0;

          posArr[i * 3 + 1] = wave1 + divergence + mouseRipple;
        }

        waveGeo.attributes.position.needsUpdate = true;

        // Animate floating dust
        const dustArr = dustGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < dustCount; i++) {
          dustArr[i * 3 + 1] += dustSpeeds[i];
          if (dustArr[i * 3 + 1] > 10) {
            dustArr[i * 3 + 1] = -2;
          }
        }
        dustGeo.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', handleResize);

      waveGeo.dispose();
      waveMat.dispose();
      dustGeo.dispose();
      dustMat.dispose();
      texture.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none -z-10 overflow-hidden"
      style={{
        maskImage:
          'radial-gradient(ellipse 75% 70% at 50% 45%, black 40%, transparent 95%)',
        WebkitMaskImage:
          'radial-gradient(ellipse 75% 70% at 50% 45%, black 40%, transparent 95%)',
      }}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
