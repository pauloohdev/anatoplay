import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Swords, Shield, Sparkles, RotateCcw, Pill, Zap } from "lucide-react";
import { BATTLE_CARDS, type BattleCard } from "../data/mini-games";
import { playClick, playCorrect, playWrong, playVictory } from "../../lib/gameAudio";

type DebuffKey = "aphasia" | "ataxia" | "neglect" | "brainFog";
type Debuff = { key: DebuffKey; label: string; turns: number };
type ItemCard = { id: string; name: string; blurb: string; heal?: number; shield?: number; cleanse?: boolean; energy?: number; dmgBoost?: number };

const ITEM_POOL: ItemCard[] = [
  { id: "item-thiamine", name: "Tiamina Turbo", blurb: "Limpa debuffs.", cleanse: true },
  { id: "item-cafe", name: "Café do Plantão", blurb: "Recupera 8 HP e +1 energia.", heal: 8, energy: 1 },
  { id: "item-helmet", name: "Capacete de Sinapse", blurb: "Gera 10 de escudo.", shield: 10 },
  { id: "item-adrenal", name: "Adrenalina", blurb: "Próximo ataque ganha +5 dano.", dmgBoost: 5 },
];

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
  const hand = useMemo(() => BATTLE_CARDS.slice(0, 4), []);
  const botDeck = useMemo(() => BATTLE_CARDS.slice(2), []);

  const [playerHp, setPlayerHp] = useState(100); const [botHp, setBotHp] = useState(100);
  const [playerShield, setPlayerShield] = useState(0); const [botShield, setBotShield] = useState(0);
  const [playerEnergy, setPlayerEnergy] = useState(3); const [botEnergy, setBotEnergy] = useState(3);
  const [turn, setTurn] = useState<"player"|"bot"|"end">("player");
  const [log, setLog] = useState("Monte sua jogada: energia, item e carta importam.");
  const [round, setRound] = useState(1); const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [playerDebuffs, setPlayerDebuffs] = useState<Debuff[]>([]); const [botDebuffs, setBotDebuffs] = useState<Debuff[]>([]);
  const [history, setHistory] = useState<string[]>([]); const [playerCombo, setPlayerCombo] = useState(0); const [botCombo, setBotCombo] = useState(0);
  const [playerInventory, setPlayerInventory] = useState<ItemCard[]>([ITEM_POOL[0], ITEM_POOL[1], ITEM_POOL[3]]);
  const [botInventory, setBotInventory] = useState<ItemCard[]>([ITEM_POOL[1], ITEM_POOL[2], ITEM_POOL[3]]);
  const [attackBonus, setAttackBonus] = useState(0); const [botAttackBonus, setBotAttackBonus] = useState(0);

  const selectedCard = hand.find((c) => c.id === selectedCardId) ?? null;
  const pushHistory = (entry: string) => setHistory((h) => [entry, ...h].slice(0, 8));

  const applyItem = (item: ItemCard, target: "player" | "bot") => {
    const heal = item.heal ?? 0; const shield = item.shield ?? 0; const energy = item.energy ?? 0;
    if (target === "player") {
      if (heal) setPlayerHp((v) => clamp(v + heal, 0, 100)); if (shield) setPlayerShield((v) => v + shield); if (energy) setPlayerEnergy((v) => clamp(v + energy, 0, 6));
      if (item.cleanse) setPlayerDebuffs([]); if (item.dmgBoost) setAttackBonus((v) => v + item.dmgBoost);
    } else {
      if (heal) setBotHp((v) => clamp(v + heal, 0, 100)); if (shield) setBotShield((v) => v + shield); if (energy) setBotEnergy((v) => clamp(v + energy, 0, 6));
      if (item.cleanse) setBotDebuffs([]); if (item.dmgBoost) setBotAttackBonus((v) => v + item.dmgBoost);
    }
  };

  useEffect(() => {
    if (turn !== "bot") return;
    const timer = window.setTimeout(() => {
      const botCanUseItem = botInventory.length > 0 && (botHp < 45 || botEnergy <= 1 || Math.random() < 0.2);
      if (botCanUseItem) {
        const item = botInventory[0];
        applyItem(item, "bot"); setBotInventory((inv) => inv.slice(1));
        const msg = `Round ${round}: bot usou ${item.name}.`; setLog(msg); pushHistory(`${msg} ${item.blurb}`);
        setBotDebuffs((d) => tickDebuffs(d)); setPlayerDebuffs((d) => tickDebuffs(d));
        setBotEnergy((e) => clamp(e + 2, 0, 6)); setPlayerEnergy((e) => clamp(e + 2, 0, 6));
        setTurn("player"); setRound((r) => r + 1); playWrong(); return;
      }

      const playable = botDeck.filter((c) => CARD_COST[c.id] <= botEnergy);
      const botCard = pickRandom(playable.length ? playable : botDeck);
      const raw = computeDamage(botCard, botDebuffs, botCombo, botAttackBonus); const cost = CARD_COST[botCard.id] ?? 2;
      const blocked = Math.min(playerShield, raw); const dealt = Math.max(0, raw - blocked); const lesion = LESION_BY_CARD[botCard.id];
      setBotEnergy((e) => clamp(e - cost + 2, 0, 6)); setPlayerEnergy((e) => clamp(e + 2, 0, 6));
      setPlayerShield((s) => Math.max(0, s - blocked)); setBotDebuffs((d) => tickDebuffs(d)); setPlayerDebuffs((d) => [...tickDebuffs(d), lesion]);
      setBotAttackBonus(0);
      setPlayerHp((hp) => { const next = Math.max(0, hp - dealt); if (next <= 0) { setTurn("end"); setLog("Derrota! O bot ganhou essa rodada."); } else { setTurn("player"); setRound((r) => r + 1); } return next; });
      setBotCombo((c) => (dealt > 0 ? c + 1 : 0)); setPlayerCombo(0);
      const msg = `Round ${round}: bot usou ${botCard.attack} (custo ${cost}) e causou ${dealt}.`; setLog(msg); pushHistory(`${msg} Debuff: ${lesion.label}.`);
      playWrong();
    }, 700);
    return () => window.clearTimeout(timer);
  }, [turn, round, botInventory, botHp, botEnergy, botDeck, botDebuffs, botCombo, botAttackBonus, playerShield]);

  const handlePlayerAttack = () => {
    if (turn !== "player" || !selectedCard) return;
    const cost = CARD_COST[selectedCard.id] ?? 2;
    if (playerEnergy < cost) { setLog(`Energia insuficiente para ${selectedCard.attack}.`); return; }
    playClick();
    const raw = computeDamage(selectedCard, playerDebuffs, playerCombo, attackBonus);
    const blocked = Math.min(botShield, raw); const dealt = Math.max(0, raw - blocked); const nextBotHp = Math.max(0, botHp - dealt); const lesion = LESION_BY_CARD[selectedCard.id];
    setPlayerEnergy((e) => clamp(e - cost, 0, 6)); setBotEnergy((e) => clamp(e + 2, 0, 6));
    setBotShield((s) => Math.max(0, s - blocked)); setBotHp(nextBotHp); setAttackBonus(0);
    setPlayerDebuffs((d) => tickDebuffs(d)); setBotDebuffs((d) => [...tickDebuffs(d), lesion]);
    setPlayerCombo((c) => (dealt > 0 ? c + 1 : 0)); setBotCombo(0);
    const msg = `Round ${round}: ${selectedCard.attack} (custo ${cost}) causou ${dealt}.`; setLog(msg); pushHistory(`${msg} Debuff: ${lesion.label}.`); playCorrect();
    if (nextBotHp <= 0) { setTurn("end"); setLog("Vitória! Você venceu a batalha de cartas."); playVictory(); return; }
    setTurn("bot");
  };

  const handleUseItem = (itemId: string) => {
    if (turn !== "player") return;
    const item = playerInventory.find((i) => i.id === itemId); if (!item) return;
    playClick(); applyItem(item, "player"); setPlayerInventory((inv) => inv.filter((i) => i !== item));
    const msg = `Round ${round}: você usou ${item.name}.`; setLog(msg); pushHistory(`${msg} ${item.blurb}`);
    setPlayerDebuffs((d) => tickDebuffs(d)); setBotDebuffs((d) => tickDebuffs(d));
    setPlayerEnergy((e) => clamp(e + 1, 0, 6)); setBotEnergy((e) => clamp(e + 2, 0, 6));
    setTurn("bot");
  };

  const restart = () => window.location.reload();

  return <div className="min-h-screen p-4 md:p-6"><div className="mx-auto w-full max-w-5xl space-y-4">
    <div className="flex items-center justify-between"><button onClick={() => (playClick(), navigate('/mini-games'))} className="flex items-center gap-2 text-white/60 hover:text-white text-sm"><ArrowLeft className="w-4 h-4"/>Mini-jogos</button><div className="flex items-center gap-2 text-amber-300 text-xs uppercase tracking-widest font-semibold"><Swords className="w-4 h-4"/>Card Battle · Round {round}</div></div>
    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]"><section className="rounded-2xl border border-white/10 bg-slate-900/45 p-4 space-y-4">
      <div className="grid grid-cols-2 gap-3"><StatCard title="Você" hp={playerHp} shield={playerShield} energy={playerEnergy} combo={playerCombo} tone="emerald"/><StatCard title="Bot" hp={botHp} shield={botShield} energy={botEnergy} combo={botCombo} tone="rose" right/></div>
      <p className="rounded-xl border border-cyan-300/20 bg-cyan-500/5 p-3 text-sm text-white/80">{log}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">{hand.map((card)=>{const cost=CARD_COST[card.id]??2; const locked=playerEnergy<cost; return <button key={card.id} onClick={()=>turn==='player'&&setSelectedCardId(card.id)} disabled={turn!=='player'||turn==='end'} className="rounded-xl p-3 text-left transition-all disabled:opacity-50" style={{background:`linear-gradient(140deg, ${card.color}25, rgba(15,23,42,0.7))`,border:`1px solid ${selectedCardId===card.id?'#f8fafc':`${card.color}80`}`}}><div className="mb-1 flex items-center justify-between"><p className="font-bold text-white">{card.name}</p><span className="text-xs font-semibold" style={{color:card.color}}>⚡{cost}</span></div><p className="text-sm font-semibold" style={{color:card.color}}>{card.attack}</p><p className="text-xs text-white/70">{locked?'Energia insuficiente.':card.blurb}</p></button>})}</div>
      <div className="flex gap-2"><button onClick={handlePlayerAttack} disabled={turn!=="player"||!selectedCard||turn==="end"} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40" style={{ background: "linear-gradient(135deg, #7c6ff7, #22d3ee)" }}>Atacar</button><button onClick={restart} className="py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center gap-2" style={{ background: "rgba(124,111,247,0.15)", border: "1px solid rgba(124,111,247,0.35)", color: "#a89cf7" }}><RotateCcw className="w-4 h-4"/>Reiniciar</button></div>
      <div><p className="text-xs uppercase tracking-widest text-cyan-200/70 mb-2">Seus itens (escolha manual)</p><div className="grid grid-cols-1 md:grid-cols-3 gap-2">{playerInventory.length?playerInventory.map((item)=><button key={item.id} onClick={()=>handleUseItem(item.id)} disabled={turn!=="player"} className="rounded-lg border border-cyan-300/30 bg-cyan-500/10 p-2 text-left text-xs text-cyan-100 disabled:opacity-40"><div className="flex items-center gap-1 font-semibold"><Pill className="w-3.5 h-3.5"/>{item.name}</div><p className="text-white/70">{item.blurb}</p></button>):<p className="text-xs text-white/50">Sem itens restantes.</p>}</div></div>
    </section><aside className="rounded-2xl border border-white/10 bg-slate-900/35 p-4"><p className="text-xs uppercase tracking-widest text-white/40 mb-2">Status</p><p className="text-sm text-white/75 mb-2">{turn==="player"?"Sua vez":turn==="bot"?"Bot pensando...":"Partida encerrada"}</p><p className="text-xs text-white/70 mb-1">Debuffs você: {playerDebuffs.length?playerDebuffs.map((d)=>`${d.label}(${d.turns})`).join(', '):'nenhum'}</p><p className="text-xs text-white/70 mb-3">Debuffs bot: {botDebuffs.length?botDebuffs.map((d)=>`${d.label}(${d.turns})`).join(', '):'nenhum'}</p>{history.length>0&&<div className="space-y-1.5 border-t border-white/10 pt-3">{history.map((h,i)=><p key={i} className="text-xs text-white/65">• {h}</p>)}</div>}</aside></div>
  </div></div>;
}

function StatCard({ title, hp, shield, energy, combo, tone, right = false }: { title: string; hp: number; shield: number; energy: number; combo: number; tone: "emerald" | "rose"; right?: boolean }) {
  const colors = tone === "emerald" ? "text-emerald-300 border-emerald-400/25 bg-emerald-500/10" : "text-rose-300 border-rose-400/25 bg-rose-500/10";
  return <div className={`rounded-xl border p-3 ${colors} ${right ? "text-right" : ""}`}><p className="text-[11px] uppercase tracking-widest opacity-80">{title}</p><p className="text-2xl font-black leading-none mt-1">{hp} HP</p><p className="mt-2 text-xs flex items-center gap-1 opacity-80"><Shield className="w-3.5 h-3.5"/>Escudo: {shield}</p><p className="text-xs flex items-center gap-1 opacity-90"><Zap className="w-3.5 h-3.5"/>Energia: {energy}/6 · Combo: {combo}</p></div>;
}
