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
    
    // Initial safe dimensions
    let width = container.clientWidth || window.innerWidth || 1200;
    let height = container.clientHeight || 340;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 7, 30);
    camera.lookAt(0, 0, 0);

    // RENDERER
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // GENERATE SOFT GLOW TEXTURE
    const createGlowTexture = () => {
      const pCanvas = document.createElement('canvas');
      pCanvas.width = 64;
      pCanvas.height = 64;
      const ctx = pCanvas.getContext('2d')!;
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.25, 'rgba(110, 231, 183, 0.9)');
      grad.addColorStop(0.6, 'rgba(16, 185, 129, 0.4)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(32, 32, 32, 0, Math.PI * 2);
      ctx.fill();
      const tex = new THREE.CanvasTexture(pCanvas);
      tex.needsUpdate = true;
      return tex;
    };

    const texture = createGlowTexture();

    // 1. PARTICLES WAVE FIELD (Cyan Baseline -> Emerald Decision Premium)
    const cols = 70;
    const rows = 30;
    const count = cols * rows;

    const waveGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const baseCoords = new Float32Array(count * 2);

    const colorCyan = new THREE.Color(0x38bdf8);
    const colorEmerald = new THREE.Color(0x34d399);
    const colorDeep = new THREE.Color(0x0f766e);

    let idx = 0;
    for (let i = 0; i < cols; i++) {
      const u = (i / (cols - 1) - 0.5) * 85;
      for (let j = 0; j < rows; j++) {
        const v = (j / (rows - 1) - 0.5) * 32;

        positions[idx * 3] = u;
        positions[idx * 3 + 1] = 0;
        positions[idx * 3 + 2] = v;

        baseCoords[idx * 2] = u;
        baseCoords[idx * 2 + 1] = v;

        // Gradient: Left = Cyan Baseline, Right = Emerald Winning Branch
        const factor = Math.min(Math.max((u + 35) / 70, 0), 1);
        const c = colorCyan.clone().lerp(colorEmerald, factor);
        if (Math.abs(v) > 10) {
          c.lerp(colorDeep, 0.4);
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
      size: 2.2,
      vertexColors: true,
      map: texture,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const wavePoints = new THREE.Points(waveGeo, waveMat);
    scene.add(wavePoints);

    // 2. ETHEREAL GUIDING SPLINE LINES (Two flowing vectors through space)
    const lineGroup = new THREE.Group();
    scene.add(lineGroup);

    const createSplineLine = (points: THREE.Vector3[], hexColor: number) => {
      const curve = new THREE.CatmullRomCurve3(points);
      const curvePoints = curve.getPoints(90);
      const geo = new THREE.BufferGeometry().setFromPoints(curvePoints);
      const mat = new THREE.LineBasicMaterial({
        color: hexColor,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
      });
      return new THREE.Line(geo, mat);
    };

    // Cyan baseline spline
    const lineCyan = createSplineLine(
      [
        new THREE.Vector3(-42, -1, -8),
        new THREE.Vector3(-20, 0, -3),
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(20, -1, 3),
        new THREE.Vector3(42, -2, 6),
      ],
      0x38bdf8
    );
    lineGroup.add(lineCyan);

    // Emerald winning delta spline
    const lineEmerald = createSplineLine(
      [
        new THREE.Vector3(-42, -1, -8),
        new THREE.Vector3(-20, 0, -3),
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(20, 4, 3),
        new THREE.Vector3(42, 6.5, 6),
      ],
      0x34d399
    );
    lineGroup.add(lineEmerald);

    // 3. CELESTIAL AMBIENT PARTICLES
    const dustCount = 70;
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    const dustSpeeds = new Float32Array(dustCount);

    for (let i = 0; i < dustCount; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 80;
      dustPositions[i * 3 + 1] = Math.random() * 12 - 2;
      dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 35;
      dustSpeeds[i] = 0.006 + Math.random() * 0.012;
    }

    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      size: 1.5,
      color: 0x67e8f9,
      map: texture,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const dustPoints = new THREE.Points(dustGeo, dustMat);
    scene.add(dustPoints);

    // MOUSE PARALLAX
    let targetX = 0;
    let targetY = 7;
    let mouseNormX = 0;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseNormX = nx;
      targetX = nx * 5;
      targetY = ny * 2.5 + 7;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    // RESIZE OBSERVER (Guarantees accurate size as layout settles)
    const updateSize = (w: number, h: number) => {
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    };

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: rw, height: rh } = entry.contentRect;
        updateSize(rw, rh);
      }
    });

    resizeObserver.observe(container);

    // Double-check dimensions after mount
    setTimeout(() => {
      if (container) {
        updateSize(container.clientWidth, container.clientHeight);
      }
    }, 50);

    // ANIMATION LOOP
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const t = clock.getElapsedTime();

      // Camera lerp
      camera.position.x += (targetX - camera.position.x) * 0.04;
      camera.position.y += (targetY - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      if (!prefersReducedMotion) {
        // Dynamic Wave Simulation
        const posArr = waveGeo.attributes.position.array as Float32Array;

        for (let i = 0; i < count; i++) {
          const u = baseCoords[i * 2];
          const v = baseCoords[i * 2 + 1];

          const wave1 = Math.sin(u * 0.12 + t * 1.1) * Math.cos(v * 0.14 + t * 0.7) * 2.2;
          const divergence = u > 0 ? (u / 30) * 1.5 * Math.sin(t * 1.4 + u * 0.08) : 0;
          const distToMouse = Math.abs(u - mouseNormX * 30);
          const mouseRipple = distToMouse < 12 ? Math.sin((12 - distToMouse) * 0.4) * 0.9 : 0;

          posArr[i * 3 + 1] = wave1 + divergence + mouseRipple;
        }

        waveGeo.attributes.position.needsUpdate = true;

        // Dust drift
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
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', handlePointerMove);

      waveGeo.dispose();
      waveMat.dispose();
      lineCyan.geometry.dispose();
      (lineCyan.material as THREE.Material).dispose();
      lineEmerald.geometry.dispose();
      (lineEmerald.material as THREE.Material).dispose();
      dustGeo.dispose();
      dustMat.dispose();
      texture.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden z-0"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
      {/* Subtle top & bottom soft gradient fade for seamless integration */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-transparent to-transparent pointer-events-none" />
    </div>
  );
};
