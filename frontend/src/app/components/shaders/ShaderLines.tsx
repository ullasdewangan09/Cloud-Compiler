import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ShaderLinesProps {
  color1?: string;
  color2?: string;
  count?: number;
  speed?: number;
}

export const ShaderLines: React.FC<ShaderLinesProps> = ({
  color1 = '#00d1ff', // Machina Cyan
  color2 = '#ff9500', // Machina Amber
  count = 80,
  speed = 0.5,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 20;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 6); // 2 points per line
    const colors = new Float32Array(count * 6);
    const sizes = new Float32Array(count);
    const velocities = new Float32Array(count);

    const c1 = new THREE.Color(color1);
    const c2 = new THREE.Color(color2);

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 60;
      const y = (Math.random() - 0.5) * 40;
      const z = (Math.random() - 0.5) * 10;

      const length = Math.random() * 5 + 2;
      
      // Point A
      positions[i * 6] = x;
      positions[i * 6 + 1] = y;
      positions[i * 6 + 2] = z;
      
      // Point B
      positions[i * 6 + 3] = x;
      positions[i * 6 + 4] = y + length;
      positions[i * 6 + 5] = z;

      const mixedColor = c1.clone().lerp(c2, Math.random());
      colors[i * 6] = mixedColor.r;
      colors[i * 6 + 1] = mixedColor.g;
      colors[i * 6 + 2] = mixedColor.b;
      colors[i * 6 + 3] = mixedColor.r;
      colors[i * 6 + 4] = mixedColor.g;
      colors[i * 6 + 5] = mixedColor.b;

      velocities[i] = (Math.random() * 0.1 + 0.05) * speed;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
    });

    const lines = new THREE.LineSegments(geometry, material);
    scene.add(lines);

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const posAttr = geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < count; i++) {
        // Scroll points up
        posAttr.array[i * 6 + 1] += velocities[i];
        posAttr.array[i * 6 + 4] += velocities[i];

        // Reset if off top
        if (posAttr.array[i * 6 + 1] > 25) {
          const length = (posAttr.array[i * 6 + 4] - posAttr.array[i * 6 + 1]);
          posAttr.array[i * 6 + 1] = -25;
          posAttr.array[i * 6 + 4] = -25 + length;
        }
      }
      posAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      container.removeChild(renderer.domElement);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [color1, color2, count, speed]);

  return <div ref={containerRef} className="absolute inset-0 z-0 pointer-events-none opacity-40" />;
};
