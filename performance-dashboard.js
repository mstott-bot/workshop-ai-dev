(function () {
  function $(id) { return document.getElementById(id); }
  function getJobs() { return window.jobs || JSON.parse(localStorage.getItem("workshopAIJobsV27") || "[]"); }
  function getTargets() { return typeof window.getWorkshopTargets==="function" ? window.getWorkshopTargets() : JSON.parse(localStorage.getItem("pcaTargetsV11") || "{}"); }
  function todayISO() { return new Date().toISOString().slice(0, 10); }
  function money(n) { return "£" + Number(n || 0).toFixed(0); }
  function isCompleted(j){ const s=String(j.status||""); return !!j.completedAt || /Complete|Ready|Collected|Closed/i.test(s); }
  function activityDate(j){ return String(j.completedAt||j.finishedAt||j.bookingDate||j.createdAt||"").slice(0,10); }
  function appliedRate(j,targets){ if(typeof window.appliedJobRate==="function") return window.appliedJobRate(j); const saved=Number(j.labourRateSnapshot); if(saved>0)return saved; const t=String(j.type||"Retail").toLowerCase(); return t==="warranty"?Number(targets.warrantyRate||70):t==="internal"?Number(targets.internalRate||45):Number(targets.retailRate||70); }
  function actualClocked(j){
    let total=Number(j.actualHours||0);
    if(j.startedAt&&!j.finishedAt){
      const start=new Date(j.startedAt),end=new Date();
      if(Number.isFinite(start.getTime()))total+=Math.max(0,(end-start)/3600000);
    }
    return total;
  }
  function isoLocal(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
  function runningMonthAvailableHours(targets){
    const today=new Date(),start=new Date(today.getFullYear(),today.getMonth(),1,12,0,0,0),end=new Date(today.getFullYear(),today.getMonth(),today.getDate(),12,0,0,0);
    if(typeof window.workshopAvailabilityForDate==="function"){
      let total=0,cursor=new Date(start);
      while(cursor<=end){
        const day=cursor.getDay();
        if(day!==0&&day!==6){
          const a=window.workshopAvailabilityForDate(isoLocal(cursor));
          total+=Number(a?.totalHours||0);
        }
        cursor.setDate(cursor.getDate()+1);
      }
      if(total>0)return total;
    }

    // Fallback: targets.availableHours is the monthly capacity, so use the
    // elapsed working-day proportion rather than comparing MTD activity
    // against the whole month's capacity.
    const monthly=Number(targets.availableHours||0);
    if(monthly<=0)return 0;
    let elapsed=0,totalWorking=0;
    const monthEnd=new Date(today.getFullYear(),today.getMonth()+1,0,12,0,0,0);
    let cursor=new Date(start);
    while(cursor<=monthEnd){
      const weekday=cursor.getDay()!==0&&cursor.getDay()!==6;
      if(weekday){
        totalWorking++;
        if(cursor<=end)elapsed++;
      }
      cursor.setDate(cursor.getDate()+1);
    }
    return totalWorking>0?monthly*(elapsed/totalWorking):0;
  }
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
    const monthJobs=jobs.filter(j=>{
      const booked=String(j.bookingDate||"").slice(0,7);
      const activity=activityDate(j).slice(0,7);
      const started=String(j.startedAt||"").slice(0,7);
      return booked===month||activity===month||started===month;
    });
    const completedMonth=monthJobs.filter(isCompleted);
    const financeMTD=window.WAI099FinanceBridge?.getMonthlyPerformanceSummary?.(month)||null;
    const labourHours=Number(financeMTD?.labourHoursSold||0);
    const revenue=Number(financeMTD?.actualRevenue||0);
    const actualHours=monthJobs.reduce((s,j)=>s+actualClocked(j),0);
    const completedJobs=completedMonth.length;
    const carryOvers=jobs.filter(j=>{const d=String(j.bookingDate||"").slice(0,10);return d&&d<today&&!isCompleted(j)}).length;
    const partsWaiting=jobs.filter(j=>/Parts/i.test(String(j.status||""))&&!isCompleted(j)).length;
    const availableHours=runningMonthAvailableHours(targets);
    const todayKey=today;
    const bookedHoursMTD=jobs
      .filter(j=>{
        const d=String(j.bookingDate||'').slice(0,10);
        return d && d.slice(0,7)===month && d<=todayKey;
      })
      .reduce((sum,j)=>sum+Math.max(0,Number(j.hours||0)),0);
    const recovery=actualHours>0?(labourHours/actualHours)*100:0;
    const productivity=availableHours>0?(actualHours/availableHours)*100:0;
    const utilisation=availableHours>0?(bookedHoursMTD/availableHours)*100:0;
    stats.innerHTML=`
      <div class="stat"><strong>${labourHours.toFixed(1)}</strong>Labour Sold MTD</div>
      <div class="stat"><strong>${money(revenue)}</strong>Revenue MTD</div>
      <div class="stat"><strong>${recovery.toFixed(0)}%</strong>Labour Recovery</div>
      <div class="stat" title="Productive job-clocked hours month-to-date ÷ available attendance hours month-to-date"><strong>${productivity.toFixed(0)}%</strong>Productivity</div>
      <div class="stat" title="Booked/allocated labour hours month-to-date ÷ available attendance hours month-to-date"><strong>${utilisation.toFixed(0)}%</strong>Utilisation</div>
      <div class="stat"><strong>${completedJobs}</strong>Jobs Completed MTD</div>
      <div class="stat"><strong>${carryOvers}</strong>Carry Overs</div>
      <div class="stat"><strong>${partsWaiting}</strong>Parts Waiting</div>`;
    const monthlyTarget=Number(targets.monthlyRevenue||0), progress=monthlyTarget>0?(revenue/monthlyTarget)*100:null;
    coach.innerHTML=`<div class="coach-card ${recovery>=Number(targets.labourRecovery||90)?"good":recovery>=80?"warn":"bad"}">
      <h3>AI Monthly Performance Forecast</h3>
      <p>${labourHours.toFixed(1)} invoiced labour hours and ${money(revenue)} actual ex-VAT invoice revenue have been issued month-to-date, with credits deducted.</p>
      <p>Running-month productive time is ${actualHours.toFixed(1)} hrs against ${availableHours.toFixed(1)} hrs of attendance capacity. Productivity is ${productivity.toFixed(0)}% from productive clocked hours ÷ available attendance. Utilisation is ${utilisation.toFixed(0)}% from ${bookedHoursMTD.toFixed(1)} booked/allocated hours ÷ available attendance. Labour recovery is ${recovery.toFixed(0)}% from invoiced labour hours ÷ productive clocked hours.</p>
      <p>${progress===null?"Set a monthly revenue target to see progress.":`Monthly revenue target progress is ${progress.toFixed(0)}%.`} ${carryOvers?carryOvers+" carry-over job(s) should be reviewed first.":"No carry-over pressure currently showing."}</p>
    </div>`;
  }
  document.addEventListener("DOMContentLoaded",()=>setTimeout(renderPerformanceDashboard,500));
  window.addEventListener('wai-finance-updated',()=>setTimeout(renderPerformanceDashboard,50));
  const oldRender=window.render;
  if(typeof oldRender==="function"){window.render=function(){oldRender.apply(this,arguments);setTimeout(renderPerformanceDashboard,100);};}
  window.renderPerformanceDashboard=renderPerformanceDashboard;
})();