import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Trophy, Crown, Medal, ChevronRight, ArrowRight } from "lucide-react";
import { useGame } from "../context/GameContext";
import { questions, TOTAL_QUESTIONS } from "../data/questions";

const ACCENT     = "#7c6ff7";
const CARD_BG    = "rgba(240,239,245,0.04)";
const CARD_BORDER= "rgba(240,239,245,0.09)";
const TEXT_1     = "#f0eff5";
const TEXT_2     = "rgba(240,239,245,0.55)";
const TEXT_3     = "rgba(240,239,245,0.30)";

const RANK_STYLES = [
  { text: "#f59e0b", bg: "rgba(245,158,11,0.09)", border: "rgba(245,158,11,0.22)" },  // Gold
  { text: "#94a3b8", bg: "rgba(148,163,184,0.07)", border: "rgba(148,163,184,0.18)" }, // Silver
  { text: "#b45309", bg: "rgba(180,83,9,0.07)",   border: "rgba(180,83,9,0.18)" },    // Bronze
];

export default function RankingPage() {
  const { state } = useGame();
  const { players, currentQuestionIndex } = state;

  const sorted       = [...players].sort((a, b) => b.score - a.score);
  const isLastQ      = currentQuestionIndex >= TOTAL_QUESTIONS - 1;
  const nextQuestion = questions[currentQuestionIndex + 1];

  useEffect(() => {
    gsap.from(".rank-item", {
      x: -20,
      opacity: 0,
      duration: 0.45,
      stagger: 0.07,
      ease: "power3.out",
      clearProps: "all",
    });
  }, []);

  const getRankIcon = (rank: number) => {
    if (rank === 0) return <Crown className="w-4 h-4"  style={{ color: RANK_STYLES[0].text }} />;
    if (rank === 1) return <Medal className="w-4 h-4"  style={{ color: RANK_STYLES[1].text }} />;
    if (rank === 2) return <Medal className="w-3.5 h-3.5" style={{ color: RANK_STYLES[2].text }} />;
    return <span className="text-xs font-bold w-4 text-center" style={{ color: TEXT_3 }}>{rank + 1}</span>;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="rank-item text-center mb-7">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4"
            style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.22)" }}
          >
            <Trophy className="w-6 h-6 text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold mb-1" style={{ color: TEXT_1 }}>
            Ranking Parcial
          </h2>
          <p className="text-sm" style={{ color: TEXT_2 }}>
            Após questão {currentQuestionIndex + 1} de {TOTAL_QUESTIONS}
          </p>
        </div>

        {/* Players */}
        <div className="space-y-2 mb-5">
          {sorted.map((player, i) => {
            const rs  = RANK_STYLES[i] ?? { text: TEXT_2, bg: CARD_BG, border: CARD_BORDER };
            const isMe = player.id === state.playerId || player.name === state.playerName;

            return (
              <div
                key={player.id || player.name}
                className="rank-item flex items-center gap-3 p-3.5 rounded-2xl"
                style={{
                  background: isMe ? "rgba(124,111,247,0.07)" : rs.bg,
                  border:     `1px solid ${isMe ? "rgba(124,111,247,0.2)" : rs.border}`,
                  transform:  i === 0 ? "scale(1.01)" : "scale(1)",
                }}
              >
                {/* Rank icon */}
                <div className="flex items-center justify-center w-6 flex-shrink-0">
                  {getRankIcon(i)}
                </div>

                {/* Avatar */}
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                  style={{
                    background: i < 3 ? `${rs.text}22` : "rgba(240,239,245,0.06)",
                    color:      i < 3 ? rs.text : TEXT_2,
                  }}
                >
                  {player.name.charAt(0).toUpperCase()}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <span
                    className="font-semibold text-sm truncate"
                    style={{ color: i < 3 ? rs.text : TEXT_1 }}
                  >
                    {player.name}
                  </span>
                  {isMe && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0"
                      style={{
                        background: "rgba(124,111,247,0.12)",
                        border: "1px solid rgba(124,111,247,0.22)",
                        color: ACCENT,
                      }}
                    >
                      Você
                    </span>
                  )}
                </div>

                {/* Score */}
                <div className="text-right flex-shrink-0">
                  <div className="font-black text-lg" style={{ color: i < 3 ? rs.text : TEXT_1 }}>
                    {player.score}
                  </div>
                  <div className="text-xs" style={{ color: TEXT_3 }}>pts</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Next up */}
        <div
          className="rank-item rounded-2xl p-4"
          style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}
        >
          {isLastQ ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(16,185,129,0.12)" }}
                >
                  <Trophy className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: TEXT_1 }}>
                    Última questão!
                  </p>
                  <p className="text-xs" style={{ color: TEXT_3 }}>
                    Calculando resultado final...
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full text-emerald-400"
                    style={{
                      background: "#34d399",
                      animation: `dot 1s ease ${i * 0.15}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(124,111,247,0.1)" }}
                >
                  <ArrowRight className="w-4 h-4" style={{ color: ACCENT }} />
                </div>
                <div>
                  <p className="text-xs mb-0.5" style={{ color: TEXT_3 }}>Próxima questão</p>
                  <p className="text-sm font-semibold" style={{ color: TEXT_1 }}>
                    {nextQuestion?.structure ?? "—"}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 animate-pulse" style={{ color: TEXT_3 }} />
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes dot {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50%       { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
