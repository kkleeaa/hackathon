export class Student {
  constructor(data) {
    this.id = data.id || crypto.randomUUID();
    this.name = data.studentName || data.name || "Nxënës i ri";
    this.age = data.age || "Nuk është specifikuar";
    this.diagnosis = data.diagnosis || "Profili duhet rishikuar";
    this.communication = data.communicationAbilities || data.communication || "Profili i komunikimit është në pritje";
    this.fineMotorGoals = data.fineMotorGoals || [];
    this.grossMotorGoals = data.grossMotorGoals || [];
    this.speechGoals = data.speechGoals || [];
    this.sensoryNeeds = data.sensoryNeeds || [];
    this.behaviorTriggers = data.behaviorTriggers || [];
    this.reinforcers = data.preferredReinforcers || data.reinforcers || [];
    this.immediateObjectives = data.immediateObjectives || [];
    this.longTermObjectives = data.longTermObjectives || [];
    this.strengths = data.strengths || ["Përgjigjet ndaj rutinave të strukturuara", "Përfiton nga mbështetjet vizuale"];
    this.challenges = data.challenges || ["Ka nevojë për mbështetje të të rriturve gjatë kalimeve"];
    this.notes = data.notes || [];
    this.completedGoals = data.completedGoals || ["Përgjigjet ndaj gjuhës së pari/pastaj me një kujtesë"];
    this.photoColor = data.photoColor || pickProfileColor(data.studentName || data.name || "Nxënës");
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
  const name = findLineValue(text, ["Student Name", "Name", "Emri i nxënësit", "Emri"]) || inferNameFromFile(fileName);
  const age = Number(findLineValue(text, ["Age", "Mosha"])) || (lower.includes("third grade") ? 8 : 9);
  const diagnosis = findLineValue(text, ["Diagnosis", "Diagnoza"]) || diagnosisHints.find((hint) => lower.includes(hint)) || "Profili i të nxënit pret rishikimin e mësuesit";

  return {
    studentName: name || "Jordan Rivera",
    age,
    diagnosis,
    communicationAbilities: findLineValue(text, ["Communication", "Communication Abilities", "Komunikimi", "Aftësitë e komunikimit"]) || "Përdor përgjigje të shkurtra verbale, gjeste dhe zgjedhje vizuale kur rutinat janë të parashikueshme.",
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
    fineMotorGoals: ["Të kryejë detyra të motorikës fine në klasë me mjete të përshtatura"],
    grossMotorGoals: ["Të marrë pjesë në rutinë lëvizjeje me udhëzime vizuale"],
    speechGoals: ["Të kërkojë ndihmë, pushim ose send të preferuar me mënyrën e zgjedhur të komunikimit"],
    sensoryNeeds: ["Orar i parashikueshëm, pushim lëvizjeje dhe qasje në hapësirë të qetë"],
    behaviorTriggers: ["Ndryshime të papritura dhe detyra të gjata pa zgjedhje"],
    preferredReinforcers: ["Aktivitet me zgjedhje", "Lavdërim specifik", "Pushim i shkurtër kreativ"],
    immediateObjectives: ["Të përdorë mbështetje vizuale gjatë një rutine të përditshme"],
    longTermObjectives: ["Të rrisë pavarësinë në rutinat e klasës"],
    strengths: ["Përfiton nga figura të qarta", "Tregon këmbëngulje me detyra të preferuara"],
    challenges: ["Ka nevojë për mbështetje për t'i përdorur aftësitë në mjedise të ndryshme"]
  };

  Object.entries(fallback).forEach(([key, value]) => {
    if (!data[key] || data[key].length === 0) data[key] = value;
  });

  return new Student(data);
}

export function placeholderEncryptedStorage() {
  return {
    enabled: false,
    message: "Ruajtja e enkriptuar e të dhënave të nxënësit është çaktivizuar qëllimisht në këtë prototip."
  };
}
