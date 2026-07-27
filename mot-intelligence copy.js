/* Workshop AI WAI-084 — MOT Intelligence
   Adds a vehicle-centred MOT workflow without duplicating workshop jobs.
   MOT records live inside the existing job object and key MOT stages update
   the Live Workshop Board status automatically. */
(function(){
  "use strict";

  const MOT_STAGES = [
    "Booked",
    "Testing",
    "Passed",
    "Passed with Advisories",
    "Failed – Awaiting Authorisation",
    "Repairs in Progress",
    "Awaiting Retest",
    "Passed After Retest",
    "Ready for Collection"
  ];

  const STAGE_META = {
    "Booked": {icon:"📅", cls:"mot-booked"},
    "Testing": {icon:"🔵", cls:"mot-testing"},
    "Passed": {icon:"✅", cls:"mot-passed"},
    "Passed with Advisories": {icon:"⚠️", cls:"mot-advisory"},
    "Failed – Awaiting Authorisation": {icon:"🔴", cls:"mot-failed"},
    "Repairs in Progress": {icon:"🔧", cls:"mot-repair"},
    "Awaiting Retest": {icon:"🔄", cls:"mot-retest"},
    "Passed After Retest": {icon:"✅", cls:"mot-passed"},
    "Ready for Collection": {icon:"🚗", cls:"mot-ready"}
  };

  function jobStore(){
    try { return (typeof jobs !== "undefined" && Array.isArray(jobs)) ? jobs : (Array.isArray(window.jobs) ? window.jobs : []); }
    catch(e){ return Array.isArray(window.jobs) ? window.jobs : []; }
  }
  function targetStore(){
    try { return (typeof targets !== "undefined" && targets) ? targets : (window.targets||{}); }
    catch(e){ return window.targets||{}; }
  }

  function money(v){ return "£" + Number(v||0).toFixed(0); }
  function dateKey(v){ return String(v||"").slice(0,10); }
  function text(v,fallback="—"){ return String(v??"").trim() || fallback; }
  function regOf(job){ return text(job.reg||job.registration||job.vehicleReg,"Registration not entered").toUpperCase(); }
  function customerOf(job){ return text(job.customer||job.customerName,"Customer not entered"); }
  function technicianOf(job,rec){ return text((rec&&rec.tester)||job.technician||job.tech,"Unassigned"); }
  function vehicleOf(job){ const v=[job.make,job.model].filter(Boolean).join(" ").trim(); return v||"Vehicle details not entered"; }
  function isMOTJob(job){ return !!job && job.mot && job.mot !== "None"; }
  function isMOTClosed(stage){ return ["Passed","Passed After Retest","Ready for Collection"].includes(stage); }

  function ensureMOT(job){
    if(!job.motRecord){
      job.motRecord={
        stage:"Booked",
        tester:job.technician||"",
        testStartedAt:null,
        testCompletedAt:null,
        firstTimePass:null,
        advisoryValue:0,
        authorisedValue:0,
        declinedValue:0,
        advisoryNotes:"",
        failureNotes:"",
        retestDueAt:null,
        updatedAt:new Date().toISOString()
      };
    }
    if(!job.motRecord.stage) job.motRecord.stage="Booked";
    return job.motRecord;
  }

  function motJobs(){
    return jobStore().filter(isMOTJob).map(j=>{ ensureMOT(j); return j; });
  }

  function addMOTTimeline(job,title,detail,type="mot"){
    if(typeof window.addTimeline === "function") window.addTimeline(job,title,detail,type);
    else {
      job.timeline=job.timeline||[];
      job.timeline.push({time:new Date().toISOString(),title,detail,type});
    }
  }

  function syncWorkshopStatus(job,stage){
    const map={
      "Booked":"🔵 Waiting to Start",
      "Testing":"🟡 Diagnosis",
      "Failed – Awaiting Authorisation":"🟣 Awaiting Customer Approval",
      "Repairs in Progress":"🔧 Repairing Vehicle",
      "Awaiting Retest":"🟠 Awaiting Parts",
      "Passed":"✅ Ready for Collection",
      "Passed with Advisories":"✅ Ready for Collection",
      "Passed After Retest":"✅ Ready for Collection",
      "Ready for Collection":"✅ Ready for Collection"
    };
    if(map[stage]) job.status=map[stage];
  }

  window.updateMOTStage=function(jobId,stage){
    const job=jobStore().find(j=>j.id===jobId);
    if(!job || !MOT_STAGES.includes(stage)) return;
    const rec=ensureMOT(job);
    const previous=rec.stage;
    rec.stage=stage;
    rec.updatedAt=new Date().toISOString();
    rec.tester=rec.tester||job.technician||"";
    if(stage==="Testing" && !rec.testStartedAt) rec.testStartedAt=new Date().toISOString();
    if(["Passed","Passed with Advisories","Failed – Awaiting Authorisation","Passed After Retest"].includes(stage)) rec.testCompletedAt=new Date().toISOString();
    // Preserve the actual MOT result even after the operational stage later
    // moves to Ready for Collection. Reports should not lose pass/advisory data.
    if(stage==="Passed") { rec.firstTimePass=true; rec.result="Passed"; }
    if(stage==="Passed with Advisories") { rec.firstTimePass=true; rec.result="Passed with Advisories"; }
    if(stage==="Failed – Awaiting Authorisation") { rec.firstTimePass=false; rec.result="Failed"; }
    if(stage==="Awaiting Retest") rec.firstTimePass=false;
    if(stage==="Passed After Retest") { rec.firstTimePass=false; rec.result="Passed After Retest"; }
    syncWorkshopStatus(job,stage);
    addMOTTimeline(job,"MOT stage updated",`${previous} → ${stage}`,"mot");
    if(typeof window.save === "function") window.save();
    if(typeof window.render === "function") window.render();
  };

  window.editMOTDetails=function(jobId){
    const job=jobStore().find(j=>j.id===jobId);
    if(!job) return;
    const rec=ensureMOT(job);
    const advisory=prompt("Estimated advisory / repair opportunity value (£)",String(rec.advisoryValue||0));
    if(advisory===null) return;
    const authorised=prompt("Value authorised by customer (£)",String(rec.authorisedValue||0));
    if(authorised===null) return;
    const notes=prompt("Advisories, failures or MOT notes",rec.advisoryNotes||rec.failureNotes||"");
    rec.advisoryValue=Math.max(0,Number(advisory)||0);
    rec.authorisedValue=Math.max(0,Number(authorised)||0);
    rec.declinedValue=Math.max(0,rec.advisoryValue-rec.authorisedValue);
    rec.advisoryNotes=notes||"";
    rec.updatedAt=new Date().toISOString();
    addMOTTimeline(job,"MOT opportunity updated",`Potential ${money(rec.advisoryValue)}; authorised ${money(rec.authorisedValue)}.${notes?" "+notes:""}`,"mot");
    if(typeof window.save === "function") window.save();
    if(typeof window.render === "function") window.render();
  };

  window.openMOTJob=function(jobId){
    if(typeof window.openJob === "function") window.openJob(jobId);
  };

  function selectedJobs(){
    const filter=document.getElementById("motBoardFilter")?.value||"live";
    const today=typeof window.todayISO==="function"?window.todayISO():new Date().toISOString().slice(0,10);
    let list=motJobs();
    if(filter==="today") list=list.filter(j=>dateKey(j.bookingDate)===today);
    if(filter==="live") list=list.filter(j=>!isMOTClosed(ensureMOT(j).stage) || dateKey(j.bookingDate)===today);
    return list.sort((a,b)=>String(a.bookingDate||"").localeCompare(String(b.bookingDate||"")) || String(a.createdAt||"").localeCompare(String(b.createdAt||"")));
  }

  function stageOptions(current){
    return MOT_STAGES.map(s=>`<option value="${s}" ${s===current?"selected":""}>${s}</option>`).join("");
  }

  function renderBoard(){
    const el=document.getElementById("motLiveBoard");
    if(!el) return;
    const list=selectedJobs();
    el.innerHTML=list.length?list.map(job=>{
      const rec=ensureMOT(job), meta=STAGE_META[rec.stage]||STAGE_META.Booked;
      return `<article class="mot-job-card ${meta.cls}">
        <div class="mot-card-head"><div><span class="mot-stage-pill">${meta.icon} ${rec.stage}</span><h3>${regOf(job)}</h3></div><strong>${text(job.mot,"MOT")}</strong></div>
        <p><strong>${vehicleOf(job)}</strong><br>${customerOf(job)}</p>
        <p><strong>Tester/Technician:</strong> ${technicianOf(job,rec)}<br><strong>Booked:</strong> ${text(job.bookingDate,"Not set")}</p>
        <p><strong>Opportunity:</strong> ${money(rec.advisoryValue)} · <strong>Authorised:</strong> ${money(rec.authorisedValue)}</p>
        ${rec.advisoryNotes?`<p class="mot-note">${rec.advisoryNotes}</p>`:""}
        <label>MOT Stage<select onchange="updateMOTStage('${job.id}',this.value)">${stageOptions(rec.stage)}</select></label>
        <div class="mot-actions"><button onclick="editMOTDetails('${job.id}')">Advisories / Value</button><button onclick="showTimelineModal('${job.id}')">Timeline</button><button onclick="openMOTJob('${job.id}')">Open Job</button></div>
      </article>`;
    }).join(""):"<div class='job-card'><p>No MOT jobs match this view. Add an MOT to a job from the Service Manager screen.</p></div>";
  }

  function allMetrics(){
    const list=motJobs();
    const today=typeof window.todayISO==="function"?window.todayISO():new Date().toISOString().slice(0,10);
    const todayJobs=list.filter(j=>dateKey(j.bookingDate)===today);
    const month=today.slice(0,7);
    const monthJobs=list.filter(j=>dateKey(j.bookingDate).startsWith(month));
    const stageCount=s=>todayJobs.filter(j=>ensureMOT(j).stage===s).length;
    const tested=monthJobs.filter(j=>ensureMOT(j).testCompletedAt || ["Passed","Passed with Advisories","Failed – Awaiting Authorisation","Awaiting Retest","Passed After Retest","Ready for Collection"].includes(ensureMOT(j).stage));
    const passedFirst=tested.filter(j=>ensureMOT(j).firstTimePass===true).length;
    const opp=monthJobs.reduce((sum,j)=>sum+Number(ensureMOT(j).advisoryValue||0),0);
    const auth=monthJobs.reduce((sum,j)=>sum+Number(ensureMOT(j).authorisedValue||0),0);
    return {list,todayJobs,monthJobs,tested,passedFirst,firstPassRate:tested.length?(passedFirst/tested.length)*100:null,opp,auth,outstanding:Math.max(0,opp-auth),stageCount};
  }

  function renderKPIs(m){
    const el=document.getElementById("motKpiCards"); if(!el)return;
    const passes=m.todayJobs.filter(j=>["Passed","Passed After Retest","Ready for Collection"].includes(ensureMOT(j).stage)).length;
    const advisories=m.stageCount("Passed with Advisories");
    const fails=m.todayJobs.filter(j=>["Failed – Awaiting Authorisation","Repairs in Progress","Awaiting Retest"].includes(ensureMOT(j).stage)).length;
    const retests=m.todayJobs.filter(j=>j.mot==="Retest" || ["Awaiting Retest","Passed After Retest"].includes(ensureMOT(j).stage)).length;
    el.innerHTML=`
      <div class="stat"><span class="mot-kpi-icon">📅</span><strong>${m.todayJobs.length}</strong>MOTs Today</div>
      <div class="stat good"><span class="mot-kpi-icon">✅</span><strong>${passes}</strong>Passed</div>
      <div class="stat warn"><span class="mot-kpi-icon">⚠️</span><strong>${advisories}</strong>With Advisories</div>
      <div class="stat bad"><span class="mot-kpi-icon">❌</span><strong>${fails}</strong>Failed / Repair</div>
      <div class="stat"><span class="mot-kpi-icon">🔄</span><strong>${retests}</strong>Retests</div>
      <div class="stat"><span class="mot-kpi-icon">🎯</span><strong>${m.firstPassRate===null?"—":m.firstPassRate.toFixed(0)+"%"}</strong>First-Time Pass MTD</div>
      <div class="stat"><span class="mot-kpi-icon">£</span><strong>${money(m.opp)}</strong>Opportunity MTD</div>`;
  }

  function renderOpportunity(m){
    const stats=document.getElementById("motOpportunityStats"), list=document.getElementById("motOpportunityList");
    if(stats) stats.innerHTML=`<div class="stat"><strong>${money(m.opp)}</strong>Potential</div><div class="stat good"><strong>${money(m.auth)}</strong>Authorised</div><div class="stat warn"><strong>${money(m.outstanding)}</strong>Outstanding</div>`;
    if(list){
      const rows=m.monthJobs.filter(j=>Number(ensureMOT(j).advisoryValue||0)>Number(ensureMOT(j).authorisedValue||0));
      list.innerHTML=rows.length?rows.map(j=>{const r=ensureMOT(j);return `<div class="job-card warn"><h3>${j.reg} · ${r.stage}</h3><p>${j.customer||"Customer"} · ${j.technician||"Unassigned"}</p><p>Potential ${money(r.advisoryValue)} · Authorised ${money(r.authorisedValue)} · Outstanding <strong>${money(r.advisoryValue-r.authorisedValue)}</strong></p><button onclick="editMOTDetails('${j.id}')">Update Opportunity</button></div>`}).join(""):"<p class='muted'>No outstanding MOT opportunities recorded this month.</p>";
    }
  }

  function renderCoach(m){
    const el=document.getElementById("motCoach"); if(!el)return;
    const waiting=m.list.filter(j=>ensureMOT(j).stage==="Failed – Awaiting Authorisation");
    const retests=m.list.filter(j=>ensureMOT(j).stage==="Awaiting Retest");
    const items=[];
    if(waiting.length) items.push(["Call customers awaiting approval",`${waiting.length} failed MOT job(s) require authorisation. Outstanding opportunity: ${money(waiting.reduce((s,j)=>s+Math.max(0,ensureMOT(j).advisoryValue-ensureMOT(j).authorisedValue),0))}.`,"warn"]);
    if(retests.length) items.push(["Plan MOT retests",`${retests.length} vehicle(s) are awaiting retest. Keep their repair and test slots visible on the workshop board.`,"warn"]);
    if(m.firstPassRate!==null && m.firstPassRate<Number(targetStore().motPass||75)) items.push(["First-time pass rate below target",`Current month-to-date rate is ${m.firstPassRate.toFixed(0)}%. Review recurring failure categories and pre-MOT checks.`,"bad"]);
    if(m.outstanding>0) items.push(["MOT revenue opportunity",`${money(m.outstanding)} of recorded advisory value remains unapproved this month.`,"warn"]);
    if(!items.length) items.push(["MOT workflow under control","No urgent MOT authorisations or retests are currently outstanding. Keep stages updated for accurate reporting.","good"]);
    el.innerHTML=items.map(x=>`<div class="coach-card ${x[2]}"><h3>${x[0]}</h3><p>${x[1]}</p></div>`).join("");
  }

  function renderPerformance(m){
    const el=document.getElementById("motPerformance"); if(!el)return;
    const byTech={};
    m.monthJobs.forEach(j=>{
      const r=ensureMOT(j), t=r.tester||j.technician||"Unassigned";
      byTech[t]=byTech[t]||{tests:0,passed:0,first:0,retests:0,opp:0,auth:0};
      byTech[t].tests++;
      if(["Passed","Passed with Advisories","Passed After Retest","Ready for Collection"].includes(r.stage)) byTech[t].passed++;
      if(r.firstTimePass===true) byTech[t].first++;
      if(j.mot==="Retest" || ["Awaiting Retest","Passed After Retest"].includes(r.stage)) byTech[t].retests++;
      byTech[t].opp+=Number(r.advisoryValue||0); byTech[t].auth+=Number(r.authorisedValue||0);
    });
    const rows=Object.entries(byTech).sort((a,b)=>b[1].tests-a[1].tests);
    el.innerHTML=rows.length?`<div class="table-wrap"><table><thead><tr><th>Tester</th><th>Tests MTD</th><th>Passed</th><th>First-Time Pass</th><th>Retests</th><th>Opportunity</th><th>Authorised</th></tr></thead><tbody>${rows.map(([t,r])=>`<tr><td>${t}</td><td>${r.tests}</td><td>${r.passed}</td><td>${r.tests?((r.first/r.tests)*100).toFixed(0)+"%":"—"}</td><td>${r.retests}</td><td>${money(r.opp)}</td><td>${money(r.auth)}</td></tr>`).join("")}</tbody></table></div>`:"<p class='muted'>No MOT activity recorded this month.</p>";
  }

  const TECH_STAGE_ACTIONS = [
    ["Start MOT Test","Testing"],
    ["Passed","Passed"],
    ["Passed with Advisories","Passed with Advisories"],
    ["Failed","Failed – Awaiting Authorisation"],
    ["Repairing Vehicle","Repairs in Progress"],
    ["Send for Retest","Awaiting Retest"],
    ["Retest Started","Testing"],
    ["Ready for Collection","Ready for Collection"]
  ];

  function ensureMOTClock(rec){
    rec.clock=rec.clock||{running:false,startedAt:null,accumulatedMs:0,lastStartedAt:null};
    return rec.clock;
  }
  function motClockMs(rec){
    const c=ensureMOTClock(rec);
    return Number(c.accumulatedMs||0)+(c.running&&c.lastStartedAt?Math.max(0,Date.now()-new Date(c.lastStartedAt).getTime()):0);
  }
  function formatDuration(ms){
    const total=Math.floor(Math.max(0,ms)/1000), h=Math.floor(total/3600), m=Math.floor((total%3600)/60), sec=total%60;
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  }
  function saveAndRefresh(job){
    if(typeof window.save==="function") window.save();
    if(typeof window.render==="function") window.render();
    if(job) window.renderTechnicianMOTControls(job);
  }
  window.startMOTClock=function(jobId){
    const job=jobStore().find(j=>j.id===jobId); if(!job)return;
    const rec=ensureMOT(job), c=ensureMOTClock(rec);
    if(c.running){alert("MOT clock is already running.");return;}
    c.running=true; c.lastStartedAt=new Date().toISOString(); c.startedAt=c.startedAt||c.lastStartedAt;
    if(rec.stage==="Booked") rec.stage="Testing";
    if(typeof window.addTimeline==="function") window.addTimeline(job,"⏱ MOT clock started",`${technicianOf(job,rec)} started the MOT test clock.`,"mot");
    saveAndRefresh(job);
  };
  window.pauseMOTClock=function(jobId){
    const job=jobStore().find(j=>j.id===jobId); if(!job)return;
    const rec=ensureMOT(job), c=ensureMOTClock(rec);
    if(!c.running){alert("MOT clock is not running.");return;}
    c.accumulatedMs=motClockMs(rec); c.running=false; c.lastStartedAt=null;
    if(typeof window.addTimeline==="function") window.addTimeline(job,"⏸ MOT clock paused",`MOT test time paused at ${formatDuration(c.accumulatedMs)}.`,"mot");
    saveAndRefresh(job);
  };
  window.finishMOTClock=function(jobId){
    const job=jobStore().find(j=>j.id===jobId); if(!job)return;
    const rec=ensureMOT(job), c=ensureMOTClock(rec);
    c.accumulatedMs=motClockMs(rec); c.running=false; c.lastStartedAt=null; c.finishedAt=new Date().toISOString();
    rec.testDurationMinutes=Math.round(c.accumulatedMs/60000);
    if(typeof window.addTimeline==="function") window.addTimeline(job,"■ MOT clock finished",`MOT test clock finished at ${formatDuration(c.accumulatedMs)}.`,"mot");
    saveAndRefresh(job);
  };

  function detailForm(job,rec){
    const needsFailure=rec.stage==="Failed – Awaiting Authorisation";
    const needsAdvice=rec.stage==="Passed with Advisories";
    if(!needsFailure&&!needsAdvice) return "";
    const title=needsFailure?"MOT Failure Details — required for Service Manager":"MOT Advisories — required for Service Manager";
    return `<div class="mot-detail-panel">
      <h4>${title}</h4>
      <label>Category<select id="motDetailCategory"><option>Brakes</option><option>Tyres</option><option>Suspension</option><option>Steering</option><option>Lights</option><option>Exhaust / Emissions</option><option>Body / Structure</option><option>Other</option></select></label>
      <label>Priority<select id="motDetailPriority"><option>🔴 Safety / Urgent</option><option>🟠 Recommended</option><option>🔵 Monitor</option></select></label>
      <label>${needsFailure?"Failure items":"Advisory items"}<textarea id="motTechnicianDetails" placeholder="Enter every item clearly...">${text(rec.technicianDetails,"")}</textarea></label>
      <div class="grid"><label>Estimated labour hours<input id="motEstimatedLabour" type="number" min="0" step="0.1" value="${Number(rec.estimatedLabourHours||0)}"></label><label>Estimated parts value £<input id="motEstimatedParts" type="number" min="0" step="0.01" value="${Number(rec.estimatedPartsValue||0)}"></label></div>
      <button class="primary" type="button" onclick="submitMOTDetails('${job.id}')">Submit to Service Manager</button>
    </div>`;
  }

  window.submitMOTDetails=function(jobId){
    const job=jobStore().find(j=>j.id===jobId); if(!job)return;
    const rec=ensureMOT(job);
    const details=document.getElementById("motTechnicianDetails")?.value.trim()||"";
    if(!details){alert("Please enter the MOT failure or advisory details before submitting.");return;}
    const category=document.getElementById("motDetailCategory")?.value||"Other";
    const priority=document.getElementById("motDetailPriority")?.value||"🟠 Recommended";
    rec.technicianDetails=details; rec.detailCategory=category; rec.detailPriority=priority;
    rec.estimatedLabourHours=Number(document.getElementById("motEstimatedLabour")?.value||0);
    rec.estimatedPartsValue=Number(document.getElementById("motEstimatedParts")?.value||0);
    rec.advisoryValue=Number(rec.advisoryValue||0)||rec.estimatedPartsValue;
    rec.managerAlert=true; rec.managerAlertAt=new Date().toISOString(); rec.managerAlertResolved=false;
    const kind=rec.stage==="Passed with Advisories"?"Passed with advisories":"MOT failed";
    job.motAlertDetails=`${kind}: ${category} · ${priority} — ${details}`;
    if(typeof window.upsertManagerAction==="function") window.upsertManagerAction(job,rec.stage==="Passed with Advisories"?"mot-advisory":"mot-failed",{title:rec.stage==="Passed with Advisories"?"MOT Passed with Advisories":"MOT Failed — Action Required",detail:job.motAlertDetails,createdAt:rec.managerAlertAt,category,priority,estimatedLabourHours:rec.estimatedLabourHours,estimatedPartsValue:rec.estimatedPartsValue});
    job.auth="Awaiting Customer Approval";
    job.status="🟣 Awaiting Customer Approval";
    if(rec.stage==="Passed with Advisories") job.advisories=details; else job.findings=details;
    if(typeof window.addTimeline==="function") window.addTimeline(job,rec.stage==="Passed with Advisories"?"⚠️ MOT advisories sent to Service Manager":"🔴 MOT failure sent to Service Manager",job.motAlertDetails,"notification");
    saveAndRefresh(job);
    alert("Service Manager notified.");
  };

  window.renderTechnicianMOTControls=function(job){
    const root=document.getElementById("technicianMOTControls");
    if(!root) return;
    if(!isMOTJob(job)){ root.classList.add("hidden"); root.innerHTML=""; return; }
    const rec=ensureMOT(job), meta=STAGE_META[rec.stage]||STAGE_META.Booked, c=ensureMOTClock(rec);
    root.classList.remove("hidden"); root.dataset.jobId=job.id;
    root.innerHTML=`<h3>🧪 MOT Test & Progress</h3>
      <p>The MOT clock is separate from the main job timer. Changing the MOT result never stops either timer.</p>
      <div class="mot-clock-grid"><div class="mot-clock-stat"><span>MOT Clock</span><strong id="liveMOTClock">${formatDuration(motClockMs(rec))}</strong></div><div class="mot-clock-stat"><span>State</span><strong>${c.running?"🟢 Running":c.finishedAt?"✅ Finished":"⏸ Stopped"}</strong></div></div>
      <div class="button-row"><button type="button" class="primary" onclick="startMOTClock('${job.id}')">▶ ${c.accumulatedMs?"Resume":"Clock On MOT"}</button><button type="button" class="secondary" onclick="pauseMOTClock('${job.id}')">⏸ Pause MOT</button><button type="button" class="secondary" onclick="finishMOTClock('${job.id}')">■ Clock Off MOT</button></div>
      <hr><h3>MOT Result / Stage</h3><span class="technician-mot-stage">${meta.icon} ${rec.stage}</span>
      <div class="technician-mot-actions">${TECH_STAGE_ACTIONS.map(([label,stage])=>`<button type="button" class="${stage===rec.stage?'primary':'secondary'}" onclick="technicianUpdateMOTStage('${job.id}','${stage}')">${label}</button>`).join("")}</div>
      ${detailForm(job,rec)}`;
  };

  window.technicianUpdateMOTStage=function(jobId,stage){
    const job=jobStore().find(j=>j.id===jobId); if(!job)return;
    const rec=ensureMOT(job);
    rec.stage=stage; rec.stageUpdatedAt=new Date().toISOString();
    if(stage==="Failed – Awaiting Authorisation"||stage==="Passed with Advisories"){
      rec.managerAlert=true; rec.managerAlertResolved=false; rec.managerAlertAt=rec.managerAlertAt||new Date().toISOString();
      job.auth="Awaiting Customer Approval";
      if(typeof window.upsertManagerAction==="function") window.upsertManagerAction(job,stage==="Passed with Advisories"?"mot-advisory":"mot-failed",{title:stage==="Passed with Advisories"?"MOT Passed with Advisories":"MOT Failed — Action Required",detail:"Technician result recorded. Failure/advisory details are awaiting submission.",createdAt:rec.managerAlertAt});
      job.status="🟣 Awaiting Customer Approval";
    } else if(stage==="Passed"||stage==="Passed After Retest"||stage==="Ready for Collection"){
      job.status="✅ Ready for Collection";
      rec.testCompletedAt=rec.testCompletedAt||new Date().toISOString();
      if(stage==="Passed") rec.firstTimePass=true;
    }
    if(typeof window.addTimeline==="function") window.addTimeline(job,"🧪 MOT stage updated",`${technicianOf(job,rec)} changed MOT stage to ${stage}.`,"mot");
    saveAndRefresh(job);
    if(stage==="Failed – Awaiting Authorisation"||stage==="Passed with Advisories") alert("Enter the details below and press Submit to Service Manager.");
  };

  setInterval(()=>{
    const root=document.getElementById("technicianMOTControls");
    const job=jobStore().find(j=>j.id===root?.dataset.jobId);
    if(!job||!isMOTJob(job))return;
    const rec=ensureMOT(job), el=document.getElementById("liveMOTClock");
    if(el) el.textContent=formatDuration(motClockMs(rec));
  },1000);

  window.renderMOTIntelligence=function(){
    const root=document.getElementById("motIntelligenceScreen"); if(!root)return;
    const m=allMetrics();
    renderKPIs(m); renderBoard(); renderOpportunity(m); renderCoach(m); renderPerformance(m);
  };

  document.addEventListener("DOMContentLoaded",()=>window.renderMOTIntelligence());
})();
