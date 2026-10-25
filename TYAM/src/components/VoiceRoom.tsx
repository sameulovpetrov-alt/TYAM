import { useEffect, useMemo, useRef, useState } from "react";
import {
  AudioLines,
  Camera,
  CameraOff,
  ChevronDown,
  Headphones,
  HeadphoneOff,
  MessageCircle,
  Mic,
  MicOff,
  MoreHorizontal,
  PhoneOff,
  ScreenShare,
  Settings,
  Signal,
  Sparkles,
  Users,
  Volume2,
  X,
} from "lucide-react";
import type { Channel, RoleContext, Server, User } from "../data";
import { cn } from "../utils/cn";
import { useSettings } from "../store";
import { Avatar, NickName, nickColorsOf } from "./ui";

interface Props {
  server: Server;
  channel: Channel;
  participants: User[];
  meUser: User;
  muted: boolean;
  deafened: boolean;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onLeave: () => void;
  onOpenSettings: () => void;
  live?: boolean;
  roles?: RoleContext | null;
}

export default function VoiceRoom(p: Props) {
  const { settings, toast } = useSettings();
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [sidePanel, setSidePanel] = useState<"chat" | "members" | null>("members");
  const [chatDraft, setChatDraft] = useState("");
  const [chatMessages, setChatMessages] = useState<{ id: number; user: string; text: string; time: string }[]>([]);
  const cameraRef = useRef<HTMLVideoElement>(null);
  const screenRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const people = useMemo(() => {
    const unique = new Map<string, User>();
    for (const user of p.participants) unique.set(user.id, user);
    unique.set("me", p.meUser);
    return [...unique.values()];
  }, [p.participants, p.meUser]);

  useEffect(() => {
    if (cameraRef.current) cameraRef.current.srcObject = cameraStream;
  }, [cameraStream]);

  useEffect(() => {
    if (screenRef.current) screenRef.current.srcObject = screenStream;
  }, [screenStream]);

  useEffect(() => {
    return () => {
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
      screenStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const toggleCamera = async () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
      setCameraStream(null);
      setCameraOn(false);
      return;
    }
    try {
      const video: MediaTrackConstraints = {};
      if (settings.voice.cameraDevice !== "default") video.deviceId = { exact: settings.voice.cameraDevice };
      const stream = await navigator.mediaDevices.getUserMedia({ video, audio: false });
      cameraStreamRef.current = stream;
      setCameraStream(stream);
      setCameraOn(true);
      toast("Камера включена", "success");
    } catch {
      toast("Не удалось открыть камеру. Проверьте разрешения браузера.", "info");
    }
  };

  const toggleScreenShare = async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
      setScreenStream(null);
      return;
    }
    if (!navigator.mediaDevices?.getDisplayMedia) {
      toast("Демонстрация экрана не поддерживается этим браузером", "info");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      screenStreamRef.current = stream;
      stream.getVideoTracks()[0]?.addEventListener("ended", () => {
        screenStreamRef.current = null;
        setScreenStream(null);
      }, { once: true });
      setScreenStream(stream);
      toast("Демонстрация экрана запущена", "success");
    } catch {
      toast("Демонстрация экрана отменена", "info");
    }
  };

  const sendChat = () => {
    const text = chatDraft.trim();
    if (!text) return;
    const now = new Date();
    setChatMessages((list) => [...list, { id: Date.now(), user: p.meUser.name, text, time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}` }]);
    setChatDraft("");
  };

  const gridClass = people.length <= 2 ? "grid-cols-1 sm:grid-cols-2" : people.length <= 4 ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-3";

  return (
    <section className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-[#10131c] text-white">
      {/* channel header */}
      <header className="z-10 flex h-12 shrink-0 items-center gap-2 border-b border-white/[0.06] bg-[#171a24]/90 px-4 shadow-lg shadow-black/10">
        <Volume2 className="h-5 w-5 text-fog-500" />
        <span className="text-sm font-bold">{p.channel.name}</span>
        <span className="hidden text-xs text-white/35 sm:inline">/ {p.server.name}</span>
        <div className="mx-1 h-5 w-px bg-white/10" />
        <span className="flex items-center gap-1.5 text-xs font-semibold text-online">
          <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-online opacity-50" /><span className="relative inline-flex h-2 w-2 rounded-full bg-online" /></span>
          Голос подключён
        </span>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => setSidePanel((value) => value === "chat" ? null : "chat")} title="Открыть чат канала" className={cn("rounded-md p-1.5 transition hover:bg-white/10", sidePanel === "chat" && "bg-white/10 text-max-300")}><MessageCircle className="h-4 w-4" /></button>
          <button onClick={() => setSidePanel((value) => value === "members" ? null : "members")} title="Участники" className={cn("rounded-md p-1.5 transition hover:bg-white/10", sidePanel === "members" && "text-max-300")}><Users className="h-4 w-4" /></button>
          <button onClick={p.onOpenSettings} title="Настройки голоса и видео" className="rounded-md p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"><Settings className="h-4 w-4" /></button>
          <button title="Другие действия" className="rounded-md p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"><MoreHorizontal className="h-4 w-4" /></button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* room stage */}
        <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgba(74,85,140,0.18),transparent_65%)]" />
          {screenStream && (
            <div className="relative z-[1] mx-5 mt-5 min-h-0 flex-1 overflow-hidden rounded-xl bg-black shadow-2xl">
              <video ref={screenRef} autoPlay playsInline muted className="h-full max-h-[55vh] w-full object-contain" />
              <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-md bg-black/60 px-3 py-1.5 text-xs font-bold backdrop-blur">
                <ScreenShare className="h-4 w-4 text-online" /> {p.meUser.name} демонстрирует экран
              </div>
              <button onClick={toggleScreenShare} className="absolute top-3 right-3 rounded-full bg-black/50 p-2 text-white transition hover:bg-dnd"><X className="h-4 w-4" /></button>
            </div>
          )}

          <div className={cn("relative z-[1] mx-auto grid w-full max-w-5xl flex-1 content-center gap-3 p-5", gridClass, screenStream && "max-h-[240px] flex-none pt-4")}>
            {people.map((user, index) => {
              const isMe = user.id === "me";
              const camera = isMe && cameraOn && cameraStream;
              const speaking = !isMe && index === 0;
              return (
                <div
                  key={user.id}
                  className={cn(
                    "group relative flex min-h-[170px] items-center justify-center overflow-hidden rounded-2xl border bg-[#1b1e29] shadow-xl shadow-black/20 transition duration-300",
                    speaking ? "border-online/70 shadow-online/10" : "border-white/[0.06]",
                    screenStream && "min-h-[100px]"
                  )}
                >
                  {camera ? (
                    <video ref={cameraRef} autoPlay playsInline muted className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(91,108,249,0.15),transparent_58%)]" />
                  )}
                  {!camera && (
                    <div className={cn("relative flex items-center justify-center rounded-full p-1 transition", speaking && "voice-pulse rounded-full")}>
                      <Avatar user={user} size={screenStream ? 54 : 96} showStatus={false} animated={p.live} />
                    </div>
                  )}
                  {camera && <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />}
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-black/45 px-2.5 py-1.5 text-xs font-bold backdrop-blur">
                    {speaking && <AudioLines className="h-3.5 w-3.5 text-online" />}
                    <span className="flex items-center gap-1.5">{(() => { const nick = nickColorsOf(user, p.roles, settings.nick); return nick.colors ? <NickName name={user.name} colors={nick.colors} animated={nick.animated} gradient={p.roles?.gradient} /> : user.name; })()}{isMe ? " (вы)" : ""}</span>
                  </div>
                  {isMe && p.muted && <span className="absolute right-3 bottom-3 ml-auto rounded-full bg-dnd/90 p-1.5"><MicOff className="h-3.5 w-3.5" /></span>}
                  {!isMe && <span className="absolute top-3 right-3 rounded-full bg-black/35 p-1.5 text-white/70"><Mic className="h-3.5 w-3.5" /></span>}
                  {isMe && cameraOn && <span className="absolute top-3 right-3 rounded-full bg-black/45 p-1.5 text-white/90"><Camera className="h-3.5 w-3.5" /></span>}
                </div>
              );
            })}
          </div>

          <div className="relative z-[2] flex shrink-0 flex-col items-center pb-5">
            <div className="mb-3 flex items-center gap-2 rounded-full border border-white/[0.08] bg-[#20232e]/90 px-3 py-1.5 text-xs text-white/65 shadow-xl backdrop-blur">
              <Signal className="h-3.5 w-3.5 text-online" />
              <span>Голосовой канал</span>
              <span className="h-3 w-px bg-white/15" />
              <span>{people.length} {people.length === 1 ? "участник" : "участника"}</span>
              <span className="h-3 w-px bg-white/15" />
              <span className="text-online">Соединение отличное</span>
            </div>

            <div className="flex items-center gap-1.5 rounded-2xl border border-white/[0.08] bg-[#20232e]/95 p-2 shadow-2xl shadow-black/35 backdrop-blur-xl">
              <button onClick={p.onToggleMute} title={p.muted ? "Включить микрофон" : "Выключить микрофон"} className={cn("group flex h-12 w-12 items-center justify-center rounded-xl transition", p.muted ? "bg-dnd text-white hover:bg-dnd/80" : "bg-white/10 text-white hover:bg-white/20")}>
                {p.muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>
              <button onClick={p.onToggleDeafen} title={p.deafened ? "Включить звук" : "Выключить звук"} className={cn("flex h-12 w-12 items-center justify-center rounded-xl transition", p.deafened ? "bg-dnd text-white hover:bg-dnd/80" : "bg-white/10 text-white hover:bg-white/20")}>
                {p.deafened ? <HeadphoneOff className="h-5 w-5" /> : <Headphones className="h-5 w-5" />}
              </button>
              <span className="mx-1 h-7 w-px bg-white/10" />
              <button onClick={toggleCamera} title={cameraOn ? "Выключить камеру" : "Включить камеру"} className={cn("flex h-12 w-12 items-center justify-center rounded-xl transition", cameraOn ? "bg-max-500 text-white hover:bg-max-600" : "bg-white/10 text-white hover:bg-white/20")}>
                {cameraOn ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
              </button>
              <button onClick={toggleScreenShare} title={screenStream ? "Остановить демонстрацию" : "Демонстрация экрана"} className={cn("flex h-12 w-12 items-center justify-center rounded-xl transition", screenStream ? "bg-online text-white hover:bg-online/80" : "bg-white/10 text-white hover:bg-white/20")}>
                <ScreenShare className="h-5 w-5" />
              </button>
              <span className="mx-1 h-7 w-px bg-white/10" />
              <button onClick={p.onLeave} title="Отключиться" className="flex h-12 w-12 items-center justify-center rounded-xl bg-dnd text-white transition hover:scale-105 hover:bg-dnd/80 active:scale-95">
                <PhoneOff className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-[11px] text-white/35">{p.muted ? "Микрофон выключен" : "Вы подключены к голосовому каналу"}</p>
          </div>
        </div>

        {/* room side panel */}
        {sidePanel && (
          <aside className="z-[3] flex w-64 shrink-0 flex-col border-l border-white/[0.06] bg-[#171a24]">
            <div className="flex h-11 shrink-0 items-center gap-2 border-b border-white/[0.06] px-3">
              <button onClick={() => setSidePanel("chat")} className={cn("flex-1 rounded-md px-2 py-1 text-xs font-bold transition", sidePanel === "chat" ? "bg-white/10 text-white" : "text-white/45 hover:text-white")}>Чат</button>
              <button onClick={() => setSidePanel("members")} className={cn("flex-1 rounded-md px-2 py-1 text-xs font-bold transition", sidePanel === "members" ? "bg-white/10 text-white" : "text-white/45 hover:text-white")}>Участники</button>
              <button onClick={() => setSidePanel(null)} title="Закрыть панель" className="rounded p-1 text-white/40 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {sidePanel === "chat" && (
                <>
                  <p className="mb-3 text-xs leading-relaxed text-white/35">Сообщения канала #{p.channel.name}</p>
                  {chatMessages.length === 0 && (
                    <div className="rounded-xl border border-dashed border-white/10 px-3 py-6 text-center">
                      <p className="text-xs font-semibold text-white/70">В голосовом чате пока тихо</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-white/35">
                        Напишите первое сообщение — его увидят все, кто подключён к каналу.
                      </p>
                    </div>
                  )}
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className="mb-4 text-xs">
                      <div className="flex items-baseline gap-2"><span className="font-bold text-white/85">{msg.user}</span><span className="text-[10px] text-white/30">{msg.time}</span></div>
                      <p className="mt-1 leading-relaxed text-white/65">{msg.text}</p>
                    </div>
                  ))}
                </>
              )}
              {sidePanel === "members" && (
                <>
                  <div className="mb-2 text-[10px] font-bold tracking-wider text-white/35 uppercase">В голосе · {people.length}</div>
                  {people.map((user) => (
                    <div key={user.id} className="mb-1 flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-white/[0.04]">
                      <Avatar user={user} size={28} showStatus={false} ring="ring-[#171a24]" animated={p.live} />
                      <span className="min-w-0 flex-1 truncate text-xs font-semibold text-white/80">{(() => { const nick = nickColorsOf(user, p.roles, settings.nick); return nick.colors ? <NickName name={user.name} colors={nick.colors} animated={nick.animated} gradient={p.roles?.gradient} /> : user.name; })()}{user.id === "me" ? " (вы)" : ""}</span>
                      {user.id === "me" && p.muted ? <MicOff className="h-3.5 w-3.5 text-dnd" /> : <AudioLines className="h-3.5 w-3.5 text-online" />}
                    </div>
                  ))}
                  <button onClick={p.onOpenSettings} className="mt-4 flex w-full items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-2.5 text-xs font-semibold text-white/60 transition hover:bg-white/[0.08] hover:text-white"><Sparkles className="h-4 w-4 text-max-300" /> Настройки устройства</button>
                </>
              )}
            </div>
            {sidePanel === "chat" && (
              <form onSubmit={(e) => { e.preventDefault(); sendChat(); }} className="m-3 flex items-center rounded-lg bg-black/25 px-2">
                <input value={chatDraft} onChange={(e) => setChatDraft(e.target.value)} placeholder="Написать в чат" className="min-w-0 flex-1 bg-transparent py-2 text-xs text-white placeholder-white/30 outline-none" />
                <button className="rounded p-1 text-max-300 disabled:opacity-30" disabled={!chatDraft.trim()}><MessageCircle className="h-4 w-4" /></button>
              </form>
            )}
          </aside>
        )}
      </div>
      <div className="pointer-events-none absolute top-14 right-4 z-[1] hidden items-center gap-2 rounded-full bg-black/20 px-3 py-1.5 text-[10px] text-white/40 xl:flex">
        <ChevronDown className="h-3 w-3" /> Качество связи HD
      </div>
    </section>
  );
}