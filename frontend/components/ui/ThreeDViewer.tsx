"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Stars,
  Environment,
  Float,
  Sphere,
  Torus,
  Icosahedron,
  MeshDistortMaterial,
  PointMaterial,
  Points,
} from "@react-three/drei";
import { useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { RotateCw, Eye } from "lucide-react";

export type ModelType =
  | "sphere"
  | "torus"
  | "icosahedron"
  | "atom"
  | "solar_system"
  | "dna";

interface ThreeDViewerProps {
  modelType?: ModelType;
}

// -----------------------------------------------------
// 1. Atom Model (Chemistry / Physics)
// -----------------------------------------------------
function AtomModel({ wireframe }: { wireframe: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.5;
      groupRef.current.rotation.x =
        Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Nucleus */}
      <Sphere args={[0.4, 32, 32]}>
        <meshStandardMaterial
          color="#ef4444"
          wireframe={wireframe}
          roughness={0.2}
          metalness={0.8}
          emissive="#ef4444"
          emissiveIntensity={0.5}
        />
      </Sphere>

      {/* Electron Orbits */}
      <Torus args={[1.5, 0.02, 16, 100]} rotation={[Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color="#3b82f6" wireframe={wireframe} />
      </Torus>
      <Torus
        args={[1.5, 0.02, 16, 100]}
        rotation={[Math.PI / 2, Math.PI / 3, 0]}
      >
        <meshBasicMaterial color="#3b82f6" wireframe={wireframe} />
      </Torus>
      <Torus
        args={[1.5, 0.02, 16, 100]}
        rotation={[Math.PI / 2, -Math.PI / 3, 0]}
      >
        <meshBasicMaterial color="#3b82f6" wireframe={wireframe} />
      </Torus>

      {/* Electrons */}
      <Float speed={5} rotationIntensity={0} floatIntensity={0}>
        <Sphere args={[0.1, 16, 16]} position={[1.5, 0, 0]}>
          <meshStandardMaterial
            color="#60a5fa"
            emissive="#60a5fa"
            emissiveIntensity={2}
          />
        </Sphere>
      </Float>
      <Float speed={6} rotationIntensity={0} floatIntensity={0}>
        <Sphere args={[0.1, 16, 16]} position={[-0.75, 1.3, 0]}>
          <meshStandardMaterial
            color="#60a5fa"
            emissive="#60a5fa"
            emissiveIntensity={2}
          />
        </Sphere>
      </Float>
      <Float speed={4} rotationIntensity={0} floatIntensity={0}>
        <Sphere args={[0.1, 16, 16]} position={[-0.75, -1.3, 0]}>
          <meshStandardMaterial
            color="#60a5fa"
            emissive="#60a5fa"
            emissiveIntensity={2}
          />
        </Sphere>
      </Float>
    </group>
  );
}

// -----------------------------------------------------
// 2. Solar System Model (Astronomy)
// -----------------------------------------------------
function SolarSystemModel({ wireframe }: { wireframe: boolean }) {
  const sunRef = useRef<THREE.Mesh>(null);
  const earthGroup = useRef<THREE.Group>(null);
  const marsGroup = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (sunRef.current) sunRef.current.rotation.y = t * 0.1;
    if (earthGroup.current) earthGroup.current.rotation.y = t * 0.5; // Earth orbit
    if (marsGroup.current) marsGroup.current.rotation.y = t * 0.3; // Mars orbit
  });

  return (
    <group>
      {/* Sun */}
      <Sphere ref={sunRef} args={[0.8, 32, 32]}>
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#f59e0b"
          emissiveIntensity={1.5}
          wireframe={wireframe}
        />
      </Sphere>

      {/* Earth System */}
      <group ref={earthGroup}>
        <Sphere args={[0.2, 32, 32]} position={[2, 0, 0]}>
          <meshStandardMaterial
            color="#3b82f6"
            wireframe={wireframe}
            roughness={0.4}
          />
        </Sphere>
        {/* Moon */}
        <Sphere args={[0.05, 16, 16]} position={[2.3, 0.1, 0]}>
          <meshStandardMaterial color="#cbd5e1" wireframe={wireframe} />
        </Sphere>
        {/* Orbit Path */}
        <Torus args={[2, 0.005, 16, 100]} rotation={[Math.PI / 2, 0, 0]}>
          <meshBasicMaterial color="#ffffff" transparent opacity={0.2} />
        </Torus>
      </group>

      {/* Mars System */}
      <group ref={marsGroup}>
        <Sphere args={[0.15, 32, 32]} position={[3, 0, 0]}>
          <meshStandardMaterial
            color="#ef4444"
            wireframe={wireframe}
            roughness={0.6}
          />
        </Sphere>
        {/* Orbit Path */}
        <Torus args={[3, 0.005, 16, 100]} rotation={[Math.PI / 2, 0, 0]}>
          <meshBasicMaterial color="#ffffff" transparent opacity={0.2} />
        </Torus>
      </group>
    </group>
  );
}

// -----------------------------------------------------
// 3. DNA Helix Model (Biology)
// -----------------------------------------------------
function DNAModel({ wireframe }: { wireframe: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  const particles = useMemo(() => {
    const pts = [];
    const color = new THREE.Color();
    const colors = [];
    for (let i = 0; i < 60; i++) {
      const t = (i / 60) * Math.PI * 4; // 2 loops
      const x1 = Math.cos(t) * 0.5;
      const z1 = Math.sin(t) * 0.5;
      const y = (i / 60) * 4 - 2;

      // Strand 1
      pts.push(x1, y, z1);
      color.setHex(0x3b82f6); // Blue
      colors.push(color.r, color.g, color.b);

      // Strand 2
      pts.push(-x1, y, -z1);
      color.setHex(0xa855f7); // Purple
      colors.push(color.r, color.g, color.b);

      // Connectors (every 3rd step)
      if (i % 3 === 0) {
        pts.push(0, y, 0); // midpoint (simplified connector)
        color.setHex(0xffffff);
        colors.push(color.r, color.g, color.b);
      }
    }
    return {
      positions: new Float32Array(pts),
      colors: new Float32Array(colors),
    };
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.5;
      groupRef.current.rotation.z =
        Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      <Points>
        <bufferGeometry>
          <bufferAttribute
            args={[particles.positions, 3]}
            attach="attributes-position"
            count={particles.positions.length / 3}
            array={particles.positions}
            itemSize={3}
          />
          <bufferAttribute
            args={[particles.colors, 3]}
            attach="attributes-color"
            count={particles.colors.length / 3}
            array={particles.colors}
            itemSize={3}
          />
        </bufferGeometry>
        <PointMaterial
          size={0.1}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.8}
        />
      </Points>
      {/* Visual aid for wireframe mode (DNA doesn't have a good solid wireframe, so we use a bounding box) */}
      {wireframe && (
        <mesh>
          <cylinderGeometry args={[0.6, 0.6, 4.5, 16]} />
          <meshBasicMaterial
            color="#ffffff"
            wireframe
            transparent
            opacity={0.1}
          />
        </mesh>
      )}
    </group>
  );
}

// -----------------------------------------------------
// Basic Geometry Models
// -----------------------------------------------------
function BasicModel({ type, wireframe }: { type: string; wireframe: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  if (type === "torus") {
    return (
      <Float speed={2} rotationIntensity={1} floatIntensity={1.5}>
        <Torus ref={meshRef} args={[1.4, 0.4, 32, 100]}>
          <meshStandardMaterial
            color="#06b6d4"
            wireframe={wireframe}
            roughness={0.1}
            metalness={0.9}
          />
        </Torus>
      </Float>
    );
  }

  if (type === "icosahedron") {
    return (
      <Float speed={2} rotationIntensity={1.5} floatIntensity={1.5}>
        <Icosahedron ref={meshRef} args={[1.5, 0]}>
          <meshStandardMaterial
            color="#8b5cf6"
            wireframe={wireframe}
            roughness={0.2}
            metalness={0.8}
          />
        </Icosahedron>
      </Float>
    );
  }

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <Sphere ref={meshRef} args={[1.5, 64, 64]}>
        <MeshDistortMaterial
          color="#3b82f6"
          wireframe={wireframe}
          distort={0.4}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  );
}

// -----------------------------------------------------
// Main Viewer Component
// -----------------------------------------------------
export function ThreeDViewer({ modelType = "sphere" }: ThreeDViewerProps) {
  const [wireframe, setWireframe] = useState(false);
  const [currentShape, setCurrentShape] = useState<ModelType>(modelType);
  const [autoRotate, setAutoRotate] = useState(true);

  const renderModel = () => {
    switch (currentShape) {
      case "atom":
        return <AtomModel wireframe={wireframe} />;
      case "solar_system":
        return <SolarSystemModel wireframe={wireframe} />;
      case "dna":
        return <DNAModel wireframe={wireframe} />;
      default:
        return <BasicModel type={currentShape} wireframe={wireframe} />;
    }
  };

  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing group bg-linear-to-br from-slate-900 to-black rounded-xl overflow-hidden">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1.2} />
        <Environment preset="city" />
        <Stars
          radius={100}
          depth={50}
          count={4000}
          factor={4}
          saturation={0}
          fade
          speed={1}
        />

        {renderModel()}

        <OrbitControls
          enableZoom={true}
          enablePan={false}
          autoRotate={autoRotate}
          autoRotateSpeed={1.5}
        />
      </Canvas>

      {/* Control overlay */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 opacity-90 group-hover:opacity-100 transition-opacity z-10 text-xs text-white">
        <button
          onClick={() => setWireframe(!wireframe)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-medium transition-all ${wireframe ? "bg-blue-600 text-white" : "hover:bg-white/10"}`}
        >
          <Eye className="w-3.5 h-3.5" />
          {wireframe ? "Khung dây" : "Bề mặt"}
        </button>

        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-medium transition-all ${autoRotate ? "bg-cyan-600 text-white" : "hover:bg-white/10"}`}
        >
          <RotateCw className="w-3.5 h-3.5" />
          {autoRotate ? "Tự xoay" : "Dừng"}
        </button>
      </div>

      {/* Shape quick selector (Optional: you can hide this if you only want to display the modelType passed in props) */}
      <div className="absolute bottom-4 left-4 flex flex-wrap max-w-[80%] items-center gap-1.5 bg-black/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 z-10">
        {(["atom", "solar_system", "dna", "icosahedron"] as ModelType[]).map(
          (shape) => (
            <button
              key={shape}
              onClick={() => setCurrentShape(shape)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                currentShape === shape
                  ? "bg-linear-to-r from-blue-600 to-cyan-500 text-white shadow-sm"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              {shape === "atom"
                ? "Nguyên tử"
                : shape === "solar_system"
                  ? "Hệ mặt trời"
                  : shape === "dna"
                    ? "DNA"
                    : "Khối Hình học"}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
