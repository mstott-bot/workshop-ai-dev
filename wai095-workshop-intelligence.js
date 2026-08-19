/* Workshop AI WAI-095.2 — Workshop Intelligence, Mission Control & Daily Briefings */
(function(){
'use strict';
const SETTINGS_KEY='workshopAIWAI095Settings';
const safeJSON=(v,f)=>{try{return JSON.parse(v)||f}catch(e){return f}};
const SETTINGS=Object.assign({dayStart:'08:00',dayEnd:'17:00',defaultDailyHours:8,partsMarginPct:25},safeJSON(localStorage.getItem(SETTINGS_KEY),{}));
const money=n=>'£'+Number(n||0).toLocaleString('en-GB',{minimumFractionDigits:2,maximumFractionDigits:2});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today=()=>new Date().toISOString().slice(0,10);
function done(j){return typeof completed==='function'?completed(j):!!(j.completedAt||j.finishedAt||String(j.status||'').toLowerCase()==='completed');}
function dayOf(j){return String(j.bookingDate||j.date||j.createdAt||'').slice(0,10);}
function todayJobs(){const t=today();return jobs.filter(j=>dayOf(j)===t||(!done(j)&&dayOf(j)<t));}
function liveHours(j){if(j.startedAt&&!j.finishedAt&&!j.activeClockOff)return Math.max(Number(j.actualHours||0),(Date.now()-new Date(j.startedAt).getTime())/36e5);return Number(j.actualHours||0);}
function allocated(j){return Number(j.hours||j.originalHours||0);}
function rate(j){const type=String(j.jobType||j.type||'Retail').toLowerCase();if(type.includes('warranty'))return Number(targets.warrantyRate||40);if(type.includes('internal'))return Number(targets.internalRate||40);return Number(targets.retailRate||70);}
function motSellingPrice(){
  try{
    const finance=JSON.parse(localStorage.getItem('wai0991FinanceSettings')||'{}')||{};
    return Number(finance.motSellPrice||54.85);
  }catch{
    return 54.85;
  }
}
function hasMOT(j){return String(j?.mot||'None').toLowerCase()!=='none';}
function bookedTodayOnly(){
  const t=today();
  return jobs.filter(j=>dayOf(j)===t);
}
function expectedBookedRevenue(j){
  return allocated(j)*rate(j)+(hasMOT(j)?motSellingPrice():0);
}
function status(j){const s=String(j.status||j.techStatus||j.workflowStatus||'').toLowerCase();if(done(j))return 'Completed';if(s.includes('part'))return 'Waiting for Parts';if(s.includes('road'))return 'Road Test';if(s.includes('author'))return 'Awaiting Authorisation';if(j.startedAt&&!j.activeClockOff)return 'Working';return 'Booked';}
function activeTechs(){return (typeof technicians!=='undefined'?technicians:[]).filter(Boolean);}
function availabilityHours(name){try{const key=typeof todayISO==='function'?todayISO():today();const record=(typeof technicianAvailability!=='undefined'?technicianAvailability:{})[key]?.[name];if(record&&record.in===false)return 0;if(record&&Number(record.hours)>=0)return Number(record.hours);}catch(e){}return Number(SETTINGS.defaultDailyHours||8);}
function partsOutstanding(){return jobs.reduce((n,j)=>n+(j.partsRequests||[]).filter(p=>!['Delivered','Fitted','Returned','Credit Received'].includes(p.status)).length,0);}
function vhcOutstanding(){return jobs.reduce((n,j)=>n+(j.vhcOpportunities||[]).filter(o=>!['Completed','Declined'].includes(o.status)).length,0);}
function authJobs(){return typeof window.getUnifiedWorkshopQueue==='function'?window.getUnifiedWorkshopQueue('authorisations'):jobs.filter(j=>!done(j)&&status(j)==='Awaiting Authorisation');}
function authOutstanding(){return authJobs().length;}
function repeatOpen(){return jobs.filter(j=>j.ftf&&['Possible Repeat Repair','Confirmed Repeat Repair','Review Later'].includes(j.ftf.reviewStatus)&&j.ftf.investigationStatus!=='Closed').length;}
function overrun(j){return allocated(j)>0&&liveHours(j)>allocated(j);}
function approach(j){const a=allocated(j);return !done(j)&&a>0&&liveHours(j)/a>=.8&&liveHours(j)/a<1;}
function efficiencyDisplay(v){return !Number.isFinite(Number(v))?"—":Number(v)>200?"200%+":Number(v).toFixed(0)+"%";}
function metrics(){const list=todayJobs(),completed=list.filter(done),working=list.filter(j=>status(j)==='Working'),waitParts=list.filter(j=>status(j)==='Waiting for Parts'),road=list.filter(j=>status(j)==='Road Test'),author=authJobs().filter(j=>list.includes(j)),over=list.filter(overrun),approaching=list.filter(approach);const available=activeTechs().reduce((s,t)=>s+availabilityHours(t),0);const booked=list.reduce((s,j)=>s+allocated(j),0);const actual=list.reduce((s,j)=>s+liveHours(j),0);const productive=list.filter(j=>j.startedAt||done(j)).reduce((s,j)=>s+liveHours(j),0);const labourSales=completed.reduce((s,j)=>s+Math.max(allocated(j),liveHours(j))*rate(j),0);const expectedLabour=bookedTodayOnly().reduce((s,j)=>s+expectedBookedRevenue(j),0);const partsSales=completed.reduce((s,j)=>s+Number(j.partsSales||j.partsValue||0),0);const vhcPotential=jobs.reduce((s,j)=>s+(j.vhcOpportunities||[]).filter(o=>!['Completed','Declined'].includes(o.status)).reduce((a,o)=>a+Number(o.estimatedValue||0),0),0);const completedHours=completed.reduce((s,j)=>s+Math.max(allocated(j),liveHours(j)),0);const efficiency=actual>0?completedHours/actual*100:0;const utilisation=available>0?productive/available*100:0;return {list,completed,working,waitParts,road,author,over,approaching,available,booked,actual,productive,labourSales,expectedLabour,partsSales,vhcPotential,efficiency,utilisation,spare:available-booked};}
function health(m){
  // WAI-095.2: Mission Control now reads the exact same Garage Health engine
  // as the Garage Health screen, Command Centre and reports.
  try{
    if(typeof window.getMasterGarageHealthSnapshot==='function'){
      const master=window.getMasterGarageHealthSnapshot();
      const h=master&&master.health?master.health:{};
      const reasons=[];
      if(h.biggestIssue&&h.biggestIssue.key) reasons.push(`${h.biggestIssue.key} is the largest current score reduction`);
      if(master&&master.message) reasons.push(master.message);
      return {score:Number(master.score||0),reasons,master};
    }
  }catch(err){console.warn('Unified Garage Health unavailable',err);}
  return {score:0,reasons:['Garage Health data is not yet available']};
}
function intelligenceScore(m){const h=health(m).score;const efficiency=Math.min(100,m.efficiency||0),util=Math.min(100,m.utilisation||0);const ftfJobs=jobs.filter(done),repeats=jobs.filter(j=>j.ftf?.reviewStatus==='Confirmed Repeat Repair').length,ftf=ftfJobs.length?Math.max(0,(ftfJobs.length-repeats)/ftfJobs.length*100):100;const labourRecovery=m.booked?Math.min(100,m.completed.reduce((s,j)=>s+Math.max(allocated(j),liveHours(j)),0)/m.booked*100):100;return Math.round(h*.30+efficiency*.20+util*.15+ftf*.20+labourRecovery*.15);}
function recommendations(m){const a=[];m.over.forEach(j=>a.push({level:'urgent',text:`Review ${j.reg||'job'} — ${esc(j.technician||'Unallocated')} is ${(liveHours(j)-allocated(j)).toFixed(1)} hours over allocation.`,action:'Open Service Manager',screen:'managerScreen'}));if(authOutstanding())a.push({level:'urgent',text:`Contact ${authOutstanding()} customer${authOutstanding()===1?'':'s'} awaiting authorisation.`,action:'Open Service Manager',screen:'managerScreen'});if(vhcOutstanding())a.push({level:'opportunity',text:`Follow up ${vhcOutstanding()} VHC recommendation${vhcOutstanding()===1?'':'s'} worth up to ${money(m.vhcPotential)}.`,action:'Open VHC Follow-Up',screen:'vhcFollowUp'});if(m.spare>=2)a.push({level:'good',text:`There are ${m.spare.toFixed(1)} spare technician hours today. Consider adding retail work.`,action:'Open Daily Planner',screen:'plannerScreen'});if(m.spare<0)a.push({level:'warning',text:`The workshop is overbooked by ${Math.abs(m.spare).toFixed(1)} hours. Consider moving a low-priority internal job.`,action:'Open Daily Planner',screen:'plannerScreen'});if(partsOutstanding())a.push({level:'warning',text:`${partsOutstanding()} parts or tyre request${partsOutstanding()===1?'':'s'} still require action.`,action:'Open Parts & Tyres',screen:'partsTyreIntelligenceScreen'});if(repeatOpen())a.push({level:'warning',text:`Review ${repeatOpen()} open First Time Fix investigation${repeatOpen()===1?'':'s'}.`,action:'Open FTF Centre',screen:'ftfCentre'});if(!a.length)a.push({level:'good',text:'No critical exceptions detected. The workshop is operating within the current plan.',action:'Review Planner',screen:'plannerScreen'});return a.slice(0,7);}
function briefing(mode,m){const h=health(m),r=recommendations(m);if(mode==='morning')return `<h3>Good morning Team</h3><p>${m.list.length} jobs are in today’s live workload, with ${m.booked.toFixed(1)} booked hours against ${m.available.toFixed(1)} available hours.</p><div class="wai095-brief-grid"><span><strong>${m.completed.length}</strong> completed</span><span><strong>${m.over.length}</strong> overrunning</span><span><strong>${partsOutstanding()}</strong> parts actions</span><span><strong>${authOutstanding()}</strong> authorisations</span><span><strong>${money(m.expectedLabour)}</strong> expected labour + MOT</span><span><strong>${m.spare.toFixed(1)}h</strong> spare capacity</span></div><h4>Today’s priorities</h4>${r.slice(0,4).map(x=>`<p class="wai095-brief-line ${x.level}">• ${x.text}</p>`).join('')}`;
return `<h3>End-of-day review</h3><p>${m.completed.length} jobs have been completed. ${m.list.filter(j=>!done(j)).length} remain open or will carry over.</p><div class="wai095-brief-grid"><span><strong>${money(m.labourSales)}</strong> labour sales</span><span><strong>${efficiencyDisplay(m.efficiency)}</strong> efficiency</span><span><strong>${m.utilisation.toFixed(0)}%</strong> utilisation</span><span><strong>${m.over.length}</strong> overruns</span><span><strong>${h.score}%</strong> garage health</span><span><strong>${m.list.filter(j=>!done(j)).length}</strong> carry over</span></div><h4>Recommended close-out actions</h4>${r.slice(0,4).map(x=>`<p class="wai095-brief-line ${x.level}">• ${x.text}</p>`).join('')}`;}
function tile(label,value,detail,cls,action){return `<button class="wai095-tile ${cls||''}" ${action?`onclick="wai095OpenAction('${action}')"`:''}><span>${label}</span><strong>${value}</strong><small>${detail}</small></button>`;}
function timeline(m){const names=activeTechs();return `<div class="wai095-timeline"><div class="wai095-time-head"><span></span>${['08','09','10','11','12','13','14','15','16','17'].map(x=>`<b>${x}:00</b>`).join('')}</div>${names.map(name=>{const js=m.list.filter(j=>j.technician===name).sort((a,b)=>new Date(a.startedAt||a.bookingDate)-new Date(b.startedAt||b.bookingDate));let cursor=0;const blocks=js.map(j=>{const hrs=Math.max(.5,liveHours(j)||allocated(j)||1),w=Math.min(100-cursor,hrs/9*100),left=cursor;cursor+=w;const st=status(j);return `<button title="${esc(j.reg||'Job')} · ${esc(st)}" class="wai095-time-block ${st.toLowerCase().replace(/\s+/g,'-')}" style="left:${left}%;width:${w}%" onclick="wai095Open('managerScreen')">${esc(j.reg||st)}</button>`}).join('');return `<div class="wai095-time-row"><strong>${esc(name)}</strong><div>${blocks||'<span class="wai095-empty-time">No assigned work</span>'}</div></div>`}).join('')}</div>`;}
function heatMap(m){const items=[['Labour overruns',m.over.length,m.over.length?'red':'green'],['Approaching time',m.approaching.length,m.approaching.length?'amber':'green'],['Waiting for parts',m.waitParts.length,m.waitParts.length>2?'red':m.waitParts.length?'amber':'green'],['Authorisations',authOutstanding(),authOutstanding()>2?'red':authOutstanding()?'amber':'green'],['VHC follow-ups',vhcOutstanding(),vhcOutstanding()>5?'red':vhcOutstanding()?'amber':'green'],['First Time Fix',repeatOpen(),repeatOpen()>2?'red':repeatOpen()?'amber':'green'],['Capacity',m.spare.toFixed(1)+'h',m.spare<0?'red':m.spare<2?'amber':'green'],['Utilisation',m.utilisation.toFixed(0)+'%',m.utilisation&&m.utilisation<70?'red':m.utilisation<85?'amber':'green']];return `<div class="wai095-heatmap">${items.map(([a,b,c])=>`<div class="${c}"><span>${a}</span><strong>${b}</strong></div>`).join('')}</div>`;}

function financeRevenue(){
  try{
    if(window.WAI099FinanceBridge&&typeof window.WAI099FinanceBridge.getRevenueSummary==='function')return window.WAI099FinanceBridge.getRevenueSummary();
  }catch(e){}
  return{live:{net:0,cost:0,gp:0,gpPct:0,vat:0,total:0,documents:0,categories:{}},liveToday:{net:0,cost:0,gp:0,gpPct:0,vat:0,total:0,documents:0,categories:{}},issuedToday:{net:0,cost:0,gp:0,gpPct:0,vat:0,total:0,documents:0,categories:{}},creditsToday:{net:0,cost:0,gp:0,gpPct:0,vat:0,total:0,documents:0,categories:{}},outlook:{net:0,cost:0,gp:0,gpPct:0,vat:0,total:0,documents:0,categories:{}},netIssuedToday:0};
}
function revenuePanel(r){
  const cats=r.live.categories||{};
  const q=typeof window.getUnifiedWorkshopQueueSnapshot==='function'?window.getUnifiedWorkshopQueueSnapshot():null;
  if(!q)return `<div class="wai095-revenue-headlines"><div><small>Current Live Work Value</small><strong>${money(r.live.net)}</strong><span>${r.live.documents} open estimates · ex VAT</span></div><div><small>Invoices Issued Today</small><strong>${money(r.netIssuedToday)}</strong><span>${r.issuedToday.documents} issued</span></div><div><small>Expected Gross Profit Today</small><strong>${money(r.outlook.gp)}</strong><span>${r.outlook.gpPct.toFixed(1)}% GP outlook</span></div></div>`;
  const v=q.values,c=q.counts;
  const opToday=window.WAI1020OperationalGP?.todaySnapshot?.()||{gp:0,gpPct:0,invoices:0,credits:0};
  return `<div class="wai095-revenue-headlines wai1019-revenue-headlines">
    <button onclick="wai1019OpenQueue('workInProgress')"><small>Work in Progress</small><strong>${money(v.workInProgress.net)}</strong><span>${c.workInProgress} live job${c.workInProgress===1?'':'s'} · ex VAT</span></button>
    <button onclick="wai1019OpenQueue('authorisations')"><small>Awaiting Authorisation</small><strong>${money(v.authorisations.net)}</strong><span>${c.authorisations} customer response${c.authorisations===1?'':'s'}</span></button>
    <button onclick="wai1019OpenQueue('readyToInvoice')"><small>Ready to Invoice</small><strong>${money(v.readyToInvoice.net)}</strong><span>${c.readyToInvoice} completed job${c.readyToInvoice===1?'':'s'}</span></button>
    <div><small>Invoices Issued Today</small><strong>${money(r.netIssuedToday)}</strong><span>${r.issuedToday.documents} issued · less ${money(r.creditsToday.net)} credits</span></div>
    <button class="held" onclick="wai1019OpenQueue('held')"><small>Revenue Being Held Up</small><strong>${money(v.held.net)}</strong><span>${c.held} blocked job${c.held===1?'':'s'}</span></button>
  </div>
  <div class="wai095-revenue-detail"><span><small>Operational gross profit today</small><strong>${money(opToday.gp)}</strong><small>${opToday.invoices} issued · ${opToday.credits} credits · resets daily</small></span><span><small>Waiting for parts</small><strong>${money(v.parts.net)}</strong></span><span><small>Ready for collection</small><strong>${money(v.readyForCollection.net)}</strong></span><span><small>Live cost</small><strong>${money(v.workInProgress.cost+v.readyToInvoice.cost)}</strong></span><span><small>Labour</small><strong>${money(cats.Labour||0)}</strong></span><span><small>Parts</small><strong>${money(cats.Parts||0)}</strong></span><span><small>Oil</small><strong>${money(cats.Oil||0)}</strong></span><span><small>MOT & other</small><strong>${money((cats.MOT||0)+(cats.Consumables||0)+(cats.Sublet||0)+(cats.Other||0))}</strong></span></div>
  <p class="muted wai095-revenue-note">Values come from job-linked estimates and invoices. Completed vehicles remain visible in Ready to Invoice and Ready for Collection until the workflow is closed.</p>`;
}
window.wai1019OpenQueue=function(name){
  const q=window.getUnifiedWorkshopQueue?.(name)||[];
  if(typeof window.show==='function')window.show('managerScreen');
  const label={workInProgress:'Work in Progress',authorisations:'Awaiting Authorisation',readyToInvoice:'Ready to Invoice',held:'Revenue Being Held Up'}[name]||name;
  if(!q.length){alert(`${label}: no jobs currently in this queue.`);return;}
  alert(`${label}\n\n`+q.map(j=>`${j.reg||'No reg'} — ${j.customer||'Customer'} — ${j.status||'No status'}`).join('\n'));
};
function render(){const root=document.getElementById('wai095MissionControl');if(!root)return;const m=metrics(),h=health(m),score=intelligenceScore(m),recs=recommendations(m),finance=financeRevenue();root.innerHTML=`
<section class="wai095-hero"><div><p class="wai095-eyebrow">WAI-095.2 · LIVE WORKSHOP INTELLIGENCE</p><h2>Workshop Mission Control</h2><p>Know what is happening now, what is likely to happen next and what needs attention first.</p></div><div class="wai095-score-wrap"><div class="wai095-score"><strong>${score}</strong><span>Intelligence Score</span></div><small class="wai095-score-explainer">Overall workshop performance score combining Garage Health, efficiency, utilisation, First Time Fix and labour recovery. Higher is better.</small></div></section>
<div class="wai095-tiles">${tile('Vehicles working',m.working.length,'Live technician activity','good','manager')}${tile('Waiting for parts',m.waitParts.length,'Vehicles currently delayed',m.waitParts.length?'warn':'good','partsAwaiting')}${tile('Road tests',m.road.length,'Vehicles on road test','info','manager')}${tile('Authorisations',authOutstanding(),'Customer response required',authOutstanding()?'warn':'good','authorisations')}${tile('Labour overruns',m.over.length,'Immediate manager action',m.over.length?'bad':'good','overruns')}${tile('Idle capacity',Math.max(0,m.spare).toFixed(1)+'h','Available technician hours',m.spare<0?'bad':m.spare<2?'warn':'good','planner')}${tile('VHC follow-ups',vhcOutstanding(),money(m.vhcPotential)+' potential','purple','vhcFollowUp')}${tile('FTF investigations',repeatOpen(),'Repeat-repair reviews',repeatOpen()?'warn':'good','ftfCentre')}</div>
<div class="wai095-two"><section class="card"><div class="wai095-card-head"><div><p class="wai095-eyebrow">DAILY BRIEFING</p><h2>Workshop Brief</h2></div><div class="button-row"><button onclick="wai095Brief('morning')">Morning Live</button><button onclick="wai095Brief('end')">End of Day</button></div></div><div id="wai095Brief">${briefing('morning',m)}</div></section><section class="card wai095-revenue-card"><p class="wai095-eyebrow">REVENUE WATCH</p><h2>Live Revenue Counter</h2>${revenuePanel(finance)}</section></div>
<section class="card"><div class="wai095-card-head"><div><p class="wai095-eyebrow">ACTION FIRST</p><h2>Workshop Recommendations</h2></div><button onclick="wai095Refresh()">Refresh Intelligence</button></div><div class="wai095-actions">${recs.map(x=>`<button class="${x.level}" onclick="wai095OpenAction('${x.screen}')"><span>${x.text}</span><small>${x.action} →</small></button>`).join('')}</div></section>
<section class="card"><div class="wai095-card-head"><div><p class="wai095-eyebrow">TODAY BY TECHNICIAN</p><h2>Workshop Timeline</h2></div><small>Live operational view</small></div>${timeline(m)}</section>
<div class="wai095-two"><section class="card"><p class="wai095-eyebrow">CAPACITY FORECAST</p><h2>Today’s Capacity</h2><div class="wai095-capacity"><div><strong>${m.available.toFixed(1)}h</strong><span>Available</span></div><div><strong>${m.booked.toFixed(1)}h</strong><span>Booked</span></div><div><strong>${m.spare.toFixed(1)}h</strong><span>${m.spare>=0?'Spare':'Overbooked'}</span></div><div class="wai095-capacity-teach"><strong>${m.utilisation.toFixed(0)}%</strong><span>Utilisation</span><small>Productive time ÷ available technician time</small></div></div><p class="muted">Forecast uses technician availability and allocated labour hours. It updates as jobs and availability change.</p></section><section class="card"><p class="wai095-eyebrow">WORKSHOP HEAT MAP</p><h2>Attention by Area</h2>${heatMap(m)}</section></div>
<section class="card wai095-health"><div><p class="wai095-eyebrow">GARAGE HEALTH 2.0</p><h2>Garage Health: ${h.score}%</h2><p>${h.reasons.length?'Current score is being reduced by: '+h.reasons.join('; ')+'.':'No significant operational risks are currently reducing the score.'}</p></div><div class="wai095-health-ring"><strong>${h.score}</strong><span>/ 100</span></div></section>`;}
window.wai095Open=function(screen){if(typeof show==='function')show(screen);else document.querySelector(`[data-screen="${screen}"]`)?.click();};
window.wai095OpenAction=function(action){
  const openScreen=screen=>window.wai095Open(screen);
  switch(action){
    case 'vhcFollowUp':
      openScreen('managerScreen');
      setTimeout(()=>{if(typeof window.openVHCFollowUp==='function')window.openVHCFollowUp();},80);
      break;
    case 'overruns':
      if(typeof window.openWAI094List==='function')window.openWAI094List('overrun'); else openScreen('managerScreen');
      break;
    case 'authorisations':
      if(typeof window.openWAI094List==='function')window.openWAI094List('authorisations'); else openScreen('managerScreen');
      break;
    case 'partsAwaiting': openScreen('partsTyreIntelligenceScreen'); break;
    case 'ftfCentre':
      if(typeof window.openWAI094Report==='function')window.openWAI094Report('ftf'); else openScreen('managerScreen');
      break;
    case 'planner': openScreen('plannerScreen'); break;
    case 'manager': openScreen('managerScreen'); break;
    case 'managerScreen': openScreen('managerScreen'); break;
    case 'plannerScreen': openScreen('plannerScreen'); break;
    case 'partsTyreIntelligenceScreen': openScreen('partsTyreIntelligenceScreen'); break;
    default: openScreen('managerScreen');
  }
  setTimeout(render,100);
};
window.wai095Brief=function(mode){const e=document.getElementById('wai095Brief');if(e)e.innerHTML=briefing(mode,metrics());};
window.wai095Refresh=render;
function inject(){if(document.getElementById('wai095MissionControl'))return;const nav=document.querySelector('.tabs'),command=document.getElementById('commandScreen');if(nav&&!nav.querySelector('[data-screen="wai095Screen"]')){const b=document.createElement('button');b.className='tab';b.dataset.screen='wai095Screen';b.textContent='Mission Control';nav.insertBefore(b,nav.children[1]||null);b.addEventListener('click',()=>{if(typeof show==='function')show('wai095Screen');setTimeout(render,0);});}
if(command&&command.parentNode){const s=document.createElement('section');s.id='wai095Screen';s.className='screen';s.innerHTML='<div id="wai095MissionControl"></div>';command.parentNode.insertBefore(s,command.nextSibling);}render();}
const oldRender=window.render;if(typeof oldRender==='function')window.render=function(){const r=oldRender.apply(this,arguments);setTimeout(render,0);return r;};
window.addEventListener('wai-finance-updated',()=>render());window.addEventListener('wai-operational-gp-updated',()=>render());document.addEventListener('storage',e=>{if(e.key==='wai0991Invoices'||e.key==='wai0991FinanceSettings')render();});document.addEventListener('DOMContentLoaded',()=>{inject();render();setInterval(render,60000);});setTimeout(()=>{inject();render();},500);
})();
