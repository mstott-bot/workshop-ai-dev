/* Workshop AI — WAI-092.2e Parts Order Storage Fix + Returns Queue */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':'&quot;'}[c]));
  const nowISO=()=>new Date().toISOString();
  const todayISO=()=>new Date().toISOString().slice(0,10);
  const monthISO=()=>todayISO().slice(0,7);
  const fmt=v=>v?new Date(v).toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):'Not recorded';
  const money=v=>'£'+Number(v||0).toFixed(2);
  const listJobs=()=>{try{return Array.isArray(jobs)?jobs:[]}catch(e){return []}};
  const findJob=id=>listJobs().find(j=>String(j.id)===String(id));
  const saveAll=()=>{try{if(typeof save==='function')save()}catch(e){console.error(e)}};
  const timeline=(j,t,d)=>{try{if(typeof addTimeline==='function')addTimeline(j,t,d)}catch(e){}};
  const rerender=()=>{try{if(typeof render==='function')render()}catch(e){}; try{window.WAI085?.render()}catch(e){}; renderReturns(); renderServiceManagerReturnsAlert();};
  const partList=j=>{if(!Array.isArray(j.partsRequests))j.partsRequests=[];return j.partsRequests};
  const tyreList=j=>{if(!Array.isArray(j.tyreRequests))j.tyreRequests=[];return j.tyreRequests};
  const qtyOrdered=x=>Math.max(1,Number(x.qty||x.quantity||1));
  const qtyReceived=x=>Math.max(0,Number(x.receivedQty ?? x.deliveredQty ?? (x.receivedAt||x.deliveredAt?qtyOrdered(x):0)));
  const outstanding=x=>Math.max(0,qtyOrdered(x)-qtyReceived(x)-Number(x.returnedQty||0));
  const actor=(j,role)=>role==='Service Manager'?'Service Manager':(j.technician||'Technician');

  function ensureItem(item,type){
    if(type==='part'){item.qty=qtyOrdered(item)}else item.quantity=qtyOrdered(item);
    if(item.receivedQty==null)item.receivedQty=qtyReceived(item);
    if(item.returnedQty==null)item.returnedQty=0;
    if(!Array.isArray(item.deliveryHistory))item.deliveryHistory=[];
    if(!Array.isArray(item.returns))item.returns=[];
    return item;
  }
  function itemStatus(item,type){
    ensureItem(item,type);
    const s=String(item.status||'').toLowerCase();
    if(s.includes('return')&& !s.includes('credit'))return item.returnStatus||'Return Pending';
    if(s.includes('incorrect')||s.includes('wrong order')||s.includes('wrong tyre'))return 'Wrong Order';
    if(item.fittedAt||s.includes('fitted'))return 'Fitted';
    if(item.receivedQty>=qtyOrdered(item))return type==='part'?'Received':'Delivered';
    if(item.receivedQty>0)return 'Partial Delivery';
    if(item.orderedAt||s.includes('ordered')||s.includes('awaiting'))return 'Ordered';
    return 'Requested';
  }
  function allItems(){
    const rows=[];
    listJobs().forEach(job=>{
      partList(job).forEach(item=>rows.push({job,item,type:'part'}));
      tyreList(job).forEach(item=>rows.push({job,item,type:'tyre'}));
    });
    return rows;
  }
  function label(row){const x=row.item;return row.type==='part'?(x.description||x.text||'Part'):`${x.brand?x.brand+' ':''}${x.size||'Tyre'}`;}

  function receive(jobId,itemId,type,role='Technician',mode='choose'){
    const job=findJob(jobId);if(!job)return;
    const item=(type==='part'?partList(job):tyreList(job)).find(x=>String(x.id)===String(itemId));if(!item)return;
    ensureItem(item,type);
    if(itemStatus(item,type)==='Requested'){alert(`${type==='part'?'Part':'Tyres'} must be ordered before delivery can be recorded.`);return}
    const remaining=Math.max(0,qtyOrdered(item)-qtyReceived(item));
    if(remaining<=0){alert('This order is already fully delivered.');return}
    let amount=remaining;
    if(mode!=='all'){
      const raw=prompt(`Quantity received now (maximum ${remaining}):`,String(remaining));
      if(raw===null)return; amount=Math.floor(Number(raw));
      if(!Number.isFinite(amount)||amount<1||amount>remaining){alert('Please enter a valid received quantity.');return}
    }
    const at=nowISO(),who=actor(job,role);
    item.receivedQty=qtyReceived(item)+amount;
    item.deliveryHistory.push({quantity:amount,at,by:who,role});
    item.lastDeliveryAt=at;item.receivedBy=who;item.deliveredBy=who;
    if(item.receivedQty>=qtyOrdered(item)){
      item.status=type==='part'?'Received':'Delivered';
      item.receivedAt=item.receivedAt||at;item.arrivedAt=item.arrivedAt||at;item.deliveredAt=item.deliveredAt||at;
    }else{
      item.status='Partial Delivery';item.partialDeliveryAt=at;item.hadPartialDelivery=true;
      if(!item.firstDeliveredAt)item.firstDeliveredAt=at;
    }
    timeline(job,item.status==='Partial Delivery'?'⚠️ Partial delivery recorded':'✅ Delivery recorded',`${amount} of ${qtyOrdered(item)} ${type==='part'?'part(s)':'tyre(s)'} received for ${label({item,type})} by ${who}. ${Math.max(0,qtyOrdered(item)-item.receivedQty)} outstanding.`);
    saveAll();rerender();
  }

  function wrongOrder(jobId,itemId,type,role='Technician'){
    const job=findJob(jobId);if(!job)return;
    const item=(type==='part'?partList(job):tyreList(job)).find(x=>String(x.id)===String(itemId));if(!item)return;
    ensureItem(item,type);
    const remaining=Math.max(0,qtyOrdered(item)-qtyReceived(item));
    let amount=remaining||Math.max(1,qtyReceived(item));
    if(remaining>0){
      const raw=prompt(`Quantity received but incorrect (maximum ${remaining}):`,String(remaining));
      if(raw===null)return; amount=Math.floor(Number(raw));
      if(!Number.isFinite(amount)||amount<1||amount>remaining){alert('Please enter a valid quantity.');return}
      item.receivedQty=qtyReceived(item)+amount;
      const at=nowISO(),who=actor(job,role);
      item.deliveryHistory.push({quantity:amount,at,by:who,role,issue:'Wrong order'});
      item.lastDeliveryAt=at;item.receivedBy=who;item.deliveredBy=who;
    }
    const note=prompt(`What is wrong with the ${type==='part'?'part':'tyres'}?`,'Wrong item supplied')||'Wrong item supplied';
    item.status=type==='part'?'Incorrect Parts':'Incorrect Tyres';
    item.issueNote=note;item.hadIncorrectParts=type==='part';item.hadIncorrectTyres=type==='tyre';item.incorrectAt=nowISO();
    timeline(job,type==='part'?'❌ Incorrect part delivery':'❌ Incorrect tyre delivery',`${amount} x ${label({item,type})} reported as wrong order by ${actor(job,role)}. ${note}`);
    saveAll();rerender();
  }

  function markFitted(jobId,itemId,type){
    const job=findJob(jobId);if(!job)return;
    const item=(type==='part'?partList(job):tyreList(job)).find(x=>String(x.id)===String(itemId));if(!item)return;
    ensureItem(item,type);
    if(qtyReceived(item)<qtyOrdered(item)){alert('The full order must be delivered before it can be marked as fitted.');return}
    item.status='Fitted';item.fittedAt=nowISO();item.fitDate=item.fittedAt;item.fittedBy=job.technician||'Technician';
    timeline(job,type==='part'?'🔧 Part fitted':'🔧 Tyres fitted',`${qtyOrdered(item)} x ${label({item,type})} marked fitted by ${item.fittedBy}.`);
    saveAll();rerender();
  }

  function returnItem(jobId,itemId,type,role='Technician'){
    const job=findJob(jobId);if(!job)return;
    const item=(type==='part'?partList(job):tyreList(job)).find(x=>String(x.id)===String(itemId));if(!item)return;
    ensureItem(item,type);
    const available=Math.max(0,qtyReceived(item)-Number(item.returnedQty||0));
    if(available<=0){alert('There is no delivered quantity available to return.');return}
    const raw=prompt(`Quantity to return (maximum ${available}):`,String(available));if(raw===null)return;
    const quantity=Math.floor(Number(raw));if(!Number.isFinite(quantity)||quantity<1||quantity>available){alert('Please enter a valid return quantity.');return}
    const destination=prompt('Supplier / return destination:',item.supplier||item.orderedFrom||'')?.trim();if(!destination)return;
    const reason=prompt('Reason for return (incorrect, faulty, damaged, duplicate, cancelled, warranty or other):','Incorrect item supplied')?.trim();if(!reason)return;
    const reference=prompt('Return reference (optional):','')||'';
    const valueRaw=prompt('Return value including VAT (optional):',String(Number(item.cost||item.totalCost||0).toFixed(2)));
    const value=valueRaw===null?0:Math.max(0,Number(valueRaw)||0);
    const who=actor(job,role),at=nowISO();
    const ret={id:'RET-'+Date.now()+'-'+Math.random().toString(36).slice(2,6).toUpperCase(),type,quantity,destination,reason,reference,value,status:'Return Requested',createdAt:at,createdBy:who,createdRole:role};
    item.returns.push(ret);item.returnedQty=Number(item.returnedQty||0)+quantity;item.returnStatus='Return Requested';item.status='Return Requested';item.returnRequestedAt=at;item.returnRequestedBy=who;
    timeline(job,type==='part'?'↩️ Part return requested':'↩️ Tyre return requested',`${quantity} x ${label({item,type})} requested for return to ${destination} by ${who}. Reason: ${reason}.`);
    saveAll();rerender();alert('Return sent to the Service Manager Returns Queue.');
  }
  function updateReturn(jobId,itemId,type,returnId,status){
    const job=findJob(jobId);if(!job)return;const item=(type==='part'?partList(job):tyreList(job)).find(x=>String(x.id)===String(itemId));if(!item)return;
    const ret=(item.returns||[]).find(r=>String(r.id)===String(returnId));if(!ret)return;
    ret.status=status;ret.updatedAt=nowISO();if(status==='Returned to Supplier')ret.returnedAt=ret.updatedAt;if(status==='Credit Received')ret.creditReceivedAt=ret.updatedAt;
    item.returnStatus=status;if(status==='Returned to Supplier')item.status='Returned';if(status==='Credit Received')item.status='Credit Received';
    timeline(job,status==='Credit Received'?'💷 Return credit received':'🚚 Item returned',`${ret.quantity} x ${label({item,type})}: ${status} — ${ret.destination}.`);
    saveAll();rerender();
  }

  function actionButtons(row,role='Technician'){
    const {job,item,type}=row;const status=itemStatus(item,type);const id=esc(item.id),jid=esc(job.id),name=type==='part'?'Parts':'Tyres';
    let html='';
    if(status==='Ordered'){
      html+=`<button onclick="WAI0922.receive('${jid}','${id}','${type}','${role}','all')">✅ ${name} Delivered</button>`;
      html+=`<button onclick="WAI0922.receive('${jid}','${id}','${type}','${role}','choose')">⚠️ Partially Delivered</button>`;
      html+=`<button onclick="WAI0922.wrongOrder('${jid}','${id}','${type}','${role}')">❌ Wrong Order</button>`;
    }
    if(status==='Partial Delivery'){
      html+=`<button onclick="WAI0922.receive('${jid}','${id}','${type}','${role}','all')">✅ Receive Remaining</button>`;
      html+=`<button onclick="WAI0922.receive('${jid}','${id}','${type}','${role}','choose')">⚠️ Add Partial Delivery</button>`;
      html+=`<button onclick="WAI0922.wrongOrder('${jid}','${id}','${type}','${role}')">❌ Wrong Order</button>`;
    }
    if((type==='part'&&status==='Received')||(type==='tyre'&&status==='Delivered'))html+=`<button onclick="WAI0922.fit('${jid}','${id}','${type}')">🔧 ${name} Fitted</button>`;
    if(qtyReceived(item)-Number(item.returnedQty||0)>0)html+=`<button onclick="WAI0922.returnItem('${jid}','${id}','${type}','${role}')">↩️ Return ${type==='part'?'Part':'Tyre'}</button>`;
    return html;
  }

  function installManagerOrderingCards(){
    const tyre=$('wai081ServiceTyreAlert'),anchor=$('servicePartsAlert');if(!anchor)return;
    let wrap=$('wai0922OrderingGrid');
    if(!wrap){wrap=document.createElement('div');wrap.id='wai0922OrderingGrid';wrap.className='wai0922-order-grid';anchor.insertAdjacentElement('afterend',wrap);}
    let parts=$('wai0922PartsOrdering');
    if(!parts){parts=document.createElement('div');parts.id='wai0922PartsOrdering';parts.className='card service-parts-alert action-centre-v2';}
    // Keep the visual columns consistent: Parts Ordering under Parts (left), Tyre Ordering under Tyres (right).
    if(parts.parentElement!==wrap)wrap.appendChild(parts);
    if(tyre&&tyre.parentElement!==wrap)wrap.appendChild(tyre);
    else if(tyre&&wrap.lastElementChild!==tyre)wrap.appendChild(tyre);
    const rows=allItems().filter(r=>r.type==='part');
    const need=rows.filter(r=>itemStatus(r.item,r.type)==='Requested');
    const awaiting=rows.filter(r=>['Ordered','Partial Delivery'].includes(itemStatus(r.item,r.type)));
    parts.innerHTML=`<h2>📦 Parts Ordering</h2><p class="muted">Open the Parts Centre already focused on parts needing action.</p><div class="stats"><button class="stat wai0922-stat-btn ${need.length?'bad':'good'}" onclick="WAI0922.openParts('need')"><strong>${need.length}</strong>Need Ordering</button><button class="stat wai0922-stat-btn ${awaiting.length?'warn':'good'}" onclick="WAI0922.openParts('awaiting')"><strong>${awaiting.length}</strong>Awaiting Delivery</button></div><div class="wai0922-actions"><button class="primary" onclick="WAI0922.openParts('all')">Open Parts Ordering</button></div>`;
  }
  function openParts(filter){
    try{if(typeof show==='function')show('partsScreen')}catch(e){}
    setTimeout(()=>{
      const requested=$('partsRequestedQueue')?.closest('.card');const ordered=$('partsManagementQueue')?.closest('.card');
      requested?.classList.toggle('wai0922-highlight',filter==='need');ordered?.classList.toggle('wai0922-highlight',filter==='awaiting');
      (filter==='need'?requested:filter==='awaiting'?ordered:$('partsScreen'))?.scrollIntoView({behavior:'smooth',block:'start'});
    },80);
  }

  function renderTechnicianDeliveryAlerts(){
    const el=$('technicianPartsAlert');
    if(!el)return;
    let filter='All';
    try{filter=$('techFilter')?.value||'All'}catch(e){}
    const rows=allItems().filter(row=>{
      const techMatches=filter==='All'||!filter||row.job.technician===filter;
      const status=itemStatus(row.item,row.type);
      const hasPendingReturn=(row.item.returns||[]).some(r=>!['Returned to Supplier','Credit Received'].includes(r.status));
      return techMatches && !hasPendingReturn && ['Ordered','Partial Delivery','Received','Delivered','Wrong Order'].includes(status) && !row.item.fittedAt;
    });
    const current=el.dataset.deliveryFilter||'all';
    const visible=rows.filter(r=>current==='all'||r.type===current);
    el.className='card service-parts-alert'+(rows.length?'':' clear');
    el.innerHTML=`<div class="wai0922-delivery-head"><div><h2>${rows.length?'📦':'✅'} Technician Delivery Alerts <span class="parts-alert-count">${rows.length}</span></h2><p class="muted">Check in parts or tyres without opening the job. Inside-job and outside-job actions update the same record.</p></div><div class="wai0922-filter-row"><button class="${current==='all'?'primary':''}" onclick="WAI0922.setDeliveryFilter('all')">All</button><button class="${current==='part'?'primary':''}" onclick="WAI0922.setDeliveryFilter('part')">Parts</button><button class="${current==='tyre'?'primary':''}" onclick="WAI0922.setDeliveryFilter('tyre')">Tyres</button></div></div>
      <div class="parts-alert-list">${visible.length?visible.map(row=>{
        const {job,item,type}=row,status=itemStatus(row.item,type);
        const ordered=qtyOrdered(item),received=qtyReceived(item),remaining=Math.max(0,ordered-received);
        return `<div class="parts-alert-item"><strong>${type==='part'?'📦 PART':'🛞 TYRE'} — ${esc(job.reg||'No registration')} — ${esc(job.technician||'Unassigned')}</strong><br><span>${esc(label(row))}</span><br><span><strong>Status:</strong> ${esc(status)}${status==='Partial Delivery'?` — ${received} of ${ordered} received, ${remaining} outstanding`:''}</span>${item.supplier||item.orderedFrom?`<br><span><strong>Supplier:</strong> ${esc(item.supplier||item.orderedFrom)}</span>`:''}<div class="parts-actions wai0922-actions">${actionButtons(row,'Technician')}<button onclick="openJob('${esc(job.id)}')">Open Job</button><button onclick="showTimelineModal('${esc(job.id)}')">Timeline</button></div></div>`;
      }).join(''):'<div class="job-card good"><p>No matching delivery alerts for the selected technician.</p></div>'}</div>`;
  }
  function setDeliveryFilter(filter){const el=$('technicianPartsAlert');if(el)el.dataset.deliveryFilter=filter;renderTechnicianDeliveryAlerts();}

  function enhanceOutsideJobCards(){
    // WAI-092.2a: quick delivery actions now live in the combined Technician Delivery Alerts panel.
    renderTechnicianDeliveryAlerts();
  }
  function removeLegacyItemActions(card,type){
    Array.from(card.querySelectorAll('button')).forEach(btn=>{
      const text=(btn.textContent||'').trim().toLowerCase();
      const onclick=btn.getAttribute('onclick')||'';
      const isLegacyFit=type==='part'
        ? (text==='🔧 fitted'||text==='fitted'||/markPartFitted\(/.test(onclick))
        : (text==='🔧 tyres fitted'||text==='tyres fitted'||/markTyresFitted\(/.test(onclick));
      const isLegacyReturn=(type==='part'&&text.includes('return part'))||(type==='tyre'&&text.includes('return tyre'));
      if(isLegacyFit||isLegacyReturn)btn.remove();
    });
    Array.from(card.querySelectorAll('.wai0922-inline')).forEach(x=>x.remove());
  }
  function enhanceInsideJob(){
    let currentId=null;try{currentId=activeJobId}catch(e){} const job=findJob(currentId);if(!job)return;
    const partCards=$('technicianPartsStatus');
    if(partCards){
      const rows=partList(job);
      Array.from(partCards.querySelectorAll('.parts-alert-item,.job-card')).forEach((card,i)=>{
        if(!rows[i])return;removeLegacyItemActions(card,'part');
        const d=document.createElement('div');d.className='wai0922-actions wai0922-inline';d.innerHTML=actionButtons({job,item:rows[i],type:'part'},'Technician');card.appendChild(d);
      });
    }
    const tyreCards=$('wai081TechnicianList');
    if(tyreCards){
      const rows=tyreList(job);
      Array.from(tyreCards.querySelectorAll('.job-card')).forEach((card,i)=>{
        if(!rows[i])return;removeLegacyItemActions(card,'tyre');
        const d=document.createElement('div');d.className='wai0922-actions wai0922-inline';d.innerHTML=actionButtons({job,item:rows[i],type:'tyre'},'Technician');card.appendChild(d);
      });
    }
  }

  function canonicalStatus(job){
    const s=String(job.status||'');
    if(/mot\s*testing/i.test(s)||job.motRecord?.stage==='Testing')return '🧪 MOT Testing';
    return s;
  }
  function fixLiveBoards(){
    if(typeof window.renderStatusBoard!=='function'||window.renderStatusBoard.__wai0922)return;
    const original=window.renderStatusBoard;
    window.renderStatusBoard=function(id){
      const changed=[];listJobs().forEach(j=>{const c=canonicalStatus(j);if(c!==j.status){changed.push([j,j.status]);j.status=c;}});
      try{return original.call(this,id)}finally{changed.forEach(([j,s])=>j.status=s)}
    };window.renderStatusBoard.__wai0922=true;
  }

  function installReturns(){
    const screen=$('partsTyreIntelligenceScreen');if(!screen||$('wai0922Returns'))return;
    const card=document.createElement('div');card.id='wai0922Returns';card.className='card';
    card.innerHTML=`<div class="wai0922-return-head"><div><h2>↩️ Returns Queue</h2><p class="muted">Returns requested by technicians. Mark each item off when it has been returned to the supplier.</p></div><label>Month<input id="wai0922ReturnMonth" type="month" value="${monthISO()}"></label></div><div id="wai0922ReturnStats" class="stats"></div><div id="wai0922ReturnList" class="job-list"></div>`;
    screen.appendChild(card);$('wai0922ReturnMonth').addEventListener('change',renderReturns);
  }
  function returnRows(){const out=[];allItems().forEach(({job,item,type})=>(item.returns||[]).forEach(ret=>out.push({job,item,type,ret})));return out.sort((a,b)=>new Date(b.ret.createdAt)-new Date(a.ret.createdAt));}
  function renderReturns(){
    installReturns();const list=$('wai0922ReturnList'),stats=$('wai0922ReturnStats');if(!list||!stats)return;
    const month=$('wai0922ReturnMonth')?.value||monthISO();const rows=returnRows().filter(r=>String(r.ret.createdAt||'').slice(0,7)===month);
    const awaiting=rows.filter(r=>['Return Requested','Awaiting Collection'].includes(r.ret.status)),returned=rows.filter(r=>r.ret.status==='Returned to Supplier'),credits=rows.filter(r=>r.ret.status==='Credit Received');
    const outstanding=rows.filter(r=>r.ret.status!=='Credit Received').reduce((s,r)=>s+Number(r.ret.value||0),0);
    stats.innerHTML=`<div class="stat"><strong>${rows.length}</strong>Returns This Month</div><div class="stat ${awaiting.length?'warn':'good'}"><strong>${awaiting.length}</strong>Return Requests</div><div class="stat ${returned.length?'warn':'good'}"><strong>${returned.length}</strong>Credit Outstanding</div><div class="stat good"><strong>${credits.length}</strong>Credits Received</div><div class="stat ${outstanding?'warn':'good'}"><strong>${money(outstanding)}</strong>Outstanding Value</div>`;
    list.innerHTML=rows.length?rows.map(({job,item,type,ret})=>`<div class="job-card ${ret.status==='Credit Received'?'good':['Return Requested','Awaiting Collection'].includes(ret.status)?'warn':''}"><h3>${type==='part'?'📦':'🛞'} ${esc(job.reg||'No registration')} — ${esc(label({item,type}))}</h3><p><strong>Quantity:</strong> ${ret.quantity} | <strong>Return to:</strong> ${esc(ret.destination)}</p><p><strong>Reason:</strong> ${esc(ret.reason)} | <strong>Reference:</strong> ${esc(ret.reference||'Not entered')}</p><p><strong>Status:</strong> ${esc(ret.status)} | <strong>Value:</strong> ${money(ret.value)} | <strong>Created:</strong> ${fmt(ret.createdAt)}</p><div class="wai0922-actions">${['Return Requested','Awaiting Collection'].includes(ret.status)?`<button onclick="WAI0922.updateReturn('${esc(job.id)}','${esc(item.id)}','${type}','${esc(ret.id)}','Returned to Supplier')">🚚 Mark Returned</button>`:''}${ret.status==='Returned to Supplier'?`<button onclick="WAI0922.updateReturn('${esc(job.id)}','${esc(item.id)}','${type}','${esc(ret.id)}','Credit Received')">💷 Credit Received</button>`:''}<button onclick="showTimelineModal('${esc(job.id)}')">Timeline</button></div></div>`).join(''):`<div class="job-card good"><p>No returns recorded for ${month}.</p></div>`;
  }

  function pendingReturnRows(){return returnRows().filter(r=>!['Returned to Supplier','Credit Received'].includes(r.ret.status));}
  function openReturnsQueue(){
    try{if(typeof show==='function')show('partsTyreIntelligenceScreen')}catch(e){}
    setTimeout(()=>{$('wai0922Returns')?.scrollIntoView({behavior:'smooth',block:'start'});$('wai0922Returns')?.classList.add('wai0922-highlight');setTimeout(()=>$('wai0922Returns')?.classList.remove('wai0922-highlight'),1800);},100);
  }
  function renderServiceManagerReturnsAlert(){
    const anchor=$('wai0922OrderingGrid')||$('servicePartsAlert');if(!anchor)return;
    let card=$('wai0922ServiceReturnsAlert');
    if(!card){card=document.createElement('div');card.id='wai0922ServiceReturnsAlert';card.className='card service-parts-alert';anchor.insertAdjacentElement('afterend',card);}
    const rows=pendingReturnRows();
    card.classList.toggle('clear',rows.length===0);
    card.innerHTML=`<div class="wai0922-delivery-head"><div><h2>${rows.length?'🔴':'✅'} Returns <span class="parts-alert-count">${rows.length}</span></h2><p class="muted">Parts and tyres requested for return by technicians.</p></div><button class="${rows.length?'danger':'primary'}" onclick="WAI0922.openReturnsQueue()">View Return Items</button></div>${rows.length?`<p><strong>${rows.length}</strong> item${rows.length===1?'':'s'} waiting for Service Manager action.</p>`:'<p>No return items are waiting.</p>'}`;
  }

  // WAI-092.2c: Reports tab is deliberately left unchanged.
  function addReportCard(){const old=$('wai0922MonthlyReturnsReport');if(old)old.remove();}
  function renderReportReturns(){addReportCard();}

  function installStyles(){if($('wai0922Styles'))return;const s=document.createElement('style');s.id='wai0922Styles';s.textContent=`.wai0922-order-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.wai0922-order-grid>.card{margin:0}.wai0922-stat-btn{border:0;text-align:center;cursor:pointer;width:100%;color:inherit}.wai0922-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.wai0922-highlight{outline:4px solid rgba(65,132,255,.35);scroll-margin-top:20px}.wai0922-return-head{display:flex;align-items:end;justify-content:space-between;gap:16px}.wai0922-inline{border-top:1px solid rgba(120,140,160,.22);padding-top:10px}.wai0922-delivery-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.wai0922-filter-row{display:flex;gap:8px;flex-wrap:wrap}@media(max-width:850px){.wai0922-order-grid{grid-template-columns:1fr}.wai0922-return-head,.wai0922-delivery-head{align-items:stretch;flex-direction:column}}`;document.head.appendChild(s)}

  function installPartsOrderSaveFix(){
    const button=$("savePartsOrder");if(!button)return;
    // The main application owns the save handler. Keep only button safety attributes here.
    button.type="button";
  }

  function hookRender(){
    const original=window.render;if(typeof original!=='function'||original.__wai0922)return;
    window.render=function(){const out=original.apply(this,arguments);setTimeout(()=>{installManagerOrderingCards();installPartsOrderSaveFix();renderTechnicianDeliveryAlerts();enhanceInsideJob();renderReturns();renderServiceManagerReturnsAlert();},0);return out};window.render.__wai0922=true;
  }
  function migrate(){allItems().forEach(r=>ensureItem(r.item,r.type));saveAll();}
  function boot(){installStyles();fixLiveBoards();hookRender();migrate();installManagerOrderingCards();installPartsOrderSaveFix();installReturns();addReportCard();renderTechnicianDeliveryAlerts();enhanceInsideJob();renderReturns();renderServiceManagerReturnsAlert();rerender();}

  window.WAI0922={receive,fit:markFitted,wrongOrder,returnItem,updateReturn,openParts,renderReturns,setDeliveryFilter,openReturnsQueue};
  // Replace existing tyre delivery/fitted actions with quantity-aware shared workflow.
  if(window.WAI081){window.WAI081.markTyresDelivered=(j,t,role)=>receive(j,t,'tyre',role||'Technician');window.WAI081.markTyresFitted=(j,t)=>markFitted(j,t,'tyre');}
  // Replace existing parts quick actions with quantity-aware shared workflow.
  window.technicianReceiveParts=(j,p,result)=>receive(j,p,'part','Technician',result==='all'||result==='remaining'?'all':'choose');
  window.serviceManagerReceiveParts=(j,p,result)=>receive(j,p,'part','Service Manager',result==='all'||result==='remaining'?'all':'choose');
  window.markPartFitted=(j,p)=>markFitted(j,p,'part');
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
