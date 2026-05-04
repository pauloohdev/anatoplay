// ─── Brain Regions ────────────────────────────────────────────────────────────

export interface BrainRegion {
  id: string;
  namePt: string;
  color: string;
  glowColor: string;
  description: string;
}

export const BRAIN_REGIONS: BrainRegion[] = [
  {
    id: "frontal",
    namePt: "Lobo Frontal",
    color: "#22d3ee",
    glowColor: "rgba(34,211,238,0.5)",
    description:
      "Funções executivas, planejamento, controle inibitório e personalidade",
  },
  {
    id: "parietal",
    namePt: "Lobo Parietal",
    color: "#8b5cf6",
    glowColor: "rgba(139,92,246,0.5)",
    description:
      "Integração sensorial tátil, percepção espacial e consciência corporal",
  },
  {
    id: "occipital",
    namePt: "Lobo Occipital",
    color: "#f59e0b",
    glowColor: "rgba(245,158,11,0.5)",
    description:
      "Processamento visual primário e reconhecimento de formas e cores",
  },
  {
    id: "temporal",
    namePt: "Lobo Temporal",
    color: "#f43f5e",
    glowColor: "rgba(244,63,94,0.5)",
    description:
      "Processamento auditivo, linguagem compreensiva e memória de longo prazo",
  },
  {
    id: "cerebellum",
    namePt: "Cerebelo",
    color: "#10b981",
    glowColor: "rgba(16,185,129,0.5)",
    description:
      "Coordenação motora fina, equilíbrio e aprendizado de habilidades motoras",
  },
  {
    id: "brainstem",
    namePt: "Tronco Encefálico",
    color: "#94a3b8",
    glowColor: "rgba(148,163,184,0.5)",
    description:
      "Funções vitais automáticas: respiração, ritmo cardíaco e consciência",
  },
];

// ─── Identify-the-Structure Questions ────────────────────────────────────────

export interface IdentifyQuestion {
  targetId: string;
  question: string;
  options: string[];
  correctIndex: number;
  funFact: string;
}

export const IDENTIFY_QUESTIONS: IdentifyQuestion[] = [
  {
    targetId: "frontal",
    question:
      "Esta região brilhante é o centro das decisões e da nossa personalidade. Qual é ela?",
    options: ["Lobo Frontal", "Lobo Parietal", "Lobo Temporal", "Cerebelo"],
    correctIndex: 0,
    funFact:
      "O Lobo Frontal é o mais recente evolutivamente e representa ~35% do volume cortical humano.",
  },
  {
    targetId: "temporal",
    question:
      "Esta estrutura iluminada processa sons e abriga o hipocampo e a amígdala. Identifique-a:",
    options: [
      "Lobo Occipital",
      "Lobo Frontal",
      "Lobo Temporal",
      "Lobo Parietal",
    ],
    correctIndex: 2,
    funFact:
      "O Lobo Temporal contém a Área de Wernicke, essencial para compreender a linguagem.",
  },
  {
    targetId: "parietal",
    question:
      "Esta área em destaque integra o toque, a dor e a posição do corpo no espaço:",
    options: [
      "Cerebelo",
      "Lobo Parietal",
      "Tronco Encefálico",
      "Lobo Temporal",
    ],
    correctIndex: 1,
    funFact:
      "Lesões no Lobo Parietal podem causar 'negligência espacial': o paciente ignora metade do mundo.",
  },
  {
    targetId: "occipital",
    question:
      "Sem esta estrutura não veríamos nada — é o centro de processamento visual do cérebro:",
    options: [
      "Lobo Parietal",
      "Tronco Encefálico",
      "Lobo Frontal",
      "Lobo Occipital",
    ],
    correctIndex: 3,
    funFact:
      "O Lobo Occipital contém o córtex visual primário (V1), onde cada olho tem uma representação topográfica.",
  },
  {
    targetId: "cerebellum",
    question:
      "Esta estrutura iluminada garante que você não tropece ao andar. Qual é ela?",
    options: [
      "Cerebelo",
      "Lobo Temporal",
      "Lobo Occipital",
      "Lobo Parietal",
    ],
    correctIndex: 0,
    funFact:
      "O Cerebelo possui mais de 50% de todos os neurônios do sistema nervoso central, apesar de ser apenas ~10% do volume encefálico.",
  },
  {
    targetId: "brainstem",
    question:
      "Esta pequena mas vital estrutura controla respiração e batimentos cardíacos:",
    options: [
      "Lobo Frontal",
      "Cerebelo",
      "Lobo Parietal",
      "Tronco Encefálico",
    ],
    correctIndex: 3,
    funFact:
      "O Tronco Encefálico é a conexão entre o cérebro e a medula espinal, contendo 10 dos 12 pares de nervos cranianos.",
  },
];

// ─── Word-Match Pairs ─────────────────────────────────────────────────────────

export interface MatchPair {
  id: string;
  term: string;
  definition: string;
  color: string;
}

export const MATCH_PAIRS_SET_A: MatchPair[] = [
  {
    id: "hippocampus",
    term: "Hipocampo",
    definition: "Memória de longo prazo e navegação espacial",
    color: "#22d3ee",
  },
  {
    id: "amygdala",
    term: "Amígdala",
    definition: "Processamento do medo e das emoções",
    color: "#f43f5e",
  },
  {
    id: "thalamus",
    term: "Tálamo",
    definition: "Retransmissão de sinais sensoriais ao córtex",
    color: "#8b5cf6",
  },
  {
    id: "hypothalamus",
    term: "Hipotálamo",
    definition: "Regulação hormonal, fome e homeostase",
    color: "#f59e0b",
  },
  {
    id: "corpus-callosum",
    term: "Corpo Caloso",
    definition: "Conecta os dois hemisférios cerebrais",
    color: "#10b981",
  },
  {
    id: "broca",
    term: "Área de Broca",
    definition: "Produção e articulação da fala",
    color: "#a78bfa",
  },
];

export const MATCH_PAIRS_SET_B: MatchPair[] = [
  {
    id: "wernicke",
    term: "Área de Wernicke",
    definition: "Compreensão da linguagem falada",
    color: "#22d3ee",
  },
  {
    id: "basal-ganglia",
    term: "Gânglios da Base",
    definition: "Controle do movimento voluntário e hábitos",
    color: "#f43f5e",
  },
  {
    id: "cerebral-cortex",
    term: "Córtex Motor",
    definition: "Planejamento e execução de movimentos voluntários",
    color: "#8b5cf6",
  },
  {
    id: "insula",
    term: "Ínsula",
    definition: "Consciência corporal, dor e empatia",
    color: "#f59e0b",
  },
  {
    id: "cerebellum-match",
    term: "Cerebelo",
    definition: "Coordenação, precisão e aprendizado motor",
    color: "#10b981",
  },
  {
    id: "prefrontal",
    term: "Córtex Pré-Frontal",
    definition: "Tomada de decisão e controle de impulsos",
    color: "#a78bfa",
  },
];

// ─── Flashcards de Revisão ────────────────────────────────────────────────────

export interface FlashcardItem {
  id: string;
  front: string;
  back: string;
  tag: "pre-estudo" | "revisao";
}

export const FLASHCARDS: FlashcardItem[] = [
  {
    id: "fc-1",
    front: "Qual estrutura é responsável pela memória episódica e espacial?",
    back: "Hipocampo — ele participa da consolidação da memória de longo prazo e navegação espacial.",
    tag: "pre-estudo",
  },
  {
    id: "fc-2",
    front: "Qual área cortical está ligada ao planejamento e controle inibitório?",
    back: "Córtex pré-frontal (lobo frontal).",
    tag: "pre-estudo",
  },
  {
    id: "fc-3",
    front: "O que o tálamo faz de principal?",
    back: "Atua como estação de retransmissão sensorial para o córtex.",
    tag: "revisao",
  },
  {
    id: "fc-4",
    front: "Qual região é central para a compreensão da linguagem?",
    back: "Área de Wernicke, no lobo temporal dominante.",
    tag: "revisao",
  },
  {
    id: "fc-5",
    front: "Qual estrutura ajusta precisão e coordenação dos movimentos?",
    back: "Cerebelo — essencial para coordenação, equilíbrio e aprendizado motor.",
    tag: "revisao",
  },
];

// ─── Cartas de Batalha ────────────────────────────────────────────────────────

export interface BattleCard {
  id: string;
  name: string;
  attack: string;
  power: number;
  blurb: string;
  color: string;
}

export const BATTLE_CARDS: BattleCard[] = [
  {
    id: "bc-frontal",
    name: "Lobo Frontal",
    attack: "Comando Executivo",
    power: 18,
    blurb: "Planejamento e decisão sob pressão.",
    color: "#7c6ff7",
  },
  {
    id: "bc-temporal",
    name: "Lobo Temporal",
    attack: "Eco de Memórias",
    power: 16,
    blurb: "Integra linguagem e memória declarativa.",
    color: "#f43f5e",
  },
  {
    id: "bc-cerebelo",
    name: "Cerebelo",
    attack: "Sincronia Motora",
    power: 14,
    blurb: "Ajustes finos para precisão total.",
    color: "#10b981",
  },
  {
    id: "bc-brainstem",
    name: "Tronco Encefálico",
    attack: "Pulso Vital",
    power: 20,
    blurb: "Resiliência máxima das funções vitais.",
    color: "#94a3b8",
  },
  {
    id: "bc-parietal",
    name: "Lobo Parietal",
    attack: "Mapa Sensorial",
    power: 15,
    blurb: "Converte sensação em vantagem tática.",
    color: "#8b5cf6",
  },
  {
    id: "bc-occipital",
    name: "Lobo Occipital",
    attack: "Foco Visual",
    power: 17,
    blurb: "Leitura rápida do campo de batalha.",
    color: "#f59e0b",
  },
];
