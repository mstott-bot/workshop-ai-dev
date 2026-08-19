/* Workshop AI OS v5.0.4 — Independent Coach Button Fix
   This file only repairs the Workshop Coach panel/buttons.
   It does not change job board logic, timers, parts, reports, or layout. */
(function(){
  "use strict";

  const JOB_KEYS = [
    "workshopAIJobsV27","workshopAIJobsV26","workshopAIJobsV25","workshopAIJobsV24",
    "workshopAIJobsV23","workshopAIJobsV22","workshopAIJobsV21",
    "pcaJobsV11","pcaJobsV10","pcaJobsV09","pcaJobsV08","pcaJobsV07","pcaJobsV06"
  ];
  const TARGET_KEYS = ["pcaTargetsV11","pcaTargetsV10","pcaTargetsV09","pcaTargetsV08","pcaTargetsV07","pcaTargetsV06"];
  let mode = "morning";

  function byId(id){ return document.getElementById(id); }
  function parseFirst(keys, fallback){
    for(const key of keys){
      try{
        const raw = localStorage.getItem(key);
        if(raw) return JSON.parse(raw);
      }catch(e){}
    }
    return fallback;
  }
  function getJobs(){ return Array.isArray(parseFirst(JOB_KEYS, [])) ? parseFirst(JOB_KEYS, []) : []; }
  function getTargets(){ return parseFirst(TARGET_KEYS, {availableHours:0,efficiency:95,retailHours:0,internalHours:0,warrantyHours:0,internalCars:0,labourRate:80}); }
  function todayISO(){ return new Date().toISOString().split("T")[0]; }
  function completed(j){ return !!j.completedAt || String(j.status||"").includes("Ready") || String(j.status||"").includes("Complete") || String(j.status||"").includes("Closed"); }
  function num(v){ return Number(v||0); }
  function pct(n){ return n===null || n===undefined || !isFinite(n) ? "Not available" : Number(n).toFixed(0)+"%"; }
  function effPct(n){ return n===null || n===undefined || !isFinite(n) ? "Not available" : Number(n)>200 ? "200%+" : Number(n).toFixed(0)+"%"; }
  function money(n){ return "£"+Math.round(Number(n||0)).toLocaleString("en-GB"); }
  function hours(n){ return Number(n||0).toFixed(1)+" hrs"; }
  function escapeHtml(str){
    return String(str ?? "").replace(/[&<>'"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[ch]));
  }
  function metrics(){
    const jobs = getJobs();
    const targets = getTargets();
    const today = todayISO();
    const todayJobs = jobs.filter(j => (j.bookingDate || today) === today);
    const open = jobs.filter(j => !completed(j));
    const waitingParts = open.filter(j => String(j.status||"").includes("Awaiting Parts"));
    const waitingApproval = open.filter(j => String(j.status||"").includes("Approval") || String(j.auth||"").includes("Awaiting"));
    const ready = jobs.filter(j => String(j.status||"").includes("Ready"));
    const unified = typeof window.getUnifiedWorkshopCapacity === "function"
      ? window.getUnifiedWorkshopCapacity()
      : null;
    const allowed = unified ? unified.sold : todayJobs.reduce((s,j)=>s+num(j.hours),0);
    const actual = todayJobs.reduce((s,j)=>s+num(j.actualHours),0);
    const efficiency = actual > 0 ? (allowed / actual) * 100 : null;
    const available = unified ? unified.available : (num(targets.availableHours) || Math.max(8, todayJobs.length * 2));
    const used = unified ? unified.used : (available > 0 ? (allowed / available) * 100 : null);
    const remaining = unified ? unified.remaining : (available - allowed);
    const labourRate = num(targets.labourRate || targets.hourlyRate || 80);
    const opportunity = Math.max(0, remaining) * labourRate;
    const master = typeof window.getMasterGarageHealthSnapshot === "function"
      ? window.getMasterGarageHealthSnapshot()
      : null;
    const health = master ? master.score : 0;
    return {jobs,todayJobs,open,waitingParts,waitingApproval,ready,allowed,actual,efficiency,available,used,remaining,labourRate,opportunity,health};
  }
  function priorityCards(m){
    const cards=[];
    if(m.waitingApproval.length){
      cards.push(["warn","Call customers awaiting authorisation",`${m.waitingApproval.length} job(s) need customer approval before work can move on.`,"High"]);
    }
    if(m.waitingParts.length){
      cards.push(["warn","Check parts ETAs",`${m.waitingParts.length} job(s) are waiting for parts. Review suppliers and update the Service Manager board.`,"Delay risk"]);
    }
    if(m.ready.length){
      cards.push(["good","Update ready-for-collection customers",`${m.ready.length} vehicle(s) are ready. Contact customers and arrange collection/payment.`,"Customer update"]);
    }
    if(m.remaining > 0.5){
      cards.push(["good","Use spare capacity",`There are about ${hours(m.remaining)} spare today. Bring forward retail/internal work if possible.`,money(m.opportunity)]);
    }
    if(m.remaining < 0){
      cards.push(["bad","Workshop is over capacity",`The diary is overbooked by ${hours(Math.abs(m.remaining))}. Reallocate or move lower-priority work.`,"Urgent"]);
    }
    if(!cards.length){
      cards.push(["good","Maintain current control","No urgent workshop blockers found. Keep statuses and timelines updated.","Stable"]);
    }
    return cards.map((c,i)=>`<div class="coach-card ${c[0]}"><div class="coach-priority-row"><div><h3>${i+1}. ${escapeHtml(c[1])}</h3><p>${escapeHtml(c[2])}</p></div><strong>${escapeHtml(c[3])}</strong></div></div>`).join("");
  }
  function renderMission(m){
    const cls = m.health >= 85 ? "good" : m.health >= 65 ? "warn" : "bad";
    const oneThing = m.waitingApproval.length ? "Call customers waiting for approval first." :
      m.waitingParts.length ? "Check parts ETAs before more work is delayed." :
      m.ready.length ? "Contact ready-for-collection customers." :
      "Keep the workshop moving and update job statuses cleanly.";
    return `<div class="coach-one-thing"><h3>One Thing Today</h3><p>${oneThing}</p></div>
      <div class="coach-mission-grid">
        <div class="stat ${cls}"><strong class="coach-score">${m.health}</strong>Garage Health</div>
        <div class="stat"><strong>${m.todayJobs.length}</strong>Today's Jobs</div>
        <div class="stat ${m.remaining>=0?'good':'bad'}"><strong>${Math.abs(m.remaining).toFixed(1)}</strong>${m.remaining>=0?'Hours Spare':'Hours Over'}</div>
        <div class="stat ${m.waitingParts.length?'warn':'good'}"><strong>${m.waitingParts.length}</strong>Waiting Parts</div>
        <div class="stat ${m.waitingApproval.length?'warn':'good'}"><strong>${m.waitingApproval.length}</strong>Awaiting Approval</div>
      </div>`;
  }
  function renderPanel(m){
    if(mode === "live"){
      return `<h3>Live Priorities</h3>${priorityCards(m)}<h3>Workshop Snapshot</h3>
        <div class="coach-card good"><p><strong>Allowed hours today:</strong> ${hours(m.allowed)}</p><p><strong>Actual hours:</strong> ${hours(m.actual)}</p><p><strong>Efficiency:</strong> ${effPct(m.efficiency)}</p><p><strong>Capacity used:</strong> ${pct(m.used)}</p></div>`;
    }
    if(mode === "end"){
      return `<h3>End of Day Summary</h3><pre>WORKSHOP AI END OF DAY BRIEFING\n\nJobs today: ${m.todayJobs.length}\nOpen jobs: ${m.open.length}\nReady for collection: ${m.ready.length}\nWaiting for parts: ${m.waitingParts.length}\nWaiting for customer approval: ${m.waitingApproval.length}\n\nAllowed hours: ${m.allowed.toFixed(1)}\nActual hours: ${m.actual.toFixed(1)}\nEfficiency: ${effPct(m.efficiency)}\n\nRecommendation:\n${m.waitingParts.length?'Check parts ETAs and update customers where needed.':m.waitingApproval.length?'Prioritise customer approval calls.':'Workshop looks controlled. Prepare tomorrow’s work.'}</pre>`;
    }
    return `<h3>Morning Briefing</h3><pre>WORKSHOP AI MORNING BRIEFING\n\nToday's jobs: ${m.todayJobs.length}\nOpen carried jobs: ${m.open.length}\nAllocated hours today: ${m.allowed.toFixed(1)}\nCapacity used: ${pct(m.used)}\n\nWaiting for parts: ${m.waitingParts.length}\nWaiting for approval: ${m.waitingApproval.length}\nReady for collection: ${m.ready.length}\n\nFirst action:\n${m.waitingApproval.length?'Call customers awaiting approval.':m.waitingParts.length?'Check parts ETAs.':m.ready.length?'Update ready-for-collection customers.':'Keep job statuses and technician notes updated.'}</pre><h3>Top Priorities</h3>${priorityCards(m)}`;
  }
  function renderCoach(){
    const mission = byId("workshopCoachMission");
    const panel = byId("workshopCoachPanel");
    if(!mission || !panel) return;
    const m = metrics();
    mission.innerHTML = renderMission(m);
    panel.innerHTML = renderPanel(m);
    document.querySelectorAll("#workshopCoachTabs .gh-tab").forEach(btn => btn.classList.remove("active"));
    const idx = {morning:0,live:1,end:2}[mode] || 0;
    document.querySelectorAll("#workshopCoachTabs .gh-tab")[idx]?.classList.add("active");
  }
  function setMode(nextMode){
    mode = ["morning","live","end"].includes(nextMode) ? nextMode : "morning";
    renderCoach();
  }
  function bindButtons(){
    const tabs = document.querySelectorAll("#workshopCoachTabs .gh-tab");
    tabs.forEach((btn,idx)=>{
      const nextMode = ["morning","live","end"][idx];
      btn.type = "button";
      btn.removeAttribute("onclick");
      btn.addEventListener("click", function(event){
        event.preventDefault();
        event.stopPropagation();
        setMode(nextMode);
      });
    });
  }
  function boot(){
    bindButtons();
    renderCoach();
    // Re-render after the original app has finished drawing.
    setTimeout(renderCoach, 100);
    setTimeout(renderCoach, 500);
  }
  window.setWorkshopCoachMode = setMode;
  window.renderWorkshopCoachMissionControl = renderCoach;
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
