import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import gsap from "gsap";
import { Brain, ArrowLeft, Check, X, Zap, Trophy, RotateCcw, Info } from "lucide-react";
import {
  BRAIN_REGIONS,
  IDENTIFY_QUESTIONS,
  type IdentifyQuestion,
} from "../data/mini-games";

// ─── Brain SVG Diagram ────────────────────────────────────────────────────────

function BrainDiagram({ activeId }: { activeId: string | null }) {
  const getRegion = (id: string) =>
    BRAIN_REGIONS.find((r) => r.id === id)!;

  const isActive = (id: string) => activeId === id;

  const regionFill = (id: string, baseAlpha: number, activeAlpha: number) => {
    const r = getRegion(id);
    const hex = r.color;
    const alpha = isActive(id) ? activeAlpha : baseAlpha;
    return hexToRgba(hex, alpha);
  };

  const regionStroke = (id: string) =>
    isActive(id) ? getRegion(id).color : "rgba(255,255,255,0.12)";

  const regionStrokeWidth = (id: string) => (isActive(id) ? 2.5 : 1);

  return (
    <svg
      viewBox="0 0 440 310"
      className="w-full max-w-sm mx-auto"
      style={{ filter: "drop-shadow(0 0 20px rgba(0,0,0,0.5))" }}
    >
      <defs>
        {/* Clip to cortex ellipse */}
        <clipPath id="cortex-clip">
          <ellipse cx="186" cy="115" rx="153" ry="103" />
        </clipPath>

        {/* Glow filters per region */}
        {BRAIN_REGIONS.map((r) => (
          <filter key={r.id} id={`glow-${r.id}`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 2 0"
              result="colored"
            />
            <feMerge>
              <feMergeNode in="colored" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        ))}

        {/* Pulse animation */}
        <style>{`
          @keyframes brain-pulse {
            0%, 100% { opacity: 0.75; }
            50% { opacity: 1; }
          }
          .brain-active { animation: brain-pulse 1.1s ease-in-out infinite; }
        `}</style>
      </defs>

      {/* ── Cortex Background ──────────────────────────────────────────── */}
      <ellipse
        cx="186" cy="115" rx="153" ry="103"
        fill="rgba(15,15,30,0.8)"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="1"
      />

      {/* ── Frontal Lobe (left ~42% of cortex) ────────────────────────── */}
      <g clipPath="url(#cortex-clip)">
        <rect
          x="33" y="12" width="142" height="206"
          fill={regionFill("frontal", 0.18, 0.7)}
          className={isActive("frontal") ? "brain-active" : ""}
          filter={isActive("frontal") ? "url(#glow-frontal)" : undefined}
        />
      </g>

      {/* ── Parietal Lobe (middle ~30%) ────────────────────────────────── */}
      <g clipPath="url(#cortex-clip)">
        <rect
          x="175" y="12" width="94" height="206"
          fill={regionFill("parietal", 0.18, 0.7)}
          className={isActive("parietal") ? "brain-active" : ""}
          filter={isActive("parietal") ? "url(#glow-parietal)" : undefined}
        />
      </g>

      {/* ── Occipital Lobe (back ~28%) ─────────────────────────────────── */}
      <g clipPath="url(#cortex-clip)">
        <rect
          x="269" y="12" width="170" height="206"
          fill={regionFill("occipital", 0.18, 0.7)}
          className={isActive("occipital") ? "brain-active" : ""}
          filter={isActive("occipital") ? "url(#glow-occipital)" : undefined}
        />
      </g>

      {/* ── Cortex outline on top ─────────────────────────────────────── */}
      <ellipse
        cx="186" cy="115" rx="153" ry="103"
        fill="none"
        stroke={
          activeId && ["frontal", "parietal", "occipital"].includes(activeId)
            ? getRegion(activeId).color
            : "rgba(255,255,255,0.14)"
        }
        strokeWidth={
          activeId && ["frontal", "parietal", "occipital"].includes(activeId)
            ? 2
            : 1
        }
      />

      {/* ── Region divider lines ───────────────────────────────────────── */}
      <g clipPath="url(#cortex-clip)">
        <line x1="175" y1="12" x2="175" y2="218" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeDasharray="4 3" />
        <line x1="269" y1="12" x2="269" y2="218" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeDasharray="4 3" />
      </g>

      {/* ── Temporal Lobe ─────────────────────────────────────────────── */}
      <ellipse
        cx="150" cy="228" rx="88" ry="48"
        fill={regionFill("temporal", 0.18, 0.7)}
        stroke={regionStroke("temporal")}
        strokeWidth={regionStrokeWidth("temporal")}
        className={isActive("temporal") ? "brain-active" : ""}
        filter={isActive("temporal") ? "url(#glow-temporal)" : undefined}
      />

      {/* ── Cerebellum ────────────────────────────────────────────────── */}
      <ellipse
        cx="320" cy="252" rx="60" ry="50"
        fill={regionFill("cerebellum", 0.18, 0.7)}
        stroke={regionStroke("cerebellum")}
        strokeWidth={regionStrokeWidth("cerebellum")}
        className={isActive("cerebellum") ? "brain-active" : ""}
        filter={isActive("cerebellum") ? "url(#glow-cerebellum)" : undefined}
      />
      {/* Internal lobule lines for cerebellum */}
      <g opacity="0.25">
        <line x1="270" y1="252" x2="370" y2="252" stroke="white" strokeWidth="0.8" />
        <line x1="275" y1="240" x2="365" y2="240" stroke="white" strokeWidth="0.8" />
        <line x1="275" y1="264" x2="365" y2="264" stroke="white" strokeWidth="0.8" />
      </g>

      {/* ── Brainstem ─────────────────────────────────────────────────── */}
      <rect
        x="180" y="220" width="30" height="86" rx="11"
        fill={regionFill("brainstem", 0.18, 0.7)}
        stroke={regionStroke("brainstem")}
        strokeWidth={regionStrokeWidth("brainstem")}
        className={isActive("brainstem") ? "brain-active" : ""}
        filter={isActive("brainstem") ? "url(#glow-brainstem)" : undefined}
      />

      {/* ── Labels ────────────────────────────────────────────────────── */}
      {[
        { id: "frontal", x: 88, y: 118 },
        { id: "parietal", x: 222, y: 85 },
        { id: "occipital", x: 312, y: 102 },
        { id: "temporal", x: 150, y: 232 },
        { id: "cerebellum", x: 320, y: 256 },
        { id: "brainstem", x: 195, y: 273 },
      ].map(({ id, x, y }) => {
        const r = getRegion(id);
        const active = isActive(id);
        return (
          <text
            key={id}
            x={x} y={y}
            textAnchor="middle"
            fill={active ? r.color : "rgba(255,255,255,0.35)"}
            fontSize={id === "brainstem" ? "8" : "9.5"}
            fontWeight={active ? "700" : "500"}
            fontFamily="system-ui, sans-serif"
          >
            {id === "brainstem" ? "Tronco" : r.namePt.replace("Lobo ", "")}
          </text>
        );
      })}

      {/* ── Active region highlight ring ──────────────────────────────── */}
      {activeId === "frontal" && (
        <g clipPath="url(#cortex-clip)">
          <rect x="33" y="12" width="142" height="206" fill="none"
            stroke={getRegion("frontal").color} strokeWidth="2.5" opacity="0.5" />
        </g>
      )}
    </svg>
  );
}

// ─── Score Bar ────────────────────────────────────────────────────────────────

function TimerBar({ timeLeft, max }: { timeLeft: number; max: number }) {
  const pct = (timeLeft / max) * 100;
  const color = pct > 60 ? "#22d3ee" : pct > 30 ? "#f59e0b" : "#f43f5e";
  return (
    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
      <div
        className="h-full rounded-full transition-all duration-1000 ease-linear"
        style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}` }}
      />
    </div>
  );
}

// ─── Result Screen ────────────────────────────────────────────────────────────

function ResultScreen({
  score,
  results,
  onRestart,
  onBack,
}: {
  score: number;
  results: boolean[];
  onRestart: () => void;
  onBack: () => void;
}) {
  const correct = results.filter(Boolean).length;
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    gsap.from(ref.current, { y: 40, opacity: 0, duration: 0.6, ease: "power3.out" });
  }, []);

  return (
    <div ref={ref} className="flex flex-col items-center text-center gap-6">
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, rgba(34,211,238,0.2), rgba(139,92,246,0.3))",
          border: "1px solid rgba(34,211,238,0.3)",
          boxShadow: "0 0 40px rgba(34,211,238,0.2)",
        }}
      >
        <Trophy className="w-10 h-10 text-cyan-400" />
      </div>
      <div>
        <p className="text-white/50 text-sm uppercase tracking-widest mb-1">Sua Pontuação</p>
        <p
          className="text-6xl font-black text-white"
          style={{ textShadow: "0 0 30px rgba(34,211,238,0.4)" }}
        >
          {score}
        </p>
        <p className="text-white/40 mt-1">
          {correct}/{results.length} acertos
        </p>
      </div>

      {/* Result dots */}
      <div className="flex gap-2">
        {results.map((ok, i) => (
          <div
            key={i}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              background: ok ? "rgba(16,185,129,0.2)" : "rgba(244,63,94,0.2)",
              border: `1px solid ${ok ? "#10b981" : "#f43f5e"}`,
            }}
          >
            {ok ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-rose-400" />}
          </div>
        ))}
      </div>

      <div className="flex gap-3 w-full">
        <button
          onClick={onBack}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white/60 text-sm font-medium transition-all hover:text-white"
          style={{ border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <button
          onClick={onRestart}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white transition-all"
          style={{ background: "linear-gradient(135deg, #22d3ee, #8b5cf6)" }}
        >
          <RotateCcw className="w-4 h-4" /> Tentar Novamente
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TIMER_MAX = 10;
const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function IdentifyStructure() {
  const navigate = useNavigate();
  const [questions] = useState<IdentifyQuestion[]>(
    () => shuffle(IDENTIFY_QUESTIONS)
  );
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIMER_MAX);
  const [selected, setSelected] = useState<number | null>(null);
  const [phase, setPhase] = useState<"playing" | "feedback" | "complete">("playing");
  const [results, setResults] = useState<boolean[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const q = questions[currentQ];

  // Timer countdown
  useEffect(() => {
    if (phase !== "playing") return;
    if (timeLeft <= 0) {
      handleAnswer(-1);
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft, phase]);

  // Entrance animation on question change
  useEffect(() => {
    if (phase === "playing") {
      gsap.from(".q-item", {
        y: 20,
        opacity: 0,
        duration: 0.4,
        stagger: 0.06,
        ease: "power2.out",
        clearProps: "all",
      });
    }
  }, [currentQ, phase]);

  const handleAnswer = useCallback(
    (idx: number) => {
      if (phase !== "playing") return;
      const correct = idx === q.correctIndex;
      const bonus = correct ? Math.round(timeLeft * 6) : 0;
      const pts = correct ? 50 + bonus : 0;
      setSelected(idx);
      setPhase("feedback");
      setScore((s) => s + pts);
      setResults((r) => [...r, correct]);

      setTimeout(() => {
        const nextQ = currentQ + 1;
        if (nextQ >= questions.length) {
          setPhase("complete");
        } else {
          setCurrentQ(nextQ);
          setSelected(null);
          setTimeLeft(TIMER_MAX);
          setPhase("playing");
        }
      }, 2200);
    },
    [phase, q, timeLeft, currentQ, questions.length]
  );

  const restart = () => {
    setCurrentQ(0);
    setScore(0);
    setTimeLeft(TIMER_MAX);
    setSelected(null);
    setPhase("playing");
    setResults([]);
  };

  return (
    <div ref={containerRef} className="min-h-screen flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 q-item">
          <button
            onClick={() => navigate("/mini-games")}
            className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Mini-jogos
          </button>
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-cyan-400" />
            <span className="text-white/60 text-sm font-medium uppercase tracking-widest">
              Identifique
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-white font-bold text-sm">{score}</span>
          </div>
        </div>

        {phase === "complete" ? (
          <ResultScreen
            score={score}
            results={results}
            onRestart={restart}
            onBack={() => navigate("/mini-games")}
          />
        ) : (
          <>
            {/* Progress */}
            <div className="flex gap-1.5 mb-6 q-item">
              {questions.map((_, i) => (
                <div
                  key={i}
                  className="flex-1 h-1 rounded-full transition-all duration-300"
                  style={{
                    background:
                      i < currentQ
                        ? results[i]
                          ? "#10b981"
                          : "#f43f5e"
                        : i === currentQ
                        ? "rgba(34,211,238,0.8)"
                        : "rgba(255,255,255,0.1)",
                  }}
                />
              ))}
            </div>

            {/* Brain Diagram */}
            <div
              className="q-item rounded-2xl p-4 mb-4"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                backdropFilter: "blur(20px)",
              }}
            >
              <BrainDiagram activeId={phase === "playing" ? q.targetId : q.targetId} />
            </div>

            {/* Timer */}
            <div className="flex items-center gap-3 mb-4 q-item">
              <span
                className="text-xl font-black w-8 text-center"
                style={{
                  color:
                    timeLeft > 6
                      ? "#22d3ee"
                      : timeLeft > 3
                      ? "#f59e0b"
                      : "#f43f5e",
                  textShadow: `0 0 12px ${timeLeft > 6 ? "rgba(34,211,238,0.4)" : timeLeft > 3 ? "rgba(245,158,11,0.4)" : "rgba(244,63,94,0.4)"}`,
                }}
              >
                {timeLeft}
              </span>
              <TimerBar timeLeft={timeLeft} max={TIMER_MAX} />
            </div>

            {/* Question */}
            <div className="q-item mb-5">
              <p className="text-white text-base font-medium leading-relaxed">
                {q.question}
              </p>
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {q.options.map((opt, i) => {
                const isSelected = selected === i;
                const isCorrect = i === q.correctIndex;
                let bg = "rgba(255,255,255,0.05)";
                let border = "rgba(255,255,255,0.1)";
                let textColor = "rgba(255,255,255,0.8)";

                if (phase === "feedback") {
                  if (isCorrect) {
                    bg = "rgba(16,185,129,0.15)";
                    border = "#10b981";
                    textColor = "#10b981";
                  } else if (isSelected && !isCorrect) {
                    bg = "rgba(244,63,94,0.15)";
                    border = "#f43f5e";
                    textColor = "#f43f5e";
                  }
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    disabled={phase === "feedback"}
                    className="q-item relative flex items-center gap-2 p-3 rounded-xl text-left text-sm font-medium transition-all duration-200 disabled:cursor-default hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: bg,
                      border: `1px solid ${border}`,
                      color: textColor,
                    }}
                  >
                    {phase === "feedback" && isCorrect && (
                      <Check className="w-4 h-4 flex-shrink-0" />
                    )}
                    {phase === "feedback" && isSelected && !isCorrect && (
                      <X className="w-4 h-4 flex-shrink-0" />
                    )}
                    {!(phase === "feedback") && (
                      <span
                        className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: "rgba(255,255,255,0.08)" }}
                      >
                        {String.fromCharCode(65 + i)}
                      </span>
                    )}
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* Fun fact on feedback */}
            {phase === "feedback" && (
              <div
                className="q-item flex items-start gap-2 p-3 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  animation: "fadeIn 0.3s ease",
                }}
              >
                <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <p className="text-white/60 text-xs leading-relaxed">{q.funFact}</p>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
