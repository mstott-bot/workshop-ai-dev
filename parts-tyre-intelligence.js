/* Workshop AI OS — WAI-085 Parts & Tyre Intelligence */
(function(){
  "use strict";
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
  const jobsList=()=>{try{return Array.isArray(jobs)?jobs:[]}catch(e){return[]}};
  const dayKey=v=>{if(!v)return"";const d=new Date(v);if(Number.isNaN(d.getTime()))return String(v).slice(0,10);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
  const today=()=>dayKey(new Date());
  const fmt=v=>v?new Date(v).toLocaleString("en-GB",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}):"Not recorded";
  const ageDays=v=>{if(!v)return 0;return Math.max(0,Math.floor((new Date(new Date().toDateString())-new Date(new Date(v).toDateString()))/86400000))};
  function partStatus(p){
    try{if(typeof normalisePartStatus==="function")return normalisePartStatus(p.status,p)}catch(e){}
    const s=String(p.status||"").toLowerCase();
    if(p.fittedAt||s.includes("fitted"))return"Fitted";
    if(p.receivedAt||p.arrivedAt||p.deliveredAt||s.includes("received")||s.includes("delivered"))return"Received";
    if(s.includes("back"))return"Back Order";
    if(s.includes("partial"))return"Partial Delivery";
    if(s.includes("incorrect"))return"Incorrect Parts";
    if(s.includes("chased"))return"Supplier Chased";
    if(p.orderedAt||s.includes("ordered"))return"Ordered";
    return"Requested";
  }
  function partsRows(){
    try{
      if(typeof allPartsRequests==="function"){
        return allPartsRequests().map(({job,part})=>({job,part,status:partStatus(part)}));
      }
    }catch(e){}
    const out=[],seen=new Set();
    jobsList().forEach(job=>{
      const sources=[job.partsRequests,job.partRequests,job.partsOrders,job.partsRequired].filter(Array.isArray);
      sources.forEach(list=>list.forEach(part=>{
        if(!part||typeof part!=="object")return;
        const key=`${job.id}:${part.id||part.description||part.text||Math.random()}`;
        if(seen.has(key))return;seen.add(key);
        out.push({job,part,status:partStatus(part)});
      }));
    });
    return out;
  }
  function tyreStatus(t){
    const s=String(t.status||"Requested").toLowerCase();
    if(t.fittedAt||s==="fitted"||s==="completed")return"Fitted";
    if(t.deliveredAt||t.receivedAt||s==="delivered"||s==="received")return"Delivered";
    if(s==="ordered")return"Ordered";
    return"Requested";
  }
  function tyreRows(){
    const out=[];
    jobsList().forEach(job=>(job.tyreRequests||[]).forEach(tyre=>out.push({job,tyre,status:tyreStatus(tyre)})));
    return out;
  }
  function openJobButton(job){return `<button onclick="openJob('${esc(job.id)}')">Open Job</button><button onclick="showTimelineModal('${esc(job.id)}')">Timeline</button>`}
  function regTitle(job){return `<h3 class="wai085-reg">${esc(job.reg||"No registration")}</h3><p><strong>${esc(job.customer||"Customer not entered")}</strong> · ${esc(job.technician||"Unassigned")}</p>`}
  function partCard(r){
    const {job,part,status}=r;const days=ageDays(part.requestedAt);const eta=part.expectedDate||part.expectedDelivery||part.eta||"Not entered";
    return `<div class="job-card wai085-live-card ${days>=3?"bad":days>=1?"warn":""}">${regTitle(job)}<p><strong>Waiting for:</strong> ${esc(part.qty||1)} × ${esc(part.description||part.text||"Part")}</p><p><strong>Status:</strong> <span class="wai085-pill">${esc(status)}</span> · <strong>Supplier:</strong> ${esc(part.supplier||"Not entered")}</p><p><strong>ETA:</strong> ${esc(eta)} · <strong>Days waiting:</strong> ${days}</p><p class="muted">Requested ${fmt(part.requestedAt)}</p><div class="wai085-actions">${openJobButton(job)}</div></div>`;
  }
  function tyreCard(r){
    const {job,tyre,status}=r;const days=ageDays(tyre.requestedAt);const eta=tyre.expectedDate||tyre.expectedDelivery||tyre.eta||"Not entered";
    return `<div class="job-card wai085-live-card ${days>=3?"bad":days>=1?"warn":""}">${regTitle(job)}<p><strong>Waiting for:</strong> ${esc(tyre.quantity||1)} × ${esc(tyre.brand?tyre.brand+" ":"")}${esc(tyre.size||"Tyre")}</p><p><strong>Status:</strong> <span class="wai085-pill">${esc(status)}</span> · <strong>Supplier:</strong> ${esc(tyre.supplier||"Not entered")}</p><p><strong>ETA:</strong> ${esc(eta)} · <strong>Days waiting:</strong> ${days}</p><p class="muted">Requested ${fmt(tyre.requestedAt)}</p><div class="wai085-actions">${openJobButton(job)}</div></div>`;
  }
  function deliveredPartCard(r){const {job,part,status}=r;return `<div class="job-card good">${regTitle(job)}<p>${esc(part.qty||1)} × ${esc(part.description||part.text||"Part")}</p><p><strong>Arrived:</strong> ${fmt(part.receivedAt||part.arrivedAt||part.deliveredAt||part.deliveryDate)}</p><p><strong>Current status:</strong> ${esc(status)}</p><div class="wai085-actions">${openJobButton(job)}</div></div>`}
  function deliveredTyreCard(r){const {job,tyre,status}=r;return `<div class="job-card good">${regTitle(job)}<p>${esc(tyre.quantity||1)} × ${esc(tyre.brand?tyre.brand+" ":"")}${esc(tyre.size||"Tyre")}</p><p><strong>Arrived:</strong> ${fmt(tyre.deliveredAt||tyre.arrivedAt||tyre.receivedAt)}</p><p><strong>Current status:</strong> ${esc(status)}</p><div class="wai085-actions">${openJobButton(job)}</div></div>`}
  const empty=msg=>`<div class="job-card"><p>${esc(msg)}</p></div>`;
  function render(){
    if(!$('wai085Stats'))return;
    const parts=partsRows(),tyres=tyreRows();
    const po=parts.filter(r=>!["Received","Fitted"].includes(r.status));
    const to=tyres.filter(r=>!["Delivered","Fitted"].includes(r.status));
    const pd=parts.filter(r=>dayKey(r.part.receivedAt||r.part.arrivedAt||r.part.deliveredAt||r.part.deliveryDate)===today());
    const td=tyres.filter(r=>dayKey(r.tyre.deliveredAt||r.tyre.arrivedAt||r.tyre.receivedAt)===today());
    const needOrder=po.filter(r=>r.status==="Requested").length+to.filter(r=>r.status==="Requested").length;
    const awaiting=po.filter(r=>r.status!=="Requested").length+to.filter(r=>r.status!=="Requested").length;
    $('wai085Stats').innerHTML=`<div class="stat ${needOrder?'bad':'good'}"><strong>${needOrder}</strong>Need Ordering</div><div class="stat ${awaiting?'warn':'good'}"><strong>${awaiting}</strong>Awaiting Delivery / Issue</div><div class="stat good"><strong>${pd.length}</strong>Parts Delivered Today</div><div class="stat good"><strong>${td.length}</strong>Tyres Delivered Today</div><div class="stat ${po.length+to.length?'warn':'good'}"><strong>${po.length+to.length}</strong>Items Outstanding</div>`;
    $('wai085PartsOutstanding').innerHTML=po.length?po.map(partCard).join(''):empty('No parts are currently outstanding.');
    $('wai085TyresOutstanding').innerHTML=to.length?to.map(tyreCard).join(''):empty('No tyres are currently outstanding.');
    $('wai085PartsDeliveredToday').innerHTML=pd.length?pd.map(deliveredPartCard).join(''):empty('No parts delivered today.');
    $('wai085TyresDeliveredToday').innerHTML=td.length?td.map(deliveredTyreCard).join(''):empty('No tyres delivered today.');
    const old=[...po,...to].filter(r=>ageDays((r.part||r.tyre).requestedAt)>=3).length;
    $('wai085Coach').innerHTML=`<h2>AI Parts &amp; Tyre Coach</h2><div class="coach-list"><div class="coach-card ${po.length+to.length?'warn':'good'}"><h3>${po.length+to.length?`${po.length+to.length} outstanding request(s) need attention`:'No supply bottlenecks detected'}</h3><p>${needOrder?`${needOrder} request(s) still need ordering. `:''}${awaiting?`${awaiting} order(s) are awaiting delivery or supplier resolution. `:''}${old?`${old} request(s) have been open for three days or longer.`:'No long-running requests are currently flagged.'}</p></div></div>`;
  }
  function styles(){if($('wai085Styles'))return;const s=document.createElement('style');s.id='wai085Styles';s.textContent=`.wai085-hero{display:flex;justify-content:space-between;align-items:center;gap:18px}.wai085-eyebrow{font-size:12px;font-weight:800;letter-spacing:.08em;color:#5b8def}.wai085-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.wai085-reg{font-size:24px;margin-bottom:4px}.wai085-live-card{border-left:5px solid #5b8def}.wai085-pill{display:inline-block;padding:3px 8px;border-radius:999px;background:#e9f1ff;font-weight:800}.wai085-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}@media(max-width:850px){.wai085-grid{grid-template-columns:1fr}.wai085-hero{align-items:flex-start;flex-direction:column}}`;document.head.appendChild(s)}
  function hook(){try{if(typeof window.render==='function'&&!window.__wai085Wrapped){const original=window.render;window.render=function(){const x=original.apply(this,arguments);render();return x};window.__wai085Wrapped=true}}catch(e){}}
  function boot(){styles();$('wai085Refresh')?.addEventListener('click',render);hook();render()}
  window.WAI085={render,partsRows,tyreRows};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
