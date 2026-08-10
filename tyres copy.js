/* =====================================================================
   Workshop AI OS — WAI-082 Tyre Delivery Confirmation

   Technician workflow:
   - Request tyres using tyre size and quantity only.

   Service Manager workflow:
   - Tyre requests appear in an Action Centre panel, like Parts Requested.
   - Service Manager completes brand, tyre size, supplier and cost.
   - Status changes from Requested to Ordered.
   - Service Manager or assigned technician can confirm tyres have been delivered.
   - Delivery confirmation records time, person and role, and updates the job timeline.

   This module does not alter timers, job status or the existing Parts workflow.
   ===================================================================== */
(function(){
  "use strict";

  const BRANDS=["Michelin","Goodyear","Continental","Bridgestone","Pirelli","Dunlop","Yokohama","Hankook","Other"];
  const SUPPLIERS=["Bond","ETB","Micheldever","Stapletons","Protyre","Local Supplier","Other"];
  let requestJobId=null;
  let orderJobId=null;
  let orderTyreId=null;

  function el(id){return document.getElementById(id)}
  function esc(value){return String(value??"").replace(/[&<>'"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[ch]))}
  function money(value){return "£"+Number(value||0).toFixed(2)}
  function nowISO(){return new Date().toISOString()}
  function id(){return "TYRE-"+Date.now()+"-"+Math.random().toString(36).slice(2,7).toUpperCase()}
  function listJobs(){try{return Array.isArray(jobs)?jobs:[]}catch(e){return[]}}
  function findJob(jobId){return listJobs().find(job=>String(job.id)===String(jobId))}
  function tyreList(job){if(!job)return[];if(!Array.isArray(job.tyreRequests))job.tyreRequests=[];return job.tyreRequests}
  function tyreStatus(tyre){
    const raw=String(tyre?.status||"Requested").trim().toLowerCase();
    if(tyre?.fittedAt||tyre?.fitDate||raw.includes("fitted")||raw==="completed")return "Fitted";
    if(tyre?.deliveredAt||tyre?.arrivedAt||tyre?.receivedAt||raw.includes("delivered")||raw.includes("arrived")||raw.includes("received"))return "Delivered";
    if(tyre?.orderedAt||raw.includes("ordered")||raw.includes("awaiting delivery")||raw.includes("on order"))return "Ordered";
    return "Requested";
  }
  function allTyres(){
    const rows=[];
    listJobs().forEach(job=>tyreList(job).forEach(tyre=>rows.push({job,tyre})));
    return rows.sort((a,b)=>new Date(b.tyre.requestedAt||0)-new Date(a.tyre.requestedAt||0));
  }
  function persist(){try{if(typeof save==="function")save()}catch(e){console.error("WAI-081 save failed",e)}}
  function timeline(job,title,detail){try{if(typeof addTimeline==="function")addTimeline(job,title,detail)}catch(e){}}
  function fmt(value){return value?new Date(value).toLocaleString("en-GB"):"Not recorded"}
  function switchScreen(screenId){
    try{if(typeof show==="function"){show(screenId);return}}catch(e){}
    document.querySelectorAll(".screen").forEach(node=>node.classList.remove("active"));
    el(screenId)?.classList.add("active");
  }

  function installStyles(){
    if(el("wai081Styles"))return;
    const style=document.createElement("style");
    style.id="wai081Styles";
    style.textContent=`
      .wai081-status{display:inline-flex;align-items:center;gap:6px;padding:4px 9px;border-radius:999px;font-size:12px;font-weight:700;background:#fff3cd;color:#694f00}
      .wai081-status.ordered{background:#dff5e5;color:#155b2d}
      .wai081-status.delivered{background:#dbeafe;color:#1e40af}
      .wai081-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
      .wai081-summary{margin-top:12px;padding:12px;border-left:4px solid #e5a800;background:rgba(229,168,0,.08);border-radius:8px}
      .wai081-summary p{margin:4px 0}
      .wai081-manager-card{border-left:4px solid #e5a800}
      .wai081-kpi{cursor:pointer}
      .wai081-kpi:focus{outline:3px solid rgba(56,132,255,.35)}
      .wai081-modal{position:fixed;inset:0;z-index:9999;background:rgba(5,15,28,.72);display:flex;align-items:center;justify-content:center;padding:18px}
      .wai081-modal.hidden{display:none}
      .wai081-modal-card{width:min(680px,100%);max-height:92vh;overflow:auto;background:#fff;color:#172536;border-radius:14px;padding:22px;box-shadow:0 24px 70px rgba(0,0,0,.35)}
      .wai081-modal-head{display:flex;align-items:center;justify-content:space-between;gap:12px}
      .wai081-close{font-size:24px;line-height:1;background:transparent;border:0;color:#172536}
      .wai081-other.hidden{display:none}
      .wai081-report-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}
    `;
    document.head.appendChild(style);
  }

  function installRequestModal(){
    if(el("wai081TyreRequestModal"))return;
    const modal=document.createElement("div");
    modal.id="wai081TyreRequestModal";
    modal.className="wai081-modal hidden";
    modal.innerHTML=`<div class="wai081-modal-card" role="dialog" aria-modal="true">
      <div class="wai081-modal-head"><div><h2>🛞 Request Tyres</h2><p id="wai081RequestJob" class="muted"></p></div><button id="wai081RequestClose" class="wai081-close">×</button></div>
      <div class="grid">
        <label>Tyre Size<input id="wai081RequestSize" placeholder="Example: 225/45 R17 94Y"></label>
        <label>Quantity<input id="wai081RequestQty" type="number" min="1" step="1" value="1"></label>
      </div>
      <div class="wai081-actions"><button id="wai081RequestSubmit" class="primary">Send Tyre Request</button><button id="wai081RequestCancel" class="secondary">Cancel</button></div>
    </div>`;
    document.body.appendChild(modal);
    el("wai081RequestClose").addEventListener("click",closeRequestForm);
    el("wai081RequestCancel").addEventListener("click",closeRequestForm);
    el("wai081RequestSubmit").addEventListener("click",submitRequest);
    modal.addEventListener("click",event=>{if(event.target===modal)closeRequestForm()});
  }

  function installOrderModal(){
    if(el("wai081TyreOrderModal"))return;
    const modal=document.createElement("div");
    modal.id="wai081TyreOrderModal";
    modal.className="wai081-modal hidden";
    modal.innerHTML=`<div class="wai081-modal-card" role="dialog" aria-modal="true">
      <div class="wai081-modal-head"><div><h2>🛞 Order Tyres</h2><p id="wai081OrderJob" class="muted"></p></div><button id="wai081OrderClose" class="wai081-close">×</button></div>
      <div class="grid">
        <label>Brand<select id="wai081OrderBrand">${BRANDS.map(v=>`<option>${esc(v)}</option>`).join("")}</select></label>
        <label id="wai081OrderBrandOtherWrap" class="wai081-other hidden">Other Brand<input id="wai081OrderBrandOther" placeholder="Enter tyre brand"></label>
        <label>Tyre Size<input id="wai081OrderSize"></label>
        <label>Quantity<input id="wai081OrderQty" type="number" min="1" step="1"></label>
        <label>Supplier<select id="wai081OrderSupplier">${SUPPLIERS.map(v=>`<option>${esc(v)}</option>`).join("")}</select></label>
        <label id="wai081OrderSupplierOtherWrap" class="wai081-other hidden">Other Supplier<input id="wai081OrderSupplierOther" placeholder="Enter supplier"></label>
        <label>Total Cost (£)<input id="wai081OrderCost" type="number" min="0" step="0.01" placeholder="0.00"></label>
      </div>
      <div class="wai081-actions"><button id="wai081OrderSubmit" class="primary">Confirm Ordered</button><button id="wai081OrderCancel" class="secondary">Cancel</button></div>
    </div>`;
    document.body.appendChild(modal);
    el("wai081OrderClose").addEventListener("click",closeOrderForm);
    el("wai081OrderCancel").addEventListener("click",closeOrderForm);
    el("wai081OrderSubmit").addEventListener("click",submitOrder);
    el("wai081OrderBrand").addEventListener("change",toggleOrderOtherFields);
    el("wai081OrderSupplier").addEventListener("change",toggleOrderOtherFields);
    modal.addEventListener("click",event=>{if(event.target===modal)closeOrderForm()});
  }

  function toggleOrderOtherFields(){
    el("wai081OrderBrandOtherWrap")?.classList.toggle("hidden",el("wai081OrderBrand")?.value!=="Other");
    el("wai081OrderSupplierOtherWrap")?.classList.toggle("hidden",el("wai081OrderSupplier")?.value!=="Other");
  }

  function openRequestForm(jobId){
    const job=findJob(jobId);if(!job)return;
    requestJobId=job.id;
    el("wai081RequestJob").textContent=`${job.jobNo||""} | ${job.reg||"No registration"} — ${job.technician||"Unassigned"}`;
    el("wai081RequestSize").value="";
    el("wai081RequestQty").value="1";
    el("wai081TyreRequestModal").classList.remove("hidden");
    setTimeout(()=>el("wai081RequestSize")?.focus(),30);
  }
  function closeRequestForm(){el("wai081TyreRequestModal")?.classList.add("hidden");requestJobId=null}

  function submitRequest(){
    const job=findJob(requestJobId);if(!job)return;
    const size=el("wai081RequestSize").value.trim().toUpperCase();
    const quantity=Math.max(1,Math.floor(Number(el("wai081RequestQty").value||1)));
    if(!size){alert("Please enter the tyre size.");return}
    const tyre={id:id(),size,quantity,status:"Requested",requestedAt:nowISO(),requestedBy:job.technician||"Technician",brand:"",supplier:"",cost:null,orderedAt:null,orderedBy:null,deliveredAt:null,deliveredBy:null,deliveredRole:null};
    tyreList(job).push(tyre);
    timeline(job,"🛞 Tyres requested",`${quantity} x ${size} requested by ${job.technician||"Technician"}.`);
    persist();closeRequestForm();renderAfterChange();alert("Tyre request sent to the Service Manager.");
  }

  function openOrderForm(jobId,tyreId){
    const job=findJob(jobId);if(!job)return;
    const tyre=tyreList(job).find(item=>String(item.id)===String(tyreId));if(!tyre)return;
    orderJobId=job.id;orderTyreId=tyre.id;
    el("wai081OrderJob").textContent=`${job.reg||"No registration"} — ${tyre.quantity||1} x ${tyre.size||"Size not entered"}`;
    el("wai081OrderBrand").value=BRANDS.includes(tyre.brand)?tyre.brand:"Michelin";
    el("wai081OrderBrandOther").value=tyre.brand&&!BRANDS.includes(tyre.brand)?tyre.brand:"";
    if(tyre.brand&&!BRANDS.includes(tyre.brand))el("wai081OrderBrand").value="Other";
    el("wai081OrderSize").value=tyre.size||"";
    el("wai081OrderQty").value=tyre.quantity||1;
    el("wai081OrderSupplier").value=SUPPLIERS.includes(tyre.supplier)?tyre.supplier:"Bond";
    el("wai081OrderSupplierOther").value=tyre.supplier&&!SUPPLIERS.includes(tyre.supplier)?tyre.supplier:"";
    if(tyre.supplier&&!SUPPLIERS.includes(tyre.supplier))el("wai081OrderSupplier").value="Other";
    el("wai081OrderCost").value=tyre.cost??"";
    toggleOrderOtherFields();
    el("wai081TyreOrderModal").classList.remove("hidden");
  }
  function closeOrderForm(){el("wai081TyreOrderModal")?.classList.add("hidden");orderJobId=null;orderTyreId=null}

  function submitOrder(){
    const job=findJob(orderJobId);if(!job)return;
    const tyre=tyreList(job).find(item=>String(item.id)===String(orderTyreId));if(!tyre)return;
    const brandChoice=el("wai081OrderBrand").value;
    const supplierChoice=el("wai081OrderSupplier").value;
    const brand=(brandChoice==="Other"?el("wai081OrderBrandOther").value:brandChoice).trim();
    const supplier=(supplierChoice==="Other"?el("wai081OrderSupplierOther").value:supplierChoice).trim();
    const size=el("wai081OrderSize").value.trim().toUpperCase();
    const quantity=Math.max(1,Math.floor(Number(el("wai081OrderQty").value||1)));
    const cost=Number(el("wai081OrderCost").value);
    if(!brand){alert("Please enter the tyre brand.");return}
    if(!size){alert("Please enter the tyre size.");return}
    if(!supplier){alert("Please select or enter the supplier.");return}
    if(!Number.isFinite(cost)||cost<0){alert("Please enter a valid total cost.");return}
    Object.assign(tyre,{brand,size,quantity,supplier,cost,status:"Ordered",orderedAt:nowISO(),orderedBy:"Service Manager"});
    timeline(job,"🛞 Tyres ordered",`${quantity} x ${brand} ${size} ordered from ${supplier}. Total cost: ${money(cost)}.`);
    persist();closeOrderForm();renderAfterChange();
  }

  function markTyresDelivered(jobId,tyreId,actorRole){
    const job=findJob(jobId);if(!job)return;
    const tyre=tyreList(job).find(item=>String(item.id)===String(tyreId));if(!tyre)return;
    const currentStatus=tyreStatus(tyre);
    if(currentStatus!=="Ordered"){
      alert(currentStatus==="Delivered"?"These tyres have already been marked as delivered.":"Tyres must be ordered before they can be marked as delivered.");
      return;
    }
    const role=actorRole==="Service Manager"?"Service Manager":"Technician";
    const actor=role==="Service Manager"?"Service Manager":(job.technician||"Technician");
    const timestamp=nowISO();
    Object.assign(tyre,{
      status:"Delivered",
      deliveredAt:timestamp,
      deliveredBy:actor,
      deliveredRole:role,
      technicianAlert:"Delivered",
      serviceManagerAlert:"Delivered"
    });
    timeline(job,role==="Service Manager"?"✅ Tyres received by Service Manager":"✅ Tyres received by technician",`${tyre.quantity||1} x ${tyre.brand||""} ${tyre.size||""} received in the workshop by ${actor}. ${role==="Service Manager"?"Assigned technician notified.":"Service Manager updated."}`.replace(/\s+/g," ").trim());
    persist();renderAfterChange();
    alert(role==="Service Manager"?"Tyre delivery recorded and the assigned technician has been notified.":"Tyre delivery recorded and the Service Manager has been updated.");
  }

  function markTyresFitted(jobId,tyreId){
    const job=findJob(jobId);if(!job)return;
    const tyre=tyreList(job).find(item=>String(item.id)===String(tyreId));if(!tyre)return;
    const currentStatus=tyreStatus(tyre);
    if(currentStatus!=="Delivered"){
      alert(currentStatus==="Fitted"?"These tyres have already been marked as fitted.":"Tyres must be marked as delivered before they can be fitted.");
      return;
    }
    const actor=job.technician||"Technician";
    const timestamp=nowISO();
    Object.assign(tyre,{status:"Fitted",fittedAt:timestamp,fitDate:timestamp,fittedBy:actor,technicianAlert:"Fitted",serviceManagerAlert:"Fitted"});
    timeline(job,"🔧 Tyres fitted",`${tyre.quantity||1} x ${tyre.brand||""} ${tyre.size||""} marked fitted by ${actor}.`.replace(/\s+/g," ").trim());
    persist();renderAfterChange();
    alert("Tyres marked as fitted. They will remain in Tyres Delivered Today until tomorrow.");
  }

  function installServiceAlert(){
    if(el("wai081ServiceTyreAlert"))return;
    const anchor=el("servicePartsAlert");if(!anchor)return;
    const panel=document.createElement("div");
    panel.id="wai081ServiceTyreAlert";
    panel.className="card service-parts-alert action-centre-v2 clear";
    anchor.insertAdjacentElement("afterend",panel);
  }

  function tyreAlertRow({job,tyre}){
    const status=tyreStatus(tyre);
    const requested=status==="Requested";
    const ordered=status==="Ordered";
    const delivered=status==="Delivered";
    const statusClass=delivered?"delivered":ordered?"ordered":"";
    const statusText=delivered?"🔵 Delivered":ordered?"🟢 Ordered":"🟡 Requested";
    return `<div class="board-job">
      <strong>${esc(job.reg||"No registration")} — ${esc(job.technician||"Unassigned")}</strong><br>
      ${esc(job.make||"")} ${esc(job.model||"")}<br>
      <strong>Tyres:</strong> ${esc(tyre.quantity||1)} x ${esc(tyre.size||"Size not entered")}<br>
      <strong>Customer:</strong> ${esc(job.customer||"Not entered")} | <strong>Telephone:</strong> ${esc(job.phone||"Not entered")}<br>
      ${!requested?`<strong>Order:</strong> ${esc(tyre.brand||"")} | ${esc(tyre.supplier||"")} | ${money(tyre.cost)}<br>`:""}
      <strong>Status:</strong> <span class="wai081-status ${statusClass}">${statusText}</span><br>
      <strong>Requested:</strong> ${fmt(tyre.requestedAt)}${tyre.orderedAt?` | <strong>Ordered:</strong> ${fmt(tyre.orderedAt)}`:""}${tyre.deliveredAt?` | <strong>Delivered:</strong> ${fmt(tyre.deliveredAt)}${tyre.deliveredBy?` by ${esc(tyre.deliveredBy)}`:""}`:""}
      <div class="wai081-actions">${requested?`<button onclick="WAI081.openOrderForm('${esc(job.id)}','${esc(tyre.id)}')">Order Tyres</button>`:""}${ordered?`<button onclick="WAI081.markTyresDelivered('${esc(job.id)}','${esc(tyre.id)}','Service Manager')">✅ Tyres Delivered</button>`:""}<button onclick="showTimelineModal('${esc(job.id)}')">Timeline</button><button onclick="openJob('${esc(job.id)}')">Open Job</button></div>
    </div>`;
  }

  function renderServiceAlert(){
    installServiceAlert();
    const panel=el("wai081ServiceTyreAlert");if(!panel)return;
    const requested=allTyres().filter(row=>tyreStatus(row.tyre)==="Requested");
    const ordered=allTyres().filter(row=>tyreStatus(row.tyre)==="Ordered");
    const active=[...requested,...ordered];
    panel.className="card service-parts-alert action-centre-v2"+(active.length?"":" clear");
    panel.innerHTML=`<h2>🛞 Tyre Ordering</h2><p class="muted">Only tyres that still require Service Manager action are shown here. Delivered tyres move to Parts &amp; Tyres → Tyres Delivered Today.</p>
      <div class="stats"><div class="stat ${requested.length?"bad":"good"}"><strong>${requested.length}</strong>Need Ordering</div><div class="stat ${ordered.length?"warn":"good"}"><strong>${ordered.length}</strong>Awaiting Delivery</div></div>
      <div class="job-list">${active.length?active.map(tyreAlertRow).join(""):"<div class='job-card good'><p>✅ No tyre orders require Service Manager action.</p></div>"}</div>`;
  }

  function installManagerPanel(){
    if(el("wai081TyreOrders"))return;
    const manager=el("managerScreen");if(!manager)return;
    const board=Array.from(manager.querySelectorAll(".card")).find(card=>card.querySelector("h2")?.textContent.trim()==="Service Manager Job Board");
    const panel=document.createElement("div");panel.className="card";panel.id="wai081TyreOrders";
    panel.innerHTML=`<h2>🛞 Tyre Orders</h2><p class="muted">All requested and ordered tyres linked to workshop jobs.</p><div id="wai081ManagerStats" class="stats"></div><div id="wai081ManagerList" class="job-list"></div>`;
    manager.insertBefore(panel,board||null);
  }

  function renderManagerPanel(){
    installManagerPanel();
    const rows=allTyres();const requested=rows.filter(row=>tyreStatus(row.tyre)==="Requested");const ordered=rows.filter(row=>tyreStatus(row.tyre)==="Ordered");const active=[...requested,...ordered];
    if(el("wai081ManagerStats"))el("wai081ManagerStats").innerHTML=`<div class="stat ${requested.length?"warn":"good"}"><strong>${requested.length}</strong>Awaiting Order</div><div class="stat ${ordered.length?"warn":"good"}"><strong>${ordered.length}</strong>Awaiting Delivery</div><div class="stat"><strong>${money(rows.filter(row=>tyreStatus(row.tyre)!=="Requested").reduce((sum,row)=>sum+Number(row.tyre.cost||0),0))}</strong>Ordered Spend</div>`;
    if(el("wai081ManagerList"))el("wai081ManagerList").innerHTML=active.length?active.map(tyreAlertRow).join(""):"<div class='job-card good'><p>✅ No tyre orders require Service Manager action.</p></div>";
  }

  function installTechnicianPanel(){
    if(el("wai081TechnicianTyres"))return;
    const active=el("activeJobScreen");if(!active)return;
    const partsCard=Array.from(active.querySelectorAll(":scope > .card")).find(card=>card.querySelector("h2")?.textContent.trim()==="Parts");
    const panel=document.createElement("div");panel.className="card";panel.id="wai081TechnicianTyres";
    panel.innerHTML=`<h2>🛞 Tyres</h2><p class="muted">Enter the tyre size and quantity required. The Service Manager completes the order details.</p><button id="wai081RequestButton" class="primary">Request Tyres</button><h3>Tyre Status</h3><div id="wai081TechnicianList" class="job-list"></div>`;
    active.insertBefore(panel,partsCard||null);
    el("wai081RequestButton").addEventListener("click",()=>{try{openRequestForm(activeJobId)}catch(e){}});
  }

  function renderTechnicianPanel(){
    installTechnicianPanel();
    let job=null;try{job=findJob(activeJobId)}catch(e){}
    const target=el("wai081TechnicianList");if(!target)return;
    if(!job){target.innerHTML="<div class='job-card'><p>Open a job to view tyre requests.</p></div>";return}
    const list=tyreList(job);
    target.innerHTML=list.length?list.map(tyre=>{const status=tyreStatus(tyre);const ordered=status==="Ordered";const delivered=status==="Delivered";const fitted=status==="Fitted";return `<div class="job-card ${fitted?"good":""}"><h3>${esc(tyre.quantity||1)} x ${esc(tyre.size||"Size not entered")}</h3><p>${status!=="Requested"?`<strong>Ordered:</strong> ${esc(tyre.brand||"")} | ${esc(tyre.supplier||"")} | ${money(tyre.cost)}`:"Awaiting Service Manager order details."}</p>${tyre.deliveredAt?`<p><strong>Delivered:</strong> ${fmt(tyre.deliveredAt)}${tyre.deliveredBy?` by ${esc(tyre.deliveredBy)}`:""}</p>`:""}${tyre.fittedAt?`<p><strong>Fitted:</strong> ${fmt(tyre.fittedAt)}${tyre.fittedBy?` by ${esc(tyre.fittedBy)}`:""}</p>`:""}<span class="wai081-status ${fitted?"delivered":delivered?"delivered":ordered?"ordered":""}">${fitted?"🔧 Fitted":delivered?"🔵 Delivered":ordered?"🟢 Ordered":"🟡 Requested"}</span>${ordered?`<div class="wai081-actions"><button onclick="WAI081.markTyresDelivered('${esc(job.id)}','${esc(tyre.id)}','Technician')">✅ Tyres Delivered</button></div>`:delivered?`<div class="wai081-actions"><button onclick="WAI081.markTyresFitted('${esc(job.id)}','${esc(tyre.id)}')">🔧 Tyres Fitted</button></div>`:""}</div>`}).join(""):"<div class='job-card'><p>No tyres requested for this job.</p></div>";
  }

  function tyreSummaryHtml(job){
    const list=tyreList(job);if(!list.length)return"";
    return `<div class="wai081-summary"><strong>🛞 Tyres</strong>${list.map(tyre=>{const status=tyreStatus(tyre);return `<p>${esc(tyre.quantity||1)} x ${esc(tyre.size||"Size not entered")} | ${status!=="Requested"?`${esc(tyre.brand||"")} | ${esc(tyre.supplier||"")} | ${money(tyre.cost)} | `:""}<span class="wai081-status ${status==="Delivered"?"delivered":status==="Ordered"?"ordered":""}">${esc(status)}</span></p>`}).join("")}</div>`;
  }

  function wrapJobCards(){
    try{
      if(typeof card!=="function"||window.__wai081CardWrapped)return;
      const original=card;
      card=function(job,open,manager){const html=original(job,open,manager);return manager&&tyreList(job).length?html.replace(/<\/div>\s*$/,tyreSummaryHtml(job)+"</div>"):html};
      window.__wai081CardWrapped=true;
    }catch(e){console.warn("WAI-081 could not decorate job cards",e)}
  }

  function installCommandKpi(){
    const grid=el("wai80SummaryCards")||el("ownerStats");if(!grid)return;
    let tile=el("wai081CommandKpi");
    if(!tile){tile=document.createElement("div");tile.id="wai081CommandKpi";tile.className="stat wai081-kpi";tile.tabIndex=0;tile.setAttribute("role","button");tile.addEventListener("click",openTyreOrders);tile.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();openTyreOrders()}});grid.appendChild(tile)}
    const awaiting=allTyres().filter(row=>tyreStatus(row.tyre)==="Requested").length;
    tile.className=`stat wai081-kpi ${awaiting?"warn":"good"}`;
    tile.innerHTML=`<strong>${awaiting}</strong>🛞 Tyres Awaiting Order`;
  }
  function openTyreOrders(){switchScreen("managerScreen");setTimeout(()=>el("wai081ServiceTyreAlert")?.scrollIntoView({behavior:"smooth",block:"start"}),60)}

  function installReport(){
    if(el("wai081TyreReport"))return;
    const reports=el("reportsInterfaceScreen");if(!reports)return;
    const panel=document.createElement("div");panel.className="card";panel.id="wai081TyreReport";
    panel.innerHTML=`<h2>🛞 Tyre Ordering Report</h2><p class="muted">WAI-081 tyre requests and ordered spend.</p><div id="wai081ReportStats" class="wai081-report-grid"></div><div id="wai081SupplierReport" class="job-list"></div>`;
    reports.appendChild(panel);
  }

  function renderReport(){
    installReport();const rows=allTyres();const ordered=rows.filter(row=>["Ordered","Delivered","Fitted"].includes(tyreStatus(row.tyre)));const delivered=rows.filter(row=>["Delivered","Fitted"].includes(tyreStatus(row.tyre)));
    const tyreQty=rows.reduce((sum,row)=>sum+Number(row.tyre.quantity||1),0);
    const spend=ordered.reduce((sum,row)=>sum+Number(row.tyre.cost||0),0);const average=ordered.length?spend/ordered.length:0;
    const suppliers={};const brands={};const sizes={};
    ordered.forEach(({tyre})=>{suppliers[tyre.supplier||"Not entered"]=(suppliers[tyre.supplier||"Not entered"]||0)+Number(tyre.cost||0);brands[tyre.brand||"Not entered"]=(brands[tyre.brand||"Not entered"]||0)+Number(tyre.quantity||1);sizes[tyre.size||"Not entered"]=(sizes[tyre.size||"Not entered"]||0)+Number(tyre.quantity||1)});
    const topKey=obj=>Object.entries(obj).sort((a,b)=>b[1]-a[1])[0]?.[0]||"No data";
    if(el("wai081ReportStats"))el("wai081ReportStats").innerHTML=`<div class="stat"><strong>${rows.length}</strong>Requests</div><div class="stat"><strong>${tyreQty}</strong>Tyres Requested</div><div class="stat good"><strong>${ordered.length}</strong>Orders Placed</div><div class="stat good"><strong>${delivered.length}</strong>Delivered</div><div class="stat"><strong>${money(spend)}</strong>Ordered Spend</div><div class="stat"><strong>${money(average)}</strong>Average Order Cost</div><div class="stat"><strong>${esc(topKey(brands))}</strong>Most Ordered Brand</div><div class="stat"><strong>${esc(topKey(sizes))}</strong>Most Common Size</div>`;
    const supplierRows=Object.entries(suppliers).sort((a,b)=>b[1]-a[1]);
    if(el("wai081SupplierReport"))el("wai081SupplierReport").innerHTML=supplierRows.length?supplierRows.map(([supplier,total])=>`<div class="job-card"><h3>${esc(supplier)}</h3><p>Ordered tyre spend: <strong>${money(total)}</strong></p></div>`).join(""):"<div class='job-card'><p>No ordered tyre supplier data yet.</p></div>";
  }

  function renderAll(){renderServiceAlert();renderManagerPanel();renderTechnicianPanel();installCommandKpi();renderReport()}
  function renderAfterChange(){try{if(typeof render==="function")render();else renderAll()}catch(e){renderAll()}}
  function wrapCoreRender(){
    try{if(typeof render!=="function"||window.__wai081RenderWrapped)return;const original=render;render=function(){const result=original.apply(this,arguments);renderAll();return result};window.__wai081RenderWrapped=true}catch(e){console.warn("WAI-081 render hook unavailable",e)}
  }
  function wrapOpenJob(){
    try{if(typeof openJob!=="function"||window.__wai081OpenJobWrapped)return;const original=openJob;openJob=function(){const result=original.apply(this,arguments);renderTechnicianPanel();return result};window.__wai081OpenJobWrapped=true}catch(e){}
  }
  function normaliseExistingJobs(){
    let changed=false;
    listJobs().forEach(job=>{
      if(!Array.isArray(job.tyreRequests)){job.tyreRequests=[];changed=true}
      job.tyreRequests.forEach(tyre=>{
        if(!tyre.quantity){tyre.quantity=1;changed=true}
        const normalised=tyreStatus(tyre);
        if(tyre.status!==normalised){tyre.status=normalised;changed=true}
        if(normalised==="Delivered"&&!tyre.deliveredAt){tyre.deliveredAt=tyre.arrivedAt||tyre.receivedAt||nowISO();changed=true}
      });
    });
    if(changed)persist();
  }
  function boot(){installStyles();installRequestModal();installOrderModal();normaliseExistingJobs();wrapJobCards();wrapOpenJob();wrapCoreRender();renderAfterChange()}

  window.WAI081={openRequestForm,openOrderForm,markTyresDelivered,markTyresFitted,render:renderAll,allTyres};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();
})();
