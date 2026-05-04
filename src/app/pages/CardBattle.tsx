import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Swords, Shield, Sparkles, RotateCcw, Pill } from "lucide-react";
import { BATTLE_CARDS, type BattleCard } from "../data/mini-games";
import { playClick, playCorrect, playWrong, playVictory } from "../../lib/gameAudio";

type DebuffKey = "aphasia" | "ataxia" | "neglect" | "brainFog";
type Debuff = { key: DebuffKey; label: string; turns: number };
type ItemCard = { id: string; name: string; blurb: string; heal?: number; shield?: number; cleanse?: boolean };

const ITEM_POOL: ItemCard[] = [
  { id: "item-thiamine", name: "Tiamina Turbo", blurb: "Limpa debuffs.", cleanse: true },
  { id: "item-cafe", name: "Café do Plantão", blurb: "Recupera 8 HP e +1 energia.", heal: 8, energy: 1 },
  { id: "item-helmet", name: "Capacete de Sinapse", blurb: "Gera 10 de escudo.", shield: 10 },
  { id: "item-adrenal", name: "Adrenalina", blurb: "Próximo ataque ganha +5 dano.", dmgBoost: 5 },
];

const ATTACK_FLAVOR: Record<string, string> = {
  "bc-frontal": "Controle executivo: dano estável e pressão tática.",
  "bc-temporal": "Explosão verbal: alto impacto, mas pode falhar sob afasia.",
  "bc-cerebelo": "Golpe coordenado com variação de precisão.",
  "bc-brainstem": "Ataque reflexo: rápido e difícil de prever.",
  "bc-parietal": "Desorienta o alvo e abre janela para combo.",
  "bc-occipital": "Impacto visual: chance de confundir a mira inimiga.",
};

const LESION_BY_CARD: Record<string, Debuff> = {
  "bc-frontal": { key: "brainFog", label: "Síndrome Disexecutiva", turns: 2 },
  "bc-temporal": { key: "aphasia", label: "Afasia Satírica", turns: 2 },
  "bc-cerebelo": { key: "ataxia", label: "Ataxia", turns: 2 },
  "bc-brainstem": { key: "brainFog", label: "Pane de Tronco", turns: 1 },
  "bc-parietal": { key: "neglect", label: "Negligência Hemiespacial", turns: 2 },
  "bc-occipital": { key: "neglect", label: "Escotoma Dramático", turns: 2 },
};

const CARD_COST: Record<string, number> = { "bc-frontal": 1, "bc-temporal": 3, "bc-cerebelo": 2, "bc-brainstem": 2, "bc-parietal": 1, "bc-occipital": 2 };

function pickRandom<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function tickDebuffs(debuffs: Debuff[]) { return debuffs.map((d) => ({ ...d, turns: d.turns - 1 })).filter((d) => d.turns > 0); }
function clamp(n: number, min: number, max: number) { return Math.min(max, Math.max(min, n)); }

function computeDamage(card: BattleCard, debuffs: Debuff[], combo: number, bonus = 0): number {
  let damage = card.power + (Math.floor(Math.random() * 7) - 3) + Math.min(6, combo * 2) + bonus;
  let failChance = 0;
  for (const d of debuffs) {
    if (d.key === "brainFog") damage -= 4;
    if (d.key === "ataxia") damage += Math.floor(Math.random() * 7) - 3;
    if (d.key === "aphasia") failChance += 0.2;
    if (d.key === "neglect") failChance += 0.15;
  }
  if (Math.random() < failChance) return 0;
  return Math.max(3, damage);
}

export default function CardBattle() {
  const navigate = useNavigate();
  const [playerHp, setPlayerHp] = useState(100);
  const [botHp, setBotHp] = useState(100);
  const [turn, setTurn] = useState<"player" | "bot" | "end">("player");
  const [log, setLog] = useState<string>("Escolha uma carta para iniciar o duelo neurofuncional.");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [round, setRound] = useState(1);
  const [history, setHistory] = useState<string[]>([]);
  const [playerDebuffs, setPlayerDebuffs] = useState<Debuff[]>([]);
  const [botDebuffs, setBotDebuffs] = useState<Debuff[]>([]);
  const [playerShield, setPlayerShield] = useState(0);
  const [botShield, setBotShield] = useState(0);

  const hand = useMemo(() => BATTLE_CARDS.slice(0, 4), []);
  const botDeck = useMemo(() => BATTLE_CARDS.slice(2), []);

  const pushHistory = (entry: string) => setHistory((h) => [entry, ...h].slice(0, 6));

  useEffect(() => {
    if (turn !== "bot") return;
    const timer = window.setTimeout(() => {
      const useItem = Math.random() < 0.35;
      if (useItem) {
        const item = pickRandom(ITEM_CARDS);
        if (item.heal) setBotHp((hp) => Math.min(100, hp + item.heal));
        if (item.shield) setBotShield((s) => s + item.shield);
        if (item.cleanse) setBotDebuffs([]);
        const itemMsg = `Round ${round}: bot usou item ${item.name}.`;
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
        const botMsg = `Round ${round}: bot usou ${botCard.attack} e causou ${botDamage}.`;
        setLog(botMsg);
        pushHistory(`${botMsg} Debuff: ${lesion.label}.`);
        if (nextPlayerHp <= 0) {
          setTurn("end");
          setLog("Derrota! O bot ganhou essa rodada.");
        } else {
          setTurn("player");
          setRound((r) => r + 1);
        }
        return nextPlayerHp;
      });
      playWrong();
    }, 750);

    return () => window.clearTimeout(timer);
  }, [botDeck, botDebuffs, playerShield, round, turn]);

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
    const playerMsg = `Round ${round}: ${selectedCard.attack} causou ${damage}. Debuff aplicado: ${lesion.label}.`;
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
  };

  const handleUseItem = () => {
    if (turn !== "player") return;
    playClick();
    const item = pickRandom(ITEM_CARDS);
    if (item.heal) setPlayerHp((hp) => Math.min(100, hp + item.heal));
    if (item.shield) setPlayerShield((s) => s + item.shield);
    if (item.cleanse) setPlayerDebuffs([]);
    setPlayerDebuffs((d) => tickDebuffs(d));
    const msg = `Round ${round}: você usou item ${item.name}.`;
    setLog(msg);
    pushHistory(`${msg} ${item.blurb}`);
    setTurn("bot");
  };

  const restart = () => {
    playClick();
    setPlayerHp(100);
    setBotHp(100);
    setTurn("player");
    setLog("Escolha uma carta para iniciar o duelo neurofuncional.");
    setSelectedCardId(null);
    setRound(1);
    setHistory([]);
    setPlayerDebuffs([]);
    setBotDebuffs([]);
    setPlayerShield(0);
    setBotShield(0);
  };

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="mx-auto w-full max-w-5xl space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => (playClick(), navigate("/mini-games"))} className="flex items-center gap-2 text-white/60 hover:text-white text-sm">
            <ArrowLeft className="w-4 h-4" /> Mini-jogos
          </button>
          <div className="flex items-center gap-2 text-amber-300 text-xs uppercase tracking-widest font-semibold">
            <Swords className="w-4 h-4" /> Card Battle · Round {round}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl border border-white/10 bg-slate-900/45 p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <StatCard title="Você" hp={playerHp} shield={playerShield} tone="emerald" />
              <StatCard title="Bot" hp={botHp} shield={botShield} tone="rose" right />
            </div>

            <p className="rounded-xl border border-cyan-300/20 bg-cyan-500/5 p-3 text-sm text-white/80">{log}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {hand.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => turn === "player" && (playClick(), setSelectedCardId(card.id))}
                  disabled={turn !== "player" || turn === "end"}
                  className="rounded-xl p-3 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
                  style={{
                    background: `linear-gradient(140deg, ${card.color}25, rgba(15,23,42,0.7))`,
                    border: `1px solid ${selectedCardId === card.id ? "#f8fafc" : `${card.color}80`}`,
                  }}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <p className="font-bold text-white">{card.name}</p>
                    <span className="text-xs font-semibold flex items-center gap-1" style={{ color: card.color }}><Sparkles className="w-3 h-3" />{card.power}</span>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: card.color }}>{card.attack}</p>
                  <p className="text-xs text-white/75">{ATTACK_FLAVOR[card.id] ?? card.blurb}</p>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <button onClick={handlePlayerAttack} disabled={turn !== "player" || !selectedCard || turn === "end"} className="flex-1 min-w-56 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40" style={{ background: "linear-gradient(135deg, #7c6ff7, #22d3ee)" }}>
                {selectedCard ? `Atacar com ${selectedCard.attack}` : "Selecione uma carta"}
              </button>
              <button onClick={handleUseItem} disabled={turn !== "player" || turn === "end"} className="py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-40" style={{ background: "rgba(34,211,238,0.15)", border: "1px solid rgba(34,211,238,0.35)", color: "#67e8f9" }}>
                <Pill className="w-4 h-4" /> Item
              </button>
              <button onClick={restart} className="py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center gap-2" style={{ background: "rgba(124,111,247,0.15)", border: "1px solid rgba(124,111,247,0.35)", color: "#a89cf7" }}>
                <RotateCcw className="w-4 h-4" /> Reiniciar
              </button>
            </div>
          </section>

          <aside className="rounded-2xl border border-white/10 bg-slate-900/35 p-4">
            <p className="text-xs uppercase tracking-widest text-white/40 mb-2">Status da batalha</p>
            <p className="text-sm text-white/75 mb-4">{turn === "player" ? "Sua vez" : turn === "bot" ? "Bot pensando..." : "Partida encerrada"}</p>
            <p className="text-xs text-white/60 mb-2">Debuffs ativos</p>
            <p className="text-xs text-white/80 mb-4">Você: {playerDebuffs.length ? playerDebuffs.map((d) => `${d.label}(${d.turns})`).join(", ") : "nenhum"}</p>
            <p className="text-xs text-white/80 mb-4">Bot: {botDebuffs.length ? botDebuffs.map((d) => `${d.label}(${d.turns})`).join(", ") : "nenhum"}</p>

            {history.length > 0 && (
              <div className="space-y-1.5 border-t border-white/10 pt-3">
                {history.map((item, i) => (
                  <p key={`${item}-${i}`} className="text-xs text-white/65">• {item}</p>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, hp, shield, tone, right = false }: { title: string; hp: number; shield: number; tone: "emerald" | "rose"; right?: boolean }) {
  const colors = tone === "emerald" ? "text-emerald-300 border-emerald-400/25 bg-emerald-500/10" : "text-rose-300 border-rose-400/25 bg-rose-500/10";
  return (
    <div className={`rounded-xl border p-3 ${colors} ${right ? "text-right" : ""}`}>
      <p className="text-[11px] uppercase tracking-widest opacity-80">{title}</p>
      <p className="text-2xl font-black leading-none mt-1">{hp} HP</p>
      <p className="mt-2 text-xs flex items-center gap-1 opacity-80 justify-start">
        <Shield className="w-3.5 h-3.5" /> Escudo: {shield}
      </p>
    </div>
  );
}
