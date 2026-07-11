import { renderDashboard } from "./dashboard.js";
import { parseIEP, normalizeParsedStudent, Student, placeholderEncryptedStorage } from "./parser.js";
import { educationalTools, recommendTools, generateLesson } from "./toolMatcher.js";
import { generateAAC, materialToMarkdown } from "./aacGenerator.js";
import { suggestedQuestions, teacherCoach, renderMarkdown } from "./chatbot.js";
import { createProgressEntry, summarizeProgress, generateParentReport } from "./evaluation.js";

const routes = [
  ["dashboard", "PN", "Paneli"],
  ["students", "NX", "Profilet e nxënësve"],
  ["upload", "PI", "Ngarko PIA"],
  ["aac", "AA", "Gjeneratori AAC"],
  ["tools", "MJ", "Paketa e mësimdhënies"],
  ["assistive", "TA", "Teknologji ndihmëse"],
  ["sensory", "SH", "Mbështetje shqisore"],
  ["schedules", "OV", "Oraret vizuale"],
  ["boards", "TK", "Tabela komunikimi"],
  ["progress", "PR", "Ndjekja e progresit"],
  ["reports", "RP", "Raporte për prindër"],
  ["coach", "AI", "Atlas - trajneri AI"],
  ["settings", "CI", "Cilësimet"]
];

const state = {
  route: "dashboard",
  students: [],
  currentStudent: null,
  activity: [],
  recommendations: [],
  savedTools: new Set(),
  favoriteTools: new Set(),
  compareTools: new Set(),
  progressEntries: [],
  progressSummary: summarizeProgress([]),
  chatMessages: [],
  lastMaterial: null,
  selectedMood: "I/e qetë",
  theme: "light"
};

const root = document.getElementById("viewRoot");
const navList = document.getElementById("navList");
const pageTitle = document.getElementById("pageTitle");
const sidebar = document.getElementById("sidebar");
const searchInput = document.getElementById("globalSearch");
const searchResults = document.getElementById("searchResults");
const modalBackdrop = document.getElementById("modalBackdrop");
const modalTitle = document.getElementById("modalTitle");
const modalEyebrow = document.getElementById("modalEyebrow");
const modalBody = document.getElementById("modalBody");
const toastRegion = document.getElementById("toastRegion");
const apiKeyGate = document.getElementById("apiKeyGate");
const apiKeyForm = document.getElementById("apiKeyForm");
const apiKeyInput = document.getElementById("apiKeyInput");
const apiKeyError = document.getElementById("apiKeyError");
let openAIApiKey = "";

apiKeyForm.addEventListener("submit", handleApiKeySubmit);
apiKeyInput.focus();

function handleApiKeySubmit(event) {
  event.preventDefault();
  const key = apiKeyInput.value.trim();

  if (!/^sk-[A-Za-z0-9_-]{16,}$/.test(key)) {
    apiKeyError.classList.remove("hidden");
    apiKeyInput.focus();
    return;
  }

  openAIApiKey = key;
  apiKeyInput.value = "";
  apiKeyError.classList.add("hidden");
  apiKeyGate.classList.add("hidden");
  init();
}

async function init() {
  renderNavigation();
  const sample = await loadSampleStudent();
  state.students = [new Student(sample)];
  state.currentStudent = state.students[0];
  seedProgress();
  refreshDerivedState();
  state.activity = [
    { title: "Profili shembull u ngarkua", detail: `Plani mbështetës për ${state.currentStudent.name} është gati.` },
    { title: "Drafti AAC u përgatit", detail: "Materialet për larjen e duarve mund të rigjenerohen." },
    { title: "Ndjekja e progresit është aktive", detail: "Janë gati tri vëzhgime shembull." }
  ];
  state.chatMessages = [
    {
      role: "ai",
      text: `Përshëndetje, jam Atlas, asistenti yt për PIA. Mund të ndihmoj që objektivat e ${state.currentStudent.name} të kthehen në rutina, mbështetje AAC, strategji mësimore dhe gjuhë të kuptueshme për familjen.`,
      time: new Date()
    }
  ];
  bindGlobalEvents();
  navigate("dashboard");
}

async function loadSampleStudent() {
  try {
    const response = await fetch("data/sampleIEP.json");
    if (!response.ok) throw new Error("Sample unavailable");
    return await response.json();
  } catch {
    return {
      studentName: "Maya Johnson",
      age: 8,
      diagnosis: "Çrregullim i spektrit të autizmit me nevoja për përpunim shqisor",
      communicationAbilities: "Përdor fraza të shkurtra, zgjedhje me figura dhe përgjigje po/jo.",
      fineMotorGoals: ["Të shkruajë emrin me formim më të qëndrueshëm të shkronjave"],
      grossMotorGoals: ["Të ndjekë një rutinë lëvizjeje me tre hapa"],
      speechGoals: ["Të përdorë një kërkesë me pesë fjalë me mbështetje vizuale"],
      sensoryNeeds: ["Ulja e zhurmës", "Pushime për lëvizje", "Qasje në kënd qetësie"],
      behaviorTriggers: ["Kalime me zhurmë", "Ndryshime të papritura të orarit"],
      preferredReinforcers: ["Zgjedhje ngjitësesh", "Kohë për vizatim"],
      immediateObjectives: ["Të kërkojë pushim me kartë me figurë"],
      longTermObjectives: ["Të përdorë orarin vizual gjatë ditës shkollore"],
      strengths: ["Kujtesë e fortë vizuale", "I/e pëlqen të ndihmojë shokët"],
      challenges: ["Vështirësi në ambiente me zhurmë"]
    };
  }
}

function seedProgress() {
  state.progressEntries = [
    createProgressEntry({ date: "2026-07-08", goal: "Përdor orarin vizual", activity: "Mbërritja në mëngjes", success: 64, behavior: 72, attention: 68, communication: 58, independence: 52, mood: "Kurioz/e", notes: "Kishte nevojë për një kujtesë për të kontrolluar orarin." }),
    createProgressEntry({ date: "2026-07-09", goal: "Kërkon pushim", activity: "Blloku i shkrimit", success: 72, behavior: 78, attention: 70, communication: 66, independence: 60, mood: "I/e qetë", notes: "Përdori kartën e pushimit para se frustrimi të rritej." }),
    createProgressEntry({ date: "2026-07-10", goal: "Sekuenca e larjes së duarve", activity: "Rutina e drekës", success: 82, behavior: 84, attention: 76, communication: 70, independence: 68, mood: "Krenar/e", notes: "Përfundoi hapat e sapunit dhe shpëlarjes pa ndihmë." })
  ];
}

function refreshDerivedState() {
  state.progressSummary = summarizeProgress(state.progressEntries);
  state.recommendations = recommendTools(state.currentStudent);
}

function renderNavigation() {
  navList.innerHTML = routes
    .map(([id, icon, label]) => `<button class="nav-button" data-route="${id}" aria-current="${id === state.route ? "page" : "false"}"><span aria-hidden="true">${icon}</span><span>${label}</span></button>`)
    .join("");
}

function bindGlobalEvents() {
  document.addEventListener("click", handleClick);
  document.addEventListener("submit", handleSubmit);
  document.addEventListener("input", handleInput);
  document.addEventListener("change", handleChange);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
  });
  searchInput.addEventListener("input", handleSearch);
}

function handleClick(event) {
  const routeButton = event.target.closest("[data-route]");
  if (routeButton) {
    navigate(routeButton.dataset.route);
    return;
  }

  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;
  const { action, toolId } = actionButton.dataset;

  const actions = {
    "toggle-sidebar": () => sidebar.classList.toggle("open"),
    "toggle-theme": toggleTheme,
    "close-modal": closeModal,
    "parse-plan": parsePlanFromInputs,
    "tool-details": () => showToolDetails(toolId),
    "save-tool": () => toggleSet(state.savedTools, toolId, "U ruajt në paketën e mjeteve", "U hoq nga mjetet e ruajtura"),
    "favorite-tool": () => toggleSet(state.favoriteTools, toolId, "U shtua te të preferuarat", "U hoq nga të preferuarat"),
    "compare-tool": () => toggleCompare(toolId),
    "lesson-tool": () => showLesson(toolId),
    "video-tool": () => showVideoPlaceholder(toolId),
    "generate-aac": generateAACFromInput,
    "copy-material": copyMaterial,
    "print-view": () => window.print(),
    "download-placeholder": () => toast("Eksporti PDF është gati si funksion provë për integrim të ardhshëm."),
    "edit-material": enableMaterialEditing,
    "regenerate-material": generateAACFromInput,
    "suggestion": () => sendCoachMessage(actionButton.textContent.trim()),
    "send-chat": () => sendCoachMessage(document.getElementById("chatInput")?.value || ""),
    "mood": () => selectMood(actionButton),
    "generate-report": renderParentReport,
    "backup-placeholder": () => toast(placeholderEncryptedStorage().message),
    "clear-memory": clearMemory
  };

  actions[action]?.();
}

function handleSubmit(event) {
  event.preventDefault();
  if (event.target.id === "chatForm") {
    sendCoachMessage(document.getElementById("chatInput").value);
  }
  if (event.target.id === "progressForm") {
    addProgressEntry(new FormData(event.target));
  }
}

function handleInput(event) {
  if (event.target.matches("input[type='range']")) {
    event.target.nextElementSibling.textContent = `${event.target.value}%`;
  }
}

function handleChange(event) {
  if (event.target.id === "fileUpload") {
    const file = event.target.files[0];
    if (file) readPlanFile(file);
  }
}

function navigate(route) {
  state.route = route;
  sidebar.classList.remove("open");
  renderNavigation();
  const routeLabel = routes.find(([id]) => id === route)?.[2] || "Paneli";
  pageTitle.textContent = routeLabel;
  root.innerHTML = renderRoute(route);
  root.classList.remove("fade-in");
  requestAnimationFrame(() => root.classList.add("fade-in"));
  attachRouteBehaviors(route);
  document.getElementById("mainContent").focus({ preventScroll: true });
}

function renderRoute(route) {
  refreshDerivedState();
  const renderers = {
    dashboard: () => renderDashboard(state),
    students: renderStudents,
    upload: renderUpload,
    aac: renderAAC,
    tools: () => renderTools("Paketa e mësimdhënies", educationalTools),
    assistive: () => renderTools("Teknologji ndihmëse", educationalTools.filter((tool) => tool.techLevel !== "No tech")),
    sensory: () => renderTools("Mbështetje shqisore", educationalTools.filter((tool) => tool.goal.toLowerCase().includes("sensory") || tool.category.includes("headphones"))),
    schedules: () => renderTools("Oraret vizuale", educationalTools.filter((tool) => tool.category.includes("Visual") || tool.category.includes("Timers"))),
    boards: renderCommunicationBoards,
    progress: renderProgress,
    reports: renderReports,
    coach: renderCoach,
    settings: renderSettings
  };
  return renderers[route]?.() || renderDashboard(state);
}

function attachRouteBehaviors(route) {
  if (route === "upload") attachUploadZone();
  if (route === "coach") scrollChatToBottom();
  if (route === "boards") attachCommunicationModuleApi();
}

async function attachCommunicationModuleApi() {
  const frame = document.querySelector(".communication-module-frame");
  if (!frame) return;

  try {
    const response = await fetch(frame.dataset.moduleSrc);
    if (!response.ok) throw new Error("Communication module unavailable");

    const moduleHtml = await response.text();
    const keyPlaceholder = '"VENDOS_API_KEY_KETU"';
    if (!moduleHtml.includes(keyPlaceholder)) throw new Error("API key placeholder unavailable");

    frame.srcdoc = moduleHtml.replace(keyPlaceholder, JSON.stringify(openAIApiKey));
  } catch (error) {
    console.error(error);
    frame.replaceWith(Object.assign(document.createElement("p"), {
      className: "glass-card",
      textContent: "Tabela e komunikimit nuk mund të ngarkohet. Rifreskoni faqen dhe provoni përsëri."
    }));
  }
}

function renderStudents() {
  const student = state.currentStudent;
  return `
    <section class="glass-card profile-top">
      <div class="avatar" style="background:${student.photoColor}" aria-hidden="true">${initials(student.name)}</div>
      <div>
        <p class="eyebrow">Profili i nxënësit</p>
        <h2>${student.name}</h2>
        <p>${student.age} years old. ${student.diagnosis}. ${student.communication}</p>
        <div class="badge-row">
          <span class="badge">Komunikimi: multimodal</span>
          <span class="badge">Progresi: ${state.progressSummary.trend}</span>
          <span class="badge">Objektiva aktuale: ${student.immediateObjectives.length + student.longTermObjectives.length}</span>
        </div>
      </div>
    </section>
    <section class="profile-grid">
      ${profileCard("Pikat e forta", student.strengths)}
      ${profileCard("Sfidat", student.challenges)}
      ${profileCard("Përforcuesit e preferuar", student.reinforcers)}
      ${profileCard("Shkaktarë të sjelljes", student.behaviorTriggers)}
      ${profileCard("Profili shqisor", student.sensoryNeeds)}
      ${profileCard("Profili i komunikimit", [student.communication, ...student.speechGoals])}
    </section>
    <section class="glass-card">
      <div class="card-header">
        <h3>Kohështrirja e objektivave</h3>
        <button class="text-button" data-route="progress">Regjistro progres</button>
      </div>
      <div class="timeline">
        ${[...student.immediateObjectives, ...student.longTermObjectives, ...student.completedGoals].map((goal, index) => `
          <div class="timeline-item">
            <div><strong>${index < student.immediateObjectives.length ? "I menjëhershëm" : index < student.immediateObjectives.length + student.longTermObjectives.length ? "Afatgjatë" : "I përfunduar"}</strong><p>${goal}</p></div>
          </div>
        `).join("")}
      </div>
    </section>
    <section class="glass-card">
      <div class="card-header">
        <h3>Mjete të rekomanduara</h3>
        <button class="text-button" data-route="tools">Krahaso mjetet</button>
      </div>
      <div class="recommendation-row">
        ${state.recommendations.slice(0, 3).map((tool) => `<button class="mini-tool" data-tool-id="${tool.id}" data-action="tool-details"><span>${tool.image}</span><strong>${tool.title}</strong><small>${tool.notes}</small></button>`).join("")}
      </div>
    </section>
  `;
}

function profileCard(title, items) {
  return `
    <article class="profile-card">
      <h3>${title}</h3>
      <ul class="clean-list">${items.map((item) => `<li><span class="status-dot"></span>${item}</li>`).join("")}</ul>
    </article>
  `;
}

function renderUpload() {
  return `
    <section class="glass-card">
      <p class="eyebrow">Lexuesi i PIA / IEP</p>
      <h2>Ngarko ose ngjit planin e nxënësit</h2>
      <p>Mbështet PDF, DOCX, TXT, shënime të kopjuara dhe tërheqje-lëshim. Ky prototip përdor analizim provë dhe mban të dhënat vetëm në memorie.</p>
      <div class="upload-zone" id="uploadZone">
        <div>
          <strong>Lësho këtu një skedar PDF, DOCX ose TXT</strong>
          <p>Nxjerrja e tekstit simulohet për PDF dhe DOCX derisa të lidhet një shërbim AI/analizues.</p>
          <input id="fileUpload" type="file" accept=".pdf,.docx,.txt" aria-label="Ngarko planin e nxënësit" />
        </div>
      </div>
      <label class="field">
        <span>Kopjo dhe ngjit tekstin e planit</span>
        <textarea id="planText">Emri i nxënësit: Leo Martin
Mosha: 7
Diagnoza: ADHD me nevoja për rregullim shqisor.
Komunikimi: Përdor fraza verbale dhe përfiton nga zgjedhjet vizuale.
Objektivi i menjëhershëm: Të kërkojë ndihmë gjatë shkrimit me një kujtesë.
Objektivi afatgjatë: Të përfundojë rutinat e klasës me më shumë pavarësi.
Nevojë shqisore: Pushim me lëvizje pas detyrave të gjata ulur.
Shkaktar: Kalim i papritur.
Përforcues: Zgjedhja e rolit ndihmës në klasë.</textarea>
      </label>
      <div class="toolbar">
        <button class="primary-button" data-action="parse-plan">Analizo planin e nxënësit</button>
        <button class="secondary-button" data-route="students">Hap profilin aktual</button>
      </div>
    </section>
    <section id="parserOutput"></section>
  `;
}

function renderTools(title, tools) {
  const categories = [
    { value: "All", label: "Të gjitha" },
    ...[...new Set(educationalTools.map((tool) => tool.category))].map((category) => ({ value: category, label: translateToolLabel(category) }))
  ];
  return `
    <section class="glass-card">
      <p class="eyebrow">Përputhësi i mjeteve me AI</p>
      <h2>${title}</h2>
      <div class="filter-grid">
        ${field("Kërko", `<input id="toolQuery" placeholder="AAC, shqisore, kalime..." />`)}
        ${field("Kategoria", select("toolCategory", categories))}
        ${field("Mosha", `<input id="toolAge" type="number" min="3" max="18" value="${state.currentStudent.age}" />`)}
        ${field("Çmimi", select("toolPrice", [{ value: "All", label: "Të gjitha" }, { value: "Free", label: "Falas" }, "$", "$$"]))}
        ${field("Diagnoza", select("toolDiagnosis", [
          { value: "All", label: "Të gjitha" },
          { value: "Autism", label: "Autizëm" },
          "ADHD",
          { value: "Developmental delay", label: "Vonesë zhvillimore" },
          { value: "Sensory processing", label: "Përpunim shqisor" }
        ]))}
        ${field("Objektivi", `<input id="toolGoal" placeholder="Komunikim, motorikë fine..." />`)}
        ${field("Teknologjia", select("toolTech", [
          { value: "All", label: "Të gjitha" },
          { value: "No tech", label: "Pa teknologji" },
          { value: "Low tech", label: "Teknologji e thjeshtë" },
          { value: "Mid tech", label: "Teknologji mesatare" }
        ]))}
      </div>
    </section>
    <section class="tools-grid" id="toolsGrid">
      ${toolCards(tools)}
    </section>
  `;
}

function toolCards(tools) {
  return tools.map((tool) => `
    <article class="tool-card slide-up" data-tool-card="${tool.id}">
      <div class="row" style="justify-content:space-between; gap:1rem;">
        <div class="tool-image" aria-hidden="true">${tool.image}</div>
        <span class="badge">${translateToolLabel(tool.cost)}</span>
      </div>
      <div>
        <p class="eyebrow">${translateToolLabel(tool.category)}</p>
        <h3>${tool.title}</h3>
        <p>${tool.description}</p>
      </div>
      <div class="tool-meta">
        <span class="badge">${tool.ageRange}</span>
        <span class="badge">${translateToolLabel(tool.goal)}</span>
        <span class="badge">${translateToolLabel(tool.difficulty)}</span>
      </div>
      <small>${tool.frequency}</small>
      <div class="toolbar">
        <button class="secondary-button" data-tool-id="${tool.id}" data-action="tool-details">Shiko detajet</button>
        <button class="text-button" data-tool-id="${tool.id}" data-action="save-tool">${state.savedTools.has(tool.id) ? "U ruajt" : "Ruaj"}</button>
        <button class="text-button" data-tool-id="${tool.id}" data-action="favorite-tool">${state.favoriteTools.has(tool.id) ? "I preferuar" : "Prefero"}</button>
        <button class="text-button" data-tool-id="${tool.id}" data-action="compare-tool">Krahaso</button>
        <button class="text-button" data-tool-id="${tool.id}" data-action="video-tool">Video</button>
        <button class="text-button" data-tool-id="${tool.id}" data-action="lesson-tool">Krijo mësim</button>
      </div>
    </article>
  `).join("");
}

function renderAAC() {
  const material = state.lastMaterial || generateAAC("Dua të mësoj larjen e duarve.");
  state.lastMaterial = material;
  return `
    <section class="glass-card">
      <p class="eyebrow">Gjeneratori i materialeve AAC</p>
      <h2>Krijo mbështetje gati për klasë</h2>
      <div class="form-row" style="gap:0.7rem; align-items:end;">
        ${field("Objektivi i mësimit", `<input id="aacPrompt" value="Dua të mësoj larjen e duarve." />`)}
        <button class="primary-button" data-action="generate-aac">Krijo</button>
      </div>
      <div class="toolbar">
        <button class="secondary-button" data-action="print-view">Printo</button>
        <button class="secondary-button" data-action="download-placeholder">Shkarko PDF</button>
        <button class="secondary-button" data-action="copy-material">Kopjo</button>
        <button class="secondary-button" data-action="edit-material">Ndrysho</button>
        <button class="secondary-button" data-action="regenerate-material">Rigjenero</button>
      </div>
    </section>
    <section id="aacOutput" class="materials-grid">${renderMaterial(material)}</section>
  `;
}

function renderMaterial(material) {
  return `
    ${materialCard("Kartela mësimore", material.flashcards.map((card) => `<strong>${card.word}</strong><span>${card.cue}</span>`))}
    <article class="material-card">
      <h3>Tabela e komunikimit</h3>
      <div class="board-grid">${material.communicationBoard.flat().map((cell) => `<div class="board-cell" contenteditable="false">${cell}</div>`).join("")}</div>
    </article>
    ${materialCard("Sekuenca vizuale", material.visualSequence)}
    ${materialCard("Histori sociale", material.socialStory)}
    ${materialCard("Aktivitete në klasë", material.activities)}
    ${materialCard("Fletë pune për printim", material.worksheets)}
    ${materialCard("Tabela e shpërblimit", material.rewardChart.map((item) => `${item.step}: ende pa u fituar`))}
    ${materialCard("Lojë përputhjeje", material.matchingGame.map((item) => `${item.word} me ${item.match}`))}
    ${materialCard("Lista e fjalorit", material.vocabulary)}
    ${materialCard("Nxitje me figura", material.picturePrompts)}
    ${materialCard("Listë kontrolli", material.checklist.map((item) => item.label))}
    ${materialCard("Kohëmatësi dhe rutina", [...material.timerSequence.map((item) => `${item.step}: ${item.minutes} min`), ...material.routineSchedule])}
  `;
}

function materialCard(title, items) {
  return `
    <article class="material-card">
      <h3>${title}</h3>
      <ul class="clean-list">${items.map((item) => `<li><span class="status-dot"></span>${item}</li>`).join("")}</ul>
    </article>
  `;
}

function renderCommunicationBoards() {
  return `
    <section class="communication-module-shell" aria-label="Tabela komunikimi">
      <iframe
        class="communication-module-frame"
        title="Tabela komunikimi"
        data-module-src="components/tabela-komunikimi/module/final.html"
      ></iframe>
    </section>
  `;
}

function renderProgress() {
  const summary = state.progressSummary;
  return `
    <section class="progress-layout">
      <form class="glass-card" id="progressForm">
        <p class="eyebrow">Vëzhgim ditor</p>
        <h2>Ndiq progresin</h2>
        ${field("Data", `<input name="date" type="date" value="${new Date().toISOString().slice(0, 10)}" />`)}
        ${field("Objektivi", `<input name="goal" value="${state.currentStudent.immediateObjectives[0]}" />`)}
        ${field("Aktiviteti", `<input name="activity" placeholder="Grupi i leximit, rutina e drekës..." required />`)}
        ${slider("success", "Niveli i suksesit", 75)}
        ${slider("behavior", "Sjellja", 78)}
        ${slider("attention", "Vëmendja", 70)}
        ${slider("communication", "Komunikimi", 68)}
        ${slider("independence", "Pavarësia", 62)}
        <div class="field">
          <span>Gjendja</span>
          <div class="mood-picker">
            ${["I/e qetë", "Kurioz/e", "Krenar/e", "I/e lodhur", "I/e frustruar"].map((mood) => `<button type="button" class="mood-button ${state.selectedMood === mood ? "active" : ""}" data-action="mood">${mood}</button>`).join("")}
          </div>
        </div>
        ${field("Shënime të mësuesit", `<textarea name="notes" placeholder="Çfarë funksionoi? Çfarë duhet të ndryshojë nesër?"></textarea>`)}
        <button class="primary-button" type="submit">Ruaj vëzhgimin</button>
      </form>
      <section class="glass-card">
        <p class="eyebrow">Përmbledhje e progresit</p>
        <h2>${summary.trend}</h2>
        ${progressMetric("Përmbushja e objektivit", summary.successAverage)}
        ${progressMetric("Komunikimi", summary.communicationAverage)}
        ${progressMetric("Pavarësia", summary.independenceAverage)}
        ${progressMetric("Vëmendja", summary.attentionAverage || 0)}
        <h3>Arritje</h3>
        <div class="badge-row">${summary.badges.map((badge) => `<span class="badge">${badge}</span>`).join("")}</div>
        <h3>Grafikë javorë dhe mujorë</h3>
        <div class="weekly-chart" style="min-height:10rem;">${state.progressEntries.map((entry) => `<span style="height:${entry.success}%" title="${entry.date}: ${entry.success}%"></span>`).join("")}</div>
        <ul class="activity-list">${state.progressEntries.slice().reverse().map((entry) => `<li><strong>${entry.date}: ${entry.goal}</strong><span>${entry.activity}. ${entry.notes}</span></li>`).join("")}</ul>
      </section>
    </section>
  `;
}

function renderReports() {
  const report = generateParentReport(state.currentStudent, state.progressEntries);
  return `
    <section class="glass-card" id="parentReport">
      <p class="eyebrow">Raporte për prindër</p>
      <h2>${report.title}</h2>
      <p>Ky përditësim përdor gjuhë të thjeshtë për familjen dhe shmang zhargonin profesional.</p>
      <div class="report-actions">
        <button class="primary-button" data-action="generate-report">Rifresko raportin</button>
        <button class="secondary-button" data-action="download-placeholder">Shkarko PDF</button>
        <button class="secondary-button" data-action="print-view">Printo</button>
        <button class="secondary-button" data-action="copy-material">Kopjo për ndarje</button>
      </div>
    </section>
    <section class="profile-grid">
      ${profileCard("Pikat e forta", report.strengths)}
      ${profileCard("Fusha në përmirësim", report.improving)}
      ${profileCard("Fusha që duan mbështetje", report.support)}
      ${profileCard("Aktivitete të sugjeruara në shtëpi", report.homeActivities)}
      <article class="profile-card">
        <h3>Grafikë</h3>
        ${progressMetric("Suksesi javor", report.summary.successAverage)}
        ${progressMetric("Komunikimi", report.summary.communicationAverage)}
      </article>
      <article class="profile-card">
        <h3>Përforcim pozitiv</h3>
        <p>Lavdërimi specifik, pushimet e shkurtra me zgjedhje, rolet ndihmëse dhe inkurajimi i qetë janë të përshtatshme tani.</p>
      </article>
    </section>
  `;
}

function renderCoach() {
  return `
    <section class="chat-shell">
      <div class="atlas-welcome">
        ${atlasAvatar("large")}
        <div>
          <p class="eyebrow">Trajneri AI për mësimdhënie</p>
          <h2>Bisedo me Atlasin, asistentin tënd për PIA!</h2>
          <p>Atlas ofron udhëzime të qeta, ide praktike dhe strategji të gatshme për klasë sipas planit të ${state.currentStudent.name}.</p>
        </div>
      </div>
      <div class="suggestions">
        ${suggestedQuestions.map((question) => `<button class="secondary-button" data-action="suggestion">${question}</button>`).join("")}
      </div>
      <div class="chat-log" id="chatLog">
        ${state.chatMessages.map(renderMessage).join("")}
      </div>
      <form class="chat-form" id="chatForm">
        <label class="field">
          <span>Dërgo mesazh te Atlas</span>
          <input id="chatInput" placeholder="Pyet për strategji, ide mësimi ose shpjegim për familjen..." autocomplete="off" />
        </label>
        <button class="primary-button" type="submit">Dërgo</button>
      </form>
    </section>
  `;
}

function renderSettings() {
  return `
    <section class="settings-grid">
      <article class="settings-panel">
        <p class="eyebrow">Pamja</p>
        <h2>Cilësimet</h2>
        <label class="toggle"><span>Modaliteti i errët</span><input type="checkbox" ${state.theme === "dark" ? "checked" : ""} data-action="toggle-theme" /></label>
        ${field("Gjuha", select("language", ["Shqip", "Anglisht", "Spanjisht", "Frëngjisht"]))}
        ${field("Ngjyra e temës", `<input type="color" id="themeColor" value="#3454d1" />`)}
        ${field("Madhësia e shkronjave", `<input id="fontSize" type="range" min="0.9" max="1.2" step="0.05" value="1" />`)}
      </article>
      <article class="settings-panel">
        <p class="eyebrow">Privatësia dhe qasshmëria</p>
        <h2>Kontrollet</h2>
        <label class="toggle"><span>Njoftimet</span><input type="checkbox" checked /></label>
        <label class="toggle"><span>Tregues fokusi me kontrast të lartë</span><input type="checkbox" checked /></label>
        <label class="toggle"><span>Përditësime për lexues ekrani</span><input type="checkbox" checked /></label>
        <div class="toolbar">
          <button class="secondary-button" data-action="backup-placeholder">Rezervim provë</button>
          <button class="danger-button" data-action="clear-memory">Pastro memorien</button>
        </div>
      </article>
    </section>
  `;
}

function attachUploadZone() {
  const zone = document.getElementById("uploadZone");
  if (!zone) return;
  ["dragenter", "dragover"].forEach((name) => zone.addEventListener(name, (event) => {
    event.preventDefault();
    zone.classList.add("drag-over");
  }));
  ["dragleave", "drop"].forEach((name) => zone.addEventListener(name, (event) => {
    event.preventDefault();
    zone.classList.remove("drag-over");
  }));
  zone.addEventListener("drop", (event) => {
    const file = event.dataTransfer.files[0];
    if (file) readPlanFile(file);
  });
}

async function readPlanFile(file) {
  if (file.name.endsWith(".txt")) {
    document.getElementById("planText").value = await file.text();
  } else {
    document.getElementById("planText").value = `Emri i nxënësit: ${file.name.replace(/\.[^.]+$/, "")}
Mosha: 9
Diagnoza: Plan i ngarkuar nga ${file.name}.
Komunikimi: Nxjerrje provë për PDF/DOCX. Më vonë mund të zëvendësohet me analizues dokumentesh ose API AI.
Objektivi i menjëhershëm: Përdor mbështetje vizuale gjatë rutinës së klasës.
Objektivi afatgjatë: Rrit pavarësinë gjatë ditës shkollore.`;
  }
  toast(`${file.name} u ngarkua në analizues.`);
}

async function parsePlanFromInputs() {
  const output = document.getElementById("parserOutput");
  const text = document.getElementById("planText").value;
  const fileName = document.getElementById("fileUpload").files[0]?.name || "";
  output.innerHTML = document.getElementById("loadingTemplate").innerHTML;
  const parsed = await parseIEP(text, fileName);
  const student = normalizeParsedStudent(parsed);
  state.students.unshift(student);
  state.currentStudent = student;
  state.activity.unshift({ title: "Plani i nxënësit u analizua", detail: `Profili i ${student.name} u krijua.` });
  refreshDerivedState();
  output.innerHTML = `<section class="glass-card"><h3>Profili i ${student.name} është gati</h3><p>${student.communication}</p><button class="primary-button" data-route="students">Shiko profilin e nxënësit</button></section>`;
  toast("Profili i nxënësit u krijua nga analizuesi provë.");
}

function filterToolsFromControls() {
  const filters = {
    query: document.getElementById("toolQuery")?.value || "",
    category: document.getElementById("toolCategory")?.value || "All",
    price: document.getElementById("toolPrice")?.value || "All",
    age: document.getElementById("toolAge")?.value || "",
    diagnosis: document.getElementById("toolDiagnosis")?.value || "All",
    goal: document.getElementById("toolGoal")?.value || "",
    techLevel: document.getElementById("toolTech")?.value || "All"
  };
  const grid = document.getElementById("toolsGrid");
  if (grid) grid.innerHTML = toolCards(recommendTools(state.currentStudent, filters));
}

document.addEventListener("input", (event) => {
  if (["toolQuery", "toolGoal", "toolAge", "fontSize"].includes(event.target.id)) {
    if (event.target.id === "fontSize") document.documentElement.style.setProperty("--font-scale", event.target.value);
    else filterToolsFromControls();
  }
});

document.addEventListener("change", (event) => {
  if (["toolCategory", "toolPrice", "toolDiagnosis", "toolTech"].includes(event.target.id)) filterToolsFromControls();
  if (event.target.id === "themeColor") document.documentElement.style.setProperty("--primary", event.target.value);
});

function showToolDetails(toolId) {
  const tool = educationalTools.find((item) => item.id === toolId);
  if (!tool) return;
  openModal("Detajet e mjetit", tool.title, `
    <div class="profile-top">
      <div class="tool-image">${tool.image}</div>
      <div>
        <p>${tool.description}</p>
        <div class="badge-row">
          <span class="badge">${translateToolLabel(tool.category)}</span>
          <span class="badge">${tool.ageRange}</span>
          <span class="badge">${translateToolLabel(tool.techLevel)}</span>
          <span class="badge">${translateToolLabel(tool.cost)}</span>
        </div>
      </div>
    </div>
    <h3>Shënime për mësuesin</h3>
    <p>${tool.notes}</p>
    <h3>Video</h3>
    <p>Parapamje video provë: më vonë mund të lidhet një bibliotekë e sigurt videosh ose klip trajnimi.</p>
  `);
}

function showLesson(toolId) {
  const tool = educationalTools.find((item) => item.id === toolId);
  const lesson = generateLesson(tool, state.currentStudent.name);
  openModal("Mësim i krijuar", lesson.title, `
    <p><strong>Kohëzgjatja:</strong> ${lesson.duration}</p>
    ${profileCard("Hapat", lesson.steps)}
    ${profileCard("Materialet", lesson.materials)}
  `);
}

function showVideoPlaceholder(toolId) {
  const tool = educationalTools.find((item) => item.id === toolId);
  if (!tool) return;
  openModal(
    "Parapamje video",
    `Klip trajnimi për ${tool.title}`,
    "<p>Ky funksion provë është gati për një bibliotekë të sigurt videosh në të ardhmen. Për tani, përdor shënimet për mësuesin dhe mësimin e krijuar për të modeluar strategjinë.</p>"
  );
}

function toggleSet(set, id, addMessage, removeMessage) {
  if (set.has(id)) {
    set.delete(id);
    toast(removeMessage);
  } else {
    set.add(id);
    toast(addMessage);
  }
  navigate(state.route);
}

function toggleCompare(toolId) {
  if (state.compareTools.has(toolId)) state.compareTools.delete(toolId);
  else state.compareTools.add(toolId);
  const compared = [...state.compareTools].map((id) => educationalTools.find((tool) => tool.id === id)).filter(Boolean);
  openModal("Krahasimi i mjeteve", "Krahaso mjetet e zgjedhura", compared.length ? `
    <div class="tools-grid">${toolCards(compared)}</div>
  ` : "<p>Nuk është zgjedhur ende asnjë mjet për krahasim.</p>");
}

function generateAACFromInput() {
  const prompt = document.getElementById("aacPrompt")?.value || "I want to teach hand washing.";
  state.lastMaterial = generateAAC(prompt);
  const output = document.getElementById("aacOutput");
  if (output) output.innerHTML = renderMaterial(state.lastMaterial);
  toast("Materialet AAC u krijuan.");
}

async function copyMaterial() {
  const content = state.route === "aac" || state.route === "boards"
    ? materialToMarkdown(state.lastMaterial)
    : root.innerText;
  try {
    await navigator.clipboard.writeText(content);
    toast("U kopjua në clipboard.");
  } catch {
    toast("Kopjimi u bllokua nga shfletuesi, por përmbajtja është e dukshme në ekran.");
  }
}

function enableMaterialEditing() {
  document.querySelectorAll(".material-card, .board-cell").forEach((node) => node.setAttribute("contenteditable", "true"));
  toast("Kartat e materialeve tani mund të ndryshohen.");
}

function selectMood(button) {
  state.selectedMood = button.textContent.trim();
  document.querySelectorAll(".mood-button").forEach((item) => item.classList.remove("active"));
  button.classList.add("active");
}

function addProgressEntry(formData) {
  const entry = createProgressEntry({
    date: formData.get("date"),
    goal: formData.get("goal"),
    activity: formData.get("activity"),
    success: formData.get("success"),
    behavior: formData.get("behavior"),
    attention: formData.get("attention"),
    communication: formData.get("communication"),
    independence: formData.get("independence"),
    notes: formData.get("notes"),
    mood: state.selectedMood
  });
  state.progressEntries.push(entry);
  state.activity.unshift({ title: "Progresi u regjistrua", detail: `${entry.goal}: ${entry.success}% sukses.` });
  refreshDerivedState();
  toast("Vëzhgimi u ruajt në memorie.");
  navigate("progress");
}

function renderParentReport() {
  toast("Raporti për prindër u rifreskua nga të dhënat aktuale të progresit.");
  navigate("reports");
}

async function sendCoachMessage(message) {
  const clean = message.trim();
  if (!clean) return;
  state.chatMessages.push({ role: "teacher", text: clean, time: new Date() });
  navigate("coach");
  const log = document.getElementById("chatLog");
  log.insertAdjacentHTML("beforeend", `<div class="message ai" id="typingMessage">${atlasAvatar("small")}<div class="message-bubble atlas-bubble"><span class="spinner" style="width:1.2rem;height:1.2rem;border-width:2px;"></span> Atlas po mendon...</div></div>`);
  scrollChatToBottom();
  const response = await teacherCoach(clean, state.currentStudent);
  state.chatMessages.push({ role: "ai", text: response, time: new Date() });
  navigate("coach");
}

function renderMessage(message) {
  const avatarMarkup = message.role === "teacher"
    ? `<div class="avatar teacher-avatar" aria-hidden="true">TC</div>`
    : atlasAvatar("small");
  const bubbleClass = message.role === "teacher" ? "" : " atlas-bubble";
  return `
    <article class="message ${message.role}">
      ${avatarMarkup}
      <div class="message-bubble${bubbleClass}">
        ${renderMarkdown(message.text)}
        <time>${new Date(message.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>
      </div>
    </article>
  `;
}

function atlasAvatar(size = "small") {
  return `
    <div class="atlas-avatar ${size === "large" ? "atlas-avatar-large" : ""}" aria-label="Avatari i Atlasit" role="img">
      <img src="assets/images/atlas-standing-widget.png" alt="" />
    </div>
  `;
}

function scrollChatToBottom() {
  const log = document.getElementById("chatLog");
  if (log) log.scrollTop = log.scrollHeight;
}

function handleSearch() {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) {
    searchResults.classList.add("hidden");
    searchResults.innerHTML = "";
    return;
  }
  const items = [
    ...state.students.map((student) => ({ title: student.name, detail: student.diagnosis, route: "students" })),
    ...educationalTools.map((tool) => ({ title: tool.title, detail: `${tool.category}: ${tool.goal}`, route: "tools" })),
    { title: "Raport për prindër", detail: `Përditësim i thjeshtë për familjen e ${state.currentStudent.name}`, route: "reports" },
    { title: "Mësim AAC", detail: state.lastMaterial?.topic || "mbështetje për larjen e duarve", route: "aac" }
  ].filter((item) => `${item.title} ${item.detail}`.toLowerCase().includes(query));

  searchResults.innerHTML = `<strong>${items.length} rezultat${items.length === 1 ? "" : "e"}</strong>${items.slice(0, 6).map((item) => `<button class="search-result" data-route="${item.route}"><strong>${item.title}</strong><br><span>${item.detail}</span></button>`).join("")}`;
  searchResults.classList.remove("hidden");
}

function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = state.theme;
  toast(`U aktivizua modaliteti ${state.theme === "dark" ? "i errët" : "i çelët"}.`);
}

function clearMemory() {
  state.students = state.students.slice(0, 1);
  state.currentStudent = state.students[0];
  state.savedTools.clear();
  state.favoriteTools.clear();
  state.compareTools.clear();
  state.activity = [{ title: "Memoria u pastrua", detail: "Në këtë sesion mbetet vetëm nxënësi shembull." }];
  toast("Të dhënat e sesionit në memorie u pastruan.");
  navigate("dashboard");
}

function openModal(eyebrow, title, body) {
  modalEyebrow.textContent = eyebrow;
  modalTitle.textContent = title;
  modalBody.innerHTML = body;
  modalBackdrop.classList.remove("hidden");
  modalBackdrop.querySelector(".modal-close").focus();
}

function closeModal() {
  modalBackdrop.classList.add("hidden");
}

function toast(message) {
  const node = document.createElement("div");
  node.className = "toast";
  node.textContent = message;
  toastRegion.append(node);
  setTimeout(() => node.remove(), 3200);
}

function initials(name) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function field(label, control) {
  return `<label class="field"><span>${label}</span>${control}</label>`;
}

function select(id, options) {
  return `<select id="${id}">${options.map((option) => {
    const item = typeof option === "string" ? { value: option, label: option } : option;
    return `<option value="${item.value}">${item.label}</option>`;
  }).join("")}</select>`;
}

function translateToolLabel(value) {
  const labels = {
    All: "Të gjitha",
    Free: "Falas",
    Easy: "E lehtë",
    Medium: "Mesatare",
    AAC: "AAC",
    PECS: "PECS",
    "Visual schedules": "Oraret vizuale",
    Timers: "Kohëmatës",
    "Token boards": "Tabela me tokenë",
    "Noise-canceling headphones": "Kufje për ulje zhurme",
    "Fine motor games": "Lojëra për motorikë fine",
    "Emotional regulation": "Rregullim emocional",
    "Functional communication": "Komunikim funksional",
    Requesting: "Kërkesa",
    Transitions: "Kalime",
    "Executive functioning": "Funksionim ekzekutiv",
    "Positive reinforcement": "Përforcim pozitiv",
    "Sensory regulation": "Rregullim shqisor",
    "Fine motor": "Motorikë fine",
    "Self-regulation": "Vetërregullim",
    "No tech": "Pa teknologji",
    "Low tech": "Teknologji e thjeshtë",
    "Mid tech": "Teknologji mesatare"
  };
  return labels[value] || value;
}

function slider(name, label, value) {
  return `
    <label class="field">
      <span>${label}</span>
      <div class="slider-row">
        <input type="range" name="${name}" min="0" max="100" value="${value}" />
        <output>${value}%</output>
      </div>
    </label>
  `;
}

function progressMetric(label, value) {
  return `
    <div class="field" style="margin-bottom:0.8rem;">
      <span>${label}</span>
      <div class="progress-bar"><span style="width:${value}%"></span></div>
    </div>
  `;
}
