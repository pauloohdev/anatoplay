import { useState, useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import { Users, Clock } from "lucide-react";
import { useGame } from "../context/GameContext";
import { questions, TOTAL_QUESTIONS } from "../data/questions";

const TIMER_DURATION = 20;

const ACCENT     = "#7c6ff7";
const CARD_BG    = "rgba(240,239,245,0.04)";
const CARD_BORDER= "rgba(240,239,245,0.09)";
const TEXT_1     = "#f0eff5";
const TEXT_2     = "rgba(240,239,245,0.55)";
const TEXT_3     = "rgba(240,239,245,0.30)";

// Four distinct option accent colors (muted, no neon)
const OPT_COLORS = [
  { border: "rgba(124,111,247,0.35)", bg: "rgba(124,111,247,0.09)", label: "#a89cf7" },
  { border: "rgba(16,185,129,0.30)",  bg: "rgba(16,185,129,0.08)",  label: "#34d399" },
  { border: "rgba(245,158,11,0.30)",  bg: "rgba(245,158,11,0.08)",  label: "#fbbf24" },
  { border: "rgba(248,113,113,0.28)", bg: "rgba(248,113,113,0.07)", label: "#f87171" },
];
const OPT_LABELS = ["A", "B", "C", "D"];

export default function QuestionPage() {
  const { state, submitAnswer } = useGame();
  const { currentQuestionIndex, questionStartTime, hasAnswered, selectedAnswer, totalQuestions } = state;

  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const question = questions[currentQuestionIndex];

  // Sync timer to broadcast startTime
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    const calc = () => {
      const elapsed = (Date.now() - questionStartTime) / 1000;
      return Math.max(0, TIMER_DURATION - elapsed);
    };

    setTimeLeft(Math.ceil(calc()));
    timerRef.current = setInterval(() => {
      const rem = calc();
      setTimeLeft(Math.ceil(rem));
      if (rem <= 0) clearInterval(timerRef.current!);
    }, 200);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [questionStartTime, currentQuestionIndex]);

  useEffect(() => {
    gsap.from(".q-item", {
      y: 22,
      opacity: 0,
      duration: 0.5,
      stagger: 0.07,
      ease: "power3.out",
      clearProps: "all",
    });
  }, [currentQuestionIndex]);

  const handleAnswer = useCallback((index: number) => {
    if (hasAnswered || timeLeft <= 0) return;
    submitAnswer(index);
  }, [hasAnswered, timeLeft, submitAnswer]);

  const progress = (timeLeft / TIMER_DURATION) * 100;
  const timerColor = timeLeft > 6 ? ACCENT : timeLeft > 3 ? "#f59e0b" : "#ef4444";

  const getOptionStyle = (i: number): React.CSSProperties => {
    const c = OPT_COLORS[i];
    if (hasAnswered) {
      return selectedAnswer === i
        ? { background: c.bg, border: `1px solid ${c.border}` }
        : { background: "rgba(240,239,245,0.02)", border: `1px solid rgba(240,239,245,0.05)`, opacity: 0.4 };
    }
    return { background: c.bg, border: `1px solid ${c.border}` };
  };

  if (!question) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">

        {/* ── Top bar ─────────────────────────────────────────────────────── */}
        <div className="q-item flex items-center justify-between mb-5">
          {/* Progress label */}
          <div
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm"
            style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}
          >
            <span style={{ color: TEXT_3 }}>Q</span>
            <span className="font-bold" style={{ color: TEXT_1 }}>{currentQuestionIndex + 1}</span>
            <span style={{ color: TEXT_3 }}>/ {totalQuestions}</span>
          </div>

          {/* Timer circle */}
          <div className="relative flex items-center justify-center">
            <svg viewBox="0 0 72 72" className="w-14 h-14 -rotate-90">
              <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(240,239,245,0.07)" strokeWidth="5" />
              <circle
                cx="36" cy="36" r="30"
                fill="none"
                stroke={timerColor}
                strokeWidth="5"
                strokeDasharray={`${2 * Math.PI * 30}`}
                strokeDashoffset={`${2 * Math.PI * 30 * (1 - progress / 100)}`}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.2s linear, stroke 0.3s" }}
              />
            </svg>
            <div
              className="absolute font-black text-xl"
              style={{ color: timerColor }}
            >
              {timeLeft}
            </div>
          </div>

          {/* Answered counter */}
          <div
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm"
            style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}
          >
            <Users className="w-3.5 h-3.5" style={{ color: TEXT_3 }} />
            <span className="font-semibold" style={{ color: TEXT_2 }}>{state.answeredCount}</span>
            <span style={{ color: TEXT_3 }}>resp.</span>
          </div>
        </div>

        {/* ── Category tag ─────────────────────────────────────────────────── */}
        <div className="q-item mb-3">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider"
            style={{
              background: "rgba(124,111,247,0.1)",
              border: "1px solid rgba(124,111,247,0.2)",
              color: ACCENT,
            }}
          >
            <Clock className="w-3 h-3" />
            {question.category} · {question.structure}
          </span>
        </div>

        {/* ── Question ────────────────────────────────────────────────────── */}
        <div
          className="q-item rounded-2xl p-6 mb-5"
          style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}
        >
          <p className="text-lg md:text-xl font-semibold leading-relaxed" style={{ color: TEXT_1 }}>
            {question.question}
          </p>
        </div>

        {/* ── Progress bar ────────────────────────────────────────────────── */}
        <div className="q-item h-1 rounded-full overflow-hidden mb-4"
          style={{ background: "rgba(240,239,245,0.06)" }}>
          <div
            className="h-full rounded-full transition-all duration-200"
            style={{
              width: `${progress}%`,
              background: timerColor,
            }}
          />
        </div>

        {/* ── Options ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {question.options.map((opt, i) => (
            <div key={i} className="q-item">
              <button
                onClick={() => handleAnswer(i)}
                disabled={hasAnswered || timeLeft <= 0}
                className="w-full text-left p-4 rounded-xl transition-all duration-200 disabled:cursor-not-allowed hover:brightness-110"
                style={getOptionStyle(i)}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5"
                    style={{
                      background: OPT_COLORS[i].bg,
                      color: OPT_COLORS[i].label,
                      border: `1px solid ${OPT_COLORS[i].border}`,
                    }}
                  >
                    {OPT_LABELS[i]}
                  </span>
                  <span className="font-medium leading-snug text-sm" style={{ color: TEXT_1 }}>
                    {opt}
                  </span>
                </div>
                {hasAnswered && selectedAnswer === i && (
                  <p className="text-xs mt-2 ml-9" style={{ color: OPT_COLORS[i].label }}>
                    Sua resposta
                  </p>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* ── After answer ────────────────────────────────────────────────── */}
        {hasAnswered && (
          <div className="q-item mt-4 text-center">
            <div
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
              style={{
                background: state.isCorrect ? "rgba(16,185,129,0.08)" : "rgba(248,113,113,0.08)",
                border: `1px solid ${state.isCorrect ? "rgba(16,185,129,0.25)" : "rgba(248,113,113,0.2)"}`,
                color: state.isCorrect ? "#34d399" : "#f87171",
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              {state.isCorrect
                ? "Correto! Aguardando resultado..."
                : "Resposta enviada · Aguardando resultado..."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}