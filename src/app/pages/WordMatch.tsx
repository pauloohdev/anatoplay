import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import gsap from "gsap";
import {
  ArrowLeft,
  Layers,
  Trophy,
  RotateCcw,
  Check,
  Clock,
  Zap,
} from "lucide-react";
import { MATCH_PAIRS_SET_A, MATCH_PAIRS_SET_B, type MatchPair } from "../data/mini-games";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Card {
  uid: string;
  pairId: string;
  type: "term" | "definition";
  text: string;
  color: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

function buildCards(pairs: MatchPair[]): Card[] {
  const cards: Card[] = [];
  for (const p of pairs) {
    cards.push({ uid: `${p.id}-term`, pairId: p.id, type: "term", text: p.term, color: p.color });
    cards.push({ uid: `${p.id}-def`, pairId: p.id, type: "definition", text: p.definition, color: p.color });
  }
  return shuffle(cards);
}

function useTimer() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const start = () => setRunning(true);
  const stop = () => setRunning(false);
  const reset = () => { setSeconds(0); setRunning(false); };

  const fmt = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  return { seconds, fmt, start, stop, reset };
}

// ─── Flip Card ────────────────────────────────────────────────────────────────

interface CardProps {
  card: Card;
  isFlipped: boolean;
  isMatched: boolean;
  isWrong: boolean;
  onClick: () => void;
}

function FlipCard({ card, isFlipped, isMatched, isWrong, onClick }: CardProps) {
  return (
    <div
      className="cursor-pointer select-none"
      style={{ perspective: "800px", height: "88px" }}
      onClick={onClick}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          transformStyle: "preserve-3d",
          transition: "transform 0.45s cubic-bezier(0.4,0,0.2,1)",
          transform: isFlipped || isMatched ? "rotateY(180deg)" : "rotateY(0deg)",
          position: "relative",
        }}
      >
        {/* ── Front (hidden) ───────────────────────────────────────────── */}
        <div
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            position: "absolute",
            inset: 0,
            borderRadius: "14px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "border-color 0.2s, background 0.2s",
          }}
          className="hover:border-white/20 hover:bg-white/[0.06]"
        >
          {/* Neural dot pattern */}
          <div className="grid grid-cols-4 gap-1.5 opacity-20">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-white" />
            ))}
          </div>
        </div>

        {/* ── Back (content) ───────────────────────────────────────────── */}
        <div
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            position: "absolute",
            inset: 0,
            borderRadius: "14px",
            background: isMatched
              ? "rgba(16,185,129,0.12)"
              : isWrong
              ? "rgba(244,63,94,0.12)"
              : `rgba(${hexToComponents(card.color)},0.08)`,
            border: `1px solid ${
              isMatched
                ? "#10b981"
                : isWrong
                ? "#f43f5e"
                : `rgba(${hexToComponents(card.color)},0.4)`
            }`,
            boxShadow: isMatched
              ? "0 0 16px rgba(16,185,129,0.2)"
              : isWrong
              ? "0 0 12px rgba(244,63,94,0.15)"
              : `0 0 10px rgba(${hexToComponents(card.color)},0.15)`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "8px 10px",
            gap: "4px",
            transition: "all 0.2s",
          }}
        >
          {/* Type badge */}
          <span
            className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full"
            style={{
              background: isMatched ? "rgba(16,185,129,0.2)" : `rgba(${hexToComponents(card.color)},0.15)`,
              color: isMatched ? "#10b981" : card.color,
            }}
          >
            {card.type === "term" ? "Estrutura" : "Função"}
          </span>
          <p
            className="text-center font-semibold leading-tight"
            style={{
              fontSize: card.text.length > 28 ? "10px" : card.text.length > 18 ? "11px" : "12.5px",
              color: isMatched ? "#6ee7b7" : isWrong ? "#fca5a5" : "rgba(255,255,255,0.9)",
            }}
          >
            {card.text}
          </p>
          {isMatched && (
            <Check className="w-3.5 h-3.5 text-emerald-400 absolute top-2 right-2" />
          )}
        </div>
      </div>
    </div>
  );
}

function hexToComponents(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

// ─── Result Screen ────────────────────────────────────────────────────────────

function ResultScreen({
  score,
  attempts,
  timeStr,
  onRestart,
  onBack,
}: {
  score: number;
  attempts: number;
  timeStr: string;
  onRestart: () => void;
  onBack: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    gsap.from(ref.current, { scale: 0.9, opacity: 0, duration: 0.5, ease: "back.out(1.4)" });
  }, []);

  return (
    <div ref={ref} className="flex flex-col items-center text-center gap-5">
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(34,211,238,0.3))",
          border: "1px solid rgba(16,185,129,0.3)",
          boxShadow: "0 0 40px rgba(16,185,129,0.2)",
        }}
      >
        <Trophy className="w-10 h-10 text-emerald-400" />
      </div>
      <div>
        <p className="text-white/50 text-sm uppercase tracking-widest mb-1">Pontuação Final</p>
        <p className="text-6xl font-black text-white" style={{ textShadow: "0 0 30px rgba(16,185,129,0.4)" }}>
          {score}
        </p>
      </div>
      <div className="flex gap-4">
        <div
          className="px-4 py-3 rounded-xl text-center"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="text-white font-bold text-lg">{attempts}</div>
          <div className="text-white/40 text-xs">tentativas</div>
        </div>
        <div
          className="px-4 py-3 rounded-xl text-center"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="text-white font-bold text-lg">{timeStr}</div>
          <div className="text-white/40 text-xs">tempo</div>
        </div>
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
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white"
          style={{ background: "linear-gradient(135deg, #10b981, #22d3ee)" }}
        >
          <RotateCcw className="w-4 h-4" /> Jogar Novamente
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function WordMatch() {
  const navigate = useNavigate();
  const allSets = [MATCH_PAIRS_SET_A, MATCH_PAIRS_SET_B];
  const [setIndex] = useState(() => Math.floor(Math.random() * allSets.length));
  const pairs = allSets[setIndex];

  const [cards, setCards] = useState<Card[]>(() => buildCards(pairs));
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [wrongPair, setWrongPair] = useState<string[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [score, setScore] = useState(600);
  const [phase, setPhase] = useState<"playing" | "complete">("playing");
  const [isChecking, setIsChecking] = useState(false);
  const timer = useTimer();
  const containerRef = useRef<HTMLDivElement>(null);

  // Start timer on first flip
  useEffect(() => {
    if (flipped.length === 1 && attempts === 0) timer.start();
  }, [flipped]);

  // Entry animation
  useEffect(() => {
    gsap.from(".match-card", {
      scale: 0.8,
      opacity: 0,
      duration: 0.4,
      stagger: 0.04,
      ease: "back.out(1.2)",
    });
  }, []);

  const handleCardClick = useCallback(
    (uid: string) => {
      if (isChecking) return;
      if (matched.includes(cards.find((c) => c.uid === uid)!.pairId)) return;
      if (flipped.includes(uid)) return;
      if (flipped.length >= 2) return;

      const newFlipped = [...flipped, uid];
      setFlipped(newFlipped);

      if (newFlipped.length === 2) {
        setIsChecking(true);
        setAttempts((a) => a + 1);
        const [a, b] = newFlipped.map((id) => cards.find((c) => c.uid === id)!);

        if (a.pairId === b.pairId && a.type !== b.type) {
          // Match!
          setMatched((m) => [...m, a.pairId]);
          setFlipped([]);
          setIsChecking(false);

          // Check completion
          if (matched.length + 1 >= pairs.length) {
            timer.stop();
            setTimeout(() => setPhase("complete"), 600);
          }
        } else {
          // Wrong — penalize and flip back
          setScore((s) => Math.max(50, s - 30));
          setWrongPair(newFlipped);
          setTimeout(() => {
            setFlipped([]);
            setWrongPair([]);
            setIsChecking(false);
          }, 900);
        }
      }
    },
    [flipped, matched, isChecking, cards, pairs.length, timer]
  );

  const restart = () => {
    const newCards = buildCards(pairs);
    setCards(newCards);
    setFlipped([]);
    setMatched([]);
    setWrongPair([]);
    setAttempts(0);
    setScore(600);
    setPhase("playing");
    timer.reset();
    setTimeout(() => {
      gsap.from(".match-card", {
        scale: 0.8, opacity: 0, duration: 0.35, stagger: 0.04, ease: "back.out(1.2)",
      });
    }, 50);
  };

  return (
    <div ref={containerRef} className="min-h-screen flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate("/mini-games")}
            className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Mini-jogos
          </button>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-violet-400" />
            <span className="text-white/60 text-sm font-medium uppercase tracking-widest">
              Sinapses
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-white/50 text-xs">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-mono">{timer.fmt}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-white font-bold text-sm">{score}</span>
            </div>
          </div>
        </div>

        {phase === "complete" ? (
          <ResultScreen
            score={score}
            attempts={attempts}
            timeStr={timer.fmt}
            onRestart={restart}
            onBack={() => navigate("/mini-games")}
          />
        ) : (
          <>
            {/* Instructions */}
            <div className="mb-4 text-center">
              <p className="text-white/40 text-sm">
                Encontre os pares: conecte cada{" "}
                <span className="text-violet-300 font-medium">estrutura</span> à sua{" "}
                <span className="text-cyan-300 font-medium">função</span>
              </p>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex gap-1.5 flex-1">
                {pairs.map((p, i) => (
                  <div
                    key={p.id}
                    className="flex-1 h-1 rounded-full transition-all duration-500"
                    style={{
                      background: matched.includes(p.id)
                        ? "#10b981"
                        : "rgba(255,255,255,0.1)",
                    }}
                  />
                ))}
              </div>
              <span className="text-white/40 text-xs whitespace-nowrap">
                {matched.length}/{pairs.length} pares
              </span>
            </div>

            {/* Card Grid */}
            <div className="grid grid-cols-3 gap-3">
              {cards.map((card) => {
                const isFlippedCard = flipped.includes(card.uid);
                const isMatchedCard = matched.includes(card.pairId);
                const isWrongCard = wrongPair.includes(card.uid);
                return (
                  <div key={card.uid} className="match-card">
                    <FlipCard
                      card={card}
                      isFlipped={isFlippedCard}
                      isMatched={isMatchedCard}
                      isWrong={isWrongCard}
                      onClick={() => handleCardClick(card.uid)}
                    />
                  </div>
                );
              })}
            </div>

            {/* Attempt counter */}
            <div className="mt-4 text-center">
              <span className="text-white/25 text-xs">
                {attempts} tentativa{attempts !== 1 ? "s" : ""}
                {attempts > 0 && " · -30pts por erro"}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
