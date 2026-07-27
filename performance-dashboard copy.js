(function () {
  function $(id) { return document.getElementById(id); }
  function getJobs() { return window.jobs || JSON.parse(localStorage.getItem("workshopAIJobsV27") || "[]"); }
  function getTargets() { return typeof window.getWorkshopTargets==="function" ? window.getWorkshopTargets() : JSON.parse(localStorage.getItem("pcaTargetsV11") || "{}"); }
  function todayISO() { return new Date().toISOString().slice(0, 10); }
  function money(n) { return "£" + Number(n || 0).toFixed(0); }
  function isCompleted(j){ const s=String(j.status||""); return !!j.completedAt || /Complete|Ready|Collected|Closed/i.test(s); }
  function activityDate(j){ return String(j.completedAt||j.finishedAt||j.bookingDate||j.createdAt||"").slice(0,10); }
  function appliedRate(j,targets){ if(typeof window.appliedJobRate==="function") return window.appliedJobRate(j); const saved=Number(j.labourRateSnapshot); if(saved>0)return saved; const t=String(j.type||"Retail").toLowerCase(); return t==="warranty"?Number(targets.warrantyRate||70):t==="internal"?Number(targets.internalRate||45):Number(targets.retailRate||70); }
  function buildPerformanceDashboard() {
    const commandScreen = $("commandScreen");
    if (!commandScreen || $("performanceDashboardCard")) return;
    const card = document.createElement("div");
    card.className = "card"; card.id = "performanceDashboardCard";
    card.innerHTML = `<h2>Workshop Performance Dashboard — Month to Date</h2><div id="performanceDashboardStats" class="stats"></div><div id="performanceDashboardCoach" class="coach-list"></div>`;
    commandScreen.insertBefore(card, commandScreen.children[2]);
  }
  function renderPerformanceDashboard() {
    buildPerformanceDashboard();
    const stats=$("performanceDashboardStats"), coach=$("performanceDashboardCoach");
    if(!stats||!coach)return;
    const jobs=getJobs(), targets=getTargets(), today=todayISO(), month=today.slice(0,7);
    const monthJobs=jobs.filter(j=>activityDate(j).slice(0,7)===month);
    const completedMonth=monthJobs.filter(isCompleted);
    const labourHours=completedMonth.reduce((s,j)=>s+Number(j.hours||0),0);
    const actualHours=completedMonth.reduce((s,j)=>s+Number(j.actualHours||0),0);
    const completedJobs=completedMonth.length;
    const carryOvers=jobs.filter(j=>{const d=String(j.bookingDate||"").slice(0,10);return d&&d<today&&!isCompleted(j)}).length;
    const partsWaiting=jobs.filter(j=>/Parts/i.test(String(j.status||""))&&!isCompleted(j)).length;
    const revenue=completedMonth.reduce((s,j)=>s+Number(j.hours||0)*appliedRate(j,targets),0);
    const recovery=actualHours>0?(labourHours/actualHours)*100:0;
    const productivity=Number(targets.availableHours||0)>0?(actualHours/Number(targets.availableHours))*100:0;
    const utilisation=Number(targets.availableHours||0)>0?(labourHours/Number(targets.availableHours))*100:0;
    stats.innerHTML=`
      <div class="stat"><strong>${labourHours.toFixed(1)}</strong>Labour Sold MTD</div>
      <div class="stat"><strong>${money(revenue)}</strong>Revenue MTD</div>
      <div class="stat"><strong>${recovery.toFixed(0)}%</strong>Labour Recovery</div>
      <div class="stat"><strong>${productivity.toFixed(0)}%</strong>Productivity</div>
      <div class="stat"><strong>${utilisation.toFixed(0)}%</strong>Utilisation</div>
      <div class="stat"><strong>${completedJobs}</strong>Jobs Completed MTD</div>
      <div class="stat"><strong>${carryOvers}</strong>Carry Overs</div>
      <div class="stat"><strong>${partsWaiting}</strong>Parts Waiting</div>`;
    const monthlyTarget=Number(targets.monthlyRevenue||0), progress=monthlyTarget>0?(revenue/monthlyTarget)*100:null;
    coach.innerHTML=`<div class="coach-card ${recovery>=Number(targets.labourRecovery||90)?"good":recovery>=80?"warn":"bad"}">
      <h3>AI Monthly Performance Forecast</h3>
      <p>${labourHours.toFixed(1)} labour hours have produced ${money(revenue)} month-to-date using the rate saved against each job.</p>
      <p>Labour recovery is ${recovery.toFixed(0)}%, productivity ${productivity.toFixed(0)}% and utilisation ${utilisation.toFixed(0)}%.</p>
      <p>${progress===null?"Set a monthly revenue target to see progress.":`Monthly revenue target progress is ${progress.toFixed(0)}%.`} ${carryOvers?carryOvers+" carry-over job(s) should be reviewed first.":"No carry-over pressure currently showing."}</p>
    </div>`;
  }
  document.addEventListener("DOMContentLoaded",()=>setTimeout(renderPerformanceDashboard,500));
  const oldRender=window.render;
  if(typeof oldRender==="function"){window.render=function(){oldRender.apply(this,arguments);setTimeout(renderPerformanceDashboard,100);};}
  window.renderPerformanceDashboard=renderPerformanceDashboard;
})();