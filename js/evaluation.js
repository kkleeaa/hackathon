export function createProgressEntry(formData) {
  return {
    id: crypto.randomUUID(),
    date: formData.date || new Date().toISOString().slice(0, 10),
    goal: formData.goal,
    activity: formData.activity,
    success: Number(formData.success),
    behavior: Number(formData.behavior),
    attention: Number(formData.attention),
    communication: Number(formData.communication),
    independence: Number(formData.independence),
    notes: formData.notes,
    mood: formData.mood || "Calm"
  };
}

export function summarizeProgress(entries) {
  if (!entries.length) {
    return {
      successAverage: 0,
      communicationAverage: 0,
      independenceAverage: 0,
      trend: "No data yet",
      badges: ["Ready to begin"]
    };
  }

  const avg = (field) => Math.round(entries.reduce((sum, entry) => sum + entry[field], 0) / entries.length);
  const first = entries[0]?.success || 0;
  const last = entries[entries.length - 1]?.success || 0;
  return {
    successAverage: avg("success"),
    communicationAverage: avg("communication"),
    independenceAverage: avg("independence"),
    attentionAverage: avg("attention"),
    behaviorAverage: avg("behavior"),
    trend: last >= first ? "Improving" : "Needs review",
    badges: buildBadges(entries, avg("success"))
  };
}

function buildBadges(entries, successAverage) {
  const badges = [];
  if (entries.length >= 3) badges.push("Consistent tracking");
  if (successAverage >= 75) badges.push("Goal momentum");
  if (entries.some((entry) => entry.independence >= 80)) badges.push("Independent step");
  if (!badges.length) badges.push("First observation logged");
  return badges;
}

export function generateParentReport(student, entries) {
  const summary = summarizeProgress(entries);
  return {
    title: `${student.name}'s Learning Update`,
    strengths: [
      `${student.name} is showing strengths in ${student.strengths[0]?.toLowerCase() || "using classroom supports"}.`,
      `They respond well when adults use predictable routines and clear visuals.`
    ],
    improving: [
      `Recent notes show ${summary.trend.toLowerCase()} progress toward current classroom goals.`,
      `${student.name} is practicing communication and independence in daily routines.`
    ],
    support: [
      "Transitions are easier when changes are previewed.",
      "Short practice sessions with encouragement work better than long tasks."
    ],
    homeActivities: [
      "Use a first/then phrase for one evening routine.",
      "Offer two clear choices and wait quietly for a response.",
      "Celebrate effort with specific praise, such as: You asked for help."
    ],
    summary
  };
}
