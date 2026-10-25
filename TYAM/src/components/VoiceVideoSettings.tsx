import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Check, Mic, MicOff, Radio, Volume2 } from "lucide-react";
import { useSettings } from "../store";
import { cn } from "../utils/cn";

interface DeviceOption {
  id: string;
  label: string;
}

function Switch({ value, onToggle }: { value: boolean; onToggle: () => void }) {
  return (
    <button role="switch" aria-checked={value} onClick={onToggle} className={cn("flex h-6 w-11 items-center rounded-full p-0.5 transition", value ? "max-gradient justify-end" : "justify-start bg-ink-600")}>
      <span className="h-5 w-5 rounded-full bg-white shadow" />
    </button>
  );
}

function SettingRow({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-5 border-t border-ink-600/40 py-4 first:border-0 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-fog-100">{title}</div>
        {description && <div className="mt-0.5 text-xs leading-relaxed text-fog-500">{description}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Range({ value, onChange, min = 0, max = 100, unit = "%" }: { value: number; onChange: (value: number) => void; min?: number; max?: number; unit?: string }) {
  const progress = ((value - min) / (max - min)) * 100;
  return (
    <div className="w-52">
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="h-1.5 w-full cursor-pointer accent-max-500" style={{ background: `linear-gradient(to right, var(--accent-1) ${progress}%, var(--color-ink-600) ${progress}%)` }} />
      <div className="mt-1 text-right text-[11px] tabular-nums text-fog-500">{value}{unit}</div>
    </div>
  );
}

export default function VoiceVideoSettings() {
  const { settings, updateNested, toast } = useSettings();
  const [micTesting, setMicTesting] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [inputDevices, setInputDevices] = useState<DeviceOption[]>([{ id: "default", label: "По умолчанию" }]);
  const [outputDevices, setOutputDevices] = useState<DeviceOption[]>([{ id: "default", label: "По умолчанию" }]);
  const [cameraDevices, setCameraDevices] = useState<DeviceOption[]>([{ id: "default", label: "По умолчанию" }]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number>(0);
  const meterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const refresh = async () => {
      try {
        const devices = await navigator.mediaDevices?.enumerateDevices();
        if (!devices) return;
        const map = (kind: MediaDeviceKind, fallback: string) => {
          const matching = devices.filter((device) => device.kind === kind);
          return [
            { id: "default", label: "По умолчанию" },
            ...matching.map((device, index) => ({ id: device.deviceId, label: device.label || `${fallback} ${index + 1}` })),
          ];
        };
        setInputDevices(map("audioinput", "Микрофон"));
        setOutputDevices(map("audiooutput", "Динамики"));
        setCameraDevices(map("videoinput", "Камера"));
      } catch {
        // Device enumeration can be unavailable until the browser grants media access.
      }
    };
    void refresh();
    navigator.mediaDevices?.addEventListener?.("devicechange", refresh);
    return () => navigator.mediaDevices?.removeEventListener?.("devicechange", refresh);
  }, []);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = cameraStream;
  }, [cameraStream]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animationRef.current);
      micStreamRef.current?.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
      void audioContextRef.current?.close();
    };
  }, []);

  const stopMicTest = () => {
    cancelAnimationFrame(animationRef.current);
    micStreamRef.current?.getTracks().forEach((track) => track.stop());
    micStreamRef.current = null;
    void audioContextRef.current?.close();
    audioContextRef.current = null;
    setMicTesting(false);
    if (meterRef.current) meterRef.current.style.width = "0%";
  };

  const startMicTest = async () => {
    if (micTesting) {
      stopMicTest();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      toast("Проверка микрофона недоступна. Откройте приложение по HTTPS.", "info");
      return;
    }
    try {
      const audio: MediaTrackConstraints = { echoCancellation: settings.voice.echo, noiseSuppression: settings.voice.noise, autoGainControl: settings.voice.autoGain };
      if (settings.voice.device !== "default") audio.deviceId = { exact: settings.voice.device };
      const stream = await navigator.mediaDevices.getUserMedia({
        audio,
        video: false,
      });
      micStreamRef.current = stream;
      const context = new AudioContext();
      audioContextRef.current = context;
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      context.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.fftSize);
      setMicTesting(true);
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (const value of data) {
          const sample = (value - 128) / 128;
          sum += sample * sample;
        }
        const level = Math.min(100, Math.round(Math.sqrt(sum / data.length) * 280));
        if (meterRef.current) meterRef.current.style.width = `${level}%`;
        animationRef.current = requestAnimationFrame(tick);
      };
      tick();
      toast("Микрофон подключён. Скажите что-нибудь для проверки.", "success");
    } catch {
      toast("Нет доступа к микрофону. Разрешите его в настройках браузера.", "info");
    }
  };

  const toggleCamera = async () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
      setCameraStream(null);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      toast("Предпросмотр камеры доступен по HTTPS", "info");
      return;
    }
    try {
      const video: MediaTrackConstraints = {};
      if (settings.voice.cameraDevice !== "default") video.deviceId = { exact: settings.voice.cameraDevice };
      const stream = await navigator.mediaDevices.getUserMedia({ video, audio: false });
      cameraStreamRef.current = stream;
      setCameraStream(stream);
    } catch {
      toast("Нет доступа к камере. Разрешите её в настройках браузера.", "info");
    }
  };

  const playTestSound = async () => {
    try {
      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = 440;
      gain.gain.value = Math.max(0.01, settings.voice.volume / 100) * 0.12;
      oscillator.connect(gain).connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.24);
      oscillator.onended = () => void context.close();
    } catch {
      toast("Не удалось воспроизвести тестовый звук", "info");
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-online/20 bg-online/5 p-3.5 text-xs leading-relaxed text-fog-400">
        Настройки применяются к голосовым каналам TYAM. Проверка микрофона и камеры использует разрешения вашего браузера.
      </div>

      <section className="rounded-xl bg-ink-850 p-5">
        <h2 className="mb-4 text-xs font-bold tracking-wider text-fog-500 uppercase">Устройства ввода</h2>
        <SettingRow title="Устройство ввода" description="Микрофон для голосовых каналов">
          <select value={settings.voice.device} onChange={(e) => updateNested("voice", { device: e.target.value })} className="w-56 rounded-lg bg-ink-950 px-3 py-2 text-xs text-fog-100 outline-none">
            {inputDevices.map((device) => <option key={device.id} value={device.id}>{device.label}</option>)}
          </select>
        </SettingRow>
        <SettingRow title="Режим ввода">
          <div className="flex rounded-lg bg-ink-950 p-1">
            {(["activity", "push"] as const).map((mode) => (
              <button key={mode} onClick={() => updateNested("voice", { inputMode: mode })} className={cn("rounded-md px-3 py-1.5 text-xs font-semibold transition", settings.voice.inputMode === mode ? "max-gradient text-white" : "text-fog-400 hover:text-white")}>
                {mode === "activity" ? "Активация голосом" : "Рация"}
              </button>
            ))}
          </div>
        </SettingRow>
        {settings.voice.inputMode === "activity" && (
          <SettingRow title="Чувствительность ввода" description="Порог, при котором микрофон начинает передавать звук">
            <Range value={settings.voice.sensitivity} min={-90} max={-10} unit=" дБ" onChange={(value) => updateNested("voice", { sensitivity: value })} />
          </SettingRow>
        )}
        <SettingRow title="Проверка микрофона" description={micTesting ? "Говорите — шкала реагирует на ваш голос" : "Проверьте входной уровень до подключения"}>
          <button onClick={startMicTest} className={cn("rounded-lg px-3.5 py-2 text-xs font-bold transition", micTesting ? "bg-dnd text-white hover:brightness-110" : "max-gradient text-white hover:brightness-110")}>
            {micTesting ? <span className="flex items-center gap-1.5"><MicOff className="h-3.5 w-3.5" /> Остановить</span> : <span className="flex items-center gap-1.5"><Mic className="h-3.5 w-3.5" /> Проверить микрофон</span>}
          </button>
        </SettingRow>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink-950">
          <div ref={meterRef} className="h-full w-0 rounded-full bg-gradient-to-r from-online via-idle to-dnd transition-[width] duration-75" />
        </div>
      </section>

      <section className="rounded-xl bg-ink-850 p-5">
        <h2 className="mb-4 text-xs font-bold tracking-wider text-fog-500 uppercase">Устройства вывода</h2>
        <SettingRow title="Устройство вывода" description="Куда выводить звук участников">
          <select value={settings.voice.outputDevice} onChange={(e) => updateNested("voice", { outputDevice: e.target.value })} className="w-56 rounded-lg bg-ink-950 px-3 py-2 text-xs text-fog-100 outline-none">
            {outputDevices.map((device) => <option key={device.id} value={device.id}>{device.label}</option>)}
          </select>
        </SettingRow>
        <SettingRow title="Громкость вывода" description="Общая громкость голосового чата">
          <Range value={settings.voice.volume} onChange={(value) => updateNested("voice", { volume: value })} />
        </SettingRow>
        <SettingRow title="Проверить звук" description="Воспроизвести короткий тестовый сигнал">
          <button onClick={playTestSound} className="flex items-center gap-2 rounded-lg bg-ink-700 px-3 py-2 text-xs font-bold text-fog-100 transition hover:bg-ink-600"><Volume2 className="h-4 w-4" /> Тест звука</button>
        </SettingRow>
        <SettingRow title="Приглушать другие приложения" description="Снижать громкость других участников во время вашей речи">
          <Switch value={settings.voice.lowerOthers} onToggle={() => updateNested("voice", { lowerOthers: !settings.voice.lowerOthers })} />
        </SettingRow>
        <SettingRow title="Уровень приглушения">
          <Range value={settings.voice.attenuation} onChange={(value) => updateNested("voice", { attenuation: value })} />
        </SettingRow>
      </section>

      <section className="rounded-xl bg-ink-850 p-5">
        <h2 className="mb-4 text-xs font-bold tracking-wider text-fog-500 uppercase">Обработка голоса</h2>
        <SettingRow title="Шумоподавление" description="Фильтрует клавиатуру, вентилятор и фоновые шумы">
          <Switch value={settings.voice.noise} onToggle={() => updateNested("voice", { noise: !settings.voice.noise })} />
        </SettingRow>
        <SettingRow title="Эхоподавление" description="Уменьшает эхо от динамиков">
          <Switch value={settings.voice.echo} onToggle={() => updateNested("voice", { echo: !settings.voice.echo })} />
        </SettingRow>
        <SettingRow title="Автоматическое усиление" description="Балансирует уровень громкости микрофона">
          <Switch value={settings.voice.autoGain} onToggle={() => updateNested("voice", { autoGain: !settings.voice.autoGain })} />
        </SettingRow>
        <SettingRow title="Подавление шума TYAM" description="Дополнительная очистка голоса на стороне приложения">
          <Switch value={settings.voice.noise} onToggle={() => updateNested("voice", { noise: !settings.voice.noise })} />
        </SettingRow>
      </section>

      <section className="rounded-xl bg-ink-850 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold tracking-wider text-fog-500 uppercase">Настройки видео</h2>
            <p className="mt-1 text-xs text-fog-500">Предпросмотр камеры доступен только вам</p>
          </div>
          <button onClick={toggleCamera} className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition", cameraStream ? "bg-dnd text-white" : "max-gradient text-white hover:brightness-110")}>
            {cameraStream ? <><CameraOff className="h-3.5 w-3.5" /> Выключить камеру</> : <><Camera className="h-3.5 w-3.5" /> Проверить видео</>}
          </button>
        </div>
        <div className="relative aspect-video overflow-hidden rounded-xl bg-ink-950">
          {cameraStream ? (
            <video ref={videoRef} autoPlay playsInline muted className="h-full w-full -scale-x-100 object-cover" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-fog-500">
              <CameraOff className="h-8 w-8" />
              <span className="text-xs">Предпросмотр камеры отключён</span>
            </div>
          )}
          {cameraStream && <div className="absolute bottom-2 left-2 rounded-md bg-black/50 px-2 py-1 text-[10px] font-semibold text-white">Предпросмотр · только вы</div>}
        </div>
        <div className="mt-4 flex items-center justify-between gap-4">
          <div><div className="text-sm font-semibold text-fog-100">Камера</div><div className="mt-0.5 text-xs text-fog-500">Выберите устройство для видео</div></div>
          <select value={settings.voice.cameraDevice} onChange={(e) => updateNested("voice", { cameraDevice: e.target.value })} className="w-56 rounded-lg bg-ink-950 px-3 py-2 text-xs text-fog-100 outline-none">
            {cameraDevices.map((device) => <option key={device.id} value={device.id}>{device.label}</option>)}
          </select>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-online"><Radio className="h-4 w-4" /> Для видео в канале используйте кнопку камеры в панели звонка.</div>
      </section>

      <div className="flex items-start gap-2 rounded-xl border border-max-500/20 bg-max-500/5 p-3 text-xs leading-relaxed text-fog-500">
        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-max-300" />
        Захват камеры и микрофона включается только после вашего действия и браузерного разрешения. Реальные звонки между участниками требуют подключения сервера сигнализации.
      </div>
    </div>
  );
}