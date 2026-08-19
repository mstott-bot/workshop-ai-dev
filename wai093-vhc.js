/* Workshop AI WAI-093 — Vehicle Health Check & Retail Opportunity Suite */
(function(){
'use strict';
const SECTIONS=[
 {name:'Tyres & Wheels',items:['Nearside front tyre','Offside front tyre','Nearside rear tyre','Offside rear tyre','Spare wheel / repair kit','Wheel condition']},
 {name:'Brakes',items:['Front brake pads','Front brake discs','Rear brake pads','Rear brake discs','Brake fluid / operation']},
 {name:'Steering & Suspension',items:['Steering operation','Front suspension','Rear suspension','Wheel bearings / joints']},
 {name:'Under Bonnet & Fluids',items:['Engine oil level / leaks','Coolant level / leaks','Brake fluid','Washer fluid','Battery condition']},
 {name:'Lights, Visibility & Interior',items:['Exterior lights','Wipers and washers','Windscreen and mirrors','Dashboard warning lights','Seat belts / horn']},
 {name:'Under Vehicle & General',items:['Exhaust system','Underbody / corrosion','Driveshafts / gaiters','Road test / general condition']}
];
let activeJob=null, followFilter='Outstanding';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stamp=()=>new Date().toISOString();
function vhcCompanySettings(){
  const live=window.WAICompanySettings?.get?.();
  if(live&&Object.keys(live).length)return live;
  try{
    return JSON.parse(localStorage.getItem('workshopAI.companySettings.v1')||'{}')||{};
  }catch{
    return {};
  }
}
function getJob(id){return jobs.find(j=>String(j.id)===String(id));}
function ensure(job){
 if(!job.vhc) job.vhc={id:'VHC-'+job.id,status:'Not Started',createdAt:stamp(),updatedAt:stamp(),completedAt:null,technician:job.technician,checks:{}};
 SECTIONS.forEach(s=>s.items.forEach(item=>{
   if(!job.vhc.checks[item]) job.vhc.checks[item]={status:'Not Checked',measurement:'',finding:'',recommendation:'',hours:0};
   const c=job.vhc.checks[item];
   // Backwards-compatible migration of existing VHC records.
   if(c.finding==null) c.finding=c.notes||'';
   if(c.recommendation==null) c.recommendation='';
   if(c.hours==null) c.hours=Number(c.labour||0);
   delete c.notes; delete c.labour; delete c.partsValue;
 }));
 if(!Array.isArray(job.vhcOpportunities))job.vhcOpportunities=[];
 return job.vhc;
}
function modal(){
 let m=document.getElementById('vhcModal'); if(m)return m;
 document.body.insertAdjacentHTML('beforeend',`<div id="vhcModal" class="vhc-modal hidden"><div class="vhc-panel"><div class="vhc-head"><div><h2 id="vhcTitle">Vehicle Health Check</h2><p id="vhcSubtitle" class="muted"></p></div><button class="vhc-close" onclick="closeVHC()">×</button></div><div id="vhcBody"></div></div></div>`);
 return document.getElementById('vhcModal');
}
window.openVHC=function(id){
 const job=getJob(id); if(!job)return; activeJob=job; const vhc=ensure(job); modal();
 document.getElementById('vhcTitle').textContent='Vehicle Health Check — '+(job.reg||'');
 document.getElementById('vhcSubtitle').textContent=`${job.customer||'Customer not entered'} | ${job.make||''} ${job.model||''} | ${job.technician||''} | ${vhc.status}`;
 document.getElementById('vhcBody').innerHTML=renderForm(job); document.getElementById('vhcModal').classList.remove('hidden'); updateSummary();
};
window.closeVHC=()=>document.getElementById('vhcModal')?.classList.add('hidden');
function renderForm(job){const vhc=ensure(job);return `<div id="vhcSummary" class="vhc-summary"></div>`+SECTIONS.map(sec=>`<div class="vhc-section"><h3>${sec.name}</h3>${sec.items.map(item=>{const c=vhc.checks[item];return `<div class="vhc-row" data-item="${esc(item)}"><div><strong>${esc(item)}</strong><div class="vhc-statuses">${['Green','Amber','Red','Not Checked'].map(st=>`<button type="button" class="vhc-status ${c.status===st?'selected':''}" data-status="${st}" onclick="setVHCStatus(this,'${encodeURIComponent(item)}','${st}')">${st==='Green'?'🟢':st==='Amber'?'🟠':st==='Red'?'🔴':'⚪'} ${st}</button>`).join('')}</div></div><div class="vhc-inputs vhc-inputs-structured"><input class="vhc-measure" value="${esc(c.measurement)}" placeholder="Measurement"><input class="vhc-finding" value="${esc(c.finding||'')}" placeholder="Finding"><input class="vhc-recommendation" value="${esc(c.recommendation||'')}" placeholder="Recommendation"><input class="vhc-hours" type="number" min="0" step="0.1" value="${Number(c.hours||0)}" placeholder="Hours to complete"></div></div>`;}).join('')}</div>`).join('')+`<div class="vhc-actions"><button class="secondary" onclick="saveVHC(false)">Save Draft</button><button class="primary" onclick="saveVHC(true)">Complete VHC</button><button class="secondary" onclick="printVHC('${job.id}')">Print / Save PDF</button><button class="secondary" onclick="closeVHC()">Close</button></div>`;}
window.setVHCStatus=function(btn,encoded,status){const row=btn.closest('.vhc-row');row.querySelectorAll('.vhc-status').forEach(b=>b.classList.remove('selected'));btn.classList.add('selected');updateSummary();};
function collect(){const vhc=ensure(activeJob);document.querySelectorAll('#vhcBody .vhc-row').forEach(row=>{const item=row.dataset.item;const selected=row.querySelector('.vhc-status.selected');vhc.checks[item]={status:selected?.dataset.status||'Not Checked',measurement:row.querySelector('.vhc-measure').value.trim(),finding:row.querySelector('.vhc-finding').value.trim(),recommendation:row.querySelector('.vhc-recommendation').value.trim(),hours:Number(row.querySelector('.vhc-hours').value||0)};});vhc.updatedAt=stamp();vhc.technician=activeJob.technician;return vhc;}
function counts(vhc){const vals=Object.values(vhc.checks||{});return {green:vals.filter(x=>x.status==='Green').length,amber:vals.filter(x=>x.status==='Amber').length,red:vals.filter(x=>x.status==='Red').length,checked:vals.filter(x=>x.status!=='Not Checked').length,total:vals.length};}
function updateSummary(){if(!activeJob)return;collect();const c=counts(activeJob.vhc);const pct=c.total?Math.round(c.checked/c.total*100):0;const el=document.getElementById('vhcSummary');if(el)el.innerHTML=`<div><strong>${pct}%</strong><br>Complete</div><div class="vhc-green"><strong>${c.green}</strong><br>Green</div><div class="vhc-amber"><strong>${c.amber}</strong><br>Amber</div><div class="vhc-red"><strong>${c.red}</strong><br>Red</div>`;}
window.saveVHC=function(complete){if(!activeJob)return;const vhc=collect();if(complete){const c=counts(vhc);if(c.checked<c.total&&!confirm(`Only ${c.checked} of ${c.total} checks have been completed. Complete the VHC anyway?`))return;vhc.status='Completed';vhc.completedAt=stamp();syncOpportunities(activeJob);if(typeof addTimeline==='function')addTimeline(activeJob,'📋 Vehicle Health Check completed',`${c.green} green, ${c.amber} amber and ${c.red} red items recorded.`);}else{vhc.status='Draft';if(typeof addTimeline==='function')addTimeline(activeJob,'📋 Vehicle Health Check saved','VHC saved as a draft.');}save();render();alert(complete?'Vehicle Health Check completed. Amber and red work has been added to the Service Manager follow-up board.':'Vehicle Health Check draft saved.');openVHC(activeJob.id);};
function syncOpportunities(job){
 const vhc=ensure(job), existing=job.vhcOpportunities||[];
 const rate=Number((typeof appliedJobRate==='function'?appliedJobRate(job):70));
 Object.entries(vhc.checks).forEach(([item,c])=>{
   const id=vhc.id+'-'+item;
   let op=existing.find(o=>o.id===id);
   if(['Amber','Red'].includes(c.status)){
     if(!op){
       op={id,item,severity:c.status,status:'Not Contacted',createdAt:stamp(),updatedAt:stamp(),contactHistory:[]};
       existing.push(op);
     }
     Object.assign(op,{
       severity:c.status,
       measurement:c.measurement||'',
       finding:c.finding||'',
       recommendation:c.recommendation||'',
       hours:Number(c.hours||0),
       retailRate:rate,
       estimatedValue:Number(c.hours||0)*rate,
       technician:job.technician,
       vhcDate:vhc.completedAt,
       active:true,
       updatedAt:stamp()
     });
     delete op.notes; delete op.labour; delete op.partsValue;
   } else if(op){
     op.active=false; op.updatedAt=stamp();
   }
 });
 // Prevent duplicated VHC opportunities while preserving the newest record.
 const seen=new Set();
 job.vhcOpportunities=existing.filter(op=>{
   const key=String(op.id||'');
   if(seen.has(key)) return false;
   seen.add(key); return true;
 });
}
function reportHtml(job){
 const vhc=ensure(job),c=counts(vhc),company=vhcCompanySettings();
 const logo=(company.showLogo!==false&&company.logoData)?`<img class="vhc-company-logo" src="${company.logoData}" alt="Company logo">`:'';
 const companyBlock=(logo||company.tradingName||company.tradingAddress)?`<div class="vhc-company-head">${logo}<div class="vhc-company-details">${company.tradingName?`<strong>${esc(company.tradingName)}</strong>`:''}${company.tradingAddress?`<span>${esc(company.tradingAddress).replace(/\n/g,'<br>')}</span>`:''}${company.phone||company.email?`<span>${esc(company.phone||'')}${company.phone&&company.email?' · ':''}${esc(company.email||'')}</span>`:''}</div></div>`:'';
 return `<div class="vhc-print-report">${companyBlock}<div class="vhc-print-title"><div><h1>Vehicle Health Check</h1><h2>${esc(job.reg)} — ${esc(job.make||'')} ${esc(job.model||'')}</h2></div><div class="vhc-print-summary"><span class="vhc-print-count green">${c.green} Green</span><span class="vhc-print-count amber">${c.amber} Amber</span><span class="vhc-print-count red">${c.red} Red</span></div></div><p><strong>Customer:</strong> ${esc(job.customer||'')} &nbsp; <strong>Date:</strong> ${vhc.completedAt?new Date(vhc.completedAt).toLocaleDateString('en-GB'):'Draft'} &nbsp; <strong>Technician:</strong> ${esc(vhc.technician||job.technician||'')}</p><table class="vhc-report-table"><thead><tr><th>Check</th><th>Result</th><th>Measurement</th><th>Finding</th><th>Recommendation</th><th>Hours</th></tr></thead><tbody>${SECTIONS.map(s=>`<tr class="vhc-report-section"><th colspan="6">${s.name}</th></tr>`+s.items.map(item=>{const x=vhc.checks[item],cls=x.status.replace(' ','');return `<tr class="vhc-report-${cls}"><td>${esc(item)}</td><td class="vhc-result-cell ${cls.toLowerCase()}">${esc(x.status)}</td><td>${esc(x.measurement||'—')}</td><td>${esc(x.finding||'—')}</td><td>${esc(x.recommendation||'—')}</td><td>${Number(x.hours||0).toFixed(1)}</td></tr>`;}).join('')).join('')}</tbody></table><p><small>This report records the condition observed at the time of inspection. Items marked amber or red should be discussed with the workshop.</small></p></div>`;
}
window.printVHC=function(id){const job=getJob(id);if(!job)return;const w=window.open('','_blank');w.document.write(`<html><head><title>VHC ${esc(job.reg)}</title><link rel="stylesheet" href="style.css"><link rel="stylesheet" href="wai093-vhc.css?v=115.4"><style>body{padding:25px}.vhc-print-report{max-width:1000px;margin:auto}@media print{button{display:none}}</style></head><body>${reportHtml(job)}<p><button onclick="window.print()">Print / Save PDF</button></p></body></html>`);w.document.close();};
function activeOps(){const cutoff=Date.now()-30*86400000;const out=[];jobs.forEach(job=>(job.vhcOpportunities||[]).forEach(op=>{if(op.active!==false&&new Date(op.vhcDate||op.createdAt).getTime()>=cutoff)out.push({job,op});}));return out;}
function injectManager(){const screen=document.getElementById('managerScreen');if(!screen||document.getElementById('vhcFollowUpDashboard'))return;const cards=screen.querySelectorAll(':scope > .card');const anchor=cards[0]||screen.firstChild;const wrap=document.createElement('div');wrap.className='card';wrap.id='vhcFollowUpDashboard';wrap.innerHTML='<button class="vhc-dashboard-button" onclick="openVHCFollowUp()"><strong>🔴🟠 VHC Follow-Up — Last 30 Days</strong><span id="vhcDashboardCounts" class="vhc-dashboard-counts"></span><small>Open customer details and turn identified work into retail bookings.</small></button>';anchor.parentNode.insertBefore(wrap,anchor.nextSibling);}
function updateManager(){injectManager();const ops=activeOps().filter(x=>!['Completed','Declined'].includes(x.op.status));const red=ops.filter(x=>x.op.severity==='Red').length, amber=ops.filter(x=>x.op.severity==='Amber').length;const value=ops.reduce((s,x)=>s+Number(x.op.estimatedValue||0),0);const el=document.getElementById('vhcDashboardCounts');if(el)el.innerHTML=`<span class="vhc-red">${red} Red</span><span class="vhc-amber">${amber} Amber</span><span>£${value.toLocaleString('en-GB',{maximumFractionDigits:0})} Potential</span>`;}
window.openVHCFollowUp=function(){let m=document.getElementById('vhcFollowModal');if(!m){document.body.insertAdjacentHTML('beforeend',`<div id="vhcFollowModal" class="vhc-modal hidden"><div class="vhc-panel"><div class="vhc-head"><div><h2>VHC Follow-Up — Last 30 Days</h2><p class="muted">Red work is shown first. Customer details are available for immediate follow-up.</p></div><button class="vhc-close" onclick="document.getElementById('vhcFollowModal').classList.add('hidden')">×</button></div><div class="vhc-filter-row" id="vhcFollowFilters"></div><div id="vhcFollowSummary" class="vhc-summary"></div><div id="vhcFollowList"></div></div></div>`);m=document.getElementById('vhcFollowModal');}m.classList.remove('hidden');renderFollow();};
function renderFollow(){const all=activeOps();const filters=['Outstanding','Red','Amber','Not Contacted','Contacted','Estimate Sent','Booked','Declined','Completed','All'];document.getElementById('vhcFollowFilters').innerHTML=filters.map(f=>`<button class="secondary ${followFilter===f?'active':''}" onclick="setVHCFollowFilter('${f}')">${f}</button>`).join('');let list=all;if(followFilter==='Outstanding')list=list.filter(x=>!['Declined','Completed'].includes(x.op.status));else if(['Red','Amber'].includes(followFilter))list=list.filter(x=>x.op.severity===followFilter);else if(followFilter!=='All')list=list.filter(x=>x.op.status===followFilter);list.sort((a,b)=>(a.op.severity==='Red'?-1:1)-(b.op.severity==='Red'?-1:1)||new Date(b.op.createdAt)-new Date(a.op.createdAt));const val=list.reduce((s,x)=>s+Number(x.op.estimatedValue||0),0);document.getElementById('vhcFollowSummary').innerHTML=`<div><strong>${list.length}</strong><br>Items</div><div class="vhc-red"><strong>${list.filter(x=>x.op.severity==='Red').length}</strong><br>Red</div><div class="vhc-amber"><strong>${list.filter(x=>x.op.severity==='Amber').length}</strong><br>Amber</div><div><strong>£${val.toLocaleString('en-GB',{maximumFractionDigits:0})}</strong><br>Potential</div>`;document.getElementById('vhcFollowList').innerHTML=list.length?list.map(({job,op})=>`<div class="job-card vhc-followup-card ${op.severity==='Red'?'red':''}"><h3>${op.severity==='Red'?'🔴':'🟠'} ${esc(op.item)} — ${esc(job.reg)}</h3><p><strong>${esc(job.customer||'Customer not entered')}</strong> | <a href="tel:${esc(job.phone||'')}">${esc(job.phone||'No telephone')}</a> | ${esc(job.make||'')} ${esc(job.model||'')}</p><p><strong>Measurement:</strong> ${esc(op.measurement||'—')}</p><p><strong>Finding:</strong> ${esc(op.finding||'—')}</p><p><strong>Recommendation:</strong> ${esc(op.recommendation||'—')}</p><p><strong>Hours:</strong> ${Number(op.hours||0).toFixed(1)} | <strong>Retail rate:</strong> £${Number(op.retailRate||0).toFixed(2)}/hr | <strong>Potential:</strong> £${Number(op.estimatedValue||0).toFixed(2)} | <strong>Status:</strong> ${esc(op.status)}</p><p><strong>Technician:</strong> ${esc(op.technician||job.technician)} | <strong>VHC:</strong> ${new Date(op.vhcDate||op.createdAt).toLocaleDateString('en-GB')}</p><div class="vhc-followup-actions"><a class="button secondary" href="tel:${esc(job.phone||'')}">📞 Call</a><button onclick="setOpportunityStatus('${job.id}','${op.id}','Contacted')">Mark Contacted</button><button onclick="setOpportunityStatus('${job.id}','${op.id}','Estimate Sent')">Estimate Sent</button><button onclick="setOpportunityStatus('${job.id}','${op.id}','Booked')">Booked</button><button onclick="remindOpportunity('${job.id}','${op.id}')">Remind Later</button><button onclick="setOpportunityStatus('${job.id}','${op.id}','Completed')">Work Completed</button><button onclick="setOpportunityStatus('${job.id}','${op.id}','Declined')">Declined</button><button onclick="openVHC('${job.id}')">Open VHC</button></div></div>`).join(''):'<div class="job-card"><p>No matching VHC follow-up items.</p></div>';}
window.setVHCFollowFilter=f=>{followFilter=f;renderFollow();};
window.setOpportunityStatus=function(jobId,opId,status){const job=getJob(jobId),op=job?.vhcOpportunities?.find(o=>o.id===opId);if(!op)return;op.status=status;op.updatedAt=stamp();op.contactHistory=op.contactHistory||[];op.contactHistory.push({status,time:stamp()});if(status==='Completed')op.active=false;save();renderFollow();updateManager();};
window.remindOpportunity=function(jobId,opId){const date=prompt('Enter follow-up date (YYYY-MM-DD):');if(!date)return;const job=getJob(jobId),op=job?.vhcOpportunities?.find(o=>o.id===opId);if(!op)return;op.status='Remind Later';op.reminderDate=date;op.updatedAt=stamp();save();renderFollow();};
function addButtons(){document.querySelectorAll('#techJobs .job-card').forEach(card=>{if(card.querySelector('.vhc-open-btn'))return;const open=card.querySelector("button[onclick^=\"openJob\"]");if(!open)return;const id=(open.getAttribute('onclick').match(/'([^']+)'/)||[])[1];const job=getJob(id);if(!job)return;const b=document.createElement('button');b.className='vhc-open-btn primary';b.textContent=job.vhc?.status==='Completed'?'📋 View VHC':'📋 Vehicle Health Check';b.onclick=()=>openVHC(id);open.parentNode.insertBefore(b,open.nextSibling);});const active=document.getElementById('activeJobInfo');if(active&&!document.getElementById('activeJobVHCButton')&&activeJobId){const b=document.createElement('button');b.id='activeJobVHCButton';b.className='primary';b.textContent='📋 Vehicle Health Check';b.onclick=()=>openVHC(activeJobId);active.insertAdjacentElement('afterend',b);}}
window.renderVHCIntelligenceReport=function(api){const selected=api.selectedTechnician(),r=api.range();const inRange=d=>api.inRange(d,r);const completedJobs=jobs.filter(j=>api.completed(j)&&String(j.type||'').toLowerCase()==='retail'&&inRange(api.jobDate(j))&&(selected==='All'||j.technician===selected));const techNames=[...new Set((selected==='All'?jobs.map(j=>j.technician):[selected]).filter(Boolean))];const rows=techNames.map(t=>{const retail=completedJobs.filter(j=>j.technician===t);const vhcs=retail.filter(j=>j.vhc?.status==='Completed'&&inRange(j.vhc.completedAt));const amber=vhcs.reduce((s,j)=>s+Object.values(j.vhc.checks||{}).filter(x=>x.status==='Amber').length,0);const red=vhcs.reduce((s,j)=>s+Object.values(j.vhc.checks||{}).filter(x=>x.status==='Red').length,0);return {t,retail:retail.length,vhcs:vhcs.length,pct:retail.length?vhcs.length/retail.length*100:0,amber,red};}).sort((a,b)=>b.vhcs-a.vhcs);const totalRetail=rows.reduce((s,x)=>s+x.retail,0),totalVhc=rows.reduce((s,x)=>s+x.vhcs,0),totalAmber=rows.reduce((s,x)=>s+x.amber,0),totalRed=rows.reduce((s,x)=>s+x.red,0);api.setReport({title:'Vehicle Health Check Performance',summary:api.reportCard('VHCs',totalVhc,'Completed','good')+api.reportCard('Retail Coverage',api.percent(totalRetail?totalVhc/totalRetail*100:0),'Retail jobs with VHC')+api.reportCard('Amber',totalAmber,'Work identified','warn')+api.reportCard('Red',totalRed,'Urgent work identified','bad'),insightHtml:api.insight('VHC Technician Intelligence',`${rows[0]?.t||'No technician'} completed the most VHCs. Amber and red counts show identified work; completion percentage measures consistency across completed retail jobs.`),output:api.table(['Technician','Completed Retail Jobs','VHCs Completed','VHC Completion %','Amber Identified','Red Identified'],rows.map(x=>`<tr><td>${esc(x.t)}</td><td>${x.retail}</td><td>${x.vhcs}</td><td>${x.pct.toFixed(0)}%</td><td>${x.amber}</td><td>${x.red}</td></tr>`))});};
const oldRender=window.render;if(typeof oldRender==='function')window.render=function(){const result=oldRender.apply(this,arguments);setTimeout(()=>{addButtons();updateManager();},0);return result;};
document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{modal();addButtons();updateManager();},250));setTimeout(()=>{addButtons();updateManager();},500);
})();
