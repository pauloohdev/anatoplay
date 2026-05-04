import { useEffect, useRef } from "react";
import gsap from "gsap";
import { CheckCircle2, XCircle, Lightbulb, Brain } from "lucide-react";
import { useGame } from "../context/GameContext";
import { questions } from "../data/questions";

const CARD_BG    = "rgba(240,239,245,0.04)";
const CARD_BORDER= "rgba(240,239,245,0.09)";
const TEXT_1     = "#f0eff5";
const TEXT_2     = "rgba(240,239,245,0.55)";
const TEXT_3     = "rgba(240,239,245,0.30)";

const OPT_LABELS = ["A", "B", "C", "D"];

export default function AnswerPage() {
  const { state } = useGame();
  const { currentQuestionIndex, selectedAnswer, isCorrect, pointsEarned } = state;
  const question = questions[currentQuestionIndex];

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

  const getOptionStyle = (i: number): React.CSSProperties => {
    const isCorrectOpt = i === question.correct;
    const isSelected   = i === selectedAnswer;

    if (isCorrectOpt) {
      return {
        background: "rgba(16,185,129,0.1)",
        border: "1px solid rgba(16,185,129,0.35)",
      };
    }
    if (isSelected && !isCorrectOpt) {
      return {
        background: "rgba(248,113,113,0.07)",
        border: "1px solid rgba(248,113,113,0.25)",
      };
    }
    return {
      background: "rgba(240,239,245,0.02)",
      border: "1px solid rgba(240,239,245,0.05)",
      opacity: 0.45,
    };
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-xl">

        {/* ── Result badge ────────────────────────────────────────────────── */}
        <div className="ans-item text-center mb-5">
          <div
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-4"
            style={{
              background: isCorrect ? "rgba(16,185,129,0.08)" : "rgba(248,113,113,0.08)",
              border: `1px solid ${isCorrect ? "rgba(16,185,129,0.3)" : "rgba(248,113,113,0.25)"}`,
            }}
          >
            {isCorrect
              ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              : <XCircle    className="w-5 h-5 text-red-400" />}
            <span
              className="font-bold text-base"
              style={{ color: isCorrect ? "#34d399" : "#f87171" }}
            >
              {isCorrect
                ? "Correto!"
                : selectedAnswer === null
                  ? "Tempo esgotado!"
                  : "Incorreto!"}
            </span>
          </div>

          {/* Points */}
          {pointsEarned > 0 && (
            <div
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl"
              style={{
                background: "rgba(124,111,247,0.1)",
                border: "1px solid rgba(124,111,247,0.25)",
              }}
            >
              <span className="text-white font-black text-2xl">+{pointsEarned}</span>
              <span className="text-sm" style={{ color: "rgba(240,239,245,0.5)" }}>pontos</span>
            </div>
          )}
        </div>

        {/* ── Question recap ──────────────────────────────────────────────── */}
        <div
          className="ans-item rounded-2xl p-5 mb-3"
          style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}
        >
          <span
            className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full inline-block mb-3"
            style={{ background: "rgba(124,111,247,0.1)", color: "#a89cf7", border: "1px solid rgba(124,111,247,0.2)" }}
          >
          </span>
          <p className="text-sm leading-relaxed" style={{ color: TEXT_2 }}>
            {question.question}
          </p>
        </div>

        {/* ── Options ─────────────────────────────────────────────────────── */}
        <div className="ans-item space-y-2 mb-4">
          {question.options.map((opt, i) => {
            const isCorrectOpt = i === question.correct;
            const isSelected   = i === selectedAnswer;

            return (
              <div
                key={i}
                className="flex items-center gap-3 p-3.5 rounded-xl"
                style={getOptionStyle(i)}
              >
                <span
                  className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-black flex-shrink-0"
                  style={{
                    background: isCorrectOpt ? "rgba(16,185,129,0.2)" : isSelected ? "rgba(248,113,113,0.15)" : "rgba(240,239,245,0.06)",
                    color: isCorrectOpt ? "#34d399" : isSelected ? "#f87171" : TEXT_3,
                  }}
                >
                  {OPT_LABELS[i]}
                </span>
                <span
                  className="flex-1 text-sm font-medium"
                  style={{ color: isCorrectOpt ? "#34d399" : isSelected ? "#f87171" : TEXT_3 }}
                >
                  {opt}
                </span>
                {isCorrectOpt && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                {isSelected && !isCorrectOpt && <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
              </div>
            );
          })}
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

        {/* ── Waiting ─────────────────────────────────────────────────────── */}
        <div className="ans-item text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs"
            style={{ border: `1px solid ${CARD_BORDER}`, color: TEXT_3 }}
          >
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: TEXT_3, animation: `dotBounce 1s ease ${i * 0.2}s infinite` }}
                />
              ))}
            </div>
            Carregando ranking...
          </div>
        </div>
      </div>

      <style>{`
        @keyframes dotBounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50%       { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}