import { useState } from "react";
import { Hash, Headphones, Plus, Volume2, X } from "lucide-react";
import type { Channel, Server } from "../data";
import { cn } from "../utils/cn";
import { Modal } from "./Modal";
import { useSettings } from "../store";

export default function CreateChannelModal({
  server,
  categoryId,
  onClose,
  onCreate,
}: {
  server: Server;
  categoryId: string;
  onClose: () => void;
  onCreate: (categoryId: string, channel: Channel) => void;
}) {
  const { toast } = useSettings();
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [type, setType] = useState<Channel["type"]>("text");
  const [targetCategory, setTargetCategory] = useState(categoryId);
  const [privateChannel, setPrivateChannel] = useState(false);
  const [creating, setCreating] = useState(false);
  const cleanName = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\p{L}\p{N}_-]/gu, "");

  const create = () => {
    if (!cleanName || creating) return;
    setCreating(true);
    const channel: Channel = {
      id: `channel-${Date.now().toString(36)}`,
      name: cleanName,
      type,
      ...(type === "text" && topic.trim() ? { topic: topic.trim() } : {}),
      ...(privateChannel ? { private: true } : {}),
    };
    window.setTimeout(() => {
      onCreate(targetCategory, channel);
      toast(`Канал ${type === "text" ? "#" : "🔊"}${cleanName} создан`, "success");
      onClose();
    }, 220);
  };

  return (
    <Modal onClose={onClose}>
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="max-gradient mb-3 flex h-11 w-11 items-center justify-center rounded-xl text-white"><Plus className="h-5 w-5" /></div>
            <h2 className="font-display text-xl font-bold text-white">Создать канал</h2>
            <p className="mt-1 text-sm text-fog-400">на сервере «{server.name}»</p>
          </div>
          <button onClick={onClose} title="Закрыть" className="rounded-full bg-ink-700 p-1.5 text-fog-400 transition hover:rotate-90 hover:text-white"><X className="h-4 w-4" /></button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {([
            { id: "text" as const, label: "Текстовый", icon: <Hash className="h-5 w-5" />, desc: "Общайтесь сообщениями" },
            { id: "voice" as const, label: "Голосовой", icon: <Headphones className="h-5 w-5" />, desc: "Общайтесь голосом и видео" },
          ]).map((option) => (
            <button
              key={option.id}
              onClick={() => setType(option.id)}
              className={cn("rounded-xl border-2 p-3 text-left transition", type === option.id ? "border-max-500 bg-ink-750" : "border-ink-600/50 bg-ink-850 hover:border-ink-500")}
            >
              <span className="flex items-center gap-2 text-fog-100">{option.icon}<span className="text-sm font-bold">{option.label}</span></span>
              <span className="mt-1 block text-xs text-fog-500">{option.desc}</span>
            </button>
          ))}
        </div>

        <label className="mt-5 block text-xs font-bold tracking-wider text-fog-400 uppercase">Название канала</label>
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-ink-950 px-3">
          {type === "text" ? <Hash className="h-4 w-4 text-fog-500" /> : <Volume2 className="h-4 w-4 text-fog-500" />}
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={50} onKeyDown={(e) => e.key === "Enter" && create()} placeholder={type === "text" ? "новый-канал" : "Новая комната"} className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-fog-100 placeholder-fog-500 outline-none" />
        </div>
        {type === "text" && (
          <>
            <label className="mt-4 block text-xs font-bold tracking-wider text-fog-400 uppercase">Тема канала <span className="font-normal normal-case text-fog-500">· необязательно</span></label>
            <input value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={90} placeholder="О чём этот канал?" className="mt-2 w-full rounded-lg bg-ink-950 px-3.5 py-2.5 text-sm text-fog-100 placeholder-fog-500 outline-none ring-max-500/0 transition focus:ring-2 focus:ring-max-500/60" />
          </>
        )}

        <label className="mt-4 block text-xs font-bold tracking-wider text-fog-400 uppercase">Категория</label>
        <select value={targetCategory} onChange={(e) => setTargetCategory(e.target.value)} className="mt-2 w-full rounded-lg bg-ink-950 px-3.5 py-2.5 text-sm text-fog-100 outline-none">
          {server.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>

        <button onClick={() => setPrivateChannel((v) => !v)} className="mt-4 flex w-full items-center justify-between rounded-lg bg-ink-850 p-3 text-left">
          <div><div className="text-sm font-semibold text-fog-100">Приватный канал</div><div className="text-xs text-fog-500">Только выбранные участники смогут его видеть</div></div>
          <span className={cn("flex h-6 w-11 items-center rounded-full p-0.5 transition", privateChannel ? "max-gradient justify-end" : "bg-ink-600 justify-start")}><span className="h-5 w-5 rounded-full bg-white shadow" /></span>
        </button>

        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="rounded-lg bg-ink-700 px-4 py-2.5 text-sm font-semibold text-fog-300 transition hover:bg-ink-600">Отмена</button>
          <button disabled={!cleanName || creating} onClick={create} className={cn("flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold text-white transition", cleanName ? "max-gradient hover:brightness-110" : "cursor-not-allowed bg-ink-600 text-fog-500")}>
            {creating ? <><span className="ring-spin h-4 w-4 rounded-full border-2 border-white/30 border-t-white" /> Создаём…</> : <><Plus className="h-4 w-4" /> Создать канал</>}
          </button>
        </div>
      </div>
    </Modal>
  );
}