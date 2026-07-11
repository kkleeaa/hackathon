export const educationalTools = [
  {
    id: "aac-core-board",
    title: "Tabela AAC me fjalë bazë",
    category: "AAC",
    description: "Tabelë e printueshme dhe e përshtatshme për tablet që thekson fjalët më të përdorura në klasë.",
    ageRange: "5-12",
    goal: "Functional communication",
    diagnosis: "Autism",
    difficulty: "Easy",
    cost: "Free",
    techLevel: "Low tech",
    image: "CW",
    frequency: "Çdo ditë gjatë kalimeve dhe rutinave",
    notes: "Filloni me katër fjalë bazë dhe modeloni pa kërkuar imitim të menjëhershëm."
  },
  {
    id: "pecs-choice-strip",
    title: "Shirit zgjedhjesh PECS",
    category: "PECS",
    description: "Shirit i vogël shkëmbimi për të kërkuar pushime, ndihmë, aktivitete dhe materiale klase.",
    ageRange: "3-10",
    goal: "Requesting",
    diagnosis: "Developmental delay",
    difficulty: "Easy",
    cost: "Free",
    techLevel: "No tech",
    image: "PC",
    frequency: "Në çdo mundësi për zgjedhje",
    notes: "Mbajini kartat të qëndrueshme dhe përforconi komunikimin menjëherë."
  },
  {
    id: "visual-routine",
    title: "Orar vizual së pari/pastaj",
    category: "Visual schedules",
    description: "Organizues i thjeshtë vizual që ul pasigurinë dhe ndihmon përfundimin e rutinave.",
    ageRange: "4-14",
    goal: "Transitions",
    diagnosis: "Autism",
    difficulty: "Easy",
    cost: "Free",
    techLevel: "No tech",
    image: "VT",
    frequency: "Para çdo kalimi",
    notes: "Përdoreni figurën bashkë me gjuhë të qetë dhe të shkurtër."
  },
  {
    id: "visual-timer",
    title: "Kohëmatës me numërim mbrapsht me ngjyra",
    category: "Timers",
    description: "Numërim vizual për kohën e punës, pushimet, pastrimin dhe pritjen.",
    ageRange: "5-16",
    goal: "Executive functioning",
    diagnosis: "ADHD",
    difficulty: "Medium",
    cost: "$",
    techLevel: "Mid tech",
    image: "TM",
    frequency: "Gjatë punës me kohë dhe pushimeve",
    notes: "Shpjegoni paraprakisht çfarë ndodh kur mbaron kohëmatësi."
  },
  {
    id: "token-board",
    title: "Tabela motivuese me pesë tokenë",
    category: "Token boards",
    description: "Sistem konkret progresi që lidh përpjekjen me një shpërblim domethënës.",
    ageRange: "4-12",
    goal: "Positive reinforcement",
    diagnosis: "Behavior supports",
    difficulty: "Easy",
    cost: "Free",
    techLevel: "No tech",
    image: "TB",
    frequency: "Një rutinë e synuar në të njëjtën kohë",
    notes: "Jepni tokenët shpejt dhe emërtoni sjelljen që vërejtët."
  },
  {
    id: "noise-headphones",
    title: "Kufje për ulje zhurme",
    category: "Noise-canceling headphones",
    description: "Mbështetje shqisore për mbledhje, mensë, autobus dhe zhurma të papritura.",
    ageRange: "3-18",
    goal: "Sensory regulation",
    diagnosis: "Sensory processing",
    difficulty: "Easy",
    cost: "$$",
    techLevel: "Low tech",
    image: "NH",
    frequency: "Sipas nevojës, me zgjedhjen e nxënësit",
    notes: "Mësoni kur dhe si t'i kërkojë para një situate me shumë zhurmë."
  },
  {
    id: "fine-motor-kit",
    title: "Paketë lojërash për motorikë fine",
    category: "Fine motor games",
    description: "Aktivitete me kapëse, rruaza, pinceta dhe plastelinë për forcimin e aftësive të duarve.",
    ageRange: "4-11",
    goal: "Fine motor",
    diagnosis: "Developmental delay",
    difficulty: "Medium",
    cost: "$",
    techLevel: "No tech",
    image: "FM",
    frequency: "10 minuta, tri herë në javë",
    notes: "Ndërroni aktivitetet dhe ndaloni para se lodhja të shkaktojë frustrim."
  },
  {
    id: "emotion-scale",
    title: "Shkallë për rregullimin emocional",
    category: "Emotional regulation",
    description: "Figurë me pesë zona për emërtimin e ndjenjave, zgjedhjen e strategjive dhe reflektimin pas situatave.",
    ageRange: "6-18",
    goal: "Self-regulation",
    diagnosis: "ADHD",
    difficulty: "Medium",
    cost: "Free",
    techLevel: "No tech",
    image: "ER",
    frequency: "Kontroll në mëngjes dhe pas momenteve sfiduese",
    notes: "Praktikojeni kur nxënësi është i qetë, jo vetëm gjatë përshkallëzimit."
  }
];

export function recommendTools(student, filters = {}) {
  const haystack = `${student?.diagnosis || ""} ${student?.communication || ""} ${student?.sensoryNeeds?.join(" ") || ""} ${student?.speechGoals?.join(" ") || ""}`.toLowerCase();
  return educationalTools
    .map((tool) => ({ ...tool, score: scoreTool(tool, haystack, filters) }))
    .filter((tool) => tool.score > -1)
    .sort((a, b) => b.score - a.score);
}

function scoreTool(tool, haystack, filters) {
  let score = 0;
  const searchable = `${tool.title} ${tool.category} ${tool.goal} ${tool.diagnosis} ${tool.cost} ${tool.techLevel}`.toLowerCase();
  if (filters.query && !searchable.includes(filters.query.toLowerCase())) return -1;
  if (filters.category && filters.category !== "All" && tool.category !== filters.category) return -1;
  if (filters.price && filters.price !== "All" && tool.cost !== filters.price) return -1;
  if (filters.goal && !searchable.includes(filters.goal.toLowerCase())) return -1;
  if (filters.diagnosis && filters.diagnosis !== "All" && !tool.diagnosis.toLowerCase().includes(filters.diagnosis.toLowerCase())) return -1;
  if (filters.techLevel && filters.techLevel !== "All" && tool.techLevel !== filters.techLevel) return -1;
  if (filters.age && !ageIsSupported(Number(filters.age), tool.ageRange)) return -1;
  if (haystack.includes(tool.goal.toLowerCase())) score += 4;
  if (haystack.includes(tool.category.toLowerCase())) score += 3;
  if (haystack.includes(tool.diagnosis.toLowerCase())) score += 2;
  if (tool.cost === "Free") score += 1;
  return score;
}

function ageIsSupported(age, range) {
  if (!age) return true;
  const [min, max] = range.split("-").map(Number);
  return age >= min && age <= max;
}

export function generateLesson(tool, studentName = "nxënësi") {
  return {
    title: `Mësim i shkurtër: ${tool.title}`,
    steps: [
      `Shpjego qëllimin e "${tool.title}" me një fjali të qartë.`,
      `Modelo mjetin ndërsa ${studentName} shikon pa presion për ta bërë menjëherë.`,
      "Ofroni një radhë të mbështetur me sinjal vizual dhe kohë pritjeje.",
      "Përforconi komunikimin, rregullimin ose përpjekjen e treguar.",
      "Regjistroni një vëzhgim dhe përshtatni nivelin e ndihmës për nesër."
    ],
    materials: [tool.title, "Sinjal vizual", "Përforcues i preferuar", "Shënime vëzhgimi"],
    duration: "12-18 minuta"
  };
}
