export function renderDashboard(state) {
  const student = state.currentStudent;
  const progress = state.progressSummary;
  return `
    <section class="hero-panel fade-in">
      <div>
        <p class="eyebrow">Classroom command center</p>
        <h2>Welcome back, Ms. Carter</h2>
        <p>Turn IEP and PIA information into clear supports, routines, family updates, and daily teaching decisions.</p>
        <div class="hero-actions">
          <button class="primary-button" data-route="upload">Upload Student Plan</button>
          <button class="secondary-button" data-route="aac">Generate AAC Materials</button>
          <button class="secondary-button" data-route="coach">Open AI Coach</button>
        </div>
      </div>
      <div class="weekly-chart" aria-label="Weekly progress chart">
        ${[62, 70, 68, 74, 82].map((value, index) => `<span style="height:${value}%" title="Day ${index + 1}: ${value}%"></span>`).join("")}
      </div>
    </section>
    <section class="stats-grid">
      ${statCard("Students", state.students.length, "Active profiles")}
      ${statCard("Goals", student.longTermObjectives.length + student.immediateObjectives.length, "Current plan")}
      ${statCard("Progress", `${progress.successAverage}%`, progress.trend)}
      ${statCard("Saved Tools", state.savedTools.size, "Teacher toolkit")}
    </section>
    <section class="dashboard-grid">
      <article class="glass-card">
        <div class="card-header">
          <h3>Upcoming Goals</h3>
          <button class="text-button" data-route="students">View profile</button>
        </div>
        <ul class="clean-list">
          ${student.immediateObjectives.map((goal) => `<li><span class="status-dot"></span>${goal}</li>`).join("")}
        </ul>
      </article>
      <article class="glass-card">
        <div class="card-header">
          <h3>Recent Activity</h3>
          <button class="text-button" data-route="progress">Track</button>
        </div>
        <ul class="activity-list">
          ${state.activity.map((item) => `<li><strong>${item.title}</strong><span>${item.detail}</span></li>`).join("")}
        </ul>
      </article>
      <article class="glass-card wide-card">
        <div class="card-header">
          <h3>Recent AI Recommendations</h3>
          <button class="text-button" data-route="tools">Open matcher</button>
        </div>
        <div class="recommendation-row">
          ${state.recommendations.slice(0, 3).map((tool) => `
            <button class="mini-tool" data-tool-id="${tool.id}" data-action="tool-details">
              <span>${tool.image}</span>
              <strong>${tool.title}</strong>
              <small>${tool.goal}</small>
            </button>
          `).join("")}
        </div>
      </article>
    </section>
  `;
}

function statCard(label, value, detail) {
  return `
    <article class="stat-card">
      <p>${label}</p>
      <strong data-counter="${value}">${value}</strong>
      <span>${detail}</span>
    </article>
  `;
}
