import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Music, Volume2, VolumeX } from "lucide-react";
import {
  resumeAudio,
  setMusicMuted,
  setSfxMuted,
  startAmbient,
  stopAmbient,
  isAmbientPlaying,
  playWhoosh,
  playRankingSting,
  playVictory,
} from "../../lib/gameAudio";
import { useGame } from "./GameContext";

const LS_MUSIC = "anatoplay-music";
const LS_SFX = "anatoplay-sfx";

interface GameAudioContextValue {
  musicEnabled: boolean;
  sfxEnabled: boolean;
  setMusicEnabled: (v: boolean) => void;
  setSfxEnabled: (v: boolean) => void;
}

const GameAudioContext = createContext<GameAudioContextValue | null>(null);

export function useGameAudio() {
  const ctx = useContext(GameAudioContext);
  if (!ctx) throw new Error("useGameAudio must be used inside GameAudioProvider");
  return ctx;
}

/** Reacts to multiplayer game status for stingers (SFX bus mute applies automatically). */
export function GameAudioSync() {
  const { state } = useGame();
  const prevStatus = useRef(state.gameStatus);

  useEffect(() => {
    const prev = prevStatus.current;
    const next = state.gameStatus;
    prevStatus.current = next;

    if (prev !== "question" && next === "question") playWhoosh();
    if (prev !== "ranking" && next === "ranking") playRankingSting();
    if (prev !== "finished" && next === "finished") playVictory();
  }, [state.gameStatus]);

  return null;
}

export function GameAudioProvider({ children }: { children: React.ReactNode }) {
  const [musicEnabled, setMusicEnabledState] = useState(
    () => typeof localStorage !== "undefined" && localStorage.getItem(LS_MUSIC) !== "0"
  );
  const [sfxEnabled, setSfxEnabledState] = useState(
    () => typeof localStorage !== "undefined" && localStorage.getItem(LS_SFX) !== "0"
  );

  const musicRef = useRef(musicEnabled);
  musicRef.current = musicEnabled;
  const unlockedRef = useRef(false);

  const setMusicEnabled = useCallback((v: boolean) => {
    setMusicEnabledState(v);
    try {
      localStorage.setItem(LS_MUSIC, v ? "1" : "0");
    } catch {
      /* noop */
    }
  }, []);

  const setSfxEnabled = useCallback((v: boolean) => {
    setSfxEnabledState(v);
    try {
      localStorage.setItem(LS_SFX, v ? "1" : "0");
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    setMusicMuted(!musicEnabled);
    if (musicEnabled && unlockedRef.current && !isAmbientPlaying()) {
      startAmbient();
    }
    if (!musicEnabled) stopAmbient();
  }, [musicEnabled]);

  useEffect(() => {
    setSfxMuted(!sfxEnabled);
  }, [sfxEnabled]);

  useEffect(() => {
    const onFirstPointer = () => {
      void resumeAudio().then(() => {
        unlockedRef.current = true;
        if (musicRef.current && !isAmbientPlaying()) startAmbient();
      });
    };
    window.addEventListener("pointerdown", onFirstPointer, { passive: true });
    return () => window.removeEventListener("pointerdown", onFirstPointer);
  }, []);

  const value: GameAudioContextValue = {
    musicEnabled,
    sfxEnabled,
    setMusicEnabled,
    setSfxEnabled,
  };

  return (
    <GameAudioContext.Provider value={value}>
      {children}
      <GameAudioHud
        musicEnabled={musicEnabled}
        sfxEnabled={sfxEnabled}
        onToggleMusic={() => setMusicEnabled(!musicEnabled)}
        onToggleSfx={() => setSfxEnabled(!sfxEnabled)}
      />
    </GameAudioContext.Provider>
  );
}

const HUD_BG = "rgba(14,15,19,0.85)";
const HUD_BORDER = "rgba(240,239,245,0.12)";
const ACCENT = "#7c6ff7";

function GameAudioHud({
  musicEnabled,
  sfxEnabled,
  onToggleMusic,
  onToggleSfx,
}: {
  musicEnabled: boolean;
  sfxEnabled: boolean;
  onToggleMusic: () => void;
  onToggleSfx: () => void;
}) {
  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex items-center gap-1.5 rounded-2xl px-2 py-2 pointer-events-auto"
      style={{
        background: HUD_BG,
        border: `1px solid ${HUD_BORDER}`,
        backdropFilter: "blur(10px)",
      }}
      role="toolbar"
      aria-label="Som"
    >
      <button
        type="button"
        onClick={onToggleMusic}
        className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-white/5"
        style={{ color: musicEnabled ? ACCENT : "rgba(240,239,245,0.35)" }}
        title={musicEnabled ? "Desligar música de fundo" : "Ligar música de fundo"}
        aria-pressed={musicEnabled}
      >
        <Music className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={onToggleSfx}
        className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-white/5"
        style={{ color: sfxEnabled ? "#34d399" : "rgba(240,239,245,0.35)" }}
        title={sfxEnabled ? "Desligar efeitos sonoros" : "Ligar efeitos sonoros"}
        aria-pressed={sfxEnabled}
      >
        {sfxEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
      </button>
    </div>
  );
}
