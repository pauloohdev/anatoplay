import { useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import gsap from "gsap";
import { Brain, Layers, ArrowLeft, Target, ChevronRight, BookOpenCheck, Swords } from "lucide-react";
import { playClick } from "../../lib/gameAudio";

interface MiniGameCardProps {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  accentColor: string;
  glowColor: string;
  stats: { label: string; value: string }[];
  onClick: () => void;
  index: number;
}

function MiniGameCard({
  title,
  subtitle,
  description,
  icon,
  accentColor,
  glowColor,
  stats,
  onClick,
  index,
}: MiniGameCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 12;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -12;
    ref.current.style.transform = `perspective(600px) rotateX(${y}deg) rotateY(${x}deg) translateZ(6px)`;
  };

  const handleMouseLeave = () => {
    if (!ref.current) return;
    ref.current.style.transform = "perspective(600px) rotateX(0deg) rotateY(0deg) translateZ(0)";
  };

  return (
    <div
      ref={ref}
      onClick={() => {
        playClick();
        onClick();
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="hub-card cursor-pointer rounded-2xl p-6 flex flex-col gap-4 group transition-all duration-300"
      style={{
        background: "rgba(240,239,245,0.04)",
        border: `1px solid rgba(240,239,245,0.09)`,
        transformStyle: "preserve-3d",
        transitionProperty: "border-color",
        transitionDuration: "0.3s",
        animationDelay: `${index * 0.1}s`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `rgba(${hexToRgbComponents(accentColor)},0.3)`;
      }}
    >
      {/* Icon + Badge */}
      <div className="flex items-start justify-between">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{
            background: `rgba(${hexToRgbComponents(accentColor)},0.12)`,
            border: `1px solid rgba(${hexToRgbComponents(accentColor)},0.2)`,
            boxShadow: `0 0 20px rgba(${hexToRgbComponents(accentColor)},0.1)`,
          }}
        >
          {icon}
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
          style={{
            background: `rgba(${hexToRgbComponents(accentColor)},0.1)`,
            border: `1px solid rgba(${hexToRgbComponents(accentColor)},0.2)`,
            color: accentColor,
          }}
        >
          Solo
        </div>
      </div>

      {/* Text */}
      <div>
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-1"
          style={{ color: `rgba(${hexToRgbComponents(accentColor)},0.8)` }}
        >
          {subtitle}
        </p>
        <h3 className="text-[#f0eff5] text-xl font-black mb-2">{title}</h3>
        <p className="text-sm leading-relaxed" style={{ color: "rgba(240,239,245,0.45)" }}>{description}</p>
      </div>

      {/* Stats */}
      <div className="flex gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex-1 rounded-xl p-2.5 text-center"
            style={{
              background: "rgba(240,239,245,0.04)",
              border: "1px solid rgba(240,239,245,0.08)",
            }}
          >
            <div
              className="text-base font-black"
              style={{ color: accentColor }}
            >
              {s.value}
            </div>
            <div className="text-xs mt-0.5" style={{ color: "rgba(240,239,245,0.3)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-200 group-hover:gap-3"
        style={{
          background: `rgba(${hexToRgbComponents(accentColor)},0.1)`,
          border: `1px solid rgba(${hexToRgbComponents(accentColor)},0.22)`,
          color: accentColor,
        }}
      >
        Jogar Agora <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function hexToRgbComponents(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

export default function MiniGameHub() {
  const navigate = useNavigate();

  useEffect(() => {
    gsap.from(".hub-card", {
      y: 30,
      opacity: 0,
      duration: 0.6,
      stagger: 0.12,
      ease: "power3.out",
      clearProps: "all",
    });
    gsap.from(".hub-header", {
      y: -20,
      opacity: 0,
      duration: 0.5,
      ease: "power2.out",
      clearProps: "all",
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="hub-header mb-10">
          <button
            onClick={() => {
              playClick();
              navigate("/");
            }}
            className="flex items-center gap-2 text-sm transition-colors mb-6 hover:opacity-100"
            style={{ color: "rgba(240,239,245,0.4)" }}
          >
            <ArrowLeft className="w-4 h-4" />
            Início
          </button>
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
              style={{ background: "rgba(124,111,247,0.1)", border: "1px solid rgba(124,111,247,0.2)" }}>
              <Target className="w-3.5 h-3.5" style={{ color: "#7c6ff7" }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(240,239,245,0.5)" }}>
                Treino Solo
              </span>
            </div>
            <h1 className="text-4xl font-extrabold mb-2" style={{ color: "#f0eff5" }}>
              Mini-<span style={{ color: "#7c6ff7" }}>Jogos</span>
            </h1>
            <p style={{ color: "rgba(240,239,245,0.45)" }}>
              Pratique anatomia do tronco encefálico com jogos interativos
            </p>
          </div>
        </div>

        {/* Game Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MiniGameCard
            index={0}
            title="Identifique a Estrutura"
            subtitle="Mini-jogo 01"
            description="Um diagrama do encéfalo é exibido com uma região em destaque. Você tem 10 segundos para identificar a estrutura correta."
            icon={<Brain className="w-6 h-6" style={{ color: "#7c6ff7" }} />}
            accentColor="#7c6ff7"
            glowColor="rgba(124,111,247,0.2)"
            stats={[
              { label: "Rodadas", value: "6" },
              { label: "Timer", value: "10s" },
              { label: "Pts máx", value: "110" },
            ]}
            onClick={() => navigate("/mini-games/identify")}
          />

          <MiniGameCard
            index={1}
            title="Sinapses"
            subtitle="Mini-jogo 02"
            description="12 cartas viradas para baixo escondem 6 pares de estruturas e funções. Encontre todas as correspondências corretas!"
            icon={<Layers className="w-6 h-6 text-violet-400" />}
            accentColor="#8b5cf6"
            glowColor="rgba(139,92,246,0.3)"
            stats={[
              { label: "Pares", value: "6" },
              { label: "Pontos", value: "600" },
              { label: "Penalidade", value: "-30" },
            ]}
            onClick={() => navigate("/mini-games/match")}
          />

          <MiniGameCard
            index={2}
            title="Flashcards de Revisão"
            subtitle="Complementar"
            description="Modo de pré-estudo e revisão rápida. Vire cartões com perguntas e respostas curtas para fixar os conceitos."
            icon={<BookOpenCheck className="w-6 h-6 text-cyan-300" />}
            accentColor="#22d3ee"
            glowColor="rgba(34,211,238,0.25)"
            stats={[
              { label: "Modos", value: "2" },
              { label: "Formato", value: "Q/A" },
              { label: "Ritmo", value: "Livre" },
            ]}
            onClick={() => navigate("/mini-games/flashcards")}
          />

          <MiniGameCard
            index={3}
            title="Card Battle"
            subtitle="Mini-jogo 03"
            description="Batalha de cartas simples contra bot: escolha ataques por turno e reduza o HP rival até zerar."
            icon={<Swords className="w-6 h-6 text-amber-300" />}
            accentColor="#f59e0b"
            glowColor="rgba(245,158,11,0.25)"
            stats={[
              { label: "Modo", value: "vs Bot" },
              { label: "HP", value: "100" },
              { label: "Turnos", value: "1v1" },
            ]}
            onClick={() => navigate("/mini-games/card-battle")}
          />
        </div>

        {/* Footer tip */}
        <p className="text-center text-white/20 text-xs mt-8 tracking-wider">
          OS MINI-JOGOS NÃO AFETAM SUA PONTUAÇÃO NO MODO MULTIPLAYER
        </p>
      </div>
    </div>
  );
}