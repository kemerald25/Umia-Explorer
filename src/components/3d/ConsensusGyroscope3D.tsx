import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ConsensusGyroscope3DProps {
  isQuerying: boolean;
  isVerified: boolean;
  isFallback?: boolean;
}

export const ConsensusGyroscope3D: React.FC<ConsensusGyroscope3DProps> = ({
  isQuerying,
  isVerified,
  isFallback = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // SCENE & CAMERA
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.z = 11;

    // RENDERER
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // LIGHTS
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x34d399, 4, 20);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // GYROSCOPE RINGS
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Outer Ring: Base Network Sync Ring
    const outerGeo = new THREE.TorusGeometry(3.6, 0.08, 16, 80);
    const outerMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.8,
    });
    const outerRing = new THREE.Mesh(outerGeo, outerMat);
    rootGroup.add(outerRing);

    // Middle Ring: TWAP Ratio Clamp Ring
    const midGeo = new THREE.TorusGeometry(2.6, 0.07, 16, 70);
    const midMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.5,
      roughness: 0.3,
      metalness: 0.7,
    });
    const midRing = new THREE.Mesh(midGeo, midMat);
    rootGroup.add(midRing);

    // Inner Ring: Solvency Invariant Ring
    const innerGeo = new THREE.TorusGeometry(1.6, 0.06, 16, 60);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.7,
      roughness: 0.2,
      metalness: 0.9,
    });
    const innerRing = new THREE.Mesh(innerGeo, innerMat);
    rootGroup.add(innerRing);

    // Central Cryptographic Seed Node (Octahedron)
    const seedGeo = new THREE.OctahedronGeometry(0.7, 0);
    const seedMat = new THREE.MeshStandardMaterial({
      color: 0x34d399,
      emissive: 0x10b981,
      emissiveIntensity: 0.8,
      wireframe: true,
    });
    const seedNode = new THREE.Mesh(seedGeo, seedMat);
    rootGroup.add(seedNode);

    // ANIMATION LOOP
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (!prefersReducedMotion) {
        if (isQuerying) {
          // Rapid asynchronous tumbling when querying Base RPC
          outerRing.rotation.x += delta * 2.8;
          outerRing.rotation.y += delta * 1.6;

          midRing.rotation.y += delta * 3.4;
          midRing.rotation.z += delta * 2.1;

          innerRing.rotation.z += delta * 4.2;
          innerRing.rotation.x += delta * 2.5;

          seedNode.rotation.y += delta * 5.0;
        } else {
          // When verified: smoothly lerp into aligned coplanar lock with gentle floating
          const targetRotX = 0.2;
          const targetRotY = 0;
          const targetRotZ = 0;

          outerRing.rotation.x += (targetRotX - outerRing.rotation.x) * 0.08;
          outerRing.rotation.y += (targetRotY - outerRing.rotation.y) * 0.08;
          outerRing.rotation.z += (targetRotZ - outerRing.rotation.z) * 0.08;

          midRing.rotation.x += (targetRotX - midRing.rotation.x) * 0.08;
          midRing.rotation.y += (targetRotY - midRing.rotation.y) * 0.08;
          midRing.rotation.z += (targetRotZ - midRing.rotation.z) * 0.08;

          innerRing.rotation.x += (targetRotX - innerRing.rotation.x) * 0.08;
          innerRing.rotation.y += (targetRotY - innerRing.rotation.y) * 0.08;
          innerRing.rotation.z += (targetRotZ - innerRing.rotation.z) * 0.08;

          // Gentle ambient float
          rootGroup.rotation.y += 0.008;
          seedNode.rotation.y += 0.015;
        }

        // Color modulation
        if (isVerified) {
          const targetColor = isFallback ? 0xfbbf24 : 0x34d399;
          innerMat.color.setHex(targetColor);
          outerMat.color.setHex(0x38bdf8);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const size = Math.min(container.clientWidth, container.clientHeight);
      camera.aspect = 1;
      camera.updateProjectionMatrix();
      renderer.setSize(size, size);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      outerGeo.dispose();
      outerMat.dispose();
      midGeo.dispose();
      midMat.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      seedGeo.dispose();
      seedMat.dispose();
      renderer.dispose();
    };
  }, [isQuerying, isVerified, isFallback]);

  return (
    <div
      ref={containerRef}
      className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center shrink-0 mx-auto"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
      {/* Ambient Radial Glow */}
      <div
        className={`absolute inset-0 rounded-full blur-2xl pointer-events-none transition-opacity duration-700 ${
          isQuerying
            ? 'bg-sky-500/20 opacity-80 animate-pulse'
            : isVerified
            ? isFallback
              ? 'bg-amber-500/20 opacity-70'
              : 'bg-emerald-500/25 opacity-90'
            : 'opacity-0'
        }`}
      />
    </div>
  );
};
