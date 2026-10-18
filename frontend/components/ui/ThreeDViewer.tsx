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
  Box,
  Cylinder,
  MeshDistortMaterial,
} from "@react-three/drei";
import { useRef, useState, useMemo, useEffect } from "react";
import * as THREE from "three";
import { RotateCw, Eye, Sparkles, Layers, Compass, HelpCircle } from "lucide-react";

export type ModelType =
  | "sphere"
  | "torus"
  | "icosahedron"
  | "atom"
  | "solar_system"
  | "dna"
  | "molecule_h2o"
  | "plant_cell"
  | "earth_layers"
  | "light_prism"
  | "magnetic_field"
  | "molecule_methane"
  | "states_of_matter"
  | "crystal_nacl"
  | "solar_eclipse"
  | "archimedes_buoyancy"
  | "electric_circuit"
  | "chromosome"
  | "molecule_ethene";

interface ThreeDViewerProps {
  modelType?: ModelType | string;
  hideQuickSelector?: boolean;
}

// ============================================================================
// 1. ATOM MODEL (KHTN 7 KNTT - Bài 2: Cấu tạo Nguyên tử Rutherford - Bohr)
// ============================================================================
function AtomModel({ wireframe }: { wireframe: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const kShellRef = useRef<THREE.Group>(null);
  const lShell1Ref = useRef<THREE.Group>(null);
  const lShell2Ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) groupRef.current.rotation.y = t * 0.2;
    if (kShellRef.current) kShellRef.current.rotation.z = t * 2.5;
    if (lShell1Ref.current) lShell1Ref.current.rotation.y = t * 1.8;
    if (lShell2Ref.current) lShell2Ref.current.rotation.x = t * 2.0;
  });

  return (
    <group ref={groupRef}>
      {/* Central Nucleus (Cluster of Protons (+) & Neutrons) */}
      <group>
        <Sphere args={[0.18, 16, 16]} position={[0.1, 0.08, 0.05]}>
          <meshStandardMaterial color="#ef4444" emissive="#b91c1c" emissiveIntensity={0.6} roughness={0.2} wireframe={wireframe} />
        </Sphere>
        <Sphere args={[0.18, 16, 16]} position={[-0.1, -0.05, 0.1]}>
          <meshStandardMaterial color="#ef4444" emissive="#b91c1c" emissiveIntensity={0.6} roughness={0.2} wireframe={wireframe} />
        </Sphere>
        <Sphere args={[0.18, 16, 16]} position={[0.05, -0.12, -0.08]}>
          <meshStandardMaterial color="#ef4444" emissive="#b91c1c" emissiveIntensity={0.6} roughness={0.2} wireframe={wireframe} />
        </Sphere>
        <Sphere args={[0.18, 16, 16]} position={[-0.08, 0.1, -0.06]}>
          <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.3} wireframe={wireframe} />
        </Sphere>
        <Sphere args={[0.18, 16, 16]} position={[0.12, -0.08, 0.08]}>
          <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.3} wireframe={wireframe} />
        </Sphere>
        <Sphere args={[0.18, 16, 16]} position={[-0.1, 0.04, 0.12]}>
          <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.3} wireframe={wireframe} />
        </Sphere>
      </group>

      {/* K-Shell: 2 Electrons */}
      <Torus args={[1.1, 0.015, 16, 100]} rotation={[Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.5} wireframe={wireframe} />
      </Torus>
      <group ref={kShellRef}>
        <Sphere args={[0.08, 16, 16]} position={[1.1, 0, 0]}>
          <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={2} />
        </Sphere>
        <Sphere args={[0.08, 16, 16]} position={[-1.1, 0, 0]}>
          <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={2} />
        </Sphere>
      </group>

      {/* L-Shell 1 */}
      <group rotation={[Math.PI / 4, 0, Math.PI / 6]}>
        <Torus args={[1.8, 0.015, 16, 100]}>
          <meshBasicMaterial color="#818cf8" transparent opacity={0.4} wireframe={wireframe} />
        </Torus>
        <group ref={lShell1Ref}>
          <Sphere args={[0.08, 16, 16]} position={[1.8, 0, 0]}>
            <meshStandardMaterial color="#a78bfa" emissive="#7c3aed" emissiveIntensity={2} />
          </Sphere>
          <Sphere args={[0.08, 16, 16]} position={[-1.8, 0, 0]}>
            <meshStandardMaterial color="#a78bfa" emissive="#7c3aed" emissiveIntensity={2} />
          </Sphere>
        </group>
      </group>

      {/* L-Shell 2 */}
      <group rotation={[-Math.PI / 4, 0, -Math.PI / 6]}>
        <Torus args={[1.8, 0.015, 16, 100]}>
          <meshBasicMaterial color="#818cf8" transparent opacity={0.4} wireframe={wireframe} />
        </Torus>
        <group ref={lShell2Ref}>
          <Sphere args={[0.08, 16, 16]} position={[0, 1.8, 0]}>
            <meshStandardMaterial color="#a78bfa" emissive="#7c3aed" emissiveIntensity={2} />
          </Sphere>
          <Sphere args={[0.08, 16, 16]} position={[0, -1.8, 0]}>
            <meshStandardMaterial color="#a78bfa" emissive="#7c3aed" emissiveIntensity={2} />
          </Sphere>
        </group>
      </group>
    </group>
  );
}

// ============================================================================
// 2. SOLAR SYSTEM MODEL (KHTN 6 KNTT - Chương VI: Trái Đất và Bầu Trời)
// ============================================================================
function SolarSystemModel({ wireframe }: { wireframe: boolean }) {
  const sunRef = useRef<THREE.Mesh>(null);
  const mercuryGroup = useRef<THREE.Group>(null);
  const venusGroup = useRef<THREE.Group>(null);
  const earthGroup = useRef<THREE.Group>(null);
  const marsGroup = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (sunRef.current) sunRef.current.rotation.y = t * 0.1;
    if (mercuryGroup.current) mercuryGroup.current.rotation.y = t * 1.2;
    if (venusGroup.current) venusGroup.current.rotation.y = t * 0.8;
    if (earthGroup.current) earthGroup.current.rotation.y = t * 0.5;
    if (marsGroup.current) marsGroup.current.rotation.y = t * 0.35;
  });

  return (
    <group>
      <Sphere ref={sunRef} args={[0.7, 32, 32]}>
        <meshStandardMaterial color="#f59e0b" emissive="#fbbf24" emissiveIntensity={1.8} wireframe={wireframe} roughness={0.1} />
      </Sphere>

      {/* Orbit 1: Mercury */}
      <Torus args={[1.2, 0.006, 16, 100]} rotation={[Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color="#ffffff" transparent opacity={0.15} />
      </Torus>
      <group ref={mercuryGroup}>
        <Sphere args={[0.09, 16, 16]} position={[1.2, 0, 0]}>
          <meshStandardMaterial color="#94a3b8" roughness={0.8} wireframe={wireframe} />
        </Sphere>
      </group>

      {/* Orbit 2: Venus */}
      <Torus args={[1.7, 0.006, 16, 100]} rotation={[Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color="#ffffff" transparent opacity={0.15} />
      </Torus>
      <group ref={venusGroup}>
        <Sphere args={[0.14, 24, 24]} position={[1.7, 0, 0]}>
          <meshStandardMaterial color="#fbbf24" roughness={0.4} wireframe={wireframe} />
        </Sphere>
      </group>

      {/* Orbit 3: Earth & Moon */}
      <Torus args={[2.3, 0.006, 16, 100]} rotation={[Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.25} />
      </Torus>
      <group ref={earthGroup}>
        <group position={[2.3, 0, 0]}>
          <Sphere args={[0.18, 32, 32]}>
            <meshStandardMaterial color="#2563eb" roughness={0.3} wireframe={wireframe} />
          </Sphere>
          <Sphere args={[0.05, 16, 16]} position={[0.3, 0.08, 0]}>
            <meshStandardMaterial color="#cbd5e1" wireframe={wireframe} />
          </Sphere>
        </group>
      </group>

      {/* Orbit 4: Mars */}
      <Torus args={[3.0, 0.006, 16, 100]} rotation={[Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color="#ef4444" transparent opacity={0.2} />
      </Torus>
      <group ref={marsGroup}>
        <Sphere args={[0.13, 24, 24]} position={[3.0, 0, 0]}>
          <meshStandardMaterial color="#ea580c" roughness={0.6} wireframe={wireframe} />
        </Sphere>
      </group>
    </group>
  );
}

// ============================================================================
// 3. DNA MODEL (Sinh học 9 KNTT - Bài 4: Cấu trúc Chuỗi Xoắn Kép ADN Watson - Crick)
// ============================================================================
function DNAModel({ wireframe }: { wireframe: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) groupRef.current.rotation.y = state.clock.elapsedTime * 0.4;
  });

  const rungs = useMemo(() => {
    const items = [];
    const numRungs = 22;
    for (let i = 0; i < numRungs; i++) {
      const t = (i / numRungs) * Math.PI * 4;
      const y = (i / numRungs) * 3.6 - 1.8;
      const radius = 0.9;
      const x1 = Math.cos(t) * radius;
      const z1 = Math.sin(t) * radius;
      const x2 = -x1;
      const z2 = -z1;

      const isAT = i % 2 === 0;
      const color1 = isAT ? "#ef4444" : "#eab308";
      const color2 = isAT ? "#3b82f6" : "#22c55e";
      items.push({ id: i, y, x1, z1, x2, z2, color1, color2 });
    }
    return items;
  }, []);

  return (
    <group ref={groupRef}>
      {rungs.map((r) => (
        <group key={r.id}>
          <Sphere args={[0.1, 16, 16]} position={[r.x1, r.y, r.z1]}>
            <meshStandardMaterial color="#9333ea" metalness={0.6} roughness={0.2} wireframe={wireframe} />
          </Sphere>
          <Sphere args={[0.1, 16, 16]} position={[r.x2, r.y, r.z2]}>
            <meshStandardMaterial color="#9333ea" metalness={0.6} roughness={0.2} wireframe={wireframe} />
          </Sphere>
          <mesh position={[r.x1 * 0.5, r.y, r.z1 * 0.5]} rotation={[0, -Math.atan2(r.z1, r.x1), 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.8, 8]} />
            <meshStandardMaterial color={r.color1} roughness={0.3} wireframe={wireframe} />
          </mesh>
          <mesh position={[r.x2 * 0.5, r.y, r.z2 * 0.5]} rotation={[0, -Math.atan2(r.z2, r.x2), 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.8, 8]} />
            <meshStandardMaterial color={r.color2} roughness={0.3} wireframe={wireframe} />
          </mesh>
          <Sphere args={[0.04, 8, 8]} position={[0, r.y, 0]}>
            <meshBasicMaterial color="#ffffff" />
          </Sphere>
        </group>
      ))}
    </group>
  );
}

// ============================================================================
// 4. WATER MOLECULE (H2O) (KHTN 7 KNTT - Bài 6: Liên kết phân tử & Phân cực)
// ============================================================================
function WaterMoleculeModel({ wireframe }: { wireframe: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.4;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      <Sphere args={[0.7, 32, 32]}>
        <meshStandardMaterial color="#ef4444" roughness={0.2} metalness={0.5} wireframe={wireframe} emissive="#b91c1c" emissiveIntensity={0.25} />
      </Sphere>
      <group position={[-1.15, 0.85, 0]}>
        <Sphere args={[0.35, 24, 24]}>
          <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.6} wireframe={wireframe} />
        </Sphere>
      </group>
      <mesh position={[-0.58, 0.42, 0]} rotation={[0, 0, -Math.PI / 3]}>
        <cylinderGeometry args={[0.07, 0.07, 1.1, 16]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
      </mesh>
      <group position={[1.15, 0.85, 0]}>
        <Sphere args={[0.35, 24, 24]}>
          <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.6} wireframe={wireframe} />
        </Sphere>
      </group>
      <mesh position={[0.58, 0.42, 0]} rotation={[0, 0, Math.PI / 3]}>
        <cylinderGeometry args={[0.07, 0.07, 1.1, 16]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
      </mesh>
      <Torus args={[0.9, 0.02, 16, 60]} position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.3} />
      </Torus>
    </group>
  );
}

// ============================================================================
// 5. PLANT CELL (KHTN 6 KNTT - Bài 17: Tế Bào Thực Vật Quang Hợp)
// ============================================================================
function PlantCellModel({ wireframe }: { wireframe: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (groupRef.current) groupRef.current.rotation.y = state.clock.elapsedTime * 0.3;
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <boxGeometry args={[3.0, 2.2, 1.8]} />
        <meshStandardMaterial color="#16a34a" wireframe={wireframe} transparent opacity={wireframe ? 1 : 0.35} roughness={0.2} />
      </mesh>
      <mesh>
        <boxGeometry args={[2.8, 2.0, 1.6]} />
        <meshStandardMaterial color="#86efac" wireframe={wireframe} transparent opacity={wireframe ? 0.8 : 0.25} />
      </mesh>
      <Sphere args={[0.72, 32, 32]} position={[0.3, 0.05, 0]}>
        <meshStandardMaterial color="#38bdf8" roughness={0.1} metalness={0.3} transparent opacity={0.75} />
      </Sphere>
      <group position={[-0.85, 0.45, 0.2]}>
        <Sphere args={[0.38, 24, 24]}>
          <meshStandardMaterial color="#9333ea" roughness={0.3} emissive="#7e22ce" emissiveIntensity={0.3} />
        </Sphere>
        <Sphere args={[0.15, 16, 16]}>
          <meshStandardMaterial color="#f43f5e" emissive="#e11d48" emissiveIntensity={0.8} />
        </Sphere>
      </group>
      {[
        [-0.8, -0.6, 0.4],
        [0.9, 0.65, -0.3],
        [0.85, -0.55, 0.45],
        [-0.4, 0.7, -0.4],
      ].map((pos, idx) => (
        <group key={idx} position={pos as [number, number, number]}>
          <Sphere args={[0.18, 16, 16]}>
            <meshStandardMaterial color="#22c55e" emissive="#15803d" emissiveIntensity={0.4} roughness={0.3} />
          </Sphere>
        </group>
      ))}
      <mesh position={[-0.2, -0.65, -0.4]} rotation={[0.4, 0.5, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.35, 12]} />
        <meshStandardMaterial color="#ea580c" roughness={0.4} />
      </mesh>
    </group>
  );
}

// ============================================================================
// 6. EARTH LAYERS (Địa lý & KHTN 6 KNTT - Bài 9: Cấu Tạo Cắt Lớp Trái Đất)
// ============================================================================
function EarthLayersModel({ wireframe }: { wireframe: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (groupRef.current) groupRef.current.rotation.y = state.clock.elapsedTime * 0.25;
  });

  return (
    <group ref={groupRef} rotation={[0.3, 0, 0]}>
      <Sphere args={[0.55, 32, 32]}>
        <meshStandardMaterial color="#fef08a" emissive="#eab308" emissiveIntensity={1.5} roughness={0.1} metalness={0.9} />
      </Sphere>
      <Sphere args={[0.95, 32, 32, 0, Math.PI * 1.5, 0, Math.PI]}>
        <meshStandardMaterial color="#f97316" emissive="#c2410c" emissiveIntensity={0.6} side={THREE.DoubleSide} wireframe={wireframe} roughness={0.4} />
      </Sphere>
      <Sphere args={[1.4, 32, 32, 0, Math.PI * 1.5, 0, Math.PI]}>
        <meshStandardMaterial color="#dc2626" emissive="#991b1b" emissiveIntensity={0.3} side={THREE.DoubleSide} wireframe={wireframe} roughness={0.5} />
      </Sphere>
      <Sphere args={[1.5, 32, 32, 0, Math.PI * 1.5, 0, Math.PI]}>
        <meshStandardMaterial color="#2563eb" roughness={0.6} metalness={0.2} side={THREE.DoubleSide} wireframe={wireframe} />
      </Sphere>
      <Torus args={[1.51, 0.02, 16, 100]} rotation={[Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color="#ffffff" transparent opacity={0.2} />
      </Torus>
    </group>
  );
}

// ============================================================================
// 7. LIGHT PRISM (KHTN 7 KNTT - Bài 17: Tán Sắc Ánh Sáng Qua Lăng Kính)
// ============================================================================
function LightPrismModel({ wireframe }: { wireframe: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (groupRef.current) groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.15;
  });

  const spectrumColors = [
    { color: "#ef4444", angle: 0.28 },
    { color: "#f97316", angle: 0.24 },
    { color: "#eab308", angle: 0.2 },
    { color: "#22c55e", angle: 0.16 },
    { color: "#06b6d4", angle: 0.12 },
    { color: "#3b82f6", angle: 0.08 },
    { color: "#a855f7", angle: 0.04 },
  ];

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 6, 0]}>
        <cylinderGeometry args={[1.3, 1.3, 2.2, 3]} />
        <meshStandardMaterial color="#e0f2fe" roughness={0.05} metalness={0.2} transparent opacity={wireframe ? 0.9 : 0.55} wireframe={wireframe} />
      </mesh>
      <mesh position={[-2.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 2.4, 16]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={3} />
      </mesh>
      {spectrumColors.map((item, idx) => (
        <group key={idx} position={[0.7, 0, 0]} rotation={[0, 0, item.angle - 0.16]}>
          <mesh position={[1.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.028, 0.028, 2.4, 12]} />
            <meshStandardMaterial color={item.color} emissive={item.color} emissiveIntensity={2.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ============================================================================
// 8. MAGNETIC FIELD (KHTN 8 KNTT - Bài 19: Từ Trường Của Nam Châm Thẳng)
// ============================================================================
function MagneticFieldModel({ wireframe }: { wireframe: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (groupRef.current) groupRef.current.rotation.y = state.clock.elapsedTime * 0.3;
  });

  return (
    <group ref={groupRef}>
      <Box args={[0.6, 1.2, 0.4]} position={[0, 0.6, 0]}>
        <meshStandardMaterial color="#ef4444" roughness={0.3} metalness={0.4} wireframe={wireframe} />
      </Box>
      <Box args={[0.6, 1.2, 0.4]} position={[0, -0.6, 0]}>
        <meshStandardMaterial color="#3b82f6" roughness={0.3} metalness={0.4} wireframe={wireframe} />
      </Box>
      <Box args={[0.62, 0.05, 0.42]} position={[0, 0, 0]}>
        <meshBasicMaterial color="#ffffff" />
      </Box>
      {[1.2, 1.8, 2.4].map((radius, idx) => (
        <group key={idx}>
          <mesh position={[-radius * 0.7, 0, 0]}>
            <torusGeometry args={[radius, 0.02, 16, 80, Math.PI]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.65} />
          </mesh>
          <mesh position={[radius * 0.7, 0, 0]} rotation={[0, 0, Math.PI]}>
            <torusGeometry args={[radius, 0.02, 16, 80, Math.PI]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.65} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ============================================================================
// 9. METHANE (CH4) (Hóa học 8 & 9 KNTT - Bài 36: Metan & Cấu trúc Tứ diện đều)
// ============================================================================
function MethaneMoleculeModel({ wireframe }: { wireframe: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.4;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
    }
  });

  const hPositions: [number, number, number][] = [
    [0, 1.3, 0],
    [1.22, -0.43, 0],
    [-0.61, -0.43, 1.06],
    [-0.61, -0.43, -1.06],
  ];

  return (
    <group ref={groupRef}>
      <Sphere args={[0.55, 32, 32]}>
        <meshStandardMaterial color="#334155" roughness={0.2} metalness={0.7} wireframe={wireframe} />
      </Sphere>
      {hPositions.map((pos, idx) => {
        const mid: [number, number, number] = [pos[0] * 0.5, pos[1] * 0.5, pos[2] * 0.5];
        return (
          <group key={idx}>
            <Sphere args={[0.3, 24, 24]} position={pos}>
              <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.5} wireframe={wireframe} />
            </Sphere>
            <mesh position={mid} rotation={[0, -Math.atan2(pos[2], pos[0]), Math.atan2(Math.hypot(pos[0], pos[2]), pos[1])]}>
              <cylinderGeometry args={[0.06, 0.06, 1.3, 16]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        );
      })}
      <Icosahedron args={[1.4, 0]}>
        <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.15} />
      </Icosahedron>
    </group>
  );
}

// ============================================================================
// 10. STATES OF MATTER (KHTN 6 KNTT - Bài 10: Ba Trạng Thái Rắn - Lỏng - Khí)
// ============================================================================
function StatesOfMatterModel({ wireframe }: { wireframe: boolean }) {
  const [phase, setPhase] = useState<"solid" | "liquid" | "gas">("solid");
  const particlesRef = useRef<THREE.Group>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setPhase((prev) => (prev === "solid" ? "liquid" : prev === "liquid" ? "gas" : "solid"));
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const particles = useMemo(() => {
    const pts = [];
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          pts.push({
            orig: [x * 0.6, y * 0.6, z * 0.6] as [number, number, number],
            seed: Math.random() * 10,
          });
        }
      }
    }
    return pts;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (particlesRef.current) {
      particlesRef.current.children.forEach((child, i) => {
        const p = particles[i];
        if (phase === "solid") {
          child.position.x = p.orig[0] + Math.sin(t * 15 + p.seed) * 0.03;
          child.position.y = p.orig[1] + Math.cos(t * 15 + p.seed) * 0.03;
          child.position.z = p.orig[2] + Math.sin(t * 12 + p.seed) * 0.03;
        } else if (phase === "liquid") {
          child.position.x = p.orig[0] + Math.sin(t * 2 + p.seed) * 0.2;
          child.position.y = p.orig[1] * 0.5 - 0.4 + Math.cos(t * 2 + p.seed) * 0.1;
          child.position.z = p.orig[2] + Math.sin(t * 2.5 + p.seed) * 0.2;
        } else {
          child.position.x = Math.sin(t * 3 + p.seed) * 1.1;
          child.position.y = Math.cos(t * 3.5 + p.seed * 2) * 1.1;
          child.position.z = Math.sin(t * 4 + p.seed * 3) * 1.1;
        }
      });
    }
  });

  return (
    <group>
      <Box args={[2.6, 2.6, 2.6]}>
        <meshStandardMaterial color="#38bdf8" wireframe={wireframe} transparent opacity={wireframe ? 0.8 : 0.15} />
      </Box>
      <group ref={particlesRef}>
        {particles.map((_, idx) => (
          <Sphere key={idx} args={[0.16, 16, 16]}>
            <meshStandardMaterial
              color={phase === "solid" ? "#3b82f6" : phase === "liquid" ? "#06b6d4" : "#f43f5e"}
              roughness={0.2}
              metalness={0.7}
              emissive={phase === "gas" ? "#e11d48" : "#0284c7"}
              emissiveIntensity={phase === "gas" ? 0.5 : 0.2}
            />
          </Sphere>
        ))}
      </group>
    </group>
  );
}

// ============================================================================
// 11. CRYSTAL NACL (KHTN 7 KNTT - Bài 10: Tinh Thể Muối Ăn & Mạng Tinh Thể Ion)
// ============================================================================
function CrystalNaClModel({ wireframe }: { wireframe: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.3;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.15;
    }
  });

  // 3x3x3 lattice coordinates
  const ions = useMemo(() => {
    const list = [];
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const isNa = (x + y + z) % 2 === 0;
          list.push({
            pos: [x * 0.9, y * 0.9, z * 0.9] as [number, number, number],
            isNa,
          });
        }
      }
    }
    return list;
  }, []);

  return (
    <group ref={groupRef}>
      {/* 27 Alternating Ions */}
      {ions.map((ion, i) => (
        <Sphere
          key={i}
          args={[ion.isNa ? 0.15 : 0.22, 20, 20]}
          position={ion.pos}
        >
          <meshStandardMaterial
            color={ion.isNa ? "#a855f7" : "#22c55e"}
            emissive={ion.isNa ? "#7e22ce" : "#15803d"}
            emissiveIntensity={0.3}
            metalness={0.6}
            roughness={0.2}
            wireframe={wireframe}
          />
        </Sphere>
      ))}

      {/* Ionic Lattice Wire Frame Struts */}
      {[-0.9, 0, 0.9].map((val, idx) => (
        <group key={idx}>
          {/* X-axis struts */}
          {[-0.9, 0, 0.9].map((v2, i2) => (
            <mesh key={`x-${idx}-${i2}`} position={[0, val, v2]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.02, 0.02, 1.8, 8]} />
              <meshBasicMaterial color="#94a3b8" transparent opacity={0.4} />
            </mesh>
          ))}
          {/* Y-axis struts */}
          {[-0.9, 0, 0.9].map((v2, i2) => (
            <mesh key={`y-${idx}-${i2}`} position={[val, 0, v2]}>
              <cylinderGeometry args={[0.02, 0.02, 1.8, 8]} />
              <meshBasicMaterial color="#94a3b8" transparent opacity={0.4} />
            </mesh>
          ))}
          {/* Z-axis struts */}
          {[-0.9, 0, 0.9].map((v2, i2) => (
            <mesh key={`z-${idx}-${i2}`} position={[val, v2, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 1.8, 8]} />
              <meshBasicMaterial color="#94a3b8" transparent opacity={0.4} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

// ============================================================================
// 12. SOLAR ECLIPSE (KHTN 6 KNTT - Bài 53: Mặt Trăng, Nhật Thực & Nguyệt Thực)
// ============================================================================
function SolarEclipseModel({ wireframe }: { wireframe: boolean }) {
  const moonOrbitRef = useRef<THREE.Group>(null);
  const sunGlowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (moonOrbitRef.current) {
      moonOrbitRef.current.position.y = Math.sin(t * 0.8) * 0.2;
      moonOrbitRef.current.position.z = Math.cos(t * 0.8) * 0.3;
    }
    if (sunGlowRef.current) {
      sunGlowRef.current.rotation.y = t * 0.1;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Sun (Mặt Trời) at left */}
      <Sphere ref={sunGlowRef} args={[1.1, 32, 32]} position={[-3.2, 0, 0]}>
        <meshStandardMaterial color="#f59e0b" emissive="#fbbf24" emissiveIntensity={2.5} roughness={0.1} wireframe={wireframe} />
      </Sphere>

      {/* Earth (Trái Đất) at right */}
      <Sphere args={[0.6, 32, 32]} position={[2.5, 0, 0]}>
        <meshStandardMaterial color="#2563eb" roughness={0.5} metalness={0.2} wireframe={wireframe} />
      </Sphere>

      {/* Moon (Mặt Trăng) in the middle */}
      <group ref={moonOrbitRef} position={[0.4, 0, 0]}>
        <Sphere args={[0.18, 20, 20]}>
          <meshStandardMaterial color="#cbd5e1" roughness={0.8} wireframe={wireframe} />
        </Sphere>
        {/* Shadow Cone (Umbra: Bóng tối đổ lên Trái Đất) */}
        <mesh position={[1.05, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <cylinderGeometry args={[0.08, 0.2, 2.1, 16]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.65} />
        </mesh>
      </group>

      {/* Sunlight Beams */}
      <mesh position={[-0.8, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.1, 0.6, 4.8, 16]} />
        <meshBasicMaterial color="#fef08a" transparent opacity={0.08} />
      </mesh>
    </group>
  );
}

// ============================================================================
// 13. ARCHIMEDES BUOYANCY (KHTN 8 KNTT - Bài 17: Lực Đẩy Ác-si-mét & Sự Nổi)
// ============================================================================
function ArchimedesBuoyancyModel({ wireframe }: { wireframe: boolean }) {
  const cubeRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (cubeRef.current) {
      cubeRef.current.position.y = 0.15 + Math.sin(state.clock.elapsedTime * 1.5) * 0.08;
    }
  });

  return (
    <group>
      {/* Cylindrical Glass Beaker (Cốc đong thủy tinh) */}
      <Cylinder args={[1.3, 1.3, 2.8, 32]}>
        <meshStandardMaterial color="#e0f2fe" transparent opacity={wireframe ? 0.9 : 0.25} roughness={0.05} metalness={0.1} wireframe={wireframe} />
      </Cylinder>

      {/* Water Fluid level */}
      <Cylinder args={[1.26, 1.26, 1.8, 32]} position={[0, -0.45, 0]}>
        <meshStandardMaterial color="#38bdf8" transparent opacity={0.6} roughness={0.1} metalness={0.4} />
      </Cylinder>

      {/* Floating Wooden Cube */}
      <Box ref={cubeRef} args={[0.8, 0.8, 0.8]} position={[0, 0.15, 0]}>
        <meshStandardMaterial color="#f59e0b" roughness={0.6} wireframe={wireframe} />
      </Box>

      {/* Vector F_A (Lực đẩy Ác-si-mét hướng lên - Xanh lục) */}
      <group position={[0, 0.7, 0]}>
        <Cylinder args={[0.03, 0.03, 0.6, 12]} position={[0, 0.3, 0]}>
          <meshBasicMaterial color="#22c55e" />
        </Cylinder>
        <mesh position={[0, 0.68, 0]}>
          <coneGeometry args={[0.08, 0.18, 12]} />
          <meshBasicMaterial color="#22c55e" />
        </mesh>
      </group>

      {/* Vector P (Trọng lực P hướng xuống - Đỏ) */}
      <group position={[0, -0.4, 0]}>
        <Cylinder args={[0.03, 0.03, 0.6, 12]} position={[0, -0.3, 0]}>
          <meshBasicMaterial color="#ef4444" />
        </Cylinder>
        <mesh position={[0, -0.68, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.08, 0.18, 12]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
      </group>
    </group>
  );
}

// ============================================================================
// 14. ELECTRIC CIRCUIT (KHTN 8 KNTT - Bài 22: Mạch Điện & Dòng Điện)
// ============================================================================
function ElectricCircuitModel({ wireframe }: { wireframe: boolean }) {
  const electronRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (electronRef.current) {
      electronRef.current.rotation.y = state.clock.elapsedTime * 1.5;
    }
  });

  return (
    <group rotation={[0.4, 0, 0]}>
      {/* Circuit Platform Board */}
      <Box args={[3.2, 0.1, 2.2]} position={[0, -0.05, 0]}>
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </Box>

      {/* Battery (Nguồn pin) */}
      <group position={[-1.0, 0.2, 0]}>
        <Cylinder args={[0.2, 0.2, 1.0, 16]} rotation={[0, 0, Math.PI / 2]}>
          <meshStandardMaterial color="#dc2626" metalness={0.7} roughness={0.3} />
        </Cylinder>
        <Cylinder args={[0.08, 0.08, 0.15, 16]} position={[0.55, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.1} />
        </Cylinder>
      </group>

      {/* Light Bulb (Bóng đèn thắp sáng rực rỡ) */}
      <group position={[1.0, 0.45, 0]}>
        <Sphere args={[0.35, 24, 24]}>
          <meshStandardMaterial color="#fef08a" emissive="#eab308" emissiveIntensity={2.2} transparent opacity={0.85} />
        </Sphere>
        <Cylinder args={[0.18, 0.18, 0.25, 16]} position={[0, -0.38, 0]}>
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
        </Cylinder>
      </group>

      {/* Closed Conducting Wire (Dây dẫn đồng kín) */}
      <group>
        <mesh position={[0, 0.05, 0.8]}>
          <boxGeometry args={[2.4, 0.04, 0.04]} />
          <meshStandardMaterial color="#ea580c" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.05, -0.8]}>
          <boxGeometry args={[2.4, 0.04, 0.04]} />
          <meshStandardMaterial color="#ea580c" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* Moving Electrons stream */}
      <group ref={electronRef}>
        {[0, 0.8, -0.8].map((offset, i) => (
          <Sphere key={i} args={[0.05, 12, 12]} position={[offset, 0.08, 0.8]}>
            <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={2} />
          </Sphere>
        ))}
      </group>
    </group>
  );
}

// ============================================================================
// 15. CHROMOSOME MODEL (Sinh học 9 KNTT - Bài 8: Nhiễm Sắc Thể Kép Hình Chữ X)
// ============================================================================
function ChromosomeModel({ wireframe }: { wireframe: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.35;
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Central Centromere (Tâm động eo thắt) */}
      <Sphere args={[0.26, 20, 20]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#ec4899" emissive="#db2777" emissiveIntensity={0.8} roughness={0.2} />
      </Sphere>

      {/* Chromatid 1 (Left Arm X) */}
      <group rotation={[0, 0, Math.PI / 4]}>
        <Cylinder args={[0.22, 0.22, 2.8, 16]}>
          <meshStandardMaterial color="#8b5cf6" roughness={0.4} wireframe={wireframe} />
        </Cylinder>
        {/* Gene Banding Patterns */}
        <Cylinder args={[0.23, 0.23, 0.3, 16]} position={[0, 0.8, 0]}>
          <meshStandardMaterial color="#eab308" emissive="#ca8a04" emissiveIntensity={0.4} />
        </Cylinder>
        <Cylinder args={[0.23, 0.23, 0.25, 16]} position={[0, -0.7, 0]}>
          <meshStandardMaterial color="#06b6d4" emissive="#0891b2" emissiveIntensity={0.4} />
        </Cylinder>
      </group>

      {/* Chromatid 2 (Right Arm X) */}
      <group rotation={[0, 0, -Math.PI / 4]}>
        <Cylinder args={[0.22, 0.22, 2.8, 16]}>
          <meshStandardMaterial color="#8b5cf6" roughness={0.4} wireframe={wireframe} />
        </Cylinder>
        {/* Gene Banding Patterns */}
        <Cylinder args={[0.23, 0.23, 0.3, 16]} position={[0, 0.8, 0]}>
          <meshStandardMaterial color="#eab308" emissive="#ca8a04" emissiveIntensity={0.4} />
        </Cylinder>
        <Cylinder args={[0.23, 0.23, 0.25, 16]} position={[0, -0.7, 0]}>
          <meshStandardMaterial color="#06b6d4" emissive="#0891b2" emissiveIntensity={0.4} />
        </Cylinder>
      </group>
    </group>
  );
}

// ============================================================================
// 16. ETHENE (C2H4) (Hóa học 9 KNTT - Bài 37: Etilen & Liên Kết Đôi Phẳng)
// ============================================================================
function EtheneMoleculeModel({ wireframe }: { wireframe: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.4;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Carbon 1 */}
      <Sphere args={[0.5, 24, 24]} position={[-0.7, 0, 0]}>
        <meshStandardMaterial color="#334155" roughness={0.2} metalness={0.7} wireframe={wireframe} />
      </Sphere>

      {/* Carbon 2 */}
      <Sphere args={[0.5, 24, 24]} position={[0.7, 0, 0]}>
        <meshStandardMaterial color="#334155" roughness={0.2} metalness={0.7} wireframe={wireframe} />
      </Sphere>

      {/* Double Bond C=C (2 Parallel Cylinders) */}
      <Cylinder args={[0.05, 0.05, 1.4, 12]} position={[0, 0.12, 0]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
      </Cylinder>
      <Cylinder args={[0.05, 0.05, 1.4, 12]} position={[0, -0.12, 0]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
      </Cylinder>

      {/* 4 Hydrogens in Coplanar Arrangement */}
      {[
        [-1.6, 0.85, 0],
        [-1.6, -0.85, 0],
        [1.6, 0.85, 0],
        [1.6, -0.85, 0],
      ].map((pos, idx) => (
        <group key={idx}>
          <Sphere args={[0.28, 20, 20]} position={pos as [number, number, number]}>
            <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.5} wireframe={wireframe} />
          </Sphere>
          <mesh
            position={[pos[0] > 0 ? 1.15 : -1.15, pos[1] > 0 ? 0.42 : -0.42, 0]}
            rotation={[0, 0, (pos[0] > 0 ? -1 : 1) * (pos[1] > 0 ? -Math.PI / 4 : Math.PI / 4)]}
          >
            <cylinderGeometry args={[0.05, 0.05, 1.0, 12]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* Coplanar Sheet Mesh Aid */}
      <Box args={[3.6, 2.2, 0.02]} position={[0, 0, 0]}>
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.08} />
      </Box>
    </group>
  );
}

// ============================================================================
// 17. BASIC GEOMETRY MODELS
// ============================================================================
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
          <meshStandardMaterial color="#06b6d4" wireframe={wireframe} roughness={0.1} metalness={0.9} />
        </Torus>
      </Float>
    );
  }

  if (type === "icosahedron") {
    return (
      <Float speed={2} rotationIntensity={1.5} floatIntensity={1.5}>
        <Icosahedron ref={meshRef} args={[1.5, 0]}>
          <meshStandardMaterial color="#8b5cf6" wireframe={wireframe} roughness={0.2} metalness={0.8} />
        </Icosahedron>
      </Float>
    );
  }

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <Sphere ref={meshRef} args={[1.5, 64, 64]}>
        <MeshDistortMaterial color="#3b82f6" wireframe={wireframe} distort={0.4} speed={2} roughness={0.2} metalness={0.8} />
      </Sphere>
    </Float>
  );
}

// ============================================================================
// MAIN VIEWER EXPORT
// ============================================================================
export function ThreeDViewer({
  modelType = "sphere",
  hideQuickSelector = false,
}: ThreeDViewerProps) {
  const [wireframe, setWireframe] = useState(false);
  const [currentShape, setCurrentShape] = useState<ModelType | string>(modelType);
  const [autoRotate, setAutoRotate] = useState(true);

  useEffect(() => {
    if (modelType) {
      setCurrentShape(modelType);
    }
  }, [modelType]);

  const renderModel = () => {
    switch (currentShape) {
      case "atom":
        return <AtomModel wireframe={wireframe} />;
      case "solar_system":
        return <SolarSystemModel wireframe={wireframe} />;
      case "dna":
        return <DNAModel wireframe={wireframe} />;
      case "molecule_h2o":
        return <WaterMoleculeModel wireframe={wireframe} />;
      case "plant_cell":
        return <PlantCellModel wireframe={wireframe} />;
      case "earth_layers":
        return <EarthLayersModel wireframe={wireframe} />;
      case "light_prism":
        return <LightPrismModel wireframe={wireframe} />;
      case "magnetic_field":
        return <MagneticFieldModel wireframe={wireframe} />;
      case "molecule_methane":
        return <MethaneMoleculeModel wireframe={wireframe} />;
      case "states_of_matter":
        return <StatesOfMatterModel wireframe={wireframe} />;
      case "crystal_nacl":
        return <CrystalNaClModel wireframe={wireframe} />;
      case "solar_eclipse":
        return <SolarEclipseModel wireframe={wireframe} />;
      case "archimedes_buoyancy":
        return <ArchimedesBuoyancyModel wireframe={wireframe} />;
      case "electric_circuit":
        return <ElectricCircuitModel wireframe={wireframe} />;
      case "chromosome":
        return <ChromosomeModel wireframe={wireframe} />;
      case "molecule_ethene":
        return <EtheneMoleculeModel wireframe={wireframe} />;
      default:
        return <BasicModel type={currentShape} wireframe={wireframe} />;
    }
  };

  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing group bg-gradient-to-br from-slate-950 via-[#0a0f1d] to-black rounded-2xl overflow-hidden shadow-2xl">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 10, 5]} intensity={1.4} />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#38bdf8" />
        <Environment preset="city" />
        <Stars radius={100} depth={50} count={3500} factor={4} saturation={0} fade speed={1} />

        {renderModel()}

        <OrbitControls enableZoom={true} enablePan={false} autoRotate={autoRotate} autoRotateSpeed={1.2} />
      </Canvas>

      {/* Control overlay */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 opacity-90 group-hover:opacity-100 transition-opacity z-10 text-xs text-white shadow-lg">
        <button
          onClick={() => setWireframe(!wireframe)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-medium transition-all ${
            wireframe ? "bg-blue-600 text-white" : "hover:bg-white/10"
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          {wireframe ? "Khung dây" : "Bề mặt"}
        </button>

        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-medium transition-all ${
            autoRotate ? "bg-cyan-600 text-white" : "hover:bg-white/10"
          }`}
        >
          <RotateCw className="w-3.5 h-3.5" />
          {autoRotate ? "Tự xoay" : "Dừng"}
        </button>
      </div>

      {/* Model quick switcher bar */}
      {!hideQuickSelector && (
        <div className="absolute bottom-4 left-4 right-4 flex items-center gap-1.5 overflow-x-auto bg-black/70 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 z-10 scrollbar-none">
          {[
            { id: "plant_cell", label: "Tế bào (KHTN 6)" },
            { id: "earth_layers", label: "Trái Đất (Địa 6)" },
            { id: "solar_eclipse", label: "Nhật thực (KHTN 6)" },
            { id: "atom", label: "Nguyên tử (KHTN 7)" },
            { id: "molecule_h2o", label: "Nước H2O (KHTN 7)" },
            { id: "crystal_nacl", label: "Muối NaCl (KHTN 7)" },
            { id: "light_prism", label: "Lăng kính (KHTN 7)" },
            { id: "magnetic_field", label: "Từ trường (KHTN 8)" },
            { id: "archimedes_buoyancy", label: "Lực Ác-si-mét (KHTN 8)" },
            { id: "electric_circuit", label: "Mạch điện (KHTN 8)" },
            { id: "molecule_methane", label: "Metan CH4 (KHTN 8/9)" },
            { id: "molecule_ethene", label: "Etilen C2H4 (KHTN 9)" },
            { id: "chromosome", label: "NST Kép (Sinh 9)" },
            { id: "dna", label: "ADN Xoắn kép (Sinh 9)" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentShape(item.id as ModelType)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                currentShape === item.id
                  ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-md"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
export default ThreeDViewer;
