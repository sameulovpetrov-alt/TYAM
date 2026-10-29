import { useCallback, useEffect, useRef, type MutableRefObject, type PointerEvent } from "react";
import * as THREE from "three";
import { SurvivalWorld, type BuildKind, type MoveInput, type Terrain } from "../game/engine";

interface GameCanvasProps {
  world: SurvivalWorld;
  input: MutableRefObject<MoveInput>;
  onFrame: (fps: number) => void;
  onNotify: (message: string) => void;
  onLockChange: (locked: boolean) => void;
}

interface VoxelPart {
  nodeId: number;
  position: THREE.Vector3;
  scale: THREE.Vector3;
  color: THREE.ColorRepresentation;
  rotation?: number;
}

interface PartSlot {
  mesh: THREE.InstancedMesh;
  index: number;
}

interface TouchLook {
  pointerId: number;
  x: number;
  y: number;
  active: boolean;
}

const FOG_DAY = new THREE.Color("#a5bcb0");
const FOG_NIGHT = new THREE.Color("#26363a");
const SKY_DAY = new THREE.Color("#91ada8");
const SKY_NIGHT = new THREE.Color("#18272f");
const WATER_DAY = new THREE.Color("#28555a");
const WATER_NIGHT = new THREE.Color("#1a343b");

function surfaceHeight(terrain: Terrain, elevation: number): number {
  if (terrain === "shore") return 0.26;
  if (terrain === "rock") return 0.78 + elevation * 0.34;
  return 0.72 + elevation * 0.27;
}

function groundHeight(world: SurvivalWorld, x: number, z: number): number {
  const tile = world.tileAt(x, z);
  return surfaceHeight(tile.terrain, tile.height);
}

function addPart(buckets: Map<string, VoxelPart[]>, key: string, part: VoxelPart): void {
  const bucket = buckets.get(key);
  if (bucket) bucket.push(part);
  else buckets.set(key, [part]);
}

function createParts(world: SurvivalWorld): Map<string, VoxelPart[]> {
  const buckets = new Map<string, VoxelPart[]>();
  for (const node of world.nodes) {
    if (node.gone) continue;
    const floor = groundHeight(world, node.x, node.y);
    const variant = node.variant;
    if (node.kind === "pine") {
      const trunkHeight = 1.6 + variant * 0.28;
      addPart(buckets, "trunk", {
        nodeId: node.id,
        position: new THREE.Vector3(node.x, floor + trunkHeight / 2, node.y),
        scale: new THREE.Vector3(0.22, trunkHeight, 0.22),
        color: variant > 0.6 ? "#80694b" : "#72583d",
      });
      const layers = [
        { width: 1.45, height: 0.74, y: 1.48, color: variant > 0.6 ? "#60724c" : "#526a45" },
        { width: 1.13, height: 0.7, y: 2.08, color: variant > 0.6 ? "#6b7c52" : "#5b7448" },
        { width: 0.77, height: 0.62, y: 2.63, color: variant > 0.6 ? "#78845a" : "#687b50" },
      ];
      for (const layer of layers) {
        addPart(buckets, "leaves", {
          nodeId: node.id,
          position: new THREE.Vector3(node.x, floor + layer.y + variant * 0.14, node.y),
          scale: new THREE.Vector3(layer.width, layer.height, layer.width),
          color: layer.color,
        });
      }
    } else if (node.kind === "stone") {
      const width = 0.72 + variant * 0.22;
      addPart(buckets, "rocks", {
        nodeId: node.id,
        position: new THREE.Vector3(node.x, floor + width * 0.36, node.y),
        scale: new THREE.Vector3(width, width * 0.72, width),
        color: variant > 0.55 ? "#969b91" : "#858d87",
      });
      addPart(buckets, "rocks", {
        nodeId: node.id,
        position: new THREE.Vector3(node.x + 0.18, floor + width * 0.72, node.y - 0.08),
        scale: new THREE.Vector3(width * 0.56, width * 0.48, width * 0.58),
        color: "#a6aaa0",
      });
    } else if (node.kind === "berry") {
      addPart(buckets, "bushes", {
        nodeId: node.id,
        position: new THREE.Vector3(node.x, floor + 0.28, node.y),
        scale: new THREE.Vector3(0.82, 0.48, 0.7),
        color: "#71845a",
      });
      addPart(buckets, "bushes", {
        nodeId: node.id,
        position: new THREE.Vector3(node.x - 0.18, floor + 0.52, node.y + 0.1),
        scale: new THREE.Vector3(0.43, 0.42, 0.44),
        color: "#899166",
      });
      for (let i = 0; i < 4; i += 1) {
        const offsetX = (Math.sin(node.id * 4.1 + i * 6.2) * 0.22);
        const offsetZ = (Math.cos(node.id * 2.7 + i * 5.4) * 0.2);
        addPart(buckets, "fruit", {
          nodeId: node.id,
          position: new THREE.Vector3(node.x + offsetX, floor + 0.63 + (i % 2) * 0.09, node.y + offsetZ),
          scale: new THREE.Vector3(0.11, 0.11, 0.11),
          color: i % 2 ? "#b95d48" : "#d18059",
        });
      }
    } else {
      addPart(buckets, "crates", {
        nodeId: node.id,
        position: new THREE.Vector3(node.x, floor + 0.34, node.y),
        scale: new THREE.Vector3(0.74, 0.68, 0.72),
        color: "#886d4e",
      });
      addPart(buckets, "crates", {
        nodeId: node.id,
        position: new THREE.Vector3(node.x, floor + 0.36, node.y - 0.01),
        scale: new THREE.Vector3(0.12, 0.72, 0.77),
        color: "#5b4b3b",
      });
    }
  }
  return buckets;
}

function buildInstancedParts(
  scene: THREE.Scene,
  buckets: Map<string, VoxelPart[]>,
  slotMap: Map<number, PartSlot[]>,
  geometry: THREE.BoxGeometry,
): void {
  const materialColors: Record<string, THREE.ColorRepresentation> = {
    trunk: "#ffffff",
    leaves: "#ffffff",
    rocks: "#ffffff",
    bushes: "#ffffff",
    fruit: "#ffffff",
    crates: "#ffffff",
  };
  const dummy = new THREE.Object3D();
  for (const [key, parts] of buckets) {
    const material = new THREE.MeshLambertMaterial({ color: materialColors[key] ?? "#ffffff" });
    const mesh = new THREE.InstancedMesh(geometry, material, parts.length);
    mesh.name = `resource-${key}`;
    mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    parts.forEach((part, index) => {
      dummy.position.copy(part.position);
      dummy.scale.copy(part.scale);
      dummy.rotation.set(0, part.rotation ?? 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
      mesh.setColorAt(index, new THREE.Color(part.color));
      const slots = slotMap.get(part.nodeId);
      const slot = { mesh, index };
      if (slots) slots.push(slot);
      else slotMap.set(part.nodeId, [slot]);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    scene.add(mesh);
  }
}

function makeMaterial(color: string, options: Partial<THREE.MeshLambertMaterialParameters> = {}): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color, ...options });
}

function addBox(
  parent: THREE.Object3D,
  geometry: THREE.BoxGeometry,
  material: THREE.Material,
  position: THREE.Vector3,
  scale: THREE.Vector3,
  rotationY = 0,
): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);
  mesh.scale.copy(scale);
  mesh.rotation.y = rotationY;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  parent.add(mesh);
  return mesh;
}

export default function GameCanvas({ world, input, onFrame, onNotify, onLockChange }: GameCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const lookRef = useRef({ yaw: -0.45, pitch: -0.04 });
  const touchLook = useRef<TouchLook | null>(null);
  const lockedRef = useRef(false);

  const placeInFront = useCallback(() => {
    const yaw = lookRef.current.yaw;
    const x = world.player.x - Math.sin(yaw) * 3.2;
    const z = world.player.y - Math.cos(yaw) * 3.2;
    onNotify(world.placeAt(x, z));
  }, [world, onNotify]);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (world.paused) return;
    if (world.selectedBuilding && world.getItemCount(world.selectedItem as BuildKind) > 0) {
      placeInFront();
      return;
    }
    if (event.pointerType === "touch") {
      event.currentTarget.setPointerCapture(event.pointerId);
      touchLook.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, active: true };
      return;
    }
    const canvas = hostRef.current?.querySelector("canvas");
    if (canvas && document.pointerLockElement !== canvas) {
      event.currentTarget.setPointerCapture(event.pointerId);
      touchLook.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, active: true };
      try { canvas.requestPointerLock?.(); } catch { /* drag-to-look remains available if pointer lock is blocked */ }
    }
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = touchLook.current;
    if (!drag || !drag.active || drag.pointerId !== event.pointerId) return;
    if (lockedRef.current && event.pointerType !== "touch") return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    drag.x = event.clientX;
    drag.y = event.clientY;
    lookRef.current.yaw -= dx * 0.006;
    lookRef.current.pitch = THREE.MathUtils.clamp(lookRef.current.pitch - dy * 0.005, -1.2, 1.15);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (touchLook.current?.pointerId === event.pointerId) touchLook.current = null;
  };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
      stencil: false,
      depth: true,
    });
    renderer.domElement.className = "game-canvas";
    renderer.domElement.setAttribute("aria-label", "Первое лицо: кубический мир выживания. WASD — движение, мышь — обзор, E — действие.");
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.shadowMap.enabled = false;
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = SKY_DAY.clone();
    const fog = new THREE.Fog(FOG_DAY.clone(), 23, 58);
    scene.fog = fog;

    const camera = new THREE.PerspectiveCamera(77, 1, 0.08, 90);
    camera.rotation.order = "YXZ";
    scene.add(camera);

    const ambient = new THREE.HemisphereLight("#e1e7d5", "#39453b", 1.65);
    scene.add(ambient);
    const sunLight = new THREE.DirectionalLight("#f8e0b2", 2.15);
    sunLight.position.set(-8, 14, 7);
    scene.add(sunLight);
    const fillLight = new THREE.DirectionalLight("#a8c5bd", 0.42);
    fillLight.position.set(8, 5, -10);
    scene.add(fillLight);
    const torchLight = new THREE.PointLight("#edaa68", 0, 6, 2);
    torchLight.position.set(0.28, -0.1, -0.65);
    camera.add(torchLight);

    const cube = new THREE.BoxGeometry(1, 1, 1);
    const groundBuckets = new Map<Terrain, { tile: (typeof world.tiles)[number][number]; height: number }[]>();
    for (const row of world.tiles) {
      for (const tile of row) {
        if (tile.terrain === "water") continue;
        const list = groundBuckets.get(tile.terrain);
        const value = { tile, height: surfaceHeight(tile.terrain, tile.height) };
        if (list) list.push(value);
        else groundBuckets.set(tile.terrain, [value]);
      }
    }

    const groundMaterials: Record<Exclude<Terrain, "water">, THREE.Material[]> = {
      grass: [
        makeMaterial("#526348"), makeMaterial("#526348"), makeMaterial("#839363"),
        makeMaterial("#4a5d41"), makeMaterial("#526348"), makeMaterial("#526348"),
      ],
      shore: [
        makeMaterial("#8c7f60"), makeMaterial("#8c7f60"), makeMaterial("#b5a37b"),
        makeMaterial("#817454"), makeMaterial("#8c7f60"), makeMaterial("#8c7f60"),
      ],
      rock: [
        makeMaterial("#5e625f"), makeMaterial("#5e625f"), makeMaterial("#878b81"),
        makeMaterial("#4b504e"), makeMaterial("#5e625f"), makeMaterial("#5e625f"),
      ],
    };
    const groundTints: Record<Exclude<Terrain, "water">, string[]> = {
      grass: ["#b2be8e", "#a5b17f", "#b8c18d", "#9cab78", "#aeb985"],
      shore: ["#c7b98d", "#d2c294", "#bdaf87", "#d7c79a", "#c5b58b"],
      rock: ["#c1c5b8", "#afb4aa", "#c8c8bb", "#b4b9ad", "#c0c2b5"],
    };
    const matrixHelper = new THREE.Object3D();
    for (const terrain of ["grass", "shore", "rock"] as const) {
      const entries = groundBuckets.get(terrain) ?? [];
      const mesh = new THREE.InstancedMesh(cube, groundMaterials[terrain], entries.length);
      mesh.name = `ground-${terrain}`;
      mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
      entries.forEach(({ tile, height }, index) => {
        matrixHelper.position.set(tile.x + 0.5, height / 2, tile.y + 0.5);
        matrixHelper.scale.set(1, height, 1);
        matrixHelper.updateMatrix();
        mesh.setMatrixAt(index, matrixHelper.matrix);
        mesh.setColorAt(index, new THREE.Color(groundTints[terrain][tile.tint % groundTints[terrain].length]));
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      scene.add(mesh);
    }

    const waterMaterial = new THREE.MeshLambertMaterial({ color: WATER_DAY, transparent: false });
    const water = new THREE.Mesh(new THREE.PlaneGeometry(180, 180), waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -0.12;
    water.name = "ocean";
    scene.add(water);

    // A tiny square sun makes the faceted horizon feel like a living game world.
    const sun = new THREE.Mesh(new THREE.BoxGeometry(1.25, 1.25, 1.25), new THREE.MeshBasicMaterial({ color: "#f3d39b" }));
    sun.position.set(31, 15, 24);
    scene.add(sun);

    const slotMap = new Map<number, PartSlot[]>();
    const resourceParts = createParts(world);
    buildInstancedParts(scene, resourceParts, slotMap, cube);
    const hiddenNodes = new Set<number>();

    const structureGroup = new THREE.Group();
    structureGroup.name = "player-buildings";
    scene.add(structureGroup);
    let structureCount = -1;
    const wood = makeMaterial("#9b7851");
    const woodSide = makeMaterial("#71593e");
    const fireGlow = makeMaterial("#e17b45", { emissive: "#7a2c18", emissiveIntensity: 0.7 });
    const syncStructures = () => {
      if (structureCount === world.structures.length) return;
      structureGroup.clear();
      for (const structure of world.structures) {
        const floor = groundHeight(world, structure.x, structure.y);
        const x = structure.x;
        const z = structure.y;
        if (structure.kind === "campfire") {
          addBox(structureGroup, cube, woodSide, new THREE.Vector3(x, floor + 0.1, z), new THREE.Vector3(0.82, 0.16, 0.16), 0.48);
          addBox(structureGroup, cube, wood, new THREE.Vector3(x, floor + 0.11, z), new THREE.Vector3(0.82, 0.16, 0.16), -0.48);
          addBox(structureGroup, cube, fireGlow, new THREE.Vector3(x, floor + 0.42, z), new THREE.Vector3(0.25, 0.48, 0.25));
        } else if (structure.kind === "foundation") {
          addBox(structureGroup, cube, wood, new THREE.Vector3(x, floor + 0.09, z), new THREE.Vector3(1, 0.18, 1));
          for (let i = -1; i <= 1; i += 1) {
            addBox(structureGroup, cube, woodSide, new THREE.Vector3(x + i * 0.28, floor + 0.19, z), new THREE.Vector3(0.035, 0.025, 0.94));
          }
        } else {
          const wallMesh = addBox(structureGroup, cube, wood, new THREE.Vector3(x, floor + 0.62, z), new THREE.Vector3(1.06, 1.24, 0.16));
          wallMesh.rotation.y = structure.rotation;
          for (let i = -1; i <= 1; i += 1) {
            addBox(structureGroup, cube, woodSide, new THREE.Vector3(x + i * 0.34, floor + 0.62, z - 0.1), new THREE.Vector3(0.045, 1.1, 0.06));
          }
        }
      }
      structureCount = world.structures.length;
    };

    const marker = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.64, 4),
      new THREE.MeshBasicMaterial({ color: "#e6c38d", side: THREE.DoubleSide, transparent: true, opacity: 0.88, depthWrite: false }),
    );
    marker.rotation.x = -Math.PI / 2;
    marker.rotation.z = Math.PI / 4;
    marker.visible = false;
    scene.add(marker);

    const ghostMaterial = new THREE.MeshBasicMaterial({ color: "#d4ba8c", transparent: true, opacity: 0.32, wireframe: true, depthWrite: false });
    const ghost = new THREE.Mesh(cube, ghostMaterial);
    ghost.visible = false;
    scene.add(ghost);

    const viewmodel = new THREE.Group();
    viewmodel.name = "first-person-hands";
    camera.add(viewmodel);
    const skin = makeMaterial("#b68a63");
    const sleeve = makeMaterial("#58625a");
    const handle = makeMaterial("#775b3f");
    const iron = makeMaterial("#929992");
    const viewmodelRoot = new THREE.Group();
    viewmodel.add(viewmodelRoot);
    const rebuildViewmodel = () => {
      viewmodelRoot.clear();
      addBox(viewmodelRoot, cube, sleeve, new THREE.Vector3(0.39, -0.46, -0.77), new THREE.Vector3(0.18, 0.43, 0.19), -0.13);
      addBox(viewmodelRoot, cube, skin, new THREE.Vector3(0.35, -0.24, -0.77), new THREE.Vector3(0.2, 0.19, 0.21), -0.13);
      const item = world.selectedItem;
      if (item === "axe") {
        addBox(viewmodelRoot, cube, handle, new THREE.Vector3(0.28, -0.09, -0.91), new THREE.Vector3(0.075, 0.59, 0.08), -0.25);
        addBox(viewmodelRoot, cube, iron, new THREE.Vector3(0.11, 0.1, -0.9), new THREE.Vector3(0.33, 0.17, 0.18), -0.08);
      } else if (item === "pickaxe") {
        addBox(viewmodelRoot, cube, handle, new THREE.Vector3(0.29, -0.08, -0.91), new THREE.Vector3(0.075, 0.61, 0.08), -0.25);
        addBox(viewmodelRoot, cube, iron, new THREE.Vector3(0.26, 0.17, -0.9), new THREE.Vector3(0.46, 0.11, 0.13), 0.05);
      } else if (item === "spear") {
        addBox(viewmodelRoot, cube, handle, new THREE.Vector3(0.24, 0.02, -1.02), new THREE.Vector3(0.07, 0.98, 0.07), -0.15);
        addBox(viewmodelRoot, cube, iron, new THREE.Vector3(0.16, 0.53, -1.02), new THREE.Vector3(0.18, 0.24, 0.12), -0.15);
      } else if (item === "campfire" || item === "foundation" || item === "wall") {
        addBox(viewmodelRoot, cube, wood, new THREE.Vector3(0.25, -0.02, -0.91), new THREE.Vector3(0.32, 0.28, 0.26), -0.12);
      } else {
        addBox(viewmodelRoot, cube, iron, new THREE.Vector3(0.29, -0.1, -0.94), new THREE.Vector3(0.22, 0.19, 0.23), -0.24);
      }
    };
    rebuildViewmodel();
    let lastItem = world.selectedItem;

    const resize = () => {
      const rect = host.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
      renderer.setSize(rect.width, rect.height, false);
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);

    let lastTime = performance.now();
    let lastRender = 0;
    let fpsFrames = 0;
    let fpsStart = lastTime;
    let smoothFps = 60;
    let frameId = 0;
    let nightState = world.isNight;
    let cameraShake = 0;
    let disposed = false;

    const syncVisibility = () => {
      for (const node of world.nodes) {
        if (!node.gone || hiddenNodes.has(node.id)) continue;
        hiddenNodes.add(node.id);
        const slots = slotMap.get(node.id) ?? [];
        const zero = new THREE.Object3D();
        zero.scale.set(0, 0, 0);
        zero.updateMatrix();
        for (const { mesh, index } of slots) {
          mesh.setMatrixAt(index, zero.matrix);
          mesh.instanceMatrix.needsUpdate = true;
        }
      }
    };

    const onMouseMove = (event: MouseEvent) => {
      if (document.pointerLockElement !== renderer.domElement) return;
      lookRef.current.yaw -= event.movementX * 0.0021;
      lookRef.current.pitch = THREE.MathUtils.clamp(lookRef.current.pitch - event.movementY * 0.0018, -1.2, 1.15);
    };
    const handleLockChange = () => {
      lockedRef.current = document.pointerLockElement === renderer.domElement;
      if (lockedRef.current) touchLook.current = null;
      onLockChange(lockedRef.current);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("pointerlockchange", handleLockChange);

    const animate = (now: number) => {
      if (disposed) return;
      frameId = window.requestAnimationFrame(animate);
      if (now - lastRender < 1000 / 60) return;
      const rawDt = Math.min((now - lastTime) / 1000, 0.05);
      const dt = Math.max(rawDt, 0.001);
      lastTime = now;
      lastRender = now;

      input.current.yaw = lookRef.current.yaw;
      world.update(dt, input.current);
      syncVisibility();
      syncStructures();
      if (world.selectedItem !== lastItem) {
        lastItem = world.selectedItem;
        rebuildViewmodel();
      }

      const surface = groundHeight(world, world.player.x, world.player.y);
      const walkBob = world.player.moving ? Math.sin(now * 0.012) * 0.035 : 0;
      cameraShake += ((world.player.moving ? 1 : 0) - cameraShake) * Math.min(1, dt * 7);
      camera.position.set(world.player.x, surface + 1.66 + walkBob, world.player.y);
      camera.rotation.set(lookRef.current.pitch, lookRef.current.yaw, 0, "YXZ");

      const target = world.nearestNode;
      if (target) {
        marker.visible = true;
        marker.position.set(target.x, groundHeight(world, target.x, target.y) + 0.025, target.y);
      } else {
        marker.visible = false;
      }

      const forwardX = -Math.sin(lookRef.current.yaw);
      const forwardZ = -Math.cos(lookRef.current.yaw);
      const ghostX = Math.floor(world.player.x + forwardX * 3.2) + 0.5;
      const ghostZ = Math.floor(world.player.y + forwardZ * 3.2) + 0.5;
      ghost.visible = world.selectedBuilding && world.getItemCount(world.selectedItem as BuildKind) > 0;
      if (ghost.visible) {
        const tile = world.tileAt(ghostX, ghostZ);
        ghost.position.set(ghostX, groundHeight(world, ghostX, ghostZ) + 0.42, ghostZ);
        ghost.scale.set(0.98, tile.terrain === "shore" || tile.terrain === "water" ? 0.35 : 0.84, 0.98);
      }

      if (world.isNight !== nightState) {
        nightState = world.isNight;
        scene.background = (nightState ? SKY_NIGHT : SKY_DAY).clone();
        fog.color.copy(nightState ? FOG_NIGHT : FOG_DAY);
        waterMaterial.color.copy(nightState ? WATER_NIGHT : WATER_DAY);
        ambient.intensity = nightState ? 0.58 : 1.65;
        sunLight.intensity = nightState ? 0.15 : 2.15;
        fillLight.intensity = nightState ? 0.7 : 0.42;
        sun.visible = !nightState;
      }
      viewmodel.position.y = -cameraShake * 0.018;
      torchLight.intensity = world.torchLit ? (world.isNight ? 1.4 : 0.06) : 0;

      renderer.render(scene, camera);
      fpsFrames += 1;
      if (now - fpsStart > 450) {
        smoothFps = smoothFps * 0.58 + (fpsFrames * 1000 / (now - fpsStart)) * 0.42;
        fpsFrames = 0;
        fpsStart = now;
        onFrame(Math.round(smoothFps));
      }
    };
    frameId = window.requestAnimationFrame(animate);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("pointerlockchange", handleLockChange);
      if (document.pointerLockElement === renderer.domElement) document.exitPointerLock();
      onLockChange(false);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.InstancedMesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [world, input, onFrame, onLockChange]);

  return (
    <div
      ref={hostRef}
      className="game-view"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => { touchLook.current = null; }}
      onContextMenu={(event) => event.preventDefault()}
    />
  );
}
