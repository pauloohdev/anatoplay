import { useEffect, useRef } from "react";
import gsap from "gsap";
import confetti from "canvas-confetti";
import { Trophy, Crown, Medal, Brain, RotateCcw, Star } from "lucide-react";
import { useGame } from "../context/GameContext";

const ACCENT     = "#7c6ff7";
const CARD_BG    = "rgba(240,239,245,0.04)";
const CARD_BORDER= "rgba(240,239,245,0.09)";
const TEXT_1     = "#f0eff5";
const TEXT_2     = "rgba(240,239,245,0.55)";
const TEXT_3     = "rgba(240,239,245,0.30)";

const RANK_STYLES = [
  { text: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)" },
  { text: "#94a3b8", bg: "rgba(148,163,184,0.07)", border: "rgba(148,163,184,0.2)" },
  { text: "#b45309", bg: "rgba(180,83,9,0.07)",   border: "rgba(180,83,9,0.2)" },
];

export default function FinalResultPage() {
  const { state, leaveGame } = useGame();
  const { players, totalQuestions } = state;
  const confettiFired = useRef(false);

  const sorted  = [...players].sort((a, b) => b.score - a.score);
  const winner  = sorted[0];
  const isWinner = winner && (winner.id === state.playerId || winner.name === state.playerName);
  const maxScore = totalQuestions * 100;

  useEffect(() => {
    if (!confettiFired.current) {
      confettiFired.current = true;
      const colors = ["#7c6ff7", "#a89cf7", "#f59e0b", "#34d399", "#f0eff5"];
      const fire = (r: number, opts: confetti.Options) =>
        confetti({ ...opts, origin: { y: 0.6 }, colors, particleCount: Math.floor(160 * r) });
      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2,  { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1,  { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    }

    gsap.from(".final-item", {
      y: 30,
      opacity: 0,
      duration: 0.6,
      stagger: 0.09,
      ease: "power3.out",
      clearProps: "all",
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-xl">

        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <div className="final-item text-center mb-7">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
            style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)" }}
          >
            <Trophy className="w-8 h-8 text-amber-400" />
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold mb-2" style={{ color: TEXT_1 }}>
            {isWinner ? "Você Venceu!" : "Resultado Final"}
          </h1>

          <p className="text-base" style={{ color: TEXT_2 }}>
            {winner ? (
              <>
                <span style={{ color: "#f59e0b", fontWeight: 700 }}>{winner.name}</span>
                {" "}dominou o quiz com{" "}
                <span style={{ color: "#f59e0b", fontWeight: 700 }}>{winner.score} pontos</span>!
              </>
            ) : (
              "Quiz concluído!"
            )}
          </p>
        </div>

        {/* ── Podium (top 3) ──────────────────────────────────────────────── */}
        {sorted.length >= 2 && (
          <div className="final-item flex items-end justify-center gap-4 mb-6">
            {[1, 0, 2].map((rankIdx) => {
              const player = sorted[rankIdx];
              if (!player) return <div key={rankIdx} className="w-24" />;
              const rs = RANK_STYLES[rankIdx] ?? RANK_STYLES[2];
              const heights = ["h-28", "h-20", "h-14"];
              const isMe = player.id === state.playerId || player.name === state.playerName;

              return (
                <div key={rankIdx} className="flex flex-col items-center gap-2 w-24">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg"
                    style={{
                      background: `${rs.text}22`,
                      border:     `1.5px solid ${rs.border}`,
                      color:      rs.text,
                    }}
                  >
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-center truncate w-full text-center"
                    style={{ color: TEXT_2 }}>
                    {player.name}{isMe && " ✦"}
                  </span>
                  <span className="text-xs font-bold" style={{ color: rs.text }}>
                    {player.score} pts
                  </span>
                  <div
                    className={`w-full ${heights[rankIdx]} rounded-t-xl flex items-center justify-center`}
                    style={{ background: rs.bg, border: `1px solid ${rs.border}`, borderBottom: "none" }}
                  >
                    {rankIdx === 0 && <Crown className="w-5 h-5" style={{ color: rs.text }} />}
                    {rankIdx === 1 && <Medal className="w-4 h-4" style={{ color: rs.text }} />}
                    {rankIdx === 2 && <Star  className="w-4 h-4" style={{ color: rs.text }} />}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Full leaderboard ─────────────────────────────────────────────── */}
        <div
          className="final-item rounded-2xl overflow-hidden mb-5"
          style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}
        >
          {/* Header */}
          <div
            className="px-5 py-3 flex items-center gap-2"
            style={{ borderBottom: `1px solid ${CARD_BORDER}` }}
          >
            <Brain className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: TEXT_3 }}>
              Classificação Final
            </span>
          </div>

          {/* Rows */}
          <div>
            {sorted.map((player, i) => {
              const rs   = RANK_STYLES[i];
              const isMe = player.id === state.playerId || player.name === state.playerName;
              const pct  = maxScore > 0 ? Math.round((player.score / maxScore) * 100) : 0;

              return (
                <div
                  key={player.id || player.name}
                  className="flex items-center gap-4 px-5 py-3"
                  style={{
                    borderBottom: `1px solid ${CARD_BORDER}`,
                    background: isMe ? "rgba(124,111,247,0.05)" : "transparent",
                  }}
                >
                  {/* Rank number */}
                  <span
                    className="w-5 text-center font-black text-sm flex-shrink-0"
                    style={{ color: rs ? rs.text : TEXT_3 }}
                  >
                    {i + 1}
                  </span>

                  {/* Avatar */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{
                      background: rs ? `${rs.text}22` : "rgba(240,239,245,0.06)",
                      color:      rs ? rs.text : TEXT_2,
                    }}
                  >
                    {player.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Name + bar */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-sm font-medium truncate" style={{ color: TEXT_1 }}>
                        {player.name}
                      </span>
                      {isMe && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0"
                          style={{
                            background: "rgba(124,111,247,0.1)",
                            border: "1px solid rgba(124,111,247,0.2)",
                            color: ACCENT,
                          }}
                        >
                          Você
                        </span>
                      )}
                    </div>
                    <div className="h-1 rounded-full overflow-hidden"
                      style={{ background: "rgba(240,239,245,0.06)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: rs ? rs.text : TEXT_3,
                        }}
                      />
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right flex-shrink-0">
                    <div className="font-black text-base" style={{ color: rs ? rs.text : TEXT_1 }}>
                      {player.score}
                    </div>
                    <div className="text-xs" style={{ color: TEXT_3 }}>{pct}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Actions ─────────────────────────────────────────────────────── */}
        <div className="final-item flex justify-center">
          <button
            onClick={leaveGame}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
            style={{ background: ACCENT, color: "white" }}
          >
            <RotateCcw className="w-4 h-4" />
            Jogar Novamente
          </button>
        </div>

      </div>
    </div>
  );
}