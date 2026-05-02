import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import gsap from "gsap";
import { Brain, Users, ArrowRight, Hash, Layers, ChevronRight, BookOpen } from "lucide-react";
import { useGame } from "../context/GameContext";
import { TOTAL_QUESTIONS } from "../data/questions";

// ─── Design tokens ────────────────────────────────────────────────────────────
const ACCENT = "#7c6ff7";
const CARD_BG = "rgba(240,239,245,0.04)";
const CARD_BORDER = "rgba(240,239,245,0.09)";
const TEXT_1 = "#f0eff5";
const TEXT_2 = "rgba(240,239,245,0.55)";
const TEXT_3 = "rgba(240,239,245,0.30)";

export default function LoginPage() {
  const { createRoom, joinRoom, state } = useGame();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [mode, setMode] = useState<"host" | "join" | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.from(".reveal-item", {
      y: 28,
      opacity: 0,
      duration: 0.65,
      stagger: 0.09,
      ease: "power3.out",
      clearProps: "all",
    });
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    try { await createRoom(name.trim()); } catch { /* handled in context */ }
  };

  const handleJoin = async () => {
    if (!name.trim() || !joinCode.trim()) return;
    try { await joinRoom(name.trim(), joinCode.trim().toUpperCase()); } catch { /* handled */ }
  };

  return (
    <div ref={containerRef} className="min-h-screen flex items-center justify-center p-5">
      <div className="w-full max-w-4xl">

        {/* ── Brand header ───────────────────────────────────────────────── */}
        <div className="reveal-item text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-5">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: ACCENT }}
            >
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span
              className="text-3xl font-bold tracking-tight"
              style={{ color: TEXT_1 }}
            >
              Anato<span style={{ color: ACCENT }}>Play</span>
            </span>
          </div>

          <p className="text-sm font-medium tracking-widest uppercase"
            style={{ color: TEXT_3, letterSpacing: "0.18em" }}>
            Quiz de Tronco Encefálico · Multiplayer em Tempo Real
          </p>
        </div>

        {/* ── Bento grid ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

          {/* Name + stats */}
          <div
            className="reveal-item md:row-span-2 rounded-2xl p-6 flex flex-col"
            style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}
          >
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1.5 h-5 rounded-full" style={{ background: ACCENT }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: TEXT_3 }}>
                Identificação
              </span>
            </div>

            <p className="text-xs mb-1.5" style={{ color: TEXT_3 }}>Seu nome no jogo</p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && mode === "host") handleCreate();
                if (e.key === "Enter" && mode === "join") handleJoin();
              }}
              placeholder="Digite seu nome..."
              maxLength={24}
              className="w-full bg-transparent border-0 border-b pb-3 mb-1 outline-none text-xl font-semibold placeholder-[rgba(240,239,245,0.2)] transition-colors"
              style={{
                color: TEXT_1,
                borderColor: name ? ACCENT : CARD_BORDER,
                caretColor: ACCENT,
              }}
            />

            <div className="flex-1" />

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mt-6">
              {[
                { label: "Questões", value: String(TOTAL_QUESTIONS) },
                { label: "Timer", value: "10s" },
                { label: "Máx pts", value: "100" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="text-center p-3 rounded-xl"
                  style={{ background: "rgba(124,111,247,0.08)", border: "1px solid rgba(124,111,247,0.15)" }}
                >
                  <div className="font-extrabold text-lg" style={{ color: ACCENT }}>{s.value}</div>
                  <div className="text-xs mt-0.5" style={{ color: TEXT_3 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Create room */}
          <div
            className="reveal-item rounded-2xl p-6 transition-colors duration-300"
            style={{
              background: mode === "host" ? "rgba(124,111,247,0.07)" : CARD_BG,
              border: `1px solid ${mode === "host" ? "rgba(124,111,247,0.3)" : CARD_BORDER}`,
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(124,111,247,0.15)" }}
              >
                <Users className="w-3.5 h-3.5" style={{ color: ACCENT }} />
              </div>
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: TEXT_3 }}>
                Host
              </span>
            </div>

            <p className="font-bold text-lg mb-1" style={{ color: TEXT_1 }}>Criar Sala</p>
            <p className="text-sm mb-5" style={{ color: TEXT_2 }}>
              Gere um código e convide seus colegas
            </p>

            {state.error && (
              <div className="mb-4 p-3 rounded-xl text-sm"
                style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171" }}>
                {state.error}
              </div>
            )}

            <button
              onClick={() => { setMode("host"); handleCreate(); }}
              disabled={!name.trim() || state.isLoading}
              className="w-full py-3 px-5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
              style={{ background: ACCENT, color: "white" }}
            >
              {state.isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Criando...
                </>
              ) : (
                <>Criar Sala <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>

          {/* Join room */}
          <div
            className="reveal-item rounded-2xl p-6 transition-colors duration-300"
            style={{
              background: mode === "join" ? "rgba(16,185,129,0.06)" : CARD_BG,
              border: `1px solid ${mode === "join" ? "rgba(16,185,129,0.25)" : CARD_BORDER}`,
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(16,185,129,0.12)" }}
              >
                <Hash className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: TEXT_3 }}>
                Player
              </span>
            </div>

            <p className="font-bold text-lg mb-1" style={{ color: TEXT_1 }}>Entrar na Sala</p>
            <p className="text-sm mb-4" style={{ color: TEXT_2 }}>
              Digite o código fornecido pelo host
            </p>

            <input
              type="text"
              value={joinCode}
              onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setMode("join"); }}
              onFocus={() => setMode("join")}
              onKeyDown={(e) => { if (e.key === "Enter") handleJoin(); }}
              placeholder="EX: ABC123"
              maxLength={6}
              className="w-full bg-transparent border-0 border-b pb-3 mb-4 outline-none text-xl font-bold font-mono tracking-[0.3em] placeholder-[rgba(240,239,245,0.18)] transition-colors"
              style={{
                color: TEXT_1,
                borderColor: joinCode ? "#10b981" : CARD_BORDER,
                caretColor: "#10b981",
              }}
            />

            <button
              onClick={handleJoin}
              disabled={!name.trim() || !joinCode.trim() || state.isLoading}
              className="w-full py-3 px-5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
              style={{ background: "#10b981", color: "white" }}
            >
              {state.isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Entrando...
                </>
              ) : (
                <>Entrar <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>

        {/* ── Divider ─────────────────────────────────────────────────────── */}
        <div className="reveal-item flex items-center gap-3 mt-7 mb-4">
          <div className="flex-1 h-px" style={{ background: CARD_BORDER }} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: TEXT_3 }}>
            Treino Solo
          </span>
          <div className="flex-1 h-px" style={{ background: CARD_BORDER }} />
        </div>

        {/* ── Mini-games ──────────────────────────────────────────────────── */}
        <div className="reveal-item grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate("/mini-games/identify")}
            className="group flex items-center gap-3 p-4 rounded-xl text-left transition-all duration-200 hover:scale-[1.01]"
            style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(124,111,247,0.12)", border: "1px solid rgba(124,111,247,0.18)" }}
            >
              <Brain className="w-4 h-4" style={{ color: ACCENT }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: TEXT_1 }}>Identificar Estrutura</p>
              <p className="text-xs mt-0.5" style={{ color: TEXT_3 }}>6 rodadas · 10s timer</p>
            </div>
            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 transition-transform group-hover:translate-x-0.5"
              style={{ color: TEXT_3 }} />
          </button>

          <button
            onClick={() => navigate("/mini-games/match")}
            className="group flex items-center gap-3 p-4 rounded-xl text-left transition-all duration-200 hover:scale-[1.01]"
            style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.15)" }}
            >
              <Layers className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: TEXT_1 }}>Sinapses</p>
              <p className="text-xs mt-0.5" style={{ color: TEXT_3 }}>6 pares · flip cards</p>
            </div>
            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 transition-transform group-hover:translate-x-0.5"
              style={{ color: TEXT_3 }} />
          </button>
        </div>

        <p className="reveal-item text-center text-xs mt-7 tracking-widest uppercase"
          style={{ color: "rgba(240,239,245,0.18)" }}>
          AnatoPlay · Anatomia do Sistema Nervoso Central
        </p>
      </div>
    </div>
  );
}
