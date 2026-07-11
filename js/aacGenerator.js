const routineSteps = {
  "hand washing": ["Turn on water", "Wet hands", "Add soap", "Scrub", "Rinse", "Dry hands"],
  "turn taking": ["Look", "Wait", "My turn", "Your turn", "Say thanks"],
  "lining up": ["Finish task", "Get backpack", "Stand on spot", "Quiet hands", "Walk with class"]
};

export function generateAAC(prompt) {
  const topic = cleanTopic(prompt);
  const steps = routineSteps[topic.toLowerCase()] || buildGenericSteps(topic);
  const vocabulary = ["I want", "help", "finished", "more", "stop", "wait", "my turn", "all done", topic];

  return {
    topic,
    flashcards: vocabulary.slice(0, 6).map((word) => ({ word, cue: `Use ${word} during ${topic}.` })),
    communicationBoard: [
      ["I need help", "I want more", "Finished"],
      ["Yes", "No", "Wait"],
      ["My turn", "Your turn", "Break"]
    ],
    visualSequence: steps,
    socialStory: [
      `Sometimes I practice ${topic}.`,
      "My teacher shows me each step.",
      "I can ask for help or a break.",
      "When I try each step, I am learning to be more independent."
    ],
    activities: [
      `Model ${topic} with picture prompts.`,
      "Match vocabulary cards to real materials.",
      "Practice the routine with a peer helper.",
      "Celebrate each independent step."
    ],
    worksheets: [`Trace the words for ${topic}`, "Circle the next step", "Cut and order the sequence"],
    rewardChart: steps.map((step) => ({ step, earned: false })),
    matchingGame: vocabulary.slice(0, 5).map((word) => ({ word, match: `${word} picture` })),
    vocabulary,
    picturePrompts: steps.map((step, index) => `${index + 1}. ${step}`),
    checklist: steps.map((step) => ({ label: step, complete: false })),
    timerSequence: steps.map((step, index) => ({ step, minutes: index === 0 ? 1 : 2 })),
    routineSchedule: ["Review visual", ...steps, "Choose reward"]
  };
}

function cleanTopic(prompt) {
  const trimmed = prompt.trim().replace(/^I want to teach\s+/i, "").replace(/[.?!]+$/, "");
  return trimmed || "classroom routine";
}

function buildGenericSteps(topic) {
  return [
    `Look at the ${topic} visual`,
    "Get ready",
    "Try the first step",
    "Ask for help if needed",
    "Finish and clean up",
    "Choose a reward"
  ];
}

export function materialToMarkdown(material) {
  return `# ${material.topic}\n\n## Visual Sequence\n${material.visualSequence.map((step, i) => `${i + 1}. ${step}`).join("\n")}\n\n## Vocabulary\n${material.vocabulary.join(", ")}\n\n## Social Story\n${material.socialStory.join("\n")}`;
}
