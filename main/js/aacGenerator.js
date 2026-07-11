const routineSteps = {
  "larjen e duarve": ["Hap ujin", "Lag duart", "Vendos sapun", "Fërko duart", "Shpëlaj", "Thaj duart"],
  "pritjen e radhës": ["Shiko", "Prit", "Radha ime", "Radha jote", "Thuaj faleminderit"],
  "rreshtimin": ["Përfundo detyrën", "Merr çantën", "Qëndro në vend", "Duart të qeta", "Ec me klasën"],
  "hand washing": ["Hap ujin", "Lag duart", "Vendos sapun", "Fërko duart", "Shpëlaj", "Thaj duart"],
  "turn taking": ["Shiko", "Prit", "Radha ime", "Radha jote", "Thuaj faleminderit"],
  "lining up": ["Përfundo detyrën", "Merr çantën", "Qëndro në vend", "Duart të qeta", "Ec me klasën"]
};

export function generateAAC(prompt) {
  const topic = cleanTopic(prompt);
  const steps = routineSteps[topic.toLowerCase()] || buildGenericSteps(topic);
  const vocabulary = ["Dua", "ndihmë", "mbarova", "më shumë", "ndal", "prit", "radha ime", "u krye", topic];

  return {
    topic,
    flashcards: vocabulary.slice(0, 6).map((word) => ({ word, cue: `Përdor "${word}" gjatë aktivitetit: ${topic}.` })),
    communicationBoard: [
      ["Kam nevojë për ndihmë", "Dua më shumë", "Mbarova"],
      ["Po", "Jo", "Prit"],
      ["Radha ime", "Radha jote", "Pushim"]
    ],
    visualSequence: steps,
    socialStory: [
      `Ndonjëherë unë praktikoj: ${topic}.`,
      "Mësuesja më tregon çdo hap.",
      "Mund të kërkoj ndihmë ose pushim.",
      "Kur provoj çdo hap, po mësoj të jem më i/e pavarur."
    ],
    activities: [
      `Modelo aktivitetin "${topic}" me figura udhëzuese.`,
      "Përputh kartat e fjalorit me materialet reale.",
      "Praktiko rutinën me një shok/shoqe ndihmëse.",
      "Festoni çdo hap të bërë në mënyrë të pavarur."
    ],
    worksheets: [`Gjurmo fjalët për ${topic}`, "Rretho hapin tjetër", "Prit dhe rendit sekuencën"],
    rewardChart: steps.map((step) => ({ step, earned: false })),
    matchingGame: vocabulary.slice(0, 5).map((word) => ({ word, match: `Figura për "${word}"` })),
    vocabulary,
    picturePrompts: steps.map((step, index) => `${index + 1}. ${step}`),
    checklist: steps.map((step) => ({ label: step, complete: false })),
    timerSequence: steps.map((step, index) => ({ step, minutes: index === 0 ? 1 : 2 })),
    routineSchedule: ["Shiko figurën udhëzuese", ...steps, "Zgjidh shpërblimin"]
  };
}

function cleanTopic(prompt) {
  const trimmed = prompt.trim().replace(/^(I want to teach|Dua të mësoj)\s+/i, "").replace(/[.?!]+$/, "");
  return trimmed || "rutinë klase";
}

function buildGenericSteps(topic) {
  return [
    `Shiko figurën për ${topic}`,
    "Përgatitu",
    "Provo hapin e parë",
    "Kërko ndihmë nëse duhet",
    "Përfundo dhe rregullo vendin",
    "Zgjidh një shpërblim"
  ];
}

export function materialToMarkdown(material) {
  return `# ${material.topic}\n\n## Sekuenca vizuale\n${material.visualSequence.map((step, i) => `${i + 1}. ${step}`).join("\n")}\n\n## Fjalori\n${material.vocabulary.join(", ")}\n\n## Tregim social\n${material.socialStory.join("\n")}`;
}
