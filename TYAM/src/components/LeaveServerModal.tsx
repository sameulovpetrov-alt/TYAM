import { LogOut, X } from "lucide-react";
import type { Server } from "../data";
import { Modal } from "./Modal";

export default function LeaveServerModal({ server, onCancel, onConfirm }: { server: Server; onCancel: () => void; onConfirm: () => void }) {
  return (
    <Modal onClose={onCancel}>
      <div className="p-6">
        <div className="flex items-start justify-between">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-dnd/15 text-dnd"><LogOut className="h-6 w-6" /></span>
          <button onClick={onCancel} title="Закрыть" className="rounded-full bg-ink-700 p-1.5 text-fog-400 transition hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <h2 className="font-display mt-4 text-xl font-bold text-white">Покинуть «{server.name}»?</h2>
        <p className="mt-2 text-sm leading-relaxed text-fog-400">Сервер исчезнет из списка. Вы сможете вернуться, если получите новое приглашение.</p>
        <div className="mt-6 flex gap-2">
          <button onClick={onCancel} className="flex-1 rounded-lg bg-ink-700 py-2.5 text-sm font-semibold text-fog-200 transition hover:bg-ink-600">Отмена</button>
          <button onClick={onConfirm} className="flex-1 rounded-lg bg-dnd py-2.5 text-sm font-bold text-white transition hover:brightness-110 active:scale-[0.98]">Покинуть сервер</button>
        </div>
      </div>
    </Modal>
  );
}