import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function FloatingShapes() {
  const groupRef = useRef<THREE.Group>(null);

  const shapes = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => ({
      position: [
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 10 - 5,
      ] as [number, number, number],
      scale: 0.3 + Math.random() * 0.9,
      speed: 0.1 + Math.random() * 0.2,
      type: i % 3,
    }));
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.children.forEach((child, i) => {
      const s = shapes[i];
      child.position.y += Math.sin(t * s.speed + i) * 0.002;
      child.rotation.x += 0.001 * (i % 2 === 0 ? 1 : -1);
      child.rotation.y += 0.0015;
    });
    groupRef.current.rotation.y = state.pointer.x * 0.05;
    groupRef.current.rotation.x = state.pointer.y * 0.03;
  });

  return (
    <group ref={groupRef}>
      {shapes.map((s, i) => (
        <mesh key={i} position={s.position} scale={s.scale}>
          {s.type === 0 && <icosahedronGeometry args={[1, 0]} />}
          {s.type === 1 && <octahedronGeometry args={[1, 0]} />}
          {s.type === 2 && <torusGeometry args={[0.8, 0.25, 8, 24]} />}
          <meshStandardMaterial
            color={i % 2 === 0 ? '#c8a951' : '#00a651'}
            metalness={0.7}
            roughness={0.25}
            transparent
            opacity={0.18}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function SceneBackground() {
  return (
    <div className="canvas-bg">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={0.8} color="#c8a951" />
        <pointLight position={[-10, -10, -5]} intensity={0.5} color="#00a651" />
        <FloatingShapes />
      </Canvas>
    </div>
  );
}
