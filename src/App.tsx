import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  Axe,
  Backpack,
  Box,
  Check,
  ChevronRight,
  Compass,
  Crosshair,
  Droplets,
  Flame,
  Footprints,
  Hammer,
  Heart,
  Leaf,
  Map as MapIcon,
  Mountain,
  Pickaxe,
  Plus,
  RotateCcw,
  Shield,
  Signal,
  Sparkles,
  Sprout,
  Sun,
  Thermometer,
  TreePine,
  Utensils,
  Waves,
  Wind,
  X,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import GameCanvas from "./components/GameCanvas";
import {
  HOTBAR,
  RECIPES,
  SurvivalWorld,
  type Material,
  type RecipeId,
  type ToolKind,
} from "./game/engine";

const noInput = () => ({ up: false, down: false, left: false, right: false, sprint: false });

type PanelName = "craft" | "inventory" | "map" | "pause" | null;
type CraftCategory = "survival" | "building";

const hotbarIcons: Record<string, LucideIcon> = {
  rock: Mountain,
  axe: Axe,
  pickaxe: Pickaxe,
  spear: Crosshair,
  campfire: Flame,
  foundation: Box,
  wall: Shield,
  berries: Leaf,
};

const recipeDetails: { id: RecipeId; category: CraftCategory; icon: LucideIcon; note: string }[] = [
  { id: "axe", category: "survival", icon: Axe, note: "Быстрее добывает древесину" },
  { id: "pickaxe", category: "survival", icon: Pickaxe, note: "Больше камня с каждой жилы" },
  { id: "spear", category: "survival", icon: Crosshair, note: "Оружие и надёжный инструмент" },
  { id: "bandage", category: "survival", icon: Heart, note: "Восстанавливает 38 здоровья" },
  { id: "campfire", category: "building", icon: Flame, note: "Свет и тепло на первую ночь" },
  { id: "foundation", category: "building", icon: Box, note: "Основание для твоего убежища" },
  { id: "wall", category: "building", icon: Shield, note: "Периметр вокруг лагеря" },
];

const materialInfo: { id: Material; name: string; icon: LucideIcon }[] = [
  { id: "wood", name: "Древесина", icon: TreePine },
  { id: "stone", name: "Камень", icon: Mountain },
  { id: "fiber", name: "Волокно", icon: Sprout },
  { id: "berries", name: "Ягоды", icon: Leaf },
  { id: "scrap", name: "Детали", icon: Sparkles },
];

function StatusBar({
  icon: Icon,
  label,
  value,
  color,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  color: string;
  detail: string;
}) {
  return (
    <div className="status-row">
      <div className="status-head">
        <span className="status-label"><Icon size={13} strokeWidth={1.8} />{label}</span>
        <span className="status-value">{detail}</span>
      </div>
      <div className="status-track">
        <span className="status-fill" style={{ width: `${Math.max(0, value)}%`, background: color }} />
      </div>
    </div>
  );
}

function MiniMap({ world, pulse, large = false }: { world: SurvivalWorld; pulse: number; large?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#183b40";
    ctx.fillRect(0, 0, width, height);
    const scale = Math.min(width / 64, height / 64);
    const offsetX = (width - 64 * scale) / 2;
    const offsetY = (height - 64 * scale) / 2;
    for (const row of world.tiles) {
      for (const tile of row) {
        const color = tile.terrain === "water" ? (tile.tint % 2 ? "#28555a" : "#244e54")
          : tile.terrain === "shore" ? "#a79770"
            : tile.terrain === "rock" ? "#777b70"
              : tile.tint % 2 ? "#657954" : "#6c8058";
        ctx.fillStyle = color;
        ctx.fillRect(offsetX + tile.x * scale, offsetY + tile.y * scale, scale + 0.45, scale + 0.45);
      }
    }
    for (const node of world.nodes) {
      if (node.gone) continue;
      ctx.fillStyle = node.kind === "pine" ? "#324d37" : node.kind === "stone" ? "#c5c0aa" : node.kind === "berry" ? "#d98d67" : "#d7b77e";
      ctx.beginPath();
      ctx.arc(offsetX + node.x * scale, offsetY + node.y * scale, large ? 1.6 : 1.05, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const structure of world.structures) {
      ctx.fillStyle = structure.kind === "campfire" ? "#f1a35c" : "#d6bd88";
      ctx.fillRect(offsetX + structure.x * scale - 1, offsetY + structure.y * scale - 1, 3, 3);
    }
    const px = offsetX + world.player.x * scale;
    const py = offsetY + world.player.y * scale;
    ctx.beginPath();
    ctx.arc(px, py, large ? 4.7 : 3.4, 0, Math.PI * 2);
    ctx.fillStyle = "#f4d19b";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,238,203,.7)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(px, py, large ? 9 : 6.8, 0, Math.PI * 2);
    ctx.stroke();
  }, [world, pulse, large]);

  return <canvas ref={ref} className={`minimap-canvas${large ? " minimap-canvas-large" : ""}`} aria-label="Карта острова" />;
}

function ResourcePill({ icon: Icon, value, title }: { icon: LucideIcon; value: number; title: string }) {
  return (
    <div className="resource-pill" title={title}>
      <Icon size={13} /> <span>{value}</span>
    </div>
  );
}

function CraftPanel({
  world,
  category,
  setCategory,
  onCraft,
  onClose,
}: {
  world: SurvivalWorld;
  category: CraftCategory;
  setCategory: (category: CraftCategory) => void;
  onCraft: (id: RecipeId) => void;
  onClose: () => void;
}) {
  const resources = world.inventory.materials;
  const available = recipeDetails.filter((item) => item.category === category);
  return (
    <aside className="side-panel">
      <div className="panel-heading">
        <div>
          <div className="eyebrow">ПОЛЕВОЙ ВЕРСТАК <span>01</span></div>
          <h2>Изготовление</h2>
        </div>
        <button className="icon-button panel-close" onClick={onClose} aria-label="Закрыть панель"><X size={17} /></button>
      </div>
      <div className="material-strip">
        <ResourcePill icon={TreePine} value={resources.wood} title="Древесина" />
        <ResourcePill icon={Mountain} value={resources.stone} title="Камень" />
        <ResourcePill icon={Sprout} value={resources.fiber} title="Волокно" />
        <ResourcePill icon={Leaf} value={resources.berries} title="Ягоды" />
      </div>
      <div className="panel-tabs">
        <button className={category === "survival" ? "active" : ""} onClick={() => setCategory("survival")}>Снаряжение</button>
        <button className={category === "building" ? "active" : ""} onClick={() => setCategory("building")}>Строительство</button>
      </div>
      <div className="recipe-list">
        {available.map((recipe) => {
          const data = RECIPES[recipe.id];
          const costs = Object.entries(data.cost) as [Material, number][];
          const canCraft = costs.every(([material, amount]) => resources[material] >= amount);
          const Icon = recipe.icon;
          return (
            <div className="recipe-card" key={recipe.id}>
              <div className="recipe-icon"><Icon size={18} strokeWidth={1.7} /></div>
              <div className="recipe-body">
                <div className="recipe-title">{data.name}</div>
                <div className="recipe-note">{recipe.note}</div>
                <div className="recipe-costs">
                  {costs.map(([material, amount]) => {
                    const materialIcon = materialInfo.find((item) => item.id === material)?.icon ?? Box;
                    const have = resources[material];
                    const CostIcon = materialIcon;
                    return (
                      <span className={have >= amount ? "cost-met" : "cost-short"} key={material} title={materialInfo.find((item) => item.id === material)?.name}>
                        <CostIcon size={11} /> {have}<i>/</i>{amount}
                      </span>
                    );
                  })}
                </div>
              </div>
              <button className="craft-button" disabled={!canCraft} onClick={() => onCraft(recipe.id)} aria-label={`Создать: ${data.name}`}>
                <Plus size={15} />
              </button>
            </div>
          );
        })}
      </div>
      <div className="panel-footnote"><Sparkles size={13} /> Рецепты сохраняются в этом мире</div>
    </aside>
  );
}

function InventoryPanel({ world, onClose }: { world: SurvivalWorld; onClose: () => void }) {
  return (
    <aside className="side-panel inventory-panel">
      <div className="panel-heading">
        <div>
          <div className="eyebrow">ЛИЧНЫЕ ВЕЩИ <span>МЕСТО 08 / 20</span></div>
          <h2>Рюкзак</h2>
        </div>
        <button className="icon-button panel-close" onClick={onClose} aria-label="Закрыть панель"><X size={17} /></button>
      </div>
      <div className="inventory-section-label">СОБРАННЫЕ РЕСУРСЫ</div>
      <div className="inventory-grid">
        {materialInfo.map((item) => {
          const Icon = item.icon;
          return (
            <div className="inventory-item" key={item.id}>
              <div className="inventory-item-icon"><Icon size={19} /></div>
              <div><strong>{world.inventory.materials[item.id]}</strong><span>{item.name}</span></div>
            </div>
          );
        })}
      </div>
      <div className="inventory-section-label">СНАРЯЖЕНИЕ</div>
      <div className="inventory-grid gear-grid">
        {HOTBAR.filter((slot) => slot.kind !== "berries").map((slot) => {
          const Icon = hotbarIcons[slot.kind];
          const count = world.getItemCount(slot.kind as ToolKind);
          return (
            <div className={`inventory-item${count <= 0 ? " item-empty" : ""}`} key={slot.kind}>
              <div className="inventory-item-icon"><Icon size={18} /></div>
              <div><strong>{count}</strong><span>{slot.label}</span></div>
            </div>
          );
        })}
        <div className="inventory-item">
          <div className="inventory-item-icon"><Droplets size={18} /></div>
          <div><strong>{world.inventory.bottleCharges}</strong><span>Глотки воды</span></div>
        </div>
        <div className="inventory-item">
          <div className="inventory-item-icon"><Heart size={18} /></div>
          <div><strong>{world.inventory.bandages}</strong><span>Повязки</span></div>
        </div>
      </div>
      <div className="inventory-note"><Backpack size={15} /> Рюкзак выдержит ещё несколько находок. Сохраняй место для важных вещей.</div>
    </aside>
  );
}

function MapPanel({ world, pulse, onClose }: { world: SurvivalWorld; pulse: number; onClose: () => void }) {
  return (
    <aside className="side-panel map-panel">
      <div className="panel-heading">
        <div>
          <div className="eyebrow">КАРТОГРАФИЧЕСКИЙ ЛИСТ <span>СЕКТОР 04</span></div>
          <h2>Остров Полынь</h2>
        </div>
        <button className="icon-button panel-close" onClick={onClose} aria-label="Закрыть карту"><X size={17} /></button>
      </div>
      <div className="large-map-wrap"><MiniMap world={world} pulse={pulse} large /></div>
      <div className="map-legend">
        <span><i className="legend-dot player-dot" /> Ты</span>
        <span><i className="legend-dot pine-dot" /> Лес</span>
        <span><i className="legend-dot stone-dot" /> Камень</span>
        <span><i className="legend-dot berry-dot" /> Еда</span>
      </div>
      <div className="map-coordinates"><Compass size={15} /><span>Координаты</span><strong>{world.snapshot().position}</strong></div>
      <p className="map-note">Береговая линия нанесена приблизительно. Исследуй остров, чтобы найти старые тайники.</p>
    </aside>
  );
}

function Objectives({ world }: { world: SurvivalWorld }) {
  const wood = world.inventory.materials.wood;
  const stone = world.inventory.materials.stone;
  const axe = world.inventory.tools.axe > 0;
  const tasks = [
    { icon: TreePine, label: "Запасти древесину", value: Math.min(wood, 8), total: 8, done: wood >= 8 },
    { icon: Mountain, label: "Добыть камень", value: Math.min(stone, 5), total: 5, done: stone >= 5 },
    { icon: Axe, label: axe ? "Топор изготовлен" : "Сделать каменный топор", value: axe ? 1 : 0, total: 1, done: axe },
  ];
  return (
    <section className="objective-card">
      <div className="objective-head">
        <div><span className="eyebrow">ПЕРВЫЙ ДЕНЬ</span><h3>Обустрой лагерь</h3></div>
        <span className="objective-count">{tasks.filter((task) => task.done).length}<i>/</i>3</span>
      </div>
      <div className="objective-list">
        {tasks.map((task) => {
          const Icon = task.icon;
          const progress = (task.value / task.total) * 100;
          return (
            <div className={`objective-row${task.done ? " objective-done" : ""}`} key={task.label}>
              <span className="objective-icon">{task.done ? <Check size={13} /> : <Icon size={13} />}</span>
              <span className="objective-label">{task.label}</span>
              <span className="objective-progress">{task.value}/{task.total}</span>
              <span className="objective-track"><i style={{ width: `${progress}%` }} /></span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PausePanel({ onContinue, onReset }: { onContinue: () => void; onReset: () => void }) {
  return (
    <div className="pause-backdrop">
      <div className="pause-card">
        <span className="pause-mark"><Waves size={27} /></span>
        <div className="eyebrow">СОХРАНЕНИЕ МИРА АКТИВНО</div>
        <h2>Передышка</h2>
        <p>Остров подождёт. Когда будешь готов — костёр всё ещё горит.</p>
        <button className="primary-action" onClick={onContinue}><ChevronRight size={17} /> Вернуться к выживанию</button>
        <button className="secondary-action" onClick={onReset}><RotateCcw size={15} /> Начать заново</button>
      </div>
    </div>
  );
}

export default function App() {
  const [world, setWorld] = useState(() => new SurvivalWorld());
  const input = useRef(noInput());
  const [panel, setPanel] = useState<PanelName>(null);
  const [craftCategory, setCraftCategory] = useState<CraftCategory>("survival");
  const [pulse, setPulse] = useState(0);
  const [toast, setToast] = useState("");
  const [toastKey, setToastKey] = useState(0);
  const toastTimer = useRef<number | undefined>(undefined);

  const onFrame = useCallback(() => setPulse((value) => value + 1), []);
  const notify = useCallback((message: string) => {
    setToast(message);
    setToastKey((value) => value + 1);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2500);
  }, []);

  const togglePanel = useCallback((name: Exclude<PanelName, "pause" | null>) => {
    world.paused = false;
    setPanel((current) => current === name ? null : name);
  }, [world]);

  const pause = useCallback(() => {
    if (panel === "pause") {
      world.paused = false;
      setPanel(null);
    } else {
      world.paused = true;
      setPanel("pause");
    }
  }, [panel, world]);

  const reset = useCallback(() => {
    world.paused = false;
    input.current = noInput();
    setWorld(new SurvivalWorld(Math.floor(Math.random() * 1_000_000)));
    setPanel(null);
    notify("Новая высадка · мир готов");
  }, [world, notify]);

  useEffect(() => {
    const movement = new Map<string, keyof ReturnType<typeof noInput>>([
      ["KeyW", "up"], ["ArrowUp", "up"], ["KeyS", "down"], ["ArrowDown", "down"],
      ["KeyA", "left"], ["ArrowLeft", "left"], ["KeyD", "right"], ["ArrowRight", "right"],
      ["ShiftLeft", "sprint"], ["ShiftRight", "sprint"],
    ]);
    const isTyping = (target: EventTarget | null) => target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
    const keydown = (event: KeyboardEvent) => {
      if (isTyping(event.target)) return;
      const moveKey = movement.get(event.code);
      if (moveKey) {
        input.current[moveKey] = true;
        event.preventDefault();
        return;
      }
      if (event.repeat) return;
      const key = event.key.toLowerCase();
      if (/^[1-8]$/.test(key)) {
        const message = world.selectHotbar(Number(key) - 1);
        if (message) notify(message);
        else if (world.selectedBuilding) notify("Режим строительства · выбери место на земле");
      } else if (key === "e") notify(world.interact());
      else if (key === "f") notify(world.eat());
      else if (key === "g") notify(world.drink());
      else if (key === "h") notify(world.heal());
      else if (key === "t") notify(world.toggleTorch());
      else if (key === "c") { setCraftCategory("survival"); togglePanel("craft"); }
      else if (key === "i") togglePanel("inventory");
      else if (key === "m") togglePanel("map");
      else if (key === "escape") pause();
      else return;
      event.preventDefault();
    };
    const keyup = (event: KeyboardEvent) => {
      const moveKey = movement.get(event.code);
      if (moveKey) input.current[moveKey] = false;
    };
    const blur = () => { input.current = noInput(); };
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", blur);
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, [world, notify, togglePanel, pause]);

  const snapshot = world.snapshot();
  const target = snapshot.nearest;
  const isBuilding = world.selectedBuilding && world.getItemCount(world.selectedItem as ToolKind) > 0;
  const currentSlot = HOTBAR[world.selectedSlot];
  const lowHealth = world.player.health < 25;

  const actionLabel = target
    ? target.kind === "pine" ? "Срубить ель"
      : target.kind === "stone" ? "Добыть камень"
        : target.kind === "berry" ? "Собрать ягоды"
          : "Разобрать ящик"
    : "Рядом нет ресурсов";

  return (
    <main className="game-shell">
      <GameCanvas world={world} input={input} onFrame={onFrame} onNotify={notify} />
      <div className="screen-grain" aria-hidden="true" />
      <div className="hud-vignette" aria-hidden="true" />

      <header className="game-header">
        <div className="brand-lockup">
          <div className="brand-symbol"><Waves size={21} strokeWidth={1.7} /></div>
          <div className="brand-copy">
            <div className="brand-title">КРАЙ<span> / </span>ПОЛЫНЬ</div>
            <div className="brand-subtitle"><i /> ЧАСТНЫЙ СЕРВЕР · #01</div>
          </div>
        </div>

        <div className="world-clock">
          <div className="clock-icon">{snapshot.isNight ? <Wind size={16} /> : <Sun size={17} />}</div>
          <div className="clock-copy">
            <span className="clock-kicker">ДЕНЬ {String(snapshot.day).padStart(2, "0")} <i>·</i> ТАЙГА</span>
            <strong>{snapshot.time}</strong>
          </div>
          <span className="clock-divider" />
          <div className="temperature"><Thermometer size={14} />{snapshot.temperature}°</div>
        </div>

        <div className="header-actions">
          <div className="server-ping"><Signal size={13} /><span>18 <i>мс</i></span></div>
          <button className={`header-tool${panel === "map" ? " tool-active" : ""}`} onClick={() => togglePanel("map")} title="Карта · M" aria-label="Открыть карту"><MapIcon size={16} /><span>Карта</span></button>
          <button className={`header-tool${panel === "craft" ? " tool-active" : ""}`} onClick={() => { setCraftCategory("survival"); togglePanel("craft"); }} title="Крафт · C" aria-label="Открыть изготовление"><Hammer size={16} /><span>Крафт</span></button>
          <button className={`header-tool${panel === "inventory" ? " tool-active" : ""}`} onClick={() => togglePanel("inventory")} title="Рюкзак · I" aria-label="Открыть рюкзак"><Backpack size={16} /><span>Рюкзак</span></button>
          <button className="header-pause" onClick={pause} title="Пауза · Esc" aria-label="Пауза"><span /><span /><span /></button>
        </div>
      </header>

      <section className="left-hud">
        <div className="survivor-card">
          <div className="survivor-head">
            <div className="survivor-avatar"><span>В</span><i /></div>
            <div className="survivor-id"><strong>Выживший</strong><span>БЕРЕГОВОЙ СЕКТОР</span></div>
            <div className="level-chip"><span>LVL</span><b>01</b></div>
          </div>
          <div className={`health-line${lowHealth ? " health-critical" : ""}`}>
            <Heart size={13} fill="currentColor" />
            <div><span>ЗДОРОВЬЕ</span><strong>{Math.ceil(world.player.health)}<i> / 100</i></strong></div>
            <div className="health-bar"><span style={{ width: `${world.player.health}%` }} /></div>
          </div>
          <div className="survival-stats">
            <StatusBar icon={Utensils} label="СЫТОСТЬ" value={world.player.hunger} color="linear-gradient(90deg,#bd8b57,#e3bd82)" detail={`${Math.ceil(world.player.hunger)}%`} />
            <StatusBar icon={Droplets} label="ВОДА" value={world.player.water} color="linear-gradient(90deg,#5b9aa0,#9bc5bd)" detail={`${Math.ceil(world.player.water)}%`} />
            <StatusBar icon={Zap} label="ВЫНОСЛИВОСТЬ" value={world.player.stamina} color="linear-gradient(90deg,#a8b76f,#d6d79b)" detail={`${Math.ceil(world.player.stamina)}%`} />
          </div>
          <div className="survivor-foot"><span><Footprints size={12} /> {snapshot.position}</span><span><Activity size={12} /> В порядке</span></div>
        </div>

        <Objectives world={world} />
      </section>

      <section className="right-hud">
        <div className="minimap-card">
          <div className="minimap-heading"><span><Compass size={13} /> ОРИЕНТИРЫ</span><span className="north-mark">N</span></div>
          <div className="minimap-frame"><MiniMap world={world} pulse={pulse} /></div>
          <div className="minimap-footer"><span>ОСТРОВ ПОЛЫНЬ</span><strong>{snapshot.position}</strong></div>
        </div>
        <div className="pocket-resources">
          <div className="pocket-title">СОБРАНО</div>
          <div className="pocket-row">
            <ResourcePill icon={TreePine} value={snapshot.wood} title="Древесина" />
            <ResourcePill icon={Mountain} value={snapshot.stone} title="Камень" />
            <ResourcePill icon={Sprout} value={snapshot.fiber} title="Волокно" />
          </div>
        </div>
      </section>

      <div className="world-caption"><span className="caption-line" /> <span>ЗАЛИВ ПОЛЫНЬ</span> <i>·</i> <span>СЕВЕРНАЯ ТАЙГА</span></div>

      <section className="bottom-hud">
        <div className="interaction-hint">
          {isBuilding ? (
            <><span className="action-key mouse-key">ЛКМ</span><span className="hint-copy"><strong>Поставить {currentSlot.label.toLowerCase()}</strong><small>Выбери свободное место на земле</small></span><span className="hint-action-mark"><Crosshair size={15} /></span></>
          ) : target ? (
            <><span className="action-key">E</span><span className="hint-copy"><strong>{actionLabel}</strong><small>{snapshot.nearestDistance.toFixed(1)} м · {target.hp}/{target.maxHp} прочность</small></span><button className="interact-button" onClick={() => notify(world.interact())}>СОБРАТЬ <ChevronRight size={13} /></button></>
          ) : (
            <><span className="action-key muted-key"><Crosshair size={15} /></span><span className="hint-copy"><strong>{actionLabel}</strong><small>Осмотрись вокруг и найди ресурсы</small></span><span className="hint-action-mark"><Waves size={15} /></span></>
          )}
        </div>

        <div className="hotbar-shell">
          <div className="hotbar-label"><span>БЫСТРЫЙ ДОСТУП</span><i /> <small>ВЫБРАНО: {currentSlot.label.toUpperCase()}</small></div>
          <div className="hotbar">
            {HOTBAR.map((slot, index) => {
              const Icon = hotbarIcons[slot.kind];
              const count = world.getItemCount(slot.kind as ToolKind | "berries");
              const locked = count <= 0 && slot.kind !== "rock";
              return (
                <button
                  key={slot.kind}
                  className={`hotbar-slot${world.selectedSlot === index ? " slot-selected" : ""}${locked ? " slot-locked" : ""}`}
                  onClick={() => {
                    const message = world.selectHotbar(index);
                    if (message) notify(message);
                    else if (world.selectedBuilding) notify("Режим строительства · выбери место на земле");
                  }}
                  title={`${slot.label} · ${slot.key}`}
                  aria-label={`Слот ${slot.key}: ${slot.label}, количество ${count}`}
                >
                  <span className="slot-key">{slot.key}</span>
                  <span className="slot-icon"><Icon size={20} strokeWidth={1.65} /></span>
                  <span className="slot-name">{slot.short}</span>
                  <span className="slot-count">{count > 0 ? `×${count}` : "—"}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="quick-actions">
          <button onClick={() => notify(world.eat())} title="Съесть ягоду · F"><Leaf size={15} /><span>Еда</span><kbd>F</kbd></button>
          <button onClick={() => notify(world.drink())} title="Выпить воды · G"><Droplets size={15} /><span>Вода</span><kbd>G</kbd></button>
          <button onClick={() => notify(world.heal())} title="Использовать повязку · H"><Heart size={15} /><span>Лечение</span><kbd>H</kbd></button>
        </div>
      </section>

      <div className="control-hint"><span className="control-keys"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></span><span>ДВИЖЕНИЕ</span><i /> <kbd>SHIFT</kbd><span>БЕГ</span><i /> <kbd>E</kbd><span>ДЕЙСТВИЕ</span></div>
      <div className="world-warning"><Wind size={13} /><span>СОБИРАЕТСЯ ВЕТЕР</span><i /></div>

      {panel === "craft" && <CraftPanel world={world} category={craftCategory} setCategory={setCraftCategory} onCraft={(id) => notify(world.craft(id))} onClose={() => setPanel(null)} />}
      {panel === "inventory" && <InventoryPanel world={world} onClose={() => setPanel(null)} />}
      {panel === "map" && <MapPanel world={world} pulse={pulse} onClose={() => setPanel(null)} />}
      {panel === "pause" && <PausePanel onContinue={() => { world.paused = false; setPanel(null); }} onReset={reset} />}

      <div className={`toast${toast ? " toast-visible" : ""}`} key={toastKey} role="status" aria-live="polite">
        <span className="toast-mark"><Check size={14} /></span><span>{toast}</span>
      </div>

      <div className="mobile-controls" aria-label="Мобильное управление">
        <div className="d-pad">
          <button aria-label="Вверх" onPointerDown={(e) => { e.preventDefault(); input.current.up = true; }} onPointerUp={() => { input.current.up = false; }} onPointerLeave={() => { input.current.up = false; }}><ChevronRight className="pad-up" size={18} /></button>
          <button aria-label="Влево" onPointerDown={(e) => { e.preventDefault(); input.current.left = true; }} onPointerUp={() => { input.current.left = false; }} onPointerLeave={() => { input.current.left = false; }}><ChevronRight className="pad-left" size={18} /></button>
          <button aria-label="Вниз" onPointerDown={(e) => { e.preventDefault(); input.current.down = true; }} onPointerUp={() => { input.current.down = false; }} onPointerLeave={() => { input.current.down = false; }}><ChevronRight className="pad-down" size={18} /></button>
          <button aria-label="Вправо" onPointerDown={(e) => { e.preventDefault(); input.current.right = true; }} onPointerUp={() => { input.current.right = false; }} onPointerLeave={() => { input.current.right = false; }}><ChevronRight size={18} /></button>
        </div>
        <div className="mobile-action-column">
          <div className="mobile-utility-row">
            <button aria-label="Съесть ягоды" onClick={() => notify(world.eat())}><Leaf size={13} /><kbd>F</kbd></button>
            <button aria-label="Выпить воды" onClick={() => notify(world.drink())}><Droplets size={13} /><kbd>G</kbd></button>
            <button aria-label="Использовать повязку" onClick={() => notify(world.heal())}><Heart size={13} /><kbd>H</kbd></button>
          </div>
          <button className="mobile-interact" onClick={() => notify(world.interact())}><span>E</span><small>ДЕЙСТВИЕ</small></button>
        </div>
      </div>

      <div className="edge-coordinates" aria-hidden="true"><span>45° 02′ N</span><i /> <span>102° 18′ E</span></div>
    </main>
  );
}
