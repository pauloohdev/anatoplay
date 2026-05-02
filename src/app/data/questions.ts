export interface Question {
  id: number;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  structure: string;
  category: string;
}

export const questions: Question[] = [
  // ─── Bloco 1: Complexo olivar, pirâmides, nervos cranianos avançado ─────────
  {
    id: 0,
    question:
      "Sobre o complexo olivar inferior e as olivas bulbares, qual é a sua principal função?",
    options: [
      "Atuam como núcleos de retransmissão exclusiva da via auditiva para o tálamo.",
      "Estão envolvidos na aprendizagem motora e enviam fibras trepadeiras que exercem ação excitatória sobre as células de Purkinje no cerebelo.",
      "São responsáveis pela recepção direta de estímulos sensoriais de dor e temperatura vindos da medula.",
      "Originam as fibras que formam o trato corticospinal lateral após a decussação.",
    ],
    correct: 1,
    explanation:
      "O complexo olivar inferior é fundamental para a aprendizagem motora cerebelar. Suas fibras trepadeiras (climbing fibers) fazem sinapse diretamente com as células de Purkinje, sendo a via olivocerebelar responsável pelo refinamento e coordenação de movimentos aprendidos — atuando como um sistema de detecção de erros motores.",
    structure: "Complexo Olivar Inferior",
    category: "Bulbo",
  },
  {
    id: 1,
    question:
      "As pirâmides são estruturas proeminentes na face anterior do bulbo. O que elas representam anatomicamente e qual o fenômeno que ocorre em sua porção caudal?",
    options: [
      "Representam feixes de fibras sensoriais que decussam para formar o lemnisco medial.",
      "São massas de substância cinzenta onde se localizam os núcleos dos nervos vago e glossofaríngeo.",
      "Contêm fibras motoras descendentes dos tratos corticospinal e corticobulbar, sendo que a maioria das fibras corticospinais cruza a linha média na decussação das pirâmides.",
      "São centros de integração da homeostase que recebem aferências diretas do hipotálamo.",
    ],
    correct: 2,
    explanation:
      "As pirâmides do bulbo contêm ~1 milhão de axônios do trato corticospinal. Na decussação das pirâmides (junção bulbomedular), aproximadamente 75–90% das fibras cruzam para o lado contralateral, formando o trato corticospinal lateral — a principal via motora voluntária do corpo humano.",
    structure: "Pirâmides Bulbares",
    category: "Bulbo",
  },
  {
    id: 2,
    question:
      "No sistema nervoso, os nervos cranianos podem ser puramente sensoriais, puramente motores ou mistos. Quais dos pares abaixo são exemplos de nervos mistos (possuem componentes sensoriais e motores)?",
    options: [
      "Nervos Olfatório (I) e Óptico (II).",
      "Nervos Troclear (IV) e Abducente (VI).",
      "Nervos Trigêmeo (V), Facial (VII), Glossofaríngeo (IX) e Vago (X).",
      "Nervos Acessório (XI) e Hipoglosso (XII).",
    ],
    correct: 2,
    explanation:
      "Os nervos mistos possuem componentes aferentes e eferentes. O Trigêmeo (V) é o maior nervo craniano; o Facial (VII) inerva músculos da expressão facial e carrega fibras gustativas; o Glossofaríngeo (IX) e o Vago (X) têm amplas funções sensoriais e motoras somáticas e viscerais. I e II são sensoriais puros; IV, VI, XI e XII são motores.",
    structure: "Nervos Cranianos Mistos",
    category: "Nervos Cranianos",
  },
  {
    id: 3,
    question:
      "A glândula pineal (ou epífise) é uma estrutura do epitálamo com funções endócrinas importantes. Como ela participa da regulação do organismo?",
    options: [
      "Secreta dopamina para o corpo estriado, controlando o início do movimento voluntário.",
      "Sintetiza e secreta melatonina, especialmente no escuro, atuando na regulação dos ritmos circadianos e do ciclo sono-vigília sob influência do núcleo supraquiasmático.",
      "Produz hormônio antidiurético (vasopressina) para controlar a diurese nos rins.",
      "Regula a temperatura corporal central através da secreção direta de serotonina na circulação sistêmica.",
    ],
    correct: 1,
    explanation:
      "A glândula pineal sintetiza melatonina a partir da serotonina, com pico de produção no escuro. O núcleo supraquiasmático do hipotálamo recebe informações luminosas da retina e regula o ritmo circadiano da pineal via projeções para o gânglio cervical superior, que inerva a pineal por fibras adrenérgicas.",
    structure: "Glândula Pineal",
    category: "Epitálamo",
  },
  {
    id: 4,
    question:
      "O nervo hipoglosso (XII par craniano) emerge do bulbo no sulco entre a pirâmide e a oliva. Qual a sua função e o que se observa clinicamente em caso de lesão unilateral?",
    options: [
      "Responsável pelo paladar e sensibilidade geral do terço posterior da língua; a língua perde a sensibilidade tátil.",
      "Responsável pela motricidade da língua; em caso de lesão, ocorre paralisia da hemilíngua e desvio da língua para o lado lesado.",
      "Inerva os músculos da expressão facial; o paciente apresenta queda da pálpebra e do canto da boca.",
      "Controla o músculo esternocleidomastóideo; o paciente tem dificuldade em girar a cabeça para o lado oposto.",
    ],
    correct: 1,
    explanation:
      "O XII par inerva todos os músculos intrínsecos e extrínsecos da língua (exceto o palatoglosso). Na lesão do NMI unilateral, ocorre paralisia e atrofia da hemilíngua ipsilateral. Na protrusão, a língua desvia para o lado da lesão porque o genioglosso contralateral, sem oposição, empurra a língua para o lado paralisado.",
    structure: "Nervo Hipoglosso (XII)",
    category: "Nervos Cranianos",
  },

  // ─── Bloco 2: Anatomia do Tronco Encefálico ──────────────────────────────
  {
    id: 5,
    question:
      "O tronco encefálico é uma porção do sistema nervoso central situada entre a medula espinhal e o diencéfalo. Quais são as suas três divisões, em sentido craniocaudal?",
    options: [
      "Telencéfalo, diencéfalo e mesencéfalo.",
      "Mesencéfalo, ponte e bulbo.",
      "Tálamo, hipotálamo e epitálamo.",
      "Cérebro, cerebelo e tronco encefálico.",
    ],
    correct: 1,
    explanation:
      "O tronco encefálico divide-se em três partes (de superior a inferior): mesencéfalo, ponte (metencéfalo) e bulbo (medula oblonga ou mielencéfalo). Situa-se na fossa posterior do crânio, conectando o encéfalo à medula espinhal, e contém os núcleos de 10 dos 12 pares de nervos cranianos.",
    structure: "Tronco Encefálico",
    category: "Anatomia Geral",
  },
  {
    id: 6,
    question:
      "Dos 12 pares de nervos cranianos, quantos fazem conexão direta com o tronco encefálico?",
    options: ["8 pares.", "10 pares.", "12 pares.", "2 pares."],
    correct: 1,
    explanation:
      "Do tronco encefálico emergem 10 pares cranianos: do mesencéfalo (III e IV), da ponte (V, VI, VII e VIII) e do bulbo (IX, X, XI e XII). Apenas o nervo olfatório (I) e o nervo óptico (II) não se conectam ao tronco encefálico — ligam-se ao telencéfalo e ao diencéfalo, respectivamente.",
    structure: "Nervos Cranianos",
    category: "Tronco Encefálico",
  },
  {
    id: 7,
    question:
      "No bulbo (medula oblonga), existe uma eminência alongada de cada lado da fissura mediana anterior, formada por fibras motoras descendentes. Como se chama essa estrutura?",
    options: [
      "Oliva.",
      "Colículo superior.",
      "Pirâmide.",
      "Pedúnculo cerebral.",
    ],
    correct: 2,
    explanation:
      "As pirâmides são eminências longitudinais na face anterior do bulbo, situadas entre a fissura mediana anterior e o sulco anterolateral. Contêm as fibras do trato corticospinal descendente. Na porção inferior do bulbo ocorre a decussação das pirâmides, onde a maioria das fibras motoras cruza para o lado oposto.",
    structure: "Pirâmide Bulbar",
    category: "Bulbo",
  },
  {
    id: 8,
    question:
      "No limite entre o bulbo e a ponte (sulco bulbo-pontino), emergem quais nervos cranianos?",
    options: [
      "Nervos oculomotor (III), troclear (IV) e trigêmeo (V).",
      "Nervos abducente (VI), facial (VII) e vestibulococlear (VIII).",
      "Nervos glossofaríngeo (IX), vago (X) e hipoglosso (XII).",
      "Nervos olfatório (I) e óptico (II).",
    ],
    correct: 1,
    explanation:
      "No sulco bulbopontino emergem três nervos cranianos: o Abducente (VI), que inerva o músculo reto lateral do olho; o Facial (VII), que controla a musculatura de expressão facial; e o Vestibulococlear (VIII), responsável pela audição e equilíbrio. Sua localização é clinicamente importante no diagnóstico de lesões da fossa posterior.",
    structure: "Sulco Bulbo-Pontino",
    category: "Ponte / Bulbo",
  },
  {
    id: 9,
    question:
      "Qual estrutura da ponte é responsável pela conexão com o cerebelo e é formada por um volumoso feixe de fibras transversais?",
    options: [
      "Pedúnculo cerebelar médio.",
      "Pedúnculo cerebelar superior.",
      "Sulco basilar.",
      "Eminência medial.",
    ],
    correct: 0,
    explanation:
      "O pedúnculo cerebelar médio (brachium pontis) é o maior dos três pedúnculos cerebelares. Conecta a ponte ao cerebelo e é formado por fibras pontocerebelares (fibras transversais da ponte), transmitindo informações do córtex cerebral ao cerebelo via núcleos pontinos.",
    structure: "Pedúnculo Cerebelar Médio",
    category: "Ponte / Cerebelo",
  },
  {
    id: 10,
    question:
      "O teto do mesencéfalo apresenta quatro eminências arredondadas conhecidas como corpos quadrigêmeos. Quais são elas?",
    options: [
      "Pirâmides e olivas.",
      "Pedúnculos cerebrais e substância negra.",
      "Colículos superiores e colículos inferiores.",
      "Núcleo rubro e núcleo do oculomotor.",
    ],
    correct: 2,
    explanation:
      "A lâmina quadrigêmea (lâmina tectal) do mesencéfalo apresenta quatro elevações: dois colículos superiores, que participam dos reflexos visuais e do controle dos movimentos oculares; e dois colículos inferiores, que são estações de retransmissão da via auditiva ascendente para o corpo geniculado medial do tálamo.",
    structure: "Lâmina Quadrigêmea",
    category: "Mesencéfalo",
  },
  {
    id: 11,
    question:
      "Qual é o único nervo craniano que emerge da face dorsal do tronco encefálico?",
    options: [
      "Nervo trigêmeo (V).",
      "Nervo oculomotor (III).",
      "Nervo troclear (IV).",
      "Nervo abducente (VI).",
    ],
    correct: 2,
    explanation:
      "O nervo troclear (IV par) é o único nervo craniano que emerge da face dorsal do tronco encefálico, logo abaixo do colículo inferior do mesencéfalo. Após emergir, contorna o tronco encefálico para alcançar a face ventral. Inerva exclusivamente o músculo oblíquo superior do olho e possui o maior trajeto intracraniano entre os nervos cranianos.",
    structure: "Nervo Troclear (IV)",
    category: "Mesencéfalo",
  },
  {
    id: 12,
    question:
      "No mesencéfalo, uma lâmina de substância cinzenta pigmentada separa o tegmento da base do pedúnculo cerebral. Como se chama essa região rica em neurônios dopaminérgicos?",
    options: [
      "Núcleo rubro.",
      "Substância negra.",
      "Substância cinzenta periaquedutal.",
      "Formação reticular.",
    ],
    correct: 1,
    explanation:
      "A substância negra (substantia nigra) é pigmentada pela neuromelanina e localiza-se entre o tegmento e o pé do pedúnculo no mesencéfalo. Seus neurônios dopaminérgicos da via nigroestriatal regulam o movimento voluntário. A degeneração progressiva dessas células — com perda de 60–80% — é o substrato neuropatológico da Doença de Parkinson.",
    structure: "Substância Negra",
    category: "Mesencéfalo",
  },
  {
    id: 13,
    question:
      "O assoalho do quarto ventrículo, também chamado de fossa romboide, é formado por quais partes do tronco encefálico?",
    options: [
      "Face ventral da ponte e do bulbo.",
      "Teto do mesencéfalo.",
      "Parte dorsal da ponte e da porção aberta do bulbo.",
      "Pedúnculos cerebrais e cerebelo.",
    ],
    correct: 2,
    explanation:
      "O quarto ventrículo tem formato de losango (romboide). Seu assoalho, a fossa rombóide, é formado pela face dorsal da ponte (metade superior) e pela face dorsal da porção aberta do bulbo (metade inferior). Nessa região estão os trígonos dos nervos hipoglosso e vago, além do locus coeruleus e da área vestibular.",
    structure: "Quarto Ventrículo",
    category: "Tronco Encefálico",
  },
  {
    id: 14,
    question:
      "A oliva é uma eminência oval situada no bulbo, formada por qual agrupamento de neurônios?",
    options: [
      "Núcleo do hipoglosso.",
      "Núcleo olivar inferior.",
      "Núcleos vestibulares.",
      "Núcleo ambíguo.",
    ],
    correct: 1,
    explanation:
      "A oliva bulbar é uma eminência ovalada na face anterolateral do bulbo, formada internamente pelo complexo do núcleo olivar inferior. Ele recebe aferências do córtex, medula e cerebelo, e projeta axônios (fibras trepadeiras) diretamente para as células de Purkinje do cerebelo, sendo crucial para a aprendizagem e coordenação motora.",
    structure: "Oliva Bulbar / Núcleo Olivar Inferior",
    category: "Bulbo",
  },
];

export const TOTAL_QUESTIONS = questions.length; // 15 perguntas
