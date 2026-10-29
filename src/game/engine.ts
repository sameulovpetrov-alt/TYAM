export type Terrain = "grass" | "shore" | "rock" | "water";
export type ResourceKind = "pine" | "stone" | "berry" | "scrap";
export type Material = "wood" | "stone" | "fiber" | "berries" | "scrap";
export type BuildKind = "campfire" | "foundation" | "wall";
export type ToolKind = "rock" | "torch" | "axe" | "pickaxe" | "spear" | "campfire" | "foundation" | "wall";

export interface Tile {
  x: number;
  y: number;
  terrain: Terrain;
  height: number;
  tint: number;
}

export interface ResourceNode {
  id: number;
  kind: ResourceKind;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  variant: number;
  gone: boolean;
}

export interface Structure {
  id: number;
  kind: BuildKind;
  x: number;
  y: number;
  rotation: number;
}

export interface PlayerState {
  x: number;
  y: number;
  health: number;
  hunger: number;
  water: number;
  stamina: number;
  moving: boolean;
}

export interface Inventory {
  materials: Record<Material, number>;
  tools: Record<ToolKind, number>;
  bottleCharges: number;
  bandages: number;
}

export interface MoveInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
  yaw: number;
}

export interface Snapshot {
  day: number;
  time: string;
  temperature: number;
  position: string;
  nearest: ResourceNode | null;
  nearestDistance: number;
  isNight: boolean;
  wood: number;
  stone: number;
  fiber: number;
  berries: number;
  scrap: number;
}

export const WORLD_SIZE = 64;
export const SPAWN = { x: 27.5, y: 35.5 };

export const HOTBAR: { kind: ToolKind | "berries"; label: string; short: string; key: string }[] = [
  { kind: "rock", label: "Камень", short: "Камень", key: "1" },
  { kind: "axe", label: "Каменный топор", short: "Топор", key: "2" },
  { kind: "pickaxe", label: "Каменная кирка", short: "Кирка", key: "3" },
  { kind: "spear", label: "Копьё", short: "Копьё", key: "4" },
  { kind: "campfire", label: "Костёр", short: "Костёр", key: "5" },
  { kind: "foundation", label: "Фундамент", short: "Основа", key: "6" },
  { kind: "wall", label: "Стена", short: "Стена", key: "7" },
  { kind: "berries", label: "Ягоды", short: "Ягоды", key: "8" },
];

const initialInventory = (): Inventory => ({
  materials: { wood: 0, stone: 0, fiber: 0, berries: 2, scrap: 0 },
  tools: {
    rock: 1,
    torch: 1,
    axe: 0,
    pickaxe: 0,
    spear: 0,
    campfire: 0,
    foundation: 0,
    wall: 0,
  },
  bottleCharges: 3,
  bandages: 1,
});

const recipes = {
  axe: { name: "Каменный топор", cost: { wood: 3, stone: 2, fiber: 1 } },
  pickaxe: { name: "Каменная кирка", cost: { wood: 2, stone: 3, fiber: 1 } },
  spear: { name: "Копьё", cost: { wood: 3, stone: 2, fiber: 2 } },
  campfire: { name: "Костёр", cost: { wood: 4, stone: 2 } },
  foundation: { name: "Фундамент", cost: { wood: 8 } },
  wall: { name: "Стена", cost: { wood: 6 } },
  bandage: { name: "Повязка", cost: { fiber: 3, berries: 1 } },
} as const;

export type RecipeId = keyof typeof recipes;
export const RECIPES = recipes;

function hash(x: number, y: number, salt = 0): number {
  const value = Math.sin(x * 127.1 + y * 311.7 + salt * 74.7) * 43758.5453123;
  return value - Math.floor(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function distance(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}

export class SurvivalWorld {
  readonly seed: number;
  readonly tiles: Tile[][] = [];
  readonly nodes: ResourceNode[] = [];
  readonly structures: Structure[] = [];
  readonly player: PlayerState = {
    x: SPAWN.x,
    y: SPAWN.y,
    health: 92,
    hunger: 82,
    water: 74,
    stamina: 100,
    moving: false,
  };
  readonly inventory: Inventory = initialInventory();

  selectedSlot = 0;
  elapsed = 0;
  worldMinutes = 8 * 60 + 20;
  paused = false;
  torchLit = true;
  aimYaw = -0.45;
  private nextId = 1;
  private spawn = { ...SPAWN };

  constructor(seed = 20261029) {
    this.seed = seed;
    this.generateWorld();
  }

  private generateWorld(): void {
    const center = { x: 31, y: 31 };
    for (let y = 0; y < WORLD_SIZE; y += 1) {
      const row: Tile[] = [];
      for (let x = 0; x < WORLD_SIZE; x += 1) {
        const wave = Math.sin(x * 0.24) * 1.3 + Math.cos(y * 0.18) * 1.1 + Math.sin((x + y) * 0.14) * 0.7;
        const shoreLine = 20 + wave;
        const d = distance(x, y, center.x, center.y);
        const roll = hash(x, y, this.seed);
        let terrain: Terrain = "grass";
        let height = 0;
        if (d > shoreLine) terrain = "water";
        else if (d > shoreLine - 2.2) terrain = "shore";
        else if (roll > 0.87 || (Math.sin(x * 0.39) + Math.cos(y * 0.31) > 1.58 && roll > 0.46)) {
          terrain = "rock";
          height = 1 + Math.floor(hash(x, y, this.seed + 17) * 2);
        } else {
          const slope = Math.sin(x * 0.31 + y * 0.18) + Math.cos(y * 0.26 - x * 0.12);
          height = slope > 1.15 && roll > 0.58 ? 1 : 0;
        }
        row.push({ x, y, terrain, height, tint: Math.floor(roll * 5) });
      }
      this.tiles.push(row);
    }

    // A small grassy clearing keeps the first steps calm and readable.
    for (let y = 32; y <= 39; y += 1) {
      for (let x = 24; x <= 31; x += 1) {
        if (distance(x + 0.5, y + 0.5, SPAWN.x, SPAWN.y) < 4.1) {
          const tile = this.tiles[y][x];
          tile.terrain = "grass";
          tile.height = 0;
        }
      }
    }

    for (let y = 2; y < WORLD_SIZE - 2; y += 1) {
      for (let x = 2; x < WORLD_SIZE - 2; x += 1) {
        const tile = this.tiles[y][x];
        const roll = hash(x, y, this.seed + 29);
        if (tile.terrain === "water" || tile.terrain === "shore") continue;
        if (distance(x + 0.5, y + 0.5, SPAWN.x, SPAWN.y) < 3.6) continue;
        if (tile.terrain === "rock" && roll < 0.48) this.addNode("stone", x + 0.5, y + 0.5, hash(x, y, 5));
        else if (tile.terrain === "grass" && roll < 0.085) this.addNode("pine", x + 0.5, y + 0.5, hash(x, y, 3));
        else if (tile.terrain === "grass" && roll > 0.88 && roll < 0.965) this.addNode("berry", x + 0.5, y + 0.5, hash(x, y, 7));
        else if (tile.terrain === "grass" && roll > 0.986) this.addNode("scrap", x + 0.5, y + 0.5, hash(x, y, 9));
        else if (tile.terrain === "grass" && roll > 0.78 && roll < 0.825) this.addNode("stone", x + 0.5, y + 0.5, hash(x, y, 11));
      }
    }

    // Distinct landmarks close to the beach spawn.
    this.addNode("pine", 24.5, 35.5, 0.25);
    this.addNode("pine", 30.5, 32.5, 0.71);
    this.addNode("pine", 23.5, 31.5, 0.44);
    this.addNode("stone", 30.5, 37.5, 0.3);
    this.addNode("stone", 25.5, 39.5, 0.8);
    this.addNode("berry", 25.5, 32.5, 0.57);
    this.addNode("berry", 31.5, 35.5, 0.88);
    this.addNode("scrap", 20.5, 34.5, 0.17);
  }

  private addNode(kind: ResourceKind, x: number, y: number, variant: number): void {
    const duplicate = this.nodes.some((node) => !node.gone && distance(node.x, node.y, x, y) < 0.85);
    if (duplicate) return;
    const hp = kind === "pine" ? 3 : kind === "stone" ? 3 : kind === "scrap" ? 1 : 2;
    this.nodes.push({ id: this.nextId++, kind, x, y, hp, maxHp: hp, variant, gone: false });
  }

  tileAt(x: number, y: number): Tile {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    if (ix < 0 || iy < 0 || ix >= WORLD_SIZE || iy >= WORLD_SIZE) {
      return { x: ix, y: iy, terrain: "water", height: 0, tint: 0 };
    }
    return this.tiles[iy][ix];
  }

  get nearestNode(): ResourceNode | null {
    let closest: ResourceNode | null = null;
    let bestScore = Number.POSITIVE_INFINITY;
    for (const node of this.nodes) {
      if (node.gone) continue;
      const dx = node.x - this.player.x;
      const dy = node.y - this.player.y;
      const d = Math.hypot(dx, dy);
      if (d > 5.2 || d < 0.55) continue;
      const targetYaw = Math.atan2(-dx, -dy);
      const delta = Math.atan2(Math.sin(targetYaw - this.aimYaw), Math.cos(targetYaw - this.aimYaw));
      if (Math.abs(delta) > 0.43) continue;
      const score = d + Math.abs(delta) * 1.8;
      if (score < bestScore) {
        closest = node;
        bestScore = score;
      }
    }
    return closest;
  }

  setAim(yaw: number): void {
    this.aimYaw = yaw;
  }

  get nearestDistance(): number {
    return this.nearestNode ? distance(this.nearestNode.x, this.nearestNode.y, this.player.x, this.player.y) : Infinity;
  }

  get selectedItem(): ToolKind | "berries" {
    return HOTBAR[this.selectedSlot]?.kind ?? "rock";
  }

  get selectedBuilding(): boolean {
    return this.selectedItem === "campfire" || this.selectedItem === "foundation" || this.selectedItem === "wall";
  }

  get isNight(): boolean {
    const hour = this.worldMinutes / 60;
    return hour < 5.3 || hour > 21.1;
  }

  get daylight(): number {
    const hour = (this.worldMinutes / 60) % 24;
    const sun = Math.sin(((hour - 6) / 14) * Math.PI);
    return clamp(sun, 0, 1);
  }

  getItemCount(kind: ToolKind | "berries"): number {
    if (kind === "berries") return this.inventory.materials.berries;
    return this.inventory.tools[kind] ?? 0;
  }

  getBuildingCount(kind: BuildKind): number {
    return this.inventory.tools[kind];
  }

  update(dt: number, input: MoveInput): void {
    if (this.paused) return;
    const step = Math.min(dt, 0.05);
    this.elapsed += step;
    this.aimYaw = input.yaw;
    this.worldMinutes += step * 1.15;
    if (this.worldMinutes >= 24 * 60) this.worldMinutes -= 24 * 60;

    const forward = Number(input.up) - Number(input.down);
    const strafe = Number(input.right) - Number(input.left);
    const ix = -Math.sin(input.yaw) * forward + Math.cos(input.yaw) * strafe;
    const iy = -Math.cos(input.yaw) * forward - Math.sin(input.yaw) * strafe;
    const mag = Math.hypot(ix, iy);
    const moving = mag > 0;
    const sprinting = moving && input.sprint && this.player.stamina > 1;
    this.player.moving = moving;
    const speed = sprinting ? 4.55 : 2.75;
    if (moving) {
      const nx = this.player.x + (ix / mag) * speed * step;
      const ny = this.player.y + (iy / mag) * speed * step;
      if (this.canOccupy(nx, this.player.y)) this.player.x = nx;
      if (this.canOccupy(this.player.x, ny)) this.player.y = ny;
      if (sprinting) this.player.stamina = Math.max(0, this.player.stamina - 24 * step);
      else this.player.stamina = Math.min(100, this.player.stamina + 10 * step);
    } else {
      this.player.stamina = Math.min(100, this.player.stamina + 17 * step);
    }

    this.player.hunger = Math.max(0, this.player.hunger - 0.018 * step);
    this.player.water = Math.max(0, this.player.water - 0.033 * step);
    if (this.player.hunger === 0) this.player.health = Math.max(0, this.player.health - 0.55 * step);
    if (this.player.water === 0) this.player.health = Math.max(0, this.player.health - 0.9 * step);
    if (this.player.health <= 0) this.respawn();
  }

  private canOccupy(x: number, y: number): boolean {
    const t = this.tileAt(x, y);
    if (t.terrain === "water") return false;
    if (this.nodes.some((node) => !node.gone && distance(x, y, node.x, node.y) < 0.46)) return false;
    return !this.structures.some((s) => s.kind === "wall" && distance(x, y, s.x, s.y) < 0.47);
  }

  selectHotbar(slot: number): string | null {
    if (slot < 0 || slot >= HOTBAR.length) return null;
    const item = HOTBAR[slot].kind;
    if (item !== "berries" && this.getItemCount(item) <= 0 && item !== "rock") {
      return `В рюкзаке нет предмета «${HOTBAR[slot].label}». Его можно изготовить на верстаке.`;
    }
    this.selectedSlot = slot;
    return null;
  }

  interact(): string {
    const target = this.nearestNode;
    if (!target) return "Подойди ближе к ресурсу, чтобы взаимодействовать.";
    if (target.kind === "pine") {
      const axeBonus = this.selectedItem === "axe" ? 2 : 0;
      this.inventory.materials.wood += 2 + axeBonus;
      if (target.variant > 0.4) this.inventory.materials.fiber += 1;
      target.hp -= 1;
      if (target.hp <= 0) target.gone = true;
      return `Древесина +${2 + axeBonus}${target.variant > 0.4 ? " · волокно +1" : ""}`;
    }
    if (target.kind === "stone") {
      const pickBonus = this.selectedItem === "pickaxe" ? 2 : 0;
      const amount = 1 + pickBonus;
      this.inventory.materials.stone += amount;
      target.hp -= 1;
      if (target.hp <= 0) target.gone = true;
      return `Камень +${amount}`;
    }
    if (target.kind === "berry") {
      this.inventory.materials.berries += 2;
      this.inventory.materials.fiber += target.hp > 1 ? 1 : 0;
      target.hp -= 1;
      if (target.hp <= 0) target.gone = true;
      return "Ягоды +2 · куст собран";
    }
    this.inventory.materials.scrap += 2;
    target.gone = true;
    return "Старый ящик разобран · детали +2";
  }

  eat(): string {
    if (this.inventory.materials.berries <= 0) return "Ягод не осталось. Поищи кусты на поляне.";
    if (this.player.hunger > 96 && this.player.water > 88) return "Ты не голоден — сохрани еду на потом.";
    this.inventory.materials.berries -= 1;
    this.player.hunger = Math.min(100, this.player.hunger + 27);
    this.player.water = Math.min(100, this.player.water + 7);
    return "Съедены лесные ягоды · сытость +27";
  }

  drink(): string {
    if (this.inventory.bottleCharges <= 0) return "Фляга пуста. Наполни её у пресного ручья.";
    if (this.player.water > 92) return "Жажда пока не беспокоит.";
    this.inventory.bottleCharges -= 1;
    this.player.water = Math.min(100, this.player.water + 34);
    return "Глоток из фляги · вода +34";
  }

  craft(id: RecipeId): string {
    const recipe = RECIPES[id];
    const cost = recipe.cost as Partial<Record<Material, number>>;
    for (const [material, amount] of Object.entries(cost) as [Material, number][]) {
      if (this.inventory.materials[material] < amount) {
        return `Не хватает: ${this.materialName(material)} ×${amount - this.inventory.materials[material]}`;
      }
    }
    for (const [material, amount] of Object.entries(cost) as [Material, number][]) {
      this.inventory.materials[material] -= amount;
    }
    if (id === "bandage") this.inventory.bandages += 1;
    else this.inventory.tools[id] += 1;
    return `Изготовлено: ${recipe.name}`;
  }

  private materialName(material: Material): string {
    return { wood: "древесина", stone: "камень", fiber: "волокно", berries: "ягоды", scrap: "детали" }[material];
  }

  placeAt(x: number, y: number): string {
    const kind = this.selectedItem;
    if (kind !== "campfire" && kind !== "foundation" && kind !== "wall") {
      return "Выбери костёр, фундамент или стену в панели быстрого доступа.";
    }
    if (this.inventory.tools[kind] <= 0) return `Нет предмета «${this.itemName(kind)}».`;
    const gx = Math.floor(x) + 0.5;
    const gy = Math.floor(y) + 0.5;
    if (distance(gx, gy, this.player.x, this.player.y) > 6) return "Слишком далеко. Подойди к месту строительства.";
    const tile = this.tileAt(gx, gy);
    if (tile.terrain === "water" || tile.terrain === "shore") return "На воде фундамент не удержится.";
    if (this.structures.some((s) => distance(s.x, s.y, gx, gy) < 0.8)) return "Здесь уже что-то построено.";
    if (distance(gx, gy, this.player.x, this.player.y) < 0.75) return "Отойди немного, чтобы поставить постройку.";
    this.structures.push({ id: this.nextId++, kind, x: gx, y: gy, rotation: 0 });
    this.inventory.tools[kind] -= 1;
    return kind === "campfire" ? "Костёр установлен · вокруг стало теплее" : `${this.itemName(kind)} установлен`;
  }

  toggleTorch(): string {
    this.torchLit = !this.torchLit;
    return this.torchLit ? "Факел зажжён" : "Факел потушен";
  }

  heal(): string {
    if (this.inventory.bandages <= 0) return "Повязок нет. Изготовь её из волокна и ягод.";
    if (this.player.health > 88) return "Здоровье почти полное.";
    this.inventory.bandages -= 1;
    this.player.health = Math.min(100, this.player.health + 38);
    return "Повязка наложена · здоровье +38";
  }

  private itemName(kind: ToolKind): string {
    return HOTBAR.find((slot) => slot.kind === kind)?.label ?? "предмет";
  }

  private respawn(): void {
    this.player.health = 55;
    this.player.hunger = Math.max(this.player.hunger, 25);
    this.player.water = Math.max(this.player.water, 25);
    this.player.x = this.spawn.x;
    this.player.y = this.spawn.y;
    this.inventory.materials.wood = Math.floor(this.inventory.materials.wood * 0.7);
    this.inventory.materials.stone = Math.floor(this.inventory.materials.stone * 0.7);
  }

  snapshot(): Snapshot {
    const hour = Math.floor(this.worldMinutes / 60) % 24;
    const minute = Math.floor(this.worldMinutes % 60);
    const target = this.nearestNode;
    return {
      day: Math.floor(this.elapsed / (24 * 60 / 1.15)) + 1,
      time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
      temperature: Math.round(4 - (hour < 6 || hour > 20 ? 7 : 0) - (this.isNight ? 2 : 0)),
      position: `${Math.floor(this.player.x).toString().padStart(2, "0")}:${Math.floor(this.player.y).toString().padStart(2, "0")}`,
      nearest: target,
      nearestDistance: target ? distance(target.x, target.y, this.player.x, this.player.y) : Infinity,
      isNight: this.isNight,
      wood: this.inventory.materials.wood,
      stone: this.inventory.materials.stone,
      fiber: this.inventory.materials.fiber,
      berries: this.inventory.materials.berries,
      scrap: this.inventory.materials.scrap,
    };
  }
}
