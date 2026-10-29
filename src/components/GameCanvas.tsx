import { useEffect, useRef } from "react";
import { SurvivalWorld, type ResourceNode, type Structure, type Terrain, type Tile } from "../game/engine";

interface GameCanvasProps {
  world: SurvivalWorld;
  input: React.MutableRefObject<{ up: boolean; down: boolean; left: boolean; right: boolean; sprint: boolean }>;
  onFrame: () => void;
  onNotify: (message: string) => void;
}

interface Viewport {
  width: number;
  height: number;
  tileW: number;
  tileH: number;
  elevation: number;
  centerY: number;
  dpr: number;
}

interface Point {
  x: number;
  y: number;
}

const palettes: Record<Terrain, string[]> = {
  grass: ["#677b54", "#70835b", "#63784f", "#71845a", "#5f7550"],
  shore: ["#a6946c", "#b09d73", "#a18e67", "#b5a37a", "#9f906e"],
  rock: ["#777c75", "#82877e", "#70766f", "#898b7e", "#73776f"],
  water: ["#285359", "#2b5a5e", "#244e56", "#315e60", "#285257"],
};

function hash(x: number, y: number, n = 0): number {
  const value = Math.sin(x * 127.1 + y * 311.7 + n * 74.7) * 43758.5453;
  return value - Math.floor(value);
}

function project(x: number, y: number, world: SurvivalWorld, view: Viewport): Point {
  const dx = x - world.player.x;
  const dy = y - world.player.y;
  const tile = world.tileAt(x, y);
  return {
    x: view.width / 2 + ((dx - dy) * view.tileW) / 2,
    y: view.centerY + ((dx + dy) * view.tileH) / 2 - tile.height * view.elevation,
  };
}

function screenToWorld(x: number, y: number, world: SurvivalWorld, view: Viewport): Point {
  const isoX = (x - view.width / 2) / (view.tileW / 2);
  const isoY = (y - view.centerY) / (view.tileH / 2);
  return {
    x: world.player.x + (isoX + isoY) / 2,
    y: world.player.y + (isoY - isoX) / 2,
  };
}

function polygon(ctx: CanvasRenderingContext2D, points: Point[], fill: string, stroke?: string): void {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 0.7;
    ctx.stroke();
  }
}

function drawBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  topY: number,
  width: number,
  depth: number,
  height: number,
  top: string,
  left: string,
  right: string,
): void {
  const halfW = width / 2;
  const halfD = depth / 2;
  const topPoint = { x, y: topY - halfD };
  const rightPoint = { x: x + halfW, y: topY };
  const bottomPoint = { x, y: topY + halfD };
  const leftPoint = { x: x - halfW, y: topY };
  const down = (point: Point): Point => ({ x: point.x, y: point.y + height });
  polygon(ctx, [rightPoint, bottomPoint, down(bottomPoint), down(rightPoint)], right, "rgba(13,22,18,.25)");
  polygon(ctx, [bottomPoint, leftPoint, down(leftPoint), down(bottomPoint)], left, "rgba(13,22,18,.25)");
  polygon(ctx, [topPoint, rightPoint, bottomPoint, leftPoint], top, "rgba(236,229,192,.12)");
}

function drawTile(ctx: CanvasRenderingContext2D, tile: Tile, world: SurvivalWorld, view: Viewport): void {
  const center = project(tile.x + 0.5, tile.y + 0.5, world, view);
  const hw = view.tileW / 2;
  const hh = view.tileH / 2;
  const top = { x: center.x, y: center.y - hh };
  const right = { x: center.x + hw, y: center.y };
  const bottom = { x: center.x, y: center.y + hh };
  const left = { x: center.x - hw, y: center.y };
  const color = palettes[tile.terrain][tile.tint % palettes[tile.terrain].length];
  const thickness = tile.terrain === "water" ? 0 : 4 + tile.height * 5;

  if (thickness > 0) {
    const down = (point: Point): Point => ({ x: point.x, y: point.y + thickness });
    const sideR = tile.terrain === "shore" ? "#897c5d" : tile.terrain === "rock" ? "#575c57" : "#4d6041";
    const sideL = tile.terrain === "shore" ? "#796f56" : tile.terrain === "rock" ? "#4c514d" : "#40533c";
    polygon(ctx, [right, bottom, down(bottom), down(right)], sideR);
    polygon(ctx, [bottom, left, down(left), down(bottom)], sideL);
  }
  polygon(ctx, [top, right, bottom, left], color, tile.terrain === "water" ? "rgba(139,192,177,.055)" : "rgba(20,31,23,.19)");

  const seed = tile.x * 171 + tile.y * 89;
  if (tile.terrain === "water") {
    if (hash(seed, tile.y, 6) > 0.48) {
      const waveX = center.x + (hash(tile.x, tile.y, 11) - 0.5) * view.tileW * 0.44;
      const waveY = center.y + (hash(tile.x, tile.y, 13) - 0.5) * view.tileH * 0.38;
      ctx.strokeStyle = "rgba(157,205,188,.19)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(waveX - 5, waveY);
      ctx.quadraticCurveTo(waveX, waveY - 1.6, waveX + 5, waveY);
      ctx.stroke();
    }
  } else if (tile.terrain === "grass" && hash(seed, tile.x, 4) > 0.69) {
    const dotX = center.x + (hash(tile.x, tile.y, 21) - 0.5) * view.tileW * 0.42;
    const dotY = center.y + (hash(tile.x, tile.y, 26) - 0.5) * view.tileH * 0.34;
    ctx.fillStyle = "rgba(209,207,150,.22)";
    ctx.fillRect(dotX, dotY, 1.3, 1.3);
    ctx.fillStyle = "rgba(33,51,33,.2)";
    ctx.fillRect(dotX + 2.5, dotY + 1.5, 1, 1);
  }
}

function drawPine(ctx: CanvasRenderingContext2D, node: ResourceNode, world: SurvivalWorld, view: Viewport, selected: boolean): void {
  const p = project(node.x, node.y, world, view);
  const baseY = p.y + view.tileH * 0.19;
  const size = 0.87 + node.variant * 0.34;
  ctx.fillStyle = "rgba(17,22,18,.28)";
  ctx.beginPath();
  ctx.ellipse(p.x + 1, baseY + 1, view.tileW * 0.22 * size, view.tileH * 0.19, 0, 0, Math.PI * 2);
  ctx.fill();
  if (selected) drawSelection(ctx, p.x, baseY, view);

  drawBlock(ctx, p.x, baseY - 12 * size, 9 * size, 7 * size, 18 * size, "#806d4e", "#594b39", "#6d5940");
  const greenA = node.variant > 0.65 ? "#657553" : "#536b48";
  const greenB = node.variant > 0.65 ? "#7e895d" : "#71805a";
  drawBlock(ctx, p.x, baseY - 34 * size, 27 * size, 18 * size, 16 * size, greenB, "#40593f", "#526a46");
  drawBlock(ctx, p.x, baseY - 47 * size, 21 * size, 15 * size, 14 * size, greenA, "#344c3a", "#435c42");
  drawBlock(ctx, p.x, baseY - 58 * size, 14 * size, 11 * size, 10 * size, "#7b895f", "#455d41", "#586d48");
  ctx.fillStyle = "rgba(220,216,163,.22)";
  ctx.fillRect(p.x - 2, baseY - 44 * size, 2, 2);
}

function drawRock(ctx: CanvasRenderingContext2D, node: ResourceNode, world: SurvivalWorld, view: Viewport, selected: boolean): void {
  const p = project(node.x, node.y, world, view);
  const baseY = p.y + view.tileH * 0.12;
  const size = 0.85 + node.variant * 0.38;
  ctx.fillStyle = "rgba(17,22,18,.28)";
  ctx.beginPath();
  ctx.ellipse(p.x, baseY + 2, view.tileW * 0.23 * size, view.tileH * 0.19, 0, 0, Math.PI * 2);
  ctx.fill();
  if (selected) drawSelection(ctx, p.x, baseY, view);
  drawBlock(ctx, p.x, baseY - 11 * size, 26 * size, 17 * size, 14 * size, "#a2a396", "#5e625f", "#777b75");
  drawBlock(ctx, p.x + 3 * size, baseY - 19 * size, 16 * size, 12 * size, 10 * size, "#b5b4a7", "#73766f", "#8a8b80");
  ctx.strokeStyle = "rgba(44,49,46,.46)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(p.x - 3, baseY - 15 * size);
  ctx.lineTo(p.x + 1, baseY - 9 * size);
  ctx.stroke();
}

function drawBush(ctx: CanvasRenderingContext2D, node: ResourceNode, world: SurvivalWorld, view: Viewport, selected: boolean): void {
  const p = project(node.x, node.y, world, view);
  const baseY = p.y + view.tileH * 0.15;
  ctx.fillStyle = "rgba(17,22,18,.24)";
  ctx.beginPath();
  ctx.ellipse(p.x, baseY + 1, view.tileW * 0.19, view.tileH * 0.13, 0, 0, Math.PI * 2);
  ctx.fill();
  if (selected) drawSelection(ctx, p.x, baseY, view);
  drawBlock(ctx, p.x, baseY - 8, 23, 14, 8, "#73825a", "#485b42", "#5c7048");
  drawBlock(ctx, p.x - 4, baseY - 14, 13, 9, 7, "#8a8e61", "#4e6144", "#65764a");
  drawBlock(ctx, p.x + 5, baseY - 12, 12, 8, 6, "#728356", "#465b40", "#5c7048");
  for (let i = 0; i < 4; i += 1) {
    const bx = p.x + (hash(node.id, i, 2) - 0.5) * 15;
    const by = baseY - 12 + hash(node.id, i, 5) * 8;
    ctx.fillStyle = i % 2 ? "#bb5f42" : "#d18354";
    ctx.fillRect(bx, by, 3.2, 3.2);
    ctx.fillStyle = "rgba(250,204,146,.7)";
    ctx.fillRect(bx + 0.7, by + 0.6, 1, 1);
  }
}

function drawScrap(ctx: CanvasRenderingContext2D, node: ResourceNode, world: SurvivalWorld, view: Viewport, selected: boolean): void {
  const p = project(node.x, node.y, world, view);
  const baseY = p.y + view.tileH * 0.15;
  if (selected) drawSelection(ctx, p.x, baseY, view);
  drawBlock(ctx, p.x, baseY - 9, 23, 16, 12, "#947956", "#584b3d", "#6c5941");
  ctx.strokeStyle = "rgba(224,196,139,.56)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(p.x - 6, baseY - 14);
  ctx.lineTo(p.x + 6, baseY - 4);
  ctx.moveTo(p.x + 5, baseY - 14);
  ctx.lineTo(p.x - 3, baseY - 7);
  ctx.stroke();
}

function drawSelection(ctx: CanvasRenderingContext2D, x: number, y: number, view: Viewport): void {
  ctx.save();
  ctx.strokeStyle = "rgba(227,190,126,.85)";
  ctx.lineWidth = 1.3;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.ellipse(x, y, view.tileW * 0.33, view.tileH * 0.26, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawCampfire(ctx: CanvasRenderingContext2D, structure: Structure, world: SurvivalWorld, view: Viewport): void {
  const p = project(structure.x, structure.y, world, view);
  const ground = p.y + view.tileH * 0.12;
  ctx.fillStyle = "rgba(15,20,17,.34)";
  ctx.beginPath();
  ctx.ellipse(p.x, ground + 2, 16, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.translate(p.x, ground - 3);
  ctx.rotate(-0.42);
  ctx.fillStyle = "#543e2e";
  ctx.fillRect(-10, -2, 20, 4);
  ctx.restore();
  ctx.save();
  ctx.translate(p.x, ground - 3);
  ctx.rotate(0.42);
  ctx.fillStyle = "#77553a";
  ctx.fillRect(-10, -2, 20, 4);
  ctx.restore();
  const flicker = Math.sin(world.elapsed * 10 + structure.id) * 2;
  ctx.fillStyle = "rgba(228,116,56,.2)";
  ctx.beginPath();
  ctx.arc(p.x, ground - 12, 15 + flicker, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#c9683c";
  ctx.beginPath();
  ctx.moveTo(p.x - 5, ground - 4);
  ctx.quadraticCurveTo(p.x - 8, ground - 15 - flicker, p.x, ground - 20 - flicker);
  ctx.quadraticCurveTo(p.x + 8, ground - 11, p.x + 5, ground - 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#e9b35e";
  ctx.beginPath();
  ctx.moveTo(p.x - 2, ground - 4);
  ctx.quadraticCurveTo(p.x - 2, ground - 12 - flicker, p.x + 2, ground - 15 - flicker);
  ctx.quadraticCurveTo(p.x + 5, ground - 9, p.x + 3, ground - 4);
  ctx.closePath();
  ctx.fill();
}

function drawStructure(ctx: CanvasRenderingContext2D, structure: Structure, world: SurvivalWorld, view: Viewport): void {
  const p = project(structure.x, structure.y, world, view);
  const floor = p.y + view.tileH * 0.15;
  if (structure.kind === "campfire") {
    drawCampfire(ctx, structure, world, view);
    return;
  }
  if (structure.kind === "foundation") {
    drawBlock(ctx, p.x, floor - 1, 42, 24, 7, "#a1855c", "#5e4e3b", "#776045");
    ctx.strokeStyle = "rgba(51,43,32,.72)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p.x - 14, floor - 2);
    ctx.lineTo(p.x + 13, floor - 2);
    ctx.moveTo(p.x, floor - 7);
    ctx.lineTo(p.x, floor + 1);
    ctx.stroke();
  } else {
    drawBlock(ctx, p.x, floor - 30, 40, 23, 30, "#a68a62", "#69543e", "#806546");
    for (let i = -1; i <= 1; i += 1) {
      ctx.strokeStyle = "rgba(58,47,34,.42)";
      ctx.beginPath();
      ctx.moveTo(p.x + i * 9, floor - 39);
      ctx.lineTo(p.x + i * 9, floor - 12);
      ctx.stroke();
    }
  }
}

function drawPlayer(ctx: CanvasRenderingContext2D, world: SurvivalWorld, view: Viewport): void {
  const p = project(world.player.x, world.player.y, world, view);
  const bob = world.player.moving ? Math.sin(world.elapsed * 12) * 1.5 : 0;
  const ground = p.y + view.tileH * 0.15;
  ctx.fillStyle = "rgba(12,17,16,.42)";
  ctx.beginPath();
  ctx.ellipse(p.x, ground + 2, 13, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Small block-built traveler, readable against the muted tundra.
  drawBlock(ctx, p.x, ground - 16 - bob, 13, 10, 15, "#56636a", "#303e42", "#455154");
  drawBlock(ctx, p.x, ground - 29 - bob, 15, 12, 9, "#b47d50", "#76523c", "#93633f");
  drawBlock(ctx, p.x + 1, ground - 41 - bob, 11, 9, 10, "#c2a47d", "#79674e", "#9a805e");
  ctx.fillStyle = "#292b29";
  ctx.fillRect(p.x - 5, ground - 43 - bob, 11, 3);
  if (world.torchLit) {
    const glow = ctx.createRadialGradient(p.x + 13, ground - 22, 1, p.x + 13, ground - 22, 25);
    glow.addColorStop(0, "rgba(255,174,88,.24)");
    glow.addColorStop(1, "rgba(255,174,88,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(p.x - 14, ground - 51, 55, 58);
    ctx.fillStyle = "#e4b365";
    ctx.fillRect(p.x + 8, ground - 21, 3, 8);
  }
  ctx.fillStyle = "rgba(239,231,208,.58)";
  ctx.fillRect(p.x - 1, ground - 40 - bob, 1.5, 1.5);
}

function drawNode(ctx: CanvasRenderingContext2D, node: ResourceNode, world: SurvivalWorld, view: Viewport): void {
  const selected = node.id === world.selectedNodeId;
  if (node.kind === "pine") drawPine(ctx, node, world, view, selected);
  else if (node.kind === "stone") drawRock(ctx, node, world, view, selected);
  else if (node.kind === "berry") drawBush(ctx, node, world, view, selected);
  else drawScrap(ctx, node, world, view, selected);
}

function drawAtmosphere(ctx: CanvasRenderingContext2D, world: SurvivalWorld, view: Viewport): void {
  const hour = (world.worldMinutes / 60) % 24;
  const night = hour < 5.5 ? 0.34 : hour > 21 ? 0.42 : hour < 7.2 ? 0.2 : hour > 18.4 ? 0.22 : 0.04;
  if (night > 0.04) {
    ctx.fillStyle = `rgba(11,21,36,${night})`;
    ctx.fillRect(0, 0, view.width, view.height);
  }
  if (hour > 5.2 && hour < 8.6) {
    const glow = ctx.createRadialGradient(view.width * 0.72, view.height * 0.12, 0, view.width * 0.72, view.height * 0.12, view.width * 0.65);
    glow.addColorStop(0, "rgba(212,143,90,.10)");
    glow.addColorStop(1, "rgba(212,143,90,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, view.width, view.height);
  }
  const vignette = ctx.createRadialGradient(view.width * 0.5, view.height * 0.48, view.height * 0.16, view.width * 0.5, view.height * 0.48, Math.max(view.width, view.height) * 0.75);
  vignette.addColorStop(0, "rgba(8,13,14,0)");
  vignette.addColorStop(0.65, "rgba(8,13,14,.04)");
  vignette.addColorStop(1, "rgba(5,10,11,.39)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, view.width, view.height);
}

function render(ctx: CanvasRenderingContext2D, world: SurvivalWorld, view: Viewport): void {
  ctx.clearRect(0, 0, view.width, view.height);
  const ocean = ctx.createLinearGradient(0, 0, view.width, view.height);
  ocean.addColorStop(0, "#1c4147");
  ocean.addColorStop(0.55, "#244a4d");
  ocean.addColorStop(1, "#183d43");
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, view.width, view.height);

  const radius = Math.ceil((view.width / view.tileW + view.height / view.tileH) * 0.62) + 3;
  const minX = Math.max(0, Math.floor(world.player.x - radius));
  const maxX = Math.min(63, Math.ceil(world.player.x + radius));
  const minY = Math.max(0, Math.floor(world.player.y - radius));
  const maxY = Math.min(63, Math.ceil(world.player.y + radius));
  const tiles: Tile[] = [];
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const p = project(x + 0.5, y + 0.5, world, view);
      if (p.x < -view.tileW * 2 || p.x > view.width + view.tileW * 2 || p.y < -view.tileH * 3 || p.y > view.height + view.tileH * 3) continue;
      tiles.push(world.tiles[y][x]);
    }
  }
  tiles.sort((a, b) => a.x + a.y - (b.x + b.y) || a.y - b.y);
  for (const tile of tiles) drawTile(ctx, tile, world, view);

  const renderEntities: { depth: number; draw: () => void }[] = [];
  for (const node of world.nodes) {
    if (node.gone || Math.abs(node.x - world.player.x) > radius || Math.abs(node.y - world.player.y) > radius) continue;
    renderEntities.push({ depth: node.x + node.y, draw: () => drawNode(ctx, node, world, view) });
  }
  for (const structure of world.structures) {
    if (Math.abs(structure.x - world.player.x) > radius || Math.abs(structure.y - world.player.y) > radius) continue;
    renderEntities.push({ depth: structure.x + structure.y + 0.01, draw: () => drawStructure(ctx, structure, world, view) });
  }
  renderEntities.push({ depth: world.player.x + world.player.y + 0.02, draw: () => drawPlayer(ctx, world, view) });
  renderEntities.sort((a, b) => a.depth - b.depth);
  for (const entity of renderEntities) entity.draw();

  if (world.torchLit && world.isNight) {
    const halo = ctx.createRadialGradient(view.width / 2, view.centerY, 10, view.width / 2, view.centerY, view.width * 0.38);
    halo.addColorStop(0, "rgba(244,164,85,.13)");
    halo.addColorStop(0.3, "rgba(233,145,72,.065)");
    halo.addColorStop(1, "rgba(233,145,72,0)");
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, view.width, view.height);
  }
  drawAtmosphere(ctx, world, view);
}

function pickNodeAt(clientX: number, clientY: number, world: SurvivalWorld, view: Viewport): ResourceNode | null {
  let picked: ResourceNode | null = null;
  let best = 44;
  for (const node of world.nodes) {
    if (node.gone || Math.abs(node.x - world.player.x) > 11 || Math.abs(node.y - world.player.y) > 11) continue;
    const p = project(node.x, node.y, world, view);
    const visualY = p.y - (node.kind === "pine" ? 34 : node.kind === "stone" ? 10 : 5);
    const dx = clientX - p.x;
    const dy = clientY - visualY;
    const score = Math.hypot(dx * 0.8, dy);
    if (score < best) {
      best = score;
      picked = node;
    }
  }
  return picked;
}

export default function GameCanvas({ world, input, onFrame, onNotify }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef<Viewport>({ width: 0, height: 0, tileW: 64, tileH: 32, elevation: 6, centerY: 0, dpr: 1 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    let frame = 0;
    let last = performance.now();
    let hudClock = 0;
    let disposed = false;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.7);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      const tileW = Math.max(48, Math.min(78, rect.width / 15.5));
      viewRef.current = {
        width: rect.width,
        height: rect.height,
        tileW,
        tileH: tileW * 0.49,
        elevation: tileW * 0.13,
        centerY: rect.height * 0.51,
        dpr,
      };
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const loop = (now: number) => {
      if (disposed) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      world.update(dt, input.current);
      render(ctx, world, viewRef.current);
      hudClock += dt;
      if (hudClock > 0.18) {
        hudClock = 0;
        onFrame();
      }
      frame = window.requestAnimationFrame(loop);
    };
    frame = window.requestAnimationFrame(loop);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [world, input, onFrame]);

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (event.button !== 0 || world.paused) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const view = viewRef.current;
    const building = world.selectedBuilding && world.getItemCount(world.selectedItem as "campfire" | "foundation" | "wall") > 0;
    if (building) {
      const point = screenToWorld(x, y, world, view);
      onNotify(world.placeAt(point.x, point.y));
      return;
    }
    const node = pickNodeAt(x, y, world, view);
    world.selectNode(node?.id ?? null);
    if (!node) return;
    const d = Math.hypot(node.x - world.player.x, node.y - world.player.y);
    if (d > 3.2) onNotify(`Ресурс выбран · подойди ближе (${d.toFixed(1)} м)`);
  };

  return (
    <canvas
      ref={canvasRef}
      className="game-canvas"
      aria-label="Изометрический мир выживания. Перемещайтесь клавишами WASD, нажмите на ресурс, чтобы выбрать его."
      onPointerDown={handlePointerDown}
      onContextMenu={(event) => event.preventDefault()}
    />
  );
}
