export class Student {
  constructor(data) {
    this.id = data.id || crypto.randomUUID();
    this.name = data.studentName || data.name || "New Student";
    this.age = data.age || "Not specified";
    this.diagnosis = data.diagnosis || "Needs profile pending review";
    this.communication = data.communicationAbilities || data.communication || "Communication profile pending";
    this.fineMotorGoals = data.fineMotorGoals || [];
    this.grossMotorGoals = data.grossMotorGoals || [];
    this.speechGoals = data.speechGoals || [];
    this.sensoryNeeds = data.sensoryNeeds || [];
    this.behaviorTriggers = data.behaviorTriggers || [];
    this.reinforcers = data.preferredReinforcers || data.reinforcers || [];
    this.immediateObjectives = data.immediateObjectives || [];
    this.longTermObjectives = data.longTermObjectives || [];
    this.strengths = data.strengths || ["Responds to structured routines", "Benefits from visual supports"];
    this.challenges = data.challenges || ["Needs adult support during transitions"];
    this.notes = data.notes || [];
    this.completedGoals = data.completedGoals || ["Responds to first/then language with one reminder"];
    this.photoColor = data.photoColor || pickProfileColor(data.studentName || data.name || "Student");
    this.createdAt = data.createdAt || new Date().toISOString();
  }
}

const diagnosisHints = [
  "autism",
  "adhd",
  "developmental delay",
  "speech-language impairment",
  "sensory processing",
  "intellectual disability"
];

function pickProfileColor(name) {
  const colors = ["#5b7cfa", "#10a37f", "#ff8c42", "#b052ff", "#0ea5e9"];
  const total = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return colors[total % colors.length];
}

function findLineValue(text, labels) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  for (const label of labels) {
    const found = lines.find((line) => line.toLowerCase().startsWith(label.toLowerCase()));
    if (found) return found.replace(new RegExp(`^${label}\\s*:?\\s*`, "i"), "").trim();
  }
  return "";
}

function sentenceMatches(text, words) {
  const sentences = text.split(/[.!?\n]/).map((item) => item.trim()).filter(Boolean);
  return sentences.filter((sentence) => words.some((word) => sentence.toLowerCase().includes(word)));
}

export async function parseIEP(sourceText = "", fileName = "") {
  await new Promise((resolve) => setTimeout(resolve, 900));
  const text = sourceText.trim();
  const lower = text.toLowerCase();
  const name = findLineValue(text, ["Student Name", "Name"]) || inferNameFromFile(fileName);
  const age = Number(findLineValue(text, ["Age"])) || (lower.includes("third grade") ? 8 : 9);
  const diagnosis = findLineValue(text, ["Diagnosis"]) || diagnosisHints.find((hint) => lower.includes(hint)) || "Learning profile pending teacher review";

  return {
    studentName: name || "Jordan Rivera",
    age,
    diagnosis,
    communicationAbilities: findLineValue(text, ["Communication", "Communication Abilities"]) || "Uses short verbal responses, gestures, and visual choices when routines are predictable.",
    fineMotorGoals: sentenceMatches(text, ["fine motor", "writing", "cut", "grip"]).slice(0, 3),
    grossMotorGoals: sentenceMatches(text, ["gross motor", "balance", "movement", "playground"]).slice(0, 3),
    speechGoals: sentenceMatches(text, ["speech", "language", "request", "answer"]).slice(0, 3),
    sensoryNeeds: sentenceMatches(text, ["sensory", "noise", "movement", "calm"]).slice(0, 4),
    behaviorTriggers: sentenceMatches(text, ["trigger", "frustrat", "transition", "unexpected"]).slice(0, 4),
    preferredReinforcers: sentenceMatches(text, ["reinforcer", "reward", "favorite", "choice"]).slice(0, 4),
    immediateObjectives: sentenceMatches(text, ["objective", "short-term", "prompt", "daily"]).slice(0, 4),
    longTermObjectives: sentenceMatches(text, ["long-term", "annual", "independent", "goal"]).slice(0, 4),
    strengths: sentenceMatches(text, ["strength", "enjoy", "responds well", "prefers"]).slice(0, 4),
    challenges: sentenceMatches(text, ["difficulty", "needs support", "challenge", "struggle"]).slice(0, 4)
  };
}

function inferNameFromFile(fileName) {
  if (!fileName) return "";
  return fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").replace(/\biep\b|\bpia\b/gi, "").trim();
}

export function normalizeParsedStudent(data) {
  const fallback = {
    fineMotorGoals: ["Complete fine-motor classroom tasks with adapted tools"],
    grossMotorGoals: ["Participate in movement routine with visual prompts"],
    speechGoals: ["Request help, break, or preferred item using chosen communication mode"],
    sensoryNeeds: ["Predictable schedule, movement break, and calm space access"],
    behaviorTriggers: ["Unexpected changes and long tasks without choices"],
    preferredReinforcers: ["Choice activity", "Specific praise", "Short creative break"],
    immediateObjectives: ["Use visual support during one daily routine"],
    longTermObjectives: ["Increase independence across classroom routines"],
    strengths: ["Benefits from clear visuals", "Shows persistence with preferred tasks"],
    challenges: ["Needs support generalizing skills across settings"]
  };

  Object.entries(fallback).forEach(([key, value]) => {
    if (!data[key] || data[key].length === 0) data[key] = value;
  });

  return new Student(data);
}

export function placeholderEncryptedStorage() {
  return {
    enabled: false,
    message: "Encrypted student storage is intentionally disabled in this prototype."
  };
}
