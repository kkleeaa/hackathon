export const suggestedQuestions = [
  "How do I teach turn taking?",
  "How can I reduce sensory overload?",
  "Alternative AAC strategies?",
  "Visual schedule ideas?",
  "Positive reinforcement examples?"
];

const responseMap = [
  {
    keywords: ["turn", "taking"],
    answer: "Try a short, highly visible turn-taking routine: name the turn, show a my-turn/your-turn card, use a 30-second timer, and reinforce waiting before the student becomes frustrated. Start with a preferred activity so the practice feels meaningful."
  },
  {
    keywords: ["sensory", "overload", "noise"],
    answer: "Reduce sensory load by previewing noisy moments, offering headphones or a calm corner before escalation, lowering language demands, and using a visual break card. Track which setting, sound, and time of day appears most often."
  },
  {
    keywords: ["aac", "communication"],
    answer: "Use aided language modeling: point to the AAC option while you speak, accept approximations, and avoid requiring the student to repeat after you. Keep core words available all day, not only during speech activities."
  },
  {
    keywords: ["visual", "schedule"],
    answer: "Make the schedule concrete and short. Use first/then for immediate tasks, a four-step strip for routines, and a full-day schedule only when the student can scan it calmly. Remove or mark completed items so progress is visible."
  },
  {
    keywords: ["reinforcement", "positive", "reward"],
    answer: "Choose reinforcement that matches the effort required. Name the exact behavior, deliver the reward quickly, and fade from tangible rewards toward choice, leadership roles, and specific praise as the skill becomes easier."
  }
];

export async function teacherCoach(message, student) {
  await new Promise((resolve) => setTimeout(resolve, 700));
  const lower = message.toLowerCase();
  const match = responseMap.find((item) => item.keywords.every((keyword) => lower.includes(keyword)) || item.keywords.some((keyword) => lower.includes(keyword)));
  const studentContext = student ? ` For ${student.name}, connect the strategy to their current goals and sensory profile.` : "";
  return `${match?.answer || "Start by defining the target skill, choosing one prompt, and collecting a tiny piece of data each day. Keep the routine predictable, reinforce effort, and adjust only one variable at a time."}${studentContext}`;
}

export function renderMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.*?)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br>");
}
