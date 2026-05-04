import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Lightbulb, Pause, Play, Home, Brain } from "lucide-react";
import { useNavigate } from "react-router";
import { useGame } from "../context/GameContext";
import { questions } from "../data/questions";
import { playCorrect, playWrong } from "../../lib/gameAudio";

const CARD_BG    = "rgba(240,239,245,0.04)";
const CARD_BORDER= "rgba(240,239,245,0.09)";
const TEXT_1     = "#f0eff5";
const TEXT_2     = "rgba(240,239,245,0.55)";
const TEXT_3     = "rgba(240,239,245,0.30)";

export default function AnswerPage() {
  const navigate = useNavigate();
  const { state } = useGame();
  const { currentQuestionIndex, isCorrect } = state;
  const question = questions[currentQuestionIndex];

  const [resultFlash, setResultFlash] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const resultSoundKey = useRef<string | null>(null);

  useEffect(() => {
    if (isCorrect === null) return;
    const key = `${currentQuestionIndex}-${String(isCorrect)}`;
    if (resultSoundKey.current === key) return;
    resultSoundKey.current = key;
    if (isCorrect) playCorrect();
    else playWrong();
    setResultFlash(
      isCorrect ? "rgba(16,185,129,0.22)" : "rgba(248,113,113,0.18)"
    );
    const t = window.setTimeout(() => setResultFlash(null), 480);
    return () => window.clearTimeout(t);
  }, [isCorrect, currentQuestionIndex]);

  useEffect(() => {
    gsap.from(".ans-item", {
      y: 22,
      opacity: 0,
      duration: 0.55,
      stagger: 0.09,
      ease: "power3.out",
      clearProps: "all",
    });
  }, [isCorrect]);

  if (!question) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {resultFlash && (
        <div
          className="pointer-events-none fixed inset-0 z-[5]"
          style={{
            background: `radial-gradient(ellipse 85% 55% at 50% 38%, ${resultFlash}, transparent 72%)`,
            animation: "resultFlashFade 0.55s ease-out forwards",
          }}
          aria-hidden
        />
      )}
      <div className="w-full max-w-xl relative z-10">
        <div className="ans-item flex justify-end mb-4">
          <button
            type="button"
            onClick={() => setIsPaused((v) => !v)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:brightness-110"
            style={{
              background: "rgba(124,111,247,0.12)",
              border: "1px solid rgba(124,111,247,0.3)",
              color: "#a89cf7",
            }}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            {isPaused ? "Retomar" : "Pause"}
          </button>
        </div>

        <div
          className="ans-item rounded-2xl p-5 mb-4"
          style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}
        >
          <p className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: TEXT_3 }}>
            Resposta correta
          </p>
          <p className="text-lg font-bold" style={{ color: "#34d399" }}>
            {question.options[question.correct]}
          </p>
        </div>

        {/* ── Explanation ─────────────────────────────────────────────────── */}
        <div
          className="ans-item rounded-2xl p-5 mb-4"
          style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.15)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: "rgba(16,185,129,0.15)" }}
            >
              <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <span className="text-sm font-semibold text-emerald-400">Explicação</span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: TEXT_2 }}>
            {question.explanation}
          </p>

          <div
            className="flex items-center gap-2 mt-4 pt-3"
            style={{ borderTop: `1px solid rgba(240,239,245,0.06)` }}
          >
            <Brain className="w-3 h-3" style={{ color: TEXT_3 }} />
            <span className="text-xs font-medium" style={{ color: TEXT_3 }}>
              {question.structure} · {question.category}
            </span>
          </div>
        </div>

      </div>

      {isPaused && (
        <div className="fixed inset-0 z-20 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-sm rounded-2xl p-5"
            style={{ background: "rgba(14,15,19,0.9)", border: `1px solid ${CARD_BORDER}` }}
          >
            <h2 className="text-xl font-black mb-2" style={{ color: TEXT_1 }}>
              Jogo em pause
            </h2>
            <p className="text-sm mb-4" style={{ color: TEXT_2 }}>
              Você pode retomar agora ou voltar para o início.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsPaused(false)}
                className="py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "rgba(124,111,247,0.15)", border: "1px solid rgba(124,111,247,0.25)", color: "#a89cf7" }}
              >
                Continuar
              </button>
              <button
                type="button"
                onClick={() => navigate("/")}
                className="py-2.5 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-1.5"
                style={{ background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171" }}
              >
                <Home className="w-4 h-4" />
                Início
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes resultFlashFade {
          0%   { opacity: 0; }
          18%  { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}