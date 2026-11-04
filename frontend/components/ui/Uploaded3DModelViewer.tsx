"use client";

import { Component, Suspense, useMemo, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { Bounds, Center, OrbitControls, useGLTF } from "@react-three/drei";

class ModelErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full min-h-64 items-center justify-center p-4 text-center text-sm text-rose-300">
          Could not load this GLB model. Check that the file is valid.
        </div>
      );
    }
    return this.props.children;
  }
}

function LoadedModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const sceneClone = useMemo(() => scene.clone(true), [scene]);
  return <primitive object={sceneClone} />;
}

export function Uploaded3DModelViewer({
  url,
  title,
  className = "",
  interactive = true,
  showControlsHint = true,
}: {
  url: string;
  title: string;
  className?: string;
  interactive?: boolean;
  showControlsHint?: boolean;
}) {
  return (
    <div
      className={`relative min-h-64 overflow-hidden rounded-xl bg-neutral-200 ${className}`}
      aria-label={`Interactive 3D model: ${title}`}
      aria-roledescription="interactive 3D model viewer"
    >
      <ModelErrorBoundary key={url}>
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <color attach="background" args={["#e5e7eb"]} />
          <ambientLight intensity={1.2} />
          <directionalLight position={[5, 8, 6]} intensity={2} />
          <directionalLight position={[-5, -3, -4]} intensity={0.8} color="#67e8f9" />
          <Suspense fallback={null}>
            <Bounds fit clip observe margin={1.25}>
              <Center>
                <LoadedModel url={url} />
              </Center>
            </Bounds>
          </Suspense>
          <OrbitControls
            makeDefault
            enabled={interactive}
            enableDamping
            enablePan={interactive}
            enableZoom={interactive}
          />
        </Canvas>
      </ModelErrorBoundary>
      {showControlsHint ? (
        <span className="pointer-events-none absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-[10px] text-white/80">
          Drag to rotate · scroll to zoom
        </span>
      ) : null}
    </div>
  );
}
