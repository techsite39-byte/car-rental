"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, useGLTF } from "@react-three/drei";
import {
  AmbientLight,
  AdditiveBlending,
  Box3,
  Color,
  DoubleSide,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PointLight,
  Vector3,
  type Material,
  type Group,
} from "three";
import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
  type ReactNode,
} from "react";
import "./Car3DSection.css";

gsap.registerPlugin(ScrollTrigger);

const MODEL_URL = "/bmw_m4_competition_m_package.glb";
const SCENE_POSES = [
  { carYaw: 0, carX: 0.48, scale: 1, camera: [6.2, 2.8, 7.6], target: [0, 0.85, 0], headlights: 0, taillights: 0, cabin: 0 },
  { carYaw: 0, carX: 0.48, scale: 1, camera: [3.3, 1.65, 5.4], target: [0.35, 0.9, 2.45], headlights: 0, taillights: 0, cabin: 0 },
  { carYaw: 0, carX: 0.35, scale: 1, camera: [2.8, 1.85, 7.6], target: [0, 0.85, 2.1], headlights: 1, taillights: 0, cabin: 0 },
  { carYaw: 0.04, carX: 0.2, scale: 1, camera: [3.2, 2, -8.5], target: [0, 0.85, -2], headlights: 0, taillights: 1, cabin: 0 },
  { carYaw: 0, carX: 0.25, scale: 1, camera: [3.3, 1.9, 8.2], target: [0, 0.9, 1.4], headlights: 0.45, taillights: 0, cabin: 0 },
  { carYaw: 0, carX: 0.1, scale: 1, camera: [2.8, 1.5, 0.2], target: [0, 1.05, 0.45], headlights: 0, taillights: 0, cabin: 0.35 },
  { carYaw: 0, carX: 0, scale: 1, camera: [0.55, 1.1, 0.05], target: [0.1, 1, 0.65], headlights: 0, taillights: 0, cabin: 0.8 },
  { carYaw: 0, carX: 0, scale: 1, camera: [-0.2, 1.05, 0.1], target: [0, 1, 0.8], headlights: 0, taillights: 0, cabin: 1 },
  { carYaw: 0.02, carX: 0, scale: 1, camera: [3.6, 2.1, -5.6], target: [0, 0.9, -0.8], headlights: 0, taillights: 0, cabin: 0 },
  { carYaw: 0, carX: 0.35, scale: 1, camera: [6.2, 2.8, 7.6], target: [0, 0.85, 0], headlights: 0, taillights: 0, cabin: 0 },
] as const;
const CHAPTERS = [
  {
    number: "01",
    eyebrow: "ENGINEERED TO BE SEEN",
    title: "Precision in every detail.",
    description: "The complete BMW M4 Competition, framed for its first reveal.",
  },
  {
    number: "02",
    eyebrow: "A CLEARER PERSPECTIVE",
    title: "Light the way forward.",
    description: "Move closer to the front signature and sculpted bodywork.",
  },
  {
    number: "03",
    eyebrow: "DISTINCT FROM EVERY ANGLE",
    title: "Light, unmistakably M.",
    description: "The front lighting comes alive against the M4's unmistakable stance.",
  },
  {
    number: "04",
    eyebrow: "DISTINCT FROM EVERY ANGLE",
    title: "A signature from every angle.",
    description: "The rear lamps glow red across the M4's broad shoulders.",
  },
  {
    number: "05",
    eyebrow: "THE MOMENT BEFORE THE DRIVE",
    title: "Power awakens.",
    description: "A quiet visual ignition, led by the real model and its reflections.",
  },
  {
    number: "06",
    eyebrow: "A DRIVER-FOCUSED VIEW",
    title: "A closer look within.",
    description: "A view through the side glass reveals the cabin geometry in this model.",
  },
  {
    number: "07",
    eyebrow: "THE VÉLOCE EXPERIENCE",
    title: "Designed around the driver.",
    description: "A closer view of the dashboard and interior details present in this model.",
  },
  {
    number: "08",
    eyebrow: "A STUDY IN FORM",
    title: "Every detail. One experience.",
    description: "A closer view of the modeled dashboard and cabin materials.",
  },
  {
    number: "09",
    eyebrow: "BACK TO THE OPEN ROAD",
    title: "A presence all its own.",
    description: "Return to the composed side profile and unmistakable proportions.",
  },
  {
    number: "10",
    eyebrow: "VÉLOCE",
    title: "Made to move you.",
    description: "Every angle. One drive.",
  },
] as const;
const PAINT_MATERIALS = new Set([
  "Meshesbody151Mtl",
  "Mesheszx1Mtl",
  "Mesheslivery1Mtl",
]);
const HEADLIGHT_MATERIALS = new Set([
  "Mesheslight51Mtl",
  "Meshesled111Mtl",
]);
const TAILLIGHT_MATERIALS = new Set([
  "Meshesredlight1Mtl",
  "Meshestail71Mtl",
]);
const WINDOW_MATERIAL = "Mesheswindows1Mtl";
const HEADLIGHT_EMISSIVE = new Color("#f4f8ff");
const TAILLIGHT_EMISSIVE = new Color("#ff0000");

interface AnimatedLightMaterial {
  material: MeshStandardMaterial;
  originalEmissive: Color;
  originalIntensity: number;
  color: Color;
}

interface AnimatedWindowMaterial {
  material: MeshStandardMaterial;
  originalOpacity: number;
}

interface AnimatedLightOverlay {
  material: MeshBasicMaterial;
  intensity: number;
}

function interpolatePose(start: number, end: number, progress: number) {
  return MathUtils.lerp(start, end, progress);
}

interface PointerPosition {
  x: number;
  y: number;
}

interface CarModelProps {
  ambientLightRef: RefObject<AmbientLight | null>;
  modelReady: boolean;
  reducedMotion: boolean;
  rendererReady: boolean;
  sectionRef: RefObject<HTMLElement | null>;
  stageRef: RefObject<HTMLDivElement | null>;
  onLoaded: () => void;
}

function CarModel({
  ambientLightRef,
  modelReady,
  reducedMotion,
  rendererReady,
  sectionRef,
  stageRef,
  onLoaded,
}: CarModelProps) {
  const { scene } = useGLTF(MODEL_URL);
  const rotationGroup = useRef<Group>(null);
  const pointer = useRef<PointerPosition>({ x: 0, y: 0 });
  const scrollProgress = useRef(0);
  const { camera, invalidate, size } = useThree();
  const cameraRef = useRef<PerspectiveCamera | null>(
    camera instanceof PerspectiveCamera ? camera : null,
  );
  const cameraTarget = useRef(new Vector3());
  const contactShadowRef = useRef<Group>(null);
  const cabinLightRef = useRef<PointLight>(null);

  useEffect(() => {
    onLoaded();
  }, [onLoaded]);

  const layout = useMemo(() => {
    const model = scene.clone(true);
    const clonedMaterials = new Map<Material, Material>();
    const headlightOverlays: AnimatedLightOverlay[] = [];
    const taillightOverlays: AnimatedLightOverlay[] = [];
    const bounds = new Box3().setFromObject(model);
    if (bounds.isEmpty()) {
      throw new Error(`The 3D car model at ${MODEL_URL} has no visible geometry.`);
    }

    const size = bounds.getSize(new Vector3());
    const center = bounds.getCenter(new Vector3());
    const horizontalSize = Math.max(size.x, size.z);
    if (horizontalSize <= 0) {
      throw new Error(`The 3D car model at ${MODEL_URL} has invalid dimensions.`);
    }

    const cloneMaterial = (material: Material) => {
      const existingClone = clonedMaterials.get(material);
      if (existingClone) return existingClone;

      const clonedMaterial = material.clone();
      if (
        clonedMaterial instanceof MeshStandardMaterial &&
        PAINT_MATERIALS.has(material.name)
      ) {
        clonedMaterial.color.set("#08090b");
        clonedMaterial.metalness = 0.72;
        clonedMaterial.roughness = 0.2;
        clonedMaterial.envMapIntensity = 1.8;
      }
      clonedMaterials.set(material, clonedMaterial);
      return clonedMaterial;
    };

    model.traverse((object) => {
      if (object instanceof Mesh && !object.name.endsWith("-light-overlay")) {
        object.material = Array.isArray(object.material)
          ? object.material.map(cloneMaterial)
          : cloneMaterial(object.material);

        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material];
        const lightMaterialName = materials.find(
          (material) =>
            material instanceof MeshStandardMaterial &&
            (HEADLIGHT_MATERIALS.has(material.name) ||
              TAILLIGHT_MATERIALS.has(material.name)),
        )?.name;
        if (lightMaterialName) {
          const isHeadlight = HEADLIGHT_MATERIALS.has(lightMaterialName);
          const overlayMaterial = new MeshBasicMaterial({
            blending: AdditiveBlending,
            color: isHeadlight ? HEADLIGHT_EMISSIVE : TAILLIGHT_EMISSIVE,
            depthWrite: false,
            opacity: 0,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            side: DoubleSide,
            toneMapped: false,
            transparent: true,
          });
          const overlayMesh = new Mesh(object.geometry, overlayMaterial);
          overlayMesh.name = `${object.name}-light-overlay`;
          overlayMesh.renderOrder = 1;
          overlayMesh.castShadow = false;
          overlayMesh.receiveShadow = false;
          object.add(overlayMesh);
          (isHeadlight ? headlightOverlays : taillightOverlays).push({
            material: overlayMaterial,
            intensity: isHeadlight ? 0.72 : 0.82,
          });
        }
      }
    });

    const animatedMaterials = (
      names: Set<string>,
      color: Color,
    ): AnimatedLightMaterial[] =>
      Array.from(clonedMaterials.values())
        .filter(
          (material): material is MeshStandardMaterial =>
            material instanceof MeshStandardMaterial &&
            names.has(material.name),
        )
        .map((material) => ({
          material,
          originalEmissive: material.emissive.clone(),
          originalIntensity: material.emissiveIntensity,
          color: color.clone(),
        }));

    const windowMaterials: AnimatedWindowMaterial[] = Array.from(
      clonedMaterials.values(),
    )
      .filter(
        (material): material is MeshStandardMaterial =>
          material instanceof MeshStandardMaterial &&
          material.name === WINDOW_MATERIAL,
      )
      .map((material) => ({
        material,
        originalOpacity: material.opacity,
      }));

    return {
      model,
      center,
      ground: bounds.min.y,
      scale: 5.8 / horizontalSize,
      orientation: size.x > size.z ? Math.PI / 2 : 0,
      headlightMaterials: animatedMaterials(HEADLIGHT_MATERIALS, HEADLIGHT_EMISSIVE),
      taillightMaterials: animatedMaterials(TAILLIGHT_MATERIALS, TAILLIGHT_EMISSIVE),
      windowMaterials,
      headlightOverlays,
      taillightOverlays,
    };
  }, [scene]);
  const headlightMaterialsRef = useRef(layout.headlightMaterials);
  const taillightMaterialsRef = useRef(layout.taillightMaterials);
  const animatedWindowMaterialsRef = useRef(layout.windowMaterials);
  const headlightOverlaysRef = useRef(layout.headlightOverlays);
  const taillightOverlaysRef = useRef(layout.taillightOverlays);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const handlePointerMove = (event: globalThis.PointerEvent) => {
      if (reducedMotion || event.pointerType !== "mouse") return;

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

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (
      !modelReady ||
      !rendererReady ||
      size.width <= 0 ||
      size.height <= 0 ||
      !section ||
      !stage
    ) {
      return;
    }

    const stageBounds = stage.getBoundingClientRect();
    if (stageBounds.width <= 0 || stageBounds.height <= 0) return;

    if (reducedMotion) {
      scrollProgress.current = 0;
      invalidate();
      return;
    }

    const chapters = Array.from(
      stage.querySelectorAll<HTMLElement>("[data-car3d-chapter]"),
    );
    if (chapters.length !== CHAPTERS.length) {
      throw new Error("The BMW scroll sequence is missing a chapter panel.");
    }

    const context = gsap.context(() => {
      const driver = { value: 0 };
      gsap.set(chapters, { autoAlpha: 0, y: 14 });
      gsap.set(chapters[0], { autoAlpha: 1, y: 0 });

      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section,
          pin: stage,
          pinSpacing: true,
          start: "top top",
          end: () => `+=${window.innerHeight * (SCENE_POSES.length - 1)}`,
          scrub: 0.55,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      timeline.to(
        driver,
        {
          value: CHAPTERS.length - 1,
          duration: CHAPTERS.length - 1,
          onUpdate: () => {
            scrollProgress.current = driver.value;
            invalidate();
          },
        },
        0,
      );

      for (let index = 1; index < SCENE_POSES.length; index += 1) {
        if (ambientLightRef.current) {
          timeline.to(
            ambientLightRef.current,
            { intensity: index >= 5 && index <= 7 ? 0.63 : 0.38, duration: 1 },
            index - 1,
          );
        }
      }

      const techOverlay = stage.querySelector<HTMLElement>(
        ".car3d__tech-overlay",
      );
      if (techOverlay) {
        gsap.set(techOverlay, { autoAlpha: 0 });
        timeline
          .to(techOverlay, { autoAlpha: 1, duration: 0.22 }, 6.15)
          .to(techOverlay, { autoAlpha: 0, duration: 0.22 }, 7.2);
      }

      for (let index = 1; index < chapters.length; index += 1) {
        const transitionStart =
          index === chapters.length - 1 ? index - 0.5 : index - 0.2;
        timeline
          .to(
            chapters[index - 1],
            { autoAlpha: 0, y: -12, duration: 0.2 },
            transitionStart,
          )
          .fromTo(
            chapters[index],
            { autoAlpha: 0, y: 14 },
            { autoAlpha: 1, y: 0, duration: 0.2 },
            transitionStart + 0.2,
          );
      }
    }, section);

    const refreshFrame = window.requestAnimationFrame(() =>
      ScrollTrigger.refresh(),
    );
    const refreshAfterPageRestore = () => {
      window.requestAnimationFrame(() => ScrollTrigger.refresh());
    };
    window.addEventListener("pageshow", refreshAfterPageRestore);
    return () => {
      window.cancelAnimationFrame(refreshFrame);
      window.removeEventListener("pageshow", refreshAfterPageRestore);
      context.revert();
    };
  }, [
    ambientLightRef,
    invalidate,
    modelReady,
    reducedMotion,
    rendererReady,
    sectionRef,
    size.height,
    size.width,
    stageRef,
  ]);

  useEffect(() => {
    const activeCamera = cameraRef.current;
    if (!activeCamera) return;
    activeCamera.fov = size.width < 640 ? 50 : 38;
    activeCamera.updateProjectionMatrix();
    invalidate();
  }, [invalidate, size.width]);

  useEffect(() => {
    return () => {
      const disposedMaterials = new Set<Material>();
      layout.model.traverse((object) => {
        if (!(object instanceof Mesh)) return;

        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material];
        materials.forEach((material) => {
          if (disposedMaterials.has(material)) return;
          material.dispose();
          disposedMaterials.add(material);
        });
      });
    };
  }, [layout.model]);

  useEffect(() => {
    if (reducedMotion) {
      pointer.current.x = 0;
      pointer.current.y = 0;
    }
    invalidate();
  }, [invalidate, pointer, reducedMotion]);

  useFrame(() => {
    const group = rotationGroup.current;
    if (!group) return;

    const camera = cameraRef.current;
    if (!camera) return;

    const responsiveScale =
      size.width < 640
        ? MathUtils.clamp(size.width / 480, 0.78, 1)
        : 1;
    if (reducedMotion) {
      for (const effect of headlightMaterialsRef.current) {
        effect.material.emissive.copy(effect.originalEmissive);
        effect.material.emissiveIntensity = effect.originalIntensity;
      }
      for (const effect of taillightMaterialsRef.current) {
        effect.material.emissive.copy(effect.originalEmissive);
        effect.material.emissiveIntensity = effect.originalIntensity;
      }
      for (const effect of animatedWindowMaterialsRef.current) {
        effect.material.opacity = effect.originalOpacity;
      }
      for (const effect of headlightOverlaysRef.current) {
        effect.material.opacity = 0;
      }
      for (const effect of taillightOverlaysRef.current) {
        effect.material.opacity = 0;
      }
      if (cabinLightRef.current) cabinLightRef.current.intensity = 0;
      group.rotation.set(0, 0, 0);
      group.scale.setScalar(responsiveScale);
      group.position.x = SCENE_POSES[0].carX;
      group.position.y = 0;
      if (contactShadowRef.current) {
        contactShadowRef.current.position.x =
          group.position.x - SCENE_POSES[0].carX;
      }
      camera.position.set(...SCENE_POSES[0].camera);
      camera.lookAt(...SCENE_POSES[0].target);
      return;
    }

    const progress = MathUtils.clamp(
      scrollProgress.current,
      0,
      SCENE_POSES.length - 1,
    );
    const poseIndex = Math.min(
      Math.floor(progress),
      SCENE_POSES.length - 2,
    );
    const poseProgress =
      progress >= SCENE_POSES.length - 1
        ? 1
        : MathUtils.smoothstep(progress - poseIndex, 0, 1);
    const startPose = SCENE_POSES[poseIndex];
    const endPose = SCENE_POSES[poseIndex + 1];
    const cameraDistanceScale = size.width < 640 ? 1.35 : 1;
    const headlights = interpolatePose(
      startPose.headlights,
      endPose.headlights,
      poseProgress,
    );
    const taillights = interpolatePose(
      startPose.taillights,
      endPose.taillights,
      poseProgress,
    );
    const cabin = interpolatePose(startPose.cabin, endPose.cabin, poseProgress);
    for (const effect of headlightMaterialsRef.current) {
      effect.material.emissive
        .copy(effect.originalEmissive)
        .lerp(effect.color, headlights);
      effect.material.emissiveIntensity = interpolatePose(
        effect.originalIntensity,
        12,
        headlights,
      );
    }
    for (const effect of taillightMaterialsRef.current) {
      effect.material.emissive
        .copy(effect.originalEmissive)
        .lerp(effect.color, taillights);
      effect.material.emissiveIntensity = interpolatePose(
        effect.originalIntensity,
        6,
        taillights,
      );
    }
    for (const effect of headlightOverlaysRef.current) {
      effect.material.opacity = headlights * effect.intensity;
    }
    for (const effect of taillightOverlaysRef.current) {
      effect.material.opacity = taillights * effect.intensity;
    }
    for (const effect of animatedWindowMaterialsRef.current) {
      effect.material.opacity = interpolatePose(
        effect.originalOpacity,
        0.04,
        cabin,
      );
    }
    if (cabinLightRef.current) cabinLightRef.current.intensity = cabin * 1.2;

    group.rotation.x = pointer.current.y * 0.035;
    group.rotation.y = interpolatePose(
      startPose.carYaw,
      endPose.carYaw,
      poseProgress,
    );
    group.position.x = interpolatePose(
      startPose.carX,
      endPose.carX,
      poseProgress,
    );
    if (contactShadowRef.current) {
      contactShadowRef.current.position.x =
        group.position.x - SCENE_POSES[0].carX;
    }
    const ignitionProgress =
      poseIndex === 3
        ? Math.sin(poseProgress * Math.PI)
        : 0;
    group.position.y =
      ignitionProgress * Math.sin(poseProgress * Math.PI * 8) * 0.003;
    group.scale.setScalar(
      responsiveScale *
        interpolatePose(startPose.scale, endPose.scale, poseProgress),
    );

    const startAngle = Math.atan2(startPose.camera[0], startPose.camera[2]);
    const endAngle = Math.atan2(endPose.camera[0], endPose.camera[2]);
    let angleDelta = endAngle - startAngle;
    if (angleDelta > Math.PI) angleDelta -= Math.PI * 2;
    if (angleDelta < -Math.PI) angleDelta += Math.PI * 2;
    const cameraAngle = startAngle + angleDelta * poseProgress;
    const cameraRadius = MathUtils.lerp(
      Math.hypot(startPose.camera[0], startPose.camera[2]),
      Math.hypot(endPose.camera[0], endPose.camera[2]),
      poseProgress,
    );
    camera.position.set(
      Math.sin(cameraAngle) * cameraRadius * cameraDistanceScale,
      interpolatePose(
        startPose.camera[1],
        endPose.camera[1],
        poseProgress,
      ) * cameraDistanceScale,
      Math.cos(cameraAngle) * cameraRadius * cameraDistanceScale,
    );
    cameraTarget.current.set(
      interpolatePose(startPose.target[0], endPose.target[0], poseProgress),
      interpolatePose(startPose.target[1], endPose.target[1], poseProgress),
      interpolatePose(startPose.target[2], endPose.target[2], poseProgress),
    );
    camera.lookAt(cameraTarget.current);
  });

  return (
    <>
      <group ref={rotationGroup}>
        <pointLight
          ref={cabinLightRef}
          color="#d7e2f0"
          distance={3.2}
          decay={2}
          intensity={0}
          position={[0.1, 1.12, 0.4]}
        />
        <group rotation={[0, layout.orientation, 0]}>
          <group scale={layout.scale}>
            <group
              position={[-layout.center.x, -layout.ground, -layout.center.z]}
            >
              <primitive object={layout.model} />
            </group>
          </group>
        </group>
      </group>
      <ContactShadows
        ref={contactShadowRef}
        blur={2.5}
        far={4}
        frames={1}
        opacity={0.48}
        position={[0, 0, 0]}
        scale={10}
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

export function Car3DSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const ambientLightRef = useRef<AmbientLight>(null);
  const [rendererReady, setRendererReady] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const previewStatus = previewError
    ? "error"
    : rendererReady && modelReady
      ? "ready"
      : "loading";

  const handleModelLoaded = useCallback(
    () => setModelReady(true),
    [],
  );
  const handleModelError = useCallback(
    () => setPreviewError(true),
    [],
  );
  const handleRendererReady = useCallback(
    () => setRendererReady(true),
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
      className={`car3d${reducedMotion ? " car3d--reduced" : ""}${previewStatus === "ready" ? " car3d--ready" : ""}`}
      aria-labelledby="car3d-title"
    >
      <div className="car3d__stage" ref={stageRef}>
        <div className="car3d__canvas" aria-hidden="true">
          <Car3DErrorBoundary onError={handleModelError}>
            <Canvas
              camera={{ position: [4.4, 1.55, 5.9], fov: 38 }}
              dpr={[1, 1.25]}
              frameloop="demand"
              gl={{
                alpha: true,
                antialias: true,
                powerPreference: "high-performance",
              }}
              onCreated={handleRendererReady}
              fallback="Interactive 3D preview of the BMW M4 Competition."
            >
              <ambientLight ref={ambientLightRef} intensity={0.38} />
              <directionalLight
                intensity={2.4}
                position={[4, 7, 5]}
              />
              <spotLight
                angle={0.55}
                intensity={36}
                penumbra={0.8}
                position={[-4, 5, -3]}
              />
              <Suspense fallback={null}>
                <Environment preset="studio" />
              </Suspense>
              <Suspense fallback={null}>
                <CarModel
                  ambientLightRef={ambientLightRef}
                  modelReady={modelReady}
                  reducedMotion={reducedMotion}
                  rendererReady={rendererReady}
                  sectionRef={sectionRef}
                  stageRef={stageRef}
                  onLoaded={handleModelLoaded}
                />
              </Suspense>
            </Canvas>
          </Car3DErrorBoundary>
        </div>
        <div className="car3d__vignette" aria-hidden="true" />
        <div className="car3d__tech-overlay" aria-hidden="true">
          <span>PAINT</span>
          <span>GLASS</span>
          <span>WHEELS</span>
        </div>
        <div className="car3d__chapters">
          {CHAPTERS.map((chapter, index) => (
            <article
              aria-labelledby={`car3d-chapter-${chapter.number}`}
              className={`car3d__chapter car3d__chapter--${chapter.number}`}
              data-car3d-chapter
              key={chapter.number}
            >
              <p className="car3d__eyebrow">
                <span>{chapter.number}</span>
                {chapter.eyebrow}
              </p>
              <h2 id={`car3d-chapter-${chapter.number}`}>
                {index === 0 ? (
                  <span id="car3d-title">{chapter.title}</span>
                ) : (
                  chapter.title
                )}
              </h2>
              <p className="car3d__description">{chapter.description}</p>
              {index === 1 && (
                <ul className="car3d__detail-list">
                  <li>Bodywork</li>
                  <li>Wheel design</li>
                  <li>Stance</li>
                </ul>
              )}
            </article>
          ))}
        </div>
        {previewStatus === "loading" && (
          <p className="car3d__status car3d__status--loading" role="status">
            <span className="car3d__loading-line" aria-hidden="true" />
            Loading the BMW M4 Competition 3D preview...
          </p>
        )}
        {previewStatus === "error" && (
          <p className="car3d__status car3d__status--error" role="alert">
            The BMW 3D preview is unavailable, but the rest of the page is ready.
          </p>
        )}
        <p className="car3d__scroll-cue" aria-hidden="true">
          SCROLL TO EXPLORE <span />
        </p>
      </div>
    </section>
  );
}