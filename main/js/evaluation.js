export function createProgressEntry(formData) {
  return {
    id: crypto.randomUUID(),
    date: formData.date || new Date().toISOString().slice(0, 10),
    goal: formData.goal,
    result: formData.result || formData.notes || "Rezultati nuk është shënuar",
    notes: formData.notes || ""
  };
}

export function summarizeProgress(entries) {
  if (!entries.length) {
    return {
      successAverage: 0,
      communicationAverage: 0,
      independenceAverage: 0,
      trend: "Nuk ka rezultate ende",
      count: 0,
      badges: ["Gati për të filluar"]
    };
  }

  return {
    successAverage: 0,
    communicationAverage: 0,
    independenceAverage: 0,
    attentionAverage: 0,
    behaviorAverage: 0,
    trend: "Progres i dokumentuar",
    count: entries.length,
    badges: entries.length >= 3 ? ["Dokumentim i rregullt"] : ["Rezultati u regjistrua"]
  };
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
      `Janë dokumentuar ${summary.count} rezultate për objektivat aktuale të klasës.`,
      `${student.name} po praktikon komunikimin dhe pavarësinë në rutinat e përditshme.`
    ],
    achievements: entries.length
      ? entries.slice().reverse().map((entry) => `${entry.date} – ${entry.goal}: ${entry.result}`)
      : ["Nuk ka rezultate të regjistruara ende."],
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
