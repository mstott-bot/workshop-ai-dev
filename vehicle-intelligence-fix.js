(function () {
  function $(id) {
    return document.getElementById(id);
  }

  function vehicleMatches(job, q) {
    return [
      job.reg,
      job.customer,
      job.phone,
      job.jobNo,
      job.technician,
      job.make,
      job.model,
      job.status,
      job.workRequired,
      job.complaint,
      job.findings,
      job.repair,
      job.parts,
      job.advisories,
      job.report
    ].join(" ").toLowerCase().includes(q);
  }

  function runVehicleIntelligenceSearch() {
    const input = $("vehicleHistorySearch");
    const filter = $("vehicleHistoryQuickFilter");
    const results = $("vehicleIntelligenceResults");
    const stats = $("vehicleIntelligenceStats");

    if (!input || !results) {
      alert("Vehicle Intelligence search elements not found.");
      return;
    }

    const q = input.value.trim().toLowerCase();
    
  let list =
  window.jobs ||
  JSON.parse(
    localStorage.getItem("workshopAIJobsV27") ||
    localStorage.getItem("workshopAIJobsV26") ||
    localStorage.getItem("workshopAIJobsV25") ||
    "[]"
  );

    if (q) {
      list = list.filter(job => vehicleMatches(job, q));
    }

    const f = filter ? filter.value : "all";

    if (f === "completed") {
      list = list.filter(j => typeof completed === "function" ? completed(j) : (j.status || "").includes("Complete") || (j.status || "").includes("Ready"));
    }

    if (f === "open") {
      list = list.filter(j => typeof completed === "function" ? !completed(j) : !(j.status || "").includes("Complete"));
    }

    if (f === "parts") {
      list = list.filter(j => (j.status || "").includes("Parts"));
    }

    if (f === "approval") {
      list = list.filter(j => (j.status || "").includes("Approval"));
    }

    if (stats) {
      stats.innerHTML = `
        <div class="stat"><strong>${list.length}</strong>Matches</div>
        <div class="stat"><strong>${list.filter(j => (j.status || "").includes("Ready")).length}</strong>Ready</div>
        <div class="stat"><strong>${list.filter(j => (j.status || "").includes("Parts")).length}</strong>Parts</div>
        <div class="stat"><strong>${list.filter(j => (j.status || "").includes("Approval")).length}</strong>Approval</div>
        <div class="stat"><strong>${list.filter(j => typeof completed === "function" ? completed(j) : false).length}</strong>Completed</div>
      `;
    }

    if (!list.length) {
      results.innerHTML = "<p class='muted'>No matching vehicle history found.</p>";
      return;
    }

    results.innerHTML = list.map(j => `
      <div class="job-card">
        <h3>${j.reg || "No reg"} — ${j.technician || "No technician"}</h3>
        <p><strong>Job:</strong> ${j.jobNo || "No job number"}</p>
        <p><strong>Customer:</strong> ${j.customer || "Not entered"} ${j.phone ? " | " + j.phone : ""}</p>
        <p><strong>Vehicle:</strong> ${j.make || ""} ${j.model || ""}</p>
        <p><strong>Status:</strong> ${j.status || "Not set"}</p>
        <p><strong>Work:</strong> ${j.workRequired || j.complaint || "No work details entered"}</p>
        <button onclick="showTimelineModal('${j.id}')">Timeline</button>
        <button onclick="openJob('${j.id}')">Open Job</button>
      </div>
    `).join("");
  }

  window.runVehicleIntelligenceSearch = runVehicleIntelligenceSearch;

  document.addEventListener("click", function (e) {
    if (e.target && e.target.id === "vehicleHistorySearchBtn") {
      e.preventDefault();
      runVehicleIntelligenceSearch();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && e.target && e.target.id === "vehicleHistorySearch") {
      e.preventDefault();
      runVehicleIntelligenceSearch();
    }
  });

  document.addEventListener("change", function (e) {
    if (e.target && e.target.id === "vehicleHistoryQuickFilter") {
      runVehicleIntelligenceSearch();
    }
  });
})();