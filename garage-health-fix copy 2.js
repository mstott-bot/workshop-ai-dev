/* Workshop AI OS v5.7.2 — Garage Health Popup Hard Fix
   This is deliberately independent from the Action Centre and Coach.
   It binds by:
   1) inline onclick on #healthScore
   2) normal click listener on #healthScore
   3) document-level capture listener for anything inside #healthScore
   4) safe fallback modal if the main drilldown function fails.
*/
(function(){
  "use strict";

  function byId(id){ return document.getElementById(id); }
  function esc(text){ return String(text || "").replace(/[&<>"]/g, function(c){ return ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"})[c]; }); }

  function fallbackGarageHealthModal(){
    const modal = byId("modal");
    const title = byId("modalTitle");
    const body = byId("modalTimeline");
    const healthEl = byId("healthScore");
    const healthText = healthEl ? healthEl.innerText : "Garage Health";

    if (title) title.textContent = "Garage Health Breakdown";
    if (body) {
      body.innerHTML = `
        <div class="gh-tabs">
          <button class="gh-tab active">📊 Overview</button>
        </div>
        <div class="timeline-item good">
          <strong>${esc(healthText)}</strong>
          <p>Garage Health is calculated from workshop efficiency, utilisation, completed work, carried-over work, parts delays, approvals and targets.</p>
        </div>
        <div class="timeline-item">
          <strong>What to check first</strong>
          <p>Clear parts delays, customer approvals, carried-over jobs and ready-for-collection vehicles. Keep technician timers and job statuses accurate.</p>
        </div>`;
    }
    if (modal) modal.classList.remove("hidden");
  }

  function openGarageHealth(event){
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
    }

    try {
      if (typeof window.showGarageHealthDrilldown === "function") {
        window.showGarageHealthDrilldown("why");
        const modal = byId("modal");
        if (modal && !modal.classList.contains("hidden")) return;
      }
    } catch(err) {
      console.warn("Garage Health drilldown failed, using fallback modal", err);
    }

    fallbackGarageHealthModal();
  }

  function bindGarageHealth(){
    const el = byId("healthScore");
    if (!el) return;

    el.style.cursor = "pointer";
    el.setAttribute("role", "button");
    el.setAttribute("tabindex", "0");
    el.title = "Click for Garage Health details";

    // Inline handler is intentionally used here as a belt-and-braces fix.
    el.onclick = openGarageHealth;

    if (el.dataset.ghHardFixBound !== "1") {
      el.dataset.ghHardFixBound = "1";
      el.addEventListener("click", openGarageHealth, true);
      el.addEventListener("keydown", function(event){
        if (event.key === "Enter" || event.key === " ") openGarageHealth(event);
      }, true);
    }
  }

  // Capture clicks even if the score innerHTML is replaced or child elements are clicked.
  if (!window.__garageHealthDocumentHardFix) {
    window.__garageHealthDocumentHardFix = true;
    document.addEventListener("click", function(event){
      const target = event.target && event.target.closest ? event.target.closest("#healthScore") : null;
      if (target) openGarageHealth(event);
    }, true);
  }

  function boot(){
    bindGarageHealth();
    setTimeout(bindGarageHealth, 50);
    setTimeout(bindGarageHealth, 250);
    setTimeout(bindGarageHealth, 750);
    setTimeout(bindGarageHealth, 1500);

    // Re-bind whenever the dashboard redraws.
    const el = byId("healthScore");
    if (el && !window.__garageHealthObserver) {
      window.__garageHealthObserver = new MutationObserver(bindGarageHealth);
      window.__garageHealthObserver.observe(el, {childList:true, subtree:true, characterData:true});
    }
  }

  window.openGarageHealth = openGarageHealth;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
