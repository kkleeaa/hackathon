export const suggestedQuestions = [
  "Si ta mësoj pritjen e radhës?",
  "Si ta ul mbingarkesën shqisore?",
  "Strategji alternative AAC?",
  "Ide për orar vizual?",
  "Shembuj për përforcim pozitiv?"
];

const responseMap = [
  {
    keywords: ["radh", "prit", "turn", "taking"],
    answer: "Provo një rutinë të shkurtër dhe shumë vizuale: emërto radhën, trego kartën radha ime/radha jote, përdor një kohëmatës 30 sekondash dhe përforco pritjen para se nxënësi të frustrohet. Fillo me një aktivitet të preferuar që ushtrimi të ketë kuptim."
  },
  {
    keywords: ["shqisor", "mbingarkes", "zhurm", "sensory", "overload", "noise"],
    answer: "Ule ngarkesën shqisore duke paralajmëruar momentet me zhurmë, duke ofruar kufje ose një kënd qetësie para përshkallëzimit, duke pakësuar kërkesat verbale dhe duke përdorur kartë vizuale për pushim. Shëno vendin, tingullin dhe orën kur ndodh më shpesh."
  },
  {
    keywords: ["aac", "komunikim", "communication"],
    answer: "Përdor modelim të gjuhës me mbështetje: trego opsionin AAC ndërsa flet, prano përpjekjet e përafërta dhe mos kërko që nxënësi të përsërisë menjëherë pas teje. Mbaji fjalët kryesore të disponueshme gjatë gjithë ditës, jo vetëm në aktivitetet e të folurit."
  },
  {
    keywords: ["vizual", "orar", "visual", "schedule"],
    answer: "Bëje orarin konkret dhe të shkurtër. Përdor së pari/pastaj për detyrat e menjëhershme, një shirit me katër hapa për rutinat dhe orar ditor vetëm kur nxënësi mund ta shohë me qetësi. Hiqi ose shëno gjërat e përfunduara që progresi të duket."
  },
  {
    keywords: ["përforcim", "pozitiv", "shpërblim", "reinforcement", "positive", "reward"],
    answer: "Zgjidh përforcim që përputhet me përpjekjen e kërkuar. Emërto sjelljen e saktë, jep shpërblimin shpejt dhe gradualisht kalo nga shpërblimet konkrete te zgjedhjet, rolet udhëheqëse dhe lavdërimi specifik kur aftësia bëhet më e lehtë."
  }
];

export async function teacherCoach(message, student) {
  await new Promise((resolve) => setTimeout(resolve, 700));
  const lower = message.toLowerCase();
  const match = responseMap.find((item) => item.keywords.every((keyword) => lower.includes(keyword)) || item.keywords.some((keyword) => lower.includes(keyword)));
  const studentContext = student ? ` Për ${student.name}, lidhe strategjinë me objektivat aktuale dhe profilin shqisor.` : "";
  return `${match?.answer || "Fillo duke përcaktuar aftësinë që do të mësosh, zgjidh një lloj ndihme dhe mblidh një të dhënë të vogël çdo ditë. Mbaje rutinën të parashikueshme, përforco përpjekjen dhe ndrysho vetëm një element në të njëjtën kohë."}${studentContext}`;
}

export function renderMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.*?)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br>");
}
