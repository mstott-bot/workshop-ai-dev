let jobs=JSON.parse(localStorage.getItem("workshopAIJobsV27")||localStorage.getItem("workshopAIJobsV26")||localStorage.getItem("workshopAIJobsV25")||localStorage.getItem("workshopAIJobsV24")||localStorage.getItem("workshopAIJobsV23")||localStorage.getItem("workshopAIJobsV22")||localStorage.getItem("workshopAIJobsV21")||localStorage.getItem("pcaJobsV11")||localStorage.getItem("pcaJobsV10")||localStorage.getItem("pcaJobsV09")||localStorage.getItem("pcaJobsV08")||localStorage.getItem("pcaJobsV07")||localStorage.getItem("pcaJobsV06")||"[]");let targets=JSON.parse(localStorage.getItem("pcaTargetsV11")||localStorage.getItem("pcaTargetsV10")||localStorage.getItem("pcaTargetsV09")||localStorage.getItem("pcaTargetsV08")||localStorage.getItem("pcaTargetsV07")||localStorage.getItem("pcaTargetsV06")||"{\"availableHours\":0,\"productiveHours\":0,\"productivity\":90,\"utilisation\":95,\"efficiency\":95,\"labourRecovery\":90,\"retailRate\":70,\"warrantyRate\":70,\"internalRate\":45,\"retailHours\":0,\"internalHours\":0,\"warrantyHours\":0,\"internalCars\":0,\"monthlyRevenue\":0,\"retailRevenue\":0,\"warrantyRevenue\":0,\"internalRevenue\":0,\"mots\":0,\"motPass\":75,\"motAdvisory\":25,\"carryOver\":0,\"downtime\":0}");let activeJobId=null;let activeVoiceTarget=null;let plannerSettings=JSON.parse(localStorage.getItem("workshopAIPlannerSettings")||"{\"capacity\":8}");let technicians=JSON.parse(localStorage.getItem("workshopAITechnicians")||'["Jake","Gordon","James","Jimmy","Ross","Other"]');
function saveTechnicians(){localStorage.setItem("workshopAITechnicians",JSON.stringify(technicians))}
function getTechs(){return technicians.length?technicians:["Other"]}function $(id){return document.getElementById(id)}function val(id){return $(id).value.trim()}function save(){localStorage.setItem("workshopAIJobsV27",JSON.stringify(jobs));localStorage.setItem("workshopAIJobsV26",JSON.stringify(jobs));localStorage.setItem("workshopAIJobsV25",JSON.stringify(jobs));localStorage.setItem("workshopAIJobsV24",JSON.stringify(jobs));localStorage.setItem("workshopAIJobsV23",JSON.stringify(jobs));localStorage.setItem("workshopAIJobsV22",JSON.stringify(jobs));localStorage.setItem("workshopAIJobsV21",JSON.stringify(jobs));localStorage.setItem("pcaJobsV11",JSON.stringify(jobs));localStorage.setItem("pcaJobsV10",JSON.stringify(jobs));localStorage.setItem("pcaJobsV09",JSON.stringify(jobs));localStorage.setItem("pcaJobsV08",JSON.stringify(jobs));localStorage.setItem("pcaJobsV07",JSON.stringify(jobs));localStorage.setItem("pcaJobsV06",JSON.stringify(jobs))}function saveTargetsStore(){localStorage.setItem("pcaTargetsV11",JSON.stringify(targets));localStorage.setItem("pcaTargetsV10",JSON.stringify(targets));localStorage.setItem("pcaTargetsV09",JSON.stringify(targets));localStorage.setItem("pcaTargetsV08",JSON.stringify(targets));localStorage.setItem("pcaTargetsV07",JSON.stringify(targets));localStorage.setItem("pcaTargetsV06",JSON.stringify(targets))}function todayISO(){return new Date().toISOString().split("T")[0]}function now(){return new Date()}function fmt(dt){return dt?new Date(dt).toLocaleString("en-GB"):"Not set"}function timeOnly(dt){return dt?new Date(dt).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"}):""}function hoursBetween(a,b){if(!a||!b)return 0;return Math.max(0,(new Date(b)-new Date(a))/36e5)}function show(screen){document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));$(screen).classList.add("active");document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));document.querySelector(`[data-screen='${screen}']`)?.classList.add("active");render()}document.querySelectorAll(".tab").forEach(t=>t.addEventListener("click",()=>show(t.dataset.screen)));$("todayDate").textContent=new Date().toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"});$("bookingDate").value=todayISO();if($("plannerDate")) $("plannerDate").value=todayISO();if($("futureBookingDate")) $("futureBookingDate").value=todayISO();if($("dailyTechCapacity")) $("dailyTechCapacity").value=plannerSettings.capacity||8;$("reg").addEventListener("input",e=>e.target.value=e.target.value.toUpperCase());$("jobType").addEventListener("change",()=>{$("authBox").style.display=val("jobType")==="Retail"?"block":"none"});function addTimeline(job,title,detail,type="info"){job.timeline=job.timeline||[];job.timeline.push({time:now().toISOString(),title,detail,type})}function ensureTimeline(job){job.timeline=job.timeline||[];job.interruptions=job.interruptions||[];job.activeClockOff=job.activeClockOff||null;if(job.reportReady===undefined)job.reportReady=!!job.report;if(job.reportReviewed===undefined)job.reportReviewed=false;job.partsRequests=job.partsRequests||[];if(!job.timeline.length&&job.createdAt){job.timeline.push({time:job.createdAt,title:"🟢 Job created",detail:`Job ${job.jobNo||""} created and assigned to ${job.technician}.`,type:"created"})}return job.timeline}$("assignJob").addEventListener("click",()=>{const reg=val("reg").toUpperCase();const hours=Number(val("hours"));if(!reg){alert("Please enter registration");return}if(!hours||hours<=0){alert("Please enter labour hours allowed");return}const type=val("jobType");const jobNo=`PCA-${todayISO().replaceAll("-","")}-${String(jobs.length+1).padStart(3,"0")}`;const job={id:Date.now().toString(),jobNo,createdAt:now().toISOString(),bookingDate:val("bookingDate")||todayISO(),completedAt:null,reg,customer:val("customer"),phone:val("phone"),make:val("make"),model:val("model"),mileage:val("mileage"),type,technician:val("technician"),hours,originalHours:hours,hoursHistory:[`Created with ${hours} hrs`],priority:val("priority"),mot:val("mot"),auth:type==="Retail"?val("auth"):"Not required",workRequired:val("workRequired"),specialInstructions:val("specialInstructions"),status:"🔵 Waiting to Start",startedAt:null,finishedAt:null,actualHours:0,complaint:"",findings:"",repair:"",parts:"",advisories:"",photoCount:0,report:"",timeline:[],interruptions:[],activeClockOff:null,reportReady:false,reportReviewed:false,reportSentAt:null,partsRequests:[]};addTimeline(job,"🟢 Job created",`Job ${jobNo} created for ${reg}.`);addTimeline(job,"👨‍🔧 Technician assigned",`${job.technician} allocated ${hours} labour hours.`);jobs.push(job);save();clearForm();render();alert("Job assigned")});function clearForm(){["reg","customer","phone","make","model","mileage","hours","workRequired","specialInstructions"].forEach(id=>$(id).value="");$("bookingDate").value=todayISO();$("jobType").value="Retail";$("technician").value="Jake";$("priority").value="🟢 Routine";$("mot").value="None";$("auth").value="Awaiting Customer Approval";$("authBox").style.display="block"}function efficiency(allowed,actual){return actual>0?(allowed/actual)*100:null}function pct(n){return n===null?"Not clocked":n.toFixed(0)+"%"}function completed(j){return !!j.completedAt || (j.status||"").includes("Ready") || (j.status||"").includes("Complete") || (j.status||"").includes("Collected") || (j.status||"").includes("Closed")}function card(job,open=true,manager=false){ensureTimeline(job);const eff=efficiency(Number(job.hours||0),Number(job.actualHours||0));return `<div class="job-card"><h3>${job.jobNo||""} | ${job.reg} — ${job.technician}</h3><p><strong>${job.make||"Make"} ${job.model||""}</strong></p><p><strong>Customer:</strong> ${job.customer||"Not entered"} ${job.phone?" | "+job.phone:""}</p><p><strong>Type:</strong> ${job.type} | <strong>Allowed:</strong> ${job.hours} hrs | <strong>Actual:</strong> ${(job.actualHours||0).toFixed(2)} hrs | <strong>Efficiency:</strong> ${pct(eff)}</p><p><strong>MOT:</strong> ${job.mot} | <strong>Status:</strong> ${job.status}</p><p><strong>Timeline:</strong> ${job.timeline.length} events</p>${manager?`<button onclick="amendHours('${job.id}')">Amend Hours</button><button onclick="reassignTech('${job.id}')">Reassign Technician</button><button onclick="managerComment('${job.id}')">Manager Comment</button>`:""}<button onclick="showTimelineModal('${job.id}')">Timeline</button>${open?`<button onclick="openJob('${job.id}')">Start / Continue Job</button>`:""}</div>`}
function populateTechnicianSelects(){
  const techSelect=$("technician");
  const filterSelect=$("techFilter");
  if(techSelect){
    const current=techSelect.value;
    techSelect.innerHTML=getTechs().map(t=>`<option>${t}</option>`).join("");
    if(getTechs().includes(current)) techSelect.value=current;
  }
  if(filterSelect){
    const current=filterSelect.value;
    filterSelect.innerHTML=getTechs().map(t=>`<option>${t}</option>`).join("") + "<option>All</option>";
    if(getTechs().includes(current)||current==="All") filterSelect.value=current;
  }
}
function renderTechnicianSetup(){
  const el=$("technicianSetupList");
  if(!el) return;
  el.innerHTML=getTechs().map(t=>`
    <div class="job-card">
      <div class="tech-row">
        <div>
          <h3>${t}</h3>
          <p>Available for job allocation, workload, reports and league table.</p>
        </div>
        <div class="tech-actions">
          <button onclick="renameTechnician('${t}')">Rename</button>
          <button onclick="removeTechnician('${t}')">Remove</button>
        </div>
      </div>
    </div>
  `).join("");
}
function addTechnician(){
  const name=val("newTechnicianName");
  if(!name){alert("Enter technician name.");return}
  if(getTechs().includes(name)){alert("Technician already exists.");return}
  technicians.push(name);
  saveTechnicians();
  $("newTechnicianName").value="";
  if($("newTechnicianNote")) $("newTechnicianNote").value="";
  render();
}
function renameTechnician(oldName){
  const newName=prompt(`Rename ${oldName} to:`);
  if(!newName || newName===oldName) return;
  if(getTechs().includes(newName)){alert("That technician name already exists.");return}
  technicians=technicians.map(t=>t===oldName?newName:t);
  jobs.forEach(j=>{if(j.technician===oldName){j.technician=newName;addTimeline(j,"👨‍🔧 Technician name updated",`${oldName} renamed to ${newName}.`)}})
  saveTechnicians();save();render();
}
function removeTechnician(name){
  const assigned=jobs.some(j=>j.technician===name && !completed(j));
  if(assigned && !confirm(`${name} has open jobs. Remove anyway? Existing jobs will keep the name.`)) return;
  technicians=technicians.filter(t=>t!==name);
  if(!technicians.length) technicians=["Other"];
  saveTechnicians();render();
}
if($("addTechnicianBtn")) $("addTechnicianBtn").addEventListener("click",addTechnician);

function render(){populateTechnicianSelects();renderManager();renderServicePartsAlert();renderTechnicianPartsAlert();renderCompletedReportsInbox();renderTech();renderDash();renderTechnicianSetup();renderReportsInterface();renderDailyPlanner();renderPartsQueues();renderPartsManagement();renderFutureBookings();renderEndOfDayBriefing();loadTargetsInputs();refreshActiveJobPartsPanel()}function isFinishedForDailyCleanup(j){const s=String(j.status||"").toLowerCase();return !!j.completedAt||s.includes("complete")||s.includes("completed")||s.includes("ready")||s.includes("ready for collection")||s.includes("collected")||s.includes("closed")}function isLiveWorkshopJob(j){const today=todayISO();const jobDate=String(j.bookingDate||"").slice(0,10);if(jobDate===today)return true;if(jobDate&&jobDate<today&&!isFinishedForDailyCleanup(j))return true;return false}function getLiveWorkshopJobs(){return jobs.filter(isLiveWorkshopJob)}function getCarryOverJobs(){const today=todayISO();return jobs.filter(j=>{const jobDate=String(j.bookingDate||"").slice(0,10);return jobDate&&jobDate<today&&!isFinishedForDailyCleanup(j)})}function getCompletedTodayJobs(){const today=todayISO();return jobs.filter(j=>{const completedDate=String(j.completedAt||j.finishedAt||"").slice(0,10);const bookingDate=String(j.bookingDate||"").slice(0,10);return isFinishedForDailyCleanup(j)&&(completedDate===today||bookingDate===today)})}function getLiveJobCount(){return getLiveWorkshopJobs().length}function renderManager(){const liveJobs=getLiveWorkshopJobs();$("managerJobs").innerHTML=liveJobs.length?liveJobs.map(j=>card(j,true,true)).join(""):"No live jobs for today."}

function renderServicePartsAlert(){
  const el=$("servicePartsAlert");
  if(!el) return;
  const partsRows=[];
  jobs.forEach(j=>{
    ensureTimeline(j);
    (j.partsRequests||[]).forEach(p=>{
      if(["Requested","Ordered","Received","Partial Delivery","Incorrect Parts"].includes(p.status)){
        partsRows.push({job:j,part:p});
      }
    });
  });
  const partsRequired=partsRows.filter(r=>["Requested","Partial Delivery","Incorrect Parts"].includes(r.part.status));
  const partsOrdered=partsRows.filter(r=>r.part.status==="Ordered");
  const approvals=jobs.filter(j=>j.status&&j.status.includes("Approval"));
  const ready=jobs.filter(j=>j.status&&j.status.includes("Ready"));
  const carryOvers=jobs.filter(j=>!completed(j) && (j.bookingDate||todayISO())<todayISO());

  const attentionCount=partsRequired.length+partsOrdered.length+approvals.length+carryOvers.length;
  el.className="card service-parts-alert action-centre-v2"+(attentionCount?"":" clear");

  const actionClass=count=>count>0?"bad":"good";
  const readyClass="good";

  const partRow=({job:j,part:p})=>`
    <div class="board-job">
      <strong>${j.reg} — ${j.technician}</strong><br>
      ${j.make||""} ${j.model||""}<br>
      <strong>Part:</strong> ${p.qty||1} x ${p.description||p.text||"Part requested"}<br>
      <strong>Priority:</strong> ${p.priority||"Today"}${p.supplier?" | <strong>Supplier/note:</strong> "+p.supplier:""}<br>
      <strong>Status:</strong> <span class="part-pill ${(p.status||"requested").toLowerCase().replaceAll(" ","-")}">${p.status}</span><br>
      <strong>Requested:</strong> ${fmt(p.requestedAt)}
      <div class="parts-actions">
        ${["Requested","Partial Delivery","Incorrect Parts"].includes(p.status)?`<button onclick="markPartOrdered('${j.id}','${p.id}')">Mark Ordered</button>`:""}
        ${p.status==="Received"?`<button onclick="markPartFitted('${j.id}','${p.id}')">Mark Fitted</button>`:""}
        <button onclick="showTimelineModal('${j.id}')">Timeline</button>
      </div>
    </div>`;

  const jobRow=(j,extraButtons="")=>`
    <div class="board-job">
      <strong>${j.reg} — ${j.technician}</strong><br>
      ${j.make||""} ${j.model||""}<br>
      <strong>Status:</strong> ${j.status}<br>
      <strong>Customer:</strong> ${j.customer||"Not entered"} ${j.phone?" | "+j.phone:""}<br>
      <div class="parts-actions">
        <button onclick="showTimelineModal('${j.id}')">Timeline</button>
        <button onclick="openJob('${j.id}')">Open Job</button>
        ${extraButtons}
      </div>
    </div>`;

  const section=(title,count,rows,noneText,cls)=>{
    if(!count){
      return `<div class="action-section action-section-none good"><strong>✅ ${title.replace(/^[^ ]+ /,"")}</strong><span>${noneText}</span></div>`;
    }
    return `<div class="action-section ${cls}"><strong>${title} <span class="parts-alert-count">${count}</span></strong><div class="parts-alert-list">${rows.join("")}</div></div>`;
  };

  el.innerHTML=`
    <h2>🚨 Workshop Action Centre 2.0</h2>
    <p class="muted">Live actions for the Service Manager. Green means clear. Red means action required. Ready for Collection stays green so customer handover work is easy to find.</p>
    <div class="stats action-tiles">
      <div class="stat ${actionClass(partsRequired.length)}"><strong>${partsRequired.length}</strong>Parts Required</div>
      <div class="stat ${actionClass(partsOrdered.length)}"><strong>${partsOrdered.length}</strong>Ordered / Awaiting Receipt</div>
      <div class="stat ${actionClass(approvals.length)}"><strong>${approvals.length}</strong>Approval Required</div>
      <div class="stat ${readyClass}"><strong>${ready.length}</strong>Ready for Collection</div>
      <div class="stat ${actionClass(carryOvers.length)}"><strong>${carryOvers.length}</strong>Carry Over</div>
    </div>
    <div class="parts-alert-list action-centre-sections">
      ${section("🔴 Parts Required",partsRequired.length,partsRequired.map(partRow),"None",actionClass(partsRequired.length))}
      ${section("📦 Parts Ordered / Technician To Receive",partsOrdered.length,partsOrdered.map(partRow),"None",actionClass(partsOrdered.length))}
      ${section("📞 Customer Approval Required",approvals.length,approvals.map(j=>jobRow(j)),"None",actionClass(approvals.length))}
      ${section("🚗 Ready for Collection",ready.length,ready.map(j=>jobRow(j,`<button onclick=\"markCustomerCollected('${j.id}')\">Customer Collected</button>`)),"None",readyClass)}
      ${section("⚠️ Carry Over Jobs",carryOvers.length,carryOvers.map(j=>jobRow(j)),"None",actionClass(carryOvers.length))}
    </div>`;
}

function markCustomerCollected(id){
  const j=jobs.find(x=>x.id===id);
  if(!j) return;
  if(!confirm(`${j.reg} collected and closed?`)) return;
  j.status="✔️ Collected / Closed";
  j.collectedAt=now().toISOString();
  if(!j.completedAt) j.completedAt=j.collectedAt;
  addTimeline(j,"✔️ Customer collected",`Vehicle ${j.reg} collected and job closed by Service Manager.`);
  save();
  render();
}

function renderTechnicianPartsAlert(){
  const el=$("technicianPartsAlert");
  if(!el) return;
  const filter=$("techFilter") ? val("techFilter") : "All";
  const rows=allPartsRequests().filter(({job,part})=>{
    const techMatches = filter==="All" || !filter || job.technician===filter;
    return techMatches && ["Ordered","Received","Partial Delivery","Incorrect Parts"].includes(part.status);
  });
  const actionable=rows.filter(r=>r.part.status==="Ordered" || r.part.status==="Partial Delivery" || r.part.status==="Incorrect Parts");
  if(!rows.length){
    el.className="card service-parts-alert clear";
    el.innerHTML=`<h2>✅ Technician Parts Alerts</h2><p class="muted">No parts updates for the selected technician.</p>`;
    return;
  }
  el.className="card service-parts-alert";
  el.innerHTML=`<h2>📦 Technician Parts Alerts <span class="parts-alert-count">${actionable.length||rows.length}</span></h2>
    <p class="muted">Ordered parts appear here. The technician confirms when parts arrive in the workshop.</p>
    <div class="parts-alert-list">
      ${rows.map(({job,part})=>`
        <div class="parts-alert-item">
          <strong>${job.reg} — ${job.technician}</strong>
          <span>${job.make||""} ${job.model||""}</span><br>
          <span><strong>Part:</strong> ${part.qty||1} x ${part.description||part.text||"Part"}</span><br>
          <span><strong>Status:</strong> <span class="part-pill ${(part.status||"requested").toLowerCase().replaceAll(" ","-")}">${part.status}</span></span><br>
          <span><strong>Requested:</strong> ${fmt(part.requestedAt)}${part.orderedAt?" | <strong>Ordered:</strong> "+fmt(part.orderedAt):""}${part.receivedAt?" | <strong>Received:</strong> "+fmt(part.receivedAt):""}</span>
          ${part.issueNote?`<p><strong>Issue note:</strong> ${part.issueNote}</p>`:""}
          <div class="parts-actions">
            ${part.status==="Ordered"?`<button onclick="technicianReceiveParts('${job.id}','${part.id}','all')">✅ Parts Received</button><button onclick="technicianReceiveParts('${job.id}','${part.id}','partial')">⚠️ Partial Delivery</button><button onclick="technicianReceiveParts('${job.id}','${part.id}','incorrect')">❌ Incorrect Parts</button>`:""}
            ${part.status==="Received"?`<button onclick="markPartFitted('${job.id}','${part.id}')">Mark Fitted</button>`:""}
            <button onclick="openJob('${job.id}')">Open Job</button>
            <button onclick="showTimelineModal('${job.id}')">Timeline</button>
          </div>
        </div>
      `).join("")}
    </div>`;
}
function refreshActiveJobPartsPanel(){
  if(!activeJobId || !$("technicianPartsStatus")) return;
  const j=jobs.find(x=>x.id===activeJobId);
  if(j) renderTechnicianPartsStatus(j);
}

function renderCompletedReportsInbox(){
  const el=$("completedReportsInbox");
  if(!el) return;
  const completedReports=jobs.filter(j=>j.report && (j.reportReady || completed(j))).sort((a,b)=>new Date(b.completedAt||b.finishedAt||b.createdAt)-new Date(a.completedAt||a.finishedAt||a.createdAt));
  if(!completedReports.length){el.innerHTML="No completed write-ups yet.";return}
  el.innerHTML=completedReports.map(j=>`
    <div class="job-card ${j.reportReviewed?'good':'warn'}">
      <h3>${j.jobNo||""} | ${j.reg} — ${j.technician} ${j.reportReviewed?'':'<span class="badge-new">NEW</span>'}</h3>
      <p><strong>Vehicle:</strong> ${j.make||"Not entered"} ${j.model||""}</p>
      <p><strong>Customer:</strong> ${j.customer||"Not entered"} ${j.phone?' | '+j.phone:''}</p>
      <p><strong>Completed:</strong> ${fmt(j.completedAt||j.finishedAt)} | <strong>Hours:</strong> ${j.hours} allowed / ${(j.actualHours||0).toFixed(2)} actual</p>
      <div class="report-preview">${j.report}</div>
      <button onclick="copyInboxReport('${j.id}')">Copy Report</button>
      <button onclick="markReportReviewed('${j.id}')">${j.reportReviewed?'Reviewed':'Mark Reviewed'}</button>
      <button onclick="showTimelineModal('${j.id}')">Timeline</button>
    </div>
  `).join("");
}
function copyInboxReport(id){
  const j=jobs.find(x=>x.id===id);
  if(!j||!j.report){alert("No report available.");return}
  navigator.clipboard.writeText(j.report);
  j.reportSentAt=now().toISOString();
  addTimeline(j,"📋 Report copied by Service Manager","Completed technician write-up copied from Service Manager inbox.");
  save();render();
  alert("Report copied.");
}
function markReportReviewed(id){
  const j=jobs.find(x=>x.id===id);
  if(!j)return;
  j.reportReviewed=true;
  addTimeline(j,"✅ Report reviewed","Service Manager marked technician write-up as reviewed.");
  save();render();
}

function technicianProductivityStatus(prod){
  if(prod===null||prod===undefined||Number.isNaN(prod)) return "Not available today";
  if(prod>=110) return "⭐ Excellent";
  if(prod>=100) return "🟢 On target";
  if(prod>=85) return "🟠 Needs a push";
  return "🔴 Below target";
}
function technicianCoachText(tech,available,sold,prod){
  if(available<=0) return `${tech} is not available today, so productivity is not counted.`;
  const gap=Math.max(0,available-sold);
  if(prod>=110) return `Excellent work. ${tech} is ${Number(prod).toFixed(0)}% productive today.`;
  if(prod>=100) return `${tech} is on target. Completing another job will strengthen today's result.`;
  if(gap>0) return `${tech} needs ${gap.toFixed(1)} more sold hour(s) to reach 100% productivity.`;
  return `${tech} is close to target. Check job allocation and carry-over work.`;
}
function technicianPerformanceCard(tech){
  const available=techAvailableHours(tech);
  const sold=activeSoldHoursForTech(tech);
  const prod=techProductivity(tech);
  const todayList=todayOperationalJobs().filter(j=>j.technician===tech);
  const completedToday=todayList.filter(j=>completed(j)).length;
  const actual=todayList.reduce((s,j)=>s+Number(j.actualHours||0),0);
  const eff=efficiency(sold,actual);
  const current=todayList.find(j=>j.startedAt&&!completed(j))||todayList.find(j=>!completed(j));
  const cls=available===0?"warn":classifyPct(prod||0);
  return `<div class="job-card ${cls}">
    <h3>👨‍🔧 ${tech} — Performance Today</h3>
    <div class="stats">
      <div class="stat"><strong>${techStatusLabel(tech)}</strong>Status</div>
      <div class="stat"><strong>${available.toFixed(1)}</strong>Available Hrs</div>
      <div class="stat"><strong>${sold.toFixed(1)}</strong>Sold Hrs</div>
      <div class="stat"><strong>${available>0?pctText(prod):"N/A"}</strong>Productivity</div>
      <div class="stat"><strong>${pct(eff)}</strong>Efficiency</div>
      <div class="stat"><strong>${completedToday}</strong>Jobs Complete</div>
    </div>
    <p><strong>${technicianProductivityStatus(prod)}</strong></p>
    <p>${technicianCoachText(tech,available,sold,prod)}</p>
    <p><strong>Current / Next Job:</strong> ${current?`${current.reg} — ${current.make||""} ${current.model||""} — ${current.hours} hrs — ${current.status}`:"No active job allocated."}</p>
  </div>`;
}
function renderTech(){
  const f=val("techFilter");
  const techs=f==="All"?getTechs():[f];
  const perf=techs.map(technicianPerformanceCard).join("");
  const today=todayISO();
  const base=f==="All"?jobs:jobs.filter(j=>j.technician===f);
  const list=base.filter(j=>{
    const jobDate=j.bookingDate || (j.createdAt?new Date(j.createdAt).toISOString().split("T")[0]:today);
    return jobDate<=today && !completed(j);
  }).sort((a,b)=>{
    const ad=a.bookingDate || (a.createdAt?new Date(a.createdAt).toISOString().split("T")[0]:today);
    const bd=b.bookingDate || (b.createdAt?new Date(b.createdAt).toISOString().split("T")[0]:today);
    if(ad!==bd) return ad<bd?-1:1;
    return new Date(a.createdAt||0)-new Date(b.createdAt||0);
  });
  $("techJobs").innerHTML=perf+(list.length?list.map(j=>card(j,true,false)).join(""):"<div class='job-card'><p>No active jobs assigned. Completed jobs stay with Service Manager and Vehicle Intelligence.</p></div>");
}function openJob(id){const j=jobs.find(x=>x.id===id);if(!j)return;ensureTimeline(j);activeJobId=id;$("activeTitle").textContent=`${j.jobNo||""} | ${j.reg} — ${j.technician}`;$("activeDetails").textContent=`${j.type} | ${j.make||""} ${j.model||""} | Hours allowed: ${j.hours} | MOT: ${j.mot}`;
$("activeJobInfo").innerHTML=`
  <div><strong>Registration</strong><span>${j.reg}</span></div>
  <div><strong>Customer</strong><span>${j.customer||"Not entered"}</span></div>
  <div><strong>Vehicle</strong><span>${j.make||"Not entered"} ${j.model||""}</span></div>
  <div><strong>Allocated Hours</strong><span>${j.hours} hrs</span></div>
  <div><strong>Actual Time</strong><span>${(j.actualHours||0).toFixed(2)} hrs</span></div>
  <div><strong>Status</strong><span>${j.status}</span></div>
`;
if(j.specialInstructions){
  $("activeSpecialInstructions").classList.remove("hidden");
  $("activeSpecialInstructions").innerHTML=`<strong>Special Instructions</strong><p>${j.specialInstructions}</p>`;
}else{
  $("activeSpecialInstructions").classList.add("hidden");
  $("activeSpecialInstructions").innerHTML="";
}$("status").value=j.status;$("startedAt").textContent=fmt(j.startedAt);$("finishedAt").textContent=fmt(j.finishedAt);$("actualHours").textContent=(j.actualHours||0).toFixed(2);["complaint","findings","repair","parts","advisories"].forEach(id=>$(id).value=j[id]||"");$("generatedReport").textContent=j.report||"No report generated yet.";$("jobComment").value="";renderTimeline(j,$("jobTimeline"));updateClockOffStatus(j);show("activeJobScreen")}function renderTimeline(job,el){ensureTimeline(job);el.innerHTML=job.timeline.length?job.timeline.slice().reverse().map(item=>`<div class="timeline-item"><strong>${timeOnly(item.time)} — ${item.title}</strong><small>${fmt(item.time)}</small><p>${item.detail||""}</p></div>`).join(""):"No timeline events yet."}function showTimelineModal(id){const j=jobs.find(x=>x.id===id);if(!j)return;$("modalTitle").textContent=`Timeline — ${j.reg} ${j.jobNo||""}`;renderTimeline(j,$("modalTimeline"));$("modal").classList.remove("hidden")}$("closeModal").addEventListener("click",()=>$("modal").classList.add("hidden"));$("backToJobs").addEventListener("click",()=>show("techScreen"));$("startTimer").addEventListener("click",()=>{const j=jobs.find(x=>x.id===activeJobId);if(!j)return;if(j.startedAt){alert("Timer already started.");return}j.startedAt=now().toISOString();j.status="🟡 Diagnosis";addTimeline(j,"▶ Technician started work",`${j.technician} started job timer.`);save();openJob(j.id);render()});$("finishTimer").addEventListener("click",()=>{const j=jobs.find(x=>x.id===activeJobId);if(!j)return;if(!j.startedAt){alert("Start timer first.");return}if(j.activeClockOff){alert("Clock back on before finishing the job.");return}j.finishedAt=now().toISOString();j.actualHours=hoursBetween(j.startedAt,j.finishedAt);j.completedAt=j.finishedAt;j.status="✅ Ready for Collection";addTimeline(j,"✅ Job timer finished",`${j.technician} finished job. Actual time: ${j.actualHours.toFixed(2)} hrs.`);addTimeline(j,"✅ Ready for collection","Job marked ready for collection.");save();openJob(j.id);render()});
function sectionLabel(id){
  const labels={
    complaint:"Job Description",
    findings:"Findings",
    repair:"Repair Carried Out",
    parts:"Parts Used / Required",
    advisories:"Advisories"
  };
  return labels[id] || id;
}

$("saveActiveJob").addEventListener("click",()=>{const j=jobs.find(x=>x.id===activeJobId);if(!j)return;const oldStatus=j.status;j.status=val("status");if(oldStatus!==j.status)addTimeline(j,"🔄 Status changed",`Status changed from ${oldStatus} to ${j.status}.`);if(j.status.includes("Ready")&&!j.completedAt){j.completedAt=now().toISOString();addTimeline(j,"✅ Job completed","Job completion time recorded.");}["complaint","findings","repair","parts","advisories"].forEach(id=>{if(val(id)&&val(id)!==j[id])addTimeline(j,`🎤 ${sectionLabel(id)} updated`,val(id).slice(0,160));j[id]=val(id)});j.photoCount=$("photos").files.length;if(j.photoCount>0)addTimeline(j,"📸 Photos added",`${j.photoCount} photo(s) selected for this job.`);j.report=makeReport(j);j.reportReady=true;j.reportReviewed=false;addTimeline(j,"📄 Technician write-up sent","Generated write-up sent automatically to Service Manager completed reports inbox.");$("generatedReport").textContent=j.report;save();renderTimeline(j,$("jobTimeline"));render();alert("Job saved and report sent to Service Manager")});$("addComment").addEventListener("click",()=>{const j=jobs.find(x=>x.id===activeJobId);if(!j)return;const text=val("jobComment");if(!text){alert("Enter a comment first.");return}addTimeline(j,"💬 Comment added",text);$("jobComment").value="";save();renderTimeline(j,$("jobTimeline"));render();});
function updateClockOffStatus(j){
  if(!$("clockOffStatus")) return;
  if(j && j.activeClockOff){
    $("clockOffStatus").textContent = `Currently clocked off for ${j.activeClockOff.reason} since ${timeOnly(j.activeClockOff.start)}.`;
  } else {
    $("clockOffStatus").textContent = "Currently clocked on to job.";
  }
}
const ACTIVITY_REASONS={
  Lunch:{label:"Lunch",category:"neutral",status:null},
  Break:{label:"Break",category:"neutral",status:null},
  "Collecting Vehicle":{label:"Collecting Vehicle",category:"lost",status:null},
  "Delivering Vehicle":{label:"Delivering Vehicle",category:"lost",status:null},
  "Helping Technician":{label:"Helping Technician",category:"productive",status:"🤝 Helping Technician"},
  "Waiting for Parts":{label:"Waiting for Parts",category:"lost",status:"🟠 Awaiting Parts"},
  "Waiting for Authorisation":{label:"Waiting for Authorisation",category:"lost",status:"🟣 Awaiting Customer Approval"},
  "Additional Work Found":{label:"Additional Work Found",category:"productive",status:"🔧 Additional Work Found"},
  "Road Test":{label:"Road Test",category:"productive",status:"🧪 Road Test"},
  "Quality Check":{label:"Quality Check",category:"productive",status:"✅ Quality Check"},
  "Cleaning Vehicle":{label:"Cleaning Vehicle",category:"productive",status:"🧹 Cleaning Vehicle"},
  Paperwork:{label:"Paperwork",category:"neutral",status:null},
  Training:{label:"Training",category:"neutral",status:"🎓 Training"},
  "Workshop Maintenance":{label:"Workshop Maintenance",category:"neutral",status:null},
  "Equipment Issue":{label:"Equipment Issue",category:"lost",status:"⚠️ Equipment Issue"},
  Other:{label:"Other",category:"neutral",status:null}
};
function activityMeta(reason){return ACTIVITY_REASONS[reason]||{label:reason,category:"neutral",status:null}}
function clockOff(reason,customNote=""){
  const j=jobs.find(x=>x.id===activeJobId);
  if(!j) return;
  if(!j.startedAt){alert("Start the job timer first.");return}
  if(j.activeClockOff){alert("Already clocked off. Clock back on first.");return}
  const meta=activityMeta(reason);
  j.interruptions=j.interruptions||[];
  j.activeClockOff={reason,start:now().toISOString(),category:meta.category,note:customNote||""};
  if(meta.status){
    const oldStatus=j.status;
    j.status=meta.status;
    if(oldStatus!==j.status)addTimeline(j,"🔄 Status changed",`Status changed from ${oldStatus} to ${j.status}.`);
  }
  const detail=`${j.technician} clocked off for ${reason}.${customNote?" Note: "+customNote:""}`;
  addTimeline(j,`⏸ Activity - ${reason}`,detail);
  save();updateClockOffStatus(j);render();openJob(j.id);
}
function clockBackOn(){
  const j=jobs.find(x=>x.id===activeJobId);
  if(!j) return;
  if(!j.activeClockOff){alert("Technician is not currently clocked off.");return}
  const end=now().toISOString();
  const duration=hoursBetween(j.activeClockOff.start,end);
  j.interruptions=j.interruptions||[];
  j.interruptions.push({reason:j.activeClockOff.reason,category:j.activeClockOff.category||activityMeta(j.activeClockOff.reason).category,start:j.activeClockOff.start,end,duration,note:j.activeClockOff.note||""});
  addTimeline(j,`▶ Back on job`,`${j.technician} returned from ${j.activeClockOff.reason}. Time: ${duration.toFixed(2)} hrs.`);
  j.activeClockOff=null;
  save();openJob(j.id);render();
}
function bindActivityButton(id,reason,askNote=false){
  const el=$(id); if(!el) return;
  el.addEventListener("click",()=>{
    let note="";
    if(askNote){note=prompt("Add a short note:")||"";}
    clockOff(reason,note);
  });
}
bindActivityButton("clockLunch","Lunch");
bindActivityButton("clockBreak","Break");
bindActivityButton("clockCollecting","Collecting Vehicle");
bindActivityButton("clockDelivering","Delivering Vehicle");
bindActivityButton("clockHelping","Helping Technician");
bindActivityButton("clockWaitingParts","Waiting for Parts");
bindActivityButton("clockWaitingAuth","Waiting for Authorisation");
bindActivityButton("clockAdditionalWork","Additional Work Found",true);
bindActivityButton("clockRoadTest","Road Test");
bindActivityButton("clockQualityCheck","Quality Check");
bindActivityButton("clockCleaning","Cleaning Vehicle");
bindActivityButton("clockPaperwork","Paperwork");
bindActivityButton("clockTraining","Training");
bindActivityButton("clockMaintenance","Workshop Maintenance");
bindActivityButton("clockEquipment","Equipment Issue",true);
bindActivityButton("clockOther","Other",true);
if($("clockBackOn")) $("clockBackOn").addEventListener("click",clockBackOn);
function interruptionHours(job,reason){
  return (job.interruptions||[]).filter(i=>i.reason===reason).reduce((s,i)=>s+Number(i.duration||0),0);
}
function totalInterruptionHours(job){
  return (job.interruptions||[]).reduce((s,i)=>s+Number(i.duration||0),0);
}
function withinDays(dt,days){
  if(!dt) return false;
  const d=new Date(dt); const nowDate=new Date();
  return (nowDate-d)/(1000*60*60*24) <= days;
}
function downtimeTotals(days){
  const relevant=jobs.filter(j=>withinDays(j.createdAt,days)||withinDays(j.completedAt,days)||withinDays(j.bookingDate,days));
  const totals={Lunch:0,Idle:0,"Collecting Car":0};
  relevant.forEach(j=>(j.interruptions||[]).forEach(i=>{if(totals[i.reason]!==undefined) totals[i.reason]+=Number(i.duration||0)}));
  return totals;
}
function renderDowntimeReports(){
  const today=downtimeTotals(1);
  const week=downtimeTotals(7);
  const html = `
    <div class="job-card"><h3>Today</h3><p>Lunch: ${today.Lunch.toFixed(2)} hrs</p><p>Idle: ${today.Idle.toFixed(2)} hrs</p><p>Collecting Cars: ${today["Collecting Car"].toFixed(2)} hrs</p></div>
    <div class="job-card"><h3>This Week</h3><p>Lunch: ${week.Lunch.toFixed(2)} hrs</p><p>Idle: ${week.Idle.toFixed(2)} hrs</p><p>Collecting Cars: ${week["Collecting Car"].toFixed(2)} hrs</p></div>
  `;
  if($("downtimeReports")) $("downtimeReports").innerHTML=html;
  if($("ownerDowntimeReports")) $("ownerDowntimeReports").innerHTML=html;
}

function makeReport(j){const eff=efficiency(Number(j.hours||0),Number(j.actualHours||0));return `PCA WORKSHOP AI REPORT\\n\\nJob Number: ${j.jobNo}\\nRegistration: ${j.reg}\\nVehicle: ${j.make||"Not entered"} ${j.model||""}\\nMileage: ${j.mileage||"Not entered"}\\nCustomer: ${j.customer||"Not entered"}\\nTelephone: ${j.phone||"Not entered"}\\n\\nCreated: ${fmt(j.createdAt)}\\nBooking Date: ${j.bookingDate}\\nCompleted: ${fmt(j.completedAt)}\\n\\nJob Type: ${j.type}\\nTechnician: ${j.technician}\\nLabour Hours Allowed: ${j.hours}\\nActual Hours Clocked: ${(j.actualHours||0).toFixed(2)}\\nEfficiency: ${pct(eff)}\\nMOT: ${j.mot}\\nPriority: ${j.priority}\\nStatus: ${j.status}\\nCustomer Authorisation: ${j.auth}\\nPhotos Added: ${j.photoCount}\\n\\nAI JOB SUMMARY\\n${jobSummary(j)}\\n\\nWORK REQUIRED\\n${j.workRequired||"Not entered"}\\n\\nJOB DESCRIPTION\\n${j.complaint||"Not entered"}\\n\\nTECHNICIAN FINDINGS\\n${j.findings||"Not entered"}\\n\\nREPAIR CARRIED OUT\\n${j.repair||"Not entered"}\\n\\nPARTS USED / REQUIRED\\n${j.parts||"Not entered"}\\n\\nADVISORIES\\n${j.advisories||"None entered"}\\n\\nDRAGON 2000 DESCRIPTION\\n${dragon(j)}\\n\\nTIMELINE EVENTS\\n${(j.timeline||[]).map(t=>`${timeOnly(t.time)} - ${t.title}: ${t.detail}`).join("\\n")}`}function jobSummary(j){let bits=[];if(j.findings)bits.push(j.findings);if(j.repair)bits.push(j.repair);if(j.advisories)bits.push("Advisories: "+j.advisories);return bits.length?bits.join(" "):"Job opened. Awaiting technician findings and repair summary."}function dragon(j){return (j.repair||j.findings||j.workRequired||"Job opened. Awaiting technician update.").slice(0,220)}function amendHours(id){const j=jobs.find(x=>x.id===id);if(!j)return;const newHours=Number(prompt(`Current hours: ${j.hours}\\nEnter new labour hours:`));if(!newHours||newHours<=0)return;addTimeline(j,"⏱ Labour hours amended",`Hours changed from ${j.hours} to ${newHours} by Service Manager.`);j.hours=newHours;if(j.report)j.report=makeReport(j);save();render()}function reassignTech(id){const j=jobs.find(x=>x.id===id);if(!j)return;const newTech=prompt(`Current technician: ${j.technician}\\nEnter new technician:`);if(!newTech)return;addTimeline(j,"👨‍🔧 Technician reassigned",`Changed from ${j.technician} to ${newTech} by Service Manager.`);j.technician=newTech;save();render()}function managerComment(id){const j=jobs.find(x=>x.id===id);if(!j)return;const text=prompt("Add manager comment to timeline:");if(!text)return;addTimeline(j,"💬 Manager comment",text);save();render()}function renderDash(){const totalAllowed=jobs.reduce((s,j)=>s+Number(j.hours||0),0);const totalActual=jobs.reduce((s,j)=>s+Number(j.actualHours||0),0);const workshopEff=efficiency(totalAllowed,totalActual);const utilisation=targets.availableHours>0?(totalAllowed/targets.availableHours)*100:null;const retail=sumType("Retail"),internal=sumType("Internal"),warranty=sumType("Warranty");const internalCompleted=jobs.filter(j=>j.type==="Internal"&&completed(j)).length;const waitingParts=jobs.filter(j=>j.status&&j.status.includes("Awaiting Parts")).length;const health=garageHealth({workshopEff,utilisation,retail,internal,warranty,internalCompleted,waitingParts});$("healthScore").innerHTML=`Garage Health: ${health.score}/100 ${health.score>=85?"🟢":health.score>=65?"🟠":"🔴"}<br><span>${health.message}</span>`;$("ownerStats").innerHTML=`<div class="stat"><strong>${getLiveJobCount()}</strong>Jobs</div><div class="stat"><strong>${totalAllowed.toFixed(1)}</strong>Allowed Hrs</div><div class="stat"><strong>${totalActual.toFixed(1)}</strong>Actual Hrs</div><div class="stat"><strong>${pct(workshopEff)}</strong>Efficiency</div><div class="stat"><strong>${pct(utilisation)}</strong>Utilisation</div><div class="stat ${waitingParts>0?'warn':'good'}"><strong>${waitingParts}</strong>Parts Required</div>`;renderLiveActivity();renderCoach({workshopEff,utilisation,retail,internal,warranty,internalCompleted,waitingParts});renderLeague("leagueTable");renderLeague("leagueTableOwner");renderScorecard({workshopEff,utilisation,retail,internal,warranty,internalCompleted});renderStatusBoard("statusBoard");renderStatusBoard("ownerStatusBoard");renderWorkload();renderDowntimeReports()}function garageHealth(m){let score=100;if(m.workshopEff!==null&&m.workshopEff<(targets.efficiency||95))score-=15;if(m.utilisation!==null&&m.utilisation<85)score-=15;if(targets.retailHours&&m.retail<targets.retailHours)score-=15;if(targets.internalCars&&m.internalCompleted<targets.internalCars)score-=10;if(m.waitingParts>0)score-=5*Math.min(m.waitingParts,3);score=Math.max(0,Math.round(score));return {score,message:score>=85?"Workshop is performing strongly.":score>=65?"Workshop needs attention in some areas.":"Workshop requires urgent management focus."}}function allEvents(){let events=[];const liveJobs=typeof getLiveWorkshopJobs==="function"?getLiveWorkshopJobs():jobs;liveJobs.forEach(j=>{ensureTimeline(j).forEach(t=>events.push({...t,reg:j.reg,jobNo:j.jobNo,tech:j.technician}))});return events.sort((a,b)=>new Date(b.time)-new Date(a.time)).slice(0,25)}function renderLiveActivity(){$("liveActivity").innerHTML=allEvents().length?allEvents().map(e=>`<div class="timeline-item"><strong>${timeOnly(e.time)} — ${e.reg} — ${e.title}</strong><small>${fmt(e.time)} | ${e.tech}</small><p>${e.detail||""}</p></div>`).join(""):"No activity yet."}function sumType(type){return jobs.filter(j=>j.type===type&&completed(j)).reduce((s,j)=>s+Number(j.hours||0),0)}function kpiCard(label,target,actual,unit=""){const pctDone=target>0?(actual/target)*100:null;let cls="warn";if(pctDone===null)cls="warn";else if(pctDone>=100)cls="good";else if(pctDone<80)cls="bad";return `<div class="job-card ${cls}"><h3>${label}</h3><p><strong>${actual.toFixed?actual.toFixed(1):actual}${unit}</strong> / ${target||0}${unit} ${pctDone!==null?`(${pctDone.toFixed(0)}%)`:""}</p><div class="progress"><div class="bar ${cls}" style="width:${Math.min(100,pctDone||0)}%"></div></div></div>`}function renderScorecard(m){$("kpiScorecard").innerHTML=kpiCard("Workshop efficiency",targets.efficiency||95,m.workshopEff||0,"%")+kpiCard("Workshop utilisation",100,m.utilisation||0,"%")+kpiCard("Retail hours completed",targets.retailHours,m.retail," hrs")+kpiCard("Warranty hours completed",targets.warrantyHours,m.warranty," hrs")+kpiCard("Internal hours completed",targets.internalHours,m.internal," hrs")+kpiCard("Internal cars completed",targets.internalCars,m.internalCompleted,"")}function techMetrics(t){const list=jobs.filter(j=>j.technician===t);const allowed=list.reduce((s,j)=>s+Number(j.hours||0),0);const actual=list.reduce((s,j)=>s+Number(j.actualHours||0),0);return {tech:t,jobs:list.length,allowed,actual,eff:efficiency(allowed,actual),retail:list.filter(j=>j.type==="Retail").reduce((s,j)=>s+Number(j.hours||0),0),warranty:list.filter(j=>j.type==="Warranty").reduce((s,j)=>s+Number(j.hours||0),0),internal:list.filter(j=>j.type==="Internal").reduce((s,j)=>s+Number(j.hours||0),0)}}function renderLeague(id){const rows=getTechs().map(techMetrics).sort((a,b)=>(b.eff||0)-(a.eff||0));$(id).innerHTML=`<table><thead><tr><th>Rank</th><th>Technician</th><th>Efficiency</th><th>Hours Sold</th><th>Hours Clocked</th><th>Jobs</th><th>Retail</th><th>Warranty</th><th>Internal</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td>${i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1}</td><td>${r.tech}</td><td>${pct(r.eff)}</td><td>${r.allowed.toFixed(1)}</td><td>${r.actual.toFixed(1)}</td><td>${r.jobs}</td><td>${r.retail.toFixed(1)}</td><td>${r.warranty.toFixed(1)}</td><td>${r.internal.toFixed(1)}</td></tr>`).join("")}</tbody></table>`}function renderCoach(m){let notes=[];if(m.workshopEff!==null&&m.workshopEff<(targets.efficiency||95))notes.push(["Improve workshop efficiency",`Workshop efficiency is ${m.workshopEff.toFixed(0)}%, below the ${targets.efficiency||95}% target. Review jobs where actual clocked time exceeded allocated hours.`,"bad"]);else notes.push(["Efficiency on target","Workshop efficiency is currently on or above target based on completed clocked work.","good"]);if(m.utilisation!==null&&m.utilisation<85)notes.push(["Increase workshop utilisation",`Allocated hours are ${m.utilisation.toFixed(0)}% of available capacity. Look for extra retail work or bring internal prep forward.`,"warn"]);if(targets.retailHours&&m.retail<targets.retailHours)notes.push(["Retail hours below target",`Retail completed hours are ${m.retail.toFixed(1)} against a target of ${targets.retailHours}. Prioritise authorised retail work today.`,"bad"]);if(targets.internalCars&&m.internalCompleted<targets.internalCars)notes.push(["Internal cars need attention",`Internal cars completed are ${m.internalCompleted} against a target of ${targets.internalCars}. Review sales prep bottlenecks.`,"warn"]);if(m.waitingParts>0)notes.push(["Parts delay risk",`${m.waitingParts} job(s) are awaiting parts. Review parts queue to reduce technician downtime.`,"warn"]);$("ownerCoach").innerHTML=notes.map(n=>`<div class="coach-card ${n[2]}"><h3>${n[0]}</h3><p>${n[1]}</p></div>`).join("")}function renderStatusBoard(id){const statuses=["🔵 Waiting to Start","🟡 Diagnosis","🟠 Awaiting Parts","🟣 Awaiting Customer Approval","🟢 Repair Complete","✅ Ready for Collection"];$(id).innerHTML=statuses.map(st=>{const boardJobs=typeof getLiveWorkshopJobs==="function"?getLiveWorkshopJobs():jobs;const list=boardJobs.filter(j=>j.status===st);return `<div class="board-column" data-status="${st}"><h3>${st}</h3>${list.length?list.map(j=>`<div class="board-job" draggable="true" data-job-id="${j.id}"><strong>${j.reg}</strong><br>${j.technician} | ${j.hours} hrs<br>${j.type} | ${j.mot}<br><button onclick="showTimelineModal('${j.id}')">Timeline</button></div>`).join(""):"<p class='muted'>No jobs</p>"}</div>`}).join("");setTimeout(enableDragDropBoard,0)}function renderWorkload(){$("workload").innerHTML=getTechs().map(t=>{const r=techMetrics(t);return `<div class="job-card"><h3>${t}</h3><p>${r.jobs} jobs | ${r.allowed.toFixed(1)} allowed hrs | ${r.actual.toFixed(1)} actual hrs | Efficiency: ${pct(r.eff)}</p></div>`}).join("")}
function renderReportsInterface(){
  if(!$("reportsTopStats")) return;
  const totalAllowed=jobs.reduce((s,j)=>s+Number(j.hours||0),0);
  const totalActual=jobs.reduce((s,j)=>s+Number(j.actualHours||0),0);
  const workshopEff=efficiency(totalAllowed,totalActual);
  const completedJobs=jobs.filter(j=>completed(j)).length;
  $("reportsTopStats").innerHTML=`
    <div class="stat"><strong>${jobs.length}</strong>Total Jobs</div>
    <div class="stat"><strong>${completedJobs}</strong>Completed</div>
    <div class="stat"><strong>${totalAllowed.toFixed(1)}</strong>Allowed Hrs</div>
    <div class="stat"><strong>${totalActual.toFixed(1)}</strong>Actual Hrs</div>
    <div class="stat"><strong>${pct(workshopEff)}</strong>Efficiency</div>
  `;
  $("reportsPerformance").innerHTML=
    kpiCard("Retail hours completed",targets.retailHours,sumType("Retail")," hrs")+
    kpiCard("Warranty hours completed",targets.warrantyHours,sumType("Warranty")," hrs")+
    kpiCard("Internal hours completed",targets.internalHours,sumType("Internal")," hrs")+
    kpiCard("Internal cars completed",targets.internalCars,jobs.filter(j=>j.type==="Internal"&&completed(j)).length,"");
  const today=downtimeTotals ? downtimeTotals(1) : {Lunch:0,Idle:0,"Collecting Car":0};
  const week=downtimeTotals ? downtimeTotals(7) : {Lunch:0,Idle:0,"Collecting Car":0};
  $("reportsDowntime").innerHTML=`
    <div class="job-card"><h3>Today</h3><p>Lunch: ${today.Lunch.toFixed(2)} hrs</p><p>Idle: ${today.Idle.toFixed(2)} hrs</p><p>Collecting Cars: ${today["Collecting Car"].toFixed(2)} hrs</p></div>
    <div class="job-card"><h3>This Week</h3><p>Lunch: ${week.Lunch.toFixed(2)} hrs</p><p>Idle: ${week.Idle.toFixed(2)} hrs</p><p>Collecting Cars: ${week["Collecting Car"].toFixed(2)} hrs</p></div>`;
  const completedReports=jobs.filter(j=>j.report && (j.reportReady || completed(j))).sort((a,b)=>new Date(b.completedAt||b.finishedAt||b.createdAt)-new Date(a.completedAt||a.finishedAt||a.createdAt));
  $("reportsCompletedWriteups").innerHTML=completedReports.length?completedReports.map(j=>`
    <div class="job-card ${j.reportReviewed?'good':'warn'}">
      <h3>${j.jobNo||""} | ${j.reg} — ${j.technician}</h3>
      <p>${j.make||""} ${j.model||""} | ${j.type} | ${fmt(j.completedAt||j.finishedAt)}</p>
      <button onclick="copyInboxReport('${j.id}')">Copy Report</button>
      <button onclick="showTimelineModal('${j.id}')">Timeline</button>
    </div>`).join(""):"No completed write-ups yet.";
  renderLeague("reportsLeagueTable");
}


function selectedPlannerDate(){
  return $("plannerDate") && $("plannerDate").value ? $("plannerDate").value : todayISO();
}
function jobMatchesPlannerDay(j){
  const d=selectedPlannerDate();
  return (j.bookingDate||todayISO())===d;
}
function renderDailyPlanner(){
  if(!$("plannerSummary")) return;
  const dayJobs=jobs.filter(jobMatchesPlannerDay);
  const capacity=Number($("dailyTechCapacity") ? $("dailyTechCapacity").value : plannerSettings.capacity)||8;
  const retail=dayJobs.filter(j=>j.type==="Retail").length;
  const warranty=dayJobs.filter(j=>j.type==="Warranty").length;
  const internal=dayJobs.filter(j=>j.type==="Internal").length;
  const mot=dayJobs.filter(j=>j.mot&&j.mot!=="None").length;
  const totalHours=dayJobs.reduce((s,j)=>s+Number(j.hours||0),0);
  $("plannerSummary").innerHTML=`
    <div class="stat"><strong>${dayJobs.length}</strong>Jobs Booked</div>
    <div class="stat"><strong>${retail}</strong>Retail</div>
    <div class="stat"><strong>${warranty}</strong>Warranty</div>
    <div class="stat"><strong>${internal}</strong>Internal</div>
    <div class="stat"><strong>${totalHours.toFixed(1)}</strong>Hours</div>
  `;
  const techHtml=getTechs().map(t=>{
    const list=dayJobs.filter(j=>j.technician===t);
    const hrs=list.reduce((s,j)=>s+Number(j.hours||0),0);
    const pctUsed=capacity>0?(hrs/capacity)*100:0;
    let label="🟢 On Target", cls="capacity-good", fill="planner-fill";
    if(pctUsed>110){label="🔴 Overloaded";cls="capacity-bad";fill="planner-fill bad"}
    else if(pctUsed<70 && list.length>0){label="🟠 Capacity Available";cls="capacity-warn";fill="planner-fill warn"}
    else if(list.length===0){label="⚪ No Jobs Allocated";cls="capacity-warn";fill="planner-fill warn"}
    return `<div class="job-card">
      <h3>${t}</h3>
      <p><strong>${hrs.toFixed(1)}</strong> hrs allocated / ${capacity.toFixed(1)} hrs capacity</p>
      <p>${list.length} job(s)</p>
      <span class="capacity-label ${cls}">${label}</span>
      <div class="planner-bar"><div class="${fill}" style="width:${Math.min(100,pctUsed)}%"></div></div>
    </div>`;
  }).join("");
  $("plannerTechnicians").innerHTML=techHtml;
  $("plannerJobs").innerHTML=dayJobs.length?dayJobs.map(j=>card(j,true,true)).join(""):"No jobs booked for this day.";
  renderPlannerSuggestions(dayJobs,capacity);renderUpcomingWorkload();
}
function renderPlannerSuggestions(dayJobs,capacity){
  if(!$("plannerSuggestions")) return;
  let notes=[];
  const byTech=getTechs().map(t=>{
    const list=dayJobs.filter(j=>j.technician===t);
    const hrs=list.reduce((s,j)=>s+Number(j.hours||0),0);
    return {tech:t,hrs,jobs:list.length};
  });
  const overloaded=byTech.filter(t=>t.hrs>capacity*1.1);
  const available=byTech.filter(t=>t.hrs<capacity*.7);
  if(overloaded.length){
    notes.push(["Rebalance overloaded technicians",`${overloaded.map(t=>`${t.tech} (${t.hrs.toFixed(1)} hrs)`).join(", ")} appear overloaded. Consider moving a routine/internal job to a technician with spare capacity.`,"bad"]);
  }
  if(available.length){
    notes.push(["Spare workshop capacity",`${available.map(t=>`${t.tech} (${t.hrs.toFixed(1)} hrs)`).join(", ")} have available capacity. Consider adding retail work or bringing internal prep forward.`,"warn"]);
  }
  const waitingApproval=dayJobs.filter(j=>j.status&&j.status.includes("Approval")).length;
  if(waitingApproval) notes.push(["Customer approval focus",`${waitingApproval} job(s) are waiting for customer approval. Prioritise customer calls to keep the workshop moving.`,"warn"]);
  const waitingParts=dayJobs.filter(j=>j.status&&j.status.includes("Awaiting Parts")).length;
  if(waitingParts) notes.push(["Parts bottleneck",`${waitingParts} job(s) are awaiting parts. Check ETA and update technicians.`,"warn"]);
  if(!notes.length) notes.push(["Planner looks balanced","Today's workload appears balanced across technicians based on allocated hours.","good"]);
  $("plannerSuggestions").innerHTML=notes.map(n=>`<div class="coach-card ${n[2]}"><h3>${n[0]}</h3><p>${n[1]}</p></div>`).join("");
}
if($("savePlannerSettings")) $("savePlannerSettings").addEventListener("click",()=>{
  plannerSettings.capacity=Number($("dailyTechCapacity")?$("dailyTechCapacity").value:8)||8;
  localStorage.setItem("workshopAIPlannerSettings",JSON.stringify(plannerSettings));
  renderDailyPlanner();
  alert("Planner settings updated");
});
if($("plannerDate")) $("plannerDate").addEventListener("change",renderDailyPlanner);


function submitPartsRequest(){
  const j=jobs.find(x=>x.id===activeJobId);
  if(!j) return;
  const description=val("partDescription");
  if(!description){alert("Enter the part description.");return}
  const qty=Number(val("partQty"))||1;
  const priority=val("partPriority")||"Today";
  const supplier=val("partSupplier")||"";
  j.partsRequests=j.partsRequests||[];
  j.partsRequests.push({
    id:Date.now().toString(),
    description,
    qty,
    priority,
    supplier,
    text:`${qty} x ${description}${supplier? " ("+supplier+")":""}`,
    status:"Requested",
    requestedAt:now().toISOString(),
    orderedAt:null,
    receivedAt:null,
    fittedAt:null,
    technicianAlert:"Requested",
    serviceManagerAlert:"Requested"
  });
  addTimeline(j,"📦 Part requested",`${qty} x ${description}. Priority: ${priority}${supplier? ". Supplier/note: "+supplier:""}`);
  const mustWait=confirm("Does the technician need to stop this job until the parts arrive?\n\nOK = mark job as Awaiting Parts.\nCancel = keep working and leave the job status unchanged.");
  if(mustWait){
    const oldStatus=j.status;
    j.status="🟠 Awaiting Parts";
    addTimeline(j,"🟠 Awaiting parts",`Status changed from ${oldStatus} to ${j.status} because the technician cannot continue without these parts.`);
  }else{
    addTimeline(j,"▶ Job continues while parts are ordered","Parts requested, but technician can continue working. Job status was not changed to Awaiting Parts.");
  }
  $("partDescription").value="";
  $("partQty").value=1;
  $("partSupplier").value="";
  save();renderTechnicianPartsStatus(j);render();alert("Part request sent to Service Manager.");
}
if($("submitPartsRequest")) $("submitPartsRequest").addEventListener("click",submitPartsRequest);

function technicianPartAlertText(p){
  if(p.status==="Ordered") return `📦 Parts ordered — ${p.qty||1} x ${p.description||p.text} has been ordered. Confirm when the parts arrive in the workshop.`;
  if(p.status==="Received") return `✅ Parts received — ${p.qty||1} x ${p.description||p.text} is with the technician. Continue the repair.`;
  if(p.status==="Partial Delivery") return `⚠️ Partial delivery reported — Service Manager action required.`;
  if(p.status==="Incorrect Parts") return `❌ Incorrect parts reported — Service Manager action required.`;
  if(p.status==="Fitted") return `🔧 Part fitted — ${p.qty||1} x ${p.description||p.text} has been fitted.`;
  return `🚨 Parts requested — waiting for Service Manager action.`;
}
function renderTechnicianPartsStatus(job){
  const el=$("technicianPartsStatus");
  if(!el) return;
  const list=job.partsRequests||[];
  if(!list.length){el.innerHTML="No parts requested for this job.";return}
  el.innerHTML=list.map(p=>`
    <div class="job-card parts-request-card ${p.status==="Received"?"good":p.status==="Ordered"?"warn":(p.status==="Partial Delivery"||p.status==="Incorrect Parts")?"bad":""}">
      <h3>${technicianPartAlertText(p)}</h3>
      <p><strong>Part:</strong> ${p.qty||1} x ${p.description||p.text}</p>
      <p><strong>Priority:</strong> ${p.priority||"Today"} ${p.supplier? " | <strong>Supplier:</strong> "+p.supplier:""}</p>
      <p><strong>Requested:</strong> ${fmt(p.requestedAt)}${p.orderedAt?" | <strong>Ordered:</strong> "+fmt(p.orderedAt):""}${p.receivedAt?" | <strong>Received:</strong> "+fmt(p.receivedAt):""}${p.issueAt?" | <strong>Issue:</strong> "+fmt(p.issueAt):""}</p>
      ${p.issueNote?`<p><strong>Issue note:</strong> ${p.issueNote}</p>`:""}
      <span class="part-pill ${(p.status||"requested").toLowerCase().replaceAll(" ","-")}">${p.status}</span>
      <div class="parts-actions">
        ${p.status==="Ordered"?`<button onclick="technicianReceiveParts('${job.id}','${p.id}','all')">✅ Parts Received</button><button onclick="technicianReceiveParts('${job.id}','${p.id}','partial')">⚠️ Partial Delivery</button><button onclick="technicianReceiveParts('${job.id}','${p.id}','incorrect')">❌ Incorrect Parts</button>`:""}
        ${p.status==="Received"?`<button onclick="markPartFitted('${job.id}','${p.id}')">Mark Fitted</button>`:""}
      </div>
    </div>`).join("");
}
function allPartsRequests(){
  let rows=[];
  jobs.forEach(j=>(j.partsRequests||[]).forEach(p=>rows.push({job:j,part:p})));
  return rows.sort((a,b)=>new Date(b.part.requestedAt)-new Date(a.part.requestedAt));
}
function renderPartsQueues(){
  const el=$("servicePartsQueue");
  if(!el) return;
  const rows=allPartsRequests().filter(r=>r.part.status!=="Fitted");
  if(!rows.length){el.innerHTML="No outstanding parts requested yet.";return}
  el.innerHTML=rows.map(({job,part})=>partsCard(job,part)).join("");
}
function partsCard(job,part){
  return `<div class="job-card parts-request-card">
    <h3>${job.reg} — ${job.technician}</h3>
    <p><strong>Part:</strong> ${part.qty||1} x ${part.description||part.text}</p>
    <p><strong>Priority:</strong> ${part.priority||"Today"} ${part.supplier? " | <strong>Supplier:</strong> "+part.supplier:""}</p>
    <p><strong>Status:</strong> <span class="part-pill ${(part.status||"requested").toLowerCase().replaceAll(" ","-")}">${part.status}</span></p>
    <p><strong>Requested:</strong> ${fmt(part.requestedAt)}${part.orderedAt?" | <strong>Ordered:</strong> "+fmt(part.orderedAt):""}${part.receivedAt?" | <strong>Received by technician:</strong> "+fmt(part.receivedAt):""}</p>
    ${part.issueNote?`<p><strong>Issue note:</strong> ${part.issueNote}</p>`:""}
    <div class="parts-actions">
      ${["Requested","Partial Delivery","Incorrect Parts"].includes(part.status)?`<button onclick="markPartOrdered('${job.id}','${part.id}')">Mark Ordered</button>`:""}
      ${part.status==="Received"?`<button onclick="markPartFitted('${job.id}','${part.id}')">Mark Fitted</button>`:""}
      <button onclick="showTimelineModal('${job.id}')">Timeline</button>
    </div>
  </div>`;
}
function markPartOrdered(jobId,partId){
  const j=jobs.find(x=>x.id===jobId); if(!j) return;
  const p=(j.partsRequests||[]).find(x=>x.id===partId); if(!p) return;
  p.status="Ordered"; p.orderedAt=now().toISOString();
  p.technicianAlert="Ordered";
  p.serviceManagerAlert="Ordered";
  p.issueNote="";
  addTimeline(j,"📦 Parts ordered",`${p.description||p.text} marked ordered by Service Manager. Technician alert updated.`);
  save();render();alert("Technician has been notified that the parts have been ordered.");
}
function resumeStatusAfterParts(){
  return "🟡 Started Repair";
}
function technicianReceiveParts(jobId,partId,result){
  const j=jobs.find(x=>x.id===jobId); if(!j) return;
  const p=(j.partsRequests||[]).find(x=>x.id===partId); if(!p) return;
  if(result==="all"){
    p.status="Received";
    p.receivedAt=now().toISOString();
    p.technicianAlert="Received";
    p.serviceManagerAlert="Received";
    p.issueNote="";
    addTimeline(j,"✅ Parts received by technician",`${p.qty||1} x ${p.description||p.text} received in the workshop by ${j.technician}.`);
    if((j.partsRequests||[]).every(x=>["Received","Fitted"].includes(x.status)) && (j.status||"").includes("Awaiting Parts")){
      const old=j.status;
      j.status=resumeStatusAfterParts();
      addTimeline(j,"▶ Repair resumed",`Status changed from ${old} to ${j.status} after parts were received.`);
    }
    alert("Parts received recorded. Service Manager has been updated.");
  }else if(result==="partial"){
    const note=prompt("What is missing from the delivery?")||"Partial delivery reported by technician.";
    p.status="Partial Delivery";
    p.issueAt=now().toISOString();
    p.issueNote=note;
    p.technicianAlert="Partial Delivery";
    p.serviceManagerAlert="Partial Delivery";
    addTimeline(j,"⚠️ Partial parts delivery",`${p.description||p.text}: ${note}`);
    alert("Partial delivery alert sent to Service Manager.");
  }else if(result==="incorrect"){
    const note=prompt("What is wrong with the parts?")||"Incorrect parts reported by technician.";
    p.status="Incorrect Parts";
    p.issueAt=now().toISOString();
    p.issueNote=note;
    p.technicianAlert="Incorrect Parts";
    p.serviceManagerAlert="Incorrect Parts";
    addTimeline(j,"❌ Incorrect parts",`${p.description||p.text}: ${note}`);
    alert("Incorrect parts alert sent to Service Manager.");
  }
  save();renderTechnicianPartsStatus(j);render();
}

function markPartDelivered(jobId,partId){
  // Legacy support only. Parts should now be confirmed as received by the technician.
  const j=jobs.find(x=>x.id===jobId); if(!j) return;
  const p=(j.partsRequests||[]).find(x=>x.id===partId); if(!p) return;
  p.status="Received"; p.receivedAt=now().toISOString();
  p.technicianAlert="Received";
  p.serviceManagerAlert="Received";
  addTimeline(j,"✅ Parts received",`${p.description||p.text} marked received.`);
  if((j.partsRequests||[]).every(x=>["Received","Fitted"].includes(x.status)) && j.status.includes("Awaiting Parts")) j.status=resumeStatusAfterParts();
  save();render();
}


function markPartFitted(jobId,partId){
  const j=jobs.find(x=>x.id===jobId); if(!j) return;
  const p=(j.partsRequests||[]).find(x=>x.id===partId); if(!p) return;
  p.status="Fitted"; p.fittedAt=now().toISOString();
  p.technicianAlert="Fitted";
  p.serviceManagerAlert="Cleared";
  addTimeline(j,"🔧 Part fitted",`${p.description||p.text} marked fitted.`);
  save();render();
}
function renderPartsManagement(){
  const stats=$("partsManagementStats");
  const queue=$("partsManagementQueue");
  const delivered=$("partsDeliveredQueue");
  if(!stats||!queue||!delivered) return;
  const rows=allPartsRequests();
  const requested=rows.filter(r=>r.part.status==="Requested").length;
  const ordered=rows.filter(r=>r.part.status==="Ordered").length;
  const receivedCount=rows.filter(r=>r.part.status==="Received").length;
  const fitted=rows.filter(r=>r.part.status==="Fitted").length;
  stats.innerHTML=`
    <div class="stat"><strong>${rows.length}</strong>Total</div>
    <div class="stat"><strong>${requested}</strong>Requested</div>
    <div class="stat"><strong>${ordered}</strong>Ordered</div>
    <div class="stat"><strong>${receivedCount}</strong>Received</div>
    <div class="stat"><strong>${fitted}</strong>Fitted</div>`;
  const outstanding=rows.filter(r=>r.part.status!=="Fitted");
  queue.innerHTML=outstanding.length?outstanding.map(({job,part})=>partsCard(job,part)).join(""):"No outstanding parts.";
  const completedRows=rows.filter(r=>r.part.status==="Fitted");
  delivered.innerHTML=completedRows.length?completedRows.map(({job,part})=>partsCard(job,part)).join(""):"No fitted parts yet.";
}

function moveJobToStatus(jobId,newStatus){
  const j=jobs.find(x=>x.id===jobId); if(!j) return;
  const old=j.status;
  if(old===newStatus) return;
  j.status=newStatus;
  addTimeline(j,"🧲 Job moved on workshop board",`Status changed from ${old} to ${newStatus} by drag and drop.`);
  if(newStatus.includes("Ready")&&!j.completedAt) j.completedAt=now().toISOString();
  save();render();
}
function enableDragDropBoard(){
  document.querySelectorAll(".board-job").forEach(el=>{
    el.draggable=true;
    el.addEventListener("dragstart",e=>{e.dataTransfer.setData("text/plain",el.dataset.jobId)});
  });
  document.querySelectorAll(".board-column").forEach(col=>{
    col.addEventListener("dragover",e=>{e.preventDefault();col.classList.add("drag-over")});
    col.addEventListener("dragleave",()=>col.classList.remove("drag-over"));
    col.addEventListener("drop",e=>{
      e.preventDefault();col.classList.remove("drag-over");
      const jobId=e.dataTransfer.getData("text/plain");
      const status=col.dataset.status;
      if(jobId&&status) moveJobToStatus(jobId,status);
    });
  });
}
function renderEndOfDayBriefing(){
  const briefing=buildEndOfDayBriefing();
  const morning=buildMorningBriefing();
  if($("endOfDayBriefing")) $("endOfDayBriefing").textContent=briefing;
  if($("reportsEndOfDayBriefing")) $("reportsEndOfDayBriefing").textContent=briefing;
  if($("serviceManagerEndOfDayBriefing")) $("serviceManagerEndOfDayBriefing").textContent=briefing;
  if($("morningBriefing")) $("morningBriefing").textContent=morning;
  if($("reportsMorningBriefing")) $("reportsMorningBriefing").textContent=morning;
  if($("serviceManagerMorningBriefing")) $("serviceManagerMorningBriefing").textContent=morning;
}
function buildEndOfDayBriefing(){
  const total=jobs.length;
  const complete=jobs.filter(j=>completed(j)).length;
  const totalAllowed=jobs.reduce((s,j)=>s+Number(j.hours||0),0);
  const totalActual=jobs.reduce((s,j)=>s+Number(j.actualHours||0),0);
  const eff=efficiency(totalAllowed,totalActual);
  const ready=jobs.filter(j=>j.status&&j.status.includes("Ready")).length;
  const waitingParts=jobs.filter(j=>j.status&&j.status.includes("Awaiting Parts")).length;
  const waitingApproval=jobs.filter(j=>j.status&&j.status.includes("Approval")).length;
  const today=downtimeTotals ? downtimeTotals(1) : {Lunch:0,Idle:0,"Collecting Car":0};
  const best=getTechs().map(techMetrics).sort((a,b)=>(b.eff||0)-(a.eff||0))[0];
  let recommendation="Keep the workflow moving and review any jobs waiting for parts or approval.";
  if(waitingParts>0) recommendation="Parts delays are affecting the workshop. Review ordered parts and ETA first.";
  else if(waitingApproval>0) recommendation="Customer approvals are holding jobs. Prioritise approval calls.";
  else if(eff!==null && eff<(targets.efficiency||95)) recommendation="Workshop efficiency is below target. Review jobs that exceeded allocated labour.";
  return `WORKSHOP AI END OF DAY BRIEFING

Jobs loaded: ${total}
Jobs completed / ready: ${complete}
Ready for collection: ${ready}

Labour hours allocated: ${totalAllowed.toFixed(1)}
Actual hours clocked: ${totalActual.toFixed(1)}
Workshop efficiency: ${pct(eff)}

Retail hours completed: ${sumType("Retail").toFixed(1)}
Warranty hours completed: ${sumType("Warranty").toFixed(1)}
Internal hours completed: ${sumType("Internal").toFixed(1)}

Waiting for parts: ${waitingParts}
Waiting for customer approval: ${waitingApproval}

Downtime today:
Lunch: ${today.Lunch.toFixed(2)} hrs
Idle: ${today.Idle.toFixed(2)} hrs
Collecting cars: ${today["Collecting Car"].toFixed(2)} hrs

Best efficiency today:
${best ? best.tech + " — " + pct(best.eff) : "Not enough data"}

AI recommendation:
${recommendation}`;
}

function buildMorningBriefing(){
  const openJobs=jobs.filter(j=>!completed(j));
  const waitingParts=jobs.filter(j=>j.status&&j.status.includes("Awaiting Parts"));
  const waitingApproval=jobs.filter(j=>j.status&&j.status.includes("Approval"));
  const ready=jobs.filter(j=>j.status&&j.status.includes("Ready"));
  const todayJobs=jobs.filter(j=>(j.bookingDate||todayISO())===todayISO());
  const totalTodayHours=todayJobs.reduce((s,j)=>s+Number(j.hours||0),0);
  const techLoads=getTechs().map(t=>{
    const list=todayJobs.filter(j=>j.technician===t);
    const hrs=list.reduce((s,j)=>s+Number(j.hours||0),0);
    return {tech:t,hrs,jobs:list.length};
  }).sort((a,b)=>a.hrs-b.hrs);
  const spare=techLoads.filter(t=>t.hrs<5);
  const overloaded=techLoads.filter(t=>t.hrs>8.5);
  let actions=[];
  if(waitingApproval.length) actions.push(`Call customers first: ${waitingApproval.length} job(s) are waiting for approval.`);
  if(waitingParts.length) actions.push(`Check parts ETAs: ${waitingParts.length} job(s) are waiting for parts.`);
  if(ready.length) actions.push(`Contact customers: ${ready.length} vehicle(s) are ready for collection.`);
  if(overloaded.length) actions.push(`Rebalance work: ${overloaded.map(t=>`${t.tech} has ${t.hrs.toFixed(1)} hrs`).join(", ")}.`);
  if(spare.length) actions.push(`Use spare capacity: ${spare.map(t=>`${t.tech} has ${t.hrs.toFixed(1)} hrs`).join(", ")}.`);
  if(!actions.length) actions.push("No urgent actions. Workshop looks balanced for today.");
  return `WORKSHOP AI MORNING BRIEFING

Today’s jobs booked: ${todayJobs.length}\nTomorrow’s jobs booked: ${jobsForDate(addDaysISO(1)).length}
Today’s allocated hours: ${totalTodayHours.toFixed(1)}
Open jobs carried over: ${openJobs.length}
Waiting for parts: ${waitingParts.length}
Waiting for customer approval: ${waitingApproval.length}
Ready for collection: ${ready.length}

Technician load today:
${techLoads.map(t=>`${t.tech}: ${t.hrs.toFixed(1)} hrs / ${t.jobs} job(s)`).join("\n")}

ACTION REQUIRED TODAY
${actions.map(a=>"• "+a).join("\n")}

SERVICE MANAGER PRIORITY
Start with approvals, parts ETAs and ready-for-collection calls before allocating more work.`;
}

if($("copyBriefing")) $("copyBriefing").addEventListener("click",()=>{navigator.clipboard.writeText(buildEndOfDayBriefing());alert("Briefing copied.")});

if($("copyMorningBriefing")) $("copyMorningBriefing").addEventListener("click",()=>{navigator.clipboard.writeText(buildMorningBriefing());alert("Morning briefing copied.")});
if($("copyServiceMorningBriefing")) $("copyServiceMorningBriefing").addEventListener("click",()=>{navigator.clipboard.writeText(buildMorningBriefing());alert("Morning briefing copied.")});
if($("copyServiceEndBriefing")) $("copyServiceEndBriefing").addEventListener("click",()=>{navigator.clipboard.writeText(buildEndOfDayBriefing());alert("End of day briefing copied.")});



function addDaysISO(days){
  const d=new Date();
  d.setDate(d.getDate()+days);
  return d.toISOString().split("T")[0];
}
function dateLabel(iso){
  return new Date(iso+"T00:00:00").toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"});
}
function jobsForDate(iso){
  return jobs.filter(j=>(j.bookingDate||todayISO())===iso);
}
function renderFutureBookings(){
  const el=$("futureBookingsList");
  if(!el) return;
  const mode=$("futureQuickView") ? $("futureQuickView").value : "selected";
  let html="";
  if(mode==="7days"){
    for(let i=0;i<7;i++){
      const d=addDaysISO(i);
      const list=jobsForDate(d);
      const hrs=list.reduce((s,j)=>s+Number(j.hours||0),0);
      html += `<div class="job-card future-day-card"><h3>${dateLabel(d)}</h3><p><strong>${list.length}</strong> job(s) | <strong>${hrs.toFixed(1)}</strong> hrs allocated</p>${list.length?list.map(j=>`<p>${j.reg} — ${j.technician} — ${j.hours} hrs — ${j.type}</p>`).join(""):"<p>No jobs booked.</p>"}</div>`;
    }
  } else {
    const d=mode==="tomorrow" ? addDaysISO(1) : (($("futureBookingDate")&&$("futureBookingDate").value)||todayISO());
    const list=jobsForDate(d);
    html = list.length ? list.map(j=>card(j,true,true)).join("") : `<div class="job-card future-day-card"><h3>${dateLabel(d)}</h3><p>No jobs booked for this date.</p></div>`;
  }
  el.innerHTML=html;
}
if($("futureBookingDate")) $("futureBookingDate").addEventListener("change",renderFutureBookings);
if($("futureQuickView")) $("futureQuickView").addEventListener("change",renderFutureBookings);

function renderUpcomingWorkload(){
  const el=$("upcomingWorkload");
  if(!el) return;
  let html="";
  for(let i=0;i<7;i++){
    const d=addDaysISO(i);
    const list=jobsForDate(d);
    const hrs=list.reduce((s,j)=>s+Number(j.hours||0),0);
    html += `<div class="job-card future-day-card"><h3>${dateLabel(d)}</h3><p>${list.length} job(s) | ${hrs.toFixed(1)} allocated hours</p></div>`;
  }
  el.innerHTML=html;
}

function setInputIfExists(id,value){const el=$(id);if(el)el.value=value??""}function numberVal(id,fallback=0){const el=$(id);if(!el)return fallback;const n=Number((el.value||"").trim());return Number.isFinite(n)?n:fallback}function loadTargetsInputs(){if(document.activeElement&&document.activeElement.closest("#targetsScreen"))return;setInputIfExists("targetAvailableHours",targets.availableHours||"");setInputIfExists("targetProductiveHours",targets.productiveHours||"");setInputIfExists("targetProductivity",targets.productivity||90);setInputIfExists("targetUtilisation",targets.utilisation||95);setInputIfExists("targetEfficiency",targets.efficiency||95);setInputIfExists("targetLabourRecovery",targets.labourRecovery||90);setInputIfExists("targetRetailRate",targets.retailRate||70);setInputIfExists("targetWarrantyRate",targets.warrantyRate||70);setInputIfExists("targetInternalRate",targets.internalRate||45);setInputIfExists("targetRetailHours",targets.retailHours||"");setInputIfExists("targetInternalHours",targets.internalHours||"");setInputIfExists("targetWarrantyHours",targets.warrantyHours||"");setInputIfExists("targetInternalCars",targets.internalCars||"");setInputIfExists("targetMonthlyRevenue",targets.monthlyRevenue||"");setInputIfExists("targetRetailRevenue",targets.retailRevenue||"");setInputIfExists("targetWarrantyRevenue",targets.warrantyRevenue||"");setInputIfExists("targetInternalRevenue",targets.internalRevenue||"");setInputIfExists("targetMOTs",targets.mots||"");setInputIfExists("targetMOTPass",targets.motPass||75);setInputIfExists("targetMOTAdvisory",targets.motAdvisory||25);setInputIfExists("targetCarryOver",targets.carryOver||0);setInputIfExists("targetDowntime",targets.downtime||"");renderKpiTargetsPreview()}function renderKpiTargetsPreview(){const el=$("kpiTargetsPreview");if(!el)return;el.innerHTML=`<div class="stat"><strong>${Number(targets.availableHours||0).toFixed(1)}</strong>Available Hrs</div><div class="stat"><strong>${Number(targets.productiveHours||0).toFixed(1)}</strong>Productive Target</div><div class="stat"><strong>${Number(targets.productivity||90).toFixed(0)}%</strong>Productivity</div><div class="stat"><strong>${Number(targets.utilisation||95).toFixed(0)}%</strong>Utilisation</div><div class="stat"><strong>£${Number(targets.retailRate||70).toFixed(0)}</strong>Retail Rate</div><div class="stat"><strong>£${Number(targets.monthlyRevenue||0).toFixed(0)}</strong>Monthly Revenue</div>`}if($("saveTargets")) $("saveTargets").addEventListener("click",()=>{targets={...targets,availableHours:numberVal("targetAvailableHours"),productiveHours:numberVal("targetProductiveHours"),productivity:numberVal("targetProductivity",90),utilisation:numberVal("targetUtilisation",95),efficiency:numberVal("targetEfficiency",95),labourRecovery:numberVal("targetLabourRecovery",90),retailRate:numberVal("targetRetailRate",70),warrantyRate:numberVal("targetWarrantyRate",70),internalRate:numberVal("targetInternalRate",45),retailHours:numberVal("targetRetailHours"),internalHours:numberVal("targetInternalHours"),warrantyHours:numberVal("targetWarrantyHours"),internalCars:numberVal("targetInternalCars"),monthlyRevenue:numberVal("targetMonthlyRevenue"),retailRevenue:numberVal("targetRetailRevenue"),warrantyRevenue:numberVal("targetWarrantyRevenue"),internalRevenue:numberVal("targetInternalRevenue"),mots:numberVal("targetMOTs"),motPass:numberVal("targetMOTPass",75),motAdvisory:numberVal("targetMOTAdvisory",25),carryOver:numberVal("targetCarryOver"),downtime:numberVal("targetDowntime")};saveTargetsStore();renderKpiTargetsPreview();render();alert("KPI targets saved")});$("copyReport").addEventListener("click",()=>{navigator.clipboard.writeText($("generatedReport").textContent);alert("Report copied")});let recognition;if("webkitSpeechRecognition"in window){recognition=new webkitSpeechRecognition();recognition.continuous=false;recognition.interimResults=false;recognition.lang="en-GB";recognition.onresult=e=>{const text=e.results[0][0].transcript;if(activeVoiceTarget){const box=$(activeVoiceTarget);box.value=(box.value+" "+text).trim()}}}document.querySelectorAll(".voiceBtn").forEach(btn=>btn.addEventListener("click",()=>{activeVoiceTarget=btn.dataset.target;if(!recognition){alert("Voice recognition is not supported in this browser.");return}recognition.start()}));$("techFilter").addEventListener("change",renderTech);

/* =========================================================
   Workshop AI OS v4.1 — WAI-002 Garage Health Command Centre
   Adds: technician availability support, individual productivity,
   new Garage Health weights, clickable KPI explanations, daily priority.
   ========================================================= */
let technicianAvailability=JSON.parse(localStorage.getItem("workshopAITechnicianAvailabilityV41")||"{}");
const TECH_STATUS_OPTIONS={
  in_work:{label:"🟢 In Work",hours:8,available:true},
  off_work:{label:"⚫ Off Work",hours:0,available:false},
  holiday:{label:"🏖 Holiday",hours:0,available:false},
  sick:{label:"🤒 Sick",hours:0,available:false},
  training:{label:"🎓 Training",hours:0,available:false},
  half_day:{label:"🟡 Half Day",hours:4,available:true},
  custom:{label:"⏱ Custom Hours",hours:8,available:true},
  overtime:{label:"⏰ Overtime",hours:9,available:true}
};
function saveTechnicianAvailability(){localStorage.setItem("workshopAITechnicianAvailabilityV41",JSON.stringify(technicianAvailability))}
function techAvailability(tech){
  if(!technicianAvailability[tech]) technicianAvailability[tech]={status:"in_work",hours:8};
  const rec=technicianAvailability[tech];
  if(!TECH_STATUS_OPTIONS[rec.status]) rec.status="in_work";
  if(rec.hours===undefined || rec.hours===null || rec.hours==="") rec.hours=TECH_STATUS_OPTIONS[rec.status].hours;
  return rec;
}
function techStatusLabel(tech){const rec=techAvailability(tech);return TECH_STATUS_OPTIONS[rec.status].label}
function techAvailableHours(tech){
  const rec=techAvailability(tech); const opt=TECH_STATUS_OPTIONS[rec.status];
  if(!opt.available) return 0;
  return Math.max(0,Number(rec.hours||0));
}
function totalAvailableHours(){return getTechs().reduce((s,t)=>s+techAvailableHours(t),0)}
function todayOperationalJobs(){
  return typeof getLiveWorkshopJobs==="function"?getLiveWorkshopJobs():jobs.filter(j=>!completed(j));
}
function carriedOverJobs(){
  return typeof getCarryOverJobs==="function"?getCarryOverJobs():jobs.filter(j=>!completed(j));
}
function clamp(n,min,max){return Math.max(min,Math.min(max,n))}
function classifyPct(n){return n>=100?"good":n>=85?"warn":"bad"}
function pctText(n){return n===null||n===undefined||Number.isNaN(n)?"Not available":Number(n).toFixed(0)+"%"}
function activeSoldHoursForTech(tech){return todayOperationalJobs().filter(j=>j.technician===tech).reduce((s,j)=>s+Number(j.hours||0),0)}
function techProductivity(tech){const available=techAvailableHours(tech);return available>0?(activeSoldHoursForTech(tech)/available)*100:null}
function carryOverScore(count){if(count<=0)return 100;if(count===1)return 95;if(count===2)return 85;if(count===3)return 70;return 50}
function getGarageHealthMetrics(){
  const active=todayOperationalJobs();
  const sold=active.reduce((s,j)=>s+Number(j.hours||0),0);
  const actual=active.reduce((s,j)=>s+Number(j.actualHours||0),0);
  const available=totalAvailableHours();
  const productivity=available>0?(sold/available)*100:null;
  const workshopEff=efficiency(sold,actual);
  const utilisation=available>0?(sold/available)*100:null;
  const retail=sumType("Retail");
  const internal=sumType("Internal");
  const warranty=sumType("Warranty");
  const internalCompleted=jobs.filter(j=>j.type==="Internal"&&completed(j)).length;
  const carried=carriedOverJobs();
  const retailPct=targets.retailHours>0?(retail/targets.retailHours)*100:100;
  return {active,sold,actual,available,productivity,workshopEff,utilisation,retail,internal,warranty,internalCompleted,carried,retailPct};
}
function garageHealth(m){
  const productivityScore=m.productivity===null?0:clamp(m.productivity,0,100);
  const efficiencyScore=m.workshopEff===null?75:clamp(m.workshopEff,0,100);
  const utilisationScore=m.utilisation===null?0:clamp(m.utilisation,0,100);
  const carryScore=carryOverScore(m.carried.length);
  const retailScore=clamp(m.retailPct||0,0,100);
  const weighted={
    productivity:productivityScore*0.35,
    efficiency:efficiencyScore*0.25,
    utilisation:utilisationScore*0.15,
    carriedOver:carryScore*0.20,
    retail:retailScore*0.05
  };
  const score=Math.round(Object.values(weighted).reduce((a,b)=>a+b,0));
  const biggestIssue=[
    {key:"Productivity",loss:35-weighted.productivity},
    {key:"Efficiency",loss:25-weighted.efficiency},
    {key:"Utilisation",loss:15-weighted.utilisation},
    {key:"Carried-over Jobs",loss:20-weighted.carriedOver},
    {key:"Retail Target",loss:5-weighted.retail}
  ].sort((a,b)=>b.loss-a.loss)[0];
  return {score,weighted,biggestIssue,message:score>=90?"Excellent workshop control.":score>=80?"Workshop is performing well with some improvements available.":score>=70?"Workshop needs attention today.":"Workshop requires urgent management focus."};
}
function renderDash(){
  const m=getGarageHealthMetrics();
  const health=garageHealth(m);
  const waitingParts=jobs.filter(j=>j.status&&j.status.includes("Awaiting Parts")).length;
  const statusIcon=health.score>=90?"🟢":health.score>=80?"🟡":health.score>=70?"🟠":"🔴";
  if($("healthScore")) $("healthScore").innerHTML=`Garage Health: ${health.score}% ${statusIcon}<br><span>${health.message}</span>`;
  if($("ownerStats")) $("ownerStats").innerHTML=`<div class="stat"><strong>${getLiveJobCount()}</strong>Jobs</div><div class="stat"><strong>${m.available.toFixed(1)}</strong>Available Hrs</div><div class="stat"><strong>${m.sold.toFixed(1)}</strong>Sold Hrs</div><div class="stat"><strong>${pctText(m.productivity)}</strong>Productivity</div><div class="stat"><strong>${pctText(m.workshopEff)}</strong>Efficiency</div><div class="stat ${m.carried.length>0?'warn':'good'}"><strong>${m.carried.length}</strong>Carry-over</div>`;
  renderGarageHealthBreakdown(m,health);
  renderDailyPriority(m,health);
  renderLiveActivity();
  renderCoach({...m,...health,waitingParts});
  renderLeague("leagueTable");
  renderLeague("leagueTableOwner");
  renderScorecard({workshopEff:m.workshopEff,utilisation:m.utilisation,retail:m.retail,internal:m.internal,warranty:m.warranty,internalCompleted:m.internalCompleted,productivity:m.productivity,carried:m.carried.length,available:m.available});
  renderStatusBoard("statusBoard");
  renderStatusBoard("ownerStatusBoard");
  renderWorkload();
  renderDowntimeReports();
}
function renderGarageHealthBreakdown(m,health){
  const el=$("garageHealthBreakdown"); if(!el) return;
  const cards=[
    {id:"productivity",title:"👨‍🔧 Technician Productivity",value:pctText(m.productivity),target:"100%+",cls:classifyPct(m.productivity||0),impact:health.weighted.productivity.toFixed(1)+" / 35"},
    {id:"efficiency",title:"⚙️ Workshop Efficiency",value:pctText(m.workshopEff),target:(targets.efficiency||95)+"%",cls:classifyPct(m.workshopEff||0),impact:health.weighted.efficiency.toFixed(1)+" / 25"},
    {id:"utilisation",title:"🚗 Workshop Utilisation",value:pctText(m.utilisation),target:"95%+",cls:classifyPct(m.utilisation||0),impact:health.weighted.utilisation.toFixed(1)+" / 15"},
    {id:"carried",title:"📅 Carried-over Jobs",value:String(m.carried.length),target:"0",cls:m.carried.length===0?"good":m.carried.length<=2?"warn":"bad",impact:health.weighted.carriedOver.toFixed(1)+" / 20"},
    {id:"retail",title:"💼 Retail Hours Target",value:pctText(m.retailPct),target:(targets.retailHours||0)+" hrs",cls:classifyPct(m.retailPct||0),impact:health.weighted.retail.toFixed(1)+" / 5"}
  ];
  el.innerHTML=cards.map(c=>`<div class="job-card ${c.cls}" onclick="showKpiMeaning('${c.id}')" style="cursor:pointer"><h3>${c.title}</h3><p><strong>${c.value}</strong> | Target: ${c.target}</p><p><strong>Garage Health impact:</strong> ${c.impact}</p><p class="muted">Click to see the meaning behind this number.</p></div>`).join("");
}
function renderDailyPriority(m,health){
  const el=$("dailyPriorityBanner"); if(!el) return;
  let title="Today's Priority"; let text="Workshop is balanced. Keep jobs moving and maintain clean updates."; let cls="good";
  if(m.carried.length){title="Complete carried-over work first";text=`${m.carried.length} job(s) have rolled over. Completing the oldest carry-over job will improve Garage Health fastest.`;cls=m.carried.length>2?"bad":"warn"}
  else if(m.productivity!==null && m.productivity<100){title="Increase technician productivity";text=`Productivity is ${m.productivity.toFixed(0)}%. Add or complete ${(m.available-m.sold>0?m.available-m.sold:1).toFixed(1)} more sold hour(s) to move towards 100%.`;cls="warn"}
  else if(targets.retailHours && m.retail<targets.retailHours){title="Push retail hours";text=`Retail completed hours are ${m.retail.toFixed(1)} against a target of ${targets.retailHours}.`;cls="warn"}
  el.innerHTML=`<div class="coach-card ${cls}"><h3>${title}</h3><p>${text}</p><p><strong>Potential focus:</strong> ${health.biggestIssue.key}</p></div>`;
}
function showKpiMeaning(id){
  const m=getGarageHealthMetrics(); const health=garageHealth(m);
  const explanations={
    productivity:{title:"Technician Productivity",meaning:"Sold/allocated hours divided by available technician hours.",why:`Current productivity is ${pctText(m.productivity)} because ${m.sold.toFixed(1)} sold hours are planned against ${m.available.toFixed(1)} available hours.`,improve:"Add authorised labour, reallocate work to available technicians, or complete carry-over jobs."},
    efficiency:{title:"Workshop Efficiency",meaning:"Allowed job hours divided by actual clocked hours.",why:`Current efficiency is ${pctText(m.workshopEff)} based on ${m.sold.toFixed(1)} allowed hours and ${m.actual.toFixed(1)} clocked hours.`,improve:"Review jobs where actual time is above allowed time and make sure technicians clock off correctly."},
    utilisation:{title:"Workshop Utilisation",meaning:"How much of today’s available technician capacity is filled with work.",why:`Utilisation is ${pctText(m.utilisation)} from ${m.sold.toFixed(1)} sold hours against ${m.available.toFixed(1)} available hours.`,improve:"Bring work forward, sell extra retail labour, or move jobs to technicians with spare capacity."},
    carried:{title:"Carried-over Jobs",meaning:"Jobs still incomplete from previous diary days.",why:`There are ${m.carried.length} carried-over job(s). This has a 20% weight in Garage Health.`,improve:"Complete the oldest carried-over vehicles first or update the diary if they have been moved."},
    retail:{title:"Retail Hours Target",meaning:"Retail labour completed compared with the day’s retail target.",why:`Retail progress is ${pctText(m.retailPct)}. Completed retail hours: ${m.retail.toFixed(1)}. Target: ${(targets.retailHours||0)}.`,improve:"Prioritise authorised retail work and convert advisories or additional work where appropriate."}
  };
  const e=explanations[id]; if(!e) return;
  if($("modalTitle")&&$("modalTimeline")){
    $("modalTitle").textContent=e.title;
    $("modalTimeline").innerHTML=`<div class="timeline-item"><strong>Meaning</strong><p>${e.meaning}</p></div><div class="timeline-item"><strong>Why it is at this value</strong><p>${e.why}</p></div><div class="timeline-item"><strong>What improves it</strong><p>${e.improve}</p></div><div class="timeline-item"><strong>Current Garage Health</strong><p>${health.score}% — ${health.message}</p></div>`;
    $("modal").classList.remove("hidden");
  } else alert(`${e.title}\n\n${e.meaning}\n\n${e.why}\n\n${e.improve}`);
}
function renderTechnicianSetup(){
  const el=$("technicianSetupList"); if(!el) return;
  el.innerHTML=getTechs().map(t=>{
    const rec=techAvailability(t); const available=techAvailableHours(t); const sold=activeSoldHoursForTech(t); const prod=techProductivity(t); const cls=available===0?"warn":classifyPct(prod||0);
    return `<div class="job-card ${cls}"><div class="tech-row"><div><h3>${t}</h3><p><strong>Status:</strong> ${techStatusLabel(t)} | <strong>Available:</strong> ${available.toFixed(1)} hrs | <strong>Sold:</strong> ${sold.toFixed(1)} hrs | <strong>Productivity:</strong> ${available>0?pctText(prod):"Not available today"}</p></div><div class="tech-actions"><button onclick="renameTechnician('${t}')">Rename</button><button onclick="removeTechnician('${t}')">Remove</button></div></div><div class="grid"><label>Status<select onchange="updateTechStatus('${t}',this.value)">${Object.entries(TECH_STATUS_OPTIONS).map(([key,opt])=>`<option value="${key}" ${rec.status===key?'selected':''}>${opt.label}</option>`).join("")}</select></label><label>Available Hours<input type="number" step="0.5" min="0" value="${Number(rec.hours||0)}" onchange="updateTechHours('${t}',this.value)"></label></div></div>`;
  }).join("");
}
function updateTechStatus(tech,status){
  const opt=TECH_STATUS_OPTIONS[status]||TECH_STATUS_OPTIONS.in_work;
  technicianAvailability[tech]={status,hours:opt.hours};
  saveTechnicianAvailability(); render();
}
function updateTechHours(tech,hours){
  const rec=techAvailability(tech); rec.hours=Math.max(0,Number(hours||0));
  technicianAvailability[tech]=rec; saveTechnicianAvailability(); render();
}
function techMetrics(t){
  const list=jobs.filter(j=>j.technician===t); const allowed=list.reduce((s,j)=>s+Number(j.hours||0),0); const actual=list.reduce((s,j)=>s+Number(j.actualHours||0),0);
  const available=techAvailableHours(t); const activeSold=activeSoldHoursForTech(t); const productivity=techProductivity(t);
  return {tech:t,jobs:list.length,allowed,actual,available,activeSold,productivity,eff:efficiency(allowed,actual),retail:list.filter(j=>j.type==="Retail").reduce((s,j)=>s+Number(j.hours||0),0),warranty:list.filter(j=>j.type==="Warranty").reduce((s,j)=>s+Number(j.hours||0),0),internal:list.filter(j=>j.type==="Internal").reduce((s,j)=>s+Number(j.hours||0),0)};
}
function renderLeague(id){
  const el=$(id); if(!el) return;
  const rows=getTechs().map(techMetrics).sort((a,b)=>(b.productivity||0)-(a.productivity||0));
  el.innerHTML=`<table><thead><tr><th>Rank</th><th>Technician</th><th>Status</th><th>Available</th><th>Sold Today</th><th>Productivity</th><th>Efficiency</th><th>Jobs</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td>${i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1}</td><td>${r.tech}</td><td>${techStatusLabel(r.tech)}</td><td>${r.available.toFixed(1)}</td><td>${r.activeSold.toFixed(1)}</td><td>${r.available>0?pctText(r.productivity):"Not available"}</td><td>${pct(r.eff)}</td><td>${r.jobs}</td></tr>`).join("")}</tbody></table>`;
}
function renderWorkload(){
  const el=$("workload"); if(!el) return;
  el.innerHTML=getTechs().map(t=>{const r=techMetrics(t);return `<div class="job-card ${r.available===0?'warn':classifyPct(r.productivity||0)}"><h3>${t}</h3><p>${techStatusLabel(t)} | Available: ${r.available.toFixed(1)} hrs | Sold today: ${r.activeSold.toFixed(1)} hrs | Productivity: ${r.available>0?pctText(r.productivity):"Not available today"}</p></div>`}).join("");
}
function renderCoach(m){
  const notes=[];
  if(m.carried&&m.carried.length) notes.push(["Carry-over jobs are holding back Garage Health",`${m.carried.length} job(s) have rolled over from a previous day. This KPI now carries 20% of Garage Health.`,m.carried.length>2?"bad":"warn"]);
  if(m.productivity!==null&&m.productivity<100) notes.push(["Technician productivity below target",`Productivity is ${m.productivity.toFixed(0)}%. Current sold hours are ${m.sold.toFixed(1)} against ${m.available.toFixed(1)} available hours.`,"warn"]);
  if(m.workshopEff!==null&&m.workshopEff<(targets.efficiency||95)) notes.push(["Improve workshop efficiency",`Workshop efficiency is ${m.workshopEff.toFixed(0)}%, below the ${targets.efficiency||95}% target.`,"bad"]);
  if(targets.retailHours&&m.retail<targets.retailHours) notes.push(["Retail hours below target",`Retail completed hours are ${m.retail.toFixed(1)} against a target of ${targets.retailHours}.`,"warn"]);
  if(m.waitingParts>0) notes.push(["Parts delay risk",`${m.waitingParts} job(s) are awaiting parts. This is shown as an operational alert but no longer reduces Garage Health.`,"warn"]);
  if(!notes.length) notes.push(["Workshop looks controlled","Garage Health is strong and no major issue is currently pulling the score down.","good"]);
  if($("ownerCoach")) $("ownerCoach").innerHTML=notes.map(n=>`<div class="coach-card ${n[2]}"><h3>${n[0]}</h3><p>${n[1]}</p></div>`).join("");
}
function renderScorecard(m){
  const el=$("kpiScorecard"); if(!el) return;
  el.innerHTML=kpiCard("Technician productivity",100,m.productivity||0,"%")+kpiCard("Workshop efficiency",targets.efficiency||95,m.workshopEff||0,"%")+kpiCard("Workshop utilisation",95,m.utilisation||0,"%")+kpiCard("Carried-over jobs",0,m.carried||0,"")+kpiCard("Retail hours completed",targets.retailHours,m.retail," hrs")+kpiCard("Internal cars completed",targets.internalCars,m.internalCompleted,"");
}
if($("assignJob")) $("assignJob").addEventListener("click",function(e){
  const tech=val("technician");
  if(techAvailableHours(tech)<=0){
    alert(`${tech} is marked as ${techStatusLabel(tech)} and is not available for job allocation today.`);
    e.preventDefault(); e.stopImmediatePropagation();
  }
},true);

render();
/* =====================================================================
   Workshop AI OS v4.1 — Sprint 3 / WAI-003 Garage Health Drill-down
   Adds WHY / HOW / TREND views, clickable Garage Health and potential score.
   ===================================================================== */
const GARAGE_HEALTH_TREND_KEY="workshopAIGarageHealthTrendV41";
let activeGarageHealthTab="why";

function recordGarageHealthTrend(score){
  try{
    const history=JSON.parse(localStorage.getItem(GARAGE_HEALTH_TREND_KEY)||"[]");
    const today=todayISO();
    const existing=history.find(x=>x.date===today);
    if(existing) existing.score=score;
    else history.push({date:today,score});
    localStorage.setItem(GARAGE_HEALTH_TREND_KEY,JSON.stringify(history.slice(-14)));
  }catch(e){}
}
function getGarageHealthTrend(){
  try{return JSON.parse(localStorage.getItem(GARAGE_HEALTH_TREND_KEY)||"[]")}catch(e){return []}
}
function garageHealthStatusClass(score){return score>=90?"good":score>=80?"warn":score>=70?"warn":"bad"}
function garageHealthIcon(score){return score>=90?"🟢":score>=80?"🟡":score>=70?"🟠":"🔴"}
function garageHealthKpiCards(m,health){
  return [
    {id:"productivity",title:"👨‍🔧 Technician Productivity",value:pctText(m.productivity),target:"100%+",cls:classifyPct(m.productivity||0),impact:health.weighted.productivity.toFixed(1),max:35,meaning:"Sold hours divided by available technician hours."},
    {id:"efficiency",title:"⚙️ Workshop Efficiency",value:pctText(m.workshopEff),target:(targets.efficiency||95)+"%",cls:classifyPct(m.workshopEff||0),impact:health.weighted.efficiency.toFixed(1),max:25,meaning:"Allowed job hours divided by actual clocked hours."},
    {id:"utilisation",title:"🚗 Workshop Utilisation",value:pctText(m.utilisation),target:"95%+",cls:classifyPct(m.utilisation||0),impact:health.weighted.utilisation.toFixed(1),max:15,meaning:"How much of today's available workshop capacity is filled."},
    {id:"carried",title:"📅 Carried-over Jobs",value:String(m.carried.length),target:"0",cls:m.carried.length===0?"good":m.carried.length<=2?"warn":"bad",impact:health.weighted.carriedOver.toFixed(1),max:20,meaning:"Jobs still incomplete from previous diary days."},
    {id:"retail",title:"💼 Retail Hours Target",value:pctText(m.retailPct),target:(targets.retailHours||0)+" hrs",cls:classifyPct(m.retailPct||0),impact:health.weighted.retail.toFixed(1),max:5,meaning:"Retail labour completed compared with today's target."}
  ];
}
function garageHealthActions(m,health){
  const actions=[];
  if(m.carried.length){
    const oldest=m.carried.slice().sort((a,b)=>new Date(a.bookingDate||a.createdAt||0)-new Date(b.bookingDate||b.createdAt||0))[0];
    actions.push({title:`Complete carry-over job ${oldest?.reg||""}`.trim(),detail:`${m.carried.length} carried-over job(s) are reducing Garage Health.`,gain:m.carried.length>2?8:5,cls:m.carried.length>2?"bad":"warn"});
  }
  if(m.productivity!==null && m.productivity<100){
    const hoursNeeded=Math.max(0.5,(m.available-m.sold));
    actions.push({title:"Increase technician productivity",detail:`Add or complete ${hoursNeeded.toFixed(1)} sold hour(s) to move towards 100%.`,gain:Math.min(6,Math.ceil(hoursNeeded*2)),cls:"warn"});
  }
  if(m.utilisation!==null && m.utilisation<95){
    const capacity=Math.max(0.5,(m.available*0.95)-m.sold);
    actions.push({title:"Fill available workshop capacity",detail:`There are around ${capacity.toFixed(1)} available hour(s) before 95% utilisation.`,gain:Math.min(4,Math.ceil(capacity)),cls:"warn"});
  }
  if(targets.retailHours && m.retail<targets.retailHours){
    actions.push({title:"Push retail hours",detail:`Retail is ${m.retail.toFixed(1)} hrs against a target of ${targets.retailHours}.`,gain:3,cls:"warn"});
  }
  if(!actions.length) actions.push({title:"Maintain current control",detail:"Garage Health is strong. Keep job statuses, timings and technician updates clean.",gain:0,cls:"good"});
  return actions.sort((a,b)=>b.gain-a.gain);
}
function garageHealthPotential(m,health){
  return Math.min(100,health.score+garageHealthActions(m,health).slice(0,3).reduce((s,a)=>s+a.gain,0));
}
function garageHealthConfidence(m){
  let confidence=100;
  const active=jobs.filter(j=>!completed(j));
  confidence-=active.filter(j=>!j.technician).length*8;
  confidence-=active.filter(j=>!j.reg).length*8;
  confidence-=active.filter(j=>!Number(j.hours||0)).length*8;
  if(m.available<=0) confidence-=20;
  return Math.max(50,Math.min(100,confidence));
}

function renderDash(){
  const m=getGarageHealthMetrics();
  const health=garageHealth(m);
  recordGarageHealthTrend(health.score);
  const waitingParts=jobs.filter(j=>j.status&&j.status.includes("Awaiting Parts")).length;
  const statusIcon=garageHealthIcon(health.score);
  const potential=garageHealthPotential(m,health);
  const confidence=garageHealthConfidence(m);
  if($("healthScore")) $("healthScore").innerHTML=`<div onclick="showGarageHealthDrilldown('why')" title="Click for Garage Health drill-down">Garage Health: ${health.score}% ${statusIcon}<br><span>${health.message}</span><br><span>Potential today: ${potential}% ⭐ | Confidence: ${confidence}%</span></div>`;
  if($("ownerStats")) $("ownerStats").innerHTML=`<div class="stat"><strong>${getLiveJobCount()}</strong>Jobs</div><div class="stat"><strong>${m.available.toFixed(1)}</strong>Available Hrs</div><div class="stat"><strong>${m.sold.toFixed(1)}</strong>Sold Hrs</div><div class="stat"><strong>${pctText(m.productivity)}</strong>Productivity</div><div class="stat"><strong>${pctText(m.workshopEff)}</strong>Efficiency</div><div class="stat ${m.carried.length>0?'warn':'good'}"><strong>${m.carried.length}</strong>Carry-over</div>`;
  renderGarageHealthBreakdown(m,health);
  renderDailyPriority(m,health);
  renderLiveActivity();
  renderCoach({...m,...health,waitingParts});
  renderLeague("leagueTable");
  renderLeague("leagueTableOwner");
  renderScorecard({workshopEff:m.workshopEff,utilisation:m.utilisation,retail:m.retail,internal:m.internal,warranty:m.warranty,internalCompleted:m.internalCompleted,productivity:m.productivity,carried:m.carried.length,available:m.available});
  renderStatusBoard("statusBoard");
  renderStatusBoard("ownerStatusBoard");
  renderWorkload();
  renderDowntimeReports();
}
function renderGarageHealthBreakdown(m,health){
  const el=$("garageHealthBreakdown"); if(!el) return;
  const cards=garageHealthKpiCards(m,health);
  el.innerHTML=cards.map(c=>`<div class="job-card ${c.cls}" onclick="showKpiMeaning('${c.id}')" style="cursor:pointer"><h3>${c.title}</h3><p><strong>${c.value}</strong> | Target: ${c.target}</p><p><strong>Garage Health impact:</strong> ${c.impact} / ${c.max}</p><p class="muted">${c.meaning}</p></div>`).join("");
}
function renderDailyPriority(m,health){
  const el=$("dailyPriorityBanner"); if(!el) return;
  const actions=garageHealthActions(m,health);
  const potential=garageHealthPotential(m,health);
  const top=actions[0];
  el.innerHTML=`<div class="coach-card ${top.cls}"><h3>Today's Priority: ${top.title}</h3><p>${top.detail}</p><p><strong>Current Garage Health:</strong> ${health.score}% | <strong>Potential today:</strong> ${potential}% ⭐</p><button onclick="showGarageHealthDrilldown('how')">Show improvement plan</button></div>`;
}
function showGarageHealthDrilldown(tab="why"){
  activeGarageHealthTab=tab;
  const m=getGarageHealthMetrics();
  const health=garageHealth(m);
  if($("modalTitle")) $("modalTitle").textContent=`Garage Health — ${health.score}% ${garageHealthIcon(health.score)}`;
  if($("modalTimeline")) $("modalTimeline").innerHTML=renderGarageHealthModalContent(m,health,tab);
  if($("modal")) $("modal").classList.remove("hidden");
}
function setGarageHealthTab(tab){showGarageHealthDrilldown(tab)}
function renderGarageHealthModalContent(m,health,tab){
  const tabs=`<div class="gh-tabs"><button class="gh-tab ${tab==='why'?'active':''}" onclick="setGarageHealthTab('why')">📊 Why?</button><button class="gh-tab ${tab==='how'?'active':''}" onclick="setGarageHealthTab('how')">🎯 How?</button><button class="gh-tab ${tab==='trend'?'active':''}" onclick="setGarageHealthTab('trend')">📈 Trend</button></div>`;
  if(tab==="how") return tabs+renderGarageHealthHow(m,health);
  if(tab==="trend") return tabs+renderGarageHealthTrend(m,health);
  return tabs+renderGarageHealthWhy(m,health);
}
function renderGarageHealthWhy(m,health){
  const cards=garageHealthKpiCards(m,health);
  const confidence=garageHealthConfidence(m);
  return `<div class="gh-potential"><h3>Why Garage Health is ${health.score}%</h3><p>${health.message}</p><p><strong>Confidence:</strong> ${confidence}% — based on technician hours, job data and required information.</p></div><div class="gh-modal-grid">${cards.map(c=>`<div class="job-card ${c.cls}"><h3>${c.title}</h3><p><strong>${c.value}</strong> against target ${c.target}</p><p class="gh-impact">${c.impact} / ${c.max}</p><p class="muted">${c.meaning}</p><button onclick="showKpiMeaning('${c.id}')">Open KPI</button></div>`).join("")}</div>`;
}
function renderGarageHealthHow(m,health){
  const actions=garageHealthActions(m,health);
  const potential=garageHealthPotential(m,health);
  return `<div class="gh-potential"><h3>Potential Garage Health Today: ${potential}% ⭐</h3><p>These are the highest-impact actions available from the current data.</p></div>${actions.map(a=>`<div class="timeline-item ${a.cls}"><div class="gh-action"><div><strong>${a.title}</strong><p>${a.detail}</p></div><strong>${a.gain?`+${a.gain}%`:"Maintain"}</strong></div></div>`).join("")}`;
}
function renderGarageHealthTrend(m,health){
  const trend=getGarageHealthTrend();
  const rows=trend.length?trend: [{date:todayISO(),score:health.score}];
  return `<div class="gh-potential"><h3>Garage Health Trend</h3><p>This records the latest Garage Health score for each day you run the app.</p></div>${rows.slice(-7).map(r=>{const cls=garageHealthStatusClass(r.score);return `<div class="timeline-item ${cls}"><strong>${new Date(r.date).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'short'})}</strong><p>Garage Health: <strong>${r.score}% ${garageHealthIcon(r.score)}</strong></p></div>`}).join("")}`;
}
function showKpiMeaning(id){
  const m=getGarageHealthMetrics(); const health=garageHealth(m);
  const actions=garageHealthActions(m,health);
  const explanations={
    productivity:{title:"Technician Productivity",meaning:"Sold/allocated hours divided by available technician hours.",why:`Current productivity is ${pctText(m.productivity)} because ${m.sold.toFixed(1)} sold hours are planned against ${m.available.toFixed(1)} available hours.`,improve:"Add authorised labour, reallocate work to available technicians, or complete carry-over jobs.",action:actions.find(a=>a.title.includes("productivity"))},
    efficiency:{title:"Workshop Efficiency",meaning:"Allowed job hours divided by actual clocked hours.",why:`Current efficiency is ${pctText(m.workshopEff)} based on ${m.sold.toFixed(1)} allowed hours and ${m.actual.toFixed(1)} clocked hours.`,improve:"Review jobs where actual time is above allowed time and make sure technicians clock off correctly."},
    utilisation:{title:"Workshop Utilisation",meaning:"How much of today’s available technician capacity is filled with work.",why:`Utilisation is ${pctText(m.utilisation)} from ${m.sold.toFixed(1)} sold hours against ${m.available.toFixed(1)} available hours.`,improve:"Bring work forward, sell extra retail labour, or move jobs to technicians with spare capacity.",action:actions.find(a=>a.title.includes("capacity"))},
    carried:{title:"Carried-over Jobs",meaning:"Jobs still incomplete from previous diary days.",why:`There are ${m.carried.length} carried-over job(s). This has a 20% weight in Garage Health.`,improve:"Complete the oldest carried-over vehicles first or update the diary if they have been moved.",action:actions.find(a=>a.title.includes("carry-over"))},
    retail:{title:"Retail Hours Target",meaning:"Retail labour completed compared with the day’s retail target.",why:`Retail progress is ${pctText(m.retailPct)}. Completed retail hours: ${m.retail.toFixed(1)}. Target: ${(targets.retailHours||0)}.`,improve:"Prioritise authorised retail work and convert advisories or additional work where appropriate.",action:actions.find(a=>a.title.includes("retail"))}
  };
  const e=explanations[id]; if(!e) return;
  if($("modalTitle")&&$("modalTimeline")){
    $("modalTitle").textContent=e.title;
    const action=e.action?`<div class="timeline-item ${e.action.cls}"><strong>Best action</strong><p>${e.action.title}: ${e.action.detail}</p><p><strong>Estimated impact:</strong> +${e.action.gain}%</p></div>`:"";
    $("modalTimeline").innerHTML=`<div class="gh-tabs"><button class="gh-tab" onclick="showGarageHealthDrilldown('why')">Back to Garage Health</button></div><div class="timeline-item"><strong>Meaning</strong><p>${e.meaning}</p></div><div class="timeline-item"><strong>Why it is at this value</strong><p>${e.why}</p></div><div class="timeline-item"><strong>What improves it</strong><p>${e.improve}</p></div>${action}<div class="timeline-item"><strong>Current Garage Health</strong><p>${health.score}% — ${health.message}</p></div>`;
    $("modal").classList.remove("hidden");
  } else alert(`${e.title}\n\n${e.meaning}\n\n${e.why}\n\n${e.improve}`);
}

render();

/* =========================================================
   Workshop AI OS v4.1 — Sprint 4 / WAI-019 Capacity Intelligence
   Adds Command Centre capacity card: available hours, sold hours,
   remaining capacity, overbooked warning, technician breakdown,
   and capacity recommendations.
   ========================================================= */
function capacityStatusClass(used){
  if(used===null||Number.isNaN(used)) return "warn";
  if(used<85) return "good";
  if(used<=100) return "warn";
  return "bad";
}
function capacityStatusText(used){
  if(used===null||Number.isNaN(used)) return "Capacity data incomplete";
  if(used<85) return "Capacity available";
  if(used<=100) return "Nearly full";
  return "Over capacity";
}
function getCapacityMetrics(){
  const m=getGarageHealthMetrics();
  const available=Number(m.available||0);
  const sold=Number(m.sold||0);
  const used=available>0?(sold/available)*100:null;
  const remaining=available-sold;
  const techs=getTechs().map(t=>{
    const availableHours=techAvailableHours(t);
    const soldHours=activeSoldHoursForTech(t);
    const usedPct=availableHours>0?(soldHours/availableHours)*100:null;
    return {tech:t,status:techStatusLabel(t),available:availableHours,sold:soldHours,remaining:availableHours-soldHours,usedPct};
  });
  const lostParts=jobs.filter(j=>j.status&&j.status.includes("Awaiting Parts")).reduce((s,j)=>s+Number(j.hours||0),0);
  const lostAuth=jobs.filter(j=>j.auth&&String(j.auth).includes("Awaiting")).reduce((s,j)=>s+Number(j.hours||0),0);
  return {available,sold,used,remaining,techs,lostParts,lostAuth};
}
function renderWorkshopCapacity(){
  const summary=$("workshopCapacitySummary");
  const techEl=$("workshopCapacityTechs");
  const coach=$("workshopCapacityCoach");
  if(!summary||!techEl||!coach) return;
  const c=getCapacityMetrics();
  const cls=capacityStatusClass(c.used);
  const usedText=c.used===null?"N/A":`${c.used.toFixed(0)}%`;
  const remainingLabel=c.remaining>=0?"Remaining Hrs":"Overbooked Hrs";
  summary.innerHTML=`<div class="stat"><strong>${c.available.toFixed(1)}</strong>Available Hrs</div><div class="stat"><strong>${c.sold.toFixed(1)}</strong>Sold Hrs</div><div class="stat ${cls}"><strong>${usedText}</strong>Capacity Used</div><div class="stat ${c.remaining>=0?'good':'bad'}"><strong>${Math.abs(c.remaining).toFixed(1)}</strong>${remainingLabel}</div>`;
  techEl.innerHTML=c.techs.map(t=>{
    const tCls=t.available<=0?"warn":capacityStatusClass(t.usedPct);
    const used=t.usedPct===null?"N/A":`${t.usedPct.toFixed(0)}%`;
    const rem=t.remaining>=0?`${t.remaining.toFixed(1)} hrs spare`:`${Math.abs(t.remaining).toFixed(1)} hrs over`;
    return `<div class="job-card ${tCls}"><h3>${t.tech}</h3><p><strong>${t.status}</strong></p><p>Available: <strong>${t.available.toFixed(1)}</strong> hrs | Sold: <strong>${t.sold.toFixed(1)}</strong> hrs | Used: <strong>${used}</strong></p><p class="muted">${rem}</p></div>`;
  }).join("");
  let title="Workshop capacity is controlled";
  let text="There is enough capacity for today. Keep filling productive hours without overloading the team.";
  let cardCls="good";
  if(c.available<=0){title="No technician capacity set";text="Set technician availability before relying on capacity figures.";cardCls="bad";}
  else if(c.remaining<0){title="Workshop is over capacity";text=`The diary is overbooked by ${Math.abs(c.remaining).toFixed(1)} hour(s). Consider moving lower-priority work or reallocating jobs.`;cardCls="bad";}
  else if(c.used>=85){title="Workshop is nearly full";text=`Only ${c.remaining.toFixed(1)} hour(s) remain. Accept short jobs only unless work is moved.`;cardCls="warn";}
  else {title="Capacity available today";text=`You have ${c.remaining.toFixed(1)} hour(s) available. You may be able to add retail work, an MOT/service, or bring work forward.`;}
  const lost=c.lostParts+c.lostAuth;
  const lostLine=lost>0?`<p><strong>Lost capacity risk:</strong> ${lost.toFixed(1)} hr(s) tied up in parts or authorisation delays.</p>`:"";
  coach.innerHTML=`<div class="coach-card ${cardCls}"><h3>${title}</h3><p>${text}</p>${lostLine}<button onclick="showCapacityDrilldown()">Open capacity detail</button></div>`;
}
function showCapacityDrilldown(){
  const c=getCapacityMetrics();
  if($("modalTitle")) $("modalTitle").textContent="Workshop Capacity Intelligence";
  if($("modalTimeline")){
    const used=c.used===null?"N/A":`${c.used.toFixed(0)}%`;
    const recommendation=c.remaining<0?`Move or reallocate ${Math.abs(c.remaining).toFixed(1)} hour(s) of work.`:c.used>=85?"Only take short jobs unless extra capacity is added.":`You can still add around ${c.remaining.toFixed(1)} hour(s) of work today.`;
    $("modalTimeline").innerHTML=`<div class="gh-potential"><h3>Today’s Capacity</h3><p><strong>Available:</strong> ${c.available.toFixed(1)} hrs | <strong>Sold:</strong> ${c.sold.toFixed(1)} hrs | <strong>Used:</strong> ${used}</p><p><strong>Recommendation:</strong> ${recommendation}</p></div>`+
    c.techs.map(t=>`<div class="timeline-item ${t.available<=0?'warn':capacityStatusClass(t.usedPct)}"><strong>${t.tech}</strong><p>${t.status}</p><p>Available ${t.available.toFixed(1)} hrs | Sold ${t.sold.toFixed(1)} hrs | Remaining ${t.remaining.toFixed(1)} hrs</p></div>`).join("")+
    `<div class="timeline-item"><strong>Lost capacity risk</strong><p>Waiting parts: ${c.lostParts.toFixed(1)} hrs</p><p>Waiting authorisation: ${c.lostAuth.toFixed(1)} hrs</p></div>`;
  }
  if($("modal")) $("modal").classList.remove("hidden");
}

const previousRenderDashForCapacity=renderDash;
renderDash=function(){
  previousRenderDashForCapacity();
  renderWorkshopCapacity();
};
render();

/* =========================================================
   Workshop AI OS v4.1 — Sprint 5 / WAI-020 Technician Activity Tracking
   Expands technician clock-off reasons and prepares Lost Capacity reporting.
   ========================================================= */
function allActivityReasons(){
  return Object.keys(ACTIVITY_REASONS||{});
}
function activityTotals(days,categoryFilter=null){
  const totals={};
  allActivityReasons().forEach(r=>totals[r]=0);
  const relevant=jobs.filter(j=>withinDays(j.createdAt,days)||withinDays(j.completedAt,days)||withinDays(j.bookingDate,days));
  relevant.forEach(j=>(j.interruptions||[]).forEach(i=>{
    const reason=i.reason||"Other";
    const category=i.category||activityMeta(reason).category;
    if(categoryFilter && category!==categoryFilter) return;
    if(totals[reason]===undefined) totals[reason]=0;
    totals[reason]+=Number(i.duration||0);
  }));
  return totals;
}
function downtimeTotals(days){
  return activityTotals(days);
}
function totalsToCards(totals,title,categoryFilter=null){
  const reasons=Object.keys(totals).filter(r=>totals[r]>0.001 && (!categoryFilter || activityMeta(r).category===categoryFilter));
  if(!reasons.length) return `<div class="job-card good"><h3>${title}</h3><p>No recorded activity time yet.</p></div>`;
  const total=reasons.reduce((s,r)=>s+totals[r],0);
  return `<div class="job-card"><h3>${title}</h3><p><strong>${total.toFixed(2)} hrs</strong> recorded</p>${reasons.map(r=>`<p>${activityMeta(r).label}: <strong>${totals[r].toFixed(2)} hrs</strong></p>`).join("")}</div>`;
}
function renderDowntimeReports(){
  const today=activityTotals(1);
  const week=activityTotals(7);
  const html = `<div class="activity-summary-grid">${totalsToCards(today,"Today - All Activity")}${totalsToCards(today,"Today - Lost Capacity","lost")}${totalsToCards(week,"This Week - All Activity")}${totalsToCards(week,"This Week - Lost Capacity","lost")}</div>`;
  if($("downtimeReports")) $("downtimeReports").innerHTML=html;
  if($("ownerDowntimeReports")) $("ownerDowntimeReports").innerHTML=html;
  if($("reportsDowntime")) $("reportsDowntime").innerHTML=html;
}
function lostActivityHours(days=1){
  const totals=activityTotals(days,"lost");
  return Object.values(totals).reduce((s,v)=>s+Number(v||0),0);
}
function productiveSupportHours(days=1){
  const totals=activityTotals(days,"productive");
  return Object.values(totals).reduce((s,v)=>s+Number(v||0),0);
}
const previousGetCapacityMetricsWAI020=getCapacityMetrics;
getCapacityMetrics=function(){
  const c=previousGetCapacityMetricsWAI020();
  c.lostActivity=lostActivityHours(1);
  c.supportActivity=productiveSupportHours(1);
  return c;
};
const previousRenderWorkshopCapacityWAI020=renderWorkshopCapacity;
renderWorkshopCapacity=function(){
  previousRenderWorkshopCapacityWAI020();
  const coach=$("workshopCapacityCoach");
  if(!coach) return;
  const lost=lostActivityHours(1);
  const support=productiveSupportHours(1);
  const extra=`<div class="coach-card ${lost>1?'warn':'good'}"><h3>Lost Capacity Tracking</h3><p><strong>${lost.toFixed(2)} hrs</strong> recorded today as lost capacity.</p><p><strong>${support.toFixed(2)} hrs</strong> recorded today as productive support activity.</p><button onclick="showActivityDrilldown()">Open activity detail</button></div>`;
  coach.innerHTML+=extra;
};
function showActivityDrilldown(){
  const today=activityTotals(1);
  const week=activityTotals(7);
  if($("modalTitle")) $("modalTitle").textContent="Technician Activity & Lost Capacity";
  if($("modalTimeline")){
    const reasonRows=(totals,label)=>{
      const rows=Object.keys(totals).filter(r=>totals[r]>0.001).sort((a,b)=>totals[b]-totals[a]);
      if(!rows.length) return `<div class="timeline-item good"><strong>${label}</strong><p>No activity time recorded yet.</p></div>`;
      return `<div class="timeline-item"><strong>${label}</strong>${rows.map(r=>`<p><span class="activity-pill">${activityMeta(r).category}</span> ${activityMeta(r).label}: <strong>${totals[r].toFixed(2)} hrs</strong></p>`).join("")}</div>`;
    };
    $("modalTimeline").innerHTML=`<div class="gh-potential"><h3>Why this matters</h3><p>Every time a technician clocks off a job, Workshop AI records the reason. This becomes Lost Capacity Intelligence for management reporting.</p></div>${reasonRows(today,"Today")}${reasonRows(week,"This Week")}`;
  }
  if($("modal")) $("modal").classList.remove("hidden");
}

render();

/* =========================================================
   Workshop AI OS v4.1 — Sprint 6 / WAI-021 Downtime Pattern Reports
   Turns technician activity tracking into management reports:
   technician downtime, reason patterns, trends and recommendations.
   ========================================================= */
function activityRecords(days=1){
  const cutoff=new Date();
  cutoff.setDate(cutoff.getDate()-days);
  const records=[];
  jobs.forEach(job=>{
    (job.interruptions||[]).forEach(item=>{
      const endDate=item.end?new Date(item.end):new Date(item.start||job.createdAt||Date.now());
      if(endDate>=cutoff){
        const reason=item.reason||"Other";
        const meta=activityMeta(reason);
        records.push({
          technician:job.technician||"Unassigned",
          reg:job.reg||"Unknown",
          jobNo:job.jobNo||"",
          reason,
          label:meta.label,
          category:item.category||meta.category,
          start:item.start,
          end:item.end,
          duration:Number(item.duration||0),
          note:item.note||""
        });
      }
    });
  });
  return records;
}
function groupActivity(records,keyFn){
  return records.reduce((acc,r)=>{
    const key=keyFn(r);
    if(!acc[key]) acc[key]={hours:0,count:0,records:[]};
    acc[key].hours+=Number(r.duration||0);
    acc[key].count+=1;
    acc[key].records.push(r);
    return acc;
  },{});
}
function hoursText(h){
  h=Number(h||0);
  const whole=Math.floor(h);
  const mins=Math.round((h-whole)*60);
  if(whole<=0) return `${mins} mins`;
  if(mins===0) return `${whole}h`;
  return `${whole}h ${mins}m`;
}
function activityCategoryClass(cat){
  if(cat==="lost") return "bad";
  if(cat==="productive") return "good";
  return "warn";
}
function categoryName(cat){
  if(cat==="lost") return "Lost capacity";
  if(cat==="productive") return "Productive support";
  return "Neutral time";
}
function topActivityRows(records,limit=6){
  const grouped=groupActivity(records,r=>r.reason);
  return Object.entries(grouped).sort((a,b)=>b[1].hours-a[1].hours).slice(0,limit);
}
function technicianDowntimeTable(days=1){
  const records=activityRecords(days);
  if(!records.length) return `<div class="job-card good"><h3>Technician Downtime</h3><p>No technician downtime/activity records yet for this period.</p></div>`;
  const byTech=groupActivity(records,r=>r.technician);
  const rows=Object.entries(byTech).sort((a,b)=>b[1].hours-a[1].hours).map(([tech,data])=>{
    const lost=data.records.filter(r=>r.category==="lost").reduce((s,r)=>s+r.duration,0);
    const productive=data.records.filter(r=>r.category==="productive").reduce((s,r)=>s+r.duration,0);
    const neutral=data.records.filter(r=>r.category==="neutral").reduce((s,r)=>s+r.duration,0);
    const top=topActivityRows(data.records,3).map(([reason,d])=>`${activityMeta(reason).label} ${hoursText(d.hours)}`).join("<br>");
    return `<tr><td><strong>${tech}</strong></td><td>${hoursText(data.hours)}</td><td>${hoursText(lost)}</td><td>${hoursText(productive)}</td><td>${hoursText(neutral)}</td><td>${top||"-"}</td></tr>`;
  }).join("");
  return `<div class="table-wrap"><table><thead><tr><th>Technician</th><th>Total Activity</th><th>Lost Capacity</th><th>Productive Support</th><th>Neutral</th><th>Main Reasons</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function reasonPatternCards(days=7){
  const records=activityRecords(days);
  if(!records.length) return `<div class="job-card good"><h3>Pattern Report</h3><p>No pattern data yet. Patterns will appear once technicians clock off jobs with reasons.</p></div>`;
  const rows=topActivityRows(records,5);
  return `<div class="activity-summary-grid">${rows.map(([reason,data],idx)=>{
    const meta=activityMeta(reason);
    const cls=activityCategoryClass(meta.category);
    return `<div class="job-card ${cls}"><h3>${idx+1}. ${meta.label}</h3><p><strong>${hoursText(data.hours)}</strong> across ${data.count} event(s)</p><p>${categoryName(meta.category)}</p></div>`;
  }).join("")}</div>`;
}
function patternInsight(days=7){
  const records=activityRecords(days);
  if(!records.length) return `<div class="coach-card good"><h3>No downtime pattern yet</h3><p>Once technicians use the activity buttons, Workshop AI will show repeat patterns here.</p></div>`;
  const lost=records.filter(r=>r.category==="lost");
  const topLost=topActivityRows(lost,1)[0];
  const byTech=groupActivity(records,r=>r.technician);
  const topTech=Object.entries(byTech).sort((a,b)=>b[1].hours-a[1].hours)[0];
  let text="Activity is being captured correctly.";
  let cls="good";
  if(topLost){
    const [reason,data]=topLost;
    text=`The biggest lost-capacity reason over the last ${days} day(s) is ${activityMeta(reason).label} at ${hoursText(data.hours)}. Review this first.`;
    cls=data.hours>=2?"bad":"warn";
  } else if(topTech){
    text=`${topTech[0]} has the most recorded support/neutral activity at ${hoursText(topTech[1].hours)}. This may be useful context when reviewing productivity.`;
    cls="warn";
  }
  return `<div class="coach-card ${cls}"><h3>Pattern Insight</h3><p>${text}</p></div>`;
}
function trendCards(){
  const today=activityRecords(1);
  const week=activityRecords(7);
  const month=activityRecords(30);
  const lostToday=today.filter(r=>r.category==="lost").reduce((s,r)=>s+r.duration,0);
  const lostWeek=week.filter(r=>r.category==="lost").reduce((s,r)=>s+r.duration,0);
  const lostMonth=month.filter(r=>r.category==="lost").reduce((s,r)=>s+r.duration,0);
  return `<div class="stats"><div class="stat ${lostToday>1?'bad':'good'}"><strong>${hoursText(lostToday)}</strong>Lost Today</div><div class="stat ${lostWeek>5?'bad':'warn'}"><strong>${hoursText(lostWeek)}</strong>Lost 7 Days</div><div class="stat"><strong>${hoursText(lostMonth)}</strong>Lost 30 Days</div></div>`;
}
function renderDowntimePatterns(){
  const html=`${trendCards()}${patternInsight(7)}<h3>This Week's Downtime Patterns</h3>${reasonPatternCards(7)}<h3>Technician Breakdown - Today</h3>${technicianDowntimeTable(1)}<h3>Technician Breakdown - This Week</h3>${technicianDowntimeTable(7)}`;
  if($("downtimeReports")) $("downtimeReports").innerHTML=html;
  if($("ownerDowntimeReports")) $("ownerDowntimeReports").innerHTML=html;
  if($("reportsDowntime")) $("reportsDowntime").innerHTML=html;
}
function showDowntimePatternDrilldown(){
  if($("modalTitle")) $("modalTitle").textContent="Downtime Pattern Report";
  if($("modalTimeline")) $("modalTimeline").innerHTML=`<div class="gh-potential"><h3>Downtime Intelligence</h3><p>This report shows which technicians are clocking off jobs, why time is being lost, and whether the same reasons keep repeating.</p></div>${trendCards()}${patternInsight(7)}${reasonPatternCards(7)}${technicianDowntimeTable(7)}`;
  if($("modal")) $("modal").classList.remove("hidden");
}
const previousRenderDowntimeReportsWAI021 = typeof renderDowntimeReports === "function" ? renderDowntimeReports : null;
renderDowntimeReports=function(){
  renderDowntimePatterns();
};
const previousRenderWorkshopCapacityWAI021=renderWorkshopCapacity;
renderWorkshopCapacity=function(){
  previousRenderWorkshopCapacityWAI021();
  const coach=$("workshopCapacityCoach");
  if(!coach) return;
  const lostWeek=activityRecords(7).filter(r=>r.category==="lost").reduce((s,r)=>s+r.duration,0);
  coach.innerHTML+=`<div class="coach-card ${lostWeek>5?'bad':lostWeek>1?'warn':'good'}"><h3>Downtime Pattern Watch</h3><p><strong>${hoursText(lostWeek)}</strong> lost capacity recorded in the last 7 days.</p><button onclick="showDowntimePatternDrilldown()">Open downtime pattern report</button></div>`;
};
render();

/* =========================================================
   Workshop AI OS v4.1 — Sprint 7 / WAI-022 Workshop Coach
   Turns existing KPIs into a clear morning coach, live priorities,
   technician watch, risks and action recommendations.
   ========================================================= */
function coachGreeting(){
  const h=new Date().getHours();
  if(h<12) return "Good morning";
  if(h<17) return "Good afternoon";
  return "Good evening";
}
function coachMoney(n){return "£"+Math.round(Number(n||0)).toLocaleString("en-GB");}
function workshopLabourRate(){return Number(targets.labourRate||targets.hourlyRate||80);}
function coachWaitingApprovalJobs(){
  return jobs.filter(j=>!completed(j)&&((j.status&&String(j.status).includes("Approval"))||(j.auth&&String(j.auth).includes("Awaiting"))));
}
function coachWaitingPartsJobs(){return jobs.filter(j=>!completed(j)&&j.status&&String(j.status).includes("Awaiting Parts"));}
function coachReadyJobs(){return jobs.filter(j=>j.status&&String(j.status).includes("Ready"));}
function coachTechWatch(){
  return getTechs().map(t=>{
    const m=techMetrics(t);
    return {...m, status:techStatusLabel(t)};
  }).sort((a,b)=>(b.productivity||0)-(a.productivity||0));
}
function buildWorkshopCoachData(){
  const m=getGarageHealthMetrics();
  const health=garageHealth(m);
  const capacity=getCapacityMetrics ? getCapacityMetrics() : {available:m.available,sold:m.sold,remaining:m.available-m.sold,used:m.available>0?(m.sold/m.available)*100:null,techs:[]};
  const lostToday=typeof activityRecords==="function"?activityRecords(1).filter(r=>r.category==="lost").reduce((s,r)=>s+Number(r.duration||0),0):0;
  const lostWeek=typeof activityRecords==="function"?activityRecords(7).filter(r=>r.category==="lost").reduce((s,r)=>s+Number(r.duration||0),0):0;
  const topLost=typeof topActivityRows==="function"?topActivityRows(activityRecords(7).filter(r=>r.category==="lost"),1)[0]:null;
  const waitingAuth=coachWaitingApprovalJobs();
  const waitingParts=coachWaitingPartsJobs();
  const ready=coachReadyJobs();
  const techs=coachTechWatch();
  const bestTech=techs.find(t=>Number(t.available||0)>0&&t.productivity!==null);
  const lowTech=[...techs].reverse().find(t=>Number(t.available||0)>0&&t.productivity!==null&&(t.productivity||0)<100);
  const opportunity=(Math.max(0,capacity.remaining||0)+waitingAuth.reduce((s,j)=>s+Number(j.hours||0),0))*workshopLabourRate();
  return {m,health,capacity,lostToday,lostWeek,topLost,waitingAuth,waitingParts,ready,techs,bestTech,lowTech,opportunity};
}
function coachPriorities(data){
  const p=[];
  if(data.m.carried&&data.m.carried.length){
    const oldest=data.m.carried[0];
    p.push({rank:"🥇",cls:data.m.carried.length>2?"bad":"warn",title:`Complete carried-over job ${oldest?.reg||""}`.trim(),text:`${data.m.carried.length} carried-over job(s) are reducing Garage Health. Start with the oldest job first.`,impact:"High"});
  }
  if(data.waitingAuth.length){
    const hrs=data.waitingAuth.reduce((s,j)=>s+Number(j.hours||0),0);
    p.push({rank:p.length?"🥈":"🥇",cls:"warn",title:"Call customers awaiting authorisation",text:`${data.waitingAuth.length} job(s) are waiting for approval, holding around ${hrs.toFixed(1)} labour hour(s).`,impact:coachMoney(hrs*workshopLabourRate())});
  }
  if(data.waitingParts.length){
    p.push({rank:p.length?"🥉":"🥇",cls:"warn",title:"Check parts ETAs",text:`${data.waitingParts.length} job(s) are waiting for parts. This no longer reduces Garage Health, but it is an operational delay.`,impact:"Delay risk"});
  }
  if(data.capacity.remaining>0.5 && (data.capacity.used||0)<95){
    p.push({rank:p.length?"🎯":"🥇",cls:"good",title:"Use spare capacity",text:`There are around ${data.capacity.remaining.toFixed(1)} hour(s) remaining today. Suitable for extra retail labour, an MOT/service, or bringing work forward.`,impact:coachMoney(data.capacity.remaining*workshopLabourRate())});
  }
  if(data.capacity.remaining<0){
    p.push({rank:p.length?"⚠️":"🥇",cls:"bad",title:"Workshop is over capacity",text:`The diary is overbooked by ${Math.abs(data.capacity.remaining).toFixed(1)} hour(s). Move or reallocate lower-priority work.`,impact:"Urgent"});
  }
  if(data.topLost){
    const [reason,info]=data.topLost;
    p.push({rank:p.length?"📉":"🥇",cls:info.hours>2?"bad":"warn",title:`Reduce ${activityMeta(reason).label}`,text:`This is the biggest downtime pattern this week at ${hoursText(info.hours)}.`,impact:"Lost capacity"});
  }
  if(!p.length){
    p.push({rank:"✅",cls:"good",title:"Maintain current control",text:"Garage Health, capacity and technician activity look controlled. Keep job updates clean.",impact:"Stable"});
  }
  return p.slice(0,5);
}
function renderWorkshopCoachCards(data){
  const statusIcon=garageHealthIcon?garageHealthIcon(data.health.score):(data.health.score>=90?"🟢":data.health.score>=80?"🟡":data.health.score>=70?"🟠":"🔴");
  const priorities=coachPriorities(data);
  const used=data.capacity.used===null||data.capacity.used===undefined?"N/A":`${data.capacity.used.toFixed(0)}%`;
  const topTech=data.bestTech?`${data.bestTech.tech} — ${data.bestTech.available>0?pctText(data.bestTech.productivity):"Not available"}`:"Not enough data";
  const watch=data.lowTech?`${data.lowTech.tech} is at ${pctText(data.lowTech.productivity)}. Check whether this is caused by parts, authorisation, helping or job allocation.`:"No technician under 100% needing immediate attention.";
  return `
    <div class="coach-card good"><h3>${coachGreeting()} Matthew 👋</h3><p><strong>Garage Health:</strong> ${data.health.score}% ${statusIcon}</p><p>${data.health.message}</p></div>
    <div class="stats"><div class="stat"><strong>${data.capacity.available.toFixed(1)}</strong>Available Hrs</div><div class="stat"><strong>${data.capacity.sold.toFixed(1)}</strong>Sold Hrs</div><div class="stat"><strong>${used}</strong>Capacity Used</div><div class="stat ${data.capacity.remaining>=0?'good':'bad'}"><strong>${Math.abs(data.capacity.remaining||0).toFixed(1)}</strong>${data.capacity.remaining>=0?'Hrs Spare':'Hrs Over'}</div></div>
    <h3>Today's Priorities</h3>
    ${priorities.map(x=>`<div class="coach-card ${x.cls}"><h3>${x.rank} ${x.title}</h3><p>${x.text}</p><p><strong>Impact:</strong> ${x.impact}</p></div>`).join("")}
    <div class="coach-card ${data.lostWeek>5?'bad':data.lostWeek>1?'warn':'good'}"><h3>Downtime Watch</h3><p><strong>${hoursText(data.lostToday)}</strong> lost today | <strong>${hoursText(data.lostWeek)}</strong> lost this week.</p>${data.topLost?`<p>Main pattern: ${activityMeta(data.topLost[0]).label} — ${hoursText(data.topLost[1].hours)}.</p>`:"<p>No major downtime pattern yet.</p>"}<button onclick="showDowntimePatternDrilldown()">Open downtime report</button></div>
    <div class="coach-card good"><h3>Technician Watch</h3><p><strong>Top today:</strong> ${topTech}</p><p>${watch}</p><button onclick="show('techniciansScreen')">Open technician performance</button></div>
    <div class="coach-card ${data.opportunity>500?'warn':'good'}"><h3>Opportunity Watch</h3><p>Estimated opportunity from spare capacity and authorisation work: <strong>${coachMoney(data.opportunity)}</strong>.</p><p>Based on ${workshopLabourRate()} per labour hour.</p></div>
  `;
}
function renderWorkshopCoach(){
  const data=buildWorkshopCoachData();
  if($("ownerCoach")) $("ownerCoach").innerHTML=renderWorkshopCoachCards(data);
}
function showWorkshopCoachDrilldown(){
  const data=buildWorkshopCoachData();
  if($("modalTitle")) $("modalTitle").textContent="Workshop Coach";
  if($("modalTimeline")) $("modalTimeline").innerHTML=renderWorkshopCoachCards(data)+`<div class="timeline-item"><strong>How the Coach works</strong><p>The Coach uses Garage Health, capacity, technician productivity, job status, authorisations and downtime activity. It does not invent data; it only explains what Workshop AI has already captured.</p></div>`;
  if($("modal")) $("modal").classList.remove("hidden");
}
function buildMorningBriefing(){
  const d=buildWorkshopCoachData();
  const priorities=coachPriorities(d);
  return `WORKSHOP AI COACH — MORNING BRIEFING

${coachGreeting()} Matthew.

Garage Health: ${d.health.score}%
${d.health.message}

Capacity:
Available hours: ${d.capacity.available.toFixed(1)}
Sold hours: ${d.capacity.sold.toFixed(1)}
Remaining capacity: ${(d.capacity.remaining||0).toFixed(1)}

Today's priorities:
${priorities.map((p,i)=>`${i+1}. ${p.title} — ${p.text}`).join("\n")}

Technician watch:
${d.bestTech?`Top technician: ${d.bestTech.tech} at ${pctText(d.bestTech.productivity)}`:"Not enough technician data yet."}
${d.lowTech?`Review: ${d.lowTech.tech} is at ${pctText(d.lowTech.productivity)}.`:"No technician below target needing immediate review."}

Downtime:
Lost today: ${hoursText(d.lostToday)}
Lost this week: ${hoursText(d.lostWeek)}
${d.topLost?`Main weekly pattern: ${activityMeta(d.topLost[0]).label} at ${hoursText(d.topLost[1].hours)}.`:"No major downtime pattern yet."}

Service Manager focus:
Start with the first priority, then review authorisations, parts and spare capacity.`;
}
function buildEndOfDayBriefing(){
  const d=buildWorkshopCoachData();
  const completedToday=jobs.filter(j=>completed(j)&&j.completedAt&&String(j.completedAt).slice(0,10)===todayISO()).length;
  const ready=d.ready.length;
  return `WORKSHOP AI COACH — END OF DAY SUMMARY

Garage Health: ${d.health.score}%
${d.health.message}

Jobs completed today: ${completedToday}
Ready for collection: ${ready}

Productivity: ${pctText(d.m.productivity)}
Efficiency: ${pctText(d.m.workshopEff)}
Capacity used: ${d.capacity.used==null?"N/A":d.capacity.used.toFixed(0)+"%"}

Lost capacity today: ${hoursText(d.lostToday)}
Lost capacity this week: ${hoursText(d.lostWeek)}

Technician of the day:
${d.bestTech?`${d.bestTech.tech} — ${pctText(d.bestTech.productivity)}`:"Not enough data yet."}

Main lesson from today:
${d.topLost?`${activityMeta(d.topLost[0]).label} is the biggest downtime pattern this week.`:"No major downtime pattern recorded yet."}

Tomorrow's focus:
Keep technician status, job timers and activity reasons updated so the Coach can give accurate recommendations.`;
}
renderCoach=function(){renderWorkshopCoach();};
const previousRenderDashWAI022=renderDash;
renderDash=function(){
  previousRenderDashWAI022();
  renderWorkshopCoach();
  renderEndOfDayBriefing();
};
render();

/* =========================================================
   Workshop AI OS v5.0 — WAI-100.1 Workshop Coach Mission Control
   Adds a proper flagship Coach panel with Decision Score,
   One Thing Today, Morning / Live / End tabs and Wins.
   ========================================================= */
let workshopCoachMode="morning";
function setWorkshopCoachMode(mode){
  workshopCoachMode=mode;
  document.querySelectorAll("#workshopCoachTabs .gh-tab").forEach(btn=>btn.classList.remove("active"));
  const idx={morning:0,live:1,end:2}[mode] ?? 0;
  document.querySelectorAll("#workshopCoachTabs .gh-tab")[idx]?.classList.add("active");
  renderWorkshopCoachMissionControl();
}
// Make the Coach tab function available to button clicks and bind buttons robustly.
window.setWorkshopCoachMode=setWorkshopCoachMode;
function bindWorkshopCoachButtons(){
  const tabs=document.querySelectorAll("#workshopCoachTabs .gh-tab");
  tabs.forEach((btn,idx)=>{
    const mode=["morning","live","end"][idx];
    btn.type="button";
    btn.onclick=(event)=>{
      if(event) event.preventDefault();
      setWorkshopCoachMode(mode);
    };
  });
}
function coachDecisionScore(data){
  let score=10;
  if(data.health.score<90) score-=1;
  if(data.health.score<80) score-=1.5;
  if((data.capacity.remaining||0)<0) score-=1.5;
  if(data.waitingAuth.length) score-=Math.min(1.5,data.waitingAuth.length*.5);
  if(data.waitingParts.length) score-=Math.min(1.2,data.waitingParts.length*.4);
  if(data.m.carried&&data.m.carried.length) score-=Math.min(2,data.m.carried.length*.7);
  if(data.lostToday>1) score-=Math.min(1.3,data.lostToday*.3);
  return Math.max(1,Math.min(10,score));
}
function coachDecisionClass(score){return score>=8.5?"good":score>=6.5?"warn":"bad";}
function coachWins(data){
  const wins=[];
  if(data.health.score>=90) wins.push("Garage Health is above 90%.");
  if((data.m.productivity||0)>=100) wins.push(`Productivity is on target at ${pctText(data.m.productivity)}.`);
  if((data.capacity.remaining||0)>=0) wins.push("Workshop is not over capacity.");
  if(!data.waitingParts.length) wins.push("No active job is waiting for parts.");
  if(!data.waitingAuth.length) wins.push("No customer authorisations are currently blocking work.");
  if(data.lostToday<0.5) wins.push("Lost capacity is currently low today.");
  if(!wins.length) wins.push("The Coach has enough data to guide today’s priorities.");
  return wins.slice(0,5);
}
function coachOneThing(data){
  const first=coachPriorities(data)[0];
  if(!first) return "Keep job statuses and technician activity updated so the Coach can stay accurate.";
  return `If you only do one thing next, ${first.title.toLowerCase()}. ${first.text}`;
}
function renderCoachMission(data){
  const score=coachDecisionScore(data);
  const cls=coachDecisionClass(score);
  const potential=garageHealthPotential ? garageHealthPotential(data.m,data.health) : data.health.score;
  return `
    <div class="coach-one-thing"><h3>One Thing Today</h3><p>${coachOneThing(data)}</p></div>
    <div class="coach-mission-grid">
      <div class="stat ${cls}"><strong class="coach-score">${score.toFixed(1)}</strong>Focus Score / 10</div>
      <div class="stat"><strong>${data.health.score}%</strong>Garage Health</div>
      <div class="stat"><strong>${potential}%</strong>Potential Today</div>
      <div class="stat ${data.capacity.remaining>=0?'good':'bad'}"><strong>${Math.abs(data.capacity.remaining||0).toFixed(1)}</strong>${data.capacity.remaining>=0?'Hours Spare':'Hours Over'}</div>
      <div class="stat ${data.opportunity>500?'warn':'good'}"><strong>${coachMoney(data.opportunity)}</strong>Opportunity</div>
    </div>`;
}
function renderCoachPriorityList(data){
  const priorities=coachPriorities(data);
  return priorities.map(p=>`<div class="coach-card ${p.cls}"><div class="coach-priority-row"><div><h3>${p.rank} ${p.title}</h3><p>${p.text}</p></div><strong>${p.impact}</strong></div></div>`).join("");
}
function renderCoachWins(data){
  return `<h3>Wins Today</h3><div class="coach-win-list">${coachWins(data).map(w=>`<div class="coach-win">✓ ${w}</div>`).join("")}</div>`;
}
function renderCoachPanel(data){
  if(workshopCoachMode==="live"){
    return `<h3>Live Priorities</h3>${renderCoachPriorityList(data)}<h3>Technician Watch</h3><div class="coach-card good"><p>${data.bestTech?`Top today: <strong>${data.bestTech.tech}</strong> at ${pctText(data.bestTech.productivity)}.`:"Not enough technician data yet."}</p><p>${data.lowTech?`Review ${data.lowTech.tech}: currently ${pctText(data.lowTech.productivity)}.`:"No technician under target needing immediate attention."}</p></div><h3>Downtime Watch</h3><div class="coach-card ${data.lostWeek>5?'bad':data.lostWeek>1?'warn':'good'}"><p>Lost today: <strong>${hoursText(data.lostToday)}</strong></p><p>Lost this week: <strong>${hoursText(data.lostWeek)}</strong></p>${data.topLost?`<p>Main pattern: <strong>${activityMeta(data.topLost[0]).label}</strong> — ${hoursText(data.topLost[1].hours)}.</p>`:"<p>No major pattern yet.</p>"}</div>`;
  }
  if(workshopCoachMode==="end"){
    return `<h3>End of Day Summary</h3><pre>${buildEndOfDayBriefing()}</pre>`;
  }
  return `<h3>Morning Briefing</h3><pre>${buildMorningBriefing()}</pre>${renderCoachWins(data)}<h3>Top Priorities</h3>${renderCoachPriorityList(data)}`;
}
function renderWorkshopCoachMissionControl(){
  const data=buildWorkshopCoachData();
  if($("workshopCoachMission")) $("workshopCoachMission").innerHTML=renderCoachMission(data);
  if($("workshopCoachPanel")) $("workshopCoachPanel").innerHTML=renderCoachPanel(data);
}
const previousRenderWorkshopCoachMissionWAI100=renderWorkshopCoach;
renderWorkshopCoach=function(){
  previousRenderWorkshopCoachMissionWAI100();
  renderWorkshopCoachMissionControl();
};
const previousRenderDashWAI100=renderDash;
renderDash=function(){
  previousRenderDashWAI100();
  bindWorkshopCoachButtons();
  renderWorkshopCoachMissionControl();
};
if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded",()=>{bindWorkshopCoachButtons();renderWorkshopCoachMissionControl();});
}else{
  bindWorkshopCoachButtons();
  renderWorkshopCoachMissionControl();
}
window.addEventListener("storage",e=>{
  if(e.key && (e.key.startsWith("workshopAIJobs") || e.key.startsWith("pcaJobs"))){
    try{jobs=JSON.parse(localStorage.getItem("workshopAIJobsV27")||localStorage.getItem("pcaJobsV11")||"[]");render();}catch(err){console.warn("Workshop AI sync failed",err)}
  }
});

render();


/* Workshop AI OS v5.3 — Vehicle Intelligence
   Logic-only addition: does not change existing job workflow, Coach, timers or Garage Health.
*/
function normaliseText(v){return String(v||"").toLowerCase().trim();}
function vehicleHistorySearchText(job){
  ensureTimeline(job);
  return [
    job.jobNo, job.reg, job.customer, job.phone, job.make, job.model, job.mileage,
    job.type, job.technician, job.status, job.workRequired, job.specialInstructions,
    job.complaint, job.findings, job.repair, job.parts, job.advisories, job.report,
    (job.partsRequests||[]).map(p=>[p.description,p.qty,p.priority,p.supplier,p.status].join(" ")).join(" "),
    (job.timeline||[]).map(t=>[t.title,t.detail].join(" ")).join(" ")
  ].join(" ");
}
function jobIsOpenForHistory(job){return !completed(job) && !(job.status||"").includes("Collected");}
function jobHistoryBadge(job){
  const st=job.status||"";
  if(st.includes("Awaiting Parts")) return `<span class="history-badge parts">Awaiting Parts</span>`;
  if(jobIsOpenForHistory(job)) return `<span class="history-badge open">Open</span>`;
  return `<span class="history-badge complete">History</span>`;
}
function vehicleHistoryPartsSummary(job){
  const requests=job.partsRequests||[];
  if(requests.length){
    return requests.map(p=>`${p.description||"Part"} x${p.qty||1} (${p.status||"Requested"})`).join(", ");
  }
  return job.parts || "No parts recorded";
}
function vehicleHistoryVisitsByReg(list){
  const map={};
  list.forEach(j=>{const reg=(j.reg||"Unknown").toUpperCase();map[reg]=(map[reg]||0)+1;});
  return map;
}
function renderVehicleIntelligence(){
  if(!$('vehicleIntelligenceResults')) return;
  const q=normaliseText($('vehicleHistorySearch') ? $('vehicleHistorySearch').value : "");
  const filter=$('vehicleHistoryQuickFilter') ? $('vehicleHistoryQuickFilter').value : "all";
  let list=jobs.slice().sort((a,b)=>new Date(b.completedAt||b.finishedAt||b.createdAt||0)-new Date(a.completedAt||a.finishedAt||a.createdAt||0));
  if(q){
    list=list.filter(j=>normaliseText(vehicleHistorySearchText(j)).includes(q));
  }
  if(filter==="completed") list=list.filter(j=>completed(j) || (j.status||"").includes("Ready") || (j.status||"").includes("Collected"));
  if(filter==="open") list=list.filter(jobIsOpenForHistory);
  if(filter==="parts") list=list.filter(j=>(j.status||"").includes("Awaiting Parts") || (j.partsRequests||[]).some(p=>!["Received","Fitted"].includes(p.status)));
  if(filter==="approval") list=list.filter(j=>(j.status||"").includes("Approval"));
  const visits=vehicleHistoryVisitsByReg(list);
  const uniqueVehicles=Object.keys(visits).length;
  const completedCount=list.filter(j=>completed(j)).length;
  const openCount=list.filter(jobIsOpenForHistory).length;
  const partsCount=list.filter(j=>(j.status||"").includes("Awaiting Parts") || (j.partsRequests||[]).some(p=>!["Received","Fitted"].includes(p.status))).length;
  if($('vehicleIntelligenceStats')){
    $('vehicleIntelligenceStats').innerHTML=`
      <div class="stat"><strong>${list.length}</strong>Jobs Found</div>
      <div class="stat"><strong>${uniqueVehicles}</strong>Vehicles</div>
      <div class="stat good"><strong>${completedCount}</strong>History Jobs</div>
      <div class="stat warn"><strong>${openCount}</strong>Open Jobs</div>
      <div class="stat ${partsCount?'bad':'good'}"><strong>${partsCount}</strong>Parts Issues</div>`;
  }
  if(!list.length){
    $('vehicleIntelligenceResults').innerHTML=q?"No matching vehicle history found.":"No jobs recorded yet.";
    return;
  }
  $('vehicleIntelligenceResults').innerHTML=list.map(j=>{
    ensureTimeline(j);
    const visitCount=visits[(j.reg||"Unknown").toUpperCase()]||1;
    const reportPreview=j.report?`<div class="history-report-preview">${j.report}</div>`:"";
    return `<div class="job-card vehicle-intelligence-card">
      <h3>${j.reg||"No reg"} — ${j.make||""} ${j.model||""} ${jobHistoryBadge(j)}</h3>
      <div class="vehicle-intelligence-meta">
        <div><strong>Job Number</strong>${j.jobNo||"Not set"}</div>
        <div><strong>Customer</strong>${j.customer||"Not entered"}</div>
        <div><strong>Telephone</strong>${j.phone||"Not entered"}</div>
        <div><strong>Technician</strong>${j.technician||"Not set"}</div>
        <div><strong>Booking Date</strong>${j.bookingDate||"Not set"}</div>
        <div><strong>Completed</strong>${j.completedAt?fmt(j.completedAt):"Not completed"}</div>
        <div><strong>Status</strong>${j.status||"Not set"}</div>
        <div><strong>Total Visits Found</strong>${visitCount}</div>
      </div>
      <p><strong>Work Required:</strong> ${j.workRequired||"Not entered"}</p>
      <p><strong>Repair / Findings:</strong> ${j.repair||j.findings||"No technician repair summary yet."}</p>
      <p><strong>Parts History:</strong> ${vehicleHistoryPartsSummary(j)}</p>
      <p><strong>Timeline Events:</strong> ${(j.timeline||[]).length}</p>
      ${reportPreview}
      <div class="vehicle-intelligence-actions">
        <button onclick="showTimelineModal('${j.id}')">Timeline</button>
        <button onclick="openJob('${j.id}')">Open Job</button>
        ${j.report?`<button onclick="copyVehicleHistoryReport('${j.id}')">Copy Report</button>`:""}
      </div>
    </div>`;
  }).join("");
}
function copyVehicleHistoryReport(id){
  const j=jobs.find(x=>x.id===id);
  if(!j||!j.report){alert("No report available for this job.");return;}
  navigator.clipboard.writeText(j.report);
  alert("Vehicle history report copied.");
}
function bindVehicleIntelligence(){
  if($('vehicleHistorySearch')) $('vehicleHistorySearch').addEventListener('input',renderVehicleIntelligence);
  if($('vehicleHistoryQuickFilter')) $('vehicleHistoryQuickFilter').addEventListener('change',renderVehicleIntelligence);
  if($('vehicleHistorySearchBtn')) $('vehicleHistorySearchBtn').addEventListener('click',renderVehicleIntelligence);
}
const previousRenderVehicleIntelligenceV53=render;
render=function(){
  previousRenderVehicleIntelligenceV53();
  renderVehicleIntelligence();
};
if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded",()=>{bindVehicleIntelligence();renderVehicleIntelligence();});
}else{
  bindVehicleIntelligence();
  renderVehicleIntelligence();
}
