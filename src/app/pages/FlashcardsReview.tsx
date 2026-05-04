import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Repeat2, BookOpen, Layers } from "lucide-react";
import { FLASHCARDS } from "../data/mini-games";
import { playClick } from "../../lib/gameAudio";

const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

export default function FlashcardsReview() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const deck = useMemo(() => shuffle(FLASHCARDS), [shuffleSeed]);

  const card = deck[index] ?? null;

  const next = () => {
    if (!deck.length) return;
    playClick();
    setFlipped(false);
    setIndex((i) => (i + 1) % deck.length);
  };

  const prev = () => {
    if (!deck.length) return;
    playClick();
    setFlipped(false);
    setIndex((i) => (i - 1 + deck.length) % deck.length);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => {
              playClick();
              navigate("/mini-games");
            }}
            className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Mini-jogos
          </button>
          <div className="flex items-center gap-2 text-cyan-300 text-xs uppercase tracking-widest font-semibold">
            <BookOpen className="w-4 h-4" />
            Flashcards
          </div>
        </div>

        <p className="text-xs text-white/45 mb-4 uppercase tracking-wider">
          Sequência aleatória única de revisão
        </p>

        <div
          className="rounded-2xl p-5 min-h-[240px] cursor-pointer transition-all"
          onClick={() => {
            playClick();
            setFlipped((v) => !v);
          }}
          style={{ background: "rgba(240,239,245,0.04)", border: "1px solid rgba(240,239,245,0.1)" }}
        >
          {card ? (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase tracking-widest font-semibold text-white/40">
                  {flipped ? "Resposta" : "Pergunta"}
                </span>
                <span className="text-xs text-cyan-300">{index + 1}/{deck.length}</span>
              </div>
              <p className="text-base leading-relaxed text-white/90 flex-1">
                {flipped ? card.back : card.front}
              </p>
              <div className="text-xs text-white/35 mt-5 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5" />
                Clique no card para virar
              </div>
            </div>
          ) : (
            <p className="text-white/60">Nenhum flashcard encontrado nesse filtro.</p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4">
          <button
            onClick={prev}
            className="py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white"
            style={{ border: "1px solid rgba(240,239,245,0.12)" }}
          >
            Anterior
          </button>
          <button
            onClick={() => {
              playClick();
              setFlipped((v) => !v);
            }}
            className="py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: "rgba(34,211,238,0.14)", border: "1px solid rgba(34,211,238,0.35)", color: "#67e8f9" }}
          >
            Virar
          </button>
          <button
            onClick={next}
            className="py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white"
            style={{ border: "1px solid rgba(240,239,245,0.12)" }}
          >
            Próximo
          </button>
        </div>

        <button
          onClick={() => {
            playClick();
            setIndex(0);
            setFlipped(false);
            setShuffleSeed((s) => s + 1);
          }}
          className="w-full mt-2 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 text-violet-300"
          style={{ border: "1px solid rgba(167,139,250,0.3)", background: "rgba(167,139,250,0.08)" }}
        >
          <Repeat2 className="w-4 h-4" />
          Embaralhar novamente
        </button>
      </div>
    </div>
  );
}
