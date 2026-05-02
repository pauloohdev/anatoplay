import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Copy, Check, Users, Crown, LogOut, Play, Wifi } from "lucide-react";
import { useGame } from "../context/GameContext";

const ACCENT = "#7c6ff7";
const CARD_BG = "rgba(240,239,245,0.04)";
const CARD_BORDER = "rgba(240,239,245,0.09)";
const TEXT_1 = "#f0eff5";
const TEXT_2 = "rgba(240,239,245,0.55)";
const TEXT_3 = "rgba(240,239,245,0.30)";

const AVATAR_COLORS = [
  { bg: "rgba(124,111,247,0.18)", text: "#a89cf7" },
  { bg: "rgba(16,185,129,0.15)",  text: "#34d399" },
  { bg: "rgba(245,158,11,0.15)",  text: "#fbbf24" },
  { bg: "rgba(248,113,113,0.13)", text: "#f87171" },
  { bg: "rgba(56,189,248,0.13)",  text: "#7dd3fc" },
  { bg: "rgba(167,139,250,0.15)", text: "#c4b5fd" },
];

export default function LobbyPage() {
  const { state, startGame, leaveGame } = useGame();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    gsap.from(".lobby-item", {
      y: 24,
      opacity: 0,
      duration: 0.6,
      stagger: 0.09,
      ease: "power3.out",
      clearProps: "all",
    });
  }, []);

  const copyCode = () => {
    navigator.clipboard.writeText(state.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="lobby-item text-center mb-7">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 text-xs font-semibold uppercase tracking-widest"
            style={{ background: "rgba(124,111,247,0.1)", border: `1px solid rgba(124,111,247,0.2)`, color: ACCENT }}
          >
            <Wifi className="w-3 h-3 animate-pulse" />
            Sala Aberta
          </div>
          <h2 className="text-2xl font-bold mb-1" style={{ color: TEXT_1 }}>
            Aguardando jogadores
          </h2>
          <p className="text-sm" style={{ color: TEXT_2 }}>
            {state.isHost
              ? "Compartilhe o código quando todos estiverem prontos"
              : "Aguarde o host iniciar o jogo"}
          </p>
        </div>

        {/* Room code */}
        <div
          className="lobby-item rounded-2xl p-5 mb-3"
          style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: TEXT_3 }}>
            Código da Sala
          </p>
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {state.roomCode.split("").map((char, i) => (
                <div
                  key={i}
                  className="w-10 h-11 rounded-lg flex items-center justify-center font-black text-xl"
                  style={{
                    background: "rgba(124,111,247,0.1)",
                    border: "1px solid rgba(124,111,247,0.2)",
                    color: ACCENT,
                  }}
                >
                  {char}
                </div>
              ))}
            </div>
            <button
              onClick={copyCode}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
              style={{
                background: copied ? "rgba(16,185,129,0.1)" : "rgba(240,239,245,0.06)",
                border: `1px solid ${copied ? "rgba(16,185,129,0.3)" : CARD_BORDER}`,
                color: copied ? "#34d399" : TEXT_2,
              }}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copiado!" : "Copiar"}
            </button>
          </div>
        </div>

        {/* Players */}
        <div
          className="lobby-item rounded-2xl p-5 mb-3"
          style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" style={{ color: TEXT_3 }} />
              <span className="text-sm" style={{ color: TEXT_2 }}>Jogadores na sala</span>
            </div>
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{
                background: "rgba(124,111,247,0.1)",
                border: "1px solid rgba(124,111,247,0.2)",
                color: ACCENT,
              }}
            >
              {state.players.length} online
            </span>
          </div>

          <div className="space-y-2 min-h-[60px]">
            {state.players.length === 0 ? (
              <div className="text-center py-6 text-sm" style={{ color: TEXT_3 }}>
                Nenhum jogador ainda...
              </div>
            ) : (
              state.players.map((player, i) => {
                const av = AVATAR_COLORS[i % AVATAR_COLORS.length];
                const isMe = player.id === state.playerId || player.name === state.playerName;

                return (
                  <div
                    key={player.id || player.name}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{
                      background: isMe ? "rgba(124,111,247,0.06)" : "rgba(240,239,245,0.03)",
                      border: `1px solid ${isMe ? "rgba(124,111,247,0.15)" : "rgba(240,239,245,0.05)"}`,
                      animation: `fadeSlide 0.35s ease ${i * 0.07}s both`,
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                      style={{ background: av.bg, color: av.text }}
                    >
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-sm flex-1" style={{ color: TEXT_1 }}>
                      {player.name}
                    </span>
                    {player.isHost && (
                      <div className="flex items-center gap-1" style={{ color: "#fbbf24" }}>
                        <Crown className="w-3.5 h-3.5" />
                        <span className="text-xs font-semibold">Host</span>
                      </div>
                    )}
                    {!player.isHost && isMe && (
                      <span className="text-xs" style={{ color: TEXT_3 }}>Você</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="lobby-item flex gap-3">
          <button
            onClick={leaveGame}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-[rgba(240,239,245,0.05)]"
            style={{ border: `1px solid ${CARD_BORDER}`, color: TEXT_2 }}
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>

          {state.isHost ? (
            <button
              onClick={startGame}
              disabled={state.players.length < 1}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl font-bold text-white text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
              style={{ background: ACCENT }}
            >
              <Play className="w-4 h-4" />
              Iniciar Partida
            </button>
          ) : (
            <div
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl text-sm"
              style={{ border: `1px solid ${CARD_BORDER}`, color: TEXT_3 }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Aguardando o host...
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
