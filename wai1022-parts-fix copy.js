(function(){
'use strict';
const JOBS_KEY='workshopAIJobsV27';
const INV_KEY='wai0991Invoices';
const norm=v=>String(v||'').trim().toUpperCase().replace(/\s+/g,'');
const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}};
const money=n=>new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'}).format(Number(n)||0);
const dateOnly=v=>String(v||'').slice(0,10);
const cutoff=()=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-240);return d.toISOString().slice(0,10)};

function observations(){
  const from=cutoff(), out=[];
  read(JOBS_KEY,[]).forEach(job=>(job.partsRequests||[]).forEach(p=>{
    const pn=norm(p.partNumber||p.partNo), date=dateOnly(p.orderedAt||p.orderDate||p.receivedAt||p.requestedAt||job.bookingDate||job.createdAt);
    if(pn && date>=from && Number(p.cost)>0) out.push({pn,description:p.description||p.text||'',supplier:p.supplier||p.orderedFrom||'',cost:Number(p.cost),date,source:'Parts order'});
  }));
  read(INV_KEY,[]).forEach(inv=>(inv.lines||[]).forEach(l=>{
    const pn=norm(l.partNumber||l.partNo), date=dateOnly(inv.date||inv.createdAt);
    if(l.type==='Parts' && pn && date>=from && Number(l.cost)>0) out.push({pn,description:l.description||'',supplier:l.supplier||'',cost:Number(l.cost),date,source:inv.number||'Invoice'});
  }));
  return out.sort((a,b)=>a.date.localeCompare(b.date));
}
function catalogue(){
  const map=new Map();
  observations().forEach(o=>{const x=map.get(o.pn)||{pn:o.pn,description:o.description,lastCost:0,lastSeen:''};if(o.date>=x.lastSeen){x.description=o.description||x.description;x.lastCost=o.cost;x.lastSeen=o.date}map.set(o.pn,x)});
  return [...map.values()].sort((a,b)=>a.pn.localeCompare(b.pn));
}
function fillDatalist(){
  const dl=document.getElementById('partsOrderKnownNumbers'); if(!dl)return;
  dl.innerHTML=catalogue().map(x=>`<option value="${x.pn}">${x.description||'Recognised part'} · last ${money(x.lastCost)}</option>`).join('');
}
function priceAlert(){
  const input=document.getElementById('partsOrderPartNumber'), cost=document.getElementById('partsOrderCost'), host=document.getElementById('partsOrderPriceAlert');
  if(!input||!cost||!host)return;
  input.value=norm(input.value);
  const pn=norm(input.value), current=Number(cost.value), rows=observations().filter(x=>x.pn===pn);
  if(!pn){host.innerHTML='';return}
  const known=catalogue().find(x=>x.pn===pn);
  if(known){
    const jobId=document.getElementById('partsOrderJobId')?.value;
    const partId=document.getElementById('partsOrderPartId')?.value;
    const jobs=read(JOBS_KEY,[]), job=jobs.find(j=>String(j.id)===String(jobId)), part=(job?.partsRequests||[]).find(p=>String(p.id)===String(partId));
    if(part && !part.description && known.description) part.description=known.description;
  }
  if(!rows.length){host.innerHTML='<div class="finance-note">New part number — no matching cost history in the previous 240 days.</div>';return}
  const costs=rows.map(x=>x.cost), min=Math.min(...costs), max=Math.max(...costs), latest=rows[rows.length-1].cost;
  let change='';
  if(current>0 && current!==latest){const diff=current-latest, pct=latest?diff/latest*100:0;change=`<strong>${diff>0?'▲ Higher':'▼ Lower'} than previous:</strong> ${money(latest)} → ${money(current)} (${diff>0?'+':''}${pct.toFixed(1)}%)`;}
  host.innerHTML=`<div class="part-cost-alert ${current>latest?'increase':'decrease'}"><strong>Exact part number recognised: ${pn}</strong><br>${rows.length} matching price record${rows.length===1?'':'s'} in 240 days · lowest ${money(min)} · highest ${money(max)} · latest ${money(latest)}${change?'<br>'+change:''}</div>`;
}
function attachOrderIntelligence(){
  fillDatalist();
  const pn=document.getElementById('partsOrderPartNumber'), cost=document.getElementById('partsOrderCost');
  if(pn&&!pn.dataset.wai1022){pn.dataset.wai1022='1';pn.addEventListener('input',priceAlert);pn.addEventListener('change',priceAlert)}
  if(cost&&!cost.dataset.wai1022){cost.dataset.wai1022='1';cost.addEventListener('input',priceAlert)}
  priceAlert();
}
function ensurePartsPageVisible(){
  const screen=document.getElementById('partsScreen'); if(!screen)return;
  const ids=['partsManagementStats','partsRequestedQueue','partsManagementQueue','partsDeliveredQueue','partsCompletedQueue','partsSupplierPerformance'];
  ids.forEach(id=>{const el=document.getElementById(id);if(el&&!el.innerHTML.trim())el.innerHTML='<div class="muted">No parts records in this section yet.</div>'});
  try{if(typeof window.renderPartsManagement==='function')window.renderPartsManagement()}catch(e){console.error('Parts page renderer recovered:',e)}
  attachOrderIntelligence();
}
document.addEventListener('click',e=>{
  const tab=e.target.closest('[data-screen="partsScreen"],[data-wai80-screen="partsScreen"]');
  if(!tab)return;
  setTimeout(ensurePartsPageVisible,0);
},true);
document.addEventListener('DOMContentLoaded',()=>{attachOrderIntelligence();ensurePartsPageVisible()});
window.addEventListener('storage',attachOrderIntelligence);
window.WAI1022Parts={normalisePartNumber:norm,observations,refresh:ensurePartsPageVisible};
})();
