import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Html,
  Sparkles,
  ContactShadows,
  Float,
} from "@react-three/drei";
import * as THREE from "three";
import { plantComponents } from "../data/plantComponents.js";

// ============ 可交互组件包装器 ============
function InteractiveGroup({ comp, position, selectedId, hoveredId, onSelect, onHover, children }) {
  const isActive = hoveredId === comp.id || selectedId === comp.id;
  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(comp.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(comp.id);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        onHover(null);
        document.body.style.cursor = "default";
      }}
    >
      {children}
      {isActive && (
        <Html distanceFactor={10} position={[0, 3, 0]} center>
          <div className="pointer-events-none whitespace-nowrap rounded-lg border border-accent/50 bg-bg/95 px-3 py-1.5 font-mono text-xs text-accent shadow-glow backdrop-blur">
            <span className="mr-1.5 font-bold">{comp.code}</span>
            {comp.name}
          </div>
        </Html>
      )}
    </group>
  );
}

// ============ 安全壳建筑（穹顶+圆柱）============
function Containment({ comp, cutaway, selectedId, hoveredId, onSelect, onHover }) {
  const isActive = hoveredId === comp.id || selectedId === comp.id;
  const opacity = cutaway ? 0.06 : isActive ? 0.28 : 0.18;

  return (
    <InteractiveGroup
      comp={comp}
      position={[0, 0, 0]}
      selectedId={selectedId}
      hoveredId={hoveredId}
      onSelect={onSelect}
      onHover={onHover}
    >
      {/* 圆柱壳体 */}
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[3.2, 3.2, 4, 48, 1, true]} />
        <meshPhysicalMaterial
          color="#475569"
          transparent
          opacity={opacity}
          metalness={0.3}
          roughness={0.7}
          side={THREE.DoubleSide}
          emissive={isActive ? "#22d3ee" : "#000000"}
          emissiveIntensity={isActive ? 0.15 : 0}
          depthWrite={false}
        />
      </mesh>
      {/* 穹顶（半球）*/}
      <mesh position={[0, 3, 0]}>
        <sphereGeometry args={[3.2, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          color="#64748b"
          transparent
          opacity={opacity}
          metalness={0.3}
          roughness={0.6}
          side={THREE.DoubleSide}
          emissive={isActive ? "#22d3ee" : "#000000"}
          emissiveIntensity={isActive ? 0.15 : 0}
          depthWrite={false}
        />
      </mesh>
      {/* 穹顶顶部小尖塔 */}
      <mesh position={[0, 6.2, 0]}>
        <cylinderGeometry args={[0.15, 0.3, 0.8, 12]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* 底座 */}
      <mesh position={[0, -1.05, 0]}>
        <cylinderGeometry args={[3.5, 3.8, 0.3, 48]} />
        <meshStandardMaterial color="#334155" metalness={0.2} roughness={0.9} />
      </mesh>
      {/* 高亮边线 */}
      {(isActive || cutaway) && (
        <mesh position={[0, 1, 0]}>
          <cylinderGeometry args={[3.25, 3.25, 4.02, 48, 1, true]} />
          <meshBasicMaterial
            color={isActive ? "#22d3ee" : "#3b82f6"}
            transparent
            opacity={isActive ? 0.4 : 0.15}
            side={THREE.DoubleSide}
            wireframe
          />
        </mesh>
      )}
      {(isActive || cutaway) && (
        <mesh position={[0, 3, 0]}>
          <sphereGeometry args={[3.22, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshBasicMaterial
            color={isActive ? "#22d3ee" : "#3b82f6"}
            transparent
            opacity={isActive ? 0.3 : 0.12}
            side={THREE.DoubleSide}
            wireframe
          />
        </mesh>
      )}
    </InteractiveGroup>
  );
}

// ============ 反应堆压力容器 ============
function PressureVessel({ comp, cutaway, selectedId, hoveredId, onSelect, onHover }) {
  const isActive = hoveredId === comp.id || selectedId === comp.id;
  const opacity = cutaway ? 0.3 : isActive ? 0.55 : 0.72;

  return (
    <InteractiveGroup
      comp={comp}
      position={[0, -0.3, 0]}
      selectedId={selectedId}
      hoveredId={hoveredId}
      onSelect={onSelect}
      onHover={onHover}
    >
      {/* 容器主体 */}
      <mesh>
        <cylinderGeometry args={[1.1, 1.1, 3.2, 32, 1, true]} />
        <meshPhysicalMaterial
          color="#1e3a5f"
          transparent
          opacity={opacity}
          metalness={0.85}
          roughness={0.25}
          side={THREE.DoubleSide}
          clearcoat={0.5}
          clearcoatRoughness={0.3}
          emissive={isActive ? "#22d3ee" : "#0a1525"}
          emissiveIntensity={isActive ? 0.4 : 0.1}
        />
      </mesh>
      {/* 顶盖（半球）*/}
      <mesh position={[0, 1.6, 0]}>
        <sphereGeometry args={[1.1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          color="#2a4a6f"
          metalness={0.85}
          roughness={0.25}
          clearcoat={0.5}
          emissive={isActive ? "#22d3ee" : "#0a1525"}
          emissiveIntensity={isActive ? 0.4 : 0.1}
        />
      </mesh>
      {/* 底部封头 */}
      <mesh position={[0, -1.6, 0]} rotation={[Math.PI, 0, 0]}>
        <sphereGeometry args={[1.1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial color="#1a2f4a" metalness={0.85} roughness={0.3} />
      </mesh>
      {/* 顶盖法兰（连接环）*/}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[1.2, 1.2, 0.2, 32]} />
        <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* 进出口接管 */}
      <mesh position={[1.1, 0.8, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.25, 0.25, 0.6, 16]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[-1.1, -0.8, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.25, 0.25, 0.6, 16]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* 剖面模式下的容器边线 */}
      {(isActive || cutaway) && (
        <mesh>
          <cylinderGeometry args={[1.12, 1.12, 3.22, 32, 1, true]} />
          <meshBasicMaterial
            color={isActive ? "#22d3ee" : "#60a5fa"}
            transparent
            opacity={isActive ? 0.35 : 0.2}
            side={THREE.DoubleSide}
            wireframe
          />
        </mesh>
      )}
    </InteractiveGroup>
  );
}

// ============ 堆芯（发光燃料组件）============
function ReactorCore({ comp, selectedId, hoveredId, onSelect, onHover }) {
  const isActive = hoveredId === comp.id || selectedId === comp.id;
  const ref = useRef();

  // 脉动发光
  useFrame((state) => {
    if (ref.current) {
      const pulse = 0.9 + Math.sin(state.clock.elapsedTime * 2) * 0.3;
      ref.current.material.emissiveIntensity = isActive ? pulse + 0.6 : pulse;
    }
  });

  // 燃料组件网格 5x5
  const fuelRods = useMemo(() => {
    const rods = [];
    const spacing = 0.28;
    for (let i = -2; i <= 2; i++) {
      for (let j = -2; j <= 2; j++) {
        rods.push([i * spacing, j * spacing]);
      }
    }
    return rods;
  }, []);

  return (
    <InteractiveGroup
      comp={comp}
      position={[0, -0.3, 0]}
      selectedId={selectedId}
      hoveredId={hoveredId}
      onSelect={onSelect}
      onHover={onHover}
    >
      {/* 堆芯主体（发光圆柱）*/}
      <mesh ref={ref}>
        <cylinderGeometry args={[0.75, 0.75, 2, 24]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#f59e0b"
          emissiveIntensity={0.9}
          transparent
          opacity={0.4}
        />
      </mesh>
      {/* 燃料棒阵列 */}
      {fuelRods.map((pos, i) => (
        <mesh key={i} position={[pos[0], 0, pos[1]]}>
          <cylinderGeometry args={[0.04, 0.04, 1.8, 8]} />
          <meshStandardMaterial
            color="#fde68a"
            emissive="#fbbf24"
            emissiveIntensity={0.8}
            metalness={0.3}
          />
        </mesh>
      ))}
      {/* 裂变粒子 */}
      <Sparkles count={30} scale={[1.5, 2.5, 1.5]} size={3} color="#fbbf24" speed={0.5} />
      <Sparkles count={15} scale={[1.5, 2.5, 1.5]} size={2} color="#fde047" speed={0.8} />
    </InteractiveGroup>
  );
}

// ============ 控制棒（上下移动）============
function ControlRods({ comp, selectedId, hoveredId, onSelect, onHover }) {
  const isActive = hoveredId === comp.id || selectedId === comp.id;
  const groupRef = useRef();

  // 缓慢上下移动模拟控制
  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.elapsedTime;
      groupRef.current.position.y = 1.8 + Math.sin(t * 0.5) * 0.3;
    }
  });

  const rods = useMemo(() => {
    const arr = [];
    const spacing = 0.25;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        arr.push([i * spacing, j * spacing]);
      }
    }
    return arr;
  }, []);

  return (
    <InteractiveGroup
      comp={comp}
      position={[0, 0, 0]}
      selectedId={selectedId}
      hoveredId={hoveredId}
      onSelect={onSelect}
      onHover={onHover}
    >
      <group ref={groupRef}>
        {/* 驱动机构（顶部方形壳）*/}
        <mesh position={[0, 1.2, 0]}>
          <boxGeometry args={[0.6, 0.5, 0.6]} />
          <meshStandardMaterial
            color="#475569"
            metalness={0.8}
            roughness={0.3}
            emissive={isActive ? "#a78bfa" : "#000000"}
            emissiveIntensity={isActive ? 0.3 : 0}
          />
        </mesh>
        {/* 控制棒束 */}
        {rods.map((pos, i) => (
          <mesh key={i} position={[pos[0], 0, pos[1]]}>
            <cylinderGeometry args={[0.045, 0.045, 1.6, 10]} />
            <meshStandardMaterial
              color={isActive ? "#c4b5fd" : "#a78bfa"}
              emissive="#7c3aed"
              emissiveIntensity={isActive ? 0.5 : 0.25}
              metalness={0.9}
              roughness={0.2}
            />
          </mesh>
        ))}
      </group>
    </InteractiveGroup>
  );
}

// ============ 冷却管道（U型环路）============
function CoolingPipes({ comp, selectedId, hoveredId, onSelect, onHover }) {
  const isActive = hoveredId === comp.id || selectedId === comp.id;

  // 创建从压力容器到蒸汽发生器的弯曲管道
  const pipeCurve = useMemo(() => {
    const points = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const x = 1.1 + t * 3.4;
      const y = 0.8 - Math.sin(t * Math.PI) * 1.2;
      const z = 0;
      points.push(new THREE.Vector3(x, y, z));
    }
    return new THREE.CatmullRomCurve3(points);
  }, []);

  const returnCurve = useMemo(() => {
    const points = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const x = 4.5 - t * 3.4;
      const y = -0.8 - Math.sin(t * Math.PI) * 1.2;
      const z = 0;
      points.push(new THREE.Vector3(x, y, z));
    }
    return new THREE.CatmullRomCurve3(points);
  }, []);

  return (
    <InteractiveGroup
      comp={comp}
      position={[0, 0, 0]}
      selectedId={selectedId}
      hoveredId={hoveredId}
      onSelect={onSelect}
      onHover={onHover}
    >
      {/* 热段管道（顶部，从容器到蒸汽发生器）*/}
      <mesh>
        <tubeGeometry args={[pipeCurve, 32, 0.18, 12, false]} />
        <meshPhysicalMaterial
          color={isActive ? "#93c5fd" : "#60a5fa"}
          emissive="#3b82f6"
          emissiveIntensity={isActive ? 0.4 : 0.2}
          metalness={0.7}
          roughness={0.3}
          clearcoat={0.4}
        />
      </mesh>
      {/* 冷段管道（底部，返回）*/}
      <mesh>
        <tubeGeometry args={[returnCurve, 32, 0.18, 12, false]} />
        <meshPhysicalMaterial
          color={isActive ? "#93c5fd" : "#3b82f6"}
          emissive="#1d4ed8"
          emissiveIntensity={isActive ? 0.3 : 0.15}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>
      {/* 主泵（冷段上的圆柱）*/}
      <mesh position={[2.3, -1.6, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.6, 20]} />
        <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[2.3, -1.6, 0]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.4, 0.08, 12, 24]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* 流动粒子 */}
      <Sparkles count={18} scale={[3.5, 2.5, 0.5]} position={[2.8, 0, 0]} size={2} color="#60a5fa" speed={0.8} />
      {/* 稳压器（热段上的小罐）*/}
      <mesh position={[2, 1.2, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 1.2, 16]} />
        <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[2, 1.9, 0]}>
        <sphereGeometry args={[0.3, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
      </mesh>
    </InteractiveGroup>
  );
}

// ============ 蒸汽发生器 ============
function SteamGenerator({ comp, cutaway, selectedId, hoveredId, onSelect, onHover }) {
  const isActive = hoveredId === comp.id || selectedId === comp.id;
  const opacity = cutaway ? 0.35 : isActive ? 0.7 : 0.9;

  return (
    <InteractiveGroup
      comp={comp}
      position={[4.8, -0.3, 0]}
      selectedId={selectedId}
      hoveredId={hoveredId}
      onSelect={onSelect}
      onHover={onHover}
    >
      {/* 主体 */}
      <mesh>
        <cylinderGeometry args={[0.7, 0.55, 3.6, 24, 1, true]} />
        <meshPhysicalMaterial
          color={isActive ? "#6ee7b7" : "#34d399"}
          transparent
          opacity={opacity}
          metalness={0.7}
          roughness={0.3}
          side={THREE.DoubleSide}
          emissive="#10b981"
          emissiveIntensity={isActive ? 0.3 : 0.12}
          clearcoat={0.4}
        />
      </mesh>
      {/* 顶部半球 */}
      <mesh position={[0, 1.8, 0]}>
        <sphereGeometry args={[0.7, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial color="#34d399" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* 蒸汽出口管 */}
      <mesh position={[0.5, 2.3, 0]} rotation={[0, 0, -0.6]}>
        <cylinderGeometry args={[0.18, 0.18, 1, 12]} />
        <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* 内部传热管示意（仅在剖面时可见）*/}
      {cutaway && (
        <>
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i / 8) * Math.PI;
            return (
              <mesh key={i} position={[Math.cos(angle) * 0.3, 0, Math.sin(angle) * 0.3]}>
                <cylinderGeometry args={[0.02, 0.02, 2.8, 6]} />
                <meshStandardMaterial color="#60a5fa" emissive="#3b82f6" emissiveIntensity={0.3} />
              </mesh>
            );
          })}
        </>
      )}
      <Sparkles count={12} scale={[1, 3, 1]} size={2} color="#a7f3d0" speed={0.5} />
    </InteractiveGroup>
  );
}

// ============ 灯光 ============
function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[8, 12, 6]} intensity={1.2} castShadow />
      <directionalLight position={[-6, 8, -4]} intensity={0.5} color="#6366f1" />
      <pointLight position={[-4, 3, 4]} intensity={2.5} color="#22d3ee" distance={18} />
      <pointLight position={[5, 2, 3]} intensity={2} color="#fbbf24" distance={14} />
      <pointLight position={[0, -2, -4]} intensity={1.5} color="#a78bfa" distance={12} />
      <spotLight position={[0, 10, 0]} angle={0.5} penumbra={0.5} intensity={1.2} color="#ffffff" />
    </>
  );
}

// ============ 地面 ============
function Floor() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
        <circleGeometry args={[12, 64]} />
        <meshStandardMaterial color="#0a1020" metalness={0.6} roughness={0.8} />
      </mesh>
      {/* 网格线 */}
      <gridHelper args={[24, 24, "#1e2939", "#111827"]} position={[0, -1.99, 0]} />
    </>
  );
}

// ============ 主场景 ============
export default function PlantScene({ selectedId, hoveredId, onSelect, onHover, cutaway }) {
  const shared = { selectedId, hoveredId, onSelect, onHover };

  return (
    <Canvas
      camera={{ position: [10, 5, 14], fov: 42 }}
      dpr={[1, 2]}
      shadows
      gl={{ antialias: true, alpha: false }}
    >
      <color attach="background" args={["#070b14"]} />
      <fog attach="fog" args={["#070b14", 16, 36]} />

      <SceneLights />

      <Containment comp={plantComponents[0]} cutaway={cutaway} {...shared} />
      <PressureVessel comp={plantComponents[1]} cutaway={cutaway} {...shared} />
      <ReactorCore comp={plantComponents[2]} {...shared} />
      <ControlRods comp={plantComponents[3]} {...shared} />
      <CoolingPipes comp={plantComponents[4]} {...shared} />
      <SteamGenerator comp={plantComponents[5]} cutaway={cutaway} {...shared} />

      {/* 能量流装饰粒子 */}
      <Float speed={2} rotationIntensity={0} floatIntensity={0.5}>
        <Sparkles
          count={40}
          scale={[10, 5, 6]}
          position={[2, 1, 0]}
          size={2}
          color="#22d3ee"
          speed={0.4}
        />
      </Float>

      <Floor />
      <ContactShadows
        position={[0, -1.98, 0]}
        opacity={0.5}
        scale={16}
        blur={2}
        far={6}
        color="#000000"
      />

      <OrbitControls
        enablePan={false}
        minDistance={6}
        maxDistance={24}
        maxPolarAngle={Math.PI / 1.7}
        minPolarAngle={Math.PI / 6}
        autoRotate
        autoRotateSpeed={0.8}
        enableDamping
        dampingFactor={0.05}
      />
    </Canvas>
  );
}
