import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Swords, Shield, Sparkles, RotateCcw, Info, Pill } from "lucide-react";
import { BATTLE_CARDS, type BattleCard } from "../data/mini-games";
import { playClick, playCorrect, playWrong, playVictory } from "../../lib/gameAudio";

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

type DebuffKey = "aphasia" | "ataxia" | "neglect" | "brainFog";
type Debuff = { key: DebuffKey; label: string; turns: number; };
type ItemCard = { id: string; name: string; blurb: string; heal?: number; shield?: number; cleanse?: boolean; };

const ITEM_CARDS: ItemCard[] = [
  { id: "item-thiamine", name: "Tiamina Turbo", blurb: "Limpa debuffs e melhora o foco.", cleanse: true },
  { id: "item-cafe", name: "Café do Plantão", blurb: "Recupera 8 HP.", heal: 8 },
  { id: "item-helmet", name: "Capacete de Sinapse", blurb: "Gera 10 de escudo.", shield: 10 },
];

const LESION_BY_CARD: Record<string, Debuff> = {
  "bc-frontal": { key: "brainFog", label: "Síndrome Disexecutiva", turns: 2 },
  "bc-temporal": { key: "aphasia", label: "Afasia Satírica", turns: 2 },
  "bc-cerebelo": { key: "ataxia", label: "Ataxia", turns: 2 },
  "bc-brainstem": { key: "brainFog", label: "Pane de Tronco", turns: 1 },
  "bc-parietal": { key: "neglect", label: "Negligência Hemiespacial", turns: 2 },
  "bc-occipital": { key: "neglect", label: "Escotoma Dramático", turns: 2 },
};

function tickDebuffs(debuffs: Debuff[]) {
  return debuffs.map((d) => ({ ...d, turns: d.turns - 1 })).filter((d) => d.turns > 0);
}

function computeDamage(card: BattleCard, debuffs: Debuff[]): number {
  let damage = card.power + (Math.floor(Math.random() * 9) - 4);
  let failChance = 0;
  for (const d of debuffs) {
    if (d.key === "brainFog") damage -= 4;
    if (d.key === "ataxia") damage += Math.floor(Math.random() * 7) - 3;
    if (d.key === "aphasia") failChance += 0.2;
    if (d.key === "neglect") failChance += 0.15;
  }
  if (Math.random() < failChance) return 0;
  return Math.max(4, damage);
}

export default function CardBattle() {
  const navigate = useNavigate();
  const [playerHp, setPlayerHp] = useState(100);
  const [botHp, setBotHp] = useState(100);
  const [turn, setTurn] = useState<"player" | "bot" | "end">("player");
  const [log, setLog] = useState<string>("Escolha uma carta e veja o efeito neurofuncional antes de atacar.");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [round, setRound] = useState(1);
  const [history, setHistory] = useState<string[]>([]);
  const [playerDebuffs, setPlayerDebuffs] = useState<Debuff[]>([]);
  const [botDebuffs, setBotDebuffs] = useState<Debuff[]>([]);
  const [playerShield, setPlayerShield] = useState(0);
  const [botShield, setBotShield] = useState(0);

  const hand = useMemo(() => BATTLE_CARDS.slice(0, 4), []);
  const botDeck = useMemo(() => BATTLE_CARDS.slice(2), []);
  const selectedCard = hand.find((c) => c.id === selectedCardId) ?? null;

  const pushHistory = (entry: string) => {
    setHistory((h) => [entry, ...h].slice(0, 7));
  };

  const handlePlayerAttack = () => {
    if (turn !== "player" || !selectedCard) return;
    playClick();
    const damageRaw = computeDamage(selectedCard, playerDebuffs);
    const blocked = Math.min(botShield, damageRaw);
    const damage = Math.max(0, damageRaw - blocked);
    const nextBotHp = Math.max(0, botHp - damage);
    const lesion = LESION_BY_CARD[selectedCard.id];
    setBotShield((v) => Math.max(0, v - blocked));
    setBotHp(nextBotHp);
    setPlayerDebuffs((d) => tickDebuffs(d));
    setBotDebuffs((d) => [...tickDebuffs(d), lesion]);
    const playerMsg = `Round ${round}: ${selectedCard.attack} (${selectedCard.name}) causou ${damage}${blocked ? ` (${blocked} bloqueado)` : ""} e aplicou ${lesion.label}.`;
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
      const useItem = Math.random() < 0.3;
      if (useItem) {
        const item = pickRandom(ITEM_CARDS);
        if (item.heal) setBotHp((hp) => Math.min(100, hp + item.heal));
        if (item.shield) setBotShield((s) => s + item.shield);
        if (item.cleanse) setBotDebuffs([]);
        const itemMsg = `Round ${round}: bot usou item ${item.name} (${item.blurb}).`;
        setLog(itemMsg);
        pushHistory(itemMsg);
        setTurn("player");
        setRound((r) => r + 1);
        playWrong();
        return;
      }
      const botCard = pickRandom(botDeck);
      const rawBotDamage = computeDamage(botCard, botDebuffs);
      const blocked = Math.min(playerShield, rawBotDamage);
      const botDamage = Math.max(0, rawBotDamage - blocked);
      const lesion = LESION_BY_CARD[botCard.id];
      setPlayerShield((v) => Math.max(0, v - blocked));
      setBotDebuffs((d) => tickDebuffs(d));
      setPlayerDebuffs((d) => [...tickDebuffs(d), lesion]);
      setPlayerHp((hp) => {
        const nextPlayerHp = Math.max(0, hp - botDamage);
        const botMsg = `Round ${round}: bot usou ${botCard.attack} (${botCard.name}) e causou ${botDamage}${blocked ? ` (${blocked} bloqueado)` : ""}. Debuff: ${lesion.label}.`;
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

  const handleUseItem = () => {
    if (turn !== "player" || turn === "end") return;
    playClick();
    const item = pickRandom(ITEM_CARDS);
    if (item.heal) setPlayerHp((hp) => Math.min(100, hp + item.heal));
    if (item.shield) setPlayerShield((s) => s + item.shield);
    if (item.cleanse) setPlayerDebuffs([]);
    setPlayerDebuffs((d) => tickDebuffs(d));
    const msg = `Round ${round}: você usou item ${item.name} (${item.blurb}).`;
    setLog(msg);
    pushHistory(msg);
    setTurn("bot");
  };

  const restart = () => {
    playClick();
    setPlayerHp(100);
    setBotHp(100);
    setTurn("player");
    setLog("Escolha uma carta e veja o efeito neurofuncional antes de atacar.");
    setSelectedCardId(null);
    setRound(1);
    setHistory([]);
    setPlayerDebuffs([]);
    setBotDebuffs([]);
    setPlayerShield(0);
    setBotShield(0);
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
          className="rounded-xl p-3 mb-4 text-xs text-white/75 flex items-start gap-2"
          style={{ background: "rgba(124,111,247,0.08)", border: "1px solid rgba(124,111,247,0.2)" }}
        >
          <Info className="w-4 h-4 mt-0.5 text-violet-300 flex-shrink-0" />
          <p>
            Regras: cada turno você escolhe 1 carta e ataca. O bot responde com uma carta aleatória.
            Agora lesões geram debuffs temáticos (afasia, ataxia, negligência) e itens clínicos podem curar ou proteger.
          </p>
        </div>
        <div className="rounded-xl p-3 mb-4 text-xs" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}>
          <p className="text-emerald-300 font-semibold mb-2">Guia rápido de debuffs</p>
          <ul className="space-y-1 text-white/75">
            <li><b>Afasia Satírica:</b> 20% de chance do ataque falhar.</li>
            <li><b>Ataxia:</b> dano fica instável (variação extra).</li>
            <li><b>Negligência/Escotoma:</b> 15% de chance de errar o alvo.</li>
            <li><b>Síndrome Disexecutiva:</b> -4 de dano por turno.</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
              className="rounded-xl p-3 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110"
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
              <p className="text-xs text-white/70">{ATTACK_FLAVOR[card.id] ?? card.blurb}</p>
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
            onClick={handleUseItem}
            disabled={turn !== "player" || turn === "end"}
            className="py-2.5 px-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "rgba(34,211,238,0.15)", border: "1px solid rgba(34,211,238,0.35)", color: "#67e8f9" }}
          >
            <Pill className="w-4 h-4" />
            Usar item
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
            {turn === "player" ? `Sua vez · Round ${round}` : turn === "bot" ? "Vez do bot" : "Partida encerrada"} · Escudo {playerShield}/{botShield}
          </div>
        </div>
        <div className="mt-3 text-xs text-white/60">
          Seus debuffs: {playerDebuffs.length ? playerDebuffs.map((d) => `${d.label}(${d.turns})`).join(", ") : "nenhum"}.
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
