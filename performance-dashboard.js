(function () {
  function $(id) {
    return document.getElementById(id);
  }

  function getJobs() {
    return window.jobs || JSON.parse(localStorage.getItem("workshopAIJobsV27") || "[]");
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function money(n) {
    return "£" + Number(n || 0).toFixed(0);
  }

  function buildPerformanceDashboard() {
    const commandScreen = $("commandScreen");
    if (!commandScreen || $("performanceDashboardCard")) return;

    const card = document.createElement("div");
    card.className = "card";
    card.id = "performanceDashboardCard";
    card.innerHTML = `
      <h2>Workshop Performance Dashboard</h2>
      <div id="performanceDashboardStats" class="stats"></div>
      <div id="performanceDashboardCoach" class="coach-list"></div>
    `;

    commandScreen.insertBefore(card, commandScreen.children[2]);
  }

  function renderPerformanceDashboard() {
    buildPerformanceDashboard();

    const stats = $("performanceDashboardStats");
    const coach = $("performanceDashboardCoach");
    if (!stats || !coach) return;

    const jobs = getJobs();
    const today = todayISO();
    const todayJobs = jobs.filter(j => (j.bookingDate || "").slice(0, 10) === today);

    const labourHours = todayJobs.reduce((s, j) => s + Number(j.hours || 0), 0);
    const actualHours = todayJobs.reduce((s, j) => s + Number(j.actualHours || 0), 0);
    const completedJobs = todayJobs.filter(j => (j.status || "").includes("Complete") || (j.status || "").includes("Ready")).length;
const carryOvers = jobs.filter(j =>
  (j.status || "").includes("Carry")
).length;
    const partsWaiting = jobs.filter(j => (j.status || "").includes("Parts")).length;

    const labourRate = 70;
    const revenue = labourHours * labourRate;
    const recovery = actualHours > 0 ? (labourHours / actualHours) * 100 : 0;

    stats.innerHTML = `
      <div class="stat"><strong>${labourHours.toFixed(1)}</strong>Labour Sold Today</div>
      <div class="stat"><strong>${money(revenue)}</strong>Revenue Today</div>
      <div class="stat"><strong>${recovery.toFixed(0)}%</strong>Labour Recovery</div>
      <div class="stat"><strong>${completedJobs}</strong>Jobs Completed</div>
      <div class="stat"><strong>${carryOvers}</strong>Carry Overs</div>
      <div class="stat"><strong>${partsWaiting}</strong>Parts Waiting</div>
    `;

    coach.innerHTML = `
      <div class="coach-card ${recovery >= 95 ? "good" : recovery >= 80 ? "warn" : "bad"}">
        <h3>AI Performance Forecast</h3>
        <p>Today has ${labourHours.toFixed(1)} labour hours sold, producing a forecast labour revenue of ${money(revenue)} at £${labourRate}/hr.</p>
        <p>Current labour recovery is ${recovery.toFixed(0)}%. ${carryOvers ? carryOvers + " job(s) are carrying over and should be reviewed first." : "No carry-over pressure currently showing."}</p>
      </div>
    `;
  }

  document.addEventListener("DOMContentLoaded", function () {
    setTimeout(renderPerformanceDashboard, 500);
  });

  const oldRender = window.render;
  if (typeof oldRender === "function") {
    window.render = function () {
      oldRender.apply(this, arguments);
      setTimeout(renderPerformanceDashboard, 100);
    };
  }

  window.renderPerformanceDashboard = renderPerformanceDashboard;
})();