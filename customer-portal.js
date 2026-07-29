/* Workshop AI WAI-104.0 — Read-only Customer Portal Foundation */
(function(){
  const SETTINGS_KEY="workshopAICustomerPortalV104";
  const $p=id=>document.getElementById(id);
  const esc=value=>String(value??"").replace(/[&<>\"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[ch]));
  const normalise=value=>String(value||"").trim().toUpperCase().replace(/\s+/g,"");
  const formatDate=value=>value?new Date(value).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}):"Not recorded";
  const formatDateTime=value=>value?new Date(value).toLocaleString("en-GB",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}):"Not recorded";
  const isComplete=job=>!!job.completedAt||/ready|complete|collected|closed/i.test(job.status||"");
  function readStoredJobs(){
    const keys=["workshopAIJobsV27","workshopAIJobsV26","workshopAIJobsV25","workshopAIJobsV24","workshopAIJobsV23","workshopAIJobsV22","workshopAIJobsV21","pcaJobsV11","pcaJobsV10","pcaJobsV09","pcaJobsV08","pcaJobsV07","pcaJobsV06"];
    for(const key of keys){
      try{
        const parsed=JSON.parse(localStorage.getItem(key)||"null");
        if(Array.isArray(parsed)&&parsed.length)return parsed;
      }catch(_){}
    }
    return [];
  }
  function allJobs(){
    if(Array.isArray(window.jobs)&&window.jobs.length)return window.jobs;
    try{if(typeof jobs!=="undefined"&&Array.isArray(jobs)&&jobs.length)return jobs;}catch(_){}
    return readStoredJobs();
  }
  function getSettings(){try{return JSON.parse(localStorage.getItem(SETTINGS_KEY)||"{}")}catch(_){return {}}}
  function saveSettings(data){localStorage.setItem(SETTINGS_KEY,JSON.stringify(data));}
  function vehicleGroups(){
    const groups=new Map();
    allJobs().forEach(job=>{
      const reg=normalise(job.reg);
      if(!reg)return;
      if(!groups.has(reg))groups.set(reg,[]);
      groups.get(reg).push(job);
    });
    return [...groups.entries()].map(([reg,list])=>({reg,list:list.sort((a,b)=>new Date(b.completedAt||b.bookingDate||b.createdAt||0)-new Date(a.completedAt||a.bookingDate||a.createdAt||0)),latest:list[0]})).sort((a,b)=>a.reg.localeCompare(b.reg));
  }
  function selectedReg(){return normalise($p("portalVehicleSelect")?.value)}
  function selectedGroup(){return vehicleGroups().find(g=>g.reg===selectedReg())}
  function populateVehicles(){
    const select=$p("portalVehicleSelect"); if(!select)return;
    const query=String($p("portalVehicleSearch")?.value||"").toLowerCase().trim();
    const current=select.value;
    const groups=vehicleGroups().filter(g=>!query||[g.reg,g.latest.customer,g.latest.phone,g.latest.jobNo,g.latest.make,g.latest.model].join(" ").toLowerCase().includes(query));
    const placeholder=groups.length?'Select a vehicle':'No workshop vehicles found';
    select.innerHTML=`<option value="">${placeholder}</option>`+groups.map(g=>`<option value="${esc(g.reg)}">${esc(g.reg)} — ${esc(g.latest.make||"")} ${esc(g.latest.model||"")} — ${esc(g.latest.customer||"Customer not entered")}</option>`).join("");
    select.disabled=!groups.length;
    if(groups.some(g=>g.reg===current))select.value=current;
  }
  function visibility(){return {current:$p("portalShowCurrent")?.checked!==false,history:$p("portalShowHistory")?.checked!==false,vhc:$p("portalShowVhc")?.checked!==false,media:$p("portalShowMedia")?.checked!==false,documents:$p("portalShowDocuments")?.checked!==false,warranty:$p("portalShowWarranty")?.checked!==false,recommendations:$p("portalShowRecommendations")?.checked!==false}}
  function loadVehicleSettings(){
    const reg=selectedReg(), all=getSettings(), saved=all[reg]||{};
    if($p("portalAccessCode"))$p("portalAccessCode").value=saved.code||"";
    const map={portalShowCurrent:"current",portalShowHistory:"history",portalShowVhc:"vhc",portalShowMedia:"media",portalShowDocuments:"documents",portalShowWarranty:"warranty",portalShowRecommendations:"recommendations"};
    Object.entries(map).forEach(([id,key])=>{if($p(id))$p(id).checked=saved.visibility?.[key]!==false});
    $p("portalEmptyState")?.classList.toggle("hidden",!!reg);
  }
  function generateCode(){
    if(!selectedReg()){alert("Select a vehicle first.");return;}
    const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let code="";
    for(let i=0;i<8;i++)code+=chars[Math.floor(Math.random()*chars.length)];
    $p("portalAccessCode").value=code.slice(0,4)+"-"+code.slice(4);
    persist();
  }
  function persist(){
    const group=selectedGroup(); if(!group){alert("Select a vehicle first.");return false;}
    const all=getSettings();
    all[group.reg]={code:$p("portalAccessCode")?.value||"",visibility:visibility(),updatedAt:new Date().toISOString(),customer:group.latest.customer||"",vehicle:`${group.latest.make||""} ${group.latest.model||""}`.trim()};
    saveSettings(all); return true;
  }
  function copyAccess(){
    const group=selectedGroup(); if(!group){alert("Select a vehicle first.");return;}
    if(!$p("portalAccessCode").value)generateCode();
    const text=`Workshop AI vehicle portal\nVehicle: ${group.reg}\nCustomer: ${group.latest.customer||"Customer"}\nAccess code: ${$p("portalAccessCode").value}\n\nThis is a read-only vehicle record. It does not include payments, bookings or authorisations.`;
    navigator.clipboard?.writeText(text).then(()=>alert("Customer access details copied.")).catch(()=>prompt("Copy these access details:",text));
  }
  function statusIndex(status){
    const s=String(status||"").toLowerCase();
    if(/ready|complete|collected/.test(s))return 5;if(/quality|road test/.test(s))return 4;if(/repair|mot testing/.test(s))return 3;if(/author|approval|parts/.test(s))return 2;if(/diagnos|inspection|additional/.test(s))return 1;return 0;
  }
  function currentVisitHtml(group,show){
    if(!show)return "";
    const job=group.list.find(j=>!isComplete(j))||group.list[0]; if(!job)return "";
    const steps=["Booked in","Inspection","Waiting","Work in progress","Quality check","Ready"];
    const idx=statusIndex(job.status);
    return `<section class="portal-section"><div class="portal-section-head"><h3>Current Visit</h3><span class="portal-tag">${esc(job.status||"Status not recorded")}</span></div><div class="portal-status-track">${steps.map((step,i)=>`<div class="portal-status-step ${i<idx?'done':i===idx?'active':''}">${esc(step)}</div>`).join("")}</div><div class="portal-info-grid"><div class="portal-info"><strong>Job number</strong>${esc(job.jobNo||"Not recorded")}</div><div class="portal-info"><strong>Visit date</strong>${esc(formatDate(job.bookingDate||job.createdAt))}</div><div class="portal-info"><strong>Mileage</strong>${esc(job.mileage||"Not recorded")}</div></div><p><strong>Work requested:</strong> ${esc(job.workRequired||job.complaint||"No work description has been published yet.")}</p>${job.findings?`<p><strong>Technician findings:</strong> ${esc(job.findings)}</p>`:""}${job.repair?`<p><strong>Work completed:</strong> ${esc(job.repair)}</p>`:""}${job.report?`<div class="portal-report">${esc(job.report)}</div>`:""}</section>`;
  }
  function timelineHtml(group,show){
    if(!show)return "";
    const completedJobs=group.list.filter(isComplete);
    const list=completedJobs.length?completedJobs:group.list;
    return `<section class="portal-section"><div class="portal-section-head"><h3>Vehicle Timeline</h3><span>${list.length} visit${list.length===1?'':'s'}</span></div>${list.map(job=>`<div class="portal-history-item"><h4>${esc(formatDate(job.completedAt||job.bookingDate||job.createdAt))} — ${esc(job.jobNo||"Workshop visit")}</h4><p><strong>${esc(job.workRequired||job.complaint||"Workshop visit")}</strong></p>${job.repair||job.findings?`<p>${esc(job.repair||job.findings)}</p>`:""}<p class="muted">Mileage: ${esc(job.mileage||"Not recorded")} · MOT: ${esc(job.mot||"Not recorded")}</p></div>`).join("")}</section>`;
  }
  function detailsHtml(group,v){
    const jobs=group.list, latest=group.latest;
    const parts=jobs.flatMap(j=>(j.partsRequests||[]).map(p=>({job:j,p}))).filter(x=>x.p.description||x.p.text);
    const advisories=jobs.flatMap(j=>String(j.advisories||"").split(/\n|,/).map(x=>x.trim()).filter(Boolean));
    const timeline=jobs.flatMap(j=>(j.timeline||[]).map(t=>({...t,job:j}))).sort((a,b)=>new Date(b.time||0)-new Date(a.time||0));
    let html=`<section class="portal-section"><h3>Vehicle Details</h3><div class="portal-info-grid"><div class="portal-info"><strong>Registration</strong>${esc(group.reg)}</div><div class="portal-info"><strong>Make &amp; model</strong>${esc(`${latest.make||""} ${latest.model||""}`.trim()||"Not recorded")}</div><div class="portal-info"><strong>Latest mileage</strong>${esc(latest.mileage||"Not recorded")}</div><div class="portal-info"><strong>Customer</strong>${esc(latest.customer||"Not recorded")}</div><div class="portal-info"><strong>Total workshop visits</strong>${jobs.length}</div><div class="portal-info"><strong>Last visit</strong>${esc(formatDate(latest.completedAt||latest.bookingDate||latest.createdAt))}</div></div></section>`;
    if(v.vhc){const vhcEvents=timeline.filter(t=>/vhc|health check|inspection/i.test(`${t.title} ${t.detail}`));html+=`<section class="portal-section"><h3>Vehicle Health Checks</h3>${vhcEvents.length?vhcEvents.map(t=>`<div class="portal-doc"><span><strong>${esc(t.title)}</strong><br><small>${esc(formatDateTime(t.time))}</small></span><span>${esc(t.detail||"")}</span></div>`).join(""):'<div class="portal-hidden-note">No VHC result has been recorded for this vehicle yet.</div>'}</section>`}
    if(v.recommendations)html+=`<section class="portal-section"><h3>Advisories &amp; Future Maintenance</h3>${advisories.length?`<div class="portal-tags">${[...new Set(advisories)].map(a=>`<span class="portal-tag">${esc(a)}</span>`).join("")}</div>`:'<div class="portal-hidden-note">No outstanding advisories are recorded.</div>'}</section>`;
    if(v.warranty)html+=`<section class="portal-section"><h3>Parts Fitted &amp; Warranty Record</h3>${parts.length?`<div class="portal-doc-list">${parts.map(({job,p})=>`<div class="portal-doc"><span><strong>${esc(p.description||p.text)}</strong><br><small>${esc(formatDate(job.completedAt||job.bookingDate||job.createdAt))} · ${esc(job.jobNo||"")}</small></span><span>${esc(p.status||"Recorded")}${p.warranty?` · ${esc(p.warranty)}`:""}</span></div>`).join("")}</div>`:'<div class="portal-hidden-note">No itemised parts record is available yet.</div>'}</section>`;
    if(v.media){const count=jobs.reduce((s,j)=>s+Number(j.photoCount||0)+(j.photos?.length||0)+(j.videos?.length||0),0);html+=`<section class="portal-section"><h3>Photos &amp; Videos</h3><div class="portal-hidden-note">${count?`${count} media item${count===1?'':'s'} recorded against this vehicle.`:'No customer-visible photos or videos have been recorded yet.'}</div></section>`}
    if(v.documents){html+=`<section class="portal-section"><h3>Documents &amp; Invoices</h3><div class="portal-doc-list">${jobs.map(j=>`<div class="portal-doc"><span><strong>${esc(j.jobNo||"Workshop record")}</strong><br><small>${esc(formatDate(j.completedAt||j.bookingDate||j.createdAt))}</small></span><span>${j.report?'Technician report available':'Workshop record'}</span></div>`).join("")}</div><p class="muted">Customer-facing invoice and document downloads will connect to the production document store in a later backend stage.</p></section>`}
    return html;
  }
  function renderPreview(){
    const group=selectedGroup(); if(!group){alert("Select a vehicle first.");return;}
    persist(); const v=visibility(), latest=group.latest;
    $p("portalVehicleTitle").textContent=`${group.reg} — ${latest.make||""} ${latest.model||""}`.trim();
    $p("portalCustomerGreeting").textContent=`Hello ${latest.customer||"Customer"}. Here is the workshop record for your vehicle.`;
    const completed=group.list.filter(isComplete).length, open=group.list.filter(j=>!isComplete(j)).length;
    $p("portalVehicleToday").innerHTML=`<div class="portal-today-card"><strong>${group.list.length}</strong>Workshop visits</div><div class="portal-today-card"><strong>${completed}</strong>Completed visits</div><div class="portal-today-card"><strong>${open}</strong>Current jobs</div><div class="portal-today-card"><strong>${esc(latest.mileage||"—")}</strong>Latest mileage</div><div class="portal-today-card"><strong>${latest.mot&&latest.mot!=="None"?esc(latest.mot):"—"}</strong>Latest MOT record</div><div class="portal-today-card"><strong>${esc(formatDate(latest.completedAt||latest.bookingDate||latest.createdAt))}</strong>Last update</div>`;
    $p("portalCurrentVisit").innerHTML=currentVisitHtml(group,v.current);
    $p("portalVehicleTimeline").innerHTML=timelineHtml(group,v.history);
    $p("portalVehicleDetails").innerHTML=detailsHtml(group,v);
    $p("portalCustomerPreview").classList.remove("hidden");
    $p("portalEmptyState")?.classList.add("hidden");
    document.querySelector(".portal-admin")?.classList.add("hidden");
  }
  function closePreview(){ $p("portalCustomerPreview")?.classList.add("hidden");document.querySelector(".portal-admin")?.classList.remove("hidden");$p("portalEmptyState")?.classList.toggle("hidden",!!selectedReg()); }
  function init(){
    if(!$p("customerPortalScreen"))return;
    populateVehicles();
    $p("portalVehicleSearch")?.addEventListener("input",populateVehicles);
    $p("portalVehicleSelect")?.addEventListener("focus",populateVehicles);
    $p("portalVehicleSelect")?.addEventListener("mousedown",populateVehicles);
    $p("portalVehicleSelect")?.addEventListener("change",loadVehicleSettings);
    document.querySelector('[data-screen="customerPortalScreen"]')?.addEventListener("click",()=>setTimeout(populateVehicles,0));
    $p("portalGenerateCode")?.addEventListener("click",generateCode);
    $p("portalSaveSettings")?.addEventListener("click",()=>{if(persist())alert("Customer portal settings saved.")});
    $p("portalCopyAccess")?.addEventListener("click",copyAccess);
    $p("portalOpenPreview")?.addEventListener("click",renderPreview);
    $p("portalClosePreview")?.addEventListener("click",closePreview);
    window.addEventListener("storage",e=>{if(e.key&&(/workshopAIJobs|pcaJobs/.test(e.key)))populateVehicles()});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
  window.WorkshopCustomerPortal={refresh:populateVehicles,open:renderPreview};
})();
