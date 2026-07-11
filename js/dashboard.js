export function renderDashboard(state) {
  const student = state.currentStudent;
  const progress = state.progressSummary;
  return `
    <section class="hero-panel fade-in">
      <div>
        <p class="eyebrow">Qendra e klasës</p>
        <h2>Mirë se u kthyet, mësuese Carter</h2>
        <p>Kthe informacionin e PIA/IEP në mbështetje të qarta, rutina, përditësime për familjen dhe vendime praktike për mësimdhënie.</p>
        <div class="hero-actions">
          <button class="primary-button" data-route="upload">Ngarko planin e nxënësit</button>
          <button class="secondary-button" data-route="aac">Krijo materiale AAC</button>
          <button class="secondary-button" data-route="coach">Hap Atlasin</button>
        </div>
      </div>
      <div class="weekly-chart" aria-label="Weekly progress chart">
        ${[62, 70, 68, 74, 82].map((value, index) => `<span style="height:${value}%" title="Day ${index + 1}: ${value}%"></span>`).join("")}
      </div>
    </section>
    <section class="stats-grid">
      ${statCard("Nxënës", state.students.length, "Profile aktive")}
      ${statCard("Objektiva", student.longTermObjectives.length + student.immediateObjectives.length, "Plani aktual")}
      ${statCard("Progres", `${progress.successAverage}%`, progress.trend)}
      ${statCard("Mjete të ruajtura", state.savedTools.size, "Paketa e mësuesit")}
    </section>
    <section class="dashboard-grid">
      <article class="glass-card">
        <div class="card-header">
          <h3>Objektivat e radhës</h3>
          <button class="text-button" data-route="students">Shiko profilin</button>
        </div>
        <ul class="clean-list">
          ${student.immediateObjectives.map((goal) => `<li><span class="status-dot"></span>${goal}</li>`).join("")}
        </ul>
      </article>
      <article class="glass-card">
        <div class="card-header">
          <h3>Aktivitetet e fundit</h3>
          <button class="text-button" data-route="progress">Regjistro</button>
        </div>
        <ul class="activity-list">
          ${state.activity.map((item) => `<li><strong>${item.title}</strong><span>${item.detail}</span></li>`).join("")}
        </ul>
      </article>
      <article class="glass-card wide-card">
        <div class="card-header">
          <h3>Rekomandimet e fundit nga AI</h3>
          <button class="text-button" data-route="tools">Hap përputhësin</button>
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
