export const educationalTools = [
  {
    id: "aac-core-board",
    title: "Core Word AAC Board",
    category: "AAC",
    description: "A printable and tablet-friendly board that emphasizes high-frequency classroom words.",
    ageRange: "5-12",
    goal: "Functional communication",
    diagnosis: "Autism",
    difficulty: "Easy",
    cost: "Free",
    techLevel: "Low tech",
    image: "CW",
    frequency: "Daily during transitions and routines",
    notes: "Start with four core words and model without requiring immediate imitation."
  },
  {
    id: "pecs-choice-strip",
    title: "PECS Choice Strip",
    category: "PECS",
    description: "A compact exchange strip for requesting breaks, help, activities, and classroom materials.",
    ageRange: "3-10",
    goal: "Requesting",
    diagnosis: "Developmental delay",
    difficulty: "Easy",
    cost: "Free",
    techLevel: "No tech",
    image: "PC",
    frequency: "Every choice-making opportunity",
    notes: "Keep cards consistent and reinforce communication immediately."
  },
  {
    id: "visual-routine",
    title: "First/Then Visual Schedule",
    category: "Visual schedules",
    description: "A simple visual organizer that reduces uncertainty and supports routine completion.",
    ageRange: "4-14",
    goal: "Transitions",
    diagnosis: "Autism",
    difficulty: "Easy",
    cost: "Free",
    techLevel: "No tech",
    image: "VT",
    frequency: "Before each transition",
    notes: "Pair the visual with calm, brief language."
  },
  {
    id: "visual-timer",
    title: "Color Countdown Timer",
    category: "Timers",
    description: "A visual countdown for work periods, breaks, clean-up, and waiting.",
    ageRange: "5-16",
    goal: "Executive functioning",
    diagnosis: "ADHD",
    difficulty: "Medium",
    cost: "$",
    techLevel: "Mid tech",
    image: "TM",
    frequency: "During timed work and breaks",
    notes: "Preview what happens when the timer ends before starting it."
  },
  {
    id: "token-board",
    title: "Five-Token Motivation Board",
    category: "Token boards",
    description: "A concrete progress system that connects effort to a meaningful reward.",
    ageRange: "4-12",
    goal: "Positive reinforcement",
    diagnosis: "Behavior supports",
    difficulty: "Easy",
    cost: "Free",
    techLevel: "No tech",
    image: "TB",
    frequency: "One target routine at a time",
    notes: "Give tokens quickly and name the behavior you noticed."
  },
  {
    id: "noise-headphones",
    title: "Noise-Reducing Headphones",
    category: "Noise-canceling headphones",
    description: "A sensory support for assemblies, cafeterias, bus loading, and unexpected noise.",
    ageRange: "3-18",
    goal: "Sensory regulation",
    diagnosis: "Sensory processing",
    difficulty: "Easy",
    cost: "$$",
    techLevel: "Low tech",
    image: "NH",
    frequency: "As needed with student choice",
    notes: "Teach when and how to request them before a high-noise event."
  },
  {
    id: "fine-motor-kit",
    title: "Fine Motor Games Kit",
    category: "Fine motor games",
    description: "Clothespin, bead, tweezer, and play-dough activities for strengthening hand skills.",
    ageRange: "4-11",
    goal: "Fine motor",
    diagnosis: "Developmental delay",
    difficulty: "Medium",
    cost: "$",
    techLevel: "No tech",
    image: "FM",
    frequency: "10 minutes, three times weekly",
    notes: "Rotate activities and stop before fatigue causes frustration."
  },
  {
    id: "emotion-scale",
    title: "Emotion Regulation Scale",
    category: "Emotional regulation",
    description: "A five-zone visual for naming feelings, matching strategies, and reflecting after incidents.",
    ageRange: "6-18",
    goal: "Self-regulation",
    diagnosis: "ADHD",
    difficulty: "Medium",
    cost: "Free",
    techLevel: "No tech",
    image: "ER",
    frequency: "Morning check-in and after challenging moments",
    notes: "Practice when the student is calm, not only during escalation."
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

export function generateLesson(tool, studentName = "the student") {
  return {
    title: `${tool.title} Mini Lesson`,
    steps: [
      `Preview the purpose of ${tool.title} using one clear sentence.`,
      `Model the tool while ${studentName} watches without performance pressure.`,
      `Offer a supported turn with a visual cue and wait time.`,
      `Reinforce the communication, regulation, or effort shown.`,
      "Record one observation and adjust the prompt level for tomorrow."
    ],
    materials: [tool.title, "Visual cue", "Preferred reinforcer", "Observation notes"],
    duration: "12-18 minutes"
  };
}
