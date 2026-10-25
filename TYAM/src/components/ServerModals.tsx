import { useState } from "react";
import { AlertTriangle, FolderPlus, Hash, Pencil, Volume2, X } from "lucide-react";
import type { Channel } from "../data";
import { Modal } from "./Modal";
import { cn } from "../utils/cn";

export function CreateCategoryModal({
  serverName,
  onClose,
  onCreate,
}: {
  serverName: string;
  onClose: () => void;
  onCreate: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const create = () => {
    if (!name.trim()) return;
    onCreate(name.trim());
    onClose();
  };
  return (
    <Modal onClose={onClose}>
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="max-gradient mb-3 flex h-11 w-11 items-center justify-center rounded-xl text-white"><FolderPlus className="h-5 w-5" /></div>
          <button onClick={onClose} title="Закрыть" className="rounded-full bg-ink-700 p-1.5 text-fog-400 transition hover:rotate-90 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <h2 className="font-display text-xl font-bold text-white">Создать категорию</h2>
        <p className="mt-1 text-sm text-fog-400">на сервере «{serverName}» — категории группируют каналы</p>
        <label className="mt-5 block text-xs font-bold tracking-wider text-fog-400 uppercase">Название категории</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && create()}
          maxLength={32}
          placeholder="Например: Турниры"
          className="mt-2 w-full rounded-lg bg-ink-950 px-3.5 py-2.5 text-sm text-fog-100 placeholder-fog-500 outline-none ring-max-500/0 transition focus:ring-2 focus:ring-max-500/60"
        />
        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="rounded-lg bg-ink-700 px-4 py-2.5 text-sm font-semibold text-fog-300 transition hover:bg-ink-600">Отмена</button>
          <button
            onClick={create}
            disabled={!name.trim()}
            className={cn("flex-1 rounded-lg py-2.5 text-sm font-bold text-white transition", name.trim() ? "max-gradient hover:brightness-110" : "cursor-not-allowed bg-ink-600 text-fog-500")}
          >
            Создать категорию
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function RenameCategoryModal({
  category,
  serverName,
  onClose,
  onSave,
}: {
  category: { id: string; name: string; channels: Channel[] };
  serverName: string;
  onClose: () => void;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState(category.name);
  const clean = name.trim();
  const save = () => {
    if (!clean) return;
    onSave(clean.slice(0, 32));
    onClose();
  };
  return (
    <Modal onClose={onClose}>
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="max-gradient mb-3 flex h-11 w-11 items-center justify-center rounded-xl text-white">
            <FolderPlus className="h-5 w-5" />
          </div>
          <button onClick={onClose} title="Закрыть" className="rounded-full bg-ink-700 p-1.5 text-fog-400 transition hover:rotate-90 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <h2 className="font-display text-xl font-bold text-white">Переименовать категорию</h2>
        <p className="mt-1 text-sm text-fog-400">
          сервер «{serverName}» · {category.channels.length} {category.channels.length === 1 ? "канал" : "каналов"} внутри
        </p>
        <label className="mt-5 block text-xs font-bold tracking-wider text-fog-400 uppercase">Новое название</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          maxLength={32}
          className="mt-2 w-full rounded-lg bg-ink-950 px-3.5 py-2.5 text-sm text-fog-100 outline-none ring-max-500/0 transition focus:ring-2 focus:ring-max-500/60"
        />
        <div className="mt-1 flex justify-between text-[11px] text-fog-500">
          <span>Категории группируют каналы в сайдбаре</span>
          <span className="tabular-nums">{clean.length}/32</span>
        </div>
        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="rounded-lg bg-ink-700 px-4 py-2.5 text-sm font-semibold text-fog-300 transition hover:bg-ink-600">
            Отмена
          </button>
          <button
            onClick={save}
            disabled={!clean || clean === category.name}
            className={cn(
              "flex-1 rounded-lg py-2.5 text-sm font-bold text-white transition",
              clean && clean !== category.name ? "max-gradient hover:brightness-110 active:scale-[0.99]" : "cursor-not-allowed bg-ink-600 text-fog-500"
            )}
          >
            Сохранить
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function EditChannelModal({
  channel,
  onClose,
  onSave,
}: {
  channel: Channel;
  onClose: () => void;
  onSave: (patch: { name: string; topic?: string }) => void;
}) {
  const [name, setName] = useState(channel.name);
  const [topic, setTopic] = useState(channel.topic ?? "");
  const clean = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\p{L}\p{N}_-]/gu, "");
  const save = () => {
    if (!clean) return;
    onSave({ name: clean, ...(channel.type === "text" && topic.trim() ? { topic: topic.trim() } : {}) });
    onClose();
  };
  return (
    <Modal onClose={onClose}>
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="max-gradient mb-3 flex h-11 w-11 items-center justify-center rounded-xl text-white"><Pencil className="h-5 w-5" /></div>
          <button onClick={onClose} title="Закрыть" className="rounded-full bg-ink-700 p-1.5 text-fog-400 transition hover:rotate-90 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <h2 className="font-display text-xl font-bold text-white">Редактировать канал</h2>
        <label className="mt-5 block text-xs font-bold tracking-wider text-fog-400 uppercase">Название канала</label>
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-ink-950 px-3">
          {channel.type === "text" ? <Hash className="h-4 w-4 text-fog-500" /> : <Volume2 className="h-4 w-4 text-fog-500" />}
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            maxLength={50}
            className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-fog-100 outline-none"
          />
        </div>
        {channel.type === "text" && (
          <>
            <label className="mt-4 block text-xs font-bold tracking-wider text-fog-400 uppercase">Тема канала</label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={2}
              maxLength={90}
              placeholder="О чём этот канал?"
              className="mt-2 w-full resize-none rounded-lg bg-ink-950 px-3.5 py-2.5 text-sm text-fog-100 placeholder-fog-500 outline-none ring-max-500/0 transition focus:ring-2 focus:ring-max-500/60"
            />
          </>
        )}
        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="rounded-lg bg-ink-700 px-4 py-2.5 text-sm font-semibold text-fog-300 transition hover:bg-ink-600">Отмена</button>
          <button
            onClick={save}
            disabled={!clean}
            className={cn("flex-1 rounded-lg py-2.5 text-sm font-bold text-white transition", clean ? "max-gradient hover:brightness-110" : "cursor-not-allowed bg-ink-600 text-fog-500")}
          >
            Сохранить
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function ConfirmModal({
  title,
  text,
  confirmLabel = "Подтвердить",
  onCancel,
  onConfirm,
}: {
  title: string;
  text: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal onClose={onCancel}>
      <div className="p-6">
        <div className="flex items-start justify-between">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-dnd/15 text-dnd"><AlertTriangle className="h-6 w-6" /></span>
          <button onClick={onCancel} title="Закрыть" className="rounded-full bg-ink-700 p-1.5 text-fog-400 transition hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <h2 className="font-display mt-4 text-xl font-bold text-white">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-fog-400">{text}</p>
        <div className="mt-6 flex gap-2">
          <button onClick={onCancel} className="flex-1 rounded-lg bg-ink-700 py-2.5 text-sm font-semibold text-fog-200 transition hover:bg-ink-600">Отмена</button>
          <button onClick={() => { onConfirm(); onCancel(); }} className="flex-1 rounded-lg bg-dnd py-2.5 text-sm font-bold text-white transition hover:brightness-110 active:scale-[0.98]">
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
