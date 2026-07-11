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
    mood: formData.mood || "I/e qetë"
  };
}

export function summarizeProgress(entries) {
  if (!entries.length) {
    return {
      successAverage: 0,
      communicationAverage: 0,
      independenceAverage: 0,
      trend: "Nuk ka të dhëna ende",
      badges: ["Gati për të filluar"]
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
    trend: last >= first ? "Në përmirësim" : "Duhet rishikuar",
    badges: buildBadges(entries, avg("success"))
  };
}

function buildBadges(entries, successAverage) {
  const badges = [];
  if (entries.length >= 3) badges.push("Ndjekje e qëndrueshme");
  if (successAverage >= 75) badges.push("Ritëm i mirë drejt objektivit");
  if (entries.some((entry) => entry.independence >= 80)) badges.push("Hap i pavarur");
  if (!badges.length) badges.push("Vëzhgimi i parë u regjistrua");
  return badges;
}

export function generateParentReport(student, entries) {
  const summary = summarizeProgress(entries);
  return {
    title: `Përditësim i të nxënit për ${student.name}`,
    strengths: [
      `${student.name} po tregon pika të forta në ${student.strengths[0]?.toLowerCase() || "përdorimin e mbështetjeve në klasë"}.`,
      "Përgjigjet mirë kur të rriturit përdorin rutina të parashikueshme dhe figura të qarta."
    ],
    improving: [
      `Shënimet e fundit tregojnë: ${summary.trend.toLowerCase()} drejt objektivave aktuale të klasës.`,
      `${student.name} po praktikon komunikimin dhe pavarësinë në rutinat e përditshme.`
    ],
    support: [
      "Kalimet janë më të lehta kur ndryshimet paralajmërohen më herët.",
      "Seancat e shkurtra me inkurajim funksionojnë më mirë se detyrat e gjata."
    ],
    homeActivities: [
      "Përdorni shprehjen së pari/pastaj për një rutinë në mbrëmje.",
      "Ofroni dy zgjedhje të qarta dhe prisni qetësisht përgjigjen.",
      "Festoni përpjekjen me lavdërim specifik, p.sh.: Kërkove ndihmë."
    ],
    summary
  };
}
