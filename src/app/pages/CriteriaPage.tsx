import { ArrowLeft, BookOpen, ClipboardCheck, Flag } from "lucide-react";
import { useNavigate } from "react-router";
import { playClick } from "../../lib/gameAudio";

const CARD_BG = "rgba(240,239,245,0.04)";
const CARD_BORDER = "rgba(240,239,245,0.1)";
const TEXT_1 = "#f0eff5";
const TEXT_2 = "rgba(240,239,245,0.65)";
const TEXT_3 = "rgba(240,239,245,0.45)";
const ACCENT = "#7c6ff7";

export default function CriteriaPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-5 py-10">
      <div className="w-full max-w-4xl">
        <button
          onClick={() => {
            playClick();
            navigate("/");
          }}
          className="inline-flex items-center gap-2 text-sm mb-6 hover:opacity-90 transition-opacity"
          style={{ color: TEXT_3 }}
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para início
        </button>

        <div
          className="rounded-2xl p-6 md:p-8 mb-4"
          style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}
        >
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2" style={{ color: TEXT_1 }}>
            Critérios da Atividade
          </h1>
          <p style={{ color: TEXT_2 }}>
            Resumo complementar com objetivo, regras e referências do trabalho de Neuroanatomia.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <section className="rounded-2xl p-5" style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
            <div className="flex items-center gap-2 mb-3">
              <Flag className="w-4 h-4" style={{ color: ACCENT }} />
              <h2 className="font-bold" style={{ color: TEXT_1 }}>Objetivo</h2>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: TEXT_2 }}>
              Desenvolver um jogo educativo para facilitar o aprendizado de neuroanatomia funcional
              e neurofisiologia, com conteúdo científico claro, didático e interativo.
            </p>
          </section>

          <section className="rounded-2xl p-5 md:col-span-2" style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
            <div className="flex items-center gap-2 mb-3">
              <ClipboardCheck className="w-4 h-4" style={{ color: ACCENT }} />
              <h2 className="font-bold" style={{ color: TEXT_1 }}>Regras e Estrutura</h2>
            </div>
            <ul className="space-y-2 text-sm" style={{ color: TEXT_2 }}>
              <li>Modo multiplayer em tempo real com host (criador da sala) e players.</li>
              <li>O host cria a sala e compartilha um código de acesso com os demais.</li>
              <li>Partidas com 10 perguntas, 4 alternativas e apenas 1 resposta correta.</li>
              <li>Maior rapidez + acerto geram pontuação mais alta (máximo de 100 pontos).</li>
              <li>Após cada questão, há explicação do conteúdo para reforço didático.</li>
              <li>Existe modalidade solo com as mesmas regras, sem competição.</li>
            </ul>
          </section>
        </div>

        <section
          className="rounded-2xl p-5 mt-3"
          style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}
        >
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4" style={{ color: ACCENT }} />
            <h2 className="font-bold" style={{ color: TEXT_1 }}>Referências</h2>
          </div>
          <ul className="space-y-1.5 text-sm" style={{ color: TEXT_2 }}>
            <li>Slides, roteiros e anotações das aulas da Prof. Nathálya.</li>
            <li>Consenza — Fundamentos da Neuroanatomia, 4ª edição.</li>
            <li>Meneses — Neuroanatomia Aplicada, 3ª edição.</li>
            <li>Claudia Krebs — Neurociências Ilustrada.</li>
            <li>Ângelo Machado — Neuroanatomia Funcional, 3ª edição.</li>
          </ul>
        </section>

        <section
          className="rounded-2xl p-5 mt-3"
          style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}
        >
          <div className="flex items-center gap-2 mb-3">
            <h2 className="font-bold" style={{ color: TEXT_1 }}>Informações Técnicas</h2>
          </div>
          <ul className="space-y-1.5 text-sm" style={{ color: TEXT_2 }}>
            <li>Aplicação educacional com acesso por criação de sala ou entrada por código.</li>
            <li>Modo multiplayer em tempo real com ranking por pontuação ao fim de cada rodada.</li>
            <li>Sistema de perguntas com alternativa única correta e feedback explicativo.</li>
            <li>Controle de tempo por questão e cálculo de pontos por acerto e rapidez.</li>
            <li>Modo solo complementar para treino individual sem competição.</li>
            <li>Conteúdo organizado por temas centrais de neuroanatomia funcional.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
