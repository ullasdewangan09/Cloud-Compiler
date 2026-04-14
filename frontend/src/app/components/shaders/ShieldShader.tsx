import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const HexGrid = () => {
  const meshRef = useRef<THREE.Points>(null);
  const { viewport, mouse } = useThree();

  const count = 40;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * count * 3);
    for (let i = 0; i < count; i++) {
      for (let j = 0; j < count; j++) {
        const x = (i - count / 2) * 1.5 + (j % 2 === 0 ? 0 : 0.75);
        const y = (j - count / 2) * 1.3;
        pos[(i * count + j) * 3] = x;
        pos[(i * count + j) * 3 + 1] = y;
        pos[(i * count + j) * 3 + 2] = 0;
      }
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();
    const pos = meshRef.current.geometry.attributes.position;
    
    for (let i = 0; i < count * count; i++) {
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      
      // Calculate distance from mouse (in normalized coordinates)
      // Transform mouse -1 to 1 to viewport coordinates
      const mx = (mouse.x * viewport.width) / 2;
      const my = (mouse.y * viewport.height) / 2;
      const dx = x - mx;
      const dy = y - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Wave effect + mouse reactivity
      const wave = Math.sin(x * 0.5 + time) * 0.2 + Math.cos(y * 0.5 + time) * 0.2;
      const mouseEffect = Math.max(0, 1.5 - dist * 0.5) * 0.5;
      
      pos.array[i * 3 + 2] = wave + mouseEffect;
    }
    pos.needsUpdate = true;
    
    meshRef.current.rotation.z = time * 0.05;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#ff9500"
        transparent
        opacity={0.5}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
};

export const ShieldShader: React.FC = () => {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none opacity-30 bg-[#0a0a0a]">
      <Canvas camera={{ position: [0, 0, 15], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <HexGrid />
      </Canvas>
    </div>
  );
};
