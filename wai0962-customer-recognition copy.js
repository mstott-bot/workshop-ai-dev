(function(){
'use strict';
const CRM_KEY='wai096_crm';
const norm=v=>String(v||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function crm(){try{return JSON.parse(localStorage.getItem(CRM_KEY)||'{"customers":[]}')}catch(e){return {customers:[]}}}
function customerForJob(job){
 const db=crm();
 if(job.customerId){const c=db.customers.find(x=>x.id===job.customerId);if(c)return c}
 const r=norm(job.reg);
 return db.customers.find(c=>(c.vehicles||[]).some(v=>norm(v.registration)===r))||null;
}
function loyalty(c){
 if(!c)return '';
 if(c.loyaltyOverride)return c.loyaltyOverride;
 const spend=Number(c.lifetimeSpend||0), visits=customerVisitCount(c), years=Math.max(0,(Date.now()-new Date(c.customerSince||Date.now()))/31557600000);
 if(spend>=5000||visits>=15||years>=7)return 'Gold';
 if(spend>=1500||visits>=5||years>=2)return 'Silver';
 return 'Bronze';
}
function customerVisitCount(c){
 if(!c)return 0;
 const linked=(window.jobs||[]).filter(j=>{
   if(!completed(j))return false;
   if(j.customerId&&j.customerId===c.id)return true;
   const regs=new Set((c.vehicles||[]).map(v=>norm(v.registration)));
   return regs.has(norm(j.reg));
 });
 const unique=new Set(linked.map(j=>j.id||j.jobNo||`${norm(j.reg)}|${j.completedAt||j.finishedAt||j.createdAt}`));
 return Math.max(Number(c.visitCount||0),unique.size);
}
function customerMeta(job){
 const c=customerForJob(job);
 const visits=c?customerVisitCount(c):Number(job.customerVisits||0);
 const rank=c?loyalty(c):(job.customerLoyalty||'Bronze');
 return {c,visits,rank,health:job.customerHealth,preferred:c?.preferredContact||job.preferredContact||'',phone:job.phone||c?.mobile||c?.home||c?.work||'',notes:c?.notes||''};
}
function badge(meta,compact=false){
 const cls=String(meta.rank||'Bronze').toLowerCase();
 return `<div class="customer-recognition ${cls} ${compact?'compact':''}"><strong>${meta.rank==='Gold'?'🥇':meta.rank==='Silver'?'🥈':'🥉'} ${esc(meta.rank)} Customer</strong><span>${meta.visits} completed visit${meta.visits===1?'':'s'}${meta.health!==''&&meta.health!==undefined?' · Health '+esc(meta.health)+'%':''}</span></div>`;
}

const originalCard=window.card;
window.card=function(job,open=true,manager=false){
 if(!manager)return originalCard(job,open,manager);
 ensureTimeline(job);
 const eff=efficiency(Number(job.hours||0),Number(job.actualHours||0));
 const m=customerMeta(job);
 return `<div class="job-card manager-customer-card">
   <div class="manager-card-top"><div><h3>${esc(job.jobNo||'')} | ${esc(job.reg)} — ${esc(job.technician)}</h3><p><strong>${esc(job.make||'Make')} ${esc(job.model||'')}</strong></p></div>${badge(m,true)}</div>
   <p><strong>Customer:</strong> ${esc(job.customer||'Not entered')} · <strong>Telephone:</strong> ${esc(m.phone||'Not entered')}</p>
   <p><strong>Priority:</strong> ${esc(job.priority||'Not set')} | <strong>Status:</strong> ${esc(job.status||'Not set')}</p>
   <p><strong>Type:</strong> ${esc(job.type)} | <strong>Allowed:</strong> ${esc(job.hours)} hrs | <strong>Actual:</strong> ${(job.actualHours||0).toFixed(2)} hrs | <strong>Efficiency:</strong> ${pct(eff)}</p>
   ${m.preferred?`<p><strong>Preferred contact:</strong> ${esc(m.preferred)}</p>`:''}
   <div class="job-card-actions"><button onclick="amendHours('${job.id}')">Add Hours</button><button onclick="reassignTech('${job.id}')">Reassign Technician</button><button onclick="managerComment('${job.id}')">Manager Comment</button><button onclick="deleteWorkshopJob('${job.id}')">Delete Job</button><button onclick="showTimelineModal('${job.id}')">Timeline</button>${open?`<button onclick="openJob('${job.id}')">Start / Continue Job</button>`:''}</div>
 </div>`;
};

const originalTechCard=window.technicianJobCard;
window.technicianJobCard=function(job){
 const finished=completed(job),carried=!!job.carriedOverFrom,m=customerMeta(job);
 return `<div class="job-card ${finished?'good':carried?'warn':''}">
   <div class="manager-card-top"><div><h3>${esc(job.jobNo||'')} | ${esc(job.reg)} — ${esc(job.technician)}</h3><p><strong>${esc(job.make||'Make')} ${esc(job.model||'')}</strong></p></div>${badge(m,true)}</div>
   <p><strong>Customer:</strong> ${esc(job.customer||'Not entered')}</p>
   <p><strong>Job description:</strong> ${esc(job.workRequired||job.complaint||'No description entered')}</p>
   <p><strong>Status:</strong> ${esc(job.status)} | <strong>MOT:</strong> ${esc(job.mot)}</p>
   ${m.notes?`<div class="technician-customer-note"><strong>Customer care note</strong><p>${esc(m.notes)}</p></div>`:''}
   ${carried?`<p><strong>Carried over from:</strong> ${esc(job.carriedOverFrom)}</p>`:''}
   ${finished?"<p class='muted'><strong>Completed job:</strong> opening it will not restart the timer or change its status.</p>":''}
   <button onclick="openJob('${job.id}')">Open Job</button><button onclick="showTimelineModal('${job.id}')">Timeline</button>${!finished?`<button onclick="carryOverTechnicianJob('${job.id}')">Carry Over</button>`:''}
 </div>`;
};

const originalOpenJob=window.openJob;
window.openJob=function(id){
 originalOpenJob(id);
 const job=(window.jobs||[]).find(j=>j.id===id);if(!job)return;
 const m=customerMeta(job),el=document.getElementById('activeDetails');
 if(el&&!el.querySelector('.active-customer-recognition'))el.insertAdjacentHTML('beforeend',`<div class="active-customer-recognition">${badge(m)}${m.notes?`<p><strong>Customer care note:</strong> ${esc(m.notes)}</p>`:''}</div>`);
};

function readyJobs(){return typeof window.getUnifiedWorkshopQueue==='function'?window.getUnifiedWorkshopQueue('readyForCollection'):(window.jobs||[]).filter(j=>String(j.status||'').toLowerCase().includes('ready')&&!String(j.status||'').toLowerCase().includes('collected'))}
window.markReadyCustomerContacted=function(id){
 const j=jobs.find(x=>x.id===id);if(!j)return;
 j.readyCustomerContactedAt=new Date().toISOString();
 j.readyCustomerContactMethod=customerMeta(j).preferred||'Phone';
 addTimeline(j,'📞 Customer notified',`${j.customer||'Customer'} notified that ${j.reg} is ready for collection.`);
 save();render();
};
const originalCollected=window.markCustomerCollected;
window.markCustomerCollected=function(id){
 const j=jobs.find(x=>x.id===id);if(!j)return;
 const wasCounted=!!j.crmVisitCounted;
 originalCollected(id);
 if(String(j.status||'').toLowerCase().includes('collected')&&!wasCounted){
   const db=crm(),c=customerForJob(j);
   if(c){const target=db.customers.find(x=>x.id===c.id);target.visitCount=Math.max(Number(target.visitCount||0),customerVisitCount(c))+1;localStorage.setItem(CRM_KEY,JSON.stringify(db));j.crmVisitCounted=true;save();document.dispatchEvent(new CustomEvent('wai096:crm-updated'));}
 }
};
function collectionPanel(){
 const ready=readyJobs();
 return `<section class="ready-collection-centre"><div class="ready-heading"><div><span class="wai80-eyebrow">SERVICE MANAGER HANDOVER</span><h2>🚗 Ready for Collection <span>${ready.length}</span></h2><p>Contact customers, review customer importance and close the visit when the vehicle leaves.</p></div></div>
 ${ready.length?`<div class="ready-grid">${ready.map(j=>{const m=customerMeta(j);return `<article class="ready-card ${m.rank.toLowerCase()}"><div class="manager-card-top"><div><h3>${esc(j.reg)}</h3><p>${esc(j.make||'')} ${esc(j.model||'')}</p></div>${badge(m,true)}</div><p><strong>${esc(j.customer||'Customer')}</strong> · ${esc(m.phone||'No number')}</p><p><strong>Completed by:</strong> ${esc(j.technician||'Unassigned')} · <strong>Completed:</strong> ${j.completedAt?new Date(j.completedAt).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}):'Not recorded'}</p><p><strong>Preferred contact:</strong> ${esc(m.preferred||'Not set')}</p><p class="contact-state ${j.readyCustomerContactedAt?'done':''}">${j.readyCustomerContactedAt?'✅ Customer contacted '+new Date(j.readyCustomerContactedAt).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}):'⚠ Customer not yet contacted'}</p><div class="parts-actions"><button onclick="openJob('${j.id}')">Open Job</button>${!j.readyCustomerContactedAt?`<button onclick="markReadyCustomerContacted('${j.id}')">Customer Contacted</button>`:''}<button onclick="markCustomerCollected('${j.id}')">Customer Collected</button></div></article>`}).join('')}</div>`:'<div class="action-section action-section-none good"><strong>✅ No vehicles waiting</strong><span>No cars are currently ready for collection.</span></div>'}</section>`;
}
const originalRenderQueue=window.renderServicePartsAlert;
window.renderServicePartsAlert=function(){
 originalRenderQueue();
 const el=document.getElementById('servicePartsAlert');if(!el)return;
 el.querySelector('.manager-ready-list')?.remove();
 el.insertAdjacentHTML('beforeend',collectionPanel());
};

document.addEventListener('wai096:crm-updated',()=>{if(typeof render==='function')render()});
})();
