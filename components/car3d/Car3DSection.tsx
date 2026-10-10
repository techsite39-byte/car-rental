"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, useGLTF } from "@react-three/drei";
import {
  Box3,
  MathUtils,
  Mesh,
  PCFShadowMap,
  Vector3,
  type Group,
} from "three";
import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
  type ReactNode,
} from "react";
import "./Car3DSection.css";

const MODEL_URL = "/models/luxury-sedan.glb";

interface PointerPosition {
  x: number;
  y: number;
}

interface CarModelProps {
  pointer: RefObject<PointerPosition>;
  reducedMotion: boolean;
  sectionRef: RefObject<HTMLElement | null>;
  onLoaded: () => void;
}

function CarModel({
  pointer,
  reducedMotion,
  sectionRef,
  onLoaded,
}: CarModelProps) {
  const { scene } = useGLTF(MODEL_URL);
  const rotationGroup = useRef<Group>(null);
  const scrollRotation = useRef(0);
  const { invalidate } = useThree();

  useEffect(() => {
    onLoaded();
  }, [onLoaded]);

  const layout = useMemo(() => {
    const bounds = new Box3().setFromObject(scene);
    if (bounds.isEmpty()) {
      throw new Error(`The 3D car model at ${MODEL_URL} has no visible geometry.`);
    }

    const size = bounds.getSize(new Vector3());
    const center = bounds.getCenter(new Vector3());
    const horizontalSize = Math.max(size.x, size.z);
    if (horizontalSize <= 0) {
      throw new Error(`The 3D car model at ${MODEL_URL} has invalid dimensions.`);
    }

    scene.traverse((object) => {
      if (object instanceof Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });

    return {
      center,
      ground: bounds.min.y,
      scale: 4.6 / horizontalSize,
      orientation: size.x > size.z ? Math.PI / 2 : 0,
    };
  }, [scene]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const handlePointerMove = (event: globalThis.PointerEvent) => {
      if (reducedMotion) return;

      const bounds = section.getBoundingClientRect();
      if (bounds.width === 0 || bounds.height === 0) return;

      pointer.current.x = MathUtils.clamp(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        -1,
        1,
      );
      pointer.current.y = MathUtils.clamp(
        ((event.clientY - bounds.top) / bounds.height) * 2 - 1,
        -1,
        1,
      );
      invalidate();
    };

    const handlePointerLeave = () => {
      pointer.current.x = 0;
      pointer.current.y = 0;
      invalidate();
    };

    section.addEventListener("pointermove", handlePointerMove);
    section.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      section.removeEventListener("pointermove", handlePointerMove);
      section.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [invalidate, pointer, reducedMotion, sectionRef]);

  useEffect(() => {
    const updateScrollRotation = () => {
      if (reducedMotion) {
        scrollRotation.current = 0;
      } else {
        const section = sectionRef.current;
        if (!section) return;

        const bounds = section.getBoundingClientRect();
        const progress = MathUtils.clamp(
          (window.innerHeight - bounds.top) / (window.innerHeight + bounds.height),
          0,
          1,
        );
        scrollRotation.current = (progress - 0.5) * 0.72;
      }

      invalidate();
    };

    updateScrollRotation();
    window.addEventListener("scroll", updateScrollRotation, { passive: true });
    window.addEventListener("resize", updateScrollRotation, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateScrollRotation);
      window.removeEventListener("resize", updateScrollRotation);
    };
  }, [invalidate, reducedMotion, sectionRef]);

  useFrame((_, delta) => {
    const group = rotationGroup.current;
    if (!group) return;

    if (reducedMotion) {
      group.rotation.set(0, 0, 0);
      return;
    }

    const targetX = pointer.current.y * 0.08;
    const targetY = scrollRotation.current + pointer.current.x * 0.2;
    group.rotation.x = MathUtils.damp(group.rotation.x, targetX, 5, delta);
    group.rotation.y = MathUtils.damp(group.rotation.y, targetY, 5, delta);

    if (
      Math.abs(group.rotation.x - targetX) > 0.001 ||
      Math.abs(group.rotation.y - targetY) > 0.001
    ) {
      invalidate();
    }
  });

  return (
    <>
      <group ref={rotationGroup}>
        <group rotation={[0, layout.orientation, 0]}>
          <group scale={layout.scale}>
            <group
              position={[-layout.center.x, -layout.ground, -layout.center.z]}
            >
              <primitive object={scene} />
            </group>
          </group>
        </group>
      </group>
      <ContactShadows
        blur={2.5}
        far={4}
        opacity={0.48}
        position={[0, 0, 0]}
        scale={9}
        color="#000000"
      />
    </>
  );
}

interface Car3DErrorBoundaryProps {
  children: ReactNode;
  onError: () => void;
}

class Car3DErrorBoundary extends Component<
  Car3DErrorBoundaryProps,
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("Unable to render the 3D car preview.", error);
    this.props.onError();
  }

  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

function ResponsiveCamera() {
  const { camera, size } = useThree();

  useEffect(() => {
    if (size.width < 640) {
      const distance = MathUtils.clamp(
        6.7 + (380 - size.width) * 0.0243,
        6.7,
        8.4,
      );
      const horizontalAim =
        -0.5 - MathUtils.clamp((size.width - 320) * 0.005, 0, 0.3);
      camera.position.set(
        distance * 0.56 + horizontalAim + 0.5,
        1.4,
        distance * 0.83,
      );
      camera.lookAt(horizontalAim, 1, 0);
    } else {
      camera.position.set(4.8, 1.4, 6.4);
      camera.lookAt(0, 0.45, 0);
    }
    camera.updateProjectionMatrix();
  }, [camera, size.width]);

  return null;
}

export function Car3DSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const pointer = useRef<PointerPosition>({ x: 0, y: 0 });
  const [reducedMotion, setReducedMotion] = useState(true);
  const [previewStatus, setPreviewStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");

  const handleModelLoaded = useCallback(
    () => setPreviewStatus("ready"),
    [],
  );
  const handleModelError = useCallback(
    () => setPreviewStatus("error"),
    [],
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="car3d"
      aria-labelledby="car3d-title"
    >
      <div className="car3d__copy">
        <p className="car3d__eyebrow">A NEW PERSPECTIVE ON LUXURY</p>
        <h2 id="car3d-title">Made to move you.</h2>
        <p className="car3d__description">
          Discover every curve of a more considered drive.
        </p>
      </div>
      <div
        className="car3d__canvas"
        aria-hidden="true"
      >
        <Car3DErrorBoundary onError={handleModelError}>
          <Canvas
            camera={{ position: [4.8, 1.4, 6.4], fov: 38 }}
            dpr={[1, 1.5]}
            frameloop="demand"
            gl={{
              alpha: true,
              antialias: true,
              powerPreference: "high-performance",
            }}
            shadows={{ type: PCFShadowMap }}
            fallback="Interactive 3D preview of a luxury sedan."
          >
            <ambientLight intensity={0.65} />
            <directionalLight
              castShadow
              intensity={3.2}
              position={[4, 7, 5]}
              shadow-mapSize={[1024, 1024]}
            />
            <spotLight
              angle={0.55}
              intensity={55}
              penumbra={0.8}
              position={[-4, 5, -3]}
            />
            <ResponsiveCamera />
            <Suspense fallback={null}>
              <Environment preset="studio" />
            </Suspense>
            <Suspense fallback={null}>
              <CarModel
                pointer={pointer}
                reducedMotion={reducedMotion}
                sectionRef={sectionRef}
                onLoaded={handleModelLoaded}
              />
            </Suspense>
          </Canvas>
        </Car3DErrorBoundary>
      </div>
      {previewStatus === "loading" && (
        <p className="car3d__status" role="status">
          Loading the 3D car preview...
        </p>
      )}
      {previewStatus === "error" && (
        <p className="car3d__status car3d__status--error" role="alert">
          The 3D preview is unavailable, but the rest of the page is ready.
        </p>
      )}
    </section>
  );
}