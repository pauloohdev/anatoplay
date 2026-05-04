import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Swords, Shield, Sparkles, RotateCcw, Info } from "lucide-react";
import { BATTLE_CARDS, type BattleCard } from "../data/mini-games";
import { playClick, playCorrect, playWrong, playVictory } from "../../lib/gameAudio";

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function botAttackDamage(card: BattleCard): number {
  const variance = Math.floor(Math.random() * 7) - 3;
  return Math.max(6, card.power + variance);
}

export default function CardBattle() {
  const navigate = useNavigate();
  const [playerHp, setPlayerHp] = useState(100);
  const [botHp, setBotHp] = useState(100);
  const [turn, setTurn] = useState<"player" | "bot" | "end">("player");
  const [log, setLog] = useState<string>("Selecione uma carta e clique em Atacar.");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [round, setRound] = useState(1);
  const [history, setHistory] = useState<string[]>([]);

  const hand = useMemo(() => BATTLE_CARDS.slice(0, 4), []);
  const botDeck = useMemo(() => BATTLE_CARDS.slice(2), []);
  const selectedCard = hand.find((c) => c.id === selectedCardId) ?? null;

  const pushHistory = (entry: string) => {
    setHistory((h) => [entry, ...h].slice(0, 5));
  };

  const handlePlayerAttack = () => {
    if (turn !== "player" || !selectedCard) return;
    playClick();
    const variance = Math.floor(Math.random() * 9) - 4;
    const damage = Math.max(7, selectedCard.power + variance);
    const nextBotHp = Math.max(0, botHp - damage);
    setBotHp(nextBotHp);
    const playerMsg = `Round ${round}: você usou ${selectedCard.attack} (${selectedCard.name}) e causou ${damage} de dano.`;
    setLog(playerMsg);
    pushHistory(playerMsg);
    playCorrect();

    if (nextBotHp <= 0) {
      setTurn("end");
      setLog("Vitória! Você venceu a batalha de cartas.");
      playVictory();
      return;
    }

    setTurn("bot");
    window.setTimeout(() => {
      const botCard = pickRandom(botDeck);
      const botDamage = botAttackDamage(botCard);
      setPlayerHp((hp) => {
        const nextPlayerHp = Math.max(0, hp - botDamage);
        const botMsg = `Round ${round}: bot usou ${botCard.attack} (${botCard.name}) e causou ${botDamage} de dano.`;
        setLog(botMsg);
        pushHistory(botMsg);
        if (nextPlayerHp <= 0) {
          setTurn("end");
          setLog("Derrota! O bot ganhou essa rodada.");
          pushHistory("Derrota! O bot zerou seu HP.");
        } else {
          setTurn("player");
          setRound((r) => r + 1);
        }
        return nextPlayerHp;
      });
      playWrong();
    }, 700);
  };

  const restart = () => {
    playClick();
    setPlayerHp(100);
    setBotHp(100);
    setTurn("player");
    setLog("Selecione uma carta e clique em Atacar.");
    setSelectedCardId(null);
    setRound(1);
    setHistory([]);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => {
              playClick();
              navigate("/mini-games");
            }}
            className="flex items-center gap-2 text-white/50 hover:text-white text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Mini-jogos
          </button>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-semibold text-amber-300">
            <Swords className="w-4 h-4" />
            Card Battle
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl p-3" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)" }}>
            <p className="text-xs text-emerald-300/80 uppercase tracking-widest mb-1">Você</p>
            <p className="text-2xl font-black text-emerald-300">{playerHp} HP</p>
          </div>
          <div className="rounded-xl p-3 text-right" style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)" }}>
            <p className="text-xs text-rose-300/80 uppercase tracking-widest mb-1">Bot</p>
            <p className="text-2xl font-black text-rose-300">{botHp} HP</p>
          </div>
        </div>

        <div className="rounded-xl p-3 mb-4 text-sm text-white/80" style={{ background: "rgba(240,239,245,0.04)", border: "1px solid rgba(240,239,245,0.1)" }}>
          {log}
        </div>

        <div
          className="rounded-xl p-3 mb-4 text-xs text-white/65 flex items-start gap-2"
          style={{ background: "rgba(124,111,247,0.08)", border: "1px solid rgba(124,111,247,0.2)" }}
        >
          <Info className="w-4 h-4 mt-0.5 text-violet-300 flex-shrink-0" />
          <p>
            Regras: cada turno você escolhe 1 carta e ataca. O bot responde com uma carta aleatória.
            Vence quem zerar o HP do adversário primeiro.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {hand.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => {
                if (turn !== "player") return;
                playClick();
                setSelectedCardId(card.id);
              }}
              disabled={turn !== "player" || turn === "end"}
              className="rounded-xl p-4 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110"
              style={{
                background: `rgba(${parseInt(card.color.slice(1, 3), 16)},${parseInt(card.color.slice(3, 5), 16)},${parseInt(card.color.slice(5, 7), 16)},0.11)`,
                border: `1px solid ${selectedCardId === card.id ? "#f0eff5" : card.color}`,
                boxShadow: selectedCardId === card.id ? "0 0 0 2px rgba(240,239,245,0.15)" : "none",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="font-bold text-white">{card.name}</p>
                <span className="text-xs font-semibold flex items-center gap-1" style={{ color: card.color }}>
                  <Sparkles className="w-3.5 h-3.5" />
                  {card.power}
                </span>
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: card.color }}>{card.attack}</p>
              <p className="text-xs text-white/60">{card.blurb}</p>
            </button>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={handlePlayerAttack}
            disabled={turn !== "player" || !selectedCard || turn === "end"}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #7c6ff7, #22d3ee)" }}
          >
            {selectedCard ? `Atacar com ${selectedCard.attack}` : "Selecione uma carta"}
          </button>
          <button
            onClick={restart}
            className="py-2.5 px-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
            style={{ background: "rgba(124,111,247,0.15)", border: "1px solid rgba(124,111,247,0.35)", color: "#a89cf7" }}
          >
            <RotateCcw className="w-4 h-4" />
            Reiniciar
          </button>
          <div
            className="px-4 rounded-xl text-xs flex items-center gap-2"
            style={{ border: "1px solid rgba(240,239,245,0.12)", color: "rgba(240,239,245,0.5)" }}
          >
            <Shield className="w-3.5 h-3.5" />
            {turn === "player" ? `Sua vez · Round ${round}` : turn === "bot" ? "Vez do bot" : "Partida encerrada"}
          </div>
        </div>

        {history.length > 0 && (
          <div
            className="mt-3 rounded-xl p-3"
            style={{ background: "rgba(240,239,245,0.03)", border: "1px solid rgba(240,239,245,0.09)" }}
          >
            <p className="text-[11px] uppercase tracking-widest text-white/35 mb-2">Histórico</p>
            <div className="space-y-1.5">
              {history.map((item, i) => (
                <p key={`${item}-${i}`} className="text-xs text-white/65">
                  {item}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
