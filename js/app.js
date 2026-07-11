import { renderDashboard } from "./dashboard.js";
import { parseIEP, normalizeParsedStudent, Student, placeholderEncryptedStorage } from "./parser.js";
import { educationalTools, recommendTools, generateLesson } from "./toolMatcher.js";
import { generateAAC, materialToMarkdown } from "./aacGenerator.js";
import { suggestedQuestions, teacherCoach, renderMarkdown } from "./chatbot.js";
import { createProgressEntry, summarizeProgress, generateParentReport } from "./evaluation.js";

const routes = [
  ["dashboard", "DB", "Dashboard"],
  ["students", "SP", "Student Profiles"],
  ["upload", "UP", "Upload IEP"],
  ["aac", "AA", "AAC Generator"],
  ["tools", "TT", "Teaching Toolkit"],
  ["assistive", "AT", "Assistive Technologies"],
  ["sensory", "SS", "Sensory Supports"],
  ["schedules", "VS", "Visual Schedules"],
  ["boards", "CB", "Communication Boards"],
  ["progress", "PT", "Progress Tracking"],
  ["reports", "PR", "Parent Reports"],
  ["coach", "AI", "AI Teaching Coach"],
  ["settings", "SE", "Settings"]
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
  selectedMood: "Calm",
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

init();

async function init() {
  renderNavigation();
  const sample = await loadSampleStudent();
  state.students = [new Student(sample)];
  state.currentStudent = state.students[0];
  seedProgress();
  refreshDerivedState();
  state.activity = [
    { title: "Sample profile loaded", detail: `${state.currentStudent.name}'s support plan is ready.` },
    { title: "AAC draft prepared", detail: "Hand washing materials can be regenerated." },
    { title: "Progress tracker active", detail: "Three sample observations are available." }
  ];
  state.chatMessages = [
    {
      role: "ai",
      text: `Hi, I am Atlas, your PIA Assistant. I can help turn ${state.currentStudent.name}'s goals into routines, AAC supports, teaching strategies, and family-friendly language.`,
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
      diagnosis: "Autism spectrum disorder with sensory processing needs",
      communicationAbilities: "Uses short phrases, picture choices, and yes/no responses.",
      fineMotorGoals: ["Write first name with consistent letter formation"],
      grossMotorGoals: ["Follow a three-step movement routine"],
      speechGoals: ["Use a five-word request with visual support"],
      sensoryNeeds: ["Noise reduction", "Movement breaks", "Calm corner access"],
      behaviorTriggers: ["Loud transitions", "Unexpected schedule changes"],
      preferredReinforcers: ["Sticker choice", "Drawing time"],
      immediateObjectives: ["Request a break using a picture card"],
      longTermObjectives: ["Use visual schedule across the school day"],
      strengths: ["Strong visual memory", "Enjoys helping peers"],
      challenges: ["Difficulty with noisy settings"]
    };
  }
}

function seedProgress() {
  state.progressEntries = [
    createProgressEntry({ date: "2026-07-08", goal: "Use visual schedule", activity: "Morning arrival", success: 64, behavior: 72, attention: 68, communication: 58, independence: 52, mood: "Curious", notes: "Needed one reminder to check the schedule." }),
    createProgressEntry({ date: "2026-07-09", goal: "Request a break", activity: "Writing block", success: 72, behavior: 78, attention: 70, communication: 66, independence: 60, mood: "Calm", notes: "Used break card before frustration increased." }),
    createProgressEntry({ date: "2026-07-10", goal: "Hand washing sequence", activity: "Lunch routine", success: 82, behavior: 84, attention: 76, communication: 70, independence: 68, mood: "Proud", notes: "Completed soap and rinse steps with no prompt." })
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
    "save-tool": () => toggleSet(state.savedTools, toolId, "Saved to toolkit", "Removed from saved tools"),
    "favorite-tool": () => toggleSet(state.favoriteTools, toolId, "Added to favorites", "Removed from favorites"),
    "compare-tool": () => toggleCompare(toolId),
    "lesson-tool": () => showLesson(toolId),
    "video-tool": () => showVideoPlaceholder(toolId),
    "generate-aac": generateAACFromInput,
    "copy-material": copyMaterial,
    "print-view": () => window.print(),
    "download-placeholder": () => toast("PDF export placeholder is ready for future integration."),
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
  const routeLabel = routes.find(([id]) => id === route)?.[2] || "Dashboard";
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
    tools: () => renderTools("Teaching Toolkit", educationalTools),
    assistive: () => renderTools("Assistive Technologies", educationalTools.filter((tool) => tool.techLevel !== "No tech")),
    sensory: () => renderTools("Sensory Supports", educationalTools.filter((tool) => tool.goal.toLowerCase().includes("sensory") || tool.category.includes("headphones"))),
    schedules: () => renderTools("Visual Schedules", educationalTools.filter((tool) => tool.category.includes("Visual") || tool.category.includes("Timers"))),
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
}

function renderStudents() {
  const student = state.currentStudent;
  return `
    <section class="glass-card profile-top">
      <div class="avatar" style="background:${student.photoColor}" aria-hidden="true">${initials(student.name)}</div>
      <div>
        <p class="eyebrow">Student Profile</p>
        <h2>${student.name}</h2>
        <p>${student.age} years old. ${student.diagnosis}. ${student.communication}</p>
        <div class="badge-row">
          <span class="badge">Communication: multimodal</span>
          <span class="badge">Progress: ${state.progressSummary.trend}</span>
          <span class="badge">Current goals: ${student.immediateObjectives.length + student.longTermObjectives.length}</span>
        </div>
      </div>
    </section>
    <section class="profile-grid">
      ${profileCard("Strengths", student.strengths)}
      ${profileCard("Challenges", student.challenges)}
      ${profileCard("Favorite Reinforcers", student.reinforcers)}
      ${profileCard("Behavior Triggers", student.behaviorTriggers)}
      ${profileCard("Sensory Profile", student.sensoryNeeds)}
      ${profileCard("Communication Profile", [student.communication, ...student.speechGoals])}
    </section>
    <section class="glass-card">
      <div class="card-header">
        <h3>Goals Timeline</h3>
        <button class="text-button" data-route="progress">Log progress</button>
      </div>
      <div class="timeline">
        ${[...student.immediateObjectives, ...student.longTermObjectives, ...student.completedGoals].map((goal, index) => `
          <div class="timeline-item">
            <div><strong>${index < student.immediateObjectives.length ? "Immediate" : index < student.immediateObjectives.length + student.longTermObjectives.length ? "Long-term" : "Completed"}</strong><p>${goal}</p></div>
          </div>
        `).join("")}
      </div>
    </section>
    <section class="glass-card">
      <div class="card-header">
        <h3>Recommended Tools</h3>
        <button class="text-button" data-route="tools">Compare tools</button>
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
      <p class="eyebrow">IEP / PIA Parser</p>
      <h2>Upload or paste a student plan</h2>
      <p>Supports PDF, DOCX, TXT, copied notes, and drag-and-drop. This prototype uses placeholder parsing and keeps information in memory only.</p>
      <div class="upload-zone" id="uploadZone">
        <div>
          <strong>Drop a PDF, DOCX, or TXT file here</strong>
          <p>Text extraction is simulated for PDF and DOCX files until an AI/parser service is connected.</p>
          <input id="fileUpload" type="file" accept=".pdf,.docx,.txt" aria-label="Upload student plan" />
        </div>
      </div>
      <label class="field">
        <span>Copy and paste plan text</span>
        <textarea id="planText">Student Name: Leo Martin
Age: 7
Diagnosis: ADHD with sensory regulation needs.
Communication: Uses verbal phrases and benefits from visual choices.
Immediate objective: Request help during writing block with one prompt.
Long-term goal: Complete classroom routines with increased independence.
Sensory need: Movement break after long seated tasks.
Trigger: Unexpected transition.
Reinforcer: Choice of helper job.</textarea>
      </label>
      <div class="toolbar">
        <button class="primary-button" data-action="parse-plan">Parse Student Plan</button>
        <button class="secondary-button" data-route="students">Open Current Profile</button>
      </div>
    </section>
    <section id="parserOutput"></section>
  `;
}

function renderTools(title, tools) {
  const categories = ["All", ...new Set(educationalTools.map((tool) => tool.category))];
  return `
    <section class="glass-card">
      <p class="eyebrow">AI Tool Matcher</p>
      <h2>${title}</h2>
      <div class="filter-grid">
        ${field("Search", `<input id="toolQuery" placeholder="AAC, sensory, transitions..." />`)}
        ${field("Category", select("toolCategory", categories))}
        ${field("Age", `<input id="toolAge" type="number" min="3" max="18" value="${state.currentStudent.age}" />`)}
        ${field("Price", select("toolPrice", ["All", "Free", "$", "$$"]))}
        ${field("Diagnosis", select("toolDiagnosis", ["All", "Autism", "ADHD", "Developmental delay", "Sensory processing"]))}
        ${field("Goal", `<input id="toolGoal" placeholder="Communication, fine motor..." />`)}
        ${field("Technology", select("toolTech", ["All", "No tech", "Low tech", "Mid tech"]))}
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
        <span class="badge">${tool.cost}</span>
      </div>
      <div>
        <p class="eyebrow">${tool.category}</p>
        <h3>${tool.title}</h3>
        <p>${tool.description}</p>
      </div>
      <div class="tool-meta">
        <span class="badge">${tool.ageRange}</span>
        <span class="badge">${tool.goal}</span>
        <span class="badge">${tool.difficulty}</span>
      </div>
      <small>${tool.frequency}</small>
      <div class="toolbar">
        <button class="secondary-button" data-tool-id="${tool.id}" data-action="tool-details">View Details</button>
        <button class="text-button" data-tool-id="${tool.id}" data-action="save-tool">${state.savedTools.has(tool.id) ? "Saved" : "Save"}</button>
        <button class="text-button" data-tool-id="${tool.id}" data-action="favorite-tool">${state.favoriteTools.has(tool.id) ? "Favorited" : "Favorite"}</button>
        <button class="text-button" data-tool-id="${tool.id}" data-action="compare-tool">Compare</button>
        <button class="text-button" data-tool-id="${tool.id}" data-action="video-tool">Video</button>
        <button class="text-button" data-tool-id="${tool.id}" data-action="lesson-tool">Generate Lesson</button>
      </div>
    </article>
  `).join("");
}

function renderAAC() {
  const material = state.lastMaterial || generateAAC("I want to teach hand washing.");
  state.lastMaterial = material;
  return `
    <section class="glass-card">
      <p class="eyebrow">AAC Material Generator</p>
      <h2>Generate classroom-ready supports</h2>
      <div class="form-row" style="gap:0.7rem; align-items:end;">
        ${field("Teaching goal", `<input id="aacPrompt" value="I want to teach hand washing." />`)}
        <button class="primary-button" data-action="generate-aac">Generate</button>
      </div>
      <div class="toolbar">
        <button class="secondary-button" data-action="print-view">Print</button>
        <button class="secondary-button" data-action="download-placeholder">Download PDF</button>
        <button class="secondary-button" data-action="copy-material">Copy</button>
        <button class="secondary-button" data-action="edit-material">Edit</button>
        <button class="secondary-button" data-action="regenerate-material">Regenerate</button>
      </div>
    </section>
    <section id="aacOutput" class="materials-grid">${renderMaterial(material)}</section>
  `;
}

function renderMaterial(material) {
  return `
    ${materialCard("Flashcards", material.flashcards.map((card) => `<strong>${card.word}</strong><span>${card.cue}</span>`))}
    <article class="material-card">
      <h3>Communication Board</h3>
      <div class="board-grid">${material.communicationBoard.flat().map((cell) => `<div class="board-cell" contenteditable="false">${cell}</div>`).join("")}</div>
    </article>
    ${materialCard("Visual Sequence", material.visualSequence)}
    ${materialCard("Social Story", material.socialStory)}
    ${materialCard("Classroom Activities", material.activities)}
    ${materialCard("Printable Worksheets", material.worksheets)}
    ${materialCard("Reward Chart", material.rewardChart.map((item) => `${item.step}: not yet earned`))}
    ${materialCard("Matching Game", material.matchingGame.map((item) => `${item.word} to ${item.match}`))}
    ${materialCard("Vocabulary List", material.vocabulary)}
    ${materialCard("Picture Prompts", material.picturePrompts)}
    ${materialCard("Checklist", material.checklist.map((item) => item.label))}
    ${materialCard("Timer Sequence and Schedule", [...material.timerSequence.map((item) => `${item.step}: ${item.minutes} min`), ...material.routineSchedule])}
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
  state.lastMaterial = state.lastMaterial || generateAAC("I want to teach hand washing.");
  return `
    <section class="glass-card">
      <p class="eyebrow">Communication Boards</p>
      <h2>Ready-to-use choices</h2>
      <p>These boards are generated from the AAC module and can be edited before printing.</p>
    </section>
    <section class="materials-grid">
      <article class="material-card">
        <h3>Core Board</h3>
        <div class="board-grid">${state.lastMaterial.communicationBoard.flat().map((cell) => `<div class="board-cell">${cell}</div>`).join("")}</div>
      </article>
      <article class="material-card">
        <h3>Break Board</h3>
        <div class="board-grid">${["Break", "Help", "Too loud", "Wait", "Finished", "Choice"].map((cell) => `<div class="board-cell">${cell}</div>`).join("")}</div>
      </article>
    </section>
  `;
}

function renderProgress() {
  const summary = state.progressSummary;
  return `
    <section class="progress-layout">
      <form class="glass-card" id="progressForm">
        <p class="eyebrow">Daily Observation</p>
        <h2>Track progress</h2>
        ${field("Date", `<input name="date" type="date" value="${new Date().toISOString().slice(0, 10)}" />`)}
        ${field("Goal", `<input name="goal" value="${state.currentStudent.immediateObjectives[0]}" />`)}
        ${field("Activity", `<input name="activity" placeholder="Reading group, lunch routine..." required />`)}
        ${slider("success", "Success level", 75)}
        ${slider("behavior", "Behavior", 78)}
        ${slider("attention", "Attention", 70)}
        ${slider("communication", "Communication", 68)}
        ${slider("independence", "Independence", 62)}
        <div class="field">
          <span>Mood</span>
          <div class="mood-picker">
            ${["Calm", "Curious", "Proud", "Tired", "Frustrated"].map((mood) => `<button type="button" class="mood-button ${state.selectedMood === mood ? "active" : ""}" data-action="mood">${mood}</button>`).join("")}
          </div>
        </div>
        ${field("Teacher notes", `<textarea name="notes" placeholder="What worked? What should change tomorrow?"></textarea>`)}
        <button class="primary-button" type="submit">Save Observation</button>
      </form>
      <section class="glass-card">
        <p class="eyebrow">Progress Overview</p>
        <h2>${summary.trend}</h2>
        ${progressMetric("Goal completion", summary.successAverage)}
        ${progressMetric("Communication", summary.communicationAverage)}
        ${progressMetric("Independence", summary.independenceAverage)}
        ${progressMetric("Attention", summary.attentionAverage || 0)}
        <h3>Achievement Badges</h3>
        <div class="badge-row">${summary.badges.map((badge) => `<span class="badge">${badge}</span>`).join("")}</div>
        <h3>Weekly and Monthly Charts</h3>
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
      <p class="eyebrow">Parent Reports</p>
      <h2>${report.title}</h2>
      <p>This update uses family-friendly language and avoids educational jargon.</p>
      <div class="report-actions">
        <button class="primary-button" data-action="generate-report">Refresh Report</button>
        <button class="secondary-button" data-action="download-placeholder">Download PDF</button>
        <button class="secondary-button" data-action="print-view">Print</button>
        <button class="secondary-button" data-action="copy-material">Share Copy</button>
      </div>
    </section>
    <section class="profile-grid">
      ${profileCard("Strengths", report.strengths)}
      ${profileCard("Areas Improving", report.improving)}
      ${profileCard("Areas Needing Support", report.support)}
      ${profileCard("Suggested Home Activities", report.homeActivities)}
      <article class="profile-card">
        <h3>Charts</h3>
        ${progressMetric("Weekly success", report.summary.successAverage)}
        ${progressMetric("Communication", report.summary.communicationAverage)}
      </article>
      <article class="profile-card">
        <h3>Positive Reinforcement</h3>
        <p>Specific praise, short choice breaks, helper jobs, and calm encouragement are good matches right now.</p>
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
          <p class="eyebrow">AI Teaching Coach</p>
          <h2>Chat with Atlas, your PIA Assistant!</h2>
          <p>Atlas brings calm guidance, practical ideas, and classroom-ready strategies shaped around ${state.currentStudent.name}'s plan.</p>
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
          <span>Message Atlas</span>
          <input id="chatInput" placeholder="Ask for a strategy, lesson idea, or family-friendly explanation..." autocomplete="off" />
        </label>
        <button class="primary-button" type="submit">Send</button>
      </form>
    </section>
  `;
}

function renderSettings() {
  return `
    <section class="settings-grid">
      <article class="settings-panel">
        <p class="eyebrow">Appearance</p>
        <h2>Settings</h2>
        <label class="toggle"><span>Dark mode</span><input type="checkbox" ${state.theme === "dark" ? "checked" : ""} data-action="toggle-theme" /></label>
        ${field("Language", select("language", ["English", "Spanish", "French", "Polish"]))}
        ${field("Theme color", `<input type="color" id="themeColor" value="#3454d1" />`)}
        ${field("Font size", `<input id="fontSize" type="range" min="0.9" max="1.2" step="0.05" value="1" />`)}
      </article>
      <article class="settings-panel">
        <p class="eyebrow">Privacy and Accessibility</p>
        <h2>Controls</h2>
        <label class="toggle"><span>Notifications</span><input type="checkbox" checked /></label>
        <label class="toggle"><span>High contrast focus indicators</span><input type="checkbox" checked /></label>
        <label class="toggle"><span>Screen-reader status updates</span><input type="checkbox" checked /></label>
        <div class="toolbar">
          <button class="secondary-button" data-action="backup-placeholder">Backup Placeholder</button>
          <button class="danger-button" data-action="clear-memory">Clear Memory</button>
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
    document.getElementById("planText").value = `Student Name: ${file.name.replace(/\.[^.]+$/, "")}
Age: 9
Diagnosis: Plan uploaded from ${file.name}.
Communication: Placeholder extraction for PDF/DOCX. Replace with a document parser or AI API later.
Immediate objective: Use visual support during classroom routine.
Long-term goal: Increase independence across the school day.`;
  }
  toast(`${file.name} loaded into parser.`);
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
  state.activity.unshift({ title: "Student plan parsed", detail: `${student.name}'s profile was generated.` });
  refreshDerivedState();
  output.innerHTML = `<section class="glass-card"><h3>${student.name}'s profile is ready</h3><p>${student.communication}</p><button class="primary-button" data-route="students">View Student Profile</button></section>`;
  toast("Student profile created from placeholder parser.");
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
  openModal("Tool Details", tool.title, `
    <div class="profile-top">
      <div class="tool-image">${tool.image}</div>
      <div>
        <p>${tool.description}</p>
        <div class="badge-row">
          <span class="badge">${tool.category}</span>
          <span class="badge">${tool.ageRange}</span>
          <span class="badge">${tool.techLevel}</span>
          <span class="badge">${tool.cost}</span>
        </div>
      </div>
    </div>
    <h3>Teacher Notes</h3>
    <p>${tool.notes}</p>
    <h3>Video</h3>
    <p>Video preview placeholder: connect a secure media library or training clip later.</p>
  `);
}

function showLesson(toolId) {
  const tool = educationalTools.find((item) => item.id === toolId);
  const lesson = generateLesson(tool, state.currentStudent.name);
  openModal("Generated Lesson", lesson.title, `
    <p><strong>Duration:</strong> ${lesson.duration}</p>
    ${profileCard("Steps", lesson.steps)}
    ${profileCard("Materials", lesson.materials)}
  `);
}

function showVideoPlaceholder(toolId) {
  const tool = educationalTools.find((item) => item.id === toolId);
  if (!tool) return;
  openModal(
    "Video Preview",
    `${tool.title} training clip`,
    "<p>This placeholder is ready for a future secure video library. For now, use the teacher notes and generated lesson to model the strategy.</p>"
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
  openModal("Tool Comparison", "Compare selected tools", compared.length ? `
    <div class="tools-grid">${toolCards(compared)}</div>
  ` : "<p>No tools selected for comparison yet.</p>");
}

function generateAACFromInput() {
  const prompt = document.getElementById("aacPrompt")?.value || "I want to teach hand washing.";
  state.lastMaterial = generateAAC(prompt);
  const output = document.getElementById("aacOutput");
  if (output) output.innerHTML = renderMaterial(state.lastMaterial);
  toast("AAC materials generated.");
}

async function copyMaterial() {
  const content = state.route === "aac" || state.route === "boards"
    ? materialToMarkdown(state.lastMaterial)
    : root.innerText;
  try {
    await navigator.clipboard.writeText(content);
    toast("Copied to clipboard.");
  } catch {
    toast("Copy is blocked by the browser, but the content is visible on screen.");
  }
}

function enableMaterialEditing() {
  document.querySelectorAll(".material-card, .board-cell").forEach((node) => node.setAttribute("contenteditable", "true"));
  toast("Material cards are editable now.");
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
  state.activity.unshift({ title: "Progress logged", detail: `${entry.goal}: ${entry.success}% success.` });
  refreshDerivedState();
  toast("Observation saved in memory.");
  navigate("progress");
}

function renderParentReport() {
  toast("Parent report refreshed from current progress data.");
  navigate("reports");
}

async function sendCoachMessage(message) {
  const clean = message.trim();
  if (!clean) return;
  state.chatMessages.push({ role: "teacher", text: clean, time: new Date() });
  navigate("coach");
  const log = document.getElementById("chatLog");
  log.insertAdjacentHTML("beforeend", `<div class="message ai" id="typingMessage">${atlasAvatar("small")}<div class="message-bubble atlas-bubble"><span class="spinner" style="width:1.2rem;height:1.2rem;border-width:2px;"></span> Atlas is thinking...</div></div>`);
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
    <div class="atlas-avatar ${size === "large" ? "atlas-avatar-large" : ""}" aria-label="Atlas mascot avatar" role="img">
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
    { title: "Parent report", detail: `${state.currentStudent.name}'s family-friendly update`, route: "reports" },
    { title: "AAC lesson", detail: state.lastMaterial?.topic || "hand washing supports", route: "aac" }
  ].filter((item) => `${item.title} ${item.detail}`.toLowerCase().includes(query));

  searchResults.innerHTML = `<strong>${items.length} result${items.length === 1 ? "" : "s"}</strong>${items.slice(0, 6).map((item) => `<button class="search-result" data-route="${item.route}"><strong>${item.title}</strong><br><span>${item.detail}</span></button>`).join("")}`;
  searchResults.classList.remove("hidden");
}

function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = state.theme;
  toast(`${state.theme === "dark" ? "Dark" : "Light"} mode enabled.`);
}

function clearMemory() {
  state.students = state.students.slice(0, 1);
  state.currentStudent = state.students[0];
  state.savedTools.clear();
  state.favoriteTools.clear();
  state.compareTools.clear();
  state.activity = [{ title: "Memory cleared", detail: "Only the sample student remains in this session." }];
  toast("In-memory session data cleared.");
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
  return `<select id="${id}">${options.map((option) => `<option>${option}</option>`).join("")}</select>`;
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
