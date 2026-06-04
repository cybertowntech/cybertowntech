import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Icosahedron, TorusKnot, Octahedron } from "@react-three/drei";
import { Suspense, useRef } from "react";
import type { Mesh } from "three";

function Shape({ position, geometry, scale = 1, speed = 1, color = "#B0A89F" }: {
  position: [number, number, number];
  geometry: "ico" | "torus" | "octa";
  scale?: number;
  speed?: number;
  color?: string;
}) {
  const ref = useRef<Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.x = state.clock.elapsedTime * 0.15 * speed;
    ref.current.rotation.y = state.clock.elapsedTime * 0.2 * speed;
  });
  const material = (
    <meshStandardMaterial
      color={color}
      metalness={0.6}
      roughness={0.25}
      emissive={color}
      emissiveIntensity={0.15}
      wireframe={false}
    />
  );
  return (
    <Float speed={1.4} rotationIntensity={0.4} floatIntensity={1.2}>
      <mesh ref={ref} position={position} scale={scale}>
        {geometry === "ico" && <icosahedronGeometry args={[1, 0]} />}
        {geometry === "torus" && <torusKnotGeometry args={[0.7, 0.22, 100, 16]} />}
        {geometry === "octa" && <octahedronGeometry args={[1, 0]} />}
        {material}
      </mesh>
      <mesh position={position} scale={scale * 1.001}>
        {geometry === "ico" && <icosahedronGeometry args={[1, 0]} />}
        {geometry === "torus" && <torusKnotGeometry args={[0.7, 0.22, 100, 16]} />}
        {geometry === "octa" && <octahedronGeometry args={[1, 0]} />}
        <meshBasicMaterial color="#D9D3CE" wireframe transparent opacity={0.25} />
      </mesh>
    </Float>
  );
}

function Scene() {
  const group = useRef<any>(null);
  useFrame(({ mouse }) => {
    if (!group.current) return;
    group.current.rotation.y += (mouse.x * 0.3 - group.current.rotation.y) * 0.04;
    group.current.rotation.x += (-mouse.y * 0.2 - group.current.rotation.x) * 0.04;
  });
  return (
    <group ref={group}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} color="#F2EDE8" />
      <pointLight position={[-5, -3, -2]} intensity={1.5} color="#B0A89F" />
      <Shape position={[-3.2, 1.4, -1]} geometry="ico" scale={1.1} speed={0.8} />
      <Shape position={[3.4, -0.8, -2]} geometry="torus" scale={0.9} speed={1.2} color="#D9D3CE" />
      <Shape position={[0, 2.2, -3]} geometry="octa" scale={0.7} speed={1.5} />
      <Shape position={[-2, -1.8, -2]} geometry="torus" scale={0.5} speed={1.8} color="#B0A89F" />
      <Shape position={[2.5, 1.8, -3]} geometry="ico" scale={0.6} speed={1.1} color="#D9D3CE" />
    </group>
  );
}

export default function Hero3D() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 55 }}
      dpr={[1, 1.6]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </Canvas>
  );
}
